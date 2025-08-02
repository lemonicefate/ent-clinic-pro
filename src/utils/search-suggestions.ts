// 搜尋建議和自動完成功能
import type { CalculatorConfig } from '../types/calculator';

export interface SearchSuggestion {
  id: string;
  title: string;
  type: 'calculator' | 'education' | 'specialty' | 'keyword';
  category?: string;
  description?: string;
  url: string;
  relevanceScore: number;
}

export interface SearchContext {
  query: string;
  userHistory: string[];
  currentPage?: string;
  specialty?: string;
}

export class SearchSuggestionEngine {
  private static calculators: CalculatorConfig[] = [];
  private static educationContent: any[] = [];
  private static searchHistory: Map<string, number> = new Map();
  private static popularQueries: Map<string, number> = new Map();

  static initialize(calculators: CalculatorConfig[], education: any[]) {
    this.calculators = calculators;
    this.educationContent = education;
    this.loadSearchHistory();
    this.loadPopularQueries();
  }

  static async getSuggestions(context: SearchContext): Promise<SearchSuggestion[]> {
    const { query, userHistory, currentPage, specialty } = context;
    
    if (query.length < 2) {
      return this.getDefaultSuggestions(specialty);
    }

    const suggestions: SearchSuggestion[] = [];
    
    // 1. 計算機建議
    const calculatorSuggestions = this.getCalculatorSuggestions(query, specialty);
    suggestions.push(...calculatorSuggestions);

    // 2. 教育內容建議
    const educationSuggestions = this.getEducationSuggestions(query, specialty);
    suggestions.push(...educationSuggestions);

    // 3. 專科建議
    const specialtySuggestions = this.getSpecialtySuggestions(query);
    suggestions.push(...specialtySuggestions);

    // 4. 關鍵字建議
    const keywordSuggestions = this.getKeywordSuggestions(query, userHistory);
    suggestions.push(...keywordSuggestions);

    // 5. 熱門查詢建議
    const popularSuggestions = this.getPopularSuggestions(query);
    suggestions.push(...popularSuggestions);

    // 排序並限制結果數量
    return this.rankAndFilterSuggestions(suggestions, context);
  }

  private static getCalculatorSuggestions(query: string, specialty?: string): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    
    for (const calculator of this.calculators) {
      if (specialty && calculator.specialty !== specialty) continue;
      
      const titleMatch = this.calculateRelevance(query, calculator.title);
      const descMatch = this.calculateRelevance(query, calculator.description || '');
      const keywordMatch = calculator.keywords?.some(keyword => 
        keyword.toLowerCase().includes(query.toLowerCase())
      ) ? 0.8 : 0;

      const maxRelevance = Math.max(titleMatch, descMatch, keywordMatch);
      
      if (maxRelevance > 0.3) {
        suggestions.push({
          id: calculator.id,
          title: calculator.title,
          type: 'calculator',
          category: calculator.specialty,
          description: calculator.description,
          url: `/tools/${calculator.id}`,
          relevanceScore: maxRelevance
        });
      }
    }

