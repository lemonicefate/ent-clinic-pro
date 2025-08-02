/**
 * Calculator API Client Abstraction Layer
 * 
 * Provides a universal API Client interface for calculator plugins.
 * Currently handles static data for SSG environment, designed to be
 * future-ready for backend integration when dynamic data is required.
 * 
 * Key Features:
 * - StaticAPIClient for current SSG environment
 * - HTTPAPIClient for future backend integration
 * - Standardized API calls and consistent error handling
 * - Request/response logging and debugging support
 * - Retry logic and timeout protection
 */

import type { CalculationResult } from '../types/calculator.js';
import { SecureApiClient, type ApiClientConfig } from './api-client.js';

// ============================================================================
// API Client Interface
// ============================================================================

/**
 * Universal API Client interface for calculator plugins
 */
export interface CalculatorAPIClient {
  /**
   * Fetch calculator-specific data
   * Current: Static data or mock responses
   * Future: Real HTTP requests to backend
   */
  fetchCalculatorData(calculatorId: string): Promise<CalculatorData>;
  
  /**
   * Submit calculation result for storage/analysis
   * Current: No-op for static environment
   * Future: POST to backend API
   */
  submitCalculationResult(calculatorId: string, result: CalculationResult): Promise<void>;
  
  /**
   * Fetch calculator configuration from remote source
   * Current: Returns null (uses local config)
   * Future: Fetch from configuration service
   */
  fetchCalculatorConfig(calculatorId: string): Promise<CalculatorRemoteConfig | null>;
  
  /**
   * Fetch reference data (e.g., drug databases, medical references)
   * Current: Returns static/cached data
   * Future: Real-time data from medical APIs
   */
  fetchReferenceData(dataType: string, query?: any): Promise<ReferenceData>;
  
  /**
   * Submit usage analytics
   * Current: Console logging
   * Future: Analytics service
   */
  submitAnalytics(event: AnalyticsEvent): Promise<void>;
  
  /**
   * Check for calculator updates
   * Current: Returns no updates
   * Future: Version checking service
   */
  checkForUpdates(calculatorId: string, currentVersion: string): Promise<UpdateInfo>;
}

// ============================================================================
// Data Types
// ============================================================================

export interface CalculatorData {
  /** Calculator-specific configuration data */
  config?: Record<string, any>;
  
  /** Reference data for calculations */
  referenceData?: Record<string, any>;
  
  /** Cached calculation results */
  cachedResults?: CalculationResult[];
  
  /** Last update timestamp */
  lastUpdated?: string;
  
  /** Data source information */
  source: 'static' | 'cache' | 'api';
}

export interface CalculatorRemoteConfig {
  /** Remote configuration version */
  version: string;
  
  /** Configuration data */
  config: Record<string, any>;
  
  /** Feature flags */
  features?: Record<string, boolean>;
  
  /** A/B testing configuration */
  experiments?: Record<string, any>;
  
  /** Last modified timestamp */
  lastModified: string;
}

export interface ReferenceData {
  /** Data type identifier */
  type: string;
  
  /** Actual reference data */
  data: any;
  
  /** Data version/timestamp */
  version: string;
  
  /** Cache TTL in milliseconds */
  ttl?: number;
  
  /** Data source */
  source: string;
}

export interface AnalyticsEvent {
  /** Event type */
  type: 'calculation' | 'error' | 'usage' | 'performance';
  
  /** Calculator identifier */
  calculatorId: string;
  
  /** Event timestamp */
  timestamp: Date;
  
  /** Event data */
  data: Record<string, any>;
  
  /** User session ID (if available) */
  sessionId?: string;
  
  /** User ID (if available) */
  userId?: string;
}

export interface UpdateInfo {
  /** Whether updates are available */
  hasUpdates: boolean;
  
  /** Latest version available */
  latestVersion?: string;
  
  /** Update description */
  description?: string;
  
  /** Update priority */
  priority?: 'low' | 'medium' | 'high' | 'critical';
  
  /** Download URL */
  downloadUrl?: string;
  
  /** Release notes */
  releaseNotes?: string;
}

// ============================================================================
// Static API Client (Current SSG Implementation)
// ============================================================================

export class StaticAPIClient implements CalculatorAPIClient {
  private staticData = new Map<string, CalculatorData>();
  private referenceCache = new Map<string, ReferenceData>();

