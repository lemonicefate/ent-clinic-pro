/**
 * 模組化計算機載入器
 * 
 * 客戶端動態載入和渲染計算機模組，使用新的資料驅動 UI 引擎
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import type { 
  CalculatorConfig, 
  CalculatorModule, 
  CalculationResult,
  SupportedLocale 
} from '../types/calculator';

// 載入選項
export interface LoaderOptions {
  locale?: SupportedLocale;
  theme?: 'light' | 'dark';
  showVisualization?: boolean;
  onCalculate?: (result: CalculationResult) => void;
  onError?: (error: Error) => void;
}

// 計算機實例
export interface CalculatorInstance {
  id: string;
  config: CalculatorConfig;
  calculate: (inputs: any) => CalculationResult;
  validate: (inputs: any) => { isValid: boolean; errors: any[] };
  formatResult: (result: CalculationResult, locale: SupportedLocale) => any;
  destroy: () => void;
}

/**
 * 模組化計算機載入器類別
 */
export class ModularCalculatorLoader {
  private moduleCache = new Map<string, CalculatorModule>();
  private instanceCache = new Map<string, CalculatorInstance>();
  private isCreatingInstance = false;
  
  // ID 到資料夾名稱的映射
  private idToFolderMap: Record<string, string> = {
    'bmi-calculator': 'bmi',
    'cha2ds2-vasc': 'cha2ds2-vasc',
    'egfr': 'egfr'
  };

  /**
   * 載入計算機模組
   */
  async loadModule(calculatorId: string): Promise<CalculatorModule | null> {
    // 檢查快取
    if (this.moduleCache.has(calculatorId)) {
      return this.moduleCache.get(calculatorId)!;
    }

    try {
      // 將 ID 映射到實際的資料夾名稱
      const folderName = this.idToFolderMap[calculatorId] || calculatorId;
      
      // 動態載入模組檔案
      const [configModule, calculatorModule, visualizationModule] = await Promise.all([
        import(`../calculators/${folderName}/config.json`).catch(err => {
          console.warn(`Failed to load config for ${calculatorId} (folder: ${folderName}):`, err);
          return null;
        }),
        import(`../calculators/${folderName}/calculator.ts`).catch(err => {
          console.warn(`Failed to load calculator for ${calculatorId} (folder: ${folderName}):`, err);
          return null;
        }),
        import(`../calculators/${folderName}/visualization.json`).catch(() => null)
      ]);

      if (!configModule || !calculatorModule) {
        console.error(`Missing required modules for calculator: ${calculatorId}`);
        return null;
      }

      const module: CalculatorModule = {
        config: configModule.default || configModule,
        calculator: calculatorModule,
        visualization: visualizationModule?.default || visualizationModule,
        tests: null // 測試檔案不在客戶端載入
      };

      // 快取模組
      this.moduleCache.set(calculatorId, module);
      return module;
    } catch (error) {
      console.error(`Failed to load calculator module: ${calculatorId}`, error);
      return null;
    }
  }

  /**
   * 創建計算機實例
   */
  async createInstance(
    calculatorId: string, 
    container: HTMLElement, 
    options: LoaderOptions = {}
  ): Promise<CalculatorInstance | null> {
    if (this.isCreatingInstance) {
      console.warn('Instance creation already in progress. Please wait.');
      return null;
    }
    this.isCreatingInstance = true;

    try {
      const module = await this.loadModule(calculatorId);
      if (!module) return null;

      const instanceId = `${calculatorId}-${Date.now()}`;
      
      // 創建 React 根節點
      const root = createRoot(container);
      
      // 動態載入對應的儀表板組件
      const DashboardComponent = await this.loadDashboardComponent(calculatorId);
      
      // 創建計算機實例
      const instance: CalculatorInstance = {
        id: instanceId,
        config: module.config,
        calculate: module.calculator.calculate,
        validate: module.calculator.validate,
        formatResult: module.calculator.formatResult,
        destroy: () => {
          root.unmount();
          this.instanceCache.delete(instanceId);
        }
      };

      // 渲染計算機 UI
      await this.renderCalculator(root, module, DashboardComponent, options);

      // 快取實例
      this.instanceCache.set(instanceId, instance);
      return instance;
    } catch (error) {
      console.error(`Failed to create calculator instance: ${calculatorId}`, error);
      options.onError?.(error as Error);
      return null;
    } finally {
      this.isCreatingInstance = false;
    }
  }

