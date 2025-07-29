import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchSuggestionEngine, ContentRecommendationEngine } from '../../utils/search-suggestions';
import type { SearchSuggestion, SearchContext } from '../../utils/search-suggestions';

interface EnhancedSearchProps {
  placeholder?: string;
  specialty?: string;
  showRecommendations?: boolean;
  onSearch?: (query: string) => void;
  className?: string;
}

export default function EnhancedSearch({
  placeholder = "搜尋醫療工具、衛教文章...",
  specialty,
  showRecommendations = true,
  onSearch,
  className = ""
}: EnhancedSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recommendations, setRecommendations] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // 初始化搜尋引擎
  useEffect(() => {
    const initializeSearch = async () => {
      try {
        // 載入計算機和教育內容數據
        const calculatorsResponse = await fetch('/api/calculators');
        const educationResponse = await fetch('/api/education');
        
        const calculators = calculatorsResponse.ok ? await calculatorsResponse.json() : [];
        const education = educationResponse.ok ? await educationResponse.json() : [];
        
        SearchSuggestionEngine.initialize(calculators, education);
        ContentRecommendationEngine.initialize();
        
        // 載入搜尋歷史
        const history = localStorage.getItem('medical-search-history');
        if (history) {
          const historyMap = new Map(JSON.parse(history));
          setSearchHistory([...historyMap.keys()].slice(0, 5));
        }
        
        // 載入推薦內容
        if (showRecommendations) {
          loadRecommendations();
        }
      } catch (error) {
        console.error('Failed to initialize search:', error);
      }
    };

    initializeSearch();
  }, [showRecommendations]);

  const loadRecommendations = async () => {
    try {
      // 基於當前頁面或用戶偏好載入推薦
      const currentPath = window.location.pathname;
      let contentId = '';
      let contentType: 'calculator' | 'education' = 'calculator';
      
      if (currentPath.startsWith('/tools/')) {
        contentId = currentPath.split('/')[2];
        contentType = 'calculator';
      } else if (currentPath.startsWith('/education/')) {
        contentId = currentPath.split('/')[2];
        contentType = 'education';
      }
      
      if (contentId) {
        const recs = await ContentRecommendationEngine.getRecommendations(
          contentId, 
          contentType, 
          4
        );
        setRecommendations(recs);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const debouncedSearch = useCallback(async (searchQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      if (searchQuery.length === 0) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      
      try {
        const context: SearchContext = {
          query: searchQuery,
          userHistory: searchHistory,
          currentPage: window.location.pathname,
          specialty
        };
        
        const results = await SearchSuggestionEngine.getSuggestions(context);
        setSuggestions(results);
      } catch (error) {
        console.error('Search failed:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, [searchHistory, specialty]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    if (value.trim()) {
      setShowSuggestions(true);
      debouncedSearch(value);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      SearchSuggestionEngine.recordSearch(query.trim());
      setShowSuggestions(false);
      
      if (onSearch) {
        onSearch(query.trim());
      } else {
        window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
      }
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    SearchSuggestionEngine.recordSearch(suggestion.title);
    setQuery(suggestion.title);
    setShowSuggestions(false);
    
    // 記錄互動
    ContentRecommendationEngine.recordInteraction(suggestion.id, 'view');
    
    window.location.href = suggestion.url;
  };

  const handleFocus = () => {
    if (query.trim()) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // 延遲隱藏建議，讓點擊事件能夠觸發
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) {
        setShowSuggestions(false);
      }
    }, 150);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'calculator':
        return '🧮';
      case 'education':
        return '📚';
      case 'specialty':
        return '🏥';
      case 'keyword':
        return '🔍';
      default:
        return '📄';
    }
  };

  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case 'calculator':
        return '計算工具';
      case 'education':
        return '衛教文章';
      case 'specialty':
        return '專科';
      case 'keyword':
        return '關鍵字';
      default:
        return '';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* 搜尋輸入框 */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-12 pr-4 text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          aria-label="搜尋醫療內容"
          aria-expanded={showSuggestions}
          aria-haspopup="listbox"
          role="combobox"
        />
        
        {/* 搜尋圖示 */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* 載入指示器 */}
        {isLoading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* 搜尋建議下拉選單 */}
      {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0) && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
          role="listbox"
        >
          {/* 搜尋歷史 */}
          {query.length === 0 && searchHistory.length > 0 && (
            <div className="p-2 border-b border-gray-100">
              <div className="text-xs font-medium text-gray-500 mb-2">最近搜尋</div>
              {searchHistory.map((historyItem, index) => (
                <button
                  key={`history-${index}`}
                  onClick={() => {
                    setQuery(historyItem);
                    debouncedSearch(historyItem);
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                >
                  <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {historyItem}
                </button>
              ))}
            </div>
          )}

          {/* 搜尋建議 */}
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`flex items-start w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <span className="text-lg mr-3 mt-0.5">
                {getSuggestionIcon(suggestion.type)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.title}
                  </h4>
                  <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {getSuggestionTypeLabel(suggestion.type)}
                  </span>
                </div>
                {suggestion.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {suggestion.description}
                  </p>
                )}
                {suggestion.category && (
                  <p className="text-xs text-blue-600 mt-1">
                    {suggestion.category}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 推薦內容 */}
      {showRecommendations && recommendations.length > 0 && !showSuggestions && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">推薦內容</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendations.map((rec) => (
              <a
                key={rec.id}
                href={rec.url}
                onClick={() => ContentRecommendationEngine.recordInteraction(rec.id, 'view')}
                className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-lg mr-3">
                  {getSuggestionIcon(rec.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {rec.title}
                  </h4>
                  {rec.description && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {rec.description}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}