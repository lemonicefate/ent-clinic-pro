/**
 * CalculatorChart Storybook Stories
 * 
 * 展示 CalculatorChart 組件的各種使用場景，包括不同的圖表類型、
 * 醫療主題配置和資料視覺化效果。
 */

import type { Meta, StoryObj } from '@storybook/react';
import { CalculatorChart, ChartDataTransformer } from './CalculatorChart';
import type { ChartData } from 'chart.js';
import type { CalculationResult } from '../../types/calculator';

// 模擬計算結果資料
const mockBMIResult: CalculationResult = {
  primaryValue: 24.2,
  primaryUnit: 'kg/m²',
  primaryLabel: { 'zh-TW': 'BMI 指數', 'en': 'BMI Index' },
  riskLevel: 'low',
  interpretation: {
    'zh-TW': '您的 BMI 指數為 24.2，屬於正常範圍',
    'en': 'Your BMI is 24.2, which is in the normal range'
  }
};

// 模擬線圖資料
const lineChartData: ChartData<'line'> = {
  labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
  datasets: [
    {
      label: '血壓 (收縮壓)',
      data: [120, 125, 118, 130, 122, 119],
      borderColor: '#ef4444',
      backgroundColor: '#ef444420',
      fill: true,
      tension: 0.4
    },
    {
      label: '血壓 (舒張壓)',
      data: [80, 82, 78, 85, 81, 79],
      borderColor: '#3b82f6',
      backgroundColor: '#3b82f620',
      fill: true,
      tension: 0.4
    }
  ]
};

// 模擬柱狀圖資料
const barChartData: ChartData<'bar'> = {
  labels: ['正常', '前期高血壓', '高血壓 1 期', '高血壓 2 期'],
  datasets: [
    {
      label: '患者分布',
      data: [45, 25, 20, 10],
      backgroundColor: ['#22c55e40', '#f59e0b40', '#ef444440', '#dc262640'],
      borderColor: ['#22c55e', '#f59e0b', '#ef4444', '#dc2626'],
      borderWidth: 2
    }
  ]
};

// 模擬圓餅圖資料
const pieChartData: ChartData<'pie'> = {
  labels: ['體重過輕', '正常範圍', '體重過重', '肥胖'],
  datasets: [
    {
      data: [8, 65, 20, 7],
      backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'],
      borderWidth: 2,
      borderColor: '#fff'
    }
  ]
};

// 模擬甜甜圈圖資料
const doughnutChartData: ChartData<'doughnut'> = {
  labels: ['低風險', '中等風險', '高風險', '極高風險'],
  datasets: [
    {
      data: [40, 30, 20, 10],
      backgroundColor: ['#22c55e', '#f59e0b', '#ef4444', '#dc2626'],
      borderWidth: 3,
      borderColor: '#fff'
    }
  ]
};

// 模擬雷達圖資料
const radarChartData: ChartData<'radar'> = {
  labels: ['血壓', '血糖', '膽固醇', '體重', '運動', '飲食'],
  datasets: [
    {
      label: '健康指標',
      data: [85, 75, 60, 80, 70, 65],
      backgroundColor: '#3b82f620',
      borderColor: '#3b82f6',
      borderWidth: 2,
      pointBackgroundColor: '#3b82f6',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#3b82f6'
    },
    {
      label: '目標值',
      data: [90, 85, 80, 85, 90, 85],
      backgroundColor: '#22c55e20',
      borderColor: '#22c55e',
      borderWidth: 2,
      pointBackgroundColor: '#22c55e',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#22c55e'
    }
  ]
};

// 模擬極座標圖資料
const polarAreaData: ChartData<'polarArea'> = {
  labels: ['心血管', '糖尿病', '高血壓', '肥胖', '吸菸'],
  datasets: [
    {
      data: [15, 25, 30, 20, 10],
      backgroundColor: [
        '#ef444440',
        '#f59e0b40',
        '#dc262640',
        '#3b82f640',
        '#6b728040'
      ],
      borderColor: [
        '#ef4444',
        '#f59e0b',
        '#dc2626',
        '#3b82f6',
        '#6b7280'
      ],
      borderWidth: 2
    }
  ]
};

