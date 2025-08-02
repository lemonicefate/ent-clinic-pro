/**
 * 醫療圖表工具類
 * 提供醫療數據處理和圖表配置的實用函數
 */

import type { SupportedLocale } from '../env.d';

// 風險等級定義
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

// 醫療顏色配置
export const MEDICAL_COLORS = {
  risk: {
    low: '#22c55e',
    moderate: '#f59e0b', 
    high: '#f97316',
    critical: '#ef4444'
  },
  vitals: {
    normal: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6'
  },
  chart: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    neutral: '#6b7280'
  }
} as const;

// 生命徵象正常範圍
export const VITAL_SIGNS_RANGES = {
  bloodPressure: {
    systolic: { min: 90, max: 140, optimal: 120 },
    diastolic: { min: 60, max: 90, optimal: 80 }
  },
  heartRate: {
    min: 60, max: 100, optimal: 72
  },
  temperature: {
    min: 36.1, max: 37.2, optimal: 36.5
  },
  oxygenSaturation: {
    min: 95, max: 100, optimal: 98
  }
} as const;

/**
 * 根據數值判斷風險等級
 */
export function calculateRiskLevel(
  value: number, 
  thresholds: { low: number; moderate: number; high: number }
): RiskLevel {
  if (value <= thresholds.low) return 'low';
  if (value <= thresholds.moderate) return 'moderate';
  if (value <= thresholds.high) return 'high';
  return 'critical';
}

/**
 * 獲取風險等級對應的顏色
 */
export function getRiskColor(risk: RiskLevel): string {
  return MEDICAL_COLORS.risk[risk];
}

/**
 * 判斷生命徵象是否正常
 */
export function isVitalSignNormal(type: keyof typeof VITAL_SIGNS_RANGES, value: number): boolean {
  const range = VITAL_SIGNS_RANGES[type];
  if ('min' in range && 'max' in range) {
    return value >= range.min && value <= range.max;
  }
  return false;
}

/**
 * 獲取生命徵象狀態顏色
 */
export function getVitalSignColor(type: keyof typeof VITAL_SIGNS_RANGES, value: number): string {
  if (isVitalSignNormal(type, value)) {
    return MEDICAL_COLORS.vitals.normal;
  }
  
  const range = VITAL_SIGNS_RANGES[type];
  if ('min' in range && 'max' in range) {
    if (value < range.min || value > range.max) {
      return MEDICAL_COLORS.vitals.danger;
    }
  }
  
  return MEDICAL_COLORS.vitals.warning;
}

/**
 * 計算百分比
 */
export function calculatePercentage(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

/**
 * 格式化醫療數值
 */
export function formatMedicalValue(
  value: number, 
  type: 'bloodPressure' | 'heartRate' | 'temperature' | 'percentage' | 'score',
  locale: SupportedLocale = 'zh-TW'
): string {
  switch (type) {
    case 'bloodPressure':
      return `${value} mmHg`;
    case 'heartRate':
      return `${value} bpm`;
    case 'temperature':
      return `${value.toFixed(1)} °C`;
    case 'percentage':
      return `${value}%`;
    case 'score':
      return `${value}/10`;
    default:
      return value.toString();
  }
}

/**
 * 生成時間序列標籤
 */
export function generateTimeLabels(
  startTime: Date, 
  intervalMinutes: number, 
  count: number
): string[] {
  const labels: string[] = [];
  const current = new Date(startTime);
  
  for (let i = 0; i < count; i++) {
    labels.push(current.toLocaleTimeString('zh-TW', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }));
    current.setMinutes(current.getMinutes() + intervalMinutes);
  }
  
  return labels;
}

/**
 * 計算移動平均
 */
export function calculateMovingAverage(data: number[], windowSize: number): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = data.slice(start, i + 1);
    const average = window.reduce((sum, val) => sum + val, 0) / window.length;
    result.push(Math.round(average * 100) / 100);
  }
  
  return result;
}

/**
 * 檢測異常值
 */
export function detectOutliers(
  data: number[], 
  threshold: number = 2
): { indices: number[]; values: number[] } {
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);
  
  const outliers = { indices: [] as number[], values: [] as number[] };
  
  data.forEach((value, index) => {
    if (Math.abs(value - mean) > threshold * stdDev) {
      outliers.indices.push(index);
      outliers.values.push(value);
    }
  });
  
  return outliers;
}

/**
 * 生成醫療圖表的通用配置
 */
export function createMedicalChartConfig(
  title: string,
  locale: SupportedLocale = 'zh-TW'
) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const
        },
        color: '#1f2937'
      },
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: true
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: '#6b7280'
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: '#6b7280'
        }
      }
    }
  };
}

/**
 * 創建風險評估數據
 */
export function createRiskAssessmentData(
  scores: number[],
  thresholds: { low: number; moderate: number; high: number }
) {
  const riskCounts = {
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0
  };
  
  scores.forEach(score => {
    const risk = calculateRiskLevel(score, thresholds);
    riskCounts[risk]++;
  });
  
  return riskCounts;
}

/**
 * 生成模擬生命徵象數據
 */