  constructor() {
    this.initializeStaticData();
  }

  /**
   * Fetch calculator data from static sources
   */
  async fetchCalculatorData(calculatorId: string): Promise<CalculatorData> {
    console.log(`📊 Fetching static data for calculator: ${calculatorId}`);
    
    // Return cached static data or default
    const data = this.staticData.get(calculatorId) || {
      config: {},
      referenceData: {},
      cachedResults: [],
      lastUpdated: new Date().toISOString(),
      source: 'static' as const
    };
    
    // Simulate async operation
    await this.delay(50);
    
    return data;
  }

  /**
   * Submit calculation result (no-op for static environment)
   */
  async submitCalculationResult(calculatorId: string, result: CalculationResult): Promise<void> {
    console.log(`📝 Calculation result (static mode):`, {
      calculatorId,
      result: {
        primaryValue: result.primaryValue,
        primaryUnit: result.primaryUnit,
        timestamp: new Date().toISOString()
      }
    });
    
    // In static mode, we could store in localStorage for development
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const key = `calc_result_${calculatorId}`;
        const existingResults = JSON.parse(localStorage.getItem(key) || '[]');
        existingResults.push({
          ...result,
          timestamp: new Date().toISOString()
        });
        
        // Keep only last 10 results
        if (existingResults.length > 10) {
          existingResults.splice(0, existingResults.length - 10);
        }
        
        localStorage.setItem(key, JSON.stringify(existingResults));
      } catch (error) {
        console.warn('Failed to store result in localStorage:', error);
      }
    }
  }

  /**
   * Fetch calculator configuration (returns null for static mode)
   */
  async fetchCalculatorConfig(calculatorId: string): Promise<CalculatorRemoteConfig | null> {
    console.log(`⚙️ No remote config available for ${calculatorId} (static mode)`);
    return null;
  }

  /**
   * Fetch reference data from static sources
   */
  async fetchReferenceData(dataType: string, query?: any): Promise<ReferenceData> {
    console.log(`📚 Fetching reference data: ${dataType}`, query);
    
    const cacheKey = `${dataType}_${JSON.stringify(query || {})}`;
    
    // Check cache first
    if (this.referenceCache.has(cacheKey)) {
      const cached = this.referenceCache.get(cacheKey)!;
      console.log(`📦 Using cached reference data for ${dataType}`);
      return cached;
    }
    
    // Generate mock reference data based on type
    const referenceData = this.generateMockReferenceData(dataType, query);
    
    // Cache the result
    this.referenceCache.set(cacheKey, referenceData);
    
    await this.delay(100);
    return referenceData;
  }

  /**
   * Submit analytics (console logging for static mode)
   */
  async submitAnalytics(event: AnalyticsEvent): Promise<void> {
    console.log(`📈 Analytics event (static mode):`, {
      type: event.type,
      calculatorId: event.calculatorId,
      timestamp: event.timestamp.toISOString(),
      data: event.data
    });
    
    // In development, could send to local analytics service
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const key = 'calculator_analytics';
        const existingEvents = JSON.parse(localStorage.getItem(key) || '[]');
        existingEvents.push({
          ...event,
          timestamp: event.timestamp.toISOString()
        });
        
        // Keep only last 100 events
        if (existingEvents.length > 100) {
          existingEvents.splice(0, existingEvents.length - 100);
        }
        
        localStorage.setItem(key, JSON.stringify(existingEvents));
      } catch (error) {
        console.warn('Failed to store analytics in localStorage:', error);
      }
    }
  }

  /**
   * Check for updates (returns no updates for static mode)
   */
  async checkForUpdates(calculatorId: string, currentVersion: string): Promise<UpdateInfo> {
    console.log(`🔄 No updates available for ${calculatorId} v${currentVersion} (static mode)`);
    
    return {
      hasUpdates: false
    };
  }

  /**
   * Initialize static data for development
   */
  private initializeStaticData(): void {
    // Add some sample static data for common calculators
    this.staticData.set('general.bmi', {
      config: {
        units: ['metric', 'imperial'],
        precision: 1
      },
      referenceData: {
        categories: {
          underweight: { min: 0, max: 18.5 },
          normal: { min: 18.5, max: 25 },
          overweight: { min: 25, max: 30 },
          obese: { min: 30, max: 100 }
        }
      },
      cachedResults: [],
      lastUpdated: new Date().toISOString(),
      source: 'static'
    });

    this.staticData.set('cardiology.cha2ds2-vasc', {
      config: {
        scoringSystem: 'cha2ds2-vasc',
        version: '2.0'
      },
      referenceData: {
        riskCategories: {
          low: { score: 0, risk: '<1%' },
          moderate: { score: 1, risk: '1-2%' },
          high: { score: '>=2', risk: '>2%' }
        }
      },
      cachedResults: [],
      lastUpdated: new Date().toISOString(),
      source: 'static'
    });
  }

  /**
   * Generate mock reference data based on type
   */
  private generateMockReferenceData(dataType: string, query?: any): ReferenceData {
    const mockData: Record<string, any> = {
      'drug-interactions': {
        interactions: [],
        lastUpdated: new Date().toISOString()
      },
      'medical-references': {
        guidelines: [],
        studies: [],
        lastUpdated: new Date().toISOString()
      },
      'lab-values': {
        normalRanges: {},
        units: {},
        lastUpdated: new Date().toISOString()
      }
    };

    return {
      type: dataType,
      data: mockData[dataType] || {},
      version: '1.0.0',
      ttl: 300000, // 5 minutes
      source: 'static-mock'
    };
  }

  /**
   * Simulate async delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.referenceCache.clear();
    console.log('🧹 Static API client cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      staticDataSize: this.staticData.size,
      referenceCacheSize: this.referenceCache.size
    };
  }
}

// ============================================================================
// HTTP API Client (Future Backend Integration)
// ============================================================================

export class HTTPAPIClient implements CalculatorAPIClient {
  private httpClient: SecureApiClient;
  private baseURL: string;

  constructor(baseURL: string, config?: Partial<ApiClientConfig>) {
    this.baseURL = baseURL;
    this.httpClient = new SecureApiClient({
      baseURL,
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      ...config
    });
  }

  /**
   * Fetch calculator data from backend API
   */
  async fetchCalculatorData(calculatorId: string): Promise<CalculatorData> {
    console.log(`🌐 Fetching calculator data from API: ${calculatorId}`);
    
    try {
      const response = await this.httpClient.request({
        method: 'GET',
        endpoint: `/api/calculators/${calculatorId}/data`,
        cache: true // Enable caching for calculator data
      });

      return {
        ...response.data,
        source: 'api' as const
      };
    } catch (error) {
      console.error(`Failed to fetch calculator data for ${calculatorId}:`, error);
      
      // Fallback to empty data
      return {
        config: {},
        referenceData: {},
        cachedResults: [],
        lastUpdated: new Date().toISOString(),
        source: 'api'
      };
    }
  }

  /**
   * Submit calculation result to backend
   */
  async submitCalculationResult(calculatorId: string, result: CalculationResult): Promise<void> {
    console.log(`📤 Submitting calculation result for ${calculatorId}`);
    
    try {
      await this.httpClient.request({
        method: 'POST',
        endpoint: '/api/calculations',
        data: {
          calculatorId,
          result,
          timestamp: new Date().toISOString()
        }
      });
      
      console.log(`✅ Calculation result submitted successfully`);
    } catch (error) {
      console.error(`Failed to submit calculation result:`, error);
      // Don't throw - calculation should still work even if submission fails
    }
  }

  /**
   * Fetch remote calculator configuration
   */
  async fetchCalculatorConfig(calculatorId: string): Promise<CalculatorRemoteConfig | null> {
    console.log(`⚙️ Fetching remote config for ${calculatorId}`);
    
    try {
      const response = await this.httpClient.request({
        method: 'GET',
        endpoint: `/api/calculators/${calculatorId}/config`,
        cache: 300000 // Cache for 5 minutes
      });

      return response.data;
    } catch (error) {
      console.warn(`Failed to fetch remote config for ${calculatorId}:`, error);
      return null;
    }
  }

  /**
   * Fetch reference data from backend APIs
   */
  async fetchReferenceData(dataType: string, query?: any): Promise<ReferenceData> {
    console.log(`📚 Fetching reference data from API: ${dataType}`, query);
    
    try {
      const response = await this.httpClient.request({
        method: 'GET',
        endpoint: `/api/reference/${dataType}`,
        data: query,
        cache: true // Cache reference data
      });

      return {
        type: dataType,
        data: response.data.data,
        version: response.data.version,
        ttl: response.data.ttl,
        source: 'api'
      };
    } catch (error) {
      console.error(`Failed to fetch reference data for ${dataType}:`, error);
      
      // Return empty reference data
      return {
        type: dataType,
        data: {},
        version: '0.0.0',
        source: 'api-error'
      };
    }
  }

  /**
   * Submit analytics to backend service
   */
  async submitAnalytics(event: AnalyticsEvent): Promise<void> {
    console.log(`📊 Submitting analytics event: ${event.type}`);
    
    try {
      await this.httpClient.request({
        method: 'POST',
        endpoint: '/api/analytics',
        data: {
          ...event,
          timestamp: event.timestamp.toISOString()
        }
      });
    } catch (error) {
      console.warn(`Failed to submit analytics:`, error);
      // Don't throw - analytics failure shouldn't break functionality
    }
  }

  /**
   * Check for calculator updates from backend
   */
  async checkForUpdates(calculatorId: string, currentVersion: string): Promise<UpdateInfo> {
    console.log(`🔄 Checking for updates: ${calculatorId} v${currentVersion}`);
    
    try {
      const response = await this.httpClient.request({
        method: 'GET',
        endpoint: `/api/calculators/${calculatorId}/updates`,
        data: { currentVersion },
        cache: 600000 // Cache for 10 minutes
      });

      return response.data;
    } catch (error) {
      console.warn(`Failed to check for updates:`, error);
      return { hasUpdates: false };
    }
  }

  /**
   * Get HTTP client statistics
   */
  getStats() {
    return this.httpClient.getStats();
  }

  /**
   * Clear HTTP client cache
   */
  clearCache(): void {
    this.httpClient.clearCache();
  }
}

