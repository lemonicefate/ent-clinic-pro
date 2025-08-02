/**
 * RiskIndicator 組件
 * 
 * 用於顯示醫療風險等級的指示器組件，支援多種視覺樣式和動畫效果。
 * 提供 badge、progress、gauge 三種展示模式，具備完整的無障礙支援。
 */

import React, { forwardRef, useMemo } from 'react';
import type { 
  RiskLevel, 
  SupportedLocale, 
  LocalizedString,
  RiskThreshold 
} from '../../types/calculator';

// 風險指示器樣式類型
export type RiskIndicatorStyle = 'badge' | 'progress' | 'gauge' | 'traffic-light';

// 動畫類型
export type AnimationType = 'none' | 'pulse' | 'bounce' | 'fade-in' | 'scale';

// 尺寸類型
export type IndicatorSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// RiskIndicator 屬性介面
export interface RiskIndicatorProps {
  /** 當前風險等級 */
  riskLevel: RiskLevel;
  /** 風險數值（0-100） */
  riskValue?: number;
  /** 指示器樣式 */
  style?: RiskIndicatorStyle;
  /** 指示器尺寸 */
  size?: IndicatorSize;
  /** 是否顯示標籤 */
  showLabel?: boolean;
  /** 是否顯示數值 */
  showValue?: boolean;
  /** 自定義風險閾值配置 */
  thresholds?: RiskThreshold[];
  /** 動畫類型 */
  animation?: AnimationType;
  /** 動畫持續時間（毫秒） */
  animationDuration?: number;
  /** 語言設定 */
  locale?: SupportedLocale;
  /** 自定義 CSS 類名 */
  className?: string;
  /** 自定義樣式 */
  customStyle?: React.CSSProperties;
  /** 無障礙標籤 */
  'aria-label'?: string;
  /** 無障礙描述 */
  'aria-describedby'?: string;
  /** 點擊事件處理器 */
  onClick?: () => void;
  /** 是否可互動 */
  interactive?: boolean;
}

// 預設風險閾值配置
const defaultThresholds: RiskThreshold[] = [
  {
    min: 0,
    max: 25,
    level: 'low',
    color: '#22c55e',
    label: { 'zh-TW': '低風險', 'en': 'Low Risk' }
  },
  {
    min: 25,
    max: 50,
    level: 'moderate',
    color: '#f59e0b',
    label: { 'zh-TW': '中等風險', 'en': 'Moderate Risk' }
  },
  {
    min: 50,
    max: 75,
    level: 'high',
    color: '#ef4444',
    label: { 'zh-TW': '高風險', 'en': 'High Risk' }
  },
  {
    min: 75,
    max: 100,
    level: 'critical',
    color: '#dc2626',
    label: { 'zh-TW': '極高風險', 'en': 'Critical Risk' }
  }
];

// 尺寸樣式映射
const sizeStyles: Record<IndicatorSize, {
  badge: string;
  progress: string;
  gauge: string;
  text: string;
}> = {
  xs: {
    badge: 'px-1.5 py-0.5 text-xs',
    progress: 'h-1',
    gauge: 'w-8 h-8',
    text: 'text-xs'
  },
  sm: {
    badge: 'px-2 py-1 text-sm',
    progress: 'h-2',
    gauge: 'w-12 h-12',
    text: 'text-sm'
  },
  md: {
    badge: 'px-3 py-1.5 text-base',
    progress: 'h-3',
    gauge: 'w-16 h-16',
    text: 'text-base'
  },
  lg: {
    badge: 'px-4 py-2 text-lg',
    progress: 'h-4',
    gauge: 'w-20 h-20',
    text: 'text-lg'
  },
  xl: {
    badge: 'px-6 py-3 text-xl',
    progress: 'h-6',
    gauge: 'w-24 h-24',
    text: 'text-xl'
  }
};

// 動畫樣式映射
const animationStyles: Record<AnimationType, string> = {
  none: '',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  'fade-in': 'animate-fade-in',
  scale: 'animate-scale-in'
};

// 工具函式：獲取本地化文字
function getLocalizedText(
  text: string | LocalizedString, 
  locale: SupportedLocale = 'zh-TW'
): string {
  if (typeof text === 'string') {
    return text;
  }
  return text[locale] || text['zh-TW'] || '';
}

// 工具函式：根據風險等級獲取閾值配置
function getThresholdByRiskLevel(
  riskLevel: RiskLevel, 
  thresholds: RiskThreshold[]
): RiskThreshold | undefined {
  return thresholds.find(threshold => threshold.level === riskLevel);
}

