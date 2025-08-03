# 統一計算機架構需求文件

## 概述

本文件整合了現有的計算機架構相關 specs，建立統一的完全模組化醫療計算機系統。每個計算機都是獨立的模組，擁有自己的 Form 和 Results 組件，實現真正的模組化和客製化。

## 核心原則

1. **完全模組化**：每個計算機都是獨立的模組，包含自己的所有組件
2. **零耦合**：修改任何計算機不會影響其他計算機
3. **自包含**：每個模組包含配置、邏輯、UI 組件、測試和文檔
4. **插件化**：支援動態發現和載入計算機模組
5. **類型安全**：完整的 TypeScript 類型覆蓋

## 需求

### R1: 完全模組化架構

**使用者故事**：作為開發者，我希望每個計算機都是完全獨立的模組，包含自己的 Form 和 Results 組件。

#### 驗收標準
1. WHEN 創建新計算機時 THEN 應在 `src/components/calculators/modules/[calculator-id]/` 下創建完整的模組
2. WHEN 計算機模組包含時 THEN 必須有 `index.tsx`、`[Calculator]Form.tsx`、`[Calculator]Results.tsx`、`config.ts`、`types.ts`
3. WHEN 修改某個計算機時 THEN 其他計算機完全不受影響
4. WHEN 移除計算機模組時 THEN 系統自動從註冊表中移除

### R2: 動態模組發現

**使用者故事**：作為系統，我希望能自動發現和載入所有計算機模組。

#### 驗收標準
1. WHEN 系統啟動時 THEN 自動掃描 `modules/` 目錄發現所有計算機
2. WHEN 新增計算機模組時 THEN 無需修改核心程式碼即可使用
3. WHEN 計算機模組有錯誤時 THEN 錯誤被隔離，不影響其他模組

### R3: 統一的類型系統

**使用者故事**：作為開發者，我希望有統一的類型定義，確保所有計算機模組的一致性。

#### 驗收標準
1. WHEN 開發計算機時 THEN 必須實現 `CalculatorModule` 介面
2. WHEN 定義計算機配置時 THEN 必須符合 `CalculatorConfig` 類型
3. WHEN 計算機返回結果時 THEN 必須符合 `CalculationResult` 類型

### R4: 錯誤隔離和恢復

**使用者故事**：作為使用者，我希望某個計算機出錯時不會影響其他計算機的使用。

#### 驗收標準
1. WHEN 計算機模組載入失敗時 THEN 其他模組正常運作
2. WHEN 計算機執行出錯時 THEN 顯示錯誤訊息但不崩潰整個應用
3. WHEN 計算機組件渲染失敗時 THEN 顯示降級 UI

## 目標架構

```
src/components/calculators/
├── types/                          # 統一類型定義
│   ├── index.ts
│   ├── calculator.ts
│   ├── config.ts
│   └── results.ts
├── registry/                       # 計算機註冊表
│   ├── CalculatorRegistry.ts
│   ├── ModuleLoader.ts
│   └── index.ts
├── common/                         # 共用組件和工具
│   ├── ErrorBoundary.tsx
│   ├── LoadingSpinner.tsx
│   └── utils/
└── modules/                        # 計算機模組
    ├── bmi/
    │   ├── index.tsx               # 模組入口
    │   ├── BMIForm.tsx            # 專用表單組件
    │   ├── BMIResults.tsx         # 專用結果組件
    │   ├── config.ts              # 配置和元數據
    │   ├── calculator.ts          # 計算邏輯
    │   ├── types.ts               # 模組特定類型
    │   └── __tests__/             # 測試檔案
    ├── egfr/
    │   ├── index.tsx
    │   ├── EGFRForm.tsx
    │   ├── EGFRResults.tsx
    │   ├── config.ts
    │   ├── calculator.ts
    │   ├── types.ts
    │   └── __tests__/
    └── cha2ds2-vasc/
        ├── index.tsx
        ├── CHA2DS2VAScForm.tsx
        ├── CHA2DS2VAScResults.tsx
        ├── config.ts
        ├── calculator.ts
        ├── types.ts
        └── __tests__/
```

## 實施計劃

### Phase 1: 基礎架構 (Week 1)
- 建立類型系統
- 實現計算機註冊表
- 創建模組載入器
- 建立錯誤邊界

### Phase 2: 模組遷移 (Week 2-3)
- 將現有計算機轉換為模組化架構
- 為每個計算機創建專用的 Form 和 Results 組件
- 實現模組自動發現

### Phase 3: 整合測試 (Week 4)
- 端到端測試
- 效能優化
- 文檔更新

## 成功指標

- ✅ 所有現有計算機功能保持不變
- ✅ 每個計算機都有獨立的 Form 和 Results 組件
- ✅ 新增計算機無需修改核心程式碼
- ✅ 計算機之間完全隔離
- ✅ 完整的 TypeScript 類型覆蓋
- ✅ 測試覆蓋率 > 90%