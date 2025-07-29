/**
 * 內容管理服務抽象層
 * 
 * 提供統一的內容管理介面，支援 Git 資料和 CMS 資料的混合載入、
 * 多語言內容載入和回退機制、內容快取和更新策略。
 */

import type { SupportedLocale } from '../types/calculator';

// 內容來源類型
export type ContentSource = 'git' | 'cms' | 'hybrid';

// 內容類型
export type ContentType = 'calculators' | 'education' | 'flowcharts' | 'references';

// 載入選項
export interface ContentLoadOptions {
  /** 內容來源 */
  source?: ContentSource;
  /** 語言 */
  locale?: SupportedLocale;
  /** 是否啟用回退機制 */
  fallback?: boolean;
  /** 是否啟用快取 */
  cache?: boolean;
  /** 快取超時時間（毫秒） */
  cacheTimeout?: number;
  /** 是否包含草稿內容 */
  includeDrafts?: boolean;
  /** 是否包含非活躍內容 */
  includeInactive?: boolean;
}

// 統一內容介面
export interface UnifiedContent {
  id: string;
  slug: string;
  title: Record<SupportedLocale, string> | string;
  description?: Record<SupportedLocale, string> | string;
  content?: Record<SupportedLocale, string> | string;
  category: string;
  tags: string[];
  lastUpdated: string;
  isActive: boolean;
  isDraft: boolean;
  source: ContentSource;
  locale?: SupportedLocale;
  metadata?: Record<string, any>;
  rawData: any;
}

// 快取項目
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// 內容統計
export interface ContentStats {
  totalContent: number;
  activeContent: number;
  draftContent: number;
  contentByType: Record<ContentType, number>;
  contentByCategory: Record<string, number>;
  contentByLocale: Record<SupportedLocale, number>;
  lastUpdated: string;
  cacheHitRate: number;
}

// CMS API 回應格式
export interface CMSResponse<T> {
  data: Array<{
    id: number;
    attributes: T;
  }>;
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

// CMS 內容屬性
export interface CMSContentAttributes {
  title: string;
  slug: string;
  description?: string;
  content?: string;
  category: string;
  tags?: string[];
  isActive: boolean;
  isDraft: boolean;
  locale: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  [key: string]: any;
}

/**
 * 內容管理服務抽象類別
 */
export abstract class ContentService {
  protected options: Required<ContentLoadOptions>;
  protected cache = new Map<string, CacheItem<any>>();
  protected stats = {
    cacheHits: 0,
    cacheMisses: 0,
    totalRequests: 0
  };

  constructor(options: ContentLoadOptions = {}) {
    this.options = {
      source: options.source ?? 'hybrid',
      locale: options.locale ?? 'zh-TW',
      fallback: options.fallback ?? true,
      cache: options.cache ?? true,
      cacheTimeout: options.cacheTimeout ?? 5 * 60 * 1000, // 5 分鐘
      includeDrafts: options.includeDrafts ?? false,
      includeInactive: options.includeInactive ?? false
    };
  }

  /**
   * 從 Git 載入內容
   */
  abstract loadFromGit(
    contentType: ContentType,
    options?: ContentLoadOptions
  ): Promise<UnifiedContent[]>;

  /**
   * 從 CMS 載入內容
   */
  abstract loadFromCMS(
    contentType: ContentType,
    options?: ContentLoadOptions
  ): Promise<UnifiedContent[]>;

  /**
   * 載入內容（混合模式）
   */
  async loadContent(
    contentType: ContentType,
    options: ContentLoadOptions = {}
  ): Promise<UnifiedContent[]> {
    const opts = { ...this.options, ...options };
    const cacheKey = `${contentType}-${JSON.stringify(opts)}`;

    // 檢查快取
    if (opts.cache) {
      const cached = this.getCachedItem<UnifiedContent[]>(cacheKey);
      if (cached) {
        this.stats.cacheHits++;
        return cached;
      }
      this.stats.cacheMisses++;
    }

    let result: UnifiedContent[] = [];

    try {
      switch (opts.source) {
        case 'git':
          result = await this.loadFromGit(contentType, opts);
          break;

        case 'cms':
          result = await this.loadFromCMS(contentType, opts);
          break;

        case 'hybrid':
        default:
          // 並行載入 Git 和 CMS 資料
          const [gitResult, cmsResult] = await Promise.allSettled([
            this.loadFromGit(contentType, opts),
            this.loadFromCMS(contentType, opts)
          ]);

          const gitData = gitResult.status === 'fulfilled' ? gitResult.value : [];
          const cmsData = cmsResult.status === 'fulfilled' ? cmsResult.value : [];

          result = this.mergeContent(gitData, cmsData);
          break;
      }

      // 應用篩選
      result = this.filterContent(result, opts);

      // 設定快取
      if (opts.cache) {
        this.setCachedItem(cacheKey, result, opts.cacheTimeout);
      }

      return result;
    } catch (error) {
      console.error(`Failed to load ${contentType} content:`, error);

      // 回退機制
      if (opts.fallback && opts.source !== 'git') {
        try {
          console.log(`Falling back to Git for ${contentType}`);
          result = await this.loadFromGit(contentType, opts);
          return this.filterContent(result, opts);
        } catch (fallbackError) {
          console.error(`Fallback to Git also failed:`, fallbackError);
        }
      }

      return [];
    }
  }

