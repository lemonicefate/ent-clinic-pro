/**
 * Amoxicillin/Clavulanate 劑量計算機模組
 * 
 * 兒童 Amoxicillin/Clavulanate 劑量計算模組
 */

import { CalculatorModule } from '../../types';
import AmoxicillinClavulanateForm from './AmoxicillinClavulanateForm';
import AmoxicillinClavulanateResults from './AmoxicillinClavulanateResults';
import { calculate, validate, formatResult } from './calculator';
import { config } from './config';

const AmoxicillinClavulanateModule: CalculatorModule = {
  id: 'amoxicillin-clavulanate-dose',
  config,
  FormComponent: AmoxicillinClavulanateForm,
  ResultsComponent: AmoxicillinClavulanateResults,
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
          '支援兒童 Amoxicillin/Clavulanate 劑量計算',
          '智能藥錠組合建議',
          '多語言支援 (中文、英文、日文)'
        ]
      }
    ]
  },

  // 生命週期鉤子
  onLoad: async () => {
    console.log('🏥 Amoxicillin/Clavulanate Calculator module loaded');
  },

  onUnload: async () => {
    console.log('👋 Amoxicillin/Clavulanate Calculator module unloaded');
  },

  onError: (error: Error) => {
    console.error('❌ Amoxicillin/Clavulanate Calculator module error:', error);
  }
};

export default AmoxicillinClavulanateModule;