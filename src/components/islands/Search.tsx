/**
 * 搜尋組件
 * 提供即時搜尋功能並觸發分析事件
 */

import { useState, useCallback } from 'react';

interface Props {
  initialQuery?: string;
  locale?: string;
  className?: string;
  placeholder?: string;
}

interface SearchResult {
  title: string;
  url: string;
  excerpt: string;
  type: 'calculator' | 'education' | 'flowchart' | 'page';
  category?: string;
  specialty?: string;
}

export default function Search({ 
  initialQuery = '', 
  locale = 'zh-TW', 
  className = '',
  placeholder = '搜尋醫療工具和衛教內容...'
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // 執行搜尋
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);

    try {
      // 模擬搜尋延遲
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 模擬搜尋結果
      const mockResults: SearchResult[] = [
        {
          title: 'CHA₂DS₂-VASc 計算機',
          url: '/tools/cha2ds2-vasc',
          excerpt: '心房顫動患者中風風險評估工具',
          type: 'calculator',
          specialty: '心臟科'
        },
        {
          title: 'BMI 計算機',
          url: '/tools/bmi',
          excerpt: '身體質量指數計算工具',
          type: 'calculator'
        }
      ].filter(result => 
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setResults(mockResults);
      setHasSearched(true);

    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 處理搜尋輸入
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  }, [query, performSearch]);

  return (
    <div className={`search-component ${className}`}>
      {/* 搜尋表單 */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="search-input" className="sr-only">
              搜尋醫療工具和衛教內容
            </label>
            <input
              id="search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder || "搜尋醫療工具和衛教內容..."}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                搜尋中...
              </div>
            ) : (
              <div className="flex items-center">
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                搜尋
              </div>
            )}
          </button>
        </div>
      </form>

      {/* 搜尋結果 */}
      {hasSearched && (
        <div className="search-results">
          {results.length > 0 ? (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  找到 {results.length} 個結果
                </p>
              </div>
              
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={result.url}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            result.type === 'calculator' 
                              ? 'bg-blue-100 text-blue-800'
                              : result.type === 'education'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {result.type === 'calculator' ? '計算機' : 
                             result.type === 'education' ? '衛教' : '頁面'}
                          </span>
                          {result.specialty && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {result.specialty}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          <a
                            href={result.url}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {result.title}
                          </a>
                        </h3>
                        
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {result.excerpt}
                        </p>
                      </div>
                      
                      <div className="ml-4">
                        <a
                          href={result.url}
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          查看
                          <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">沒有找到結果</h3>
              <p className="mt-1 text-sm text-gray-500">
                請嘗試使用不同的關鍵字搜尋
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}