  /**
   * 根據 slug 載入單個內容項目
   */
  async loadContentBySlug(
    contentType: ContentType,
    slug: string,
    options: ContentLoadOptions = {}
  ): Promise<UnifiedContent | null> {
    const opts = { ...this.options, ...options };
    const cacheKey = `${contentType}-${slug}-${JSON.stringify(opts)}`;

    // 檢查快取
    if (opts.cache) {
      const cached = this.getCachedItem<UnifiedContent | null>(cacheKey);
      if (cached !== undefined) {
        this.stats.cacheHits++;
        return cached;
      }
      this.stats.cacheMisses++;
    }

    try {
      // 載入所有內容並尋找匹配的 slug
      const allContent = await this.loadContent(contentType, opts);
      const result = allContent.find(item => item.slug === slug) || null;

      // 設定快取
      if (opts.cache) {
        this.setCachedItem(cacheKey, result, opts.cacheTimeout);
      }

      return result;
    } catch (error) {
      console.error(`Failed to load ${contentType} by slug ${slug}:`, error);
      return null;
    }
  }

  /**
   * 搜尋內容
   */
  async searchContent(
    query: string,
    options: ContentLoadOptions & {
      contentTypes?: ContentType[];
      limit?: number;
    } = {}
  ): Promise<Record<ContentType, UnifiedContent[]>> {
    const opts = {
      ...this.options,
      ...options,
      contentTypes: options.contentTypes || ['calculators', 'education', 'flowcharts', 'references'] as ContentType[],
      limit: options.limit || 10
    };

    const results: Record<ContentType, UnifiedContent[]> = {
      calculators: [],
      education: [],
      flowcharts: [],
      references: []
    };

    const searchTerm = query.toLowerCase();

    // 搜尋各類型內容
    for (const contentType of opts.contentTypes) {
      try {
        const content = await this.loadContent(contentType, opts);

        const filtered = content.filter(item => {
          const title = this.getLocalizedText(item.title, opts.locale);
          const description = this.getLocalizedText(item.description, opts.locale);
          const contentText = this.getLocalizedText(item.content, opts.locale);

          return (
            title.toLowerCase().includes(searchTerm) ||
            description.toLowerCase().includes(searchTerm) ||
            contentText.toLowerCase().includes(searchTerm) ||
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
   * 獲取內容統計
   */
  async getContentStats(): Promise<ContentStats> {
    const contentTypes: ContentType[] = ['calculators', 'education', 'flowcharts', 'references'];
    const contentByType: Record<ContentType, number> = {
      calculators: 0,
      education: 0,
      flowcharts: 0,
      references: 0
    };
    const contentByCategory: Record<string, number> = {};
    const contentByLocale: Record<SupportedLocale, number> = {
      'zh-TW': 0,
      'en': 0
    };

    let totalContent = 0;
    let activeContent = 0;
    let draftContent = 0;

    // 統計各類型內容
    for (const contentType of contentTypes) {
      try {
        const content = await this.loadContent(contentType, { includeInactive: true, includeDrafts: true });
        
        contentByType[contentType] = content.length;
        totalContent += content.length;

        content.forEach(item => {
          if (item.isActive) activeContent++;
          if (item.isDraft) draftContent++;

          // 統計分類
          contentByCategory[item.category] = (contentByCategory[item.category] || 0) + 1;

          // 統計語言
          if (item.locale) {
            contentByLocale[item.locale] = (contentByLocale[item.locale] || 0) + 1;
          }
        });
      } catch (error) {
        console.error(`Failed to get stats for ${contentType}:`, error);
      }
    }

    const cacheHitRate = this.stats.totalRequests > 0 
      ? this.stats.cacheHits / this.stats.totalRequests 
      : 0;

    return {
      totalContent,
      activeContent,
      draftContent,
      contentByType,
      contentByCategory,
      contentByLocale,
      lastUpdated: new Date().toISOString(),
      cacheHitRate
    };
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
      totalRequests: 0
    };
  }

  /**
   * 預熱快取
   */
  async warmupCache(): Promise<void> {
    console.log('Warming up content service cache...');
    
    const startTime = performance.now();
    const contentTypes: ContentType[] = ['calculators', 'education', 'flowcharts', 'references'];

    // 並行載入所有內容類型
    await Promise.allSettled(
      contentTypes.map(contentType => this.loadContent(contentType))
    );

    const duration = performance.now() - startTime;
    console.log(`Content cache warmup completed in ${duration.toFixed(2)}ms`);
  }

  /**
   * 合併 Git 和 CMS 內容
   */
  protected mergeContent(gitContent: UnifiedContent[], cmsContent: UnifiedContent[]): UnifiedContent[] {
    const merged = new Map<string, UnifiedContent>();

    // 先加入 Git 內容
    gitContent.forEach(item => {
      merged.set(item.slug, item);
    });

    // 再加入 CMS 內容，如果 slug 相同則以較新的為準
    cmsContent.forEach(item => {
      const existing = merged.get(item.slug);
      if (!existing || new Date(item.lastUpdated) > new Date(existing.lastUpdated)) {
        merged.set(item.slug, item);
      }
    });

    return Array.from(merged.values());
  }

  /**
   * 篩選內容
   */
  protected filterContent(content: UnifiedContent[], options: ContentLoadOptions): UnifiedContent[] {
    let filtered = content;

    // 篩選非活躍內容
    if (!options.includeInactive) {
      filtered = filtered.filter(item => item.isActive);
    }

    // 篩選草稿內容
    if (!options.includeDrafts) {
      filtered = filtered.filter(item => !item.isDraft);
    }

    // 語言篩選
    if (options.locale) {
      filtered = filtered.filter(item => 
        !item.locale || item.locale === options.locale
      );
    }

    return filtered;
  }

  /**
   * 獲取快取項目
   */
  protected getCachedItem<T>(key: string): T | undefined {
    this.stats.totalRequests++;

    const item = this.cache.get(key) as CacheItem<T> | undefined;
    if (!item) return undefined;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return undefined;
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
      ttl: ttl ?? this.options.cacheTimeout
    };

    this.cache.set(key, item);
  }

  /**
   * 獲取本地化文字
   */
  protected getLocalizedText(
    text: Record<SupportedLocale, string> | string | undefined,
    locale?: SupportedLocale
  ): string {
    if (!text) return '';
    if (typeof text === 'string') return text;

    const targetLocale = locale ?? this.options.locale;
    return text[targetLocale] || text['zh-TW'] || Object.values(text)[0] || '';
  }
}

/**
 * Astro 混合內容服務實現
 * 
 * 整合 Astro 內容集合和 Strapi CMS 的混合內容服務。
 */
export class AstroHybridContentService extends ContentService {
  private cmsBaseUrl: string;
  private cmsApiToken?: string;

  constructor(options: ContentLoadOptions & {
    cmsBaseUrl?: string;
    cmsApiToken?: string;
  } = {}) {
    super(options);
    this.cmsBaseUrl = options.cmsBaseUrl || 'http://localhost:1337';
    this.cmsApiToken = options.cmsApiToken;
  }

  /**
   * 從 Git 載入內容（使用 Astro 內容集合）
   */
  async loadFromGit(
    contentType: ContentType,
    options: ContentLoadOptions = {}
  ): Promise<UnifiedContent[]> {
    try {
      // 使用動態導入來模擬 Astro 內容集合
      // 在實際 Astro 環境中，這會是 getCollection(contentType)
      const contentModules = import.meta.glob('../content/**/*.{md,mdx,json}');
      const content: UnifiedContent[] = [];

      for (const [path, importFn] of Object.entries(contentModules)) {
        if (!path.includes(`/${contentType}/`)) continue;

        try {
          const module = await importFn() as any;
          const data = module.default || module;

          // 從路徑提取 slug
          const slug = this.extractSlugFromPath(path);

          const unifiedContent: UnifiedContent = {
            id: data.id || slug,
            slug,
            title: data.title || data.name || slug,
            description: data.description || data.excerpt,
            content: data.content || data.body,
            category: data.category || 'general',
            tags: data.tags || [],
            lastUpdated: data.lastUpdated || data.updatedAt || new Date().toISOString(),
            isActive: data.isActive !== false,
            isDraft: data.isDraft === true,
            source: 'git',
            locale: data.locale,
            metadata: data.metadata || {},
            rawData: data
          };

          content.push(unifiedContent);
        } catch (error) {
          console.warn(`Failed to load Git content from ${path}:`, error);
        }
      }

      return content;
    } catch (error) {
      console.error(`Failed to load ${contentType} from Git:`, error);
      return [];
    }
  }

  /**
   * 從 CMS 載入內容（使用 Strapi API）
   */
  async loadFromCMS(
    contentType: ContentType,
    options: ContentLoadOptions = {}
  ): Promise<UnifiedContent[]> {
    try {
      const endpoint = `${this.cmsBaseUrl}/api/${contentType}`;
      const params = new URLSearchParams();

      // 設定查詢參數
      if (options.locale) {
        params.append('locale', options.locale);
      }

      params.append('populate', '*');
      params.append('pagination[pageSize]', '100');

      const url = `${endpoint}?${params.toString()}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (this.cmsApiToken) {
        headers['Authorization'] = `Bearer ${this.cmsApiToken}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`CMS API request failed: ${response.status} ${response.statusText}`);
      }

      const cmsResponse: CMSResponse<CMSContentAttributes> = await response.json();

      return cmsResponse.data.map(item => {
        const attrs = item.attributes;
        
        return {
          id: item.id.toString(),
          slug: attrs.slug,
          title: attrs.title,
          description: attrs.description,
          content: attrs.content,
          category: attrs.category,
          tags: attrs.tags || [],
          lastUpdated: attrs.updatedAt,
          isActive: attrs.isActive,
          isDraft: attrs.isDraft,
          source: 'cms' as const,
          locale: attrs.locale as SupportedLocale,
          metadata: {
            createdAt: attrs.createdAt,
            publishedAt: attrs.publishedAt
          },
          rawData: attrs
        };
      });
    } catch (error) {
      console.error(`Failed to load ${contentType} from CMS:`, error);
      return [];
    }
  }

  /**
   * 從路徑提取 slug
   */
  private extractSlugFromPath(path: string): string {
    const match = path.match(/\/([^\/]+)\.(md|mdx|json)$/);
    return match ? match[1] : '';
  }

  /**
   * 更新 CMS 配置
   */
  updateCMSConfig(baseUrl: string, apiToken?: string): void {
    this.cmsBaseUrl = baseUrl;
    this.cmsApiToken = apiToken;
    
    // 清除快取以確保使用新配置
    this.clearCache();
  }

  /**
   * 測試 CMS 連接
   */
  async testCMSConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.cmsBaseUrl}/api/calculators?pagination[pageSize]=1`, {
        headers: this.cmsApiToken ? {
          'Authorization': `Bearer ${this.cmsApiToken}`
        } : {}
      });

      return response.ok;
    } catch (error) {
      console.error('CMS connection test failed:', error);
      return false;
    }
  }
}

// 預設服務實例
export const contentService = new AstroHybridContentService();

// 便利函數
export async function loadContent(
  contentType: ContentType,
  options?: ContentLoadOptions
): Promise<UnifiedContent[]> {
  return contentService.loadContent(contentType, options);
}

export async function loadContentBySlug(
  contentType: ContentType,
  slug: string,
  options?: ContentLoadOptions
): Promise<UnifiedContent | null> {
  return contentService.loadContentBySlug(contentType, slug, options);
}

export async function searchContent(
  query: string,
  options?: ContentLoadOptions & {
    contentTypes?: ContentType[];
    limit?: number;
  }
): Promise<Record<ContentType, UnifiedContent[]>> {
  return contentService.searchContent(query, options);
}

export async function getContentStats(): Promise<ContentStats> {
  return contentService.getContentStats();
}

export async function warmupContentCache(): Promise<void> {
  return contentService.warmupCache();
}

export function clearContentCache(pattern?: string): void {
  return contentService.clearCache(pattern);
}

export default ContentService;