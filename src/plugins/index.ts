/**
 * Astro Clinical Platform - Plugin System Integration
 * 插件系統整合 - 統一的插件系統 API 入口
 */

// Core exports
export { 
  PluginManager, 
  PluginState, 
  PluginType,
  pluginManager,
  type Plugin,
  type PluginMetadata,
  type PluginContext,
  type PluginConfig,
  type PluginPermissions,
  type ExtensionPoint,
  type Extension
} from './core/plugin-manager';

// Loaders
export {
  ModulePluginLoader,
  JsonPluginLoader,
  RemotePluginLoader,
  CompositePluginLoader,
  createDefaultPluginLoader
} from './loaders/module-plugin-loader';

// Security
export {
  PluginSecurityManager,
  createDefaultSecurityManager,
  type SecurityPolicy,
  type PermissionCheckResult,
  SecurityEventType,
  type SecurityEvent
} from './security/plugin-security';

// Registry
export {
  PluginRegistry,
  PluginRegistrationStatus,
  pluginRegistry,
  type PluginRegistration,
  type PluginSearchOptions,
  type PluginSearchResult,
  type PluginReview,
  type PluginPublisher,
  type MarketplaceStats
} from './registry/plugin-registry';

// Configuration
export {
  PluginConfigManager,
  pluginConfigManager,
  type ConfigTemplate,
  type ConfigSchema,
  type ConfigProperty,
  type ConfigValidationResult,
  type ConfigChangeEvent
} from './config/plugin-config-manager';

// Marketplace
export {
  PluginMarketplace,
  pluginMarketplace,
  type InstallOptions,
  type InstallResult,
  type UpdateInfo,
  type MarketplaceMetrics
} from './marketplace/plugin-marketplace';

// Examples
export { default as MedicalAnalyticsPlugin } from './examples/medical-analytics-plugin';

/**
 * 插件系統初始化函數
 * 設置完整的插件系統環境
 */
export async function initializePluginSystem(options: {
  enableSecurity?: boolean;
  enableMarketplace?: boolean;
  enableAutoUpdates?: boolean;
  pluginDirectory?: string;
  configDirectory?: string;
  allowedDomains?: string[];
  maxPlugins?: number;
} = {}): Promise<{
  pluginManager: PluginManager;
  marketplace: PluginMarketplace;
  configManager: PluginConfigManager;
  registry: PluginRegistry;
}> {
  const {
    enableSecurity = true,
    enableMarketplace = true,
    enableAutoUpdates = false,
    pluginDirectory = './plugins',
    configDirectory = './config/plugins',
    allowedDomains = [],
    maxPlugins = 100
  } = options;

  // 設置插件載入器
  const loader = createDefaultPluginLoader();
  pluginManager.registerLoader(loader);

  // 註冊預設擴展點
  await registerDefaultExtensionPoints();

  // 載入內建插件
  await loadBuiltinPlugins();

  // 設置全域插件管理器引用
  (globalThis as any).pluginManager = pluginManager;
  (globalThis as any).pluginRegistry = pluginRegistry;
  (globalThis as any).pluginConfigManager = pluginConfigManager;
  (globalThis as any).pluginMarketplace = pluginMarketplace;

  console.log('Plugin system initialized successfully');

  return {
    pluginManager,
    marketplace: pluginMarketplace,
    configManager: pluginConfigManager,
    registry: pluginRegistry
  };
}

/**
 * 註冊預設擴展點
 */
