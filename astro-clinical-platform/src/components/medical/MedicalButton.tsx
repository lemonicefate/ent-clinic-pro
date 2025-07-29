import React from 'react';

export interface MedicalButtonProps {
  /** 按鈕文字 */
  children: React.ReactNode;
  /** 按鈕變體 */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';
  /** 按鈕尺寸 */
  size?: 'small' | 'medium' | 'large';
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否載入中 */
  loading?: boolean;
  /** 是否為全寬度 */
  fullWidth?: boolean;
  /** 按鈕類型 */
  type?: 'button' | 'submit' | 'reset';
  /** 點擊事件處理器 */
  onClick?: () => void;
  /** 自定義 CSS 類名 */
  className?: string;
  /** 圖標（可選） */
  icon?: React.ReactNode;
  /** 圖標位置 */
  iconPosition?: 'left' | 'right';
}

const variantClasses = {
  primary: 'bg-medical-primary-600 text-white hover:bg-medical-primary-700 focus:ring-medical-primary-500',
  secondary: 'bg-medical-neutral-100 text-medical-neutral-700 hover:bg-medical-neutral-200 focus:ring-medical-neutral-500',
  success: 'bg-medical-success-600 text-white hover:bg-medical-success-700 focus:ring-medical-success-500',
  warning: 'bg-medical-warning-600 text-white hover:bg-medical-warning-700 focus:ring-medical-warning-500',
  error: 'bg-medical-error-600 text-white hover:bg-medical-error-700 focus:ring-medical-error-500',
  outline: 'border-2 border-medical-primary-600 text-medical-primary-600 hover:bg-medical-primary-50 focus:ring-medical-primary-500',
};

const sizeClasses = {
  small: 'px-3 py-1.5 text-sm',
  medium: 'px-4 py-2 text-base',
  large: 'px-6 py-3 text-lg',
};

const disabledClasses = 'opacity-50 cursor-not-allowed';

export const MedicalButton: React.FC<MedicalButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  type = 'button',
  onClick,
  className = '',
  icon,
  iconPosition = 'left',
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantClass = variantClasses[variant];
  const sizeClass = sizeClasses[size];
  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = (disabled || loading) ? disabledClasses : '';

  const buttonClasses = `${baseClasses} ${variantClass} ${sizeClass} ${widthClass} ${disabledClass} ${className}`.trim();

  const LoadingSpinner = () => (
    <svg 
      className="animate-spin -ml-1 mr-2 h-4 w-4" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <LoadingSpinner />}
      {!loading && icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
};

export default MedicalButton;