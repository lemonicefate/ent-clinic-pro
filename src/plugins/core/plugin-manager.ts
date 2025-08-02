/**
 * Extensible Plugin System for Astro Clinical Platform
 * 可擴展的插件系統，支持醫療功能模組化
 */

import { EventEmitter } from 'events';
import { AuditLogger } from '../../utils/security-measures';

// 插件生命週期狀態
export enum PluginState {
  UNLOADED = 'unloaded',
  LOADED = 'loaded',
  STARTED = 'started',
  STOPPED = 'stopped',
  ERROR = 'error'
}

// 插件類型定義
export enum PluginType {
  CALCULATOR = 'calculator',
  INTEGRATION = 'integration',
  VISUALIZATION = 'visualization',
  CONTENT = 'content',
  AUTHENTICATION = 'authentication',
  ANALYTICS = 'analytics',
  UTILITY = 'utility'
}

// 插件權限定義
export interface PluginPermissions {
  api: string[];
  storage: boolean;
  network: boolean;
  fileSystem: boolean;
  medicalData: boolean;
  patientData: boolean;
  adminAccess: boolean;
}

// 插件元數據
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  type: PluginType;
  category?: string;
  tags?: string[];
  homepage?: string;
  repository?: string;
  license: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  permissions: PluginPermissions;
  medicalCompliance?: {
    hipaa: boolean;
    fda: boolean;
    ce: boolean;
    iso13485: boolean;
  };
  supportedLanguages?: string[];
  minimumVersion?: string;
  maximumVersion?: string;
}

// 插件配置
export interface PluginConfig {
  enabled: boolean;
  settings: Record<string, any>;
  environment?: 'development' | 'staging' | 'production';
  apiKeys?: Record<string, string>;
  endpoints?: Record<string, string>;
  features?: Record<string, boolean>;
}

// 插件上下文 - 提供給插件的運行環境
export interface PluginContext {
  readonly pluginId: string;
  readonly config: PluginConfig;
  readonly metadata: PluginMetadata;
  readonly logger: {
    info: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    error: (message: string, error?: Error) => void;
    debug: (message: string, data?: any) => void;
  };
  readonly storage: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    delete: (key: string) => Promise<void>;
    clear: () => Promise<void>;
  };
  readonly events: EventEmitter;
  readonly utils: {
    validateMedicalData: (data: any) => boolean;
    formatDate: (date: Date, locale?: string) => string;
    sanitizeHtml: (html: string) => string;
    generateId: () => string;
  };
}

// 插件基礎介面
export interface Plugin {
  readonly metadata: PluginMetadata;
  
  // 生命週期方法
  load?(context: PluginContext): Promise<void>;
  start?(context: PluginContext): Promise<void>;
  stop?(context: PluginContext): Promise<void>;
  unload?(context: PluginContext): Promise<void>;
  
  // 配置方法
  configure?(config: PluginConfig): Promise<void>;
  validate?(config: PluginConfig): Promise<boolean>;
  
  // 健康檢查
  healthCheck?(): Promise<boolean>;
}

// 擴展點介面
export interface ExtensionPoint<T = any> {
  readonly name: string;
  readonly description: string;
  readonly type: string;
  readonly required: boolean;
  readonly multiple: boolean;
}

// 擴展實現
export interface Extension<T = any> {
  readonly extensionPoint: string;
  readonly pluginId: string;
  readonly priority: number;
  readonly implementation: T;
}

// 插件載入器介面
export interface PluginLoader {
  canLoad(source: string): boolean;
  load(source: string): Promise<Plugin>;
  unload(plugin: Plugin): Promise<void>;
}

// 插件管理器事件
export interface PluginManagerEvents {
  'plugin:loading': (pluginId: string) => void;
  'plugin:loaded': (pluginId: string, plugin: Plugin) => void;
  'plugin:starting': (pluginId: string) => void;
  'plugin:started': (pluginId: string) => void;
  'plugin:stopping': (pluginId: string) => void;
  'plugin:stopped': (pluginId: string) => void;
  'plugin:error': (pluginId: string, error: Error) => void;
  'extension:registered': (extensionPoint: string, pluginId: string) => void;
  'extension:unregistered': (extensionPoint: string, pluginId: string) => void;
}

/**
 * 插件管理器 - 核心插件系統管理類
 */