async function registerDefaultExtensionPoints(): Promise<void> {
  // 醫療計算器擴展點
  pluginManager.registerExtensionPoint({
    name: 'medical.calculator',
    description: 'Medical calculator implementations',
    type: 'calculator',
    required: false,
    multiple: true
  });

  // API 整合擴展點
  pluginManager.registerExtensionPoint({
    name: 'medical.integration',
    description: 'External medical API integrations',
    type: 'integration',
    required: false,
    multiple: true
  });

  // 資料視覺化擴展點
  pluginManager.registerExtensionPoint({
    name: 'medical.visualization',
    description: 'Medical data visualization components',
    type: 'visualization',
    required: false,
    multiple: true
  });

  // 內容提供者擴展點
  pluginManager.registerExtensionPoint({
    name: 'medical.content',
    description: 'Medical content providers',
    type: 'content',
    required: false,
    multiple: true
  });

  // 認證提供者擴展點
  pluginManager.registerExtensionPoint({
    name: 'auth.provider',
    description: 'Authentication providers',
    type: 'authentication',
    required: false,
    multiple: true
  });

  // 分析提供者擴展點
  pluginManager.registerExtensionPoint({
    name: 'analytics.provider',
    description: 'Analytics providers',
    type: 'analytics',
    required: false,
    multiple: true
  });
}

/**
 * 載入內建插件
 */
async function loadBuiltinPlugins(): Promise<void> {
  try {
    // 載入醫療分析插件
    await pluginManager.loadPlugin('./src/plugins/examples/medical-analytics-plugin.ts');
    await pluginManager.startPlugin('medical-analytics');
    
    console.log('Built-in plugins loaded successfully');
  } catch (error) {
    console.warn('Some built-in plugins failed to load:', error);
  }
}

/**
 * 插件系統健康檢查
 */
export async function performSystemHealthCheck(): Promise<{
  overall: boolean;
  components: {
    pluginManager: boolean;
    registry: boolean;
    configManager: boolean;
    marketplace: boolean;
  };
  plugins: Record<string, boolean>;
  issues: string[];
}> {
  const issues: string[] = [];
  
  // 檢查插件管理器
  const pluginHealth = await pluginManager.healthCheck();
  if (!pluginHealth.overall) {
    issues.push('Plugin manager health check failed');
  }

  // 檢查註冊表
  let registryHealthy = true;
  try {
    const stats = pluginRegistry.getMarketplaceStats();
    if (stats.totalPlugins < 0) {
      registryHealthy = false;
      issues.push('Plugin registry returned invalid statistics');
    }
  } catch (error) {
    registryHealthy = false;
    issues.push(`Plugin registry error: ${error.message}`);
  }

  // 檢查配置管理器
  let configHealthy = true;
  try {
    const configStats = pluginConfigManager.getStats();
    if (configStats.totalConfigs < 0) {
      configHealthy = false;
      issues.push('Config manager returned invalid statistics');
    }
  } catch (error) {
    configHealthy = false;
    issues.push(`Config manager error: ${error.message}`);
  }

  // 檢查市場
  let marketplaceHealthy = true;
  try {
    await pluginMarketplace.getMarketplaceMetrics();
  } catch (error) {
    marketplaceHealthy = false;
    issues.push(`Marketplace error: ${error.message}`);
  }

  const overall = pluginHealth.overall && registryHealthy && configHealthy && marketplaceHealthy;

  return {
    overall,
    components: {
      pluginManager: pluginHealth.overall,
      registry: registryHealthy,
      configManager: configHealthy,
      marketplace: marketplaceHealthy
    },
    plugins: pluginHealth.plugins,
    issues
  };
}

/**
 * 獲取插件系統統計資訊
 */
export async function getSystemStats(): Promise<{
  pluginManager: ReturnType<PluginManager['getStats']>;
  registry: MarketplaceStats;
  configManager: ReturnType<PluginConfigManager['getStats']>;
  marketplace: MarketplaceMetrics;
}> {
  return {
    pluginManager: pluginManager.getStats(),
    registry: pluginRegistry.getMarketplaceStats(),
    configManager: pluginConfigManager.getStats(),
    marketplace: await pluginMarketplace.getMarketplaceMetrics()
  };
}

/**
 * 快速插件安裝助手
 */
export async function quickInstallPlugin(
  pluginId: string,
  options: {
    autoStart?: boolean;
    createConfig?: boolean;
    configTemplate?: string;
  } = {}
): Promise<InstallResult> {
  const {
    autoStart = true,
    createConfig = true,
    configTemplate = 'generic'
  } = options;

  return await pluginMarketplace.installPlugin(pluginId, {
    autoStart,
    configTemplate: createConfig ? configTemplate : undefined
  });
}