// 工具函式：根據數值獲取風險等級
function getRiskLevelByValue(
  value: number, 
  thresholds: RiskThreshold[]
): RiskLevel {
  const threshold = thresholds.find(t => value >= t.min && value < t.max);
  return threshold?.level || 'low';
}

// Badge 樣式組件
const BadgeIndicator: React.FC<{
  threshold: RiskThreshold;
  size: IndicatorSize;
  showLabel: boolean;
  showValue: boolean;
  riskValue?: number;
  locale: SupportedLocale;
  animation: string;
  interactive: boolean;
}> = ({ 
  threshold, 
  size, 
  showLabel, 
  showValue, 
  riskValue, 
  locale, 
  animation,
  interactive 
}) => {
  const badgeClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'rounded-full',
    'border',
    sizeStyles[size].badge,
    animation,
    interactive ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
  ].filter(Boolean).join(' ');

  const badgeStyle = {
    backgroundColor: `${threshold.color}20`,
    borderColor: threshold.color,
    color: threshold.color
  };

  return (
    <span className={badgeClasses} style={badgeStyle}>
      {showValue && riskValue !== undefined && (
        <span className="mr-1">{Math.round(riskValue)}%</span>
      )}
      {showLabel && getLocalizedText(threshold.label, locale)}
    </span>
  );
};

// Progress 樣式組件
const ProgressIndicator: React.FC<{
  threshold: RiskThreshold;
  size: IndicatorSize;
  showLabel: boolean;
  showValue: boolean;
  riskValue?: number;
  locale: SupportedLocale;
  animation: string;
  thresholds: RiskThreshold[];
}> = ({ 
  threshold, 
  size, 
  showLabel, 
  showValue, 
  riskValue, 
  locale, 
  animation,
  thresholds 
}) => {
  const progressValue = riskValue || threshold.min + (threshold.max - threshold.min) / 2;
  
  return (
    <div className="w-full">
      {(showLabel || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {showLabel && (
            <span className={`font-medium ${sizeStyles[size].text}`}>
              {getLocalizedText(threshold.label, locale)}
            </span>
          )}
          {showValue && (
            <span className={`${sizeStyles[size].text} text-gray-600`}>
              {Math.round(progressValue)}%
            </span>
          )}
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full ${sizeStyles[size].progress}`}>
        <div
          className={`${sizeStyles[size].progress} rounded-full transition-all duration-500 ${animation}`}
          style={{
            width: `${progressValue}%`,
            backgroundColor: threshold.color
          }}
        />
      </div>
      
      {/* 風險區間指示 */}
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        {thresholds.map((t, index) => (
          <span key={index} style={{ color: t.color }}>
            {t.min}%
          </span>
        ))}
        <span>100%</span>
      </div>
    </div>
  );
};

// Gauge 樣式組件
const GaugeIndicator: React.FC<{
  threshold: RiskThreshold;
  size: IndicatorSize;
  showLabel: boolean;
  showValue: boolean;
  riskValue?: number;
  locale: SupportedLocale;
  animation: string;
  thresholds: RiskThreshold[];
}> = ({ 
  threshold, 
  size, 
  showLabel, 
  showValue, 
  riskValue, 
  locale, 
  animation,
  thresholds 
}) => {
  const progressValue = riskValue || threshold.min + (threshold.max - threshold.min) / 2;
  const strokeWidth = size === 'xs' || size === 'sm' ? 4 : 6;
  const radius = 45 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progressValue / 100) * circumference;

  return (
    <div className={`relative ${sizeStyles[size].gauge} ${animation}`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* 背景圓環 */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* 風險區間背景 */}
        {thresholds.map((t, index) => {
          const startAngle = (t.min / 100) * 360;
          const endAngle = (t.max / 100) * 360;
          const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
          
          const startX = 50 + radius * Math.cos((startAngle - 90) * Math.PI / 180);
          const startY = 50 + radius * Math.sin((startAngle - 90) * Math.PI / 180);
          const endX = 50 + radius * Math.cos((endAngle - 90) * Math.PI / 180);
          const endY = 50 + radius * Math.sin((endAngle - 90) * Math.PI / 180);
          
          return (
            <path
              key={index}
              d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`}
              stroke={`${t.color}40`}
              strokeWidth={strokeWidth}
              fill="none"
            />
          );
        })}
        
        {/* 進度指示 */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={threshold.color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* 中心文字 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <span className={`font-bold ${sizeStyles[size].text}`} style={{ color: threshold.color }}>
            {Math.round(progressValue)}%
          </span>
        )}
        {showLabel && (
          <span className={`${sizeStyles[size === 'xs' ? 'xs' : 'sm'].text} text-gray-600 text-center leading-tight`}>
            {getLocalizedText(threshold.label, locale)}
          </span>
        )}
      </div>
    </div>
  );
};

