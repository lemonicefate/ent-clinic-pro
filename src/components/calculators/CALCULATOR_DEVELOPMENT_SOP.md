# 計算機開發標準作業程序 (SOP)

## 📋 目錄

1. [架構概覽](#架構概覽)
2. [開發流程](#開發流程)
3. [文件結構](#文件結構)
4. [共用組件](#共用組件)
5. [獨立組件](#獨立組件)
6. [常見問題與修復](#常見問題與修復)
7. [測試策略](#測試策略)
8. [部署檢查清單](#部署檢查清單)
9. [最佳實踐](#最佳實踐)

---

## 🏗️ 架構概覽

### 當前架構狀態

本項目目前有**兩套並行的計算機架構**：

#### 1. **統一模組架構** (推薦，但有已知問題)
```
src/components/calculators/modules/[calculator-name]/
├── index.tsx              # CalculatorModule 導出
├── config.ts             # 計算機配置
├── types.ts              # 類型定義
├── calculator.ts         # 計算邏輯
├── [Name]Form.tsx        # 表單組件
├── [Name]Results.tsx     # 結果組件
└── __tests__/            # 測試文件
```

#### 2. **簡化組件架構** (目前使用，穩定)
```
src/components/calculators/modules/[calculator-name]/
└── Simple[Name].tsx      # 獨立 React 組件
```

### 架構選擇建議

- **新計算機開發**: 使用簡化組件架構 (Simple[Name].tsx)
- **現有計算機維護**: 保持當前架構不變
- **未來遷移**: 等待統一架構問題修復後再考慮遷移

---

## 🔄 開發流程

### Phase 1: 需求分析
1. **醫療需求確認**
   - 確認計算公式的醫學準確性
   - 收集相關醫療指南和參考文獻
   - 確定目標用戶群體 (醫師、護理師、學生等)

2. **技術需求分析**
   - 輸入欄位定義
   - 計算邏輯複雜度評估
   - 結果展示需求
   - 多語言支援需求

### Phase 2: 設計階段
1. **UI/UX 設計**
   - 參考現有計算機的設計模式
   - 確保響應式設計
   - 考慮無障礙設計 (Accessibility)

2. **資料結構設計**
   - 定義輸入介面 (Input Interface)
   - 定義結果介面 (Result Interface)
   - 設計驗證規則

### Phase 3: 開發實作
1. **創建計算機組件**
2. **實作計算邏輯**
3. **添加輸入驗證**
4. **實作結果展示**
5. **添加錯誤處理**

### Phase 4: 測試與驗證
1. **單元測試**
2. **整合測試**
3. **醫療準確性驗證**
4. **用戶體驗測試**

### Phase 5: 部署與監控
1. **部署到測試環境**
2. **生產環境部署**
3. **監控和錯誤追蹤**

---

## 📁 文件結構

### 簡化組件架構 (推薦)

```typescript
// src/components/calculators/modules/[calculator-name]/Simple[Name].tsx

import React, { useState } from 'react';

interface [Name]Result {
  // 定義結果類型
  primaryValue: number;
  category: string;
  recommendations: string[];
}

interface [Name]CalculatorProps {
  locale?: string;
  onCalculationComplete?: (result: any) => void;
}

const Simple[Name]Calculator: React.FC<[Name]CalculatorProps> = ({ 
  locale = 'zh-TW', 
  onCalculationComplete 
}) => {
  // 狀態管理
  const [inputValue, setInputValue] = useState<string>('');
  const [result, setResult] = useState<[Name]Result | null>(null);

  // 計算邏輯
  const calculate = () => {
    // 實作計算邏輯
    const calculationResult = {
      // 計算結果
    };
    
    setResult(calculationResult);
    onCalculationComplete?.(calculationResult);
  };

  // 重設功能
  const reset = () => {
    setInputValue('');
    setResult(null);
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '24px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      {/* 組件內容 */}
    </div>
  );
};

export default Simple[Name]Calculator;
```

### 頁面整合

```astro
---
// src/pages/tools/[calculator-name].astro

import BaseLayout from '../../layouts/BaseLayout.astro';
import Simple[Name]Calculator from '../../components/calculators/modules/[calculator-name]/Simple[Name].tsx';
import type { SupportedLocale } from '../../types/calculator.js';

const locale: SupportedLocale = 'zh-TW';

// 計算機元資料
const pluginMetadata = {
  id: '[calculator-name]',
  namespace: '[specialty]',
  version: '1.0.0',
  name: {
    'zh-TW': '[中文名稱]',
    'en': '[English Name]',
    'ja': '[日本語名前]'
  },
  description: {
    'zh-TW': '[中文描述]',
    'en': '[English Description]',
    'ja': '[日本語説明]'
  },
  tags: ['tag1', 'tag2', 'tag3']
};
---

<BaseLayout 
  title={`${pluginMetadata.name[locale]} | Astro Clinical Platform`}
  description={pluginMetadata.description[locale]}
  locale={locale}
  medicalContent={true}
  pageType="calculator"
>
  <main class="container mx-auto px-4 py-8">
    <!-- 計算機標題和描述 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">
        {pluginMetadata.name[locale]}
      </h1>
      <p class="text-lg text-gray-600 leading-relaxed">
        {pluginMetadata.description[locale]}
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 計算機主體 -->
      <div class="lg:col-span-2">
        <Simple[Name]Calculator client:load locale={locale} />
      </div>

      <!-- 側邊欄資訊 -->
      <div class="space-y-6">
        <!-- 相關資訊 -->
      </div>
    </div>
  </main>
</BaseLayout>
```

---

## 🔧 共用組件

### 1. ErrorBoundary
```typescript
// src/components/calculators/common/ErrorBoundary.tsx
// 用途: 捕獲 React 組件錯誤，提供降級 UI
```

### 2. LoadingSpinner
```typescript
// src/components/calculators/common/LoadingSpinner.tsx
// 用途: 統一的載入動畫組件
```

### 3. CalculatorContainer (有問題，暫時避免使用)
```typescript
// src/components/calculators/common/CalculatorContainer.tsx
// 狀態: 有 React 水合問題，建議避免使用
```

### 4. 類型定義
```typescript
// src/components/calculators/types/
// 包含所有共用的 TypeScript 類型定義
```

### 5. 錯誤處理
```typescript
// src/components/calculators/registry/ErrorHandler.ts
// 統一的錯誤處理和記錄系統
```

---

## 🎯 獨立組件

每個計算機都應該是獨立的組件，包含：

### 必要元素
1. **狀態管理**: 使用 React useState
2. **計算邏輯**: 內建在組件中
3. **輸入驗證**: 即時驗證用戶輸入
4. **錯誤處理**: 友善的錯誤訊息
5. **結果展示**: 清晰的結果呈現
6. **重設功能**: 清除所有輸入和結果

### 樣式策略
- **使用內聯樣式**: 避免 CSS 依賴問題
- **響應式設計**: 使用 CSS Grid 和 Flexbox
- **一致的視覺設計**: 遵循現有的設計模式

### 國際化支援
```typescript
// 基本的多語言支援
const getText = (key: string, locale: string) => {
  const texts = {
    'zh-TW': {
      'calculate': '計算',
      'reset': '重設',
      'result': '結果'
    },
    'en': {
      'calculate': 'Calculate',
      'reset': 'Reset',
      'result': 'Result'
    }
  };
  return texts[locale]?.[key] || texts['zh-TW'][key];
};
```

---

## 🐛 常見問題與修復

### 1. React 水合失敗

**問題**: 組件顯示"載入計算機中..."但不渲染

**原因**:
- `CalculatorContainer` 有導入錯誤
- 複雜的模組架構導致水合失敗
- CSS 依賴問題

**修復方式**:
```typescript
// ❌ 避免使用
import CalculatorContainer from '../../components/calculators/common/CalculatorContainer.tsx';

// ✅ 使用簡化組件
import Simple[Name]Calculator from '../../components/calculators/modules/[name]/Simple[Name].tsx';
```

### 2. CSS 樣式問題

**問題**: Tailwind CSS 類別沒有正確載入

**修復方式**:
```typescript
// ❌ 避免依賴 Tailwind 類別
<div className="bg-white p-6 rounded-lg">

// ✅ 使用內聯樣式
<div style={{
  backgroundColor: '#ffffff',
  padding: '24px',
  borderRadius: '8px'
}}>
```

### 3. 類型導入錯誤

**問題**: TypeScript 類型導入錯誤

**修復方式**:
```typescript
// ❌ 錯誤的導入方式
import { CalculatorError } from '../registry/ErrorHandler';

// ✅ 正確的導入方式
import type { CalculatorError } from '../registry/ErrorHandler';
```

### 4. 計算精度問題

**問題**: JavaScript 浮點數計算精度問題

**修復方式**:
```typescript
// ❌ 直接計算可能有精度問題
const result = weight / (height * height);

// ✅ 使用四捨五入處理精度
const result = Math.round((weight / (height * height)) * 100) / 100;
```

### 5. 輸入驗證問題

**問題**: 缺乏適當的輸入驗證

**修復方式**:
```typescript
const validateInput = (value: string): boolean => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && num < 1000;
};

const calculate = () => {
  if (!validateInput(inputValue)) {
    alert('請輸入有效的數值');
    return;
  }
  // 繼續計算邏輯
};
```

---

## 🧪 測試策略

### 1. 單元測試結構

```typescript
// src/components/calculators/modules/[name]/__tests__/calculator.test.ts

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Simple[Name]Calculator from '../Simple[Name]';

describe('[Name] Calculator', () => {
  describe('Calculation Logic', () => {
    it('should calculate correctly with valid inputs', () => {
      // 測試正確的計算邏輯
    });

    it('should handle edge cases', () => {
      // 測試邊界情況
    });

    it('should validate inputs properly', () => {
      // 測試輸入驗證
    });
  });

  describe('User Interface', () => {
    it('should render all input fields', () => {
      render(<Simple[Name]Calculator />);
      // 測試 UI 渲染
    });

    it('should handle user interactions', () => {
      render(<Simple[Name]Calculator />);
      // 測試用戶互動
    });

    it('should display results correctly', () => {
      // 測試結果顯示
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid inputs gracefully', () => {
      // 測試錯誤處理
    });

    it('should show appropriate error messages', () => {
      // 測試錯誤訊息
    });
  });
});
```

### 2. 整合測試

```javascript
// tests/e2e/calculator-[name].spec.js

import { test, expect } from '@playwright/test';

test.describe('[Name] Calculator E2E Tests', () => {
  test('should complete full calculation workflow', async ({ page }) => {
    await page.goto('/tools/[calculator-name]');
    
    // 測試完整的用戶流程
    await page.fill('[data-testid="input-field"]', '70');
    await page.click('[data-testid="calculate-button"]');
    
    // 驗證結果
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // 測試錯誤處理
  });
});
```

### 3. 測試覆蓋率目標

- **計算邏輯**: 100% 覆蓋率
- **輸入驗證**: 100% 覆蓋率
- **錯誤處理**: 90% 覆蓋率
- **UI 組件**: 80% 覆蓋率

### 4. 自動化測試命令

```bash
# 運行所有測試
npm test

# 運行特定計算機的測試
npm test src/components/calculators/modules/[name]

# 運行 E2E 測試
npm run test:e2e

# 生成測試覆蓋率報告
npm run test:coverage
```

---

## ✅ 部署檢查清單

### 開發階段
- [ ] 計算邏輯正確性驗證
- [ ] 輸入驗證完整性
- [ ] 錯誤處理機制
- [ ] 響應式設計測試
- [ ] 多語言支援 (如需要)
- [ ] 無障礙設計檢查

### 測試階段
- [ ] 單元測試通過 (覆蓋率 > 80%)
- [ ] 整合測試通過
- [ ] E2E 測試通過
- [ ] 跨瀏覽器測試
- [ ] 行動裝置測試
- [ ] 效能測試

### 部署前
- [ ] 代碼審查完成
- [ ] 醫療準確性確認
- [ ] 安全性檢查
- [ ] 文檔更新
- [ ] 變更日誌更新

### 部署後
- [ ] 功能驗證
- [ ] 錯誤監控設置
- [ ] 效能監控
- [ ] 用戶反饋收集

---

## 🎯 最佳實踐

### 1. 代碼品質

```typescript
// ✅ 良好的實踐
const BMICalculator: React.FC<BMICalculatorProps> = ({ 
  locale = 'zh-TW', 
  onCalculationComplete 
}) => {
  // 清晰的狀態定義
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [result, setResult] = useState<BMIResult | null>(null);

  // 輸入驗證函數
  const validateInputs = (): boolean => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    return h > 0 && h < 300 && w > 0 && w < 500;
  };

  // 計算函數
  const calculateBMI = (): void => {
    if (!validateInputs()) {
      alert('請輸入有效的身高和體重');
      return;
    }
    
    const h = parseFloat(height) / 100; // 轉換為公尺
    const w = parseFloat(weight);
    const bmi = Math.round((w / (h * h)) * 100) / 100;
    
    const calculationResult: BMIResult = {
      bmi,
      category: getBMICategory(bmi),
      recommendations: getRecommendations(bmi)
    };
    
    setResult(calculationResult);
    onCalculationComplete?.(calculationResult);
  };
};
```

### 2. 錯誤處理

```typescript
// ✅ 完善的錯誤處理
const calculate = () => {
  try {
    // 輸入驗證
    if (!validateInputs()) {
      throw new Error('輸入數值無效');
    }
    
    // 計算邏輯
    const result = performCalculation();
    
    // 結果驗證
    if (!isValidResult(result)) {
      throw new Error('計算結果異常');
    }
    
    setResult(result);
  } catch (error) {
    console.error('計算錯誤:', error);
    setError(error.message);
  }
};
```

### 3. 用戶體驗

```typescript
// ✅ 良好的用戶體驗
return (
  <div style={{ /* 容器樣式 */ }}>
    {/* 清晰的標題 */}
    <h2>計算機名稱</h2>
    
    {/* 輸入區域 */}
    <div>
      <label>輸入標籤</label>
      <input
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="提示文字"
      />
      {error && <span style={{ color: 'red' }}>{error}</span>}
    </div>
    
    {/* 操作按鈕 */}
    <div>
      <button onClick={calculate}>計算</button>
      <button onClick={reset}>重設</button>
    </div>
    
    {/* 結果顯示 */}
    {result && (
      <div>
        <h3>計算結果</h3>
        {/* 結果內容 */}
      </div>
    )}
    
    {/* 說明和警告 */}
    <div>
      <p><strong>注意：</strong>此計算結果僅供參考...</p>
    </div>
  </div>
);
```

### 4. 效能優化

```typescript
// ✅ 效能優化技巧
import React, { useState, useCallback, useMemo } from 'react';

const Calculator: React.FC = () => {
  // 使用 useCallback 優化函數
  const calculate = useCallback(() => {
    // 計算邏輯
  }, [inputValue]);

  // 使用 useMemo 優化計算
  const expensiveCalculation = useMemo(() => {
    return performExpensiveCalculation(inputValue);
  }, [inputValue]);

  return (
    // 組件內容
  );
};
```

### 5. 醫療準確性

```typescript
// ✅ 醫療計算的最佳實踐
const calculateEGFR = (age: number, gender: string, creatinine: number): number => {
  // 使用標準的 CKD-EPI 2021 公式
  const kappa = gender === 'female' ? 0.7 : 0.9;
  const alpha = gender === 'female' ? -0.329 : -0.411;
  const genderFactor = gender === 'female' ? 1.018 : 1;
  
  const creatinineRatio = creatinine / kappa;
  const minValue = Math.min(creatinineRatio, 1);
  const maxValue = Math.max(creatinineRatio, 1);
  
  const egfr = 141 * Math.pow(minValue, alpha) * Math.pow(maxValue, -1.209) * 
               Math.pow(0.993, age) * genderFactor;
  
  return Math.round(egfr * 10) / 10; // 保留一位小數
};
```

---

## 📚 參考資源

### 內部文檔
- [統一計算機架構文檔](./UNIFIED_CALCULATOR_API.md)
- [錯誤處理指南](./registry/ErrorHandler.ts)
- [類型定義參考](./types/)

### 外部資源
- [React 最佳實踐](https://react.dev/learn)
- [TypeScript 指南](https://www.typescriptlang.org/docs/)
- [Vitest 測試框架](https://vitest.dev/)
- [Playwright E2E 測試](https://playwright.dev/)

### 醫療參考
- 各計算機的醫療指南和參考文獻
- 國際醫療標準和公式
- 臨床實踐指引

---

## 🔄 版本歷史

- **v1.0.0** (2025-01-04): 初始版本，基於當前架構狀態
- 後續版本將根據架構演進和最佳實踐更新

---

**注意**: 此 SOP 基於當前的架構狀態編寫。隨著統一架構問題的修復和最佳實踐的演進，本文檔將持續更新。建議開發團隊定期審查和更新此文檔。