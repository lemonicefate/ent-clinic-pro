/**
 * 修復的計算機註冊表
 * 
 * 管理所有計算機模組的註冊、查詢和生命週期。
 * 提供統一的介面來存取和管理計算機模組。
 */

import { CalculatorModule, SearchQuery } from '../types';
import { ModuleLoaderFixed } from './ModuleLoaderFixed';
import { ErrorHandler } from './ErrorHandler';

export class CalculatorRegistryFixed {
  private static instance: CalculatorRegistryFixed | null = null;
  private modules = new Map<string, CalculatorModule>();
  private categories = new Map<string, CalculatorModule[]>();
  private tags = new Map<string, CalculatorModule[]>();
  private initialized = false;
  private loader: ModuleLoaderFixed;
  private errorHandler: ErrorHandler;

  private constructor() {
    this.loader = new ModuleLoaderFixed();
    this.errorHandler = new ErrorHandler();
  }

  /**
   * 獲取註冊表單例
   */
  static getInstance(): CalculatorRegistryFixed {
    if (!this.instance) {
      this.instance = new CalculatorRegistryFixed();
    }
    return this.instance;
  }

  /**
   * 初始化註冊表，載入所有計算機模組
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🚀 Initializing Fixed Calculator Registry...');

    try {
      const loadResults = await this.loader.loadAllModules();
      
      // 分離成功和失敗的載入結果
      const successfulLoads = loadResults.filter(r => r.success && r.module);
      const failedLoads = loadResults.filter(r => !r.success);

      // 記錄失敗的載入
      failedLoads.forEach(result => {
        this.errorHandler.logError(new Error(result.error || 'Unknown load error'));
      });

      // 註冊成功載入的模組
      for (const result of successfulLoads) {
        if (result.module) {
          await this.registerModule(result.module);
        }
      }

      this.buildIndices();
      this.initialized = true;

      console.log(`✅ Fixed Calculator Registry initialized with ${this.modules.size} modules`);
      console.log(`📊 Categories: ${Array.from(this.categories.keys()).join(', ')}`);

    } catch (error) {
      console.error('❌ Failed to initialize Fixed Calculator Registry:', error);
      this.errorHandler.logError(error as Error);
      throw error;
    }
  }

  /**
   * 註冊單個計算機模組
   */
  private async registerModule(module: CalculatorModule): Promise<void> {
    try {
      // 檢查是否已存在
      if (this.modules.has(module.id)) {
        console.warn(`⚠️ Module ${module.id} already exists, skipping registration`);
        return;
      }

      // 驗證模組
      this.validateModule(module);

      // 執行模組載入鉤子
      if (module.onLoad) {
        await module.onLoad();
      }

      // 註冊模組
      this.modules.set(module.id, module);

      console.log(`✅ Registered calculator module: ${module.id}`);

    } catch (error) {
      console.error(`❌ Failed to register module ${module.id}:`, error);
      this.errorHandler.logError(error as Error);
      
      // 如果模組有錯誤處理器，調用它
      if (module.onError) {
        module.onError(error as Error);
      }
    }
  }

  /**
   * 驗證模組結構
   */
  private validateModule(module: CalculatorModule): void {
    if (!module.id) {
      throw new Error('Module must have an id');
    }

    if (!module.config) {
      throw new Error(`Module ${module.id} must have a config`);
    }

    if (!module.FormComponent) {
      throw new Error(`Module ${module.id} must have a FormComponent`);
    }

    if (!module.ResultsComponent) {
      throw new Error(`Module ${module.id} must have a ResultsComponent`);
    }

    if (!module.calculator) {
      throw new Error(`Module ${module.id} must have a calculator implementation`);
    }

    if (typeof module.calculator.calculate !== 'function') {
      throw new Error(`Module ${module.id} calculator must have a calculate function`);
    }

    if (typeof module.calculator.validate !== 'function') {
      throw new Error(`Module ${module.id} calculator must have a validate function`);
    }
  }

