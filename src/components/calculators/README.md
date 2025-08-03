# 模組化計算機系統

這是一個完全模組化的醫療計算機系統，每個計算機都是獨立的模組，擁有自己的 Form 和 Results 組件。

## 架構概述

```
src/components/calculators/
├── types/                          # 統一類型定義
├── registry/                       # 計算機註冊表和載入器
├── common/                         # 共用組件
└── modules/                        # 計算機模組
    ├── bmi/                        # BMI 計算機模組
    ├── egfr/                       # eGFR 計算機模組
    └── cha2ds2-vasc/              # CHA2DS2-VASc 計算機模組
```

## 核心特性

- **完全模組化**：每個計算機都是獨立的模組
- **零耦合**：修改任何計算機不會影響其他計算機
- **自動發現**：新增計算機模組會自動被系統發現
- **錯誤隔離**：單個計算機的錯誤不會影響其他計算機
- **類型安全**：完整的 TypeScript 類型覆蓋

## 使用方法

### 在 Astro 頁面中使用

```astro
---
import CalculatorContainer from '../components/calculators/common/CalculatorContainer.tsx';
---

<CalculatorContainer 
  calculatorId="bmi"
  locale="zh-TW"
  client:load
/>
```

### 在 React 組件中使用

```tsx
import { CalculatorContainer } from '../components/calculators';

function MyComponent() {
  return (
    <CalculatorContainer 
      calculatorId="bmi"
      locale="zh-TW"
      onCalculationComplete={(result) => {
        console.log('計算完成:', result);
      }}
      onError={(error) => {
        console.error('計算錯誤:', error);
      }}
    />
  );
}
```

## 創建新的計算機模組

### 1. 創建模組目錄

```bash
mkdir src/components/calculators/modules/my-calculator
```

### 2. 創建必要檔案

每個計算機模組必須包含以下檔案：

- `index.tsx` - 模組入口
- `config.ts` - 配置和元數據
- `calculator.ts` - 計算邏輯
- `types.ts` - 模組特定類型
- `MyCalculatorForm.tsx` - 專用表單組件
- `MyCalculatorResults.tsx` - 專用結果組件
- `__tests__/calculator.test.ts` - 測試檔案

### 3. 實現模組入口 (index.tsx)

```tsx
import { CalculatorModule } from '../../types';
import MyCalculatorForm from './MyCalculatorForm';
import MyCalculatorResults from './MyCalculatorResults';
import { calculate, validate, formatResult } from './calculator';
import { config } from './config';

const MyCalculatorModule: CalculatorModule = {
  id: 'my-calculator',
  config,
  FormComponent: MyCalculatorForm,
  ResultsComponent: MyCalculatorResults,
  calculator: {
    calculate,
    validate,
    formatResult
  },
  metadata: {
    version: '1.0.0',
    author: 'Your Name',
    lastUpdated: new Date().toISOString(),
  }
};

export default MyCalculatorModule;
```

### 4. 實現配置 (config.ts)

```tsx
import { CalculatorConfig } from '../../types';

export const config: CalculatorConfig = {
  id: 'my-calculator',
  name: {
    'zh-TW': '我的計算機',
    'en': 'My Calculator'
  },
  description: {
    'zh-TW': '這是我的計算機描述',
    'en': 'This is my calculator description'
  },
  category: 'general',
  version: '1.0.0',
  status: 'published',
  fields: [
    // 定義輸入欄位
  ],
  calculation: {
    functionName: 'calculate',
    validationRules: {
      required: ['field1', 'field2'],
      dependencies: []
    }
  },
  medical: {
    specialty: ['general'],
    evidenceLevel: 'C',
    references: [],
    clinicalGuidelines: {
      'zh-TW': '臨床指引內容'
    }
  },
  metadata: {
    tags: ['tag1', 'tag2'],
    difficulty: 'basic',
    lastUpdated: '2024-01-26',
    author: 'Your Name'
  }
};
```