    return suggestions;
  }

  private static getEducationSuggestions(query: string, specialty?: string): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    
    for (const content of this.educationContent) {
      if (specialty && content.specialty !== specialty) continue;
      
      const titleMatch = this.calculateRelevance(query, content.title);
      const summaryMatch = this.calculateRelevance(query, content.summary || '');
      const tagMatch = content.tags?.some((tag: string) => 
        tag.toLowerCase().includes(query.toLowerCase())
      ) ? 0.7 : 0;

      const maxRelevance = Math.max(titleMatch, summaryMatch, tagMatch);
      
      if (maxRelevance > 0.3) {
        suggestions.push({
          id: content.id,
          title: content.title,
          type: 'education',
          category: content.specialty,
          description: content.summary,
          url: `/education/${content.slug}`,
          relevanceScore: maxRelevance
        });
      }
    }

    return suggestions;
  }

  private static getSpecialtySuggestions(query: string): SearchSuggestion[] {
    const specialties = [
      { id: 'cardiology', name: '心臟科', description: '心血管疾病診斷與治療' },
      { id: 'endocrinology', name: '內分泌科', description: '糖尿病、甲狀腺等內分泌疾病' },
      { id: 'nephrology', name: '腎臟科', description: '腎臟疾病與透析治療' },
      { id: 'neurology', name: '神經科', description: '神經系統疾病診斷' },
      { id: 'emergency', name: '急診科', description: '急診醫學與緊急處置' },
      { id: 'pediatrics', name: '小兒科', description: '兒童疾病與發育' },
      { id: 'psychiatry', name: '精神科', description: '精神疾病與心理健康' }
    ];

    return specialties
      .filter(specialty => 
        specialty.name.includes(query) || 
        specialty.description.includes(query) ||
        specialty.id.toLowerCase().includes(query.toLowerCase())
      )
      .map(specialty => ({
        id: specialty.id,
        title: specialty.name,
        type: 'specialty' as const,
        description: specialty.description,
        url: `/specialties/${specialty.id}`,
        relevanceScore: this.calculateRelevance(query, specialty.name)
      }));
  }

  private static getKeywordSuggestions(query: string, userHistory: string[]): SearchSuggestion[] {
    const medicalKeywords = [
      { keyword: '血壓', description: '高血壓診斷與管理', url: '/search?q=血壓' },
      { keyword: '糖尿病', description: '糖尿病診斷與治療', url: '/search?q=糖尿病' },
      { keyword: '心房顫動', description: '心房顫動風險評估', url: '/search?q=心房顫動' },
      { keyword: '腎功能', description: '腎功能評估與檢查', url: '/search?q=腎功能' },
      { keyword: '藥物交互作用', description: '藥物安全性檢查', url: '/search?q=藥物交互作用' },
      { keyword: '疫苗接種', description: '疫苗接種指南', url: '/search?q=疫苗接種' },
      { keyword: '急救處置', description: '緊急醫療處置', url: '/search?q=急救處置' }
    ];

    // 優先顯示用戶歷史相關的關鍵字
    const historyBoost = (keyword: string) => 
      userHistory.some(h => h.includes(keyword)) ? 0.3 : 0;

    return medicalKeywords
      .filter(item => item.keyword.includes(query))
      .map(item => ({
        id: `keyword-${item.keyword}`,
        title: item.keyword,
        type: 'keyword' as const,
        description: item.description,
        url: item.url,
        relevanceScore: this.calculateRelevance(query, item.keyword) + historyBoost(item.keyword)
      }));
  }

  private static getPopularSuggestions(query: string): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    
    for (const [popularQuery, count] of this.popularQueries.entries()) {
      if (popularQuery.toLowerCase().includes(query.toLowerCase()) && popularQuery !== query) {
        suggestions.push({
          id: `popular-${popularQuery}`,
          title: popularQuery,
          type: 'keyword',
          description: `熱門搜尋 (${count} 次)`,
          url: `/search?q=${encodeURIComponent(popularQuery)}`,
          relevanceScore: this.calculateRelevance(query, popularQuery) * 0.8
        });
      }
    }

    return suggestions;
  }

  private static getDefaultSuggestions(specialty?: string): SearchSuggestion[] {
    const defaultSuggestions: SearchSuggestion[] = [
      {
        id: 'popular-bmi',
        title: 'BMI 計算機',
        type: 'calculator',
        description: '身體質量指數計算',
        url: '/tools/bmi',
        relevanceScore: 1.0
      },
      {
        id: 'popular-cha2ds2vasc',
        title: 'CHA₂DS₂-VASc 評分',
        type: 'calculator',
        description: '心房顫動中風風險評估',
        url: '/tools/cha2ds2-vasc',
        relevanceScore: 0.9
      },
      {
        id: 'popular-egfr',
        title: 'eGFR 計算機',
        type: 'calculator',
        description: '腎絲球過濾率估算',
        url: '/tools/egfr',
        relevanceScore: 0.8
      }
    ];

    if (specialty) {
      return defaultSuggestions.filter(s => 
        s.category === specialty || !s.category
      );
    }

    return defaultSuggestions;
  }

  private static calculateRelevance(query: string, text: string): number {
    if (!text) return 0;
    
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    // 完全匹配
    if (textLower === queryLower) return 1.0;
    
    // 開頭匹配
    if (textLower.startsWith(queryLower)) return 0.9;
    
    // 包含匹配
    if (textLower.includes(queryLower)) return 0.7;
    
    // 模糊匹配 (簡單的字符相似度)
    const similarity = this.calculateStringSimilarity(queryLower, textLower);
    return similarity > 0.6 ? similarity * 0.6 : 0;
  }

  private static calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private static rankAndFilterSuggestions(
    suggestions: SearchSuggestion[], 
    context: SearchContext
  ): SearchSuggestion[] {
    // 去重
    const uniqueSuggestions = suggestions.reduce((acc, current) => {
      const existing = acc.find(item => item.id === current.id);
      if (!existing || existing.relevanceScore < current.relevanceScore) {
        return [...acc.filter(item => item.id !== current.id), current];
      }
      return acc;
    }, [] as SearchSuggestion[]);

    // 排序：相關性 + 類型權重
    const typeWeights = {
      calculator: 1.0,
      education: 0.9,
      specialty: 0.8,
      keyword: 0.7
    };

    return uniqueSuggestions
      .map(suggestion => ({
        ...suggestion,
        relevanceScore: suggestion.relevanceScore * typeWeights[suggestion.type]
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 8); // 限制最多 8 個建議
  }

  static recordSearch(query: string) {
    // 記錄搜尋歷史
    const count = this.searchHistory.get(query) || 0;
    this.searchHistory.set(query, count + 1);
    
    // 更新熱門查詢
    const popularCount = this.popularQueries.get(query) || 0;
    this.popularQueries.set(query, popularCount + 1);
    
    // 持久化到 localStorage
    this.saveSearchHistory();
    this.savePopularQueries();
  }

  private static loadSearchHistory() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('medical-search-history');
      if (stored) {
        this.searchHistory = new Map(JSON.parse(stored));
      }
    }
  }

  private static saveSearchHistory() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'medical-search-history', 
        JSON.stringify([...this.searchHistory.entries()])
      );
    }
  }

  private static loadPopularQueries() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('medical-popular-queries');
      if (stored) {
        this.popularQueries = new Map(JSON.parse(stored));
      }
    }
  }

  private static savePopularQueries() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'medical-popular-queries', 
        JSON.stringify([...this.popularQueries.entries()])
      );
    }
  }

  static clearHistory() {
    this.searchHistory.clear();
    this.popularQueries.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('medical-search-history');
      localStorage.removeItem('medical-popular-queries');
    }
  }
}