export class PluginManager extends EventEmitter {
  private plugins = new Map<string, Plugin>();
  private pluginStates = new Map<string, PluginState>();
  private pluginConfigs = new Map<string, PluginConfig>();
  private pluginContexts = new Map<string, PluginContext>();
  private extensionPoints = new Map<string, ExtensionPoint>();
  private extensions = new Map<string, Extension[]>();
  private loaders: PluginLoader[] = [];
  private startupOrder: string[] = [];
  private shutdownOrder: string[] = [];

  constructor(private readonly options: {
    pluginDirectory?: string;
    configDirectory?: string;
    enableSecurity?: boolean;
    enableAuditLog?: boolean;
    maxPlugins?: number;
    allowedTypes?: PluginType[];
  } = {}) {
    super();
    this.setupDefaultOptions();
    this.registerDefaultExtensionPoints();
  }

  private setupDefaultOptions(): void {
    this.options = {
      pluginDirectory: './plugins',
      configDirectory: './config/plugins',
      enableSecurity: true,
      enableAuditLog: true,
      maxPlugins: 50,
      allowedTypes: Object.values(PluginType),
      ...this.options
    };
  }

  private registerDefaultExtensionPoints(): void {
    // 醫療計算器擴展點
    this.registerExtensionPoint({
      name: 'medical.calculator',
      description: 'Medical calculator implementations',
      type: 'calculator',
      required: false,
      multiple: true
    });

    // API 整合擴展點
    this.registerExtensionPoint({
      name: 'medical.integration',
      description: 'External medical API integrations',
      type: 'integration',
      required: false,
      multiple: true
    });

    // 資料視覺化擴展點
    this.registerExtensionPoint({
      name: 'medical.visualization',
      description: 'Medical data visualization components',
      type: 'visualization',
      required: false,
      multiple: true
    });

    // 內容提供者擴展點
    this.registerExtensionPoint({
      name: 'medical.content',
      description: 'Medical content providers',
      type: 'content',
      required: false,
      multiple: true
    });

    // 認證提供者擴展點
    this.registerExtensionPoint({
      name: 'auth.provider',
      description: 'Authentication providers',
      type: 'authentication',
      required: false,
      multiple: true
    });

    // 分析提供者擴展點
    this.registerExtensionPoint({
      name: 'analytics.provider',
      description: 'Analytics providers',
      type: 'analytics',
      required: false,
      multiple: true
    });
  }

  /**
   * 註冊插件載入器
   */
  registerLoader(loader: PluginLoader): void {
    this.loaders.push(loader);
  }

  /**
   * 註冊擴展點
   */
  registerExtensionPoint(extensionPoint: ExtensionPoint): void {
    this.extensionPoints.set(extensionPoint.name, extensionPoint);
    this.extensions.set(extensionPoint.name, []);
  }