// 模擬散點圖資料
const scatterData: ChartData<'scatter'> = {
  datasets: [
    {
      label: 'BMI vs 血壓',
      data: [
        { x: 18.5, y: 110 },
        { x: 22.0, y: 120 },
        { x: 25.5, y: 130 },
        { x: 28.0, y: 140 },
        { x: 32.0, y: 160 },
        { x: 35.0, y: 170 }
      ],
      backgroundColor: '#3b82f6',
      borderColor: '#3b82f6'
    }
  ]
};

// 模擬氣泡圖資料
const bubbleData: ChartData<'bubble'> = {
  datasets: [
    {
      label: '風險因子分析',
      data: [
        { x: 25, y: 130, r: 10 },
        { x: 30, y: 140, r: 15 },
        { x: 35, y: 160, r: 20 },
        { x: 28, y: 135, r: 12 }
      ],
      backgroundColor: '#ef444440',
      borderColor: '#ef4444'
    }
  ]
};

const meta: Meta<typeof CalculatorChart> = {
  title: 'Visualization/CalculatorChart',
  component: CalculatorChart,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
CalculatorChart 是基於 Chart.js 的醫療計算機圖表組件。它提供多種圖表類型，
具備醫療主題樣式、完整的無障礙支援和豐富的自定義選項。

## 主要特性

- **多種圖表類型**: Line、Bar、Pie、Doughnut、Radar、PolarArea、Scatter、Bubble
- **醫療主題**: 預設醫療色彩配置，支援自定義主題
- **響應式設計**: 自動適應容器大小
- **無障礙支援**: 完整的 ARIA 標籤和鍵盤導航
- **狀態管理**: 載入、錯誤、空資料狀態處理
- **資料轉換**: 內建醫療資料轉換工具

## 使用場景

- BMI 分布圖表
- 血壓趨勢監測
- 風險評估視覺化
- 健康指標雷達圖
- 患者統計分析
- 實驗室檢查結果
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['line', 'bar', 'pie', 'doughnut', 'radar', 'polarArea', 'scatter', 'bubble'],
      description: '圖表類型',
    },
    height: {
      control: { type: 'number', min: 200, max: 800, step: 50 },
      description: '圖表高度（像素）',
    },
    responsive: {
      control: 'boolean',
      description: '是否響應式',
    },
    showLegend: {
      control: 'boolean',
      description: '是否顯示圖例',
    },
    showTitle: {
      control: 'boolean',
      description: '是否顯示標題',
    },
    showTooltip: {
      control: 'boolean',
      description: '是否顯示工具提示',
    },
    showGrid: {
      control: 'boolean',
      description: '是否顯示網格線',
    },
    animation: {
      control: 'boolean',
      description: '是否啟用動畫',
    },
    loading: {
      control: 'boolean',
      description: '載入狀態',
    },
    error: {
      control: 'boolean',
      description: '錯誤狀態',
    },
    empty: {
      control: 'boolean',
      description: '空資料狀態',
    },
  },
  args: {
    onClick: (event: any, elements: any[]) => console.log('Chart clicked:', event, elements),
    onHover: (event: any, elements: any[]) => console.log('Chart hovered:', event, elements),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基本線圖
export const LineChart: Story = {
  args: {
    type: 'line',
    data: lineChartData,
    title: '血壓趨勢監測',
    showTitle: true,
    height: 400,
  },
};

// 柱狀圖
export const BarChart: Story = {
  args: {
    type: 'bar',
    data: barChartData,
    title: '血壓分級患者分布',
    showTitle: true,
    height: 400,
  },
};

// 圓餅圖
export const PieChart: Story = {
  args: {
    type: 'pie',
    data: pieChartData,
    title: 'BMI 分布統計',
    showTitle: true,
    height: 400,
  },
};

// 甜甜圈圖
export const DoughnutChart: Story = {
  args: {
    type: 'doughnut',
    data: doughnutChartData,
    title: '心血管風險分布',
    showTitle: true,
    height: 400,
  },
};

// 雷達圖
export const RadarChart: Story = {
  args: {
    type: 'radar',
    data: radarChartData,
    title: '健康指標評估',
    showTitle: true,
    height: 400,
  },
};

// 極座標圖
export const PolarAreaChart: Story = {
  args: {
    type: 'polarArea',
    data: polarAreaData,
    title: '風險因子分析',
    showTitle: true,
    height: 400,
  },
};

// 散點圖
export const ScatterChart: Story = {
  args: {
    type: 'scatter',
    data: scatterData,
    title: 'BMI 與血壓相關性',
    showTitle: true,
    height: 400,
  },
};

// 氣泡圖
export const BubbleChart: Story = {
  args: {
    type: 'bubble',
    data: bubbleData,
    title: '多維度風險分析',
    showTitle: true,
    height: 400,
  },
};

// 自定義主題
export const CustomTheme: Story = {
  args: {
    type: 'line',
    data: lineChartData,
    title: '自定義醫療主題',
    showTitle: true,
    height: 400,
    theme: {
      primary: '#8b5cf6',
      secondary: '#06b6d4',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#f87171',
      info: '#3b82f6',
      neutral: '#64748b'
    },
  },
};

// 無圖例和網格
export const MinimalStyle: Story = {
  args: {
    type: 'bar',
    data: barChartData,
    title: '簡潔樣式',
    showTitle: true,
    showLegend: false,
    showGrid: false,
    height: 300,
  },
};

// 載入狀態
export const LoadingState: Story = {
  args: {
    type: 'line',
    data: lineChartData,
    loading: true,
    loadingText: '正在載入圖表資料...',
    height: 400,
  },
};

// 錯誤狀態
export const ErrorState: Story = {
  args: {
    type: 'line',
    data: lineChartData,
    error: true,
    errorMessage: '圖表資料載入失敗，請稍後再試',
    height: 400,
  },
};

// 空資料狀態
export const EmptyState: Story = {
  args: {
    type: 'line',
    data: { labels: [], datasets: [] },
    empty: true,
    emptyMessage: '暫無圖表資料',
    height: 400,
  },
};

// BMI 分析圖表
export const BMIAnalysis: Story = {
  args: {
    type: 'doughnut',
    data: ChartDataTransformer.transformBMIData(mockBMIResult),
    title: 'BMI 分析結果',
    showTitle: true,
    height: 400,
  },
};

// 風險評估圖表
export const RiskAssessment: Story = {
  args: {
    type: 'bar',
    data: ChartDataTransformer.transformRiskData(35, [
      { min: 0, max: 25, label: '低風險', color: '#22c55e' },
      { min: 25, max: 50, label: '中等風險', color: '#f59e0b' },
      { min: 50, max: 75, label: '高風險', color: '#ef4444' },
      { min: 75, max: 100, label: '極高風險', color: '#dc2626' }
    ]),
    title: '風險評估結果',
    showTitle: true,
    height: 400,
  },
};

// 趨勢分析圖表
export const TrendAnalysis: Story = {
  args: {
    type: 'line',
    data: ChartDataTransformer.transformTrendData(
      [120, 125, 118, 130, 122, 119, 115],
      ['週一', '週二', '週三', '週四', '週五', '週六', '週日'],
      '收縮壓 (mmHg)'
    ),
    title: '一週血壓趨勢',
    showTitle: true,
    height: 400,
  },
};

// 健康指標比較
export const HealthComparison: Story = {
  args: {
    type: 'radar',
    data: ChartDataTransformer.transformComparisonData({
      '血壓': 85,
      '血糖': 75,
      '膽固醇': 60,
      '體重': 80,
      '運動': 70,
      '飲食': 65
    }),
    title: '健康指標評估',
    showTitle: true,
    height: 400,
  },
};

// 響應式展示
export const ResponsiveChart: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CalculatorChart
          type="pie"
          data={pieChartData}
          title="BMI 分布"
          showTitle
          height={300}
        />
        <CalculatorChart
          type="bar"
          data={barChartData}
          title="血壓分級"
          showTitle
          height={300}
        />
      </div>
      <CalculatorChart
        type="line"
        data={lineChartData}
        title="血壓趨勢監測"
        showTitle
        height={250}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '響應式佈局展示，圖表會自動適應容器大小。',
      },
    },
  },
};