// Traffic Light 樣式組件
const TrafficLightIndicator: React.FC<{
  threshold: RiskThreshold;
  size: IndicatorSize;
  showLabel: boolean;
  riskLevel: RiskLevel;
  locale: SupportedLocale;
  animation: string;
  thresholds: RiskThreshold[];
}> = ({ 
  threshold, 
  size, 
  showLabel, 
  riskLevel, 
  locale, 
  animation,
  thresholds 
}) => {
  const lightSize = size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  
  return (
    <div className={`flex items-center space-x-2 ${animation}`}>
      <div className="flex flex-col space-y-1 p-2 bg-gray-800 rounded-lg">
        {thresholds.slice().reverse().map((t) => (
          <div
            key={t.level}
            className={`${lightSize} rounded-full border-2 border-gray-600 transition-all duration-300`}
            style={{
              backgroundColor: t.level === riskLevel ? t.color : '#374151',
              boxShadow: t.level === riskLevel ? `0 0 8px ${t.color}` : 'none'
            }}
          />
        ))}
      </div>
      
      {showLabel && (
        <span className={`font-medium ${sizeStyles[size].text}`} style={{ color: threshold.color }}>
          {getLocalizedText(threshold.label, locale)}
        </span>
      )}
    </div>
  );
};

// 主要 RiskIndicator 組件
export const RiskIndicator = forwardRef<HTMLDivElement, RiskIndicatorProps>(({
  riskLevel,
  riskValue,
  style = 'badge',
  size = 'md',
  showLabel = true,
  showValue = false,
  thresholds = defaultThresholds,
  animation = 'none',
  animationDuration = 300,
  locale = 'zh-TW',
  className = '',
  customStyle,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  onClick,
  interactive = false,
  ...props
}, ref) => {
  // 計算當前風險閾值
  const currentThreshold = useMemo(() => {
    if (riskValue !== undefined) {
      const calculatedRiskLevel = getRiskLevelByValue(riskValue, thresholds);
      return getThresholdByRiskLevel(calculatedRiskLevel, thresholds);
    }
    return getThresholdByRiskLevel(riskLevel, thresholds);
  }, [riskLevel, riskValue, thresholds]);

  if (!currentThreshold) {
    console.warn(`No threshold found for risk level: ${riskLevel}`);
    return null;
  }

  // 動畫樣式
  const animationClass = animationStyles[animation];
  
  // 容器樣式
  const containerClasses = [
    'risk-indicator',
    className,
    interactive || onClick ? 'cursor-pointer' : '',
    animationClass
  ].filter(Boolean).join(' ');

  // 無障礙屬性
  const accessibilityProps = {
    'aria-label': ariaLabel || `風險等級: ${getLocalizedText(currentThreshold.label, locale)}${riskValue ? `, 風險值: ${Math.round(riskValue)}%` : ''}`,
    'aria-describedby': ariaDescribedBy,
    role: onClick ? 'button' : undefined,
    tabIndex: onClick ? 0 : undefined,
  };

  // 鍵盤事件處理
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  // 渲染對應樣式的指示器
  const renderIndicator = () => {
    const commonProps = {
      threshold: currentThreshold,
      size,
      showLabel,
      showValue,
      riskValue,
      locale,
      animation: animationClass,
      interactive: interactive || !!onClick
    };

    switch (style) {
      case 'badge':
        return <BadgeIndicator {...commonProps} />;
      
      case 'progress':
        return <ProgressIndicator {...commonProps} thresholds={thresholds} />;
      
      case 'gauge':
        return <GaugeIndicator {...commonProps} thresholds={thresholds} />;
      
      case 'traffic-light':
        return (
          <TrafficLightIndicator 
            {...commonProps} 
            riskLevel={riskLevel}
            thresholds={thresholds}
          />
        );
      
      default:
        return <BadgeIndicator {...commonProps} />;
    }
  };

  return (
    <div
      ref={ref}
      className={containerClasses}
      style={{
        ...customStyle,
        animationDuration: `${animationDuration}ms`
      }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      {...accessibilityProps}
      {...props}
    >
      {renderIndicator()}
    </div>
  );
});

RiskIndicator.displayName = 'RiskIndicator';

export default RiskIndicator;