import { describe, it, expect } from 'vitest';
import { calculate, validate } from '../calculator.js';
import type { LipidManagementInputs } from '../calculator.js';

describe('Lipid Management Calculator', () => {
  describe('validate', () => {
    it('should require LDL cholesterol', () => {
      const inputs: Partial<LipidManagementInputs> = {
        tg: 150,
      };

      const result = validate(inputs as LipidManagementInputs);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('ldl');
    });

    it('should require triglycerides', () => {
      const inputs: Partial<LipidManagementInputs> = {
        ldl: 120,
      };

      const result = validate(inputs as LipidManagementInputs);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('tg');
    });

    it('should validate LDL range', () => {
      const inputs: LipidManagementInputs = {
        ldl: 30, // Too low
        tg: 150,
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('ldl');
      expect(result.errors[0].type).toBe('range');
    });

    it('should pass validation with valid inputs', () => {
      const inputs: LipidManagementInputs = {
        ldl: 120,
        tg: 150,
      };

      const result = validate(inputs);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('calculate', () => {
    it('should classify as very high risk with ASCVD', () => {
      const inputs: LipidManagementInputs = {
        hasASCVD: true,
        ldl: 120,
        tg: 150,
      };

      const result = calculate(inputs);

      expect(result.riskLevel).toBe('very-high');
      expect(result.ldlTarget).toBe('< 70 mg/dL');
      expect(result.ldlStatus).toBe('above-target');
    });

    it('should classify as very high risk with diabetes', () => {
      const inputs: LipidManagementInputs = {
        hasDM: true,
        ldl: 120,
        tg: 150,
      };

      const result = calculate(inputs);

      expect(result.riskLevel).toBe('very-high');
      expect(result.ldlTarget).toBe('< 70 mg/dL');
    });

    it('should classify as high risk with 2+ risk factors', () => {
      const inputs: LipidManagementInputs = {
        ldl: 120,
        tg: 150,
        isMaleAge: true,
        hasSmoking: true,
      };

      const result = calculate(inputs);

      expect(result.riskLevel).toBe('high');
      expect(result.ldlTarget).toBe('< 100 mg/dL');
      expect(result.riskFactorCount).toBe(2);
    });

    it('should classify as moderate risk with 1 risk factor', () => {
      const inputs: LipidManagementInputs = {
        ldl: 120,
        tg: 150,
        hasHypertension: true,
      };

      const result = calculate(inputs);

      expect(result.riskLevel).toBe('moderate');
      expect(result.ldlTarget).toBe('< 130 mg/dL');
      expect(result.riskFactorCount).toBe(1);
    });

    it('should classify as low risk with no risk factors', () => {
      const inputs: LipidManagementInputs = {
        ldl: 120,
        tg: 150,
      };

      const result = calculate(inputs);

      expect(result.riskLevel).toBe('low');
      expect(result.ldlTarget).toBe('< 160 mg/dL');
      expect(result.riskFactorCount).toBe(0);
    });

    it('should determine LDL at target', () => {
      const inputs: LipidManagementInputs = {
        ldl: 60, // Below 70 target for very high risk
        tg: 150,
        hasASCVD: true,
      };

      const result = calculate(inputs);

      expect(result.ldlStatus).toBe('at-target');
      expect(result.medicationAdvice.needed).toBe(false);
    });

    it('should categorize triglyceride levels correctly', () => {
      const testCases = [
        { tg: 120, expected: 'normal' },
        { tg: 160, expected: 'borderline' },
        { tg: 250, expected: 'high' },
        { tg: 600, expected: 'very-high' },
      ];

      testCases.forEach(({ tg, expected }) => {
        const inputs: LipidManagementInputs = {
          ldl: 120,
          tg,
        };

        const result = calculate(inputs);

        expect(result.tgLevel).toBe(expected);
      });
    });

    it('should provide medication advice when LDL above target', () => {
      const inputs: LipidManagementInputs = {
        ldl: 150, // Above 100 target for high risk
        tg: 150,
        isMaleAge: true,
        hasSmoking: true, // 2 risk factors = high risk
      };

      const result = calculate(inputs);

      expect(result.medicationAdvice.needed).toBe(true);
      expect(result.medicationAdvice.reductionNeeded).toBeGreaterThan(0);
      expect(result.medicationAdvice.medications.length).toBeGreaterThan(0);
    });

    it('should include triglyceride value in result', () => {
      const inputs: LipidManagementInputs = {
        ldl: 120,
        tg: 200,
      };

      const result = calculate(inputs);

      expect(result.tgValue).toBe(200);
    });

    it('should generate appropriate recommendations', () => {
      const inputs: LipidManagementInputs = {
        ldl: 120,
        tg: 150,
        hasASCVD: true,
      };

      const result = calculate(inputs);

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations['zh-TW']).toContain('建議採用地中海飲食');
      expect(result.recommendations['zh-TW']).toContain(
        '每週至少150分鐘中等強度運動'
      );
    });
  });
});
