/**
 * 醫療計算機島嶼組件 - 資料驅動引擎
 * 
 * 完全重構為資料驅動的計算引擎，具備：
 * - 強健的錯誤處理和恢復機制
 * - 動態表單生成和驗證系統
 * - 整合視覺化組件庫
 * - 錯誤邊界和錯誤恢復
 * - 效能優化和記憶體管理
 */

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import type { Calculator } from '../../content/config';
import type { SupportedLocale } from '../../env.d';
import { 
  calculatorEngine,
  type CalculationResult,
  type FieldValue,
  type CalculationError,
  type ValidationError
} from '../../utils/calculator-engine';
import { createMedicalValidator } from '../../utils/medical-validation';
import { t } from '../../utils/i18n';
import { ErrorBoundary } from '../common/ErrorBoundary';
// import '../../styles/error-boundary.css'; // Removed due to build issues

// ============================================================================
// 類型定義
// ============================================================================

interface Props {
  calculator: Calculator;
  locale: SupportedLocale;
  className?: string;
  onCalculationComplete?: (result: CalculationResult) => void;
  onCalculationError?: (error: CalculationError) => void;
  enableAnalytics?: boolean;
  debugMode?: boolean;
}

interface CalculatorState {
  // 表單狀態
  values: Record<string, FieldValue>;
  errors: ValidationError[];
  touched: Record<string, boolean>;
  
  // 計算狀態
  result: CalculationResult | null;
  isCalculating: boolean;
  hasCalculated: boolean;
  calculationHistory: CalculationResult[];
  
  // UI 狀態
  isInitialized: boolean;
  isValidating: boolean;
  showAdvanced: boolean;
  
  // 錯誤狀態
  criticalError: CalculationError | null;
  retryCount: number;
}

interface FieldRenderProps {
  field: any;
  value: FieldValue;
  error?: ValidationError;
  touched: boolean;
  onChange: (value: FieldValue) => void;
  onBlur: () => void;
  disabled: boolean;
  locale: SupportedLocale;
}

// ============================================================================
// 常數定義
// ============================================================================

const INITIAL_STATE: CalculatorState = {
  values: {},
  errors: [],
  touched: {},
  result: null,
  isCalculating: false,
  hasCalculated: false,
  calculationHistory: [],
  isInitialized: false,
  isValidating: false,
  showAdvanced: false,
  criticalError: null,
  retryCount: 0
};

const MAX_RETRY_COUNT = 3;
const CALCULATION_TIMEOUT = 10000; // 10 秒
const DEBOUNCE_DELAY = 300; // 300ms

// ============================================================================
// 主要組件
// ============================================================================

