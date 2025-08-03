/**
 * 血脂管理計算機模組
 */

import { CalculatorModule } from '../../types';
import LipidManagementForm from './LipidManagementForm';
import LipidManagementResults from './LipidManagementResults';
import { calculate, validate } from './calculator';
import { config } from './config';

const LipidManagementModule: CalculatorModule = {
  id: 'lipid-management',
  config,
  FormComponent: LipidManagementForm,
  ResultsComponent: LipidManagementResults,
  calculator: { calculate, validate },
  metadata: {
    version: '1.0.0',
    author: 'Medical Team',
    lastUpdated: new Date().toISOString(),
    dependencies: [],
    changelog: [
      {
        version: '1.0.0',
        date: '2025-01-30',
        changes: [
          '初始版本發布',
          '實現基於2022臺灣指引的心血管風險評估',
          '提供完整的血脂管理建議',
          '支援多語言介面'
        ]
      }
    ]
  }
};

export default LipidManagementModule;