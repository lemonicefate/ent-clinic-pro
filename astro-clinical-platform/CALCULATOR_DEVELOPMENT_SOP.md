# 醫療計算器開發標準作業程序 (SOP)

## 📋 概述

本文檔提供了在 Astro Clinical Platform 中新增醫療計算器的完整標準作業程序，基於最新的專科分類結構，包括所需文件、開發流程、驗證步驟和常見錯誤預防。

## 🏥 專科分類系統

平台採用醫療專科分類系統來組織計算器，目前支援的專科包括：

- **一般醫學** (general) 🏥 - 基礎健康評估和常見醫療指標
- **心臟科** (cardiology) ❤️ - 心血管疾病風險評估和診斷輔助
- **腎臟科** (nephrology) 🫘 - 腎功能評估和慢性腎病管理
- **小兒科** (pediatrics) 👶 - 兒童醫療劑量計算和生長發育評估
- **內分泌科** (endocrinology) 🩺 - 內分泌疾病診斷和代謝評估
- **急診科** (emergency) 🚨 - 急診醫療評估和緊急處置
- **內科** (internal-medicine) 🏥 - 內科疾病診斷和治療評估
- **外科** (surgery) 🔪 - 外科手術風險評估和術前評估
- **婦產科** (obstetrics-gynecology) 🤱 - 婦產科醫療評估和孕期計算
- **精神科** (psychiatry) 🧠 - 精神疾病評估和心理健康篩檢
- **皮膚科** (dermatology) 🩴 - 皮膚疾病診斷和治療評估

## 🏗️ 架構概覽

### 核心組件

- **PluginCalculator.tsx**: 通用計算器島組件
- **計算器插件**: 獨立的計算器實現
- **頁面組件**: Astro 頁面文件
- **配置文件**: JSON 配置和類型定義

### 目錄結構

```
src/
├── calculators/
│   └── specialties/             # 專科分類根目錄
│       └── {specialty}/         # 醫療專科 (如 cardiology, nephrology)
│           └── {calculator-id}/ # 計算器ID
│               ├── __tests__/   # 測試文件 (可選)
│               ├── index.ts     # 插件入口點
│               ├── calculator.ts # 計算邏輯
│               ├── config.json  # 配置文件
│               ├── Dashboard.tsx # 結果顯示組件
│               └── visualization.json # 可視化配置
├── pages/tools/
│   ├── index.astro              # 工具總覽頁面
│   └── {calculator-id}.astro    # 計算器專用頁面
├── components/islands/
│   └── PluginCalculator.tsx    # 通用計算器組件
└── types/
    ├── calculator.ts            # 計算器類型定義
    └── calculator-plugin.ts     # 插件類型定義
```

## 🚀 開發流程

### 第一步：規劃和設計

#### 1.1 確定計算器基本信息

- [ ] **計算器ID**: 使用 kebab-case，如 `has-bled`
- [ ] **醫療專科**: 選擇適當的醫學專科分類：
  - `general` - 一般醫學 🏥
  - `cardiology` - 心臟科 ❤️
  - `nephrology` - 腎臟科 🫘
  - `pediatrics` - 小兒科 👶
  - `endocrinology` - 內分泌科 🩺
  - `emergency` - 急診科 🚨
  - `internal-medicine` - 內科 🏥
  - `surgery` - 外科 🔪
  - `obstetrics-gynecology` - 婦產科 🤱
  - `psychiatry` - 精神科 🧠
  - `dermatology` - 皮膚科 🩴
- [ ] **版本號**: 遵循語義化版本，如 `1.0.0`
- [ ] **多語言名稱**: 提供 zh-TW, en 兩種語言
- [ ] **描述**: 簡潔明確的功能描述

#### 1.2 定義輸入字段

- [ ] **字段類型**: `number`, `select`, `checkbox`, `text`
- [ ] **驗證規則**: 最小值、最大值、必填項
- [ ] **單位**: 明確標示單位（如 kg, cm, mg/dL）
- [ ] **幫助文本**: 提供使用指導

