/**
 * Amoxicillin/Clavulanate 劑量計算邏輯
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

  if (!inputs.doseTarget) {
    errors.doseTarget = '請選擇劑量目標';
  }

  if (!inputs.days) {
    errors.days = '請選擇治療天數';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function calculate(inputs: Record<string, any>): CalculationResult {
  const { weight, doseTarget, days } = inputs;
  
  // 計算每日劑量 (mg/kg/day)
  const dailyDosePerKg = doseTarget === 'high' ? 85 : 45;
  const dailyDose = weight * dailyDosePerKg;
  
  // 假設一天三次服用
  const singleDose = dailyDose / 3;
  
  // 計算總天數需要的藥錠數量
  const treatmentDays = parseInt(days);
  const totalTablets = Math.ceil(singleDose / 125) * 3 * treatmentDays; // 假設每錠 125mg
  
  const warnings: string[] = [];
  
  if (dailyDose > weight * 90) {
    warnings.push('劑量接近上限，請謹慎使用');
  }
  
  if (weight < 3) {
    warnings.push('體重過輕，建議諮詢醫師');
  }

  return {
    primaryValue: dailyDose,
    unit: 'mg/day',
    interpretation: `建議每日劑量：${dailyDose.toFixed(1)} mg，分3次服用，每次 ${singleDose.toFixed(1)} mg`,
    riskLevel: doseTarget === 'high' ? 'high' : 'low',
    warnings,
    recommendations: [
      '請遵循醫師處方，不可自行調整劑量',
      '需完成整個療程，即使症狀改善也不可提前停藥'
    ],
    breakdown: [
      {
        label: '每日總劑量',
        value: dailyDose,
        unit: 'mg/day',
        description: `${dailyDosePerKg} mg/kg/day × ${weight} kg`
      },
      {
        label: '單次劑量',
        value: singleDose,
        unit: 'mg',
        description: '每日三次服用'
      }
    ]
  };
}
export function formatResult(result: CalculationResult): string {
  return `每日劑量：${result.primaryValue.toFixed(1)} mg`;
}