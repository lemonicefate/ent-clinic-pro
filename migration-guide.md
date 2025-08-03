# 統一計算機架構遷移指南

## 概述

本指南將幫助開發者將現有的計算機從舊的插件系統遷移到新的統一模組化架構。新架構提供了更好的類型安全、錯誤處理和可維護性。

## 遷移概覽

### 舊架構 vs 新架構

| 特性 | 舊架構 (Plugin System) | 新架構 (Unified Modules) |
|------|------------------------|---------------------------|
| 組件結構 | 單一 PluginCalculator | 獨立 Form + Results 組件 |
| 類型系統 | 部分 TypeScript | 完整 TypeScript 覆蓋 |
| 錯誤處理 | 基礎錯誤處理 | 完整錯誤邊界和降級 |
| 模組載入 | 手動註冊 | 自動發現和載入 |
| 測試支援 | 有限測試 | 完整測試覆蓋 |
| 國際化 | 基礎支援 | 完整多語言支援 |

## 遷移步驟

### Step 1: 分析現有計算機

首先，識別需要遷移的計算機：

```bash
# 查找使用舊 PluginCalculator 的頁面
grep -r "PluginCalculator" src/pages/tools/
```

**已識別的計算機：**
- ✅ BMI Calculator (已遷移)
- ✅ eGFR Calculator (已遷移)  
- ✅ CHA2DS2-VASc Calculator (已遷移)
- ⚠️ Amoxicillin/Clavulanate Dose Calculator (待遷移)
- ⚠️ Lipid Management Calculator (待遷移)
- ⚠️ Pediatric Antibiotic Calculator (待遷移)

### Step 2: 創建模組結構

為每個計算機創建新的模組目錄：

```bash
mkdir -p src/components/calculators/modules/{calculator-id}
cd src/components/calculators/modules/{calculator-id}

# 創建必要檔案
touch index.tsx config.ts types.ts calculator.ts
touch {CalculatorName}Form.tsx {CalculatorName}Results.tsx
mkdir __tests__ && touch __tests__/calculator.test.ts
```

### Step 3: 遷移配置

#### 舊配置格式 (Plugin)
```typescript
// 舊的靜態配置
const pluginMetadata = {
  id: 'bmi',
  namespace: 'general',
  version: '1.0.0',
  name: {
    'zh-TW': 'BMI 計算器',
    'en': 'BMI Calculator'
  },
  description: {
    'zh-TW': '身體質量指數計算器',
    'en': 'Body Mass Index calculator'
  },
  tags: ['general', 'bmi', 'weight']
};
```

#### 新配置格式 (Module)
```typescript
// config.ts
import { CalculatorConfig } from '../../types';

export const config: CalculatorConfig = {
  id: 'bmi',
  name: {
    'zh-TW': 'BMI 身體質量指數計算機',
    'en': 'BMI Body Mass Index Calculator',
    'ja': 'BMI 体格指数計算機'
  },
  description: {
    'zh-TW': '計算身體質量指數 (BMI) 並評估體重狀態',
    'en': 'Calculate Body Mass Index (BMI) and assess weight status',
    'ja': '体格指数 (BMI) を計算し、体重状態を評価'
  },
  category: 'general',
  version: '1.0.0',
  status: 'published',
  
  fields: [
    {
      id: 'weight',
      type: 'number',
      label: {
        'zh-TW': '體重',
        'en': 'Weight',
        'ja': '体重'
      },
      required: true,
      min: 20,
      max: 300,
      unit: 'kg'
    }
    // 更多欄位...
  ],
  
  medical: {
    specialty: ['general', 'internal-medicine'],
    evidenceLevel: 'A',
    references: [
      {
        title: 'WHO Expert Committee on Physical Status',
        authors: ['World Health Organization'],
        journal: 'WHO Technical Report Series',
        year: 1995
      }
    ]
  },
  
  metadata: {
    tags: ['BMI', 'body mass index', 'weight management'],
    difficulty: 'basic',
    estimatedTime: 2
  }
};
```

### Step 4: 遷移計算邏輯

#### 舊計算邏輯
```typescript
// 舊的計算函數
function calculateBMI(weight: number, height: number) {
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  return {
    bmi: Math.round(bmi * 10) / 10,
    category: getBMICategory(bmi)
  };
}
```

#### 新計算邏輯
```typescript
// calculator.ts
import { BMIInputs, BMIResult } from './types';
import { CalculationResult, ValidationError } from '../../types';

export function validate(inputs: BMIInputs): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!inputs.weight || inputs.weight <= 0) {
    errors.push({
      field: 'weight',
      message: {
        'zh-TW': '請輸入有效的體重',
        'en': 'Please enter a valid weight',
        'ja': '有効な体重を入力してください'
      }
    });
  }
  
  return errors;
}

export function calculate(inputs: BMIInputs): CalculationResult<BMIResult> {
  const validationErrors = validate(inputs);
  if (validationErrors.length > 0) {
    return {
      success: false,
      errors: validationErrors
    };
  }

  try {
    const { weight, height } = inputs;
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    const result: BMIResult = {
      bmi: Math.round(bmi * 10) / 10,
      category: getBMICategory(bmi),
      riskLevel: getRiskLevel(bmi),
      interpretation: generateInterpretation(bmi),
      recommendations: generateRecommendations(bmi),
      calculationSteps: [
        {
          description: '身高轉換為公尺',
          value: `${heightInMeters.toFixed(2)} m`,
          formula: `${height} cm ÷ 100`
        },
        {
          description: 'BMI 計算',
          value: `${bmi.toFixed(1)}`,
          formula: `${weight} ÷ (${heightInMeters.toFixed(2)})²`
        }
      ]
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

export function formatResult(result: BMIResult, locale: string = 'zh-TW'): string {
  return `BMI: ${result.bmi} (${result.category})`;
}
```

