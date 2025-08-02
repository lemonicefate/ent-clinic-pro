/**
 * Plugin System Integration Tests
 * 插件系統整合測試 - 測試完整的插件系統功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initializePluginSystem,
  performSystemHealthCheck,
  getSystemStats,
  quickInstallPlugin,
  batchPluginOperation,
  createPluginTemplate,
  PluginType,
  PluginState,
  type Plugin,
  type PluginMetadata
} from '../index';

// Mock 插件實現
class TestIntegrationPlugin implements Plugin {
  readonly metadata: PluginMetadata = {
    id: 'test-integration-plugin',
    name: 'Test Integration Plugin',
    version: '1.0.0',
    description: 'A test plugin for integration testing',
    author: 'Test Author',
    type: PluginType.UTILITY,
    category: 'testing',
    tags: ['test', 'integration'],
    license: 'MIT',
    permissions: {
      api: ['test.api'],
      storage: true,
      network: false,
      fileSystem: false,
      medicalData: false,
      patientData: false,
      adminAccess: false
    }
  };

  private loaded = false;
  private started = false;

  async load(context: any): Promise<void> {
    this.loaded = true;
    context.logger.info('Test integration plugin loaded');
  }

  async start(context: any): Promise<void> {
    this.started = true;
    context.logger.info('Test integration plugin started');
  }

  async stop(context: any): Promise<void> {
    this.started = false;
    context.logger.info('Test integration plugin stopped');
  }

  async unload(context: any): Promise<void> {
    this.loaded = false;
    context.logger.info('Test integration plugin unloaded');
  }

  async healthCheck(): Promise<boolean> {
    return this.loaded && this.started;
  }

  getStatus() {
    return { loaded: this.loaded, started: this.started };
  }
}

describe('Plugin System Integration', () => {
  let testPlugin: TestIntegrationPlugin;

  beforeEach(async () => {
    testPlugin = new TestIntegrationPlugin();
    
    // 清理之前的測試狀態
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // 清理測試後的狀態
    try {
      const { pluginManager } = await initializePluginSystem();
      const allPlugins = pluginManager.getAllPlugins();
      
      for (const [pluginId] of allPlugins) {
        try {
          await pluginManager.unloadPlugin(pluginId);
        } catch (error) {
          // 忽略卸載錯誤
        }
      }
    } catch (error) {
      // 忽略清理錯誤
    }
  });

  describe('System Initialization', () => {
    it('should initialize plugin system successfully', async () => {
      const system = await initializePluginSystem({
        enableSecurity: true,
        enableMarketplace: true,
        enableAutoUpdates: false,
        maxPlugins: 50
      });

      expect(system.pluginManager).toBeDefined();
      expect(system.marketplace).toBeDefined();
      expect(system.configManager).toBeDefined();
      expect(system.registry).toBeDefined();

      // 檢查全域引用
      expect((globalThis as any).pluginManager).toBeDefined();
      expect((globalThis as any).pluginRegistry).toBeDefined();
    });

    it('should register default extension points', async () => {
      const { pluginManager } = await initializePluginSystem();

      // 檢查預設擴展點是否已註冊
      const calculatorExtensions = pluginManager.getExtensions('medical.calculator');
      const integrationExtensions = pluginManager.getExtensions('medical.integration');
      const visualizationExtensions = pluginManager.getExtensions('medical.visualization');

      expect(calculatorExtensions).toBeDefined();
      expect(integrationExtensions).toBeDefined();
      expect(visualizationExtensions).toBeDefined();
    });
  });

  describe('System Health Check', () => {
    it('should perform comprehensive health check', async () => {
      await initializePluginSystem();
      
      const healthResult = await performSystemHealthCheck();

      expect(healthResult).toHaveProperty('overall');
      expect(healthResult).toHaveProperty('components');
      expect(healthResult).toHaveProperty('plugins');
      expect(healthResult).toHaveProperty('issues');

      expect(healthResult.components).toHaveProperty('pluginManager');
      expect(healthResult.components).toHaveProperty('registry');
      expect(healthResult.components).toHaveProperty('configManager');
      expect(healthResult.components).toHaveProperty('marketplace');
    });

    it('should detect plugin health issues', async () => {
      const { pluginManager } = await initializePluginSystem();

      // 創建一個不健康的插件
      const unhealthyPlugin: Plugin = {
        metadata: {
          id: 'unhealthy-plugin',
          name: 'Unhealthy Plugin',
          version: '1.0.0',
          description: 'A plugin that fails health checks',
          author: 'Test',
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
        },
        async healthCheck() {
          return false; // 總是返回不健康
        }
      };

      // 手動添加插件到管理器（模擬載入）
      (pluginManager as any).plugins.set('unhealthy-plugin', unhealthyPlugin);
      (pluginManager as any).pluginStates.set('unhealthy-plugin', PluginState.STARTED);

      const healthResult = await performSystemHealthCheck();

      expect(healthResult.overall).toBe(false);
      expect(healthResult.plugins['unhealthy-plugin']).toBe(false);
    });
  });

  describe('System Statistics', () => {
    it('should provide comprehensive system statistics', async () => {
      await initializePluginSystem();
      
      const stats = await getSystemStats();

      expect(stats).toHaveProperty('pluginManager');
      expect(stats).toHaveProperty('registry');
      expect(stats).toHaveProperty('configManager');
      expect(stats).toHaveProperty('marketplace');

      expect(stats.pluginManager).toHaveProperty('totalPlugins');
      expect(stats.pluginManager).toHaveProperty('loadedPlugins');
      expect(stats.pluginManager).toHaveProperty('startedPlugins');

      expect(stats.registry).toHaveProperty('totalPlugins');
      expect(stats.registry).toHaveProperty('verifiedPlugins');

      expect(stats.configManager).toHaveProperty('totalConfigs');
      expect(stats.configManager).toHaveProperty('totalTemplates');

      expect(stats.marketplace).toHaveProperty('installedPlugins');
      expect(stats.marketplace).toHaveProperty('activePlugins');
    });
  });

  describe('Quick Plugin Installation', () => {
    it('should handle quick plugin installation', async () => {
      const { registry, marketplace } = await initializePluginSystem();

      // 註冊測試插件到註冊表
      const publisher = {
        id: 'test-publisher',
        name: 'Test Publisher',
        email: 'test@example.com',
        verified: true,
        reputation: 90,
        publishedPlugins: 1
      };

      await registry.registerPlugin(
        testPlugin.metadata,
        'test-source',
        publisher,
        { autoApprove: true }
      );

      await registry.approvePlugin('test-integration-plugin', 'admin');

      // 模擬插件載入器
      const mockLoader = {
        canLoad: (source: string) => source === 'test-source',
        load: async (source: string) => testPlugin,
        unload: async (plugin: Plugin) => {}
      };

      const { pluginManager } = await initializePluginSystem();
      pluginManager.registerLoader(mockLoader as any);

      // 快速安裝
      const result = await quickInstallPlugin('test-integration-plugin', {
        autoStart: true,
        createConfig: true,
        configTemplate: 'generic'
      });

      expect(result.success).toBe(true);
      expect(result.pluginId).toBe('test-integration-plugin');
      expect(testPlugin.getStatus().loaded).toBe(true);
      expect(testPlugin.getStatus().started).toBe(true);
    });
  });

  describe('Batch Plugin Operations', () => {
    it('should handle batch plugin operations', async () => {
      const { pluginManager } = await initializePluginSystem();

      // 創建多個測試插件
      const plugins = [
        new TestIntegrationPlugin(),
        new TestIntegrationPlugin(),
        new TestIntegrationPlugin()
      ];

      // 修改插件 ID 以避免衝突
      plugins[1].metadata = { ...plugins[1].metadata, id: 'test-plugin-2', name: 'Test Plugin 2' };
      plugins[2].metadata = { ...plugins[2].metadata, id: 'test-plugin-3', name: 'Test Plugin 3' };

      // 手動載入插件（模擬）
      for (const plugin of plugins) {
        (pluginManager as any).plugins.set(plugin.metadata.id, plugin);
        (pluginManager as any).pluginStates.set(plugin.metadata.id, PluginState.LOADED);
        (pluginManager as any).pluginContexts.set(plugin.metadata.id, {
          pluginId: plugin.metadata.id,
          logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
        });
      }

      // 批量啟動
      const startResults = await batchPluginOperation('start', [
        'test-integration-plugin',
        'test-plugin-2',
        'test-plugin-3'
      ]);

      expect(Object.keys(startResults)).toHaveLength(3);
      expect(startResults['test-integration-plugin'].success).toBe(true);
      expect(startResults['test-plugin-2'].success).toBe(true);
      expect(startResults['test-plugin-3'].success).toBe(true);

      // 批量停止
      const stopResults = await batchPluginOperation('stop', [
        'test-integration-plugin',
        'test-plugin-2'
      ]);

      expect(Object.keys(stopResults)).toHaveLength(2);
      expect(stopResults['test-integration-plugin'].success).toBe(true);
      expect(stopResults['test-plugin-2'].success).toBe(true);
    });

    it('should handle batch operation failures gracefully', async () => {
      await initializePluginSystem();

      // 嘗試操作不存在的插件
      const results = await batchPluginOperation('start', [
        'non-existent-plugin-1',
        'non-existent-plugin-2'
      ]);

      expect(Object.keys(results)).toHaveLength(2);
      expect(results['non-existent-plugin-1'].success).toBe(false);
      expect(results['non-existent-plugin-2'].success).toBe(false);
      expect(results['non-existent-plugin-1'].message).toContain('not found');
    });
  });

  describe('Plugin Template Generation', () => {
    it('should generate valid plugin template', () => {
      const template = createPluginTemplate(
        'my-test-plugin',
        'My Test Plugin',
        PluginType.CALCULATOR,
        {
          author: 'Test Developer',
          description: 'A test calculator plugin',
          category: 'medical',
          tags: ['calculator', 'medical', 'test'],
          permissions: {
            api: ['medical.calculator'],
            storage: true,
            medicalData: true
          }
        }
      );

      expect(template).toContain('my-test-plugin');
      expect(template).toContain('My Test Plugin');
      expect(template).toContain('PluginType.CALCULATOR');
      expect(template).toContain('Test Developer');
      expect(template).toContain('medical.calculator');
      expect(template).toContain('class MyTestPluginPlugin implements Plugin');
      expect(template).toContain('export default new MyTestPluginPlugin()');
    });

    it('should generate template with default values', () => {
      const template = createPluginTemplate(
        'simple-plugin',
        'Simple Plugin',
        PluginType.UTILITY
      );

      expect(template).toContain('simple-plugin');
      expect(template).toContain('Simple Plugin');
      expect(template).toContain('PluginType.UTILITY');
      expect(template).toContain('Plugin Developer');
      expect(template).toContain('"adminAccess": false');
    });
  });

  describe('Extension System Integration', () => {
    it('should support plugin extension registration and retrieval', async () => {
      const { pluginManager } = await initializePluginSystem();

      // 創建測試擴展實現
      const testCalculator = {
        id: 'test-calculator',
        calculate: (inputs: any) => ({ result: 42 }),
        validate: (inputs: any) => ({ valid: true }),
        getMetadata: () => ({ name: 'Test Calculator' })
      };

      // 註冊擴展
      pluginManager.registerExtension({
        extensionPoint: 'medical.calculator',
        pluginId: 'test-integration-plugin',
        priority: 100,
        implementation: testCalculator
      });

      // 獲取擴展
      const calculators = pluginManager.getExtensionImplementations('medical.calculator');
      
      expect(calculators).toHaveLength(1);
      expect(calculators[0]).toBe(testCalculator);
      expect(calculators[0].calculate({})).toEqual({ result: 42 });
    });

    it('should handle extension priority ordering', async () => {
      const { pluginManager } = await initializePluginSystem();

      const highPriorityExt = { name: 'high-priority', priority: 100 };
      const lowPriorityExt = { name: 'low-priority', priority: 50 };
      const mediumPriorityExt = { name: 'medium-priority', priority: 75 };

      // 以隨機順序註冊
      pluginManager.registerExtension({
        extensionPoint: 'medical.calculator',
        pluginId: 'plugin-1',
        priority: 50,
        implementation: lowPriorityExt
      });

      pluginManager.registerExtension({
        extensionPoint: 'medical.calculator',
        pluginId: 'plugin-2',
        priority: 100,
        implementation: highPriorityExt
      });

      pluginManager.registerExtension({
        extensionPoint: 'medical.calculator',
        pluginId: 'plugin-3',
        priority: 75,
        implementation: mediumPriorityExt
      });

      const implementations = pluginManager.getExtensionImplementations('medical.calculator');
      
      expect(implementations).toHaveLength(3);
      expect(implementations[0].name).toBe('high-priority');
      expect(implementations[1].name).toBe('medium-priority');
      expect(implementations[2].name).toBe('low-priority');
    });
  });

  describe('Configuration Integration', () => {
    it('should integrate configuration management with plugin lifecycle', async () => {
      const { configManager, pluginManager } = await initializePluginSystem();

      // 創建配置
      const config = await configManager.createConfig(
        'test-integration-plugin',
        'generic',
        'development',
        {
          debug: true,
          timeout: 5000,
          customSetting: 'test-value'
        }
      );

      expect(config.enabled).toBe(true);
      expect(config.settings.debug).toBe(true);
      expect(config.settings.timeout).toBe(5000);
      expect(config.settings.customSetting).toBe('test-value');

      // 測試配置更新
      await configManager.updateConfig('test-integration-plugin', {
        settings: {
          ...config.settings,
          debug: false,
          newSetting: 'new-value'
        }
      });

      const updatedConfig = await configManager.getConfig('test-integration-plugin');
      expect(updatedConfig?.settings.debug).toBe(false);
      expect(updatedConfig?.settings.newSetting).toBe('new-value');
    });

    it('should handle configuration validation', async () => {
      const { configManager } = await initializePluginSystem();

      // 嘗試創建無效配置
      await expect(
        configManager.createConfig(
          'invalid-plugin',
          'generic',
          'development',
          {
            timeout: -1000, // 無效值
            debug: 'not-a-boolean' // 錯誤類型
          }
        )
      ).rejects.toThrow('Configuration validation failed');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle plugin loading failures gracefully', async () => {
      const { pluginManager } = await initializePluginSystem();

      // 註冊會失敗的載入器
      const failingLoader = {
        canLoad: (source: string) => source === 'failing-source',
        load: async (source: string) => {
          throw new Error('Simulated loading failure');
        },
        unload: async (plugin: Plugin) => {}
      };

      pluginManager.registerLoader(failingLoader as any);

      // 嘗試載入失敗的插件
      await expect(
        pluginManager.loadPlugin('failing-source')
      ).rejects.toThrow('Simulated loading failure');

      // 系統應該仍然正常運作
      const health = await performSystemHealthCheck();
      expect(health.components.pluginManager).toBe(true);
    });

    it('should handle plugin runtime errors', async () => {
      const { pluginManager } = await initializePluginSystem();

      // 創建會在啟動時失敗的插件
      const failingPlugin: Plugin = {
        metadata: {
          id: 'failing-plugin',
          name: 'Failing Plugin',
          version: '1.0.0',
          description: 'A plugin that fails to start',
          author: 'Test',
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
        },
        async start() {
          throw new Error('Simulated startup failure');
        }
      };

      // 手動載入插件
      (pluginManager as any).plugins.set('failing-plugin', failingPlugin);
      (pluginManager as any).pluginStates.set('failing-plugin', PluginState.LOADED);
      (pluginManager as any).pluginContexts.set('failing-plugin', {
        pluginId: 'failing-plugin',
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
      });

      // 嘗試啟動失敗的插件
      await expect(
        pluginManager.startPlugin('failing-plugin')
      ).rejects.toThrow('Simulated startup failure');

      // 檢查插件狀態
      expect(pluginManager.getPluginState('failing-plugin')).toBe(PluginState.ERROR);
    });
  });

  describe('Security Integration', () => {
    it('should enforce security policies during plugin operations', async () => {
      const { marketplace, registry } = await initializePluginSystem({
        enableSecurity: true
      });

      // 創建高風險插件
      const riskyPlugin: Plugin = {
        metadata: {
          id: 'risky-plugin',
          name: 'Risky Plugin',
          version: '1.0.0',
          description: 'A plugin with high-risk permissions',
          author: 'Unknown',
          type: PluginType.UTILITY,
          license: 'MIT',
          permissions: {
            api: ['admin.users', 'admin.system'],
            storage: true,
            network: true,
            fileSystem: true,
            medicalData: true,
            patientData: true,
            adminAccess: true // 這應該被拒絕
          }
        }
      };

      // 註冊高風險插件
      const publisher = {
        id: 'unknown-publisher',
        name: 'Unknown Publisher',
        email: 'unknown@example.com',
        verified: false,
        reputation: 20,
        publishedPlugins: 0
      };

      await registry.registerPlugin(
        riskyPlugin.metadata,
        'risky-source',
        publisher
      );

      // 嘗試安裝應該被安全檢查拒絕
      const result = await marketplace.installPlugin('risky-plugin');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Security check failed');
      expect(result.securityRisk).toBe('critical');
    });
  });
});

describe('Plugin System Performance', () => {
  it('should handle multiple plugins efficiently', async () => {
    const startTime = Date.now();
    
    const { pluginManager } = await initializePluginSystem();

    // 創建多個插件
    const pluginCount = 20;
    const plugins: Plugin[] = [];

    for (let i = 0; i < pluginCount; i++) {
      plugins.push({
        metadata: {
          id: `performance-plugin-${i}`,
          name: `Performance Plugin ${i}`,
          version: '1.0.0',
          description: `Performance test plugin ${i}`,
          author: 'Test',
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
        },
        async load() {},
        async start() {},
        async stop() {},
        async unload() {}
      });
    }

    // 批量載入插件
    for (const plugin of plugins) {
      (pluginManager as any).plugins.set(plugin.metadata.id, plugin);
      (pluginManager as any).pluginStates.set(plugin.metadata.id, PluginState.LOADED);
    }

    // 批量啟動插件
    const pluginIds = plugins.map(p => p.metadata.id);
    await pluginManager.startPlugins(pluginIds);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 性能檢查 - 應該在合理時間內完成
    expect(duration).toBeLessThan(5000); // 5 秒內

    // 驗證所有插件都已啟動
    const stats = pluginManager.getStats();
    expect(stats.startedPlugins).toBe(pluginCount);
  });

  it('should handle concurrent plugin operations', async () => {
    const { pluginManager } = await initializePluginSystem();

    // 創建測試插件
    const plugins = Array.from({ length: 10 }, (_, i) => ({
      metadata: {
        id: `concurrent-plugin-${i}`,
        name: `Concurrent Plugin ${i}`,
        version: '1.0.0',
        description: `Concurrent test plugin ${i}`,
        author: 'Test',
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
      },
      async load() { await new Promise(resolve => setTimeout(resolve, 10)); },
      async start() { await new Promise(resolve => setTimeout(resolve, 10)); },
      async stop() { await new Promise(resolve => setTimeout(resolve, 10)); },
      async unload() { await new Promise(resolve => setTimeout(resolve, 10)); }
    }));

    // 並發載入插件
    const loadPromises = plugins.map(plugin => {
      (pluginManager as any).plugins.set(plugin.metadata.id, plugin);
      (pluginManager as any).pluginStates.set(plugin.metadata.id, PluginState.LOADED);
      (pluginManager as any).pluginContexts.set(plugin.metadata.id, {
        pluginId: plugin.metadata.id,
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
      });
      return pluginManager.startPlugin(plugin.metadata.id);
    });

    // 等待所有插件啟動完成
    await Promise.all(loadPromises);

    // 驗證所有插件都已啟動
    const stats = pluginManager.getStats();
    expect(stats.startedPlugins).toBe(10);
  });
});