// ============================================================================
// API Client Factory
// ============================================================================

export class CalculatorAPIClientFactory {
  private static instance: CalculatorAPIClient | null = null;

  /**
   * Get the appropriate API client based on environment
   */
  static getInstance(): CalculatorAPIClient {
    if (!this.instance) {
      // Determine which client to use based on environment
      if (this.isStaticEnvironment()) {
        console.log('🏗️ Using StaticAPIClient for SSG environment');
        this.instance = new StaticAPIClient();
      } else {
        console.log('🌐 Using HTTPAPIClient for dynamic environment');
        const baseURL = process.env.CALCULATOR_API_BASE_URL || 'https://api.calculator-platform.com';
        this.instance = new HTTPAPIClient(baseURL, {
          apiKey: process.env.CALCULATOR_API_KEY
        });
      }
    }
    
    return this.instance;
  }

  /**
   * Create a specific API client type
   */
  static createStaticClient(): StaticAPIClient {
    return new StaticAPIClient();
  }

  /**
   * Create HTTP API client with custom configuration
   */
  static createHTTPClient(baseURL: string, config?: Partial<ApiClientConfig>): HTTPAPIClient {
    return new HTTPAPIClient(baseURL, config);
  }

  /**
   * Reset the singleton instance
   */
  static reset(): void {
    this.instance = null;
  }

