# 統一計算機架構設計文件

## 概述

本設計整合了現有的計算機架構 specs，實現完全模組化的醫療計算機系統。每個計算機都是獨立的模組，擁有自己的 Form 和 Results 組件，實現最大程度的客製化和隔離。

## 核心架構

### 1. 類型系統

```typescript
// src/components/calculators/types/calculator.ts
export interface CalculatorModule {
  id: string;
  config: CalculatorConfig;
  FormComponent: React.ComponentType<CalculatorFormProps>;
  ResultsComponent: React.ComponentType<CalculatorResultsProps>;
  calculator: CalculatorImplementation;
  metadata: CalculatorMetadata;
}

export interface CalculatorConfig {
  id: string;
  name: Record<SupportedLocale, string>;
  description: Record<SupportedLocale, string>;
  category: string;
  version: string;
  status: 'published' | 'draft' | 'deprecated';
  fields: CalculatorField[];
  medical: MedicalMetadata;
}

export interface CalculatorFormProps {
  values: Record<string, any>;
  errors: Record<string, string>;
  onChange: (fieldId: string, value: any) => void;
  onSubmit: () => void;
  onReset: () => void;
  isLoading: boolean;
  locale: SupportedLocale;
}

export interface CalculatorResultsProps {
  result: CalculationResult;
  locale: SupportedLocale;
  onExport?: (format: string) => void;
  onShare?: () => void;
}
```

### 2. 計算機註冊表

```typescript
// src/components/calculators/registry/CalculatorRegistry.ts
export class CalculatorRegistry {
  private static modules = new Map<string, CalculatorModule>();
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) return;

    const moduleLoader = new ModuleLoader();
    const modules = await moduleLoader.loadAllModules();
    
    modules.forEach(module => {
      this.modules.set(module.id, module);
    });

    this.initialized = true;
  }

  static get(id: string): CalculatorModule | undefined {
    return this.modules.get(id);
  }

  static getAll(): CalculatorModule[] {
    return Array.from(this.modules.values());
  }

  static getByCategory(category: string): CalculatorModule[] {
    return this.getAll().filter(module => module.config.category === category);
  }
}
```

### 3. 模組載入器

```typescript
// src/components/calculators/registry/ModuleLoader.ts
export class ModuleLoader {
  async loadAllModules(): Promise<CalculatorModule[]> {
    const modules: CalculatorModule[] = [];
    
    // 動態導入所有模組
    const moduleImports = import.meta.glob('../modules/*/index.tsx');
    
    for (const [path, importFn] of Object.entries(moduleImports)) {
      try {
        const module = await importFn() as { default: CalculatorModule };
        modules.push(module.default);
      } catch (error) {
        console.error(`Failed to load module from ${path}:`, error);
      }
    }

    return modules;
  }
}
```

### 4. 通用計算機容器

```typescript
// src/components/calculators/CalculatorContainer.tsx
export interface CalculatorContainerProps {
  calculatorId: string;
  locale?: SupportedLocale;
  className?: string;
}

export const CalculatorContainer: React.FC<CalculatorContainerProps> = ({
  calculatorId,
  locale = 'zh-TW',
  className = ''
}) => {
  const [module, setModule] = useState<CalculatorModule | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadModule = async () => {
      await CalculatorRegistry.initialize();
      const loadedModule = CalculatorRegistry.get(calculatorId);
      setModule(loadedModule || null);
    };

    loadModule();
  }, [calculatorId]);

  const handleValueChange = (fieldId: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
    setErrors(prev => ({ ...prev, [fieldId]: '' }));
  };

  const handleSubmit = async () => {
    if (!module) return;

    setIsLoading(true);
    setErrors({});

    try {
      // 驗證輸入
      const validation = module.calculator.validate(values);
      if (!validation.isValid) {
        const fieldErrors: Record<string, string> = {};
        validation.errors.forEach(error => {
          fieldErrors[error.field] = error.message;
        });
        setErrors(fieldErrors);
        return;
      }

      // 執行計算
      const calculationResult = module.calculator.calculate(values);
      setResult(calculationResult);
    } catch (error) {
      console.error('Calculation failed:', error);
      setErrors({ general: '計算過程中發生錯誤' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setValues({});
    setResult(null);
    setErrors({});
  };

  if (!module) {
    return <div>找不到計算機: {calculatorId}</div>;
  }

  const { FormComponent, ResultsComponent } = module;

  return (
    <ErrorBoundary>
      <div className={`calculator-container ${className}`}>
        <FormComponent
          values={values}
          errors={errors}
          onChange={handleValueChange}
          onSubmit={handleSubmit}
          onReset={handleReset}
          isLoading={isLoading}
          locale={locale}
        />
        
        {result && (
          <ResultsComponent
            result={result}
            locale={locale}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};
```

## 模組結構範例

### BMI 計算機模組

