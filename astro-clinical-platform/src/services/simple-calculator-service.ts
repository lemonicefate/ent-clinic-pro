/**
 * Simple Calculator Service
 * 
 * A simplified version that works without the complex plugin system
 * to avoid build issues with astro:content imports.
 * 
 * Calculator Organization:
 * - Calculators are now organized by medical specialty under src/calculators/specialties/
 * - Each specialty has its own folder with relevant calculators
 * - Visualization configs are imported from the new specialty-based structure
 */

import type { SupportedLocale } from '../types/calculator.js';
import { getVisualizationConfig } from '../config/visualization-registry.js';

export interface CalculatorConfig {
  id: string;
  name: string;
  description: string;
  fields: Array<{
    id: string;
    type: 'number' | 'select' | 'checkbox' | 'radio' | 'radio-cards' | 'text';
    label: string | Record<SupportedLocale, string>;
    unit?: string;
    min?: number;
    max?: number;
    step?: number;
    required?: boolean;
    defaultValue?: any;
    placeholder?: string;
    options?: Array<{
      value: string;
      label: string | Record<SupportedLocale, string>;
      description?: string;
      subtitle?: string;
    }>;
  }>;
}

export interface VisualizationConfig {
  sections: Array<{
    title: string;
    cards: Array<{
      type: 'primary' | 'secondary' | 'info' | 'warning' | 'error';
      title: string;
      value: string | number;
      unit?: string;
      color?: string;
      description?: string;
      icon?: string;
    }>;
    layout?: 'grid' | 'list' | 'inline';
    columns?: number;
  }>;
  recommendations?: Array<{
    text: string;
    type: 'info' | 'warning' | 'success' | 'error';
  }>;
  notes?: string[];
}

export interface CalculatorData {
  config: CalculatorConfig;
  visualization?: VisualizationConfig;
}

