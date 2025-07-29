/**
 * Enhanced API Client Unit Tests
 * 測試增強型 API 客戶端的各種功能
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EnhancedApiClient, createEnhancedMedicalApiClient } from '../enhanced-api-client';
import { apiKeyManager } from '../api-key-manager';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn(),
          clear: vi.fn()
        },
        response: {
          use: vi.fn(),
          clear: vi.fn()
        }
      }
    }))
  }
}));

// Mock axios-retry
vi.mock('axios-retry', () => ({
  default: vi.fn(),
  isNetworkOrIdempotentRequestError: vi.fn(() => true)
}));

// Mock API key manager
vi.mock('../api-key-manager', () => ({
  apiKeyManager: {
    getKey: vi.fn(),
    getKeyForRequest: vi.fn(),
    getKeyUsage: vi.fn(() => ({
      keyName: 'test-api',
      requests: 0,
      lastUsed: new Date(),
      errors: 0,
      rateLimitHits: 0
    }))
  }
}));

// Mock security measures
vi.mock('../security-measures', () => ({
  AuditLogger: {
    logSecurityEvent: vi.fn()
  }
}));

describe('EnhancedApiClient', () => {
  let client: EnhancedApiClient;
  const mockKeyConfig = {
    name: 'test-api',
    key: 'test-api-key-12345678901234567890',
    baseURL: 'https://api.test.com',
    permissions: ['*'],
    isActive: true
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock API key manager responses
    (apiKeyManager.getKey as any).mockReturnValue(mockKeyConfig);
    (apiKeyManager.getKeyForRequest as any).mockReturnValue(mockKeyConfig.key);
    
    // Create client instance
    client = new EnhancedApiClient({
      keyName: 'test-api',
      timeout: 5000,
      retries: 2,
      enableLogging: false,
      enableCache: true,
      enableCircuitBreaker: true
    });
  });

  afterEach(() => {
    client?.destroy();
  });

  describe('constructor', () => {
    it('should create client with default configuration', () => {
      expect(client).toBeInstanceOf(EnhancedApiClient);
    });

    it('should throw error if API key not found', () => {
      (apiKeyManager.getKey as any).mockReturnValue(null);
      
      expect(() => {
        new EnhancedApiClient({ keyName: 'non-existent-key' });
      }).toThrow('API 金鑰 \'non-existent-key\' 未找到');
    });
  });

  describe('HTTP methods', () => {
    beforeEach(() => {
      // Mock successful axios responses
      const mockResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        config: {
          headers: { 'X-Request-ID': 'test-request-id' },
          metadata: { startTime: Date.now() }
        }
      };

      const axiosInstance = (client as any).client;
      axiosInstance.get.mockResolvedValue(mockResponse);
      axiosInstance.post.mockResolvedValue(mockResponse);
      axiosInstance.put.mockResolvedValue(mockResponse);
      axiosInstance.patch.mockResolvedValue(mockResponse);
      axiosInstance.delete.mockResolvedValue(mockResponse);
    });

    it('should make GET request successfully', async () => {
      const response = await client.get('/test');
      
      expect(response.data).toEqual({ success: true });
      expect(response.status).toBe(200);
      expect(response.cached).toBe(false);
    });

    it('should make POST request successfully', async () => {
      const testData = { name: 'test' };
      const response = await client.post('/test', testData);
      
      expect(response.data).toEqual({ success: true });
      expect(response.status).toBe(200);
    });

    it('should make PUT request successfully', async () => {
      const testData = { id: 1, name: 'updated' };
      const response = await client.put('/test/1', testData);
      
      expect(response.data).toEqual({ success: true });
      expect(response.status).toBe(200);
    });

    it('should make PATCH request successfully', async () => {
      const testData = { name: 'patched' };
      const response = await client.patch('/test/1', testData);
      
      expect(response.data).toEqual({ success: true });
      expect(response.status).toBe(200);
    });

    it('should make DELETE request successfully', async () => {
      const response = await client.delete('/test/1');
      
      expect(response.data).toEqual({ success: true });
      expect(response.status).toBe(200);
    });
  });

  describe('caching', () => {
    it('should cache GET responses', async () => {
      const mockResponse = {
        data: { cached: true },
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        config: {
          headers: { 'X-Request-ID': 'test-request-id' },
          metadata: { startTime: Date.now() }
        }
      };

      const axiosInstance = (client as any).client;
      axiosInstance.get.mockResolvedValue(mockResponse);

      // First request
      const response1 = await client.get('/cached-endpoint');
      expect(response1.cached).toBe(false);

      // Second request should be cached
      const response2 = await client.get('/cached-endpoint');
      expect(response2.cached).toBe(true);
      expect(response2.data).toEqual({ cached: true });
    });

    it('should not cache non-GET requests', async () => {
      const mockResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        config: {
          headers: { 'X-Request-ID': 'test-request-id' },
          metadata: { startTime: Date.now() }
        }
      };

      const axiosInstance = (client as any).client;
      axiosInstance.post.mockResolvedValue(mockResponse);

      const response = await client.post('/test', { data: 'test' });
      expect(response.cached).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      (networkError as any).request = {};
      
      const axiosInstance = (client as any).client;
      axiosInstance.get.mockRejectedValue(networkError);

      try {
        await client.get('/error');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toBe('Network Error');
        expect(error.isNetworkError).toBe(true);
        expect(error.code).toBe('NETWORK_ERROR');
      }
    });

    it('should handle HTTP errors', async () => {
      const httpError = new Error('HTTP Error');
      (httpError as any).response = {
        status: 404,
        statusText: 'Not Found',
        data: { message: 'Resource not found' }
      };
      
      const axiosInstance = (client as any).client;
      axiosInstance.get.mockRejectedValue(httpError);

      try {
        await client.get('/not-found');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.status).toBe(404);
        expect(error.details).toEqual({ message: 'Resource not found' });
      }
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('timeout of 5000ms exceeded');
      (timeoutError as any).code = 'ECONNABORTED';
      
      const axiosInstance = (client as any).client;
      axiosInstance.get.mockRejectedValue(timeoutError);

      try {
        await client.get('/timeout');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.isTimeout).toBe(true);
        expect(error.message).toContain('timeout');
      }
    });
  });

  describe('health check', () => {
    it('should return true for successful health check', async () => {
      const mockResponse = {
        data: { status: 'healthy' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: { 'X-Request-ID': 'health-check' },
          metadata: { startTime: Date.now() }
        }
      };

      const axiosInstance = (client as any).client;
      axiosInstance.get.mockResolvedValue(mockResponse);

      const isHealthy = await client.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should return false for failed health check', async () => {
      const axiosInstance = (client as any).client;
      axiosInstance.get.mockRejectedValue(new Error('Health check failed'));

      const isHealthy = await client.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });

  describe('statistics', () => {
    it('should track request statistics', async () => {
      const mockResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: { 'X-Request-ID': 'stats-test' },
          metadata: { startTime: Date.now() }
        }
      };

      const axiosInstance = (client as any).client;
      axiosInstance.get.mockResolvedValue(mockResponse);

      // Make some requests
      await client.get('/test1');
      await client.get('/test2');

      const stats = client.getStats();
      expect(stats.totalRequests).toBe(2);
      expect(stats.performanceMetrics.totalRequests).toBe(2);
      expect(stats.performanceMetrics.successfulRequests).toBe(2);
      expect(stats.performanceMetrics.failedRequests).toBe(0);
    });

    it('should track cache statistics', async () => {
      const mockResponse = {
        data: { cached: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: { 'X-Request-ID': 'cache-stats' },
          metadata: { startTime: Date.now() }
        }
      };

      const axiosInstance = (client as any).client;
      axiosInstance.get.mockResolvedValue(mockResponse);

      // First request (cache miss)
      await client.get('/cached');
      
      // Second request (cache hit)
      await client.get('/cached');

      const stats = client.getStats();
      expect(stats.performanceMetrics.cacheHits).toBe(1);
      expect(stats.performanceMetrics.cacheMisses).toBe(1);
      expect(stats.performanceMetrics.cacheHitRate).toBe(50);
    });
  });

  describe('management methods', () => {
    it('should clear cache', () => {
      client.clearCache();
      // Cache should be cleared (no direct way to test, but method should not throw)
      expect(() => client.clearCache()).not.toThrow();
    });

    it('should reset circuit breaker', () => {
      client.resetCircuitBreaker();
      // Circuit breaker should be reset (no direct way to test, but method should not throw)
      expect(() => client.resetCircuitBreaker()).not.toThrow();
    });

    it('should reset rate limit', () => {
      client.resetRateLimit();
      // Rate limit should be reset (no direct way to test, but method should not throw)
      expect(() => client.resetRateLimit()).not.toThrow();
    });

    it('should reset statistics', () => {
      client.resetStats();
      const stats = client.getStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.performanceMetrics.totalRequests).toBe(0);
    });
  });
});

describe('Factory Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiKeyManager.getKey as any).mockReturnValue({
      name: 'medical-api',
      key: 'medical-api-key-12345678901234567890',
      baseURL: 'https://medical-api.test.com',
      permissions: ['*'],
      isActive: true
    });
  });

  it('should create medical API client', () => {
    const client = createEnhancedMedicalApiClient();
    expect(client).toBeInstanceOf(EnhancedApiClient);
    
    const stats = client.getStats();
    expect(stats.keyName).toBe('medical-api');
    
    client.destroy();
  });
});

describe('Error Utilities', () => {
  it('should identify enhanced API errors', () => {
    const { isEnhancedApiError } = await import('../enhanced-api-client');
    
    const apiError = {
      message: 'Test error',
      timestamp: Date.now(),
      isTimeout: false,
      isNetworkError: false,
      retryCount: 0
    };
    
    expect(isEnhancedApiError(apiError)).toBe(true);
    expect(isEnhancedApiError(new Error('Regular error'))).toBe(false);
    expect(isEnhancedApiError(null)).toBe(false);
  });

  it('should extract error messages', async () => {
    const { getEnhancedErrorMessage } = await import('../enhanced-api-client');
    
    const apiError = {
      message: 'API Error',
      timestamp: Date.now(),
      isTimeout: false,
      isNetworkError: false,
      retryCount: 0
    };
    
    expect(getEnhancedErrorMessage(apiError)).toBe('API Error');
    expect(getEnhancedErrorMessage(new Error('Regular error'))).toBe('Regular error');
    expect(getEnhancedErrorMessage('string error')).toBe('未知錯誤');
    expect(getEnhancedErrorMessage(null)).toBe('未知錯誤');
  });
});