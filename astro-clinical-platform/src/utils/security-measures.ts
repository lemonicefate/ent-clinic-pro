/**
 * Security measures for Astro Clinical Platform
 * Implements rate limiting, CSRF protection, secure error handling, and audit logging
 */

import type { APIContext } from 'astro';

// Types for security measures
export interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  blockDuration: number;
}

export interface SecurityEvent {
  timestamp: Date;
  event: string;
  userId?: string;
  ip: string;
  userAgent?: string;
  success: boolean;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface CSRFTokenData {
  token: string;
  timestamp: number;
  sessionId: string;
}

/**
 * Rate Limiter for authentication attempts and API calls
 * Implements sliding window rate limiting with progressive penalties
 */
export class RateLimiter {
  private static attempts: Map<string, { count: number; firstAttempt: number; blocked: boolean; blockUntil?: number }> = new Map();
  
  // Default configurations for different endpoints
  private static configs: Record<string, RateLimitConfig> = {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxAttempts: 5,
      blockDuration: 30 * 60 * 1000, // 30 minutes
    },
    api: {
      windowMs: 60 * 1000, // 1 minute
      maxAttempts: 100,
      blockDuration: 5 * 60 * 1000, // 5 minutes
    },
    password_reset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxAttempts: 3,
      blockDuration: 60 * 60 * 1000, // 1 hour
    },
  };

  /**
   * Check if request should be rate limited
   */
  static isRateLimited(identifier: string, type: string = 'api'): boolean {
    const config = this.configs[type] || this.configs.api;
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record) {
      return false;
    }

    // Check if currently blocked
    if (record.blocked && record.blockUntil && now < record.blockUntil) {
      return true;
    }

    // Reset if window has passed
    if (now - record.firstAttempt > config.windowMs) {
      this.attempts.delete(identifier);
      return false;
    }

    // Check if exceeded max attempts
    return record.count >= config.maxAttempts;
  }

  /**
   * Record an attempt (successful or failed)
   */
  static recordAttempt(identifier: string, success: boolean, type: string = 'api'): void {
    const config = this.configs[type] || this.configs.api;
    const now = Date.now();
    const record = this.attempts.get(identifier) || {
      count: 0,
      firstAttempt: now,
      blocked: false,
    };

    // Reset if window has passed
    if (now - record.firstAttempt > config.windowMs) {
      record.count = 0;
      record.firstAttempt = now;
      record.blocked = false;
      delete record.blockUntil;
    }

    // Only count failed attempts for rate limiting
    if (!success) {
      record.count++;
      
      // Block if exceeded max attempts
      if (record.count >= config.maxAttempts) {
        record.blocked = true;
        record.blockUntil = now + config.blockDuration;
      }
    } else {
      // Successful attempt - reduce count slightly to allow recovery
      record.count = Math.max(0, record.count - 1);
    }

    this.attempts.set(identifier, record);
  }

  /**
   * Get rate limit status for identifier
   */
  static getStatus(identifier: string, type: string = 'api'): {
    isLimited: boolean;
    remainingAttempts: number;
    resetTime?: number;
    blockUntil?: number;
  } {
    const config = this.configs[type] || this.configs.api;
    const record = this.attempts.get(identifier);
    
    if (!record) {
      return {
        isLimited: false,
        remainingAttempts: config.maxAttempts,
      };
    }

    const now = Date.now();
    const isLimited = this.isRateLimited(identifier, type);
    
    return {
      isLimited,
      remainingAttempts: Math.max(0, config.maxAttempts - record.count),
      resetTime: record.firstAttempt + config.windowMs,
      blockUntil: record.blockUntil,
    };
  }

  /**
   * Reset rate limit for identifier (admin function)
   */
  static reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Clean up old entries (should be called periodically)
   */
  static cleanup(): void {
    const now = Date.now();
    const maxAge = Math.max(...Object.values(this.configs).map(c => c.windowMs + c.blockDuration));
    
    for (const [identifier, record] of this.attempts.entries()) {
      if (now - record.firstAttempt > maxAge) {
        this.attempts.delete(identifier);
      }
    }
  }
}

/**
 * CSRF Protection
 * Generates and validates CSRF tokens for form submissions
 */
export class CSRFProtection {
  private static tokens: Map<string, CSRFTokenData> = new Map();
  private static readonly TOKEN_LIFETIME = 60 * 60 * 1000; // 1 hour
  private static readonly SECRET = process.env.CSRF_SECRET || 'csrf-secret-change-in-production';

  /**
   * Generate CSRF token for session
   */
  static generateToken(sessionId: string): string {
    const token = this.createSecureToken();
    const tokenData: CSRFTokenData = {
      token,
      timestamp: Date.now(),
      sessionId,
    };
    
    this.tokens.set(token, tokenData);
    this.cleanup(); // Clean old tokens
    
    return token;
  }

