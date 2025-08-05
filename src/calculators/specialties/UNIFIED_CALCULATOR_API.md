# 統一計算機架構 API 文檔

本文檔詳細說明統一計算機架構的 API 介面、類型定義和使用方法。

## 📋 目錄

- [核心類型](#核心類型)
- [計算機模組介面](#計算機模組介面)
- [註冊表 API](#註冊表-api)
- [容器組件 API](#容器組件-api)
- [錯誤處理](#錯誤處理)
- [使用範例](#使用範例)
- [最佳實踐](#最佳實踐)

## 核心類型

### 通用類型

```typescript
// src/components/calculators/types/common.ts

export type SupportedLocale = 'zh-TW' | 'en' | 'ja';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export type CalculatorStatus = 'published' | 'draft' | 'deprecated';

export type FieldType = 'number' | 'select' | 'boolean' | 'text' | 'date';

export type LocalizedString = Record<SupportedLocale, string>;

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface Reference {
  title: LocalizedString;
  url: string;
  type: 'guideline' | 'study' | 'calculator' | 'other';
}

export interface MedicalMetadata {
  specialty: string[];
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  clinicalGuidelines: LocalizedString;
  references?: Reference[];
  lastReviewed?: string;
  reviewedBy?: string;
}
```

### 配置類型

```typescript
// src/components/calculators/types/config.ts

export interface FieldOption {
  value: string | number | boolean;
  label: LocalizedString;
  description?: LocalizedString;
}

export interface CalculatorField {
  id: string;
  type: FieldType;
  label: LocalizedString;
  description?: LocalizedString;
  required: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: FieldOption[];
  defaultValue?: any;
  validation?: {
    pattern?: string;
    message?: LocalizedString;
  };
  dependencies?: {
    field: string;
    condition: any;
  }[];
}

export interface CalculatorConfig {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  category: string;
  version: string;
  status: CalculatorStatus;
  fields: CalculatorField[];
  medical: MedicalMetadata;
  tags?: string[];
  difficulty?: 'basic' | 'intermediate' | 'advanced';
  estimatedTime?: number; // 預估完成時間（分鐘）
}
```

### 結果類型

```typescript
// src/components/calculators/types/results.ts

export interface CalculationBreakdown {
  step: number;
  description: LocalizedString;
  formula?: string;
  value: number | string;
  unit?: string;
}

export interface FormattedResult {
  primaryValue: number | string;
  primaryUnit?: string;
  secondaryValues?: Array<{
    label: LocalizedString;
    value: number | string;
    unit?: string;
  }>;
  riskLevel?: RiskLevel;
  category?: string;
  interpretation?: LocalizedString;
  recommendations?: LocalizedString[];
  breakdown?: CalculationBreakdown[];
  visualizations?: {
    type: 'chart' | 'gauge' | 'progress' | 'table';
    data: any;
    config?: any;
  }[];
  warnings?: LocalizedString[];
  nextSteps?: LocalizedString[];
}

export interface CalculationResult {
  success: boolean;
  result?: FormattedResult;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    calculationTime: number;
    version: string;
    timestamp: string;
  };
}
```

## 計算機模組介面

### 核心介面

```typescript
// src/components/calculators/types/calculator.ts

export interface CalculatorImplementation {
  /**
   * 執行計算
   * @param inputs 輸入數據
   * @returns 計算結果
   */
  calculate: (inputs: Record<string, any>) => CalculationResult;
  
  /**
   * 驗證輸入數據
   * @param inputs 輸入數據
   * @returns 驗證結果
   */
  validate: (inputs: Record<string, any>) => ValidationResult;
  
  /**
   * 格式化結果（可選）
   * @param result 計算結果
   * @param locale 語言設定
   * @returns 格式化的結果
   */
  formatResult?: (result: CalculationResult, locale: SupportedLocale) => FormattedResult;
}

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

export interface CalculatorResultsProps {
  result: CalculationResult;
  locale: SupportedLocale;
  onExport?: (format: 'pdf' | 'png' | 'json' | 'csv') => void;
  onShare?: (platform: 'email' | 'link' | 'print') => void;
  onSave?: () => void;
  className?: string;
}

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

export interface CalculatorModule {
  id: string;
  config: CalculatorConfig;
  FormComponent: React.ComponentType<CalculatorFormProps>;
  ResultsComponent: React.ComponentType<CalculatorResultsProps>;
  calculator: CalculatorImplementation;
  metadata: CalculatorMetadata;
  
  // 生命週期鉤子（可選）
  onLoad?: () => Promise<void>;
  onUnload?: () => Promise<void>;
  onError?: (error: Error) => void;
}
```

### 模組載入結果

```typescript
export interface ModuleLoadResult {
  success: boolean;
  module?: CalculatorModule;
  error?: string;
}
```

## 註冊表 API

### CalculatorRegistry

```typescript
// src/components/calculators/registry/CalculatorRegistry.ts

export class CalculatorRegistry {
  /**
   * 初始化註冊表
   */
  static async initialize(): Promise<void>;
  
  /**
   * 獲取指定計算機模組
   * @param id 計算機 ID
   * @returns 計算機模組或 undefined
   */
  static get(id: string): CalculatorModule | undefined;
  
  /**
   * 獲取所有計算機模組
   * @returns 所有計算機模組陣列
   */
  static getAll(): CalculatorModule[];
  
  /**
   * 根據分類獲取計算機模組
   * @param category 分類名稱
   * @returns 該分類的計算機模組陣列
   */
  static getByCategory(category: string): CalculatorModule[];
  
  /**
   * 搜尋計算機模組
   * @param query 搜尋查詢
   * @returns 符合條件的計算機模組陣列
   */
  static search(query: SearchQuery): CalculatorModule[];
  
  /**
   * 檢查註冊表是否已初始化
   * @returns 是否已初始化
   */
  static isInitialized(): boolean;
  
  /**
   * 獲取註冊表統計資訊
   * @returns 統計資訊
   */
  static getStats(): {
    totalModules: number;
    categories: string[];
    loadTime: number;
  };
}

export interface SearchQuery {
  text?: string;
  category?: string;
  tags?: string[];
  difficulty?: 'basic' | 'intermediate' | 'advanced';
  specialty?: string[];
  status?: 'published' | 'draft' | 'deprecated';
}
```

### ModuleLoader

```typescript
// src/components/calculators/registry/ModuleLoader.ts

export class ModuleLoader {
  /**
   * 載入所有計算機模組
   * @returns 載入的模組陣列
   */
  async loadAllModules(): Promise<CalculatorModule[]>;
  
  /**
   * 載入指定模組
   * @param moduleId 模組 ID
   * @returns 載入結果
   */
  async loadModule(moduleId: string): Promise<ModuleLoadResult>;
  
  /**
   * 重新載入模組
   * @param moduleId 模組 ID
   * @returns 載入結果
   */
  async reloadModule(moduleId: string): Promise<ModuleLoadResult>;
  
  /**
   * 卸載模組
   * @param moduleId 模組 ID
   */
  async unloadModule(moduleId: string): Promise<void>;
  
  /**
   * 獲取載入統計
   * @returns 載入統計資訊
   */
  getLoadStats(): {
    totalLoaded: number;
    loadTime: number;
    errors: string[];
  };
}
```

## 容器組件 API

### CalculatorContainer

```typescript
// src/components/calculators/common/CalculatorContainer.tsx

export interface CalculatorContainerProps {
  calculatorId: string;
  locale?: SupportedLocale;
  className?: string;
  onCalculationComplete?: (result: CalculationResult) => void;
  onError?: (error: Error) => void;
  initialValues?: Record<string, any>;
  readOnly?: boolean;
  showMetadata?: boolean;
}

export const CalculatorContainer: React.FC<CalculatorContainerProps>;
```

### 使用範例

```tsx
import { CalculatorContainer } from '@/components/calculators/common/CalculatorContainer';

// 基本使用
<CalculatorContainer calculatorId="bmi" />

// 完整配置
<CalculatorContainer
  calculatorId="bmi"
  locale="zh-TW"
  className="my-calculator"
  initialValues={{ weight: 70, height: 170 }}
  onCalculationComplete={(result) => {
    console.log('計算完成:', result);
  }}
  onError={(error) => {
    console.error('計算錯誤:', error);
  }}
  showMetadata={true}
/>
```

## 錯誤處理

### CalculatorError

```typescript
// src/components/calculators/registry/ErrorHandler.ts

export interface CalculatorError extends Error {
  calculatorId?: string;
  type: 'LOAD_ERROR' | 'VALIDATION_ERROR' | 'CALCULATION_ERROR' | 'RENDER_ERROR' | 'UNKNOWN_ERROR';
  context?: Record<string, any>;
  recoverable: boolean;
}

export class ErrorHandler {
  /**
   * 記錄錯誤
   * @param error 錯誤物件
   * @param calculatorId 計算機 ID
   * @param context 錯誤上下文
   */
  logError(error: Error, calculatorId?: string, context?: Record<string, any>): void;
  
  /**
   * 獲取錯誤歷史
   * @param calculatorId 計算機 ID（可選）
   * @returns 錯誤陣列
   */
  getErrors(calculatorId?: string): CalculatorError[];
  
  /**
   * 清除錯誤
   * @param calculatorId 計算機 ID（可選）
   */
  clearErrors(calculatorId?: string): void;
  
  /**
   * 檢查錯誤是否可恢復
   * @param error 錯誤物件
   * @returns 是否可恢復
   */
  isRecoverable(error: Error): boolean;
}
```

### ErrorBoundary

```tsx
// src/components/calculators/common/ErrorBoundary.tsx

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps>;
```

## 使用範例

### 創建新的計算機模組

```typescript
// src/components/calculators/modules/example/index.tsx

import { CalculatorModule } from '../../types';
import ExampleForm from './ExampleForm';
import ExampleResults from './ExampleResults';
import { calculate, validate } from './calculator';
import { config } from './config';

const ExampleModule: CalculatorModule = {
  id: 'example',
  config,
  FormComponent: ExampleForm,
  ResultsComponent: ExampleResults,
  calculator: { calculate, validate },
  metadata: {
    version: '1.0.0',
    author: 'Medical Team',
    lastUpdated: new Date().toISOString(),
  }
};

export default ExampleModule;
```

### 實現計算邏輯

```typescript
// src/components/calculators/modules/example/calculator.ts

import { CalculationResult, ValidationResult } from '../../types';
import { ExampleInputs, ExampleResult } from './types';

export function validate(inputs: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = [];
  
  // 驗證邏輯
  if (!inputs.value1 || inputs.value1 <= 0) {
    errors.push({
      field: 'value1',
      message: '請輸入有效的數值'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function calculate(inputs: Record<string, any>): CalculationResult {
  const typedInputs = inputs as ExampleInputs;
  
  try {
    // 計算邏輯
    const result = typedInputs.value1 * typedInputs.value2;
    
    return {
      success: true,
      result: {
        primaryValue: result,
        primaryUnit: 'units',
        interpretation: {
          'zh-TW': `計算結果為 ${result}`,
          'en': `The result is ${result}`,
          'ja': `結果は ${result} です`
        },
        breakdown: [
          {
            step: 1,
            description: {
              'zh-TW': '執行計算',
              'en': 'Perform calculation',
              'ja': '計算を実行'
            },
            formula: 'value1 × value2',
            value: result
          }
        ]
      },
      metadata: {
        calculationTime: Date.now(),
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'CALCULATION_ERROR',
        message: '計算過程中發生錯誤',
        details: error
      }
    };
  }
}
```

### 使用註冊表

```typescript
// 在應用程式中使用註冊表

import { CalculatorRegistry } from '@/components/calculators/registry';

// 初始化註冊表
await CalculatorRegistry.initialize();

// 獲取所有計算機
const allCalculators = CalculatorRegistry.getAll();

// 獲取特定計算機
const bmiCalculator = CalculatorRegistry.get('bmi');

// 搜尋計算機
const cardiologyCalculators = CalculatorRegistry.search({
  category: 'cardiology'
});

// 獲取統計資訊
const stats = CalculatorRegistry.getStats();
console.log(`載入了 ${stats.totalModules} 個計算機模組`);
```

## 最佳實踐

### 1. 類型安全

```typescript
// 總是使用強類型
interface MyCalculatorInputs {
  value1: number;
  value2: number;
}

// 避免使用 any
function calculate(inputs: MyCalculatorInputs): CalculationResult {
  // 實現
}
```

### 2. 錯誤處理

```typescript
// 總是處理錯誤情況
export function calculate(inputs: Record<string, any>): CalculationResult {
  try {
    // 計算邏輯
    return { success: true, result: /* ... */ };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'CALCULATION_ERROR',
        message: error.message
      }
    };
  }
}
```

### 3. 國際化

```typescript
// 總是提供多語言支援
const config: CalculatorConfig = {
  name: {
    'zh-TW': '中文名稱',
    'en': 'English Name',
    'ja': '日本語名前'
  },
  // ...
};
```

### 4. 測試

```typescript
// 為每個函數編寫測試
describe('MyCalculator', () => {
  it('should calculate correctly', () => {
    const result = calculate({ value1: 10, value2: 20 });
    expect(result.success).toBe(true);
    expect(result.result?.primaryValue).toBe(200);
  });
  
  it('should validate inputs', () => {
    const result = validate({ value1: -1 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });
});
```

### 5. 效能優化

```typescript
// 使用 React.memo 優化組件
const MyCalculatorForm = React.memo<CalculatorFormProps>(({ values, onChange }) => {
  // 組件實現
});

// 使用 useMemo 優化計算
const expensiveCalculation = useMemo(() => {
  return performExpensiveCalculation(values);
}, [values]);
```

## API 版本

當前 API 版本：**v1.0.0**

### 版本歷史

- **v1.0.0** (2025-01-30): 初始版本，包含完整的統一計算機架構
- 未來版本將保持向後相容性

### 升級指南

當 API 有重大變更時，我們將提供詳細的升級指南和遷移工具。

## 支援

如需 API 支援，請：

1. 查看本文檔的相關章節
2. 參考現有模組的實現範例
3. 運行測試以驗證實現
4. 查看 TypeScript 類型定義

## 結論

統一計算機架構 API 提供了強大、靈活且類型安全的介面，讓開發者能夠輕鬆創建和維護醫療計算工具。遵循本文檔的指引，您可以充分利用架構的所有功能，創建高品質的計算機模組。