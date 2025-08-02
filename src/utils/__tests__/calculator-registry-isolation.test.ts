/**
 * Calculator Registry Isolation Tests
 * 
 * Specific tests for the Calculator Registry to ensure proper plugin isolation,
 * conflict detection, and error handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CalculatorRegistry } from '../calculator-registry.js';
import type { CalculatorPlugin, PluginConflictError, PluginValidationError, DependencyError } from '../../types/calculator-plugin.js';

// Helper function to create test plugins
const createTestPlugin = (
  id: string, 
  namespace: string, 
  version = '1.0.0',
  dependencies: string[] = [],
  conflicts: string[] = []
): CalculatorPlugin => ({
  metadata: {
    id,
    namespace,
    version,
    name: { 'zh-TW': `${id} 計算器`, 'en': `${id} Calculator`, 'ja': `${id} 計算機` },
    description: { 'zh-TW': `${id} 描述`, 'en': `${id} Description`, 'ja': `${id} 説明` },
    author: 'Test Author',
    license: 'MIT',
    dependencies,
    conflicts,
    tags: ['test'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  config: {
    id,
    name: { 'zh-TW': `${id} 計算器`, 'en': `${id} Calculator`, 'ja': `${id} 計算機` },
    description: { 'zh-TW': `${id} 描述`, 'en': `${id} Description`, 'ja': `${id} 説明` },
    category: namespace,
    version,
    status: 'active',
    fields: [
      {
        id: 'input',
        type: 'number',
        label: { 'zh-TW': '輸入', 'en': 'Input', 'ja': '入力' },
        required: true,
        min: 0,
        max: 100
      }
    ],
    calculation: {
      functionName: `calculate${id}`,
      formula: `${id} = input * 2`
    },
    medical: {
      specialty: [namespace],
      evidenceLevel: 'A',
      clinicalGuidelines: {
        'zh-TW': '測試指引',
        'en': 'Test Guidelines',
        'ja': 'テストガイドライン'
      }
    },
    metadata: {
      author: 'Test Author',
      lastUpdated: new Date().toISOString(),
      tags: ['test'],
      difficulty: 'basic',
      isActive: true,
      isFeatured: false
    }
  },
  calculator: {
    calculate: (inputs) => ({
      primaryValue: Number(inputs.input) * 2,
      primaryUnit: 'units',
      interpretation: {
        'zh-TW': `${id} 結果`,
        'en': `${id} Result`,
        'ja': `${id} 結果`
      },
      recommendations: [],
      riskLevel: 'low' as const,
      metadata: {
        calculationSteps: [],
        references: [],
        lastCalculated: new Date().toISOString()
      }
    }),
    validate: (inputs) => ({
      isValid: !!inputs.input && Number(inputs.input) >= 0 && Number(inputs.input) <= 100,
      errors: []
    }),
    formatResult: (result, locale = 'zh-TW') => ({
      displayValue: `${result.primaryValue} ${result.primaryUnit}`,
      description: result.interpretation?.[locale] || '',
      recommendations: []
    })
  },
  async install() {
    console.log(`${id} plugin installed`);
  },
  async uninstall() {
    console.log(`${id} plugin uninstalled`);
  },
  async validate() {
    return true;
  },
  async checkCompatibility() {
    return {
      compatible: true,
      issues: []
    };
  }
});

describe('Calculator Registry Isolation Tests', () => {
  let registry: CalculatorRegistry;

  beforeEach(async () => {
    // Reset singleton instance
    (CalculatorRegistry as any).instance = null;
    registry = CalculatorRegistry.getInstance();
    
    // Mock console methods to reduce test noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Plugin Registration Isolation', () => {
    it('should register plugins in different namespaces independently', async () => {
      const bmiPlugin = createTestPlugin('bmi', 'general');
      const egfrPlugin = createTestPlugin('egfr', 'nephrology');
      const cha2ds2Plugin = createTestPlugin('cha2ds2-vasc', 'cardiology');

      await registry.register(bmiPlugin);
      await registry.register(egfrPlugin);
      await registry.register(cha2ds2Plugin);

      expect(registry.get('general.bmi')).toBe(bmiPlugin);
      expect(registry.get('nephrology.egfr')).toBe(egfrPlugin);
      expect(registry.get('cardiology.cha2ds2-vasc')).toBe(cha2ds2Plugin);

      // Namespace queries should return correct plugins
      expect(registry.getByNamespace('general')).toEqual([bmiPlugin]);
      expect(registry.getByNamespace('nephrology')).toEqual([egfrPlugin]);
      expect(registry.getByNamespace('cardiology')).toEqual([cha2ds2Plugin]);
    });

    it('should handle version conflicts within same namespace', async () => {
      const plugin1 = createTestPlugin('test', 'general', '1.0.0');
      const plugin2 = createTestPlugin('test', 'general', '2.0.0');
      const plugin3 = createTestPlugin('test', 'general', '1.5.0');

      // Register initial version
      await registry.register(plugin1);
      expect(registry.get('general.test')?.metadata.version).toBe('1.0.0');

      // Higher version should replace
      await registry.register(plugin2);
      expect(registry.get('general.test')?.metadata.version).toBe('2.0.0');

      // Lower version should be rejected
      await expect(registry.register(plugin3)).rejects.toThrow();
      expect(registry.get('general.test')?.metadata.version).toBe('2.0.0');
    });

    it('should detect and prevent plugin conflicts', async () => {
      const plugin1 = createTestPlugin('plugin1', 'general', '1.0.0', [], ['general.plugin2']);
      const plugin2 = createTestPlugin('plugin2', 'general', '1.0.0');

      await registry.register(plugin1);
      
      // Should reject conflicting plugin
      await expect(registry.register(plugin2)).rejects.toThrow();
      
      expect(registry.get('general.plugin1')).toBe(plugin1);
      expect(registry.get('general.plugin2')).toBeNull();
    });

    it('should validate plugin dependencies', async () => {
      const dependentPlugin = createTestPlugin('dependent', 'general', '1.0.0', ['general.dependency']);
      const dependencyPlugin = createTestPlugin('dependency', 'general', '1.0.0');

      // Should fail without dependency
      await expect(registry.register(dependentPlugin)).rejects.toThrow();

      // Should succeed with dependency
      await registry.register(dependencyPlugin);
      await registry.register(dependentPlugin);

      expect(registry.get('general.dependency')).toBe(dependencyPlugin);
      expect(registry.get('general.dependent')).toBe(dependentPlugin);
    });

    it('should detect circular dependencies', async () => {
      const plugin1 = createTestPlugin('plugin1', 'general', '1.0.0', ['general.plugin2']);
      const plugin2 = createTestPlugin('plugin2', 'general', '1.0.0', ['general.plugin1']);

      await expect(registry.register(plugin1)).rejects.toThrow();
      await expect(registry.register(plugin2)).rejects.toThrow();

      expect(registry.get('general.plugin1')).toBeNull();
      expect(registry.get('general.plugin2')).toBeNull();
    });
  });

  describe('Plugin Lifecycle Isolation', () => {
    it('should isolate plugin installation failures', async () => {
      const goodPlugin = createTestPlugin('good', 'general');
      const badPlugin = createTestPlugin('bad', 'general');
      
      // Make bad plugin fail installation
      badPlugin.install = async () => {
        throw new Error('Installation failed');
      };

      await registry.register(goodPlugin);
      await expect(registry.register(badPlugin)).rejects.toThrow('Installation failed');

      expect(registry.get('general.good')).toBe(goodPlugin);
      expect(registry.get('general.bad')).toBeNull();
    });

    it('should isolate plugin validation failures', async () => {
      const validPlugin = createTestPlugin('valid', 'general');
      const invalidPlugin = createTestPlugin('invalid', 'general');
      
      // Make invalid plugin fail validation
      invalidPlugin.validate = async () => false;

      await registry.register(validPlugin);
      await expect(registry.register(invalidPlugin)).rejects.toThrow();

      expect(registry.get('general.valid')).toBe(validPlugin);
      expect(registry.get('general.invalid')).toBeNull();
    });

    it('should handle plugin uninstallation failures gracefully', async () => {
      const plugin = createTestPlugin('test', 'general');
      
      // Make plugin fail uninstallation
      plugin.uninstall = async () => {
        throw new Error('Uninstallation failed');
      };

      await registry.register(plugin);
      expect(registry.get('general.test')).toBe(plugin);

      // Should remove from registry despite uninstall failure
      await expect(registry.unregister('general.test')).rejects.toThrow('Uninstallation failed');
      expect(registry.get('general.test')).toBeNull();
    });
  });

  describe('Plugin Search and Filtering Isolation', () => {
    beforeEach(async () => {
      const plugins = [
        createTestPlugin('bmi', 'general', '1.0.0'),
        createTestPlugin('egfr', 'nephrology', '1.0.0'),
        createTestPlugin('cha2ds2-vasc', 'cardiology', '1.0.0'),
        createTestPlugin('creatinine', 'nephrology', '1.0.0'),
        createTestPlugin('cholesterol', 'cardiology', '1.0.0')
      ];

      for (const plugin of plugins) {
        await registry.register(plugin);
      }
    });

    it('should isolate search results by namespace', async () => {
      const nephrologyResults = registry.search({ namespace: 'nephrology' });
      expect(nephrologyResults.plugins).toHaveLength(2);
      expect(nephrologyResults.plugins.every(entry => entry.plugin.metadata.namespace === 'nephrology')).toBe(true);

      const cardiologyResults = registry.search({ namespace: 'cardiology' });
      expect(cardiologyResults.plugins).toHaveLength(2);
      expect(cardiologyResults.plugins.every(entry => entry.plugin.metadata.namespace === 'cardiology')).toBe(true);
    });

    it('should isolate search results by query', async () => {
      const bmiResults = registry.search({ query: 'bmi' });
      expect(bmiResults.plugins).toHaveLength(1);
      expect(bmiResults.plugins[0].plugin.metadata.id).toBe('bmi');

      const egfrResults = registry.search({ query: 'egfr' });
      expect(egfrResults.plugins).toHaveLength(1);
      expect(egfrResults.plugins[0].plugin.metadata.id).toBe('egfr');
    });

    it('should handle empty search results gracefully', async () => {
      const noResults = registry.search({ query: 'nonexistent' });
      expect(noResults.plugins).toHaveLength(0);
      expect(noResults.total).toBe(0);

      const noNamespaceResults = registry.search({ namespace: 'nonexistent' });
      expect(noNamespaceResults.plugins).toHaveLength(0);
      expect(noNamespaceResults.total).toBe(0);
    });
  });

  describe('Plugin Performance Isolation', () => {
    it('should track plugin statistics independently', async () => {
      const plugin1 = createTestPlugin('plugin1', 'general');
      const plugin2 = createTestPlugin('plugin2', 'cardiology');

      await registry.register(plugin1);
      await registry.register(plugin2);

      // Simulate different usage patterns
      registry.updatePluginStats('general.plugin1', 100, false);
      registry.updatePluginStats('general.plugin1', 150, false);
      registry.updatePluginStats('cardiology.plugin2', 200, true);

      const stats = registry.getRegistryStats();
      expect(stats.totalPlugins).toBe(2);

      // Performance metrics should be isolated
      const systemMetrics = registry.getSystemPerformanceMetrics();
      expect(systemMetrics.totalPlugins).toBe(2);
      expect(systemMetrics.pluginMetrics).toHaveLength(2);
    });

    it('should isolate plugin health checks', async () => {
      const healthyPlugin = createTestPlugin('healthy', 'general');
      const unhealthyPlugin = createTestPlugin('unhealthy', 'general');
      
      // Make unhealthy plugin fail validation
      unhealthyPlugin.validate = async () => false;

      await registry.register(healthyPlugin);
      await registry.register(unhealthyPlugin);

      const healthyCheck = await registry.performHealthCheck('general.healthy');
      const unhealthyCheck = await registry.performHealthCheck('general.unhealthy');

      expect(healthyCheck.healthy).toBe(true);
      expect(unhealthyCheck.healthy).toBe(false);
      expect(unhealthyCheck.issues).toHaveLength(1);
    });
  });

  describe('Event System Isolation', () => {
    it('should isolate plugin events', async () => {
      const plugin1 = createTestPlugin('plugin1', 'general');
      const plugin2 = createTestPlugin('plugin2', 'cardiology');

      const plugin1Events: string[] = [];
      const plugin2Events: string[] = [];

      const eventEmitter = registry.getEventEmitter();

      eventEmitter.on('afterLoad', (eventData) => {
        if (eventData.plugin.metadata.id === 'plugin1') {
          plugin1Events.push('afterLoad');
        } else if (eventData.plugin.metadata.id === 'plugin2') {
          plugin2Events.push('afterLoad');
        }
      });

      await registry.register(plugin1);
      await registry.register(plugin2);

      expect(plugin1Events).toEqual(['afterLoad']);
      expect(plugin2Events).toEqual(['afterLoad']);
    });

    it('should handle event listener errors without affecting other plugins', async () => {
      const plugin1 = createTestPlugin('plugin1', 'general');
      const plugin2 = createTestPlugin('plugin2', 'cardiology');

      const eventEmitter = registry.getEventEmitter();

      // Add failing event listener
      eventEmitter.on('afterLoad', (eventData) => {
        if (eventData.plugin.metadata.id === 'plugin1') {
          throw new Error('Event listener failed');
        }
      });

      // Both plugins should register successfully despite event listener failure
      await expect(registry.register(plugin1)).resolves.not.toThrow();
      await expect(registry.register(plugin2)).resolves.not.toThrow();

      expect(registry.get('general.plugin1')).toBe(plugin1);
      expect(registry.get('cardiology.plugin2')).toBe(plugin2);
    });
  });

  describe('Memory Management Isolation', () => {
    it('should clean up plugin resources on unregistration', async () => {
      const plugin = createTestPlugin('cleanup', 'general');
      let cleanupCalled = false;

      plugin.uninstall = async () => {
        cleanupCalled = true;
      };

      await registry.register(plugin);
      expect(registry.get('general.cleanup')).toBe(plugin);

      await registry.unregister('general.cleanup');
      expect(registry.get('general.cleanup')).toBeNull();
      expect(cleanupCalled).toBe(true);
    });

    it('should prevent memory leaks from failed registrations', async () => {
      const plugin = createTestPlugin('failing', 'general');
      
      plugin.install = async () => {
        throw new Error('Installation failed');
      };

      await expect(registry.register(plugin)).rejects.toThrow();
      
      // Plugin should not be in registry
      expect(registry.get('general.failing')).toBeNull();
      
      // Registry stats should not include failed plugin
      const stats = registry.getRegistryStats();
      expect(stats.totalPlugins).toBe(0);
    });
  });

  describe('Concurrent Operations Isolation', () => {
    it('should handle concurrent registrations safely', async () => {
      const plugins = Array.from({ length: 10 }, (_, i) => 
        createTestPlugin(`concurrent${i}`, 'general', '1.0.0')
      );

      const registrationPromises = plugins.map(plugin => registry.register(plugin));
      await Promise.all(registrationPromises);

      expect(registry.listAll()).toHaveLength(10);
      plugins.forEach((_, i) => {
        expect(registry.get(`general.concurrent${i}`)).toBeTruthy();
      });
    });

    it('should handle concurrent unregistrations safely', async () => {
      const plugins = Array.from({ length: 5 }, (_, i) => 
        createTestPlugin(`unregister${i}`, 'general', '1.0.0')
      );

      // Register all plugins
      for (const plugin of plugins) {
        await registry.register(plugin);
      }

      expect(registry.listAll()).toHaveLength(5);

      // Unregister all concurrently
      const unregistrationPromises = plugins.map((_, i) => 
        registry.unregister(`general.unregister${i}`)
      );
      await Promise.all(unregistrationPromises);

      expect(registry.listAll()).toHaveLength(0);
    });

    it('should handle mixed concurrent operations', async () => {
      const registerPlugins = Array.from({ length: 3 }, (_, i) => 
        createTestPlugin(`register${i}`, 'general', '1.0.0')
      );

      const unregisterPlugins = Array.from({ length: 2 }, (_, i) => 
        createTestPlugin(`unregister${i}`, 'cardiology', '1.0.0')
      );

      // Pre-register plugins to be unregistered
      for (const plugin of unregisterPlugins) {
        await registry.register(plugin);
      }

      // Mix registration and unregistration operations
      const operations = [
        ...registerPlugins.map(plugin => registry.register(plugin)),
        ...unregisterPlugins.map((_, i) => registry.unregister(`cardiology.unregister${i}`))
      ];

      await Promise.all(operations);

      expect(registry.listAll()).toHaveLength(3);
      expect(registry.getByNamespace('general')).toHaveLength(3);
      expect(registry.getByNamespace('cardiology')).toHaveLength(0);
    });
  });
});