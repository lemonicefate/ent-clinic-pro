/**
 * 混合內容載入器
 * 支援從本地內容集合和 Strapi CMS 載入內容，提供統一的 API
 */

import { getCollection } from 'astro:content';
import { strapiClient } from './strapi-client';
import type { SupportedLocale } from '../env.d';

// 內容來源類型
type ContentSource = 'local' | 'cms' | 'hybrid';

// 載入選項
interface LoaderOptions {
  source?: ContentSource;
  locale?: SupportedLocale;
  fallback?: boolean; // 當主要來源失敗時是否回退到其他來源
  cache?: boolean; // 是否啟用快取
  cacheTimeout?: number; // 快取超時時間（毫秒）
}

// 快取項目
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// 統一的內容介面
interface UnifiedContent {
  id: string;
  slug: string;
  title: Record<string, string> | string;
  description?: Record<string, string> | string;
  category: string;
  tags: string[];
  lastUpdated: string;
  isActive: boolean;
  source: 'local' | 'cms';
  rawData: any; // 原始資料
}

/**
 * 混合內容載入器類別
 */
export class HybridContentLoader {
  private cache = new Map<string, CacheItem<any>>();
  private defaultOptions: LoaderOptions = {
    source: 'hybrid',
    locale: 'zh-TW',
    fallback: true,
    cache: true,
    cacheTimeout: 5 * 60 * 1000 // 5 分鐘
  };

  /**
   * 檢查快取是否有效
   */
  private isCacheValid<T>(cacheKey: string): CacheItem<T> | null {
    const item = this.cache.get(cacheKey) as CacheItem<T> | undefined;
    if (!item) return null;
    
    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return item;
  }

  /**
   * 設定快取
   */
  private setCache<T>(cacheKey: string, data: T, ttl: number): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * 從本地內容集合載入計算機
   */
  private async loadCalculatorsFromLocal(): Promise<UnifiedContent[]> {
    try {
      const calculators = await getCollection('calculators');
      return calculators
        .filter(calc => calc.data.isActive !== false)
        .map(calc => ({
          id: calc.id,
          slug: calc.data.slug || calc.id,
          title: calc.data.name,
          description: calc.data.description,
          category: calc.data.category,
          tags: calc.data.tags || [],
          lastUpdated: calc.data.lastUpdated,
          isActive: calc.data.isActive !== false,
          source: 'local' as const,
          rawData: calc.data
        }));
    } catch (error) {
      console.warn('Failed to load calculators from local:', error);
      return [];
    }
  }

  /**
   * 從 CMS 載入計算機
   */
  private async loadCalculatorsFromCMS(locale: SupportedLocale): Promise<UnifiedContent[]> {
    try {
      const response = await strapiClient.getCalculators({ locale });
      return response.data
        .filter(calc => calc.attributes.isActive !== false)
        .map(calc => ({
          id: calc.id.toString(),
          slug: calc.attributes.slug,
          title: calc.attributes.name,
          description: calc.attributes.description,
          category: calc.attributes.category,
          tags: calc.attributes.tags || [],
          lastUpdated: calc.attributes.updatedAt,
          isActive: calc.attributes.isActive !== false,
          source: 'cms' as const,
          rawData: calc.attributes
        }));
    } catch (error) {
      console.warn('Failed to load calculators from CMS:', error);
      return [];
    }
  }

  /**
   * 從本地內容集合載入教育內容
   */
  private async loadEducationFromLocal(): Promise<UnifiedContent[]> {
    try {
      const education = await getCollection('education');
      return education
        .filter(edu => edu.data.isActive !== false)
        .map(edu => ({
          id: edu.id,
          slug: edu.data.slug || edu.id,
          title: edu.data.title,
          description: edu.data.excerpt,
          category: edu.data.category,
          tags: edu.data.tags || [],
          lastUpdated: edu.data.lastUpdated,
          isActive: edu.data.isActive !== false,
          source: 'local' as const,
          rawData: edu.data
        }));
    } catch (error) {
      console.warn('Failed to load education from local:', error);
      return [];
    }
  }

