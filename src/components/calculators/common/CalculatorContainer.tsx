/**
 * 計算機容器組件
 * 
 * 統一的計算機容器，負責載入模組、管理狀態和協調 Form 與 Results 組件。
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CalculatorContainerProps, CalculationResult } from '../types';
import { CalculatorRegistry } from '../registry';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingSpinner } from './LoadingSpinner';

export const CalculatorContainer: React.FC<CalculatorContainerProps> = ({
  calculatorId,
  locale = 'zh-TW',
  className = '',
  onCalculationComplete,
  onError
}) => {
  // 狀態管理
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [module, setModule] = useState<any>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // 載入計算機模組
  useEffect(() => {
    let isMounted = true;

    const loadModule = async () => {
      try {
        setIsLoading(true);
        
        // 初始化註冊表
        const registry = CalculatorRegistry.getInstance();
        await registry.initialize();
        
        // 獲取模組
        const loadedModule = registry.get(calculatorId);
        
        if (!isMounted) return;
        
        if (!loadedModule) {
          throw new Error(`Calculator module not found: ${calculatorId}`);
        }

        setModule(loadedModule);
        
        // 設定預設值
        const defaultValues: Record<string, any> = {};
        loadedModule.config.fields.forEach((field: any) => {
          if (field.defaultValue !== undefined) {
            defaultValues[field.id] = field.defaultValue;
          }
        });
        setValues(defaultValues);

        console.log(`✅ Calculator module loaded: ${calculatorId}`);

      } catch (error) {
        console.error(`❌ Failed to load calculator ${calculatorId}:`, error);
        
        if (isMounted) {
          const errorObj = error as Error;
          setErrors({ general: errorObj.message });
          onError?.(errorObj);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadModule();

    return () => {
      isMounted = false;
    };
  }, [calculatorId, onError]);

  // 處理輸入變化
  const handleValueChange = useCallback((fieldId: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
    setErrors(prev => ({ ...prev, [fieldId]: '' }));
    
    // 如果有結果，清除結果以提示需要重新計算
    if (result) {
      setResult(null);
    }
  }, [result]);

  // 處理欄位失焦
  const handleFieldBlur = useCallback((fieldId: string) => {
    setTouched(prev => ({ ...prev, [fieldId]: true }));
  }, []);

  // 處理表單提交
  const handleSubmit = useCallback(async () => {
    if (!module) return;

    setIsCalculating(true);
    setErrors({});

    try {
      console.log(`🧮 Calculating with inputs:`, values);

      // 驗證輸入
      const validation = module.calculator.validate(values);
      
      if (!validation.isValid) {
        const fieldErrors: Record<string, string> = {};
        validation.errors.forEach((error: any) => {
          if (error.field && error.field !== 'general') {
            fieldErrors[error.field] = error.message;
          } else {
            fieldErrors.general = error.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }

      // 執行計算
      const calculationResult = module.calculator.calculate(values);
      
      console.log(`✅ Calculation completed:`, calculationResult);
      
      setResult(calculationResult);
      onCalculationComplete?.(calculationResult);

    } catch (error) {
      console.error(`❌ Calculation failed for ${calculatorId}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrors({ general: `計算失敗: ${errorMessage}` });
      onError?.(error as Error);
    } finally {
      setIsCalculating(false);
    }
  }, [module, values, calculatorId, onCalculationComplete, onError]);

  // 處理重設
  const handleReset = useCallback(() => {
    setValues({});
    setResult(null);
    setErrors({});
    setTouched({});
    
    // 重新設定預設值
    if (module) {
      const defaultValues: Record<string, any> = {};
      module.config.fields.forEach((field: any) => {
        if (field.defaultValue !== undefined) {
          defaultValues[field.id] = field.defaultValue;
        }
      });
      setValues(defaultValues);
    }
  }, [module]);

  // 載入中狀態
  if (isLoading) {
    return (
      <div className={`calculator-container ${className}`}>
        <LoadingSpinner 
          size="lg" 
          message={`載入 ${calculatorId} 計算機...`}
        />
      </div>
    );
  }

  // 模組載入失敗
  if (!module) {
    return (
      <div className={`calculator-container ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-red-800">
              {errors.general || `找不到計算機: ${calculatorId}`}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const { FormComponent, ResultsComponent } = module;

  return (
    <ErrorBoundary 
      calculatorId={calculatorId}
      onError={onError}
    >
      <div className={`calculator-container ${className}`}>
        {/* 計算機標題 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {module.config.name[locale] || module.config.name['zh-TW']}
          </h1>
          {module.config.description && (
            <p className="text-gray-600">
              {module.config.description[locale] || module.config.description['zh-TW']}
            </p>
          )}
        </div>

        {/* 一般錯誤訊息 */}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-800">
                  {errors.general}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 表單組件 */}
        <ErrorBoundary 
          calculatorId={`${calculatorId}-form`}
          onError={onError}
        >
          <FormComponent
            values={values}
            errors={errors}
            touched={touched}
            onChange={handleValueChange}
            onBlur={handleFieldBlur}
            onSubmit={handleSubmit}
            onReset={handleReset}
            isLoading={isCalculating}
            locale={locale}
            className="mb-8"
          />
        </ErrorBoundary>

        {/* 結果組件 */}
        {result && (
          <ErrorBoundary 
            calculatorId={`${calculatorId}-results`}
            onError={onError}
          >
            <ResultsComponent
              result={result}
              locale={locale}
              className="mt-8"
            />
          </ErrorBoundary>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default CalculatorContainer;