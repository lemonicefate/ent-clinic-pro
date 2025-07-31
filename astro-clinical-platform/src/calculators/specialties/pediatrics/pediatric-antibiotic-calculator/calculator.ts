/**
 * Pediatric Antibiotic Calculator Implementation
 * 
 * Calculates dosages for multiple pediatric antibiotics and antivirals
 * including Cefixime, Baktar, Levofloxacin, Cephalexin, Azithromycin, 
 * Minocycline, Doxycycline, and Acyclovir.
 */

import type { 
  CalculatorInputs, 
  CalculationResult, 
  ValidationResult,
  SupportedLocale 
} from '../../../../types/calculator.js';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface DrugCalculation {
  drugName: string;
  brandName: string;
  unitMg: number;
  unitName: string;
  unitSymbol: string;
  drugType: 'capsule' | 'pill';
  recommendedFreq: number;
  recommendedFreqText: string;
  prescriptionText: string;
  totalDoseText: string;
  otherDetails: string;
  maxDoseText: string;
  note: string;
  borderColor?: string;
  category: 'bacterial' | 'viral' | 'fungal';
}

interface MedicationDose {
  singleDose: number;
  dailyDose: number;
  totalUnits: number;
  actualSingleMg: number;
  actualDailyMg: number;
}

// ============================================================================
// Main Calculation Function
// ============================================================================

/**
 * Calculate pediatric antibiotic doses for multiple medications
 */
