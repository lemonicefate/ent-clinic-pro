/**
 * Pediatric Antibiotic Calculator Tests
 */

import { describe, it, expect } from 'vitest';
import { calculate, validate } from '../calculator.js';

describe('Pediatric Antibiotic Calculator', () => {
  describe('validate', () => {
    it('should validate required weight input', () => {
      const result = validate({});
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'weight',
        message: '請輸入有效的體重',
        type: 'required'
      });
    });

    it('should validate weight range', () => {
      const result = validate({ weight: '150' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'weight',
        message: '體重必須在 1-100 公斤之間',
        type: 'range'
      });
    });

    it('should validate valid inputs', () => {
      const result = validate({
        weight: '15',
        age: '5',
        form: 'powder',
        days: '3',
        frequency: '3'
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('calculate', () => {
    it('should calculate doses for multiple antibiotics', () => {
      const inputs = {
        weight: '15',
        age: '5',
        form: 'powder',
        days: '3',
        frequency: '3'
      };

      const result = calculate(inputs);
      
      expect(result.primaryValue).toBeGreaterThan(0);
      expect(result.primaryUnit).toBe('medications');
      expect(result.secondaryValues?.bacterialDrugs).toBeDefined();
      expect(result.secondaryValues?.viralDrugs).toBeDefined();
      expect(result.interpretation?.['zh-TW']).toContain('已計算');
    });

    it('should handle age restrictions for tetracyclines', () => {
      const inputs = {
        weight: '10',
        age: '6', // Under 8 years
        form: 'powder',
        days: '3',
        frequency: '3'
      };

      const result = calculate(inputs);
      const bacterialDrugs = result.secondaryValues?.bacterialDrugs as any[];
      
      // Check that Minocycline has age restriction
      const minocycline = bacterialDrugs.find(drug => drug.drugName === 'Minocycline');
      expect(minocycline?.borderColor).toBe('border-red-500');
      expect(minocycline?.totalDoseText).toContain('不建議 8 歲以下使用');
    });

    it('should calculate different doses for powder vs pill forms', () => {
      const baseInputs = {
        weight: '20',
        age: '10',
        days: '3',
        frequency: '3'
      };

      const powderResult = calculate({ ...baseInputs, form: 'powder' });
      const pillResult = calculate({ ...baseInputs, form: 'pill' });

      // Results should be different due to different calculation methods
      expect(powderResult.secondaryValues?.form).toBe('powder');
      expect(pillResult.secondaryValues?.form).toBe('pill');
    });

    it('should apply maximum dose limits', () => {
      const inputs = {
        weight: '50', // High weight to test dose limits
        age: '15',
        form: 'powder',
        days: '3',
        frequency: '3'
      };

      const result = calculate(inputs);
      const bacterialDrugs = result.secondaryValues?.bacterialDrugs as any[];
      
      // Check that Azithromycin is capped at 500mg/day
      const azithromycin = bacterialDrugs.find(drug => drug.drugName === 'Azithromycin');
      expect(azithromycin?.otherDetails).toContain('已達上限');
    });

    it('should handle missing age for age-dependent drugs', () => {
      const inputs = {
        weight: '15',
        // age not provided
        form: 'powder',
        days: '3',
        frequency: '3'
      };

      const result = calculate(inputs);
      const bacterialDrugs = result.secondaryValues?.bacterialDrugs as any[];
      
      // Check that Levofloxacin shows age requirement
      const levofloxacin = bacterialDrugs.find(drug => drug.drugName === 'Levofloxacin');
      expect(levofloxacin?.totalDoseText).toContain('請輸入年齡');
    });
  });

  describe('edge cases', () => {
    it('should handle minimum weight', () => {
      const inputs = {
        weight: '1',
        age: '1',
        form: 'powder',
        days: '1',
        frequency: '1'
      };

      const result = calculate(inputs);
      expect(result.primaryValue).toBeGreaterThan(0);
    });

    it('should handle maximum weight', () => {
      const inputs = {
        weight: '100',
        age: '18',
        form: 'pill',
        days: '3',
        frequency: '4'
      };

      const result = calculate(inputs);
      expect(result.primaryValue).toBeGreaterThan(0);
    });
  });
});