/**
 * 醫療計算機引擎
 * 提供動態表單生成、計算邏輯執行和結果解釋功能
 */

import type { Calculator } from '../content/config';
import type { SupportedLocale } from '../env.d';
import { getLocalizedText } from './client-helpers';

// 計算機欄位值類型
export type FieldValue = string | number | boolean | null;

// 計算機輸入資料
export interface CalculatorInput {
  [fieldId: string]: FieldValue;
}

// 計算結果
export interface CalculationResult {
  score: number;
  risk: 'low' | 'moderate' | 'high' | 'critical';
  interpretation: {
    recommendation: string;
    color: string;
    icon: string;
    actionItems: string[];
  };
  details: {
    breakdown: Array<{
      field: string;
      label: string;
      value: FieldValue;
      points: number;
    }>;
    totalPoints: number;
    maxPossibleScore: number;
  };
}

// 驗證錯誤
export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
}

// 表單欄位狀態
export interface FieldState {
  value: FieldValue;
  error?: string;
  touched: boolean;
  disabled?: boolean;
}

// 表單狀態
export interface FormState {
  fields: Record<string, FieldState>;
  isValid: boolean;
  isSubmitting: boolean;
  errors: ValidationError[];
}

/**
 * 醫療計算機引擎類別
 */
export class CalculatorEngine {
  private locale: SupportedLocale = 'zh-TW';

  constructor(locale: SupportedLocale = 'zh-TW') {
    this.locale = locale;
  }

  /**
   * 初始化表單狀態
   */
  initializeFormState(calculator: Calculator): FormState {
    const fields: Record<string, FieldState> = {};

    calculator.fields.forEach(field => {
      fields[field.id] = {
        value: field.defaultValue || null,
        touched: false,
        disabled: field.disabled || false
      };
    });

    return {
      fields,
      isValid: false,
      isSubmitting: false,
      errors: []
    };
  }

  /**
   * 驗證單一欄位
   */
  validateField(calculator: Calculator, fieldId: string, value: FieldValue): ValidationError | null {
    const field = calculator.fields.find(f => f.id === fieldId);
    if (!field) return null;

    // 必填驗證
    if (field.required && (value === null || value === undefined || value === '')) {
      return {
        field: fieldId,
        message: getLocalizedText(field.validation?.required || '此欄位為必填', this.locale),
        type: 'required'
      };
    }

    // 數值範圍驗證
    if (field.type === 'number' && value !== null && value !== undefined) {
      const numValue = Number(value);
      
      if (field.min !== undefined && numValue < field.min) {
        return {
          field: fieldId,
          message: getLocalizedText(field.validation?.min || `最小值為 ${field.min}`, this.locale),
          type: 'min'
        };
      }
      
      if (field.max !== undefined && numValue > field.max) {
        return {
          field: fieldId,
          message: getLocalizedText(field.validation?.max || `最大值為 ${field.max}`, this.locale),
          type: 'max'
        };
      }
    }

    // 模式驗證
    if (field.pattern && value && typeof value === 'string') {
      const regex = new RegExp(field.pattern);
      if (!regex.test(value)) {
        return {
          field: fieldId,
          message: getLocalizedText(field.validation?.pattern || '格式不正確', this.locale),
          type: 'pattern'
        };
      }
    }

    return null;
  }

  /**
   * 驗證整個表單
   */
  validateForm(calculator: Calculator, input: CalculatorInput): ValidationError[] {
    const errors: ValidationError[] = [];

    calculator.fields.forEach(field => {
      const error = this.validateField(calculator, field.id, input[field.id]);
      if (error) {
        errors.push(error);
      }
    });

    return errors;
  }

  /**
   * 執行計算
   */
  async calculate(calculator: Calculator, input: CalculatorInput): Promise<CalculationResult> {
    // 驗證輸入
    const validationErrors = this.validateForm(calculator, input);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
    }

