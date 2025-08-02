/**
 * Enhanced Secure API Integration Framework
 * 提供完整的 API 整合解決方案，包含安全措施、錯誤處理、重試機制和效能監控
 */

import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError,
  InternalAxiosRequestConfig
} from 'axios';
import axiosRetry from 'axios-retry';
import { apiKeyManager } from './api-key-manager';
import { AuditLogger } from './security-measures';

// 類型定義
export interface EnhancedApiClientConfig {
  keyName: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  enableLogging?: boolean;
  maxConcurrentRequests?: number;
  enableCircuitBreaker?: boolean;
  enableCache?: boolean;
  cacheTTL?: number;
  rateLimit?: {
    requests: number;
    window: number;
  };
  security?: {
    validateCertificates: boolean;
    allowedOrigins: string[];
    enableCSRF: boolean;
  };
}

export interface EnhancedApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  timestamp: number;
  requestId: string;
  duration: number;
  cached: boolean;
  retryCount: number;
}

export interface EnhancedApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
  timestamp: number;
  requestId?: string;
  retryCount: number;
  isTimeout: boolean;
  isNetworkError: boolean;
  originalError?: any;
}

// 斷路器狀態
enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

// 斷路器實現
class CircuitBreaker {
  private state = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 60000, // 1 分鐘
    private successThreshold = 3
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error('斷路器處於開啟狀態，請求被拒絕');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitBreakerState.CLOSED;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      successCount: this.successCount
    };
  }

  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}

// 快取實現
class ApiCache {
  private cache = new Map<string, {
    data: any;
    timestamp: number;
    ttl: number;
    headers: Record<string, string>;
  }>();

  constructor(private maxSize: number = 100) {}

