/**
 * eGFR 專用儀表板組件
 * 
 * 整合所有視覺化組件，提供完整的腎功能評估展示
 */

import React, { useMemo } from 'react';
import { Dashboard } from '../visualization/Dashboard';
import type { 
  EGFRResult,
  SupportedLocale 
} from '../../types/calculator';
import type { 
  DashboardComponentConfig,
  DashboardLayoutConfig 
} from '../visualization/Dashboard';

// eGFR 儀表板屬性
export interface EGFRDashboardProps {
  /** 計算結果 */
  result: EGFRResult;
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

// eGFR 儀表板組件
export const EGFRDashboard: React.FC<EGFRDashboardProps> = ({
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
      // 主要 eGFR 值卡片
      {
        id: 'primary-egfr',
        type: 'result-card',
        title: {
          'zh-TW': 'eGFR 值',
          'en': 'eGFR Value',
          'ja': 'eGFR値'
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
        valueKey: 'egfr',
        format: 'number',
        precision: 0,
        showUnit: true,
        colorScheme: 'risk-based',
        icon: 'beaker',
        subtitle: {
          'zh-TW': '估算腎絲球過濾率',
          'en': 'Estimated Glomerular Filtration Rate',
          'ja': '推定糸球体濾過量'
        }
      },

      // CKD 分期卡片
      {
        id: 'ckd-stage',
        type: 'result-card',
        title: {
          'zh-TW': 'CKD 分期',
          'en': 'CKD Stage',
          'ja': 'CKDステージ'
        },
        position: {
          row: 1,
          col: 3,
          colSpan: 1,
          responsive: {
            xs: { row: 2, col: 1, colSpan: 1 },
            sm: { row: 1, col: 3, colSpan: 1 }
          }
        },
        valueKey: 'ckdStage',
        format: 'custom',
        precision: 0,
        showUnit: false,
        colorScheme: 'risk-based',
        icon: 'clipboard-list',
        subtitle: {
          'zh-TW': '慢性腎病分期',
          'en': 'Chronic Kidney Disease Stage',
          'ja': '慢性腎臓病ステージ'
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
          col: 4,
          colSpan: 2,
          responsive: {
            xs: { row: 3, col: 1, colSpan: 1 },
            sm: { row: 1, col: 4, colSpan: 1 },
            md: { row: 1, col: 4, colSpan: 2 }
          }
        },
        riskKey: 'riskLevel',
        style: 'gauge',
        thresholds: [
          {
            min: 90,
            max: 999,
            level: 'low',
            color: '#22c55e',
            label: {
              'zh-TW': '低風險',
              'en': 'Low Risk',
              'ja': '低リスク'
            }
          },
          {
            min: 30,
            max: 89,
            level: 'moderate',
            color: '#f59e0b',
            label: {
              'zh-TW': '中等風險',
              'en': 'Moderate Risk',
              'ja': '中等度リスク'
            }
          },
          {
            min: 15,
            max: 29,
            level: 'high',
            color: '#ef4444',
            label: {
              'zh-TW': '高風險',
              'en': 'High Risk',
              'ja': '高リスク'
            }
          },
          {
            min: 0,
            max: 14,
            level: 'critical',
            color: '#dc2626',
            label: {
              'zh-TW': '極高風險',
              'en': 'Critical Risk',
              'ja': '極めて高いリスク'
            }
          }
        ]
      },

      // CKD 分期分布圓餅圖
      {
        id: 'stage-distribution',
        type: 'chart',
        title: {
          'zh-TW': 'CKD 分期分布',
          'en': 'CKD Stage Distribution',
          'ja': 'CKDステージ分布'
        },
        position: {
          row: 2,
          col: 1,
          colSpan: 2,
          responsive: {
            xs: { row: 4, col: 1, colSpan: 1 },
            sm: { row: 2, col: 1, colSpan: 2 }
          }
        },
        chartType: 'doughnut',
        dataKey: 'stageDistribution',
        height: 250,
        options: {
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                padding: 15
              }
            },
            title: {
              display: true,
              text: '目前 CKD 分期'
            }
          },
          cutout: '60%'
        }
      },