// 智能推薦引擎
export class ContentRecommendationEngine {
  private static userInteractions: Map<string, number> = new Map();
  private static contentSimilarity: Map<string, string[]> = new Map();

  static initialize() {
    this.loadUserInteractions();
    this.buildContentSimilarity();
  }

  static async getRecommendations(
    currentContentId: string,
    contentType: 'calculator' | 'education',
    limit: number = 5
  ): Promise<SearchSuggestion[]> {
    const recommendations: SearchSuggestion[] = [];

    // 1. 基於內容相似性的推薦
    const similarContent = this.contentSimilarity.get(currentContentId) || [];
    for (const contentId of similarContent.slice(0, limit)) {
      const suggestion = await this.getContentSuggestion(contentId, contentType);
      if (suggestion) recommendations.push(suggestion);
    }

    // 2. 基於用戶行為的推薦
    const behaviorRecommendations = this.getBehaviorBasedRecommendations(
      currentContentId, 
      contentType, 
      limit - recommendations.length
    );
    recommendations.push(...behaviorRecommendations);

    return recommendations.slice(0, limit);
  }

  private static async getContentSuggestion(
    contentId: string, 
    contentType: 'calculator' | 'education'
  ): Promise<SearchSuggestion | null> {
    // 這裡需要根據實際的內容數據來實現
    // 暫時返回模擬數據
    return {
      id: contentId,
      title: `推薦內容 ${contentId}`,
      type: contentType,
      description: '基於相似性推薦',
      url: contentType === 'calculator' ? `/tools/${contentId}` : `/education/${contentId}`,
      relevanceScore: 0.8
    };
  }

  private static getBehaviorBasedRecommendations(
    currentContentId: string,
    contentType: 'calculator' | 'education',
    limit: number
  ): SearchSuggestion[] {
    // 基於用戶互動歷史的推薦邏輯
    const recommendations: SearchSuggestion[] = [];
    
    // 實現基於協同過濾的推薦算法
    // 這裡是簡化版本
    
    return recommendations.slice(0, limit);
  }

  static recordInteraction(contentId: string, interactionType: 'view' | 'calculate' | 'share') {
    const weight = interactionType === 'calculate' ? 3 : interactionType === 'share' ? 2 : 1;
    const currentScore = this.userInteractions.get(contentId) || 0;
    this.userInteractions.set(contentId, currentScore + weight);
    
    this.saveUserInteractions();
  }

  private static buildContentSimilarity() {
    // 建立內容相似性映射
    // 這裡需要根據實際內容來實現
    // 可以基於標籤、分類、關鍵字等來計算相似性
  }

  private static loadUserInteractions() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('medical-user-interactions');
      if (stored) {
        this.userInteractions = new Map(JSON.parse(stored));
      }
    }
  }

  private static saveUserInteractions() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'medical-user-interactions',
        JSON.stringify([...this.userInteractions.entries()])
      );
    }
  }
}