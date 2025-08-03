/**
 * 模組載入器
 * 
 * 負責動態載入所有計算機模組。
 * 使用 Vite 的 import.meta.glob 功能自動發現和載入模組。
 */

import { CalculatorModule, ModuleLoadResult } from '../types';

export class ModuleLoader {
  private loadedModules = new Map<string, CalculatorModule>();

  /**
   * 載入所有計算機模組
   */
  async loadAllModules(): Promise<ModuleLoadResult[]> {
    const results: ModuleLoadResult[] = [];

    try {
      // 使用 Vite 的 import.meta.glob 動態載入所有模組
      const moduleImports = import.meta.glob('../modules/*/index.tsx');
      
      console.log(`🔍 Found ${Object.keys(moduleImports).length} potential calculator modules`);

      // 並行載入所有模組
      const loadPromises = Object.entries(moduleImports).map(([path, importFn]) =>
        this.loadSingleModule(path, importFn).catch(error => ({
          success: false,
          error: `Failed to load module from ${path}: ${error.message}`
        }))
      );

      const loadResults = await Promise.all(loadPromises);
      results.push(...loadResults);

      // 記錄載入統計
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      console.log(`📊 Module loading completed: ${successful} successful, ${failed} failed`);

      if (failed > 0) {
        console.warn('⚠️ Some modules failed to load:');
        results.filter(r => !r.success).forEach(result => {
          console.warn(`  - ${result.error}`);
        });
      }

    } catch (error) {
      console.error('❌ Critical error during module loading:', error);
      results.push({
        success: false,
        error: `Critical loading error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    return results;
  }

  /**
   * 載入單個模組
   */
  private async loadSingleModule(
    path: string, 
    importFn: () => Promise<any>
  ): Promise<ModuleLoadResult> {
    try {
      console.log(`📦 Loading module from: ${path}`);

      // 動態導入模組
      const moduleExport = await importFn();
      
      // 檢查模組導出
      if (!moduleExport || !moduleExport.default) {
        return {
          success: false,
          error: `Module at ${path} does not have a default export`
        };
      }

      const module = moduleExport.default as CalculatorModule;

      // 基本驗證
      if (!this.isValidModule(module)) {
        return {
          success: false,
          error: `Module at ${path} is not a valid CalculatorModule`
        };
      }

      // 檢查重複 ID
      if (this.loadedModules.has(module.id)) {
        return {
          success: false,
          error: `Module ID '${module.id}' is already loaded from another path`
        };
      }

      // 記錄已載入的模組
      this.loadedModules.set(module.id, module);

      console.log(`✅ Successfully loaded module: ${module.id}`);

      return {
        success: true,
        module
      };

    } catch (error) {
      console.error(`❌ Error loading module from ${path}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown loading error'
      };
    }
  }

  /**
   * 驗證模組是否有效
   */
  private isValidModule(obj: any): obj is CalculatorModule {
    if (!obj || typeof obj !== 'object') {
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
  async loadModule(modulePath: string): Promise<ModuleLoadResult> {
    try {
      const importFn = () => import(modulePath);
      return await this.loadSingleModule(modulePath, importFn);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
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