/**
 * 批量插件操作
 */
export async function batchPluginOperation(
  operation: 'install' | 'uninstall' | 'update' | 'start' | 'stop',
  pluginIds: string[]
): Promise<Record<string, InstallResult | { success: boolean; message: string }>> {
  const results: Record<string, any> = {};

  for (const pluginId of pluginIds) {
    try {
      switch (operation) {
        case 'install':
          results[pluginId] = await pluginMarketplace.installPlugin(pluginId);
          break;
        case 'uninstall':
          results[pluginId] = await pluginMarketplace.uninstallPlugin(pluginId);
          break;
        case 'update':
          results[pluginId] = await pluginMarketplace.updatePlugin(pluginId);
          break;
        case 'start':
          await pluginManager.startPlugin(pluginId);
          results[pluginId] = { success: true, message: 'Plugin started successfully' };
          break;
        case 'stop':
          await pluginManager.stopPlugin(pluginId);
          results[pluginId] = { success: true, message: 'Plugin stopped successfully' };
          break;
      }
    } catch (error) {
      results[pluginId] = { 
        success: false, 
        message: `Operation failed: ${error.message}` 
      };
    }
  }

  return results;
}

/**
 * 插件開發助手 - 創建插件模板
 */
export function createPluginTemplate(
  pluginId: string,
  pluginName: string,
  pluginType: PluginType,
  options: {
    author?: string;
    description?: string;
    category?: string;
    tags?: string[];
    permissions?: Partial<PluginPermissions>;
  } = {}
): string {
  const {
    author = 'Plugin Developer',
    description = `A ${pluginType} plugin for Astro Clinical Platform`,
    category = 'general',
    tags = [],
    permissions = {}
  } = options;

  const defaultPermissions: PluginPermissions = {
    api: [],
    storage: false,
    network: false,
    fileSystem: false,
    medicalData: false,
    patientData: false,
    adminAccess: false,
    ...permissions
  };

  return `/**
 * ${pluginName}
 * Generated plugin template for Astro Clinical Platform
 */

import type { Plugin, PluginContext, PluginMetadata, PluginType } from '@astro-clinical/plugin-types';

export class ${pluginName.replace(/\s+/g, '')}Plugin implements Plugin {
  readonly metadata: PluginMetadata = {
    id: '${pluginId}',
    name: '${pluginName}',
    version: '1.0.0',
    description: '${description}',
    author: '${author}',
    type: PluginType.${pluginType.toUpperCase()},
    category: '${category}',
    tags: ${JSON.stringify(tags)},
    license: 'MIT',
    permissions: ${JSON.stringify(defaultPermissions, null, 6)}
  };

  async load(context: PluginContext): Promise<void> {
    context.logger.info('Loading ${pluginName}');
    // Initialize plugin resources
  }

  async start(context: PluginContext): Promise<void> {
    context.logger.info('Starting ${pluginName}');
    
    // Register extensions
    const pluginManager = (globalThis as any).pluginManager;
    if (pluginManager) {
      // Example extension registration
      // pluginManager.registerExtension({
      //   extensionPoint: 'medical.calculator',
      //   pluginId: this.metadata.id,
      //   priority: 100,
      //   implementation: new MyImplementation()
      // });
    }
  }

  async stop(context: PluginContext): Promise<void> {
    context.logger.info('Stopping ${pluginName}');
    // Cleanup active resources
  }

  async unload(context: PluginContext): Promise<void> {
    context.logger.info('Unloading ${pluginName}');
    // Final cleanup
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

export default new ${pluginName.replace(/\s+/g, '')}Plugin();
`;
}

// 預設匯出整合的插件系統
export default {
  pluginManager,
  pluginRegistry,
  pluginConfigManager,
  pluginMarketplace,
  initializePluginSystem,
  performSystemHealthCheck,
  getSystemStats,
  quickInstallPlugin,
  batchPluginOperation,
  createPluginTemplate
};