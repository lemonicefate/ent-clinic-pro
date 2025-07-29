/**
 * BMI Calculator Plugin Example
 * 示範 BMI 計算器插件的實現
 */

import type { Plugin, PluginContext, PluginMetadata, PluginType } from '../core/plugin-manager';

// BMI 計算器介面
export interface BMICalculator {
  calculate(weight: number, height: number, unit: 'metric' | 'imperial'): BMIResult;
  getCategory(bmi: number): BMICategory;
  getRecommendations(bmi: number): string[];
}

export interface BMIResult {
  bmi: number;
  category: BMICategory;
  recommendations: string[];
  healthyRange: { min: number; max: number };
}

export enum BMICategory {
  UNDERWEIGHT = 'underweight',
  NORMAL = 'normal',
  OVERWEIGHT = 'overweight',
  OBESE_CLASS_1 = 'obese_class_1',
  OBESE_CLASS_2 = 'obese_class_2',
  OBESE_CLASS_3 = 'obese_class_3'
}

/**
 * BMI 計算器插件實現
 */
export class BMICalculatorPlugin implements Plugin {
  readonly metadata: PluginMetadata = {
    id: 'bmi-calculator',
    name: 'BMI Calculator',
    version: '1.0.0',
    description: 'Body Mass Index calculator with health recommendations',
    author: 'Astro Clinical Platform',
    type: PluginType.CALCULATOR,
    category: 'general-health',
    tags: ['calculator', 'bmi', 'health', 'weight'],
    homepage: 'https://astro-clinical.com/plugins/bmi-calculator',
    license: 'MIT',
    permissions: {
      api: ['medical.calculator'],
      storage: true,
      network: false,
      fileSystem: false,
      medicalData: false,
      patientData: false,
      adminAccess: false
    },
    medicalCompliance: {
      hipaa: false, // BMI calculation doesn't involve PHI
      fda: false,
      ce: false,
      iso13485: false
    },
    supportedLanguages: ['en', 'zh-TW', 'zh-CN', 'ja']
  };

  private context?: PluginContext;
  private calculator?: BMICalculator;

  async load(context: PluginContext): Promise<void> {
    this.context = context;
    context.logger.info('Loading BMI Calculator Plugin');

    // 初始化計算器
    this.calculator = new BMICalculatorImpl(context);

    context.logger.info('BMI Calculator Plugin loaded successfully');
  }

  async start(context: PluginContext): Promise<void> {
    context.logger.info('Starting BMI Calculator Plugin');

    // 註冊計算器擴展
    const pluginManager = (globalThis as any).pluginManager;
    if (pluginManager && this.calculator) {
      pluginManager.registerExtension({
        extensionPoint: 'medical.calculator',
        pluginId: this.metadata.id,
        priority: 90,
        implementation: this.calculator
      });
    }

    context.logger.info('BMI Calculator Plugin started successfully');
  }

  async stop(context: PluginContext): Promise<void> {
    context.logger.info('Stopping BMI Calculator Plugin');
    // 清理資源
  }

  async unload(context: PluginContext): Promise<void> {
    context.logger.info('Unloading BMI Calculator Plugin');
    this.calculator = undefined;
    this.context = undefined;
  }

  async healthCheck(): Promise<boolean> {
    return this.calculator !== undefined;
  }
}

/**
 * BMI 計算器實現
 */
class BMICalculatorImpl implements BMICalculator {
  
  constructor(private context: PluginContext) {}

  calculate(weight: number, height: number, unit: 'metric' | 'imperial' = 'metric'): BMIResult {
    // 輸入驗證
    if (weight <= 0 || height <= 0) {
      throw new Error('Weight and height must be positive numbers');
    }

    // 單位轉換
    let weightKg = weight;
    let heightM = height;

    if (unit === 'imperial') {
      // 磅轉公斤，英寸轉公尺
      weightKg = weight * 0.453592;
      heightM = height * 0.0254;
    } else {
      // 公制：確保身高是公尺單位
      if (height > 3) {
        // 假設輸入的是公分，轉換為公尺
        heightM = height / 100;
      }
    }

    // 計算 BMI
    const bmi = weightKg / (heightM * heightM);
    const roundedBMI = Math.round(bmi * 10) / 10;

    // 獲取分類和建議
    const category = this.getCategory(roundedBMI);
    const recommendations = this.getRecommendations(roundedBMI);

    return {
      bmi: roundedBMI,
      category,
      recommendations,
      healthyRange: { min: 18.5, max: 24.9 }
    };
  }

  getCategory(bmi: number): BMICategory {
    if (bmi < 18.5) {
      return BMICategory.UNDERWEIGHT;
    } else if (bmi < 25) {
      return BMICategory.NORMAL;
    } else if (bmi < 30) {
      return BMICategory.OVERWEIGHT;
    } else if (bmi < 35) {
      return BMICategory.OBESE_CLASS_1;
    } else if (bmi < 40) {
      return BMICategory.OBESE_CLASS_2;
    } else {
      return BMICategory.OBESE_CLASS_3;
    }
  }

  getRecommendations(bmi: number): string[] {
    const recommendations: string[] = [];

    switch (this.getCategory(bmi)) {
      case BMICategory.UNDERWEIGHT:
        recommendations.push(
          'Consider consulting with a healthcare provider about healthy weight gain strategies',
          'Focus on nutrient-dense foods and regular meals',
          'Consider strength training to build muscle mass'
        );
        break;

      case BMICategory.NORMAL:
        recommendations.push(
          'Maintain your current healthy weight through balanced diet and regular exercise',
          'Continue with regular physical activity (at least 150 minutes per week)',
          'Monitor your weight regularly to maintain this healthy range'
        );
        break;

      case BMICategory.OVERWEIGHT:
        recommendations.push(
          'Consider gradual weight loss through diet and exercise modifications',
          'Aim for 1-2 pounds of weight loss per week',
          'Increase physical activity and focus on portion control',
          'Consider consulting with a healthcare provider or nutritionist'
        );
        break;

      case BMICategory.OBESE_CLASS_1:
        recommendations.push(
          'Weight loss is recommended - consult with a healthcare provider',
          'Consider a structured weight loss program',
          'Focus on sustainable lifestyle changes rather than quick fixes',
          'Regular monitoring of blood pressure, cholesterol, and blood sugar'
        );
        break;

      case BMICategory.OBESE_CLASS_2:
        recommendations.push(
          'Significant weight loss is recommended - medical supervision advised',
          'Consider comprehensive weight management programs',
          'Regular health screenings for diabetes, heart disease, and other conditions',
          'May benefit from consultation with obesity medicine specialist'
        );
        break;

      case BMICategory.OBESE_CLASS_3:
        recommendations.push(
          'Immediate medical consultation recommended',
          'Consider all available treatment options including medical and surgical interventions',
          'Comprehensive health evaluation and monitoring required',
          'Multidisciplinary approach with healthcare team recommended'
        );
        break;
    }

    // 通用建議
    recommendations.push(
      'Remember: BMI is a screening tool and doesn\'t account for muscle mass, bone density, or body composition',
      'Always consult with healthcare professionals for personalized medical advice'
    );

    return recommendations;
  }
}

// 導出插件實例
export default new BMICalculatorPlugin();