  /**
   * 載入對應的儀表板組件
   */
  private async loadDashboardComponent(calculatorId: string): Promise<React.ComponentType<any> | null> {
    try {
      switch (calculatorId) {
        case 'bmi':
        case 'bmi-calculator':
          const { default: BMIDashboard } = await import('../components/calculators/BMIDashboard.tsx');
          return BMIDashboard;
        
        case 'cha2ds2-vasc':
          const { default: CHA2DS2VAScDashboard } = await import('../components/calculators/CHA2DS2VAScDashboard.tsx');
          return CHA2DS2VAScDashboard;
        
        case 'egfr':
          const { default: EGFRDashboard } = await import('../components/calculators/EGFRDashboard.tsx');
          return EGFRDashboard;
        
        default:
          // 返回簡化的儀表板
          return this.createSimpleDashboard();
      }
    } catch (error) {
      console.warn(`Failed to load specific dashboard for ${calculatorId}, using simple dashboard`, error);
      return this.createSimpleDashboard();
    }
  }

  /**
   * 創建簡化的儀表板組件
   */
  private createSimpleDashboard(): React.ComponentType<any> {
    return ({ result, locale = 'zh-TW' }: { result: any; locale?: string }) => {
      return React.createElement('div', {
        className: 'simple-dashboard bg-white rounded-lg border border-gray-200 p-6'
      }, [
        React.createElement('h3', {
          key: 'title',
          className: 'text-lg font-semibold text-gray-900 mb-4'
        }, '計算結果'),
        
        React.createElement('div', {
          key: 'result',
          className: 'bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4'
        }, [
          React.createElement('div', {
            key: 'primary-value',
            className: 'text-center'
          }, [
            React.createElement('div', {
              key: 'value',
              className: 'text-3xl font-bold text-blue-600 mb-2'
            }, `${result.primaryValue} ${result.primaryUnit || ''}`),
            
            React.createElement('div', {
              key: 'label',
              className: 'text-sm text-gray-600'
            }, result.primaryLabel?.[locale] || result.primaryLabel?.['zh-TW'] || '結果')
          ])
        ]),
        
        result.interpretation && React.createElement('div', {
          key: 'interpretation',
          className: 'bg-gray-50 border border-gray-200 rounded-lg p-4'
        }, [
          React.createElement('h4', {
            key: 'interp-title',
            className: 'font-medium text-gray-900 mb-2'
          }, '結果解釋'),
          
          React.createElement('p', {
            key: 'interp-text',
            className: 'text-sm text-gray-700'
          }, result.interpretation[locale] || result.interpretation['zh-TW'] || '')
        ])
      ]);
    };
  }

  /**
   * 渲染計算機
   */
  private async renderCalculator(
    root: any,
    module: CalculatorModule,
    DashboardComponent: React.ComponentType<any> | null,
    options: LoaderOptions
  ): Promise<void> {
    const { locale = 'zh-TW' } = options;

    // 創建計算機應用組件
    const CalculatorApp: React.FC = () => {
      const [inputs, setInputs] = React.useState<any>({});
      const [result, setResult] = React.useState<CalculationResult | null>(null);
      const [errors, setErrors] = React.useState<any[]>([]);
      const [isCalculating, setIsCalculating] = React.useState(false);

      // 處理輸入變更
      const handleInputChange = React.useCallback((fieldId: string, value: any) => {
        setInputs(prev => ({ ...prev, [fieldId]: value }));
        setErrors([]); // 清除錯誤
      }, []);

      // Utility to apply a timeout to a promise
      const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
        let timeoutHandle: NodeJS.Timeout;
        const timeoutPromise = new Promise<T>((_resolve, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(new Error(errorMessage));
          }, timeoutMs);
        });

