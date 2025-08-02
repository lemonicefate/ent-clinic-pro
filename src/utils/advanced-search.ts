/**
 * Advanced Search System for Astro Clinical Platform
 * Implements fuzzy search, autocomplete, suggestions, and content recommendations
 */

import Fuse from 'fuse.js';

// Types for search functionality
export interface SearchItem {
  id: string;
  title: string;
  content: string;
  type: 'calculator' | 'education' | 'procedure' | 'medication';
  category: string;
  tags: string[];
  url: string;
  lastModified: Date;
  popularity: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  specialty?: string;
}

export interface SearchSuggestion {
  query: string;
  type: 'recent' | 'popular' | 'completion';
  count?: number;
  category?: string;
}

export interface SearchResult {
  item: SearchItem;
  score: number;
  matches?: Fuse.FuseResultMatch[];
  highlights?: string[];
}

export interface RecommendationResult {
  item: SearchItem;
  reason: 'similar_content' | 'same_category' | 'user_behavior' | 'trending';
  score: number;
}

/**
 * Advanced Search Engine with fuzzy search capabilities
 */
export class AdvancedSearchEngine {
  private fuse: Fuse<SearchItem>;
  private searchData: SearchItem[] = [];
  private recentSearches: string[] = [];
  private popularQueries: Map<string, number> = new Map();
  private userInteractions: Map<string, number> = new Map();
  
