/**
 * RiskIndicator Storybook Stories
 * 
 * 展示 RiskIndicator 組件的各種使用場景，包括不同的樣式、尺寸、
 * 動畫效果和風險等級配置。
 */

import type { Meta, StoryObj } from '@storybook/react';
import { RiskIndicator } from './RiskIndicator';
import type { RiskThreshold } from '../../types/calculator';

// 自定義風險閾值配置
const customThresholds: RiskThreshold[] = [
  {
    min: 0,
    max: 20,
    level: 'low',
    color: '#10b981',
    label: { 'zh-TW': '安全', 'en': 'Safe' }
  },
  {
    min: 20,
    max: 40,
    level: 'moderate',
    color: '#f59e0b',
    label: { 'zh-TW': '注意', 'en': 'Caution' }
  },
  {
    min: 40,
    max: 70,
    level: 'high',
    color: '#ef4444',
    label: { 'zh-TW': '警告', 'en': 'Warning' }
  },
  {
    min: 70,
    max: 100,
    level: 'critical',
    color: '#dc2626',
    label: { 'zh-TW': '危險', 'en': 'Danger' }
  }
];

// 心血管風險閾值
const cardiovascularThresholds: RiskThreshold[] = [
  {
    min: 0,
    max: 5,
    level: 'low',
    color: '#22c55e',
    label: { 'zh-TW': '低風險', 'en': 'Low Risk' }
  },
  {
    min: 5,
    max: 10,
    level: 'moderate',
    color: '#f59e0b',
    label: { 'zh-TW': '中等風險', 'en': 'Moderate Risk' }
  },
  {
    min: 10,
    max: 20,
    level: 'high',
    color: '#ef4444',
    label: { 'zh-TW': '高風險', 'en': 'High Risk' }
  },
  {
    min: 20,
    max: 100,
    level: 'critical',
    color: '#dc2626',
    label: { 'zh-TW': '極高風險', 'en': 'Very High Risk' }
  }
];