  /**
   * 從 CMS 載入教育內容
   */
  private async loadEducationFromCMS(locale: SupportedLocale): Promise<UnifiedContent[]> {
    try {
      const response = await strapiClient.getEducationContent({ locale });
      return response.data
        .filter(edu => edu.attributes.isActive !== false)
        .map(edu => ({
          id: edu.id.toString(),
          slug: edu.attributes.slug,
          title: edu.attributes.title,
          description: edu.attributes.excerpt,
          category: edu.attributes.category,
          tags: edu.attributes.tags || [],
          lastUpdated: edu.attributes.updatedAt,
          isActive: edu.attributes.isActive !== false,
          source: 'cms' as const,
          rawData: edu.attributes
        }));
    } catch (error) {
      console.warn('Failed to load education from CMS:', error);
      return [];
    }
  }

  /**
   * 從本地內容集合載入流程圖
   */
  private async loadFlowchartsFromLocal(): Promise<UnifiedContent[]> {
    try {
      const flowcharts = await getCollection('flowcharts');
      return flowcharts
        .filter(flow => flow.data.isActive !== false)
        .map(flow => ({
          id: flow.id,
          slug: flow.data.slug || flow.id,
          title: flow.data.title,
          description: flow.data.description,
          category: flow.data.category,
          tags: flow.data.tags || [],
          lastUpdated: flow.data.lastUpdated,
          isActive: flow.data.isActive !== false,
          source: 'local' as const,
          rawData: flow.data
        }));
    } catch (error) {
      console.warn('Failed to load flowcharts from local:', error);
      return [];
    }
  }

  /**
   * 從 CMS 載入流程圖
   */
  private async loadFlowchartsFromCMS(locale: SupportedLocale): Promise<UnifiedContent[]> {
    try {
      const response = await strapiClient.getFlowcharts({ locale });
      return response.data
        .filter(flow => flow.attributes.isActive !== false)
        .map(flow => ({
          id: flow.id.toString(),
          slug: flow.attributes.slug,
          title: flow.attributes.title,
          description: flow.attributes.description,
          category: flow.attributes.category,
          tags: flow.attributes.tags || [],
          lastUpdated: flow.attributes.updatedAt,
          isActive: flow.attributes.isActive !== false,
          source: 'cms' as const,
          rawData: flow.attributes
        }));
    } catch (error) {
      console.warn('Failed to load flowcharts from CMS:', error);
      return [];
    }
  }

  /**
   * 合併和去重內容
   */
  private mergeContent(localContent: UnifiedContent[], cmsContent: UnifiedContent[]): UnifiedContent[] {
    const merged = new Map<string, UnifiedContent>();
    
    // 先加入本地內容
    localContent.forEach(item => {
      merged.set(item.slug, item);
    });
    
    // 再加入 CMS 內容，如果 slug 相同則以 CMS 為準（較新）
    cmsContent.forEach(item => {
      const existing = merged.get(item.slug);
      if (!existing || new Date(item.lastUpdated) > new Date(existing.lastUpdated)) {
        merged.set(item.slug, item);
      }
    });
    
    return Array.from(merged.values());
  }