```typescript
// src/components/calculators/modules/bmi/index.tsx
import { CalculatorModule } from '../../types';
import BMIForm from './BMIForm';
import BMIResults from './BMIResults';
import { calculate, validate } from './calculator';
import { config } from './config';

const BMIModule: CalculatorModule = {
  id: 'bmi',
  config,
  FormComponent: BMIForm,
  ResultsComponent: BMIResults,
  calculator: { calculate, validate },
  metadata: {
    version: '1.0.0',
    author: 'Medical Team',
    lastUpdated: new Date().toISOString(),
  }
};

export default BMIModule;
```

```typescript
// src/components/calculators/modules/bmi/BMIForm.tsx
import React from 'react';
import { CalculatorFormProps } from '../../types';

const BMIForm: React.FC<CalculatorFormProps> = ({
  values,
  errors,
  onChange,
  onSubmit,
  onReset,
  isLoading,
  locale
}) => {
  return (
    <div className="bmi-form">
      <h2 className="text-2xl font-bold mb-6">BMI 計算器</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            體重 (kg) *
          </label>
          <input
            type="number"
            value={values.weight || ''}
            onChange={(e) => onChange('weight', parseFloat(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.weight ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="請輸入體重"
            disabled={isLoading}
          />
          {errors.weight && (
            <p className="mt-1 text-sm text-red-600">{errors.weight}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            身高 (cm) *
          </label>
          <input
            type="number"
            value={values.height || ''}
            onChange={(e) => onChange('height', parseFloat(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.height ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="請輸入身高"
            disabled={isLoading}
          />
          {errors.height && (
            <p className="mt-1 text-sm text-red-600">{errors.height}</p>
          )}
        </div>

        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        <div className="flex space-x-4 pt-4">
          <button
            onClick={onSubmit}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? '計算中...' : '計算'}
          </button>
          
          <button
            onClick={onReset}
            disabled={isLoading}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            重設
          </button>
        </div>
      </div>
    </div>
  );
};

export default BMIForm;
```

```typescript
// src/components/calculators/modules/bmi/BMIResults.tsx
import React from 'react';
import { CalculatorResultsProps } from '../../types';

const BMIResults: React.FC<CalculatorResultsProps> = ({
  result,
  locale
}) => {
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: '體重過輕', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    if (bmi < 25) return { category: '正常範圍', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (bmi < 30) return { category: '體重過重', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { category: '肥胖', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const bmiValue = result.primaryValue;
  const category = getBMICategory(bmiValue);

  return (
    <div className="bmi-results mt-8">
      <h3 className="text-xl font-semibold mb-6">計算結果</h3>
      
      {/* 主要結果卡片 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {bmiValue.toFixed(1)}
          </div>
          <div className="text-lg text-gray-600 mb-4">kg/m²</div>
          
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${category.color} ${category.bgColor}`}>
            {category.category}
          </div>
        </div>
      </div>

      {/* BMI 分類表 */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h4 className="font-semibold text-gray-900 mb-4">BMI 分類標準</h4>
        <div className="space-y-2">
          {[
            { range: '< 18.5', category: '體重過輕', color: 'border-blue-500' },
            { range: '18.5 - 24.9', category: '正常範圍', color: 'border-green-500' },
            { range: '25.0 - 29.9', category: '體重過重', color: 'border-yellow-500' },
            { range: '≥ 30.0', category: '肥胖', color: 'border-red-500' }
          ].map((item, index) => (
            <div key={index} className={`flex justify-between items-center p-3 bg-white rounded border-l-4 ${item.color}`}>
              <span className="font-medium">{item.category}</span>
              <span className="text-gray-600">{item.range}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 解釋和建議 */}
      {result.interpretation && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-3">結果解釋</h4>
          <p className="text-gray-700 mb-4">
            {result.interpretation[locale] || result.interpretation['zh-TW']}
          </p>
          
          {result.recommendations && result.recommendations.length > 0 && (
            <>
              <h5 className="font-medium text-gray-900 mb-2">建議</h5>
              <ul className="space-y-1">
                {result.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                    <span className="text-gray-700">
                      {rec[locale] || rec['zh-TW']}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BMIResults;
```

## 遷移策略

### 階段 1：建立基礎架構
1. 創建類型系統
2. 實現計算機註冊表
3. 建立模組載入器
4. 創建通用容器組件

### 階段 2：遷移現有計算機
1. 將 BMI 計算機轉換為模組化架構
2. 將 eGFR 計算機轉換為模組化架構  
3. 將 CHA2DS2-VASc 計算機轉換為模組化架構

### 階段 3：更新頁面和路由
1. 更新 Astro 頁面使用新的容器組件
2. 移除舊的通用組件
3. 更新測試

### 階段 4：優化和文檔
1. 效能優化
2. 更新文檔
3. 創建開發指南

這個設計確保了每個計算機都是完全獨立的模組，擁有自己的 Form 和 Results 組件，實現最大程度的客製化和隔離。