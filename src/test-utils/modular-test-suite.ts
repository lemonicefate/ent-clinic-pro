/**
 * 模組化測試套件
 * 為計算器模組提供標準化的測試框架
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { CalculatorModule, CalculatorConfig } from '../types/calculator';
import { 
  TestPerformanceMonitor, 
  TestMemoryMonitor, 
  TestDataGenerator,
  expectCalculationResult,
  batchTest
} from './index';

export interface ModularTestOptions {
  performanceThreshold?: number; // ms
  memoryThreshold?: number; // bytes
  batchSize?: number;
  testIterations?: number;
  enableStressTest?: boolean;
  enableEdgeCaseTest?: boolean;
  enablePerformanceTest?: boolean;
  enableMemoryTest?: boolean;
}

export interface TestScenario {
  name: string;
  input: Record<string, any>;
  expectedOutput?: Partial<any>;
  shouldFail?: boolean;
  errorCode?: string;
}

export class ModularTestSuite {
  private module: CalculatorModule;
  private options: Required<ModularTestOptions>;
  private performanceMonitor: TestPerformanceMonitor;
  private memoryMonitor: TestMemoryMonitor;

  constructor(module: CalculatorModule, options: ModularTestOptions = {}) {
    this.module = module;
    this.options = {
      performanceThreshold: 50,
      memoryThreshold: 1024 * 1024, // 1MB
      batchSize: 10,
      testIterations: 100,
      enableStressTest: true,
      enableEdgeCaseTest: true,
      enablePerformanceTest: true,
      enableMemoryTest: true,
      ...options
    };
    this.performanceMonitor = new TestPerformanceMonitor();
    this.memoryMonitor = new TestMemoryMonitor();
  }

  /**
   * 執行完整的模組測試套件
   */
  run() {
    describe(`Calculator Module: ${this.module.config.id}`, () => {
      this.runConfigValidationTests();
      this.runCalculationTests();
      this.runValidationTests();
      
      if (this.options.enablePerformanceTest) {
        this.runPerformanceTests();
      }
      
      if (this.options.enableMemoryTest) {
        this.runMemoryTests();
      }
      
      if (this.options.enableStressTest) {
        this.runStressTests();
      }
      
      if (this.options.enableEdgeCaseTest) {
        this.runEdgeCaseTests();
      }
      
      this.runIntegrationTests();
    });
  }

  /**
   * 配置驗證測試
   */
  private runConfigValidationTests() {
    describe('Configuration Validation', () => {
      it('should have valid module structure', () => {
        expect(this.module).toHaveProperty('config');
        expect(this.module).toHaveProperty('calculator');
        expect(this.module.config).toHaveProperty('id');
        expect(this.module.config).toHaveProperty('name');
        expect(this.module.config).toHaveProperty('version');
      });

      it('should have valid ID format', () => {
        expect(this.module.config.id).toMatch(/^[a-z0-9-]+$/);
        expect(this.module.config.id.length).toBeGreaterThan(0);
        expect(this.module.config.id.length).toBeLessThanOrEqual(50);
      });

      it('should have valid version format', () => {
        expect(this.module.config.version).toMatch(/^\d+\.\d+\.\d+$/);
      });

      it('should have required multilingual fields', () => {
        expect(this.module.config.name).toHaveProperty('zh-TW');
        expect(this.module.config.name).toHaveProperty('en');
        expect(this.module.config.description).toHaveProperty('zh-TW');
        expect(this.module.config.description).toHaveProperty('en');
      });

      it('should have valid field definitions', () => {
        expect(Array.isArray(this.module.config.fields)).toBe(true);
        
        this.module.config.fields.forEach(field => {
          expect(field).toHaveProperty('id');
          expect(field).toHaveProperty('type');
          expect(field).toHaveProperty('label');
          expect(field.label).toHaveProperty('zh-TW');
          expect(field.label).toHaveProperty('en');
        });
      });

      it('should have valid medical metadata', () => {
        expect(this.module.config.medical).toHaveProperty('specialty');
        expect(this.module.config.medical).toHaveProperty('evidenceLevel');
        expect(Array.isArray(this.module.config.medical.specialty)).toBe(true);
        expect(['A', 'B', 'C', 'D']).toContain(this.module.config.medical.evidenceLevel);
      });
    });
  }

  /**
   * 計算功能測試
   */
  private runCalculationTests() {
    describe('Calculation Functions', () => {
      it('should have calculate function', () => {
        expect(this.module.calculator).toHaveProperty('calculate');
        expect(typeof this.module.calculator.calculate).toBe('function');
      });

      it('should calculate with valid input', async () => {
        const input = TestDataGenerator.randomCalculatorInput(this.module.config);
        const result = await this.module.calculator.calculate(input);
        
        expectCalculationResult(result).toHaveValidStructure();
      });

      it('should handle multiple calculations consistently', async () => {
        const input = TestDataGenerator.randomCalculatorInput(this.module.config);
        
        const results = await Promise.all([
          this.module.calculator.calculate(input),
          this.module.calculator.calculate(input),
          this.module.calculator.calculate(input)
        ]);

        // 相同輸入應該產生相同結果
        expect(results[0].value).toBe(results[1].value);
        expect(results[1].value).toBe(results[2].value);
      });

      it('should include required result fields', async () => {
        const input = TestDataGenerator.randomCalculatorInput(this.module.config);
        const result = await this.module.calculator.calculate(input);
        
        expect(result).toHaveProperty('value');
        expect(result).toHaveProperty('unit');
        expect(result).toHaveProperty('interpretation');
        expect(result).toHaveProperty('recommendations');
      });
    });
  }

  /**
   * 驗證功能測試
   */
  private runValidationTests() {
    describe('Input Validation', () => {
      it('should have validate function', () => {
        expect(this.module.calculator).toHaveProperty('validate');
        expect(typeof this.module.calculator.validate).toBe('function');
      });

      it('should validate correct input', () => {
        const input = TestDataGenerator.randomCalculatorInput(this.module.config);
        const validation = this.module.calculator.validate(input);
        
        expect(validation).toHaveProperty('isValid');
        expect(validation).toHaveProperty('errors');
        expect(validation.isValid).toBe(true);
        expect(Array.isArray(validation.errors)).toBe(true);
      });

      it('should detect missing required fields', () => {
        const requiredFields = this.module.config.fields.filter(f => f.required);
        
        if (requiredFields.length > 0) {
          const incompleteInput: Record<string, any> = {};
          const validation = this.module.calculator.validate(incompleteInput);
          
          expect(validation.isValid).toBe(false);
          expect(validation.errors.length).toBeGreaterThan(0);
        }
      });

      it('should validate field ranges', () => {
        const numberFields = this.module.config.fields.filter(f => 
          f.type === 'number' && (f.min !== undefined || f.max !== undefined)
        );

        numberFields.forEach(field => {
          if (field.min !== undefined) {
            const invalidInput = { [field.id]: field.min - 1 };
            const validation = this.module.calculator.validate(invalidInput);
            expect(validation.isValid).toBe(false);
          }

          if (field.max !== undefined) {
            const invalidInput = { [field.id]: field.max + 1 };
            const validation = this.module.calculator.validate(invalidInput);
            expect(validation.isValid).toBe(false);
          }
        });
      });
    });
  }

  /**
   * 性能測試
   */
  private runPerformanceTests() {
    describe('Performance Tests', () => {
      it('should calculate within performance threshold', async () => {
        const input = TestDataGenerator.randomCalculatorInput(this.module.config);
        
        this.performanceMonitor.start();
        await this.module.calculator.calculate(input);
        const duration = this.performanceMonitor.end();
        
        expect(duration).toBeLessThan(this.options.performanceThreshold);
      });

      it('should handle batch calculations efficiently', async () => {
        const inputs = Array.from({ length: this.options.batchSize }, () =>
          TestDataGenerator.randomCalculatorInput(this.module.config)
        );

        this.performanceMonitor.start();
        
        await batchTest(inputs, async (input) => {
          await this.module.calculator.calculate(input);
        }, 5);
        
        const totalDuration = this.performanceMonitor.end();
        const averageDuration = totalDuration / this.options.batchSize;
        
        expect(averageDuration).toBeLessThan(this.options.performanceThreshold);
      });
    });
  }

  /**
   * 記憶體測試
   */
  private runMemoryTests() {
    describe('Memory Tests', () => {
      it('should not leak memory during calculations', async () => {
        this.memoryMonitor.start();
        
        // 執行多次計算
        for (let i = 0; i < 50; i++) {
          const input = TestDataGenerator.randomCalculatorInput(this.module.config);
          await this.module.calculator.calculate(input);
        }
        
        const memoryUsage = this.memoryMonitor.getUsage();
        expect(memoryUsage).toBeLessThan(this.options.memoryThreshold);
      });
    });
  }

  /**
   * 壓力測試
   */
  private runStressTests() {
    describe('Stress Tests', () => {
      it('should handle high volume calculations', async () => {
        const inputs = Array.from({ length: this.options.testIterations }, () =>
          TestDataGenerator.randomCalculatorInput(this.module.config)
        );

        const results = await Promise.all(
          inputs.map(input => this.module.calculator.calculate(input))
        );

        expect(results).toHaveLength(this.options.testIterations);
        results.forEach(result => {
          expectCalculationResult(result).toHaveValidStructure();
        });
      });

      it('should handle concurrent calculations', async () => {
        const input = TestDataGenerator.randomCalculatorInput(this.module.config);
        
        const concurrentPromises = Array.from({ length: 20 }, () =>
          this.module.calculator.calculate(input)
        );

        const results = await Promise.all(concurrentPromises);
        
        // 所有結果應該相同
        const firstResult = results[0];
        results.forEach(result => {
          expect(result.value).toBe(firstResult.value);
        });
      });
    });
  }

  /**
   * 邊界條件測試
   */
  private runEdgeCaseTests() {
    describe('Edge Case Tests', () => {
      it('should handle boundary values', async () => {
        const numberFields = this.module.config.fields.filter(f => f.type === 'number');
        
        for (const field of numberFields) {
          if (field.min !== undefined) {
            // 建立完整的輸入，包含所有必需欄位
            const baseInput = TestDataGenerator.randomCalculatorInput(this.module.config);
            const minInput = { ...baseInput, [field.id]: field.min };
            
            try {
              const result = await this.module.calculator.calculate(minInput);
              expectCalculationResult(result).toHaveValidStructure();
            } catch (error) {
              // 邊界值可能導致驗證錯誤，這是可以接受的
              expect(error).toBeInstanceOf(Error);
            }
          }

          if (field.max !== undefined) {
            // 建立完整的輸入，包含所有必需欄位
            const baseInput = TestDataGenerator.randomCalculatorInput(this.module.config);
            const maxInput = { ...baseInput, [field.id]: field.max };
            
            try {
              const result = await this.module.calculator.calculate(maxInput);
              expectCalculationResult(result).toHaveValidStructure();
            } catch (error) {
              // 邊界值可能導致驗證錯誤，這是可以接受的
              expect(error).toBeInstanceOf(Error);
            }
          }
        }
      });

      it('should handle extreme values gracefully', async () => {
        const numberFields = this.module.config.fields.filter(f => f.type === 'number');
        
        for (const field of numberFields) {
          const extremeValues = [0, 0.001, 999999, -999999];
          
          for (const value of extremeValues) {
            const input = { [field.id]: value };
            
            try {
              const result = await this.module.calculator.calculate(input);
              expect(typeof result.value).toBe('number');
              expect(isFinite(result.value)).toBe(true);
            } catch (error) {
              // 極端值可能導致錯誤，這是可以接受的
              expect(error).toBeInstanceOf(Error);
            }
          }
        }
      });
    });
  }

  /**
   * 整合測試
   */
  private runIntegrationTests() {
    describe('Integration Tests', () => {
      it('should work with visualization data', async () => {
        const input = TestDataGenerator.randomCalculatorInput(this.module.config);
        const result = await this.module.calculator.calculate(input);
        
        if (result.visualizationData) {
          expect(typeof result.visualizationData).toBe('object');
          expect(result.visualizationData).not.toBeNull();
        }
      });

      it('should provide localized content', async () => {
        const input = TestDataGenerator.randomCalculatorInput(this.module.config);
        const result = await this.module.calculator.calculate(input);
        
        expect(result.interpretation).toHaveProperty('zh-TW');
        expect(result.interpretation).toHaveProperty('en');
        
        if (result.recommendations && result.recommendations.length > 0) {
          result.recommendations.forEach(rec => {
            expect(rec).toHaveProperty('zh-TW');
            expect(rec).toHaveProperty('en');
          });
        }
      });

      it('should include metadata', async () => {
        const input = TestDataGenerator.randomCalculatorInput(this.module.config);
        const result = await this.module.calculator.calculate(input);
        
        if (result.metadata) {
          expect(typeof result.metadata).toBe('object');
          expect(result.metadata).not.toBeNull();
        }
      });
    });
  }

  /**
   * 執行自定義測試場景
   */
  runCustomScenarios(scenarios: TestScenario[]) {
    describe('Custom Test Scenarios', () => {
      scenarios.forEach(scenario => {
        it(scenario.name, async () => {
          if (scenario.shouldFail) {
            await expect(
              this.module.calculator.calculate(scenario.input)
            ).rejects.toThrow();
          } else {
            const result = await this.module.calculator.calculate(scenario.input);
            
            if (scenario.expectedOutput) {
              Object.keys(scenario.expectedOutput).forEach(key => {
                expect(result).toHaveProperty(key, scenario.expectedOutput![key]);
              });
            }
            
            expectCalculationResult(result).toHaveValidStructure();
          }
        });
      });
    });
  }
}

/**
 * 快速建立模組測試的輔助函數
 */
export const testCalculatorModule = (
  module: CalculatorModule, 
  options?: ModularTestOptions,
  customScenarios?: TestScenario[]
) => {
  const suite = new ModularTestSuite(module, options);
  suite.run();
  
  if (customScenarios && customScenarios.length > 0) {
    suite.runCustomScenarios(customScenarios);
  }
};

export default ModularTestSuite;