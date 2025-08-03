/**
 * eGFR 計算邏輯
 * 使用 CKD-EPI 2021 公式（無種族係數）
 */

import { EGFRInputs, EGFRResult, getCKDStage, UNIT_CONVERSIONS } from './types';
import { CalculationResult, ValidationError } from '../../types';

/**
 * 驗證輸入參數
 */
export function validate(inputs: EGFRInputs): ValidationError[] {
  const errors: ValidationError[] = [];

  // 驗證肌酸酐
  if (!inputs.creatinine || inputs.creatinine <= 0) {
    errors.push({
      field: 'creatinine',
      message: {
        'zh-TW': '請輸入有效的肌酸酐值',
        'en': 'Please enter a valid creatinine value',
        'ja': '有効なクレアチニン値を入力してください'
      }
    });
  } else if (inputs.creatinine < 0.1 || inputs.creatinine > 20.0) {
    errors.push({
      field: 'creatinine',
      message: {
        'zh-TW': '肌酸酐值必須在 0.1-20.0 mg/dL 之間',
        'en': 'Creatinine must be between 0.1-20.0 mg/dL',
        'ja': 'クレアチニン値は0.1-20.0 mg/dLの間である必要があります'
      }
    });
  }

  // 驗證年齡
  if (!inputs.age || inputs.age <= 0) {
    errors.push({
      field: 'age',
      message: {
        'zh-TW': '請輸入有效的年齡',
        'en': 'Please enter a valid age',
        'ja': '有効な年齢を入力してください'
      }
    });
  } else if (inputs.age < 18 || inputs.age > 120) {
    errors.push({
      field: 'age',
      message: {
        'zh-TW': '年齡必須在 18-120 歲之間',
        'en': 'Age must be between 18-120 years',
        'ja': '年齢は18-120歳の間である必要があります'
      }
    });
  }

  // 驗證性別
  if (!inputs.gender || !['male', 'female'].includes(inputs.gender)) {
    errors.push({
      field: 'gender',
      message: {
        'zh-TW': '請選擇性別',
        'en': 'Please select gender',
        'ja': '性別を選択してください'
      }
    });
  }

  return errors;
}

/**
 * 計算 eGFR 使用 CKD-EPI 2021 公式
 * 公式：eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^(-1.200) × 0.9938^age × (1.012 if female)
 * 其中：
 * - Scr = 血清肌酸酐 (mg/dL)
 * - κ = 0.7 (女性) 或 0.9 (男性)
 * - α = -0.241 (女性) 或 -0.302 (男性)
 */
export function calculate(inputs: EGFRInputs): CalculationResult<EGFRResult> {
  // 驗證輸入
  const validationErrors = validate(inputs);
  if (validationErrors.length > 0) {
    return {
      success: false,
      errors: validationErrors
    };
  }

  try {
    const { creatinine, age, gender } = inputs;

    // CKD-EPI 2021 公式參數
    const kappa = gender === 'female' ? 0.7 : 0.9;
    const alpha = gender === 'female' ? -0.241 : -0.302;
    const genderMultiplier = gender === 'female' ? 1.012 : 1.0;

    // 計算步驟
    const scrOverKappa = creatinine / kappa;
    const minTerm = Math.min(scrOverKappa, 1);
    const maxTerm = Math.max(scrOverKappa, 1);
    
    // CKD-EPI 2021 公式計算
    const egfr = 142 * 
                 Math.pow(minTerm, alpha) * 
                 Math.pow(maxTerm, -1.200) * 
                 Math.pow(0.9938, age) * 
                 genderMultiplier;

    // 四捨五入到整數
    const roundedEGFR = Math.round(egfr);

    // 獲取 CKD 分期
    const stage = getCKDStage(roundedEGFR);

    // 生成解釋和建議
    const interpretation = generateInterpretation(roundedEGFR, stage, gender);
    const recommendations = generateRecommendations(roundedEGFR, stage);
    const nextSteps = generateNextSteps(roundedEGFR, stage);

    // 計算步驟說明
    const calculationSteps = [
      {
        description: 'CKD-EPI 2021 公式參數',
        value: `κ = ${kappa}, α = ${alpha}, 性別係數 = ${genderMultiplier}`,
        formula: gender === 'female' ? 'κ = 0.7, α = -0.241, 女性係數 = 1.012' : 'κ = 0.9, α = -0.302, 男性係數 = 1.0'
      },
      {
        description: '肌酸酐比值計算',
        value: `Scr/κ = ${creatinine}/${kappa} = ${scrOverKappa.toFixed(3)}`,
        formula: 'Scr/κ'
      },
      {
        description: 'Min 和 Max 項計算',
        value: `min(${scrOverKappa.toFixed(3)}, 1) = ${minTerm.toFixed(3)}, max(${scrOverKappa.toFixed(3)}, 1) = ${maxTerm.toFixed(3)}`,
        formula: 'min(Scr/κ, 1) 和 max(Scr/κ, 1)'
      },
      {
        description: 'eGFR 最終計算',
        value: `${roundedEGFR} mL/min/1.73m²`,
        formula: '142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^(-1.200) × 0.9938^age × 性別係數'
      }
    ];

    const result: EGFRResult = {
      egfr: roundedEGFR,
      stage,
      riskLevel: stage.riskLevel,
      interpretation,
      recommendations,
      calculationSteps,
      nextSteps
    };

    return {
      success: true,
      result
    };

  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'general',
        message: {
          'zh-TW': '計算過程中發生錯誤，請檢查輸入值',
          'en': 'An error occurred during calculation, please check input values',
          'ja': '計算中にエラーが発生しました。入力値を確認してください'
        }
      }]
    };
  }
}

