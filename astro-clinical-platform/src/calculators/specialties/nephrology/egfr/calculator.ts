/**
 * eGFR Calculator Implementation
 * 
 * Calculates estimated Glomerular Filtration Rate (eGFR) using the CKD-EPI 2021 equation
 * for kidney function assessment. The 2021 version removes race-based adjustments.
 */

import type { 
  CalculatorInputs, 
  CalculationResult, 
  ValidationResult,
  SupportedLocale 
} from '../../../types/calculator.js';

// ============================================================================
// eGFR Calculation Logic
// ============================================================================

/**
 * Calculate eGFR using CKD-EPI 2021 equation
 * 
 * Formula: eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^(-1.200) × 0.9938^Age × (1.012 if female)
 * 
 * Where:
 * - Scr = serum creatinine (mg/dL)
 * - κ = 0.7 (female) or 0.9 (male)
 * - α = -0.241 (female) or -0.302 (male)
 * - Age = age in years
 */
export function calculate(inputs: CalculatorInputs): CalculationResult {
  const age = Number(inputs.age);
  const gender = inputs.gender as string;
  const creatinine = Number(inputs.creatinine);

  // Gender-specific parameters
  const kappa = gender === 'female' ? 0.7 : 0.9;
  const alpha = gender === 'female' ? -0.241 : -0.302;
  const genderFactor = gender === 'female' ? 1.012 : 1.0;

  // CKD-EPI 2021 calculation
  const scrKappa = creatinine / kappa;
  const minTerm = Math.min(scrKappa, 1) ** alpha;
  const maxTerm = Math.max(scrKappa, 1) ** (-1.200);
  const ageFactor = 0.9938 ** age;

  const egfr = Math.round(142 * minTerm * maxTerm * ageFactor * genderFactor);

  // Determine CKD stage
  const ckdStage = getCKDStage(egfr);
  
  // Determine risk level
  const riskLevel = getRiskLevel(egfr, ckdStage);

  // Generate recommendations
  const recommendations = getRecommendations(egfr, ckdStage);
  
  // Generate additional tests
  const additionalTests = getAdditionalTests(egfr, ckdStage);

  return {
    primaryValue: egfr,
    primaryUnit: 'mL/min/1.73m²',
    secondaryValues: {
      ckdStage,
      riskLevel,
      age,
      gender,
      creatinine,
      kappa,
      alpha,
      genderFactor
    },
    interpretation: {
      'zh-TW': getInterpretation(egfr, ckdStage, 'zh-TW'),
      'en': getInterpretation(egfr, ckdStage, 'en'),
      'ja': getInterpretation(egfr, ckdStage, 'ja')
    },
    recommendations: recommendations.map(rec => ({
      'zh-TW': rec['zh-TW'],
      'en': rec['en'],
      'ja': rec['ja']
    })),
    riskLevel,
    metadata: {
      calculationSteps: [
        {
          description: '性別參數',
          value: `κ = ${kappa}, α = ${alpha}, 性別因子 = ${genderFactor}`,
          formula: gender === 'female' ? 'κ=0.7, α=-0.241, 因子=1.012' : 'κ=0.9, α=-0.302, 因子=1.0'
        },
        {
          description: 'CKD-EPI 2021 計算',
          value: `142 × ${minTerm.toFixed(3)} × ${maxTerm.toFixed(3)} × ${ageFactor.toFixed(3)} × ${genderFactor} = ${egfr}`,
          formula: 'eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^(-1.200) × 0.9938^Age × 性別因子'
        },
        {
          description: 'CKD 分期',
          value: `第 ${ckdStage} 期`,
          formula: `eGFR ${egfr} 對應 CKD 第 ${ckdStage} 期`
        }
      ],
      additionalTests,
      references: [
        'CKD-EPI 2021 Creatinine Equation (Inker et al., NEJM 2021)',
        'KDIGO 2024 Clinical Practice Guideline for CKD'
      ],
      lastCalculated: new Date().toISOString()
    }
  };
}

/**
 * Validate calculator inputs
 */