// Simple calculator implementations (temporary until plugin system is fixed)
const calculatorImplementations = {
  'general.bmi': {
    config: {
      id: 'bmi',
      name: 'BMI 計算器',
      description: '計算身體質量指數 (BMI) 並評估體重狀態',
      fields: [
        {
          id: 'weight',
          type: 'number' as const,
          label: '體重',
          unit: 'kg',
          min: 1,
          max: 500,
          required: true
        },
        {
          id: 'height',
          type: 'number' as const,
          label: '身高',
          unit: 'cm',
          min: 50,
          max: 250,
          required: true
        }
      ]
    },
    calculate: (inputs: any) => {
      const weight = parseFloat(inputs.weight);
      const height = parseFloat(inputs.height) / 100;
      const bmi = weight / (height * height);

      let category = '';
      let color = '';

      if (bmi < 18.5) {
        category = '體重過輕';
        color = 'text-blue-600';
      } else if (bmi < 24) {
        category = '正常體重';
        color = 'text-green-600';
      } else if (bmi < 27) {
        category = '體重過重';
        color = 'text-yellow-600';
      } else {
        category = '肥胖';
        color = 'text-red-600';
      }

      return {
        bmi: bmi.toFixed(1),
        category,
        color,
      };
    }
  },
  'nephrology.egfr': {
    config: {
      id: 'egfr',
      name: 'eGFR 計算器',
      description: '估算腎絲球過濾率計算工具',
      fields: [
        {
          id: 'age',
          type: 'number' as const,
          label: '年齡',
          unit: '歲',
          min: 18,
          max: 120,
          required: true
        },
        {
          id: 'gender',
          type: 'select' as const,
          label: '性別',
          required: true,
          options: [
            { value: 'male', label: '男性' },
            { value: 'female', label: '女性' }
          ]
        },
        {
          id: 'creatinine',
          type: 'number' as const,
          label: '血清肌酸酐',
          unit: 'mg/dL',
          min: 0.1,
          max: 20,
          step: 0.1,
          required: true
        }
      ]
    },
    calculate: (inputs: any) => {
      const age = parseFloat(inputs.age);
      const creatinine = parseFloat(inputs.creatinine);
      const isFemale = inputs.gender === 'female';

      let egfr =
        142 *
        Math.pow(
          Math.min(creatinine / (isFemale ? 0.7 : 0.9), 1),
          isFemale ? -0.241 : -0.302
        ) *
        Math.pow(Math.max(creatinine / (isFemale ? 0.7 : 0.9), 1), -1.2) *
        Math.pow(0.9938, age);

      if (isFemale) egfr *= 1.012;

      let stage = '';
      let color = '';

      if (egfr >= 90) {
        stage = 'G1 (正常或高)';
        color = 'text-green-600';
      } else if (egfr >= 60) {
        stage = 'G2 (輕度下降)';
        color = 'text-yellow-600';
      } else if (egfr >= 45) {
        stage = 'G3a (輕度至中度下降)';
        color = 'text-orange-600';
      } else if (egfr >= 30) {
        stage = 'G3b (中度至重度下降)';
        color = 'text-red-600';
      } else if (egfr >= 15) {
        stage = 'G4 (重度下降)';
        color = 'text-red-700';
      } else {
        stage = 'G5 (腎衰竭)';
        color = 'text-red-800';
      }

      return {
        egfr: egfr.toFixed(0),
        stage,
        color,
      };
    }
  },
  'cardiology.cha2ds2-vasc': {
    config: {
      id: 'cha2ds2-vasc',
      name: 'CHA2DS2-VASc 評分',
      description: '評估心房顫動患者中風風險的臨床評分工具',
      fields: [
        {
          id: 'age',
          type: 'number' as const,
          label: '年齡',
          unit: '歲',
          min: 18,
          max: 120,
          required: true
        },
        {
          id: 'gender',
          type: 'select' as const,
          label: '性別',
          required: true,
          options: [
            { value: 'male', label: '男性' },
            { value: 'female', label: '女性' }
          ]
        },
        { id: 'chf', label: '充血性心衰竭', type: 'checkbox' as const },
        { id: 'hypertension', label: '高血壓', type: 'checkbox' as const },
        { id: 'diabetes', label: '糖尿病', type: 'checkbox' as const },
        { id: 'stroke', label: '中風/TIA/血栓病史', type: 'checkbox' as const },
        { id: 'vascular', label: '血管疾病', type: 'checkbox' as const }
      ]
    },
    calculate: (inputs: any) => {
      let score = 0;

      const age = parseFloat(inputs.age);
      if (age >= 65 && age < 75) score += 1;
      else if (age >= 75) score += 2;

      if (inputs.gender === 'female') score += 1;

      if (inputs.chf) score += 1;
      if (inputs.hypertension) score += 1;
      if (inputs.diabetes) score += 1;
      if (inputs.vascular) score += 1;
      if (inputs.stroke) score += 2;

      let risk = '';
      let color = '';
      let recommendation = '';

      if (inputs.gender === 'male' && score === 0) {
        risk = '低風險';
        color = 'text-green-600';
        recommendation = '不建議抗凝治療';
      } else if (score === 1) {
        risk = '低中等風險';
        color = 'text-yellow-600';
        recommendation = '考慮抗凝治療';
      } else {
        risk = '高風險';
        color = 'text-red-600';
        recommendation = '建議抗凝治療';
      }

      return {
        score,
        risk,
        color,
        recommendation,
      };
    }
  },
  'pediatrics.amoxicillin-clavulanate-dose': {
    config: {
      id: 'amoxicillin-clavulanate-dose',
      name: '兒童 Amoxicillin/Clavulanate 劑量計算器',
      description: '計算兒童 Amoxicillin/Clavulanate 的最佳劑量組合',
      fields: [
        {
          id: 'weight',
          type: 'number' as const,
          label: '兒童體重',
          unit: 'kg',
          min: 1,
          max: 100,
          required: true
        },
        {
          id: 'doseTarget',
          type: 'radio-cards' as const,
          label: 'Amoxicillin 劑量目標',
          required: true,
          options: [
            {
              value: 'low',
              label: '標準劑量',
              description: '45 mg/kg/day',
              subtitle: '適用於一般感染'
            },
            {
              value: 'high',
              label: '高劑量',
              description: '80-90 mg/kg/day',
              subtitle: '適用於頑固細菌，如中耳炎'
            }
          ]
        },
        {
          id: 'frequency',
          type: 'select' as const,
          label: '用藥頻次',
          defaultValue: '3',
          required: true,
          options: [
            { value: '2', label: '1天2次 (BID)' },
            { value: '3', label: '1天3次 (TID)' },
            { value: '4', label: '1天4次 (QID)' }
          ]
        },
        {
          id: 'days',
          type: 'select' as const,
          label: '治療天數',
          defaultValue: '3',
          required: true,
          options: [
            { value: '1', label: '1 天' },
            { value: '2', label: '2 天' },
            { value: '3', label: '3 天' },
            { value: '4', label: '4 天' },
            { value: '5', label: '5 天' }
          ]
        }
      ]
    },
    calculate: (inputs: any) => {
      const weight = parseFloat(inputs.weight);
      const doseTarget = inputs.doseTarget;
      const days = parseInt(inputs.days);
      const frequency = parseInt(inputs.frequency || '3');

      // Calculate target dose
      const targetDailyAmoDose = doseTarget === 'low' ? 45 : 85;
      const targetTotalAmox = targetDailyAmoDose * weight * days;

      // Find best combination (using only one type of Amoxicillin, considering Amox:Clav ratio)
      const findBestCombination = () => {
        const combinations = [];
        const maxCuram = 20;
        const maxAmox = 50;

        // Path A: Using Amox 500mg
        for (let numCuram = 0; numCuram <= maxCuram; numCuram++) {
          for (let numAmox500 = 0; numAmox500 <= maxAmox; numAmox500++) {
            const totalAmox = numCuram * 500 + numAmox500 * 500;
            const totalCla = numCuram * 125;
            const dailyClaDose = totalCla > 0 ? (totalCla / days) / weight : 0;

            // Calculate Amox:Clav ratio
            const ratio = totalCla > 0 ? totalAmox / totalCla : Infinity;

            // Safety and ratio checks
            if (dailyClaDose <= 10.0 && totalAmox > 0) {
              // If there's Clavulanate, check if ratio is within reasonable range (4:1 to 14:1)
              const ratioValid = totalCla === 0 || (ratio >= 4 && ratio <= 14);
              
              if (ratioValid) {
                const finalAmoDose = (totalAmox / days) / weight;
                const doseError = Math.abs(finalAmoDose - targetDailyAmoDose);
                
                // Calculate ratio error (ideal ratio is 14:1)
                const ratioError = totalCla > 0 ? Math.abs(ratio - 14) : 0;
                
                combinations.push({
                  numCuram,
                  numAmox500,
                  numAmox250: 0,
                  totalAmox,
                  totalCla,
                  finalAmoDose,
                  doseError,
                  ratio,
                  ratioError,
                  totalPills: numCuram + numAmox500
                });
              }
            }
          }
        }

        // Path B: Using Amox 250mg
        for (let numCuram = 0; numCuram <= maxCuram; numCuram++) {
          for (let numAmox250 = 0; numAmox250 <= maxAmox * 2; numAmox250++) {
            const totalAmox = numCuram * 500 + numAmox250 * 250;
            const totalCla = numCuram * 125;
            const dailyClaDose = totalCla > 0 ? (totalCla / days) / weight : 0;

            // Calculate Amox:Clav ratio
            const ratio = totalCla > 0 ? totalAmox / totalCla : Infinity;

            // Safety and ratio checks
            if (dailyClaDose <= 10.0 && totalAmox > 0) {
              // If there's Clavulanate, check if ratio is within reasonable range (4:1 to 14:1)
              const ratioValid = totalCla === 0 || (ratio >= 4 && ratio <= 14);
              
              if (ratioValid) {
                const finalAmoDose = (totalAmox / days) / weight;
                const doseError = Math.abs(finalAmoDose - targetDailyAmoDose);
                
                // Calculate ratio error (ideal ratio is 14:1)
                const ratioError = totalCla > 0 ? Math.abs(ratio - 14) : 0;
                
                combinations.push({
                  numCuram,
                  numAmox500: 0,
                  numAmox250,
                  totalAmox,
                  totalCla,
                  finalAmoDose,
                  doseError,
                  ratio,
                  ratioError,
                  totalPills: numCuram + numAmox250
                });
              }
            }
          }
        }

        if (combinations.length === 0) {
          return null;
        }

        // Multi-level selection strategy
        // 1. First find combinations with minimum dose error
        const minDoseError = Math.min(...combinations.map(c => c.doseError));
        const bestDoseCombos = combinations.filter(c => Math.abs(c.doseError - minDoseError) < 0.001);
        
        // 2. Among best dose combinations, select those with ratio closest to ideal
        const minRatioError = Math.min(...bestDoseCombos.map(c => c.ratioError));
        const bestRatioCombos = bestDoseCombos.filter(c => Math.abs(c.ratioError - minRatioError) < 0.001);
        
        // 3. Finally select the one with fewest pills
        return bestRatioCombos.reduce((best, current) => 
          current.totalPills < best.totalPills ? current : best
        );
      };

      const bestCombo = findBestCombination();

      if (!bestCombo) {
        return {
          error: true,
          message: '找不到安全的藥物組合',
          totalPills: 0,
          numCuram: 0,
          numAmox500: 0,
          numAmox250: 0,
          finalAmoDose: '0.0',
          days,
          frequency,
        };
      }

      return {
        totalPills: bestCombo.totalPills,
        numCuram: bestCombo.numCuram,
        numAmox500: bestCombo.numAmox500,
        numAmox250: bestCombo.numAmox250,
        finalAmoDose: bestCombo.finalAmoDose.toFixed(1),
        days,
        frequency,
        ratio: bestCombo.totalCla > 0 ? (bestCombo.totalAmox / bestCombo.totalCla).toFixed(1) : 'N/A',
      };
    }
  },
  'cardiology.lipid-management': {
    config: {
      id: 'lipid-management',
      name: '血脂管理與心血管風險計算機',
      description: '根據2022臺灣高血壓、高血脂、糖尿病指引，評估心血管風險並提供血脂管理建議',
      fields: [
        { id: 'hasASCVD', label: '冠狀動脈、腦血管或周邊動脈疾病 (ASCVD)', type: 'checkbox' as const },
        { id: 'hasDM', label: '糖尿病 (DM)', type: 'checkbox' as const },
        { id: 'hasCKD', label: '慢性腎臟病 (CKD，第三期以上)', type: 'checkbox' as const },
        { id: 'hasFH', label: '家族性高膽固醇血症 (FH)', type: 'checkbox' as const },
        {
          id: 'ldl',
          type: 'number' as const,
          label: '低密度脂蛋白膽固醇 (LDL-C)',
          unit: 'mg/dL',
          min: 50,
          max: 500,
          required: true,
          placeholder: '例如：135'
        },
        {
          id: 'tg',
          type: 'number' as const,
          label: '三酸甘油脂 (TG)',
          unit: 'mg/dL',
          min: 50,
          max: 1000,
          required: true,
          placeholder: '例如：250'
        },
        { id: 'isMaleAge', label: '男性 ≥ 45歲 或 女性 ≥ 55歲', type: 'checkbox' as const },
        { id: 'hasSmoking', label: '目前吸菸', type: 'checkbox' as const },
        { id: 'hasLowHDL', label: '高密度脂蛋白膽固醇 (HDL-C) < 40 mg/dL', type: 'checkbox' as const },
        { id: 'hasFamilyHistory', label: '早發性冠心病家族史', type: 'checkbox' as const },
        { id: 'hasHypertension', label: '高血壓', type: 'checkbox' as const }
      ]
    },
    calculate: (inputs: any) => {
      const ldl = parseFloat(inputs.ldl);
      const tg = parseFloat(inputs.tg);
      
      // Determine risk level
      let riskLevel = '';
      let ldlTarget = '';
      let color = '';
      
      if (inputs.hasASCVD || inputs.hasDM || inputs.hasCKD || inputs.hasFH) {
        riskLevel = '極高風險';
        ldlTarget = '< 70 mg/dL';
        color = 'text-red-600';
      } else {
        // Count other risk factors
        const riskFactors = [
          inputs.isMaleAge,
          inputs.hasSmoking,
          inputs.hasLowHDL,
          inputs.hasFamilyHistory,
          inputs.hasHypertension
        ].filter(Boolean).length;
        
        if (riskFactors >= 2) {
          riskLevel = '中高風險';
          ldlTarget = '< 100 mg/dL';
          color = 'text-orange-600';
        } else if (riskFactors === 1) {
          riskLevel = '中風險';
          ldlTarget = '< 130 mg/dL';
          color = 'text-yellow-600';
        } else {
          riskLevel = '低風險';
          ldlTarget = '< 160 mg/dL';
          color = 'text-green-600';
        }
      }
      
      // LDL status
      const targetValue = parseFloat(ldlTarget.match(/\d+/)?.[0] || '160');
      const ldlStatus = ldl > targetValue ? '⚠️ 超標' : '✅ 達標';
      
      // TG status
      let tgStatus = '';
      let tgColor = '';
      if (tg >= 500) {
        tgStatus = '🚨 過高 (有急性胰臟炎風險)';
        tgColor = 'text-red-600';
      } else if (tg >= 200) {
        tgStatus = '⚠️ 偏高';
        tgColor = 'text-orange-600';
      } else if (tg >= 150) {
        tgStatus = '⚠️ 輕度升高';
        tgColor = 'text-yellow-600';
      } else {
        tgStatus = '✅ 正常';
        tgColor = 'text-green-600';
      }
      
      // Medication advice
      let medicationNeeded = false;
      let reductionNeeded = 0;
      let medicationAdvice = '';
      
      if (ldl > targetValue) {
        medicationNeeded = true;
        reductionNeeded = Math.round(((ldl - targetValue) / ldl) * 100);
        
        if (reductionNeeded <= 30) {
          medicationAdvice = '建議低強度 Statin (如 Simvastatin 10 mg/day)';
        } else if (reductionNeeded <= 50) {
          medicationAdvice = '建議中強度 Statin (如 Atorvastatin 10-20 mg/day)';
        } else {
          medicationAdvice = '建議高強度 Statin (如 Atorvastatin 40-80 mg/day)';
        }
      } else {
        medicationAdvice = 'LDL-C 已達標，建議維持現有生活方式';
      }
      
      // Recommendations
      const recommendations = [
        '建議採用地中海飲食',
        '每週至少150分鐘中等強度運動'
      ];
      
      if (inputs.hasSmoking) {
        recommendations.push('強烈建議戒菸');
      }
      
      if (tg >= 200) {
        recommendations.push('三酸甘油脂偏高，建議調整飲食和運動');
      }
      
      if (medicationNeeded) {
        recommendations.push('建議與醫師討論藥物治療選項');
      }
      
      const riskFactorCount = [
        inputs.isMaleAge,
        inputs.hasSmoking,
        inputs.hasLowHDL,
        inputs.hasFamilyHistory,
        inputs.hasHypertension
      ].filter(Boolean).length;

      return {
        // Original fields
        riskLevel,
        ldlTarget,
        color,
        ldl,
        tg,
        tgValue: tg,
        ldlStatus,
        tgStatus,
        tgColor,
        medicationNeeded,
        reductionNeeded,
        medicationAdvice,
        recommendations,
        riskFactorCount,
        // Additional display fields
        primaryValue: ldl,
        primaryUnit: 'mg/dL',
        primaryLabel: 'LDL-C 膽固醇',
        secondaryValue: tg,
        secondaryUnit: 'mg/dL',
        secondaryLabel: '三酸甘油脂',
        interpretation: `風險等級：${riskLevel}，LDL-C 目標：${ldlTarget}`
      };
    }
  }
};