#### 1.3 設計計算邏輯

- [ ] **公式**: 確認醫學公式的準確性
- [ ] **參考文獻**: 收集權威醫學指引
- [ ] **結果解釋**: 定義風險等級和建議

### 第二步：創建文件結構

#### 2.1 創建計算器目錄

```bash
mkdir -p src/calculators/specialties/{specialty}/{calculator-id}
mkdir -p src/calculators/specialties/{specialty}/{calculator-id}/__tests__
```

#### 2.2 創建必要文件

- [ ] `config.json` - 配置文件
- [ ] `calculator.ts` - 計算邏輯
- [ ] `index.ts` - 插件入口點
- [ ] `{CalculatorName}Dashboard.tsx` - 結果顯示組件
- [ ] `visualization.json` - 可視化配置
- [ ] `__tests__/calculator.test.ts` - 測試文件 (推薦)

### 第三步：實現配置文件 (config.json)

```json
{
  "id": "calculator-id",
  "version": "1.0.0",
  "name": {
    "zh-TW": "計算器中文名稱",
    "en": "Calculator English Name",
    "ja": "計算器日文名稱"
  },
  "description": {
    "zh-TW": "中文描述",
    "en": "English description",
    "ja": "日文描述"
  },
  "category": "specialty",
  "metadata": {
    "difficulty": "basic|intermediate|advanced",
    "tags": ["tag1", "tag2"],
    "author": "Astro Clinical Platform",
    "license": "MIT"
  },
  "medical": {
    "specialty": ["專科1", "專科2"],
    "evidenceLevel": "A|B|C",
    "clinicalGuidelines": {
      "zh-TW": "臨床指引說明",
      "en": "Clinical guidelines",
      "ja": "臨床ガイドライン"
    }
  },
  "ui": {
    "fields": [
      {
        "id": "field-id",
        "type": "number|select|checkbox|text",
        "label": {
          "zh-TW": "字段標籤",
          "en": "Field Label",
          "ja": "フィールドラベル"
        },
        "required": true,
        "validation": {
          "min": 0,
          "max": 100
        },
        "unit": {
          "zh-TW": "單位",
          "en": "unit",
          "ja": "単位"
        }
      }
    ]
  }
}
```

### 第四步：實現計算邏輯 (calculator.ts)

```typescript
import type {
  CalculatorInputs,
  CalculationResult,
  ValidationResult,
  SupportedLocale,
} from '../../../../types/calculator.js';

/**
 * 主要計算函數
 */
export function calculate(inputs: CalculatorInputs): CalculationResult {
  // 1. 輸入驗證
  const validation = validate(inputs);
  if (!validation.isValid) {
    throw new Error('Invalid inputs');
  }

  // 2. 執行計算
  const result = performCalculation(inputs);

  // 3. 返回結果
  return {
    primaryValue: result.value,
    primaryUnit: result.unit,
    secondaryValues: result.additional,
    interpretation: {
      'zh-TW': '中文解釋',
      en: 'English interpretation',
      ja: '日本語の解釈',
    },
    recommendations: generateRecommendations(result),
    riskLevel: determineRiskLevel(result.value),
    metadata: {
      calculationSteps: result.steps,
      references: ['參考文獻1', '參考文獻2'],
      lastCalculated: new Date().toISOString(),
    },
  };
}

/**
 * 輸入驗證函數
 */
export function validate(inputs: CalculatorInputs): ValidationResult {
  const errors = [];

  // 驗證每個必填字段
  // 驗證數值範圍
  // 驗證格式

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 格式化結果函數
 */
export function formatResult(
  result: CalculationResult,
  locale: SupportedLocale = 'zh-TW'
) {
  return {
    displayValue: `${result.primaryValue} ${result.primaryUnit}`,
    description: result.interpretation?.[locale] || '',
    recommendations:
      result.recommendations?.map((rec) => rec[locale] || rec['zh-TW'] || '') ||
      [],
  };
}
```

