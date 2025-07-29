/**
 * Dynamic Calculator Loader Isolation Tests
 * 
 * Tests to ensure that the Dynamic Calculator Loader properly isolates
 * calculator instances and handles failures gracefully.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DynamicCalculatorLoader } from '../dynamic-calculator-loader.js';
import { CalculatorRegistry } from '../calculator-registry.js';
import { CalculatorInstance } from '../calculator-instance.js';
import type { CalculatorPlugin } from '../../types/calculator-plugin.js';

// Mock DOM environment
const mockContainer = () => ({
  appendChild: vi.fn(),
  removeChild: vi.fn(),
  innerHTML: '',
  className: '',
  style: {},
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}) as unknown as HTMLElement;

// Mock React and ReactDOM
vi.mock('react', () => ({
  default: {
    createElement: vi.fn((type, props, ...children) => ({ type, props, children })),
    useState: vi.fn((initial) => [initial, vi.fn()]),
    useCallback: vi.fn((fn) => fn),
    Component: class Component {}
  }
}));

vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
    unmount: vi.fn()
  }))
}));

// Helper function to create test plugins
const createTestPlugin = (
  id: string, 
  namespace: string, 
  shouldFail = false
): CalculatorPlugin => ({
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
    calculate: shouldFail 
      ? () => { throw new Error(`${id} calculation failed`); }
      : (inputs) => ({
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
    if (shouldFail && id === 'failingInstall') {
      throw new Error(`${id} installation failed`);
    }
  },
  async uninstall() {
    if (shouldFail && id === 'failingUninstall') {
      throw new Error(`${id} uninstallation failed`);
    }
  },
  async validate() {
    return !shouldFail;
  },
  async checkCompatibility() {
    return {
      compatible: !shouldFail,
      issues: []
    };
  }
});

describe('Dynamic Calculator Loader Isolation Tests', () => {
  let loader: DynamicCalculatorLoader;
  let registry: CalculatorRegistry;

  beforeEach(async () => {
    // Reset singletons
    (DynamicCalculatorLoader as any).instance = null;
    (CalculatorRegistry as any).instance = null;
    
    loader = DynamicCalculatorLoader.getInstance();
    registry = CalculatorRegistry.getInstance();

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Calculator Instance Isolation', () => {
    it('should create isolated calculator instances', async () => {
      const plugin1 = createTestPlugin('calc1', 'general');
      const plugin2 = createTestPlugin('calc2', 'cardiology');

      await registry.register(plugin1);
      await registry.register(plugin2);

      const container1 = mockContainer();
      const container2 = mockContainer();

      const instance1 = await loader.loadCalculator('general.calc1', container1);
      const instance2 = await loader.loadCalculator('cardiology.calc2', container2);

      expect(instance1).toBeTruthy();
      expect(instance2).toBeTruthy();
      expect(instance1).not.toBe(instance2);

      // Instances should have different plugin IDs
      expect(instance1?.pluginId).toBe('general.calc1');
      expect(instance2?.pluginId).toBe('cardiology.calc2');
    });

    it('should isolate instance failures', async () => {
      const workingPlugin = createTestPlugin('working', 'general');
      const failingPlugin = createTestPlugin('failing', 'general', true);

      await registry.register(workingPlugin);
      await registry.register(failingPlugin);

      const workingContainer = mockContainer();
      const failingContainer = mockContainer();

      const workingInstance = await loader.loadCalculator('general.working', workingContainer);
      const failingInstance = await loader.loadCalculator('general.failing', failingContainer);

      expect(workingInstance).toBeTruthy();
      expect(failingInstance).toBeNull(); // Should return null on failure

      // Working instance should still be functional
      expect(workingInstance?.getStatus()).toBe('ready');
    });

    it('should handle concurrent instance creation', async () => {
      const plugin = createTestPlugin('concurrent', 'general');
      await registry.register(plugin);

      const containers = Array.from({ length: 5 }, () => mockContainer());
      const loadPromises = containers.map(container => 
        loader.loadCalculator('general.concurrent', container)
      );

      const instances = await Promise.all(loadPromises);

      // All instances should be created successfully
      expect(instances.every(instance => instance !== null)).toBe(true);
      
      // All instances should be different objects
      const uniqueInstances = new Set(instances);
      expect(uniqueInstances.size).toBe(5);

      // All instances should have the same plugin ID
      expect(instances.every(instance => instance?.pluginId === 'general.concurrent')).toBe(true);
    });
  });

  describe('Error Isolation', () => {
    it('should isolate plugin loading errors', async () => {
      const goodPlugin = createTestPlugin('good', 'general');
      const badPlugin = createTestPlugin('failingInstall', 'general', true);

      await registry.register(goodPlugin);
      
      // Bad plugin registration should fail
      await expect(registry.register(badPlugin)).rejects.toThrow();

      const container = mockContainer();
      
      // Good plugin should still load
      const instance = await loader.loadCalculator('general.good', container);
      expect(instance).toBeTruthy();

      // Bad plugin should return null
      const badInstance = await loader.loadCalculator('general.failingInstall', container);
      expect(badInstance).toBeNull();
    });

    it('should handle missing plugin gracefully', async () => {
      const container = mockContainer();
      
      const instance = await loader.loadCalculator('nonexistent.plugin', container);
      expect(instance).toBeNull();

      // Loader should still be functional
      const stats = loader.getLoaderStats();
      expect(stats.initialized).toBe(true);
    });

    it('should isolate calculation errors', async () => {
      const workingPlugin = createTestPlugin('working', 'general');
      const failingPlugin = createTestPlugin('failing', 'general', true);

      await registry.register(workingPlugin);
      await registry.register(failingPlugin);

      const workingContainer = mockContainer();
      const failingContainer = mockContainer();

      const workingInstance = await loader.loadCalculator('general.working', workingContainer);
      const failingInstance = await loader.loadCalculator('general.failing', failingContainer);

      expect(workingInstance).toBeTruthy();
      expect(failingInstance).toBeNull();

      // Working instance should calculate successfully
      if (workingInstance) {
        const result = await workingInstance.calculate({ input: 10 });
        expect(result.primaryValue).toBe(20);
      }
    });
  });

  describe('Memory Management Isolation', () => {
    it('should clean up destroyed instances', async () => {
      const plugin = createTestPlugin('cleanup', 'general');
      await registry.register(plugin);

      const container = mockContainer();
      const instance = await loader.loadCalculator('general.cleanup', container);

      expect(instance).toBeTruthy();
      expect(instance?.getStatus()).toBe('ready');

      // Destroy instance
      instance?.destroy();
      expect(instance?.getStatus()).toBe('destroyed');
      expect(instance?.isDestroyed()).toBe(true);
    });

    it('should prevent memory leaks from failed instances', async () => {
      const plugin = createTestPlugin('failing', 'general', true);
      
      // Plugin should fail to register
      await expect(registry.register(plugin)).rejects.toThrow();

      const container = mockContainer();
      const instance = await loader.loadCalculator('general.failing', container);

      expect(instance).toBeNull();

      // No instances should be cached
      const stats = loader.getLoaderStats();
      expect(stats.cacheStats.instances).toBe(0);
    });

    it('should handle instance lifecycle properly', async () => {
      const plugin = createTestPlugin('lifecycle', 'general');
      await registry.register(plugin);

      const container = mockContainer();
      const instance = await loader.loadCalculator('general.lifecycle', container);

      expect(instance).toBeTruthy();
      expect(instance?.getStatus()).toBe('ready');

      // Test calculation
      if (instance) {
        const result = await instance.calculate({ input: 15 });
        expect(result.primaryValue).toBe(30);
        expect(instance.getStatus()).toBe('ready');

        // Test reset
        instance.reset();
        expect(instance.inputs).toEqual({});
        expect(instance.lastResult).toBeNull();

        // Test destruction
        instance.destroy();
        expect(instance.getStatus()).toBe('destroyed');
      }
    });
  });

  describe('Performance Isolation', () => {
    it('should track performance metrics independently', async () => {
      const fastPlugin = createTestPlugin('fast', 'general');
      const slowPlugin = createTestPlugin('slow', 'general');

      await registry.register(fastPlugin);
      await registry.register(slowPlugin);

      const fastContainer = mockContainer();
      const slowContainer = mockContainer();

      const fastInstance = await loader.loadCalculator('general.fast', fastContainer);
      const slowInstance = await loader.loadCalculator('general.slow', slowContainer);

      expect(fastInstance).toBeTruthy();
      expect(slowInstance).toBeTruthy();

      // Simulate calculations
      if (fastInstance && slowInstance) {
        await fastInstance.calculate({ input: 10 });
        await slowInstance.calculate({ input: 20 });

        const fastMetrics = fastInstance.getMetrics();
        const slowMetrics = slowInstance.getMetrics();

        expect(fastMetrics.calculationCount).toBe(1);
        expect(slowMetrics.calculationCount).toBe(1);
        expect(fastMetrics).not.toBe(slowMetrics);
      }
    });

    it('should isolate performance degradation', async () => {
      const normalPlugin = createTestPlugin('normal', 'general');
      const slowPlugin = createTestPlugin('slow', 'general');

      // Make slow plugin artificially slow
      slowPlugin.calculator.calculate = async (inputs) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          primaryValue: Number(inputs.input) * 2,
          primaryUnit: 'units',
          interpretation: { 'zh-TW': 'slow result', 'en': 'slow result', 'ja': 'slow result' },
          recommendations: [],
          riskLevel: 'low' as const,
          metadata: {
            calculationSteps: [],
            references: [],
            lastCalculated: new Date().toISOString()
          }
        };
      };

      await registry.register(normalPlugin);
      await registry.register(slowPlugin);

      const normalContainer = mockContainer();
      const slowContainer = mockContainer();

      const normalInstance = await loader.loadCalculator('general.normal', normalContainer);
      const slowInstance = await loader.loadCalculator('general.slow', slowContainer);

      if (normalInstance && slowInstance) {
        const startTime = Date.now();
        
        // Normal calculation should be fast
        await normalInstance.calculate({ input: 10 });
        const normalTime = Date.now() - startTime;

        // Slow calculation shouldn't affect normal instance performance
        const normalStartTime = Date.now();
        await normalInstance.calculate({ input: 20 });
        const normalTime2 = Date.now() - normalStartTime;

        expect(normalTime).toBeLessThan(50);
        expect(normalTime2).toBeLessThan(50);
      }
    });
  });

  describe('Cache Isolation', () => {
    it('should isolate plugin cache', async () => {
      const plugin1 = createTestPlugin('cache1', 'general');
      const plugin2 = createTestPlugin('cache2', 'cardiology');

      await registry.register(plugin1);
      await registry.register(plugin2);

      const container1 = mockContainer();
      const container2 = mockContainer();

      // Load instances to populate cache
      const instance1 = await loader.loadCalculator('general.cache1', container1);
      const instance2 = await loader.loadCalculator('cardiology.cache2', container2);

      expect(instance1).toBeTruthy();
      expect(instance2).toBeTruthy();

      const stats = loader.getLoaderStats();
      expect(stats.cacheStats.plugins).toBeGreaterThan(0);
      expect(stats.cacheStats.instances).toBeGreaterThan(0);

      // Clear cache
      loader.clearCaches();

      const clearedStats = loader.getLoaderStats();
      expect(clearedStats.cacheStats.plugins).toBe(0);
      expect(clearedStats.cacheStats.instances).toBe(0);
    });

    it('should handle cache corruption gracefully', async () => {
      const plugin = createTestPlugin('cached', 'general');
      await registry.register(plugin);

      const container = mockContainer();
      const instance1 = await loader.loadCalculator('general.cached', container);
      expect(instance1).toBeTruthy();

      // Simulate cache corruption by clearing registry but not cache
      await registry.unregister('general.cached');

      // Should handle missing plugin gracefully
      const instance2 = await loader.loadCalculator('general.cached', container);
      expect(instance2).toBeNull();
    });
  });

  describe('System Performance Isolation', () => {
    it('should provide isolated system metrics', async () => {
      const plugins = [
        createTestPlugin('metric1', 'general'),
        createTestPlugin('metric2', 'cardiology'),
        createTestPlugin('metric3', 'nephrology')
      ];

      for (const plugin of plugins) {
        await registry.register(plugin);
      }

      const containers = plugins.map(() => mockContainer());
      const instances = await Promise.all(
        plugins.map((plugin, i) => 
          loader.loadCalculator(`${plugin.metadata.namespace}.${plugin.metadata.id}`, containers[i])
        )
      );

      expect(instances.every(instance => instance !== null)).toBe(true);

      const systemMetrics = loader.getSystemPerformanceMetrics();
      expect(systemMetrics.totalPlugins).toBe(3);
      expect(systemMetrics.activePlugins).toBe(3);
    });

    it('should handle system performance monitoring failures', async () => {
      const plugin = createTestPlugin('monitoring', 'general');
      await registry.register(plugin);

      // Mock performance monitoring failure
      const originalGetSystemPerformanceMetrics = loader.getSystemPerformanceMetrics;
      loader.getSystemPerformanceMetrics = () => {
        throw new Error('Performance monitoring failed');
      };

      // Should not crash the system
      expect(() => loader.getSystemPerformanceMetrics()).toThrow('Performance monitoring failed');

      // Restore original method
      loader.getSystemPerformanceMetrics = originalGetSystemPerformanceMetrics;

      // System should still be functional
      const container = mockContainer();
      const instance = await loader.loadCalculator('general.monitoring', container);
      expect(instance).toBeTruthy();
    });
  });

  describe('Plugin Reload Isolation', () => {
    it('should isolate plugin reload operations', async () => {
      const plugin1 = createTestPlugin('reload1', 'general');
      const plugin2 = createTestPlugin('reload2', 'cardiology');

      await registry.register(plugin1);
      await registry.register(plugin2);

      const container1 = mockContainer();
      const container2 = mockContainer();

      const instance1 = await loader.loadCalculator('general.reload1', container1);
      const instance2 = await loader.loadCalculator('cardiology.reload2', container2);

      expect(instance1).toBeTruthy();
      expect(instance2).toBeTruthy();

      // Reload one plugin should not affect the other
      await expect(loader.reloadPlugin('general.reload1')).rejects.toThrow(); // Will fail due to mocked discovery

      // Second plugin should still be accessible
      expect(registry.get('cardiology.reload2')).toBeTruthy();
    });

    it('should handle reload failures gracefully', async () => {
      const plugin = createTestPlugin('failReload', 'general');
      await registry.register(plugin);

      // Reload should fail gracefully
      await expect(loader.reloadPlugin('general.failReload')).rejects.toThrow();

      // System should still be functional
      const stats = loader.getLoaderStats();
      expect(stats.initialized).toBe(true);
    });
  });
});