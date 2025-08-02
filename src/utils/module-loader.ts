/**
 * 模組載入器
 * 
 * 負責在建置時自動探索和載入所有計算機模組
 * 使用 Astro.glob() 實現動態模組探索
 */

import type { CalculatorConfig, CalculatorModule, CalculatorImplementation } from '../types/calculator';

/**
 * 載入所有計算機模組
 */
export async function loadAllCalculatorModules(): Promise<CalculatorModule[]> {
  try {
    // 使用 Astro.glob 自動探索所有計算機配置文件
    const configFiles = await import.meta.glob('../calculators/*/config.json');
    const calculatorFiles = await import.meta.glob('../calculators/*/calculator.ts');
    
    const modules: CalculatorModule[] = [];

    for (const configPath in configFiles) {
      try {
        // 提取計算機 ID
        const calculatorId = extractCalculatorId(configPath);
        
        // 跳過模板
        if (calculatorId === '_template') {
          continue;
        }

        // 載入配置文件
        const configModule = await configFiles[configPath]();
        const config = (configModule as any).default as CalculatorConfig;

        // 驗證配置
        const validation = validateCalculatorConfig(config);
        if (!validation.isValid) {
          console.warn(`計算機 ${calculatorId} 配置無效:`, validation.errors);
          continue;
        }

        // 載入計算機實現
        const calculatorPath = configPath.replace('/config.json', '/calculator.ts');
        if (calculatorFiles[calculatorPath]) {
          const calculatorModule = await calculatorFiles[calculatorPath]();
          const calculator = calculatorModule as CalculatorImplementation;

          // 創建模組
          const module: CalculatorModule = {
            config,
            calculator,
            visualization: config.visualization
          };

          modules.push(module);
        } else {
          console.warn(`找不到計算機 ${calculatorId} 的實現文件`);
        }
      } catch (error) {
        console.error(`載入計算機模組時發生錯誤:`, error);
      }
    }

    console.log(`成功載入 ${modules.length} 個計算機模組`);
    return modules;
  } catch (error) {
    console.error('載入計算機模組失敗:', error);
    return [];
  }
}

/**
 * 載入單個計算機模組
 */
export async function loadCalculatorModule(calculatorId: string): Promise<CalculatorModule | null> {
  try {
    // 載入配置文件
    const config = await loadCalculatorConfig(calculatorId);
    if (!config) {
      return null;
    }

    // 載入計算機實現
    const calculator = await loadCalculatorImplementation(calculatorId);
    if (!calculator) {
      return null;
    }

    return {
      config,
      calculator,
      visualization: config.visualization
    };
  } catch (error) {
    console.error(`載入計算機模組 ${calculatorId} 失敗:`, error);
    return null;
  }
}

/**
 * 載入計算機配置
 */
export async function loadCalculatorConfig(calculatorId: string): Promise<CalculatorConfig | null> {
  try {
    const configModule = await import(`../calculators/${calculatorId}/config.json`);
    const config = configModule.default as CalculatorConfig;

    // 驗證配置
    const validation = validateCalculatorConfig(config);
    if (!validation.isValid) {
      console.error(`計算機 ${calculatorId} 配置無效:`, validation.errors);
      return null;
    }

    return config;
  } catch (error) {
    console.error(`載入計算機配置 ${calculatorId} 失敗:`, error);
    return null;
  }
}

/**
 * 載入計算機實現
 */
export async function loadCalculatorImplementation(calculatorId: string): Promise<CalculatorImplementation | null> {
  try {
    const calculatorModule = await import(`../calculators/${calculatorId}/calculator.ts`);
    
    // 驗證實現是否包含必要的函式
    if (!calculatorModule.calculate || !calculatorModule.validate || !calculatorModule.formatResult) {
      console.error(`計算機 ${calculatorId} 實現不完整，缺少必要的函式`);
      return null;
    }

    return {
      calculate: calculatorModule.calculate,
      validate: calculatorModule.validate,
      formatResult: calculatorModule.formatResult
    };
  } catch (error) {
    console.error(`載入計算機實現 ${calculatorId} 失敗:`, error);
    return null;
  }
}

/**
 * 從路徑提取計算機 ID
 */
function extractCalculatorId(configPath: string): string {
  const matches = configPath.match(/calculators\/([^\/]+)\/config\.json/);
  return matches ? matches[1] : '';
}

/**
 * 驗證計算機配置
 */