### 第五步：創建結果顯示組件 (Dashboard.tsx)

```typescript
import React from 'react';
import type { CalculationResult } from '../../../../types/calculator.js';
import type { SupportedLocale } from '../../../../types/calculator-plugin.js';

interface DashboardProps {
  result: CalculationResult;
  locale?: SupportedLocale;
  onRetry?: () => void;
}

export default function Dashboard({
  result,
  locale = 'zh-TW',
  onRetry
}: DashboardProps) {
  return (
    <div className="space-y-6">
      {/* 主要結果顯示 */}
      <div className="rounded-lg border-2 p-6">
        <div className="text-center">
          <div className="text-4xl font-bold mb-2">
            {result.primaryValue} {result.primaryUnit}
          </div>
          <div className="text-lg">
            {result.interpretation?.[locale]}
          </div>
        </div>
      </div>

      {/* 建議事項 */}
      {result.recommendations && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">臨床建議</h3>
          <ul className="space-y-2">
            {result.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></span>
                <span>{rec[locale] || rec['zh-TW']}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### 第六步：創建插件入口 (index.ts)

```typescript
import type { CalculatorPlugin } from '../../../../types/calculator-plugin.js';
import { calculate, validate, formatResult } from './calculator.js';
import Dashboard from './{CalculatorName}Dashboard.tsx';
import config from './config.json';

const CalculatorPlugin: CalculatorPlugin = {
  metadata: {
    id: config.id,
    namespace: 'specialty',
    version: config.version,
    name: config.name,
    description: config.description,
    author: config.metadata.author,
    license: config.metadata.license,
    tags: config.metadata.tags,
    createdAt: new Date().toISOString(),
    updatedAt: config.metadata.lastUpdated || new Date().toISOString(),
  },

  config: {
    id: config.id,
    name: config.name,
    description: config.description,
    category: config.category,
    version: config.version,
    status: 'active',
    fields: config.ui.fields,
    medical: config.medical,
    metadata: config.metadata,
  },

  calculator: {
    calculate,
    validate,
    formatResult,
  },

  dashboard: Dashboard,

  async install() {
    console.log(`📦 Installing ${config.name['zh-TW']} Plugin...`);
    // 安裝邏輯
  },

  async uninstall() {
    console.log(`🗑️ Uninstalling ${config.name['zh-TW']} Plugin...`);
    // 卸載邏輯
  },

  async validate() {
    // 驗證邏輯
    return true;
  },

  async checkCompatibility() {
    return {
      compatible: true,
      issues: [],
    };
  },
};