  /**
   * 載入計算機內容
   */
  async loadCalculators(options: LoaderOptions = {}): Promise<UnifiedContent[]> {
    const opts = { ...this.defaultOptions, ...options };
    const cacheKey = `calculators-${opts.source}-${opts.locale}`;
    
    // 檢查快取
    if (opts.cache) {
      const cached = this.isCacheValid<UnifiedContent[]>(cacheKey);
      if (cached) {
        return cached.data;
      }
    }
    
    let result: UnifiedContent[] = [];
    
    try {
      switch (opts.source) {
        case 'local':
          result = await this.loadCalculatorsFromLocal();
          break;
          
        case 'cms':
          result = await this.loadCalculatorsFromCMS(opts.locale!);
          break;
          
        case 'hybrid':
        default:
          const [localCalcs, cmsCalcs] = await Promise.allSettled([
            this.loadCalculatorsFromLocal(),
            this.loadCalculatorsFromCMS(opts.locale!)
          ]);
          
          const localData = localCalcs.status === 'fulfilled' ? localCalcs.value : [];
          const cmsData = cmsCalcs.status === 'fulfilled' ? cmsCalcs.value : [];
          
          result = this.mergeContent(localData, cmsData);
          break;
      }
    } catch (error) {
      console.error('Failed to load calculators:', error);
      
      // 如果啟用回退且不是本地來源，嘗試從本地載入
      if (opts.fallback && opts.source !== 'local') {
        try {
          result = await this.loadCalculatorsFromLocal();
        } catch (fallbackError) {
          console.error('Fallback to local calculators also failed:', fallbackError);
        }
      }
    }
    
    // 設定快取
    if (opts.cache) {
      this.setCache(cacheKey, result, opts.cacheTimeout!);
    }
    
    return result;
  }

  /**
   * 載入教育內容
   */
  async loadEducation(options: LoaderOptions = {}): Promise<UnifiedContent[]> {
    const opts = { ...this.defaultOptions, ...options };
    const cacheKey = `education-${opts.source}-${opts.locale}`;
    
    // 檢查快取
    if (opts.cache) {
      const cached = this.isCacheValid<UnifiedContent[]>(cacheKey);
      if (cached) {
        return cached.data;
      }
    }
    
    let result: UnifiedContent[] = [];
    
    try {
      switch (opts.source) {
        case 'local':
          result = await this.loadEducationFromLocal();
          break;
          
        case 'cms':
          result = await this.loadEducationFromCMS(opts.locale!);
          break;
          
        case 'hybrid':
        default:
          const [localEdu, cmsEdu] = await Promise.allSettled([
            this.loadEducationFromLocal(),
            this.loadEducationFromCMS(opts.locale!)
          ]);
          
          const localData = localEdu.status === 'fulfilled' ? localEdu.value : [];
          const cmsData = cmsEdu.status === 'fulfilled' ? cmsEdu.value : [];
          
          result = this.mergeContent(localData, cmsData);
          break;
      }
    } catch (error) {
      console.error('Failed to load education content:', error);
      
      // 如果啟用回退且不是本地來源，嘗試從本地載入
      if (opts.fallback && opts.source !== 'local') {
        try {
          result = await this.loadEducationFromLocal();
        } catch (fallbackError) {
          console.error('Fallback to local education also failed:', fallbackError);
        }
      }
    }
    
    // 設定快取
    if (opts.cache) {
      this.setCache(cacheKey, result, opts.cacheTimeout!);
    }
    
    return result;
  }

  /**
   * 載入流程圖內容
   */
  async loadFlowcharts(options: LoaderOptions = {}): Promise<UnifiedContent[]> {
    const opts = { ...this.defaultOptions, ...options };
    const cacheKey = `flowcharts-${opts.source}-${opts.locale}`;
    
    // 檢查快取
    if (opts.cache) {
      const cached = this.isCacheValid<UnifiedContent[]>(cacheKey);
      if (cached) {
        return cached.data;
      }
    }
    
    let result: UnifiedContent[] = [];
    
    try {
      switch (opts.source) {
        case 'local':
          result = await this.loadFlowchartsFromLocal();
          break;
          
        case 'cms':
          result = await this.loadFlowchartsFromCMS(opts.locale!);
          break;
          
        case 'hybrid':
        default:
          const [localFlow, cmsFlow] = await Promise.allSettled([
            this.loadFlowchartsFromLocal(),
            this.loadFlowchartsFromCMS(opts.locale!)
          ]);
          
          const localData = localFlow.status === 'fulfilled' ? localFlow.value : [];
          const cmsData = cmsFlow.status === 'fulfilled' ? cmsFlow.value : [];
          
          result = this.mergeContent(localData, cmsData);
          break;
      }
    } catch (error) {
      console.error('Failed to load flowcharts:', error);
      
      // 如果啟用回退且不是本地來源，嘗試從本地載入
      if (opts.fallback && opts.source !== 'local') {
        try {
          result = await this.loadFlowchartsFromLocal();
        } catch (fallbackError) {
          console.error('Fallback to local flowcharts also failed:', fallbackError);
        }
      }
    }
    
    // 設定快取
    if (opts.cache) {
      this.setCache(cacheKey, result, opts.cacheTimeout!);
    }
    
    return result;
  }

