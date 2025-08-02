/**
 * BMI Calculator Implementation
 * 
 * Calculates Body Mass Index (BMI) and provides health risk assessment
 * based on WHO and Taiwan Ministry of Health standards.
 */

import type { 
  CalculatorInputs, 
  CalculationResult, 
  ValidationResult,
  SupportedLocale 
} from '../../../types/calculator.js';

// ============================================================================
// BMI Calculation Logic
// ============================================================================

/**
 * Calculate BMI and provide health assessment
 */
export function calculate(inputs: CalculatorInputs): CalculationResult {
  const weight = Number(inputs.weight);
  const height = Number(inputs.height);
  const age = inputs.age ? Number(inputs.age) : undefined;
  const gender = inputs.gender as string;

  // Convert height from cm to meters
  const heightInMeters = height / 100;
  
  // Calculate BMI
  const bmi = weight / (heightInMeters * heightInMeters);
  
  // Determine BMI category and risk level
  const { category, risk, interpretation } = getBMICategory(bmi, age, gender);
  
  // Generate recommendations
  const recommendations = getRecommendations(bmi, age, gender);
  
  return {
    primaryValue: Math.round(bmi * 10) / 10, // Round to 1 decimal place
    primaryUnit: 'kg/m²',
    secondaryValues: {
      category,
      risk,
      weight: weight,
      height: height,
      heightInMeters: Math.round(heightInMeters * 100) / 100
    },
    interpretation: {
      'zh-TW': interpretation['zh-TW'],
      'en': interpretation['en'],
      'ja': interpretation['ja']
    },
    recommendations: recommendations.map(rec => ({
      'zh-TW': rec['zh-TW'],
      'en': rec['en'],
      'ja': rec['ja']
    })),
    riskLevel: risk,
    metadata: {
      calculationSteps: [
        {
          description: '身高轉換',
          value: `${height} cm = ${heightInMeters} m`,
          formula: 'height (m) = height (cm) / 100'
        },
        {
          description: 'BMI 計算',
          value: `${weight} ÷ (${heightInMeters})² = ${Math.round(bmi * 10) / 10}`,
          formula: 'BMI = weight (kg) / height (m)²'
        }
      ],
      references: [
        'WHO Expert Committee on Physical Status (1995)',
        'Taiwan Ministry of Health and Welfare BMI Standards'
      ],
      lastCalculated: new Date().toISOString()
    }
  };
}

/**
 * Validate calculator inputs
 */
