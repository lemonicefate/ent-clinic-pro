/**
 * CalculatorChart 組件
 * 
 * 基於 Chart.js 和 react-chartjs-2 的醫療計算機圖表組件。
 * 支援多種圖表類型，提供醫療主題樣式和完整的無障礙支援。
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { ScriptableContext, ChartOptions, ChartData, TooltipItem } from 'chart.js';
import {
  Chart,
  Line,
  Bar,
  Pie,
  Doughnut,
  Radar,
  PolarArea,
  Scatter,
  Bubble,
} from 'react-chartjs-2';
import type { 
  SupportedLocale, 
  LocalizedString,
  CalculationResult 
} from '../../types/calculator';

// 註冊 Chart.js 組件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

// 支援的圖表類型
export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'polarArea' | 'scatter' | 'bubble';

// 醫療主題顏色配置
export interface MedicalTheme {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  neutral: string;
}

// 預設醫療主題
const defaultMedicalTheme: MedicalTheme = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  neutral: '#6b7280'
};

// 圖表配置介面
export interface CalculatorChartProps {
  /** 圖表類型 */
  type: ChartType;
  /** 圖表資料 */
  data: ChartData<ChartType>;
  /** 圖表選項 */
  options?: ChartOptions<ChartType>;
  /** 圖表高度 */
  height?: number;
  /** 圖表寬度 */
  width?: number;
  /** 是否響應式 */
  responsive?: boolean;
  /** 是否維持長寬比 */
  maintainAspectRatio?: boolean;
  /** 醫療主題配置 */
  theme?: Partial<MedicalTheme>;
  /** 語言設定 */
  locale?: SupportedLocale;
  /** 自定義 CSS 類名 */
  className?: string;
  /** 自定義樣式 */
  style?: React.CSSProperties;
  /** 無障礙標籤 */
  'aria-label'?: string;
  /** 無障礙描述 */
  'aria-describedby'?: string;
  /** 是否顯示圖例 */
  showLegend?: boolean;
  /** 是否顯示標題 */
  showTitle?: boolean;
  /** 圖表標題 */
  title?: string | LocalizedString;
  /** 是否顯示工具提示 */
  showTooltip?: boolean;
  /** 是否顯示網格線 */
  showGrid?: boolean;
  /** 動畫配置 */
  animation?: boolean | {
    duration?: number;
    easing?: string;
  };
  /** 點擊事件處理器 */
  onClick?: (event: any, elements: any[]) => void;
  /** 懸停事件處理器 */
  onHover?: (event: any, elements: any[]) => void;
  /** 載入狀態 */
  loading?: boolean;
  /** 載入文字 */
  loadingText?: string;
  /** 錯誤狀態 */
  error?: boolean;
  /** 錯誤訊息 */
  errorMessage?: string;
  /** 空資料狀態 */
  empty?: boolean;
  /** 空資料訊息 */
  emptyMessage?: string;
}

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

// 工具函式：生成醫療主題顏色陣列
function generateMedicalColors(theme: MedicalTheme, count: number = 6): string[] {
  const baseColors = [
    theme.primary,
    theme.secondary,
    theme.success,
    theme.warning,
    theme.error,
    theme.info
  ];
  
  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }
  
  // 如果需要更多顏色，生成變化
  const colors = [...baseColors];
  const variations = ['80', '60', '40', '20'];
  
  for (let i = baseColors.length; i < count; i++) {
    const baseIndex = i % baseColors.length;
    const variationIndex = Math.floor(i / baseColors.length) % variations.length;
    const opacity = variations[variationIndex];
    colors.push(baseColors[baseIndex] + opacity);
  }
  
  return colors;
}

