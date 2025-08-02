/**
 * Dashboard 組件
 * 
 * 用於醫療計算機結果展示的儀表板佈局組件。支援 CSS Grid 響應式佈局、
 * 組件位置配置、資料傳遞和 JSON 驅動的佈局系統。
 */

import React, { useMemo } from 'react';
import { ResultCard } from './ResultCard';
import { RiskIndicator } from './RiskIndicator';
import { CalculatorChart } from './CalculatorChart';
import type { 
  LocalizedString,
  CalculationResult
} from '../../types/calculator';
import type { ChartData } from 'chart.js';

// 組件類型定義
export type DashboardComponentType = 
  | 'result-card' 
  | 'risk-indicator' 
  | 'chart' 
  | 'text' 
  | 'divider'
  | 'custom';

// 佈局模式
export type LayoutMode = 'grid' | 'flex' | 'masonry';

// 響應式斷點
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// 組件位置配置
export interface ComponentPosition {
  /** 網格行位置 */
  row: number;
  /** 網格列位置 */
  col: number;
  /** 行跨度 */
  rowSpan?: number;
  /** 列跨度 */
  colSpan?: number;
  /** 響應式位置配置 */
  responsive?: Partial<Record<Breakpoint, Omit<ComponentPosition, 'responsive'>>>;
}

// 基礎組件配置
export interface BaseComponentConfig {
  /** 組件 ID */
  id: string;
  /** 組件類型 */
  type: DashboardComponentType;
  /** 組件標題 */
  title?: string | LocalizedString;
  /** 組件位置 */
  position: ComponentPosition;
  /** 是否可見 */
  visible?: boolean;
  /** 條件顯示 */
  condition?: (result: CalculationResult) => boolean;
  /** 自定義 CSS 類名 */
  className?: string;  /** 自
定義樣式 */
  style?: React.CSSProperties;
  /** 動畫配置 */
  animation?: {
    type: 'fade' | 'slide' | 'scale';
    duration?: number;
    delay?: number;
  };
}

// 結果卡片配置
export interface ResultCardConfig extends BaseComponentConfig {
  type: 'result-card';
  /** 數值鍵名 */
  valueKey: string;
  /** 格式化類型 */
  format?: 'number' | 'percentage' | 'currency' | 'custom';
  /** 小數位數 */
  precision?: number;
  /** 是否顯示單位 */
  showUnit?: boolean;
  /** 顏色方案 */
  colorScheme?: 'default' | 'risk-based' | 'custom';
  /** 圖示 */
  icon?: string;
  /** 副標題 */
  subtitle?: string | LocalizedString;
}

// 風險指示器配置
export interface RiskIndicatorConfig extends BaseComponentConfig {
  type: 'risk-indicator';
  /** 風險鍵名 */
  riskKey: string;
  /** 樣式 */
  style?: 'badge' | 'progress' | 'gauge' | 'traffic-light';
  /** 閾值配置 */
  thresholds?: Array<{
    min: number;
    max: number;
    level: 'low' | 'moderate' | 'high' | 'critical';
    color: string;
    label: LocalizedString;
  }>;
}

// 圖表配置
export interface ChartConfig extends BaseComponentConfig {
  type: 'chart';
  /** 圖表類型 */
  chartType: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'scatter';
  /** 資料鍵名 */
  dataKey: string;
  /** Chart.js 選項 */
  options?: any;
  /** 響應式 */
  responsive?: boolean;
  /** 高度 */
  height?: number;
  /** 插件 */
  plugins?: string[];
}

// 文字組件配置
export interface TextConfig extends BaseComponentConfig {
  type: 'text';
  /** 文字內容 */
  content: string | LocalizedString;
  /** 文字樣式 */
  textStyle?: 'heading' | 'body' | 'caption' | 'custom';
  /** HTML 標籤 */
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
}

// 分隔線配置
export interface DividerConfig extends BaseComponentConfig {
  type: 'divider';
  /** 分隔線樣式 */
  style?: 'solid' | 'dashed' | 'dotted';
  /** 方向 */
  orientation?: 'horizontal' | 'vertical';
  /** 厚度 */
  thickness?: number;
}

// 自定義組件配置
export interface CustomConfig extends BaseComponentConfig {
  type: 'custom';
  /** 自定義組件 */
  component: React.ComponentType<any>;
  /** 組件屬性 */
  props?: Record<string, any>;
}

// 聯合類型
export type DashboardComponentConfig = 
  | ResultCardConfig 
  | RiskIndicatorConfig 
  | ChartConfig 
  | TextConfig 
  | DividerConfig 
  | CustomConfig;

// 佈局配置
export interface DashboardLayoutConfig {
  /** 佈局模式 */
  mode: LayoutMode;
  /** 網格列數 */
  columns?: number | Partial<Record<Breakpoint, number>>;
  /** 網格行高 */
  rowHeight?: number | 'auto';
  /** 間距 */
  gap?: number | [number, number];
  /** 內邊距 */
  padding?: number | [number, number] | [number, number, number, number];
  /** 響應式斷點 */
  breakpoints?: Partial<Record<Breakpoint, number>>;
  /** 最小高度 */
  minHeight?: number | string;
  /** 最大高度 */
  maxHeight?: number | string;
}