  /**
   * 載入插件
   */
  async loadPlugin(source: string, config?: PluginConfig): Promise<void> {
    try {
      // 找到合適的載入器
      const loader = this.loaders.find(l => l.canLoad(source));
      if (!loader) {
        throw new Error(`No suitable loader found for: ${source}`);
      }

      // 載入插件
      const plugin = await loader.load(source);
      const pluginId = plugin.metadata.id;

      // 驗證插件
      await this.validatePlugin(plugin);

      // 檢查是否已載入
      if (this.plugins.has(pluginId)) {
        throw new Error(`Plugin ${pluginId} is already loaded`);
      }

      // 檢查插件數量限制
      if (this.plugins.size >= (this.options.maxPlugins || 50)) {
        throw new Error('Maximum number of plugins reached');
      }

      this.emit('plugin:loading', pluginId);

      // 創建插件上下文
      const pluginConfig = config || await this.loadPluginConfig(pluginId);
      const context = this.createPluginContext(plugin, pluginConfig);

      // 儲存插件資訊
      this.plugins.set(pluginId, plugin);
      this.pluginStates.set(pluginId, PluginState.LOADED);
      this.pluginConfigs.set(pluginId, pluginConfig);
      this.pluginContexts.set(pluginId, context);

      // 執行插件載入
      if (plugin.load) {
        await plugin.load(context);
      }

      this.emit('plugin:loaded', pluginId, plugin);

      // 記錄審計日誌
      if (this.options.enableAuditLog) {
        AuditLogger.logSecurityEvent(
          'plugin_loaded',
          { request: { url: 'plugin-manager' } } as any,
          true,
          {
            pluginId,
            pluginName: plugin.metadata.name,
            version: plugin.metadata.version,
            type: plugin.metadata.type
          },
          'medium'
        );
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('plugin:error', source, new Error(errorMessage));
      throw error;
    }
  }

  /**
   * 啟動插件
   */
  async startPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    const context = this.pluginContexts.get(pluginId);

    if (!plugin || !context) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    const currentState = this.pluginStates.get(pluginId);
    if (currentState === PluginState.STARTED) {
      return; // 已經啟動
    }

    if (currentState !== PluginState.LOADED) {
      throw new Error(`Plugin ${pluginId} must be loaded before starting`);
    }

    try {
      this.emit('plugin:starting', pluginId);

      // 執行插件啟動
      if (plugin.start) {
        await plugin.start(context);
      }

      this.pluginStates.set(pluginId, PluginState.STARTED);
      this.emit('plugin:started', pluginId);

      // 記錄審計日誌
      if (this.options.enableAuditLog) {
        AuditLogger.logSecurityEvent(
          'plugin_started',
          { request: { url: 'plugin-manager' } } as any,
          true,
          { pluginId, pluginName: plugin.metadata.name },
          'low'
        );
      }

    } catch (error) {
      this.pluginStates.set(pluginId, PluginState.ERROR);
      this.emit('plugin:error', pluginId, error as Error);
      throw error;
    }
  }

  /**
   * 停止插件
   */
  async stopPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    const context = this.pluginContexts.get(pluginId);

    if (!plugin || !context) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    const currentState = this.pluginStates.get(pluginId);
    if (currentState === PluginState.STOPPED || currentState === PluginState.UNLOADED) {
      return; // 已經停止
    }

