/**
 * eGFR 計算機測試
 */

import { describe, it, expect } from 'vitest';
import { calculate, validate, formatResult } from '../calculator';
import { EGFRInputs } from '../types';

describe('eGFR Calculator', () => {
  describe('validate', () => {
    it('should pass validation with valid inputs', () => {
      const inputs: EGFRInputs = {
        creatinine: 1.2,
        age: 65,
        gender: 'male'
      };

      const errors = validate(inputs);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with missing creatinine', () => {
      const inputs: EGFRInputs = {
        creatinine: 0,
        age: 65,
        gender: 'male'
      };

      const errors = validate(inputs);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('creatinine');
    });

    it('should fail validation with invalid creatinine range', () => {
      const inputs: EGFRInputs = {
        creatinine: 25.0, // 超出範圍
        age: 65,
        gender: 'male'
      };

      const errors = validate(inputs);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('creatinine');
    });

    it('should fail validation with invalid age', () => {
      const inputs: EGFRInputs = {
        creatinine: 1.2,
        age: 15, // 未滿 18 歲
        gender: 'male'
      };

      const errors = validate(inputs);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('age');
    });

    it('should fail validation with missing gender', () => {
      const inputs: EGFRInputs = {
        creatinine: 1.2,
        age: 65,
        gender: '' as any
      };

      const errors = validate(inputs);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('gender');
    });
  });

  describe('calculate', () => {
    it('should calculate eGFR correctly for male patient', () => {
      const inputs: EGFRInputs = {
        creatinine: 1.2,
        age: 65,
        gender: 'male'
      };

      const result = calculate(inputs);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.result.egfr).toBeGreaterThan(0);
        expect(result.result.egfr).toBeLessThan(200);
        expect(result.result.stage).toBeDefined();
        expect(result.result.riskLevel).toBeDefined();
        expect(result.result.interpretation).toBeDefined();
        expect(result.result.recommendations).toBeInstanceOf(Array);
        expect(result.result.calculationSteps).toBeInstanceOf(Array);
        expect(result.result.nextSteps).toBeInstanceOf(Array);
      }
    });

    it('should calculate eGFR correctly for female patient', () => {
      const inputs: EGFRInputs = {
        creatinine: 1.0,
        age: 55,
        gender: 'female'
      };

      const result = calculate(inputs);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.result.egfr).toBeGreaterThan(0);
        expect(result.result.stage).toBeDefined();
        expect(result.result.riskLevel).toBeDefined();
      }
    });

    it('should return higher eGFR for younger patients', () => {
      const olderPatient: EGFRInputs = {
        creatinine: 1.2,
        age: 80,
        gender: 'male'
      };

      const youngerPatient: EGFRInputs = {
        creatinine: 1.2,
        age: 30,
        gender: 'male'
      };

      const olderResult = calculate(olderPatient);
      const youngerResult = calculate(youngerPatient);

      expect(olderResult.success).toBe(true);
      expect(youngerResult.success).toBe(true);

      if (olderResult.success && youngerResult.success) {
        expect(youngerResult.result.egfr).toBeGreaterThan(olderResult.result.egfr);
      }
    });

    it('should return higher eGFR for female patients (same age and creatinine)', () => {
      const malePatient: EGFRInputs = {
        creatinine: 1.2,
        age: 65,
        gender: 'male'
      };

      const femalePatient: EGFRInputs = {
        creatinine: 1.2,
        age: 65,
        gender: 'female'
      };

      const maleResult = calculate(malePatient);
      const femaleResult = calculate(femalePatient);

      expect(maleResult.success).toBe(true);
      expect(femaleResult.success).toBe(true);

      if (maleResult.success && femaleResult.success) {
        expect(femaleResult.result.egfr).toBeGreaterThan(maleResult.result.egfr);
      }
    });

    it('should classify CKD stages correctly', () => {
      // 測試不同 eGFR 值的分期
      const testCases = [
        { creatinine: 0.8, age: 30, gender: 'female' as const, expectedStage: 'G1' },
        { creatinine: 1.2, age: 65, gender: 'male' as const, expectedStage: 'G3a' },
        { creatinine: 2.5, age: 70, gender: 'male' as const, expectedStage: 'G3b' },
        { creatinine: 4.0, age: 75, gender: 'male' as const, expectedStage: 'G4' }
      ];

      testCases.forEach(testCase => {
        const result = calculate(testCase);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.result.stage.stage).toBe(testCase.expectedStage);
        }
      });
    });

    it('should handle edge cases', () => {
      // 最小值
      const minInputs: EGFRInputs = {
        creatinine: 0.1,
        age: 18,
        gender: 'female'
      };

      // 最大值
      const maxInputs: EGFRInputs = {
        creatinine: 20.0,
        age: 120,
        gender: 'male'
      };

      const minResult = calculate(minInputs);
      const maxResult = calculate(maxInputs);

      expect(minResult.success).toBe(true);
      expect(maxResult.success).toBe(true);

      if (minResult.success && maxResult.success) {
        expect(minResult.result.egfr).toBeGreaterThan(maxResult.result.egfr);
      }
    });

    it('should fail calculation with invalid inputs', () => {
      const invalidInputs: EGFRInputs = {
        creatinine: -1,
        age: 65,
        gender: 'male'
      };

      const result = calculate(invalidInputs);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('formatResult', () => {
    it('should format result correctly', () => {
      const inputs: EGFRInputs = {
        creatinine: 1.2,
        age: 65,
        gender: 'male'
      };

      const result = calculate(inputs);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const formatted = formatResult(result.result);
        expect(formatted).toContain('eGFR:');
        expect(formatted).toContain('mL/min/1.73m²');
        expect(formatted).toContain(result.result.egfr.toString());
      }
    });

    it('should format result with different locales', () => {
      const inputs: EGFRInputs = {
        creatinine: 1.2,
        age: 65,
        gender: 'male'
      };

      const result = calculate(inputs);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const formattedZh = formatResult(result.result, 'zh-TW');
        const formattedEn = formatResult(result.result, 'en');
        const formattedJa = formatResult(result.result, 'ja');

        expect(formattedZh).toBeDefined();
        expect(formattedEn).toBeDefined();
        expect(formattedJa).toBeDefined();
        
        // 所有格式都應該包含 eGFR 值
        expect(formattedZh).toContain(result.result.egfr.toString());
        expect(formattedEn).toContain(result.result.egfr.toString());
        expect(formattedJa).toContain(result.result.egfr.toString());
      }
    });
  });

  describe('CKD-EPI 2021 Formula Accuracy', () => {
    it('should match expected eGFR values for known test cases', () => {
      // 基於文獻的測試案例
      const testCases = [
        {
          inputs: { creatinine: 1.0, age: 40, gender: 'male' as const },
          expectedRange: [85, 95] // 預期範圍
        },
        {
          inputs: { creatinine: 1.0, age: 40, gender: 'female' as const },
          expectedRange: [95, 105] // 女性應該較高
        },
        {
          inputs: { creatinine: 2.0, age: 60, gender: 'male' as const },
          expectedRange: [35, 45] // 高肌酸酐應該較低
        }
      ];

      testCases.forEach(testCase => {
        const result = calculate(testCase.inputs);
        expect(result.success).toBe(true);
        
        if (result.success) {
          const egfr = result.result.egfr;
          expect(egfr).toBeGreaterThanOrEqual(testCase.expectedRange[0]);
          expect(egfr).toBeLessThanOrEqual(testCase.expectedRange[1]);
        }
      });
    });
  });
});