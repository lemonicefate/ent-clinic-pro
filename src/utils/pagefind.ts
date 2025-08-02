/**
 * Pagefind 靜態搜尋整合
 * 提供高效能的靜態內容搜尋功能
 */

import type { SupportedLocale } from '../env.d';

// Pagefind 搜尋結果介面
export interface PagefindResult {
  id: string;
  data: () => Promise<{
    url: string;
    excerpt: string;
    meta: Record<string, string>;
    content: string;
    word_count: number;
  }>;
  score: number;
  words: number[];
}

export interface PagefindResponse {
  results: PagefindResult[];
  unfilteredResultCount: number;
  totalFilters: Record<string, Record<string, number>>;
}

// 搜尋選項
export interface SearchOptions {
  locale?: SupportedLocale;
  filters?: Record<string, string | string[]>;
  sort?: Record<string, 'asc' | 'desc'>;
  limit?: number;
}

// 處理後的搜尋結果
export interface ProcessedSearchResult {
  title: string;
  url: string;
  excerpt: string;
  type: 'calculator' | 'education' | 'flowchart' | 'page';
  category?: string;
  specialty?: string;
  difficulty?: string;
  score: number;
  wordCount: number;
}

/**
 * Pagefind 搜尋類別
 */
export class PagefindSearch {
  private static instance: PagefindSearch;
  private pagefind: any = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): PagefindSearch {
    if (!PagefindSearch.instance) {
      PagefindSearch.instance = new PagefindSearch();
    }
    return PagefindSearch.instance;
  }

  /**
   * 初始化 Pagefind
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.loadPagefind();
    await this.initPromise;
  }

  /**
   * 載入 Pagefind 腳本
   */
  private async loadPagefind(): Promise<void> {
    try {
      // 檢查是否已經載入
      if (window.pagefind) {
        this.pagefind = window.pagefind;
        this.isInitialized = true;
        return;
      }

      // 動態載入 Pagefind 腳本
      const script = document.createElement('script');
      script.src = '/pagefind/pagefind.js';
      script.async = true;
      
      await new Promise<void>((resolve, reject) => {
        script.onload = () => {
          if (window.pagefind) {
            this.pagefind = window.pagefind;
            this.isInitialized = true;
            resolve();
          } else {
            reject(new Error('Pagefind failed to load'));
          }
        };
        
        script.onerror = () => {
          reject(new Error('Failed to load Pagefind script'));
        };
        
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error('Failed to initialize Pagefind:', error);
      throw error;
    }
  }

  /**
   * 執行搜尋
   */
  async search(
    query: string, 
    options: SearchOptions = {}
  ): Promise<ProcessedSearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      await this.initialize();
      
      if (!this.pagefind) {
        throw new Error('Pagefind not initialized');
      }

      // 建構搜尋選項
      const searchOptions: any = {};
      
      if (options.filters) {
        searchOptions.filters = options.filters;
      }
      
      if (options.sort) {
        searchOptions.sort = options.sort;
      }

      // 執行搜尋
      const response: PagefindResponse = await this.pagefind.search(query, searchOptions);
      
      // 處理結果
      const processedResults = await this.processResults(response.results, options.limit);
      
      return processedResults;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * 處理搜尋結果
   */
  private async processResults(
    results: PagefindResult[], 
    limit = 10
  ): Promise<ProcessedSearchResult[]> {
    const processedResults: ProcessedSearchResult[] = [];
    
    // 限制處理的結果數量以提升效能
    const resultsToProcess = results.slice(0, limit);
    
    for (const result of resultsToProcess) {
      try {
        const data = await result.data();
        const processed = this.processResult(result, data);
        if (processed) {
          processedResults.push(processed);
        }
      } catch (error) {
        console.warn('Failed to process search result:', error);
      }
    }
    
    return processedResults.sort((a, b) => b.score - a.score);
  }

  /**
   * 處理單個搜尋結果
   */
  private processResult(
    result: PagefindResult, 
    data: any
  ): ProcessedSearchResult | null {
    try {
      const meta = data.meta || {};
      
      // 確定內容類型
      const type = this.determineContentType(data.url, meta);
      
      // 提取標題
      const title = meta.title || 
                   meta['og:title'] || 
                   this.extractTitleFromContent(data.content) || 
                   '未命名內容';
      
      // 生成摘要
      const excerpt = this.generateExcerpt(data.excerpt || data.content, 150);
      
      return {
        title,
        url: data.url,
        excerpt,
        type,
        category: meta.category,
        specialty: meta.specialty,
        difficulty: meta.difficulty,
        score: result.score,
        wordCount: data.word_count || 0
      };
    } catch (error) {
      console.warn('Failed to process individual result:', error);
      return null;
    }
  }

  /**
   * 確定內容類型
   */
  private determineContentType(
    url: string, 
    meta: Record<string, string>
  ): 'calculator' | 'education' | 'flowchart' | 'page' {
    // 根據 URL 路徑判斷內容類型
    if (url.includes('/tools/') || url.includes('/calculators/')) {
      return 'calculator';
    }
    
    if (url.includes('/education/')) {
      return 'education';
    }
    
    if (url.includes('/flowcharts/')) {
      return 'flowchart';
    }
    
    // 檢查 meta 標籤
    if (meta.type) {
      const type = meta.type.toLowerCase();
      if (['calculator', 'education', 'flowchart'].includes(type)) {
        return type as 'calculator' | 'education' | 'flowchart';
      }
    }
    
    return 'page';
  }

  /**
   * 從內容中提取標題
   */
  private extractTitleFromContent(content: string): string | null {
    // 嘗試從 HTML 中提取 h1 標籤
    const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match) {
      return this.stripHtml(h1Match[1]);
    }
    
    // 嘗試從 Markdown 中提取標題
    const mdMatch = content.match(/^#\s+(.+)$/m);
    if (mdMatch) {
      return mdMatch[1].trim();
    }
    
    return null;
  }

  /**
   * 生成摘要
   */
  private generateExcerpt(content: string, maxLength = 150): string {
    // 移除 HTML 標籤
    const cleanContent = this.stripHtml(content);
    
    // 移除多餘的空白字符
    const normalizedContent = cleanContent
      .replace(/\s+/g, ' ')
      .trim();
    
    if (normalizedContent.length <= maxLength) {
      return normalizedContent;
    }
    
    // 在單詞邊界截斷
    const truncated = normalizedContent.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > maxLength * 0.8) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }
    
    return truncated + '...';
  }

  /**
   * 移除 HTML 標籤
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * 獲取可用的篩選器
   */
  async getFilters(): Promise<Record<string, Record<string, number>>> {
    try {
      await this.initialize();
      
      if (!this.pagefind) {
        return {};
      }

      // 執行空搜尋以獲取所有篩選器
      const response: PagefindResponse = await this.pagefind.search('', {
        filters: {}
      });
      
      return response.totalFilters || {};
    } catch (error) {
      console.error('Failed to get filters:', error);
      return {};
    }
  }

  /**
   * 搜尋建議
   */
  async getSuggestions(query: string, limit = 5): Promise<string[]> {
    if (!query.trim() || query.length < 2) {
      return [];
    }

    try {
      const results = await this.search(query, { limit: limit * 2 });
      
      // 提取關鍵詞作為建議
      const suggestions = new Set<string>();
      
      results.forEach(result => {
        // 從標題中提取關鍵詞
        const titleWords = result.title
          .toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 2 && word.includes(query.toLowerCase()));
        
        titleWords.forEach(word => suggestions.add(word));
        
        // 從類別中提取建議
        if (result.category) {
          const categoryWords = result.category
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 2);
          
          categoryWords.forEach(word => suggestions.add(word));
        }
      });
      
      return Array.from(suggestions).slice(0, limit);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }
}