// 工具函式：創建預設圖表選項
function createDefaultOptions(
  type: ChartType,
  theme: MedicalTheme,
  locale: SupportedLocale,
  props: CalculatorChartProps
): ChartOptions<ChartType> {
  const {
    responsive = true,
    maintainAspectRatio = false,
    showLegend = true,
    showTitle = false,
    title,
    showTooltip = true,
    showGrid = true,
    animation = true
  } = props;

  const baseOptions: ChartOptions<ChartType> = {
    responsive,
    maintainAspectRatio,
    animation: typeof animation === 'boolean' ? animation : {
      duration: animation.duration || 750,
      easing: animation.easing as any || 'easeInOutQuart'
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: "'Inter', 'Helvetica Neue', 'Arial', sans-serif",
            size: 12
          },
          color: theme.neutral
        }
      },
      title: {
        display: showTitle && !!title,
        text: title ? getLocalizedText(title, locale) : '',
        font: {
          family: "'Inter', 'Helvetica Neue', 'Arial', sans-serif",
          size: 16,
          weight: '600'
        },
        color: theme.neutral,
        padding: {
          top: 10,
          bottom: 30
        }
      },
      tooltip: {
        enabled: showTooltip,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: theme.primary,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (tooltipItems: TooltipItem<ChartType>[]) => {
            return tooltipItems[0]?.label || '';
          },
          label: (tooltipItem: TooltipItem<ChartType>) => {
            const label = tooltipItem.dataset.label || '';
            const value = tooltipItem.formattedValue;
            return `${label}: ${value}`;
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  };

  // 根據圖表類型添加特定配置
  if (type === 'line' || type === 'bar' || type === 'scatter' || type === 'bubble') {
    (baseOptions as any).scales = {
      x: {
        display: true,
        grid: {
          display: showGrid,
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          font: {
            family: "'Inter', 'Helvetica Neue', 'Arial', sans-serif",
            size: 11
          },
          color: theme.neutral
        }
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          display: showGrid,
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          font: {
            family: "'Inter', 'Helvetica Neue', 'Arial', sans-serif",
            size: 11
          },
          color: theme.neutral
        }
      }
    };
  }

  if (type === 'radar') {
    (baseOptions as any).scales = {
      r: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        pointLabels: {
          font: {
            family: "'Inter', 'Helvetica Neue', 'Arial', sans-serif",
            size: 11
          },
          color: theme.neutral
        },
        ticks: {
          display: false
        }
      }
    };
  }

  return baseOptions;
}

// 載入指示器組件
const LoadingSpinner: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mb-4" />
    <p className="text-gray-600">{message}</p>
  </div>
);

// 錯誤狀態組件
const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <p className="text-red-600">{message}</p>
  </div>
);

// 空資料狀態組件
const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    </div>
    <p className="text-gray-500">{message}</p>
  </div>
);

// 主要 CalculatorChart 組件
export const CalculatorChart = forwardRef<HTMLCanvasElement, CalculatorChartProps>(({
  type,
  data,
  options = {},
  height,
  width,
  responsive = true,
  maintainAspectRatio = false,
  theme = {},
  locale = 'zh-TW',
  className = '',
  style,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  showLegend = true,
  showTitle = false,
  title,
  showTooltip = true,
  showGrid = true,
  animation = true,
  onClick,
  onHover,
  loading = false,
  loadingText = '載入中...',
  error = false,
  errorMessage = '圖表載入失敗',
  empty = false,
  emptyMessage = '暫無資料',
  ...props
}, ref) => {
  // 合併主題配置
  const mergedTheme = useMemo(() => ({
    ...defaultMedicalTheme,
    ...theme
  }), [theme]);

  // 創建預設選項
  const defaultOptions = useMemo(() => 
    createDefaultOptions(type, mergedTheme, locale, {
      responsive,
      maintainAspectRatio,
      showLegend,
      showTitle,
      title,
      showTooltip,
      showGrid,
      animation
    } as CalculatorChartProps),
    [type, mergedTheme, locale, responsive, maintainAspectRatio, showLegend, showTitle, title, showTooltip, showGrid, animation]
  );

  // 合併選項
  const mergedOptions = useMemo(() => ({
    ...defaultOptions,
    ...options,
    onClick: onClick ? (event: any, elements: any[]) => onClick(event, elements) : undefined,
    onHover: onHover ? (event: any, elements: any[]) => onHover(event, elements) : undefined
  }), [defaultOptions, options, onClick, onHover]);

  // 處理資料顏色
  const processedData = useMemo(() => {
    if (!data.datasets) return data;

    const colors = generateMedicalColors(mergedTheme, data.datasets.length);
    
    return {
      ...data,
      datasets: data.datasets.map((dataset, index) => ({
        ...dataset,
        backgroundColor: dataset.backgroundColor || (
          type === 'pie' || type === 'doughnut' || type === 'polarArea' 
            ? colors 
            : colors[index % colors.length] + '20'
        ),
        borderColor: dataset.borderColor || colors[index % colors.length],
        borderWidth: dataset.borderWidth || 2,
        ...(type === 'line' && {
          fill: dataset.fill !== undefined ? dataset.fill : false,
          tension: dataset.tension || 0.4
        }),
        ...(type === 'bar' && {
          borderRadius: dataset.borderRadius || 4,
          borderSkipped: dataset.borderSkipped || false
        })
      }))
    };
  }, [data, mergedTheme, type]);

  // 容器樣式
  const containerClasses = [
    'calculator-chart-container',
    'relative',
    className
  ].filter(Boolean).join(' ');

  const containerStyle = {
    height: height ? `${height}px` : undefined,
    width: width ? `${width}px` : undefined,
    ...style
  };

  // 無障礙屬性
  const accessibilityProps = {
    'aria-label': ariaLabel || `${type} 圖表`,
    'aria-describedby': ariaDescribedBy,
    role: 'img'
  };

  // 渲染狀態處理
  if (loading) {
    return (
      <div className={containerClasses} style={containerStyle}>
        <LoadingSpinner message={loadingText} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClasses} style={containerStyle}>
        <ErrorState message={errorMessage} />
      </div>
    );
  }

  if (empty || !data.datasets || data.datasets.length === 0) {
    return (
      <div className={containerClasses} style={containerStyle}>
        <EmptyState message={emptyMessage} />
      </div>
    );
  }

  // 選擇對應的圖表組件
  const ChartComponent = useMemo(() => {
    switch (type) {
      case 'line':
        return Line;
      case 'bar':
        return Bar;
      case 'pie':
        return Pie;
      case 'doughnut':
        return Doughnut;
      case 'radar':
        return Radar;
      case 'polarArea':
        return PolarArea;
      case 'scatter':
        return Scatter;
      case 'bubble':
        return Bubble;
      default:
        return Chart;
    }
  }, [type]);

  return (
    <div className={containerClasses} style={containerStyle} {...accessibilityProps}>
      <ChartComponent
        ref={ref}
        data={processedData}
        options={mergedOptions as any}
        {...props}
      />
    </div>
  );
});

