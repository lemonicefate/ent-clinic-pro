/**
 * 計算機資料載入器
 * 從內容集合和 CMS 載入計算機配置
 */

import { getCollection } from 'astro:content';
import type { Calculator } from '../content/config';
import type { SupportedLocale } from '../env.d';
import { getLocalizedText } from './client-helpers';
import { validateCalculatorConfig } from './calculator-engine';

// 計算機載入選項
export interface CalculatorLoadOptions {
  includeInactive?: boolean;
  category?: string;
  specialty?: string;
  difficulty?: 'basic' | 'intermediate' | 'advanced';
  featured?: boolean;
}

// 計算機摘要資訊
export interface CalculatorSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  isFeatured: boolean;
  usageCount: number;
  lastUpdated?: Date;
  icon?: string;
  tags: string[];
}

/**
 * 計算機載入器類別
 */
export class CalculatorLoader {
  private calculatorsCache: Map<string, Calculator> = new Map();
  private summariesCache: Map<string, CalculatorSummary[]> = new Map();
  private lastCacheUpdate: Date | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘

  /**
   * 載入所有計算機
   */
  async loadAllCalculators(options: CalculatorLoadOptions = {}): Promise<Calculator[]> {
    await this.refreshCacheIfNeeded();

    let calculators = Array.from(this.calculatorsCache.values());

    // 應用篩選條件
    if (!options.includeInactive) {
      calculators = calculators.filter(calc => calc.isActive);
    }

    if (options.category) {
      calculators = calculators.filter(calc => calc.category === options.category);
    }

    if (options.specialty) {
      calculators = calculators.filter(calc => 
        calc.medicalSpecialties.includes(options.specialty!)
      );
    }

    if (options.difficulty) {
      calculators = calculators.filter(calc => calc.difficulty === options.difficulty);
    }

    if (options.featured !== undefined) {
      calculators = calculators.filter(calc => calc.isFeatured === options.featured);
    }

    return calculators;
  }

  /**
   * 根據 ID 載入計算機
   */
  async loadCalculatorById(id: string): Promise<Calculator | null> {
    await this.refreshCacheIfNeeded();
    return this.calculatorsCache.get(id) || null;
  }

  /**
   * 根據 slug 載入計算機
   */
  async loadCalculatorBySlug(slug: string): Promise<Calculator | null> {
    await this.refreshCacheIfNeeded();
    
    for (const calculator of this.calculatorsCache.values()) {
      if (calculator.slug === slug) {
        return calculator;
      }
    }
    
    return null;
  }