  /**
   * 根據 slug 載入單個內容項目
   */
  async loadContentBySlug(
    contentType: 'calculators' | 'education' | 'flowcharts',
    slug: string,
    options: LoaderOptions = {}
  ): Promise<UnifiedContent | null> {
    const opts = { ...this.defaultOptions, ...options };
    const cacheKey = `${contentType}-${slug}-${opts.source}-${opts.locale}`;
    
    // 檢查快取
    if (opts.cache) {
      const cached = this.isCacheValid<UnifiedContent | null>(cacheKey);
      if (cached) {
        return cached.data;
      }
    }
    
    let result: UnifiedContent | null = null;
    
    try {
      // 先嘗試從指定來源載入
      const allContent = await this[`load${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`](options);
      result = allContent.find(item => item.slug === slug) || null;
      
      // 如果沒找到且啟用回退，嘗試其他來源
      if (!result && opts.fallback && opts.source !== 'hybrid') {
        const fallbackOptions = { ...opts, source: 'hybrid' as ContentSource };
        const fallbackContent = await this[`load${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`](fallbackOptions);
        result = fallbackContent.find(item => item.slug === slug) || null;
      }
    } catch (error) {
      console.error(`Failed to load ${contentType} by slug ${slug}:`, error);
    }
    
    // 設定快取
    if (opts.cache) {
      this.setCache(cacheKey, result, opts.cacheTimeout!);
    }
    
    return result;
  }

  /**
   * 搜尋內容
   */
  async searchContent(
    query: string,
    options: LoaderOptions & {
      contentTypes?: ('calculators' | 'education' | 'flowcharts')[];
      limit?: number;
    } = {}
  ): Promise<{
    calculators: UnifiedContent[];
    education: UnifiedContent[];
    flowcharts: UnifiedContent[];
  }> {
    const opts = { 
      ...this.defaultOptions, 
      ...options,
      contentTypes: options.contentTypes || ['calculators', 'education', 'flowcharts'],
      limit: options.limit || 10
    };
    
    const results = {
      calculators: [] as UnifiedContent[],
      education: [] as UnifiedContent[],
      flowcharts: [] as UnifiedContent[]
    };
    
    const searchTerm = query.toLowerCase();
    
    // 搜尋各類型內容
    for (const contentType of opts.contentTypes) {
      try {
        const content = await this[`load${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`](opts);
        
        const filtered = content.filter(item => {
          const title = typeof item.title === 'string' ? item.title : item.title[opts.locale!] || '';
          const description = typeof item.description === 'string' ? item.description : item.description?.[opts.locale!] || '';
          
          return (
            title.toLowerCase().includes(searchTerm) ||
            description.toLowerCase().includes(searchTerm) ||
            item.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
            item.category.toLowerCase().includes(searchTerm)
          );
        }).slice(0, opts.limit);
        
        results[contentType] = filtered;
      } catch (error) {
        console.error(`Failed to search ${contentType}:`, error);
      }
    }
    
    return results;
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
  }

  /**
   * 獲取快取統計
   */
  getCacheStats(): {
    size: number;
    keys: string[];
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 預設載入器實例
export const hybridContentLoader = new HybridContentLoader();

// 便利函數
export const {
  loadCalculators,
  loadEducation,
  loadFlowcharts,
  loadContentBySlug,
  searchContent,
  clearCache,
  getCacheStats
} = hybridContentLoader;

// 類型導出
export type { 
  UnifiedContent, 
  LoaderOptions, 
  ContentSource 
};