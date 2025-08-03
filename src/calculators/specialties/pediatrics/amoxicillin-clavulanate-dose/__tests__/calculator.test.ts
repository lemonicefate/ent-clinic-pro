import { describe, it, expect } from 'vitest';
import { calculate, validate } from '../calculator.js';
import type { CalculatorInputs } from '../../../../types/calculator.js';

describe('Amoxicillin/Clavulanate Dose Calculator', () => {
  describe('validate', () => {
    it('should require weight', () => {
      const inputs: Partial<CalculatorInputs> = {
        doseTarget: 'low',
        days: 3,
        frequency: 3
      };

      const result = validate(inputs as CalculatorInputs);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('weight');
    });

    it('should require dose target', () => {
      const inputs: Partial<CalculatorInputs> = {
        weight: 15,
        days: 3,
        frequency: 3
      };

      const result = validate(inputs as CalculatorInputs);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('doseTarget');
    });

    it('should require days', () => {
      const inputs: Partial<CalculatorInputs> = {
        weight: 15,
        doseTarget: 'low',
        frequency: 3
      };

      const result = validate(inputs as CalculatorInputs);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('days');
    });

    it('should require frequency', () => {
      const inputs: Partial<CalculatorInputs> = {
        weight: 15,
        doseTarget: 'low',
        days: 3
      };

      const result = validate(inputs as CalculatorInputs);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('frequency');
    });

    it('should validate weight range', () => {
      const inputs: CalculatorInputs = {
        weight: 0, // Too low
        doseTarget: 'low',
        days: 3,
        frequency: 3
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('weight');
      expect(result.errors[0].type).toBe('required');
    });

    it('should validate days range', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        doseTarget: 'low',
        days: 10, // Too high
        frequency: 3
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('days');
      expect(result.errors[0].type).toBe('range');
    });

    it('should validate frequency options', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        doseTarget: 'low',
        days: 3,
        frequency: 5 // Invalid frequency
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('frequency');
      expect(result.errors[0].type).toBe('range');
    });

    it('should pass validation with valid inputs', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        doseTarget: 'low',
        days: 3,
        frequency: 3
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('calculate', () => {
    it('should calculate for standard dose target', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        doseTarget: 'low',
        days: 3,
        frequency: 3
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBeGreaterThan(0);
      expect(result.primaryUnit).toBe('tablets');
      expect(result.secondaryValues?.numCuram).toBeDefined();
      expect(result.secondaryValues?.totalAmox).toBeGreaterThan(0);
      expect(result.secondaryValues?.finalAmoDose).toBeCloseTo(45, 1); // Should be close to 45 mg/kg/day
    });

    it('should calculate for high dose target', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        doseTarget: 'high',
        days: 3,
        frequency: 3
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBeGreaterThan(0);
      expect(result.primaryUnit).toBe('tablets');
      expect(result.secondaryValues?.finalAmoDose).toBeCloseTo(85, 1); // Should be close to 85 mg/kg/day
    });

    it('should handle different frequencies', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        doseTarget: 'low',
        days: 3,
        frequency: 2 // BID
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBeGreaterThan(0);
      expect(result.secondaryValues?.frequency).toBe(2);
    });

    it('should handle different treatment durations', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        doseTarget: 'low',
        days: 5,
        frequency: 3
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBeGreaterThan(0);
      expect(result.secondaryValues?.days).toBe(5);
    });

    it('should provide recommendations', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        doseTarget: 'low',
        days: 3,
        frequency: 3
      };

      const result = calculate(inputs);

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations!.length).toBeGreaterThan(0);
      expect(result.recommendations![0]['zh-TW']).toContain('藥錠');
    });

    it('should include calculation metadata', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        doseTarget: 'low',
        days: 3,
        frequency: 3
      };

      const result = calculate(inputs);

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.calculationSteps).toBeDefined();
      expect(result.metadata!.calculationSteps!.length).toBeGreaterThan(0);
      expect(result.metadata!.lastCalculated).toBeDefined();
    });

    it('should handle edge case with very low weight', () => {
      const inputs: CalculatorInputs = {
        weight: 5, // Very low weight
        doseTarget: 'low',
        days: 3,
        frequency: 3
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBeGreaterThan(0);
      expect(result.secondaryValues?.finalAmoDose).toBeCloseTo(45, 0);
    });

    it('should handle edge case with high weight', () => {
      const inputs: CalculatorInputs = {
        weight: 50, // High weight
        doseTarget: 'low',
        days: 3,
        frequency: 3
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBeGreaterThan(0);
      expect(result.secondaryValues?.finalAmoDose).toBeCloseTo(45, 0);
    });

    it('should ensure Clavulanate safety limit', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        doseTarget: 'high',
        days: 3,
        frequency: 3
      };

      const result = calculate(inputs);

      if (result.secondaryValues?.totalCla && result.secondaryValues?.totalCla > 0) {
        const dailyClaDose = (result.secondaryValues.totalCla / inputs.days) / inputs.weight;
        expect(dailyClaDose).toBeLessThanOrEqual(10.0); // Safety limit
      }
    });

    it('should maintain reasonable Amox:Clav ratio when possible', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        doseTarget: 'low',
        days: 3,
        frequency: 3
      };

      const result = calculate(inputs);

      if (result.secondaryValues?.ratio && result.secondaryValues.ratio !== Infinity) {
        expect(result.secondaryValues.ratio).toBeGreaterThanOrEqual(4);
        expect(result.secondaryValues.ratio).toBeLessThanOrEqual(14);
      }
    });
  });

  describe('error handling', () => {
    it('should handle impossible dosing scenarios', () => {
      // This test might need adjustment based on actual algorithm limits
      const inputs: CalculatorInputs = {
        weight: 1, // Very low weight that might make dosing impossible
        doseTarget: 'high',
        days: 1,
        frequency: 4
      };

      // Should either return a valid result or handle gracefully
      expect(() => calculate(inputs)).not.toThrow();
    });
  });
});