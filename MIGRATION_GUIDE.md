# 統一計算機架構遷移指南

本指南說明如何將現有的計算機從舊的插件架構遷移到新的統一模組化架構。

## 📋 目錄

- [概述](#概述)
- [架構對比](#架構對比)
- [遷移步驟](#遷移步驟)
- [程式碼範例](#程式碼範例)
- [測試遷移](#測試遷移)
- [故障排除](#故障排除)
- [最佳實踐](#最佳實踐)

## 概述

### 為什麼要遷移？

新的統一計算機架構提供了以下優勢：

- ✅ **完全模組化**: 每個計算機都是獨立的模組
- ✅ **零耦合**: 計算機之間完全隔離
- ✅ **自動發現**: 新增模組會自動被系統發現
- ✅ **錯誤隔離**: 單個計算機錯誤不會影響整個系統
- ✅ **類型安全**: 100% TypeScript 類型覆蓋
- ✅ **易於測試**: 每個模組都有獨立的測試
- ✅ **效能優化**: 更快的載入時間和更小的包大小

### 遷移狀態

#### ✅ 已完成遷移
- BMI 計算機
- eGFR 計算機  
- CHA2DS2-VASc 計算機

#### ⚠️ 待遷移 (使用舊插件架構)
- 血脂管理計算機 (`src/calculators/specialties/cardiology/lipid-management/`)
- 兒童抗生素劑量計算機 (`src/calculators/specialties/pediatrics/pediatric-antibiotic-calculator/`)
- Amoxicillin/Clavulanate 劑量計算機 (`src/calculators/specialties/pediatrics/amoxicillin-clavulanate-dose/`)

## 架構對比

### 舊架構 (插件系統)

```
src/calculators/specialties/[specialty]/[calculator]/
├── index.ts                    # 插件配置
├── calculator.ts               # 計算邏輯
├── types.ts                    # 類型定義
└── __tests__/                  # 測試
    └── calculator.test.ts
```

**使用方式**:
```tsx
<PluginCalculator pluginId="cardiology.lipid-management" />
```

### 新架構 (統一模組)

```
src/components/calculators/modules/[calculator]/
├── index.tsx                   # 模組入口
├── config.ts                   # 配置和元數據
├── calculator.ts               # 計算邏輯
├── types.ts                    # 類型定義
├── [Calculator]Form.tsx        # 專用表單組件
├── [Calculator]Results.tsx     # 專用結果組件
└── __tests__/                  # 測試
    └── calculator.test.ts
```

**使用方式**:
```tsx
<CalculatorContainer calculatorId="lipid-management" />
```

## 遷移步驟

### 步驟 1: 準備工作

1. **備份現有代碼**
   ```bash
   git checkout -b migrate-[calculator-name]
   ```

2. **分析現有計算機**
   - 檢查計算邏輯
   - 識別輸入和輸出類型
   - 了解驗證規則
   - 檢查測試覆蓋

### 步驟 2: 創建新模組結構

```bash
# 創建新模組目錄
mkdir src/components/calculators/modules/[calculator-name]

# 創建必要文件
cd src/components/calculators/modules/[calculator-name]
touch index.tsx config.ts calculator.ts types.ts
touch [Calculator]Form.tsx [Calculator]Results.tsx
mkdir __tests__
touch __tests__/calculator.test.ts
```

### 步驟 3: 遷移類型定義

將舊的類型定義遷移到新的 `types.ts`:

```typescript
// 舊架構: src/calculators/specialties/cardiology/lipid-management/types.ts
export interface LipidInputs {
  // ...
}

// 新架構: src/components/calculators/modules/lipid-management/types.ts
export interface LipidManagementInputs {
  // ...
}

export interface LipidManagementResult {
  // ...
}
```

### 步驟 4: 遷移計算邏輯

將計算邏輯適配到新的介面:

```typescript
// 新架構: src/components/calculators/modules/lipid-management/calculator.ts
import { CalculationResult, ValidationResult, SupportedLocale } from '../../types';
import { LipidManagementInputs, LipidManagementResult } from './types';

export function validate(inputs: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = [];
  
  // 驗證邏輯
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function calculate(inputs: Record<string, any>): CalculationResult {
  const typedInputs = inputs as LipidManagementInputs;
  
  // 計算邏輯
  
  return {
    success: true,
    result: {
      // 結果數據
    }
  };
}
```

### 步驟 5: 創建配置文件

```typescript
// src/components/calculators/modules/lipid-management/config.ts
import { CalculatorConfig } from '../../types';

export const config: CalculatorConfig = {
  id: 'lipid-management',
  name: {
    'zh-TW': '血脂管理計算機',
    'en': 'Lipid Management Calculator',
    'ja': '脂質管理計算機'
  },
  description: {
    'zh-TW': '心血管風險評估與血脂管理建議',
    'en': 'Cardiovascular risk assessment and lipid management recommendations',
    'ja': '心血管リスク評価と脂質管理の推奨事項'
  },
  category: 'cardiology',
  version: '1.0.0',
  status: 'published',
  fields: [
    // 欄位定義
  ],
  medical: {
    specialty: ['cardiology'],
    evidenceLevel: 'A',
    clinicalGuidelines: {
      'zh-TW': '參考 2019 ESC/EAS 血脂異常管理指引',
      'en': 'Based on 2019 ESC/EAS Guidelines for dyslipidaemias',
      'ja': '2019年ESC/EAS脂質異常症管理ガイドラインに基づく'
    }
  }
};
```

### 步驟 6: 創建表單組件

```tsx
// src/components/calculators/modules/lipid-management/LipidManagementForm.tsx
import React from 'react';
import { CalculatorFormProps } from '../../types';

const LipidManagementForm: React.FC<CalculatorFormProps> = ({
  values,
  errors,
  onChange,
  onSubmit,
  onReset,
  isLoading,
  locale
}) => {
  return (
    <div className="lipid-management-form">
      <h2 className="text-2xl font-bold mb-6">血脂管理計算機</h2>
      
      {/* 表單欄位 */}
      
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
  );
};

export default LipidManagementForm;
```

### 步驟 7: 創建結果組件

```tsx
// src/components/calculators/modules/lipid-management/LipidManagementResults.tsx
import React from 'react';
import { CalculatorResultsProps } from '../../types';

const LipidManagementResults: React.FC<CalculatorResultsProps> = ({
  result,
  locale
}) => {
  return (
    <div className="lipid-management-results mt-8">
      <h3 className="text-xl font-semibold mb-6">計算結果</h3>
      
      {/* 結果展示 */}
    </div>
  );
};

export default LipidManagementResults;
```

### 步驟 8: 組裝模組

```tsx
// src/components/calculators/modules/lipid-management/index.tsx
import { CalculatorModule } from '../../types';
import LipidManagementForm from './LipidManagementForm';
import LipidManagementResults from './LipidManagementResults';
import { calculate, validate } from './calculator';
import { config } from './config';

const LipidManagementModule: CalculatorModule = {
  id: 'lipid-management',
  config,
  FormComponent: LipidManagementForm,
  ResultsComponent: LipidManagementResults,
  calculator: { calculate, validate },
  metadata: {
    version: '1.0.0',
    author: 'Medical Team',
    lastUpdated: new Date().toISOString(),
  }
};

export default LipidManagementModule;
```

### 步驟 9: 遷移測試

```typescript
// src/components/calculators/modules/lipid-management/__tests__/calculator.test.ts
import { describe, it, expect } from 'vitest';
import { calculate, validate } from '../calculator';

describe('Lipid Management Calculator', () => {
  describe('validate', () => {
    it('should pass validation with valid inputs', () => {
      const inputs = {
        // 測試數據
      };
      
      const result = validate(inputs);
      expect(result.isValid).toBe(true);
    });
  });

  describe('calculate', () => {
    it('should calculate lipid management correctly', () => {
      const inputs = {
        // 測試數據
      };
      
      const result = calculate(inputs);
      expect(result.success).toBe(true);
    });
  });
});
```

### 步驟 10: 更新頁面使用

```astro
---
// src/pages/tools/lipid-management.astro
import BaseLayout from '../../layouts/BaseLayout.astro';
import CalculatorContainer from '../../components/calculators/common/CalculatorContainer.tsx';
---

<BaseLayout title="血脂管理計算機">
  <main class="container mx-auto px-4 py-8">
    <CalculatorContainer 
      client:load
      calculatorId="lipid-management"
      locale="zh-TW"
    />
  </main>
</BaseLayout>
```

## 程式碼範例

### 完整的血脂管理計算機遷移範例

參考已完成的 BMI 計算機模組：
- `src/components/calculators/modules/bmi/`

### 關鍵差異

| 舊架構 | 新架構 |
|--------|--------|
| `PluginCalculator` | `CalculatorContainer` |
| 插件配置 | 模組配置 |
| 通用表單/結果組件 | 專用表單/結果組件 |
| 手動註冊 | 自動發現 |
| 耦合設計 | 零耦合設計 |

## 測試遷移

### 運行測試

```bash
# 運行新模組測試
npm test src/components/calculators/modules/[calculator-name]

# 運行所有統一架構測試
npm test src/components/calculators/modules

# 檢查測試覆蓋率
npm run test:coverage
```

### 測試檢查清單

- [ ] 所有計算邏輯測試通過
- [ ] 驗證邏輯測試通過
- [ ] 邊界情況測試通過
- [ ] 錯誤處理測試通過
- [ ] 多語言支援測試通過

## 故障排除

### 常見問題

#### 1. 模組未被自動發現

**問題**: 新模組沒有出現在計算機列表中

**解決方案**:
- 確保 `index.tsx` 正確導出 `CalculatorModule`
- 檢查模組 ID 是否唯一
- 確認文件路徑正確

#### 2. 類型錯誤

**問題**: TypeScript 類型錯誤

**解決方案**:
- 確保實現了所有必需的介面
- 檢查類型導入路徑
- 參考現有模組的類型定義

#### 3. 計算結果不正確

**問題**: 計算結果與預期不符

**解決方案**:
- 對比舊架構的計算邏輯
- 檢查輸入數據轉換
- 增加調試日誌

#### 4. 樣式問題

**問題**: 組件樣式不正確

**解決方案**:
- 使用 Tailwind CSS 類名
- 參考現有組件的樣式
- 確保響應式設計

## 最佳實踐

### 1. 保持一致性

- 遵循現有模組的命名慣例
- 使用相同的文件結構
- 保持代碼風格一致

### 2. 完整測試

- 為每個函數編寫測試
- 測試邊界情況
- 確保高測試覆蓋率

### 3. 文檔化

- 添加 JSDoc 註釋
- 更新相關文檔
- 記錄遷移過程

### 4. 漸進式遷移

- 一次遷移一個計算機
- 保持舊系統運行直到遷移完成
- 進行充分測試

### 5. 效能考慮

- 優化組件渲染
- 減少不必要的重新計算
- 使用適當的記憶化

## 遷移檢查清單

### 準備階段
- [ ] 分析現有計算機功能
- [ ] 識別依賴關係
- [ ] 創建遷移分支
- [ ] 備份現有代碼

### 實施階段
- [ ] 創建新模組結構
- [ ] 遷移類型定義
- [ ] 遷移計算邏輯
- [ ] 創建配置文件
- [ ] 實現表單組件
- [ ] 實現結果組件
- [ ] 組裝模組
- [ ] 遷移測試

### 驗證階段
- [ ] 運行所有測試
- [ ] 檢查功能完整性
- [ ] 驗證多語言支援
- [ ] 測試錯誤處理
- [ ] 檢查效能指標

### 部署階段
- [ ] 更新頁面使用新模組
- [ ] 運行端到端測試
- [ ] 檢查生產建置
- [ ] 部署到測試環境
- [ ] 部署到生產環境

### 清理階段
- [ ] 移除舊代碼 (謹慎進行)
- [ ] 更新文檔
- [ ] 通知團隊成員
- [ ] 記錄遷移經驗

## 支援

如果在遷移過程中遇到問題，請：

1. 查看現有的成功遷移範例 (BMI, eGFR, CHA2DS2-VASc)
2. 參考統一架構文檔
3. 運行測試以驗證功能
4. 檢查控制台錯誤訊息

## 結論

遷移到統一計算機架構將帶來更好的可維護性、可測試性和可擴展性。雖然需要一些初期投資，但長期收益是顯著的。

遵循本指南的步驟，您可以成功地將現有計算機遷移到新架構，並享受新架構帶來的所有優勢。