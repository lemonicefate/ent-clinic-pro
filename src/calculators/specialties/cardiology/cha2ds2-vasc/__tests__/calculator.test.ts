/**
 * CHA₂DS₂-VASc 計算機測試
 * 驗證計算邏輯的準確性和邊界條件
 */

import { describe, it, expect } from 'vitest';
import { calculate, validate, formatResult } from '../calculator';
import type { CHA2DS2VAScInputs } from '../calculator';
import { testCalculatorModule, type TestScenario } from '../../../test-utils/modular-test-suite';
import config from '../config.json';
import type { CalculatorModule } from '../../../types/calculator';

// 建立真實的 CHA2DS2-VASc 計算機模組
const cha2ds2VascModule: CalculatorModule = {
  config: config as any,
  calculator: {
    calculate: async (input: any) => {
      // 先驗證輸入
      const validation = validate(input);
      if (!validation.isValid) {
        throw new Error(`輸入驗證失敗: ${validation.errors.map(e => e.message).join(', ')}`);
      }
      
      const result = calculate(input);
      // 返回符合標準介面的結果
      return {
        value: result.score,
        unit: '分',
        score: result.score,
        riskLevel: result.riskLevel,
        annualStrokeRisk: result.annualStrokeRisk,
        interpretation: result.interpretation,
        recommendations: result.recommendations,
        metadata: result.metadata
      };
    },
    validate: (input: any) => {
      const validation = validate(input);
      return {
        isValid: validation.isValid,
        errors: validation.errors
      };
    }
  },
  visualization: {},
  tests: {}
};

// 自定義測試場景
const customScenarios: TestScenario[] = [
  {
    name: 'Minimum score (0 points)',
    input: {
      chf: 0,
      hypertension: 0,
      age: 0,
      diabetes: 0,
      stroke: 0,
      vascular: 0,
      gender: 0
    },
    expectedOutput: {
      score: 0,
      riskLevel: 'low',
      annualStrokeRisk: 0.2
    }
  },
  {
    name: 'Maximum score (9 points)',
    input: {
      chf: 1,
      hypertension: 1,
      age: 2,
      diabetes: 1,
      stroke: 2,
      vascular: 1,
      gender: 1
    },
    expectedOutput: {
      score: 9,
      riskLevel: 'high',
      annualStrokeRisk: 12.2
    }
  },
  {
    name: 'Moderate risk (1 point)',
    input: {
      chf: 0,
      hypertension: 0,
      age: 0,
      diabetes: 0,
      stroke: 0,
      vascular: 0,
      gender: 1
    },
    expectedOutput: {
      score: 1,
      riskLevel: 'moderate',
      annualStrokeRisk: 0.6
    }
  },
  {
    name: 'High risk (2+ points)',
    input: {
      chf: 1,
      hypertension: 1,
      age: 0,
      diabetes: 0,
      stroke: 0,
      vascular: 0,
      gender: 0
    },
    expectedOutput: {
      score: 2,
      riskLevel: 'high',
      annualStrokeRisk: 2.2
    }
  },
  {
    name: 'Invalid CHF value should fail',
    input: {
      chf: 2, // 應該是 0 或 1
      hypertension: 0,
      age: 0,
      diabetes: 0,
      stroke: 0,
      vascular: 0,
      gender: 0
    },
    shouldFail: true,
    errorCode: 'VALIDATION_FAILED'
  },
  {
    name: 'Invalid age value should fail',
    input: {
      chf: 0,
      hypertension: 0,
      age: 3, // 應該是 0, 1, 或 2
      diabetes: 0,
      stroke: 0,
      vascular: 0,
      gender: 0
    },
    shouldFail: true,
    errorCode: 'VALIDATION_FAILED'
  }
];

// 執行模組化測試
testCalculatorModule(cha2ds2VascModule, {
  performanceThreshold: 15, // 風險評分計算稍微複雜
  enableStressTest: true,
  enableEdgeCaseTest: true,
  testIterations: 150
}, customScenarios);

