import type { 
  CalculatorInputs, 
  CalculationResult, 
  ValidationResult, 
  ValidationError,
  SupportedLocale 
} from '../../../types/calculator-plugin.js';

export interface LipidManagementInputs extends CalculatorInputs {
  hasASCVD?: boolean;
  hasDM?: boolean;
  hasCKD?: boolean;
  hasFH?: boolean;
  ldl: number;
  tg: number;
  isMaleAge?: boolean;
  hasSmoking?: boolean;
  hasLowHDL?: boolean;
  hasFamilyHistory?: boolean;
  hasHypertension?: boolean;
}

export interface LipidManagementResult extends CalculationResult {
  riskLevel: 'very-high' | 'high' | 'moderate' | 'low';
  ldlTarget: string;
  tgStatus: string;
  ldlStatus: 'above-target' | 'at-target';
  tgLevel: 'normal' | 'borderline' | 'high' | 'very-high';
  medicationAdvice: MedicationAdvice;
  riskFactorCount: number;
  tgValue: number;
}

export interface MedicationAdvice {
  needed: boolean;
  reductionNeeded?: number;
  urgencyNote: string;
  medications: MedicationOption[];
  additionalNotes: string[];
}

export interface MedicationOption {
  category: string;
  reduction: string;
  options: string[];
  note: string;
}

