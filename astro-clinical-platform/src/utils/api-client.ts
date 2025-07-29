/**
 * Secure API Integration Framework
 * Provides robust HTTP client with error handling, retry logic, caching, and security features
 */

import { SecurityMiddleware, AuditLogger } from './security-measures';

// Types for API client
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  maxRetryDelay?: number;
  retryFactor?: number;
  headers?: Record<string, string>;
  apiKey?: string;
  rateLimit?: {
    requests: number;
    window: number; // in milliseconds
  };
  cache?: {
    enabled: boolean;
    ttl: number; // in milliseconds
    maxSize: number;
  };
  security?: {
    validateCertificates: boolean;
    allowedOrigins: string[];
    csrfProtection: boolean;
  };
}

export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  cache?: boolean | number; // boolean or TTL in ms
  validateResponse?: (response: any) => boolean;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  cached: boolean;
  requestId: string;
  timing: {
    start: number;
    end: number;
    duration: number;
  };
}

export interface ApiError extends Error {
  status?: number;
  statusText?: string;
  response?: any;
  requestId: string;
  retryCount: number;
  isTimeout: boolean;
  isNetworkError: boolean;
}

// Cache implementation
class ApiCache {
  private cache = new Map<string, {
    data: any;
    timestamp: number;
    ttl: number;
    headers: Record<string, string>;
  }>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return {
      data: entry.data,
      headers: entry.headers,
      cached: true,
    };
  }

  set(key: string, data: any, headers: Record<string, string>, ttl: number): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      headers,
      timestamp: Date.now(),
      ttl,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Rate limiter implementation
class RateLimiter {
  private requests = new Map<string, number[]>();

  isAllowed(key: string, limit: number, window: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < window);
    
    if (validRequests.length >= limit) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => now - time < 60000); // Keep last minute
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

/**
 * Secure API Client with comprehensive error handling and retry logic
 */
