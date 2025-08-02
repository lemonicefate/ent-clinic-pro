import type { Meta, StoryObj } from '@storybook/react';
import { MedicalCard } from './MedicalCard';

const meta: Meta<typeof MedicalCard> = {
  title: 'Medical/MedicalCard',
  component: MedicalCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: '醫療平台的卡片組件，用於顯示醫療信息、患者數據或其他重要內容。支援多種變體和交互狀態。',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'primary', 'warning', 'error', 'success'],
      description: '卡片的視覺變體',
    },
    bordered: {
      control: 'boolean',
      description: '是否顯示邊框',
    },
    clickable: {
      control: 'boolean',
      description: '是否可點擊',
    },
    title: {
      control: 'text',
      description: '卡片標題',
    },
    subtitle: {
      control: 'text',
      description: '卡片副標題',
    },
  },
  args: {
    onClick: () => console.log('Medical card clicked'),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: '患者基本信息',
    subtitle: '最後更新：2024年1月26日',
    children: (
      <div className="space-y-2">
        <p><strong>姓名：</strong>張三</p>
        <p><strong>年齡：</strong>45歲</p>
        <p><strong>性別：</strong>男</p>
        <p><strong>血型：</strong>A型</p>
      </div>
    ),
  },
};

export const Primary: Story = {
  args: {
    title: '重要提醒',
    subtitle: '需要立即關注',
    variant: 'primary',
    children: (
      <div>
        <p>患者需要在24小時內進行複診，請及時安排預約。</p>
      </div>
    ),
  },
};

export const Warning: Story = {
  args: {
    title: '藥物過敏警告',
    subtitle: '過敏史記錄',
    variant: 'warning',
    children: (
      <div className="space-y-2">
        <p><strong>過敏藥物：</strong>青黴素</p>
        <p><strong>過敏反應：</strong>皮疹、呼吸困難</p>
        <p><strong>記錄日期：</strong>2023年8月15日</p>
      </div>
    ),
  },
};

export const Error: Story = {
  args: {
    title: '緊急狀況',
    subtitle: '需要立即處理',
    variant: 'error',
    children: (
      <div>
        <p>患者血壓異常升高，收縮壓180mmHg，舒張壓110mmHg，需要緊急處理。</p>
      </div>
    ),
  },
};

export const Success: Story = {
  args: {
    title: '治療成功',
    subtitle: '康復進展良好',
    variant: 'success',
    children: (
      <div className="space-y-2">
        <p>患者手術後恢復良好，各項指標正常。</p>
        <p><strong>下次複診：</strong>2024年2月10日</p>
      </div>
    ),
  },
};

export const Clickable: Story = {
  args: {
    title: '點擊查看詳情',
    subtitle: '患者完整病歷',
    clickable: true,
    children: (
      <div>
        <p>點擊此卡片查看患者的完整醫療記錄和治療歷史。</p>
      </div>
    ),
  },
};

export const WithoutBorder: Story = {
  args: {
    title: '無邊框卡片',
    subtitle: '簡潔設計',
    bordered: false,
    children: (
      <div>
        <p>這是一個沒有邊框的卡片，適用於需要更簡潔視覺效果的場景。</p>
      </div>
    ),
  },
};

export const MedicalCalculator: Story = {
  args: {
    title: 'BMI 計算器',
    subtitle: '身體質量指數評估',
    variant: 'primary',
    clickable: true,
    children: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="medical-label">身高 (cm)</label>
            <input 
              type="number" 
              className="medical-input" 
              placeholder="170" 
              readOnly
            />
          </div>
          <div>
            <label className="medical-label">體重 (kg)</label>
            <input 
              type="number" 
              className="medical-input" 
              placeholder="70" 
              readOnly
            />
          </div>
        </div>
        <div className="bg-medical-primary-100 p-3 rounded">
          <p className="text-sm"><strong>BMI：</strong>24.2</p>
          <p className="text-sm"><strong>評估：</strong>正常範圍</p>
        </div>
      </div>
    ),
  },
};

export const PatientVitals: Story = {
  args: {
    title: '生命體徵監測',
    subtitle: '實時數據',
    children: (
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-medical-success-100 rounded">
          <div className="text-2xl font-bold text-medical-success-700">120/80</div>
          <div className="text-sm text-medical-success-600">血壓 (mmHg)</div>
        </div>
        <div className="text-center p-3 bg-medical-primary-100 rounded">
          <div className="text-2xl font-bold text-medical-primary-700">72</div>
          <div className="text-sm text-medical-primary-600">心率 (bpm)</div>
        </div>
        <div className="text-center p-3 bg-medical-accent-100 rounded">
          <div className="text-2xl font-bold text-medical-accent-700">36.5°C</div>
          <div className="text-sm text-medical-accent-600">體溫</div>
        </div>
        <div className="text-center p-3 bg-medical-neutral-100 rounded">
          <div className="text-2xl font-bold text-medical-neutral-700">98%</div>
          <div className="text-sm text-medical-neutral-600">血氧飽和度</div>
        </div>
      </div>
    ),
  },
};