/**
 * BMI 計算機邏輯實現
 * 
 * 基於現有的計算邏輯，適配新的模組化架構。
 */

import { CalculationResult, ValidationResult, SupportedLocale } from '../../types';
import { BMIInputs, getBMICategory } from './types';

/**
 * 計算 BMI 和健康評估
 */
export function calculate(inputs: Record<string, any>): CalculationResult {
  const weight = Number(inputs.weight);
  const height = Number(inputs.height);
  const age = inputs.age ? Number(inputs.age) : undefined;
  const gender = inputs.gender as string;

  // 轉換身高從公分到公尺
  const heightInMeters = height / 100;
  
  // 計算 BMI
  const bmi = weight / (heightInMeters * heightInMeters);
  
  // 判定 BMI 分類和風險等級
  const category = getBMICategory(bmi);
  const { interpretation, recommendations } = getHealthAssessment(bmi, age, gender);
  
  return {
    primaryValue: Math.round(bmi * 10) / 10, // 四捨五入到小數點後一位
    primaryUnit: 'kg/m²',
    primaryLabel: {
      'zh-TW': 'BMI 指數',
      'en': 'BMI Index',
      'ja': 'BMI指数'
    },
    
    secondaryValues: [
      {
        value: weight,
        unit: 'kg',
        label: {
          'zh-TW': '體重',
          'en': 'Weight',
          'ja': '体重'
        }
      },
      {
        value: height,
        unit: 'cm',
        label: {
          'zh-TW': '身高',
          'en': 'Height',
          'ja': '身長'
        }
      },
      {
        value: heightInMeters,
        unit: 'm',
        label: {
          'zh-TW': '身高（公尺）',
          'en': 'Height (meters)',
          'ja': '身長（メートル）'
        }
      }
    ],
    
    riskLevel: category.riskLevel,
    interpretation,
    recommendations,
    
    breakdown: [
      {
        field: 'height_conversion',
        label: {
          'zh-TW': '身高轉換',
          'en': 'Height Conversion',
          'ja': '身長変換'
        },
        value: `${height} cm = ${heightInMeters.toFixed(2)} m`,
        contribution: 0,
        explanation: {
          'zh-TW': '將身高從公分轉換為公尺',
          'en': 'Convert height from centimeters to meters',
          'ja': '身長をセンチメートルからメートルに変換'
        },
        formula: 'height (m) = height (cm) ÷ 100'
      },
      {
        field: 'bmi_calculation',
        label: {
          'zh-TW': 'BMI 計算',
          'en': 'BMI Calculation',
          'ja': 'BMI計算'
        },
        value: `${weight} ÷ (${heightInMeters.toFixed(2)})² = ${bmi.toFixed(1)}`,
        contribution: 100,
        explanation: {
          'zh-TW': '使用標準 BMI 公式計算',
          'en': 'Calculate using standard BMI formula',
          'ja': '標準BMI公式を使用して計算'
        },
        formula: 'BMI = weight (kg) ÷ height (m)²'
      }
    ],
    
    visualizationData: {
      bmi,
      category: category.category,
      riskLevel: category.riskLevel,
      categoryColor: category.color,
      bmiCategories: getBMICategoriesWithStatus(bmi),
      chartData: {
        labels: ['您的 BMI', '正常範圍下限', '正常範圍上限'],
        datasets: [{
          label: 'BMI 比較',
          data: [bmi, 18.5, 24.9],
          backgroundColor: [
            category.riskLevel === 'low' ? '#10b981' : 
            category.riskLevel === 'moderate' ? '#f59e0b' : '#ef4444',
            '#6b7280',
            '#6b7280'
          ]
        }]
      }
    },
    
    metadata: {
      calculatedAt: new Date().toISOString(),
      calculationTime: Date.now(),
      version: '1.0.0',
      inputs: { weight, height, age, gender }
    }
  };
}

/**
 * 驗證輸入參數
 */
