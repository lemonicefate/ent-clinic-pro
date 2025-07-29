/**
 * 測試工具集
 * 提供統一的測試輔助函數和模擬數據
 */

import { vi } from 'vitest';
import type { CalculatorModule, CalculatorConfig } from '../types/calculator';

// 測試用的模擬計算器配置
export const createMockCalculatorConfig = (overrides: Partial<CalculatorConfig> = {}): CalculatorConfig => ({
  id: 'test-calculator',
  name: { 'zh-TW': '測試計算機', 'en': 'Test Calculator' },
  description: { 'zh-TW': '測試用計算機', 'en': 'Test calculator' },
  category: 'general',
  version: '1.0.0',
  status: 'published',
  fields: [
    {
      id: 'input1',
      type: 'number',
      label: { 'zh-TW': '輸入1', 'en': 'Input 1' },
      required: true,
      min: 0,
      max: 100
    }
  ],
  calculation: {
    functionName: 'calculate'
  },
  interpretation: [],
  visualization: {
    resultDisplay: {
      type: 'card',
      layout: 'single',
      components: []
    }
  },
  medical: {
    specialty: ['general'],
    evidenceLevel: 'A',
    references: []
  },
  metadata: {
    tags: ['test'],
    difficulty: 'basic',
    lastUpdated: '2024-01-01',
    author: 'Test Author'
  },
  ...overrides
});

// 測試用的模擬計算器模組
export const createMockCalculatorModule = (configOverrides: Partial<CalculatorConfig> = {}): CalculatorModule => ({
  config: createMockCalculatorConfig(configOverrides),
  calculator: {
    calculate: vi.fn().mockResolvedValue({ value: 25, unit: 'test' }),
    validate: vi.fn().mockReturnValue({ isValid: true, errors: [] })
  },
  visualization: {},
  tests: {}
});

// 測試用的計算結果
export const createMockCalculationResult = (overrides: any = {}) => ({
  value: 25,
  unit: 'kg/m²',
  primaryValue: 25,
  primaryUnit: 'kg/m²',
  primaryLabel: { 'zh-TW': '測試結果' },
  riskLevel: 'low',
  interpretation: { 'zh-TW': '正常範圍' },
  recommendations: [
    { 'zh-TW': '建議1', 'en': 'Recommendation 1' }
  ],
  references: [],
  metadata: {
    calculationTime: Date.now(),
    version: '1.0.0'
  },
  visualizationData: {
    testValue: 25,
    riskIndicator: 'low'
  },
  ...overrides
});

// 模擬 Astro.glob 函數
export const mockAstroGlob = (modules: Record<string, any>) => {
  return vi.fn().mockImplementation((pattern: string) => {
    const matchingModules: Record<string, () => Promise<any>> = {};
    
    Object.keys(modules).forEach(key => {
      if (key.includes(pattern.replace('*', ''))) {
        matchingModules[key] = () => Promise.resolve(modules[key]);
      }
    });
    
    return matchingModules;
  });
};

// 測試用的性能監控
export class TestPerformanceMonitor {
  private startTime: number = 0;
  
  start() {
    this.startTime = performance.now();
  }
  
  end(): number {
    return performance.now() - this.startTime;
  }
  
  expectFasterThan(maxTime: number) {
    const duration = this.end();
    if (duration > maxTime) {
      throw new Error(`Operation took ${duration}ms, expected less than ${maxTime}ms`);
    }
    return duration;
  }
}

// 測試用的記憶體使用監控
export class TestMemoryMonitor {
  private initialMemory: number = 0;
  
  start() {
    if (typeof performance !== 'undefined' && performance.memory) {
      this.initialMemory = performance.memory.usedJSHeapSize;
    }
  }
  
  getUsage(): number {
    if (typeof performance !== 'undefined' && performance.memory) {
      return performance.memory.usedJSHeapSize - this.initialMemory;
    }
    return 0;
  }
  
  expectLessThan(maxMemory: number) {
    const usage = this.getUsage();
    if (usage > maxMemory) {
      throw new Error(`Memory usage ${usage} bytes, expected less than ${maxMemory} bytes`);
    }
    return usage;
  }
}

