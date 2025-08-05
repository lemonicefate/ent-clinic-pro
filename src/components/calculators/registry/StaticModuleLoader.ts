/**
 * 靜態模組載入器
 * 
 * 手動導入所有計算機模組，避免 import.meta.glob 在 SSG 模式下的問題。
 */

import { CalculatorModule, ModuleLoadResult } from '../types';

// 手動導入所有模組
import BMIModule from '../modules/bmi/index.tsx';
import EGFRModule from '../modules/egfr/index.tsx';
import CHA2DS2VAScModule from '../modules/cha2ds2-vasc/index.tsx';
import LipidManagementModule from '../modules/lipid-management/index.tsx';
import AmoxicillinClavulanateModule from '../modules/amoxicillin-clavulanate-dose/index.tsx';
import PediatricAntibioticModule from '../modules/pediatric-antibiotic-calculator/index.tsx';

export class StaticModuleLoader {
  private loadedModules = new Map<string, CalculatorModule>();

  /**
   * 載入所有計算機模組
   */
  async loadAllModules(): Promise<ModuleLoadResult[]> {
    const results: ModuleLoadResult[] = [];

    // 靜態模組列表
    const modules = [
      { name: 'BMI', module: BMIModule },
      { name: 'eGFR', module: EGFRModule },
      { name: 'CHA2DS2-VASc', module: CHA2DS2VAScModule },
      { name: 'Lipid Management', module: LipidManagementModule },
      { name: 'Amoxicillin/Clavulanate', module: AmoxicillinClavulanateModule },
      { name: 'Pediatric Antibiotic', module: PediatricAntibioticModule }
    ];

    console.log(`🔍 Loading ${modules.length} static calculator modules`);

    for (const { name, module } of modules) {
      try {
        console.log(`📦 Loading ${name} module...`);

        // 驗證模組
        if (!this.isValidModule(module)) {
          results.push({
            success: false,
            error: `${name} module is not valid`
          });
          continue;
        }

        // 檢查重複 ID
        if (this.loadedModules.has(module.id)) {
          results.push({
            success: false,
            error: `Module ID '${module.id}' is already loaded`
          });
          continue;
        }

        // 記錄已載入的模組
        this.loadedModules.set(module.id, module);

        results.push({
          success: true,
          module
        });

        console.log(`✅ Successfully loaded ${name} module: ${module.id}`);

      } catch (error) {
        console.error(`❌ Error loading ${name} module:`, error);
        results.push({
          success: false,
          error: `Failed to load ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    // 記錄載入統計
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`📊 Static module loading completed: ${successful} successful, ${failed} failed`);

    if (failed > 0) {
      console.warn('⚠️ Some modules failed to load:');
      results.filter(r => !r.success).forEach(result => {
        console.warn(`  - ${result.error}`);
      });
    }

    return results;
  }

  /**
   * 驗證模組是否有效
   */
  private isValidModule(obj: any): obj is CalculatorModule {
    if (!obj || typeof obj !== 'object') {
      console.error('Module is not an object');
      return false;
    }

    // 檢查必要屬性
    const requiredProps = ['id', 'config', 'FormComponent', 'ResultsComponent', 'calculator', 'metadata'];
    
    for (const prop of requiredProps) {
      if (!(prop in obj)) {
        console.error(`Missing required property: ${prop}`);
        return false;
      }
    }

    // 檢查 ID 類型
    if (typeof obj.id !== 'string' || obj.id.trim() === '') {
      console.error('Module ID must be a non-empty string');
      return false;
    }

    // 檢查組件類型
    if (typeof obj.FormComponent !== 'function') {
      console.error('FormComponent must be a React component');
      return false;
    }

    if (typeof obj.ResultsComponent !== 'function') {
      console.error('ResultsComponent must be a React component');
      return false;
    }

    // 檢查計算器實現
    if (!obj.calculator || typeof obj.calculator !== 'object') {
      console.error('calculator must be an object');
      return false;
    }

    if (typeof obj.calculator.calculate !== 'function') {
      console.error('calculator.calculate must be a function');
      return false;
    }

    if (typeof obj.calculator.validate !== 'function') {
      console.error('calculator.validate must be a function');
      return false;
    }

    // 檢查配置
    if (!obj.config || typeof obj.config !== 'object') {
      console.error('config must be an object');
      return false;
    }

    if (obj.config.id !== obj.id) {
      console.error('config.id must match module.id');
      return false;
    }

    return true;
  }

  /**
   * 載入特定模組
   */
  async loadModule(moduleId: string): Promise<ModuleLoadResult> {
    const module = this.loadedModules.get(moduleId);
    if (module) {
      return {
        success: true,
        module
      };
    }

    return {
      success: false,
      error: `Module ${moduleId} not found`
    };
  }

  /**
   * 獲取已載入的模組列表
   */
  getLoadedModules(): CalculatorModule[] {
    return Array.from(this.loadedModules.values());
  }

  /**
   * 清空已載入的模組
   */
  clear(): void {
    this.loadedModules.clear();
  }

  /**
   * 檢查模組是否已載入
   */
  isLoaded(moduleId: string): boolean {
    return this.loadedModules.has(moduleId);
  }
}