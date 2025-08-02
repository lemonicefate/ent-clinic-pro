/**
 * API Key Management System
 * Handles secure storage, rotation, and validation of API keys
 */

import { AuditLogger } from './security-measures';

export interface ApiKeyConfig {
  name: string;
  key: string;
  secret?: string;
  baseURL: string;
  expiresAt?: Date;
  permissions: string[];
  rateLimit?: {
    requests: number;
    window: number;
  };
  metadata?: Record<string, any>;
}

export interface ApiKeyRotationConfig {
  enabled: boolean;
  interval: number; // in milliseconds
  warningThreshold: number; // warn when key expires in X milliseconds
  autoRotate: boolean;
}

export interface ApiKeyUsage {
  keyName: string;
  requests: number;
  lastUsed: Date;
  errors: number;
  rateLimitHits: number;
}

/**
 * Secure API Key Manager with rotation and monitoring
 */
export class ApiKeyManager {
  private keys = new Map<string, ApiKeyConfig>();
  private usage = new Map<string, ApiKeyUsage>();
  private rotationConfig: ApiKeyRotationConfig;
  private rotationTimers = new Map<string, NodeJS.Timeout>();

  constructor(rotationConfig?: Partial<ApiKeyRotationConfig>) {
    this.rotationConfig = {
      enabled: true,
      interval: 24 * 60 * 60 * 1000, // 24 hours
      warningThreshold: 7 * 24 * 60 * 60 * 1000, // 7 days
      autoRotate: false,
      ...rotationConfig,
    };

    // Load keys from environment or secure storage
    this.loadKeysFromEnvironment();

    // Setup rotation monitoring
    if (this.rotationConfig.enabled) {
      this.setupRotationMonitoring();
    }
  }

  /**
   * Add or update an API key
   */
  addKey(config: ApiKeyConfig): void {
    // Validate key configuration
    this.validateKeyConfig(config);

    // Encrypt sensitive data before storage
    const encryptedConfig = this.encryptKeyData(config);
    
    this.keys.set(config.name, encryptedConfig);
    
    // Initialize usage tracking
    this.usage.set(config.name, {
      keyName: config.name,
      requests: 0,
      lastUsed: new Date(),
      errors: 0,
      rateLimitHits: 0,
    });

    // Setup rotation timer if expiration is set
    if (config.expiresAt && this.rotationConfig.enabled) {
      this.setupKeyRotation(config.name, config.expiresAt);
    }

    // Log key addition
    AuditLogger.logSecurityEvent(
      'api_key_added',
      { request: { url: config.baseURL } } as any,
      true,
      {
        keyName: config.name,
        baseURL: config.baseURL,
        permissions: config.permissions,
        expiresAt: config.expiresAt?.toISOString(),
      },
      'medium'
    );
  }

  /**
   * Get API key configuration
   */
  getKey(name: string): ApiKeyConfig | null {
    const encryptedConfig = this.keys.get(name);
    if (!encryptedConfig) return null;

    // Decrypt sensitive data
    return this.decryptKeyData(encryptedConfig);
  }

  /**
   * Get API key for request (with usage tracking)
   */
  getKeyForRequest(name: string, endpoint?: string): string | null {
    const config = this.getKey(name);
    if (!config) return null;

    // Check if key is expired
    if (config.expiresAt && config.expiresAt < new Date()) {
      this.handleExpiredKey(name);
      return null;
    }

    // Check permissions if endpoint is provided
    if (endpoint && !this.checkPermissions(config, endpoint)) {
      this.recordUsage(name, 'permission_denied');
      return null;
    }

    // Check rate limiting
    if (config.rateLimit && !this.checkRateLimit(name, config.rateLimit)) {
      this.recordUsage(name, 'rate_limit');
      return null;
    }

    // Record successful usage
    this.recordUsage(name, 'success');

    return config.key;
  }