export function validate(inputs: CalculatorInputs): ValidationResult {
  const errors = [];
  
  // Validate age
  const age = Number(inputs.age);
  if (!inputs.age || isNaN(age)) {
    errors.push({
      field: 'age',
      message: '請輸入有效的年齡',
      type: 'required'
    });
  } else if (age < 18 || age > 120) {
    errors.push({
      field: 'age',
      message: '年齡必須在 18-120 歲之間',
      type: 'range'
    });
  }
  
  // Validate gender
  if (!inputs.gender) {
    errors.push({
      field: 'gender',
      message: '請選擇性別',
      type: 'required'
    });
  } else if (!['male', 'female'].includes(inputs.gender as string)) {
    errors.push({
      field: 'gender',
      message: '性別必須為男性或女性',
      type: 'invalid'
    });
  }
  
  // Validate creatinine
  const creatinine = Number(inputs.creatinine);
  if (!inputs.creatinine || isNaN(creatinine)) {
    errors.push({
      field: 'creatinine',
      message: '請輸入有效的血清肌酸酐值',
      type: 'required'
    });
  } else if (creatinine < 0.1 || creatinine > 20.0) {
    errors.push({
      field: 'creatinine',
      message: '血清肌酸酐必須在 0.1-20.0 mg/dL 之間',
      type: 'range'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Format calculation result for display
 */
export function formatResult(result: CalculationResult, locale: SupportedLocale = 'zh-TW') {
  const egfr = result.primaryValue;
  const ckdStage = result.secondaryValues?.ckdStage || 1;
  
  const stageDescriptions = {
    'zh-TW': {
      1: '第1期 - 腎功能正常或輕度下降',
      2: '第2期 - 腎功能輕度下降',
      3: '第3期 - 腎功能中度下降',
      4: '第4期 - 腎功能重度下降',
      5: '第5期 - 腎衰竭'
    },
    'en': {
      1: 'Stage 1 - Normal or high kidney function',
      2: 'Stage 2 - Mild decrease in kidney function',
      3: 'Stage 3 - Moderate decrease in kidney function',
      4: 'Stage 4 - Severe decrease in kidney function',
      5: 'Stage 5 - Kidney failure'
    },
    'ja': {
      1: 'ステージ1 - 腎機能正常または軽度低下',
      2: 'ステージ2 - 腎機能軽度低下',
      3: 'ステージ3 - 腎機能中等度低下',
      4: 'ステージ4 - 腎機能高度低下',
      5: 'ステージ5 - 腎不全'
    }
  };
  
  return {
    displayValue: `${egfr} ${result.primaryUnit}`,
    stageDescription: stageDescriptions[locale]?.[ckdStage as keyof typeof stageDescriptions[typeof locale]] || `Stage ${ckdStage}`,
    description: result.interpretation?.[locale] || result.interpretation?.['zh-TW'] || '',
    recommendations: result.recommendations?.map(rec => 
      rec[locale] || rec['zh-TW'] || ''
    ) || []
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine CKD stage based on eGFR
 */
function getCKDStage(egfr: number): number {
  if (egfr >= 90) return 1;
  if (egfr >= 60) return 2;
  if (egfr >= 30) return 3;
  if (egfr >= 15) return 4;
  return 5;
}

/**
 * Determine risk level based on eGFR and CKD stage
 */
function getRiskLevel(egfr: number, ckdStage: number): 'low' | 'moderate' | 'high' | 'critical' {
  if (ckdStage <= 2) return 'low';
  if (ckdStage === 3) return 'moderate';
  if (ckdStage === 4) return 'high';
  return 'critical'; // Stage 5
}

/**
 * Get interpretation text based on eGFR and CKD stage
 */
function getInterpretation(egfr: number, ckdStage: number, locale: SupportedLocale): string {
  const interpretations = {
    'zh-TW': {
      1: `腎功能正常 (eGFR: ${egfr})。建議定期監測，特別是有腎病風險因子時。`,
      2: `腎功能輕度下降 (eGFR: ${egfr})。建議評估腎病風險因子並定期追蹤。`,
      3: `腎功能中度下降 (eGFR: ${egfr})。需要積極管理併發症並準備腎臟替代治療。`,
      4: `腎功能重度下降 (eGFR: ${egfr})。需要準備透析或腎移植，並積極治療併發症。`,
      5: `腎衰竭 (eGFR: ${egfr})。需要立即開始腎臟替代治療（透析或移植）。`
    },
    'en': {
      1: `Normal kidney function (eGFR: ${egfr}). Regular monitoring recommended, especially with kidney disease risk factors.`,
      2: `Mild decrease in kidney function (eGFR: ${egfr}). Evaluate kidney disease risk factors and monitor regularly.`,
      3: `Moderate decrease in kidney function (eGFR: ${egfr}). Actively manage complications and prepare for renal replacement therapy.`,
      4: `Severe decrease in kidney function (eGFR: ${egfr}). Prepare for dialysis or transplant and aggressively treat complications.`,
      5: `Kidney failure (eGFR: ${egfr}). Immediate need for renal replacement therapy (dialysis or transplant).`
    },
    'ja': {
      1: `腎機能正常 (eGFR: ${egfr})。腎疾患のリスク因子がある場合は定期的な監視を推奨。`,
      2: `腎機能軽度低下 (eGFR: ${egfr})。腎疾患のリスク因子を評価し、定期的に監視。`,
      3: `腎機能中等度低下 (eGFR: ${egfr})。合併症を積極的に管理し、腎代替療法の準備。`,
      4: `腎機能高度低下 (eGFR: ${egfr})。透析や移植の準備、合併症の積極的治療。`,
      5: `腎不全 (eGFR: ${egfr})。腎代替療法（透析または移植）の即座の必要性。`
    }
  };

  return interpretations[locale][ckdStage as keyof typeof interpretations[typeof locale]];
}

/**
 * Get treatment recommendations based on eGFR and CKD stage
 */
function getRecommendations(egfr: number, ckdStage: number): Array<Record<SupportedLocale, string>> {
  const baseRecommendations = [
    {
      'zh-TW': '控制血壓 (<130/80 mmHg)',
      'en': 'Control blood pressure (<130/80 mmHg)',
      'ja': '血圧管理 (<130/80 mmHg)'
    },
    {
      'zh-TW': '控制血糖 (如有糖尿病)',
      'en': 'Control blood glucose (if diabetic)',
      'ja': '血糖管理 (糖尿病の場合)'
    }
  ];

  if (ckdStage >= 2) {
    baseRecommendations.push({
      'zh-TW': '每年檢查尿蛋白',
      'en': 'Annual urine protein assessment',
      'ja': '年1回の尿蛋白評価'
    });
  }

  if (ckdStage >= 3) {
    baseRecommendations.push(
      {
        'zh-TW': '限制蛋白質攝取 (0.8-1.0 g/kg/day)',
        'en': 'Limit protein intake (0.8-1.0 g/kg/day)',
        'ja': 'タンパク質制限 (0.8-1.0 g/kg/day)'
      },
      {
        'zh-TW': '監測骨質代謝異常',
        'en': 'Monitor bone metabolism disorders',
        'ja': '骨代謝異常の監視'
      },
      {
        'zh-TW': '每3個月檢查腎功能',
        'en': 'Kidney function assessment every 3 months',
        'ja': '3ヶ月毎の腎機能評価'
      }
    );
  }

  if (ckdStage >= 4) {
    baseRecommendations.push(
      {
        'zh-TW': '準備腎臟替代治療',
        'en': 'Prepare for renal replacement therapy',
        'ja': '腎代替療法の準備'
      },
      {
        'zh-TW': '腎臟科專科醫師會診',
        'en': 'Nephrology specialist consultation',
        'ja': '腎臓専門医への紹介'
      },
      {
        'zh-TW': '每月檢查腎功能',
        'en': 'Monthly kidney function assessment',
        'ja': '月1回の腎機能評価'
      }
    );
  }

  if (ckdStage === 5) {
    baseRecommendations.push({
      'zh-TW': '立即開始透析或評估移植適應症',
      'en': 'Immediate dialysis or transplant evaluation',
      'ja': '即座の透析開始または移植評価'
    });
  }

  return baseRecommendations;
}

/**
 * Get additional test recommendations based on eGFR and CKD stage
 */
function getAdditionalTests(egfr: number, ckdStage: number): Array<{
  test: string;
  indication: Record<SupportedLocale, string>;
  urgency: 'routine' | 'urgent' | 'immediate';
}> {
  const tests = [];

  if (ckdStage >= 2) {
    tests.push({
      test: 'urine_protein',
      indication: {
        'zh-TW': '尿蛋白檢查以評估腎損傷程度',
        'en': 'Urine protein to assess kidney damage',
        'ja': '腎損傷評価のための尿蛋白検査'
      },
      urgency: 'routine' as const
    });
  }

  if (ckdStage >= 3) {
    tests.push(
      {
        test: 'phosphorus_calcium',
        indication: {
          'zh-TW': '磷、鈣檢查以監測骨質代謝',
          'en': 'Phosphorus, calcium for bone metabolism',
          'ja': '骨代謝監視のためのリン、カルシウム'
        },
        urgency: 'routine' as const
      },
      {
        test: 'pth',
        indication: {
          'zh-TW': '副甲狀腺素檢查',
          'en': 'Parathyroid hormone assessment',
          'ja': '副甲状腺ホルモン評価'
        },
        urgency: 'routine' as const
      }
    );
  }

  if (ckdStage >= 4) {
    tests.push({
      test: 'hemoglobin',
      indication: {
        'zh-TW': '血紅素檢查以評估貧血',
        'en': 'Hemoglobin to assess anemia',
        'ja': '貧血評価のためのヘモグロビン'
      },
      urgency: 'urgent' as const
    });
  }

  if (ckdStage === 5) {
    tests.push({
      test: 'dialysis_access',
      indication: {
        'zh-TW': '透析通路評估',
        'en': 'Dialysis access evaluation',
        'ja': '透析アクセス評価'
      },
      urgency: 'immediate' as const
    });
  }

  return tests;
}

// Export default calculation function for backward compatibility
export default calculate;