/**
 * Legacy Compatibility Tests
 * 
 * Tests to ensure backward compatibility layer works correctly
 * and provides smooth migration path from old system to new plugin system.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  LegacyCalculatorEngine,
  LegacyCalculatorLoader,
  mapLegacyIdToPluginId,
  getCalculatorConfig,
  getAllCalculatorConfigs,
  getCalculatorBySlug,
  createMigrationGuide,
  checkLegacyCompatibility
} from '../legacy-compatibility.js';
import { CalculatorRegistry } from '../calculator-registry.js';
import type { CalculatorPlugin } from '../../types/calculator-plugin.js';

// Mock plugin for testing
const mockBMIPlugin: CalculatorPlugin = {
  metadata: {
    id: 'bmi',
    namespace: 'general',
    version: '1.0.0',
    name: {
      'zh-TW': 'BMI 計算器',
      'en': 'BMI Calculator',
      'ja': 'BMI計算機'
    },
    description: {
      'zh-TW': 'BMI 身體質量指數計算器',
      'en': 'Body Mass Index Calculator',
      'ja': 'ボディマス指数計算機'
    },
    author: 'Test Author',
    license: 'MIT',
    tags: ['health', 'bmi'],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-28T00:00:00Z',
    dependencies: [],
    compatibility: {
      minPlatformVersion: '1.0.0',
      maxPlatformVersion: '2.0.0'
    }
  },
  config: {
    category: 'general',
    metadata: {
      difficulty: 'basic',
      tags: ['health', 'bmi'],
      keywords: ['bmi', 'weight', 'health']
    },
    medical: {
      specialty: ['General Medicine'],
      evidenceLevel: 'A',
      references: []
    },
    ui: {
      fields: [
        {
          id: 'weight',
          type: 'number',
          label: {
            'zh-TW': '體重',
            'en': 'Weight',
            'ja': '体重'
          },
          required: true,
          validation: {
            min: 1,
            max: 500
          }
        },
        {
          id: 'height',
          type: 'number',
          label: {
            'zh-TW': '身高',
            'en': 'Height',
            'ja': '身長'
          },
          required: true,
          validation: {
            min: 50,
            max: 250
          }
        }
      ]
    },
    interpretation: [
      {
        range: [0, 18.5],
        risk: 'low',
        color: '#3B82F6',
        recommendation: {
          'zh-TW': '體重不足',
          'en': 'Underweight',
          'ja': '低体重'
        }
      }
    ]
  },
  validate: (inputs: any) => {
    const errors = [];
    if (!inputs.weight) {
      errors.push({ field: 'weight', message: 'Weight is required', type: 'required' });
    }
    if (!inputs.height) {
      errors.push({ field: 'height', message: 'Height is required', type: 'required' });
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  calculate: (inputs: any) => {
    const bmi = inputs.weight / Math.pow(inputs.height / 100, 2);
    return {
      primaryValue: bmi,
      primaryUnit: 'kg/m²',
      primaryLabel: {
        'zh-TW': 'BMI',
        'en': 'BMI',
        'ja': 'BMI'
      },
      interpretation: {
        'zh-TW': `您的 BMI 為 ${bmi.toFixed(1)}`,
        'en': `Your BMI is ${bmi.toFixed(1)}`,
        'ja': `あなたのBMIは${bmi.toFixed(1)}です`
      },
      recommendations: {
        'zh-TW': ['保持健康的生活方式'],
        'en': ['Maintain a healthy lifestyle'],
        'ja': ['健康的なライフスタイルを維持する']
      }
    };
  },
  component: null as any,
  async onLoad() { return true; },
  async onUnload() { return true; },
  async onError() { return { handled: true, recovery: 'retry' }; },
  async healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }
};

describe('Legacy Compatibility Layer', () => {
  let registry: CalculatorRegistry;
  let consoleWarnSpy: any;

  beforeEach(async () => {
    registry = CalculatorRegistry.getInstance();
    await registry.register(mockBMIPlugin);
    
    // Mock console.warn to capture deprecation warnings
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(async () => {
    await registry.unregisterAll();
    consoleWarnSpy.mockRestore();
  });

  describe('Legacy ID Mapping', () => {
    it('should map legacy BMI IDs to plugin ID', () => {
      expect(mapLegacyIdToPluginId('bmi')).toBe('general.bmi');
      expect(mapLegacyIdToPluginId('bmi-calculator')).toBe('general.bmi');
      expect(mapLegacyIdToPluginId('body-mass-index')).toBe('general.bmi');
    });

    it('should map legacy eGFR IDs to plugin ID', () => {
      expect(mapLegacyIdToPluginId('egfr')).toBe('nephrology.egfr');
      expect(mapLegacyIdToPluginId('kidney-function')).toBe('nephrology.egfr');
      expect(mapLegacyIdToPluginId('gfr-calculator')).toBe('nephrology.egfr');
    });

    it('should map legacy CHA2DS2-VASc IDs to plugin ID', () => {
      expect(mapLegacyIdToPluginId('cha2ds2-vasc')).toBe('cardiology.cha2ds2-vasc');
      expect(mapLegacyIdToPluginId('stroke-risk')).toBe('cardiology.cha2ds2-vasc');
      expect(mapLegacyIdToPluginId('atrial-fibrillation')).toBe('cardiology.cha2ds2-vasc');
    });

    it('should return original ID if no mapping found', () => {
      expect(mapLegacyIdToPluginId('unknown-calculator')).toBe('unknown-calculator');
    });

    it('should show deprecation warning when mapping legacy ID', () => {
      mapLegacyIdToPluginId('bmi');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEPRECATION WARNING')
      );
    });
  });

  describe('LegacyCalculatorEngine', () => {
    let engine: LegacyCalculatorEngine;

    beforeEach(() => {
      engine = new LegacyCalculatorEngine('zh-TW');
    });

    it('should show deprecation warning on instantiation', () => {
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('CalculatorEngine class')
      );
    });

    it('should get calculator config using legacy ID', async () => {
      const config = await engine.getCalculatorConfig('bmi');
      
      expect(config).toBeDefined();
      expect(config?.id).toBe('bmi');
      expect(config?.name['zh-TW']).toBe('BMI 計算器');
      expect(config?.category).toBe('general');
    });

    it('should return null for non-existent calculator', async () => {
      const config = await engine.getCalculatorConfig('non-existent');
      expect(config).toBeNull();
    });

    it('should perform calculation using legacy interface', async () => {
      const inputs = { weight: 70, height: 175 };
      const result = await engine.calculate('bmi', inputs);
      
      expect(result).toBeDefined();
      expect(result.score).toBeCloseTo(22.86, 1);
      expect(result.risk).toBe('low');
      expect(result.interpretation.recommendation).toContain('22.9');
    });

    it('should validate inputs using legacy interface', async () => {
      const errors = await engine.validate('bmi', {});
      
      expect(errors).toHaveLength(2);
      expect(errors[0].field).toBe('weight');
      expect(errors[0].type).toBe('required');
      expect(errors[1].field).toBe('height');
      expect(errors[1].type).toBe('required');
    });

    it('should validate inputs and return no errors for valid data', async () => {
      const errors = await engine.validate('bmi', { weight: 70, height: 175 });
      expect(errors).toHaveLength(0);
    });

    it('should throw error for calculation with invalid inputs', async () => {
      await expect(engine.calculate('bmi', {})).rejects.toThrow('Validation failed');
    });
  });

  describe('LegacyCalculatorLoader', () => {
    let loader: LegacyCalculatorLoader;

    beforeEach(() => {
      loader = new LegacyCalculatorLoader();
    });

    it('should show deprecation warning on instantiation', () => {
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('CalculatorLoader class')
      );
    });

    it('should load all calculators', async () => {
      const calculators = await loader.loadAllCalculators();
      
      expect(calculators).toHaveLength(1);
      expect(calculators[0].id).toBe('bmi');
      expect(calculators[0].name['zh-TW']).toBe('BMI 計算器');
    });

    it('should load calculator by ID', async () => {
      const calculator = await loader.loadCalculatorById('bmi');
      
      expect(calculator).toBeDefined();
      expect(calculator?.id).toBe('bmi');
      expect(calculator?.name['zh-TW']).toBe('BMI 計算器');
    });

    it('should load calculator by slug', async () => {
      const calculator = await loader.loadCalculatorBySlug('bmi');
      
      expect(calculator).toBeDefined();
      expect(calculator?.id).toBe('bmi');
    });

    it('should return null for non-existent calculator', async () => {
      const calculator = await loader.loadCalculatorById('non-existent');
      expect(calculator).toBeNull();
    });
  });

  describe('Legacy Function Wrappers', () => {
    it('should get calculator config with deprecation warning', async () => {
      const config = await getCalculatorConfig('bmi');
      
      expect(config).toBeDefined();
      expect(config?.id).toBe('bmi');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('getCalculatorConfig() function')
      );
    });

    it('should get all calculator configs with deprecation warning', async () => {
      const configs = await getAllCalculatorConfigs();
      
      expect(configs).toHaveLength(1);
      expect(configs[0].id).toBe('bmi');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('getAllCalculatorConfigs() function')
      );
    });

    it('should get calculator by slug with deprecation warning', async () => {
      const config = await getCalculatorBySlug('bmi');
      
      expect(config).toBeDefined();
      expect(config?.id).toBe('bmi');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('getCalculatorBySlug() function')
      );
    });
  });

  describe('Migration Utilities', () => {
    it('should create migration guide for legacy calculator', () => {
      const guide = createMigrationGuide('bmi');
      
      expect(guide.pluginId).toBe('general.bmi');
      expect(guide.migrationSteps).toHaveLength(5);
      expect(guide.migrationSteps[0]).toContain('Replace calculator ID');
      expect(guide.codeExamples.before).toContain('bmi');
      expect(guide.codeExamples.after).toContain('general.bmi');
    });

    it('should check legacy compatibility', async () => {
      const status = await checkLegacyCompatibility();
      
      expect(status.status).toBe('warning'); // Due to deprecation warnings
      expect(status.issues).toContain(expect.stringContaining('deprecation warnings'));
      expect(status.recommendations).toContain(
        expect.stringContaining('Review and update code')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle plugin not found gracefully', async () => {
      const engine = new LegacyCalculatorEngine();
      const config = await engine.getCalculatorConfig('non-existent-plugin');
      
      expect(config).toBeNull();
    });

    it('should handle calculation errors gracefully', async () => {
      const engine = new LegacyCalculatorEngine();
      
      await expect(engine.calculate('non-existent', {}))
        .rejects.toThrow('Calculator plugin not found');
    });

    it('should handle validation errors gracefully', async () => {
      const engine = new LegacyCalculatorEngine();
      
      await expect(engine.validate('non-existent', {}))
        .rejects.toThrow('Calculator plugin not found');
    });
  });

  describe('Data Format Conversion', () => {
    it('should convert plugin config to legacy format correctly', async () => {
      const engine = new LegacyCalculatorEngine();
      const config = await engine.getCalculatorConfig('bmi');
      
      expect(config).toMatchObject({
        id: 'bmi',
        name: expect.objectContaining({
          'zh-TW': 'BMI 計算器',
          'en': 'BMI Calculator'
        }),
        category: 'general',
        difficulty: 'basic',
        isFeatured: false,
        isActive: true,
        tags: ['health', 'bmi']
      });
      
      expect(config?.fields).toHaveLength(2);
      expect(config?.fields[0].id).toBe('weight');
      expect(config?.fields[1].id).toBe('height');
    });

    it('should convert plugin result to legacy format correctly', async () => {
      const engine = new LegacyCalculatorEngine();
      const result = await engine.calculate('bmi', { weight: 70, height: 175 });
      
      expect(result).toMatchObject({
        score: expect.any(Number),
        risk: expect.stringMatching(/^(low|moderate|high|critical)$/),
        interpretation: {
          recommendation: expect.any(String),
          color: expect.stringMatching(/^#[0-9A-F]{6}$/i),
          icon: expect.any(String),
          actionItems: expect.any(Array)
        },
        details: {
          breakdown: expect.any(Array),
          totalPoints: expect.any(Number),
          maxPossibleScore: expect.any(Number)
        }
      });
    });
  });

  describe('Locale Support', () => {
    it('should support different locales in legacy engine', async () => {
      const engineZH = new LegacyCalculatorEngine('zh-TW');
      const engineEN = new LegacyCalculatorEngine('en');
      
      const configZH = await engineZH.getCalculatorConfig('bmi');
      const configEN = await engineEN.getCalculatorConfig('bmi');
      
      expect(configZH?.name['zh-TW']).toBe('BMI 計算器');
      expect(configEN?.name['en']).toBe('BMI Calculator');
    });

    it('should use correct locale in calculation results', async () => {
      const engineZH = new LegacyCalculatorEngine('zh-TW');
      const engineEN = new LegacyCalculatorEngine('en');
      
      const inputs = { weight: 70, height: 175 };
      const resultZH = await engineZH.calculate('bmi', inputs);
      const resultEN = await engineEN.calculate('bmi', inputs);
      
      expect(resultZH.interpretation.recommendation).toContain('BMI 為');
      expect(resultEN.interpretation.recommendation).toContain('BMI is');
    });
  });

  describe('Performance', () => {
    it('should not significantly impact performance', async () => {
      const engine = new LegacyCalculatorEngine();
      const inputs = { weight: 70, height: 175 };
      
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        await engine.calculate('bmi', inputs);
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 100;
      
      // Should complete within reasonable time (less than 10ms per calculation)
      expect(avgTime).toBeLessThan(10);
    });
  });
});