      // 年齡相關比較
      {
        id: 'age-comparison',
        type: 'chart',
        title: {
          'zh-TW': '年齡相關比較',
          'en': 'Age-Related Comparison',
          'ja': '年齢関連比較'
        },
        position: {
          row: 2,
          col: 3,
          colSpan: 2,
          responsive: {
            xs: { row: 5, col: 1, colSpan: 1 },
            sm: { row: 2, col: 3, colSpan: 2 }
          }
        },
        chartType: 'bar',
        dataKey: 'ageComparison',
        height: 250,
        options: {
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'eGFR 年齡比較'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'eGFR (mL/min/1.73m²)'
              }
            }
          }
        }
      },

      // eGFR 趨勢線圖
      {
        id: 'egfr-trend',
        type: 'chart',
        title: {
          'zh-TW': 'eGFR 趨勢',
          'en': 'eGFR Trend',
          'ja': 'eGFR傾向'
        },
        position: {
          row: 3,
          col: 1,
          colSpan: 3,
          responsive: {
            xs: { row: 6, col: 1, colSpan: 1 },
            sm: { row: 3, col: 1, colSpan: 2 },
            md: { row: 3, col: 1, colSpan: 3 }
          }
        },
        chartType: 'line',
        dataKey: 'trendData',
        height: 300,
        options: {
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'eGFR 變化趨勢'
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: '時間'
              }
            },
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: 'eGFR (mL/min/1.73m²)'
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

      // 風險因子雷達圖
      {
        id: 'risk-factors',
        type: 'chart',
        title: {
          'zh-TW': '風險因子分析',
          'en': 'Risk Factor Analysis',
          'ja': 'リスク因子分析'
        },
        position: {
          row: 3,
          col: 4,
          colSpan: 2,
          responsive: {
            xs: { row: 7, col: 1, colSpan: 1 },
            sm: { row: 3, col: 3, colSpan: 2 },
            md: { row: 3, col: 4, colSpan: 2 }
          }
        },
        chartType: 'radar',
        dataKey: 'riskFactors',
        height: 300,
        options: {
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: '個人風險因子'
            }
          },
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: {
                display: false
              }
            }
          }
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
          row: 4,
          col: 1,
          colSpan: 3,
          responsive: {
            xs: { row: 8, col: 1, colSpan: 1 },
            sm: { row: 4, col: 1, colSpan: 2 },
            md: { row: 4, col: 1, colSpan: 3 }
          }
        },
        content: result.recommendations?.map(rec => 
          typeof rec === 'string' ? rec : rec[locale] || rec['zh-TW']
        ).join('; ') || '',
        textStyle: 'body',
        tag: 'div',
        className: 'bg-blue-50 border border-blue-200 rounded-lg p-4'
      },

      // 建議檢查
      {
        id: 'additional-tests',
        type: 'text',
        title: {
          'zh-TW': '建議檢查',
          'en': 'Recommended Tests',
          'ja': '推奨検査'
        },
        position: {
          row: 4,
          col: 4,
          colSpan: 2,
          responsive: {
            xs: { row: 9, col: 1, colSpan: 1 },
            sm: { row: 4, col: 3, colSpan: 2 },
            md: { row: 4, col: 4, colSpan: 2 }
          }
        },
        content: result.additionalTests?.map(test => {
          const indication = typeof test.indication === 'string' 
            ? test.indication 
            : test.indication[locale] || test.indication['zh-TW'];
          const urgencyText = test.urgency === 'immediate' ? '緊急' : 
                             test.urgency === 'urgent' ? '急迫' : '常規';
          return `${indication} (${urgencyText})`;
        }).join('; ') || '',
        textStyle: 'body',
        tag: 'div',
        className: 'bg-yellow-50 border border-yellow-200 rounded-lg p-4'
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
          row: 5,
          col: 1,
          colSpan: 6,
          responsive: {
            xs: { row: 10, col: 1, colSpan: 1 },
            sm: { row: 5, col: 1, colSpan: 2 },
            md: { row: 5, col: 1, colSpan: 6 }
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
    <div className={`egfr-dashboard ${className}`} style={style}>
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

export default EGFRDashboard;