  get(key: string): { data: any; headers: Record<string, string>; cached: boolean } | null {
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
      cached: true
    };
  }

  set(key: string, data: any, headers: Record<string, string>, ttl: number): void {
    // LRU 淘汰策略
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      headers,
      timestamp: Date.now(),
      ttl
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

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// 速率限制器
class RateLimiter {
  private requests = new Map<string, number[]>();

  isAllowed(key: string, limit: number, window: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // 移除超出時間窗口的請求
    const validRequests = requests.filter(time => now - time < window);
    
    if (validRequests.length >= limit) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  reset(key?: string): void {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => now - time < 60000);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

// 請求佇列管理器
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;

  constructor(private maxConcurrent: number = 5) {}

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const requestFn = this.queue.shift()!;
    
    try {
      await requestFn();
    } finally {
      this.running--;
      this.processQueue();
    }
  }

  getStats() {
    return {
      queueSize: this.queue.length,
      running: this.running,
      maxConcurrent: this.maxConcurrent
    };
  }
}

/**
 * 增強型安全 API 客戶端
 */
export class EnhancedApiClient {
  private client: AxiosInstance;
  private config: Required<EnhancedApiClientConfig>;
  private circuitBreaker?: CircuitBreaker;
  private cache?: ApiCache;
  private rateLimiter?: RateLimiter;
  private requestQueue: RequestQueue;
  private requestCount = 0;
  private performanceMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    totalResponseTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  };

  constructor(config: EnhancedApiClientConfig) {
    // 設定預設值
    this.config = {
      timeout: 15000,
      retries: 3,
      retryDelay: 1000,
      enableLogging: false,
      maxConcurrentRequests: 5,
      enableCircuitBreaker: true,
      enableCache: true,
      cacheTTL: 300000, // 5 分鐘
      rateLimit: {
        requests: 60,
        window: 60000
      },
      security: {
        validateCertificates: true,
        allowedOrigins: [],
        enableCSRF: true
      },
      ...config
    } as Required<EnhancedApiClientConfig>;

    // 獲取 API 金鑰配置
    const keyConfig = apiKeyManager.getKey(this.config.keyName);
    if (!keyConfig) {
      throw new Error(`API 金鑰 '${this.config.keyName}' 未找到`);
    }

    // 初始化組件
    if (this.config.enableCircuitBreaker) {
      this.circuitBreaker = new CircuitBreaker();
    }

    if (this.config.enableCache) {
      this.cache = new ApiCache(100);
    }

    if (this.config.rateLimit) {
      this.rateLimiter = new RateLimiter();
    }

    this.requestQueue = new RequestQueue(this.config.maxConcurrentRequests);

    // 創建 Axios 實例
    this.client = this.createAxiosInstance(keyConfig);
    
    // 設定重試機制
    this.setupRetryMechanism();
    
    // 設定攔截器
    this.setupInterceptors();

    // 定期清理
    this.startPeriodicCleanup();
  }

  private createAxiosInstance(keyConfig: any): AxiosInstance {
    const instance = axios.create({
      baseURL: keyConfig.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${keyConfig.key}`,
        'User-Agent': 'Astro-Clinical-Platform/1.0',
        'X-Client-Version': '1.0.0',
        'X-Request-Source': 'astro-clinical-platform'
      },
      withCredentials: false,
      maxRedirects: 3,
      validateStatus: (status) => status < 500
    });

    return instance;
  }

  private setupRetryMechanism(): void {
    axiosRetry(this.client, {
      retries: this.config.retries,
      retryDelay: (retryCount, error) => {
        const delay = Math.min(
          this.config.retryDelay * Math.pow(2, retryCount - 1),
          30000
        );
        
        if (this.config.enableLogging) {
          console.log(`API 重試 ${retryCount}/${this.config.retries}, 延遲 ${delay}ms`);
        }
        
        return delay;
      },
      retryCondition: (error: AxiosError) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               error.response?.status === 429 ||
               (error.response?.status ? error.response.status >= 500 : false);
      },
      onRetry: (retryCount, error, requestConfig) => {
        if (this.config.enableLogging) {
          console.warn(`API 請求重試 ${retryCount}: ${error.message}`);
        }
        
        AuditLogger.logSecurityEvent(
          'api_request_retry',
          requestConfig as any,
          false,
          {
            keyName: this.config.keyName,
            retryCount,
            error: error.message,
            url: requestConfig.url
          },
          'medium'
        );
      }
    });
  }

  private setupInterceptors(): void {
    // 請求攔截器
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const requestId = this.generateRequestId();
        const startTime = Date.now();
        
        config.headers['X-Request-ID'] = requestId;
        (config as any).metadata = { startTime, requestId };

        // 檢查速率限制
        if (this.rateLimiter && !this.rateLimiter.isAllowed(
          `${this.config.keyName}:${config.url}`,
          this.config.rateLimit.requests,
          this.config.rateLimit.window
        )) {
          throw new Error('速率限制超出');
        }

        // 獲取新的 API 金鑰
        const apiKey = apiKeyManager.getKeyForRequest(this.config.keyName, config.url);
        if (!apiKey) {
          throw new Error(`API 金鑰 '${this.config.keyName}' 不可用`);
        }

        config.headers['Authorization'] = `Bearer ${apiKey}`;

        // 添加 CSRF 令牌
        if (this.config.security.enableCSRF && typeof window !== 'undefined') {
          const csrfToken = this.getCSRFToken();
          if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
          }
        }

        if (this.config.enableLogging) {
          console.log(`API 請求 [${requestId}]: ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error) => {
        return Promise.reject(this.formatError(error));
      }
    );

    // 回應攔截器
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        const requestId = response.config.headers['X-Request-ID'] as string;
        const startTime = (response.config as any).metadata?.startTime || Date.now();
        const duration = Date.now() - startTime;

        this.updatePerformanceMetrics(duration, true);

        if (this.config.enableLogging) {
          console.log(`API 回應 [${requestId}]: ${response.status} (${duration}ms)`);
        }

        return {
          ...response,
          timestamp: Date.now(),
          requestId,
          duration,
          cached: false,
          retryCount: (response.config as any).__retryCount || 0
        };
      },
      (error: AxiosError) => {
        const requestId = error.config?.headers?.['X-Request-ID'] as string;
        const startTime = (error.config as any)?.metadata?.startTime || Date.now();
        const duration = Date.now() - startTime;

        this.updatePerformanceMetrics(duration, false);

        if (this.config.enableLogging) {
          console.error(`API 錯誤 [${requestId}]:`, error.message);
        }

        // 處理特定錯誤
        this.handleSpecificErrors(error, requestId);

        return Promise.reject(this.formatError(error, requestId));
      }
    );
  }

  private handleSpecificErrors(error: AxiosError, requestId: string): void {
    if (error.response?.status === 401) {
      AuditLogger.logSecurityEvent(
        'api_unauthorized',
        error.config as any,
        false,
        {
          keyName: this.config.keyName,
          status: error.response.status,
          requestId
        },
        'high'
      );
    } else if (error.response?.status === 429) {
      AuditLogger.logSecurityEvent(
        'api_rate_limited',
        error.config as any,
        false,
        {
          keyName: this.config.keyName,
          requestId
        },
        'medium'
      );
    }
  }

  private updatePerformanceMetrics(duration: number, success: boolean): void {
    this.performanceMetrics.totalRequests++;
    this.performanceMetrics.totalResponseTime += duration;
    
    if (success) {
      this.performanceMetrics.successfulRequests++;
    } else {
      this.performanceMetrics.failedRequests++;
    }
    
    this.performanceMetrics.averageResponseTime = 
      this.performanceMetrics.totalResponseTime / this.performanceMetrics.totalRequests;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatError(error: any, requestId?: string): EnhancedApiError {
    const apiError: EnhancedApiError = {
      message: error.message || '未知錯誤',
      timestamp: Date.now(),
      requestId,
      retryCount: (error.config as any)?.__retryCount || 0,
      isTimeout: error.code === 'ECONNABORTED' || error.message?.includes('timeout'),
      isNetworkError: !error.response && !!error.request,
      originalError: error
    };

    if (error.response) {
      apiError.status = error.response.status;
      apiError.code = error.response.data?.code || error.code;
      apiError.details = error.response.data;
    } else if (error.request) {
      apiError.code = 'NETWORK_ERROR';
      apiError.message = '網路連線錯誤';
    } else {
      apiError.code = 'REQUEST_ERROR';
    }

    return apiError;
  }

  private getCSRFToken(): string | null {
    if (typeof document === 'undefined') return null;
    
    const tokenInput = document.querySelector('input[name="_csrf_token"]') as HTMLInputElement;
    if (tokenInput) return tokenInput.value;
    
    const metaToken = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    if (metaToken) return metaToken.content;
    
    return null;
  }

  private generateCacheKey(method: string, url: string, data?: any): string {
    const baseKey = `${method}:${url}`;
    if (data && method !== 'GET') {
      const dataHash = JSON.stringify(data);
      return `${baseKey}:${btoa(dataHash).substring(0, 16)}`;
    }
    return baseKey;
  }

  private getCachedResponse(method: string, url: string, data?: any): any | null {
    if (!this.cache || method !== 'GET') return null;
    
    const cacheKey = this.generateCacheKey(method, url, data);
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      this.performanceMetrics.cacheHits++;
      return cached;
    } else {
      this.performanceMetrics.cacheMisses++;
      return null;
    }
  }

  private setCachedResponse(method: string, url: string, response: any, data?: any): void {
    if (!this.cache || method !== 'GET' || response.status < 200 || response.status >= 300) {
      return;
    }
    
    const cacheKey = this.generateCacheKey(method, url, data);
    this.cache.set(cacheKey, response.data, response.headers, this.config.cacheTTL);
  }

  private async executeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return this.requestQueue.add(async () => {
      if (this.circuitBreaker) {
        return this.circuitBreaker.execute(requestFn);
      }
      return requestFn();
    });
  }

  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.cache?.cleanup();
      this.rateLimiter?.cleanup();
    }, 60000); // 每分鐘清理一次
  }

  // 公開方法
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<EnhancedApiResponse<T>> {
    this.requestCount++;
    
    // 檢查快取
    const cached = this.getCachedResponse('GET', url);
    if (cached) {
      return {
        ...cached,
        timestamp: Date.now(),
        requestId: this.generateRequestId(),
        duration: 0,
        cached: true,
        retryCount: 0
      };
    }

    const response = await this.executeRequest(() => this.client.get(url, config));
    
    // 設定快取
    this.setCachedResponse('GET', url, response);
    
    return response;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<EnhancedApiResponse<T>> {
    this.requestCount++;
    return this.executeRequest(() => this.client.post(url, data, config));
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<EnhancedApiResponse<T>> {
    this.requestCount++;
    return this.executeRequest(() => this.client.put(url, data, config));
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<EnhancedApiResponse<T>> {
    this.requestCount++;
    return this.executeRequest(() => this.client.patch(url, data, config));
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<EnhancedApiResponse<T>> {
    this.requestCount++;
    return this.executeRequest(() => this.client.delete(url, config));
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health', { timeout: 5000 });
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      if (this.config.enableLogging) {
        console.warn('API 健康檢查失敗:', error);
      }
      return false;
    }
  }

  // 統計和管理方法
  getStats() {
    return {
      keyName: this.config.keyName,
      totalRequests: this.requestCount,
      keyUsage: apiKeyManager.getKeyUsage(this.config.keyName),
      performanceMetrics: {
        ...this.performanceMetrics,
        successRate: this.performanceMetrics.totalRequests > 0 
          ? (this.performanceMetrics.successfulRequests / this.performanceMetrics.totalRequests) * 100 
          : 0,
        errorRate: this.performanceMetrics.totalRequests > 0 
          ? (this.performanceMetrics.failedRequests / this.performanceMetrics.totalRequests) * 100 
          : 0,
        cacheHitRate: (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) > 0
          ? (this.performanceMetrics.cacheHits / (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses)) * 100
          : 0
      },
      circuitBreakerStats: this.circuitBreaker?.getStats(),
      queueStats: this.requestQueue.getStats(),
      cacheSize: this.cache?.size() || 0
    };
  }

  clearCache(): void {
    this.cache?.clear();
  }

  resetCircuitBreaker(): void {
    this.circuitBreaker?.reset();
  }

  resetRateLimit(): void {
    this.rateLimiter?.reset();
  }

  resetStats(): void {
    this.requestCount = 0;
    this.performanceMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  destroy(): void {
    this.client.interceptors.request.clear();
    this.client.interceptors.response.clear();
    this.cache?.clear();
    
    if (this.config.enableLogging) {
      console.log('增強型 API 客戶端已清理');
    }
  }
}

// 工廠函數
export function createEnhancedMedicalApiClient(): EnhancedApiClient {
  return new EnhancedApiClient({
    keyName: 'medical-api',
    timeout: 20000,
    retries: 3,
    retryDelay: 2000,
    enableLogging: process.env.NODE_ENV === 'development',
    maxConcurrentRequests: 3,
    enableCircuitBreaker: true,
    enableCache: true,
    cacheTTL: 600000, // 10 分鐘
    rateLimit: {
      requests: 30,
      window: 60000
    },
    security: {
      validateCertificates: true,
      allowedOrigins: [],
      enableCSRF: true
    }
  });
}

export function createEnhancedDrugApiClient(): EnhancedApiClient {
  return new EnhancedApiClient({
    keyName: 'drug-api',
    timeout: 15000,
    retries: 2,
    retryDelay: 1500,
    enableLogging: process.env.NODE_ENV === 'development',
    maxConcurrentRequests: 5,
    enableCircuitBreaker: true,
    enableCache: true,
    cacheTTL: 300000, // 5 分鐘
    rateLimit: {
      requests: 60,
      window: 60000
    }
  });
}

// 錯誤處理工具
export const isEnhancedApiError = (error: any): error is EnhancedApiError => {
  return error && typeof error === 'object' && 'timestamp' in error && 'isTimeout' in error;
};

export const getEnhancedErrorMessage = (error: any): string => {
  if (isEnhancedApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '未知錯誤';
};