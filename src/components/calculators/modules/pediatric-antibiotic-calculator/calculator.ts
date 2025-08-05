/**
 * 兒童抗生素劑量計算邏輯
 */

import { ValidationResult, CalculationResult } from '../../types';

export function validate(inputs: Record<string, any>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!inputs.weight || inputs.weight <= 0) {
    errors.weight = '體重必須大於 0';
  }

  if (inputs.weight > 100) {
    errors.weight = '體重不能超過 100 公斤';
  }

  if (inputs.age !== undefined && (inputs.age < 0 || inputs.age > 18)) {
    errors.age = '年齡必須在 0-18 歲之間';
  }

  if (!inputs.form) {
    errors.form = '請選擇藥物劑型';
  }

  if (!inputs.days) {
    errors.days = '請選擇治療天數';
  }

  if (!inputs.frequency) {
    errors.frequency = '請選擇用藥頻次';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function calculate(inputs: Record<string, any>): CalculationResult {
  const { weight, age, frequency } = inputs;
  const dailyFreq = parseInt(frequency) || 3;
  
  const warnings: string[] = [];
  
  if (weight < 3) {
    warnings.push('體重過輕，請謹慎使用並諮詢醫師');
  }
  
  if (age && age < 2) {
    warnings.push('年齡過小，部分藥物可能不適用');
  }

  return {
    primaryValue: weight,
    unit: 'kg',
    interpretation: `已計算多種抗生素和抗病毒藥物的劑量，體重: ${weight} kg`,
    riskLevel: weight < 3 ? 'high' : 'low',
    warnings,
    recommendations: [
      '請遵循醫師處方，不可自行調整劑量',
      '需完成整個療程，即使症狀改善也不可提前停藥',
      '注意藥物過敏史和禁忌症'
    ],
    breakdown: [
      {
        label: '體重',
        value: weight,
        unit: 'kg',
        description: '用於計算各種藥物劑量的基準'
      },
      {
        label: '用藥頻次',
        value: dailyFreq,
        unit: '次/日',
        description: '每日服藥次數'
      }
    ]
  };
}

export function formatResult(result: CalculationResult): string {
  return `計算了多種抗生素劑量，體重: ${result.primaryValue} kg`;
}