export function validate(inputs: CalculatorInputs): ValidationResult {
  const errors = [];
  
  // Validate weight
  const weight = Number(inputs.weight);
  if (!inputs.weight || isNaN(weight)) {
    errors.push({
      field: 'weight',
      message: '請輸入有效的體重',
      type: 'required'
    });
  } else if (weight < 20 || weight > 300) {
    errors.push({
      field: 'weight',
      message: '體重必須在 20-300 公斤之間',
      type: 'range'
    });
  }
  
  // Validate height
  const height = Number(inputs.height);
  if (!inputs.height || isNaN(height)) {
    errors.push({
      field: 'height',
      message: '請輸入有效的身高',
      type: 'required'
    });
  } else if (height < 100 || height > 250) {
    errors.push({
      field: 'height',
      message: '身高必須在 100-250 公分之間',
      type: 'range'
    });
  }
  
  // Validate age (optional)
  if (inputs.age) {
    const age = Number(inputs.age);
    if (isNaN(age) || age < 2 || age > 120) {
      errors.push({
        field: 'age',
        message: '年齡必須在 2-120 歲之間',
        type: 'range'
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Format calculation result for display
 */
export function formatResult(result: CalculationResult, locale: SupportedLocale = 'zh-TW') {
  const bmi = result.primaryValue;
  const category = result.secondaryValues?.category || '';
  
  return {
    displayValue: `${bmi} ${result.primaryUnit}`,
    category: category,
    description: result.interpretation?.[locale] || result.interpretation?.['zh-TW'] || '',
    recommendations: result.recommendations?.map(rec => 
      rec[locale] || rec['zh-TW'] || ''
    ) || []
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine BMI category and risk level based on WHO and Taiwan standards
 */
function getBMICategory(bmi: number, age?: number, gender?: string) {
  let category: string;
  let risk: 'low' | 'moderate' | 'high' | 'critical';
  let interpretation: Record<SupportedLocale, string>;
  
  if (bmi < 16) {
    category = '嚴重體重不足';
    risk = 'critical';
    interpretation = {
      'zh-TW': '嚴重體重不足：BMI 過低可能表示營養不良或其他健康問題，建議立即諮詢醫師。',
      'en': 'Severely underweight: Very low BMI may indicate malnutrition or other health issues. Immediate medical consultation recommended.',
      'ja': '重度の低体重：BMIが非常に低い場合、栄養失調や他の健康問題を示している可能性があります。直ちに医師に相談することをお勧めします。'
    };
  } else if (bmi < 18.5) {
    category = '體重不足';
    risk = 'moderate';
    interpretation = {
      'zh-TW': '體重不足：建議增加營養攝取，適當增重以達到健康體重範圍。',
      'en': 'Underweight: Recommend increasing nutritional intake and appropriate weight gain to reach healthy weight range.',
      'ja': '低体重：栄養摂取を増やし、健康的な体重範囲に達するために適切な体重増加をお勧めします。'
    };
  } else if (bmi < 25) {
    category = '正常體重';
    risk = 'low';
    interpretation = {
      'zh-TW': '正常體重：恭喜！您的體重在健康範圍內，請維持均衡飲食和規律運動。',
      'en': 'Normal weight: Congratulations! Your weight is in the healthy range. Maintain balanced diet and regular exercise.',
      'ja': '正常体重：おめでとうございます！あなたの体重は健康的な範囲内です。バランスの取れた食事と定期的な運動を維持してください。'
    };
  } else if (bmi < 30) {
    category = '體重過重';
    risk = 'moderate';
    interpretation = {
      'zh-TW': '體重過重：建議透過飲食控制和增加運動來減重，降低慢性疾病風險。',
      'en': 'Overweight: Recommend weight loss through diet control and increased exercise to reduce chronic disease risk.',
      'ja': '過体重：食事制限と運動量の増加による減量をお勧めし、慢性疾患のリスクを軽減します。'
    };
  } else if (bmi < 35) {
    category = '輕度肥胖';
    risk = 'high';
    interpretation = {
      'zh-TW': '輕度肥胖：建議積極減重並諮詢醫師，評估相關健康風險和治療選項。',
      'en': 'Class I Obesity: Recommend active weight loss and medical consultation to assess health risks and treatment options.',
      'ja': 'クラスI肥満：積極的な減量と医師への相談をお勧めし、健康リスクと治療選択肢を評価します。'
    };
  } else if (bmi < 40) {
    category = '中度肥胖';
    risk = 'high';
    interpretation = {
      'zh-TW': '中度肥胖：強烈建議醫療介入，可能需要藥物治療或其他醫療協助。',
      'en': 'Class II Obesity: Strongly recommend medical intervention, may need medication or other medical assistance.',
      'ja': 'クラスII肥満：医療介入を強くお勧めし、薬物治療やその他の医療支援が必要な場合があります。'
    };
  } else {
    category = '重度肥胖';
    risk = 'critical';
    interpretation = {
      'zh-TW': '重度肥胖：需要立即且積極的醫療介入，包括考慮減重手術等治療選項。',
      'en': 'Class III Obesity: Requires immediate and aggressive medical intervention, including consideration of bariatric surgery.',
      'ja': 'クラスIII肥満：減量手術の検討を含む、即座かつ積極的な医療介入が必要です。'
    };
  }
  
  return { category, risk, interpretation };
}

/**
 * Generate personalized recommendations based on BMI, age, and gender
 */
function getRecommendations(bmi: number, age?: number, gender?: string): Array<Record<SupportedLocale, string>> {
  const recommendations: Array<Record<SupportedLocale, string>> = [];
  
  if (bmi < 16) {
    recommendations.push({
      'zh-TW': '立即諮詢醫師或營養師',
      'en': 'Consult a doctor or nutritionist immediately',
      'ja': '直ちに医師または栄養士に相談'
    });
    recommendations.push({
      'zh-TW': '評估是否有潛在疾病',
      'en': 'Assess for underlying medical conditions',
      'ja': '潜在的な疾患の評価'
    });
    recommendations.push({
      'zh-TW': '制定營養補充計劃',
      'en': 'Develop a nutritional supplementation plan',
      'ja': '栄養補給計画の策定'
    });
  } else if (bmi < 18.5) {
    recommendations.push({
      'zh-TW': '諮詢營養師制定增重計劃',
      'en': 'Consult nutritionist for weight gain plan',
      'ja': '栄養士に相談して体重増加計画を立てる'
    });
    recommendations.push({
      'zh-TW': '增加健康的高熱量食物',
      'en': 'Increase healthy high-calorie foods',
      'ja': '健康的な高カロリー食品を増やす'
    });
    recommendations.push({
      'zh-TW': '定期監測體重變化',
      'en': 'Monitor weight changes regularly',
      'ja': '体重変化を定期的に監視'
    });
  } else if (bmi < 25) {
    recommendations.push({
      'zh-TW': '維持均衡飲食',
      'en': 'Maintain balanced diet',
      'ja': 'バランスの取れた食事を維持'
    });
    recommendations.push({
      'zh-TW': '保持規律運動習慣',
      'en': 'Keep regular exercise routine',
      'ja': '定期的な運動習慣を保つ'
    });
    recommendations.push({
      'zh-TW': '定期健康檢查',
      'en': 'Regular health check-ups',
      'ja': '定期的な健康診断'
    });
  } else if (bmi < 30) {
    recommendations.push({
      'zh-TW': '制定健康的減重計劃',
      'en': 'Develop healthy weight loss plan',
      'ja': '健康的な減量計画を立てる'
    });
    recommendations.push({
      'zh-TW': '增加身體活動量',
      'en': 'Increase physical activity',
      'ja': '身体活動量を増やす'
    });
    recommendations.push({
      'zh-TW': '監測血壓、血糖等指標',
      'en': 'Monitor blood pressure, glucose levels',
      'ja': '血圧、血糖値などを監視'
    });
  } else if (bmi < 35) {
    recommendations.push({
      'zh-TW': '諮詢醫師評估健康風險',
      'en': 'Consult doctor to assess health risks',
      'ja': '医師に相談して健康リスクを評価'
    });
    recommendations.push({
      'zh-TW': '考慮專業減重計劃',
      'en': 'Consider professional weight loss program',
      'ja': '専門的な減量プログラムを検討'
    });
    recommendations.push({
      'zh-TW': '檢查代謝症候群指標',
      'en': 'Check metabolic syndrome markers',
      'ja': 'メタボリックシンドロームの指標をチェック'
    });
  } else if (bmi < 40) {
    recommendations.push({
      'zh-TW': '尋求專業醫療協助',
      'en': 'Seek professional medical help',
      'ja': '専門的な医療支援を求める'
    });
    recommendations.push({
      'zh-TW': '評估減重手術適應症',
      'en': 'Evaluate bariatric surgery candidacy',
      'ja': '減量手術の適応を評価'
    });
    recommendations.push({
      'zh-TW': '密切監測併發症',
      'en': 'Closely monitor complications',
      'ja': '合併症を密接に監視'
    });
  } else {
    recommendations.push({
      'zh-TW': '立即尋求專科醫師治療',
      'en': 'Seek immediate specialist treatment',
      'ja': '直ちに専門医の治療を求める'
    });
    recommendations.push({
      'zh-TW': '評估減重手術選項',
      'en': 'Evaluate bariatric surgery options',
      'ja': '減量手術の選択肢を評価'
    });
    recommendations.push({
      'zh-TW': '全面健康風險評估',
      'en': 'Comprehensive health risk assessment',
      'ja': '包括的な健康リスク評価'
    });
  }
  
  // Add age-specific recommendations
  if (age && age >= 65) {
    recommendations.push({
      'zh-TW': '考慮老年人特殊營養需求',
      'en': 'Consider special nutritional needs for elderly',
      'ja': '高齢者の特別な栄養ニーズを考慮'
    });
  }
  
  // Add gender-specific recommendations
  if (gender === 'female') {
    recommendations.push({
      'zh-TW': '注意骨質健康和鐵質攝取',
      'en': 'Pay attention to bone health and iron intake',
      'ja': '骨の健康と鉄分摂取に注意'
    });
  }
  
  return recommendations;
}

// Export default calculation function for backward compatibility
export default calculate;