/**
 * 生成結果解釋
 */
function generateInterpretation(egfr: number, stage: any, gender: string): string {
  const genderText = gender === 'female' ? '女性' : '男性';
  
  if (egfr >= 90) {
    return `您的 eGFR 為 ${egfr} mL/min/1.73m²，屬於 ${stage.name['zh-TW']} 範圍。腎功能正常，但如有其他腎臟疾病證據，仍需定期監測。`;
  } else if (egfr >= 60) {
    return `您的 eGFR 為 ${egfr} mL/min/1.73m²，屬於 ${stage.name['zh-TW']} 範圍。腎功能輕度下降，建議定期追蹤並控制相關危險因子。`;
  } else if (egfr >= 45) {
    return `您的 eGFR 為 ${egfr} mL/min/1.73m²，屬於 ${stage.name['zh-TW']} 範圍。腎功能輕度至中度下降，建議轉介腎臟科評估。`;
  } else if (egfr >= 30) {
    return `您的 eGFR 為 ${egfr} mL/min/1.73m²，屬於 ${stage.name['zh-TW']} 範圍。腎功能中度至重度下降，需要腎臟科專科治療。`;
  } else if (egfr >= 15) {
    return `您的 eGFR 為 ${egfr} mL/min/1.73m²，屬於 ${stage.name['zh-TW']} 範圍。腎功能重度下降，需要準備腎替代治療。`;
  } else {
    return `您的 eGFR 為 ${egfr} mL/min/1.73m²，屬於 ${stage.name['zh-TW']} 範圍。已達腎衰竭階段，需要立即進行透析或腎移植評估。`;
  }
}

/**
 * 生成建議
 */
function generateRecommendations(egfr: number, stage: any): string[] {
  const recommendations: string[] = [];

  if (egfr >= 90) {
    recommendations.push('維持健康生活方式，包括均衡飲食和規律運動');
    recommendations.push('控制血壓、血糖和血脂');
    recommendations.push('避免腎毒性藥物');
    recommendations.push('每年檢查一次腎功能');
  } else if (egfr >= 60) {
    recommendations.push('積極控制血壓（目標 < 130/80 mmHg）');
    recommendations.push('嚴格控制血糖（如有糖尿病）');
    recommendations.push('限制蛋白質攝取（0.8-1.0 g/kg/day）');
    recommendations.push('每 6-12 個月檢查腎功能');
  } else if (egfr >= 30) {
    recommendations.push('轉介腎臟科專科醫師');
    recommendations.push('監測並治療 CKD 併發症（貧血、骨病變）');
    recommendations.push('調整藥物劑量');
    recommendations.push('限制磷和鉀的攝取');
    recommendations.push('每 3-6 個月檢查腎功能');
  } else if (egfr >= 15) {
    recommendations.push('腎臟科專科治療');
    recommendations.push('準備腎替代治療（透析或移植）');
    recommendations.push('營養師諮詢');
    recommendations.push('心血管風險評估');
    recommendations.push('每 1-3 個月檢查腎功能');
  } else {
    recommendations.push('立即腎臟科急診評估');
    recommendations.push('開始透析治療');
    recommendations.push('腎移植評估');
    recommendations.push('積極治療併發症');
    recommendations.push('每月監測腎功能');
  }

  return recommendations;
}

/**
 * 生成後續步驟
 */
function generateNextSteps(egfr: number, stage: any): string[] {
  const nextSteps: string[] = [];

  if (egfr >= 60) {
    nextSteps.push('定期追蹤腎功能');
    nextSteps.push('控制危險因子');
    nextSteps.push('健康生活方式諮詢');
  } else if (egfr >= 30) {
    nextSteps.push('轉介腎臟科');
    nextSteps.push('完整 CKD 評估');
    nextSteps.push('併發症篩檢');
    nextSteps.push('藥物劑量調整');
  } else {
    nextSteps.push('緊急腎臟科會診');
    nextSteps.push('腎替代治療準備');
    nextSteps.push('多專科團隊照護');
    nextSteps.push('家屬衛教');
  }

  return nextSteps;
}

/**
 * 格式化結果
 */
export function formatResult(result: EGFRResult, locale: string = 'zh-TW'): string {
  const stage = result.stage;
  return `eGFR: ${result.egfr} mL/min/1.73m² (${stage.name[locale] || stage.name['zh-TW']})`;
}