export default CalculatorPlugin;
```

### 第七步：創建可視化配置 (visualization.json)

```json
{
  "id": "calculator-id",
  "name": {
    "zh-TW": "計算器名稱",
    "en": "Calculator Name"
  },
  "description": {
    "zh-TW": "計算器描述",
    "en": "Calculator Description"
  },
  "category": "specialty",
  "version": "1.0.0",
  "charts": [
    {
      "type": "gauge",
      "title": {
        "zh-TW": "風險等級",
        "en": "Risk Level"
      },
      "config": {
        "min": 0,
        "max": 100,
        "thresholds": [
          {
            "value": 30,
            "color": "green",
            "label": { "zh-TW": "低風險", "en": "Low Risk" }
          },
          {
            "value": 70,
            "color": "yellow",
            "label": { "zh-TW": "中風險", "en": "Medium Risk" }
          },
          {
            "value": 100,
            "color": "red",
            "label": { "zh-TW": "高風險", "en": "High Risk" }
          }
        ]
      }
    }
  ],
  "resultDisplay": {
    "primaryValue": {
      "format": "number",
      "precision": 1,
      "unit": {
        "zh-TW": "分",
        "en": "points"
      }
    },
    "interpretation": {
      "showRiskLevel": true,
      "showRecommendations": true,
      "showCalculationSteps": false
    }
  },
  "metadata": {
    "lastUpdated": "2024-01-15T00:00:00.000Z",
    "author": "Astro Clinical Platform"
  }
}
```

### 第七步：創建專用頁面

#### 7.1 創建頁面文件 (`src/pages/tools/{calculator-id}.astro`)

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import PluginCalculator from '../../components/islands/PluginCalculator.tsx';
import type { SupportedLocale } from '../../types/calculator.js';

const locale: SupportedLocale = 'zh-TW';

const pluginMetadata = {
  id: 'calculator-id',
  namespace: 'specialty',
  version: '1.0.0',
  name: {
    'zh-TW': '計算器名稱',
    en: 'Calculator Name',
  },
  description: {
    'zh-TW': '計算器描述',
    en: 'Calculator Description',
  },
};

const breadcrumbs = [
  { label: '首頁', href: '/' },
  { label: '醫療工具', href: '/tools' },
  { label: pluginMetadata.name[locale] },
];
---

<BaseLayout
  title={`${pluginMetadata.name[locale]} | Astro Clinical Platform`}
  description={pluginMetadata.description[locale]}
  locale={locale}
  medicalContent={true}
  pageType="calculator"
  breadcrumbs={breadcrumbs}
>
  <main class="container mx-auto px-4 py-8">
    <!-- 計算機標題和描述 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">
        {pluginMetadata.name[locale]}
      </h1>
      <p class="text-lg text-gray-600">
        {pluginMetadata.description[locale]}
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 計算機主體 -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <PluginCalculator
            client:load
            transition:persist="calculator-id-calculator"
            pluginId="specialty.calculator-id"
            locale={locale}
            theme="light"
            accessibility={{
              highContrast: false,
              largeText: false,
              screenReader: false,
            }}
            className="calculator-id-calculator"
          />
        </div>
      </div>

      <!-- 側邊欄資訊 -->
      <div class="space-y-6">
        <!-- 使用說明 -->
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">使用說明</h2>
          <!-- 添加使用說明內容 -->
        </div>

        <!-- 重要提醒 -->
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 class="text-lg font-semibold text-yellow-800 mb-3">重要提醒</h2>
          <p class="text-sm text-yellow-700">
            本計算結果僅供臨床參考，不能取代專業醫師的判斷
          </p>
        </div>
      </div>
    </div>
  </main>
</BaseLayout>
```

### 第八步：更新專科索引和註冊表

#### 8.1 更新專科索引 (`src/calculators/specialties/index.ts`)

在對應專科的 `calculators` 數組中添加新計算器：

```typescript
// 例如：在 cardiology 專科中添加新計算器
cardiology: {
  // ... 其他配置
  calculators: ['cardiology.cha2ds2-vasc', 'cardiology.new-calculator-id'],
  // ...
}
```

#### 8.2 更新可視化註冊表 (`src/config/visualization-registry.ts`)

```typescript
// 導入新計算器的可視化配置
import newCalculatorVisualization from '../calculators/specialties/{specialty}/{calculator-id}/visualization.json';

// 在 visualizationRegistry 中添加
export const visualizationRegistry = {
  // ... 現有配置
  '{specialty}.{calculator-id}': newCalculatorVisualization,
};
```

#### 8.3 更新簡單計算器服務 (`src/services/simple-calculator-service.ts`)

如果計算器需要在簡單模式下運行，需要在服務中添加相應的實現。

### 第九步：更新工具總覽頁面

#### 9.1 在 `src/pages/tools/index.astro` 中添加新計算器

```javascript
// 在 staticCalculators 數組中添加新計算器
{
  pluginId: 'specialty.calculator-id',
  urlPath: '/tools/calculator-id',
  metadata: {
    id: 'calculator-id',
    namespace: 'specialty',
    version: '1.0.0',
    name: {
      'zh-TW': '計算器名稱',
      'en': 'Calculator Name'
    },
    description: {
      'zh-TW': '計算器描述',
      'en': 'Calculator Description'
    },
    author: 'Astro Clinical Platform',
    tags: ['tag1', 'tag2']
  },
  config: {
    category: 'specialty',
    medical: {
      specialty: ['專科名稱'],
      evidenceLevel: 'A'
    },
    metadata: {
      difficulty: 'basic'
    }
  },
  namespace: 'specialty'
}
```

