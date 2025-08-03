/**
 * CHA2DS2-VASc 計算機模組
 * 
 * 完全獨立的 CHA2DS2-VASc 計算機模組，包含專用的 Form 和 Results 組件。
 * 用於評估心房顫動患者的中風風險。
 */

import { CalculatorModule } from '../../types';
import CHA2DS2VAScForm from './CHA2DS2VAScForm';
import CHA2DS2VAScResults from './CHA2DS2VAScResults';
import { calculate, validate, formatResult } from './calculator';
import { config } from './config';

const CHA2DS2VAScModule: CalculatorModule = {
  id: 'cha2ds2-vasc',
  config,
  FormComponent: CHA2DS2VAScForm,
  ResultsComponent: CHA2DS2VAScResults,
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
          '支援 CHA2DS2-VASc 評分計算',
          '完整的中風風險評估',
          '抗凝治療建議',
          '多語言支援 (中文、英文、日文)',
          '個人化臨床建議',
          '詳細的評分步驟說明'
        ]
      }
    ]
  },

  // 生命週期鉤子
  onLoad: async () => {
    console.log('🏥 CHA2DS2-VASc Calculator module loaded');
  },

  onUnload: async () => {
    console.log('👋 CHA2DS2-VASc Calculator module unloaded');
  },

  onError: (error: Error) => {
    console.error('❌ CHA2DS2-VASc Calculator module error:', error);
  }
};

export default CHA2DS2VAScModule;