// 醫療儀表板
export const MedicalDashboard: Story = {
  render: () => (
    <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-bold text-gray-800">醫療數據儀表板</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BMI 分析 */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <CalculatorChart
            type="doughnut"
            data={doughnutChartData}
            title="BMI 風險分布"
            showTitle
            height={300}
          />
        </div>
        
        {/* 血壓趨勢 */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <CalculatorChart
            type="line"
            data={lineChartData}
            title="血壓監測趨勢"
            showTitle
            height={300}
          />
        </div>
        
        {/* 健康指標 */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <CalculatorChart
            type="radar"
            data={radarChartData}
            title="健康指標評估"
            showTitle
            height={300}
          />
        </div>
        
        {/* 風險因子 */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <CalculatorChart
            type="polarArea"
            data={polarAreaData}
            title="風險因子分析"
            showTitle
            height={300}
          />
        </div>
      </div>
      
      {/* 患者統計 */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <CalculatorChart
          type="bar"
          data={barChartData}
          title="患者血壓分級統計"
          showTitle
          height={250}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '完整的醫療數據儀表板，展示多種圖表類型的組合使用。',
      },
    },
  },
};

// 互動功能展示
export const InteractiveChart: Story = {
  args: {
    type: 'line',
    data: lineChartData,
    title: '互動式血壓監測',
    showTitle: true,
    height: 400,
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const element = elements[0];
        alert(`點擊了數據點: ${element.datasetIndex}, ${element.index}`);
      }
    },
    onHover: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        console.log('懸停在數據點上:', elements[0]);
      }
    },
  },
  parameters: {
    docs: {
      description: {
        story: '展示圖表的互動功能，包括點擊和懸停事件處理。',
      },
    },
  },
};

