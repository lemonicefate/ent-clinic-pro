/**
 * 計算結果展示引擎
 * 
 * 重構現有結果顯示為資料驅動的 CalculatorResults 組件，支援：
 * - 多種結果展示格式
 * - 動態視覺化組件整合
 * - 風險等級指示器
 * - 臨床建議和參考文獻
 * - 結果匯出和分享功能
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { SupportedLocale } from '../../env.d';
import type { CalculationResult } from '../../utils/calculator-engine';
import { ResultCard } from '../visualization/ResultCard';
import { RiskIndicator } from '../visualization/RiskIndicator';
import { CalculatorChart } from '../visualization/CalculatorChart';
import { Dashboard } from '../visualization/Dashboard';

// ============================================================================
// 類型定義
// ============================================================================

export interface ResultDisplayConfig {
  id: string;
  type: 'card' | 'indicator' | 'chart' | 'dashboard' | 'table' | 'text' | 'custom';
  title?: Record<string, string>;
  description?: Record<string, string>;
  
  // 卡片配置
  card?: {
    variant?: 'default' | 'compact' | 'detailed' | 'minimal';
    showIcon?: boolean;
    showTrend?: boolean;
    showComparison?: boolean;
  };
  
  // 指示器配置
  indicator?: {
    type?: 'badge' | 'progress' | 'gauge';
    thresholds?: Array<{
      min: number;
      max: number;
      level: 'low' | 'moderate' | 'high' | 'critical';
      color?: string;
      label?: Record<string, string>;
    }>;
  };
  
  // 圖表配置
  chart?: {
    type?: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar';
    data?: any;
    options?: any;
  };
  
  // 儀表板配置
  dashboard?: {
    layout: Array<{
      id: string;
      type: string;
      x: number;
      y: number;
      w: number;
      h: number;
      config?: any;
    }>;
  };
  
  // 條件顯示
  condition?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in_range';
    value: any;
  };
  
  // 樣式
  className?: string;
  style?: React.CSSProperties;
}

export interface ResultsConfig {
  id: string;
  title?: Record<string, string>;
  description?: Record<string, string>;
  layout?: 'single' | 'grid' | 'tabs' | 'accordion' | 'dashboard';
  displays: ResultDisplayConfig[];
  
  // 功能配置
  features?: {
    export?: boolean;
    share?: boolean;
    print?: boolean;
    save?: boolean;
    compare?: boolean;
  };
  
  // 樣式配置
  theme?: 'default' | 'medical' | 'minimal' | 'dark';
  className?: string;
}

interface CalculatorResultsProps {
  result: CalculationResult;
  config: ResultsConfig;
  locale: SupportedLocale;
  onExport?: (format: 'pdf' | 'png' | 'json') => void;
  onShare?: (platform: 'email' | 'link' | 'print') => void;
  onSave?: (result: CalculationResult) => void;
  className?: string;
}

// ============================================================================
// 輔助函數
// ============================================================================

const evaluateCondition = (
  condition: ResultDisplayConfig['condition'],
  result: CalculationResult
): boolean => {
  if (!condition) return true;
  
  const fieldValue = (result as any)[condition.field];
  const conditionValue = condition.value;
  
  switch (condition.operator) {
    case 'equals':
      return fieldValue === conditionValue;
    case 'not_equals':
      return fieldValue !== conditionValue;
    case 'greater_than':
      return typeof fieldValue === 'number' && typeof conditionValue === 'number' 
        ? fieldValue > conditionValue : false;
    case 'less_than':
      return typeof fieldValue === 'number' && typeof conditionValue === 'number' 
        ? fieldValue < conditionValue : false;
    case 'in_range':
      return typeof fieldValue === 'number' && Array.isArray(conditionValue) && conditionValue.length === 2
        ? fieldValue >= conditionValue[0] && fieldValue <= conditionValue[1] : false;
    default:
      return true;
  }
};

const getLocalizedText = (
  text: Record<string, string> | string | undefined,
  locale: SupportedLocale
): string => {
  if (!text) return '';
  if (typeof text === 'string') return text;
  return text[locale] || text['zh-TW'] || text['en'] || '';
};

const getRiskLevel = (
  value: number,
  thresholds: ResultDisplayConfig['indicator']['thresholds']
): { level: string; color?: string; label?: string } => {
  if (!thresholds) return { level: 'unknown' };
  
  for (const threshold of thresholds) {
    if (value >= threshold.min && value <= threshold.max) {
      return {
        level: threshold.level,
        color: threshold.color,
        label: threshold.label?.['zh-TW'] || threshold.level
      };
    }
  }
  
  return { level: 'unknown' };
};

// ============================================================================
// 結果顯示組件
// ============================================================================

interface ResultDisplayProps {
  display: ResultDisplayConfig;
  result: CalculationResult;
  locale: SupportedLocale;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ display, result, locale }) => {
  const title = getLocalizedText(display.title, locale);
  const description = getLocalizedText(display.description, locale);
  
  // 檢查條件顯示
  if (!evaluateCondition(display.condition, result)) {
    return null;
  }
  
  const renderContent = () => {
    switch (display.type) {
      case 'card':
        return (
          <ResultCard
            title={result.label || title}
            value={result.value}
            unit={result.unit}
            percentage={result.percentage}
            trend={result.trend}
            comparison={result.comparison}
            variant={display.card?.variant || 'default'}
            showIcon={display.card?.showIcon}
            showTrend={display.card?.showTrend}
            showComparison={display.card?.showComparison}
            className={display.className}
          />
        );
        
      case 'indicator':
        const riskInfo = getRiskLevel(
          typeof result.value === 'number' ? result.value : 0,
          display.indicator?.thresholds
        );
        
        return (
          <RiskIndicator
            level={result.riskLevel || riskInfo.level}
            value={result.value}
            label={result.label || title}
            type={display.indicator?.type || 'badge'}
            color={riskInfo.color}
            className={display.className}
          />
        );
        
      case 'chart':
        return (
          <CalculatorChart
            type={display.chart?.type || 'bar'}
            data={display.chart?.data || {
              labels: [result.label || 'Result'],
              datasets: [{
                label: 'Value',
                data: [result.value],
                backgroundColor: '#3B82F6'
              }]
            }}
            options={display.chart?.options}
            className={display.className}
          />
        );
        
      case 'dashboard':
        return (
          <Dashboard
            layout={display.dashboard?.layout || []}
            data={{ result }}
            className={display.className}
          />
        );
        
      case 'table':
        return (
          <div className="result-table">
            <table className="w-full border-collapse border border-medical-neutral-300">
              <tbody>
                <tr>
                  <td className="border border-medical-neutral-300 px-4 py-2 font-medium">
                    {result.label || title}
                  </td>
                  <td className="border border-medical-neutral-300 px-4 py-2">
                    {result.value} {result.unit}
                  </td>
                </tr>
                {result.percentage && (
                  <tr>
                    <td className="border border-medical-neutral-300 px-4 py-2 font-medium">
                      百分比
                    </td>
                    <td className="border border-medical-neutral-300 px-4 py-2">
                      {result.percentage}%
                    </td>
                  </tr>
                )}
                {result.riskLevel && (
                  <tr>
                    <td className="border border-medical-neutral-300 px-4 py-2 font-medium">
                      風險等級
                    </td>
                    <td className="border border-medical-neutral-300 px-4 py-2">
                      {result.riskLevel}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
        
      case 'text':
        return (
          <div className="result-text">
            {title && <h4 className="text-lg font-semibold mb-2">{title}</h4>}
            {description && <p className="text-medical-neutral-600 mb-4">{description}</p>}
            <div className="text-2xl font-bold text-medical-primary-600">
              {result.value} {result.unit}
            </div>
            {result.percentage && (
              <div className="text-lg text-medical-neutral-600 mt-1">
                ({result.percentage}%)
              </div>
            )}
          </div>
        );
        
      default:
        return (
          <div className="result-default">
            <div className="text-xl font-semibold">
              {result.value} {result.unit}
            </div>
          </div>
        );
    }
  };
  
  return (
    <div 
      className={`result-display result-display-${display.type} ${display.className || ''}`}
      style={display.style}
    >
      {renderContent()}
    </div>
  );
};

// ============================================================================
// 主要組件
// ============================================================================

export const CalculatorResults: React.FC<CalculatorResultsProps> = ({
  result,
  config,
  locale,
  onExport,
  onShare,
  onSave,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // 過濾可見的顯示組件
  const visibleDisplays = useMemo(() => {
    return config.displays.filter(display => 
      evaluateCondition(display.condition, result)
    );
  }, [config.displays, result]);
  
  // 處理匯出
  const handleExport = useCallback((format: 'pdf' | 'png' | 'json') => {
    if (onExport) {
      onExport(format);
    } else {
      // 預設匯出邏輯
      const data = {
        result,
        timestamp: new Date().toISOString(),
        config: config.id
      };
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `calculation-result-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  }, [result, config.id, onExport]);
  
  // 處理分享
  const handleShare = useCallback((platform: 'email' | 'link' | 'print') => {
    if (onShare) {
      onShare(platform);
    } else {
      // 預設分享邏輯
      switch (platform) {
        case 'print':
          window.print();
          break;
        case 'link':
          if (navigator.share) {
            navigator.share({
              title: '計算結果',
              text: `計算結果: ${result.value} ${result.unit}`,
              url: window.location.href
            });
          }
          break;
        case 'email':
          const subject = encodeURIComponent('計算結果');
          const body = encodeURIComponent(`計算結果: ${result.value} ${result.unit}`);
          window.open(`mailto:?subject=${subject}&body=${body}`);
          break;
      }
    }
  }, [result, onShare]);
  
  // 處理保存
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(result);
    } else {
      // 預設保存到 localStorage
      const savedResults = JSON.parse(localStorage.getItem('calculatorResults') || '[]');
      savedResults.push({
        ...result,
        timestamp: new Date().toISOString(),
        configId: config.id
      });
      localStorage.setItem('calculatorResults', JSON.stringify(savedResults));
    }
  }, [result, config.id, onSave]);
  
  // 切換手風琴區段
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);
  
  // 渲染功能按鈕
  const renderActionButtons = () => {
    if (!config.features) return null;
    
    return (
      <div className="result-actions">
        {config.features.export && (
          <div className="result-action-group">
            <button
              onClick={() => handleExport('json')}
              className="result-action-button"
              title="匯出 JSON"
            >
              📄 JSON
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="result-action-button"
              title="匯出 PDF"
            >
              📑 PDF
            </button>
            <button
              onClick={() => handleExport('png')}
              className="result-action-button"
              title="匯出圖片"
            >
              🖼️ PNG
            </button>
          </div>
        )}
        
        {config.features.share && (
          <div className="result-action-group">
            <button
              onClick={() => handleShare('link')}
              className="result-action-button"
              title="分享連結"
            >
              🔗 分享
            </button>
            <button
              onClick={() => handleShare('email')}
              className="result-action-button"
              title="電子郵件"
            >
              📧 郵件
            </button>
            <button
              onClick={() => handleShare('print')}
              className="result-action-button"
              title="列印"
            >
              🖨️ 列印
            </button>
          </div>
        )}
        
        {config.features.save && (
          <button
            onClick={handleSave}
            className="result-action-button"
            title="保存結果"
          >
            💾 保存
          </button>
        )}
      </div>
    );
  };
  
  // 渲染內容
  const renderContent = () => {
    switch (config.layout) {
      case 'grid':
        return (
          <div className="results-grid">
            {visibleDisplays.map((display, index) => (
              <ResultDisplay
                key={display.id || index}
                display={display}
                result={result}
                locale={locale}
              />
            ))}
          </div>
        );
        
      case 'tabs':
        return (
          <div className="results-tabs">
            <div className="results-tab-list">
              {visibleDisplays.map((display, index) => (
                <button
                  key={display.id || index}
                  onClick={() => setActiveTab(index)}
                  className={`results-tab ${activeTab === index ? 'active' : ''}`}
                >
                  {getLocalizedText(display.title, locale) || `結果 ${index + 1}`}
                </button>
              ))}
            </div>
            <div className="results-tab-content">
              {visibleDisplays[activeTab] && (
                <ResultDisplay
                  display={visibleDisplays[activeTab]}
                  result={result}
                  locale={locale}
                />
              )}
            </div>
          </div>
        );
        
      case 'accordion':
        return (
          <div className="results-accordion">
            {visibleDisplays.map((display, index) => {
              const sectionId = display.id || `section-${index}`;
              const isExpanded = expandedSections[sectionId] !== false; // 預設展開
              const title = getLocalizedText(display.title, locale) || `結果 ${index + 1}`;
              
              return (
                <div key={sectionId} className="results-accordion-section">
                  <button
                    onClick={() => toggleSection(sectionId)}
                    className="results-accordion-toggle"
                    aria-expanded={isExpanded}
                  >
                    <span>{title}</span>
                    <span className={`accordion-icon ${isExpanded ? 'expanded' : ''}`}>
                      ▼
                    </span>
                  </button>
                  <div className={`results-accordion-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
                    <ResultDisplay
                      display={display}
                      result={result}
                      locale={locale}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        );
        
      case 'dashboard':
        // 使用第一個 dashboard 配置
        const dashboardDisplay = visibleDisplays.find(d => d.type === 'dashboard');
        if (dashboardDisplay) {
          return (
            <ResultDisplay
              display={dashboardDisplay}
              result={result}
              locale={locale}
            />
          );
        }
        // 如果沒有 dashboard 配置，回退到 grid 佈局
        return (
          <div className="results-grid">
            {visibleDisplays.map((display, index) => (
              <ResultDisplay
                key={display.id || index}
                display={display}
                result={result}
                locale={locale}
              />
            ))}
          </div>
        );
        
      default: // single
        return (
          <div className="results-single">
            {visibleDisplays.map((display, index) => (
              <ResultDisplay
                key={display.id || index}
                display={display}
                result={result}
                locale={locale}
              />
            ))}
          </div>
        );
    }
  };
  
  const title = getLocalizedText(config.title, locale);
  const description = getLocalizedText(config.description, locale);
  
  return (
    <div className={`calculator-results calculator-results-${config.layout || 'single'} calculator-results-${config.theme || 'default'} ${className}`}>
      {title && (
        <h3 className="calculator-results-title">{title}</h3>
      )}
      
      {description && (
        <p className="calculator-results-description">{description}</p>
      )}
      
      {renderActionButtons()}
      
      <div className="calculator-results-content">
        {renderContent()}
      </div>
      
      {/* 結果解釋 */}
      {result.interpretation && (
        <div className="result-interpretation">
          <h4 className="result-interpretation-title">結果解釋</h4>
          <p className="result-interpretation-content">
            {getLocalizedText(result.interpretation, locale)}
          </p>
        </div>
      )}
      
      {/* 臨床建議 */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div className="result-recommendations">
          <h4 className="result-recommendations-title">臨床建議</h4>
          <ul className="result-recommendations-list">
            {result.recommendations.map((rec, index) => (
              <li key={index} className="result-recommendations-item">
                {getLocalizedText(rec, locale)}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* 參考文獻 */}
      {result.references && result.references.length > 0 && (
        <div className="result-references">
          <h4 className="result-references-title">參考文獻</h4>
          <ol className="result-references-list">
            {result.references.map((ref, index) => (
              <li key={index} className="result-references-item">
                {ref}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default CalculatorResults;