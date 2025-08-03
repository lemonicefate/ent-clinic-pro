/**
 * BMI 計算機特定類型定義
 */

export interface BMIInputs {
  weight: number;
  height: number;
  age?: number;
  gender?: 'male' | 'female';
}

export interface BMIResult {
  bmi: number;
  category: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  interpretation: string;
  recommendations: string[];
  calculationSteps: Array<{
    description: string;
    value: string;
    formula: string;
  }>;
}

export interface BMICategory {
  range: string;
  category: Record<string, string>;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  color: {
    bg: string;
    border: string;
    text: string;
  };
}

export const BMI_CATEGORIES: BMICategory[] = [
  {
    range: '< 16.0',
    category: {
      'zh-TW': '嚴重體重不足',
      'en': 'Severely Underweight',
      'ja': '重度の低体重'
    },
    riskLevel: 'critical',
    color: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800'
    }
  },
  {
    range: '16.0 - 18.4',
    category: {
      'zh-TW': '體重不足',
      'en': 'Underweight',
      'ja': '低体重'
    },
    riskLevel: 'moderate',
    color: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800'
    }
  },
  {
    range: '18.5 - 24.9',
    category: {
      'zh-TW': '正常體重',
      'en': 'Normal Weight',
      'ja': '正常体重'
    },
    riskLevel: 'low',
    color: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800'
    }
  },
  {
    range: '25.0 - 29.9',
    category: {
      'zh-TW': '體重過重',
      'en': 'Overweight',
      'ja': '過体重'
    },
    riskLevel: 'moderate',
    color: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800'
    }
  },
  {
    range: '30.0 - 34.9',
    category: {
      'zh-TW': '輕度肥胖',
      'en': 'Class I Obesity',
      'ja': 'クラスI肥満'
    },
    riskLevel: 'high',
    color: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800'
    }
  },
  {
    range: '35.0 - 39.9',
    category: {
      'zh-TW': '中度肥胖',
      'en': 'Class II Obesity',
      'ja': 'クラスII肥満'
    },
    riskLevel: 'high',
    color: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800'
    }
  },
  {
    range: '≥ 40.0',
    category: {
      'zh-TW': '重度肥胖',
      'en': 'Class III Obesity',
      'ja': 'クラスIII肥満'
    },
    riskLevel: 'critical',
    color: {
      bg: 'bg-red-100',
      border: 'border-red-300',
      text: 'text-red-900'
    }
  }
];

export function getBMICategory(bmi: number): BMICategory {
  if (bmi < 16) return BMI_CATEGORIES[0];
  if (bmi < 18.5) return BMI_CATEGORIES[1];
  if (bmi < 25) return BMI_CATEGORIES[2];
  if (bmi < 30) return BMI_CATEGORIES[3];
  if (bmi < 35) return BMI_CATEGORIES[4];
  if (bmi < 40) return BMI_CATEGORIES[5];
  return BMI_CATEGORIES[6];
}