const meta: Meta<typeof RiskIndicator> = {
  title: 'Visualization/RiskIndicator',
  component: RiskIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
RiskIndicator 是用於顯示醫療風險等級的視覺化組件。它提供多種展示樣式，
包括徽章、進度條、儀表盤和交通燈模式，具備完整的動畫效果和無障礙支援。

## 主要特性

- **多種視覺樣式**: Badge、Progress、Gauge、Traffic Light
- **動畫效果**: 支援多種動畫類型和自定義持續時間
- **可配置閾值**: 支援自定義風險等級和顏色配置
- **完整無障礙支援**: 符合 WCAG 2.1 AA 標準
- **響應式設計**: 支援多種尺寸和螢幕適配
- **多語言支援**: 內建中英文支援

## 使用場景

- 心血管風險評估
- BMI 風險等級指示
- 血壓分級顯示
- 實驗室檢查結果風險
- 藥物副作用風險
- 手術風險評估
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    riskLevel: {
      control: { type: 'select' },
      options: ['low', 'moderate', 'high', 'critical'],
      description: '風險等級',
    },
    riskValue: {
      control: { type: 'number', min: 0, max: 100, step: 1 },
      description: '風險數值（0-100%）',
    },
    style: {
      control: { type: 'select' },
      options: ['badge', 'progress', 'gauge', 'traffic-light'],
      description: '指示器樣式',
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: '指示器尺寸',
    },
    showLabel: {
      control: 'boolean',
      description: '是否顯示標籤',
    },
    showValue: {
      control: 'boolean',
      description: '是否顯示數值',
    },
    animation: {
      control: { type: 'select' },
      options: ['none', 'pulse', 'bounce', 'fade-in', 'scale'],
      description: '動畫類型',
    },
    interactive: {
      control: 'boolean',
      description: '是否可互動',
    },
  },
  args: {
    onClick: () => console.log('RiskIndicator clicked'),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基本使用 - Badge 樣式
export const Default: Story = {
  args: {
    riskLevel: 'moderate',
    style: 'badge',
  },
};

// 不同風險等級 - Badge 樣式
export const LowRiskBadge: Story = {
  args: {
    riskLevel: 'low',
    style: 'badge',
    showLabel: true,
  },
};

export const ModerateRiskBadge: Story = {
  args: {
    riskLevel: 'moderate',
    style: 'badge',
    showLabel: true,
  },
};

export const HighRiskBadge: Story = {
  args: {
    riskLevel: 'high',
    style: 'badge',
    showLabel: true,
  },
};

export const CriticalRiskBadge: Story = {
  args: {
    riskLevel: 'critical',
    style: 'badge',
    showLabel: true,
  },
};

// Progress 樣式
export const ProgressLowRisk: Story = {
  args: {
    riskLevel: 'low',
    riskValue: 15,
    style: 'progress',
    showLabel: true,
    showValue: true,
  },
};

export const ProgressModerateRisk: Story = {
  args: {
    riskLevel: 'moderate',
    riskValue: 35,
    style: 'progress',
    showLabel: true,
    showValue: true,
  },
};

export const ProgressHighRisk: Story = {
  args: {
    riskLevel: 'high',
    riskValue: 65,
    style: 'progress',
    showLabel: true,
    showValue: true,
  },
};

export const ProgressCriticalRisk: Story = {
  args: {
    riskLevel: 'critical',
    riskValue: 85,
    style: 'progress',
    showLabel: true,
    showValue: true,
  },
};

// Gauge 樣式
export const GaugeLowRisk: Story = {
  args: {
    riskLevel: 'low',
    riskValue: 12,
    style: 'gauge',
    showLabel: true,
    showValue: true,
  },
};

export const GaugeModerateRisk: Story = {
  args: {
    riskLevel: 'moderate',
    riskValue: 38,
    style: 'gauge',
    showLabel: true,
    showValue: true,
  },
};

export const GaugeHighRisk: Story = {
  args: {
    riskLevel: 'high',
    riskValue: 68,
    style: 'gauge',
    showLabel: true,
    showValue: true,
  },
};

export const GaugeCriticalRisk: Story = {
  args: {
    riskLevel: 'critical',
    riskValue: 92,
    style: 'gauge',
    showLabel: true,
    showValue: true,
  },
};

// Traffic Light 樣式
export const TrafficLightLow: Story = {
  args: {
    riskLevel: 'low',
    style: 'traffic-light',
    showLabel: true,
  },
};

export const TrafficLightModerate: Story = {
  args: {
    riskLevel: 'moderate',
    style: 'traffic-light',
    showLabel: true,
  },
};

export const TrafficLightHigh: Story = {
  args: {
    riskLevel: 'high',
    style: 'traffic-light',
    showLabel: true,
  },
};

export const TrafficLightCritical: Story = {
  args: {
    riskLevel: 'critical',
    style: 'traffic-light',
    showLabel: true,
  },
};

// 不同尺寸
export const SizeComparison: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <RiskIndicator riskLevel="moderate" style="badge" size="xs" showLabel />
        <RiskIndicator riskLevel="moderate" style="badge" size="sm" showLabel />
        <RiskIndicator riskLevel="moderate" style="badge" size="md" showLabel />
        <RiskIndicator riskLevel="moderate" style="badge" size="lg" showLabel />
        <RiskIndicator riskLevel="moderate" style="badge" size="xl" showLabel />
      </div>
      <div className="flex items-center space-x-4">
        <RiskIndicator riskLevel="high" riskValue={65} style="gauge" size="xs" showValue />
        <RiskIndicator riskLevel="high" riskValue={65} style="gauge" size="sm" showValue />
        <RiskIndicator riskLevel="high" riskValue={65} style="gauge" size="md" showValue />
        <RiskIndicator riskLevel="high" riskValue={65} style="gauge" size="lg" showValue />
        <RiskIndicator riskLevel="high" riskValue={65} style="gauge" size="xl" showValue />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '展示不同尺寸的風險指示器效果。',
      },
    },
  },
};

// 動畫效果
export const AnimationPulse: Story = {
  args: {
    riskLevel: 'critical',
    style: 'badge',
    animation: 'pulse',
    showLabel: true,
  },
};

