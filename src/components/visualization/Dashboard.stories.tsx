/**
 * Dashboard Storybook 故事
 * 
 * 展示 Dashboard 組件的各種使用場景和配置選項
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Dashboard } from './Dashboard';
import type { 
  DashboardProps, 
  DashboardComponentConfig,
  CalculationResult 
} from './Dashboard';

// 模擬計算結果
const mockCalculationResult: CalculationResult = {
  primaryValue: 22.86,
  primaryUnit: 'kg/m²',
  primaryLabel: { 'zh-TW': 'BMI 指數', 'en': 'BMI Index' },
  riskLevel: 'low',
  riskScore: 0.2,
  interpretation: {
    'zh-TW': '您的 BMI 指數在正常範圍內',
    'en': 'Your BMI is within normal range'
  },
  recommendations: [
    { 'zh-TW': '維持目前的健康生活方式', 'en': 'Maintain current healthy lifestyle' },
    { 'zh-TW': '定期運動和均衡飲食', 'en': 'Regular exercise and balanced diet' }
  ],
  breakdown: [
    {
      field: 'weight',
      label: { 'zh-TW': '體重', 'en': 'Weight' },
      value: 70,
      contribution: 0.5,
      explanation: { 'zh-TW': '您的體重', 'en': 'Your weight' }
    },
    {
      field: 'height',
      label: { 'zh-TW': '身高', 'en': 'Height' },
      value: 175,
      contribution: 0.5,
      explanation: { 'zh-TW': '您的身高', 'en': 'Your height' }
    }
  ],
  visualizationData: {
    bmiValue: 22.86,
    bmiCategory: 'normal',
    categoryDistribution: {
      labels: ['體重過輕', '正常範圍', '體重過重', '肥胖'],
      datasets: [{
        data: [0, 22.86, 0, 0],
        backgroundColor: ['#60a5fa', '#34d399', '#fbbf24', '#f87171']
      }]
    },
    riskIndicator: 'low',
    healthScore: 85
  }
};

// 基本組件配置
const basicComponents: DashboardComponentConfig[] = [
  {
    id: 'bmi-result',
    type: 'result-card',
    title: { 'zh-TW': 'BMI 指數', 'en': 'BMI Index' },
    position: { row: 1, col: 1, colSpan: 2 },
    valueKey: 'bmiValue',
    format: 'number',
    precision: 2,
    showUnit: true,
    colorScheme: 'risk-based',
    icon: 'scale'
  },
  {
    id: 'risk-indicator',
    type: 'risk-indicator',
    title: { 'zh-TW': '健康風險', 'en': 'Health Risk' },
    position: { row: 1, col: 3, colSpan: 2 },
    riskKey: 'riskIndicator',
    style: 'gauge'
  },
  {
    id: 'category-chart',
    type: 'chart',
    title: { 'zh-TW': 'BMI 分類', 'en': 'BMI Categories' },
    position: { row: 2, col: 1, colSpan: 4 },
    chartType: 'doughnut',
    dataKey: 'categoryDistribution',
    height: 300,
    responsive: true
  }
];

// 複雜佈局配置
const complexComponents: DashboardComponentConfig[] = [
  {
    id: 'main-result',
    type: 'result-card',
    title: { 'zh-TW': 'BMI 指數', 'en': 'BMI Index' },
    position: { row: 1, col: 1, colSpan: 3 },
    valueKey: 'bmiValue',
    format: 'number',
    precision: 2,
    showUnit: true,
    colorScheme: 'risk-based',
    icon: 'scale',
    subtitle: { 'zh-TW': '身體質量指數', 'en': 'Body Mass Index' }
  },
  {
    id: 'health-score',
    type: 'result-card',
    title: { 'zh-TW': '健康評分', 'en': 'Health Score' },
    position: { row: 1, col: 4, colSpan: 2 },
    valueKey: 'healthScore',
    format: 'number',
    precision: 0,
    showUnit: false,
    colorScheme: 'default',
    icon: 'heart'
  },
  {
    id: 'risk-gauge',
    type: 'risk-indicator',
    title: { 'zh-TW': '風險等級', 'en': 'Risk Level' },
    position: { row: 2, col: 1, colSpan: 2 },
    riskKey: 'riskIndicator',
    style: 'gauge'
  },
  {
    id: 'risk-progress',
    type: 'risk-indicator',
    title: { 'zh-TW': '風險進度', 'en': 'Risk Progress' },
    position: { row: 2, col: 3, colSpan: 2 },
    riskKey: 'riskIndicator',
    style: 'progress'
  },
  {
    id: 'interpretation',
    type: 'text',
    title: { 'zh-TW': '結果解釋', 'en': 'Interpretation' },
    position: { row: 3, col: 1, colSpan: 4 },
    content: { 
      'zh-TW': '您的 BMI 指數在正常範圍內，建議維持目前的健康生活方式。',
      'en': 'Your BMI is within normal range. We recommend maintaining your current healthy lifestyle.'
    },
    textStyle: 'body',
    tag: 'p'
  },
  {
    id: 'divider',
    type: 'divider',
    position: { row: 4, col: 1, colSpan: 4 },
    style: 'solid',
    orientation: 'horizontal'
  },
  {
    id: 'category-chart',
    type: 'chart',
    title: { 'zh-TW': 'BMI 分類分布', 'en': 'BMI Category Distribution' },
    position: { row: 5, col: 1, colSpan: 4 },
    chartType: 'doughnut',
    dataKey: 'categoryDistribution',
    height: 350,
    responsive: true
  }
];

// 響應式組件配置
const responsiveComponents: DashboardComponentConfig[] = [
  {
    id: 'responsive-result',
    type: 'result-card',
    title: { 'zh-TW': 'BMI 指數', 'en': 'BMI Index' },
    position: { 
      row: 1, 
      col: 1, 
      colSpan: 2,
      responsive: {
        xs: { row: 1, col: 1, colSpan: 1 },
        sm: { row: 1, col: 1, colSpan: 2 },
        md: { row: 1, col: 1, colSpan: 2 },
        lg: { row: 1, col: 1, colSpan: 3 }
      }
    },
    valueKey: 'bmiValue',
    format: 'number',
    precision: 2,
    showUnit: true,
    colorScheme: 'risk-based'
  },
  {
    id: 'responsive-risk',
    type: 'risk-indicator',
    title: { 'zh-TW': '風險等級', 'en': 'Risk Level' },
    position: { 
      row: 1, 
      col: 3, 
      colSpan: 2,
      responsive: {
        xs: { row: 2, col: 1, colSpan: 1 },
        sm: { row: 1, col: 3, colSpan: 2 },
        md: { row: 1, col: 3, colSpan: 2 },
        lg: { row: 1, col: 4, colSpan: 2 }
      }
    },
    riskKey: 'riskIndicator',
    style: 'gauge'
  }
];

const meta: Meta<typeof Dashboard> = {
  title: 'Visualization/Dashboard',
  component: Dashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Dashboard 組件是一個強大的儀表板佈局系統，專為醫療計算機結果展示而設計。

## 主要特性

- **響應式佈局**: 支援 CSS Grid 響應式佈局，自動適應不同螢幕尺寸
- **組件位置配置**: 靈活的網格位置和跨度配置
- **JSON 驅動**: 完全基於配置的組件渲染系統
- **多種組件類型**: 支援結果卡片、風險指示器、圖表、文字、分隔線等
- **資料傳遞**: 組件間的資料傳遞和狀態管理
- **本地化支援**: 完整的多語言支援
- **自定義組件**: 支援自定義組件擴展

## 使用場景

- 醫療計算機結果展示
- 健康數據儀表板
- 風險評估報告
- 數據分析面板
        `
      }
    }
  },
  argTypes: {
    result: {
      description: '計算結果數據',
      control: { type: 'object' }
    },
    components: {
      description: '組件配置列表',
      control: { type: 'object' }
    },
    layout: {
      description: '佈局配置',
      control: { type: 'object' }
    },
    locale: {
      description: '當前語言',
      control: { type: 'select' },
      options: ['zh-TW', 'en']
    },
    loading: {
      description: '載入狀態',
      control: { type: 'boolean' }
    },
    error: {
      description: '錯誤訊息',
      control: { type: 'text' }
    }
  }
};

export default meta;
type Story = StoryObj<typeof Dashboard>;

// 基本使用
export const Basic: Story = {
  args: {
    result: mockCalculationResult,
    components: basicComponents,
    locale: 'zh-TW'
  }
};

// 複雜佈局
export const Complex: Story = {
  args: {
    result: mockCalculationResult,
    components: complexComponents,
    layout: {
      mode: 'grid',
      columns: { xs: 1, sm: 2, md: 3, lg: 4, xl: 6 },
      gap: 20,
      padding: 24
    },
    locale: 'zh-TW'
  }
};

// 響應式佈局
export const Responsive: Story = {
  args: {
    result: mockCalculationResult,
    components: responsiveComponents,
    layout: {
      mode: 'grid',
      columns: { xs: 1, sm: 2, md: 3, lg: 6 },
      gap: 16,
      padding: 16
    },
    locale: 'zh-TW'
  },
  parameters: {
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1200px', height: '800px' } }
      }
    }
  }
};

// 英文版本
export const English: Story = {
  args: {
    result: mockCalculationResult,
    components: basicComponents,
    locale: 'en'
  }
};

// 載入狀態
export const Loading: Story = {
  args: {
    result: mockCalculationResult,
    components: basicComponents,
    loading: true,
    locale: 'zh-TW'
  }
};

// 錯誤狀態
export const Error: Story = {
  args: {
    result: mockCalculationResult,
    components: basicComponents,
    error: '載入數據時發生錯誤，請稍後再試。',
    locale: 'zh-TW'
  }
};

// 空狀態
export const Empty: Story = {
  args: {
    result: mockCalculationResult,
    components: [],
    locale: 'zh-TW'
  }
};

// 自定義樣式
export const CustomStyle: Story = {
  args: {
    result: mockCalculationResult,
    components: basicComponents,
    layout: {
      mode: 'grid',
      columns: 4,
      gap: 24,
      padding: 32,
      minHeight: '500px'
    },
    className: 'custom-dashboard',
    style: {
      backgroundColor: '#f8fafc',
      borderRadius: '12px',
      border: '1px solid #e2e8f0'
    },
    locale: 'zh-TW'
  }
};

// 互動示例
export const Interactive: Story = {
  args: {
    result: mockCalculationResult,
    components: basicComponents,
    locale: 'zh-TW',
    onComponentClick: (componentId, component) => {
      console.log('Component clicked:', componentId, component);
      alert(`點擊了組件: ${componentId}`);
    },
    onDataChange: (componentId, data) => {
      console.log('Data changed:', componentId, data);
    }
  }
};

// 所有組件類型展示
export const AllComponentTypes: Story = {
  args: {
    result: {
      ...mockCalculationResult,
      visualizationData: {
        ...mockCalculationResult.visualizationData,
        customData: 'Custom component data'
      }
    },
    components: [
      {
        id: 'result-card-demo',
        type: 'result-card',
        title: { 'zh-TW': '結果卡片', 'en': 'Result Card' },
        position: { row: 1, col: 1, colSpan: 2 },
        valueKey: 'bmiValue',
        format: 'number',
        precision: 2,
        showUnit: true,
        colorScheme: 'risk-based',
        icon: 'scale'
      },
      {
        id: 'risk-indicator-demo',
        type: 'risk-indicator',
        title: { 'zh-TW': '風險指示器', 'en': 'Risk Indicator' },
        position: { row: 1, col: 3, colSpan: 2 },
        riskKey: 'riskIndicator',
        style: 'gauge'
      },
      {
        id: 'text-demo',
        type: 'text',
        title: { 'zh-TW': '文字組件', 'en': 'Text Component' },
        position: { row: 2, col: 1, colSpan: 4 },
        content: { 
          'zh-TW': '這是一個文字組件示例，可以顯示各種文字內容。',
          'en': 'This is a text component example that can display various text content.'
        },
        textStyle: 'body',
        tag: 'p'
      },
      {
        id: 'divider-demo',
        type: 'divider',
        position: { row: 3, col: 1, colSpan: 4 },
        style: 'solid',
        orientation: 'horizontal'
      },
      {
        id: 'chart-demo',
        type: 'chart',
        title: { 'zh-TW': '圖表組件', 'en': 'Chart Component' },
        position: { row: 4, col: 1, colSpan: 4 },
        chartType: 'doughnut',
        dataKey: 'categoryDistribution',
        height: 300,
        responsive: true
      }
    ],
    locale: 'zh-TW'
  }
};