export function validate(inputs: Record<string, any>): ValidationResult {
  const errors = [];
  
  // 驗證體重
  const weight = Number(inputs.weight);
  if (!inputs.weight || isNaN(weight)) {
    errors.push({
      field: 'weight',
      message: '請輸入有效的體重',
      code: 'REQUIRED'
    });
  } else if (weight < 20 || weight > 300) {
    errors.push({
      field: 'weight',
      message: '體重必須在 20-300 公斤之間',
      code: 'OUT_OF_RANGE'
    });
  }
  
  // 驗證身高
  const height = Number(inputs.height);
  if (!inputs.height || isNaN(height)) {
    errors.push({
      field: 'height',
      message: '請輸入有效的身高',
      code: 'REQUIRED'
    });
  } else if (height < 100 || height > 250) {
    errors.push({
      field: 'height',
      message: '身高必須在 100-250 公分之間',
      code: 'OUT_OF_RANGE'
    });
  }
  
  // 驗證年齡（選填）
  if (inputs.age) {
    const age = Number(inputs.age);
    if (isNaN(age) || age < 2 || age > 120) {
      errors.push({
        field: 'age',
        message: '年齡必須在 2-120 歲之間',
        code: 'OUT_OF_RANGE'
      });
    }
  }
  
  // 驗證性別（選填）
  if (inputs.gender && !['male', 'female'].includes(inputs.gender)) {
    errors.push({
      field: 'gender',
      message: '請選擇有效的性別',
      code: 'INVALID_OPTION'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 格式化結果顯示
 */
export function formatResult(result: CalculationResult, locale: SupportedLocale = 'zh-TW') {
  const bmi = result.primaryValue;
  const category = getBMICategory(bmi);
  
  return {
    displayValue: `${bmi} ${result.primaryUnit}`,
    description: result.interpretation?.[locale] || result.interpretation?.['zh-TW'] || '',
    recommendations: result.recommendations?.map(rec => 
      rec[locale] || rec['zh-TW'] || ''
    ) || [],
    warnings: []
  };
}

// ============================================================================
// 輔助函數
// ============================================================================

/**
 * 獲取健康評估和建議
 */
function getHealthAssessment(bmi: number, age?: number, gender?: string) {
  const category = getBMICategory(bmi);
  
  // 基本解釋
  let interpretation = {
    'zh-TW': '',
    'en': '',
    'ja': ''
  };
  
  let recommendations: Array<Record<SupportedLocale, string>> = [];
  
  if (bmi < 16) {
    interpretation = {
      'zh-TW': '嚴重體重不足：BMI 過低可能表示營養不良或其他健康問題，建議立即諮詢醫師。',
      'en': 'Severely underweight: Very low BMI may indicate malnutrition or other health issues. Immediate medical consultation recommended.',
      'ja': '重度の低体重：BMIが非常に低い場合、栄養失調や他の健康問題を示している可能性があります。直ちに医師に相談することをお勧めします。'
    };
    
    recommendations = [
      {
        'zh-TW': '立即諮詢醫師或營養師',
        'en': 'Consult a doctor or nutritionist immediately',
        'ja': '直ちに医師または栄養士に相談'
      },
      {
        'zh-TW': '評估是否有潛在疾病',
        'en': 'Assess for underlying medical conditions',
        'ja': '潜在的な疾患の評価'
      },
      {
        'zh-TW': '制定營養補充計劃',
        'en': 'Develop a nutritional supplementation plan',
        'ja': '栄養補給計画の策定'
      }
    ];
  } else if (bmi < 18.5) {
    interpretation = {
      'zh-TW': '體重不足：建議增加營養攝取，適當增重以達到健康體重範圍。',
      'en': 'Underweight: Recommend increasing nutritional intake and appropriate weight gain to reach healthy weight range.',
      'ja': '低体重：栄養摂取を増やし、健康的な体重範囲に達するために適切な体重増加をお勧めします。'
    };
    
    recommendations = [
      {
        'zh-TW': '諮詢營養師制定增重計劃',
        'en': 'Consult nutritionist for weight gain plan',
        'ja': '栄養士に相談して体重増加計画を立てる'
      },
      {
        'zh-TW': '增加健康的高熱量食物',
        'en': 'Increase healthy high-calorie foods',
        'ja': '健康的な高カロリー食品を増やす'
      },
      {
        'zh-TW': '定期監測體重變化',
        'en': 'Monitor weight changes regularly',
        'ja': '体重変化を定期的に監視'
      }
    ];
  } else if (bmi < 25) {
    interpretation = {
      'zh-TW': '正常體重：恭喜！您的體重在健康範圍內，請維持均衡飲食和規律運動。',
      'en': 'Normal weight: Congratulations! Your weight is in the healthy range. Maintain balanced diet and regular exercise.',
      'ja': '正常体重：おめでとうございます！あなたの体重は健康的な範囲内です。バランスの取れた食事と定期的な運動を維持してください。'
    };
    
    recommendations = [
      {
        'zh-TW': '維持均衡飲食',
        'en': 'Maintain balanced diet',
        'ja': 'バランスの取れた食事を維持'
      },
      {
        'zh-TW': '保持規律運動習慣',
        'en': 'Keep regular exercise routine',
        'ja': '定期的な運動習慣を保つ'
      },
      {
        'zh-TW': '定期健康檢查',
        'en': 'Regular health check-ups',
        'ja': '定期的な健康診断'
      }
    ];
  } else if (bmi < 30) {
    interpretation = {
      'zh-TW': '體重過重：建議透過飲食控制和增加運動來減重，降低慢性疾病風險。',
      'en': 'Overweight: Recommend weight loss through diet control and increased exercise to reduce chronic disease risk.',
      'ja': '過体重：食事制限と運動量の増加による減量をお勧めし、慢性疾患のリスクを軽減します。'
    };
    
    recommendations = [
      {
        'zh-TW': '制定健康的減重計劃',
        'en': 'Develop healthy weight loss plan',
        'ja': '健康的な減量計画を立てる'
      },
      {
        'zh-TW': '增加身體活動量',
        'en': 'Increase physical activity',
        'ja': '身体活動量を増やす'
      },
      {
        'zh-TW': '監測血壓、血糖等指標',
        'en': 'Monitor blood pressure, glucose levels',
        'ja': '血圧、血糖値などを監視'
      }
    ];
  } else if (bmi < 35) {
    interpretation = {
      'zh-TW': '輕度肥胖：建議積極減重並諮詢醫師，評估相關健康風險和治療選項。',
      'en': 'Class I Obesity: Recommend active weight loss and medical consultation to assess health risks and treatment options.',
      'ja': 'クラスI肥満：積極的な減量と医師への相談をお勧めし、健康リスクと治療選択肢を評価します。'
    };
    
    recommendations = [
      {
        'zh-TW': '諮詢醫師評估健康風險',
        'en': 'Consult doctor to assess health risks',
        'ja': '医師に相談して健康リスクを評価'
      },
      {
        'zh-TW': '考慮專業減重計劃',
        'en': 'Consider professional weight loss program',
        'ja': '専門的な減量プログラムを検討'
      },
      {
        'zh-TW': '檢查代謝症候群指標',
        'en': 'Check metabolic syndrome markers',
        'ja': 'メタボリックシンドロームの指標をチェック'
      }
    ];
  } else if (bmi < 40) {
    interpretation = {
      'zh-TW': '中度肥胖：強烈建議醫療介入，可能需要藥物治療或其他醫療協助。',
      'en': 'Class II Obesity: Strongly recommend medical intervention, may need medication or other medical assistance.',
      'ja': 'クラスII肥満：医療介入を強くお勧めし、薬物治療やその他の医療支援が必要な場合があります。'
    };
    
    recommendations = [
      {
        'zh-TW': '尋求專業醫療協助',
        'en': 'Seek professional medical help',
        'ja': '専門的な医療支援を求める'
      },
      {
        'zh-TW': '評估減重手術適應症',
        'en': 'Evaluate bariatric surgery candidacy',
        'ja': '減量手術の適応を評価'
      },
      {
        'zh-TW': '密切監測併發症',
        'en': 'Closely monitor complications',
        'ja': '合併症を密接に監視'
      }
    ];
  } else {
    interpretation = {
      'zh-TW': '重度肥胖：需要立即且積極的醫療介入，包括考慮減重手術等治療選項。',
      'en': 'Class III Obesity: Requires immediate and aggressive medical intervention, including consideration of bariatric surgery.',
      'ja': 'クラスIII肥満：減量手術の検討を含む、即座かつ積極的な医療介入が必要です。'
    };
    
    recommendations = [
      {
        'zh-TW': '立即尋求專科醫師治療',
        'en': 'Seek immediate specialist treatment',
        'ja': '直ちに専門医の治療を求める'
      },
      {
        'zh-TW': '評估減重手術選項',
        'en': 'Evaluate bariatric surgery options',
        'ja': '減量手術の選択肢を評価'
      },
      {
        'zh-TW': '全面健康風險評估',
        'en': 'Comprehensive health risk assessment',
        'ja': '包括的な健康リスク評価'
      }
    ];
  }
  
  // 添加年齡特定建議
  if (age && age >= 65) {
    recommendations.push({
      'zh-TW': '考慮老年人特殊營養需求',
      'en': 'Consider special nutritional needs for elderly',
      'ja': '高齢者の特別な栄養ニーズを考慮'
    });
  }
  
  // 添加性別特定建議
  if (gender === 'female') {
    recommendations.push({
      'zh-TW': '注意骨質健康和鐵質攝取',
      'en': 'Pay attention to bone health and iron intake',
      'ja': '骨の健康と鉄分摂取に注意'
    });
  }
  
  return { interpretation, recommendations };
}

/**
 * 獲取帶有當前狀態的 BMI 分類
 */
function getBMICategoriesWithStatus(bmi: number) {
  return [
    { range: '< 16.0', category: '嚴重體重不足', isActive: bmi < 16 },
    { range: '16.0 - 18.4', category: '體重不足', isActive: bmi >= 16 && bmi < 18.5 },
    { range: '18.5 - 24.9', category: '正常體重', isActive: bmi >= 18.5 && bmi < 25 },
    { range: '25.0 - 29.9', category: '體重過重', isActive: bmi >= 25 && bmi < 30 },
    { range: '30.0 - 34.9', category: '輕度肥胖', isActive: bmi >= 30 && bmi < 35 },
    { range: '35.0 - 39.9', category: '中度肥胖', isActive: bmi >= 35 && bmi < 40 },
    { range: '≥ 40.0', category: '重度肥胖', isActive: bmi >= 40 }
  ];
}