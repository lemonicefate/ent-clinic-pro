/**
 * 計算機服務抽象層
 * 
 * 提供統一的計算機資料存取介面，支援 Astro.glob() 模組自動探索、
 * 配置載入驗證、快取和效能優化。設計為可擴展的抽象層，
 * 未來可輕鬆切換到後端 API。
 */

import type { 
  CalculatorConfig, 
  CalculatorModule, 
  SearchQuery,
  CalculationResult,
  SupportedLocale 
} from '../types/calculator';

// 服務配置選項
export interface CalculatorServiceOptions {
  /** 快取持續時間（毫秒） */
  cacheDuration?: number;
  /** 是否啟用快取 */
  enableCache?: boolean;
  /** 是否啟用驗證 */
  enableValidation?: boolean;
  /** 預設語言 */
  defaultLocale?: SupportedLocale;
  /** 是否包含草稿狀態的計算機 */
  includeDrafts?: boolean;
}

// 載入選項
export interface LoadOptions {
  /** 是否包含非活躍的計算機 */
  includeInactive?: boolean;
  /** 按分類篩選 */
  category?: string;
  /** 按專科篩選 */
  specialty?: string;
  /** 按難度篩選 */
  difficulty?: 'basic' | 'intermediate' | 'advanced';
  /** 按證據等級篩選 */
  evidenceLevel?: 'A' | 'B' | 'C' | 'D';
  /** 是否只載入精選計算機 */
  featuredOnly?: boolean;
  /** 語言 */
  locale?: SupportedLocale;
}

// 快取項目
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// 驗證結果
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// 統計資料
export interface ServiceStats {
  totalCalculators: number;
  activeCalculators: number;
  categoriesCount: number;
  specialtiesCount: number;
  lastUpdated: string;
  cacheHitRate: number;
  averageLoadTime: number;
}

/**
 * 計算機服務抽象類別
 * 
 * 定義了計算機資料存取的標準介面，具體實現可以是
 * 本地檔案系統、遠端 API 或混合模式。
 */
export abstract class CalculatorService {
  protected options: Required<CalculatorServiceOptions>;
  protected cache = new Map<string, CacheItem<any>>();
  protected stats = {
    cacheHits: 0,
    cacheMisses: 0,
    totalRequests: 0,
    loadTimes: [] as number[]
  };

  constructor(options: CalculatorServiceOptions = {}) {
    this.options = {
      cacheDuration: options.cacheDuration ?? 5 * 60 * 1000, // 5 分鐘
      enableCache: options.enableCache ?? true,
      enableValidation: options.enableValidation ?? true,
      defaultLocale: options.defaultLocale ?? 'zh-TW',
      includeDrafts: options.includeDrafts ?? false
    };
  }

  /**
   * 載入所有計算機模組
   */
  abstract loadAllModules(options?: LoadOptions): Promise<CalculatorModule[]>;

  /**
   * 根據 ID 載入計算機模組
   */
  abstract loadModuleById(id: string): Promise<CalculatorModule | null>;

  /**
   * 搜尋計算機模組
   */
  abstract searchModules(query: SearchQuery): Promise<CalculatorModule[]>;

  /**
   * 驗證計算機配置
   */
  abstract validateConfig(config: CalculatorConfig): ValidationResult;

  /**
   * 獲取計算機配置
   */
  async getCalculatorConfig(id: string): Promise<CalculatorConfig | null> {
    const startTime = performance.now();
    
    try {
      const cacheKey = `config-${id}`;
      
      // 檢查快取
      if (this.options.enableCache) {
        const cached = this.getCachedItem<CalculatorConfig>(cacheKey);
        if (cached) {
          this.stats.cacheHits++;
          return cached;
        }
        this.stats.cacheMisses++;
      }

      // 載入模組
      const module = await this.loadModuleById(id);
      if (!module) return null;

      const config = module.config;

      // 驗證配置
      if (this.options.enableValidation) {
        const validation = this.validateConfig(config);
        if (!validation.isValid) {
          console.warn(`Invalid calculator config for ${id}:`, validation.errors);
        }
      }

      // 設定快取
      if (this.options.enableCache) {
        this.setCachedItem(cacheKey, config);
      }

      return config;
    } finally {
      this.recordLoadTime(performance.now() - startTime);
    }
  }