  /**
   * Check if we're in a static environment (SSG)
   */
  private static isStaticEnvironment(): boolean {
    // Check for build-time environment
    if (typeof process !== 'undefined') {
      return process.env.NODE_ENV === 'development' || 
             process.env.BUILD_MODE === 'static' ||
             !process.env.CALCULATOR_API_BASE_URL;
    }
    
    // Check for browser environment without API endpoint
    return typeof window !== 'undefined' && !window.location.hostname.includes('api.');
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get the default API client instance
 */
export function getCalculatorAPIClient(): CalculatorAPIClient {
  return CalculatorAPIClientFactory.getInstance();
}

/**
 * Submit calculation result using default client
 */
export async function submitCalculationResult(calculatorId: string, result: CalculationResult): Promise<void> {
  const client = getCalculatorAPIClient();
  return client.submitCalculationResult(calculatorId, result);
}

/**
 * Fetch calculator data using default client
 */
export async function fetchCalculatorData(calculatorId: string): Promise<CalculatorData> {
  const client = getCalculatorAPIClient();
  return client.fetchCalculatorData(calculatorId);
}

/**
 * Submit analytics event using default client
 */
export async function submitAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  const client = getCalculatorAPIClient();
  return client.submitAnalytics(event);
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  CalculatorAPIClientFactory,
  StaticAPIClient,
  HTTPAPIClient,
  getCalculatorAPIClient
};