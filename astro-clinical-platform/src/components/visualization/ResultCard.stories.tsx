/**
 * ResultCard Storybook Stories
 * 
 * 展示 ResultCard 組件的各種使用場景和狀態，包括不同的數值格式、
 * 風險等級、尺寸和互動狀態。
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ResultCard } from './ResultCard';
import type { CalculationResult } from '../../types/calculator';

// 模擬計算結果資料
const mockCalculationResult: CalculationResult = {
  primaryValue: 24.2,
  primaryUnit: 'kg/m²',
  primaryLabel: { 'zh-TW': 'BMI 指數', 'en': 'BMI Index' },
  riskLevel: 'moderate',
  interpretation: {
    'zh-TW': '您的 BMI 指數為 24.2，屬於正常範圍',
    'en': 'Your BMI is 24.2, which is in the normal range'
  },
  secondaryValues: [
    {
      value: 70,
      unit: 'kg',
      label: { 'zh-TW': '體重', 'en': 'Weight' }
    },
    {
      value: 170,
      unit: 'cm',
      label: { 'zh-TW': '身高', 'en': 'Height' }
    }
  ]
};

// 自定義圖示組件
const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const ScaleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z"/>
    <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z"/>
  </svg>
);

const meta: Meta<typeof ResultCard> = {
  title: 'Visualization/ResultCard',
  component: ResultCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
ResultCard 是用於顯示醫療計算結果的核心組件。它支援多種數值格式、風險等級指示、
無障礙功能和響應式設計。

## 主要特性

- **多種數值格式**: 支援數字、百分比、貨幣等格式
- **風險等級指示**: 基於風險等級的顏色編碼
- **完整無障礙支援**: 符合 WCAG 2.1 AA 標準
- **響應式設計**: 支援多種螢幕尺寸
- **互動狀態**: 支援點擊、載入、錯誤等狀態
- **多語言支援**: 內建中英文支援

## 使用場景

- BMI 計算結果顯示
- 心血管風險評估
- 實驗室檢查數值
- 藥物劑量計算
- 生命體徵監測
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'number', min: 0, max: 1000, step: 0.1 },
      description: '要顯示的主要數值',
    },
    unit: {
      control: 'text',
      description: '數值的單位',
    },
    label: {
      control: 'text',
      description: '卡片的標題',
    },
    subtitle: {
      control: 'text',
      description: '卡片的副標題',
    },
    riskLevel: {
      control: { type: 'select' },
      options: ['low', 'moderate', 'high', 'critical'],
      description: '風險等級',
    },
    format: {
      control: { type: 'select' },
      options: ['number', 'percentage', 'currency', 'custom'],
      description: '數值格式',
    },
    precision: {
      control: { type: 'number', min: 0, max: 5 },
      description: '小數位數',
    },
    showUnit: {
      control: 'boolean',
      description: '是否顯示單位',
    },
    colorScheme: {
      control: { type: 'select' },
      options: ['default', 'risk-based', 'custom'],
      description: '顏色方案',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: '卡片尺寸',
    },
    clickable: {
      control: 'boolean',
      description: '是否可點擊',
    },
    loading: {
      control: 'boolean',
      description: '載入狀態',
    },
    error: {
      control: 'boolean',
      description: '錯誤狀態',
    },
  },
  args: {
    onClick: () => console.log('ResultCard clicked'),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基本使用
export const Default: Story = {
  args: {
    value: 24.2,
    unit: 'kg/m²',
    label: 'BMI 指數',
    subtitle: '身體質量指數',
  },
};

// 不同數值格式
export const NumberFormat: Story = {
  args: {
    value: 120.5,
    unit: 'mmHg',
    label: '收縮壓',
    format: 'number',
    precision: 1,
  },
};

export const PercentageFormat: Story = {
  args: {
    value: 0.85,
    label: '血氧飽和度',
    format: 'percentage',
    precision: 1,
  },
};

export const CurrencyFormat: Story = {
  args: {
    value: 1250,
    label: '檢查費用',
    format: 'currency',
    precision: 0,
  },
};

// 風險等級
export const LowRisk: Story = {
  args: {
    value: 18.5,
    unit: 'kg/m²',
    label: 'BMI 指數',
    subtitle: '體重正常',
    riskLevel: 'low',
    colorScheme: 'risk-based',
    icon: <ScaleIcon />,
  },
};

export const ModerateRisk: Story = {
  args: {
    value: 27.3,
    unit: 'kg/m²',
    label: 'BMI 指數',
    subtitle: '輕度過重',
    riskLevel: 'moderate',
    colorScheme: 'risk-based',
    icon: <ScaleIcon />,
  },
};

export const HighRisk: Story = {
  args: {
    value: 32.1,
    unit: 'kg/m²',
    label: 'BMI 指數',
    subtitle: '肥胖',
    riskLevel: 'high',
    colorScheme: 'risk-based',
    icon: <ScaleIcon />,
  },
};

export const CriticalRisk: Story = {
  args: {
    value: 180,
    unit: 'mmHg',
    label: '收縮壓',
    subtitle: '高血壓危象',
    riskLevel: 'critical',
    colorScheme: 'risk-based',
    icon: <HeartIcon />,
  },
};

// 不同尺寸
export const SmallSize: Story = {
  args: {
    value: 72,
    unit: 'bpm',
    label: '心率',
    size: 'sm',
    icon: <HeartIcon />,
  },
};

export const MediumSize: Story = {
  args: {
    value: 72,
    unit: 'bpm',
    label: '心率',
    size: 'md',
    icon: <HeartIcon />,
  },
};

export const LargeSize: Story = {
  args: {
    value: 72,
    unit: 'bpm',
    label: '心率',
    size: 'lg',
    icon: <HeartIcon />,
  },
};

// 互動狀態
export const Clickable: Story = {
  args: {
    value: 24.2,
    unit: 'kg/m²',
    label: 'BMI 指數',
    subtitle: '點擊查看詳細分析',
    clickable: true,
    icon: <ScaleIcon />,
  },
};

export const Loading: Story = {
  args: {
    value: 0,
    label: '計算中',
    loading: true,
    loadingText: '正在計算 BMI...',
  },
};

export const Error: Story = {
  args: {
    value: 0,
    label: 'BMI 指數',
    error: true,
    errorMessage: '計算失敗，請檢查輸入數據',
  },
};

// 完整的醫療數據展示
export const CompleteResult: Story = {
  args: {
    value: 24.2,
    unit: 'kg/m²',
    label: 'BMI 指數',
    subtitle: '身體質量指數評估',
    riskLevel: 'low',
    colorScheme: 'risk-based',
    icon: <ScaleIcon />,
    clickable: true,
    result: mockCalculationResult,
  },
};

// 心血管風險評估
export const CardiovascularRisk: Story = {
  args: {
    value: 15.2,
    unit: '%',
    label: '10年心血管風險',
    subtitle: 'Framingham 風險評分',
    riskLevel: 'moderate',
    colorScheme: 'risk-based',
    format: 'number',
    precision: 1,
    icon: <HeartIcon />,
    clickable: true,
  },
};

// 實驗室檢查結果
export const LabResult: Story = {
  args: {
    value: 95,
    unit: 'mg/dL',
    label: '空腹血糖',
    subtitle: '正常範圍: 70-100 mg/dL',
    riskLevel: 'low',
    colorScheme: 'risk-based',
    format: 'number',
    precision: 0,
  },
};

// 藥物劑量計算
export const MedicationDose: Story = {
  args: {
    value: 750,
    unit: 'mg',
    label: '建議劑量',
    subtitle: '每日三次，飯後服用',
    format: 'number',
    precision: 0,
    clickable: true,
  },
};

// 生命體徵監測
export const VitalSigns: Story = {
  args: {
    value: 36.8,
    unit: '°C',
    label: '體溫',
    subtitle: '正常體溫',
    riskLevel: 'low',
    colorScheme: 'risk-based',
    format: 'number',
    precision: 1,
  },
};

// 多語言支援
export const EnglishLocale: Story = {
  args: {
    value: 24.2,
    unit: 'kg/m²',
    label: { 'zh-TW': 'BMI 指數', 'en': 'BMI Index' },
    subtitle: { 'zh-TW': '身體質量指數', 'en': 'Body Mass Index' },
    locale: 'en',
    riskLevel: 'low',
    colorScheme: 'risk-based',
  },
};

// 無單位顯示
export const WithoutUnit: Story = {
  args: {
    value: 8.5,
    label: 'CHA₂DS₂-VASc 評分',
    subtitle: '中風風險評估',
    showUnit: false,
    riskLevel: 'high',
    colorScheme: 'risk-based',
    format: 'number',
    precision: 0,
  },
};

// 自定義樣式
export const CustomStyle: Story = {
  args: {
    value: 98.6,
    unit: '°F',
    label: '體溫',
    subtitle: '華氏溫度',
    className: 'border-2 border-blue-300 bg-blue-50',
    style: {
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
    },
  },
};

// 組合展示 - 生命體徵儀表板
export const VitalSignsDashboard: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 max-w-2xl">
      <ResultCard
        value={120}
        unit="mmHg"
        label="收縮壓"
        riskLevel="low"
        colorScheme="risk-based"
        size="sm"
      />
      <ResultCard
        value={80}
        unit="mmHg"
        label="舒張壓"
        riskLevel="low"
        colorScheme="risk-based"
        size="sm"
      />
      <ResultCard
        value={72}
        unit="bpm"
        label="心率"
        riskLevel="low"
        colorScheme="risk-based"
        size="sm"
        icon={<HeartIcon />}
      />
      <ResultCard
        value={36.5}
        unit="°C"
        label="體溫"
        riskLevel="low"
        colorScheme="risk-based"
        size="sm"
        format="number"
        precision={1}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '生命體徵監測儀表板，展示多個 ResultCard 組件的組合使用。',
      },
    },
  },
};

// 響應式展示
export const ResponsiveLayout: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ResultCard
          value={24.2}
          unit="kg/m²"
          label="BMI 指數"
          subtitle="身體質量指數"
          riskLevel="low"
          colorScheme="risk-based"
          clickable
        />
        <ResultCard
          value={15.2}
          unit="%"
          label="體脂率"
          subtitle="身體脂肪百分比"
          riskLevel="moderate"
          colorScheme="risk-based"
          format="number"
          precision={1}
          clickable
        />
        <ResultCard
          value={1850}
          unit="kcal"
          label="基礎代謝率"
          subtitle="每日消耗熱量"
          format="number"
          precision={0}
          clickable
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '響應式佈局展示，在不同螢幕尺寸下自動調整排列。',
      },
    },
  },
};

// 無障礙功能展示
export const AccessibilityFeatures: Story = {
  args: {
    value: 24.2,
    unit: 'kg/m²',
    label: 'BMI 指數',
    subtitle: '身體質量指數計算結果',
    riskLevel: 'low',
    colorScheme: 'risk-based',
    clickable: true,
    'aria-label': 'BMI 計算結果: 24.2 kg/m²，風險等級為低風險',
    'aria-describedby': 'bmi-description',
  },
  render: (args) => (
    <div>
      <ResultCard {...args} />
      <p id="bmi-description" className="mt-2 text-sm text-gray-600">
        BMI 指數 24.2 表示您的體重在正常範圍內。建議維持目前的生活方式。
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '展示 ResultCard 的無障礙功能，包括 ARIA 標籤和描述。',
      },
    },
  },
};