  /**
   * Remove API key
   */
  removeKey(name: string): boolean {
    const existed = this.keys.has(name);
    
    if (existed) {
      this.keys.delete(name);
      this.usage.delete(name);
      
      // Clear rotation timer
      const timer = this.rotationTimers.get(name);
      if (timer) {
        clearTimeout(timer);
        this.rotationTimers.delete(name);
      }

      // Log key removal
      AuditLogger.logSecurityEvent(
        'api_key_removed',
        { request: { url: 'internal' } } as any,
        true,
        { keyName: name },
        'medium'
      );
    }

    return existed;
  }

  /**
   * Rotate API key
   */
  async rotateKey(name: string, newKey: string, newSecret?: string): Promise<boolean> {
    const config = this.getKey(name);
    if (!config) return false;

    const oldKey = config.key;
    
    // Update key configuration
    const updatedConfig: ApiKeyConfig = {
      ...config,
      key: newKey,
      secret: newSecret || config.secret,
      expiresAt: new Date(Date.now() + this.rotationConfig.interval),
    };

    this.addKey(updatedConfig);

    // Log key rotation
    AuditLogger.logSecurityEvent(
      'api_key_rotated',
      { request: { url: config.baseURL } } as any,
      true,
      {
        keyName: name,
        oldKeyHash: this.hashKey(oldKey),
        newKeyHash: this.hashKey(newKey),
      },
      'high'
    );

    return true;
  }

  /**
   * Get usage statistics for a key
   */
  getKeyUsage(name: string): ApiKeyUsage | null {
    return this.usage.get(name) || null;
  }

  /**
   * Get all key usage statistics
   */
  getAllUsageStats(): ApiKeyUsage[] {
    return Array.from(this.usage.values());
  }

  /**
   * Check if key needs rotation
   */
  needsRotation(name: string): boolean {
    const config = this.getKey(name);
    if (!config || !config.expiresAt) return false;

    const timeUntilExpiry = config.expiresAt.getTime() - Date.now();
    return timeUntilExpiry <= this.rotationConfig.warningThreshold;
  }

  /**
   * Get keys that need rotation
   */
  getKeysNeedingRotation(): string[] {
    const needingRotation: string[] = [];
    
    for (const [name] of this.keys) {
      if (this.needsRotation(name)) {
        needingRotation.push(name);
      }
    }

    return needingRotation;
  }

  /**
   * Validate API key configuration
   */
  private validateKeyConfig(config: ApiKeyConfig): void {
    if (!config.name || !config.key || !config.baseURL) {
      throw new Error('API key configuration must include name, key, and baseURL');
    }

    if (!Array.isArray(config.permissions)) {
      throw new Error('API key permissions must be an array');
    }

    try {
      new URL(config.baseURL);
    } catch (error) {
      throw new Error(`Invalid baseURL: ${config.baseURL}`);
    }
  }

  /**
   * Encrypt sensitive key data (mock implementation)
   */
  private encryptKeyData(config: ApiKeyConfig): ApiKeyConfig {
    // In production, use proper encryption
    // For now, just return the config as-is
    return { ...config };
  }

  /**
   * Decrypt sensitive key data (mock implementation)
   */
  private decryptKeyData(config: ApiKeyConfig): ApiKeyConfig {
    // In production, use proper decryption
    // For now, just return the config as-is
    return { ...config };
  }

  /**
   * Check permissions for endpoint
   */
  private checkPermissions(config: ApiKeyConfig, endpoint: string): boolean {
    // Simple permission check - in production, implement more sophisticated logic
    if (config.permissions.includes('*')) return true;
    
    return config.permissions.some(permission => {
      if (permission.endsWith('*')) {
        const prefix = permission.slice(0, -1);
        return endpoint.startsWith(prefix);
      }
      return endpoint === permission;
    });
  }

  /**
   * Check rate limiting for key
   */
  private checkRateLimit(name: string, rateLimit: { requests: number; window: number }): boolean {
    const usage = this.usage.get(name);
    if (!usage) return true;

    const now = Date.now();
    const windowStart = now - rateLimit.window;
    
    // Simple rate limiting - in production, implement sliding window
    if (usage.lastUsed.getTime() < windowStart) {
      // Reset counter if outside window
      usage.requests = 0;
    }

    return usage.requests < rateLimit.requests;
  }

