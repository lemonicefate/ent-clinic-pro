# 計算機模組生成器指南

## 概述

基於我們已經實施的統一計算機架構，這個指南將幫助開發者快速創建新的計算機模組。

## 模組結構

每個計算機模組都應該包含以下檔案：

```
src/components/calculators/modules/{module-id}/
├── index.tsx              # 模組入口點
├── config.ts              # 模組配置
├── types.ts               # 類型定義
├── calculator.ts          # 計算邏輯
├── {ModuleName}Form.tsx   # 表單組件
├── {ModuleName}Results.tsx # 結果組件
└── __tests__/
    └── calculator.test.ts # 測試檔案
```

## 快速開始模板

### 1. 模組入口點 (index.tsx)

```typescript
import { CalculatorModule } from '../../types';
import {ModuleName}Form from './{ModuleName}Form';
import {ModuleName}Results from './{ModuleName}Results';
import { calculate, validate, formatResult } from './calculator';
import { config } from './config';

const {ModuleName}Module: CalculatorModule = {
  id: '{module-id}',
  config,
  FormComponent: {ModuleName}Form,
  ResultsComponent: {ModuleName}Results,
  calculator: {
    calculate,
    validate,
    formatResult
  },
  metadata: {
    version: '1.0.0',
    author: 'Astro Clinical Platform',
    lastUpdated: new Date().toISOString(),
    dependencies: [],
    conflicts: [],
    changelog: [
      {
        version: '1.0.0',
        date: new Date().toISOString().split('T')[0],
        changes: [
          '初始版本發布',
          // 添加更多變更記錄
        ]
      }
    ]
  },

  onLoad: async () => {
    console.log('🏥 {ModuleName} Calculator module loaded');
  },

  onUnload: async () => {
    console.log('👋 {ModuleName} Calculator module unloaded');
  },

  onError: (error: Error) => {
    console.error('❌ {ModuleName} Calculator module error:', error);
  }
};

export default {ModuleName}Module;
```

### 2. 配置檔案 (config.ts)

```typescript
import { CalculatorConfig } from '../../types';

export const config: CalculatorConfig = {
  id: '{module-id}',
  name: {
    'zh-TW': '{中文名稱}',
    'en': '{English Name}',
    'ja': '{日本語名前}'
  },
  description: {
    'zh-TW': '{中文描述}',
    'en': '{English Description}',
    'ja': '{日本語説明}'
  },
  category: '{category}', // 'general', 'cardiology', 'nephrology', etc.
  version: '1.0.0',
  status: 'published',
  
  fields: [
    // 定義輸入欄位
    {
      id: 'field1',
      type: 'number',
      label: {
        'zh-TW': '欄位1',
        'en': 'Field 1',
        'ja': 'フィールド1'
      },
      required: true,
      min: 0,
      max: 100,
      // 更多欄位配置...
    }
  ],
  
  calculation: {
    functionName: 'calculate',
    validationRules: {
      required: ['field1'],
      dependencies: []
    }
  },
  
  medical: {
    specialty: ['{specialty}'],
    evidenceLevel: 'A', // A, B, C
    references: [
      {
        title: '{參考文獻標題}',
        authors: ['{作者}'],
        journal: '{期刊}',
        year: 2024,
        // 更多參考資料...
      }
    ],
    clinicalGuidelines: {
      'zh-TW': '{臨床指引中文}',
      'en': '{Clinical Guidelines English}',
      'ja': '{臨床ガイドライン日本語}'
    }
  },
  
  metadata: {
    tags: ['{tag1}', '{tag2}'],
    difficulty: 'basic', // 'basic', 'intermediate', 'advanced'
    lastUpdated: new Date().toISOString().split('T')[0],
    author: 'Astro Clinical Platform',
    estimatedTime: 3 // 預估使用時間（分鐘）
  }
};
```

### 3. 類型定義 (types.ts)

