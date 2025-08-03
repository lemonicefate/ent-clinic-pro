/**
 * CHA2DS2-VASc 計算邏輯
 */

import { CHA2DS2VAScInputs, CHA2DS2VAScResult, getRiskCategory, SCORE_FACTORS } from './types';
import { CalculationResult, ValidationError } from '../../types';

/**
 * 驗證輸入參數
 */
export function validate(inputs: CHA2DS2VAScInputs): ValidationError[] {
  const errors: ValidationError[] = [];

  // 驗證年齡
  if (!inputs.age || inputs.age <= 0) {
    errors.push({
      field: 'age',
      message: {
        'zh-TW': '請輸入有效的年齡',
        'en': 'Please enter a valid age',
        'ja': '有効な年齢を入力してください'
      }
    });
  } else if (inputs.age < 18 || inputs.age > 120) {
    errors.push({
      field: 'age',
      message: {
        'zh-TW': '年齡必須在 18-120 歲之間',
        'en': 'Age must be between 18-120 years',
        'ja': '年齢は18-120歳の間である必要があります'
      }
    });
  }

  // 驗證性別
  if (!inputs.gender || !['male', 'female'].includes(inputs.gender)) {
    errors.push({
      field: 'gender',
      message: {
        'zh-TW': '請選擇性別',
        'en': 'Please select gender',
        'ja': '性別を選択してください'
      }
    });
  }

  return errors;
}

/**
 * 計算 CHA2DS2-VASc 評分
 */
export function calculate(inputs: CHA2DS2VAScInputs): CalculationResult<CHA2DS2VAScResult> {
  // 驗證輸入
  const validationErrors = validate(inputs);
  if (validationErrors.length > 0) {
    return {
      success: false,
      errors: validationErrors
    };
  }

  try {
    let totalScore = 0;
    const calculationSteps: Array<{
      factor: string;
      points: number;
      description: string;
    }> = [];

    // 計算各項評分
    SCORE_FACTORS.forEach(factor => {
      let points = 0;
      let description = '';

      if (factor.id === 'age') {
        points = typeof factor.points === 'function' ? factor.points(inputs) : 0;
        if (inputs.age >= 75) {
          description = `年齡 ${inputs.age} 歲 (≥75歲)`;
        } else if (inputs.age >= 65) {
          description = `年齡 ${inputs.age} 歲 (65-74歲)`;
        } else {
          description = `年齡 ${inputs.age} 歲 (<65歲)`;
        }
      } else if (factor.id === 'gender') {
        points = typeof factor.points === 'function' ? factor.points(inputs) : 0;
        description = inputs.gender === 'female' ? '女性' : '男性';
      } else {
        // 布林值欄位
        const fieldValue = inputs[factor.id as keyof CHA2DS2VAScInputs];
        if (typeof fieldValue === 'boolean' && fieldValue) {
          points = typeof factor.points === 'number' ? factor.points : 0;
          description = factor.name['zh-TW'];
        } else {
          description = `無 ${factor.name['zh-TW']}`;
        }
      }

      if (points > 0) {
        calculationSteps.push({
          factor: factor.name['zh-TW'],
          points,
          description
        });
      }

      totalScore += points;
    });

    // 獲取風險分類
    const riskCategory = getRiskCategory(totalScore);

    // 生成解釋和建議
    const interpretation = generateInterpretation(totalScore, riskCategory, inputs.gender);
    const recommendations = generateRecommendations(totalScore, riskCategory, inputs.gender);
    const anticoagulationRecommendation = generateAnticoagulationRecommendation(totalScore, inputs.gender);

    const result: CHA2DS2VAScResult = {
      score: totalScore,
      riskLevel: riskCategory.riskLevel,
      strokeRiskPerYear: riskCategory.strokeRiskPerYear,
      interpretation,
      recommendations,
      anticoagulationRecommendation,
      calculationSteps
    };

    return {
      success: true,
      result
    };

  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'general',
        message: {
          'zh-TW': '計算過程中發生錯誤，請檢查輸入值',
          'en': 'An error occurred during calculation, please check input values',
          'ja': '計算中にエラーが発生しました。入力値を確認してください'
        }
      }]
    };
  }
}

/**
 * 生成結果解釋
 */