export class SimpleCalculatorService {
  private static instance: SimpleCalculatorService | null = null;
  private cache = new Map<string, CalculatorData>();

  private constructor() {}

  static getInstance(): SimpleCalculatorService {
    if (!this.instance) {
      this.instance = new SimpleCalculatorService();
    }
    return this.instance;
  }

  /**
   * Load calculator configuration
   */
  async loadCalculator(pluginId: string): Promise<CalculatorData> {
    // Check cache first
    if (this.cache.has(pluginId)) {
      return this.cache.get(pluginId)!;
    }

    const implementation = calculatorImplementations[pluginId as keyof typeof calculatorImplementations];
    
    if (!implementation) {
      throw new Error(`Calculator not found: ${pluginId}`);
    }

    const visualization = getVisualizationConfig(pluginId);

    const calculatorData: CalculatorData = {
      config: implementation.config,
      visualization
    };

    // Cache the result
    this.cache.set(pluginId, calculatorData);

    return calculatorData;
  }

  /**
   * Execute calculation
   */
  async calculate(pluginId: string, inputs: Record<string, any>): Promise<any> {
    const implementation = calculatorImplementations[pluginId as keyof typeof calculatorImplementations];
    
    if (!implementation) {
      throw new Error(`Calculator not found: ${pluginId}`);
    }

    return implementation.calculate(inputs);
  }

  /**
   * Validate inputs
   */
  async validate(pluginId: string, inputs: Record<string, any>): Promise<{ isValid: boolean; errors: any[] }> {
    const calculatorData = await this.loadCalculator(pluginId);
    const errors: any[] = [];

    // Basic validation
    calculatorData.config.fields.forEach(field => {
      if (field.required && (!inputs[field.id] || inputs[field.id] === '')) {
        errors.push({
          field: field.id,
          message: `${typeof field.label === 'string' ? field.label : field.label['zh-TW'] || field.id}為必填項目`
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}