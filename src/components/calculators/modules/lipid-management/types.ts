/**
 * 血脂管理計算機特定類型定義
 */

export interface LipidManagementInputs {
  age: number;
  gender: 'male' | 'female';
  totalCholesterol: number;
  ldlCholesterol: number;
  hdlCholesterol: number;
  triglycerides: number;
  systolicBP: number;
  diastolicBP: number;
  diabetes: boolean;
  smoking: boolean;
  familyHistory: boolean;
  hypertension: boolean;
  ckd: boolean;
  previousCVD: boolean;
}

export interface LipidManagementResult {
  cvdRisk: number;
  riskCategory: 'low' | 'moderate' | 'high' | 'very-high';
  ldlTarget: number;
  treatmentRecommendation: {
    lifestyle: string[];
    medication: {
      recommended: boolean;
      type: string;
      intensity: 'low' | 'moderate' | 'high';
      reasoning: string;
    };
  };
  followUp: {
    interval: number; // months
    monitoring: string[];
  };
  calculationSteps: Array<{
    factor: string;
    value: number | string;
    points?: number;
    description: string;
  }>;
}

export interface RiskFactor {
  name: string;
  value: number | boolean | string;
  points: number;
  description: Record<string, string>;
}

export const RISK_CATEGORIES = {
  'low': {
    range: '< 5%',
    ldlTarget: 130,
    color: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' }
  },
  'moderate': {
    range: '5-10%',
    ldlTarget: 100,
    color: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' }
  },
  'high': {
    range: '10-20%',
    ldlTarget: 70,
    color: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800' }
  },
  'very-high': {
    range: '> 20%',
    ldlTarget: 55,
    color: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' }
  }
} as const;

export function getRiskCategory(cvdRisk: number): keyof typeof RISK_CATEGORIES {
  if (cvdRisk < 5) return 'low';
  if (cvdRisk < 10) return 'moderate';
  if (cvdRisk < 20) return 'high';
  return 'very-high';
}

export function getStatinRecommendation(riskCategory: keyof typeof RISK_CATEGORIES, ldlCholesterol: number, ldlTarget: number) {
  const ldlReduction = ((ldlCholesterol - ldlTarget) / ldlCholesterol) * 100;
  
  if (riskCategory === 'very-high' || ldlReduction > 50) {
    return { intensity: 'high' as const, type: 'High-intensity statin (Atorvastatin 40-80mg, Rosuvastatin 20-40mg)' };
  } else if (riskCategory === 'high' || ldlReduction > 30) {
    return { intensity: 'moderate' as const, type: 'Moderate-intensity statin (Atorvastatin 20mg, Rosuvastatin 10mg)' };
  } else {
    return { intensity: 'low' as const, type: 'Low-intensity statin (Simvastatin 20mg, Pravastatin 40mg)' };
  }
}