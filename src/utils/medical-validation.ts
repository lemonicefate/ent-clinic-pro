/**
 * 醫療特定驗證規則
 * 提供醫療數據的專業驗證功能
 */

import type { SupportedLocale } from '../env.d';

// 驗證結果
export interface ValidationResult {
  isValid: boolean;
  message?: string;
  severity?: 'error' | 'warning' | 'info';
}

// 醫療數值範圍
export interface MedicalRange {
  min: number;
  max: number;
  unit: string;
  normalRange?: [number, number];
  criticalRange?: [number, number];
}

/**
 * 醫療數值範圍定義
 */
export const MEDICAL_RANGES: Record<string, MedicalRange> = {
  // 生命徵象
  systolicBP: {
    min: 50,
    max: 300,
    unit: 'mmHg',
    normalRange: [90, 140],
    criticalRange: [180, 300]
  },
  diastolicBP: {
    min: 30,
    max: 200,
    unit: 'mmHg',
    normalRange: [60, 90],
    criticalRange: [110, 200]
  },
  heartRate: {
    min: 20,
    max: 300,
    unit: 'bpm',
    normalRange: [60, 100],
    criticalRange: [150, 300]
  },
  temperature: {
    min: 30,
    max: 45,
    unit: '°C',
    normalRange: [36.1, 37.2],
    criticalRange: [40, 45]
  },
  respiratoryRate: {
    min: 5,
    max: 60,
    unit: '/min',
    normalRange: [12, 20],
    criticalRange: [30, 60]
  },
  oxygenSaturation: {
    min: 50,
    max: 100,
    unit: '%',
    normalRange: [95, 100],
    criticalRange: [50, 85]
  },

  // 身體測量
  weight: {
    min: 0.5,
    max: 500,
    unit: 'kg',
    normalRange: [50, 100],
    criticalRange: [200, 500]
  },
  height: {
    min: 30,
    max: 250,
    unit: 'cm',
    normalRange: [150, 200],
    criticalRange: [220, 250]
  },
  bmi: {
    min: 10,
    max: 80,
    unit: 'kg/m²',
    normalRange: [18.5, 24.9],
    criticalRange: [40, 80]
  },

  // 實驗室數值
  glucose: {
    min: 20,
    max: 800,
    unit: 'mg/dL',
    normalRange: [70, 100],
    criticalRange: [400, 800]
  },
  creatinine: {
    min: 0.1,
    max: 20,
    unit: 'mg/dL',
    normalRange: [0.6, 1.2],
    criticalRange: [5, 20]
  },
  hemoglobin: {
    min: 3,
    max: 25,
    unit: 'g/dL',
    normalRange: [12, 16],
    criticalRange: [6, 20]
  },
  platelet: {
    min: 10,
    max: 2000,
    unit: '×10³/μL',
    normalRange: [150, 450],
    criticalRange: [50, 1000]
  },
  inr: {
    min: 0.5,
    max: 10,
    unit: '',
    normalRange: [0.8, 1.2],
    criticalRange: [5, 10]
  },

  // 年齡相關
  age: {
    min: 0,
    max: 150,
    unit: 'years',
    normalRange: [0, 120],
    criticalRange: [120, 150]
  },
  gestationalAge: {
    min: 4,
    max: 45,
    unit: 'weeks',
    normalRange: [37, 42],
    criticalRange: [22, 45]
  }
};

/**
 * 醫療驗證器類別
 */
export class MedicalValidator {
  private locale: SupportedLocale;

  constructor(locale: SupportedLocale = 'zh-TW') {
    this.locale = locale;
  }

  /**
   * 驗證數值範圍
   */
  validateRange(
    value: number,
    rangeKey: string,
    customRange?: Partial<MedicalRange>
  ): ValidationResult {
    const range = customRange ? { ...MEDICAL_RANGES[rangeKey], ...customRange } : MEDICAL_RANGES[rangeKey];
    
    if (!range) {
      return {
        isValid: false,
        message: this.getMessage('unknownRange', { rangeKey }),
        severity: 'error'
      };
    }

    // 檢查基本範圍
    if (value < range.min || value > range.max) {
      return {
        isValid: false,
        message: this.getMessage('outOfRange', {
          value,
          min: range.min,
          max: range.max,
          unit: range.unit
        }),
        severity: 'error'
      };
    }

    // 檢查危險範圍
    if (range.criticalRange && 
        (value <= range.criticalRange[0] || value >= range.criticalRange[1])) {
      return {
        isValid: true,
        message: this.getMessage('criticalValue', {
          value,
          unit: range.unit
        }),
        severity: 'error'
      };
    }

    // 檢查正常範圍
    if (range.normalRange && 
        (value < range.normalRange[0] || value > range.normalRange[1])) {
      return {
        isValid: true,
        message: this.getMessage('abnormalValue', {
          value,
          unit: range.unit,
          normalMin: range.normalRange[0],
          normalMax: range.normalRange[1]
        }),
        severity: 'warning'
      };
    }

    return {
      isValid: true,
      message: this.getMessage('normalValue', { value, unit: range.unit }),
      severity: 'info'
    };
  }

