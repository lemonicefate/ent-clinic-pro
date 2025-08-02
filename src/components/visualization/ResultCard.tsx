/**
 * ResultCard 組件
 * 
 * 用於顯示醫療計算結果的卡片組件，支援多種數值格式、風險等級指示和無障礙功能。
 * 基於 React Aria 設計模式，確保完整的鍵盤導航和螢幕閱讀器支援。
 */

import React, { forwardRef } from 'react';
import type { 
  SupportedLocale, 
  RiskLevel, 
  LocalizedString,
  CalculationResult 
} from '../../types/calculator';

// 數值格式類型
export type ValueFormat = 'number' | 'percentage' | 'currency' | 'custom';

// 顏色方案類型
export type ColorScheme = 'default' | 'risk-based' | 'custom';

// 卡片尺寸
export type CardSize = 'sm' | 'md' | 'lg';

// ResultCard 屬性介面
export interface ResultCardProps {
  /** 主要數值 */
  value: number;
  /** 數值單位 */
  unit?: string;
  /** 卡片標題 */
  label: string | LocalizedString;
  /** 副標題 */
  subtitle?: string | LocalizedString;
  /** 風險等級 */
  riskLevel?: RiskLevel;
  /** 圖示名稱或 React 元素 */
  icon?: string | React.ReactNode;
  /** 數值格式 */
  format?: ValueFormat;
  /** 小數位數 */
  precision?: number;
  /** 是否顯示單位 */
  showUnit?: boolean;
  /** 顏色方案 */
  colorScheme?: ColorScheme;
  /** 卡片尺寸 */
  size?: CardSize;
  /** 是否可點擊 */
  clickable?: boolean;
  /** 點擊事件處理器 */
  onClick?: () => void;
  /** 自定義 CSS 類名 */
  className?: string;
  /** 自定義樣式 */
  style?: React.CSSProperties;
  /** 語言設定 */
  locale?: SupportedLocale;
  /** 無障礙標籤 */
  'aria-label'?: string;
  /** 無障礙描述 */
  'aria-describedby'?: string;
  /** 是否為載入狀態 */
  loading?: boolean;
  /** 載入文字 */
  loadingText?: string;
  /** 錯誤狀態 */
  error?: boolean;
  /** 錯誤訊息 */
  errorMessage?: string;
  /** 額外的計算結果資料 */
  result?: CalculationResult;
}

// 風險等級顏色映射
const riskColors: Record<RiskLevel, string> = {
  low: 'text-medical-success-700 bg-medical-success-50 border-medical-success-200',
  moderate: 'text-medical-warning-700 bg-medical-warning-50 border-medical-warning-200',
  high: 'text-medical-error-700 bg-medical-error-50 border-medical-error-200',
  critical: 'text-red-800 bg-red-100 border-red-300'
};

// 尺寸樣式映射
const sizeStyles: Record<CardSize, string> = {
  sm: 'p-3 text-sm',
  md: 'p-4 text-base',
  lg: 'p-6 text-lg'
};

// 數值格式化函式
function formatValue(value: number, format: ValueFormat, precision: number = 2): string {
  switch (format) {
    case 'percentage':
      return `${(value * 100).toFixed(precision)}%`;
    case 'currency':
      return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
      }).format(value);
    case 'number':
      return value.toFixed(precision);
    case 'custom':
      return value.toString();
    default:
      return value.toFixed(precision);
  }
}

// 本地化文字獲取函式
function getLocalizedText(
  text: string | LocalizedString, 
  locale: SupportedLocale = 'zh-TW'
): string {
  if (typeof text === 'string') {
    return text;
  }
  return text[locale] || text['zh-TW'] || '';
}

// 圖示組件
const IconComponent: React.FC<{ icon: string | React.ReactNode; size: CardSize }> = ({ 
  icon, 
  size 
}) => {
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  if (React.isValidElement(icon)) {
    return <span className={iconSizes[size]}>{icon}</span>;
  }

  if (typeof icon === 'string') {
    // 這裡可以根據圖示名稱返回對應的 SVG 或圖示字體
    return (
      <span 
        className={`inline-block ${iconSizes[size]}`}
        aria-hidden="true"
      >
        {/* 預設圖示 - 可以替換為實際的圖示系統 */}
        <svg 
          viewBox="0 0 24 24" 
          fill="currentColor"
          className="w-full h-full"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </span>
    );
  }

  return null;
};

