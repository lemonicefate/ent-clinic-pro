/**
 * 醫療數據視覺化組件集合
 * 提供專門用於醫療數據的圖表組件
 */

import { useState, useEffect, useMemo } from 'react';
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
  Filler
} from 'chart.js';
import {
  Line,
  Bar,
  Doughnut,
  Radar,
  Scatter
} from 'react-chartjs-2';
import type { SupportedLocale } from '../../env.d';
import { t } from '../../utils/i18n';

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

interface BaseChartProps {
  locale: SupportedLocale;
  className?: string;
  title?: string;
  height?: number;
}

// 風險評估圓餅圖組件
interface RiskAssessmentChartProps extends BaseChartProps {
  data: {
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
  showPercentages?: boolean;
}

export function RiskAssessmentChart({ 
  data, 
  locale, 
  className = '', 
  title = '風險評估分布',
  showPercentages = true,
  height = 300
}: RiskAssessmentChartProps) {
  const total = data.low + data.moderate + data.high + data.critical;
  
  const chartData = {
    labels: [
      t('risk.low', locale) || '低風險',
      t('risk.moderate', locale) || '中等風險', 
      t('risk.high', locale) || '高風險',
      t('risk.critical', locale) || '極高風險'
    ],
    datasets: [
      {
        data: [data.low, data.moderate, data.high, data.critical],
        backgroundColor: [
          '#22c55e', // 綠色 - 低風險
          '#f59e0b', // 黃色 - 中等風險
          '#f97316', // 橙色 - 高風險
          '#ef4444'  // 紅色 - 極高風險
        ],
        borderColor: [
          '#16a34a',
          '#d97706',
          '#ea580c',
          '#dc2626'
        ],
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const
        },
        color: '#1f2937'
      },
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return showPercentages 
              ? `${label}: ${value} (${percentage}%)`
              : `${label}: ${value}`;
          }
        }
      }
    }
  };

  return (
    <div className={`medical-chart-container ${className}`}>
      <div style={{ height: `${height}px` }}>
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}

// 生命徵象趨勢圖組件
interface VitalSignsTrendProps extends BaseChartProps {
  data: {
    timestamps: string[];
    bloodPressureSystolic: number[];
    bloodPressureDiastolic: number[];
    heartRate: number[];
    temperature?: number[];
    oxygenSaturation?: number[];
  };
  showGrid?: boolean;
}