    try {
      this.emit('plugin:stopping', pluginId);

      // 執行插件停止
      if (plugin.stop) {
        await plugin.stop(context);
      }

      this.pluginStates.set(pluginId, PluginState.STOPPED);
      this.emit('plugin:stopped', pluginId);

      // 記錄審計日誌
      if (this.options.enableAuditLog) {
        AuditLogger.logSecurityEvent(
          'plugin_stopped',
          { request: { url: 'plugin-manager' } } as any,
          true,
          { pluginId, pluginName: plugin.metadata.name },
          'low'
        );
      }

    } catch (error) {
      this.pluginStates.set(pluginId, PluginState.ERROR);
      this.emit('plugin:error', pluginId, error as Error);
      throw error;
    }
  }

  /**
   * 卸載插件
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    const context = this.pluginContexts.get(pluginId);

    if (!plugin || !context) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    try {
      // 先停止插件
      await this.stopPlugin(pluginId);

      // 執行插件卸載
      if (plugin.unload) {
        await plugin.unload(context);
      }

      // 移除所有擴展
      this.unregisterAllExtensions(pluginId);

      // 清理資源
      this.plugins.delete(pluginId);
      this.pluginStates.delete(pluginId);
      this.pluginConfigs.delete(pluginId);
      this.pluginContexts.delete(pluginId);

      // 記錄審計日誌
      if (this.options.enableAuditLog) {
        AuditLogger.logSecurityEvent(
          'plugin_unloaded',
          { request: { url: 'plugin-manager' } } as any,
          true,
          { pluginId, pluginName: plugin.metadata.name },
          'medium'
        );
      }

    } catch (error) {
      this.emit('plugin:error', pluginId, error as Error);
      throw error;
    }
  }

  /**
   * 註冊擴展
   */
  registerExtension<T>(extension: Extension<T>): void {
    const extensionPoint = this.extensionPoints.get(extension.extensionPoint);
    if (!extensionPoint) {
      throw new Error(`Extension point ${extension.extensionPoint} not found`);
    }

    const extensions = this.extensions.get(extension.extensionPoint) || [];
    
    // 檢查是否允許多個擴展
    if (!extensionPoint.multiple && extensions.length > 0) {
      throw new Error(`Extension point ${extension.extensionPoint} only allows single extension`);
    }

    // 按優先級插入
    const insertIndex = extensions.findIndex(ext => ext.priority < extension.priority);
    if (insertIndex === -1) {
      extensions.push(extension);
    } else {
      extensions.splice(insertIndex, 0, extension);
    }

    this.extensions.set(extension.extensionPoint, extensions);
    this.emit('extension:registered', extension.extensionPoint, extension.pluginId);
  }

  /**
   * 獲取擴展
   */
  getExtensions<T>(extensionPointName: string): Extension<T>[] {
    return (this.extensions.get(extensionPointName) || []) as Extension<T>[];
  }

  /**
   * 獲取擴展實現
   */
  getExtensionImplementations<T>(extensionPointName: string): T[] {
    const extensions = this.getExtensions<T>(extensionPointName);
    return extensions.map(ext => ext.implementation);
  }

  /**
   * 批量載入插件
   */
  async loadPlugins(sources: string[]): Promise<void> {
    const loadPromises = sources.map(source => this.loadPlugin(source));
    await Promise.allSettled(loadPromises);
  }

  /**
   * 批量啟動插件
   */
  async startPlugins(pluginIds?: string[]): Promise<void> {
    const idsToStart = pluginIds || Array.from(this.plugins.keys());
    
    // 按依賴順序啟動
    const sortedIds = this.sortPluginsByDependencies(idsToStart);
    
    for (const pluginId of sortedIds) {
      try {
        await this.startPlugin(pluginId);
      } catch (error) {
        console.error(`Failed to start plugin ${pluginId}:`, error);
      }
    }
  }

  /**
   * 批量停止插件
   */
  async stopPlugins(pluginIds?: string[]): Promise<void> {
    const idsToStop = pluginIds || Array.from(this.plugins.keys());
    
    // 按反向依賴順序停止
    const sortedIds = this.sortPluginsByDependencies(idsToStop).reverse();
    
    for (const pluginId of sortedIds) {
      try {
        await this.stopPlugin(pluginId);
      } catch (error) {
        console.error(`Failed to stop plugin ${pluginId}:`, error);
      }
    }
  }

  /**
   * 獲取插件資訊
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * 獲取插件狀態
   */
  getPluginState(pluginId: string): PluginState | undefined {
    return this.pluginStates.get(pluginId);
  }

  /**
   * 獲取所有插件
   */
  getAllPlugins(): Map<string, Plugin> {
    return new Map(this.plugins);
  }

  /**
   * 獲取插件統計資訊
   */
  getStats(): {
    totalPlugins: number;
    loadedPlugins: number;
    startedPlugins: number;
    errorPlugins: number;
    extensionPoints: number;
    totalExtensions: number;
  } {
    const states = Array.from(this.pluginStates.values());
    
    return {
      totalPlugins: this.plugins.size,
      loadedPlugins: states.filter(s => s === PluginState.LOADED).length,
      startedPlugins: states.filter(s => s === PluginState.STARTED).length,
      errorPlugins: states.filter(s => s === PluginState.ERROR).length,
      extensionPoints: this.extensionPoints.size,
      totalExtensions: Array.from(this.extensions.values()).reduce((sum, exts) => sum + exts.length, 0)
    };
  }

  /**
   * 健康檢查
   */
  async healthCheck(): Promise<{
    overall: boolean;
    plugins: Record<string, boolean>;
  }> {
    const results: Record<string, boolean> = {};
    let overall = true;

    for (const [pluginId, plugin] of this.plugins) {
      try {
        const isHealthy = plugin.healthCheck ? await plugin.healthCheck() : true;
        results[pluginId] = isHealthy;
        if (!isHealthy) overall = false;
      } catch (error) {
        results[pluginId] = false;
        overall = false;
      }
    }

    return { overall, plugins: results };
  }

  // 私有方法

  private async validatePlugin(plugin: Plugin): Promise<void> {
    const metadata = plugin.metadata;

    // 基本驗證
    if (!metadata.id || !metadata.name || !metadata.version) {
      throw new Error('Plugin metadata must include id, name, and version');
    }

    // 類型驗證
    if (!this.options.allowedTypes?.includes(metadata.type)) {
      throw new Error(`Plugin type ${metadata.type} is not allowed`);
    }

    // 權限驗證
    if (this.options.enableSecurity) {
      await this.validatePluginPermissions(metadata.permissions);
    }

    // 醫療合規驗證
    if (metadata.medicalCompliance) {
      await this.validateMedicalCompliance(metadata.medicalCompliance);
    }
  }

  private async validatePluginPermissions(permissions: PluginPermissions): Promise<void> {
    // 檢查敏感權限
    if (permissions.patientData || permissions.medicalData) {
      // 在生產環境中，這裡應該有更嚴格的驗證
      console.warn('Plugin requests access to sensitive medical data');
    }

    if (permissions.adminAccess) {
      throw new Error('Admin access is not allowed for plugins');
    }
  }

  private async validateMedicalCompliance(compliance: any): Promise<void> {
    // 驗證醫療合規性聲明
    // 在實際實現中，這裡應該檢查相關證書和合規文件
    if (compliance.fda && !compliance.iso13485) {
      console.warn('FDA compliance claimed without ISO 13485');
    }
  }

  private createPluginContext(plugin: Plugin, config: PluginConfig): PluginContext {
    const pluginId = plugin.metadata.id;

    return {
      pluginId,
      config,
      metadata: plugin.metadata,
      logger: {
        info: (message: string, data?: any) => console.log(`[${pluginId}] ${message}`, data),
        warn: (message: string, data?: any) => console.warn(`[${pluginId}] ${message}`, data),
        error: (message: string, error?: Error) => console.error(`[${pluginId}] ${message}`, error),
        debug: (message: string, data?: any) => console.debug(`[${pluginId}] ${message}`, data)
      },
      storage: {
        get: async (key: string) => {
          // 實現插件專用儲存
          const storageKey = `plugin:${pluginId}:${key}`;
          return localStorage.getItem(storageKey);
        },
        set: async (key: string, value: any) => {
          const storageKey = `plugin:${pluginId}:${key}`;
          localStorage.setItem(storageKey, JSON.stringify(value));
        },
        delete: async (key: string) => {
          const storageKey = `plugin:${pluginId}:${key}`;
          localStorage.removeItem(storageKey);
        },
        clear: async () => {
          // 清除該插件的所有儲存
          const prefix = `plugin:${pluginId}:`;
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(prefix)) {
              localStorage.removeItem(key);
            }
          });
        }
      },
      events: this,
      utils: {
        validateMedicalData: (data: any) => {
          // 實現醫療資料驗證
          return typeof data === 'object' && data !== null;
        },
        formatDate: (date: Date, locale = 'en-US') => {
          return date.toLocaleDateString(locale);
        },
        sanitizeHtml: (html: string) => {
          // 簡單的 HTML 清理，實際應使用專業庫
          return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        },
        generateId: () => {
          return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
      }
    };
  }

  private async loadPluginConfig(pluginId: string): Promise<PluginConfig> {
    // 預設配置
    return {
      enabled: true,
      settings: {},
      environment: process.env.NODE_ENV as any || 'development'
    };
  }

  private sortPluginsByDependencies(pluginIds: string[]): string[] {
    // 簡單的拓撲排序實現
    // 在實際實現中應該處理循環依賴
    const sorted: string[] = [];
    const visited = new Set<string>();

    const visit = (pluginId: string) => {
      if (visited.has(pluginId)) return;
      visited.add(pluginId);

      const plugin = this.plugins.get(pluginId);
      if (plugin?.metadata.dependencies) {
        Object.keys(plugin.metadata.dependencies).forEach(depId => {
          if (pluginIds.includes(depId)) {
            visit(depId);
          }
        });
      }

      sorted.push(pluginId);
    };

    pluginIds.forEach(visit);
    return sorted;
  }

  private unregisterAllExtensions(pluginId: string): void {
    for (const [extensionPointName, extensions] of this.extensions) {
      const filtered = extensions.filter(ext => ext.pluginId !== pluginId);
      this.extensions.set(extensionPointName, filtered);
      
      if (filtered.length !== extensions.length) {
        this.emit('extension:unregistered', extensionPointName, pluginId);
      }
    }
  }
}

// 導出單例實例
export const pluginManager = new PluginManager({
  enableSecurity: true,
  enableAuditLog: true,
  maxPlugins: 100,
  allowedTypes: [
    PluginType.CALCULATOR,
    PluginType.INTEGRATION,
    PluginType.VISUALIZATION,
    PluginType.CONTENT,
    PluginType.ANALYTICS,
    PluginType.UTILITY
  ]
});