// 載入指示器組件
const LoadingSpinner: React.FC<{ size: CardSize }> = ({ size }) => {
  const spinnerSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className={`animate-spin ${spinnerSizes[size]}`} aria-hidden="true">
      <svg 
        className="w-full h-full text-medical-primary-600" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

// 主要 ResultCard 組件
export const ResultCard = forwardRef<HTMLDivElement, ResultCardProps>(({
  value,
  unit,
  label,
  subtitle,
  riskLevel,
  icon,
  format = 'number',
  precision = 2,
  showUnit = true,
  colorScheme = 'default',
  size = 'md',
  clickable = false,
  onClick,
  className = '',
  style,
  locale = 'zh-TW',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  loading = false,
  loadingText = '載入中...',
  error = false,
  errorMessage = '載入失敗',
  result,
  ...props
}, ref) => {
  // 格式化數值
  const formattedValue = loading ? '' : formatValue(value, format, precision);
  
  // 獲取本地化文字
  const localizedLabel = getLocalizedText(label, locale);
  const localizedSubtitle = subtitle ? getLocalizedText(subtitle, locale) : '';

  // 構建基礎樣式類名
  const baseClasses = [
    'result-card',
    'bg-white',
    'border',
    'border-medical-neutral-200',
    'rounded-lg',
    'shadow-sm',
    'transition-all',
    'duration-200',
    sizeStyles[size]
  ];

  // 根據顏色方案添加樣式
  if (colorScheme === 'risk-based' && riskLevel) {
    baseClasses.push(riskColors[riskLevel]);
  } else if (colorScheme === 'default') {
    baseClasses.push('hover:shadow-md');
  }

  // 可點擊樣式
  if (clickable) {
    baseClasses.push(
      'cursor-pointer',
      'hover:shadow-md',
      'hover:scale-[1.02]',
      'active:scale-[0.98]',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-medical-primary-500',
      'focus:ring-offset-2'
    );
  }

  // 錯誤狀態樣式
  if (error) {
    baseClasses.push('border-medical-error-300', 'bg-medical-error-50');
  }

  // 載入狀態樣式
  if (loading) {
    baseClasses.push('opacity-75');
  }

  const cardClasses = [...baseClasses, className].join(' ');

  // 構建無障礙屬性
  const accessibilityProps: React.HTMLAttributes<HTMLDivElement> = {
    'aria-label': ariaLabel || `${localizedLabel}: ${formattedValue} ${showUnit && unit ? unit : ''}`,
    'aria-describedby': ariaDescribedBy,
    role: clickable ? 'button' : undefined,
    tabIndex: clickable ? 0 : undefined,
  };

  // 鍵盤事件處理
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (clickable && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick?.();
    }
  };

  // 點擊事件處理
  const handleClick = () => {
    if (clickable && !loading && !error) {
      onClick?.();
    }
  };

  return (
    <div
      ref={ref}
      className={cardClasses}
      style={style}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...accessibilityProps}
      {...props}
    >
      {/* 卡片標題區域 */}
      <div className="result-card-header flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon && <IconComponent icon={icon} size={size} />}
          <h3 className="result-card-title font-semibold text-medical-neutral-900 truncate">
            {localizedLabel}
          </h3>
        </div>
        {riskLevel && colorScheme === 'risk-based' && (
          <span 
            className={`px-2 py-1 text-xs font-medium rounded-full ${riskColors[riskLevel]}`}
            aria-label={`風險等級: ${riskLevel}`}
          >
            {riskLevel.toUpperCase()}
          </span>
        )}
      </div>

      {/* 卡片內容區域 */}
      <div className="result-card-body">
        {loading ? (
          <div className="flex items-center space-x-2">
            <LoadingSpinner size={size} />
            <span className="text-medical-neutral-600">{loadingText}</span>
          </div>
        ) : error ? (
          <div className="text-medical-error-600">
            <span className="font-medium">錯誤</span>
            {errorMessage && (
              <p className="text-sm mt-1">{errorMessage}</p>
            )}
          </div>
        ) : (
          <>
            {/* 主要數值顯示 */}
            <div className="result-value mb-2">
              <span className="value-number text-2xl font-bold text-medical-neutral-900">
                {formattedValue}
              </span>
              {showUnit && unit && (
                <span className="value-unit text-lg text-medical-neutral-600 ml-1">
                  {unit}
                </span>
              )}
            </div>

            {/* 副標題 */}
            {localizedSubtitle && (
              <p className="result-subtitle text-sm text-medical-neutral-600 mb-2">
                {localizedSubtitle}
              </p>
            )}

            {/* 額外的結果資訊 */}
            {result?.secondaryValues && result.secondaryValues.length > 0 && (
              <div className="secondary-values space-y-1">
                {result.secondaryValues.map((secondary, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-medical-neutral-600">
                      {getLocalizedText(secondary.label, locale)}:
                    </span>
                    <span className="font-medium text-medical-neutral-900">
                      {formatValue(secondary.value, format, precision)}
                      {secondary.unit && ` ${secondary.unit}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 互動提示 */}
      {clickable && !loading && !error && (
        <div className="result-card-footer mt-2 pt-2 border-t border-medical-neutral-100">
          <span className="text-xs text-medical-neutral-500">
            點擊查看詳情
          </span>
        </div>
      )}
    </div>
  );
});

ResultCard.displayName = 'ResultCard';

export default ResultCard;