    try {
      // 執行計算函數
      const result = await calculator.calculationFunction(input);
      
      // 確保結果格式正確
      if (!result || typeof result.score !== 'number') {
        throw new Error('Invalid calculation result');
      }

      return result;
    } catch (error) {
      console.error('Calculation error:', error);
      throw new Error('計算過程中發生錯誤');
    }
  }

  /**
   * 更新欄位值
   */
  updateFieldValue(
    formState: FormState, 
    fieldId: string, 
    value: FieldValue,
    calculator: Calculator
  ): FormState {
    const newFields = {
      ...formState.fields,
      [fieldId]: {
        ...formState.fields[fieldId],
        value,
        touched: true,
        error: undefined
      }
    };

    // 驗證更新的欄位
    const error = this.validateField(calculator, fieldId, value);
    if (error) {
      newFields[fieldId].error = error.message;
    }

    // 檢查整體表單有效性
    const allErrors = this.validateForm(calculator, this.getFormValues(newFields));
    const isValid = allErrors.length === 0;

    return {
      ...formState,
      fields: newFields,
      isValid,
      errors: allErrors
    };
  }

  /**
   * 從表單狀態提取值
   */
  getFormValues(fields: Record<string, FieldState>): CalculatorInput {
    const values: CalculatorInput = {};
    
    Object.entries(fields).forEach(([fieldId, fieldState]) => {
      values[fieldId] = fieldState.value;
    });

    return values;
  }

  /**
   * 重置表單
   */
  resetForm(calculator: Calculator): FormState {
    return this.initializeFormState(calculator);
  }

  /**
   * 檢查欄位是否應該顯示
   */
  shouldShowField(calculator: Calculator, fieldId: string, currentValues: CalculatorInput): boolean {
    const field = calculator.fields.find(f => f.id === fieldId);
    if (!field || !field.showIf) return true;

    try {
      // 評估顯示條件
      return this.evaluateCondition(field.showIf, currentValues);
    } catch (error) {
      console.warn(`Error evaluating show condition for field ${fieldId}:`, error);
      return true;
    }
  }

  /**
   * 評估條件表達式
   */
  private evaluateCondition(condition: any, values: CalculatorInput): boolean {
    if (typeof condition === 'boolean') return condition;
    
    if (typeof condition === 'object' && condition !== null) {
      // 處理 AND 條件
      if (condition.and && Array.isArray(condition.and)) {
        return condition.and.every((cond: any) => this.evaluateCondition(cond, values));
      }
      
      // 處理 OR 條件
      if (condition.or && Array.isArray(condition.or)) {
        return condition.or.some((cond: any) => this.evaluateCondition(cond, values));
      }
      
      // 處理簡單比較
      if (condition.field && condition.operator && condition.value !== undefined) {
        const fieldValue = values[condition.field];
        
        switch (condition.operator) {
          case '==':
            return fieldValue == condition.value;
          case '===':
            return fieldValue === condition.value;
          case '!=':
            return fieldValue != condition.value;
          case '!==':
            return fieldValue !== condition.value;
          case '>':
            return Number(fieldValue) > Number(condition.value);
          case '>=':
            return Number(fieldValue) >= Number(condition.value);
          case '<':
            return Number(fieldValue) < Number(condition.value);
          case '<=':
            return Number(fieldValue) <= Number(condition.value);
          case 'includes':
            return Array.isArray(fieldValue) && fieldValue.includes(condition.value);
          default:
            return false;
        }
      }
    }
    
    return false;
  }

  /**
   * 獲取欄位選項
   */
  getFieldOptions(calculator: Calculator, fieldId: string): Array<{value: string | number, label: string}> {
    const field = calculator.fields.find(f => f.id === fieldId);
    if (!field || !field.options) return [];

    return field.options.map(option => ({
      value: option.value,
      label: getLocalizedText(option.label, this.locale)
    }));
  }

  /**
   * 格式化結果顯示
   */
  formatResult(result: CalculationResult): {
    score: string;
    risk: string;
    riskColor: string;
    interpretation: string;
  } {
    return {
      score: result.score.toString(),
      risk: this.getRiskLabel(result.risk),
      riskColor: result.interpretation.color,
      interpretation: result.interpretation.recommendation
    };
  }

  /**
   * 獲取風險等級標籤
   */
  private getRiskLabel(risk: string): string {
    const labels = {
      low: '低風險',
      moderate: '中等風險', 
      high: '高風險',
      critical: '極高風險'
    };
    
    return labels[risk as keyof typeof labels] || risk;
  }

  /**
   * 驗證計算機配置
   */
  validateCalculatorConfig(calculator: Calculator): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 檢查基本欄位
    if (!calculator.id) errors.push('Missing calculator ID');
    if (!calculator.name) errors.push('Missing calculator name');
    if (!calculator.calculationFunction) errors.push('Missing calculation function');

    // 檢查欄位配置
    if (!calculator.fields || calculator.fields.length === 0) {
      errors.push('No fields defined');
    } else {
      calculator.fields.forEach((field, index) => {
        if (!field.id) errors.push(`Field ${index}: Missing field ID`);
        if (!field.type) errors.push(`Field ${field.id}: Missing field type`);
        if (!field.label) errors.push(`Field ${field.id}: Missing field label`);
        
        if ((field.type === 'select' || field.type === 'radio') && !field.options) {
          errors.push(`Field ${field.id}: Missing options for select/radio field`);
        }
      });
    }

    // 檢查解釋配置
    if (!calculator.interpretation || calculator.interpretation.length === 0) {
      errors.push('No interpretation rules defined');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// 預設引擎實例
export const calculatorEngine = new CalculatorEngine();

// 輔助函數
export function createCalculatorEngine(locale: SupportedLocale = 'zh-TW'): CalculatorEngine {
  return new CalculatorEngine(locale);
}