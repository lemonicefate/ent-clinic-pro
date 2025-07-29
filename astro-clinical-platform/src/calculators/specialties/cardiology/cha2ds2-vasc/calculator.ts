import type { 
  CalculatorInputs, 
  CalculationResult, 
  ValidationResult, 
  ValidationError,
  SupportedLocale 
} from '../../../types/calculator-plugin.js';

export interface CHA2DS2VAScInputs extends CalculatorInputs {
  age: number;
  gender: 'male' | 'female';
  congestiveHeartFailure?: boolean;
  hypertension?: boolean;
  diabetes?: boolean;
  strokeHistory?: boolean;
  vascularDisease?: boolean;
}

export interface CHA2DS2VAScResult extends CalculationResult {
  score: number;
  riskCategory: 'low' | 'low-moderate' | 'high';
  annualStrokeRisk: number;
  anticoagulationRecommended: boolean;
}

export function validate(inputs: CHA2DS2VAScInputs): ValidationResult {
  const errors: ValidationError[] = [];

  if (inputs.age === undefined || inputs.age === null) {
    errors.push({ 
      field: 'age', 
      message: 'Age is required for CHA2DS2-VASc calculation.', 
      type: 'required' 
    });
  } else if (inputs.age < 18 || inputs.age > 120) {
    errors.push({ 
      field: 'age', 
      message: 'Age must be between 18 and 120 years.', 
      type: 'range' 
    });
  }

  if (!inputs.gender) {
    errors.push({ 
      field: 'gender', 
      message: 'Gender is required for CHA2DS2-VASc calculation.', 
      type: 'required' 
    });
  } else if (!['male', 'female'].includes(inputs.gender)) {
    errors.push({ 
      field: 'gender', 
      message: 'Gender must be either male or female.', 
      type: 'invalid' 
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function calculate(inputs: CHA2DS2VAScInputs): CHA2DS2VAScResult {
  let score = 0;

  // Age scoring
  if (inputs.age >= 65 && inputs.age < 75) {
    score += 1;
  } else if (inputs.age >= 75) {
    score += 2;
  }

  // Gender scoring (female gets 1 point)
  if (inputs.gender === 'female') {
    score += 1;
  }

  // Risk factors (each worth 1 point)
  if (inputs.congestiveHeartFailure) score += 1;
  if (inputs.hypertension) score += 1;
  if (inputs.diabetes) score += 1;
  if (inputs.vascularDisease) score += 1;

  // Stroke/TIA history (worth 2 points)
  if (inputs.strokeHistory) score += 2;

  // Determine risk category
  let riskCategory: 'low' | 'low-moderate' | 'high';
  let anticoagulationRecommended: boolean;
  let annualStrokeRisk: number;

  if (inputs.gender === 'male' && score === 0) {
    riskCategory = 'low';
    anticoagulationRecommended = false;
    annualStrokeRisk = 0;
  } else if ((inputs.gender === 'male' && score === 1) || (inputs.gender === 'female' && score === 1)) {
    riskCategory = 'low-moderate';
    anticoagulationRecommended = false; // Consider based on individual assessment
    annualStrokeRisk = 1.3;
  } else {
    riskCategory = 'high';
    anticoagulationRecommended = true;
    annualStrokeRisk = score <= 2 ? 2.2 : score <= 3 ? 3.2 : score <= 4 ? 4.0 : score <= 5 ? 6.7 : score <= 6 ? 9.8 : 9.6;
  }

  return {
    primaryValue: score,
    primaryUnit: 'points',
    primaryLabel: {
      'zh-TW': 'CHA2DS2-VASc 評分',
      'en': 'CHA2DS2-VASc Score',
      'ja': 'CHA2DS2-VAScスコア'
    },
    score,
    riskCategory,
    annualStrokeRisk,
    anticoagulationRecommended,
    interpretation: {
      'zh-TW': `CHA2DS2-VASc 評分為 ${score} 分，屬於${riskCategory === 'low' ? '低' : riskCategory === 'low-moderate' ? '低中等' : '高'}風險。年中風風險約 ${annualStrokeRisk}%。`,
      'en': `CHA2DS2-VASc score is ${score} points, indicating ${riskCategory} risk. Annual stroke risk approximately ${annualStrokeRisk}%.`,
      'ja': `CHA2DS2-VAScスコアは${score}ポイントで、${riskCategory === 'low' ? '低' : riskCategory === 'low-moderate' ? '低中等度' : '高'}リスクを示しています。年間脳卒中リスクは約${annualStrokeRisk}%です。`
    },
    recommendations: generateRecommendations(riskCategory, anticoagulationRecommended, inputs.gender),
    metadata: {
      calculationDate: new Date().toISOString(),
      version: '1.0.0',
      algorithm: 'CHA2DS2-VASc Score (ESC 2020)'
    }
  };
}

export function formatResult(result: CHA2DS2VAScResult, locale: SupportedLocale = 'en'): string {
  const riskText = locale === 'zh-TW' ? 
    (result.riskCategory === 'low' ? '低風險' : result.riskCategory === 'low-moderate' ? '低中等風險' : '高風險') :
    locale === 'ja' ?
    (result.riskCategory === 'low' ? '低リスク' : result.riskCategory === 'low-moderate' ? '低中等度リスク' : '高リスク') :
    `${result.riskCategory} risk`;

  return `${result.score} points (${riskText})`;
}

function generateRecommendations(
  riskCategory: 'low' | 'low-moderate' | 'high',
  anticoagulationRecommended: boolean,
  gender: 'male' | 'female'
): Record<SupportedLocale, string[]> {
  const recommendations: Record<SupportedLocale, string[]> = {
    'zh-TW': [],
    'en': [],
    'ja': []
  };

  switch (riskCategory) {
    case 'low':
      recommendations['zh-TW'] = [
        '不建議抗凝治療',
        '定期追蹤心房顫動狀況',
        '控制其他心血管危險因子'
      ];
      recommendations['en'] = [
        'Anticoagulation not recommended',
        'Regular follow-up for atrial fibrillation',
        'Control other cardiovascular risk factors'
      ];
      recommendations['ja'] = [
        '抗凝固療法は推奨されない',
        '心房細動の定期的なフォローアップ',
        '他の心血管リスク因子をコントロール'
      ];
      break;

    case 'low-moderate':
      recommendations['zh-TW'] = [
        '考慮抗凝治療，需評估個別風險效益',
        '評估出血風險（如 HAS-BLED 評分）',
        '與患者討論治療選項',
        '定期重新評估'
      ];
      recommendations['en'] = [
        'Consider anticoagulation, assess individual risk-benefit',
        'Assess bleeding risk (e.g., HAS-BLED score)',
        'Discuss treatment options with patient',
        'Regular reassessment'
      ];
      recommendations['ja'] = [
        '抗凝固療法を検討、個別のリスク・ベネフィットを評価',
        '出血リスクを評価（HAS-BLEDスコアなど）',
        '患者と治療選択肢を議論',
        '定期的な再評価'
      ];
      break;

    case 'high':
      recommendations['zh-TW'] = [
        '建議抗凝治療（除非有禁忌症）',
        '選擇適當的抗凝藥物（DOAC 或 Warfarin）',
        '監測抗凝效果和副作用',
        '定期評估出血風險',
        '患者教育和依從性管理'
      ];
      recommendations['en'] = [
        'Anticoagulation recommended (unless contraindicated)',
        'Choose appropriate anticoagulant (DOAC or Warfarin)',
        'Monitor anticoagulation efficacy and side effects',
        'Regular bleeding risk assessment',
        'Patient education and adherence management'
      ];
      recommendations['ja'] = [
        '抗凝固療法を推奨（禁忌でない限り）',
        '適切な抗凝固薬を選択（DOACまたはワルファリン）',
        '抗凝固効果と副作用をモニタリング',
        '定期的な出血リスク評価',
        '患者教育とアドヒアランス管理'
      ];
      break;
  }

  return recommendations;
}