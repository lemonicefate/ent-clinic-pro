import type { CalculatorPlugin } from '../../../../types/calculator-plugin.js';
import { calculate, validate, formatResult } from './calculator.js';
import PediatricAntibioticDashboard from './PediatricAntibioticDashboard.tsx';
import config from './config.json';

const PediatricAntibioticCalculatorPlugin: CalculatorPlugin = {
  metadata: {
    id: config.id,
    namespace: 'pediatrics',
    version: config.version,
    name: config.name,
    description: config.description,
    author: config.metadata.author,
    license: config.metadata.license,
    dependencies: [],
    conflicts: [],
    tags: config.metadata.tags,
    createdAt: new Date().toISOString(),
    updatedAt: config.metadata.lastUpdated || new Date().toISOString(),
  },

  config: {
    id: config.id,
    name: config.name,
    description: config.description,
    category: config.category,
    version: config.version,
    status: 'active',
    fields: config.ui.fields,
    calculation: config.calculation,
    medical: config.medical,
    metadata: config.metadata,
  },

  calculator: {
    calculate,
    validate,
    formatResult,
  },

  dashboard: PediatricAntibioticDashboard,

  async install() {
    console.log(`📦 Installing ${config.name['zh-TW']} Plugin...`);
    // 安裝邏輯 - 可以在這裡進行初始化設定
    return Promise.resolve();
  },

  async uninstall() {
    console.log(`🗑️ Uninstalling ${config.name['zh-TW']} Plugin...`);
    // 卸載邏輯 - 清理資源
    return Promise.resolve();
  },

  async validate() {
    // 驗證插件完整性
    try {
      // 檢查必要的函數是否存在
      if (typeof calculate !== 'function') {
        throw new Error('Calculate function is missing');
      }
      if (typeof validate !== 'function') {
        throw new Error('Validate function is missing');
      }
      if (typeof formatResult !== 'function') {
        throw new Error('FormatResult function is missing');
      }
      
      // 檢查配置完整性
      if (!config.id || !config.name || !config.description) {
        throw new Error('Plugin configuration is incomplete');
      }
      
      return true;
    } catch (error) {
      console.error('Plugin validation failed:', error);
      return false;
    }
  },

  async checkCompatibility() {
    return {
      compatible: true,
      issues: [],
    };
  },
};

export default PediatricAntibioticCalculatorPlugin;