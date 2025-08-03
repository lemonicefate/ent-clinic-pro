/**
 * eGFR 計算機特定類型定義
 */

export interface EGFRInputs {
  creatinine: number;
  age: number;
  gender: 'male' | 'female';
  race?: 'black' | 'non-black'; // 保留但不使用，CKD-EPI 2021 已移除種族係數
}

export interface EGFRResult {
  egfr: number;
  stage: CKDStage;
  riskLevel: 'normal' | 'mild' | 'moderate' | 'severe' | 'kidney-failure';
  interpretation: string;
  recommendations: string[];
  calculationSteps: Array<{
    description: string;
    value: string;
    formula: string;
  }>;
  nextSteps: string[];
}

export interface CKDStage {
  stage: string;
  name: Record<string, string>;
  range: string;
  description: Record<string, string>;
  riskLevel: 'normal' | 'mild' | 'moderate' | 'severe' | 'kidney-failure';
  color: {
    bg: string;
    border: string;
    text: string;
  };
}

export const CKD_STAGES: CKDStage[] = [
  {
    stage: 'G1',
    name: {
      'zh-TW': '正常或高',
      'en': 'Normal or High',
      'ja': '正常または高値'
    },
    range: '≥ 90',
    description: {
      'zh-TW': '腎功能正常或輕微損害，但有其他腎臟疾病證據',
      'en': 'Normal kidney function with evidence of kidney damage',
      'ja': '腎機能正常または軽度の損傷があるが、他の腎疾患の証拠がある'
    },
    riskLevel: 'normal',
    color: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800'
    }
  },
  {
    stage: 'G2',
    name: {
      'zh-TW': '輕度下降',
      'en': 'Mildly Decreased',
      'ja': '軽度低下'
    },
    range: '60-89',
    description: {
      'zh-TW': '腎功能輕度下降，伴有腎臟損害證據',
      'en': 'Mildly decreased kidney function with evidence of kidney damage',
      'ja': '腎機能軽度低下、腎損傷の証拠を伴う'
    },
    riskLevel: 'mild',
    color: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800'
    }
  },
  {
    stage: 'G3a',
    name: {
      'zh-TW': '輕度至中度下降',
      'en': 'Mild to Moderate Decrease',
      'ja': '軽度から中等度低下'
    },
    range: '45-59',
    description: {
      'zh-TW': '腎功能輕度至中度下降',
      'en': 'Mild to moderate decrease in kidney function',
      'ja': '腎機能軽度から中等度低下'
    },
    riskLevel: 'moderate',
    color: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800'
    }
  },
  {
    stage: 'G3b',
    name: {
      'zh-TW': '中度至重度下降',
      'en': 'Moderate to Severe Decrease',
      'ja': '中等度から重度低下'
    },
    range: '30-44',
    description: {
      'zh-TW': '腎功能中度至重度下降',
      'en': 'Moderate to severe decrease in kidney function',
      'ja': '腎機能中等度から重度低下'
    },
    riskLevel: 'moderate',
    color: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800'
    }
  },
  {
    stage: 'G4',
    name: {
      'zh-TW': '重度下降',
      'en': 'Severely Decreased',
      'ja': '重度低下'
    },
    range: '15-29',
    description: {
      'zh-TW': '腎功能重度下降，準備腎替代治療',
      'en': 'Severely decreased kidney function, prepare for renal replacement therapy',
      'ja': '腎機能重度低下、腎代替療法の準備'
    },
    riskLevel: 'severe',
    color: {
      bg: 'bg-red-100',
      border: 'border-red-300',
      text: 'text-red-900'
    }
  },
  {
    stage: 'G5',
    name: {
      'zh-TW': '腎衰竭',
      'en': 'Kidney Failure',
      'ja': '腎不全'
    },
    range: '< 15',
    description: {
      'zh-TW': '腎衰竭，需要透析或腎移植',
      'en': 'Kidney failure, dialysis or kidney transplant needed',
      'ja': '腎不全、透析または腎移植が必要'
    },
    riskLevel: 'kidney-failure',
    color: {
      bg: 'bg-red-200',
      border: 'border-red-400',
      text: 'text-red-900'
    }
  }
];

export function getCKDStage(egfr: number): CKDStage {
  if (egfr >= 90) return CKD_STAGES[0]; // G1
  if (egfr >= 60) return CKD_STAGES[1]; // G2
  if (egfr >= 45) return CKD_STAGES[2]; // G3a
  if (egfr >= 30) return CKD_STAGES[3]; // G3b
  if (egfr >= 15) return CKD_STAGES[4]; // G4
  return CKD_STAGES[5]; // G5
}

// 單位轉換常數
export const UNIT_CONVERSIONS = {
  // 肌酸酐單位轉換
  CREATININE_MG_DL_TO_UMOL_L: 88.4, // mg/dL to μmol/L
  CREATININE_UMOL_L_TO_MG_DL: 0.0113, // μmol/L to mg/dL
  
  // eGFR 單位 (mL/min/1.73m²)
  EGFR_UNIT: 'mL/min/1.73m²'
};