  // Search configuration
  private readonly fuseOptions: Fuse.IFuseOptions<SearchItem> = {
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'content', weight: 0.3 },
      { name: 'tags', weight: 0.2 },
      { name: 'category', weight: 0.1 },
    ],
    includeScore: true,
    includeMatches: true,
    threshold: 0.4, // Lower = more strict matching
    distance: 100,
    minMatchCharLength: 2,
    shouldSort: true,
    useExtendedSearch: true,
  };

  constructor(initialData: SearchItem[] = []) {
    this.searchData = initialData;
    this.fuse = new Fuse(this.searchData, this.fuseOptions);
    this.loadStoredData();
  }

  /**
   * Update search data and rebuild index
   */
  updateSearchData(data: SearchItem[]): void {
    this.searchData = data;
    this.fuse.setCollection(data);
  }

  /**
   * Add new item to search index
   */
  addItem(item: SearchItem): void {
    this.searchData.push(item);
    this.fuse.add(item);
  }

  /**
   * Remove item from search index
   */
  removeItem(itemId: string): void {
    const index = this.searchData.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.searchData.splice(index, 1);
      this.fuse.removeAt(index);
    }
  }

  /**
   * Perform advanced search with multiple strategies
   */
  search(query: string, options: {
    limit?: number;
    type?: SearchItem['type'];
    category?: string;
    specialty?: string;
    difficulty?: SearchItem['difficulty'];
  } = {}): SearchResult[] {
    if (!query.trim()) {
      return this.getPopularContent(options.limit || 10);
    }

    // Record search query
    this.recordSearch(query);

    // Perform fuzzy search
    let results = this.fuse.search(query, { limit: options.limit || 20 });

    // Apply filters
    if (options.type || options.category || options.specialty || options.difficulty) {
      results = results.filter(result => {
        const item = result.item;
        return (
          (!options.type || item.type === options.type) &&
          (!options.category || item.category === options.category) &&
          (!options.specialty || item.specialty === options.specialty) &&
          (!options.difficulty || item.difficulty === options.difficulty)
        );
      });
    }

    // Convert to SearchResult format with enhanced scoring
    return results.map(result => ({
      item: result.item,
      score: this.calculateEnhancedScore(result),
      matches: result.matches,
      highlights: this.generateHighlights(result),
    })).slice(0, options.limit || 10);
  }

  /**
   * Get autocomplete suggestions
   */
  getAutocompleteSuggestions(query: string, limit: number = 5): SearchSuggestion[] {
    if (!query.trim()) {
      return this.getRecentSearches(limit);
    }

    const suggestions: SearchSuggestion[] = [];

    // Query completions based on content
    const completions = this.generateQueryCompletions(query, limit);
    suggestions.push(...completions);

    // Popular queries that match
    const popularMatches = this.getPopularQueryMatches(query, limit);
    suggestions.push(...popularMatches);

    // Remove duplicates and sort by relevance
    const uniqueSuggestions = this.deduplicateSuggestions(suggestions);
    return uniqueSuggestions.slice(0, limit);
  }

  /**
   * Get content recommendations based on current item or user behavior
   */
  getRecommendations(
    currentItemId?: string,
    limit: number = 5
  ): RecommendationResult[] {
    const recommendations: RecommendationResult[] = [];

    if (currentItemId) {
      // Content-based recommendations
      const contentBased = this.getContentBasedRecommendations(currentItemId, limit);
      recommendations.push(...contentBased);
    }

    // Behavioral recommendations
    const behavioral = this.getBehavioralRecommendations(limit);
    recommendations.push(...behavioral);

    // Trending content
    const trending = this.getTrendingRecommendations(limit);
    recommendations.push(...trending);

    // Remove duplicates and sort by score
    const uniqueRecommendations = this.deduplicateRecommendations(recommendations);
    return uniqueRecommendations.slice(0, limit);
  }

  /**
   * Record user interaction for behavioral analysis
   */
  recordInteraction(itemId: string, interactionType: 'view' | 'click' | 'share' = 'view'): void {
    const weight = interactionType === 'click' ? 2 : interactionType === 'share' ? 3 : 1;
    const currentCount = this.userInteractions.get(itemId) || 0;
    this.userInteractions.set(itemId, currentCount + weight);
    this.saveStoredData();
  }

  /**
   * Get search analytics
   */
  getSearchAnalytics(): {
    popularQueries: Array<{ query: string; count: number }>;
    recentSearches: string[];
    topInteractions: Array<{ itemId: string; count: number }>;
  } {
    return {
      popularQueries: Array.from(this.popularQueries.entries())
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      recentSearches: [...this.recentSearches].slice(0, 10),
      topInteractions: Array.from(this.userInteractions.entries())
        .map(([itemId, count]) => ({ itemId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  }

  /**
   * Clear search history and analytics
   */
  clearSearchHistory(): void {
    this.recentSearches = [];
    this.popularQueries.clear();
    this.userInteractions.clear();
    this.saveStoredData();
  }

  // Private methods

  private recordSearch(query: string): void {
    // Add to recent searches
    this.recentSearches = [query, ...this.recentSearches.filter(q => q !== query)].slice(0, 20);
    
    // Update popular queries
    const currentCount = this.popularQueries.get(query) || 0;
    this.popularQueries.set(query, currentCount + 1);
    
    this.saveStoredData();
  }

  private calculateEnhancedScore(result: Fuse.FuseResult<SearchItem>): number {
    const baseScore = 1 - (result.score || 0); // Invert Fuse score (lower is better)
    const popularityBoost = (result.item.popularity || 0) * 0.1;
    const interactionBoost = (this.userInteractions.get(result.item.id) || 0) * 0.05;
    
    return Math.min(1, baseScore + popularityBoost + interactionBoost);
  }

  private generateHighlights(result: Fuse.FuseResult<SearchItem>): string[] {
    const highlights: string[] = [];
    
    if (result.matches) {
      result.matches.forEach(match => {
        if (match.indices && match.value) {
          const highlighted = this.highlightMatches(match.value, match.indices);
          highlights.push(highlighted);
        }
      });
    }
    
    return highlights;
  }

  private highlightMatches(text: string, indices: readonly Fuse.RangeTuple[]): string {
    let result = '';
    let lastIndex = 0;
    
    indices.forEach(([start, end]) => {
      result += text.slice(lastIndex, start);
      result += `<mark>${text.slice(start, end + 1)}</mark>`;
      lastIndex = end + 1;
    });
    
    result += text.slice(lastIndex);
    return result;
  }

  private generateQueryCompletions(query: string, limit: number): SearchSuggestion[] {
    const completions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();
    
    // Find items that start with or contain the query
    this.searchData.forEach(item => {
      const titleWords = item.title.toLowerCase().split(' ');
      const contentWords = item.content.toLowerCase().split(' ').slice(0, 50); // First 50 words
      
      // Check for word completions
      [...titleWords, ...contentWords].forEach(word => {
        if (word.startsWith(queryLower) && word.length > query.length) {
          completions.push({
            query: word,
            type: 'completion',
            category: item.category,
          });
        }
      });
      
      // Check for phrase completions
      if (item.title.toLowerCase().includes(queryLower)) {
        completions.push({
          query: item.title,
          type: 'completion',
          category: item.category,
        });
      }
    });
    
    return this.deduplicateSuggestions(completions).slice(0, limit);
  }

  private getPopularQueryMatches(query: string, limit: number): SearchSuggestion[] {
    const queryLower = query.toLowerCase();
    const matches: SearchSuggestion[] = [];
    
    this.popularQueries.forEach((count, popularQuery) => {
      if (popularQuery.toLowerCase().includes(queryLower)) {
        matches.push({
          query: popularQuery,
          type: 'popular',
          count,
        });
      }
    });
    
    return matches
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, limit);
  }

  private getRecentSearches(limit: number): SearchSuggestion[] {
    return this.recentSearches.slice(0, limit).map(query => ({
      query,
      type: 'recent' as const,
    }));
  }

  private getPopularContent(limit: number): SearchResult[] {
    return this.searchData
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, limit)
      .map(item => ({
        item,
        score: (item.popularity || 0) / 100, // Normalize popularity score
        highlights: [],
      }));
  }

  private getContentBasedRecommendations(itemId: string, limit: number): RecommendationResult[] {
    const currentItem = this.searchData.find(item => item.id === itemId);
    if (!currentItem) return [];
    
    const recommendations: RecommendationResult[] = [];
    
    this.searchData.forEach(item => {
      if (item.id === itemId) return;
      
      let score = 0;
      let reason: RecommendationResult['reason'] = 'similar_content';
      
      // Same category bonus
      if (item.category === currentItem.category) {
        score += 0.4;
        reason = 'same_category';
      }
      
      // Same type bonus
      if (item.type === currentItem.type) {
        score += 0.3;
      }
      
      // Tag similarity
      const commonTags = item.tags.filter(tag => currentItem.tags.includes(tag));
      score += (commonTags.length / Math.max(item.tags.length, currentItem.tags.length)) * 0.3;
      
      if (score > 0.2) {
        recommendations.push({ item, reason, score });
      }
    });
    
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private getBehavioralRecommendations(limit: number): RecommendationResult[] {
    const recommendations: RecommendationResult[] = [];
    
    // Get items with high user interactions
    this.userInteractions.forEach((count, itemId) => {
      const item = this.searchData.find(i => i.id === itemId);
      if (item && count > 2) {
        recommendations.push({
          item,
          reason: 'user_behavior',
          score: Math.min(1, count / 10),
        });
      }
    });
    
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private getTrendingRecommendations(limit: number): RecommendationResult[] {
    // Simple trending algorithm based on recent popularity and recency
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    return this.searchData
      .filter(item => {
        const daysSinceModified = (now - item.lastModified.getTime()) / dayMs;
        return daysSinceModified <= 7; // Only items modified in last week
      })
      .map(item => {
        const daysSinceModified = (now - item.lastModified.getTime()) / dayMs;
        const recencyScore = Math.max(0, 1 - daysSinceModified / 7);
        const popularityScore = (item.popularity || 0) / 100;
        
        return {
          item,
          reason: 'trending' as const,
          score: (recencyScore * 0.6) + (popularityScore * 0.4),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private deduplicateSuggestions(suggestions: SearchSuggestion[]): SearchSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      const key = suggestion.query.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private deduplicateRecommendations(recommendations: RecommendationResult[]): RecommendationResult[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      if (seen.has(rec.item.id)) return false;
      seen.add(rec.item.id);
      return true;
    });
  }

  private loadStoredData(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const recentSearches = localStorage.getItem('advanced_search_recent');
      if (recentSearches) {
        this.recentSearches = JSON.parse(recentSearches);
      }
      
      const popularQueries = localStorage.getItem('advanced_search_popular');
      if (popularQueries) {
        this.popularQueries = new Map(JSON.parse(popularQueries));
      }
      
      const userInteractions = localStorage.getItem('advanced_search_interactions');
      if (userInteractions) {
        this.userInteractions = new Map(JSON.parse(userInteractions));
      }
    } catch (error) {
      console.warn('Failed to load stored search data:', error);
    }
  }

  private saveStoredData(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('advanced_search_recent', JSON.stringify(this.recentSearches));
      localStorage.setItem('advanced_search_popular', JSON.stringify(Array.from(this.popularQueries.entries())));
      localStorage.setItem('advanced_search_interactions', JSON.stringify(Array.from(this.userInteractions.entries())));
    } catch (error) {
      console.warn('Failed to save search data:', error);
    }
  }
}

/**
 * Content recommendation engine
 */
export class ContentRecommendationEngine {
  private searchEngine: AdvancedSearchEngine;
  
  constructor(searchEngine: AdvancedSearchEngine) {
    this.searchEngine = searchEngine;
  }

  /**
   * Get personalized recommendations for user
   */
  getPersonalizedRecommendations(
    userPreferences: {
      specialties?: string[];
      contentTypes?: SearchItem['type'][];
      difficulty?: SearchItem['difficulty'];
    } = {},
    limit: number = 10
  ): RecommendationResult[] {
    const recommendations = this.searchEngine.getRecommendations(undefined, limit * 2);
    
    // Filter based on user preferences
    const filtered = recommendations.filter(rec => {
      const item = rec.item;
      
      if (userPreferences.specialties && userPreferences.specialties.length > 0) {
        if (!item.specialty || !userPreferences.specialties.includes(item.specialty)) {
          return false;
        }
      }
      
      if (userPreferences.contentTypes && userPreferences.contentTypes.length > 0) {
        if (!userPreferences.contentTypes.includes(item.type)) {
          return false;
        }
      }
      
      if (userPreferences.difficulty && item.difficulty) {
        if (item.difficulty !== userPreferences.difficulty) {
          return false;
        }
      }
      
      return true;
    });
    
    return filtered.slice(0, limit);
  }

  /**
   * Get related content for a specific item
   */
  getRelatedContent(itemId: string, limit: number = 5): RecommendationResult[] {
    return this.searchEngine.getRecommendations(itemId, limit);
  }

  /**
   * Get trending content in specific category
   */
  getTrendingInCategory(category: string, limit: number = 5): RecommendationResult[] {
    const allRecommendations = this.searchEngine.getRecommendations(undefined, 50);
    
    return allRecommendations
      .filter(rec => rec.item.category === category && rec.reason === 'trending')
      .slice(0, limit);
  }
}

// Export singleton instance
let searchEngineInstance: AdvancedSearchEngine | null = null;
let recommendationEngineInstance: ContentRecommendationEngine | null = null;

export function getSearchEngine(): AdvancedSearchEngine {
  if (!searchEngineInstance) {
    searchEngineInstance = new AdvancedSearchEngine();
  }
  return searchEngineInstance;
}

export function getRecommendationEngine(): ContentRecommendationEngine {
  if (!recommendationEngineInstance) {
    recommendationEngineInstance = new ContentRecommendationEngine(getSearchEngine());
  }
  return recommendationEngineInstance;
}

/**
 * Initialize search engine with data
 */
export async function initializeSearchEngine(data: SearchItem[]): Promise<void> {
  const engine = getSearchEngine();
  engine.updateSearchData(data);
}