        return Promise.race([promise, timeoutPromise]).finally(() => {
          clearTimeout(timeoutHandle);
        });
      };

      // 處理計算
      const handleCalculate = React.useCallback(async () => {
        setIsCalculating(true);
        setErrors([]);

        try {
          // 動態獲取計算函數名稱
          const calculatorFunctions = Object.keys(module.calculator);
          const calculateFunction = calculatorFunctions.find(fn => fn.startsWith('calculate')) || 'calculate';
          const validateFunction = calculatorFunctions.find(fn => fn.includes('validate')) || 'validate';
          
          // 驗證輸入 (帶有超時)
          let validation = { isValid: true, errors: [] };
          if (module.calculator[validateFunction]) {
             try {
              validation = await withTimeout(
                Promise.resolve(module.calculator[validateFunction](inputs)),
                5000, // 5秒超時
                'Validation timed out.'
              );
            } catch (timeoutError) {
              throw new Error(`Validation error: ${timeoutError instanceof Error ? timeoutError.message : 'Unknown timeout error'}`);
            }

            if (!validation.isValid) {
              setErrors(validation.errors.map((error: any) => ({ 
                field: typeof error === 'string' ? 'general' : error.field || 'general', 
                message: typeof error === 'string' ? error : error.message || '驗證失敗', 
                type: 'error' 
              })));
              return;
            }
          }

          // 執行計算 (帶有超時)
          const calculationResult = await withTimeout(
             Promise.resolve(module.calculator[calculateFunction](inputs)),
             10000, // 10秒超時
            'Calculation timed out.'
          );
          setResult(calculationResult);
          
          // 觸發回調
          options.onCalculate?.(calculationResult);
        } catch (error) {
          console.error('Calculation error:', error);
          setErrors([{ field: 'general', message: `計算過程中發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`, type: 'error' }]);
          options.onError?.(error as Error);
        } finally {
          setIsCalculating(false);
        }
      }, [inputs]);

      // 重置表單
      const handleReset = React.useCallback(() => {
        setInputs({});
        setResult(null);
        setErrors([]);
      }, []);

      return React.createElement('div', { className: 'calculator-app' }, [
        // 表單區域
        React.createElement('div', { 
          key: 'form',
          className: 'calculator-form mb-6' 
        }, [
          React.createElement('h3', {
            key: 'form-title',
            className: 'text-lg font-semibold mb-4'
          }, '輸入參數'),
          
          // 錯誤顯示
          errors.length > 0 && React.createElement('div', {
            key: 'errors',
            className: 'mb-4 p-4 bg-red-50 border border-red-200 rounded-lg'
          }, [
            React.createElement('h4', {
              key: 'error-title',
              className: 'text-sm font-medium text-red-800 mb-2'
            }, '請修正以下錯誤：'),
            React.createElement('ul', {
              key: 'error-list',
              className: 'text-sm text-red-700 space-y-1'
            }, errors.map((error, index) => 
              React.createElement('li', {
                key: `error-${index}`,
                className: 'flex items-center'
              }, [
                React.createElement('span', {
                  key: 'bullet',
                  className: 'mr-2'
                }, '•'),
                error.message
              ])
            ))
          ]),
          
          // 動態生成表單欄位
          ...module.config.fields.map((field, index) => 
            this.renderFormField(field, inputs[field.id], handleInputChange, errors, locale, field.id || `field-${index}`)
          ),
          
          // 操作按鈕
          React.createElement('div', {
            key: 'form-actions',
            className: 'flex space-x-4 mt-6'
          }, [
            React.createElement('button', {
              key: 'calculate-btn',
              type: 'button',
              onClick: handleCalculate,
              disabled: isCalculating,
              className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50'
            }, isCalculating ? '計算中...' : '計算'),
            
            React.createElement('button', {
              key: 'reset-btn',
              type: 'button',
              onClick: handleReset,
              className: 'px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700'
            }, '重置')
          ])
        ]),

        // 結果區域 - 使用錯誤邊界包裹
        result && DashboardComponent && React.createElement('div', {
          key: 'dashboard-wrapper',
          className: 'calculator-results'
        }, [
          React.createElement(this.createErrorBoundary(), {
            key: 'error-boundary',
            fallback: React.createElement('div', {
              className: 'bg-red-50 border border-red-200 rounded-lg p-4'
            }, [
              React.createElement('h4', {
                key: 'error-title',
                className: 'text-red-800 font-medium mb-2'
              }, '結果顯示錯誤'),
              React.createElement('p', {
                key: 'error-message',
                className: 'text-red-700 text-sm'
              }, '無法顯示計算結果，請檢查輸入數據或重新計算。')
            ])
          }, [
            React.createElement(DashboardComponent, {
              key: 'dashboard',
              result,
              locale
            })
          ])
        ])
      ]);
    };

    // 渲染應用
    root.render(React.createElement(CalculatorApp));
  }

  /**
   * 渲染表單欄位
   */
  private renderFormField(
    field: any,
    value: any,
    onChange: (fieldId: string, value: any) => void,
    errors: any[],
    locale: SupportedLocale,
    key: string
  ): React.ReactElement {
    const fieldError = errors.find(error => error.field === field.id);
    const hasError = !!fieldError;

    const getLocalizedText = (text: any): string => {
      if (typeof text === 'string') return text;
      return text[locale] || text['zh-TW'] || '';
    };

    const baseClasses = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      hasError ? 'border-red-500' : 'border-gray-300'
    }`;

    const fieldElement = (() => {
      switch (field.type) {
        case 'number':
          return React.createElement('input', {
            key: key,
            type: 'number',
            id: field.id,
            value: value || '',
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              const numValue = e.target.value === '' ? '' : parseFloat(e.target.value);
              onChange(field.id, numValue);
            },
            min: field.min,
            max: field.max,
            step: field.step,
            placeholder: getLocalizedText(field.placeholder || ''),
            className: baseClasses,
            required: field.required
          });

        case 'select':
          return React.createElement('select', {
            key: key,
            id: field.id,
            value: value || '',
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => 
              onChange(field.id, e.target.value),
            className: baseClasses,
            required: field.required
          }, [
            React.createElement('option', { key: 'default-option', value: '' }, '請選擇...'),
            ...(field.options?.map((option: any, optIndex: number) => 
              React.createElement('option', {
                key: `${field.id}-option-${optIndex}`,
                value: option.value
              }, getLocalizedText(option.label))
            ) || [])
          ]);

        case 'checkbox':
          return React.createElement('input', {
            key: key,
            type: 'checkbox',
            id: field.id,
            checked: !!value,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
              onChange(field.id, e.target.checked),
            className: 'w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
          });

        case 'radio':
          return React.createElement('div', {
            key: key,
            className: 'space-y-2'
          }, field.options?.map((option: any, optIndex: number) => 
            React.createElement('label', {
              key: `${field.id}-radio-${optIndex}`,
              className: 'flex items-center'
            }, [
              React.createElement('input', {
                key: `${field.id}-input-${optIndex}`,
                type: 'radio',
                name: field.id,
                value: option.value,
                checked: value === option.value,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
                  onChange(field.id, e.target.value),
                className: 'w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500'
              }),
              React.createElement('span', {
                key: `${field.id}-label-${optIndex}`,
                className: 'ml-2 text-sm'
              }, getLocalizedText(option.label))
            ])
          ) || []);

        default:
          return React.createElement('input', {
            key: key,
            type: 'text',
            id: field.id,
            value: value || '',
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
              onChange(field.id, e.target.value),
            placeholder: getLocalizedText(field.placeholder || ''),
            className: baseClasses,
            required: field.required
          });
      }
    })();

    return React.createElement('div', {
      key: key,
      className: 'mb-4'
    }, [
      React.createElement('label', {
        key: 'label',
        htmlFor: field.id,
        className: 'block text-sm font-medium text-gray-700 mb-2'
      }, [
        getLocalizedText(field.label),
        field.required && React.createElement('span', {
          key: 'required',
          className: 'text-red-500 ml-1'
        }, '*')
      ]),
      
      fieldElement,
      
      field.helpText && React.createElement('p', {
        key: 'help',
        className: 'mt-1 text-xs text-gray-500'
      }, getLocalizedText(field.helpText)),
      
      hasError && React.createElement('p', {
        key: 'error',
        className: 'mt-1 text-xs text-red-600'
      }, fieldError.message)
    ]);
  }

  /**
   * 創建錯誤邊界組件
   */
  private createErrorBoundary(): React.ComponentType<any> {
    return class ErrorBoundary extends React.Component<any, any> {
      constructor(props: any) {
        super(props);
        this.state = { hasError: false };
      }

      static getDerivedStateFromError(error: Error) {
        return { hasError: true };
      }

      componentDidCatch(error: Error, errorInfo: any) {
        console.error('Dashboard error:', error, errorInfo);
      }

      render() {
        if (this.state.hasError) {
          return this.props.fallback;
        }
        return this.props.children;
      }
    };
  }

  /**
   * 獲取實例
   */
  getInstance(instanceId: string): CalculatorInstance | null {
    return this.instanceCache.get(instanceId) || null;
  }

  /**
   * 銷毀實例
   */
  destroyInstance(instanceId: string): void {
    const instance = this.instanceCache.get(instanceId);
    if (instance) {
      instance.destroy();
    }
  }

  /**
   * 清除快取
   */
  clearCache(): void {
    this.moduleCache.clear();
    // 銷毀所有實例
    for (const instance of this.instanceCache.values()) {
      instance.destroy();
    }
    this.instanceCache.clear();
  }
}

// 全域載入器實例
export const modularCalculatorLoader = new ModularCalculatorLoader();

/**
 * 便利函數：載入計算機
 */
export async function loadCalculator(
  calculatorId: string,
  container: HTMLElement,
  options: LoaderOptions = {}
): Promise<CalculatorInstance | null> {
  return modularCalculatorLoader.createInstance(calculatorId, container, options);
}

/**
 * 便利函數：載入計算機模組
 */
export async function loadCalculatorModule(calculatorId: string): Promise<CalculatorModule | null> {
  return modularCalculatorLoader.loadModule(calculatorId);
}

export default ModularCalculatorLoader;