### Step 5: 創建組件

#### 表單組件
```typescript
// BMIForm.tsx
import React, { useState, useCallback } from 'react';
import { BMIInputs } from './types';
import { config } from './config';

interface BMIFormProps {
  onCalculate: (inputs: BMIInputs) => void;
  locale?: string;
  isLoading?: boolean;
}

const BMIForm: React.FC<BMIFormProps> = ({ 
  onCalculate, 
  locale = 'zh-TW',
  isLoading = false 
}) => {
  const [inputs, setInputs] = useState<BMIInputs>({
    weight: 0,
    height: 0
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(inputs);
  }, [inputs, onCalculate]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 表單欄位實現 */}
    </form>
  );
};

export default BMIForm;
```

#### 結果組件
```typescript
// BMIResults.tsx
import React from 'react';
import { BMIResult } from './types';

interface BMIResultsProps {
  result: BMIResult;
  locale?: string;
  onReset?: () => void;
}

const BMIResults: React.FC<BMIResultsProps> = ({ 
  result, 
  locale = 'zh-TW',
  onReset 
}) => {
  return (
    <div className="space-y-6">
      {/* 結果展示實現 */}
    </div>
  );
};

export default BMIResults;
```

### Step 6: 更新頁面

#### 舊頁面格式
```astro
---
import PluginCalculator from '../../components/islands/PluginCalculator.tsx';
---

<PluginCalculator 
  client:load
  pluginId="general.bmi"
  locale={locale}
  className="bmi-calculator"
/>
```

#### 新頁面格式
```astro
---
import CalculatorContainer from '../../components/calculators/common/CalculatorContainer.tsx';
---

<CalculatorContainer 
  client:load
  calculatorId="bmi"
  locale={locale}
  className="bmi-calculator"
/>
```

### Step 7: 編寫測試

```typescript
// __tests__/calculator.test.ts
import { describe, it, expect } from 'vitest';
import { calculate, validate, formatResult } from '../calculator';
import { BMIInputs } from '../types';

describe('BMI Calculator', () => {
  describe('validate', () => {
    it('should pass validation with valid inputs', () => {
      const inputs: BMIInputs = {
        weight: 70,
        height: 170
      };

      const errors = validate(inputs);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid weight', () => {
      const inputs: BMIInputs = {
        weight: 0,
        height: 170
      };

      const errors = validate(inputs);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('weight');
    });
  });

  describe('calculate', () => {
    it('should calculate BMI correctly', () => {
      const inputs: BMIInputs = {
        weight: 70,
        height: 170
      };

      const result = calculate(inputs);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.result.bmi).toBeCloseTo(24.2, 1);
        expect(result.result.category).toBeDefined();
      }
    });
  });
});
```

## 遷移檢查清單

### 準備階段
- [ ] 識別所有需要遷移的計算機
- [ ] 分析現有計算邏輯和配置
- [ ] 準備測試數據和預期結果

### 實施階段
- [ ] 創建模組目錄結構
- [ ] 遷移配置到新格式
- [ ] 重構計算邏輯
- [ ] 創建 Form 和 Results 組件
- [ ] 編寫完整的測試套件

### 驗證階段
- [ ] 運行所有測試確保通過
- [ ] 驗證計算結果準確性
- [ ] 檢查多語言功能
- [ ] 測試錯誤處理機制
- [ ] 驗證無障礙性合規

### 部署階段
- [ ] 更新相關頁面使用新組件
- [ ] 更新文檔和指南
- [ ] 監控效能指標
- [ ] 收集用戶反饋

## 常見問題和解決方案

### Q1: 如何處理複雜的計算邏輯？
**A:** 將複雜邏輯分解為多個小函數，每個函數負責特定的計算步驟，並為每個步驟編寫單獨的測試。

### Q2: 如何保持向後兼容性？
**A:** 在遷移期間，可以同時保留舊的 PluginCalculator 和新的 CalculatorContainer，逐步遷移各個頁面。

### Q3: 如何處理特殊的 UI 需求？
**A:** 新架構允許完全自定義 Form 和 Results 組件，可以根據具體需求設計專門的界面。

### Q4: 如何確保醫療準確性？
**A:** 在 config.ts 中詳細記錄參考文獻和醫療指引，並邀請相關專科醫師審查計算邏輯。

## 遷移時程

### Week 1: 準備和規劃
- 完成現有計算機分析
- 制定詳細遷移計劃
- 準備測試環境

### Week 2-3: 核心遷移
- 遷移剩餘的計算機模組
- 更新所有相關頁面
- 完成測試編寫

### Week 4: 驗證和優化
- 進行全面測試
- 效能優化
- 文檔更新

## 成功指標

- ✅ 所有計算機成功遷移到新架構
- ✅ 測試覆蓋率達到 90%+
- ✅ 頁面載入時間 < 3秒
- ✅ 計算準確性 100% 保持
- ✅ 多語言功能正常運作
- ✅ 無障礙性合規

通過遵循這個遷移指南，開發團隊可以順利地將現有計算機遷移到新的統一架構，享受更好的開發體驗和系統可維護性。