#### 9.2 更新 PluginCalculator 組件

在 `src/components/islands/PluginCalculator.tsx` 的 `calculatorImplementations` 中添加：

```javascript
'specialty.calculator-id': {
  name: '計算器名稱',
  fields: [
    // 定義字段
  ],
  calculate: (inputs) => {
    // 簡化的計算邏輯
    return {
      // 返回結果
    };
  }
}
```

## ✅ 驗證清單

### 功能驗證

- [ ] **基本功能**: 計算器能正確執行計算
- [ ] **輸入驗證**: 錯誤輸入會顯示適當錯誤訊息
- [ ] **結果顯示**: 結果格式正確且易於理解
- [ ] **多語言**: 所有文字都有對應的多語言版本
- [ ] **響應式設計**: 在不同螢幕尺寸下正常顯示

### 導航驗證

- [ ] **工具頁面連結**: 從 `/tools` 頁面能正確導航到計算器
- [ ] **專科分類**: 計算器在正確的專科分類下顯示
- [ ] **直接訪問**: 直接訪問計算器URL能正常載入
- [ ] **Client-side navigation**: 使用瀏覽器前進/後退按鈕正常
- [ ] **Hydration**: 不會出現轉圈圈無法載入的問題

### 技術驗證

- [ ] **TypeScript**: 沒有類型錯誤
- [ ] **ESLint**: 通過代碼檢查
- [ ] **Build**: 能成功構建
- [ ] **SSG**: 靜態生成正常
- [ ] **專科索引**: 專科索引正確更新
- [ ] **可視化註冊**: 可視化配置正確註冊

### 醫學驗證

- [ ] **公式準確性**: 計算公式符合醫學標準
- [ ] **參考文獻**: 引用權威醫學指引
- [ ] **結果解釋**: 醫學解釋準確且實用
- [ ] **風險分級**: 風險等級劃分合理

## ⚠️ 常見錯誤和解決方案

### 1. Hydration 問題

**症狀**: 計算器顯示轉圈圈，無法載入
**解決方案**:

- 確保添加 `transition:persist="unique-id"` 到 PluginCalculator 組件
- 檢查 pluginId 格式是否正確 (`namespace.calculator-id`)

### 2. 類型錯誤

**症狀**: TypeScript 編譯錯誤
**解決方案**:

- 確保所有類型導入正確
- 檢查 `calculator.ts` 中的函數簽名
- 驗證 `config.json` 結構符合類型定義

### 3. 計算錯誤

**症狀**: 計算結果不正確
**解決方案**:

- 檢查數值轉換 (`Number()`, `parseFloat()`)
- 驗證單位轉換（如 cm 轉 m）
- 確認公式實現正確

### 4. 多語言問題

**症狀**: 某些語言顯示不正確
**解決方案**:

- 檢查所有多語言對象都包含 `zh-TW`, `en`, `ja`
- 確保有適當的 fallback 邏輯
- 驗證 locale 參數傳遞正確

### 5. 樣式問題

**症狀**: 計算器樣式顯示異常
**解決方案**:

- 確保使用 Tailwind CSS 類名
- 檢查響應式設計類名 (`md:`, `lg:`)
- 驗證容器和網格布局

### 6. 專科分類錯誤

**症狀**: 計算器無法在正確的專科下顯示
**解決方案**:

- 確認計算器放在正確的專科目錄下
- 檢查 `pluginId` 格式：`specialty.calculator-id`
- 驗證專科索引中的 `calculators` 數組已更新
- 確認可視化註冊表中的鍵名正確

### 7. 導航問題

**症狀**: 無法從工具頁面導航到計算器
**解決方案**:

