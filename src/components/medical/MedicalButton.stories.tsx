import type { Meta, StoryObj } from '@storybook/react';
import { MedicalButton } from './MedicalButton';

// 簡單的圖標組件用於示例
const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 21H5C4.45 21 4 20.55 4 20V4C4 3.45 4.45 3 5 3H16L20 7V20C20 20.55 19.55 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const meta: Meta<typeof MedicalButton> = {
  title: 'Medical/MedicalButton',
  component: MedicalButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '醫療平台的按鈕組件，提供多種變體、尺寸和狀態，專為醫療應用場景設計。',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'success', 'warning', 'error', 'outline'],
      description: '按鈕的視覺變體',
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
      description: '按鈕尺寸',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用按鈕',
    },
    loading: {
      control: 'boolean',
      description: '是否顯示載入狀態',
    },
    fullWidth: {
      control: 'boolean',
      description: '是否為全寬度',
    },
    iconPosition: {
      control: { type: 'select' },
      options: ['left', 'right'],
      description: '圖標位置',
    },
  },
  args: {
    onClick: () => console.log('Medical button clicked'),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: '主要按鈕',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: '次要按鈕',
    variant: 'secondary',
  },
};

export const Success: Story = {
  args: {
    children: '保存成功',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    children: '警告操作',
    variant: 'warning',
  },
};

export const Error: Story = {
  args: {
    children: '刪除數據',
    variant: 'error',
  },
};

export const Outline: Story = {
  args: {
    children: '輪廓按鈕',
    variant: 'outline',
  },
};

export const Small: Story = {
  args: {
    children: '小按鈕',
    size: 'small',
  },
};

export const Large: Story = {
  args: {
    children: '大按鈕',
    size: 'large',
  },
};

export const WithIcon: Story = {
  args: {
    children: '保存患者信息',
    icon: <SaveIcon />,
    iconPosition: 'left',
  },
};

export const WithRightIcon: Story = {
  args: {
    children: '添加新患者',
    icon: <PlusIcon />,
    iconPosition: 'right',
  },
};

export const Loading: Story = {
  args: {
    children: '正在保存...',
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: '禁用按鈕',
    disabled: true,
  },
};

export const FullWidth: Story = {
  args: {
    children: '全寬度按鈕',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};

// 醫療場景示例
export const SavePatientData: Story = {
  args: {
    children: '保存患者數據',
    variant: 'primary',
    icon: <SaveIcon />,
    size: 'medium',
  },
};

export const EmergencyAction: Story = {
  args: {
    children: '緊急呼叫',
    variant: 'error',
    size: 'large',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};

export const AddMedication: Story = {
  args: {
    children: '添加藥物',
    variant: 'success',
    icon: <PlusIcon />,
    iconPosition: 'left',
  },
};

export const ProcessingPayment: Story = {
  args: {
    children: '處理付款中',
    variant: 'primary',
    loading: true,
    disabled: true,
  },
};

// 按鈕組合示例
export const ButtonGroup: Story = {
  render: () => (
    <div className="flex space-x-3">
      <MedicalButton variant="outline">取消</MedicalButton>
      <MedicalButton variant="primary">確認</MedicalButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '常見的按鈕組合，用於確認對話框或表單操作。',
      },
    },
  },
};

export const MedicalActions: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex space-x-3">
        <MedicalButton variant="primary" icon={<SaveIcon />}>
          保存病歷
        </MedicalButton>
        <MedicalButton variant="success" icon={<PlusIcon />}>
          新增處方
        </MedicalButton>
      </div>
      <div className="flex space-x-3">
        <MedicalButton variant="warning" size="small">
          標記異常
        </MedicalButton>
        <MedicalButton variant="error" size="small">
          刪除記錄
        </MedicalButton>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '醫療應用中常見的操作按鈕組合。',
      },
    },
  },
};