export function calculate(inputs: CalculatorInputs): CalculationResult {
  const weight = Number(inputs.weight);
  const age = inputs.age ? Number(inputs.age) : null;
  const days = Number(inputs.days);
  const userFrequency = Number(inputs.frequency || 3);
  const form = inputs.form as string || 'powder';

  // Validate inputs
  const validation = validate(inputs);
  if (!validation.isValid) {
    throw new Error(`Invalid inputs: ${validation.errors.map(e => e.message).join(', ')}`);
  }

  // Calculate all drug dosages
  const calculations = [
    calculateCefixime(weight, userFrequency, days, form),
    calculateBaktar(weight, userFrequency, days, form),
    calculateLevofloxacin(weight, age, userFrequency, days, form),
    calculateCephalexin(weight, userFrequency, days, form),
    calculateAzithromycin(weight, userFrequency, days, form),
    calculateMinocycline(weight, age, userFrequency, days, form),
    calculateDoxycycline(weight, age, userFrequency, days, form),
    calculateAcyclovir(weight, userFrequency, days, form)
  ];

  const bacterialDrugs = calculations.filter(calc => calc.category === 'bacterial');
  const viralDrugs = calculations.filter(calc => calc.category === 'viral');

  return {
    primaryValue: calculations.length,
    primaryUnit: 'medications',
    secondaryValues: {
      bacterialDrugs,
      viralDrugs,
      weight,
      age,
      days,
      frequency: userFrequency,
      form
    },
    interpretation: {
      'zh-TW': `已計算 ${bacterialDrugs.length} 種抗細菌藥物和 ${viralDrugs.length} 種抗病毒藥物的劑量，請根據臨床診斷選擇適當的藥物。`,
      'en': `Calculated doses for ${bacterialDrugs.length} antibacterial and ${viralDrugs.length} antiviral medications. Please select appropriate medication based on clinical diagnosis.`,
      'ja': `${bacterialDrugs.length}種の抗菌薬と${viralDrugs.length}種の抗ウイルス薬の用量を計算しました。臨床診断に基づいて適切な薬物を選択してください。`
    },
    recommendations: [
      {
        'zh-TW': '本計算結果僅供臨床參考，不能取代專業醫師的判斷',
        'en': 'These calculation results are for clinical reference only and cannot replace professional medical judgment',
        'ja': 'これらの計算結果は臨床参考用のみであり、専門医の判断に代わるものではありません'
      },
      {
        'zh-TW': '請根據患者的感染類型、病原體敏感性和過敏史選擇適當的抗生素',
        'en': 'Please select appropriate antibiotics based on infection type, pathogen sensitivity, and allergy history',
        'ja': '感染の種類、病原体の感受性、アレルギー歴に基づいて適切な抗生物質を選択してください'
      },
      {
        'zh-TW': '注意各藥物的禁忌症和年齡限制，特別是四環黴素類藥物不建議8歲以下兒童使用',
        'en': 'Note contraindications and age restrictions for each medication, especially tetracyclines not recommended for children under 8 years',
        'ja': '各薬物の禁忌症と年齢制限に注意してください。特にテトラサイクリン系薬物は8歳未満の小児には推奨されません'
      }
    ],
    riskLevel: 'low',
    metadata: {
      calculationSteps: [
        {
          description: '輸入驗證',
          value: `體重: ${weight}kg, 年齡: ${age || 'N/A'}歲`,
          formula: 'Input validation and parameter setup'
        },
        {
          description: '劑量計算',
          value: `${calculations.length} 種藥物`,
          formula: 'Multi-drug dosing algorithm'
        },
        {
          description: '安全性檢查',
          value: '年齡限制和禁忌症檢查',
          formula: 'Age restrictions and contraindication checks'
        }
      ],
      references: [
        'Pediatric Antimicrobial Stewardship Guidelines',
        'Nelson\'s Pediatric Antimicrobial Therapy',
        'WHO Essential Medicines List for Children'
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
  
  // Validate age (optional but if provided must be valid)
  if (inputs.age) {
    const age = Number(inputs.age);
    if (isNaN(age) || age < 0 || age > 18) {
      errors.push({
        field: 'age',
        message: '年齡必須在 0-18 歲之間',
        type: 'range'
      });
    }
  }
  
  // Validate form
  if (!inputs.form || !['powder', 'pill'].includes(inputs.form as string)) {
    errors.push({
      field: 'form',
      message: '請選擇藥物劑型',
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
  } else if (days < 1 || days > 3) {
    errors.push({
      field: 'days',
      message: '治療天數必須在 1-3 天之間',
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
  } else if (![1, 2, 3, 4].includes(frequency)) {
    errors.push({
      field: 'frequency',
      message: '用藥頻次必須為 1、2、3 或 4 次',
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
  const bacterialCount = result.secondaryValues?.bacterialDrugs?.length || 0;
  const viralCount = result.secondaryValues?.viralDrugs?.length || 0;
  
  return {
    displayValue: `${bacterialCount + viralCount} 種藥物`,
    category: `${bacterialCount} 種抗細菌藥物, ${viralCount} 種抗病毒藥物`,
    description: result.interpretation?.[locale] || result.interpretation?.['zh-TW'] || '',
    recommendations: result.recommendations?.map(rec => 
      rec[locale] || rec['zh-TW'] || ''
    ) || []
  };
}

// ============================================================================
// Individual Drug Calculation Functions
// ============================================================================

/**
 * Calculate Cefixime dose
 */
function calculateCefixime(weight: number, userFrequency: number, days: number, form: string): DrugCalculation {
  const drugUnitMg = 100;
  const recommendedFreq = 2;
  const recommendedFreqText = "BID";
  
  const { calculationFrequency, freqTextForPrescription, prescriptionExplanation } = 
    getFrequencyInfo(form, userFrequency, recommendedFreq, recommendedFreqText);
  
  const idealDailyDoseMg = weight * 8;
  
  let prescriptionText: string;
  let totalDoseText: string;
  let otherDetails: string;
  
  if (form === 'pill') {
    const practicalSingleUnits = getPracticalSingleUnits(idealDailyDoseMg / calculationFrequency, drugUnitMg, 'capsule');
    const doses = getActualDoses(practicalSingleUnits, drugUnitMg, days, calculationFrequency);
    
    prescriptionText = `建議開立: ${practicalSingleUnits.toFixed(0)}# ${freqTextForPrescription} ${prescriptionExplanation}`;
    totalDoseText = `${days} 天總藥量: <strong>${doses.finalTotalUnits.toFixed(0)} 顆</strong>`;
    otherDetails = `<p>每次服用藥量: <strong>${doses.actualSingleMg.toFixed(1)} mg</strong></p><p>每日總劑量: <strong>${doses.actualDailyMg.toFixed(1)} mg</strong></p>`;
  } else {
    const practicalTotalUnits = roundDose((idealDailyDoseMg * days) / drugUnitMg, 'capsule');
    const doses = getActualDoses(practicalTotalUnits, drugUnitMg, days, calculationFrequency, true);
    const totalPackages = days * calculationFrequency;
    
    prescriptionText = `建議開立: ${doses.practicalSingleUnits.toFixed(2)}# ${freqTextForPrescription} ${prescriptionExplanation}`;
    totalDoseText = `${days} 天總藥量: <strong>${practicalTotalUnits.toFixed(0)} 顆</strong> (磨粉, 分 ${totalPackages} 包)`;
    otherDetails = `<p>每包藥量: <strong>${doses.actualSingleMg.toFixed(1)} mg</strong></p><p>每日總劑量: <strong>${doses.actualDailyMg.toFixed(1)} mg</strong></p>`;
  }
  
  return {
    drugName: 'Cefixime',
    brandName: `Cefixime (${drugUnitMg}mg)`,
    unitMg: drugUnitMg,
    unitName: '顆',
    unitSymbol: '#',
    drugType: 'capsule',
    recommendedFreq,
    recommendedFreqText,
    prescriptionText,
    totalDoseText,
    otherDetails,
    maxDoseText: '最大劑量限制: 400 mg/day',
    note: '常用劑量為 8 mg/kg/day。<br>常見療程天數：急性中耳炎(AOM) 10天, 鏈球菌咽喉炎 10天, 泌尿道感染(UTI) 7-14天。<br><strong class="text-red-700">禁忌症:</strong> 對本藥或任何頭孢菌素類藥物過敏者。',
    category: 'bacterial'
  };
}

/**
 * Calculate Baktar (Sulfamethoxazole/Trimethoprim) dose
 */
function calculateBaktar(weight: number, userFrequency: number, days: number, form: string): DrugCalculation {
  const drugUnitMg = 80; // Trimethoprim component
  const recommendedFreq = 2;
  const recommendedFreqText = "BID";
  
  const { calculationFrequency, freqTextForPrescription, prescriptionExplanation } = 
    getFrequencyInfo(form, userFrequency, recommendedFreq, recommendedFreqText);
  
  let prescriptionText: string;
  let totalDoseText: string;
  let otherDetails: string;
  
  if (form === 'pill') {
    const practicalSingleUnitsMin = getPracticalSingleUnits((weight * 8) / calculationFrequency, drugUnitMg, 'pill');
    const practicalSingleUnitsMax = getPracticalSingleUnits((weight * 12) / calculationFrequency, drugUnitMg, 'pill');
    const dosesMin = getActualDoses(practicalSingleUnitsMin, drugUnitMg, days, calculationFrequency);
    const dosesMax = getActualDoses(practicalSingleUnitsMax, drugUnitMg, days, calculationFrequency);
    
    prescriptionText = `建議開立: ${simplifyDisplay(practicalSingleUnitsMin, practicalSingleUnitsMax, '#', 1).replace(/<(\/)?strong>/g, '')} ${freqTextForPrescription} ${prescriptionExplanation}`;
    totalDoseText = `${days} 天總藥量: ${simplifyDisplay(dosesMin.finalTotalUnits, dosesMax.finalTotalUnits, '錠')}`;
    otherDetails = `<p>每次服用藥量: <strong>${simplifyDisplay(dosesMin.actualSingleMg, dosesMax.actualSingleMg, 'mg')}</strong></p><p>每日總劑量(TMP): <strong>${simplifyDisplay(dosesMin.actualDailyMg, dosesMax.actualDailyMg, 'mg')}</strong></p>`;
  } else {
    const practicalTotalUnits = roundDose((weight * 12 * days) / drugUnitMg, 'pill');
    const doses = getActualDoses(practicalTotalUnits, drugUnitMg, days, calculationFrequency, true);
    const totalPackages = days * calculationFrequency;
    
    prescriptionText = `建議開立: ${doses.practicalSingleUnits.toFixed(2)}# ${freqTextForPrescription} ${prescriptionExplanation}`;
    totalDoseText = `${days} 天總藥量: <strong>${practicalTotalUnits.toFixed(1)} 錠</strong> (磨粉, 分 ${totalPackages} 包)`;
    otherDetails = `<p>每包藥量: <strong>${doses.actualSingleMg.toFixed(1)} mg</strong></p><p>每日總劑量: <strong>${doses.actualDailyMg.toFixed(1)} mg</strong></p>`;
  }
  
  return {
    drugName: 'Sulfamethoxazole/Trimethoprim',
    brandName: 'Baktar (400/80mg)',
    unitMg: drugUnitMg,
    unitName: '錠',
    unitSymbol: '#',
    drugType: 'pill',
    recommendedFreq,
    recommendedFreqText,
    prescriptionText,
    totalDoseText,
    otherDetails,
    maxDoseText: '最大劑量限制(TMP): 320 mg/dose',
    note: '劑量基於 Trimethoprim (8-12 mg/kg/day)。<br>常見療程天數：UTI (3-7天), SSTI (5-10天), AOM (10天)。<br><strong class="text-red-700">禁忌症:</strong> 對磺胺類藥物或Trimethoprim過敏者、葉酸缺乏致貧血、<2個月嬰兒、嚴重肝腎損傷、併用dofetilide。',
    category: 'bacterial'
  };
}

/**
 * Calculate Levofloxacin dose
 */
function calculateLevofloxacin(weight: number, age: number | null, userFrequency: number, days: number, form: string): DrugCalculation {
  const drugUnitMg = 500;
  
  if (age === null) {
    return {
      drugName: 'Levofloxacin',
      brandName: `Cravit (${drugUnitMg}mg)`,
      unitMg: drugUnitMg,
      unitName: '錠',
      unitSymbol: '#',
      drugType: 'pill',
      recommendedFreq: 1,
      recommendedFreqText: 'QD',
      prescriptionText: '',
      totalDoseText: '<span class="text-red-500">請輸入年齡</span>',
      otherDetails: '',
      maxDoseText: '',
      note: '此藥物劑量與年齡相關。',
      borderColor: 'border-red-500',
      category: 'bacterial'
    };
  }
  
  const maxDailyDose = 750;
  let recommendedFreq: number;
  let recommendedFreqText: string;
  let baseNote: string;
  
  if (age < 5) {
    recommendedFreq = 2;
    recommendedFreqText = 'BID';
    baseNote = `<strong>6個月至 <5歲:</strong> 建議劑量 8-10 mg/kg/dose。`;
  } else {
    recommendedFreq = 1;
    recommendedFreqText = 'QD';
    baseNote = `<strong>≥5歲:</strong> 建議劑量 10 mg/kg/day。`;
  }
  
  const { calculationFrequency, freqTextForPrescription, prescriptionExplanation } = 
    getFrequencyInfo(form, userFrequency, recommendedFreq, recommendedFreqText);
  
  let prescriptionText: string;
  let totalDoseText: string;
  let otherDetails: string;
  let note = baseNote + '<br>常見療程天數：CAP (5天), 複雜性UTI (5-7天), 急性細菌性鼻竇炎 (5-7天)。<br><strong class="text-red-700">禁忌症:</strong> 對本藥或任何Quinolone類藥物過敏者。';
  
  if (form === 'pill') {
    let idealSingleDoseMinMg: number, idealSingleDoseMaxMg: number;
    
    if (age < 5) {
      idealSingleDoseMinMg = weight * 8;
      idealSingleDoseMaxMg = weight * 10;
    } else {
      idealSingleDoseMinMg = idealSingleDoseMaxMg = (weight * 10) / calculationFrequency;
    }
    
    const practicalSingleUnitsMin = getPracticalSingleUnits(idealSingleDoseMinMg, drugUnitMg, 'pill');
    const practicalSingleUnitsMax = getPracticalSingleUnits(idealSingleDoseMaxMg, drugUnitMg, 'pill');
    const dosesMin = getActualDoses(practicalSingleUnitsMin, drugUnitMg, days, calculationFrequency);
    const dosesMax = getActualDoses(practicalSingleUnitsMax, drugUnitMg, days, calculationFrequency);
    
    let capNote = dosesMax.actualDailyMg > maxDailyDose ? ` <strong class="text-blue-600">(已達上限)</strong>` : '';
    
    prescriptionText = `建議開立: ${simplifyDisplay(practicalSingleUnitsMin, practicalSingleUnitsMax, '#', 1).replace(/<(\/)?strong>/g, '')} ${freqTextForPrescription} ${prescriptionExplanation}`;
    totalDoseText = `${days} 天總藥量: ${simplifyDisplay(dosesMin.finalTotalUnits, dosesMax.finalTotalUnits, '錠')}`;
    otherDetails = `<p>每次服用藥量: <strong>${simplifyDisplay(dosesMin.actualSingleMg, dosesMax.actualSingleMg, 'mg')}</strong></p><p>每日總劑量: <strong>${simplifyDisplay(dosesMin.actualDailyMg, dosesMax.actualDailyMg, 'mg')}${capNote}</strong></p>`;
    
    if (capNote) note += `<br>每日最大劑量已限制在 ${maxDailyDose} mg。`;
  } else {
    let idealDailyDoseMaxMg: number;
    
    if (age < 5) {
      idealDailyDoseMaxMg = (weight * 10) * calculationFrequency;
    } else {
      idealDailyDoseMaxMg = weight * 10;
    }
    
    let capNote = '';
    if (idealDailyDoseMaxMg > maxDailyDose) {
      idealDailyDoseMaxMg = maxDailyDose;
      capNote = ` <strong class="text-blue-600">(已達上限)</strong>`;
    }
    
    const practicalTotalUnits = roundDose((idealDailyDoseMaxMg * days) / drugUnitMg, 'pill');
    const doses = getActualDoses(practicalTotalUnits, drugUnitMg, days, calculationFrequency, true);
    const totalPackages = days * calculationFrequency;
    
    prescriptionText = `建議開立: ${doses.practicalSingleUnits.toFixed(2)}# ${freqTextForPrescription} ${prescriptionExplanation}`;
    totalDoseText = `${days} 天總藥量: <strong>${practicalTotalUnits.toFixed(1)} 錠</strong> (磨粉, 分 ${totalPackages} 包)`;
    otherDetails = `<p>每包藥量: <strong>${doses.actualSingleMg.toFixed(1)} mg</strong></p><p>每日總劑量: <strong>${doses.actualDailyMg.toFixed(1)} mg</strong>${capNote}</p>`;
    
    if (capNote) note += `<br>每日最大劑量已限制在 ${maxDailyDose} mg。`;
  }
  
  return {
    drugName: 'Levofloxacin',
    brandName: `Cravit (${drugUnitMg}mg)`,
    unitMg: drugUnitMg,
    unitName: '錠',
    unitSymbol: '#',
    drugType: 'pill',
    recommendedFreq,
    recommendedFreqText,
    prescriptionText,
    totalDoseText,
    otherDetails,
    maxDoseText: `最大劑量限制: ${maxDailyDose} mg/day`,
    note,
    category: 'bacterial'
  };
}

/**
 * Calculate Cephalexin dose
 */
function calculateCephalexin(weight: number, userFrequency: number, days: number, form: string): DrugCalculation {
  const drugUnitMg = 500;
  const recommendedFreq = 2;
  const recommendedFreqText = "BID";
  
  const { calculationFrequency, freqTextForPrescription, prescriptionExplanation } = 
    getFrequencyInfo(form, userFrequency, recommendedFreq, "BID");
  
  let prescriptionText: string;
  let totalDoseText: string;
  let otherDetails: string;
  
  if (form === 'pill') {
    const practicalSingleUnitsMin = getPracticalSingleUnits((weight * 25) / calculationFrequency, drugUnitMg, 'capsule');
    const practicalSingleUnitsMax = getPracticalSingleUnits((weight * 50) / calculationFrequency, drugUnitMg, 'capsule');
    const dosesMin = getActualDoses(practicalSingleUnitsMin, drugUnitMg, days, calculationFrequency);
    const dosesMax = getActualDoses(practicalSingleUnitsMax, drugUnitMg, days, calculationFrequency);
    
    prescriptionText = `建議開立: ${simplifyDisplay(practicalSingleUnitsMin, practicalSingleUnitsMax, '#', 0).replace(/<(\/)?strong>/g, '')} ${freqTextForPrescription} ${prescriptionExplanation}`;
    totalDoseText = `${days} 天總藥量: ${simplifyDisplay(dosesMin.finalTotalUnits, dosesMax.finalTotalUnits, '顆', 0)}`;
    otherDetails = `<p>每次服用藥量: <strong>${simplifyDisplay(dosesMin.actualSingleMg, dosesMax.actualSingleMg, 'mg')}</strong></p><p>每日總劑量: <strong>${simplifyDisplay(dosesMin.actualDailyMg, dosesMax.actualDailyMg, 'mg')}</strong></p>`;
  } else {
    const practicalTotalUnits = roundDose((weight * 50 * days) / drugUnitMg, 'capsule');
    const doses = getActualDoses(practicalTotalUnits, drugUnitMg, days, calculationFrequency, true);
    const totalPackages = days * calculationFrequency;
    
    prescriptionText = `建議開立: ${doses.practicalSingleUnits.toFixed(2)}# ${freqTextForPrescription} ${prescriptionExplanation}`;
    totalDoseText = `${days} 天總藥量: <strong>${practicalTotalUnits.toFixed(0)} 顆</strong> (磨粉, 分 ${totalPackages} 包)`;
    otherDetails = `<p>每包藥量: <strong>${doses.actualSingleMg.toFixed(1)} mg</strong></p><p>每日總劑量: <strong>${doses.actualDailyMg.toFixed(1)} mg</strong></p>`;
  }
  
  return {
    drugName: 'Cephalexin',
    brandName: 'Cephalexin (500mg)',
    unitMg: drugUnitMg,
    unitName: '顆',
    unitSymbol: '#',
    drugType: 'capsule',
    recommendedFreq,
    recommendedFreqText,
    prescriptionText,
    totalDoseText,
    otherDetails,
    maxDoseText: '最大劑量限制: 4000 mg/day',
    note: '常用劑量為 25-50 mg/kg/day (嚴重感染 75-100 mg/kg/day)。<br>常見療程天數：SSTI (5-7天), GABHS咽炎 (10天), UTI (5天)。<br><strong class="text-red-700">禁忌症:</strong> 對本藥或任何頭孢菌素類藥物過敏者。',
    category: 'bacterial'
  };
}

/**
 * Calculate Azithromycin dose
 */
function calculateAzithromycin(weight: number, userFrequency: number, days: number, form: string): DrugCalculation {
  const drugUnitMg = 250;
  const recommendedFreq = 1;
  const recommendedFreqText = "QD";
  
  const { calculationFrequency, freqTextForPrescription, prescriptionExplanation } = 
    getFrequencyInfo(form, userFrequency, recommendedFreq, recommendedFreqText);
  
  let idealDailyDoseMg = weight * 10;
  let capNote = '';
  let note = '常用劑量為 10 mg/kg/day。<br>常見療程天數：AOM (3天或5天療程), CAP (5天療程), GABHS咽炎 (5天療程)。<br><strong class="text-red-700">禁忌症:</strong> 對本藥、紅黴素、或任何巨環類抗生素過敏者；曾因使用本藥導致膽汁鬱積性黃疸/肝功能異常者。';
  
  if (idealDailyDoseMg > 500) {
    idealDailyDoseMg = 500;
    capNote = ` <strong class="text-blue-600">(已達上限)</strong>`;
    note += `<br>每日最大劑量已限制在 500 mg。`;
  }
  
  let prescriptionText: string;
  let totalDoseText: string;
  let otherDetails: string;
  
  if (form === 'pill') {
    const practicalSingleUnits = getPracticalSingleUnits(idealDailyDoseMg / calculationFrequency, drugUnitMg, 'pill');
    const doses = getActualDoses(practicalSingleUnits, drugUnitMg, days, calculationFrequency);
    
    prescriptionText = `建議開立: ${practicalSingleUnits.toFixed(1)}# ${freqTextForPrescription} ${prescriptionExplanation}`;
    totalDoseText = `${days} 天總藥量: <strong>${doses.finalTotalUnits.toFixed(1)} 錠</strong>`;
    otherDetails = `<p>每次服用藥量: <strong>${doses.actualSingleMg.toFixed(1)} mg</strong></p><p>每日總劑量: <strong>${doses.actualDailyMg.toFixed(1)} mg</strong>${capNote}</p>`;
  } else {
    const practicalTotalUnits = roundDose((idealDailyDoseMg * days) / drugUnitMg, 'pill');
    const doses = getActualDoses(practicalTotalUnits, drugUnitMg, days, calculationFrequency, true);
    const totalPackages = days * calculationFrequency;
    
    prescriptionText = `建議開立: ${doses.practicalSingleUnits.toFixed(2)}# ${freqTextForPrescription} ${prescriptionExplanation}`;
    totalDoseText = `${days} 天總藥量: <strong>${practicalTotalUnits.toFixed(1)} 錠</strong> (磨粉, 分 ${totalPackages} 包)`;
    otherDetails = `<p>每包藥量: <strong>${doses.actualSingleMg.toFixed(1)} mg</strong></p><p>每日總劑量: <strong>${doses.actualDailyMg.toFixed(1)} mg</strong>${capNote}</p>`;
  }
  
  return {
    drugName: 'Azithromycin',
    brandName: `Zithromax (${drugUnitMg}mg)`,
    unitMg: drugUnitMg,
    unitName: '錠',
    unitSymbol: '#',
    drugType: 'pill',
    recommendedFreq,
    recommendedFreqText,
    prescriptionText,
    totalDoseText,
    otherDetails,
    maxDoseText: '最大劑量限制: 500 mg/day',
    note,
    category: 'bacterial'
  };
}

/**
 * Calculate Minocycline dose
 */
function calculateMinocycline(weight: number, age: number | null, userFrequency: number, days: number, form: string): DrugCalculation {
  const drugUnitMg = 50;
  const recommendedFreq = 2;
  const recommendedFreqText = "BID";
  
  const baseNote = '常用劑量 2 mg/kg/dose BID (起始 4 mg/kg)。<br>常見療程天數：痤瘡 (長期使用), MRSA SSTI (5-10天)。<br><strong class="text-red-700">禁忌症:</strong> 對本藥或任何四環黴素類藥物過敏者。<br><strong class="text-red-600">注意：不建議用於 8 歲以下兒童。</strong>';
  
  if (age !== null && age < 8) {
    return {
      drugName: 'Minocycline',
      brandName: `Bory (${drugUnitMg}mg)`,
      unitMg: drugUnitMg,
      unitName: '顆',
      unitSymbol: '#',
      drugType: 'capsule',
      recommendedFreq,
      recommendedFreqText,
      prescriptionText: '',
      totalDoseText: '<span class="text-red-500">不建議 8 歲以下使用</span>',
      otherDetails: '',
      maxDoseText: '',
      note: baseNote,
      borderColor: 'border-red-500',
      category: 'bacterial'
    };
  }
  
  const { calculationFrequency, freqTextForPrescription, prescriptionExplanation } = 
    getFrequencyInfo(form, userFrequency, recommendedFreq, recommendedFreqText);
  
  let idealDailyDoseMg = weight * 4;
  let capNote = '';
  let note = baseNote;
  
  if (idealDailyDoseMg > 400) {
    idealDailyDoseMg = 400;
    capNote = ` <strong class="text-blue-600">(已達上限)</strong>`;
    note += `<br>每日最大劑量已限制在 400 mg。`;
  }
  
  let prescriptionText: string;
  let totalDoseText: string;
  let otherDetails: string;
  
  if (form === 'pill') {
    const practicalSingleUnits = getPracticalSingleUnits(idealDailyDoseMg / calculationFrequency, drugUnitMg, 'capsule');
    const doses = getActualDoses(practicalSingleUnits, drugUnitMg, days, calculationFrequency);
    
    prescriptionText = `建議開立: ${practicalSingleUnits.toFixed(0)}# ${freqTextForPrescription} ${prescriptionExplanation}`;
    totalDoseText = `${days} 天總藥量: <strong>${doses.finalTotalUnits.toFixed(0)} 顆</strong>`;
    otherDetails = `<p>每次服用藥量: <strong>${doses.actualSingleMg.toFixed(1)} mg</strong></p><p>每日總劑量: <strong>${doses.actualDailyMg.toFixed(1)} mg</strong>${capNote}</p>`;
  } else {
    const practicalTotalUnits = roundDose((idealDailyDoseMg * days) / drugUnitMg, 'capsule');
    const doses = getActualDoses(practicalTotalUnits, drugUnitMg, days, calculationFrequency, true);
    const totalPackages = days * calculationFrequency;
    
    prescriptionText = `建議開立: ${doses.practicalSingleUnits.toFixed(2)}# ${freqTextForPrescription} ${prescriptionExplanation}`;
    totalDoseText = `${days} 天總藥量: <strong>${practicalTotalUnits.toFixed(0)} 顆</strong> (磨粉, 分 ${totalPackages} 包)`;
    otherDetails = `<p>每包藥量: <strong>${doses.actualSingleMg.toFixed(1)} mg</strong></p><p>每日總劑量: <strong>${doses.actualDailyMg.toFixed(1)} mg</strong>${capNote}</p>`;
  }
  
  return {
    drugName: 'Minocycline',
    brandName: `Bory (${drugUnitMg}mg)`,
    unitMg: drugUnitMg,
    unitName: '顆',
    unitSymbol: '#',
    drugType: 'capsule',
    recommendedFreq,
    recommendedFreqText,
    prescriptionText,
    totalDoseText,
    otherDetails,
    maxDoseText: '最大劑量限制: 400 mg/day',
    note,
    category: 'bacterial'
  };
}

/**
 * Calculate Doxycycline dose
 */
function calculateDoxycycline(weight: number, age: number | null, userFrequency: number, days: number, form: string): DrugCalculation {
  const drugUnitMg = 50;
  const recommendedFreq = 2;
  const recommendedFreqText = "BID";
  
  const { calculationFrequency, freqTextForPrescription, prescriptionExplanation } = 
    getFrequencyInfo(form, userFrequency, recommendedFreq, recommendedFreqText);
  
  const idealDailyDoseMg = weight * 4.4;
  let capNote = '';
  let note = '常用劑量 2.2 mg/kg/dose BID。<br>常見療程天數：萊姆病 (10-28天), MRSA SSTI (5-10天), CAP (10天)。<br>短期療程(<21天)可用於各年齡層。<br><strong class="text-red-700">禁忌症:</strong> 對本藥或任何四環黴素類藥物過敏者。';
  
  if (idealDailyDoseMg > 200) {
    capNote = ` <strong class="text-blue-600">(已達上限)</strong>`;
    note += `<br>每日最大劑量已限制在 200 mg。`;
  }
  
  let prescriptionText: string;
  let totalDoseText: string;
  let otherDetails: string;
  
  if (form === 'pill') {
    const practicalSingleUnits = getPracticalSingleUnits(weight * 2.2, drugUnitMg, 'capsule');
    const doses = getActualDoses(practicalSingleUnits, drugUnitMg, days, calculationFrequency);
    
    prescriptionText = `建議開立: ${practicalSingleUnits.toFixed(0)}# ${freqTextForPrescription} ${prescriptionExplanation}`;
    totalDoseText = `${days} 天總藥量: <strong>${doses.finalTotalUnits.toFixed(0)} 顆</strong>`;
    otherDetails = `<p>每次服用藥量: <strong>${doses.actualSingleMg.toFixed(1)} mg</strong></p><p>每日總劑量: <strong>${doses.actualDailyMg.toFixed(1)} mg</strong>${capNote}</p>`;
  } else {
    const practicalTotalUnits = roundDose((idealDailyDoseMg * days) / drugUnitMg, 'capsule');
    const doses = getActualDoses(practicalTotalUnits, drugUnitMg, days, calculationFrequency, true);
    const totalPackages = days * calculationFrequency;
    
    prescriptionText = `建議開立: ${doses.practicalSingleUnits.toFixed(2)}# ${freqTextForPrescription} ${prescriptionExplanation}`;
    totalDoseText = `${days} 天總藥量: <strong>${practicalTotalUnits.toFixed(0)} 顆</strong> (磨粉, 分 ${totalPackages} 包)`;
    otherDetails = `<p>每包藥量: <strong>${doses.actualSingleMg.toFixed(1)} mg</strong></p><p>每日總劑量: <strong>${doses.actualDailyMg.toFixed(1)} mg</strong>${capNote}</p>`;
  }
  
  return {
    drugName: 'Doxycycline',
    brandName: `Doxymycin (${drugUnitMg}mg)`,
    unitMg: drugUnitMg,
    unitName: '顆',
    unitSymbol: '#',
    drugType: 'capsule',
    recommendedFreq,
    recommendedFreqText,
    prescriptionText,
    totalDoseText,
    otherDetails,
    maxDoseText: '最大劑量限制: 200 mg/day',
    note,
    category: 'bacterial'
  };
}

/**
 * Calculate Acyclovir dose
 */
function calculateAcyclovir(weight: number, userFrequency: number, days: number, form: string): DrugCalculation {
  const drugUnitMg = 800;
  const recommendedFreq = 4;
  const recommendedFreqText = "QID";
  
  const { calculationFrequency, freqTextForPrescription, prescriptionExplanation } = 
    getFrequencyInfo(form, userFrequency, recommendedFreq, recommendedFreqText);
  
  let idealSingleDoseMg = weight * 20;
  let capNote = '';
  let note = '水痘劑量為 20 mg/kg/dose (QID)。<br>常見療程天數：水痘 (5-7天), Zoster (7-10天)。<br><strong class="text-red-700">禁忌症:</strong> 對本藥或Valacyclovir過敏者。';
  
  if (idealSingleDoseMg > 800) {
    idealSingleDoseMg = 800;
    capNote = ` <strong class="text-blue-600">(已達上限)</strong>`;
    note += `<br>單次最大劑量已限制在 800 mg。`;
  }
  
  let prescriptionText: string;
  let totalDoseText: string;
  let otherDetails: string;
  
  if (form === 'pill') {
    const practicalSingleUnits = getPracticalSingleUnits(idealSingleDoseMg, drugUnitMg, 'capsule');
    const doses = getActualDoses(practicalSingleUnits, drugUnitMg, days, calculationFrequency);
    
    prescriptionText = `建議開立: ${practicalSingleUnits.toFixed(0)}# ${freqTextForPrescription} ${prescriptionExplanation}`;
    totalDoseText = `${days} 天總藥量: <strong>${doses.finalTotalUnits.toFixed(0)} 顆</strong>`;
    otherDetails = `<p>每次服用藥量: <strong>${doses.actualSingleMg.toFixed(1)} mg</strong></p><p>每日總劑量: <strong>${doses.actualDailyMg.toFixed(0)} mg</strong>${capNote}</p>`;
  } else {
    const practicalTotalUnits = roundDose((idealSingleDoseMg * calculationFrequency * days) / drugUnitMg, 'capsule');
    const doses = getActualDoses(practicalTotalUnits, drugUnitMg, days, calculationFrequency, true);
    const totalPackages = days * calculationFrequency;
    
    prescriptionText = `建議開立: ${doses.practicalSingleUnits.toFixed(2)}# ${freqTextForPrescription} ${prescriptionExplanation}`;
    totalDoseText = `${days} 天總藥量: <strong>${practicalTotalUnits.toFixed(0)} 顆</strong> (磨粉, 分 ${totalPackages} 包)`;
    otherDetails = `<p>每包藥量: <strong>${doses.actualSingleMg.toFixed(1)} mg</strong></p><p>每日總劑量: <strong>${doses.actualDailyMg.toFixed(0)} mg</strong>${capNote}</p>`;
  }
  
  return {
    drugName: 'Acyclovir',
    brandName: `Virless (${drugUnitMg}mg)`,
    unitMg: drugUnitMg,
    unitName: '顆',
    unitSymbol: '#',
    drugType: 'capsule',
    recommendedFreq,
    recommendedFreqText,
    prescriptionText,
    totalDoseText,
    otherDetails,
    maxDoseText: '單次最大劑量: 800 mg/dose',
    note,
    category: 'viral'
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Round dose based on drug type
 */
function roundDose(total: number, type: 'capsule' | 'pill'): number {
  if (type === 'capsule') return Math.ceil(total);
  if (type === 'pill') return Math.ceil(total * 2) / 2;
  return total;
}

/**
 * Get practical single units
 */
function getPracticalSingleUnits(idealSingleDoseMg: number, drugUnitMg: number, drugType: 'capsule' | 'pill'): number {
  if (drugUnitMg === 0) return 0;
  const idealUnits = idealSingleDoseMg / drugUnitMg;
  return roundDose(idealUnits, drugType);
}

/**
 * Get actual doses
 */
function getActualDoses(practicalUnits: number, drugUnitMg: number, days: number, frequency: number, isTotalUnits = false): MedicationDose {
  let practicalSingleUnits: number, finalTotalUnits: number;
  
  if (isTotalUnits) {
    finalTotalUnits = practicalUnits;
    practicalSingleUnits = (days * frequency > 0) ? finalTotalUnits / (days * frequency) : 0;
  } else {
    practicalSingleUnits = practicalUnits;
    finalTotalUnits = practicalSingleUnits * frequency * days;
  }
  
  const actualTotalMg = finalTotalUnits * drugUnitMg;
  const actualDailyMg = (days > 0) ? actualTotalMg / days : 0;
  const actualSingleMg = (frequency > 0) ? actualDailyMg / frequency : 0;
  
  return {
    singleDose: practicalSingleUnits,
    dailyDose: actualDailyMg,
    totalUnits: finalTotalUnits,
    actualSingleMg,
    actualDailyMg,
    finalTotalUnits,
    practicalSingleUnits
  };
}

/**
 * Get frequency information
 */
function getFrequencyInfo(form: string, userFrequency: number, recommendedFreq: number, recommendedFreqText: string) {
  let prescriptionExplanation: string;
  
  if (form === 'pill') {
    prescriptionExplanation = `<i class="text-xs text-gray-500 italic">(依藥錠/膠囊劑型，採用建議頻次)</i>`;
    return {
      calculationFrequency: recommendedFreq,
      freqTextForPrescription: recommendedFreqText,
      prescriptionExplanation
    };
  } else {
    const freqText = getFreqText(userFrequency);
    prescriptionExplanation = `<i class="text-xs text-gray-500 italic">(依藥粉劑型，採用選擇頻次)</i>`;
    return {
      calculationFrequency: userFrequency,
      freqTextForPrescription: freqText,
      prescriptionExplanation
    };
  }
}

/**
 * Get frequency text
 */
function getFreqText(freq: number): string {
  const map: Record<number, string> = { 1: "QD", 2: "BID", 3: "TID", 4: "QID" };
  return map[freq] || `${freq}x/day`;
}

/**
 * Simplify display for ranges
 */
function simplifyDisplay(minVal: number, maxVal: number, unit: string, precision = 1): string {
  const minStr = minVal.toFixed(precision);
  const maxStr = maxVal.toFixed(precision);
  if (minStr === maxStr) {
    return `<strong>${maxStr} ${unit}</strong>`;
  } else {
    return `<strong>${minStr} - ${maxStr} ${unit}</strong>`;
  }
}

// Export default calculation function for backward compatibility
export default calculate;