- 檢查 `urlPath` 是否正確
- 確認頁面文件名與路徑匹配
- 驗證 `staticCalculators` 配置
- 確認專科分類配置正確

## 📚 最佳實踐

### 代碼組織

1. **專科分類**: 選擇最適合的醫療專科分類
2. **單一職責**: 每個文件只負責一個功能
3. **類型安全**: 充分利用 TypeScript 類型檢查
4. **錯誤處理**: 提供清晰的錯誤訊息
5. **文檔註釋**: 為複雜邏輯添加註釋
6. **命名一致**: 遵循現有的命名慣例

### 用戶體驗

1. **即時驗證**: 輸入時立即顯示驗證結果
2. **清晰反饋**: 提供明確的成功/錯誤狀態
3. **響應式設計**: 適配各種設備
4. **無障礙設計**: 支持螢幕閱讀器

### 醫學準確性

1. **權威來源**: 使用權威醫學指引
2. **版本控制**: 記錄公式版本和更新日期
3. **同行評議**: 邀請醫學專家審核
4. **持續更新**: 定期更新醫學標準

### 性能優化

1. **懶加載**: 使用 `client:load` 適當時機
2. **狀態持久**: 使用 `transition:persist` 避免重新載入
3. **緩存策略**: 合理使用瀏覽器緩存
4. **代碼分割**: 避免不必要的依賴

## 🔧 開發工具

### 推薦工具

- **VS Code**: 主要開發環境
- **TypeScript**: 類型檢查
- **ESLint**: 代碼檢查
- **Prettier**: 代碼格式化
- **Chrome DevTools**: 調試工具

### 有用的命令

```bash
# 開發服務器
npm run dev

# 類型檢查
npm run type-check

# 代碼檢查
npm run lint

# 構建項目
npm run build

# 預覽構建結果
npm run preview
```

## 📖 參考資源

### 技術文檔

- [Astro 官方文檔](https://docs.astro.build/)
- [React 官方文檔](https://react.dev/)
- [TypeScript 手冊](https://www.typescriptlang.org/docs/)
- [Tailwind CSS 文檔](https://tailwindcss.com/docs)

### 醫學資源

- [WHO 官方指引](https://www.who.int/)
- [ESC 心臟病學會指引](https://www.escardio.org/)
- [KDIGO 腎臟病指引](https://kdigo.org/)
- [台灣衛生福利部](https://www.mohw.gov.tw/)

## 🚀 快速檢查清單

在提交新計算器之前，請確認以下所有項目：

### 文件結構 ✅

- [ ] 計算器放在正確的專科目錄：`src/calculators/specialties/{specialty}/{calculator-id}/`
- [ ] 包含所有必要文件：`config.json`, `calculator.ts`, `index.ts`, `Dashboard.tsx`, `visualization.json`
- [ ] 創建測試文件：`__tests__/calculator.test.ts`

### 配置更新 ✅

- [ ] 更新專科索引：`src/calculators/specialties/index.ts`
- [ ] 更新可視化註冊表：`src/config/visualization-registry.ts`
- [ ] 更新工具總覽頁面：`src/pages/tools/index.astro`
- [ ] 更新 PluginCalculator 組件實現

### 頁面創建 ✅

- [ ] 創建專用頁面：`src/pages/tools/{calculator-id}.astro`
- [ ] 配置正確的 pluginId：`{specialty}.{calculator-id}`
- [ ] 添加適當的 meta 信息和麵包屑

### 測試驗證 ✅

- [ ] 計算邏輯正確
- [ ] 輸入驗證有效
- [ ] 多語言支持完整
- [ ] 響應式設計正常
- [ ] 構建成功無錯誤

### 醫學驗證 ✅

- [ ] 公式來源權威
- [ ] 結果解釋準確
- [ ] 風險分級合理
- [ ] 臨床建議實用

---

**版本**: 2.0.0  
**最後更新**: 2025-07-29  
**維護者**: Astro Clinical Platform Team

此 SOP 已更新以反映新的專科分類結構，請遵循最新的開發流程。