CalculatorChart.displayName = 'CalculatorChart';

// 資料轉換工具函式
export class ChartDataTransformer {
  /**
   * 轉換 BMI 資料為圖表格式
   */
  static transformBMIData(result: CalculationResult): ChartData<'doughnut'> {
    const bmi = result.primaryValue;
    const categories = [
      { label: '體重過輕', min: 0, max: 18.5, color: '#3b82f6' },
      { label: '正常範圍', min: 18.5, max: 25, color: '#22c55e' },
      { label: '體重過重', min: 25, max: 30, color: '#f59e0b' },
      { label: '肥胖', min: 30, max: 50, color: '#ef4444' }
    ];

    const currentCategory = categories.find(cat => bmi >= cat.min && bmi < cat.max);
    
    return {
      labels: categories.map(cat => cat.label),
      datasets: [{
        data: categories.map(cat => cat === currentCategory ? 1 : 0.2),
        backgroundColor: categories.map(cat => cat.color),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  }

  /**
   * 轉換風險評估資料為圖表格式
   */
  static transformRiskData(
    riskValue: number, 
    thresholds: Array<{ min: number; max: number; label: string; color: string }>
  ): ChartData<'bar'> {
    return {
      labels: thresholds.map(t => t.label),
      datasets: [{
        label: '風險分布',
        data: thresholds.map(t => riskValue >= t.min && riskValue < t.max ? riskValue : 0),
        backgroundColor: thresholds.map(t => t.color + '40'),
        borderColor: thresholds.map(t => t.color),
        borderWidth: 2
      }]
    };
  }

  /**
   * 轉換趨勢資料為線圖格式
   */
  static transformTrendData(
    values: number[],
    labels: string[],
    label: string = '數值'
  ): ChartData<'line'> {
    return {
      labels,
      datasets: [{
        label,
        data: values,
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f620',
        fill: true,
        tension: 0.4
      }]
    };
  }

  /**
   * 轉換比較資料為雷達圖格式
   */
  static transformComparisonData(
    data: Record<string, number>,
    maxValue: number = 100
  ): ChartData<'radar'> {
    const labels = Object.keys(data);
    const values = Object.values(data);
    
    return {
      labels,
      datasets: [{
        label: '評估結果',
        data: values,
        backgroundColor: '#3b82f620',
        borderColor: '#3b82f6',
        borderWidth: 2,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#3b82f6'
      }]
    };
  }
}

export default CalculatorChart;