export class SecureApiClient {
  private config: Required<ApiClientConfig>;
  private cache: ApiCache;
  private rateLimiter: RateLimiter;
  private requestCounter = 0;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      maxRetryDelay: 10000,
      retryFactor: 2,
      headers: {},
      rateLimit: {
        requests: 100,
        window: 60000, // 1 minute
      },
      cache: {
        enabled: true,
        ttl: 300000, // 5 minutes
        maxSize: 100,
      },
      security: {
        validateCertificates: true,
        allowedOrigins: [],
        csrfProtection: true,
      },
      ...config,
    };

    this.cache = new ApiCache(this.config.cache.maxSize);
    this.rateLimiter = new RateLimiter();

    // Setup periodic cleanup
    setInterval(() => {
      this.cache.cleanup();
      this.rateLimiter.cleanup();
    }, 60000); // Every minute
  }

  /**
   * Make an API request with full error handling and retry logic
   */
  async request<T = any>(request: ApiRequest): Promise<ApiResponse<T>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      // Validate request
      this.validateRequest(request);

      // Check rate limiting
      if (!this.checkRateLimit(request.endpoint)) {
        throw this.createApiError('Rate limit exceeded', 429, requestId, 0);
      }

      // Check cache first
      if (this.shouldUseCache(request)) {
        const cached = this.getCachedResponse(request);
        if (cached) {
          return {
            ...cached,
            requestId,
            timing: {
              start: startTime,
              end: Date.now(),
              duration: Date.now() - startTime,
            },
          };
        }
      }

      // Execute request with retry logic
      const response = await this.executeWithRetry(request, requestId);

      // Cache successful responses
      if (this.shouldCacheResponse(request, response)) {
        this.cacheResponse(request, response);
      }

      // Log successful request
      this.logRequest(request, response, requestId, true);

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        cached: false,
        requestId,
        timing: {
          start: startTime,
          end: Date.now(),
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      // Log failed request
      this.logRequest(request, null, requestId, false, error);
      throw error;
    }
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry(
    request: ApiRequest,
    requestId: string,
    attempt: number = 1
  ): Promise<any> {
    try {
      return await this.executeRequest(request, requestId);
    } catch (error) {
      const apiError = error as ApiError;
      const maxRetries = request.retries ?? this.config.retries;

      if (attempt <= maxRetries && this.shouldRetry(apiError)) {
        const delay = this.calculateRetryDelay(attempt);
        
        // Log retry attempt
        AuditLogger.logSecurityEvent(
          'api_request_retry',
          { request: { url: request.endpoint } } as any,
          false,
          {
            requestId,
            attempt,
            error: apiError.message,
            delay,
          },
          'medium'
        );

        await this.sleep(delay);
        return this.executeWithRetry(request, requestId, attempt + 1);
      }

      apiError.retryCount = attempt - 1;
      throw apiError;
    }
  }

  /**
   * Execute the actual HTTP request
   */
  private async executeRequest(request: ApiRequest, requestId: string): Promise<any> {
    const url = new URL(request.endpoint, this.config.baseURL);
    const timeout = request.timeout ?? this.config.timeout;

    // Validate origin if security is enabled
    if (this.config.security.allowedOrigins.length > 0) {
      if (!this.config.security.allowedOrigins.includes(url.origin)) {
        throw this.createApiError(
          `Origin ${url.origin} not allowed`,
          403,
          requestId,
          0
        );
      }
    }

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Astro-Clinical-Platform/1.0',
      'X-Request-ID': requestId,
      ...this.config.headers,
      ...request.headers,
    };

    // Add API key if configured
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    // Add CSRF token if enabled
    if (this.config.security.csrfProtection && typeof window !== 'undefined') {
      const csrfToken = this.getCSRFToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const fetchOptions: RequestInit = {
        method: request.method,
        headers,
        signal: controller.signal,
      };

      // Add body for non-GET requests
      if (request.data && request.method !== 'GET') {
        fetchOptions.body = JSON.stringify(request.data);
      }

      const response = await fetch(url.toString(), fetchOptions);
      clearTimeout(timeoutId);

      // Check for HTTP errors
      if (!response.ok) {
        const errorData = await this.safeParseResponse(response);
        throw this.createApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          requestId,
          0,
          errorData
        );
      }

      // Parse response
      const data = await this.safeParseResponse(response);

      // Validate response if validator provided
      if (request.validateResponse && !request.validateResponse(data)) {
        throw this.createApiError(
          'Response validation failed',
          422,
          requestId,
          0,
          data
        );
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: this.parseHeaders(response.headers),
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw this.createApiError('Request timeout', 408, requestId, 0, null, true);
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw this.createApiError(
          'Network error',
          0,
          requestId,
          0,
          null,
          false,
          true
        );
      }

      throw error;
    }
  }

  /**
   * Safely parse response body
   */
  private async safeParseResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type') || '';
    
    try {
      if (contentType.includes('application/json')) {
        return await response.json();
      } else if (contentType.includes('text/')) {
        return await response.text();
      } else {
        return await response.blob();
      }
    } catch (error) {
      console.warn('Failed to parse response body:', error);
      return null;
    }
  }

  /**
   * Parse response headers into object
   */
  private parseHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(error: ApiError): boolean {
    // Don't retry client errors (4xx) except for specific cases
    if (error.status && error.status >= 400 && error.status < 500) {
      return [408, 429].includes(error.status); // Timeout and rate limit
    }

    // Retry server errors (5xx)
    if (error.status && error.status >= 500) {
      return true;
    }

    // Retry network errors and timeouts
    if (error.isNetworkError || error.isTimeout) {
      return true;
    }

    return false;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = this.config.retryDelay;
    const factor = this.config.retryFactor;
    const maxDelay = this.config.maxRetryDelay;
    
    const delay = baseDelay * Math.pow(factor, attempt - 1);
    return Math.min(delay, maxDelay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(endpoint: string): boolean {
    const key = `${this.config.baseURL}:${endpoint}`;
    return this.rateLimiter.isAllowed(
      key,
      this.config.rateLimit.requests,
      this.config.rateLimit.window
    );
  }

  /**
   * Check if response should be cached
   */
  private shouldUseCache(request: ApiRequest): boolean {
    return (
      this.config.cache.enabled &&
      request.method === 'GET' &&
      request.cache !== false
    );
  }

  /**
   * Get cached response
   */
  private getCachedResponse(request: ApiRequest): any | null {
    if (!this.shouldUseCache(request)) return null;
    
    const cacheKey = this.generateCacheKey(request);
    return this.cache.get(cacheKey);
  }

  /**
   * Check if response should be cached
   */
  private shouldCacheResponse(request: ApiRequest, response: any): boolean {
    return (
      this.shouldUseCache(request) &&
      response.status >= 200 &&
      response.status < 300
    );
  }

  /**
   * Cache successful response
   */
  private cacheResponse(request: ApiRequest, response: any): void {
    const cacheKey = this.generateCacheKey(request);
    const ttl = typeof request.cache === 'number' ? request.cache : this.config.cache.ttl;
    
    this.cache.set(cacheKey, response.data, response.headers, ttl);
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: ApiRequest): string {
    const url = new URL(request.endpoint, this.config.baseURL);
    return `${request.method}:${url.toString()}`;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestCounter}`;
  }

  /**
   * Validate request parameters
   */
  private validateRequest(request: ApiRequest): void {
    if (!request.endpoint) {
      throw new Error('Request endpoint is required');
    }

    if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      throw new Error(`Invalid HTTP method: ${request.method}`);
    }

    // Validate URL
    try {
      new URL(request.endpoint, this.config.baseURL);
    } catch (error) {
      throw new Error(`Invalid endpoint URL: ${request.endpoint}`);
    }
  }

  /**
   * Create standardized API error
   */
  private createApiError(
    message: string,
    status: number,
    requestId: string,
    retryCount: number,
    response?: any,
    isTimeout: boolean = false,
    isNetworkError: boolean = false
  ): ApiError {
    const error = new Error(message) as ApiError;
    error.name = 'ApiError';
    error.status = status;
    error.response = response;
    error.requestId = requestId;
    error.retryCount = retryCount;
    error.isTimeout = isTimeout;
    error.isNetworkError = isNetworkError;
    return error;
  }

  /**
   * Get CSRF token from page
   */
  private getCSRFToken(): string | null {
    if (typeof document === 'undefined') return null;
    
    const tokenInput = document.querySelector('input[name="_csrf_token"]') as HTMLInputElement;
    if (tokenInput) return tokenInput.value;
    
    const metaToken = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    if (metaToken) return metaToken.content;
    
    return null;
  }

  /**
   * Log request for audit purposes
   */
  private logRequest(
    request: ApiRequest,
    response: any,
    requestId: string,
    success: boolean,
    error?: any
  ): void {
    const logData = {
      requestId,
      method: request.method,
      endpoint: request.endpoint,
      status: response?.status,
      cached: response?.cached || false,
      error: error?.message,
    };

    if (success) {
      AuditLogger.logSecurityEvent(
        'api_request_success',
        { request: { url: request.endpoint } } as any,
        true,
        logData,
        'low'
      );
    } else {
      AuditLogger.logSecurityEvent(
        'api_request_failure',
        { request: { url: request.endpoint } } as any,
        false,
        logData,
        'medium'
      );
    }
  }

  /**
   * Get client statistics
   */
  getStats(): {
    cacheSize: number;
    cacheHitRate: number;
    totalRequests: number;
  } {
    return {
      cacheSize: this.cache.size(),
      cacheHitRate: 0, // Would need to track hits/misses
      totalRequests: this.requestCounter,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Reset rate limiter
   */
  resetRateLimit(endpoint?: string): void {
    if (endpoint) {
      const key = `${this.config.baseURL}:${endpoint}`;
      this.rateLimiter.reset(key);
    } else {
      this.rateLimiter = new RateLimiter();
    }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ApiClientConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

/**
 * API Client Factory for creating configured clients
 */
export class ApiClientFactory {
  private static clients = new Map<string, SecureApiClient>();

  /**
   * Create or get existing API client
   */
  static getClient(name: string, config?: ApiClientConfig): SecureApiClient {
    if (!this.clients.has(name) && config) {
      this.clients.set(name, new SecureApiClient(config));
    }

    const client = this.clients.get(name);
    if (!client) {
      throw new Error(`API client '${name}' not found. Create it first with config.`);
    }

    return client;
  }

  /**
   * Create medical API client with default configuration
   */
  static createMedicalApiClient(baseURL: string, apiKey?: string): SecureApiClient {
    return new SecureApiClient({
      baseURL,
      apiKey,
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      maxRetryDelay: 10000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      rateLimit: {
        requests: 60, // Conservative for medical APIs
        window: 60000,
      },
      cache: {
        enabled: true,
        ttl: 300000, // 5 minutes
        maxSize: 50,
      },
      security: {
        validateCertificates: true,
        allowedOrigins: [new URL(baseURL).origin],
        csrfProtection: true,
      },
    });
  }

  /**
   * Remove client from factory
   */
  static removeClient(name: string): void {
    this.clients.delete(name);
  }

  /**
   * Get all client names
   */
  static getClientNames(): string[] {
    return Array.from(this.clients.keys());
  }
}

// Export default medical API client instance
export const medicalApiClient = ApiClientFactory.createMedicalApiClient(
  process.env.MEDICAL_API_BASE_URL || 'https://api.medical-platform.com',
  process.env.MEDICAL_API_KEY
);