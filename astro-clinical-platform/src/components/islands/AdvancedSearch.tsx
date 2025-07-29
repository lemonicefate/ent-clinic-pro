/**
 * Advanced Search Component with Autocomplete and Suggestions
 * Provides intelligent search with real-time suggestions and recommendations
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  getSearchEngine, 
  getRecommendationEngine,
  type SearchResult, 
  type SearchSuggestion,
  type RecommendationResult,
  type SearchItem 
} from '../../utils/advanced-search';

interface AdvancedSearchProps {
  placeholder?: string;
  showRecommendations?: boolean;
  showFilters?: boolean;
  onResultClick?: (item: SearchItem) => void;
  className?: string;
}

export default function AdvancedSearch({
  placeholder = "搜尋醫療工具、衛教文章...",
  showRecommendations = true,
  showFilters = true,
  onResultClick,
  className = "",
}: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [filters, setFilters] = useState({
    type: '' as SearchItem['type'] | '',
    category: '',
    specialty: '',
    difficulty: '' as SearchItem['difficulty'] | '',
  });

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const searchEngine = getSearchEngine();
  const recommendationEngine = getRecommendationEngine();

  // Debounced search function
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      
      try {
        if (searchQuery.trim()) {
          // Get search results
          const searchResults = searchEngine.search(searchQuery, {
            limit: 8,
            type: filters.type || undefined,
            category: filters.category || undefined,
            specialty: filters.specialty || undefined,
            difficulty: filters.difficulty || undefined,
          });
          setResults(searchResults);

          // Get autocomplete suggestions
          const autocompleteSuggestions = searchEngine.getAutocompleteSuggestions(searchQuery, 5);
          setSuggestions(autocompleteSuggestions);
        } else {
          // Show recommendations when no query
          const recs = recommendationEngine.getPersonalizedRecommendations({}, 6);
          setRecommendations(recs);
          setResults([]);
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [filters, searchEngine, recommendationEngine]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    setIsOpen(true);
    debouncedSearch(value);
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true);
    if (!query.trim()) {
      // Load recommendations on focus
      const recs = recommendationEngine.getPersonalizedRecommendations({}, 6);
      setRecommendations(recs);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const totalItems = suggestions.length + results.length + (showRecommendations ? recommendations.length : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        handleItemSelect(selectedIndex);
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle item selection
  const handleItemSelect = (index: number) => {
    if (index < 0) return;

    let currentIndex = 0;

    // Check suggestions
    if (index < suggestions.length) {
      const suggestion = suggestions[index];
      setQuery(suggestion.query);
      debouncedSearch(suggestion.query);
      return;
    }
    currentIndex += suggestions.length;

    // Check results
    if (index < currentIndex + results.length) {
      const result = results[index - currentIndex];
      handleResultClick(result.item);
      return;
    }
    currentIndex += results.length;

    // Check recommendations
    if (showRecommendations && index < currentIndex + recommendations.length) {
      const recommendation = recommendations[index - currentIndex];
      handleResultClick(recommendation.item);
      return;
    }
  };

  // Handle result click
  const handleResultClick = (item: SearchItem) => {
    searchEngine.recordInteraction(item.id, 'click');
    setIsOpen(false);
    setQuery('');
    
    if (onResultClick) {
      onResultClick(item);
    } else {
      window.location.href = item.url;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.query);
    debouncedSearch(suggestion.query);
    inputRef.current?.focus();
  };

  // Handle filter change
  const handleFilterChange = (filterType: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    
    if (query.trim()) {
      debouncedSearch(query);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const getItemClassName = (index: number) => {
    return `search-item ${selectedIndex === index ? 'selected' : ''}`;
  };

  return (
    <div ref={searchRef} className={`advanced-search ${className}`}>
      {/* Search Input */}
      <div className="search-input-container">
        <div className="search-input-wrapper">
          <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="search-input"
            autoComplete="off"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-autocomplete="list"
          />
          {loading && (
            <div className="search-loading">
              <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="search-filters">
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="filter-select"
            >
              <option value="">所有類型</option>
              <option value="calculator">計算工具</option>
              <option value="education">衛教文章</option>
              <option value="procedure">醫療程序</option>
              <option value="medication">藥物資訊</option>
            </select>

            <select
              value={filters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="filter-select"
            >
              <option value="">所有難度</option>
              <option value="beginner">初級</option>
              <option value="intermediate">中級</option>
              <option value="advanced">高級</option>
            </select>
          </div>
        )}
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <div className="search-dropdown" role="listbox">
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="search-section">
              <div className="search-section-header">
                <svg className="section-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
                建議搜尋
              </div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={`suggestion-${index}`}
                  className={getItemClassName(index)}
                  onClick={() => handleSuggestionClick(suggestion)}
                  role="option"
                  aria-selected={selectedIndex === index}
                >
                  <div className="suggestion-content">
                    <span className="suggestion-query">{suggestion.query}</span>
                    <div className="suggestion-meta">
                      {suggestion.type === 'recent' && <span className="suggestion-badge recent">最近搜尋</span>}
                      {suggestion.type === 'popular' && <span className="suggestion-badge popular">熱門搜尋</span>}
                      {suggestion.count && <span className="suggestion-count">{suggestion.count} 次搜尋</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search Results */}
          {results.length > 0 && (
            <div className="search-section">
              <div className="search-section-header">
                <svg className="section-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                搜尋結果
              </div>
              {results.map((result, index) => {
                const itemIndex = suggestions.length + index;
                return (
                  <div
                    key={`result-${result.item.id}`}
                    className={getItemClassName(itemIndex)}
                    onClick={() => handleResultClick(result.item)}
                    role="option"
                    aria-selected={selectedIndex === itemIndex}
                  >
                    <div className="result-content">
                      <div className="result-header">
                        <h4 className="result-title">{result.item.title}</h4>
                        <span className={`result-type type-${result.item.type}`}>
                          {result.item.type === 'calculator' && '計算工具'}
                          {result.item.type === 'education' && '衛教文章'}
                          {result.item.type === 'procedure' && '醫療程序'}
                          {result.item.type === 'medication' && '藥物資訊'}
                        </span>
                      </div>
                      <p className="result-description">
                        {result.highlights && result.highlights.length > 0 
                          ? <span dangerouslySetInnerHTML={{ __html: result.highlights[0] }} />
                          : result.item.content.substring(0, 100) + '...'
                        }
                      </p>
                      <div className="result-meta">
                        <span className="result-category">{result.item.category}</span>
                        {result.item.tags.length > 0 && (
                          <div className="result-tags">
                            {result.item.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="result-tag">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recommendations */}
          {showRecommendations && recommendations.length > 0 && !query.trim() && (
            <div className="search-section">
              <div className="search-section-header">
                <svg className="section-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                推薦內容
              </div>
              {recommendations.map((recommendation, index) => {
                const itemIndex = suggestions.length + results.length + index;
                return (
                  <div
                    key={`recommendation-${recommendation.item.id}`}
                    className={getItemClassName(itemIndex)}
                    onClick={() => handleResultClick(recommendation.item)}
                    role="option"
                    aria-selected={selectedIndex === itemIndex}
                  >
                    <div className="recommendation-content">
                      <div className="recommendation-header">
                        <h4 className="recommendation-title">{recommendation.item.title}</h4>
                        <span className="recommendation-reason">
                          {recommendation.reason === 'similar_content' && '相似內容'}
                          {recommendation.reason === 'same_category' && '同類別'}
                          {recommendation.reason === 'user_behavior' && '基於使用習慣'}
                          {recommendation.reason === 'trending' && '熱門內容'}
                        </span>
                      </div>
                      <p className="recommendation-description">
                        {recommendation.item.content.substring(0, 80)}...
                      </p>
                      <div className="recommendation-meta">
                        <span className="recommendation-category">{recommendation.item.category}</span>
                        <span className="recommendation-score">
                          相關度: {Math.round(recommendation.score * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No Results */}
          {!loading && query.trim() && results.length === 0 && suggestions.length === 0 && (
            <div className="search-no-results">
              <svg className="no-results-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="no-results-text">找不到相關結果</p>
              <p className="no-results-suggestion">試試其他關鍵字或調整篩選條件</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}