import type { Meta, StoryObj } from '@storybook/react';

// 簡單的按鈕組件用於測試 Storybook 配置
interface ButtonProps {
  primary?: boolean;
  backgroundColor?: string;
  size?: 'small' | 'medium' | 'large';
  label: string;
  onClick?: () => void;
}

const Button = ({
  primary = false,
  size = 'medium',
  backgroundColor,
  label,
  ...props
}: ButtonProps) => {
  const mode = primary ? 'btn-primary' : 'btn-secondary';
  const sizeClass = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  }[size];

  return (
    <button
      type="button"
      className={`${mode} ${sizeClass} rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2`}
      style={{ backgroundColor }}
      {...props}
    >
      {label}
    </button>
  );
};

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '醫療平台的基礎按鈕組件，支援多種樣式和尺寸。',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    backgroundColor: { control: 'color' },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
    },
  },
  args: { onClick: () => console.log('Button clicked') },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    primary: true,
    label: '主要按鈕',
  },
};

export const Secondary: Story = {
  args: {
    label: '次要按鈕',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    label: '大型按鈕',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    label: '小型按鈕',
  },
};

export const MedicalPrimary: Story = {
  args: {
    primary: true,
    label: '醫療主色按鈕',
    backgroundColor: '#2563eb',
  },
};

export const MedicalSuccess: Story = {
  args: {
    label: '成功按鈕',
    backgroundColor: '#16a34a',
  },
};

export const MedicalWarning: Story = {
  args: {
    label: '警告按鈕',
    backgroundColor: '#d97706',
  },
};

export const MedicalError: Story = {
  args: {
    label: '錯誤按鈕',
    backgroundColor: '#dc2626',
  },
};