  /**
   * 載入計算機摘要列表
   */
  async loadCalculatorSummaries(
    locale: SupportedLocale = 'zh-TW',
    options: CalculatorLoadOptions = {}
  ): Promise<CalculatorSummary[]> {
    const cacheKey = `${locale}-${JSON.stringify(options)}`;
    
    // 檢查快取
    if (this.summariesCache.has(cacheKey) && !this.isCacheExpired()) {
      return this.summariesCache.get(cacheKey)!;
    }

    const calculators = await this.loadAllCalculators(options);
    const summaries = calculators.map(calc => this.createSummary(calc, locale));

    // 排序：精選優先，然後按使用次數
    summaries.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return b.usageCount - a.usageCount;
    });

    this.summariesCache.set(cacheKey, summaries);
    return summaries;
  }

  /**
   * 搜尋計算機
   */
  async searchCalculators(
    query: string,
    locale: SupportedLocale = 'zh-TW',
    options: CalculatorLoadOptions = {}
  ): Promise<Calculator[]> {
    const calculators = await this.loadAllCalculators(options);
    const searchTerm = query.toLowerCase();

    return calculators.filter(calc => {
      const name = getLocalizedText(calc.name, locale).toLowerCase();
      const description = getLocalizedText(calc.description, locale).toLowerCase();
      const tags = calc.tags.join(' ').toLowerCase();
      
      return name.includes(searchTerm) || 
             description.includes(searchTerm) || 
             tags.includes(searchTerm) ||
             calc.id.toLowerCase().includes(searchTerm);
    });
  }

  /**
   * 獲取分類統計
   */
  async getCategoryStats(): Promise<Record<string, number>> {
    const calculators = await this.loadAllCalculators({ includeInactive: false });
    const stats: Record<string, number> = {};

    calculators.forEach(calc => {
      stats[calc.category] = (stats[calc.category] || 0) + 1;
    });

    return stats;
  }

  /**
   * 獲取熱門計算機
   */
  async getPopularCalculators(
    limit = 10,
    locale: SupportedLocale = 'zh-TW'
  ): Promise<CalculatorSummary[]> {
    const summaries = await this.loadCalculatorSummaries(locale);
    return summaries
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  /**
   * 獲取精選計算機
   */
  async getFeaturedCalculators(
    limit = 5,
    locale: SupportedLocale = 'zh-TW'
  ): Promise<CalculatorSummary[]> {
    const summaries = await this.loadCalculatorSummaries(locale, { featured: true });
    return summaries.slice(0, limit);
  }

  /**
   * 獲取相關計算機
   */
  async getRelatedCalculators(
    calculatorId: string,
    limit = 5,
    locale: SupportedLocale = 'zh-TW'
  ): Promise<CalculatorSummary[]> {
    const calculator = await this.loadCalculatorById(calculatorId);
    if (!calculator) return [];

    const allCalculators = await this.loadAllCalculators();
    const related = allCalculators.filter(calc => {
      if (calc.id === calculatorId) return false;
      
      // 相同分類
      if (calc.category === calculator.category) return true;
      
      // 相同專科
      const hasCommonSpecialty = calc.medicalSpecialties.some(spec => 
        calculator.medicalSpecialties.includes(spec)
      );
      if (hasCommonSpecialty) return true;
      
      // 相同標籤
      const hasCommonTag = calc.tags.some(tag => calculator.tags.includes(tag));
      if (hasCommonTag) return true;
      
      return false;
    });

    return related
      .map(calc => this.createSummary(calc, locale))
      .slice(0, limit);
  }

  /**
   * 驗證所有計算機配置
   */
  async validateAllCalculators(): Promise<{
    valid: Calculator[];
    invalid: Array<{ calculator: Calculator; errors: string[] }>;
  }> {
    const calculators = await this.loadAllCalculators({ includeInactive: true });
    const valid: Calculator[] = [];
    const invalid: Array<{ calculator: Calculator; errors: string[] }> = [];

    calculators.forEach(calc => {
      const validation = validateCalculatorConfig(calc);
      if (validation.isValid) {
        valid.push(calc);
      } else {
        invalid.push({
          calculator: calc,
          errors: validation.errors
        });
      }
    });

    return { valid, invalid };
  }

  /**
   * 更新計算機使用統計
   */
  async incrementUsageCount(calculatorId: string): Promise<void> {
    // 這裡應該實現更新使用統計的邏輯
    // 在實際應用中，這可能需要更新資料庫或 CMS
    console.log(`Incrementing usage count for calculator: ${calculatorId}`);
  }

  /**
   * 重新整理快取
   */
  private async refreshCacheIfNeeded(): Promise<void> {
    if (!this.isCacheExpired()) return;

    try {
      const calculatorEntries = await getCollection('calculators');
      this.calculatorsCache.clear();

      calculatorEntries.forEach(entry => {
        this.calculatorsCache.set(entry.data.id, entry.data);
      });

      this.summariesCache.clear();
      this.lastCacheUpdate = new Date();
    } catch (error) {
      console.error('Failed to refresh calculator cache:', error);
    }
  }

  /**
   * 檢查快取是否過期
   */
  private isCacheExpired(): boolean {
    if (!this.lastCacheUpdate) return true;
    return Date.now() - this.lastCacheUpdate.getTime() > this.CACHE_DURATION;
  }

  /**
   * 建立計算機摘要
   */
  private createSummary(calculator: Calculator, locale: SupportedLocale): CalculatorSummary {
    return {
      id: calculator.id,
      name: getLocalizedText(calculator.name, locale),
      slug: calculator.slug,
      description: getLocalizedText(calculator.description, locale),
      category: calculator.category,
      difficulty: calculator.difficulty,
      isFeatured: calculator.isFeatured,
      usageCount: calculator.usageCount || 0,
      lastUpdated: calculator.lastUpdated,
      icon: calculator.icon,
      tags: calculator.tags
    };
  }

  /**
   * 清除快取
   */
  clearCache(): void {
    this.calculatorsCache.clear();
    this.summariesCache.clear();
    this.lastCacheUpdate = null;
  }
}

// 全域載入器實例
export const calculatorLoader = new CalculatorLoader();

/**
 * 便利函數：載入計算機
 */
export async function loadCalculator(idOrSlug: string): Promise<Calculator | null> {
  // 先嘗試按 ID 載入
  let calculator = await calculatorLoader.loadCalculatorById(idOrSlug);
  
  // 如果沒找到，嘗試按 slug 載入
  if (!calculator) {
    calculator = await calculatorLoader.loadCalculatorBySlug(idOrSlug);
  }
  
  return calculator;
}

/**
 * 便利函數：載入計算機列表
 */
export async function loadCalculators(
  options: CalculatorLoadOptions = {}
): Promise<Calculator[]> {
  return calculatorLoader.loadAllCalculators(options);
}

/**
 * 便利函數：搜尋計算機
 */
export async function searchCalculators(
  query: string,
  locale: SupportedLocale = 'zh-TW'
): Promise<Calculator[]> {
  return calculatorLoader.searchCalculators(query, locale);
}

/**
 * 便利函數：獲取計算機摘要
 */
export async function getCalculatorSummaries(
  locale: SupportedLocale = 'zh-TW',
  options: CalculatorLoadOptions = {}
): Promise<CalculatorSummary[]> {
  return calculatorLoader.loadCalculatorSummaries(locale, options);
}