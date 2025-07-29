/**
 * CHA₂DS₂-VASc 專用儀表板組件
 * 
 * 整合所有視覺化組件，提供完整的風險評估展示
 */

import React, { useMemo } from 'react';
import { Dashboard } from '../visualization/Dashboard';
import { ResultCard } from '../visualization/ResultCard';
import { RiskIndicator } from '../visualization/RiskIndicator';
import { CalculatorChart, ChartDataTransformer } from '../visualization/CalculatorChart';
import type { 
  CHA2DS2VAScResult,
  SupportedLocale 
} from '../../types/calculator';
import type { 
  DashboardComponentConfig,
  DashboardLayoutConfig 
} from '../visualization/Dashboard';

// CHA₂DS₂-VASc 儀表板屬性
export interface CHA2DS2VAScDashboardProps {
  /** 計算結果 */
  result: CHA2DS2VAScResult;
  /** 語言設定 */
  locale?: SupportedLocale;
  /** 自定義 CSS 類名 */
  className?: string;
  /** 自定義樣式 */
  style?: React.CSSProperties;
  /** 載入狀態 */
  loading?: boolean;
  /** 錯誤狀態 */
  error?: string | null;
  /** 組件點擊事件 */
  onComponentClick?: (componentId: string, data: any) => void;
}

// 預設佈局配置
const DASHBOARD_LAYOUT: DashboardLayoutConfig = {
  mode: 'grid',
  columns: {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 6
  },
  gap: 16,
  padding: 16,
  rowHeight: 'auto',
  minHeight: '600px'
};