function validateCalculatorConfig(config: CalculatorConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 檢查必填欄位
  if (!config.id) errors.push('ID 為必填欄位');
  if (!config.name?.['zh-TW']) errors.push('中文名稱為必填欄位');
  if (!config.description?.['zh-TW']) errors.push('中文描述為必填欄位');
  if (!config.category) errors.push('分類為必填欄位');
  if (!config.version) errors.push('版本號為必填欄位');
  if (!config.status) errors.push('狀態為必填欄位');

  // 檢查 ID 格式
  if (config.id && !/^[a-z0-9-]+$/.test(config.id)) {
    errors.push('ID 只能包含小寫字母、數字和連字符');
  }

  // 檢查版本號格式
  if (config.version && !/^\d+\.\d+\.\d+$/.test(config.version)) {
    errors.push('版本號必須遵循語義化版本規範 (x.y.z)');
  }

  // 檢查欄位定義
  if (!config.fields || config.fields.length === 0) {
    errors.push('至少需要定義一個輸入欄位');
  } else {
    config.fields.forEach((field, index) => {
      if (!field.id) errors.push(`欄位 ${index + 1} 缺少 ID`);
      if (!field.type) errors.push(`欄位 ${field.id || index + 1} 缺少類型`);
      if (!field.label?.['zh-TW']) errors.push(`欄位 ${field.id || index + 1} 缺少中文標籤`);
      
      // 檢查選擇類型欄位的選項
      if ((field.type === 'select' || field.type === 'radio') && (!field.options || field.options.length === 0)) {
        errors.push(`欄位 ${field.id || index + 1} 缺少選項定義`);
      }
    });
  }

  // 檢查計算配置
  if (!config.calculation?.functionName) {
    errors.push('必須指定計算函式名稱');
  }

  // 檢查醫療資訊
  if (!config.medical?.specialty || config.medical.specialty.length === 0) {
    errors.push('至少需要指定一個醫療專科');
  }

  if (!config.medical?.evidenceLevel) {
    errors.push('必須指定證據等級');
  }

  // 檢查元資料
  if (!config.metadata?.author) {
    errors.push('必須指定作者');
  }

  if (!config.metadata?.lastUpdated) {
    errors.push('必須指定最後更新日期');
  }

  // 檢查日期格式
  if (config.metadata?.lastUpdated && !/^\d{4}-\d{2}-\d{2}$/.test(config.metadata.lastUpdated)) {
    errors.push('最後更新日期格式必須為 YYYY-MM-DD');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 獲取可用的計算機 ID 列表
 */
export async function getAvailableCalculatorIds(): Promise<string[]> {
  try {
    const configFiles = await import.meta.glob('../calculators/*/config.json');
    const ids: string[] = [];

    for (const configPath in configFiles) {
      const calculatorId = extractCalculatorId(configPath);
      if (calculatorId && calculatorId !== '_template') {
        ids.push(calculatorId);
      }
    }

    return ids.sort();
  } catch (error) {
    console.error('獲取計算機 ID 列表失敗:', error);
    return [];
  }
}

/**
 * 檢查計算機是否存在
 */
export async function calculatorExists(calculatorId: string): Promise<boolean> {
  try {
    const config = await loadCalculatorConfig(calculatorId);
    return config !== null;
  } catch {
    return false;
  }
}

/**
 * 獲取計算機模組的元資料
 */
export async function getCalculatorMetadata(calculatorId: string): Promise<{
  id: string;
  name: string;
  category: string;
  version: string;
  status: string;
  lastUpdated: string;
} | null> {
  try {
    const config = await loadCalculatorConfig(calculatorId);
    if (!config) return null;

    return {
      id: config.id,
      name: config.name['zh-TW'],
      category: config.category,
      version: config.version,
      status: config.status,
      lastUpdated: config.metadata.lastUpdated
    };
  } catch (error) {
    console.error(`獲取計算機元資料 ${calculatorId} 失敗:`, error);
    return null;
  }
}

/**
 * 載入計算機的測試套件
 */
export async function loadCalculatorTests(calculatorId: string): Promise<any | null> {
  // 只在測試環境中載入測試文件
  if (import.meta.env.MODE !== 'test' && typeof import.meta.vitest === 'undefined') {
    return null;
  }
  
  try {
    const testModule = await import(`../calculators/${calculatorId}/calculator.test.ts`);
    return testModule;
  } catch (error) {
    console.warn(`載入計算機測試 ${calculatorId} 失敗:`, error);
    return null;
  }
}

/**
 * 預載入所有計算機模組（用於效能優化）
 */
export async function preloadCalculatorModules(): Promise<void> {
  try {
    const modules = await loadAllCalculatorModules();
    console.log(`預載入完成，共 ${modules.length} 個模組`);
  } catch (error) {
    console.error('預載入計算機模組失敗:', error);
  }
}

/**
 * 熱重載計算機模組（開發時使用）
 */
export async function hotReloadCalculatorModule(calculatorId: string): Promise<CalculatorModule | null> {
  try {
    // 清除模組快取（在支援的環境中）
    if (typeof window !== 'undefined' && (window as any).__vite_plugin_react_preamble_installed__) {
      // Vite 熱重載支援
      const configPath = `../calculators/${calculatorId}/config.json`;
      const calculatorPath = `../calculators/${calculatorId}/calculator.ts`;
      
      // 重新載入模組
      delete require.cache[require.resolve(configPath)];
      delete require.cache[require.resolve(calculatorPath)];
    }

    return await loadCalculatorModule(calculatorId);
  } catch (error) {
    console.error(`熱重載計算機模組 ${calculatorId} 失敗:`, error);
    return null;
  }
}

/**
 * 驗證所有計算機模組
 */
export async function validateAllCalculatorModules(): Promise<{
  valid: string[];
  invalid: Array<{ id: string; errors: string[] }>;
}> {
  const valid: string[] = [];
  const invalid: Array<{ id: string; errors: string[] }> = [];

  try {
    const configFiles = await import.meta.glob('../calculators/*/config.json');

    for (const configPath in configFiles) {
      const calculatorId = extractCalculatorId(configPath);
      
      if (calculatorId === '_template') continue;

      try {
        const configModule = await configFiles[configPath]();
        const config = (configModule as any).default as CalculatorConfig;
        
        const validation = validateCalculatorConfig(config);
        
        if (validation.isValid) {
          valid.push(calculatorId);
        } else {
          invalid.push({
            id: calculatorId,
            errors: validation.errors
          });
        }
      } catch (error) {
        invalid.push({
          id: calculatorId,
          errors: [`載入失敗: ${error}`]
        });
      }
    }
  } catch (error) {
    console.error('驗證計算機模組失敗:', error);
  }

  return { valid, invalid };
}

export default {
  loadAllCalculatorModules,
  loadCalculatorModule,
  loadCalculatorConfig,
  loadCalculatorImplementation,
  getAvailableCalculatorIds,
  calculatorExists,
  getCalculatorMetadata,
  loadCalculatorTests,
  preloadCalculatorModules,
  hotReloadCalculatorModule,
  validateAllCalculatorModules
};