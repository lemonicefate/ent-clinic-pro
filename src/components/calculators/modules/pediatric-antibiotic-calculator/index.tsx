/**
 * 兒童抗生素劑量計算機模組
 * 
 * 專業的兒童抗生素劑量計算工具
 */

import { CalculatorModule } from '../../types';
import PediatricAntibioticForm from './PediatricAntibioticForm';
import PediatricAntibioticResults from './PediatricAntibioticResults';
import { calculate, validate, formatResult } from './calculator';
import { config } from './config';

const PediatricAntibioticModule: CalculatorModule = {
  id: 'pediatric-antibiotic-calculator',
  config,
  FormComponent: PediatricAntibioticForm,
  ResultsComponent: PediatricAntibioticResults,
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
          '支援多種兒童抗生素劑量計算',
          '包含抗病毒藥物計算',
          '多語言支援 (中文、英文、日文)'
        ]
      }
    ]
  },

  // 生命週期鉤子
  onLoad: async () => {
    console.log('🏥 Pediatric Antibiotic Calculator module loaded');
  },

  onUnload: async () => {
    console.log('👋 Pediatric Antibiotic Calculator module unloaded');
  },

  onError: (error: Error) => {
    console.error('❌ Pediatric Antibiotic Calculator module error:', error);
  }
};

export default PediatricAntibioticModule;