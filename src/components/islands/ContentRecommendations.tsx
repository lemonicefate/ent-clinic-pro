/**
 * Content Recommendations Widget
 * Displays personalized content recommendations based on user behavior and preferences
 */

import React, { useState, useEffect } from 'react';
import { 
  getRecommendationEngine, 
  getSearchEngine,
  type RecommendationResult,
  type SearchItem 
} from '../../utils/advanced-search';

interface ContentRecommendationsProps {
  currentItemId?: string;
  title?: string;
  limit?: number;
  showReason?: boolean;
  className?: string;
  onItemClick?: (item: SearchItem) => void;
}

export default function ContentRecommendations({
  currentItemId,
  title = "推薦內容",
  limit = 5,
  showReason = true,
  className = "",
  onItemClick,
}: ContentRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recommendationEngine = getRecommendationEngine();
  const searchEngine = getSearchEngine();

  useEffect(() => {
    loadRecommendations();
  }, [currentItemId, limit]);

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      let recs: RecommendationResult[];

      if (currentItemId) {
        // Get related content for specific item
        recs = recommendationEngine.getRelatedContent(currentItemId, limit);
      } else {
        // Get personalized recommendations
        recs = recommendationEngine.getPersonalizedRecommendations({}, limit);
      }

      setRecommendations(recs);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
      setError('無法載入推薦內容');
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: SearchItem) => {
    // Record interaction
    searchEngine.recordInteraction(item.id, 'click');

    if (onItemClick) {
      onItemClick(item);
    } else {
      window.location.href = item.url;
    }
  };

  const getReasonText = (reason: RecommendationResult['reason']): string => {
    switch (reason) {
      case 'similar_content':
        return '相似內容';
      case 'same_category':
        return '同類別';
      case 'user_behavior':
        return '基於使用習慣';
      case 'trending':
        return '熱門內容';
      default:
        return '推薦';
    }
  };

  const getReasonIcon = (reason: RecommendationResult['reason']) => {
    switch (reason) {
      case 'similar_content':
        return (
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'same_category':
        return (
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'user_behavior':
        return (
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
        );
      case 'trending':
        return (
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
    }
  };

  const getTypeIcon = (type: SearchItem['type']) => {
    switch (type) {
      case 'calculator':
        return (
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4-4a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 8a1 1 0 000 2h.01a1 1 0 000-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'education':
        return (
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        );
      case 'procedure':
        return (
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15.586 13H14a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'medication':
        return (
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414L9.586 12l-2.293 2.293a1 1 0 101.414 1.414L10 13.414l2.293 2.293a1 1 0 001.414-1.414L11.414 12l2.293-2.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className={`content-recommendations ${className}`}>
        <div className="recommendations-header">
          <h3 className="recommendations-title">{title}</h3>
        </div>
        <div className="recommendations-loading">
          <div className="loading-skeleton">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="skeleton-item">
                <div className="skeleton-icon"></div>
                <div className="skeleton-content">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-description"></div>
                  <div className="skeleton-meta"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`content-recommendations ${className}`}>
        <div className="recommendations-header">
          <h3 className="recommendations-title">{title}</h3>
        </div>
        <div className="recommendations-error">
          <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="error-message">{error}</p>
          <button 
            onClick={loadRecommendations}
            className="error-retry"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className={`content-recommendations ${className}`}>
        <div className="recommendations-header">
          <h3 className="recommendations-title">{title}</h3>
        </div>
        <div className="recommendations-empty">
          <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="empty-message">目前沒有推薦內容</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`content-recommendations ${className}`}>
      <div className="recommendations-header">
        <h3 className="recommendations-title">{title}</h3>
        <button 
          onClick={loadRecommendations}
          className="recommendations-refresh"
          title="重新載入推薦"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="recommendations-list">
        {recommendations.map((recommendation, index) => (
          <div
            key={`${recommendation.item.id}-${index}`}
            className="recommendation-item"
            onClick={() => handleItemClick(recommendation.item)}
          >
            <div className="recommendation-icon">
              {getTypeIcon(recommendation.item.type)}
            </div>
            
            <div className="recommendation-content">
              <div className="recommendation-header">
                <h4 className="recommendation-title">{recommendation.item.title}</h4>
                {showReason && (
                  <div className="recommendation-reason">
                    <span className="reason-icon">
                      {getReasonIcon(recommendation.reason)}
                    </span>
                    <span className="reason-text">
                      {getReasonText(recommendation.reason)}
                    </span>
                  </div>
                )}
              </div>
              
              <p className="recommendation-description">
                {recommendation.item.content.length > 100
                  ? `${recommendation.item.content.substring(0, 100)}...`
                  : recommendation.item.content
                }
              </p>
              
              <div className="recommendation-meta">
                <span className="recommendation-category">
                  {recommendation.item.category}
                </span>
                <span className="recommendation-score">
                  相關度 {Math.round(recommendation.score * 100)}%
                </span>
                {recommendation.item.tags.length > 0 && (
                  <div className="recommendation-tags">
                    {recommendation.item.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="recommendation-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="recommendations-footer">
        <button 
          onClick={loadRecommendations}
          className="recommendations-more"
        >
          載入更多推薦
        </button>
      </div>
    </div>
  );
}