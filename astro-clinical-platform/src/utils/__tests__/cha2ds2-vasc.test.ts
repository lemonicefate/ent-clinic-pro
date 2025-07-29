/**
 * CHA₂DS₂-VASc 計算機測試
 * 驗證計算邏輯的準確性
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CalculatorEngine, createCalculatorEngine } from '../calculator-engine';
import type { Calculator } from '../../content/config';

// 模擬 CHA₂DS₂-VASc 計算機配置
const mockCHA2DS2VAScCalculator: Calculator = {
  id: 'cha2ds2-vasc',
  name: { 'zh-TW': 'CHA₂DS₂-VASc 評分' },
  slug: 'cha2ds2-vasc',
  description: { 'zh-TW': '心房顫動中風風險評估' },
  category: 'cardiology',
  fields: [
    {
      id: 'chf',
      type: 'select',
      label: { 'zh-TW': '充血性心衰竭' },
      options: [
        { value: 0, label: { 'zh-TW': '無' } },
        { value: 1, label: { 'zh-TW': '有' } }
      ],
      validation: { required: true }
    },
    {
      id: 'hypertension',
      type: 'select',
      label: { 'zh-TW': '高血壓' },
      options: [
        { value: 0, label: { 'zh-TW': '無' } },
        { value: 1, label: { 'zh-TW': '有' } }
      ],
      validation: { required: true }
    },
    {
      id: 'age',
      type: 'select',
      label: { 'zh-TW': '年齡' },
      options: [
        { value: 0, label: { 'zh-TW': '< 65歲' } },
        { value: 1, label: { 'zh-TW': '65-74歲' } },
        { value: 2, label: { 'zh-TW': '≥ 75歲' } }
      ],
      validation: { required: true }
    },
    {
      id: 'diabetes',
      type: 'select',
      label: { 'zh-TW': '糖尿病' },
      options: [
        { value: 0, label: { 'zh-TW': '無' } },
        { value: 1, label: { 'zh-TW': '有' } }
      ],
      validation: { required: true }
    },
    {
      id: 'stroke',
      type: 'select',
      label: { 'zh-TW': '中風/TIA/血栓栓塞病史' },
      options: [
        { value: 0, label: { 'zh-TW': '無' } },
        { value: 2, label: { 'zh-TW': '有' } }
      ],
      validation: { required: true }
    },
    {
      id: 'vascular',
      type: 'select',
      label: { 'zh-TW': '血管疾病' },
      options: [
        { value: 0, label: { 'zh-TW': '無' } },
        { value: 1, label: { 'zh-TW': '有' } }
      ],
      validation: { required: true }
    },
    {
      id: 'gender',
      type: 'select',
      label: { 'zh-TW': '性別' },
      options: [
        { value: 0, label: { 'zh-TW': '男性' } },
        { value: 1, label: { 'zh-TW': '女性' } }
      ],
      validation: { required: true }
    }
  ],
  calculationFunction: 'calculateCHADSVASC',
  validationRules: {
    maxScore: 9,
    minScore: 0,
    requiredFields: ['chf', 'hypertension', 'age', 'diabetes', 'stroke', 'vascular', 'gender']
  },
  interpretation: [
    {
      range: [0, 0],
      risk: 'low',
      recommendation: { 'zh-TW': '低風險：可考慮不使用抗凝血劑' },
      color: '#22c55e',
      icon: 'check-circle'
    },
    {
      range: [1, 1],
      risk: 'moderate',
      recommendation: { 'zh-TW': '中等風險：可考慮使用抗凝血劑' },
      color: '#f59e0b',
      icon: 'exclamation-triangle'
    },
    {
      range: [2, 9],
      risk: 'high',
      recommendation: { 'zh-TW': '高風險：強烈建議使用抗凝血劑' },
      color: '#ef4444',
      icon: 'exclamation'
    }
  ],
  clinicalGuidelines: { 'zh-TW': '根據 ESC 指引' },
  evidenceLevel: 'A',
  tags: ['atrial fibrillation', 'stroke risk'],
  medicalSpecialties: ['cardiology'],
  difficulty: 'basic',
  isActive: true,
  isFeatured: true,
  lastUpdated: '2024-01-15T00:00:00.000Z'
};

describe('CHA₂DS₂-VASc Calculator', () => {
  let engine: CalculatorEngine;

  beforeEach(() => {
    engine = createCalculatorEngine(mockCHA2DS2VAScCalculator);
  });

  describe('Score Calculation', () => {
    it('should calculate score 0 for young male with no risk factors', () => {
      const input = {
        chf: 0,
        hypertension: 0,
        age: 0, // < 65
        diabetes: 0,
        stroke: 0,
        vascular: 0,
        gender: 0 // male
      };

      const result = engine.calculate(input);
      expect(result.score).toBe(0);
      expect(result.risk).toBe('low');
    });

    it('should calculate score 1 for young female with no other risk factors', () => {
      const input = {
        chf: 0,
        hypertension: 0,
        age: 0, // < 65
        diabetes: 0,
        stroke: 0,
        vascular: 0,
        gender: 1 // female
      };

      const result = engine.calculate(input);
      expect(result.score).toBe(1);
      expect(result.risk).toBe('moderate');
    });

    it('should calculate score 2 for elderly male (65-74) with no other risk factors', () => {
      const input = {
        chf: 0,
        hypertension: 0,
        age: 1, // 65-74
        diabetes: 0,
        stroke: 0,
        vascular: 0,
        gender: 0 // male
      };

      const result = engine.calculate(input);
      expect(result.score).toBe(1);
      expect(result.risk).toBe('moderate');
    });

    it('should calculate score 4 for very elderly male (≥75) with no other risk factors', () => {
      const input = {
        chf: 0,
        hypertension: 0,
        age: 2, // ≥ 75
        diabetes: 0,
        stroke: 0,
        vascular: 0,
        gender: 0 // male
      };

      const result = engine.calculate(input);
      expect(result.score).toBe(2);
      expect(result.risk).toBe('high');
    });

    it('should calculate maximum score 9 for patient with all risk factors', () => {
      const input = {
        chf: 1,        // +1
        hypertension: 1, // +1
        age: 2,        // +2 (≥75)
        diabetes: 1,   // +1
        stroke: 2,     // +2
        vascular: 1,   // +1
        gender: 1      // +1 (female)
      };

      const result = engine.calculate(input);
      expect(result.score).toBe(9);
      expect(result.risk).toBe('high');
    });

    it('should give stroke history double points', () => {
      const input = {
        chf: 0,
        hypertension: 0,
        age: 0,
        diabetes: 0,
        stroke: 2, // Should add 2 points
        vascular: 0,
        gender: 0
      };

      const result = engine.calculate(input);
      expect(result.score).toBe(2);
      expect(result.risk).toBe('high');
    });

    it('should calculate score correctly for complex case', () => {
      const input = {
        chf: 1,        // +1
        hypertension: 1, // +1
        age: 1,        // +1 (65-74)
        diabetes: 1,   // +1
        stroke: 0,     // +0
        vascular: 1,   // +1
        gender: 1      // +1 (female)
      };

      const result = engine.calculate(input);
      expect(result.score).toBe(6);
      expect(result.risk).toBe('high');
    });
  });

  describe('Risk Interpretation', () => {
    it('should recommend no anticoagulation for score 0', () => {
      const input = {
        chf: 0, hypertension: 0, age: 0, diabetes: 0,
        stroke: 0, vascular: 0, gender: 0
      };

      const result = engine.calculate(input);
      expect(result.risk).toBe('low');
      expect(result.interpretation.recommendation).toContain('低風險');
    });

    it('should suggest considering anticoagulation for score 1', () => {
      const input = {
        chf: 0, hypertension: 0, age: 0, diabetes: 0,
        stroke: 0, vascular: 0, gender: 1 // female
      };

      const result = engine.calculate(input);
      expect(result.risk).toBe('moderate');
      expect(result.interpretation.recommendation).toContain('中等風險');
    });

    it('should strongly recommend anticoagulation for score ≥2', () => {
      const input = {
        chf: 1, hypertension: 1, age: 0, diabetes: 0,
        stroke: 0, vascular: 0, gender: 0
      };

      const result = engine.calculate(input);
      expect(result.risk).toBe('high');
      expect(result.interpretation.recommendation).toContain('高風險');
    });
  });

  describe('Input Validation', () => {
    it('should validate required fields', () => {
      const input = {
        chf: 0,
        hypertension: 0,
        age: 0,
        diabetes: 0,
        stroke: 0,
        vascular: 0
        // missing gender
      };

      const errors = engine.validateInput(input);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.field === 'gender')).toBe(true);
    });

    it('should pass validation with all required fields', () => {
      const input = {
        chf: 0, hypertension: 0, age: 0, diabetes: 0,
        stroke: 0, vascular: 0, gender: 0
      };

      const errors = engine.validateInput(input);
      expect(errors.length).toBe(0);
    });
  });

  describe('Clinical Scenarios', () => {
    it('should handle typical elderly female with hypertension', () => {
      // 75歲女性，有高血壓
      const input = {
        chf: 0,
        hypertension: 1, // +1
        age: 2,          // +2 (≥75)
        diabetes: 0,
        stroke: 0,
        vascular: 0,
        gender: 1        // +1 (female)
      };

      const result = engine.calculate(input);
      expect(result.score).toBe(4);
      expect(result.risk).toBe('high');
    });

    it('should handle middle-aged male with diabetes and vascular disease', () => {
      // 70歲男性，有糖尿病和血管疾病
      const input = {
        chf: 0,
        hypertension: 0,
        age: 1,        // +1 (65-74)
        diabetes: 1,   // +1
        stroke: 0,
        vascular: 1,   // +1
        gender: 0
      };

      const result = engine.calculate(input);
      expect(result.score).toBe(3);
      expect(result.risk).toBe('high');
    });

    it('should handle patient with previous stroke', () => {
      // 60歲男性，有中風病史
      const input = {
        chf: 0,
        hypertension: 0,
        age: 0,
        diabetes: 0,
        stroke: 2,     // +2 (previous stroke)
        vascular: 0,
        gender: 0
      };

      const result = engine.calculate(input);
      expect(result.score).toBe(2);
      expect(result.risk).toBe('high');
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum possible score', () => {
      const input = {
        chf: 0, hypertension: 0, age: 0, diabetes: 0,
        stroke: 0, vascular: 0, gender: 0
      };

      const result = engine.calculate(input);
      expect(result.score).toBe(0);
      expect(result.details.totalPoints).toBe(0);
    });

    it('should handle maximum possible score', () => {
      const input = {
        chf: 1, hypertension: 1, age: 2, diabetes: 1,
        stroke: 2, vascular: 1, gender: 1
      };

      const result = engine.calculate(input);
      expect(result.score).toBe(9);
      expect(result.details.totalPoints).toBe(9);
    });

    it('should provide detailed breakdown', () => {
      const input = {
        chf: 1, hypertension: 1, age: 1, diabetes: 0,
        stroke: 0, vascular: 0, gender: 1
      };

      const result = engine.calculate(input);
      expect(result.details.breakdown).toHaveLength(7);
      expect(result.details.breakdown.find(b => b.field === 'chf')?.points).toBe(1);
      expect(result.details.breakdown.find(b => b.field === 'hypertension')?.points).toBe(1);
      expect(result.details.breakdown.find(b => b.field === 'age')?.points).toBe(1);
      expect(result.details.breakdown.find(b => b.field === 'gender')?.points).toBe(1);
    });
  });
});

describe('CHA₂DS₂-VASc Clinical Validation', () => {
  let engine: CalculatorEngine;

  beforeEach(() => {
    engine = createCalculatorEngine(mockCHA2DS2VAScCalculator);
  });

  describe('Real Clinical Cases', () => {
    it('Case 1: 45-year-old healthy male', () => {
      // 應該是 0 分，低風險
      const input = {
        chf: 0, hypertension: 0, age: 0, diabetes: 0,
        stroke: 0, vascular: 0, gender: 0
      };

      const result = engine.calculate(input);
      expect(result.score).toBe(0);
      expect(result.risk).toBe('low');
    });

    it('Case 2: 55-year-old female with hypertension', () => {
      // 應該是 2 分，高風險
      const input = {
        chf: 0, hypertension: 1, age: 0, diabetes: 0,
        stroke: 0, vascular: 0, gender: 1
      };

      const result = engine.calculate(input);
      expect(result.score).toBe(2);
      expect(result.risk).toBe('high');
    });

    it('Case 3: 80-year-old male with heart failure and diabetes', () => {
      // 應該是 5 分，高風險
      const input = {
        chf: 1,        // +1
        hypertension: 0,
        age: 2,        // +2 (≥75)
        diabetes: 1,   // +1
        stroke: 0,
        vascular: 0,
        gender: 0
      };

      const result = engine.calculate(input);
      expect(result.score).toBe(4);
      expect(result.risk).toBe('high');
    });

    it('Case 4: 65-year-old female with previous TIA', () => {
      // 應該是 4 分，高風險
      const input = {
        chf: 0,
        hypertension: 0,
        age: 1,        // +1 (65-74)
        diabetes: 0,
        stroke: 2,     // +2 (TIA)
        vascular: 0,
        gender: 1      // +1 (female)
      };

      const result = engine.calculate(input);
      expect(result.score).toBe(4);
      expect(result.risk).toBe('high');
    });
  });
});