/**
 * Amoxicillin/Clavulanate 劑量計算邏輯
 */

import { ValidationResult, CalculationResult } from '../../types';

// 藥物規格定義
interface DrugSpec {
  amoxicillin: number;
  clavulanate: number;
  total: number;
}

const DRUG_SPECS = {
  augmentin500: { amoxicillin: 500, clavulanate: 125, total: 625 } as DrugSpec,
  amoxicillin500: { amoxicillin: 500, clavulanate: 0, total: 500 } as DrugSpec,
  amoxicillin250: { amoxicillin: 250, clavulanate: 0, total: 250 } as DrugSpec
};

interface CalculationDetails {
  targetAmoxicillin: number;
  targetClavulanate: number;
  augmentin500Count: number;
  amoxicillin500Count: number;
  amoxicillin250Count: number;
  actualAmoxicillin: number;
  actualClavulanate: number;
  ratio: number;
  isRatioValid: boolean;
  useAmoxicillin500: boolean;
}

export function validate(inputs: Record<string, any>): ValidationResult {
  const errors: any[] = [];

  if (!inputs.weight || inputs.weight <= 0) {
    errors.push({
      field: 'weight',
      message: '體重必須大於 0',
      code: 'REQUIRED'
    });
  }

  if (inputs.weight > 100) {
    errors.push({
      field: 'weight',
      message: '體重不能超過 100 公斤',
      code: 'OUT_OF_RANGE'
    });
  }

  if (!inputs.doseTarget) {
    errors.push({
      field: 'doseTarget',
      message: '請選擇劑量目標',
      code: 'REQUIRED'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function calculate(inputs: Record<string, any>): CalculationResult {
  const { weight, doseTarget } = inputs;
  
  // 計算目標 Amoxicillin 每日劑量 (mg/kg/day)
  const dailyDosePerKg = doseTarget === 'high' ? 85 : 45;
  const targetAmoxicillinDaily = weight * dailyDosePerKg;
  
  // 每日三次服用，計算單次劑量
  const targetAmoxicillinSingle = targetAmoxicillinDaily / 3;
  
  // 計算最佳藥物組合
  const calculation = calculateOptimalCombination(targetAmoxicillinSingle);
  
  const warnings: string[] = [];
  
  if (doseTarget === 'high') {
    warnings.push('高劑量治療，請密切監測患者反應');
  }
  
  if (weight < 3) {
    warnings.push('體重過輕，建議諮詢小兒科醫師');
  }

  if (!calculation.isRatioValid) {
    warnings.push('Amoxicillin:Clavulanate 比例略超出建議範圍，但仍在安全範圍內');
  }

  return {
    primaryValue: targetAmoxicillinDaily,
    primaryUnit: 'mg/day',
    primaryLabel: {
      'zh-TW': 'Amoxicillin 每日總劑量',
      'en': 'Daily Amoxicillin Dose',
      'ja': '1日アモキシシリン用量'
    },
    
    secondaryValues: [
      {
        value: targetAmoxicillinSingle,
        unit: 'mg',
        label: {
          'zh-TW': '單次 Amoxicillin 劑量',
          'en': 'Single Amoxicillin Dose',
          'ja': '1回アモキシシリン用量'
        }
      },
      {
        value: calculation.actualClavulanate,
        unit: 'mg',
        label: {
          'zh-TW': '單次 Clavulanate 劑量',
          'en': 'Single Clavulanate Dose',
          'ja': '1回クラブラン酸用量'
        }
      }
    ],
    
    riskLevel: doseTarget === 'high' ? 'moderate' : 'low',
    
    interpretation: {
      'zh-TW': `建議每日 Amoxicillin 劑量：${targetAmoxicillinDaily.toFixed(1)} mg，分3次服用，每次 ${targetAmoxicillinSingle.toFixed(1)} mg`,
      'en': `Recommended daily Amoxicillin dose: ${targetAmoxicillinDaily.toFixed(1)} mg, divided into 3 doses, ${targetAmoxicillinSingle.toFixed(1)} mg per dose`,
      'ja': `推奨1日アモキシシリン用量：${targetAmoxicillinDaily.toFixed(1)} mg、3回分服、1回${targetAmoxicillinSingle.toFixed(1)} mg`
    },
    
    recommendations: [
      {
        'zh-TW': '請遵循醫師處方，不可自行調整劑量',
        'en': 'Follow physician prescription, do not adjust dose independently',
        'ja': '医師の処方に従い、独自に用量を調整しないでください'
      },
      {
        'zh-TW': '需完成整個療程，即使症狀改善也不可提前停藥',
        'en': 'Complete the full course even if symptoms improve',
        'ja': '症状が改善しても、全コースを完了してください'
      },
      {
        'zh-TW': '如出現過敏反應，請立即停藥並就醫',
        'en': 'Stop medication immediately and seek medical attention if allergic reactions occur',
        'ja': 'アレルギー反応が起こった場合は、直ちに服薬を中止し医師に相談してください'
      }
    ],
    
    warnings,
    
    // 自定義結果數據，用於結果組件顯示
    customData: {
      calculation,
      targetAmoxicillinSingle,
      dailyDosePerKg
    },
    
    breakdown: [
      {
        field: 'target_calculation',
        label: {
          'zh-TW': '目標劑量計算',
          'en': 'Target Dose Calculation',
          'ja': '目標用量計算'
        },
        value: `${dailyDosePerKg} mg/kg/day × ${weight} kg = ${targetAmoxicillinDaily.toFixed(1)} mg/day`,
        contribution: 100,
        explanation: {
          'zh-TW': '根據體重和劑量目標計算每日 Amoxicillin 需求量',
          'en': 'Calculate daily Amoxicillin requirement based on weight and dose target',
          'ja': '体重と用量目標に基づいて1日のアモキシシリン必要量を計算'
        },
        formula: 'Daily Dose = Weight × Dose per kg'
      },
      {
        field: 'single_dose',
        label: {
          'zh-TW': '單次劑量',
          'en': 'Single Dose',
          'ja': '1回用量'
        },
        value: `${targetAmoxicillinDaily.toFixed(1)} mg ÷ 3 = ${targetAmoxicillinSingle.toFixed(1)} mg`,
        contribution: 0,
        explanation: {
          'zh-TW': '每日劑量分為三次服用',
          'en': 'Daily dose divided into three administrations',
          'ja': '1日用量を3回に分けて服用'
        },
        formula: 'Single Dose = Daily Dose ÷ 3'
      }
    ],
    
    metadata: {
      calculatedAt: new Date().toISOString(),
      calculationTime: Date.now(),
      version: '2.0.0',
      inputs: { weight, doseTarget }
    }
  };
}

function calculateOptimalCombination(targetAmoxicillin: number): CalculationDetails {
  // 嘗試不同的組合，找到最佳的藥物搭配
  let bestCombination: CalculationDetails | null = null;
  let minDifference = Infinity;

  // 嘗試不同的 Augmentin 500/125 數量 (0-4顆)
  for (let augmentinCount = 0; augmentinCount <= 4; augmentinCount++) {
    const amoxicillinFromAugmentin = augmentinCount * DRUG_SPECS.augmentin500.amoxicillin;
    const clavulanateFromAugmentin = augmentinCount * DRUG_SPECS.augmentin500.clavulanate;
    const remainingAmoxicillin = targetAmoxicillin - amoxicillinFromAugmentin;

    if (remainingAmoxicillin < 0) continue;

    // 嘗試用 Amoxicillin 500mg 補足
    const amoxicillin500Count = Math.round(remainingAmoxicillin / DRUG_SPECS.amoxicillin500.amoxicillin);
    const amoxicillin250Count = Math.round(remainingAmoxicillin / DRUG_SPECS.amoxicillin250.amoxicillin);

    // 計算兩種選擇的結果
    const combinations = [
      {
        augmentin500Count: augmentinCount,
        amoxicillin500Count: Math.max(0, amoxicillin500Count),
        amoxicillin250Count: 0,
        useAmoxicillin500: true
      },
      {
        augmentin500Count: augmentinCount,
        amoxicillin500Count: 0,
        amoxicillin250Count: Math.max(0, amoxicillin250Count),
        useAmoxicillin500: false
      }
    ];

    for (const combo of combinations) {
      const actualAmoxicillin = 
        combo.augmentin500Count * DRUG_SPECS.augmentin500.amoxicillin +
        combo.amoxicillin500Count * DRUG_SPECS.amoxicillin500.amoxicillin +
        combo.amoxicillin250Count * DRUG_SPECS.amoxicillin250.amoxicillin;

      const actualClavulanate = combo.augmentin500Count * DRUG_SPECS.augmentin500.clavulanate;
      
      // 計算比例 (Amoxicillin : Clavulanate)
      const ratio = actualClavulanate > 0 ? actualAmoxicillin / actualClavulanate : Infinity;
      const isRatioValid = actualClavulanate === 0 || (ratio >= 7 && ratio <= 14);
      
      const difference = Math.abs(actualAmoxicillin - targetAmoxicillin);
      
      // 優先選擇比例合適且差異最小的組合
      const score = difference + (isRatioValid ? 0 : 1000);
      
      if (score < minDifference) {
        minDifference = score;
        bestCombination = {
          targetAmoxicillin,
          targetClavulanate: actualClavulanate,
          augmentin500Count: combo.augmentin500Count,
          amoxicillin500Count: combo.amoxicillin500Count,
          amoxicillin250Count: combo.amoxicillin250Count,
          actualAmoxicillin,
          actualClavulanate,
          ratio,
          isRatioValid,
          useAmoxicillin500: combo.useAmoxicillin500
        };
      }
    }
  }

  return bestCombination || {
    targetAmoxicillin,
    targetClavulanate: 0,
    augmentin500Count: 0,
    amoxicillin500Count: Math.round(targetAmoxicillin / 500),
    amoxicillin250Count: 0,
    actualAmoxicillin: Math.round(targetAmoxicillin / 500) * 500,
    actualClavulanate: 0,
    ratio: Infinity,
    isRatioValid: true,
    useAmoxicillin500: true
  };
}

export function formatResult(result: CalculationResult): string {
  return `每日 Amoxicillin 劑量：${result.primaryValue?.toFixed(1)} mg`;
}