  /**
   * 獲取所有計算機配置
   */
  async getAllCalculatorConfigs(options: LoadOptions = {}): Promise<CalculatorConfig[]> {
    const startTime = performance.now();
    
    try {
      const cacheKey = `all-configs-${JSON.stringify(options)}`;
      
      // 檢查快取
      if (this.options.enableCache) {
        const cached = this.getCachedItem<CalculatorConfig[]>(cacheKey);
        if (cached) {
          this.stats.cacheHits++;
          return cached;
        }
        this.stats.cacheMisses++;
      }

      // 載入所有模組
      const modules = await this.loadAllModules(options);
      const configs = modules.map(module => module.config);

      // 設定快取
      if (this.options.enableCache) {
        this.setCachedItem(cacheKey, configs);
      }

      return configs;
    } finally {
      this.recordLoadTime(performance.now() - startTime);
    }
  }

  /**
   * 搜尋計算機
   */
  async searchCalculators(query: SearchQuery): Promise<CalculatorModule[]> {
    const startTime = performance.now();
    
    try {
      const cacheKey = `search-${JSON.stringify(query)}`;
      
      // 檢查快取
      if (this.options.enableCache) {
        const cached = this.getCachedItem<CalculatorModule[]>(cacheKey);
        if (cached) {
          this.stats.cacheHits++;
          return cached;
        }
        this.stats.cacheMisses++;
      }

      // 執行搜尋
      const results = await this.searchModules(query);

      // 設定快取（較短的快取時間）
      if (this.options.enableCache) {
        this.setCachedItem(cacheKey, results, this.options.cacheDuration / 2);
      }

      return results;
    } finally {
      this.recordLoadTime(performance.now() - startTime);
    }
  }

  /**
   * 獲取分類統計
   */
  async getCategoryStats(): Promise<Record<string, number>> {
    const cacheKey = 'category-stats';
    
    if (this.options.enableCache) {
      const cached = this.getCachedItem<Record<string, number>>(cacheKey);
      if (cached) return cached;
    }

    const configs = await this.getAllCalculatorConfigs();
    const stats: Record<string, number> = {};

    configs.forEach(config => {
      stats[config.category] = (stats[config.category] || 0) + 1;
    });

    if (this.options.enableCache) {
      this.setCachedItem(cacheKey, stats);
    }

    return stats;
  }

  /**
   * 獲取專科統計
   */
  async getSpecialtyStats(): Promise<Record<string, number>> {
    const cacheKey = 'specialty-stats';
    
    if (this.options.enableCache) {
      const cached = this.getCachedItem<Record<string, number>>(cacheKey);
      if (cached) return cached;
    }

    const configs = await this.getAllCalculatorConfigs();
    const stats: Record<string, number> = {};

    configs.forEach(config => {
      config.medical.specialty.forEach(specialty => {
        stats[specialty] = (stats[specialty] || 0) + 1;
      });
    });

    if (this.options.enableCache) {
      this.setCachedItem(cacheKey, stats);
    }

    return stats;
  }

  /**
   * 獲取服務統計
   */
  async getServiceStats(): Promise<ServiceStats> {
    const configs = await this.getAllCalculatorConfigs({ includeInactive: true });
    const activeConfigs = configs.filter(config => config.status === 'published');
    
    const categories = new Set(configs.map(config => config.category));
    const specialties = new Set(configs.flatMap(config => config.medical.specialty));
    
    const cacheHitRate = this.stats.totalRequests > 0 
      ? this.stats.cacheHits / this.stats.totalRequests 
      : 0;
    
    const averageLoadTime = this.stats.loadTimes.length > 0
      ? this.stats.loadTimes.reduce((sum, time) => sum + time, 0) / this.stats.loadTimes.length
      : 0;

    return {
      totalCalculators: configs.length,
      activeCalculators: activeConfigs.length,
      categoriesCount: categories.size,
      specialtiesCount: specialties.size,
      lastUpdated: new Date().toISOString(),
      cacheHitRate,
      averageLoadTime
    };
  }