// CHA₂DS₂-VASc 儀表板組件
export const CHA2DS2VAScDashboard: React.FC<CHA2DS2VAScDashboardProps> = ({
  result,
  locale = 'zh-TW',
  className = '',
  style,
  loading = false,
  error = null,
  onComponentClick
}) => {
  // 生成組件配置
  const dashboardComponents = useMemo((): DashboardComponentConfig[] => {
    return [
      // 主要評分卡片
      {
        id: 'primary-score',
        type: 'result-card',
        title: {
          'zh-TW': 'CHA₂DS₂-VASc 評分',
          'en': 'CHA₂DS₂-VASc Score',
          'ja': 'CHA₂DS₂-VAScスコア'
        },
        position: {
          row: 1,
          col: 1,
          colSpan: 2,
          responsive: {
            xs: { row: 1, col: 1, colSpan: 1 },
            sm: { row: 1, col: 1, colSpan: 2 }
          }
        },
        valueKey: 'score',
        format: 'number',
        precision: 0,
        showUnit: true,
        colorScheme: 'risk-based',
        icon: 'calculator',
        subtitle: {
          'zh-TW': '中風風險評分',
          'en': 'Stroke Risk Score',
          'ja': '脳卒中リスクスコア'
        }
      },

      // 風險等級儀表
      {
        id: 'risk-gauge',
        type: 'risk-indicator',
        title: {
          'zh-TW': '風險等級',
          'en': 'Risk Level',
          'ja': 'リスクレベル'
        },
        position: {
          row: 1,
          col: 3,
          colSpan: 2,
          responsive: {
            xs: { row: 2, col: 1, colSpan: 1 },
            sm: { row: 1, col: 3, colSpan: 1 },
            md: { row: 1, col: 3, colSpan: 2 }
          }
        },
        riskKey: 'riskLevel',
        style: 'gauge',
        thresholds: [
          {
            min: 0,
            max: 0,
            level: 'low',
            color: '#22c55e',
            label: {
              'zh-TW': '低風險',
              'en': 'Low Risk',
              'ja': '低リスク'
            }
          },
          {
            min: 1,
            max: 1,
            level: 'moderate',
            color: '#f59e0b',
            label: {
              'zh-TW': '中等風險',
              'en': 'Moderate Risk',
              'ja': '中等度リスク'
            }
          },
          {
            min: 2,
            max: 9,
            level: 'high',
            color: '#ef4444',
            label: {
              'zh-TW': '高風險',
              'en': 'High Risk',
              'ja': '高リスク'
            }
          }
        ]
      },

      // 年度風險卡片
      {
        id: 'annual-risk',
        type: 'result-card',
        title: {
          'zh-TW': '年度中風風險',
          'en': 'Annual Stroke Risk',
          'ja': '年間脳卒中リスク'
        },
        position: {
          row: 2,
          col: 1,
          colSpan: 2,
          responsive: {
            xs: { row: 3, col: 1, colSpan: 1 },
            sm: { row: 2, col: 1, colSpan: 1 },
            md: { row: 2, col: 1, colSpan: 2 }
          }
        },
        valueKey: 'annualStrokeRisk',
        format: 'custom',
        precision: 1,
        showUnit: true,
        colorScheme: 'risk-based',
        icon: 'exclamation-triangle',
        subtitle: {
          'zh-TW': '每年發生機率',
          'en': 'Annual Probability',
          'ja': '年間発生確率'
        }
      },

      // 風險標籤
      {
        id: 'risk-badge',
        type: 'risk-indicator',
        title: {
          'zh-TW': '風險分類',
          'en': 'Risk Category',
          'ja': 'リスク分類'
        },
        position: {
          row: 2,
          col: 3,
          colSpan: 1,
          responsive: {
            xs: { row: 4, col: 1, colSpan: 1 },
            sm: { row: 2, col: 2, colSpan: 1 },
            md: { row: 2, col: 3, colSpan: 1 }
          }
        },
        riskKey: 'riskLevel',
        style: 'badge'
      },

      // 風險因子圖表
      {
        id: 'risk-factors-chart',
        type: 'chart',
        title: {
          'zh-TW': '風險因子分析',
          'en': 'Risk Factor Analysis',
          'ja': 'リスク因子分析'
        },
        position: {
          row: 3,
          col: 1,
          colSpan: 3,
          responsive: {
            xs: { row: 5, col: 1, colSpan: 1 },
            sm: { row: 3, col: 1, colSpan: 2 },
            md: { row: 3, col: 1, colSpan: 3 }
          }
        },
        chartType: 'bar',
        dataKey: 'riskFactorsChart',
        height: 300,
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: '各風險因子貢獻分數'
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 2,
              ticks: {
                stepSize: 1
              },
              title: {
                display: true,
                text: '分數 (Points)'
              }
            },
            y: {
              title: {
                display: true,
                text: '風險因子 (Risk Factors)'
              }
            }
          }
        }
      },

      // 年度風險趨勢
      {
        id: 'annual-risk-trend',
        type: 'chart',
        title: {
          'zh-TW': '年度風險趨勢',
          'en': 'Annual Risk Trend',
          'ja': '年間リスク傾向'
        },
        position: {
          row: 4,
          col: 1,
          colSpan: 2,
          responsive: {
            xs: { row: 6, col: 1, colSpan: 1 },
            sm: { row: 4, col: 1, colSpan: 2 },
            md: { row: 4, col: 1, colSpan: 2 }
          }
        },
        chartType: 'line',
        dataKey: 'annualRiskTrend',
        height: 250,
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: '各評分對應的年度中風風險'
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'CHA₂DS₂-VASc 評分'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: '年度中風風險 (%)'
              }
            }
          },
          elements: {
            point: {
              radius: 6,
              hoverRadius: 8
            },
            line: {
              tension: 0.4
            }
          }
        }
      },

      // 風險比較圓餅圖
      {
        id: 'risk-comparison',
        type: 'chart',
        title: {
          'zh-TW': '風險比較',
          'en': 'Risk Comparison',
          'ja': 'リスク比較'
        },
        position: {
          row: 4,
          col: 3,
          colSpan: 1,
          responsive: {
            xs: { row: 7, col: 1, colSpan: 1 },
            sm: { row: 4, col: 3, colSpan: 1 },
            md: { row: 4, col: 3, colSpan: 1 }
          }
        },
        chartType: 'doughnut',
        dataKey: 'riskComparison',
        height: 250,
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                padding: 15
              }
            }
          },
          cutout: '60%'
        }
      },

      // 臨床建議
      {
        id: 'recommendations',
        type: 'text',
        title: {
          'zh-TW': '臨床建議',
          'en': 'Clinical Recommendations',
          'ja': '臨床推奨'
        },
        position: {
          row: 5,
          col: 1,
          colSpan: 3,
          responsive: {
            xs: { row: 8, col: 1, colSpan: 1 },
            sm: { row: 5, col: 1, colSpan: 2 },
            md: { row: 5, col: 1, colSpan: 3 }
          }
        },
        content: result.recommendations?.map(rec => 
          typeof rec === 'string' ? rec : rec[locale] || rec['zh-TW']
        ).join('; ') || '',
        textStyle: 'body',
        tag: 'div',
        className: 'bg-blue-50 border border-blue-200 rounded-lg p-4'
      },

      // 結果解釋
      {
        id: 'interpretation',
        type: 'text',
        title: {
          'zh-TW': '結果解釋',
          'en': 'Result Interpretation',
          'ja': '結果の解釈'
        },
        position: {
          row: 6,
          col: 1,
          colSpan: 3,
          responsive: {
            xs: { row: 9, col: 1, colSpan: 1 },
            sm: { row: 6, col: 1, colSpan: 2 },
            md: { row: 6, col: 1, colSpan: 3 }
          }
        },
        content: result.interpretation?.[locale] || result.interpretation?.['zh-TW'] || '',
        textStyle: 'body',
        tag: 'div',
        className: 'bg-gray-50 border border-gray-200 rounded-lg p-4'
      }
    ];
  }, [result, locale]);

  return (
    <div className={`cha2ds2vasc-dashboard ${className}`} style={style}>
      <Dashboard
        result={result}
        components={dashboardComponents}
        layout={DASHBOARD_LAYOUT}
        locale={locale}
        loading={loading}
        error={error}
        onComponentClick={onComponentClick}
      />
    </div>
  );
};

export default CHA2DS2VAScDashboard;