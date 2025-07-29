import React from 'react';

export interface MedicalCardProps {
  /** 卡片標題 */
  title: string;
  /** 卡片副標題 */
  subtitle?: string;
  /** 卡片內容 */
  children: React.ReactNode;
  /** 卡片變體 */
  variant?: 'default' | 'primary' | 'warning' | 'error' | 'success';
  /** 是否顯示邊框 */
  bordered?: boolean;
  /** 是否可點擊 */
  clickable?: boolean;
  /** 點擊事件處理器 */
  onClick?: () => void;
  /** 自定義 CSS 類名 */
  className?: string;
}

const variantClasses = {
  default: 'border-medical-neutral-200 bg-white',
  primary: 'border-medical-primary-200 bg-medical-primary-50',
  warning: 'border-medical-warning-200 bg-medical-warning-50',
  error: 'border-medical-error-200 bg-medical-error-50',
  success: 'border-medical-success-200 bg-medical-success-50',
};

export const MedicalCard: React.FC<MedicalCardProps> = ({
  title,
  subtitle,
  children,
  variant = 'default',
  bordered = true,
  clickable = false,
  onClick,
  className = '',
}) => {
  const baseClasses = 'rounded-lg p-6 transition-all duration-200';
  const borderClasses = bordered ? 'border' : '';
  const clickableClasses = clickable 
    ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]' 
    : '';
  const variantClass = variantClasses[variant];

  const cardClasses = `${baseClasses} ${borderClasses} ${clickableClasses} ${variantClass} ${className}`.trim();

  return (
    <div 
      className={cardClasses}
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
    >
      <div className="medical-card-header">
        <h3 className="medical-card-title text-lg font-semibold text-medical-neutral-900">
          {title}
        </h3>
        {subtitle && (
          <p className="medical-card-subtitle text-sm text-medical-neutral-600 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      <div className="medical-card-content mt-4">
        {children}
      </div>
    </div>
  );
};

export default MedicalCard;