  /**
   * 預熱快取
   */
  async warmupCache(): Promise<void> {
    console.log('Warming up calculator service cache...');
    
    const startTime = performance.now();
    
    // 載入所有配置
    await this.getAllCalculatorConfigs();
    
    // 載入統計資料
    await Promise.all([
      this.getCategoryStats(),
      this.getSpecialtyStats()
    ]);
    
    const duration = performance.now() - startTime;
    console.log(`Cache warmup completed in ${duration.toFixed(2)}ms`);
  }

  /**
   * 清除快取
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
    
    // 重置統計
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      totalRequests: 0,
      loadTimes: []
    };
  }

  /**
   * 獲取快取項目
   */
  protected getCachedItem<T>(key: string): T | null {
    this.stats.totalRequests++;
    
    const item = this.cache.get(key) as CacheItem<T> | undefined;
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * 設定快取項目
   */
  protected setCachedItem<T>(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.options.cacheDuration
    };
    
    this.cache.set(key, item);
  }

  /**
   * 記錄載入時間
   */
  protected recordLoadTime(time: number): void {
    this.stats.loadTimes.push(time);
    
    // 保持最近 100 次記錄
    if (this.stats.loadTimes.length > 100) {
      this.stats.loadTimes.shift();
    }
  }

  /**
   * 獲取本地化文字
   */
  protected getLocalizedText(
    text: Record<SupportedLocale, string> | string, 
    locale?: SupportedLocale
  ): string {
    if (typeof text === 'string') return text;
    
    const targetLocale = locale ?? this.options.defaultLocale;
    return text[targetLocale] || text['zh-TW'] || Object.values(text)[0] || '';
  }
}

/**
 * Astro 檔案系統計算機服務實現
 * 
 * 使用 Astro.glob() 自動探索計算機模組，適用於靜態網站生成。
 */
export class AstroCalculatorService extends CalculatorService {
  private moduleCache: CalculatorModule[] | null = null;
  private lastModuleLoad: number = 0;

  /**
   * 載入所有計算機模組
   */
  async loadAllModules(options: LoadOptions = {}): Promise<CalculatorModule[]> {
    // 檢查模組快取
    const now = Date.now();
    if (this.moduleCache && (now - this.lastModuleLoad) < this.options.cacheDuration) {
      return this.filterModules(this.moduleCache, options);
    }

    try {
      // 使用 Astro.glob() 自動探索模組
      const configFiles = await this.globCalculatorConfigs();
      const calculatorFiles = await this.globCalculatorFunctions();
      const visualizationFiles = await this.globVisualizationConfigs();
      const testFiles = await this.globTestFiles();

      // 組合模組
      const modules = this.assembleModules(
        configFiles,
        calculatorFiles,
        visualizationFiles,
        testFiles
      );

      // 更新快取
      this.moduleCache = modules;
      this.lastModuleLoad = now;

      return this.filterModules(modules, options);
    } catch (error) {
      console.error('Failed to load calculator modules:', error);
      return [];
    }
  }

  /**
   * 根據 ID 載入計算機模組
   */
  async loadModuleById(id: string): Promise<CalculatorModule | null> {
    const modules = await this.loadAllModules();
    return modules.find(module => module.config.id === id) || null;
  }

  /**
   * 搜尋計算機模組
   */
  async searchModules(query: SearchQuery): Promise<CalculatorModule[]> {
    const modules = await this.loadAllModules();
    
    let results = modules;

    // 按分類篩選
    if (query.category) {
      results = results.filter(module => module.config.category === query.category);
    }

    // 按專科篩選
    if (query.specialty) {
      results = results.filter(module => 
        module.config.medical.specialty.includes(query.specialty!)
      );
    }

    // 按標籤篩選
    if (query.tags?.length) {
      results = results.filter(module =>
        query.tags!.some(tag => module.config.metadata.tags.includes(tag))
      );
    }

    // 按難度篩選
    if (query.difficulty) {
      results = results.filter(module => 
        module.config.metadata.difficulty === query.difficulty
      );
    }

    // 按證據等級篩選
    if (query.evidenceLevel) {
      results = results.filter(module => 
        module.config.medical.evidenceLevel === query.evidenceLevel
      );
    }

    // 文字搜尋
    if (query.text) {
      const searchText = query.text.toLowerCase();
      results = results.filter(module => {
        const config = module.config;
        
        // 搜尋名稱
        const nameMatch = Object.values(config.name).some(name =>
          name.toLowerCase().includes(searchText)
        );

        // 搜尋描述
        const descriptionMatch = Object.values(config.description).some(desc =>
          desc.toLowerCase().includes(searchText)
        );

        // 搜尋標籤
        const tagMatch = config.metadata.tags.some(tag =>
          tag.toLowerCase().includes(searchText)
        );

        return nameMatch || descriptionMatch || tagMatch;
      });
    }

    // 排序
    if (query.sortBy) {
      results = this.sortModules(results, query.sortBy, query.sortOrder || 'asc');
    }

    // 分頁
    if (query.limit) {
      const start = (query.page || 0) * query.limit;
      results = results.slice(start, start + query.limit);
    }

    return results;
  }