describe('CHA₂DS₂-VASc Calculator', () => {
  describe('calculate', () => {
    it('should calculate minimum score (0 points)', () => {
      const inputs: CHA2DS2VAScInputs = {
        chf: 0,
        hypertension: 0,
        age: 0,
        diabetes: 0,
        stroke: 0,
        vascular: 0,
        gender: 0
      };

      const result = calculate(inputs);

      expect(result.score).toBe(0);
      expect(result.riskLevel).toBe('low');
      expect(result.annualStrokeRisk).toBe(0.2);
      expect(result.primaryValue).toBe(0);
      expect(result.primaryUnit).toBe('分');
    });

    it('should calculate maximum score (9 points)', () => {
      const inputs: CHA2DS2VAScInputs = {
        chf: 1,
        hypertension: 1,
        age: 2,
        diabetes: 1,
        stroke: 2,
        vascular: 1,
        gender: 1
      };

      const result = calculate(inputs);

      expect(result.score).toBe(9);
      expect(result.riskLevel).toBe('high');
      expect(result.annualStrokeRisk).toBe(12.2);
      expect(result.primaryValue).toBe(9);
    });

    it('should calculate moderate risk (1 point)', () => {
      const inputs: CHA2DS2VAScInputs = {
        chf: 0,
        hypertension: 0,
        age: 0,
        diabetes: 0,
        stroke: 0,
        vascular: 0,
        gender: 1
      };

      const result = calculate(inputs);

      expect(result.score).toBe(1);
      expect(result.riskLevel).toBe('moderate');
      expect(result.annualStrokeRisk).toBe(0.6);
    });

    it('should calculate high risk (2+ points)', () => {
      const inputs: CHA2DS2VAScInputs = {
        chf: 1,
        hypertension: 1,
        age: 0,
        diabetes: 0,
        stroke: 0,
        vascular: 0,
        gender: 0
      };

      const result = calculate(inputs);

      expect(result.score).toBe(2);
      expect(result.riskLevel).toBe('high');
      expect(result.annualStrokeRisk).toBe(2.2);
    });

    it('should handle stroke history correctly (2 points)', () => {
      const inputs: CHA2DS2VAScInputs = {
        chf: 0,
        hypertension: 0,
        age: 0,
        diabetes: 0,
        stroke: 2,
        vascular: 0,
        gender: 0
      };

      const result = calculate(inputs);

      expect(result.score).toBe(2);
      expect(result.riskLevel).toBe('high');
    });

    it('should handle age categories correctly', () => {
      // Age 65-74 (1 point)
      const inputs1: CHA2DS2VAScInputs = {
        chf: 0,
        hypertension: 0,
        age: 1,
        diabetes: 0,
        stroke: 0,
        vascular: 0,
        gender: 0
      };

      const result1 = calculate(inputs1);
      expect(result1.score).toBe(1);

      // Age ≥75 (2 points)
      const inputs2: CHA2DS2VAScInputs = {
        chf: 0,
        hypertension: 0,
        age: 2,
        diabetes: 0,
        stroke: 0,
        vascular: 0,
        gender: 0
      };

      const result2 = calculate(inputs2);
      expect(result2.score).toBe(2);
    });

    it('should include correct risk factors in result', () => {
      const inputs: CHA2DS2VAScInputs = {
        chf: 1,
        hypertension: 0,
        age: 1,
        diabetes: 1,
        stroke: 0,
        vascular: 0,
        gender: 1
      };

      const result = calculate(inputs);
      const presentFactors = result.riskFactors.filter(rf => rf.present);

      expect(presentFactors).toHaveLength(4);
      expect(presentFactors.map(rf => rf.factor)).toEqual(['chf', 'age', 'diabetes', 'gender']);
    });

    it('should provide correct interpretation for different locales', () => {
      const inputs: CHA2DS2VAScInputs = {
        chf: 0,
        hypertension: 0,
        age: 0,
        diabetes: 0,
        stroke: 0,
        vascular: 0,
        gender: 0
      };

      const result = calculate(inputs);

      expect(result.interpretation['zh-TW']).toContain('低風險');
      expect(result.interpretation['en']).toContain('Low risk');
      expect(result.interpretation['ja']).toContain('低リスク');
    });

    it('should provide appropriate recommendations based on score', () => {
      // Low risk (0 points)
      const lowRiskInputs: CHA2DS2VAScInputs = {
        chf: 0,
        hypertension: 0,
        age: 0,
        diabetes: 0,
        stroke: 0,
        vascular: 0,
        gender: 0
      };

      const lowRiskResult = calculate(lowRiskInputs);
      expect(lowRiskResult.recommendations).toHaveLength(2);
      expect(lowRiskResult.recommendations[0]['zh-TW']).toContain('定期追蹤');

      // High risk (2+ points)
      const highRiskInputs: CHA2DS2VAScInputs = {
        chf: 1,
        hypertension: 1,
        age: 0,
        diabetes: 0,
        stroke: 0,
        vascular: 0,
        gender: 0
      };

      const highRiskResult = calculate(highRiskInputs);
      expect(highRiskResult.recommendations).toHaveLength(3);
      expect(highRiskResult.recommendations[0]['zh-TW']).toContain('抗凝血劑');
    });
  });

  describe('validate', () => {
    it('should pass validation for valid inputs', () => {
      const inputs: CHA2DS2VAScInputs = {
        chf: 1,
        hypertension: 0,
        age: 2,
        diabetes: 1,
        stroke: 2,
        vascular: 0,
        gender: 1
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing required fields', () => {
      const inputs = {
        chf: 1,
        hypertension: 0,
        // missing age, diabetes, stroke, vascular, gender
      } as CHA2DS2VAScInputs;

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.type === 'required')).toBe(true);
    });

    it('should fail validation for invalid ranges', () => {
      const inputs: CHA2DS2VAScInputs = {
        chf: 2, // invalid: should be 0 or 1
        hypertension: 0,
        age: 3, // invalid: should be 0, 1, or 2
        diabetes: 0,
        stroke: 1, // invalid: should be 0 or 2
        vascular: 0,
        gender: 0
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.type === 'range')).toBe(true);
    });

    it('should fail validation for negative values', () => {
      const inputs: CHA2DS2VAScInputs = {
        chf: -1,
        hypertension: 0,
        age: 0,
        diabetes: 0,
        stroke: 0,
        vascular: 0,
        gender: 0
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'invalid')).toBe(true);
    });

    it('should fail validation for non-integer values', () => {
      const inputs: CHA2DS2VAScInputs = {
        chf: 0.5,
        hypertension: 0,
        age: 0,
        diabetes: 0,
        stroke: 0,
        vascular: 0,
        gender: 0
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'invalid')).toBe(true);
    });
  });

  describe('formatResult', () => {
    it('should format result correctly for different locales', () => {
      const inputs: CHA2DS2VAScInputs = {
        chf: 1,
        hypertension: 1,
        age: 1,
        diabetes: 0,
        stroke: 0,
        vascular: 0,
        gender: 1
      };

      const result = calculate(inputs);

      // Test Chinese formatting
      const zhFormat = formatResult(result, 'zh-TW');
      expect(zhFormat.displayValue).toBe('4 分');
      expect(zhFormat.riskDescription).toBe('高風險');

      // Test English formatting
      const enFormat = formatResult(result, 'en');
      expect(enFormat.displayValue).toBe('4 分');
      expect(enFormat.riskDescription).toBe('High Risk');

      // Test Japanese formatting
      const jaFormat = formatResult(result, 'ja');
      expect(jaFormat.displayValue).toBe('4 分');
      expect(jaFormat.riskDescription).toBe('高リスク');
    });

    it('should include appropriate recommendations in formatted result', () => {
      const inputs: CHA2DS2VAScInputs = {
        chf: 0,
        hypertension: 0,
        age: 0,
        diabetes: 0,
        stroke: 0,
        vascular: 0,
        gender: 1
      };

      const result = calculate(inputs);
      const formatted = formatResult(result, 'zh-TW');

      expect(formatted.recommendations).toHaveLength(2);
      expect(formatted.recommendations[0]).toContain('HAS-BLED');
    });
  });

  describe('edge cases', () => {
    it('should handle boundary values correctly', () => {
      // Test all minimum values
      const minInputs: CHA2DS2VAScInputs = {
        chf: 0,
        hypertension: 0,
        age: 0,
        diabetes: 0,
        stroke: 0,
        vascular: 0,
        gender: 0
      };

      const minResult = calculate(minInputs);
      expect(minResult.score).toBe(0);

      // Test all maximum values
      const maxInputs: CHA2DS2VAScInputs = {
        chf: 1,
        hypertension: 1,
        age: 2,
        diabetes: 1,
        stroke: 2,
        vascular: 1,
        gender: 1
      };

      const maxResult = calculate(maxInputs);
      expect(maxResult.score).toBe(9);
    });

    it('should handle visualization data correctly', () => {
      const inputs: CHA2DS2VAScInputs = {
        chf: 1,
        hypertension: 0,
        age: 1,
        diabetes: 0,
        stroke: 0,
        vascular: 0,
        gender: 0
      };

      const result = calculate(inputs);

      expect(result.visualizationData).toBeDefined();
      expect(result.visualizationData.score).toBe(2);
      expect(result.visualizationData.riskLevel).toBe('high');
      expect(result.visualizationData.riskFactors).toHaveLength(2);
      expect(result.visualizationData.riskDistribution).toBeDefined();
    });
  });
});