export function validate(inputs: LipidManagementInputs): ValidationResult {
  const errors: ValidationError[] = [];

  if (inputs.ldl === undefined || inputs.ldl === null) {
    errors.push({ 
      field: 'ldl', 
      message: 'LDL cholesterol is required for lipid management calculation.', 
      type: 'required' 
    });
  } else if (inputs.ldl < 50 || inputs.ldl > 500) {
    errors.push({ 
      field: 'ldl', 
      message: 'LDL cholesterol must be between 50 and 500 mg/dL.', 
      type: 'range' 
    });
  }

  if (inputs.tg === undefined || inputs.tg === null) {
    errors.push({ 
      field: 'tg', 
      message: 'Triglycerides are required for lipid management calculation.', 
      type: 'required' 
    });
  } else if (inputs.tg < 50 || inputs.tg > 1000) {
    errors.push({ 
      field: 'tg', 
      message: 'Triglycerides must be between 50 and 1000 mg/dL.', 
      type: 'range' 
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function calculate(inputs: LipidManagementInputs): LipidManagementResult {
  // Determine risk level
  const riskLevel = determineRiskLevel(inputs);
  
  // Get LDL target based on risk level
  const ldlTarget = getLDLTarget(riskLevel);
  
  // Determine LDL status
  const targetValue = parseFloat(ldlTarget.match(/\d+/)?.[0] || '160');
  const ldlStatus: 'above-target' | 'at-target' = inputs.ldl > targetValue ? 'above-target' : 'at-target';
  
  // Determine TG level and status
  const { tgLevel, tgStatus } = getTriglycerideLevelAndStatus(inputs.tg);
  
  // Count risk factors (excluding major conditions)
  const riskFactorCount = countRiskFactors(inputs);
  
  // Calculate medication advice
  const medicationAdvice = calculateMedicationAdvice(inputs.ldl, ldlTarget, riskLevel);
  
  return {
    primaryValue: inputs.ldl,
    primaryUnit: 'mg/dL',
    primaryLabel: {
      'zh-TW': 'LDL-C 膽固醇',
      'en': 'LDL-C Cholesterol',
      'ja': 'LDL-Cコレステロール'
    },
    riskLevel,
    ldlTarget,
    tgStatus,
    ldlStatus,
    tgLevel,
    medicationAdvice,
    riskFactorCount,
    tgValue: inputs.tg,
    interpretation: {
      'zh-TW': `風險等級：${getRiskLevelText(riskLevel, 'zh-TW')}，LDL-C 目標：${ldlTarget}，當前值：${inputs.ldl} mg/dL`,
      'en': `Risk level: ${getRiskLevelText(riskLevel, 'en')}, LDL-C target: ${ldlTarget}, current: ${inputs.ldl} mg/dL`,
      'ja': `リスクレベル：${getRiskLevelText(riskLevel, 'ja')}、LDL-C目標：${ldlTarget}、現在値：${inputs.ldl} mg/dL`
    },
    recommendations: generateRecommendations(riskLevel, ldlStatus, tgLevel, medicationAdvice),
    metadata: {
      calculationDate: new Date().toISOString(),
      version: '1.0.0',
      algorithm: 'Taiwan 2022 Lipid Guidelines'
    }
  };
}

function determineRiskLevel(inputs: LipidManagementInputs): 'very-high' | 'high' | 'moderate' | 'low' {
  // Very high risk conditions
  if (inputs.hasASCVD || inputs.hasDM || inputs.hasCKD || inputs.hasFH) {
    return 'very-high';
  }
  
  // Count other risk factors
  const riskFactors = countRiskFactors(inputs);
  
  if (riskFactors >= 2) {
    return 'high';
  } else if (riskFactors === 1) {
    return 'moderate';
  } else {
    return 'low';
  }
}

function countRiskFactors(inputs: LipidManagementInputs): number {
  const factors = [
    inputs.isMaleAge,
    inputs.hasSmoking,
    inputs.hasLowHDL,
    inputs.hasFamilyHistory,
    inputs.hasHypertension
  ];
  
  return factors.filter(Boolean).length;
}

function getLDLTarget(riskLevel: 'very-high' | 'high' | 'moderate' | 'low'): string {
  switch (riskLevel) {
    case 'very-high': return '< 70 mg/dL';
    case 'high': return '< 100 mg/dL';
    case 'moderate': return '< 130 mg/dL';
    case 'low': return '< 160 mg/dL';
  }
}

function getTriglycerideLevelAndStatus(tg: number): { tgLevel: 'normal' | 'borderline' | 'high' | 'very-high', tgStatus: string } {
  if (tg >= 500) {
    return { tgLevel: 'very-high', tgStatus: '< 500 mg/dL (緊急)' };
  } else if (tg >= 200) {
    return { tgLevel: 'high', tgStatus: '< 200 mg/dL' };
  } else if (tg >= 150) {
    return { tgLevel: 'borderline', tgStatus: '< 150 mg/dL' };
  } else {
    return { tgLevel: 'normal', tgStatus: '正常範圍' };
  }
}

function getRiskLevelText(riskLevel: string, locale: SupportedLocale): string {
  const texts = {
    'very-high': {
      'zh-TW': '極高風險',
      'en': 'Very High Risk',
      'ja': '超高リスク'
    },
    'high': {
      'zh-TW': '中高風險',
      'en': 'High Risk',
      'ja': '高リスク'
    },
    'moderate': {
      'zh-TW': '中風險',
      'en': 'Moderate Risk',
      'ja': '中等度リスク'
    },
    'low': {
      'zh-TW': '低風險',
      'en': 'Low Risk',
      'ja': '低リスク'
    }
  };
  
  return texts[riskLevel]?.[locale] || texts[riskLevel]?.['en'] || riskLevel;
}

function calculateMedicationAdvice(currentLDL: number, targetLDL: string, riskLevel: string): MedicationAdvice {
  const targetValue = parseFloat(targetLDL.match(/\d+/)?.[0] || '160');
  
  if (currentLDL <= targetValue) {
    return {
      needed: false,
      urgencyNote: '✅ LDL-C 已達標，建議維持現有生活方式',
      medications: [],
      additionalNotes: []
    };
  }
  
  const reductionNeeded = ((currentLDL - targetValue) / currentLDL) * 100;
  
  let medications: MedicationOption[] = [];
  
  if (reductionNeeded <= 30) {
    medications.push({
      category: '低強度 Statin',
      reduction: '≤30%',
      options: ['Simvastatin 10 mg/day'],
      note: '適合輕度血脂異常患者'
    });
  } else if (reductionNeeded <= 50) {
    medications.push({
      category: '中強度 Statin',
      reduction: '30-50%',
      options: ['Atorvastatin 10-20 mg/day', 'Rosuvastatin 5-10 mg/day'],
      note: '適合中度血脂異常患者'
    });
    medications.push({
      category: '低強度 Statin（替代選擇）',
      reduction: '≤30%',
      options: ['Simvastatin 10 mg/day'],
      note: '如無法耐受中強度，可考慮低強度 + 生活方式調整'
    });
  } else {
    medications.push({
      category: '高強度 Statin',
      reduction: '≥50%',
      options: ['Atorvastatin 40-80 mg/day', 'Rosuvastatin 20-40 mg/day'],
      note: '適合高風險或嚴重血脂異常患者'
    });
    medications.push({
      category: '中強度 Statin（替代選擇）',
      reduction: '30-50%',
      options: ['Atorvastatin 10-20 mg/day', 'Rosuvastatin 5-10 mg/day'],
      note: '如無法耐受高強度，可考慮中強度 + 其他治療'
    });
  }
  
  let urgencyNote = '';
  switch (riskLevel) {
    case 'very-high':
      urgencyNote = '⚠️ 極高風險患者，建議積極藥物治療';
      break;
    case 'high':
      urgencyNote = '⚡ 中高風險患者，建議考慮藥物治療';
      break;
    case 'moderate':
      urgencyNote = '💡 中風險患者，可考慮藥物治療或加強生活方式調整';
      break;
    default:
      urgencyNote = '🌱 低風險患者，優先考慮生活方式調整';
  }
  
  return {
    needed: true,
    reductionNeeded: Math.round(reductionNeeded * 10) / 10,
    urgencyNote,
    medications,
    additionalNotes: [
      '⚠️ 用藥建議僅供參考，實際處方需由醫師評估',
      '📋 開始用藥前應檢查肝功能',
      '🔄 用藥後 4-6 週應追蹤血脂變化',
      '💪 藥物治療應配合飲食控制和規律運動'
    ]
  };
}

function generateRecommendations(
  riskLevel: string,
  ldlStatus: 'above-target' | 'at-target',
  tgLevel: 'normal' | 'borderline' | 'high' | 'very-high',
  medicationAdvice: MedicationAdvice
): Record<SupportedLocale, string[]> {
  const recommendations: Record<SupportedLocale, string[]> = {
    'zh-TW': [],
    'en': [],
    'ja': []
  };
  
  // Basic lifestyle recommendations
  recommendations['zh-TW'].push('建議採用地中海飲食');
  recommendations['zh-TW'].push('每週至少150分鐘中等強度運動');
  
  recommendations['en'].push('Adopt Mediterranean diet');
  recommendations['en'].push('At least 150 minutes of moderate exercise per week');
  
  recommendations['ja'].push('地中海食を採用');
  recommendations['ja'].push('週に少なくとも150分の中等度運動');
  
  // TG-specific recommendations
  if (tgLevel === 'very-high') {
    recommendations['zh-TW'].push('三酸甘油脂過高，有急性胰臟炎風險，需緊急處理');
    recommendations['en'].push('Very high triglycerides, risk of acute pancreatitis, urgent treatment needed');
    recommendations['ja'].push('トリグリセリド超高値、急性膵炎リスク、緊急治療が必要');
  } else if (tgLevel === 'high') {
    recommendations['zh-TW'].push('三酸甘油脂偏高，建議調整飲食和運動');
    recommendations['en'].push('High triglycerides, recommend dietary adjustment and exercise');
    recommendations['ja'].push('トリグリセリド高値、食事調整と運動を推奨');
  } else if (tgLevel === 'borderline') {
    recommendations['zh-TW'].push('三酸甘油脂輕度升高');
    recommendations['en'].push('Borderline high triglycerides');
    recommendations['ja'].push('トリグリセリド境界域高値');
  }
  
  // Risk-specific recommendations
  if (riskLevel === 'very-high') {
    recommendations['zh-TW'].push('極高風險患者，需積極控制所有危險因子');
    recommendations['en'].push('Very high risk patient, aggressive control of all risk factors needed');
    recommendations['ja'].push('超高リスク患者、すべてのリスク因子の積極的管理が必要');
  }
  
  return recommendations;
}

export function formatResult(result: LipidManagementResult, locale: SupportedLocale = 'zh-TW'): string {
  const riskText = getRiskLevelText(result.riskLevel, locale);
  return `${result.primaryValue} mg/dL (${riskText})`;
}