  /**
   * 驗證計算機配置
   */
  validateConfig(config: CalculatorConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

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

    // 警告檢查
    if (!config.medical?.references || config.medical.references.length === 0) {
      warnings.push('建議提供參考文獻');
    }

    if (!config.metadata?.reviewedBy) {
      warnings.push('建議指定審核者');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 載入配置檔案（客戶端兼容版本）
   */
  private async globCalculatorConfigs(): Promise<Record<string, any>> {
    try {
      // 資料夾名稱到 ID 的映射
      const folderToIdMap = {
        'bmi': 'bmi-calculator',
        'cha2ds2-vasc': 'cha2ds2-vasc', 
        'egfr': 'egfr'
      };
      
      const configs: Record<string, any> = {};
      
      for (const [folderName, configId] of Object.entries(folderToIdMap)) {
        try {
          const module = await import(`../calculators/${folderName}/config.json`);
          configs[configId] = module.default || module;
        } catch (error) {
          console.warn(`Failed to load config for ${configId} (folder: ${folderName}):`, error);
        }
      }
      
      return configs;
    } catch (error) {
      console.warn('Failed to load calculator configs:', error);
      return {};
    }
  }

  /**
   * 載入計算函式（客戶端兼容版本）
   */
  private async globCalculatorFunctions(): Promise<Record<string, any>> {
    try {
      const folderToIdMap = {
        'bmi': 'bmi-calculator',
        'cha2ds2-vasc': 'cha2ds2-vasc',
        'egfr': 'egfr'
      };
      
      const calculators: Record<string, any> = {};
      
      for (const [folderName, configId] of Object.entries(folderToIdMap)) {
        try {
          const module = await import(`../calculators/${folderName}/calculator.ts`);
          calculators[configId] = module;
        } catch (error) {
          console.warn(`Failed to load calculator for ${configId} (folder: ${folderName}):`, error);
        }
      }
      
      return calculators;
    } catch (error) {
      console.warn('Failed to load calculator functions:', error);
      return {};
    }
  }

  /**
   * 載入視覺化配置（客戶端兼容版本）
   */
  private async globVisualizationConfigs(): Promise<Record<string, any>> {
    try {
      const folderToIdMap = {
        'bmi': 'bmi-calculator',
        'cha2ds2-vasc': 'cha2ds2-vasc',
        'egfr': 'egfr'
      };
      
      const visualizations: Record<string, any> = {};
      
      for (const [folderName, configId] of Object.entries(folderToIdMap)) {
        try {
          const module = await import(`../calculators/${folderName}/visualization.json`);
          visualizations[configId] = module.default || module;
        } catch (error) {
          // 視覺化配置是可選的，不需要警告
        }
      }
      
      return visualizations;
    } catch (error) {
      console.warn('Failed to load visualization configs:', error);
      return {};
    }
  }

  /**
   * 使用 Astro.glob() 載入測試檔案
   */
  private async globTestFiles(): Promise<Record<string, any>> {
    // 只在測試環境中載入測試文件
    if (import.meta.env.MODE !== 'test' && typeof import.meta.vitest === 'undefined') {
      return {};
    }
    
    try {
      const testModules = import.meta.glob('../calculators/*/calculator.test.ts');
      const tests: Record<string, any> = {};
      
      for (const [path, importFn] of Object.entries(testModules)) {
        const module = await importFn() as any;
        const id = this.extractIdFromPath(path);
        tests[id] = module;
      }
      
      return tests;
    } catch (error) {
      console.warn('Failed to load test files:', error);
      return {};
    }
  }

  /**
   * 從檔案路徑提取計算機 ID
   */
  private extractIdFromPath(path: string): string {
    const match = path.match(/calculators\/([^\/]+)\//);
    return match ? match[1] : '';
  }

  /**
   * 組合模組
   */
  private assembleModules(
    configs: Record<string, any>,
    calculators: Record<string, any>,
    visualizations: Record<string, any>,
    tests: Record<string, any>
  ): CalculatorModule[] {
    const modules: CalculatorModule[] = [];

    for (const [id, config] of Object.entries(configs)) {
      // 跳過草稿狀態的計算機（除非明確包含）
      if (!this.options.includeDrafts && config.status === 'draft') {
        continue;
      }

      const module: CalculatorModule = {
        config,
        calculator: calculators[id],
        visualization: visualizations[id],
        tests: tests[id]
      };

      modules.push(module);
    }

    return modules;
  }

  /**
   * 篩選模組
   */
  private filterModules(modules: CalculatorModule[], options: LoadOptions): CalculatorModule[] {
    let filtered = modules;

    // 篩選非活躍的計算機
    if (!options.includeInactive) {
      filtered = filtered.filter(module => module.config.status === 'published');
    }

    // 按分類篩選
    if (options.category) {
      filtered = filtered.filter(module => module.config.category === options.category);
    }

    // 按專科篩選
    if (options.specialty) {
      filtered = filtered.filter(module => 
        module.config.medical.specialty.includes(options.specialty!)
      );
    }

    // 按難度篩選
    if (options.difficulty) {
      filtered = filtered.filter(module => 
        module.config.metadata.difficulty === options.difficulty
      );
    }

    // 按證據等級篩選
    if (options.evidenceLevel) {
      filtered = filtered.filter(module => 
        module.config.medical.evidenceLevel === options.evidenceLevel
      );
    }

    return filtered;
  }

  /**
   * 排序模組
   */
  private sortModules(
    modules: CalculatorModule[], 
    sortBy: string, 
    sortOrder: 'asc' | 'desc'
  ): CalculatorModule[] {
    return modules.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = this.getLocalizedText(a.config.name)
            .localeCompare(this.getLocalizedText(b.config.name));
          break;
        case 'category':
          comparison = a.config.category.localeCompare(b.config.category);
          break;
        case 'difficulty':
          const difficultyOrder = { 'basic': 1, 'intermediate': 2, 'advanced': 3 };
          comparison = difficultyOrder[a.config.metadata.difficulty] - 
                      difficultyOrder[b.config.metadata.difficulty];
          break;
        case 'lastUpdated':
          comparison = new Date(a.config.metadata.lastUpdated).getTime() - 
                      new Date(b.config.metadata.lastUpdated).getTime();
          break;
        case 'evidenceLevel':
          const evidenceOrder = { 'A': 1, 'B': 2, 'C': 3, 'D': 4 };
          comparison = evidenceOrder[a.config.medical.evidenceLevel] - 
                      evidenceOrder[b.config.medical.evidenceLevel];
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }
}

// 預設服務實例
export const calculatorService = new AstroCalculatorService();

// 便利函數
export async function getCalculatorConfig(id: string): Promise<CalculatorConfig | null> {
  return calculatorService.getCalculatorConfig(id);
}

export async function getAllCalculatorConfigs(options?: LoadOptions): Promise<CalculatorConfig[]> {
  return calculatorService.getAllCalculatorConfigs(options);
}

export async function searchCalculators(query: SearchQuery): Promise<CalculatorModule[]> {
  return calculatorService.searchCalculators(query);
}

export async function getCategoryStats(): Promise<Record<string, number>> {
  return calculatorService.getCategoryStats();
}

export async function getSpecialtyStats(): Promise<Record<string, number>> {
  return calculatorService.getSpecialtyStats();
}

export async function getServiceStats(): Promise<ServiceStats> {
  return calculatorService.getServiceStats();
}

export async function warmupCalculatorCache(): Promise<void> {
  return calculatorService.warmupCache();
}

export function clearCalculatorCache(pattern?: string): void {
  return calculatorService.clearCache(pattern);
}

export default CalculatorService;