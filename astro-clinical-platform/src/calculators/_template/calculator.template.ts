/**
 * 計算機模板 - 純函式實現
 * 
 * 這是一個計算機模組的模板，展示如何實現計算邏輯、驗證和格式化功能。
 * 所有函式都是純函式，便於測試和維護。
 */

// 類型定義
export interface CalculatorInputs {
  input1: number;
  input2: string;
  [key: string]: any;
}

export interface CalculationResult {
  // 主要結果
  primaryValue: number;
  primaryUnit?: string;
  primaryLabel: Record<SupportedLocale, string>;

  // 次要結果
  secondaryValues?: Array<{
    value: number;
    unit?: string;
    label: Record<SupportedLocale, string>;
  }>;

  // 風險等級
  riskLevel?: 'low' | 'moderate' | 'high' | 'critical';
  riskScore?: number;

  // 解釋和建議
  interpretation: Record<SupportedLocale, string>;
  recommendations?: Array<Record<SupportedLocale, string>>;

  // 計算詳情
  breakdown?: CalculationBreakdown[];

  // 視覺化資料
  visualizationData?: Record<string, any>;
}

export interface CalculationBreakdown {
  field: string;
  label: Record<SupportedLocale, string>;
  value: any;
  contribution: number;
  explanation?: Record<SupportedLocale, string>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormattedResult {
  displayValue: string;
  description: string;
  recommendations: string[];
}

export type SupportedLocale = 'zh-TW' | 'en';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

/**
 * 主要計算函式
 * 
 * @param inputs - 使用者輸入的參數
 * @returns 計算結果
 */
export function calculate(inputs: CalculatorInputs): CalculationResult {
  const { input1, input2 } = inputs;
  
  // 執行計算邏輯
  const result = performCalculation(input1, input2);
  
  // 判定風險等級
  const riskLevel = determineRiskLevel(result);
  
  // 生成解釋
  const interpretation = generateInterpretation(result, riskLevel);
  
  // 生成建議
  const recommendations = generateRecommendations(result, riskLevel);
  
  // 準備視覺化資料
  const visualizationData = prepareVisualizationData(result, inputs);

  return {
    primaryValue: Math.round(result * 100) / 100,
    primaryUnit: "單位",
    primaryLabel: { 
      "zh-TW": "計算結果", 
      "en": "Calculation Result" 
    },
    riskLevel,
    interpretation,
    recommendations,
    breakdown: generateBreakdown(inputs, result),
    visualizationData,
  };
}

/**
 * 輸入驗證函式
 * 
 * @param inputs - 使用者輸入的參數
 * @returns 驗證結果
 */
export function validate(inputs: CalculatorInputs): ValidationResult {
  const errors: ValidationError[] = [];

  // 驗證 input1
  if (!inputs.input1 && inputs.input1 !== 0) {
    errors.push({
      field: "input1",
      message: "輸入值 1 為必填欄位",
      code: "REQUIRED"
    });
  } else if (typeof inputs.input1 !== 'number') {
    errors.push({
      field: "input1",
      message: "輸入值 1 必須是數字",
      code: "INVALID_TYPE"
    });
  } else if (inputs.input1 < 0) {
    errors.push({
      field: "input1",
      message: "輸入值 1 不能小於 0",
      code: "MIN_VALUE"
    });
  } else if (inputs.input1 > 1000) {
    errors.push({
      field: "input1",
      message: "輸入值 1 不能大於 1000",
      code: "MAX_VALUE"
    });
  }

  // 驗證 input2
  if (!inputs.input2) {
    errors.push({
      field: "input2",
      message: "輸入值 2 為必填欄位",
      code: "REQUIRED"
    });
  } else if (!['option1', 'option2'].includes(inputs.input2)) {
    errors.push({
      field: "input2",
      message: "輸入值 2 必須是有效選項",
      code: "INVALID_OPTION"
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 結果格式化函式
 * 
 * @param result - 計算結果
 * @param locale - 語言設定
 * @returns 格式化後的結果
 */
export function formatResult(
  result: CalculationResult,
  locale: SupportedLocale
): FormattedResult {
  return {
    displayValue: `${result.primaryValue} ${result.primaryUnit || ''}`.trim(),
    description: result.interpretation[locale] || result.interpretation['zh-TW'],
    recommendations: result.recommendations?.map(rec => 
      rec[locale] || rec['zh-TW']
    ) || [],
  };
}

// 輔助函式

/**
 * 執行實際的計算邏輯
 */
function performCalculation(input1: number, input2: string): number {
  // 這裡實現具體的計算邏輯
  // 這只是一個示例，實際計算會根據醫療公式而定
  const multiplier = input2 === 'option1' ? 1.2 : 1.5;
  return input1 * multiplier;
}

/**
 * 判定風險等級
 */
function determineRiskLevel(result: number): RiskLevel {
  if (result < 10) return 'low';
  if (result < 20) return 'moderate';
  if (result < 30) return 'high';
  return 'critical';
}

/**
 * 生成結果解釋
 */
function generateInterpretation(
  result: number, 
  riskLevel: RiskLevel
): Record<SupportedLocale, string> {
  const interpretations = {
    low: {
      'zh-TW': `計算結果為 ${result.toFixed(2)}，屬於低風險範圍。`,
      'en': `The calculation result is ${result.toFixed(2)}, which is in the low risk range.`
    },
    moderate: {
      'zh-TW': `計算結果為 ${result.toFixed(2)}，屬於中等風險範圍。`,
      'en': `The calculation result is ${result.toFixed(2)}, which is in the moderate risk range.`
    },
    high: {
      'zh-TW': `計算結果為 ${result.toFixed(2)}，屬於高風險範圍。`,
      'en': `The calculation result is ${result.toFixed(2)}, which is in the high risk range.`
    },
    critical: {
      'zh-TW': `計算結果為 ${result.toFixed(2)}，屬於極高風險範圍。`,
      'en': `The calculation result is ${result.toFixed(2)}, which is in the critical risk range.`
    }
  };

  return interpretations[riskLevel];
}

/**
 * 生成建議
 */
function generateRecommendations(
  result: number, 
  riskLevel: RiskLevel
): Array<Record<SupportedLocale, string>> {
  const recommendationMap = {
    low: [
      {
        'zh-TW': '維持現狀，定期追蹤',
        'en': 'Maintain current status and monitor regularly'
      }
    ],
    moderate: [
      {
        'zh-TW': '建議諮詢醫療專業人員',
        'en': 'Recommend consulting healthcare professionals'
      },
      {
        'zh-TW': '考慮調整生活方式',
        'en': 'Consider lifestyle modifications'
      }
    ],
    high: [
      {
        'zh-TW': '建議盡快就醫檢查',
        'en': 'Recommend seeking medical attention promptly'
      },
      {
        'zh-TW': '需要密切監控',
        'en': 'Close monitoring required'
      }
    ],
    critical: [
      {
        'zh-TW': '建議立即就醫',
        'en': 'Immediate medical attention recommended'
      },
      {
        'zh-TW': '可能需要緊急處理',
        'en': 'May require emergency treatment'
      }
    ]
  };

  return recommendationMap[riskLevel] || [];
}

/**
 * 生成計算詳情分解
 */
function generateBreakdown(
  inputs: CalculatorInputs, 
  result: number
): CalculationBreakdown[] {
  return [
    {
      field: 'input1',
      label: {
        'zh-TW': '輸入值 1',
        'en': 'Input Value 1'
      },
      value: inputs.input1,
      contribution: (inputs.input1 / result) * 100,
      explanation: {
        'zh-TW': '這是第一個輸入參數的貢獻',
        'en': 'This is the contribution of the first input parameter'
      }
    },
    {
      field: 'input2',
      label: {
        'zh-TW': '輸入值 2',
        'en': 'Input Value 2'
      },
      value: inputs.input2,
      contribution: inputs.input2 === 'option1' ? 20 : 50,
      explanation: {
        'zh-TW': '這是第二個輸入參數的影響',
        'en': 'This is the impact of the second input parameter'
      }
    }
  ];
}

/**
 * 準備視覺化資料
 */
function prepareVisualizationData(
  result: number, 
  inputs: CalculatorInputs
): Record<string, any> {
  return {
    primaryResult: result,
    riskDistribution: {
      low: result < 10 ? 100 : 0,
      moderate: result >= 10 && result < 20 ? 100 : 0,
      high: result >= 20 && result < 30 ? 100 : 0,
      critical: result >= 30 ? 100 : 0
    },
    inputContributions: [
      {
        label: '輸入值 1',
        value: inputs.input1,
        percentage: (inputs.input1 / result) * 100
      },
      {
        label: '選項影響',
        value: inputs.input2 === 'option1' ? 1.2 : 1.5,
        percentage: inputs.input2 === 'option1' ? 20 : 50
      }
    ],
    chartData: {
      labels: ['低風險', '中等風險', '高風險', '極高風險'],
      datasets: [{
        data: [
          result < 10 ? result : 0,
          result >= 10 && result < 20 ? result : 0,
          result >= 20 && result < 30 ? result : 0,
          result >= 30 ? result : 0
        ],
        backgroundColor: ['#22c55e', '#f59e0b', '#ef4444', '#dc2626']
      }]
    }
  };
}

/**
 * 自定義驗證器範例
 */
export function customValidator(value: any, field: string): boolean {
  // 實現自定義驗證邏輯
  switch (field) {
    case 'input1':
      return typeof value === 'number' && value >= 0 && value <= 1000;
    case 'input2':
      return ['option1', 'option2'].includes(value);
    default:
      return true;
  }
}

/**
 * 單位轉換函式
 */
export function convertUnits(value: number, fromUnit: string, toUnit: string): number {
  // 實現單位轉換邏輯
  const conversions: Record<string, Record<string, number>> = {
    'kg': {
      'lb': 2.20462,
      'g': 1000
    },
    'cm': {
      'in': 0.393701,
      'm': 0.01
    }
  };

  if (conversions[fromUnit] && conversions[fromUnit][toUnit]) {
    return value * conversions[fromUnit][toUnit];
  }

  return value; // 如果沒有轉換規則，返回原值
}

/**
 * 計算信心區間
 */
export function calculateConfidenceInterval(
  result: number, 
  confidenceLevel: number = 0.95
): { lower: number; upper: number } {
  // 這是一個簡化的信心區間計算
  // 實際實現會根據具體的統計方法
  const margin = result * 0.1; // 假設 10% 的誤差範圍
  
  return {
    lower: Math.max(0, result - margin),
    upper: result + margin
  };
}

export default {
  calculate,
  validate,
  formatResult,
  customValidator,
  convertUnits,
  calculateConfidenceInterval
};