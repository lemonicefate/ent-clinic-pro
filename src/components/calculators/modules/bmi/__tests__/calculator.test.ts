/**
 * BMI 計算機測試
 */

import { describe, it, expect } from 'vitest';
import { calculate, validate, formatResult } from '../calculator';

describe('BMI Calculator', () => {
  describe('calculate', () => {
    it('should calculate BMI correctly for normal values', () => {
      const inputs = {
        weight: 70,
        height: 175
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBeCloseTo(22.9, 1);
      expect(result.primaryUnit).toBe('kg/m²');
      expect(result.riskLevel).toBe('low');
    });

    it('should handle underweight BMI', () => {
      const inputs = {
        weight: 45,
        height: 170
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBeCloseTo(15.6, 1);
      expect(result.riskLevel).toBe('critical');
    });

    it('should handle overweight BMI', () => {
      const inputs = {
        weight: 85,
        height: 170
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBeCloseTo(29.4, 1);
      expect(result.riskLevel).toBe('moderate');
    });

    it('should handle obese BMI', () => {
      const inputs = {
        weight: 100,
        height: 170
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBeCloseTo(34.6, 1);
      expect(result.riskLevel).toBe('high');
    });

    it('should include age and gender in calculation', () => {
      const inputs = {
        weight: 70,
        height: 175,
        age: 30,
        gender: 'female'
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBeCloseTo(22.9, 1);
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations!.length).toBeGreaterThan(0);
    });

    it('should include calculation breakdown', () => {
      const inputs = {
        weight: 70,
        height: 175
      };

      const result = calculate(inputs);

      expect(result.breakdown).toBeDefined();
      expect(result.breakdown!.length).toBe(2);
      expect(result.breakdown![0].field).toBe('height_conversion');
      expect(result.breakdown![1].field).toBe('bmi_calculation');
    });

    it('should include visualization data', () => {
      const inputs = {
        weight: 70,
        height: 175
      };

      const result = calculate(inputs);

      expect(result.visualizationData).toBeDefined();
      expect(result.visualizationData!.bmi).toBeCloseTo(22.9, 1);
      expect(result.visualizationData!.chartData).toBeDefined();
    });
  });

  describe('validate', () => {
    it('should pass validation for valid inputs', () => {
      const inputs = {
        weight: 70,
        height: 175
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing weight', () => {
      const inputs = {
        height: 175
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('weight');
      expect(result.errors[0].code).toBe('REQUIRED');
    });

    it('should fail validation for missing height', () => {
      const inputs = {
        weight: 70
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('height');
      expect(result.errors[0].code).toBe('REQUIRED');
    });

    it('should fail validation for weight out of range', () => {
      const inputs = {
        weight: 10, // too low
        height: 175
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('weight');
      expect(result.errors[0].code).toBe('OUT_OF_RANGE');
    });

    it('should fail validation for height out of range', () => {
      const inputs = {
        weight: 70,
        height: 50 // too low
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('height');
      expect(result.errors[0].code).toBe('OUT_OF_RANGE');
    });

    it('should fail validation for age out of range', () => {
      const inputs = {
        weight: 70,
        height: 175,
        age: 150 // too high
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('age');
      expect(result.errors[0].code).toBe('OUT_OF_RANGE');
    });

    it('should fail validation for invalid gender', () => {
      const inputs = {
        weight: 70,
        height: 175,
        gender: 'invalid'
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('gender');
      expect(result.errors[0].code).toBe('INVALID_OPTION');
    });

    it('should pass validation with optional fields', () => {
      const inputs = {
        weight: 70,
        height: 175,
        age: 30,
        gender: 'female'
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('formatResult', () => {
    it('should format result correctly for zh-TW locale', () => {
      const calculationResult = calculate({
        weight: 70,
        height: 175
      });

      const formatted = formatResult(calculationResult, 'zh-TW');

      expect(formatted.displayValue).toContain('22.9');
      expect(formatted.displayValue).toContain('kg/m²');
      expect(formatted.description).toContain('正常體重');
      expect(formatted.recommendations).toBeDefined();
      expect(formatted.recommendations.length).toBeGreaterThan(0);
    });

    it('should format result correctly for en locale', () => {
      const calculationResult = calculate({
        weight: 70,
        height: 175
      });

      const formatted = formatResult(calculationResult, 'en');

      expect(formatted.displayValue).toContain('22.9');
      expect(formatted.displayValue).toContain('kg/m²');
      expect(formatted.description).toContain('Normal weight');
      expect(formatted.recommendations).toBeDefined();
      expect(formatted.recommendations.length).toBeGreaterThan(0);
    });

    it('should fallback to zh-TW for unsupported locale', () => {
      const calculationResult = calculate({
        weight: 70,
        height: 175
      });

      const formatted = formatResult(calculationResult, 'fr' as any);

      expect(formatted.displayValue).toContain('22.9');
      expect(formatted.description).toContain('正常體重');
    });
  });

  describe('edge cases', () => {
    it('should handle very low BMI', () => {
      const inputs = {
        weight: 30,
        height: 180
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBeCloseTo(9.3, 1);
      expect(result.riskLevel).toBe('critical');
    });

    it('should handle very high BMI', () => {
      const inputs = {
        weight: 150,
        height: 160
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBeCloseTo(58.6, 1);
      expect(result.riskLevel).toBe('critical');
    });

    it('should handle decimal inputs', () => {
      const inputs = {
        weight: 70.5,
        height: 175.5
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBeCloseTo(22.9, 1);
      expect(result.riskLevel).toBe('low');
    });

    it('should handle string inputs that can be converted to numbers', () => {
      const inputs = {
        weight: '70',
        height: '175'
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBeCloseTo(22.9, 1);
      expect(result.riskLevel).toBe('low');
    });
  });
});