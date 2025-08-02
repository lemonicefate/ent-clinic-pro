/**
 * 計算機模板測試
 * 
 * 這個測試文件展示如何為醫療計算機模組撰寫完整的測試覆蓋。
 * 包含單元測試、邊界測試、錯誤處理測試等。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculate,
  validate,
  formatResult,
  customValidator,
  convertUnits,
  calculateConfidenceInterval,
  type CalculatorInputs,
  type CalculationResult,
  type ValidationResult
} from './calculator.template';

describe('Template Calculator', () => {
  describe('calculate function', () => {
    it('should calculate correctly with valid inputs', () => {
      const inputs: CalculatorInputs = {
        input1: 10,
        input2: 'option1'
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBe(12); // 10 * 1.2
      expect(result.primaryUnit).toBe('單位');
      expect(result.primaryLabel['zh-TW']).toBe('計算結果');
      expect(result.riskLevel).toBe('moderate');
      expect(result.interpretation).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.breakdown).toBeDefined();
      expect(result.visualizationData).toBeDefined();
    });

    it('should calculate correctly with option2', () => {
      const inputs: CalculatorInputs = {
        input1: 10,
        input2: 'option2'
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBe(15); // 10 * 1.5
      expect(result.riskLevel).toBe('moderate');
    });

    it('should determine low risk level correctly', () => {
      const inputs: CalculatorInputs = {
        input1: 5,
        input2: 'option1'
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBe(6); // 5 * 1.2
      expect(result.riskLevel).toBe('low');
    });

    it('should determine high risk level correctly', () => {
      const inputs: CalculatorInputs = {
        input1: 20,
        input2: 'option1'
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBe(24); // 20 * 1.2
      expect(result.riskLevel).toBe('high');
    });

    it('should determine critical risk level correctly', () => {
      const inputs: CalculatorInputs = {
        input1: 30,
        input2: 'option1'
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBe(36); // 30 * 1.2
      expect(result.riskLevel).toBe('critical');
    });

    it('should include breakdown information', () => {
      const inputs: CalculatorInputs = {
        input1: 10,
        input2: 'option1'
      };

      const result = calculate(inputs);

      expect(result.breakdown).toHaveLength(2);
      expect(result.breakdown![0].field).toBe('input1');
      expect(result.breakdown![0].value).toBe(10);
      expect(result.breakdown![1].field).toBe('input2');
      expect(result.breakdown![1].value).toBe('option1');
    });

    it('should include visualization data', () => {
      const inputs: CalculatorInputs = {
        input1: 10,
        input2: 'option1'
      };

      const result = calculate(inputs);

      expect(result.visualizationData).toBeDefined();
      expect(result.visualizationData!.primaryResult).toBe(12);
      expect(result.visualizationData!.riskDistribution).toBeDefined();
      expect(result.visualizationData!.inputContributions).toBeDefined();
      expect(result.visualizationData!.chartData).toBeDefined();
    });
  });

  describe('validate function', () => {
    it('should pass validation with valid inputs', () => {
      const inputs: CalculatorInputs = {
        input1: 10,
        input2: 'option1'
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when input1 is missing', () => {
      const inputs: CalculatorInputs = {
        input2: 'option1'
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('input1');
      expect(result.errors[0].code).toBe('REQUIRED');
    });

    it('should fail validation when input1 is not a number', () => {
      const inputs: CalculatorInputs = {
        input1: 'not a number' as any,
        input2: 'option1'
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('input1');
      expect(result.errors[0].code).toBe('INVALID_TYPE');
    });

    it('should fail validation when input1 is negative', () => {
      const inputs: CalculatorInputs = {
        input1: -5,
        input2: 'option1'
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('input1');
      expect(result.errors[0].code).toBe('MIN_VALUE');
    });

    it('should fail validation when input1 exceeds maximum', () => {
      const inputs: CalculatorInputs = {
        input1: 1001,
        input2: 'option1'
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('input1');
      expect(result.errors[0].code).toBe('MAX_VALUE');
    });

    it('should fail validation when input2 is missing', () => {
      const inputs: CalculatorInputs = {
        input1: 10
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('input2');
      expect(result.errors[0].code).toBe('REQUIRED');
    });

    it('should fail validation when input2 is invalid option', () => {
      const inputs: CalculatorInputs = {
        input1: 10,
        input2: 'invalid_option'
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('input2');
      expect(result.errors[0].code).toBe('INVALID_OPTION');
    });

    it('should handle multiple validation errors', () => {
      const inputs: CalculatorInputs = {
        input1: -10,
        input2: 'invalid_option'
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });

    it('should accept zero as valid input1', () => {
      const inputs: CalculatorInputs = {
        input1: 0,
        input2: 'option1'
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('formatResult function', () => {
    let sampleResult: CalculationResult;

    beforeEach(() => {
      sampleResult = {
        primaryValue: 12.345,
        primaryUnit: '單位',
        primaryLabel: { 'zh-TW': '計算結果', 'en': 'Calculation Result' },
        riskLevel: 'moderate',
        interpretation: {
          'zh-TW': '計算結果為 12.35，屬於中等風險範圍。',
          'en': 'The calculation result is 12.35, which is in the moderate risk range.'
        },
        recommendations: [
          {
            'zh-TW': '建議諮詢醫療專業人員',
            'en': 'Recommend consulting healthcare professionals'
          }
        ]
      };
    });

    it('should format result in Traditional Chinese', () => {
      const formatted = formatResult(sampleResult, 'zh-TW');

      expect(formatted.displayValue).toBe('12.345 單位');
      expect(formatted.description).toBe('計算結果為 12.35，屬於中等風險範圍。');
      expect(formatted.recommendations).toHaveLength(1);
      expect(formatted.recommendations[0]).toBe('建議諮詢醫療專業人員');
    });

    it('should format result in English', () => {
      const formatted = formatResult(sampleResult, 'en');

      expect(formatted.displayValue).toBe('12.345 單位');
      expect(formatted.description).toBe('The calculation result is 12.35, which is in the moderate risk range.');
      expect(formatted.recommendations).toHaveLength(1);
      expect(formatted.recommendations[0]).toBe('Recommend consulting healthcare professionals');
    });

    it('should fallback to Traditional Chinese when English is not available', () => {
      const resultWithoutEnglish = {
        ...sampleResult,
        interpretation: { 'zh-TW': '只有中文解釋' },
        recommendations: [{ 'zh-TW': '只有中文建議' }]
      };

      const formatted = formatResult(resultWithoutEnglish, 'en');

      expect(formatted.description).toBe('只有中文解釋');
      expect(formatted.recommendations[0]).toBe('只有中文建議');
    });

    it('should handle result without unit', () => {
      const resultWithoutUnit = {
        ...sampleResult,
        primaryUnit: undefined
      };

      const formatted = formatResult(resultWithoutUnit, 'zh-TW');

      expect(formatted.displayValue).toBe('12.345');
    });

    it('should handle result without recommendations', () => {
      const resultWithoutRecommendations = {
        ...sampleResult,
        recommendations: undefined
      };

      const formatted = formatResult(resultWithoutRecommendations, 'zh-TW');

      expect(formatted.recommendations).toEqual([]);
    });
  });

  describe('customValidator function', () => {
    it('should validate input1 correctly', () => {
      expect(customValidator(10, 'input1')).toBe(true);
      expect(customValidator(0, 'input1')).toBe(true);
      expect(customValidator(1000, 'input1')).toBe(true);
      expect(customValidator(-1, 'input1')).toBe(false);
      expect(customValidator(1001, 'input1')).toBe(false);
      expect(customValidator('not a number', 'input1')).toBe(false);
    });

    it('should validate input2 correctly', () => {
      expect(customValidator('option1', 'input2')).toBe(true);
      expect(customValidator('option2', 'input2')).toBe(true);
      expect(customValidator('invalid', 'input2')).toBe(false);
      expect(customValidator(123, 'input2')).toBe(false);
    });

    it('should return true for unknown fields', () => {
      expect(customValidator('any value', 'unknown_field')).toBe(true);
    });
  });

  describe('convertUnits function', () => {
    it('should convert kg to lb correctly', () => {
      const result = convertUnits(1, 'kg', 'lb');
      expect(result).toBeCloseTo(2.20462, 5);
    });

    it('should convert kg to g correctly', () => {
      const result = convertUnits(1, 'kg', 'g');
      expect(result).toBe(1000);
    });

    it('should convert cm to inches correctly', () => {
      const result = convertUnits(100, 'cm', 'in');
      expect(result).toBeCloseTo(39.3701, 4);
    });

    it('should convert cm to meters correctly', () => {
      const result = convertUnits(100, 'cm', 'm');
      expect(result).toBe(1);
    });

    it('should return original value for unknown conversions', () => {
      const result = convertUnits(100, 'unknown', 'unit');
      expect(result).toBe(100);
    });
  });

  describe('calculateConfidenceInterval function', () => {
    it('should calculate confidence interval correctly', () => {
      const result = calculateConfidenceInterval(100);
      
      expect(result.lower).toBe(90);
      expect(result.upper).toBe(110);
    });

    it('should not return negative lower bound', () => {
      const result = calculateConfidenceInterval(5);
      
      expect(result.lower).toBe(0); // Math.max(0, 5 - 0.5)
      expect(result.upper).toBe(5.5);
    });

    it('should handle zero input', () => {
      const result = calculateConfidenceInterval(0);
      
      expect(result.lower).toBe(0);
      expect(result.upper).toBe(0);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle very large numbers', () => {
      const inputs: CalculatorInputs = {
        input1: 999,
        input2: 'option2'
      };

      const result = calculate(inputs);
      
      expect(result.primaryValue).toBe(1498.5); // 999 * 1.5
      expect(result.riskLevel).toBe('critical');
    });

    it('should handle very small numbers', () => {
      const inputs: CalculatorInputs = {
        input1: 0.1,
        input2: 'option1'
      };

      const result = calculate(inputs);
      
      expect(result.primaryValue).toBe(0.12); // 0.1 * 1.2
      expect(result.riskLevel).toBe('low');
    });

    it('should handle decimal precision correctly', () => {
      const inputs: CalculatorInputs = {
        input1: 10.123456789,
        input2: 'option1'
      };

      const result = calculate(inputs);
      
      // Should be rounded to 2 decimal places
      expect(result.primaryValue).toBe(12.15); // Math.round(10.123456789 * 1.2 * 100) / 100
    });
  });

  describe('Integration tests', () => {
    it('should complete full calculation workflow', () => {
      const inputs: CalculatorInputs = {
        input1: 15,
        input2: 'option2'
      };

      // 1. Validate inputs
      const validation = validate(inputs);
      expect(validation.isValid).toBe(true);

      // 2. Calculate result
      const result = calculate(inputs);
      expect(result.primaryValue).toBe(22.5); // 15 * 1.5
      expect(result.riskLevel).toBe('high');

      // 3. Format result
      const formatted = formatResult(result, 'zh-TW');
      expect(formatted.displayValue).toBe('22.5 單位');
      expect(formatted.description).toContain('高風險');
    });

    it('should handle invalid inputs gracefully', () => {
      const inputs: CalculatorInputs = {
        input1: -5,
        input2: 'invalid'
      };

      // Validation should catch errors
      const validation = validate(inputs);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(2);

      // Calculation should still work (assuming validation is handled elsewhere)
      // but results may not be meaningful
      const result = calculate(inputs);
      expect(result).toBeDefined();
    });
  });

  describe('Performance tests', () => {
    it('should calculate results quickly', () => {
      const inputs: CalculatorInputs = {
        input1: 10,
        input2: 'option1'
      };

      const startTime = performance.now();
      
      // Run calculation multiple times
      for (let i = 0; i < 1000; i++) {
        calculate(inputs);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete 1000 calculations in less than 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});