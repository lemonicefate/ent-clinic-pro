/**
 * Amoxicillin/Clavulanate Dose Calculator Implementation
 * 
 * Calculates optimal tablet combinations for pediatric Amoxicillin/Clavulanate dosing
 * based on weight, dose target, and treatment duration.
 */

import type { 
  CalculatorInputs, 
  CalculationResult, 
  ValidationResult,
  SupportedLocale 
} from '../../../types/calculator.js';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface TabletCombination {
  numCuram: number;      // Curam 625mg tablets (500mg Amox + 125mg Clav)
  numAmox500: number;    // Amoxicillin 500mg tablets
  numAmox250: number;    // Amoxicillin 250mg tablets
  totalAmox: number;     // Total Amoxicillin (mg)
  totalCla: number;      // Total Clavulanate (mg)
  finalAmoDose?: number; // Final Amoxicillin dose (mg/kg/day)
  doseError?: number;    // Dose error from target
  ratio?: number;        // Amox:Clav ratio
  ratioError?: number;   // Ratio error from ideal 14:1
}

// ============================================================================
// Main Calculation Function
// ============================================================================

/**
 * Calculate optimal Amoxicillin/Clavulanate tablet combination
 */
export function calculate(inputs: CalculatorInputs): CalculationResult {
  const weight = Number(inputs.weight);
  const doseTarget = inputs.doseTarget as string;
  const days = Number(inputs.days);
  const frequency = Number(inputs.frequency || 3); // Default to TID

  // Validate inputs
  const validation = validate(inputs);
  if (!validation.isValid) {
    throw new Error(`Invalid inputs: ${validation.errors.map(e => e.message).join(', ')}`);
  }

  // Calculate best combination
  const result = calculateBestCombination(weight, doseTarget, days, frequency);
  
  if (!result) {
    return {
      primaryValue: 0,
      primaryUnit: 'combination',
      secondaryValues: {
        error: 'no_safe_combination'
      },
      interpretation: {
        'zh-TW': '找不到符合安全規範的組合，請諮詢醫師或藥師。',
        'en': 'No safe combination found, please consult with physician or pharmacist.',
        'ja': '安全な組み合わせが見つかりません。医師または薬剤師にご相談ください。'
      },
      recommendations: [{
        'zh-TW': '請諮詢您的醫師或藥師以獲得替代治療方案',
        'en': 'Please consult your physician or pharmacist for alternative treatment options',
        'ja': '代替治療選択肢について医師または薬剤師にご相談ください'
      }],
      riskLevel: 'high',
      metadata: {
        calculationSteps: [
          {
            description: '安全性檢查',
            value: '未找到符合安全限制的組合',
            formula: 'Clavulanate dose ≤ 10.0 mg/kg/day'
          }
        ],
        references: ['Pediatric Antimicrobial Guidelines'],
        lastCalculated: new Date().toISOString()
      }
    };
  }

  // Generate recommendations
  const recommendations = generateRecommendations(result, days, frequency, weight);
  const totalPills = result.numCuram + result.numAmox500 + result.numAmox250;

  return {
    primaryValue: totalPills,
    primaryUnit: 'tablets',
    secondaryValues: {
      numCuram: result.numCuram,
      numAmox500: result.numAmox500,
      numAmox250: result.numAmox250,
      totalAmox: result.totalAmox,
      totalCla: result.totalCla,
      finalAmoDose: result.finalAmoDose,
      ratio: result.ratio,
      days: days,
      frequency: frequency,
      weight: weight
    },
    interpretation: {
      'zh-TW': `建議使用 ${result.numCuram} 顆 Curam 625mg、${result.numAmox500} 顆 Amoxicillin 500mg、${result.numAmox250} 顆 Amoxicillin 250mg，達到 ${result.finalAmoDose?.toFixed(1)} mg/kg/day 的 Amoxicillin 劑量。`,
      'en': `Recommended: ${result.numCuram} Curam 625mg, ${result.numAmox500} Amoxicillin 500mg, ${result.numAmox250} Amoxicillin 250mg tablets, achieving ${result.finalAmoDose?.toFixed(1)} mg/kg/day Amoxicillin dose.`,
      'ja': `推奨：Curam 625mg ${result.numCuram}錠、アモキシシリン 500mg ${result.numAmox500}錠、アモキシシリン 250mg ${result.numAmox250}錠で、アモキシシリン用量 ${result.finalAmoDose?.toFixed(1)} mg/kg/day を達成。`
    },
    recommendations,
    riskLevel: 'low',
    metadata: {
      calculationSteps: [
        {
          description: '目標劑量設定',
          value: `${doseTarget === 'low' ? '45' : '85'} mg/kg/day`,
          formula: 'Target daily Amoxicillin dose'
        },
        {
          description: '最佳組合搜尋',
          value: `${totalPills} 顆藥錠`,
          formula: 'Optimization algorithm with safety constraints'
        },
        {
          description: '最終劑量',
          value: `${result.finalAmoDose?.toFixed(1)} mg/kg/day`,
          formula: 'Total Amoxicillin / (days × weight)'
        },
        {
          description: 'Amox:Clav 比例',
          value: result.ratio === Infinity ? 'N/A' : `${result.ratio?.toFixed(1)}:1`,
          formula: 'Total Amoxicillin / Total Clavulanate'
        }
      ],
      references: [
        'Pediatric Antimicrobial Stewardship Guidelines',
        'Amoxicillin/Clavulanate Dosing Recommendations'
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
  } else if (weight < 1 || weight > 100) {
    errors.push({
      field: 'weight',
      message: '體重必須在 1-100 公斤之間',
      type: 'range'
    });
  }
  
  // Validate dose target
  if (!inputs.doseTarget || !['low', 'high'].includes(inputs.doseTarget as string)) {
    errors.push({
      field: 'doseTarget',
      message: '請選擇劑量目標',
      type: 'required'
    });
  }
  
  // Validate days
  const days = Number(inputs.days);
  if (!inputs.days || isNaN(days)) {
    errors.push({
      field: 'days',
      message: '請選擇治療天數',
      type: 'required'
    });
  } else if (days < 1 || days > 5) {
    errors.push({
      field: 'days',
      message: '治療天數必須在 1-5 天之間',
      type: 'range'
    });
  }

  // Validate frequency
  const frequency = Number(inputs.frequency);
  if (!inputs.frequency || isNaN(frequency)) {
    errors.push({
      field: 'frequency',
      message: '請選擇用藥頻次',
      type: 'required'
    });
  } else if (![2, 3, 4].includes(frequency)) {
    errors.push({
      field: 'frequency',
      message: '用藥頻次必須為 2、3 或 4 次',
      type: 'range'
    });
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
  if (result.secondaryValues?.error === 'no_safe_combination') {
    return {
      displayValue: '無安全組合',
      category: '錯誤',
      description: result.interpretation?.[locale] || result.interpretation?.['zh-TW'] || '',
      recommendations: result.recommendations?.map(rec => 
        rec[locale] || rec['zh-TW'] || ''
      ) || []
    };
  }

  const totalPills = result.primaryValue;
  const numCuram = result.secondaryValues?.numCuram || 0;
  const numAmox500 = result.secondaryValues?.numAmox500 || 0;
  const numAmox250 = result.secondaryValues?.numAmox250 || 0;
  
  return {
    displayValue: `${totalPills} 顆藥錠`,
    category: `${numCuram}顆 Curam + ${numAmox500}顆 Amox500 + ${numAmox250}顆 Amox250`,
    description: result.interpretation?.[locale] || result.interpretation?.['zh-TW'] || '',
    recommendations: result.recommendations?.map(rec => 
      rec[locale] || rec['zh-TW'] || ''
    ) || []
  };
}

// ============================================================================
// Core Algorithm Implementation
// ============================================================================

/**
 * Calculate the best tablet combination using optimization algorithm
 * Modified to choose only one type of Amoxicillin (500mg OR 250mg, not both)
 * and ensure Amox:Clav ratio is between 4:1 and 14:1
 */
function calculateBestCombination(weight: number, doseTarget: string, days: number, frequency: number): TabletCombination | null {
  const targetDailyAmoDose = doseTarget === 'low' ? 45 : 85; // mg/kg/day
  const allSafeCombos: TabletCombination[] = [];

  const maxCuram = 20; // Search range
  const maxAmox = 50;

  // Step 1: Generate all safe combinations with ratio constraints
  for (let numCuram = 0; numCuram <= maxCuram; numCuram++) {
    // Path A: Using Amox 500mg only
    for (let numAmox500 = 0; numAmox500 <= maxAmox; numAmox500++) {
      const combo: TabletCombination = { 
        numCuram, 
        numAmox500, 
        numAmox250: 0,
        totalAmox: 0,
        totalCla: 0
      };
      checkAndAddSolutionWithRatio(combo, weight, days, allSafeCombos);
    }
    
    // Path B: Using Amox 250mg only
    for (let numAmox250 = 0; numAmox250 <= maxAmox * 2; numAmox250++) {
      const combo: TabletCombination = { 
        numCuram, 
        numAmox500: 0, 
        numAmox250,
        totalAmox: 0,
        totalCla: 0
      };
      checkAndAddSolutionWithRatio(combo, weight, days, allSafeCombos);
    }
  }

  if (allSafeCombos.length === 0) {
    return null; // No safe combination found
  }

  // Step 2: Calculate dose and ratio errors for each safe combination
  allSafeCombos.forEach(combo => {
    combo.finalAmoDose = (combo.totalAmox / days) / weight;
    combo.doseError = Math.abs(combo.finalAmoDose - targetDailyAmoDose);
    combo.ratio = combo.totalCla > 0 ? combo.totalAmox / combo.totalCla : Infinity;
    combo.ratioError = combo.totalCla > 0 ? Math.abs(combo.ratio - 14) : 0;
  });

  // Step 3: Find minimum dose error (dose priority)
  let minDoseError = Math.min(...allSafeCombos.map(c => c.doseError!));

  // Step 4: Filter combinations with minimum dose error
  const bestDoseCombos = allSafeCombos.filter(c => 
    Math.abs(c.doseError! - minDoseError) < 0.00001 // Avoid floating point issues
  );

  if (bestDoseCombos.length === 0) {
    return allSafeCombos[0]; // Fallback, should not happen
  }

  // Step 5: Among best dose combinations, find minimum ratio error
  let minRatioError = Math.min(...bestDoseCombos.map(c => c.ratioError!));
  const bestRatioCombos = bestDoseCombos.filter(c => 
    Math.abs(c.ratioError! - minRatioError) < 0.00001
  );

  // Step 6: Among best ratio combinations, choose the one with fewest pills
  let bestSolution = bestRatioCombos[0];
  for (let i = 1; i < bestRatioCombos.length; i++) {
    const currentPills = bestRatioCombos[i].numCuram + bestRatioCombos[i].numAmox500 + bestRatioCombos[i].numAmox250;
    const bestPills = bestSolution.numCuram + bestSolution.numAmox500 + bestSolution.numAmox250;
    if (currentPills < bestPills) {
      bestSolution = bestRatioCombos[i];
    }
  }

  return bestSolution;
}

/**
 * Check if combination is safe and add to solutions list
 */
function checkAndAddSolution(
  combo: TabletCombination, 
  weight: number, 
  days: number, 
  allSafeCombos: TabletCombination[]
): void {
  const totalAmox = combo.numCuram * 500 + combo.numAmox500 * 500 + combo.numAmox250 * 250;
  const totalCla = combo.numCuram * 125;

  // Exclude invalid combinations with no medication
  if (totalAmox === 0 && totalCla === 0) return;

  const dailyClaDose = (totalCla > 0) ? (totalCla / days) / weight : 0;

  // Safety constraint: Clavulanate dose must be safe
  if (dailyClaDose <= 10.0) {
    combo.totalAmox = totalAmox;
    combo.totalCla = totalCla;
    allSafeCombos.push(combo);
  }
}

/**
 * Check if combination is safe with ratio constraints and add to solutions list
 */
function checkAndAddSolutionWithRatio(
  combo: TabletCombination, 
  weight: number, 
  days: number, 
  allSafeCombos: TabletCombination[]
): void {
  const totalAmox = combo.numCuram * 500 + combo.numAmox500 * 500 + combo.numAmox250 * 250;
  const totalCla = combo.numCuram * 125;

  // Exclude invalid combinations with no medication
  if (totalAmox === 0 && totalCla === 0) return;

  const dailyClaDose = (totalCla > 0) ? (totalCla / days) / weight : 0;
  const ratio = totalCla > 0 ? totalAmox / totalCla : Infinity;

  // Safety constraint: Clavulanate dose must be safe
  // Ratio constraint: Amox:Clav ratio must be between 4:1 and 14:1 (if Clavulanate is present)
  const ratioValid = totalCla === 0 || (ratio >= 4 && ratio <= 14);

  if (dailyClaDose <= 10.0 && ratioValid) {
    combo.totalAmox = totalAmox;
    combo.totalCla = totalCla;
    allSafeCombos.push(combo);
  }
}

/**
 * Generate personalized recommendations
 */
function generateRecommendations(
  result: TabletCombination, 
  days: number, 
  frequency: number,
  weight: number
): Array<Record<SupportedLocale, string>> {
  const recommendations: Array<Record<SupportedLocale, string>> = [];
  const totalPills = result.numCuram + result.numAmox500 + result.numAmox250;
  const totalDoses = days * frequency;
  
  // Get frequency label
  const getFrequencyLabel = (freq: number) => {
    switch (freq) {
      case 2: return { zh: '每日兩次', en: 'BID dosing', ja: '1日2回服用' };
      case 3: return { zh: '每日三次', en: 'TID dosing', ja: '1日3回服用' };
      case 4: return { zh: '每日四次', en: 'QID dosing', ja: '1日4回服用' };
      default: return { zh: `每日${freq}次`, en: `${freq} times daily`, ja: `1日${freq}回服用` };
    }
  };
  
  const freqLabel = getFrequencyLabel(frequency);

  // Dispensing instruction
  recommendations.push({
    'zh-TW': `將總共 ${totalPills} 顆藥錠（${result.numCuram}顆 Curam、${result.numAmox500}顆 Amox 500、${result.numAmox250}顆 Amox 250）完全磨成粉末並均勻混合`,
    'en': `Crush and mix ${totalPills} tablets (${result.numCuram} Curam, ${result.numAmox500} Amox 500, ${result.numAmox250} Amox 250) into uniform powder`,
    'ja': `合計${totalPills}錠（Curam ${result.numCuram}錠、Amox 500 ${result.numAmox500}錠、Amox 250 ${result.numAmox250}錠）を完全に粉砕し、均一に混合する`
  });

  // Dosing instruction
  recommendations.push({
    'zh-TW': `這是 ${days} 天的總藥量，若${freqLabel.zh}服藥，請將總藥粉平均分成 ${totalDoses} 份，每份為一次的劑量`,
    'en': `This is the total medication for ${days} days. For ${freqLabel.en}, divide the powder into ${totalDoses} equal portions, each portion is one dose`,
    'ja': `これは${days}日分の総薬量です。${freqLabel.ja}の場合、総粉末を${totalDoses}等分し、各分量が1回分の用量となります`
  });

  // Safety reminder
  recommendations.push({
    'zh-TW': '請確保藥粉完全溶解後再給予兒童服用，並遵循醫師指示完成整個療程',
    'en': 'Ensure powder is completely dissolved before administration and complete the full course as prescribed',
    'ja': '粉末を完全に溶解してから小児に投与し、処方通りに全コースを完了してください'
  });

  // High dose warning if applicable
  if (result.finalAmoDose && result.finalAmoDose > 70) {
    recommendations.push({
      'zh-TW': '此為高劑量療法，請密切監測患者反應並注意可能的副作用',
      'en': 'This is high-dose therapy, monitor patient response closely and watch for potential side effects',
      'ja': 'これは高用量療法です。患者の反応を注意深く監視し、潜在的な副作用に注意してください'
    });
  }

  return recommendations;
}

// Export default calculation function for backward compatibility
export default calculate;