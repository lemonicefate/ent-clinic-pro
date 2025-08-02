/**
 * Plugin System Tests
 * 插件系統測試套件
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  PluginManager, 
  PluginState, 
  PluginType,
  type Plugin,
  type PluginMetadata,
  type PluginContext
} from '../core/plugin-manager';
import { ModulePluginLoader, JsonPluginLoader } from '../loaders/module-plugin-loader';
import { PluginRegistry } from '../registry/plugin-registry';
import { PluginSecurityManager, createDefaultSecurityManager } from '../security/plugin-security';
import { PluginConfigManager } from '../config/plugin-config-manager';
import { PluginMarketplace } from '../marketplace/plugin-marketplace';

// Mock 插件實現
class MockPlugin implements Plugin {
  readonly metadata: PluginMetadata;
  private loadCalled = false;
  private startCalled = false;
  private stopCalled = false;
  private unloadCalled = false;

  constructor(id: string, type: PluginType = PluginType.UTILITY) {
    this.metadata = {
      id,
      name: `Mock Plugin ${id}`,
      version: '1.0.0',
      description: 'A mock plugin for testing',
      author: 'Test Author',
      type,
      license: 'MIT',
      permissions: {
        api: [],
        storage: false,
        network: false,
        fileSystem: false,
        medicalData: false,
        patientData: false,
        adminAccess: false
      }
    };
  }

  async load(context: PluginContext): Promise<void> {
    this.loadCalled = true;
    context.logger.info('Mock plugin loaded');
  }

  async start(context: PluginContext): Promise<void> {
    this.startCalled = true;
    context.logger.info('Mock plugin started');
  }

  async stop(context: PluginContext): Promise<void> {
    this.stopCalled = true;
    context.logger.info('Mock plugin stopped');
  }

  async unload(context: PluginContext): Promise<void> {
    this.unloadCalled = true;
    context.logger.info('Mock plugin unloaded');
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  // 測試輔助方法
  getCallStatus() {
    return {
      loadCalled: this.loadCalled,
      startCalled: this.startCalled,
      stopCalled: this.stopCalled,
      unloadCalled: this.unloadCalled
    };
  }
}

// Mock 載入器
class MockPluginLoader {
  private plugins = new Map<string, Plugin>();

  addPlugin(source: string, plugin: Plugin): void {
    this.plugins.set(source, plugin);
  }

  canLoad(source: string): boolean {
    return this.plugins.has(source);
  }

  async load(source: string): Promise<Plugin> {
    const plugin = this.plugins.get(source);
    if (!plugin) {
      throw new Error(`Plugin not found: ${source}`);
    }
    return plugin;
  }

  async unload(plugin: Plugin): Promise<void> {
    // Mock unload
  }
}

describe('PluginManager', () => {
  let pluginManager: PluginManager;
  let mockLoader: MockPluginLoader;

  beforeEach(() => {
    pluginManager = new PluginManager({
      enableSecurity: false,
      enableAuditLog: false,
      maxPlugins: 10
    });

    mockLoader = new MockPluginLoader();
    pluginManager.registerLoader(mockLoader as any);
  });

  afterEach(() => {
    // 清理
    vi.clearAllMocks();
  });

  describe('Plugin Loading', () => {
    it('should load a plugin successfully', async () => {
      const mockPlugin = new MockPlugin('test-plugin');
      mockLoader.addPlugin('test-source', mockPlugin);

      await pluginManager.loadPlugin('test-source');

      expect(pluginManager.getPlugin('test-plugin')).toBe(mockPlugin);
      expect(pluginManager.getPluginState('test-plugin')).toBe(PluginState.LOADED);
      expect(mockPlugin.getCallStatus().loadCalled).toBe(true);
    });

    it('should reject duplicate plugin IDs', async () => {
      const mockPlugin1 = new MockPlugin('duplicate-id');
      const mockPlugin2 = new MockPlugin('duplicate-id');
      
      mockLoader.addPlugin('source1', mockPlugin1);
      mockLoader.addPlugin('source2', mockPlugin2);

      await pluginManager.loadPlugin('source1');
      
      await expect(pluginManager.loadPlugin('source2')).rejects.toThrow(
        'Plugin duplicate-id is already loaded'
      );
    });

    it('should respect plugin limit', async () => {
      const limitedManager = new PluginManager({ maxPlugins: 2 });
      limitedManager.registerLoader(mockLoader as any);

      // 載入兩個插件
      for (let i = 1; i <= 2; i++) {
        const plugin = new MockPlugin(`plugin-${i}`);
        mockLoader.addPlugin(`source-${i}`, plugin);
        await limitedManager.loadPlugin(`source-${i}`);
      }

      // 第三個插件應該被拒絕
      const plugin3 = new MockPlugin('plugin-3');
      mockLoader.addPlugin('source-3', plugin3);
      
      await expect(limitedManager.loadPlugin('source-3')).rejects.toThrow(
        'Maximum number of plugins reached'
      );
    });
  });

  describe('Plugin Lifecycle', () => {
    let mockPlugin: MockPlugin;

    beforeEach(async () => {
      mockPlugin = new MockPlugin('lifecycle-test');
      mockLoader.addPlugin('test-source', mockPlugin);
      await pluginManager.loadPlugin('test-source');
    });

    it('should start a loaded plugin', async () => {
      await pluginManager.startPlugin('lifecycle-test');

      expect(pluginManager.getPluginState('lifecycle-test')).toBe(PluginState.STARTED);
      expect(mockPlugin.getCallStatus().startCalled).toBe(true);
    });

    it('should stop a started plugin', async () => {
      await pluginManager.startPlugin('lifecycle-test');
      await pluginManager.stopPlugin('lifecycle-test');

      expect(pluginManager.getPluginState('lifecycle-test')).toBe(PluginState.STOPPED);
      expect(mockPlugin.getCallStatus().stopCalled).toBe(true);
    });

    it('should unload a plugin', async () => {
      await pluginManager.startPlugin('lifecycle-test');
      await pluginManager.unloadPlugin('lifecycle-test');

      expect(pluginManager.getPlugin('lifecycle-test')).toBeUndefined();
      expect(mockPlugin.getCallStatus().unloadCalled).toBe(true);
    });

    it('should handle plugin errors gracefully', async () => {
      const errorPlugin = new MockPlugin('error-plugin');
      errorPlugin.start = async () => {
        throw new Error('Start failed');
      };

      mockLoader.addPlugin('error-source', errorPlugin);
      await pluginManager.loadPlugin('error-source');

      await expect(pluginManager.startPlugin('error-plugin')).rejects.toThrow('Start failed');
      expect(pluginManager.getPluginState('error-plugin')).toBe(PluginState.ERROR);
    });
  });

  describe('Extension System', () => {
    beforeEach(() => {
      pluginManager.registerExtensionPoint({
        name: 'test.extension',
        description: 'Test extension point',
        type: 'test',
        required: false,
        multiple: true
      });
    });

    it('should register and retrieve extensions', () => {
      const implementation = { test: 'value' };
      
      pluginManager.registerExtension({
        extensionPoint: 'test.extension',
        pluginId: 'test-plugin',
        priority: 100,
        implementation
      });

      const extensions = pluginManager.getExtensions('test.extension');
      expect(extensions).toHaveLength(1);
      expect(extensions[0].implementation).toBe(implementation);
    });

    it('should sort extensions by priority', () => {
      const impl1 = { name: 'low-priority' };
      const impl2 = { name: 'high-priority' };

      pluginManager.registerExtension({
        extensionPoint: 'test.extension',
        pluginId: 'plugin-1',
        priority: 50,
        implementation: impl1
      });

      pluginManager.registerExtension({
        extensionPoint: 'test.extension',
        pluginId: 'plugin-2',
        priority: 100,
        implementation: impl2
      });

      const implementations = pluginManager.getExtensionImplementations('test.extension');
      expect(implementations[0]).toBe(impl2); // 高優先級在前
      expect(implementations[1]).toBe(impl1);
    });
  });

  describe('Batch Operations', () => {
    beforeEach(async () => {
      // 準備多個插件
      for (let i = 1; i <= 3; i++) {
        const plugin = new MockPlugin(`batch-plugin-${i}`);
        mockLoader.addPlugin(`batch-source-${i}`, plugin);
      }
    });

    it('should load multiple plugins', async () => {
      const sources = ['batch-source-1', 'batch-source-2', 'batch-source-3'];
      await pluginManager.loadPlugins(sources);

      expect(pluginManager.getAllPlugins().size).toBe(3);
    });

    it('should start multiple plugins', async () => {
      const sources = ['batch-source-1', 'batch-source-2', 'batch-source-3'];
      await pluginManager.loadPlugins(sources);
      await pluginManager.startPlugins();

      const allPlugins = pluginManager.getAllPlugins();
      for (const [id] of allPlugins) {
        expect(pluginManager.getPluginState(id)).toBe(PluginState.STARTED);
      }
    });
  });

  describe('Health Check', () => {
    it('should perform health check on all plugins', async () => {
      const healthyPlugin = new MockPlugin('healthy-plugin');
      const unhealthyPlugin = new MockPlugin('unhealthy-plugin');
      unhealthyPlugin.healthCheck = async () => false;

      mockLoader.addPlugin('healthy-source', healthyPlugin);
      mockLoader.addPlugin('unhealthy-source', unhealthyPlugin);

      await pluginManager.loadPlugin('healthy-source');
      await pluginManager.loadPlugin('unhealthy-source');

      const healthResult = await pluginManager.healthCheck();

      expect(healthResult.overall).toBe(false);
      expect(healthResult.plugins['healthy-plugin']).toBe(true);
      expect(healthResult.plugins['unhealthy-plugin']).toBe(false);
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', async () => {
      const plugin1 = new MockPlugin('stats-plugin-1');
      const plugin2 = new MockPlugin('stats-plugin-2');

      mockLoader.addPlugin('stats-source-1', plugin1);
      mockLoader.addPlugin('stats-source-2', plugin2);

      await pluginManager.loadPlugin('stats-source-1');
      await pluginManager.loadPlugin('stats-source-2');
      await pluginManager.startPlugin('stats-plugin-1');

      const stats = pluginManager.getStats();

      expect(stats.totalPlugins).toBe(2);
      expect(stats.loadedPlugins).toBe(1); // plugin-2 is loaded but not started
      expect(stats.startedPlugins).toBe(1); // plugin-1 is started
      expect(stats.errorPlugins).toBe(0);
    });
  });
});

describe('ModulePluginLoader', () => {
  let loader: ModulePluginLoader;

  beforeEach(() => {
    loader = new ModulePluginLoader();
  });

  describe('canLoad', () => {
    it('should identify loadable sources', () => {
      expect(loader.canLoad('plugin.js')).toBe(true);
      expect(loader.canLoad('plugin.ts')).toBe(true);
      expect(loader.canLoad('plugin.mjs')).toBe(true);
      expect(loader.canLoad('my-plugin-package')).toBe(true);
      expect(loader.canLoad('./local/plugin.js')).toBe(true);
      
      expect(loader.canLoad('plugin.json')).toBe(false);
      expect(loader.canLoad('plugin.xml')).toBe(false);
    });
  });
});

describe('JsonPluginLoader', () => {
  let loader: JsonPluginLoader;

  beforeEach(() => {
    loader = new JsonPluginLoader();
  });

  describe('canLoad', () => {
    it('should identify JSON sources', () => {
      expect(loader.canLoad('plugin.json')).toBe(true);
      expect(loader.canLoad('config.json')).toBe(true);
      
      expect(loader.canLoad('plugin.js')).toBe(false);
      expect(loader.canLoad('plugin.ts')).toBe(false);
    });
  });
});

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry({
      enableReviews: true,
      requireVerification: false,
      maxPluginsPerPublisher: 5
    });
  });

  describe('Plugin Registration', () => {
    it('should register a plugin successfully', async () => {
      const metadata: PluginMetadata = {
        id: 'test-registry-plugin',
        name: 'Test Registry Plugin',
        version: '1.0.0',
        description: 'A test plugin for registry',
        author: 'Test Author',
        type: PluginType.UTILITY,
        license: 'MIT',
        permissions: {
          api: [],
          storage: false,
          network: false,
          fileSystem: false,
          medicalData: false,
          patientData: false,
          adminAccess: false
        }
      };

      const publisher = {
        id: 'test-publisher',
        name: 'Test Publisher',
        email: 'test@example.com',
        verified: false,
        reputation: 50,
        publishedPlugins: 0
      };

      const pluginId = await registry.registerPlugin(metadata, 'test-source', publisher);
      
      expect(pluginId).toBe('test-registry-plugin');
      
      const registered = registry.getPlugin(pluginId);
      expect(registered).toBeDefined();
      expect(registered?.metadata.name).toBe('Test Registry Plugin');
    });

    it('should prevent duplicate plugin registration', async () => {
      const metadata: PluginMetadata = {
        id: 'duplicate-plugin',
        name: 'Duplicate Plugin',
        version: '1.0.0',
        description: 'A duplicate plugin',
        author: 'Test Author',
        type: PluginType.UTILITY,
        license: 'MIT',
        permissions: {
          api: [],
          storage: false,
          network: false,
          fileSystem: false,
          medicalData: false,
          patientData: false,
          adminAccess: false
        }
      };

      const publisher = {
        id: 'test-publisher',
        name: 'Test Publisher',
        email: 'test@example.com',
        verified: false,
        reputation: 50,
        publishedPlugins: 0
      };

      await registry.registerPlugin(metadata, 'source1', publisher);
      
      await expect(
        registry.registerPlugin(metadata, 'source2', publisher)
      ).rejects.toThrow('Plugin duplicate-plugin is already registered');
    });
  });

  describe('Plugin Search', () => {
    beforeEach(async () => {
      // 註冊測試插件
      const plugins = [
        {
          id: 'calculator-plugin',
          name: 'Medical Calculator',
          type: PluginType.CALCULATOR,
          tags: ['medical', 'calculator']
        },
        {
          id: 'analytics-plugin',
          name: 'Analytics Tool',
          type: PluginType.ANALYTICS,
          tags: ['analytics', 'reporting']
        }
      ];

      const publisher = {
        id: 'test-publisher',
        name: 'Test Publisher',
        email: 'test@example.com',
        verified: true,
        reputation: 80,
        publishedPlugins: 0
      };

      for (const pluginData of plugins) {
        const metadata: PluginMetadata = {
          ...pluginData,
          version: '1.0.0',
          description: `A ${pluginData.name.toLowerCase()}`,
          author: 'Test Author',
          license: 'MIT',
          permissions: {
            api: [],
            storage: false,
            network: false,
            fileSystem: false,
            medicalData: false,
            patientData: false,
            adminAccess: false
          }
        };

        await registry.registerPlugin(metadata, `${pluginData.id}-source`, publisher);
        await registry.approvePlugin(pluginData.id, 'admin');
      }
    });

    it('should search plugins by query', () => {
      const results = registry.searchPlugins({ query: 'calculator' });
      
      expect(results.plugins).toHaveLength(1);
      expect(results.plugins[0].metadata.name).toBe('Medical Calculator');
    });

    it('should filter plugins by type', () => {
      const results = registry.searchPlugins({ type: PluginType.ANALYTICS });
      
      expect(results.plugins).toHaveLength(1);
      expect(results.plugins[0].metadata.type).toBe(PluginType.ANALYTICS);
    });

    it('should filter plugins by tags', () => {
      const results = registry.searchPlugins({ tags: ['medical'] });
      
      expect(results.plugins).toHaveLength(1);
      expect(results.plugins[0].metadata.tags).toContain('medical');
    });

    it('should sort plugins correctly', () => {
      const results = registry.searchPlugins({ 
        sortBy: 'name', 
        sortOrder: 'asc' 
      });
      
      expect(results.plugins[0].metadata.name).toBe('Analytics Tool');
      expect(results.plugins[1].metadata.name).toBe('Medical Calculator');
    });
  });
});

describe('PluginSecurityManager', () => {
  let securityManager: PluginSecurityManager;

  beforeEach(() => {
    securityManager = createDefaultSecurityManager();
  });

  describe('Permission Checking', () => {
    it('should allow safe permissions', () => {
      const permissions = {
        api: ['medical.calculator'],
        storage: true,
        network: false,
        fileSystem: false,
        medicalData: false,
        patientData: false,
        adminAccess: false
      };

      const result = securityManager.checkPermissions(permissions);
      
      expect(result.allowed).toBe(true);
      expect(result.riskLevel).toBe('low');
    });

    it('should flag high-risk permissions', () => {
      const permissions = {
        api: [],
        storage: false,
        network: false,
        fileSystem: false,
        medicalData: false,
        patientData: true, // 高風險
        adminAccess: false
      };

      const result = securityManager.checkPermissions(permissions);
      
      expect(result.allowed).toBe(true);
      expect(result.riskLevel).toBe('high');
      expect(result.recommendations).toBeDefined();
    });

    it('should deny admin access', () => {
      const permissions = {
        api: [],
        storage: false,
        network: false,
        fileSystem: false,
        medicalData: false,
        patientData: false,
        adminAccess: true // 禁止
      };

      const result = securityManager.checkPermissions(permissions);
      
      expect(result.allowed).toBe(false);
      expect(result.riskLevel).toBe('critical');
    });
  });

  describe('Runtime Permission Checking', () => {
    it('should check runtime permissions', () => {
      // 這個測試需要 mock 插件管理器
      const hasPermission = securityManager.checkRuntimePermission(
        'test-plugin',
        'storage',
        'test-resource'
      );

      // 由於沒有註冊插件，應該返回 false
      expect(hasPermission).toBe(false);
    });
  });

  describe('Security Events', () => {
    it('should record and retrieve security events', () => {
      // 觸發一個安全事件
      securityManager.blockPlugin('malicious-plugin', 'Suspicious behavior detected');

      const events = securityManager.getSecurityEvents();
      
      expect(events).toHaveLength(1);
      expect(events[0].pluginId).toBe('malicious-plugin');
      expect(events[0].severity).toBe('critical');
    });

    it('should provide security statistics', () => {
      securityManager.blockPlugin('plugin1', 'Test reason 1');
      securityManager.blockPlugin('plugin2', 'Test reason 2');

      const stats = securityManager.getSecurityStats();
      
      expect(stats.totalEvents).toBe(2);
      expect(stats.blockedPlugins).toBe(2);
      expect(stats.eventsBySeverity.critical).toBe(2);
    });
  });
});

describe('PluginConfigManager', () => {
  let configManager: PluginConfigManager;

  beforeEach(() => {
    configManager = new PluginConfigManager({
      enableEncryption: false,
      enableAuditLog: false
    });
  });

  describe('Configuration Templates', () => {
    it('should register and retrieve configuration templates', () => {
      const template = {
        id: 'test-template',
        name: 'Test Template',
        description: 'A test configuration template',
        schema: {
          type: 'object' as const,
          properties: {
            testSetting: {
              type: 'string' as const,
              description: 'A test setting',
              default: 'default-value'
            }
          }
        },
        defaultValues: {
          testSetting: 'default-value'
        },
        environments: ['development', 'production']
      };

      configManager.registerTemplate(template);
      
      const retrieved = configManager.getTemplate('test-template');
      expect(retrieved).toEqual(template);
    });

    it('should validate template structure', () => {
      const invalidTemplate = {
        id: 'invalid-template',
        name: 'Invalid Template'
        // Missing required fields
      };

      expect(() => {
        configManager.registerTemplate(invalidTemplate as any);
      }).toThrow('Template must have id, name, and schema');
    });
  });

  describe('Configuration Management', () => {
    beforeEach(() => {
      // Register a test template
      configManager.registerTemplate({
        id: 'test-config-template',
        name: 'Test Config Template',
        description: 'Template for testing',
        schema: {
          type: 'object',
          properties: {
            enabled: {
              type: 'boolean',
              default: true
            },
            timeout: {
              type: 'number',
              minimum: 1000,
              maximum: 60000,
              default: 30000
            }
          },
          required: ['enabled']
        },
        defaultValues: {
          enabled: true,
          timeout: 30000
        },
        environments: ['development', 'staging', 'production']
      });
    });

    it('should create plugin configuration', async () => {
      const config = await configManager.createConfig(
        'test-plugin',
        'test-config-template',
        'development',
        { timeout: 15000 }
      );

      expect(config.enabled).toBe(true);
      expect(config.settings.enabled).toBe(true);
      expect(config.settings.timeout).toBe(15000);
      expect(config.environment).toBe('development');
    });

    it('should validate configuration values', async () => {
      await expect(
        configManager.createConfig(
          'invalid-plugin',
          'test-config-template',
          'development',
          { timeout: -1000 } // Invalid value
        )
      ).rejects.toThrow('Configuration validation failed');
    });

    it('should update plugin configuration', async () => {
      await configManager.createConfig(
        'update-test-plugin',
        'test-config-template',
        'development'
      );

      await configManager.updateConfig('update-test-plugin', {
        settings: { enabled: false, timeout: 45000 }
      });

      const updatedConfig = await configManager.getConfig('update-test-plugin');
      expect(updatedConfig?.settings.enabled).toBe(false);
      expect(updatedConfig?.settings.timeout).toBe(45000);
    });
  });
});

describe('PluginMarketplace', () => {
  let marketplace: PluginMarketplace;
  let registry: PluginRegistry;

  beforeEach(() => {
    marketplace = new PluginMarketplace({
      enableAutoUpdates: false,
      requireApproval: false
    });
    registry = new PluginRegistry();
  });

  describe('Plugin Search and Discovery', () => {
    it('should search plugins with enhanced information', async () => {
      // This test would require proper integration with registry
      // For now, we'll test the basic structure
      const searchOptions = {
        query: 'calculator',
        type: PluginType.CALCULATOR,
        verified: true
      };

      const results = await marketplace.searchPlugins(searchOptions);
      
      expect(results).toHaveProperty('plugins');
      expect(results).toHaveProperty('total');
      expect(results).toHaveProperty('hasMore');
    });
  });

  describe('Plugin Installation', () => {
    it('should handle plugin installation workflow', async () => {
      // Mock a plugin registration
      const mockPlugin = new MockPlugin('marketplace-test-plugin');
      
      // This test would require full integration setup
      // For now, we'll test the error case
      const result = await marketplace.installPlugin('non-existent-plugin');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });
});

describe('Integration Tests', () => {
  let pluginManager: PluginManager;
  let registry: PluginRegistry;
  let securityManager: PluginSecurityManager;
  let configManager: PluginConfigManager;
  let marketplace: PluginMarketplace;

  beforeEach(() => {
    pluginManager = new PluginManager();
    registry = new PluginRegistry();
    securityManager = createDefaultSecurityManager();
    configManager = new PluginConfigManager({ enableAuditLog: false });
    marketplace = new PluginMarketplace({ requireApproval: false });
  });

  it('should integrate all components successfully', async () => {
    // 這是一個集成測試示例
    // 在實際實現中，這些組件應該能夠協同工作
    
    const mockPlugin = new MockPlugin('integration-test');
    const mockLoader = new MockPluginLoader();
    mockLoader.addPlugin('integration-source', mockPlugin);
    
    pluginManager.registerLoader(mockLoader as any);
    
    // 載入插件
    await pluginManager.loadPlugin('integration-source');
    
    // 啟動插件
    await pluginManager.startPlugin('integration-test');
    
    // 檢查狀態
    expect(pluginManager.getPluginState('integration-test')).toBe(PluginState.STARTED);
    
    // 執行健康檢查
    const health = await pluginManager.healthCheck();
    expect(health.overall).toBe(true);
    
    // 停止和卸載
    await pluginManager.stopPlugin('integration-test');
    await pluginManager.unloadPlugin('integration-test');
    
    expect(pluginManager.getPlugin('integration-test')).toBeUndefined();
  });

  it('should integrate configuration management with plugin lifecycle', async () => {
    // 創建配置模板
    configManager.registerTemplate({
      id: 'integration-template',
      name: 'Integration Template',
      description: 'Template for integration testing',
      schema: {
        type: 'object',
        properties: {
          debug: { type: 'boolean', default: false },
          apiUrl: { type: 'string', default: 'https://api.example.com' }
        }
      },
      defaultValues: { debug: false, apiUrl: 'https://api.example.com' },
      environments: ['development', 'production']
    });

    // 創建插件配置
    const config = await configManager.createConfig(
      'integration-test',
      'integration-template',
      'development',
      { debug: true }
    );

    expect(config.settings.debug).toBe(true);
    expect(config.settings.apiUrl).toBe('https://api.example.com');

    // 測試配置更新
    await configManager.updateConfig('integration-test', {
      settings: { ...config.settings, apiUrl: 'https://dev-api.example.com' }
    });

    const updatedConfig = await configManager.getConfig('integration-test');
    expect(updatedConfig?.settings.apiUrl).toBe('https://dev-api.example.com');
  });
});