export function VitalSignsTrend({ 
  data, 
  locale, 
  className = '', 
  title = '生命徵象趨勢',
  showGrid = true,
  height = 400
}: VitalSignsTrendProps) {
  const chartData = {
    labels: data.timestamps,
    datasets: [
      {
        label: t('vitals.systolic', locale) || '收縮壓',
        data: data.bloodPressureSystolic,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        yAxisID: 'y'
      },
      {
        label: t('vitals.diastolic', locale) || '舒張壓',
        data: data.bloodPressureDiastolic,
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        yAxisID: 'y'
      },
      {
        label: t('vitals.heartRate', locale) || '心率',
        data: data.heartRate,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        yAxisID: 'y1'
      }
    ]
  };

  // 添加體溫數據（如果有）
  if (data.temperature) {
    chartData.datasets.push({
      label: t('vitals.temperature', locale) || '體溫',
      data: data.temperature,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderWidth: 2,
      fill: false,
      tension: 0.1,
      yAxisID: 'y2'
    });
  }

  // 添加血氧飽和度數據（如果有）
  if (data.oxygenSaturation) {
    chartData.datasets.push({
      label: t('vitals.oxygenSaturation', locale) || '血氧飽和度',
      data: data.oxygenSaturation,
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      borderWidth: 2,
      fill: false,
      tension: 0.1,
      yAxisID: 'y3'
    });
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const
        },
        color: '#1f2937'
      },
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            return `時間: ${context[0].label}`;
          },
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            
            // 根據數據類型添加單位
            if (label.includes('壓')) {
              return `${label}: ${value} mmHg`;
            } else if (label.includes('心率')) {
              return `${label}: ${value} bpm`;
            } else if (label.includes('體溫')) {
              return `${label}: ${value} °C`;
            } else if (label.includes('血氧')) {
              return `${label}: ${value}%`;
            }
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: t('chart.time', locale) || '時間'
        },
        grid: {
          display: showGrid
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: t('chart.bloodPressure', locale) || '血壓 (mmHg)'
        },
        grid: {
          display: showGrid
        },
        min: 40,
        max: 200
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: t('chart.heartRate', locale) || '心率 (bpm)'
        },
        grid: {
          drawOnChartArea: false,
        },
        min: 40,
        max: 150
      },
      ...(data.temperature && {
        y2: {
          type: 'linear' as const,
          display: false,
          min: 35,
          max: 42
        }
      }),
      ...(data.oxygenSaturation && {
        y3: {
          type: 'linear' as const,
          display: false,
          min: 85,
          max: 100
        }
      })
    }
  };

  return (
    <div className={`medical-chart-container ${className}`}>
      <div style={{ height: `${height}px` }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

// 藥物比較圖表組件
interface MedicationComparisonProps extends BaseChartProps {
  data: {
    medications: string[];
    effectiveness: number[];
    sideEffects: number[];
    cost: number[];
  };
  showLegend?: boolean;
}

export function MedicationComparison({ 
  data, 
  locale, 
  className = '', 
  title = '藥物比較分析',
  showLegend = true,
  height = 400
}: MedicationComparisonProps) {
  const chartData = {
    labels: data.medications,
    datasets: [
      {
        label: t('medication.effectiveness', locale) || '療效',
        data: data.effectiveness,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: '#22c55e',
        borderWidth: 1
      },
      {
        label: t('medication.sideEffects', locale) || '副作用',
        data: data.sideEffects,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: '#ef4444',
        borderWidth: 1
      },
      {
        label: t('medication.cost', locale) || '成本指數',
        data: data.cost,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: '#3b82f6',
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const
        },
        color: '#1f2937'
      },
      legend: {
        display: showLegend,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value}/10`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: t('chart.medications', locale) || '藥物'
        }
      },
      y: {
        beginAtZero: true,
        max: 10,
        title: {
          display: true,
          text: t('chart.score', locale) || '評分 (1-10)'
        },
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return (
    <div className={`medical-chart-container ${className}`}>
      <div style={{ height: `${height}px` }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

// 症狀嚴重程度雷達圖組件
interface SymptomSeverityProps extends BaseChartProps {
  data: {
    symptoms: string[];
    severity: number[];
    maxSeverity?: number;
  };
  showScale?: boolean;
}

export function SymptomSeverityRadar({ 
  data, 
  locale, 
  className = '', 
  title = '症狀嚴重程度評估',
  showScale = true,
  height = 400
}: SymptomSeverityProps) {
  const maxSeverity = data.maxSeverity || 10;
  
  const chartData = {
    labels: data.symptoms,
    datasets: [
      {
        label: t('symptom.severity', locale) || '嚴重程度',
        data: data.severity,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: '#ef4444',
        borderWidth: 2,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#ef4444',
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const
        },
        color: '#1f2937'
      },
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.r;
            return `嚴重程度: ${value}/${maxSeverity}`;
          }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: maxSeverity,
        ticks: {
          display: showScale,
          stepSize: 1
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  return (
    <div className={`medical-chart-container ${className}`}>
      <div style={{ height: `${height}px` }}>
        <Radar data={chartData} options={options} />
      </div>
    </div>
  );
}

// 治療效果散點圖組件
interface TreatmentEffectivenessProps extends BaseChartProps {
  data: {
    treatments: Array<{
      name: string;
      effectiveness: number;
      sideEffects: number;
      cost: number;
    }>;
  };
  xAxis?: 'effectiveness' | 'cost';
  yAxis?: 'sideEffects' | 'effectiveness';
}

export function TreatmentEffectivenessScatter({ 
  data, 
  locale, 
  className = '', 
  title = '治療效果分析',
  xAxis = 'effectiveness',
  yAxis = 'sideEffects',
  height = 400
}: TreatmentEffectivenessProps) {
  const chartData = {
    datasets: [
      {
        label: t('treatment.comparison', locale) || '治療比較',
        data: data.treatments.map(treatment => ({
          x: treatment[xAxis],
          y: treatment[yAxis],
          r: treatment.cost * 2, // 使用成本作為氣泡大小
          label: treatment.name
        })),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: '#3b82f6',
        borderWidth: 2
      }
    ]
  };

  const getAxisLabel = (axis: string) => {
    switch (axis) {
      case 'effectiveness':
        return t('treatment.effectiveness', locale) || '治療效果';
      case 'sideEffects':
        return t('treatment.sideEffects', locale) || '副作用';
      case 'cost':
        return t('treatment.cost', locale) || '治療成本';
      default:
        return axis;
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const
        },
        color: '#1f2937'
      },
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            return context[0].raw.label;
          },
          label: function(context: any) {
            const point = context.raw;
            return [
              `${getAxisLabel(xAxis)}: ${point.x}`,
              `${getAxisLabel(yAxis)}: ${point.y}`,
              `成本指數: ${Math.round(point.r / 2)}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: getAxisLabel(xAxis)
        },
        min: 0,
        max: 10
      },
      y: {
        title: {
          display: true,
          text: getAxisLabel(yAxis)
        },
        min: 0,
        max: 10
      }
    }
  };

  return (
    <div className={`medical-chart-container ${className}`}>
      <div style={{ height: `${height}px` }}>
        <Scatter data={chartData} options={options} />
      </div>
    </div>
  );
}

// 主要導出組件
export default {
  RiskAssessmentChart,
  VitalSignsTrend,
  MedicationComparison,
  SymptomSeverityRadar,
  TreatmentEffectivenessScatter
};