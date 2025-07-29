/**
 * Plugin Configuration Management System
 * 插件配置管理系統 - 管理插件配置、環境變數和設定
 */

import type { PluginConfig, PluginMetadata } from '../core/plugin-manager';
import { AuditLogger } from '../../utils/security-measures';

// 配置模板定義
export interface ConfigTemplate {
  id: string;
  name: string;
  description: string;
  schema: ConfigSchema;
  defaultValues: Record<string, any>;
  environments: string[];
}

// 配置架構定義
export interface ConfigSchema {
  type: 'object';
  properties: Record<string, ConfigProperty>;
  required?: string[];
}

export interface ConfigProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  default?: any;
  enum?: any[];
  minimum?: number;
  maximum?: number;
  pattern?: string;
  items?: ConfigProperty;
  properties?: Record<string, ConfigProperty>;
  sensitive?: boolean; // 標記敏感資料如 API keys
}

// 配置驗證結果
export interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
  warnings: ConfigValidationWarning[];
}

export interface ConfigValidationError {
  path: string;
  message: string;
  value?: any;
}

export interface ConfigValidationWarning {
  path: string;
  message: string;
  suggestion?: string;
}

// 配置變更事件
export interface ConfigChangeEvent {
  pluginId: string;
  path: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
  userId?: string;
}

/**
 * 插件配置管理器
 */
export class PluginConfigManager {
  private configs = new Map<string, PluginConfig>();
  private templates = new Map<string, ConfigTemplate>();
  private changeHistory: ConfigChangeEvent[] = [];
  private watchers = new Map<string, Array<(event: ConfigChangeEvent) => void>>();

  constructor(private readonly options: {
    configDirectory?: string;
    enableEncryption?: boolean;
    enableAuditLog?: boolean;
    maxHistorySize?: number;
  } = {}) {
    this.options = {
      configDirectory: './config/plugins',
      enableEncryption: true,
      enableAuditLog: true,
      maxHistorySize: 1000,
      ...options
    };

    this.loadBuiltinTemplates();
  }

  /**
   * 註冊配置模板
   */
  registerTemplate(template: ConfigTemplate): void {
    this.validateTemplate(template);
    this.templates.set(template.id, template);
  }

  /**
   * 獲取配置模板
   */
  getTemplate(templateId: string): ConfigTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * 創建插件配置
   */
  async createConfig(
    pluginId: string,
    templateId: string,
    environment: string = 'development',
    customSettings: Record<string, any> = {}
  ): Promise<PluginConfig> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Configuration template ${templateId} not found`);
    }

    if (!template.environments.includes(environment)) {
      throw new Error(`Environment ${environment} not supported by template ${templateId}`);
    }

    // 合併預設值和自定義設定
    const settings = { ...template.defaultValues, ...customSettings };

    // 驗證配置
    const validation = this.validateConfig(settings, template.schema);
    if (!validation.valid) {
      throw new Error(`Configuration validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    const config: PluginConfig = {
      enabled: true,
      settings,
      environment: environment as any,
      apiKeys: {},
      endpoints: {},
      features: {}
    };

    // 儲存配置
    this.configs.set(pluginId, config);
    await this.saveConfig(pluginId, config);

    // 記錄審計日誌
    if (this.options.enableAuditLog) {
      AuditLogger.logSecurityEvent(
        'plugin_config_created',
        { request: { url: 'plugin-config' } } as any,
        true,
        { pluginId, templateId, environment },
        'low'
      );
    }