// Dashboard 屬性
export interface DashboardProps {
  /** 計算結果 */
  result: CalculationResult;
  /** 組件配置列表 */
  components: DashboardComponentConfig[];
  /** 佈局配置 */
  layout?: DashboardLayoutConfig;
  /** 當前語言 */
  locale?: string;
  /** 載入狀態 */
  loading?: boolean;
  /** 錯誤狀態 */
  error?: string | null;
  /** 自定義 CSS 類名 */
  className?: string;
  /** 自定義樣式 */
  style?: React.CSSProperties;
  /** 組件間資料傳遞 */
  onDataChange?: (componentId: string, data: any) => void;
  /** 組件點擊事件 */
  onComponentClick?: (componentId: string, component: DashboardComponentConfig) => void;
}

// 預設佈局配置
const DEFAULT_LAYOUT: DashboardLayoutConfig = {
  mode: 'grid',
  columns: {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 6,
    '2xl': 8
  },
  rowHeight: 'auto',
  gap: 16,
  padding: 16,
  breakpoints: {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  }
};

// 響應式斷點 hook
function useBreakpoint(breakpoints: Record<Breakpoint, number>) {
  const [currentBreakpoint, setCurrentBreakpoint] = React.useState<Breakpoint>('lg');

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      const sortedBreakpoints = Object.entries(breakpoints)
        .sort(([, a], [, b]) => b - a) as [Breakpoint, number][];
      
      for (const [breakpoint, minWidth] of sortedBreakpoints) {
        if (width >= minWidth) {
          setCurrentBreakpoint(breakpoint);
          break;
        }
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, [breakpoints]);

  return currentBreakpoint;
}

// 本地化文字工具函數
function getLocalizedText(text: string | LocalizedString | undefined, locale: string = 'zh-TW'): string {
  if (!text) return '';
  if (typeof text === 'string') return text;
  return text[locale as keyof LocalizedString] || text['zh-TW'] || Object.values(text)[0] || '';
}

// 組件渲染器
const ComponentRenderer: React.FC<{
  config: DashboardComponentConfig;
  result: CalculationResult;
  locale: string;
  onDataChange?: (componentId: string, data: any) => void;
  onClick?: (componentId: string, component: DashboardComponentConfig) => void;
}> = ({ config, result, locale, onDataChange, onClick }) => {
  const handleClick = () => {
    onClick?.(config.id, config);
  };

  // 檢查條件顯示
  if (config.condition && !config.condition(result)) {
    return null;
  }

  // 檢查可見性
  if (config.visible === false) {
    return null;
  }

  const commonProps = {
    className: config.className,
    style: config.style,
    onClick: handleClick,
    'data-component-id': config.id,
    'data-component-type': config.type
  };

  switch (config.type) {
    case 'result-card': {
      const cardConfig = config as ResultCardConfig;
      const value = result.visualizationData?.[cardConfig.valueKey] ?? result.primaryValue;
      
      return (
        <ResultCard
          {...commonProps}
          value={value}
          label={getLocalizedText(config.title, locale)}
          subtitle={getLocalizedText(cardConfig.subtitle, locale)}
          format={cardConfig.format}
          precision={cardConfig.precision}
          showUnit={cardConfig.showUnit}
          colorScheme={cardConfig.colorScheme}
          icon={cardConfig.icon}
        />
      );
    }

    case 'risk-indicator': {
      const riskConfig = config as RiskIndicatorConfig;
      const riskValue = result.visualizationData?.[riskConfig.riskKey] ?? result.riskLevel;
      
      return (
        <RiskIndicator
          {...commonProps}
          level={riskValue}
          style={riskConfig.style}
          thresholds={riskConfig.thresholds}
          showLabel={true}
        />
      );
    }

    case 'chart': {
      const chartConfig = config as ChartConfig;
      const chartData = result.visualizationData?.[chartConfig.dataKey] as ChartData;
      
      if (!chartData) return null;
      
      return (
        <CalculatorChart
          {...commonProps}
          type={chartConfig.chartType}
          data={chartData}
          options={chartConfig.options}
          height={chartConfig.height}
          responsive={chartConfig.responsive}
        />
      );
    }

    case 'text': {
      const textConfig = config as TextConfig;
      const Tag = textConfig.tag || 'div';
      const content = getLocalizedText(textConfig.content, locale);
      
      return (
        <Tag
          {...commonProps}
          className={`dashboard-text ${textConfig.textStyle || 'body'} ${config.className || ''}`}
        >
          {content}
        </Tag>
      );
    }

    case 'divider': {
      const dividerConfig = config as DividerConfig;
      
      return (
        <div
          {...commonProps}
          className={`dashboard-divider ${dividerConfig.orientation || 'horizontal'} ${config.className || ''}`}
          style={{
            ...config.style,
            borderStyle: dividerConfig.style || 'solid',
            borderWidth: dividerConfig.thickness || 1
          }}
        />
      );
    }

    case 'custom': {
      const customConfig = config as CustomConfig;
      const CustomComponent = customConfig.component;
      
      return (
        <CustomComponent
          {...commonProps}
          {...customConfig.props}
          result={result}
          locale={locale}
          onDataChange={(data: any) => onDataChange?.(config.id, data)}
        />
      );
    }

    default:
      return (
        <div {...commonProps} className={`dashboard-unknown ${config.className || ''}`}>
          未知組件類型: {(config as any).type}
        </div>
      );
  }
};

