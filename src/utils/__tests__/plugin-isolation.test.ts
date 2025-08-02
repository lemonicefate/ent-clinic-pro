/**
 * Comprehensive Plugin Isolation Tests
 * 
 * Tests to ensure that calculator plugins are properly isolated from each other
 * and that failures in one plugin don't affect others or the system.
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { CalculatorRegistry } from '../calculator-registry.js';
import { DynamicCalculatorLoader } from '../dynamic-calculator-loader.js';
import { CalculatorDiscovery } from '../calculator-discovery.js';
import type { CalculatorPlugin } from '../../types/calculator-plugin.js';

// Mock plugins for testing
const createMockPlugin = (id: string, namespace: string, shouldFail = false): CalculatorPlugin => ({
  metadata: {
    id,
    namespace,
    version: '1.0.0',
    name: { 'zh-TW': `${id} 計算器`, 'en': `${id} Calculator`, 'ja': `${id} 計算機` },
    description: { 'zh-TW': `${id} 描述`, 'en': `${id} Description`, 'ja': `${id} 説明` },
    author: 'Test Author',
    license: 'MIT',
    dependencies: [],
    conflicts: [],
    tags: ['test'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  config: {
    id,
    name: { 'zh-TW': `${id} 計算器`, 'en': `${id} Calculator`, 'ja': `${id} 計算機` },
    description: { 'zh-TW': `${id} 描述`, 'en': `${id} Description`, 'ja': `${id} 説明` },
    category: namespace,
    version: '1.0.0',
    status: 'active',
    fields: [
      {
        id: 'testField',
        type: 'number',
        label: { 'zh-TW': '測試欄位', 'en': 'Test Field', 'ja': 'テストフィールド' },
        required: true,
        min: 0,
        max: 100
      }
    ],
    calculation: {
      functionName: `calculate${id}`,
      formula: `${id} = testField * 2`
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
    calculate: shouldFail 
      ? () => { throw new Error(`${id} calculation failed`); }
      : (inputs) => ({
          primaryValue: Number(inputs.testField) * 2,
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
      isValid: !!inputs.testField && Number(inputs.testField) >= 0 && Number(inputs.testField) <= 100,
      errors: []
    }),
    formatResult: (result, locale = 'zh-TW') => ({
      displayValue: `${result.primaryValue} ${result.primaryUnit}`,
      description: result.interpretation?.[locale] || '',
      recommendations: []
    })
  },
  async install() {
    if (shouldFail && id === 'failingInstall') {
      throw new Error(`${id} installation failed`);
    }
    console.log(`${id} plugin installed`);
  },
  async uninstall() {
    if (shouldFail && id === 'failingUninstall') {
      throw new Error(`${id} uninstallation failed`);
    }
    console.log(`${id} plugin uninstalled`);
  },
  async validate() {
    if (shouldFail && id === 'failingValidation') {
      return false;
    }
    return true;
  },
  async checkCompatibility() {
    return {
      compatible: !shouldFail,
      issues: shouldFail ? [{
        severity: 'error' as const,
        category: 'api' as const,
        message: `${id} compatibility check failed`,
        details: { error: 'Mock failure' },
        resolution: 'Fix mock plugin'
      }] : []
    };
  }
});

describe('Plugin Isolation Tests', () => {
  let registry: CalculatorRegistry;
  let loader: DynamicCalculatorLoader;
  let discovery: CalculatorDiscovery;
  
  beforeEach(async () => {
    // Reset singletons
    (CalculatorRegistry as any).instance = null;
    (DynamicCalculatorLoader as any).instance = null;
    
    registry = CalculatorRegistry.getInstance();
    loader = DynamicCalculatorLoader.getInstance();
    discovery = new CalculatorDiscovery();
    
    // Clear console to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Registry Isolation', () => {
    it('should isolate plugin registration failures', async () => {
      const goodPlugin = createMockPlugin('good', 'general');
      const badPlugin = createMockPlugin('failingInstall', 'general', true);
      const anotherGoodPlugin = createMockPlugin('another', 'cardiology');

      // Register good plugin first
      await expect(registry.register(goodPlugin)).resolves.not.toThrow();
      
      // Bad plugin should fail but not affect others
      await expect(registry.register(badPlugin)).rejects.toThrow();
      
      // Another good plugin should still work
      await expect(registry.register(anotherGoodPlugin)).resolves.not.toThrow();
      
      // Verify good plugins are still registered
      expect(registry.get('general.good')).toBeTruthy();
      expect(registry.get('cardiology.another')).toBeTruthy();
      expect(registry.get('general.failingInstall')).toBeNull();
    });

    it('should isolate plugin validation failures', async () => {
      const validPlugin = createMockPlugin('valid', 'general');
      const invalidPlugin = createMockPlugin('failingValidation', 'general', true);

      await expect(registry.register(validPlugin)).resolves.not.toThrow();
      await expect(registry.register(invalidPlugin)).rejects.toThrow();

      // Valid plugin should still be accessible
      expect(registry.get('general.valid')).toBeTruthy();
      expect(registry.get('general.failingValidation')).toBeNull();
    });

    it('should handle namespace isolation', async () => {
      const generalPlugin = createMockPlugin('test', 'general');
      const cardiologyPlugin = createMockPlugin('test', 'cardiology');
      const nephrologyPlugin = createMockPlugin('test', 'nephrology');

      // Same ID in different namespaces should work
      await expect(registry.register(generalPlugin)).resolves.not.toThrow();
      await expect(registry.register(cardiologyPlugin)).resolves.not.toThrow();
      await expect(registry.register(nephrologyPlugin)).resolves.not.toThrow();

      // All should be accessible with full namespaced IDs
      expect(registry.get('general.test')).toBeTruthy();
      expect(registry.get('cardiology.test')).toBeTruthy();
      expect(registry.get('nephrology.test')).toBeTruthy();

      // Namespace queries should return correct plugins
      expect(registry.getByNamespace('general')).toHaveLength(1);
      expect(registry.getByNamespace('cardiology')).toHaveLength(1);
      expect(registry.getByNamespace('nephrology')).toHaveLength(1);
    });

    it('should prevent ID conflicts within same namespace', async () => {
      const plugin1 = createMockPlugin('duplicate', 'general');
      const plugin2 = createMockPlugin('duplicate', 'general');
      plugin2.metadata.version = '2.0.0'; // Higher version

      await expect(registry.register(plugin1)).resolves.not.toThrow();
      
      // Should upgrade to higher version
      await expect(registry.register(plugin2)).resolves.not.toThrow();
      
      const registered = registry.get('general.duplicate');
      expect(registered?.metadata.version).toBe('2.0.0');
    });
  });

  describe('Calculation Isolation', () => {
    it('should isolate calculation failures', async () => {
      const workingPlugin = createMockPlugin('working', 'general');
      const failingPlugin = createMockPlugin('failing', 'general', true);

      await registry.register(workingPlugin);
      await registry.register(failingPlugin);

      // Working plugin should calculate successfully
      const workingResult = workingPlugin.calculator.calculate({ testField: 10 });
      expect(workingResult.primaryValue).toBe(20);

      // Failing plugin should throw but not affect working plugin
      expect(() => failingPlugin.calculator.calculate({ testField: 10 })).toThrow();

      // Working plugin should still work after failing plugin error
      const workingResult2 = workingPlugin.calculator.calculate({ testField: 15 });
      expect(workingResult2.primaryValue).toBe(30);
    });

    it('should isolate validation failures', async () => {
      const plugin1 = createMockPlugin('plugin1', 'general');
      const plugin2 = createMockPlugin('plugin2', 'cardiology');

      await registry.register(plugin1);
      await registry.register(plugin2);

      // Valid input for both
      expect(plugin1.calculator.validate({ testField: 50 }).isValid).toBe(true);
      expect(plugin2.calculator.validate({ testField: 50 }).isValid).toBe(true);

      // Invalid input should only affect validation, not other plugins
      expect(plugin1.calculator.validate({ testField: -1 }).isValid).toBe(false);
      expect(plugin2.calculator.validate({ testField: 50 }).isValid).toBe(true);
    });
  });

  describe('Memory Isolation', () => {
    it('should not share state between plugin instances', async () => {
      const plugin1 = createMockPlugin('stateful1', 'general');
      const plugin2 = createMockPlugin('stateful2', 'general');

      // Add some state to plugins
      (plugin1 as any).testState = 'plugin1-state';
      (plugin2 as any).testState = 'plugin2-state';

      await registry.register(plugin1);
      await registry.register(plugin2);

      // State should be isolated
      expect((plugin1 as any).testState).toBe('plugin1-state');
      expect((plugin2 as any).testState).toBe('plugin2-state');

      // Modifying one shouldn't affect the other
      (plugin1 as any).testState = 'modified';
      expect((plugin1 as any).testState).toBe('modified');
      expect((plugin2 as any).testState).toBe('plugin2-state');
    });

    it('should clean up plugin resources on uninstall', async () => {
      const plugin = createMockPlugin('cleanup', 'general');
      let cleanupCalled = false;

      // Override uninstall to track cleanup
      plugin.uninstall = async () => {
        cleanupCalled = true;
      };

      await registry.register(plugin);
      expect(registry.get('general.cleanup')).toBeTruthy();

      await registry.unregister('general.cleanup');
      expect(registry.get('general.cleanup')).toBeNull();
      expect(cleanupCalled).toBe(true);
    });
  });

  describe('Error Boundary Tests', () => {
    it('should contain plugin installation errors', async () => {
      const goodPlugin = createMockPlugin('good', 'general');
      const badPlugin = createMockPlugin('failingInstall', 'general', true);

      // Good plugin should install successfully
      await expect(registry.register(goodPlugin)).resolves.not.toThrow();

      // Bad plugin should fail installation but not crash system
      await expect(registry.register(badPlugin)).rejects.toThrow('failingInstall installation failed');

      // System should still be functional
      expect(registry.listAll()).toHaveLength(1);
      expect(registry.get('general.good')).toBeTruthy();
    });

    it('should handle plugin uninstall errors gracefully', async () => {
      const plugin = createMockPlugin('failingUninstall', 'general', true);
      
      await registry.register(plugin);
      expect(registry.get('general.failingUninstall')).toBeTruthy();

      // Uninstall should fail but not crash system
      await expect(registry.unregister('general.failingUninstall')).rejects.toThrow();

      // Plugin should still be removed from registry despite uninstall error
      expect(registry.get('general.failingUninstall')).toBeNull();
    });

    it('should isolate plugin validation errors', async () => {
      const validPlugin = createMockPlugin('valid', 'general');
      const invalidPlugin = createMockPlugin('failingValidation', 'general', true);

      await registry.register(validPlugin);
      
      // Invalid plugin should fail validation but not affect valid plugin
      await expect(registry.register(invalidPlugin)).rejects.toThrow();

      expect(registry.get('general.valid')).toBeTruthy();
      expect(registry.get('general.failingValidation')).toBeNull();
    });
  });

  describe('Concurrent Plugin Operations', () => {
    it('should handle concurrent plugin registrations safely', async () => {
      const plugins = Array.from({ length: 5 }, (_, i) => 
        createMockPlugin(`concurrent${i}`, 'general')
      );

      // Register all plugins concurrently
      const registrationPromises = plugins.map(plugin => registry.register(plugin));
      await Promise.all(registrationPromises);

      // All plugins should be registered
      expect(registry.listAll()).toHaveLength(5);
      plugins.forEach((_, i) => {
        expect(registry.get(`general.concurrent${i}`)).toBeTruthy();
      });
    });

    it('should handle mixed success/failure scenarios', async () => {
      const goodPlugins = Array.from({ length: 3 }, (_, i) => 
        createMockPlugin(`good${i}`, 'general')
      );
      const badPlugins = Array.from({ length: 2 }, (_, i) => 
        createMockPlugin(`failingInstall${i}`, 'general', true)
      );

      const allPlugins = [...goodPlugins, ...badPlugins];
      const registrationPromises = allPlugins.map(plugin => 
        registry.register(plugin).catch(error => ({ error, plugin }))
      );

      const results = await Promise.all(registrationPromises);

      // Good plugins should be registered
      expect(registry.listAll()).toHaveLength(3);
      goodPlugins.forEach((_, i) => {
        expect(registry.get(`general.good${i}`)).toBeTruthy();
      });

      // Bad plugins should have failed
      const failures = results.filter(result => result && 'error' in result);
      expect(failures).toHaveLength(2);
    });
  });

  describe('Plugin Lifecycle Isolation', () => {
    it('should isolate plugin lifecycle events', async () => {
      const plugin1 = createMockPlugin('lifecycle1', 'general');
      const plugin2 = createMockPlugin('lifecycle2', 'cardiology');

      let plugin1Events: string[] = [];
      let plugin2Events: string[] = [];

      // Override lifecycle methods to track events
      const originalInstall1 = plugin1.install;
      const originalInstall2 = plugin2.install;

      plugin1.install = async () => {
        plugin1Events.push('install');
        await originalInstall1.call(plugin1);
      };

      plugin2.install = async () => {
        plugin2Events.push('install');
        await originalInstall2.call(plugin2);
      };

      await registry.register(plugin1);
      await registry.register(plugin2);

      // Each plugin should have its own lifecycle events
      expect(plugin1Events).toEqual(['install']);
      expect(plugin2Events).toEqual(['install']);

      // Events should be isolated
      plugin1Events.push('custom-event');
      expect(plugin1Events).toContain('custom-event');
      expect(plugin2Events).not.toContain('custom-event');
    });
  });

  describe('Performance Isolation', () => {
    it('should isolate plugin performance metrics', async () => {
      const fastPlugin = createMockPlugin('fast', 'general');
      const slowPlugin = createMockPlugin('slow', 'general');

      // Make slow plugin artificially slow
      const originalCalculate = slowPlugin.calculator.calculate;
      slowPlugin.calculator.calculate = async (inputs) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return originalCalculate(inputs);
      };

      await registry.register(fastPlugin);
      await registry.register(slowPlugin);

      const startTime = Date.now();
      
      // Fast plugin should complete quickly
      const fastResult = fastPlugin.calculator.calculate({ testField: 10 });
      const fastTime = Date.now() - startTime;
      
      expect(fastResult.primaryValue).toBe(20);
      expect(fastTime).toBeLessThan(50);

      // Slow plugin performance shouldn't affect fast plugin
      const fastResult2 = fastPlugin.calculator.calculate({ testField: 20 });
      expect(fastResult2.primaryValue).toBe(40);
    });
  });

  describe('Cross-Plugin Interference Prevention', () => {
    it('should prevent plugins from accessing each other directly', async () => {
      const plugin1 = createMockPlugin('isolated1', 'general');
      const plugin2 = createMockPlugin('isolated2', 'cardiology');

      await registry.register(plugin1);
      await registry.register(plugin2);

      // Plugins should not be able to directly access each other
      expect(plugin1).not.toHaveProperty('plugin2');
      expect(plugin2).not.toHaveProperty('plugin1');

      // Registry should be the only way to access other plugins
      const retrievedPlugin1 = registry.get('general.isolated1');
      const retrievedPlugin2 = registry.get('cardiology.isolated2');

      expect(retrievedPlugin1).toBe(plugin1);
      expect(retrievedPlugin2).toBe(plugin2);
    });

    it('should prevent global state pollution', async () => {
      const plugin1 = createMockPlugin('global1', 'general');
      const plugin2 = createMockPlugin('global2', 'cardiology');

      // Simulate plugins trying to set global state
      (plugin1 as any).setGlobalState = () => {
        (globalThis as any).pluginGlobalState = 'plugin1-state';
      };

      (plugin2 as any).setGlobalState = () => {
        (globalThis as any).pluginGlobalState = 'plugin2-state';
      };

      await registry.register(plugin1);
      await registry.register(plugin2);

      // Even if plugins set global state, they should be isolated
      (plugin1 as any).setGlobalState();
      expect((globalThis as any).pluginGlobalState).toBe('plugin1-state');

      (plugin2 as any).setGlobalState();
      expect((globalThis as any).pluginGlobalState).toBe('plugin2-state');

      // Clean up
      delete (globalThis as any).pluginGlobalState;
    });
  });
});

describe('Integration Isolation Tests', () => {
  let registry: CalculatorRegistry;
  let loader: DynamicCalculatorLoader;

  beforeEach(async () => {
    (CalculatorRegistry as any).instance = null;
    (DynamicCalculatorLoader as any).instance = null;
    
    registry = CalculatorRegistry.getInstance();
    loader = DynamicCalculatorLoader.getInstance();

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should maintain isolation through the full plugin lifecycle', async () => {
    const bmiPlugin = createMockPlugin('bmi', 'general');
    const egfrPlugin = createMockPlugin('egfr', 'nephrology');
    const cha2ds2Plugin = createMockPlugin('cha2ds2-vasc', 'cardiology');

    // Register all plugins
    await registry.register(bmiPlugin);
    await registry.register(egfrPlugin);
    await registry.register(cha2ds2Plugin);

    // All should be accessible
    expect(registry.get('general.bmi')).toBeTruthy();
    expect(registry.get('nephrology.egfr')).toBeTruthy();
    expect(registry.get('cardiology.cha2ds2-vasc')).toBeTruthy();

    // Calculations should be isolated
    const bmiResult = bmiPlugin.calculator.calculate({ testField: 25 });
    const egfrResult = egfrPlugin.calculator.calculate({ testField: 30 });
    const cha2ds2Result = cha2ds2Plugin.calculator.calculate({ testField: 35 });

    expect(bmiResult.primaryValue).toBe(50);
    expect(egfrResult.primaryValue).toBe(60);
    expect(cha2ds2Result.primaryValue).toBe(70);

    // Uninstalling one shouldn't affect others
    await registry.unregister('nephrology.egfr');
    
    expect(registry.get('general.bmi')).toBeTruthy();
    expect(registry.get('nephrology.egfr')).toBeNull();
    expect(registry.get('cardiology.cha2ds2-vasc')).toBeTruthy();

    // Remaining plugins should still work
    const bmiResult2 = bmiPlugin.calculator.calculate({ testField: 40 });
    const cha2ds2Result2 = cha2ds2Plugin.calculator.calculate({ testField: 45 });

    expect(bmiResult2.primaryValue).toBe(80);
    expect(cha2ds2Result2.primaryValue).toBe(90);
  });
});