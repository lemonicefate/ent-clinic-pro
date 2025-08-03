/**
 * 計算結果類型定義
 */

import { LocalizedString, RiskLevel } from './common';

export interface CalculationResult {
  // 主要結果
  primaryValue: number;
  primaryUnit?: string;
  primaryLabel: LocalizedString;

  // 次要結果
  secondaryValues?: Array<{
    value: number;
    unit?: string;
    label: LocalizedString;
    description?: LocalizedString;
  }>;

  // 風險評估
  riskLevel?: RiskLevel;
  riskScore?: number;
  riskPercentage?: number;

  // 解釋和建議
  interpretation: LocalizedString;
  recommendations?: Array<LocalizedString>;
  warnings?: Array<LocalizedString>;

  // 計算詳情
  breakdown?: CalculationBreakdown[];

  // 視覺化資料
  visualizationData?: Record<string, any>;

  // 信心區間
  confidenceInterval?: {
    lower: number;
    upper: number;
    level: number; // 0.95 for 95%
  };

  // 參考範圍
  referenceRanges?: Array<{
    label: LocalizedString;
    min: number;
    max: number;
    unit?: string;
  }>;

  // 計算元資料
  metadata?: {
    calculatedAt: string;
    calculationTime: number; // 毫秒
    version: string;
    inputs: Record<string, any>;
  };
}

export interface CalculationBreakdown {
  field: string;
  label: LocalizedString;
  value: any;
  contribution: number; // 百分比
  explanation?: LocalizedString;
  formula?: string;
}

export interface FormattedResult {
  displayValue: string;
  description: string;
  recommendations: string[];
  warnings?: string[];
}