// 主要 Dashboard 組件
export const Dashboard: React.FC<DashboardProps> = ({
  result,
  components,
  layout = DEFAULT_LAYOUT,
  locale = 'zh-TW',
  loading = false,
  error = null,
  className = '',
  style = {},
  onDataChange,
  onComponentClick
}) => {
  // 合併佈局配置
  const mergedLayout = useMemo(() => ({
    ...DEFAULT_LAYOUT,
    ...layout
  }), [layout]);

  // 響應式斷點
  const currentBreakpoint = useBreakpoint(mergedLayout.breakpoints || DEFAULT_LAYOUT.breakpoints!);

  // 計算當前列數
  const currentColumns = useMemo(() => {
    const columns = mergedLayout.columns;
    if (typeof columns === 'number') return columns;
    if (typeof columns === 'object' && columns) {
      return columns[currentBreakpoint] || columns.lg || 4;
    }
    return 4;
  }, [mergedLayout.columns, currentBreakpoint]);

  // 生成網格樣式
  const gridStyle = useMemo(() => {
    const baseStyle: React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns: `repeat(${currentColumns}, 1fr)`,
      gap: Array.isArray(mergedLayout.gap) 
        ? `${mergedLayout.gap[1]}px ${mergedLayout.gap[0]}px`
        : `${mergedLayout.gap}px`,
      padding: Array.isArray(mergedLayout.padding)
        ? mergedLayout.padding.length === 2
          ? `${mergedLayout.padding[1]}px ${mergedLayout.padding[0]}px`
          : `${mergedLayout.padding[0]}px ${mergedLayout.padding[1]}px ${mergedLayout.padding[2]}px ${mergedLayout.padding[3]}px`
        : `${mergedLayout.padding}px`,
      minHeight: mergedLayout.minHeight,
      maxHeight: mergedLayout.maxHeight,
      ...style
    };

    if (mergedLayout.rowHeight && mergedLayout.rowHeight !== 'auto') {
      baseStyle.gridAutoRows = `${mergedLayout.rowHeight}px`;
    }

    return baseStyle;
  }, [currentColumns, mergedLayout, style]);

  // 排序組件（按位置）
  const sortedComponents = useMemo(() => {
    return [...components].sort((a, b) => {
      const aPos = a.position.responsive?.[currentBreakpoint] || a.position;
      const bPos = b.position.responsive?.[currentBreakpoint] || b.position;
      
      if (aPos.row !== bPos.row) {
        return aPos.row - bPos.row;
      }
      return aPos.col - bPos.col;
    });
  }, [components, currentBreakpoint]);

  // 載入狀態
  if (loading) {
    return (
      <div className={`dashboard dashboard-loading ${className}`} style={gridStyle}>
        <div className="dashboard-loading-spinner">
          <div className="spinner" />
          <p>載入中...</p>
        </div>
      </div>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className={`dashboard dashboard-error ${className}`} style={gridStyle}>
        <div className="dashboard-error-message">
          <h3>載入錯誤</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`dashboard dashboard-${mergedLayout.mode} ${className}`}
      style={gridStyle}
      data-breakpoint={currentBreakpoint}
      data-columns={currentColumns}
    >
      {sortedComponents.map((component) => {
        const position = component.position.responsive?.[currentBreakpoint] || component.position;
        
        const itemStyle: React.CSSProperties = {
          gridRow: position.rowSpan 
            ? `${position.row} / span ${position.rowSpan}`
            : position.row,
          gridColumn: position.colSpan
            ? `${position.col} / span ${position.colSpan}`
            : position.col
        };

        return (
          <div
            key={component.id}
            className="dashboard-item"
            style={itemStyle}
            data-component-id={component.id}
          >
            <ComponentRenderer
              config={component}
              result={result}
              locale={locale}
              onDataChange={onDataChange}
              onClick={onComponentClick}
            />
          </div>
        );
      })}
    </div>
  );
};

// 預設導出
export default Dashboard;

// 工具函數導出
export { getLocalizedText, useBreakpoint };

// 類型導出
export type {
  DashboardComponentType,
  LayoutMode,
  Breakpoint,
  ComponentPosition,
  DashboardComponentConfig,
  DashboardLayoutConfig,
  DashboardProps
};