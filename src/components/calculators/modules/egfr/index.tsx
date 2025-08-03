/**
 * eGFR 計算機模組
 * 
 * 完全獨立的 eGFR 計算機模組，包含專用的 Form 和 Results 組件。
 * 使用 CKD-EPI 2021 公式進行腎功能評估。
 */

import { CalculatorModule } from '../../types';
import EGFRForm from './EGFRForm';
import EGFRResults from './EGFRResults';
import { calculate, validate, formatResult } from './calculator';
import { config } from './config';

const EGFRModule: CalculatorModule = {
  id: 'egfr',
  config,
  FormComponent: EGFRForm,
  ResultsComponent: EGFRResults,
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
          '支援 CKD-EPI 2021 公式計算',
          '完整的 CKD 分期評估',
          '多語言支援 (中文、英文、日文)',
          '個人化治療建議和後續步驟',
          '詳細的計算步驟說明'
        ]
      }
    ]
  },

  // 生命週期鉤子
  onLoad: async () => {
    console.log('🏥 eGFR Calculator module loaded');
  },

  onUnload: async () => {
    console.log('👋 eGFR Calculator module unloaded');
  },

  onError: (error: Error) => {
    console.error('❌ eGFR Calculator module error:', error);
  }
};

export default EGFRModule;