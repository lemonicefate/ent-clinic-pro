/**
 * CHA2DS2-VASc 計算機特定類型定義
 */

export interface CHA2DS2VAScInputs {
  age: number;
  gender: 'male' | 'female';
  congestiveHeartFailure: boolean;
  hypertension: boolean;
  diabetes: boolean;
  strokeTiaHistory: boolean;
  vascularDisease: boolean;
}

export interface CHA2DS2VAScResult {
  score: number;
  riskLevel: 'low' | 'moderate' | 'high';
  strokeRiskPerYear: number;
  interpretation: string;
  recommendations: string[];
  anticoagulationRecommendation: {
    recommended: boolean;
    strength: 'not-recommended' | 'consider' | 'recommended' | 'strongly-recommended';
    reasoning: string;
  };
  calculationSteps: Array<{
    factor: string;
    points: number;
    description: string;
  }>;
}

export interface RiskCategory {
  score: number;
  riskLevel: 'low' | 'moderate' | 'high';
  strokeRiskPerYear: number;
  description: Record<string, string>;
  anticoagulationRecommendation: {
    recommended: boolean;
    strength: 'not-recommended' | 'consider' | 'recommended' | 'strongly-recommended';
  };
  color: {
    bg: string;
    border: string;
    text: string;
  };
}

export const RISK_CATEGORIES: RiskCategory[] = [
  {
    score: 0,
    riskLevel: 'low',
    strokeRiskPerYear: 0.2,
    description: {
      'zh-TW': '低風險',
      'en': 'Low Risk',
      'ja': '低リスク'
    },
    anticoagulationRecommendation: {
      recommended: false,
      strength: 'not-recommended'
    },
    color: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800'
    }
  },
  {
    score: 1,
    riskLevel: 'moderate',
    strokeRiskPerYear: 0.9,
    description: {
      'zh-TW': '中等風險',
      'en': 'Moderate Risk',
      'ja': '中等度リスク'
    },
    anticoagulationRecommendation: {
      recommended: true,
      strength: 'consider'
    },
    color: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800'
    }
  },
  {
    score: 2,
    riskLevel: 'high',
    strokeRiskPerYear: 2.9,
    description: {
      'zh-TW': '高風險',
      'en': 'High Risk',
      'ja': '高リスク'
    },
    anticoagulationRecommendation: {
      recommended: true,
      strength: 'recommended'
    },
    color: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800'
    }
  }
];

// 根據分數獲取風險等級的詳細資訊
export function getRiskCategory(score: number): RiskCategory {
  if (score === 0) {
    return RISK_CATEGORIES[0];
  } else if (score === 1) {
    return RISK_CATEGORIES[1];
  } else {
    // score >= 2
    const highRiskCategory = { ...RISK_CATEGORIES[2] };
    
    // 根據分數調整年中風風險
    if (score === 2) {
      highRiskCategory.strokeRiskPerYear = 2.9;
    } else if (score === 3) {
      highRiskCategory.strokeRiskPerYear = 4.6;
    } else if (score === 4) {
      highRiskCategory.strokeRiskPerYear = 6.7;
    } else if (score === 5) {
      highRiskCategory.strokeRiskPerYear = 10.0;
    } else if (score === 6) {
      highRiskCategory.strokeRiskPerYear = 13.6;
    } else if (score === 7) {
      highRiskCategory.strokeRiskPerYear = 15.7;
    } else if (score === 8) {
      highRiskCategory.strokeRiskPerYear = 15.2;
    } else {
      highRiskCategory.strokeRiskPerYear = 15.2; // 9分的風險
    }
    
    // 高分數強烈建議抗凝治療
    if (score >= 3) {
      highRiskCategory.anticoagulationRecommendation.strength = 'strongly-recommended';
    }
    
    return highRiskCategory;
  }
}

// CHA2DS2-VASc 評分因子
export interface ScoreFactor {
  id: keyof CHA2DS2VAScInputs;
  name: Record<string, string>;
  description: Record<string, string>;
  points: number | ((inputs: CHA2DS2VAScInputs) => number);
}

export const SCORE_FACTORS: ScoreFactor[] = [
  {
    id: 'congestiveHeartFailure',
    name: {
      'zh-TW': '充血性心衰竭',
      'en': 'Congestive Heart Failure',
      'ja': 'うっ血性心不全'
    },
    description: {
      'zh-TW': '左心室功能不全或近期失代償性心衰竭',
      'en': 'Left ventricular dysfunction or recent decompensated heart failure',
      'ja': '左室機能不全または最近の非代償性心不全'
    },
    points: 1
  },
  {
    id: 'hypertension',
    name: {
      'zh-TW': '高血壓',
      'en': 'Hypertension',
      'ja': '高血圧'
    },
    description: {
      'zh-TW': '休息時血壓 >140/90 mmHg 或正在服用降壓藥',
      'en': 'Resting BP >140/90 mmHg or on antihypertensive treatment',
      'ja': '安静時血圧 >140/90 mmHg または降圧薬治療中'
    },
    points: 1
  },
  {
    id: 'age',
    name: {
      'zh-TW': '年齡',
      'en': 'Age',
      'ja': '年齢'
    },
    description: {
      'zh-TW': '65-74歲得1分，≥75歲得2分',
      'en': '65-74 years: 1 point, ≥75 years: 2 points',
      'ja': '65-74歳：1点、≥75歳：2点'
    },
    points: (inputs: CHA2DS2VAScInputs) => {
      if (inputs.age >= 75) return 2;
      if (inputs.age >= 65) return 1;
      return 0;
    }
  },
  {
    id: 'diabetes',
    name: {
      'zh-TW': '糖尿病',
      'en': 'Diabetes Mellitus',
      'ja': '糖尿病'
    },
    description: {
      'zh-TW': '空腹血糖 >125 mg/dL 或正在服用降糖藥或胰島素',
      'en': 'Fasting glucose >125 mg/dL or on antidiabetic treatment',
      'ja': '空腹時血糖 >125 mg/dL または糖尿病治療中'
    },
    points: 1
  },
  {
    id: 'strokeTiaHistory',
    name: {
      'zh-TW': '中風/TIA/血栓栓塞病史',
      'en': 'Stroke/TIA/Thromboembolism History',
      'ja': '脳卒中/TIA/血栓塞栓症の既往'
    },
    description: {
      'zh-TW': '既往中風、短暫性腦缺血發作或全身性栓塞',
      'en': 'Previous stroke, TIA, or systemic embolism',
      'ja': '脳卒中、TIA、または全身性塞栓症の既往'
    },
    points: 2
  },
  {
    id: 'vascularDisease',
    name: {
      'zh-TW': '血管疾病',
      'en': 'Vascular Disease',
      'ja': '血管疾患'
    },
    description: {
      'zh-TW': '心肌梗塞、周邊動脈疾病或主動脈斑塊',
      'en': 'Myocardial infarction, peripheral artery disease, or aortic plaque',
      'ja': '心筋梗塞、末梢動脈疾患、または大動脈プラーク'
    },
    points: 1
  },
  {
    id: 'gender',
    name: {
      'zh-TW': '性別',
      'en': 'Sex Category',
      'ja': '性別'
    },
    description: {
      'zh-TW': '女性得1分',
      'en': 'Female sex: 1 point',
      'ja': '女性：1点'
    },
    points: (inputs: CHA2DS2VAScInputs) => {
      return inputs.gender === 'female' ? 1 : 0;
    }
  }
];