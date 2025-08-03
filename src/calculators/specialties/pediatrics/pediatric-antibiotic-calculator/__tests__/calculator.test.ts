import { describe, it, expect } from 'vitest';
import { calculate, validate } from '../calculator.js';
import type { CalculatorInputs } from '../../../../../types/calculator.js';

describe('Pediatric Antibiotic Calculator', () => {
  describe('validate', () => {
    it('should require weight', () => {
      const inputs: Partial<CalculatorInputs> = {
        form: 'powder',
        days: 3,
        frequency: 3
      };

      const result = validate(inputs as CalculatorInputs);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('weight');
    });

    it('should require form', () => {
      const inputs: Partial<CalculatorInputs> = {
        weight: 15,
        days: 3,
        frequency: 3
      };

      const result = validate(inputs as CalculatorInputs);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('form');
    });

    it('should require days', () => {
      const inputs: Partial<CalculatorInputs> = {
        weight: 15,
        form: 'powder',
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
        form: 'powder',
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
        form: 'powder',
        days: 3,
        frequency: 3
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('weight');
      expect(result.errors[0].type).toBe('required');
    });

    it('should validate age range when provided', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        age: 25, // Too high
        form: 'powder',
        days: 3,
        frequency: 3
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('age');
      expect(result.errors[0].type).toBe('range');
    });

    it('should validate days range', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        form: 'powder',
        days: 5, // Too high
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
        form: 'powder',
        days: 3,
        frequency: 5 // Invalid frequency
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('frequency');
      expect(result.errors[0].type).toBe('range');
    });

    it('should validate form options', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        form: 'liquid', // Invalid form
        days: 3,
        frequency: 3
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('form');
      expect(result.errors[0].type).toBe('required');
    });

    it('should pass validation with valid inputs', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        form: 'powder',
        days: 3,
        frequency: 3
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass validation with valid inputs including age', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        age: 8,
        form: 'pill',
        days: 3,
        frequency: 3
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('calculate', () => {
    it('should calculate for powder form', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        form: 'powder',
        days: 3,
        frequency: 3
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBeGreaterThan(0);
      expect(result.primaryUnit).toBe('medications');
      expect(result.secondaryValues?.bacterialDrugs).toBeDefined();
      expect(result.secondaryValues?.viralDrugs).toBeDefined();
      expect(result.secondaryValues?.form).toBe('powder');
    });

    it('should calculate for pill form', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        form: 'pill',
        days: 3,
        frequency: 3
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBeGreaterThan(0);
      expect(result.primaryUnit).toBe('medications');
      expect(result.secondaryValues?.form).toBe('pill');
    });

    it('should handle different frequencies', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        form: 'powder',
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
        form: 'powder',
        days: 1,
        frequency: 3
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBeGreaterThan(0);
      expect(result.secondaryValues?.days).toBe(1);
    });

    it('should include age when provided', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        age: 10,
        form: 'powder',
        days: 3,
        frequency: 3
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBeGreaterThan(0);
      expect(result.secondaryValues?.age).toBe(10);
    });

    it('should provide recommendations', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        form: 'powder',
        days: 3,
        frequency: 3
      };

      const result = calculate(inputs);

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations!.length).toBeGreaterThan(0);
      expect(result.recommendations![0]['zh-TW']).toContain('臨床參考');
    });

    it('should include calculation metadata', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        form: 'powder',
        days: 3,
        frequency: 3
      };

      const result = calculate(inputs);

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.calculationSteps).toBeDefined();
      expect(result.metadata!.calculationSteps!.length).toBeGreaterThan(0);
      expect(result.metadata!.lastCalculated).toBeDefined();
    });

    it('should calculate bacterial drugs', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        form: 'powder',
        days: 3,
        frequency: 3
      };

      const result = calculate(inputs);

      const bacterialDrugs = result.secondaryValues?.bacterialDrugs as any[];
      expect(bacterialDrugs).toBeDefined();
      expect(bacterialDrugs.length).toBeGreaterThan(0);
      
      // Check that each drug has required properties
      bacterialDrugs.forEach(drug => {
        expect(drug.drugName).toBeDefined();
        expect(drug.brandName).toBeDefined();
        expect(drug.category).toBe('bacterial');
        expect(drug.prescriptionText).toBeDefined();
        expect(drug.totalDoseText).toBeDefined();
      });
    });

    it('should calculate viral drugs', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        form: 'powder',
        days: 3,
        frequency: 3
      };

      const result = calculate(inputs);

      const viralDrugs = result.secondaryValues?.viralDrugs as any[];
      expect(viralDrugs).toBeDefined();
      expect(viralDrugs.length).toBeGreaterThan(0);
      
      // Check that each drug has required properties
      viralDrugs.forEach(drug => {
        expect(drug.drugName).toBeDefined();
        expect(drug.brandName).toBeDefined();
        expect(drug.category).toBe('viral');
        expect(drug.prescriptionText).toBeDefined();
        expect(drug.totalDoseText).toBeDefined();
      });
    });

    it('should handle edge case with very low weight', () => {
      const inputs: CalculatorInputs = {
        weight: 5, // Very low weight
        form: 'powder',
        days: 3,
        frequency: 3
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBeGreaterThan(0);
      expect(result.secondaryValues?.weight).toBe(5);
    });

    it('should handle edge case with high weight', () => {
      const inputs: CalculatorInputs = {
        weight: 50, // High weight
        form: 'powder',
        days: 3,
        frequency: 3
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBeGreaterThan(0);
      expect(result.secondaryValues?.weight).toBe(50);
    });

    it('should handle young age restrictions', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        age: 5, // Young age
        form: 'powder',
        days: 3,
        frequency: 3
      };

      const result = calculate(inputs);

      expect(result.primaryValue).toBeGreaterThan(0);
      expect(result.secondaryValues?.age).toBe(5);
      
      // Check that age-restricted drugs are handled appropriately
      const bacterialDrugs = result.secondaryValues?.bacterialDrugs as any[];
      const minocyclineDrug = bacterialDrugs.find(drug => drug.drugName === 'Minocycline');
      if (minocyclineDrug) {
        expect(minocyclineDrug.totalDoseText).toContain('不建議');
      }
    });

    it('should provide appropriate interpretation', () => {
      const inputs: CalculatorInputs = {
        weight: 15,
        form: 'powder',
        days: 3,
        frequency: 3
      };

      const result = calculate(inputs);

      expect(result.interpretation).toBeDefined();
      expect(result.interpretation!['zh-TW']).toContain('抗細菌藥物');
      expect(result.interpretation!['zh-TW']).toContain('抗病毒藥物');
    });
  });

  describe('error handling', () => {
    it('should handle invalid inputs gracefully', () => {
      const inputs: CalculatorInputs = {
        weight: -5, // Invalid weight
        form: 'powder',
        days: 3,
        frequency: 3
      };

      expect(() => calculate(inputs)).toThrow();
    });
  });
});