// 測試用的批量操作工具
export const batchTest = async <T>(
  items: T[],
  testFn: (item: T, index: number) => Promise<void>,
  batchSize: number = 10
) => {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(
      batch.map((item, batchIndex) => testFn(item, i + batchIndex))
    );
  }
};

// 測試用的隨機數據生成器
export class TestDataGenerator {
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  static randomFloat(min: number, max: number, decimals: number = 2): number {
    const value = Math.random() * (max - min) + min;
    return Number(value.toFixed(decimals));
  }
  
  static randomString(length: number = 10): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  static randomCalculatorInput(config: CalculatorConfig): Record<string, any> {
    const input: Record<string, any> = {};
    
    config.fields.forEach(field => {
      switch (field.type) {
        case 'number':
          const min = field.min !== undefined ? field.min : 0;
          const max = field.max !== undefined ? field.max : 100;
          // Check if field requires integer (step = 1 or field id suggests integer)
          if (field.step === 1 || field.id === 'age') {
            input[field.id] = this.randomInt(min, max);
          } else {
            input[field.id] = this.randomFloat(min, max);
          }
          break;
        case 'select':
          if (field.options && field.options.length > 0) {
            input[field.id] = field.options[this.randomInt(0, field.options.length - 1)].value;
          }
          break;
        case 'checkbox':
          input[field.id] = Math.random() > 0.5;
          break;
        case 'text':
          input[field.id] = this.randomString();
          break;
        default:
          input[field.id] = null;
      }
    });
    
    return input;
  }
}

// 測試用的斷言輔助函數
export const expectCalculationResult = (result: any) => ({
  toHaveValidStructure: () => {
    expect(result).toHaveProperty('value');
    expect(result).toHaveProperty('unit');
    expect(typeof result.value).toBe('number');
    expect(typeof result.unit).toBe('string');
  },
  
  toHaveRiskLevel: (expectedLevel: string) => {
    expect(result).toHaveProperty('riskLevel', expectedLevel);
  },
  
  toHaveInterpretation: (locale: string = 'zh-TW') => {
    expect(result).toHaveProperty('interpretation');
    expect(result.interpretation).toHaveProperty(locale);
    expect(typeof result.interpretation[locale]).toBe('string');
  },
  
  toHaveRecommendations: (minCount: number = 1) => {
    expect(result).toHaveProperty('recommendations');
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThanOrEqual(minCount);
  }
});

// 測試用的錯誤模擬
export const createTestError = (code: string, message: string) => {
  const error = new Error(message);
  (error as any).code = code;
  return error;
};

// 測試用的時間控制
export const withFakeTimers = (testFn: () => void | Promise<void>) => {
  return async () => {
    vi.useFakeTimers();
    try {
      await testFn();
    } finally {
      vi.useRealTimers();
    }
  };
};

// 測試用的網路模擬
export const mockNetworkDelay = (delay: number = 100) => {
  return new Promise(resolve => setTimeout(resolve, delay));
};

// 測試用的本地化工具
export const createMockI18n = (locale: string = 'zh-TW') => ({
  t: (key: string, params?: Record<string, any>) => {
    // 簡單的模擬翻譯函數
    const translations: Record<string, Record<string, string>> = {
      'zh-TW': {
        'loading': '載入中...',
        'error': '錯誤',
        'success': '成功',
        'calculate': '計算',
        'result': '結果'
      },
      'en': {
        'loading': 'Loading...',
        'error': 'Error',
        'success': 'Success',
        'calculate': 'Calculate',
        'result': 'Result'
      }
    };
    
    return translations[locale]?.[key] || key;
  },
  locale
});

export default {
  createMockCalculatorConfig,
  createMockCalculatorModule,
  createMockCalculationResult,
  mockAstroGlob,
  TestPerformanceMonitor,
  TestMemoryMonitor,
  batchTest,
  TestDataGenerator,
  expectCalculationResult,
  createTestError,
  withFakeTimers,
  mockNetworkDelay,
  createMockI18n
};