    return config;
  }

  /**
   * 獲取插件配置
   */
  async getConfig(pluginId: string): Promise<PluginConfig | undefined> {
    // 先從記憶體獲取
    let config = this.configs.get(pluginId);
    
    if (!config) {
      // 從檔案載入
      config = await this.loadConfig(pluginId);
      if (config) {
        this.configs.set(pluginId, config);
      }
    }

    return config;
  }

  /**
   * 更新插件配置
   */
  async updateConfig(
    pluginId: string,
    updates: Partial<PluginConfig>,
    userId?: string
  ): Promise<void> {
    const currentConfig = await this.getConfig(pluginId);
    if (!currentConfig) {
      throw new Error(`Configuration for plugin ${pluginId} not found`);
    }

    // 記錄變更
    const changes: ConfigChangeEvent[] = [];
    
    for (const [key, newValue] of Object.entries(updates)) {
      const oldValue = (currentConfig as any)[key];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          pluginId,
          path: key,
          oldValue,
          newValue,
          timestamp: new Date(),
          userId
        });
      }
    }

    // 更新配置
    const updatedConfig = { ...currentConfig, ...updates };

    // 驗證更新後的配置
    if (updates.settings) {
      const template = this.findTemplateForPlugin(pluginId);
      if (template) {
        const validation = this.validateConfig(updatedConfig.settings, template.schema);
        if (!validation.valid) {
          throw new Error(`Configuration validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        }
      }
    }

    // 儲存配置
    this.configs.set(pluginId, updatedConfig);
    await this.saveConfig(pluginId, updatedConfig);

    // 記錄變更歷史
    this.changeHistory.push(...changes);
    this.trimChangeHistory();

    // 通知監聽者
    changes.forEach(change => {
      this.notifyWatchers(pluginId, change);
    });

    // 記錄審計日誌
    if (this.options.enableAuditLog && changes.length > 0) {
      AuditLogger.logSecurityEvent(
        'plugin_config_updated',
        { request: { url: 'plugin-config' } } as any,
        true,
        { pluginId, changes: changes.length, userId },
        'medium'
      );
    }
  }

  /**
   * 刪除插件配置
   */
  async deleteConfig(pluginId: string, userId?: string): Promise<void> {
    const config = this.configs.get(pluginId);
    if (!config) {
      return; // 配置不存在
    }

    // 從記憶體移除
    this.configs.delete(pluginId);

    // 從檔案系統移除
    await this.removeConfigFile(pluginId);

    // 記錄變更
    const changeEvent: ConfigChangeEvent = {
      pluginId,
      path: '*',
      oldValue: config,
      newValue: null,
      timestamp: new Date(),
      userId
    };

    this.changeHistory.push(changeEvent);
    this.trimChangeHistory();

    // 通知監聽者
    this.notifyWatchers(pluginId, changeEvent);

    // 記錄審計日誌
    if (this.options.enableAuditLog) {
      AuditLogger.logSecurityEvent(
        'plugin_config_deleted',
        { request: { url: 'plugin-config' } } as any,
        true,
        { pluginId, userId },
        'medium'
      );
    }
  }

  /**
   * 驗證配置
   */
  validateConfig(config: any, schema: ConfigSchema): ConfigValidationResult {
    const errors: ConfigValidationError[] = [];
    const warnings: ConfigValidationWarning[] = [];

    this.validateObject(config, schema, '', errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 監聽配置變更
   */
  watchConfig(pluginId: string, callback: (event: ConfigChangeEvent) => void): () => void {
    const watchers = this.watchers.get(pluginId) || [];
    watchers.push(callback);
    this.watchers.set(pluginId, watchers);

    // 返回取消監聽的函數
    return () => {
      const currentWatchers = this.watchers.get(pluginId) || [];
      const index = currentWatchers.indexOf(callback);
      if (index > -1) {
        currentWatchers.splice(index, 1);
        if (currentWatchers.length === 0) {
          this.watchers.delete(pluginId);
        } else {
          this.watchers.set(pluginId, currentWatchers);
        }
      }
    };
  }

  /**
   * 獲取配置變更歷史
   */
  getChangeHistory(pluginId?: string, limit?: number): ConfigChangeEvent[] {
    let history = this.changeHistory;

    if (pluginId) {
      history = history.filter(event => event.pluginId === pluginId);
    }

    if (limit) {
      history = history.slice(-limit);
    }

    return history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * 匯出配置
   */
  async exportConfig(pluginId: string, includeSecrets: boolean = false): Promise<string> {
    const config = await this.getConfig(pluginId);
    if (!config) {
      throw new Error(`Configuration for plugin ${pluginId} not found`);
    }

    const exportData = { ...config };

    // 如果不包含機密資料，則移除敏感欄位
    if (!includeSecrets) {
      exportData.apiKeys = {};
      
      // 移除標記為敏感的設定
      const template = this.findTemplateForPlugin(pluginId);
      if (template) {
        this.removeSensitiveFields(exportData.settings, template.schema);
      }
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 匯入配置
   */
  async importConfig(pluginId: string, configData: string, userId?: string): Promise<void> {
    try {
      const config = JSON.parse(configData) as PluginConfig;
      
      // 驗證配置格式
      if (!config.settings || typeof config.settings !== 'object') {
        throw new Error('Invalid configuration format');
      }

      // 驗證配置內容
      const template = this.findTemplateForPlugin(pluginId);
      if (template) {
        const validation = this.validateConfig(config.settings, template.schema);
        if (!validation.valid) {
          throw new Error(`Configuration validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        }
      }

      // 更新配置
      await this.updateConfig(pluginId, config, userId);

    } catch (error) {
      throw new Error(`Failed to import configuration: ${error.message}`);
    }
  }

  /**
   * 獲取所有配置模板
   */
  getAllTemplates(): ConfigTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * 獲取配置統計
   */
  getStats(): {
    totalConfigs: number;
    configsByEnvironment: Record<string, number>;
    totalTemplates: number;
    totalChanges: number;
    activeWatchers: number;
  } {
    const configsByEnvironment: Record<string, number> = {};
    
    for (const config of this.configs.values()) {
      const env = config.environment || 'unknown';
      configsByEnvironment[env] = (configsByEnvironment[env] || 0) + 1;
    }

    return {
      totalConfigs: this.configs.size,
      configsByEnvironment,
      totalTemplates: this.templates.size,
      totalChanges: this.changeHistory.length,
      activeWatchers: Array.from(this.watchers.values()).reduce((sum, watchers) => sum + watchers.length, 0)
    };
  }

  // 私有方法

  private validateTemplate(template: ConfigTemplate): void {
    if (!template.id || !template.name || !template.schema) {
      throw new Error('Template must have id, name, and schema');
    }

    if (!template.environments || template.environments.length === 0) {
      throw new Error('Template must specify supported environments');
    }
  }

  private validateObject(
    obj: any,
    schema: ConfigSchema,
    path: string,
    errors: ConfigValidationError[],
    warnings: ConfigValidationWarning[]
  ): void {
    if (typeof obj !== 'object' || obj === null) {
      errors.push({
        path,
        message: 'Expected object',
        value: obj
      });
      return;
    }

    // 檢查必填欄位
    if (schema.required) {
      for (const requiredField of schema.required) {
        if (!(requiredField in obj)) {
          errors.push({
            path: path ? `${path}.${requiredField}` : requiredField,
            message: 'Required field is missing'
          });
        }
      }
    }

    // 驗證屬性
    for (const [key, property] of Object.entries(schema.properties)) {
      const fieldPath = path ? `${path}.${key}` : key;
      const value = obj[key];

      if (value !== undefined) {
        this.validateProperty(value, property, fieldPath, errors, warnings);
      }
    }
  }

  private validateProperty(
    value: any,
    property: ConfigProperty,
    path: string,
    errors: ConfigValidationError[],
    warnings: ConfigValidationWarning[]
  ): void {
    // 類型檢查
    if (!this.isValidType(value, property.type)) {
      errors.push({
        path,
        message: `Expected ${property.type}, got ${typeof value}`,
        value
      });
      return;
    }

    // 枚舉檢查
    if (property.enum && !property.enum.includes(value)) {
      errors.push({
        path,
        message: `Value must be one of: ${property.enum.join(', ')}`,
        value
      });
    }

    // 數值範圍檢查
    if (property.type === 'number') {
      if (property.minimum !== undefined && value < property.minimum) {
        errors.push({
          path,
          message: `Value must be >= ${property.minimum}`,
          value
        });
      }
      if (property.maximum !== undefined && value > property.maximum) {
        errors.push({
          path,
          message: `Value must be <= ${property.maximum}`,
          value
        });
      }
    }

    // 字串模式檢查
    if (property.type === 'string' && property.pattern) {
      const regex = new RegExp(property.pattern);
      if (!regex.test(value)) {
        errors.push({
          path,
          message: `Value does not match pattern: ${property.pattern}`,
          value
        });
      }
    }

    // 陣列項目檢查
    if (property.type === 'array' && property.items && Array.isArray(value)) {
      value.forEach((item, index) => {
        this.validateProperty(item, property.items!, `${path}[${index}]`, errors, warnings);
      });
    }

    // 物件屬性檢查
    if (property.type === 'object' && property.properties) {
      this.validateObject(value, { type: 'object', properties: property.properties }, path, errors, warnings);
    }
  }

  private isValidType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return false;
    }
  }

  private async loadConfig(pluginId: string): Promise<PluginConfig | undefined> {
    try {
      // 在實際實現中，這裡應該從檔案系統載入
      const configPath = `${this.options.configDirectory}/${pluginId}.json`;
      
      // 模擬檔案載入
      const stored = localStorage.getItem(`plugin-config:${pluginId}`);
      if (stored) {
        return JSON.parse(stored);
      }
      
      return undefined;
    } catch (error) {
      console.error(`Failed to load config for plugin ${pluginId}:`, error);
      return undefined;
    }
  }

  private async saveConfig(pluginId: string, config: PluginConfig): Promise<void> {
    try {
      // 在實際實現中，這裡應該儲存到檔案系統
      const configData = { ...config };
      
      // 加密敏感資料
      if (this.options.enableEncryption) {
        configData.apiKeys = this.encryptSensitiveData(config.apiKeys || {});
      }

      // 模擬檔案儲存
      localStorage.setItem(`plugin-config:${pluginId}`, JSON.stringify(configData));
    } catch (error) {
      throw new Error(`Failed to save config for plugin ${pluginId}: ${error.message}`);
    }
  }

  private async removeConfigFile(pluginId: string): Promise<void> {
    try {
      // 模擬檔案刪除
      localStorage.removeItem(`plugin-config:${pluginId}`);
    } catch (error) {
      console.error(`Failed to remove config file for plugin ${pluginId}:`, error);
    }
  }

  private findTemplateForPlugin(pluginId: string): ConfigTemplate | undefined {
    // 在實際實現中，這裡應該根據插件元數據找到對應的模板
    // 目前返回通用模板
    return this.templates.get('generic');
  }

  private encryptSensitiveData(data: Record<string, string>): Record<string, string> {
    // 在實際實現中，這裡應該使用真正的加密
    const encrypted: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      encrypted[key] = btoa(value); // 簡單的 base64 編碼作為示例
    }
    return encrypted;
  }

  private removeSensitiveFields(settings: any, schema: ConfigSchema): void {
    for (const [key, property] of Object.entries(schema.properties)) {
      if (property.sensitive && key in settings) {
        delete settings[key];
      }
      
      if (property.type === 'object' && property.properties && settings[key]) {
        this.removeSensitiveFields(settings[key], { type: 'object', properties: property.properties });
      }
    }
  }

  private notifyWatchers(pluginId: string, event: ConfigChangeEvent): void {
    const watchers = this.watchers.get(pluginId);
    if (watchers) {
      watchers.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in config change watcher:', error);
        }
      });
    }
  }

  private trimChangeHistory(): void {
    const maxSize = this.options.maxHistorySize || 1000;
    if (this.changeHistory.length > maxSize) {
      this.changeHistory = this.changeHistory.slice(-maxSize);
    }
  }

  private loadBuiltinTemplates(): void {
    // 通用插件配置模板
    this.registerTemplate({
      id: 'generic',
      name: 'Generic Plugin Configuration',
      description: 'Basic configuration template for all plugins',
      schema: {
        type: 'object',
        properties: {
          debug: {
            type: 'boolean',
            description: 'Enable debug logging',
            default: false
          },
          timeout: {
            type: 'number',
            description: 'Operation timeout in milliseconds',
            default: 30000,
            minimum: 1000,
            maximum: 300000
          },
          retries: {
            type: 'number',
            description: 'Number of retry attempts',
            default: 3,
            minimum: 0,
            maximum: 10
          }
        }
      },
      defaultValues: {
        debug: false,
        timeout: 30000,
        retries: 3
      },
      environments: ['development', 'staging', 'production']
    });

    // 醫療計算器配置模板
    this.registerTemplate({
      id: 'medical-calculator',
      name: 'Medical Calculator Configuration',
      description: 'Configuration template for medical calculator plugins',
      schema: {
        type: 'object',
        properties: {
          precision: {
            type: 'number',
            description: 'Calculation precision (decimal places)',
            default: 2,
            minimum: 0,
            maximum: 10
          },
          units: {
            type: 'string',
            description: 'Default unit system',
            enum: ['metric', 'imperial'],
            default: 'metric'
          },
          validation: {
            type: 'object',
            description: 'Input validation settings',
            properties: {
              strict: {
                type: 'boolean',
                description: 'Enable strict validation',
                default: true
              },
              allowNegative: {
                type: 'boolean',
                description: 'Allow negative values',
                default: false
              }
            }
          }
        },
        required: ['precision', 'units']
      },
      defaultValues: {
        precision: 2,
        units: 'metric',
        validation: {
          strict: true,
          allowNegative: false
        }
      },
      environments: ['development', 'staging', 'production']
    });

    // API 整合配置模板
    this.registerTemplate({
      id: 'api-integration',
      name: 'API Integration Configuration',
      description: 'Configuration template for API integration plugins',
      schema: {
        type: 'object',
        properties: {
          baseUrl: {
            type: 'string',
            description: 'API base URL',
            pattern: '^https?://.+'
          },
          apiKey: {
            type: 'string',
            description: 'API authentication key',
            sensitive: true
          },
          timeout: {
            type: 'number',
            description: 'Request timeout in milliseconds',
            default: 30000,
            minimum: 1000,
            maximum: 120000
          },
          rateLimit: {
            type: 'object',
            description: 'Rate limiting settings',
            properties: {
              requests: {
                type: 'number',
                description: 'Requests per window',
                default: 100,
                minimum: 1
              },
              window: {
                type: 'number',
                description: 'Time window in milliseconds',
                default: 60000,
                minimum: 1000
              }
            }
          }
        },
        required: ['baseUrl']
      },
      defaultValues: {
        timeout: 30000,
        rateLimit: {
          requests: 100,
          window: 60000
        }
      },
      environments: ['development', 'staging', 'production']
    });
  }
}

// 導出單例實例
export const pluginConfigManager = new PluginConfigManager({
  enableEncryption: process.env.NODE_ENV === 'production',
  enableAuditLog: true,
  maxHistorySize: 1000
});