export default function CalculatorComponent({ 
  calculator, 
  locale, 
  className = '',
  onCalculationComplete,
  onCalculationError,
  enableAnalytics = true,
  debugMode = false
}: Props) {
  // ========================================================================
  // 狀態管理
  // ========================================================================
  
  const [state, setState] = useState<CalculatorState>(INITIAL_STATE);
  const [validator, setValidator] = useState<any>(null);
  
  // Refs for cleanup and performance
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // ========================================================================
  // 記憶化計算
  // ========================================================================

  // 預設值計算
  const defaultValues = useMemo(() => {
    const values: Record<string, FieldValue> = {};
    calculator.fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        values[field.id] = field.defaultValue;
      }
    });
    return values;
  }, [calculator.fields]);

  // 表單驗證狀態
  const isFormValid = useMemo(() => {
    return state.errors.length === 0 && 
           calculator.fields.every(field => 
             field.required ? state.values[field.id] != null : true
           );
  }, [state.errors, state.values, calculator.fields]);

  // 是否可以計算
  const canCalculate = useMemo(() => {
    return isFormValid && 
           !state.isCalculating && 
           !state.isValidating && 
           state.isInitialized &&
           !state.criticalError;
  }, [isFormValid, state.isCalculating, state.isValidating, state.isInitialized, state.criticalError]);

  // ========================================================================
  // 初始化效果
  // ========================================================================

  useEffect(() => {
    let isMounted = true;

    const initializeCalculator = async () => {
      try {
        // 註冊計算機到引擎（如果尚未註冊）
        const registrationResult = await calculatorEngine.register({
          id: calculator.id,
          name: calculator.name,
          description: calculator.description,
          category: calculator.category || 'general',
          version: calculator.version || '1.0.0',
          fields: calculator.fields,
          calculation: calculator.calculation,
          metadata: {
            tags: calculator.tags || [],
            difficulty: calculator.difficulty || 'basic',
            author: calculator.author || 'unknown',
            lastUpdated: new Date().toISOString()
          },
          medical: {
            specialty: calculator.specialty || ['general-medicine'],
            evidenceLevel: calculator.evidenceLevel || 'C'
          },
          requiredFields: calculator.fields.filter(f => f.required).map(f => f.id),
          cacheEnabled: true
        });

        if (registrationResult.isFailure()) {
          throw registrationResult.error;
        }

        // 建立驗證器
        const medicalValidator = createMedicalValidator(calculator.fields);
        
        if (isMounted) {
          setValidator(medicalValidator);
          setState(prev => ({
            ...prev,
            values: { ...defaultValues },
            isInitialized: true
          }));
        }

        // 發送初始化事件
        if (enableAnalytics && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('calculator:initialized', {
            detail: {
              calculatorId: calculator.id,
              timestamp: Date.now()
            }
          }));
        }

      } catch (error) {
        console.error('Failed to initialize calculator:', error);
        
        if (isMounted) {
          setState(prev => ({
            ...prev,
            criticalError: error instanceof Error 
              ? new CalculationError(error.message, 'INITIALIZATION_FAILED')
              : new CalculationError('Unknown initialization error', 'INITIALIZATION_FAILED'),
            isInitialized: false
          }));
        }
      }
    };

    initializeCalculator();

    return () => {
      isMounted = false;
      mountedRef.current = false;
    };
  }, [calculator, defaultValues, enableAnalytics]);

  // ========================================================================
  // 清理效果
  // ========================================================================

  useEffect(() => {
    return () => {
      // 清理計時器
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // ========================================================================
  // 事件處理函數
  // ========================================================================

  // 處理輸入變化（帶防抖驗證）
  const handleInputChange = useCallback((fieldId: string, value: FieldValue) => {
    if (!mountedRef.current) return;

    setState(prev => ({
      ...prev,
      values: { ...prev.values, [fieldId]: value },
      errors: prev.errors.filter(error => error.field !== fieldId),
      hasCalculated: false // 重置計算狀態
    }));

    // 防抖驗證
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && validator) {
        validateField(fieldId, value);
      }
    }, DEBOUNCE_DELAY);
  }, [validator]);

  // 處理欄位失焦
  const handleFieldBlur = useCallback((fieldId: string) => {
    if (!mountedRef.current) return;

    setState(prev => ({
      ...prev,
      touched: { ...prev.touched, [fieldId]: true }
    }));

    // 立即驗證失焦的欄位
    if (validator) {
      const value = state.values[fieldId];
      validateField(fieldId, value);
    }
  }, [validator, state.values]);

  // 單一欄位驗證
  const validateField = useCallback(async (fieldId: string, value: FieldValue) => {
    if (!validator || !mountedRef.current) return;

    try {
      setState(prev => ({ ...prev, isValidating: true }));

      const field = calculator.fields.find(f => f.id === fieldId);
      if (!field) return;

      const validation = await validator.validateField(fieldId, value);
      
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          errors: validation.isValid 
            ? prev.errors.filter(e => e.field !== fieldId)
            : [
                ...prev.errors.filter(e => e.field !== fieldId),
                new ValidationError(
                  validation.message || `${field.label[locale]} 輸入無效`,
                  fieldId,
                  value
                )
              ],
          isValidating: false
        }));
      }
    } catch (error) {
      console.error('Field validation error:', error);
      if (mountedRef.current) {
        setState(prev => ({ ...prev, isValidating: false }));
      }
    }
  }, [validator, calculator.fields, locale]);

  // 驗證所有輸入
  const validateAllInputs = useCallback(async (): Promise<ValidationError[]> => {
    if (!validator) return [];

    const errors: ValidationError[] = [];
    
    for (const field of calculator.fields) {
      const value = state.values[field.id];
      
      try {
        const validation = await validator.validateField(field.id, value);
        
        if (!validation.isValid) {
          errors.push(new ValidationError(
            validation.message || `${field.label[locale]} 輸入無效`,
            field.id,
            value
          ));
        }
      } catch (error) {
        console.error(`Validation error for field ${field.id}:`, error);
        errors.push(new ValidationError(
          `驗證 ${field.label[locale]} 時發生錯誤`,
          field.id,
          value
        ));
      }
    }

    return errors;
  }, [calculator.fields, state.values, validator, locale]);

  // 驗證輸入
  const validateInputs = useCallback((): ValidationError[] => {
    if (!validator) return [];

    const errors: ValidationError[] = [];
    
    calculator.fields.forEach(field => {
      const value = state.values[field.id];
      const validation = validator.validateField(field.id, value);
      
      if (!validation.isValid) {
        errors.push({
          field: field.id,
          message: validation.message || `${field.label[locale]} 輸入無效`
        });
      }
    });

    return errors;
  }, [calculator.fields, state.values, validator, locale]);

  // 執行計算（帶超時和重試機制）
  const handleCalculate = useCallback(async () => {
    if (!canCalculate || !mountedRef.current) return;

    const startTime = Date.now();

    try {
      // 設定計算狀態
      setState(prev => ({ 
        ...prev, 
        isCalculating: true, 
        errors: [],
        criticalError: null
      }));

      // 驗證所有輸入
      const validationErrors = await validateAllInputs();
      if (validationErrors.length > 0) {
        if (mountedRef.current) {
          setState(prev => ({ 
            ...prev, 
            errors: validationErrors,
            isCalculating: false
          }));
        }

        // 觸發驗證錯誤事件
        if (enableAnalytics && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('calculator:validation_failed', {
            detail: {
              calculatorId: calculator.id,
              errors: validationErrors.map(e => ({ field: e.field, message: e.message })),
              inputs: state.values,
              timestamp: Date.now()
            }
          }));
        }

        if (onCalculationError) {
          onCalculationError(new CalculationError(
            'Validation failed',
            'VALIDATION_FAILED',
            { validationErrors }
          ));
        }
        
        return;
      }

      // 設定計算超時
      const timeoutPromise = new Promise<never>((_, reject) => {
        calculationTimeoutRef.current = setTimeout(() => {
          reject(new CalculationError(
            'Calculation timeout',
            'CALCULATION_TIMEOUT',
            { timeout: CALCULATION_TIMEOUT }
          ));
        }, CALCULATION_TIMEOUT);
      });

      // 執行計算
      const calculationPromise = calculatorEngine.calculate(calculator.id, state.values);
      
      const result = await Promise.race([calculationPromise, timeoutPromise]);

      // 清除超時計時器
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
        calculationTimeoutRef.current = null;
      }

      if (result.isFailure()) {
        throw result.error;
      }

      const calculationTime = Date.now() - startTime;
      const calculationResult = result.value;

      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          result: calculationResult,
          isCalculating: false,
          hasCalculated: true,
          calculationHistory: [...prev.calculationHistory.slice(-9), calculationResult], // 保留最近 10 次
          retryCount: 0 // 重置重試計數
        }));
      }

      // 觸發成功回調
      if (onCalculationComplete) {
        onCalculationComplete(calculationResult);
      }

      // 觸發分析事件
      if (enableAnalytics && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('calculator:calculation_completed', {
          detail: {
            calculatorId: calculator.id,
            inputs: state.values,
            result: calculationResult,
            calculationTime,
            timestamp: Date.now()
          }
        }));
      }
      
    } catch (error) {
      console.error('Calculation failed:', error);

      const calculationError = error instanceof CalculationError 
        ? error 
        : new CalculationError(
            error instanceof Error ? error.message : 'Unknown calculation error',
            'CALCULATION_FAILED',
            { originalError: error }
          );

      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          isCalculating: false,
          criticalError: prev.retryCount >= MAX_RETRY_COUNT ? calculationError : null,
          retryCount: prev.retryCount + 1,
          errors: prev.retryCount >= MAX_RETRY_COUNT 
            ? [new ValidationError('計算發生嚴重錯誤，請重新載入頁面', 'general', null)]
            : [new ValidationError('計算發生錯誤，請檢查輸入值或稍後重試', 'general', null)]
        }));
      }

      // 觸發錯誤回調
      if (onCalculationError) {
        onCalculationError(calculationError);
      }

      // 觸發分析事件
      if (enableAnalytics && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('calculator:calculation_failed', {
          detail: {
            calculatorId: calculator.id,
            error: calculationError.message,
            code: calculationError.code,
            inputs: state.values,
            retryCount: state.retryCount,
            timestamp: Date.now()
          }
        }));
      }
    }
  }, [
    canCalculate, 
    validateAllInputs, 
    calculator.id, 
    state.values, 
    state.retryCount,
    onCalculationComplete, 
    onCalculationError, 
    enableAnalytics
  ]);

  // 重設計算機
  const handleReset = useCallback(() => {
    if (!mountedRef.current) return;

    // 清理計時器
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
      calculationTimeoutRef.current = null;
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    setState(prev => ({
      ...INITIAL_STATE,
      values: { ...defaultValues },
      isInitialized: prev.isInitialized,
      calculationHistory: prev.calculationHistory // 保留歷史記錄
    }));

    // 觸發重置事件
    if (enableAnalytics && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('calculator:reset', {
        detail: {
          calculatorId: calculator.id,
          timestamp: Date.now()
        }
      }));
    }
  }, [defaultValues, calculator.id, enableAnalytics]);

  // 重試計算
  const handleRetry = useCallback(() => {
    if (!mountedRef.current) return;

    setState(prev => ({
      ...prev,
      criticalError: null,
      retryCount: 0,
      errors: []
    }));

    // 延遲執行計算以給用戶視覺反饋
    setTimeout(() => {
      if (mountedRef.current) {
        handleCalculate();
      }
    }, 100);
  }, [handleCalculate]);

  // 處理嚴重錯誤恢復
  const handleErrorRecovery = useCallback(() => {
    if (!mountedRef.current) return;

    setState(prev => ({
      ...prev,
      criticalError: null,
      retryCount: 0,
      errors: [],
      isCalculating: false
    }));

    // 觸發錯誤恢復事件
    if (enableAnalytics && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('calculator:error_recovery', {
        detail: {
          calculatorId: calculator.id,
          timestamp: Date.now()
        }
      }));
    }
  }, [calculator.id, enableAnalytics]);

  // 渲染輸入欄位
  const renderField = (field: any) => {
    const value = state.values[field.id];
    const error = state.errors.find(e => e.field === field.id);
    const fieldLabel = field.label[locale] || field.label['zh-TW'];
    const fieldDescription = field.description?.[locale] || field.description?.['zh-TW'];

    const baseInputClasses = `
      block w-full px-3 py-2 border rounded-md shadow-sm
      focus:outline-none focus:ring-2 focus:ring-medical-primary-500 focus:border-medical-primary-500
      ${error 
        ? 'border-medical-error-300 text-medical-error-900 placeholder-medical-error-300' 
        : 'border-medical-neutral-300 text-medical-neutral-900 placeholder-medical-neutral-500'
      }
    `;

    switch (field.type) {
      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <label htmlFor={field.id} className="block text-sm font-medium text-medical-neutral-700">
              {fieldLabel}
              {field.required && <span className="text-medical-error-500 ml-1">*</span>}
            </label>
            
            {fieldDescription && (
              <p className="text-sm text-medical-neutral-500">{fieldDescription}</p>
            )}
            
            <div className="relative">
              <input
                type="number"
                id={field.id}
                value={value || ''}
                onChange={(e) => handleInputChange(field.id, parseFloat(e.target.value) || 0)}
                min={field.min}
                max={field.max}
                step={field.step || 1}
                className={baseInputClasses}
                placeholder={field.placeholder?.[locale]}
                aria-describedby={error ? `${field.id}-error` : undefined}
              />
              
              {field.unit && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-medical-neutral-500 text-sm">{field.unit}</span>
                </div>
              )}
            </div>
            
            {error && (
              <p id={`${field.id}-error`} className="text-sm text-medical-error-600">
                {error.message}
              </p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <label htmlFor={field.id} className="block text-sm font-medium text-medical-neutral-700">
              {fieldLabel}
              {field.required && <span className="text-medical-error-500 ml-1">*</span>}
            </label>
            
            {fieldDescription && (
              <p className="text-sm text-medical-neutral-500">{fieldDescription}</p>
            )}
            
            <select
              id={field.id}
              value={value || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={baseInputClasses}
              aria-describedby={error ? `${field.id}-error` : undefined}
            >
              <option value="">請選擇...</option>
              {field.options?.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label[locale] || option.label['zh-TW']}
                </option>
              ))}
            </select>
            
            {error && (
              <p id={`${field.id}-error`} className="text-sm text-medical-error-600">
                {error.message}
              </p>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id={field.id}
                  checked={!!value}
                  onChange={(e) => handleInputChange(field.id, e.target.checked)}
                  className="h-4 w-4 text-medical-primary-600 focus:ring-medical-primary-500 border-medical-neutral-300 rounded"
                  aria-describedby={error ? `${field.id}-error` : undefined}
                />
              </div>
              <div className="ml-3">
                <label htmlFor={field.id} className="text-sm font-medium text-medical-neutral-700">
                  {fieldLabel}
                  {field.required && <span className="text-medical-error-500 ml-1">*</span>}
                </label>
                {fieldDescription && (
                  <p className="text-sm text-medical-neutral-500">{fieldDescription}</p>
                )}
              </div>
            </div>
            
            {error && (
              <p id={`${field.id}-error`} className="text-sm text-medical-error-600 ml-7">
                {error.message}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // 渲染風險等級指示器
  const renderRiskIndicator = (riskLevel: string) => {
    const riskConfig = {
      'low': { color: 'bg-green-100 text-green-800 border-green-200', icon: '✓', label: '低風險' },
      'moderate': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⚠', label: '中等風險' },
      'high': { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '⚠', label: '高風險' },
      'critical': { color: 'bg-red-100 text-red-800 border-red-200', icon: '⚠', label: '極高風險' }
    };

    const config = riskConfig[riskLevel as keyof typeof riskConfig] || riskConfig.moderate;

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <span className="mr-2">{config.icon}</span>
        {config.label}
      </div>
    );
  };

  // 渲染計算結果
  const renderResult = () => {
    if (!state.result) return null;

    return (
      <div className="bg-medical-neutral-50 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-medical-neutral-900">
          {t('calculator.result', locale)}
        </h3>

        {/* 主要結果 */}
        <div className="bg-white rounded-lg p-4 border border-medical-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-medical-neutral-600">
              {state.result.label}
            </span>
            {state.result.riskLevel && renderRiskIndicator(state.result.riskLevel)}
          </div>
          
          <div className="text-2xl font-bold text-medical-neutral-900">
            {state.result.value} {state.result.unit}
          </div>
          
          {state.result.percentage && (
            <div className="text-lg text-medical-neutral-600">
              ({state.result.percentage}%)
            </div>
          )}
        </div>

        {/* 結果解釋 */}
        {state.result.interpretation && (
          <div className="bg-white rounded-lg p-4 border border-medical-neutral-200">
            <h4 className="font-medium text-medical-neutral-900 mb-2">
              {t('calculator.interpretation', locale)}
            </h4>
            <p className="text-medical-neutral-700 leading-relaxed">
              {state.result.interpretation[locale] || state.result.interpretation['zh-TW']}
            </p>
          </div>
        )}

        {/* 臨床建議 */}
        {state.result.recommendations && state.result.recommendations.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-medical-neutral-200">
            <h4 className="font-medium text-medical-neutral-900 mb-3">臨床建議</h4>
            <ul className="space-y-2">
              {state.result.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-2 h-2 bg-medical-primary-600 rounded-full mt-2 mr-3"></span>
                  <span className="text-medical-neutral-700">
                    {rec[locale] || rec['zh-TW']}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 參考文獻 */}
        {state.result.references && state.result.references.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-medical-neutral-200">
            <h4 className="font-medium text-medical-neutral-900 mb-3">
              {t('calculator.references', locale)}
            </h4>
            <ul className="space-y-1 text-sm">
              {state.result.references.map((ref, index) => (
                <li key={index} className="text-medical-neutral-600">
                  {index + 1}. {ref}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`calculator-component ${className}`}>
      {/* 一般錯誤訊息 */}
      {state.errors.some(e => e.field === 'general') && (
        <div className="mb-6 p-4 bg-medical-error-50 border border-medical-error-200 rounded-lg">
          <div className="flex">
            <svg className="h-5 w-5 text-medical-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-medical-error-800">
                {state.errors.find(e => e.field === 'general')?.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 輸入表單 */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {calculator.fields.map(renderField)}
        </div>

        {/* 操作按鈕 */}
        <div className="flex space-x-4">
          <button
            onClick={handleCalculate}
            disabled={state.isCalculating || !engine}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-medical-primary-600 hover:bg-medical-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-medical-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {state.isCalculating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                計算中...
              </>
            ) : (
              t('calculator.calculate', locale)
            )}
          </button>

          <button
            onClick={handleReset}
            className="px-4 py-2 border border-medical-neutral-300 text-sm font-medium rounded-md text-medical-neutral-700 bg-white hover:bg-medical-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-medical-primary-500 transition-colors"
          >
            {t('calculator.reset', locale)}
          </button>
        </div>
      </div>

      {/* 計算結果 */}
      {state.hasCalculated && (
        <div className="mt-8">
          {renderResult()}
        </div>
      )}
    </div>
  );
}