  /**
   * 驗證血壓
   */
  validateBloodPressure(systolic: number, diastolic: number): ValidationResult {
    const systolicResult = this.validateRange(systolic, 'systolicBP');
    const diastolicResult = this.validateRange(diastolic, 'diastolicBP');

    if (!systolicResult.isValid || !diastolicResult.isValid) {
      return {
        isValid: false,
        message: this.getMessage('invalidBloodPressure'),
        severity: 'error'
      };
    }

    // 檢查收縮壓是否大於舒張壓
    if (systolic <= diastolic) {
      return {
        isValid: false,
        message: this.getMessage('systolicLowerThanDiastolic'),
        severity: 'error'
      };
    }

    // 血壓分級
    if (systolic >= 180 || diastolic >= 110) {
      return {
        isValid: true,
        message: this.getMessage('hypertensiveCrisis'),
        severity: 'error'
      };
    } else if (systolic >= 160 || diastolic >= 100) {
      return {
        isValid: true,
        message: this.getMessage('stage2Hypertension'),
        severity: 'warning'
      };
    } else if (systolic >= 140 || diastolic >= 90) {
      return {
        isValid: true,
        message: this.getMessage('stage1Hypertension'),
        severity: 'warning'
      };
    } else if (systolic >= 120 || diastolic >= 80) {
      return {
        isValid: true,
        message: this.getMessage('elevatedBloodPressure'),
        severity: 'info'
      };
    }

    return {
      isValid: true,
      message: this.getMessage('normalBloodPressure'),
      severity: 'info'
    };
  }

  /**
   * 驗證 BMI
   */
  validateBMI(weight: number, height: number): ValidationResult {
    const weightResult = this.validateRange(weight, 'weight');
    const heightResult = this.validateRange(height, 'height');

    if (!weightResult.isValid || !heightResult.isValid) {
      return {
        isValid: false,
        message: this.getMessage('invalidBMIInputs'),
        severity: 'error'
      };
    }

    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);

