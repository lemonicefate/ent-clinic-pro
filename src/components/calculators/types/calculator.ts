/**
 * 計算機模組核心類型定義
 */

import React from 'react';
import { CalculatorConfig } from './config';
import { CalculationResult, FormattedResult } from './results';
import { ValidationResult, SupportedLocale } from './common';

// 計算機實現介面
export interface CalculatorImplementation {
  calculate: (inputs: Record<string, any>) => CalculationResult;
  validate: (inputs: Record<string, any>) => ValidationResult;
  formatResult?: (result: CalculationResult, locale: SupportedLocale) => FormattedResult;
}

// 表單組件 Props
export interface CalculatorFormProps {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  onChange: (fieldId: string, value: any) => void;
  onBlur: (fieldId: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  isLoading: boolean;
  locale: SupportedLocale;
  className?: string;
}

// 結果組件 Props
export interface CalculatorResultsProps {
  result: CalculationResult;
  locale: SupportedLocale;
  onExport?: (format: 'pdf' | 'png' | 'json' | 'csv') => void;
  onShare?: (platform: 'email' | 'link' | 'print') => void;
  onSave?: () => void;
  className?: string;
}

// 計算機模組元資料
export interface CalculatorMetadata {
  version: string;
  author: string;
  lastUpdated: string;
  dependencies?: string[];
  conflicts?: string[];
  changelog?: Array<{
    version: string;
    date: string;
    changes: string[];
  }>;
}

// 完整的計算機模組定義
export interface CalculatorModule {
  id: string;
  config: CalculatorConfig;
  FormComponent: React.ComponentType<CalculatorFormProps>;
  ResultsComponent: React.ComponentType<CalculatorResultsProps>;
  calculator: CalculatorImplementation;
  metadata: CalculatorMetadata;
  
  // 生命週期鉤子
  onLoad?: () => Promise<void>;
  onUnload?: () => Promise<void>;
  onError?: (error: Error) => void;
}

// 模組載入結果
export interface ModuleLoadResult {
  success: boolean;
  module?: CalculatorModule;
  error?: string;
}

// 計算機容器 Props
export interface CalculatorContainerProps {
  calculatorId: string;
  locale?: SupportedLocale;
  className?: string;
  onCalculationComplete?: (result: CalculationResult) => void;
  onError?: (error: Error) => void;
}

// 搜尋查詢
export interface SearchQuery {
  text?: string;
  category?: string;
  tags?: string[];
  difficulty?: 'basic' | 'intermediate' | 'advanced';
  specialty?: string[];
  status?: 'published' | 'draft' | 'deprecated';
}