```typescript
export interface {ModuleName}Inputs {
  field1: number;
  field2?: string;
  // 定義所有輸入欄位的類型
}

export interface {ModuleName}Result {
  result: number;
  category: string;
  interpretation: string;
  recommendations: string[];
  calculationSteps: Array<{
    description: string;
    value: string;
    formula: string;
  }>;
}

// 如果需要，定義額外的類型和常數
export const RESULT_CATEGORIES = [
  // 定義結果分類
];
```

### 4. 計算邏輯 (calculator.ts)

```typescript
import { {ModuleName}Inputs, {ModuleName}Result } from './types';
import { CalculationResult, ValidationError } from '../../types';

export function validate(inputs: {ModuleName}Inputs): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // 實現驗證邏輯
  if (!inputs.field1 || inputs.field1 <= 0) {
    errors.push({
      field: 'field1',
      message: {
        'zh-TW': '請輸入有效的數值',
        'en': 'Please enter a valid value',
        'ja': '有効な値を入力してください'
      }
    });
  }
  
  return errors;
}

export function calculate(inputs: {ModuleName}Inputs): CalculationResult<{ModuleName}Result> {
  const validationErrors = validate(inputs);
  if (validationErrors.length > 0) {
    return {
      success: false,
      errors: validationErrors
    };
  }

  try {
    // 實現計算邏輯
    const result: {ModuleName}Result = {
      result: 0, // 計算結果
      category: '', // 結果分類
      interpretation: '', // 結果解釋
      recommendations: [], // 建議
      calculationSteps: [] // 計算步驟
    };

    return {
      success: true,
      result
    };
  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'general',
        message: {
          'zh-TW': '計算過程中發生錯誤',
          'en': 'An error occurred during calculation',
          'ja': '計算中にエラーが発生しました'
        }
      }]
    };
  }
}

export function formatResult(result: {ModuleName}Result, locale: string = 'zh-TW'): string {
  return `結果: ${result.result}`;
}
```

## 開發檢查清單

### 實施前
- [ ] 確定計算機的醫療用途和目標用戶
- [ ] 收集相關的醫療指引和參考文獻
- [ ] 設計輸入欄位和驗證規則
- [ ] 規劃結果展示和建議內容

### 實施中
- [ ] 創建所有必要的檔案
- [ ] 實現完整的類型定義
- [ ] 編寫準確的計算邏輯
- [ ] 設計直觀的表單界面
- [ ] 創建清晰的結果展示
- [ ] 添加多語言支援

### 實施後
- [ ] 編寫完整的單元測試
- [ ] 驗證計算準確性
- [ ] 檢查醫療指引合規性
- [ ] 測試多語言功能
- [ ] 進行無障礙性測試
- [ ] 更新文檔

## 最佳實踐

### 醫療準確性
1. **基於證據**: 所有計算都應基於最新的醫療指引
2. **參考文獻**: 提供完整的學術參考
3. **限制說明**: 清楚說明使用限制和禁忌症
4. **專業審查**: 建議由相關專科醫師審查

### 代碼品質
1. **類型安全**: 使用嚴格的 TypeScript 類型
2. **錯誤處理**: 實現完整的錯誤處理機制
3. **測試覆蓋**: 確保 90%+ 的測試覆蓋率
4. **代碼風格**: 遵循專案的代碼風格指南

### 用戶體驗
1. **直觀界面**: 設計清晰易懂的表單
2. **即時反饋**: 提供即時的驗證反饋
3. **響應式設計**: 支援各種設備尺寸
4. **無障礙性**: 遵循 WCAG 指南

## 範例：創建新的血壓分類計算機

```bash
# 1. 創建模組目錄
mkdir -p src/components/calculators/modules/blood-pressure

# 2. 複製模板檔案並修改
# 3. 實現血壓分類邏輯
# 4. 添加測試
# 5. 更新註冊表（自動發現）
```

這個生成器指南將幫助團隊快速且一致地創建新的計算機模組，確保所有模組都遵循統一的架構和最佳實踐。