    // BMI 分級
    if (bmi < 18.5) {
      return {
        isValid: true,
        message: this.getMessage('underweight', { bmi: bmi.toFixed(1) }),
        severity: 'warning'
      };
    } else if (bmi < 25) {
      return {
        isValid: true,
        message: this.getMessage('normalWeight', { bmi: bmi.toFixed(1) }),
        severity: 'info'
      };
    } else if (bmi < 30) {
      return {
        isValid: true,
        message: this.getMessage('overweight', { bmi: bmi.toFixed(1) }),
        severity: 'warning'
      };
    } else if (bmi < 35) {
      return {
        isValid: true,
        message: this.getMessage('obeseClass1', { bmi: bmi.toFixed(1) }),
        severity: 'warning'
      };
    } else if (bmi < 40) {
      return {
        isValid: true,
        message: this.getMessage('obeseClass2', { bmi: bmi.toFixed(1) }),
        severity: 'error'
      };
    } else {
      return {
        isValid: true,
        message: this.getMessage('obeseClass3', { bmi: bmi.toFixed(1) }),
        severity: 'error'
      };
    }
  }

  /**
   * 驗證年齡相關數值
   */
  validateAgeRelatedValue(
    value: number,
    age: number,
    valueType: string
  ): ValidationResult {
    // 根據年齡調整正常範圍
    let adjustedRange = { ...MEDICAL_RANGES[valueType] };

    if (valueType === 'heartRate') {
      if (age < 1) {
        adjustedRange.normalRange = [100, 160];
      } else if (age < 3) {
        adjustedRange.normalRange = [90, 150];
      } else if (age < 6) {
        adjustedRange.normalRange = [80, 140];
      } else if (age < 12) {
        adjustedRange.normalRange = [70, 120];
      } else if (age >= 65) {
        adjustedRange.normalRange = [50, 100];
      }
    }

    if (valueType === 'respiratoryRate') {
      if (age < 1) {
        adjustedRange.normalRange = [30, 60];
      } else if (age < 3) {
        adjustedRange.normalRange = [24, 40];
      } else if (age < 6) {
        adjustedRange.normalRange = [22, 34];
      } else if (age < 12) {
        adjustedRange.normalRange = [18, 30];
      }
    }

    return this.validateRange(value, valueType, adjustedRange);
  }

  /**
   * 驗證藥物劑量
   */
  validateDosage(
    dose: number,
    weight: number,
    drugName: string,
    route: 'oral' | 'iv' | 'im' | 'sc' = 'oral'
  ): ValidationResult {
    // 這裡應該包含藥物劑量的驗證邏輯
    // 實際應用中需要藥物資料庫
    
    const dosePerKg = dose / weight;
    
    // 基本安全檢查
    if (dosePerKg > 100) { // 假設的安全上限
      return {
        isValid: false,
        message: this.getMessage('dosageTooHigh', { 
          dose, 
          weight, 
          dosePerKg: dosePerKg.toFixed(2) 
        }),
        severity: 'error'
      };
    }

    return {
      isValid: true,
      message: this.getMessage('dosageAcceptable', { 
        dose, 
        dosePerKg: dosePerKg.toFixed(2) 
      }),
      severity: 'info'
    };
  }

  /**
   * 驗證實驗室數值組合
   */
  validateLabCombination(values: Record<string, number>): ValidationResult[] {
    const results: ValidationResult[] = [];

    // 腎功能相關
    if (values.creatinine && values.bun) {
      const bunCreatinineRatio = values.bun / values.creatinine;
      if (bunCreatinineRatio > 20) {
        results.push({
          isValid: true,
          message: this.getMessage('elevatedBunCreatinineRatio', { 
            ratio: bunCreatinineRatio.toFixed(1) 
          }),
          severity: 'warning'
        });
      }
    }

    // 肝功能相關
    if (values.alt && values.ast) {
      const astAltRatio = values.ast / values.alt;
      if (astAltRatio > 2) {
        results.push({
          isValid: true,
          message: this.getMessage('elevatedAstAltRatio', { 
            ratio: astAltRatio.toFixed(1) 
          }),
          severity: 'warning'
        });
      }
    }

    return results;
  }

  /**
   * 獲取本地化訊息
   */
  private getMessage(key: string, params: Record<string, any> = {}): string {
    const messages: Record<SupportedLocale, Record<string, string>> = {
      'zh-TW': {
        unknownRange: '未知的數值範圍：{rangeKey}',
        outOfRange: '數值 {value} {unit} 超出有效範圍 ({min}-{max} {unit})',
        criticalValue: '危險數值：{value} {unit}',
        abnormalValue: '異常數值：{value} {unit} (正常範圍：{normalMin}-{normalMax} {unit})',
        normalValue: '正常數值：{value} {unit}',
        invalidBloodPressure: '血壓數值無效',
        systolicLowerThanDiastolic: '收縮壓不能低於或等於舒張壓',
        hypertensiveCrisis: '高血壓危象 - 需要立即醫療處置',
        stage2Hypertension: '第二期高血壓',
        stage1Hypertension: '第一期高血壓',
        elevatedBloodPressure: '血壓偏高',
        normalBloodPressure: '血壓正常',
        invalidBMIInputs: '體重或身高數值無效',
        underweight: 'BMI {bmi} - 體重過輕',
        normalWeight: 'BMI {bmi} - 體重正常',
        overweight: 'BMI {bmi} - 體重過重',
        obeseClass1: 'BMI {bmi} - 輕度肥胖',
        obeseClass2: 'BMI {bmi} - 中度肥胖',
        obeseClass3: 'BMI {bmi} - 重度肥胖',
        dosageTooHigh: '劑量過高：{dose} mg (每公斤 {dosePerKg} mg/kg)',
        dosageAcceptable: '劑量可接受：{dose} mg (每公斤 {dosePerKg} mg/kg)',
        elevatedBunCreatinineRatio: 'BUN/肌酸酐比值偏高：{ratio}',
        elevatedAstAltRatio: 'AST/ALT 比值偏高：{ratio}'
      },
      'en': {
        unknownRange: 'Unknown value range: {rangeKey}',
        outOfRange: 'Value {value} {unit} is outside valid range ({min}-{max} {unit})',
        criticalValue: 'Critical value: {value} {unit}',
        abnormalValue: 'Abnormal value: {value} {unit} (normal range: {normalMin}-{normalMax} {unit})',
        normalValue: 'Normal value: {value} {unit}',
        invalidBloodPressure: 'Invalid blood pressure values',
        systolicLowerThanDiastolic: 'Systolic pressure cannot be lower than or equal to diastolic pressure',
        hypertensiveCrisis: 'Hypertensive crisis - immediate medical attention required',
        stage2Hypertension: 'Stage 2 hypertension',
        stage1Hypertension: 'Stage 1 hypertension',
        elevatedBloodPressure: 'Elevated blood pressure',
        normalBloodPressure: 'Normal blood pressure',
        invalidBMIInputs: 'Invalid weight or height values',
        underweight: 'BMI {bmi} - Underweight',
        normalWeight: 'BMI {bmi} - Normal weight',
        overweight: 'BMI {bmi} - Overweight',
        obeseClass1: 'BMI {bmi} - Class I obesity',
        obeseClass2: 'BMI {bmi} - Class II obesity',
        obeseClass3: 'BMI {bmi} - Class III obesity',
        dosageTooHigh: 'Dosage too high: {dose} mg ({dosePerKg} mg/kg)',
        dosageAcceptable: 'Dosage acceptable: {dose} mg ({dosePerKg} mg/kg)',
        elevatedBunCreatinineRatio: 'Elevated BUN/Creatinine ratio: {ratio}',
        elevatedAstAltRatio: 'Elevated AST/ALT ratio: {ratio}'
      },
      'ja': {
        unknownRange: '不明な値の範囲：{rangeKey}',
        outOfRange: '値 {value} {unit} が有効範囲外です ({min}-{max} {unit})',
        criticalValue: '危険値：{value} {unit}',
        abnormalValue: '異常値：{value} {unit} (正常範囲：{normalMin}-{normalMax} {unit})',
        normalValue: '正常値：{value} {unit}',
        invalidBloodPressure: '血圧値が無効です',
        systolicLowerThanDiastolic: '収縮期血圧は拡張期血圧以下にはできません',
        hypertensiveCrisis: '高血圧クリーゼ - 緊急医療処置が必要',
        stage2Hypertension: 'ステージ2高血圧',
        stage1Hypertension: 'ステージ1高血圧',
        elevatedBloodPressure: '血圧上昇',
        normalBloodPressure: '正常血圧',
        invalidBMIInputs: '体重または身長の値が無効です',
        underweight: 'BMI {bmi} - 低体重',
        normalWeight: 'BMI {bmi} - 正常体重',
        overweight: 'BMI {bmi} - 過体重',
        obeseClass1: 'BMI {bmi} - クラスI肥満',
        obeseClass2: 'BMI {bmi} - クラスII肥満',
        obeseClass3: 'BMI {bmi} - クラスIII肥満',
        dosageTooHigh: '用量が高すぎます：{dose} mg ({dosePerKg} mg/kg)',
        dosageAcceptable: '用量は許容範囲内：{dose} mg ({dosePerKg} mg/kg)',
        elevatedBunCreatinineRatio: 'BUN/クレアチニン比上昇：{ratio}',
        elevatedAstAltRatio: 'AST/ALT比上昇：{ratio}'
      }
    };

    let message = messages[this.locale]?.[key] || messages['zh-TW'][key] || key;
    
    // 替換參數
    Object.entries(params).forEach(([param, value]) => {
      message = message.replace(new RegExp(`{${param}}`, 'g'), String(value));
    });

    return message;
  }
}

/**
 * 建立醫療驗證器
 */
export function createMedicalValidator(locale: SupportedLocale = 'zh-TW'): MedicalValidator {
  return new MedicalValidator(locale);
}

/**
 * 快速驗證函數
 */
export function validateMedicalValue(
  value: number,
  type: string,
  locale: SupportedLocale = 'zh-TW'
): ValidationResult {
  const validator = new MedicalValidator(locale);
  return validator.validateRange(value, type);
}

/**
 * 批次驗證醫療數值
 */
export function validateMedicalValues(
  values: Record<string, number>,
  locale: SupportedLocale = 'zh-TW'
): Record<string, ValidationResult> {
  const validator = new MedicalValidator(locale);
  const results: Record<string, ValidationResult> = {};

  Object.entries(values).forEach(([key, value]) => {
    if (MEDICAL_RANGES[key]) {
      results[key] = validator.validateRange(value, key);
    }
  });

  return results;
}