  /**
   * Validate CSRF token
   */
  static validateToken(token: string, sessionId: string): boolean {
    const tokenData = this.tokens.get(token);
    
    if (!tokenData) {
      return false;
    }

    // Check if token is expired
    if (Date.now() - tokenData.timestamp > this.TOKEN_LIFETIME) {
      this.tokens.delete(token);
      return false;
    }

    // Check if session matches
    if (tokenData.sessionId !== sessionId) {
      return false;
    }

    return true;
  }

  /**
   * Remove used token (one-time use)
   */
  static consumeToken(token: string): void {
    this.tokens.delete(token);
  }

  /**
   * Create secure random token
   */
  private static createSecureToken(): string {
    const array = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      // Fallback for environments without crypto.getRandomValues
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Clean up expired tokens
   */
  private static cleanup(): void {
    const now = Date.now();
    for (const [token, data] of this.tokens.entries()) {
      if (now - data.timestamp > this.TOKEN_LIFETIME) {
        this.tokens.delete(token);
      }
    }
  }

  /**
   * Get CSRF token from request headers or body
   */
  static extractTokenFromRequest(request: Request): string | null {
    // Try header first
    const headerToken = request.headers.get('X-CSRF-Token');
    if (headerToken) {
      return headerToken;
    }

    // Try form data (for form submissions)
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      // This would need to be handled in the actual endpoint
      // as we can't read the body multiple times
      return null;
    }

    return null;
  }
}

/**
 * Secure Error Handler
 * Prevents information leakage through error messages
 */
export class SecureErrorHandler {
  private static readonly GENERIC_MESSAGES = {
    auth: '認證失敗，請檢查您的憑證',
    validation: '輸入資料格式不正確',
    permission: '您沒有權限執行此操作',
    rate_limit: '請求過於頻繁，請稍後再試',
    general: '系統暫時無法處理您的請求，請稍後再試',
  };

  /**
   * Create secure error response
   */
  static createErrorResponse(
    error: string | Error,
    status: number = 500,
    type: keyof typeof SecureErrorHandler.GENERIC_MESSAGES = 'general'
  ): Response {
    // Log the actual error for debugging (server-side only)
    if (error instanceof Error) {
      console.error('Security Error:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    }

    // Return generic message to client
    const genericMessage = this.GENERIC_MESSAGES[type];
    
    return new Response(
      JSON.stringify({
        success: false,
        message: genericMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        status,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        },
      }
    );
  }

  /**
   * Sanitize error message for client
   */
  static sanitizeErrorMessage(error: string | Error, type: keyof typeof SecureErrorHandler.GENERIC_MESSAGES = 'general'): string {
    // Always return generic message to prevent information leakage
    return this.GENERIC_MESSAGES[type];
  }

  /**
   * Check if error should be logged as security event
   */
  static isSecurityRelevant(error: Error): boolean {
    const securityKeywords = [
      'authentication',
      'authorization',
      'permission',
      'token',
      'csrf',
      'rate limit',
      'injection',
      'xss',
      'unauthorized',
    ];

    const errorMessage = error.message.toLowerCase();
    return securityKeywords.some(keyword => errorMessage.includes(keyword));
  }
}

/**
 * Audit Logger
 * Logs security events for monitoring and compliance
 */
export class AuditLogger {
  private static events: SecurityEvent[] = [];
  private static readonly MAX_EVENTS = 10000; // Keep last 10k events in memory
  
  /**
   * Log authentication attempt
   */
  static logAuthAttempt(
    email: string,
    success: boolean,
    context: APIContext,
    details?: string
  ): void {
    this.logSecurityEvent(
      success ? 'auth_success' : 'auth_failure',
      context,
      success,
      { email, details },
      success ? 'low' : 'medium'
    );
  }

  /**
   * Log security event
   */
  static logSecurityEvent(
    event: string,
    context: APIContext,
    success: boolean,
    details?: Record<string, any>,
    severity: SecurityEvent['severity'] = 'medium'
  ): void {
    // Skip logging during prerendering if context is not available
    if (!context.clientAddress && !context.request) {
      return;
    }

    // Skip logging if clientAddress is not available (during prerendering)
    let clientIP = 'unknown';
    try {
      clientIP = context.clientAddress || 'unknown';
    } catch (error) {
      // clientAddress might throw during prerendering, skip logging
      return;
    }

    const securityEvent: SecurityEvent = {
      timestamp: new Date(),
      event,
      ip: clientIP,
      userAgent: context.request?.headers.get('user-agent') || undefined,
      success,
      details,
      severity,
    };

    // Add user ID if available from context
    const authHeader = context.request?.headers.get('authorization');
    if (authHeader) {
      // Extract user ID from JWT token (simplified)
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        securityEvent.userId = payload.id;
      } catch (error) {
        // Ignore JWT parsing errors
      }
    }

    this.events.push(securityEvent);

    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Log to console for development (in production, send to logging service)
    console.log('Security Event:', {
      event: securityEvent.event,
      success: securityEvent.success,
      severity: securityEvent.severity,
      ip: securityEvent.ip,
      timestamp: securityEvent.timestamp.toISOString(),
      details: securityEvent.details,
    });

    // Alert on critical events
    if (severity === 'critical') {
      this.alertCriticalEvent(securityEvent);
    }
  }

  /**
   * Get recent security events (admin function)
   */
  static getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.events.slice(-limit).reverse();
  }