  /**
   * 建立索引以提高查詢效能
   */
  private buildIndices(): void {
    // 清空現有索引
    this.categories.clear();
    this.tags.clear();

    // 重建索引
    this.modules.forEach(module => {
      // 分類索引
      const category = module.config.category;
      if (!this.categories.has(category)) {
        this.categories.set(category, []);
      }
      this.categories.get(category)!.push(module);

      // 標籤索引
      module.config.metadata.tags.forEach(tag => {
        if (!this.tags.has(tag)) {
          this.tags.set(tag, []);
        }
        this.tags.get(tag)!.push(module);
      });
    });
  }

  /**
   * 獲取指定 ID 的計算機模組
   */
  get(id: string): CalculatorModule | undefined {
    return this.modules.get(id);
  }

  /**
   * 獲取所有計算機模組
   */
  getAll(): CalculatorModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * 獲取已發布的計算機模組
   */
  getPublished(): CalculatorModule[] {
    return this.getAll().filter(module => module.config.status === 'published');
  }

  /**
   * 根據分類獲取計算機模組
   */
  getByCategory(category: string): CalculatorModule[] {
    return this.categories.get(category) || [];
  }

  /**
   * 根據標籤獲取計算機模組
   */
  getByTag(tag: string): CalculatorModule[] {
    return this.tags.get(tag) || [];
  }

  /**
   * 搜尋計算機模組
   */
  search(query: SearchQuery): CalculatorModule[] {
    let results = this.getAll();

    // 狀態篩選
    if (query.status) {
      results = results.filter(module => module.config.status === query.status);
    } else {
      // 預設只顯示已發布的
      results = results.filter(module => module.config.status === 'published');
    }

    // 分類篩選
    if (query.category) {
      results = results.filter(module => module.config.category === query.category);
    }

    // 標籤篩選
    if (query.tags && query.tags.length > 0) {
      results = results.filter(module =>
        query.tags!.some(tag => module.config.metadata.tags.includes(tag))
      );
    }

    // 難度篩選
    if (query.difficulty) {
      results = results.filter(module => module.config.metadata.difficulty === query.difficulty);
    }

    // 專科篩選
    if (query.specialty && query.specialty.length > 0) {
      results = results.filter(module =>
        query.specialty!.some(specialty => module.config.medical.specialty.includes(specialty))
      );
    }

    // 文字搜尋
    if (query.text) {
      const searchText = query.text.toLowerCase();
      results = results.filter(module => {
        const name = module.config.name['zh-TW'].toLowerCase();
        const description = module.config.description['zh-TW'].toLowerCase();
        const tags = module.config.metadata.tags.join(' ').toLowerCase();
        
        return name.includes(searchText) || 
               description.includes(searchText) || 
               tags.includes(searchText);
      });
    }

    return results;
  }

  /**
   * 獲取分類統計
   */
  getCategoryStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.categories.forEach((modules, category) => {
      stats[category] = modules.filter(m => m.config.status === 'published').length;
    });
    return stats;
  }

  /**
   * 獲取標籤統計
   */
  getTagStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.tags.forEach((modules, tag) => {
      stats[tag] = modules.filter(m => m.config.status === 'published').length;
    });
    return stats;
  }

  /**
   * 檢查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 重新載入所有模組
   */
  async reload(): Promise<void> {
    console.log('🔄 Reloading Fixed Calculator Registry...');
    
    // 清理現有模組
    for (const module of this.modules.values()) {
      if (module.onUnload) {
        try {
          await module.onUnload();
        } catch (error) {
          console.error(`Error unloading module ${module.id}:`, error);
        }
      }
    }

    // 清空註冊表
    this.modules.clear();
    this.categories.clear();
    this.tags.clear();
    this.initialized = false;

    // 重新初始化
    await this.initialize();
  }

  /**
   * 獲取錯誤處理器
   */
  getErrorHandler(): ErrorHandler {
    return this.errorHandler;
  }
}