/**
 * 全域搜尋函數
 */
export async function searchContent(
  query: string,
  locale: SupportedLocale,
  options: {
    includeCalculators?: boolean;
    includeEducation?: boolean;
    includeFlowcharts?: boolean;
    limit?: number;
  } = {}
): Promise<ProcessedSearchResult[]> {
  const {
    includeCalculators = true,
    includeEducation = true,
    includeFlowcharts = true,
    limit = 10
  } = options;

  const searchInstance = PagefindSearch.getInstance();
  
  // 建構篩選器
  const filters: Record<string, string[]> = {};
  
  // 語言篩選
  if (locale !== 'zh-TW') {
    filters.language = [locale];
  }
  
  // 內容類型篩選
  const contentTypes: string[] = [];
  if (includeCalculators) contentTypes.push('calculator');
  if (includeEducation) contentTypes.push('education');
  if (includeFlowcharts) contentTypes.push('flowchart');
  
  if (contentTypes.length > 0 && contentTypes.length < 3) {
    filters.type = contentTypes;
  }

  try {
    const results = await searchInstance.search(query, {
      locale,
      filters,
      limit,
      sort: { score: 'desc' }
    });

    return results;
  } catch (error) {
    console.error('Content search failed:', error);
    return [];
  }
}

/**
 * 搜尋建議函數
 */
export async function getSearchSuggestions(
  query: string,
  limit = 5
): Promise<string[]> {
  const searchInstance = PagefindSearch.getInstance();
  return searchInstance.getSuggestions(query, limit);
}

/**
 * 獲取搜尋篩選器
 */
export async function getSearchFilters(): Promise<Record<string, Record<string, number>>> {
  const searchInstance = PagefindSearch.getInstance();
  return searchInstance.getFilters();
}

// 全域類型聲明
declare global {
  interface Window {
    pagefind?: any;
  }
}