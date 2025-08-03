/**
 * 血脂管理計算機邏輯
 */

import { CalculationResult, ValidationResult, ValidationError, SupportedLocale } from '../../types';
import { LipidManagementInputs, LipidManagementResult, getRiskCategory, getStatinRecommendation, RISK_CATEGORIES } from './types';

export function validate(inputs: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = [];
  
  // 年齡驗證
  if (!inputs.age || inputs.age < 18 || inputs.age > 120) {
    errors.push({
      field: 'age',
      message: '年齡必須在 18-120 歲之間',
      code: 'OUT_OF_RANGE'
    });
  }
  
  // 性別驗證
  if (!inputs.gender || !['male', 'female'].includes(inputs.gender)) {
    errors.push({
      field: 'gender',
      message: '請選擇性別',
      code: 'REQUIRED'
    });
  }
  
  // 總膽固醇驗證
  if (!inputs.totalCholesterol || inputs.totalCholesterol < 100 || inputs.totalCholesterol > 500) {
    errors.push({
      field: 'totalCholesterol',
      message: '總膽固醇必須在 100-500 mg/dL 之間',
      code: 'OUT_OF_RANGE'
    });
  }
  
  // LDL 膽固醇驗證
  if (!inputs.ldlCholesterol || inputs.ldlCholesterol < 50 || inputs.ldlCholesterol > 300) {
    errors.push({
      field: 'ldlCholesterol',
      message: 'LDL 膽固醇必須在 50-300 mg/dL 之間',
      code: 'OUT_OF_RANGE'
    });
  }
  
  // HDL 膽固醇驗證
  if (!inputs.hdlCholesterol || inputs.hdlCholesterol < 20 || inputs.hdlCholesterol > 100) {
    errors.push({
      field: 'hdlCholesterol',
      message: 'HDL 膽固醇必須在 20-100 mg/dL 之間',
      code: 'OUT_OF_RANGE'
    });
  }
  
  // 三酸甘油脂驗證
  if (!inputs.triglycerides || inputs.triglycerides < 50 || inputs.triglycerides > 1000) {
    errors.push({
      field: 'triglycerides',
      message: '三酸甘油脂必須在 50-1000 mg/dL 之間',
      code: 'OUT_OF_RANGE'
    });
  }
  
  // 血壓驗證
  if (!inputs.systolicBP || inputs.systolicBP < 80 || inputs.systolicBP > 250) {
    errors.push({
      field: 'systolicBP',
      message: '收縮壓必須在 80-250 mmHg 之間',
      code: 'OUT_OF_RANGE'
    });
  }
  
  if (!inputs.diastolicBP || inputs.diastolicBP < 40 || inputs.diastolicBP > 150) {
    errors.push({
      field: 'diastolicBP',
      message: '舒張壓必須在 40-150 mmHg 之間',
      code: 'OUT_OF_RANGE'
    });
  }
  
  // 邏輯驗證
  if (inputs.systolicBP && inputs.diastolicBP && inputs.systolicBP <= inputs.diastolicBP) {
    errors.push({
      field: 'systolicBP',
      message: '收縮壓必須大於舒張壓',
      code: 'INVALID_COMBINATION'
    });
  }
  
  if (inputs.totalCholesterol && inputs.ldlCholesterol && inputs.hdlCholesterol) {
    const estimatedTriglycerides = (inputs.totalCholesterol - inputs.ldlCholesterol - inputs.hdlCholesterol) * 5;
    if (inputs.triglycerides && Math.abs(inputs.triglycerides - estimatedTriglycerides) > 100) {
      errors.push({
        field: 'triglycerides',
        message: '血脂數值可能不一致，請檢查輸入值',
        code: 'INCONSISTENT_VALUES'
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function calculate(inputs: Record<string, any>): CalculationResult {
  const typedInputs = inputs as LipidManagementInputs;
  
  try {
    // 計算 10 年心血管疾病風險 (簡化版 Framingham Risk Score)
    let riskScore = 0;
    const calculationSteps: LipidManagementResult['calculationSteps'] = [];
    
    // 年齡風險
    const ageRisk = calculateAgeRisk(typedInputs.age, typedInputs.gender);
    riskScore += ageRisk;
    calculationSteps.push({
      factor: '年齡',
      value: typedInputs.age,
      points: ageRisk,
      description: `${typedInputs.gender === 'male' ? '男性' : '女性'} ${typedInputs.age} 歲的基礎風險`
    });
    
    // 膽固醇風險
    const cholesterolRisk = calculateCholesterolRisk(typedInputs.totalCholesterol, typedInputs.hdlCholesterol);
    riskScore += cholesterolRisk;
    calculationSteps.push({
      factor: '膽固醇比值',
      value: `${typedInputs.totalCholesterol}/${typedInputs.hdlCholesterol}`,
      points: cholesterolRisk,
      description: `總膽固醇/HDL 比值: ${(typedInputs.totalCholesterol / typedInputs.hdlCholesterol).toFixed(1)}`
    });
    
    // 血壓風險
    const bpRisk = calculateBPRisk(typedInputs.systolicBP, typedInputs.hypertension);
    riskScore += bpRisk;
    calculationSteps.push({
      factor: '血壓',
      value: `${typedInputs.systolicBP}/${typedInputs.diastolicBP}`,
      points: bpRisk,
      description: `收縮壓 ${typedInputs.systolicBP} mmHg${typedInputs.hypertension ? ' (已診斷高血壓)' : ''}`
    });
    
    // 其他風險因子
    let additionalRisk = 0;
    if (typedInputs.diabetes) {
      additionalRisk += 3;
      calculationSteps.push({
        factor: '糖尿病',
        value: '是',
        points: 3,
        description: '糖尿病增加心血管風險'
      });
    }
    
    if (typedInputs.smoking) {
      additionalRisk += 2;
      calculationSteps.push({
        factor: '吸菸',
        value: '是',
        points: 2,
        description: '吸菸顯著增加心血管風險'
      });
    }
    
    if (typedInputs.familyHistory) {
      additionalRisk += 1;
      calculationSteps.push({
        factor: '家族史',
        value: '是',
        points: 1,
        description: '早發性心血管疾病家族史'
      });
    }
    
    if (typedInputs.ckd) {
      additionalRisk += 2;
      calculationSteps.push({
        factor: '慢性腎病',
        value: '是',
        points: 2,
        description: '慢性腎病增加心血管風險'
      });
    }
    
    riskScore += additionalRisk;
    
    // 既往心血管疾病直接歸類為極高風險
    if (typedInputs.previousCVD) {
      riskScore = 25; // 強制設為極高風險
      calculationSteps.push({
        factor: '既往心血管疾病',
        value: '是',
        points: 25,
        description: '既往心血管疾病患者屬於極高風險群'
      });
    }
    
    // 轉換為百分比風險
    const cvdRisk = Math.min(Math.max(riskScore * 2, 1), 40); // 限制在 1-40% 之間
    const riskCategory = getRiskCategory(cvdRisk);
    const ldlTarget = RISK_CATEGORIES[riskCategory].ldlTarget;
    
    // 治療建議
    const statinRecommendation = getStatinRecommendation(riskCategory, typedInputs.ldlCholesterol, ldlTarget);
    
    const result: LipidManagementResult = {
      cvdRisk,
      riskCategory,
      ldlTarget,
      treatmentRecommendation: {
        lifestyle: [
          '採用地中海飲食模式',
          '減少飽和脂肪攝取 (<7% 總熱量)',
          '增加膳食纖維攝取 (25-35g/天)',
          '規律有氧運動 (每週150分鐘中等強度)',
          '維持理想體重 (BMI 18.5-24.9)',
          typedInputs.smoking ? '戒菸' : '避免二手菸',
          '限制酒精攝取'
        ],
        medication: {
          recommended: riskCategory !== 'low' || typedInputs.ldlCholesterol > ldlTarget,
          type: statinRecommendation.type,
          intensity: statinRecommendation.intensity,
          reasoning: generateMedicationReasoning(riskCategory, typedInputs.ldlCholesterol, ldlTarget)
        }
      },
      followUp: {
        interval: riskCategory === 'very-high' ? 3 : riskCategory === 'high' ? 6 : 12,
        monitoring: [
          '血脂檢查 (TC, LDL-C, HDL-C, TG)',
          '肝功能檢查 (AST, ALT)',
          '肌酸激酶 (CK)',
          '血壓監測',
          '血糖檢查',
          '腎功能評估'
        ]
      },
      calculationSteps
    };
    
    return {
      success: true,
      result: {
        primaryValue: cvdRisk,
        primaryUnit: '%',
        secondaryValues: [
          {
            label: {
              'zh-TW': 'LDL 目標值',
              'en': 'LDL Target',
              'ja': 'LDL目標値'
            },
            value: ldlTarget,
            unit: 'mg/dL'
          },
          {
            label: {
              'zh-TW': '風險分類',
              'en': 'Risk Category',
              'ja': 'リスク分類'
            },
            value: getRiskCategoryLabel(riskCategory),
            unit: ''
          }
        ],
        riskLevel: riskCategory === 'low' ? 'low' : riskCategory === 'moderate' ? 'moderate' : 'high',
        category: riskCategory,
        interpretation: {
          'zh-TW': generateInterpretation(result, 'zh-TW'),
          'en': generateInterpretation(result, 'en'),
          'ja': generateInterpretation(result, 'ja')
        },
        recommendations: [
          {
            'zh-TW': result.treatmentRecommendation.lifestyle.join('、'),
            'en': result.treatmentRecommendation.lifestyle.join(', '),
            'ja': result.treatmentRecommendation.lifestyle.join('、')
          }
        ],
        breakdown: calculationSteps.map((step, index) => ({
          step: index + 1,
          description: {
            'zh-TW': step.description,
            'en': step.description,
            'ja': step.description
          },
          formula: `${step.factor}: ${step.points} 分`,
          value: step.points || 0
        })),
        warnings: generateWarnings(typedInputs),
        nextSteps: [
          {
            'zh-TW': `${result.followUp.interval} 個月後追蹤血脂`,
            'en': `Follow-up lipid profile in ${result.followUp.interval} months`,
            'ja': `${result.followUp.interval}ヶ月後に脂質プロファイル追跡`
          }
        ]
      },
      metadata: {
        calculationTime: Date.now(),
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'CALCULATION_ERROR',
        message: error instanceof Error ? error.message : '計算過程中發生錯誤'
      }
    };
  }
}

// 輔助函數
function calculateAgeRisk(age: number, gender: string): number {
  if (gender === 'male') {
    if (age < 35) return 0;
    if (age < 45) return 2;
    if (age < 55) return 4;
    if (age < 65) return 6;
    return 8;
  } else {
    if (age < 45) return 0;
    if (age < 55) return 2;
    if (age < 65) return 4;
    if (age < 75) return 6;
    return 8;
  }
}

function calculateCholesterolRisk(totalCholesterol: number, hdlCholesterol: number): number {
  const ratio = totalCholesterol / hdlCholesterol;
  if (ratio < 4) return 0;
  if (ratio < 5) return 1;
  if (ratio < 6) return 2;
  if (ratio < 7) return 3;
  return 4;
}

function calculateBPRisk(systolicBP: number, hypertension: boolean): number {
  if (hypertension) return 2;
  if (systolicBP < 120) return 0;
  if (systolicBP < 140) return 1;
  if (systolicBP < 160) return 2;
  return 3;
}

function generateMedicationReasoning(riskCategory: string, ldlCholesterol: number, ldlTarget: number): string {
  if (riskCategory === 'very-high') {
    return '極高風險患者建議積極藥物治療';
  } else if (riskCategory === 'high') {
    return '高風險患者建議藥物治療';
  } else if (ldlCholesterol > ldlTarget) {
    return `LDL 膽固醇 ${ldlCholesterol} mg/dL 超過目標值 ${ldlTarget} mg/dL`;
  }
  return '建議生活型態調整，必要時考慮藥物治療';
}

function getRiskCategoryLabel(category: string): string {
  const labels = {
    'low': '低風險',
    'moderate': '中等風險',
    'high': '高風險',
    'very-high': '極高風險'
  };
  return labels[category as keyof typeof labels] || category;
}

function generateInterpretation(result: LipidManagementResult, locale: SupportedLocale): string {
  const riskPercent = result.cvdRisk.toFixed(1);
  const category = getRiskCategoryLabel(result.riskCategory);
  
  if (locale === 'zh-TW') {
    return `根據評估，您的 10 年心血管疾病風險為 ${riskPercent}%，屬於${category}。建議 LDL 膽固醇目標值為 ${result.ldlTarget} mg/dL 以下。`;
  } else if (locale === 'en') {
    return `Based on assessment, your 10-year cardiovascular disease risk is ${riskPercent}%, classified as ${category}. Recommended LDL cholesterol target is below ${result.ldlTarget} mg/dL.`;
  } else {
    return `評価に基づくと、あなたの10年心血管疾患リスクは${riskPercent}%で、${category}に分類されます。推奨LDLコレステロール目標値は${result.ldlTarget} mg/dL未満です。`;
  }
}

function generateWarnings(inputs: LipidManagementInputs): Array<{ 'zh-TW': string; 'en': string; 'ja': string }> {
  const warnings = [];
  
  if (inputs.ldlCholesterol > 190) {
    warnings.push({
      'zh-TW': 'LDL 膽固醇過高，可能需要考慮家族性高膽固醇血症',
      'en': 'Very high LDL cholesterol, consider familial hypercholesterolemia',
      'ja': 'LDLコレステロールが非常に高く、家族性高コレステロール血症を考慮'
    });
  }
  
  if (inputs.triglycerides > 500) {
    warnings.push({
      'zh-TW': '三酸甘油脂過高，有急性胰臟炎風險',
      'en': 'Very high triglycerides, risk of acute pancreatitis',
      'ja': 'トリグリセリドが非常に高く、急性膵炎のリスク'
    });
  }
  
  if (inputs.hdlCholesterol < 40) {
    warnings.push({
      'zh-TW': 'HDL 膽固醇過低，增加心血管風險',
      'en': 'Low HDL cholesterol increases cardiovascular risk',
      'ja': 'HDLコレステロールが低く、心血管リスクが増加'
    });
  }
  
  return warnings;
}