  /**
   * Record key usage
   */
  private recordUsage(name: string, type: 'success' | 'error' | 'rate_limit' | 'permission_denied'): void {
    const usage = this.usage.get(name);
    if (!usage) return;

    usage.lastUsed = new Date();

    switch (type) {
      case 'success':
        usage.requests++;
        break;
      case 'error':
        usage.errors++;
        break;
      case 'rate_limit':
        usage.rateLimitHits++;
        break;
      case 'permission_denied':
        usage.errors++;
        break;
    }

    this.usage.set(name, usage);
  }

  /**
   * Handle expired key
   */
  private handleExpiredKey(name: string): void {
    AuditLogger.logSecurityEvent(
      'api_key_expired',
      { request: { url: 'internal' } } as any,
      false,
      { keyName: name },
      'high'
    );

    if (this.rotationConfig.autoRotate) {
      // In production, implement automatic key rotation
      console.warn(`API key '${name}' expired and auto-rotation is not implemented`);
    }
  }

  /**
   * Setup rotation monitoring
   */
  private setupRotationMonitoring(): void {
    // Check for keys needing rotation every hour
    setInterval(() => {
      const needingRotation = this.getKeysNeedingRotation();
      
      if (needingRotation.length > 0) {
        AuditLogger.logSecurityEvent(
          'api_keys_need_rotation',
          { request: { url: 'internal' } } as any,
          false,
          { keys: needingRotation },
          'high'
        );
      }
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Setup rotation timer for specific key
   */
  private setupKeyRotation(name: string, expiresAt: Date): void {
    const warningTime = expiresAt.getTime() - this.rotationConfig.warningThreshold;
    const now = Date.now();

    if (warningTime > now) {
      const timer = setTimeout(() => {
        AuditLogger.logSecurityEvent(
          'api_key_rotation_warning',
          { request: { url: 'internal' } } as any,
          false,
          {
            keyName: name,
            expiresAt: expiresAt.toISOString(),
            timeUntilExpiry: expiresAt.getTime() - Date.now(),
          },
          'high'
        );
      }, warningTime - now);

      this.rotationTimers.set(name, timer);
    }
  }

  /**
   * Load keys from environment variables
   */
  private loadKeysFromEnvironment(): void {
    // Load Infermedica API keys
    const infermedicaAppId = process.env.INFERMEDICA_APP_ID;
    const infermedicaAppKey = process.env.INFERMEDICA_APP_KEY;
    const infermedicaApiUrl = process.env.INFERMEDICA_API_BASE_URL || 'https://api.infermedica.com';

    if (infermedicaAppId && infermedicaAppKey) {
      this.addKey({
        name: 'infermedica-api',
        key: infermedicaAppKey,
        baseURL: infermedicaApiUrl,
        permissions: ['/v3/*'],
        rateLimit: {
          requests: 100,
          window: 60000,
        },
        metadata: {
          appId: infermedicaAppId,
          service: 'infermedica',
          description: 'Infermedica medical AI API for symptom assessment'
        }
      });
    }

    // Load Canvas Medical API keys
    const canvasApiKey = process.env.CANVAS_MEDICAL_API_KEY;
    const canvasApiUrl = process.env.CANVAS_MEDICAL_API_BASE_URL;

    if (canvasApiKey && canvasApiUrl) {
      this.addKey({
        name: 'canvas-medical-api',
        key: canvasApiKey,
        baseURL: canvasApiUrl,
        permissions: ['/Patient/*', '/Medication/*', '/Observation/*', '/DiagnosticReport/*', '/MedicationStatement/*'],
        rateLimit: {
          requests: 200,
          window: 60000,
        },
        metadata: {
          service: 'canvas-medical',
          description: 'Canvas Medical FHIR API for EHR integration'
        }
      });
    }

    // Load Drug Interaction API keys
    const drugApiKey = process.env.DRUG_INTERACTION_API_KEY;
    const drugApiUrl = process.env.DRUG_INTERACTION_API_BASE_URL;

    if (drugApiKey && drugApiUrl) {
      this.addKey({
        name: 'drug-interaction-api',
        key: drugApiKey,
        baseURL: drugApiUrl,
        permissions: ['/interaction/*', '/medication-details/*'],
        rateLimit: {
          requests: 50,
          window: 60000,
        },
        metadata: {
          service: 'drug-interaction',
          description: 'Drug interaction checking API'
        }
      });
    }

    // Load general medical API keys (fallback)
    const medicalApiKey = process.env.MEDICAL_API_KEY;
    const medicalApiUrl = process.env.MEDICAL_API_BASE_URL;

    if (medicalApiKey && medicalApiUrl) {
      this.addKey({
        name: 'medical-api',
        key: medicalApiKey,
        baseURL: medicalApiUrl,
        permissions: ['*'],
        rateLimit: {
          requests: 100,
          window: 60000,
        },
        metadata: {
          service: 'general-medical',
          description: 'General medical API'
        }
      });
    }

    // Load RxNorm API (free, no key required but rate limited)
    const rxnormApiUrl = process.env.RXNORM_API_BASE_URL || 'https://rxnav.nlm.nih.gov/REST';
    
    this.addKey({
      name: 'rxnorm-api',
      key: 'public', // RxNorm is public API
      baseURL: rxnormApiUrl,
      permissions: ['/rxcui/*', '/drugs/*', '/interaction/*'],
      rateLimit: {
        requests: 20, // Conservative rate limit for public API
        window: 60000,
      },
      metadata: {
        service: 'rxnorm',
        description: 'RxNorm API for drug information',
        public: true
      }
    });

    // Load FHIR Test Server (for development/testing)
    if (process.env.NODE_ENV === 'development') {
      this.addKey({
        name: 'fhir-test-server',
        key: 'test-key',
        baseURL: 'https://hapi.fhir.org/baseR4',
        permissions: ['*'],
        rateLimit: {
          requests: 10,
          window: 60000,
        },
        metadata: {
          service: 'fhir-test',
          description: 'FHIR test server for development',
          development: true
        }
      });
    }
  }

  /**
   * Hash key for logging (security)
   */
  private hashKey(key: string): string {
    // Simple hash for logging - in production use proper hashing
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  }

  /**
   * Export configuration (without sensitive data)
   */
  exportConfig(): Array<Omit<ApiKeyConfig, 'key' | 'secret'>> {
    return Array.from(this.keys.values()).map(config => ({
      name: config.name,
      baseURL: config.baseURL,
      expiresAt: config.expiresAt,
      permissions: config.permissions,
      rateLimit: config.rateLimit,
      metadata: config.metadata,
    }));
  }

  /**
   * Get health status of all keys
   */
  getHealthStatus(): {
    totalKeys: number;
    activeKeys: number;
    expiredKeys: number;
    needingRotation: number;
    totalRequests: number;
    totalErrors: number;
  } {
    const now = new Date();
    let activeKeys = 0;
    let expiredKeys = 0;
    let needingRotation = 0;
    let totalRequests = 0;
    let totalErrors = 0;

    for (const [name, config] of this.keys) {
      if (config.expiresAt && config.expiresAt < now) {
        expiredKeys++;
      } else {
        activeKeys++;
      }

      if (this.needsRotation(name)) {
        needingRotation++;
      }

      const usage = this.usage.get(name);
      if (usage) {
        totalRequests += usage.requests;
        totalErrors += usage.errors;
      }
    }

    return {
      totalKeys: this.keys.size,
      activeKeys,
      expiredKeys,
      needingRotation,
      totalRequests,
      totalErrors,
    };
  }
}

// Export singleton instance
export const apiKeyManager = new ApiKeyManager({
  enabled: true,
  interval: 30 * 24 * 60 * 60 * 1000, // 30 days
  warningThreshold: 7 * 24 * 60 * 60 * 1000, // 7 days
  autoRotate: false, // Manual rotation for security
});