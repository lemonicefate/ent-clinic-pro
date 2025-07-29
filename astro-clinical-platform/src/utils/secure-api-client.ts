/**
 * Secure API Integration Framework
 * 提供安全的 API 整合功能，包含錯誤處理、重試機制、速率限制和安全措施
 */
import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError,
  InternalAxiosRequestConfig
} from 'axios';
import axiosRetry from 'axios-retry';

// 類型定義
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  apiKey?: string;
  rateLimitPerMinute?: number;
  enableLogging?: boolean;
  validateResponse?: boolean;
  maxConcurrentRequests?: number;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: AxiosRequestConfig;
  timestamp: number;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
  timestamp: number;
  requestId?: string;
}

export interface RateLimitInfo {
  remaining: number;
  resetTime: number;
  limit: number;
}

// 速率限制管理器
class RateLimiter {
  private requests: number[] = [];
  private readonly limit: number;
  private readonly windowMs: number = 60000; // 1 分鐘

  constructor(requestsPerMinute: number) {
    this.limit = requestsPerMinute;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    // 清除超過時間窗口的請求記錄
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    return this.requests.length < this.limit;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getRateLimitInfo(): RateLimitInfo {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    return {
      remaining: Math.max(0, this.limit - this.requests.length),
      resetTime: now + this.windowMs,
      limit: this.limit
    };
  }

  async waitForRateLimit(): Promise<void> {
    if (!this.canMakeRequest()) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (Date.now() - oldestRequest);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
}

// 請求佇列管理器
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private readonly maxConcurrent: number;

  constructor(maxConcurrent: number = 5) {
    this.maxConcurrent = maxConcurrent;
  }

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
}

// 安全 API 客戶端類
export class SecureApiClient {
  private client: AxiosInstance;
  private rateLimiter?: RateLimiter;
  private requestQueue: RequestQueue;
  private config: Required<ApiClientConfig>;
  private requestCount = 0;

  constructor(config: ApiClientConfig) {
    // 設定預設值
    this.config = {
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      rateLimitPerMinute: 60,
      enableLogging: false,
      validateResponse: true,
      maxConcurrentRequests: 5,
      ...config
    } as Required<ApiClientConfig>;

    // 初始化速率限制器
    if (this.config.rateLimitPerMinute > 0) {
      this.rateLimiter = new RateLimiter(this.config.rateLimitPerMinute);
    }

    // 初始化請求佇列
    this.requestQueue = new RequestQueue(this.config.maxConcurrentRequests);

    // 創建 Axios 實例
    this.client = this.createAxiosInstance();
    
    // 設定重試機制
    this.setupRetryMechanism();
    
    // 設定攔截器
    this.setupInterceptors();
  }