export function generateMockVitalSigns(
  hours: number = 24,
  intervalMinutes: number = 60
): {
  timestamps: string[];
  bloodPressureSystolic: number[];
  bloodPressureDiastolic: number[];
  heartRate: number[];
  temperature: number[];
  oxygenSaturation: number[];
} {
  const count = Math.floor((hours * 60) / intervalMinutes);
  const startTime = new Date();
  startTime.setHours(startTime.getHours() - hours);
  
  const timestamps = generateTimeLabels(startTime, intervalMinutes, count);
  
  // 生成帶有自然變化的模擬數據
  const bloodPressureSystolic = Array.from({ length: count }, (_, i) => 
    120 + Math.sin(i * 0.1) * 10 + (Math.random() - 0.5) * 20
  ).map(v => Math.round(Math.max(90, Math.min(180, v))));
  
  const bloodPressureDiastolic = bloodPressureSystolic.map(sys => 
    Math.round(sys * 0.67 + (Math.random() - 0.5) * 10)
  );
  
  const heartRate = Array.from({ length: count }, (_, i) => 
    72 + Math.sin(i * 0.15) * 8 + (Math.random() - 0.5) * 15
  ).map(v => Math.round(Math.max(50, Math.min(120, v))));
  
  const temperature = Array.from({ length: count }, () => 
    36.5 + (Math.random() - 0.5) * 1.5
  ).map(v => Math.round(Math.max(35.5, Math.min(39.0, v)) * 10) / 10);
  
  const oxygenSaturation = Array.from({ length: count }, () => 
    98 + (Math.random() - 0.5) * 4
  ).map(v => Math.round(Math.max(90, Math.min(100, v))));
  
  return {
    timestamps,
    bloodPressureSystolic,
    bloodPressureDiastolic,
    heartRate,
    temperature,
    oxygenSaturation
  };
}

/**
 * 計算藥物評分
 */
export function calculateMedicationScore(
  effectiveness: number,
  sideEffects: number,
  cost: number,
  weights: { effectiveness: number; sideEffects: number; cost: number } = 
    { effectiveness: 0.5, sideEffects: 0.3, cost: 0.2 }
): number {
  // 副作用和成本是負面因素，需要反轉
  const normalizedSideEffects = 10 - sideEffects;
  const normalizedCost = 10 - cost;
  
  const score = (
    effectiveness * weights.effectiveness +
    normalizedSideEffects * weights.sideEffects +
    normalizedCost * weights.cost
  );
  
  return Math.round(score * 10) / 10;
}

/**
 * 生成醫療報告摘要
 */
export function generateMedicalSummary(
  data: {
    riskDistribution?: { low: number; moderate: number; high: number; critical: number };
    vitalSigns?: { systolic: number[]; diastolic: number[]; heartRate: number[] };
    symptoms?: { name: string; severity: number }[];
  },
  locale: SupportedLocale = 'zh-TW'
): string[] {
  const summary: string[] = [];
  
  if (data.riskDistribution) {
    const total = Object.values(data.riskDistribution).reduce((sum, val) => sum + val, 0);
    const highRiskPercentage = calculatePercentage(
      data.riskDistribution.high + data.riskDistribution.critical, 
      total
    );
    
    if (highRiskPercentage > 30) {
      summary.push(`高風險患者比例較高 (${highRiskPercentage}%)，建議加強監測和干預措施。`);
    } else if (highRiskPercentage < 10) {
      summary.push(`整體風險控制良好，高風險患者比例僅 ${highRiskPercentage}%。`);
    }
  }
  
  if (data.vitalSigns) {
    const avgSystolic = Math.round(
      data.vitalSigns.systolic.reduce((sum, val) => sum + val, 0) / data.vitalSigns.systolic.length
    );
    const avgDiastolic = Math.round(
      data.vitalSigns.diastolic.reduce((sum, val) => sum + val, 0) / data.vitalSigns.diastolic.length
    );
    
    if (avgSystolic > 140 || avgDiastolic > 90) {
      summary.push(`血壓偏高 (平均 ${avgSystolic}/${avgDiastolic} mmHg)，建議調整治療方案。`);
    } else if (avgSystolic < 90 || avgDiastolic < 60) {
      summary.push(`血壓偏低 (平均 ${avgSystolic}/${avgDiastolic} mmHg)，需要密切監測。`);
    }
  }
  
  if (data.symptoms) {
    const severeSymptoms = data.symptoms.filter(s => s.severity >= 7);
    if (severeSymptoms.length > 0) {
      const symptomNames = severeSymptoms.map(s => s.name).join('、');
      summary.push(`${symptomNames} 症狀較為嚴重，建議優先處理。`);
    }
  }
  
  return summary;
}

/**
 * 導出所有工具函數
 */
export default {
  calculateRiskLevel,
  getRiskColor,
  isVitalSignNormal,
  getVitalSignColor,
  calculatePercentage,
  formatMedicalValue,
  generateTimeLabels,
  calculateMovingAverage,
  detectOutliers,
  createMedicalChartConfig,
  createRiskAssessmentData,
  generateMockVitalSigns,
  calculateMedicationScore,
  generateMedicalSummary,
  MEDICAL_COLORS,
  VITAL_SIGNS_RANGES
};