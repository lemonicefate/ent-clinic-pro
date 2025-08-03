/**
 * CHA2DS2-VASc 計算機測試
 */

import { describe, it, expect } from 'vitest';
import { calculate, validate, formatResult } from '../calculator';
import { CHA2DS2VAScInputs } from '../types';

describe('CHA2DS2-VASc Calculator', () => {
  describe('validate', () => {
    it('should pass validation with valid inputs', () => {
      const inputs: CHA2DS2VAScInputs = {
        age: 70,
        gender: 'male',
        congestiveHeartFailure: false,
        hypertension: true,
        diabetes: false,
        strokeTiaHistory: false,
        vascularDisease: false
      };

      const errors = validate(inputs);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with missing age', () => {
      const inputs: CHA2DS2VAScInputs = {
        age: 0,
        gender: 'male',
        congestiveHeartFailure: false,
        hypertension: false,
        diabetes: false,
        strokeTiaHistory: false,
        vascularDisease: false
      };

      const errors = validate(inputs);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('age');
    });

    it('should fail validation with invalid age range', () => {
      const inputs: CHA2DS2VAScInputs = {
        age: 15, // 未滿 18 歲
        gender: 'male',
        congestiveHeartFailure: false,
        hypertension: false,
        diabetes: false,
        strokeTiaHistory: false,
        vascularDisease: false
      };

      const errors = validate(inputs);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('age');
    });

    it('should fail validation with missing gender', () => {
      const inputs: CHA2DS2VAScInputs = {
        age: 70,
        gender: '' as any,
        congestiveHeartFailure: false,
        hypertension: false,
        diabetes: false,
        strokeTiaHistory: false,
        vascularDisease: false
      };

      const errors = validate(inputs);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('gender');
    });
  });

  describe('calculate', () => {
    it('should calculate score 0 for low risk patient', () => {
      const inputs: CHA2DS2VAScInputs = {
        age: 50, // < 65 歲
        gender: 'male', // 男性不得分
        congestiveHeartFailure: false,
        hypertension: false,
        diabetes: false,
        strokeTiaHistory: false,
        vascularDisease: false
      };

      const result = calculate(inputs);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.result.score).toBe(0);
        expect(result.result.riskLevel).toBe('low');
        expect(result.result.strokeRiskPerYear).toBe(0.2);
        expect(result.result.anticoagulationRecommendation.recommended).toBe(false);
        expect(result.result.anticoagulationRecommendation.strength).toBe('not-recommended');
      }
    });

    it('should calculate score 1 for moderate risk male patient', () => {
      const inputs: CHA2DS2VAScInputs = {
        age: 70, // 65-74 歲得 1 分
        gender: 'male',
        congestiveHeartFailure: false,
        hypertension: false,
        diabetes: false,
        strokeTiaHistory: false,
        vascularDisease: false
      };

      const result = calculate(inputs);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.result.score).toBe(1);
        expect(result.result.riskLevel).toBe('moderate');
        expect(result.result.strokeRiskPerYear).toBe(0.9);
        expect(result.result.anticoagulationRecommendation.recommended).toBe(true);
        expect(result.result.anticoagulationRecommendation.strength).toBe('consider');
      }
    });

    it('should calculate score correctly for female patient', () => {
      const inputs: CHA2DS2VAScInputs = {
        age: 50, // < 65 歲
        gender: 'female', // 女性得 1 分
        congestiveHeartFailure: false,
        hypertension: false,
        diabetes: false,
        strokeTiaHistory: false,
        vascularDisease: false
      };

      const result = calculate(inputs);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.result.score).toBe(1);
        expect(result.result.riskLevel).toBe('moderate');
      }
    });

    it('should calculate score 2 for high risk patient', () => {
      const inputs: CHA2DS2VAScInputs = {
        age: 70, // 65-74 歲得 1 分
        gender: 'male',
        congestiveHeartFailure: false,
        hypertension: true, // 高血壓得 1 分
        diabetes: false,
        strokeTiaHistory: false,
        vascularDisease: false
      };

      const result = calculate(inputs);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.result.score).toBe(2);
        expect(result.result.riskLevel).toBe('high');
        expect(result.result.strokeRiskPerYear).toBe(2.9);
        expect(result.result.anticoagulationRecommendation.recommended).toBe(true);
        expect(result.result.anticoagulationRecommendation.strength).toBe('recommended');
      }
    });

    it('should calculate maximum score correctly', () => {
      const inputs: CHA2DS2VAScInputs = {
        age: 80, // ≥75 歲得 2 分
        gender: 'female', // 女性得 1 分
        congestiveHeartFailure: true, // 1 分
        hypertension: true, // 1 分
        diabetes: true, // 1 分
        strokeTiaHistory: true, // 2 分
        vascularDisease: true // 1 分
      };

      const result = calculate(inputs);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.result.score).toBe(9); // 2+1+1+1+1+2+1 = 9
        expect(result.result.riskLevel).toBe('high');
        expect(result.result.anticoagulationRecommendation.recommended).toBe(true);
        expect(result.result.anticoagulationRecommendation.strength).toBe('strongly-recommended');
      }
    });

    it('should handle stroke/TIA history correctly (2 points)', () => {
      const inputs: CHA2DS2VAScInputs = {
        age: 50,
        gender: 'male',
        congestiveHeartFailure: false,
        hypertension: false,
        diabetes: false,
        strokeTiaHistory: true, // 2 分
        vascularDisease: false
      };

      const result = calculate(inputs);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.result.score).toBe(2);
        expect(result.result.riskLevel).toBe('high');
      }
    });

    it('should calculate age points correctly', () => {
      const testCases = [
        { age: 60, expectedPoints: 0 },
        { age: 65, expectedPoints: 1 },
        { age: 74, expectedPoints: 1 },
        { age: 75, expectedPoints: 2 },
        { age: 85, expectedPoints: 2 }
      ];

      testCases.forEach(testCase => {
        const inputs: CHA2DS2VAScInputs = {
          age: testCase.age,
          gender: 'male',
          congestiveHeartFailure: false,
          hypertension: false,
          diabetes: false,
          strokeTiaHistory: false,
          vascularDisease: false
        };

        const result = calculate(inputs);
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.result.score).toBe(testCase.expectedPoints);
        }
      });
    });

    it('should provide correct calculation steps', () => {
      const inputs: CHA2DS2VAScInputs = {
        age: 70, // 1 分
        gender: 'female', // 1 分
        congestiveHeartFailure: true, // 1 分
        hypertension: false,
        diabetes: false,
        strokeTiaHistory: false,
        vascularDisease: false
      };

      const result = calculate(inputs);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.result.calculationSteps).toHaveLength(3);
        expect(result.result.calculationSteps.some(step => step.factor === '年齡')).toBe(true);
        expect(result.result.calculationSteps.some(step => step.factor === '性別')).toBe(true);
        expect(result.result.calculationSteps.some(step => step.factor === '充血性心衰竭')).toBe(true);
      }
    });

    it('should fail calculation with invalid inputs', () => {
      const invalidInputs: CHA2DS2VAScInputs = {
        age: -1,
        gender: 'male',
        congestiveHeartFailure: false,
        hypertension: false,
        diabetes: false,
        strokeTiaHistory: false,
        vascularDisease: false
      };

      const result = calculate(invalidInputs);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('formatResult', () => {
    it('should format result correctly', () => {
      const inputs: CHA2DS2VAScInputs = {
        age: 70,
        gender: 'male',
        congestiveHeartFailure: false,
        hypertension: true,
        diabetes: false,
        strokeTiaHistory: false,
        vascularDisease: false
      };

      const result = calculate(inputs);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const formatted = formatResult(result.result);
        expect(formatted).toContain('CHA2DS2-VASc:');
        expect(formatted).toContain('2 分');
        expect(formatted).toContain('高風險');
        expect(formatted).toContain('2.9%');
      }
    });

    it('should format result with different locales', () => {
      const inputs: CHA2DS2VAScInputs = {
        age: 70,
        gender: 'male',
        congestiveHeartFailure: false,
        hypertension: true,
        diabetes: false,
        strokeTiaHistory: false,
        vascularDisease: false
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
        
        // 所有格式都應該包含評分
        expect(formattedZh).toContain('2 分');
        expect(formattedEn).toContain('2 分');
        expect(formattedJa).toContain('2 分');
      }
    });
  });

  describe('Clinical Accuracy', () => {
    it('should match expected clinical scenarios', () => {
      // 基於臨床指引的測試案例
      const testCases = [
        {
          name: '低風險年輕男性',
          inputs: { age: 45, gender: 'male' as const, congestiveHeartFailure: false, hypertension: false, diabetes: false, strokeTiaHistory: false, vascularDisease: false },
          expectedScore: 0,
          expectedRisk: 'low' as const
        },
        {
          name: '中等風險老年男性',
          inputs: { age: 68, gender: 'male' as const, congestiveHeartFailure: false, hypertension: false, diabetes: false, strokeTiaHistory: false, vascularDisease: false },
          expectedScore: 1,
          expectedRisk: 'moderate' as const
        },
        {
          name: '高風險糖尿病患者',
          inputs: { age: 72, gender: 'female' as const, congestiveHeartFailure: false, hypertension: true, diabetes: true, strokeTiaHistory: false, vascularDisease: false },
          expectedScore: 4, // 1(age) + 1(female) + 1(hypertension) + 1(diabetes) = 4
          expectedRisk: 'high' as const
        },
        {
          name: '極高風險中風病史患者',
          inputs: { age: 78, gender: 'male' as const, congestiveHeartFailure: true, hypertension: true, diabetes: false, strokeTiaHistory: true, vascularDisease: false },
          expectedScore: 6, // 2(age≥75) + 1(CHF) + 1(hypertension) + 2(stroke) = 6
          expectedRisk: 'high' as const
        }
      ];

      testCases.forEach(testCase => {
        const result = calculate(testCase.inputs);
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.result.score).toBe(testCase.expectedScore);
          expect(result.result.riskLevel).toBe(testCase.expectedRisk);
        }
      });
    });
  });
});