// 無障礙功能展示
export const AccessibilityFeatures: Story = {
  args: {
    type: 'bar',
    data: barChartData,
    title: '血壓分級統計',
    showTitle: true,
    height: 400,
    'aria-label': '血壓分級患者分布柱狀圖，顯示正常、前期高血壓、高血壓1期和2期的患者數量',
    'aria-describedby': 'chart-description',
  },
  render: (args) => (
    <div>
      <CalculatorChart {...args} />
      <p id="chart-description" className="mt-2 text-sm text-gray-600">
        此圖表顯示不同血壓分級的患者分布情況。正常血壓患者佔45%，前期高血壓25%，
        高血壓1期20%，高血壓2期10%。
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '展示圖表的無障礙功能，包括 ARIA 標籤和描述性文字。',
      },
    },
  },
};

// 多語言支援
export const MultiLanguage: Story = {
  args: {
    type: 'pie',
    data: {
      labels: ['Underweight', 'Normal', 'Overweight', 'Obese'],
      datasets: [{
        data: [8, 65, 20, 7],
        backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    title: { 'zh-TW': 'BMI 分布統計', 'en': 'BMI Distribution' },
    showTitle: true,
    locale: 'en',
    height: 400,
  },
};

// 動畫效果展示
export const AnimationDemo: Story = {
  args: {
    type: 'bar',
    data: barChartData,
    title: '動畫效果展示',
    showTitle: true,
    height: 400,
    animation: {
      duration: 2000,
      easing: 'easeInOutBounce'
    },
  },
  parameters: {
    docs: {
      description: {
        story: '展示圖表的動畫效果，包括自定義動畫持續時間和緩動函數。',
      },
    },
  },
};