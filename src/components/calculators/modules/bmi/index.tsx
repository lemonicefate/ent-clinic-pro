/**
 * BMI 計算機模組
 * 
 * 完全獨立的 BMI 計算機模組，包含專用的 Form 和 Results 組件。
 */

import { CalculatorModule } from '../../types';
import BMIForm from './BMIForm';
import BMIResults from './BMIResults';
import { calculate, validate, formatResult } from './calculator';
import { config } from './config';

const BMIModule: CalculatorModule = {
  id: 'bmi',
  config,
  FormComponent: BMIForm,
  ResultsComponent: BMIResults,
  calculator: {
    calculate,
    validate,
    formatResult
  },
  metadata: {
    version: '1.0.0',
    author: 'Astro Clinical Platform',
    lastUpdated: new Date().toISOString(),
    dependencies: [],
    conflicts: [],
    changelog: [
      {
        version: '1.0.0',
        date: '2024-01-26',
        changes: [
          '初始版本發布',
          '支援 BMI 計算和健康評估',
          '多語言支援 (中文、英文、日文)',
          '個人化健康建議'
        ]
      }
    ]
  },

  // 生命週期鉤子
  onLoad: async () => {
    console.log('🏥 BMI Calculator module loaded');
  },

  onUnload: async () => {
    console.log('👋 BMI Calculator module unloaded');
  },

  onError: (error: Error) => {
    console.error('❌ BMI Calculator module error:', error);
  }
};

export default BMIModule;