export const AnimationBounce: Story = {
  args: {
    riskLevel: 'high',
    style: 'gauge',
    riskValue: 75,
    animation: 'bounce',
    showValue: true,
    showLabel: true,
  },
};

export const AnimationFadeIn: Story = {
  args: {
    riskLevel: 'moderate',
    style: 'progress',
    riskValue: 40,
    animation: 'fade-in',
    showValue: true,
    showLabel: true,
  },
};

export const AnimationScale: Story = {
  args: {
    riskLevel: 'low',
    style: 'traffic-light',
    animation: 'scale',
    showLabel: true,
  },
};

// 自定義閾值配置
export const CustomThresholds: Story = {
  args: {
    riskLevel: 'moderate',
    riskValue: 30,
    style: 'progress',
    thresholds: customThresholds,
    showLabel: true,
    showValue: true,
  },
};

// 心血管風險評估
export const CardiovascularRisk: Story = {
  args: {
    riskLevel: 'high',
    riskValue: 15,
    style: 'gauge',
    thresholds: cardiovascularThresholds,
    showLabel: true,
    showValue: true,
    size: 'lg',
  },
};

// 互動式指示器
export const Interactive: Story = {
  args: {
    riskLevel: 'moderate',
    riskValue: 35,
    style: 'gauge',
    showLabel: true,
    showValue: true,
    interactive: true,
    'aria-label': '點擊查看風險詳情',
  },
};

// 多語言支援
export const EnglishLocale: Story = {
  args: {
    riskLevel: 'high',
    riskValue: 70,
    style: 'progress',
    locale: 'en',
    showLabel: true,
    showValue: true,
  },
};

// 醫療場景應用
export const BMIRiskAssessment: Story = {
  render: () => (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800">BMI 風險評估</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600 mb-2">BMI: 18.2 kg/m²</p>
          <RiskIndicator
            riskLevel="moderate"
            riskValue={18}
            style="progress"
            showLabel
            showValue
            thresholds={[
              { min: 0, max: 18.5, level: 'moderate', color: '#3b82f6', label: { 'zh-TW': '體重過輕', 'en': 'Underweight' } },
              { min: 18.5, max: 25, level: 'low', color: '#22c55e', label: { 'zh-TW': '正常範圍', 'en': 'Normal' } },
              { min: 25, max: 30, level: 'moderate', color: '#f59e0b', label: { 'zh-TW': '體重過重', 'en': 'Overweight' } },
              { min: 30, max: 100, level: 'high', color: '#ef4444', label: { 'zh-TW': '肥胖', 'en': 'Obese' } }
            ]}
          />
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600 mb-2">BMI: 32.1 kg/m²</p>
          <RiskIndicator
            riskLevel="high"
            riskValue={85}
            style="gauge"
            showLabel
            showValue
            thresholds={[
              { min: 0, max: 18.5, level: 'moderate', color: '#3b82f6', label: { 'zh-TW': '體重過輕', 'en': 'Underweight' } },
              { min: 18.5, max: 25, level: 'low', color: '#22c55e', label: { 'zh-TW': '正常範圍', 'en': 'Normal' } },
              { min: 25, max: 30, level: 'moderate', color: '#f59e0b', label: { 'zh-TW': '體重過重', 'en': 'Overweight' } },
              { min: 30, max: 100, level: 'high', color: '#ef4444', label: { 'zh-TW': '肥胖', 'en': 'Obese' } }
            ]}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'BMI 風險評估的實際應用場景，展示不同 BMI 值的風險指示。',
      },
    },
  },
};

