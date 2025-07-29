import React, { useState, useEffect } from 'react';
import { IntelligentRecommendationEngine } from '../../utils/content-recommendation';
import type { RecommendationItem } from '../../utils/content-recommendation';

interface PersonalizedRecommendationsProps {
  currentContentId?: string;
  title?: string;
  limit?: number;
  showReason?: boolean;
  className?: string;
}

export default function PersonalizedRecommendations({
  currentContentId,
  title = "為您推薦",
  limit = 6,
  showReason = true,
  className = ""
}: PersonalizedRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, [currentContentId, limit]);

  const loadRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 初始化推薦引擎
      IntelligentRecommendationEngine.initialize();
      
      // 獲取個人化推薦
      const recs = await IntelligentRecommendationEngine.getPersonalizedRecommendations(
        currentContentId,
        limit
      );
      
      setRecommendations(recs);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
      setError('載入推薦內容時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecommendationClick = (recommendation: RecommendationItem) => {
    // 記錄用戶行為
    IntelligentRecommendationEngine.recordUserBehavior(
      recommendation.id,
      'view',
      { source: 'recommendation', currentContent: currentContentId }
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'calculator':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'education':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'specialty':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'calculator':
        return '計算工具';
      case 'education':
        return '衛教文章';
      case 'specialty':
        return '專科';
      default:
        return '內容';
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-blue-600 bg-blue-100';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(limit)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
          <button
            onClick={loadRecommendations}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className={`${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-gray-600">目前沒有推薦內容</p>
          <p className="text-sm text-gray-500 mt-1">
            使用更多工具和閱讀文章來獲得個人化推薦
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          onClick={loadRecommendations}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          title="重新整理推薦"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          重新整理
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((recommendation) => (
          <a
            key={recommendation.id}
            href={recommendation.url}
            onClick={() => handleRecommendationClick(recommendation)}
            className="group block bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200"
          >
            {/* 標題和類型 */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center flex-1 min-w-0">
                <div className="text-blue-600 mr-2 flex-shrink-0">
                  {getTypeIcon(recommendation.type)}
                </div>
                <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                  {recommendation.title}
                </h4>
              </div>
              <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full flex-shrink-0">
                {getTypeLabel(recommendation.type)}
              </span>
            </div>

            {/* 描述 */}
            {recommendation.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {recommendation.description}
              </p>
            )}

            {/* 分類和標籤 */}
            <div className="flex items-center justify-between mb-3">
              {recommendation.category && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {recommendation.category}
                </span>
              )}
              
              {recommendation.tags && recommendation.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {recommendation.tags.slice(0, 2).map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {recommendation.tags.length > 2 && (
                    <span className="text-xs text-gray-400">
                      +{recommendation.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 推薦原因和相關性分數 */}
            <div className="flex items-center justify-between">
              {showReason && (
                <span className="text-xs text-gray-500">
                  {recommendation.reason}
                </span>
              )}
              
              <div className="flex items-center">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${getRelevanceColor(recommendation.relevanceScore)}`}
                  title={`相關性: ${Math.round(recommendation.relevanceScore * 100)}%`}
                >
                  {Math.round(recommendation.relevanceScore * 100)}%
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* 查看更多按鈕 */}
      {recommendations.length >= limit && (
        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.href = '/recommendations'}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            查看更多推薦
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}