function generateInterpretation(score: number, riskCategory: any, gender: string): string {
  const genderText = gender === 'female' ? '女性' : '男性';
  const riskText = riskCategory.description['zh-TW'];
  
  if (score === 0) {
    return `您的 CHA2DS2-VASc 評分為 ${score} 分，屬於${riskText}。年中風風險約為 ${riskCategory.strokeRiskPerYear}%。對於${genderText}患者，通常不建議抗凝治療，但仍需定期評估。`;
  } else if (score === 1) {
    if (gender === 'male') {
      return `您的 CHA2DS2-VASc 評分為 ${score} 分，屬於${riskText}。年中風風險約為 ${riskCategory.strokeRiskPerYear}%。對於男性患者，可考慮抗凝治療，需權衡出血風險。`;
    } else {
      return `您的 CHA2DS2-VASc 評分為 ${score} 分，但由於您是女性，實際風險評估需考慮性別因子。建議進一步評估其他風險因子。`;
    }
  } else {
    return `您的 CHA2DS2-VASc 評分為 ${score} 分，屬於${riskText}。年中風風險約為 ${riskCategory.strokeRiskPerYear}%。強烈建議抗凝治療，除非有禁忌症。`;
  }
}

/**
 * 生成建議
 */
function generateRecommendations(score: number, riskCategory: any, gender: string): string[] {
  const recommendations: string[] = [];

  if (score === 0) {
    recommendations.push('定期心電圖監測，確認心房顫動狀態');
    recommendations.push('控制其他心血管危險因子（血壓、血脂、血糖）');
    recommendations.push('健康生活方式：戒菸、限酒、規律運動');
    recommendations.push('每年重新評估中風風險');
    recommendations.push('如出現新的危險因子，及時重新計算評分');
  } else if (score === 1) {
    if (gender === 'male') {
      recommendations.push('考慮開始抗凝治療（如 warfarin 或 DOAC）');
      recommendations.push('評估出血風險（建議使用 HAS-BLED 評分）');
      recommendations.push('與患者討論抗凝治療的利弊');
      recommendations.push('如選擇抗凝治療，定期監測凝血功能');
    } else {
      recommendations.push('重新評估其他風險因子');
      recommendations.push('考慮進一步心血管檢查');
      recommendations.push('密切監測心房顫動狀態');
    }
    recommendations.push('積極控制可修正的危險因子');
    recommendations.push('每 6-12 個月重新評估');
  } else {
    recommendations.push('強烈建議抗凝治療（除非有禁忌症）');
    recommendations.push('選擇適當的抗凝藥物（DOAC 或 warfarin）');
    recommendations.push('評估出血風險並定期監測');
    recommendations.push('患者教育：抗凝治療的重要性和注意事項');
    recommendations.push('定期追蹤凝血功能和腎功能');
    recommendations.push('積極控制所有心血管危險因子');
    recommendations.push('每 3-6 個月重新評估風險');
  }

  return recommendations;
}

/**
 * 生成抗凝治療建議
 */
function generateAnticoagulationRecommendation(score: number, gender: string): {
  recommended: boolean;
  strength: 'not-recommended' | 'consider' | 'recommended' | 'strongly-recommended';
  reasoning: string;
} {
  if (score === 0) {
    return {
      recommended: false,
      strength: 'not-recommended',
      reasoning: '低風險患者，抗凝治療的出血風險可能超過預防中風的效益'
    };
  } else if (score === 1) {
    if (gender === 'male') {
      return {
        recommended: true,
        strength: 'consider',
        reasoning: '中等風險男性患者，可考慮抗凝治療，需個別評估出血風險'
      };
    } else {
      return {
        recommended: false,
        strength: 'consider',
        reasoning: '女性患者評分1分主要來自性別因子，需評估其他實際風險因子'
      };
    }
  } else if (score === 2) {
    return {
      recommended: true,
      strength: 'recommended',
      reasoning: '高風險患者，抗凝治療的效益明顯超過出血風險'
    };
  } else {
    return {
      recommended: true,
      strength: 'strongly-recommended',
      reasoning: '極高風險患者，強烈建議抗凝治療，除非有絕對禁忌症'
    };
  }
}

/**
 * 格式化結果
 */
export function formatResult(result: CHA2DS2VAScResult, locale: string = 'zh-TW'): string {
  const riskLevelText = {
    'low': { 'zh-TW': '低風險', 'en': 'Low Risk', 'ja': '低リスク' },
    'moderate': { 'zh-TW': '中等風險', 'en': 'Moderate Risk', 'ja': '中等度リスク' },
    'high': { 'zh-TW': '高風險', 'en': 'High Risk', 'ja': '高リスク' }
  };

  const riskText = riskLevelText[result.riskLevel][locale as keyof typeof riskLevelText[typeof result.riskLevel]] || 
                   riskLevelText[result.riskLevel]['zh-TW'];

  return `CHA2DS2-VASc: ${result.score} 分 (${riskText}, 年中風風險 ${result.strokeRiskPerYear}%)`;
}