### 5. 實現計算邏輯 (calculator.ts)

```tsx
import { CalculationResult, ValidationResult } from '../../types';

export function calculate(inputs: Record<string, any>): CalculationResult {
  // 實現計算邏輯
  return {
    primaryValue: 0,
    primaryUnit: 'unit',
    primaryLabel: {
      'zh-TW': '結果',
      'en': 'Result'
    },
    interpretation: {
      'zh-TW': '結果解釋',
      'en': 'Result interpretation'
    },
    recommendations: []
  };
}

export function validate(inputs: Record<string, any>): ValidationResult {
  const errors = [];
  
  // 實現驗證邏輯
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function formatResult(result: CalculationResult, locale: string) {
  return {
    displayValue: `${result.primaryValue} ${result.primaryUnit}`,
    description: result.interpretation?.[locale] || '',
    recommendations: result.recommendations?.map(rec => rec[locale]) || []
  };
}
```

### 6. 實現表單組件 (MyCalculatorForm.tsx)

```tsx
import React from 'react';
import { CalculatorFormProps } from '../../types';

const MyCalculatorForm: React.FC<CalculatorFormProps> = ({
  values,
  errors,
  touched,
  onChange,
  onBlur,
  onSubmit,
  onReset,
  isLoading,
  locale
}) => {
  return (
    <div className="my-calculator-form">
      {/* 實現表單 UI */}
    </div>
  );
};

export default MyCalculatorForm;
```

### 7. 實現結果組件 (MyCalculatorResults.tsx)

```tsx
import React from 'react';
import { CalculatorResultsProps } from '../../types';

const MyCalculatorResults: React.FC<CalculatorResultsProps> = ({
  result,
  locale
}) => {
  return (
    <div className="my-calculator-results">
      {/* 實現結果展示 UI */}
    </div>
  );
};

export default MyCalculatorResults;
```

### 8. 編寫測試

```tsx
import { describe, it, expect } from 'vitest';
import { calculate, validate } from '../calculator';

describe('My Calculator', () => {
  describe('calculate', () => {
    it('should calculate correctly', () => {
      const result = calculate({ input: 10 });
      expect(result.primaryValue).toBe(10);
    });
  });

  describe('validate', () => {
    it('should validate inputs', () => {
      const result = validate({ input: 10 });
      expect(result.isValid).toBe(true);
    });
  });
});
```

## 最佳實踐

### 1. 命名規範

- 模組 ID 使用 kebab-case：`my-calculator`
- 組件名稱使用 PascalCase：`MyCalculatorForm`
- 檔案名稱與組件名稱一致

### 2. 類型安全

- 所有函數都應該有明確的類型定義
- 使用統一的類型介面
- 避免使用 `any` 類型

### 3. 錯誤處理

- 所有計算函數都應該處理邊界情況
- 提供有意義的錯誤訊息
- 使用錯誤邊界隔離錯誤

### 4. 國際化

- 所有使用者可見的文字都應該支援多語言
- 使用 `LocalizedString` 類型
- 提供至少中文和英文版本

### 5. 測試

- 每個計算機模組都應該有完整的測試覆蓋
- 測試計算邏輯、驗證邏輯和邊界情況
- 使用 Vitest 作為測試框架

## 故障排除

### 模組無法載入

1. 檢查模組目錄結構是否正確
2. 確認 `index.tsx` 檔案存在且有預設匯出
3. 檢查控制台是否有錯誤訊息

### 計算結果不正確

1. 檢查計算邏輯實現
2. 確認輸入驗證是否正確
3. 運行單元測試驗證

### 樣式問題

1. 確認使用了正確的 CSS 類別
2. 檢查 Tailwind CSS 配置
3. 使用瀏覽器開發者工具調試

## 貢獻指南

1. Fork 專案
2. 創建功能分支
3. 實現新的計算機模組
4. 編寫測試
5. 提交 Pull Request

## 授權

MIT License