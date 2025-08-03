/**
 * 計算機配置類型定義
 */

import { LocalizedString, FieldType, CalculatorStatus, MedicalMetadata } from './common';

export interface CalculatorField {
  id: string;
  type: FieldType;
  label: LocalizedString;
  placeholder?: LocalizedString;
  helpText?: LocalizedString;
  required: boolean;
  defaultValue?: any;

  // 數值欄位屬性
  min?: number;
  max?: number;
  step?: number;
  unit?: string;

  // 選擇欄位屬性
  options?: FieldOption[];

  // 條件顯示
  conditional?: {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in';
    value: any;
  };

  // 驗證規則
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    customValidator?: string;
    errorMessage?: LocalizedString;
  };

  // UI 屬性
  className?: string;
  disabled?: boolean;
  readonly?: boolean;
  autoFocus?: boolean;
}

export interface FieldOption {
  value: string | number | boolean;
  label: LocalizedString;
  description?: LocalizedString;
  disabled?: boolean;
  icon?: string;
}

export interface CalculatorConfig {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  category: string;
  version: string;
  status: CalculatorStatus;
  
  // 輸入欄位定義
  fields: CalculatorField[];
  
  // 計算配置
  calculation: {
    functionName: string;
    validationRules?: {
      required: string[];
      dependencies: Array<{
        field: string;
        dependsOn: string;
        condition: any;
      }>;
    };
  };
  
  // 醫療資訊
  medical: MedicalMetadata;
  
  // 元資料
  metadata: {
    tags: string[];
    difficulty: 'basic' | 'intermediate' | 'advanced';
    lastUpdated: string;
    author: string;
    reviewedBy?: string;
    estimatedTime?: number; // 預估完成時間（分鐘）
  };
}