  /**
   * Get events by type
   */
  static getEventsByType(eventType: string, limit: number = 100): SecurityEvent[] {
    return this.events
      .filter(event => event.event === eventType)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get failed authentication attempts
   */
  static getFailedAuthAttempts(timeWindow: number = 60 * 60 * 1000): SecurityEvent[] {
    const cutoff = new Date(Date.now() - timeWindow);
    return this.events.filter(
      event => event.event === 'auth_failure' && event.timestamp > cutoff
    );
  }

  /**
   * Alert on critical security events
   */
  private static alertCriticalEvent(event: SecurityEvent): void {
    // In production, this would send alerts to security team
    console.error('CRITICAL SECURITY EVENT:', {
      event: event.event,
      ip: event.ip,
      timestamp: event.timestamp.toISOString(),
      details: event.details,
    });

    // Could integrate with:
    // - Email alerts
    // - Slack notifications
    // - Security monitoring systems
    // - Incident response systems
  }

  /**
   * Export events for external analysis
   */
  static exportEvents(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'event', 'userId', 'ip', 'success', 'severity', 'details'];
      const rows = this.events.map(event => [
        event.timestamp.toISOString(),
        event.event,
        event.userId || '',
        event.ip,
        event.success.toString(),
        event.severity,
        JSON.stringify(event.details || {}),
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(this.events, null, 2);
  }

  /**
   * Clear old events (maintenance function)
   */
  static clearOldEvents(olderThan: number = 30 * 24 * 60 * 60 * 1000): void {
    const cutoff = new Date(Date.now() - olderThan);
    this.events = this.events.filter(event => event.timestamp > cutoff);
  }
}

/**
 * Security middleware for API routes
 */
export class SecurityMiddleware {
  /**
   * Apply rate limiting to request
   */
  static async applyRateLimit(
    context: APIContext,
    type: string = 'api'
  ): Promise<Response | null> {
    // Skip rate limiting if clientAddress is not available (during prerendering)
    let clientIP: string;
    try {
      clientIP = context.clientAddress;
      if (!clientIP) {
        return null;
      }
    } catch (error) {
      // clientAddress might throw during prerendering
      return null;
    }

    const identifier = `${clientIP}:${type}`;
    
    if (RateLimiter.isRateLimited(identifier, type)) {
      const status = RateLimiter.getStatus(identifier, type);
      
      AuditLogger.logSecurityEvent(
        'rate_limit_exceeded',
        context,
        false,
        { type, identifier, status },
        'medium'
      );

      return SecureErrorHandler.createErrorResponse(
        '請求過於頻繁，請稍後再試',
        429,
        'rate_limit'
      );
    }

    return null;
  }

  /**
   * Validate CSRF token for POST requests
   */
  static async validateCSRF(
    context: APIContext,
    sessionId: string
  ): Promise<Response | null> {
    if (context.request.method !== 'POST') {
      return null; // Only validate POST requests
    }

    const token = CSRFProtection.extractTokenFromRequest(context.request);
    
    if (!token || !CSRFProtection.validateToken(token, sessionId)) {
      AuditLogger.logSecurityEvent(
        'csrf_validation_failed',
        context,
        false,
        { sessionId, hasToken: !!token },
        'high'
      );

      return SecureErrorHandler.createErrorResponse(
        '安全驗證失敗',
        403,
        'validation'
      );
    }

    // Consume token after successful validation
    CSRFProtection.consumeToken(token);
    return null;
  }

  /**
   * Add security headers to response
   */
  static addSecurityHeaders(response: Response): Response {
    const headers = new Headers(response.headers);
    
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Only add HSTS in production with HTTPS
    if (process.env.NODE_ENV === 'production') {
      headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
}

// Periodic cleanup (run every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    RateLimiter.cleanup();
    AuditLogger.clearOldEvents();
  }, 5 * 60 * 1000);
}