  private createAxiosInstance(): AxiosInstance {
    const instance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Astro-Clinical-Platform/1.0',
        ...(this.config.apiKey && {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-API-Key': this.config.apiKey
        })
      },
      // 安全設定
      withCredentials: false,
      maxRedirects: 3,
      validateStatus: (status) => {
        if (this.config.validateResponse) {
          return status >= 200 && status < 300;
        }
        return status < 500; // 只有 5xx 錯誤才拋出異常
      }
    });

    return instance;
  }

  private setupRetryMechanism(): void {
    axiosRetry(this.client, {
      retries: this.config.retries,
      retryDelay: (retryCount, error) => {
        // 指數退避策略
        const delay = Math.min(
          this.config.retryDelay * Math.pow(2, retryCount - 1),
          30000 // 最大延遲 30 秒
        );
        
        if (this.config.enableLogging) {
          console.log(`API 重試 ${retryCount}/${this.config.retries}, 延遲 ${delay}ms`);
        }
        
        return delay;
      },
      retryCondition: (error: AxiosError) => {
        // 重試條件：網路錯誤或 5xx 伺服器錯誤
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               (error.response?.status ? error.response.status >= 500 : false);
      },
      onRetry: (retryCount, error, requestConfig) => {
        if (this.config.enableLogging) {
          console.warn(`API 請求重試 ${retryCount}: ${error.message}`);
        }
      },
      onMaxRetryTimesExceeded: (error, retryCount) => {
        if (this.config.enableLogging) {
          console.error(`API 請求達到最大重試次數 ${retryCount}: ${error.message}`);
        }
      }
    });
  }

  private setupInterceptors(): void {
    // 請求攔截器
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // 生成請求 ID
        const requestId = this.generateRequestId();
        config.headers['X-Request-ID'] = requestId;
        
        // 速率限制檢查
        if (this.rateLimiter) {
          await this.rateLimiter.waitForRateLimit();
          this.rateLimiter.recordRequest();
        }

        // 記錄請求
        if (this.config.enableLogging) {
          console.log(`API 請求 [${requestId}]: ${config.method?.toUpperCase()} ${config.url}`);
        }

        // 添加時間戳
        config.metadata = {
          ...config.metadata,
          startTime: Date.now(),
          requestId
        };

        return config;
      },
      (error) => {
        if (this.config.enableLogging) {
          console.error('API 請求攔截器錯誤:', error);
        }
        return Promise.reject(this.formatError(error));
      }
    );

    // 回應攔截器
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        const requestId = response.config.headers['X-Request-ID'] as string;
        const startTime = (response.config as any).metadata?.startTime || Date.now();
        const duration = Date.now() - startTime;

        if (this.config.enableLogging) {
          console.log(`API 回應 [${requestId}]: ${response.status} (${duration}ms)`);
        }

        // 格式化回應
        return {
          ...response,
          data: response.data,
          timestamp: Date.now(),
          duration
        };
      },
      (error: AxiosError) => {
        const requestId = error.config?.headers?.['X-Request-ID'] as string;
        
        if (this.config.enableLogging) {
          console.error(`API 錯誤 [${requestId}]:`, error.message);
        }

        return Promise.reject(this.formatError(error, requestId));
      }
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatError(error: any, requestId?: string): ApiError {
    const apiError: ApiError = {
      message: error.message || '未知錯誤',
      timestamp: Date.now(),
      requestId
    };

    if (error.response) {
      // 伺服器回應錯誤
      apiError.status = error.response.status;
      apiError.code = error.response.data?.code || error.code;
      apiError.details = error.response.data;
    } else if (error.request) {
      // 請求發送但無回應
      apiError.code = 'NETWORK_ERROR';
      apiError.message = '網路連線錯誤';
    } else {
      // 請求設定錯誤
      apiError.code = 'REQUEST_ERROR';
    }

    return apiError;
  }

  // 公開方法
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.requestQueue.add(() => this.client.get(url, config));
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.requestQueue.add(() => this.client.post(url, data, config));
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.requestQueue.add(() => this.client.put(url, data, config));
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.requestQueue.add(() => this.client.patch(url, data, config));
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.requestQueue.add(() => this.client.delete(url, config));
  }

  // 批次請求
  async batch<T = any>(requests: Array<() => Promise<ApiResponse<T>>>): Promise<ApiResponse<T>[]> {
    const results = await Promise.allSettled(
      requests.map(request => this.requestQueue.add(request))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        throw new Error(`批次請求 ${index} 失敗: ${result.reason.message}`);
      }
    });
  }

  // 健康檢查
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

  // 獲取速率限制資訊
  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimiter?.getRateLimitInfo() || null;
  }

  // 更新 API 金鑰
  updateApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.client.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
    this.client.defaults.headers['X-API-Key'] = apiKey;
  }

  // 獲取統計資訊
  getStats() {
    return {
      totalRequests: this.requestCount,
      rateLimitInfo: this.getRateLimitInfo(),
      queueSize: (this.requestQueue as any).queue.length,
      runningRequests: (this.requestQueue as any).running
    };
  }

  // 清理資源
  destroy(): void {
    // 清除攔截器
    this.client.interceptors.request.clear();
    this.client.interceptors.response.clear();
    
    if (this.config.enableLogging) {
      console.log('API 客戶端已清理');
    }
  }
}

// 工廠函數
export function createSecureApiClient(config: ApiClientConfig): SecureApiClient {
  return new SecureApiClient(config);
}

// 預設醫療 API 客戶端配置
export const createMedicalApiClient = (baseURL: string, apiKey?: string) => {
  return createSecureApiClient({
    baseURL,
    apiKey,
    timeout: 15000, // 醫療 API 可能需要更長時間
    retries: 3,
    retryDelay: 2000,
    rateLimitPerMinute: 30, // 較保守的速率限制
    enableLogging: process.env.NODE_ENV === 'development',
    validateResponse: true,
    maxConcurrentRequests: 3 // 醫療 API 通常有較嚴格的併發限制
  });
};

// 錯誤處理工具
export const isApiError = (error: any): error is ApiError => {
  return error && typeof error === 'object' && 'timestamp' in error;
};

export const getErrorMessage = (error: any): string => {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '未知錯誤';
};

// 重試工具
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
};