export const BloodPressureRisk: Story = {
  render: () => (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800">血壓風險評估</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600 mb-2">收縮壓: 125 mmHg</p>
          <RiskIndicator
            riskLevel="moderate"
            riskValue={30}
            style="traffic-light"
            showLabel
            thresholds={[
              { min: 0, max: 25, level: 'low', color: '#22c55e', label: { 'zh-TW': '正常', 'en': 'Normal' } },
              { min: 25, max: 50, level: 'moderate', color: '#f59e0b', label: { 'zh-TW': '前期高血壓', 'en': 'Prehypertension' } },
              { min: 50, max: 75, level: 'high', color: '#ef4444', label: { 'zh-TW': '高血壓', 'en': 'Hypertension' } },
              { min: 75, max: 100, level: 'critical', color: '#dc2626', label: { 'zh-TW': '高血壓危象', 'en': 'Hypertensive Crisis' } }
            ]}
          />
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600 mb-2">收縮壓: 185 mmHg</p>
          <RiskIndicator
            riskLevel="critical"
            riskValue={95}
            style="badge"
            showLabel
            animation="pulse"
            thresholds={[
              { min: 0, max: 25, level: 'low', color: '#22c55e', label: { 'zh-TW': '正常', 'en': 'Normal' } },
              { min: 25, max: 50, level: 'moderate', color: '#f59e0b', label: { 'zh-TW': '前期高血壓', 'en': 'Prehypertension' } },
              { min: 50, max: 75, level: 'high', color: '#ef4444', label: { 'zh-TW': '高血壓', 'en': 'Hypertension' } },
              { min: 75, max: 100, level: 'critical', color: '#dc2626', label: { 'zh-TW': '高血壓危象', 'en': 'Hypertensive Crisis' } }
            ]}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '血壓風險評估的實際應用，展示不同血壓值對應的風險等級。',
      },
    },
  },
};

// 樣式組合展示
export const StyleComparison: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-md font-medium mb-3">Badge 樣式</h4>
        <div className="flex space-x-4">
          <RiskIndicator riskLevel="low" style="badge" showLabel />
          <RiskIndicator riskLevel="moderate" style="badge" showLabel />
          <RiskIndicator riskLevel="high" style="badge" showLabel />
          <RiskIndicator riskLevel="critical" style="badge" showLabel />
        </div>
      </div>
      
      <div>
        <h4 className="text-md font-medium mb-3">Progress 樣式</h4>
        <div className="space-y-2 max-w-md">
          <RiskIndicator riskLevel="low" riskValue={15} style="progress" showLabel showValue />
          <RiskIndicator riskLevel="moderate" riskValue={35} style="progress" showLabel showValue />
          <RiskIndicator riskLevel="high" riskValue={65} style="progress" showLabel showValue />
          <RiskIndicator riskLevel="critical" riskValue={85} style="progress" showLabel showValue />
        </div>
      </div>
      
      <div>
        <h4 className="text-md font-medium mb-3">Gauge 樣式</h4>
        <div className="flex space-x-4">
          <RiskIndicator riskLevel="low" riskValue={15} style="gauge" showValue size="sm" />
          <RiskIndicator riskLevel="moderate" riskValue={35} style="gauge" showValue size="sm" />
          <RiskIndicator riskLevel="high" riskValue={65} style="gauge" showValue size="sm" />
          <RiskIndicator riskLevel="critical" riskValue={85} style="gauge" showValue size="sm" />
        </div>
      </div>
      
      <div>
        <h4 className="text-md font-medium mb-3">Traffic Light 樣式</h4>
        <div className="flex space-x-4">
          <RiskIndicator riskLevel="low" style="traffic-light" showLabel />
          <RiskIndicator riskLevel="moderate" style="traffic-light" showLabel />
          <RiskIndicator riskLevel="high" style="traffic-light" showLabel />
          <RiskIndicator riskLevel="critical" style="traffic-light" showLabel />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '展示所有風險指示器樣式的對比效果。',
      },
    },
  },
};

// 無障礙功能展示
export const AccessibilityFeatures: Story = {
  args: {
    riskLevel: 'high',
    riskValue: 75,
    style: 'gauge',
    showLabel: true,
    showValue: true,
    interactive: true,
    'aria-label': '高風險警告：風險值為 75%，建議立即諮詢醫師',
    'aria-describedby': 'risk-description',
  },
  render: (args) => (
    <div>
      <RiskIndicator {...args} />
      <p id="risk-description" className="mt-2 text-sm text-gray-600">
        當前風險等級為高風險，建議立即採取預防措施並諮詢專業醫師。
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '展示 RiskIndicator 的無障礙功能，包括 ARIA 標籤和描述。',
      },
    },
  },
};