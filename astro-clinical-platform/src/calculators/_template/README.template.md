# 計算機模板

這是一個醫療計算機模組的標準模板，用於創建新的計算機模組。

## 📁 檔案結構

```
_template/
├── config.template.json          # 計算機配置模板
├── config.schema.json           # JSON Schema 驗證
├── calculator.template.ts        # 計算邏輯模板
├── calculator.template.test.ts   # 測試模板
└── README.template.md           # 說明文件模板
```

## 🚀 如何使用此模板

### 1. 複製模板

```bash
# 複製整個模板目錄
cp -r src/calculators/_template src/calculators/your-calculator-name

# 重命名檔案
cd src/calculators/your-calculator-name
mv config.template.json config.json
mv calculator.template.ts calculator.ts
mv calculator.template.test.ts calculator.test.ts
mv README.template.md README.md
```

### 2. 修改配置文件

編輯 `config.json`：

```json
{
  "id": "your-calculator-name",
  "name": {
    "zh-TW": "您的計算機名稱",
    "en": "Your Calculator Name"
  },
  "description": {
    "zh-TW": "計算機的詳細描述",
    "en": "Detailed description of the calculator"
  },
  "category": "cardiology", // 選擇適當的分類
  // ... 其他配置
}
```

### 3. 實現計算邏輯

編輯 `calculator.ts`：

```typescript
export function calculate(inputs: CalculatorInputs): CalculationResult {
  // 實現您的計算邏輯
  const result = yourCalculationLogic(inputs);
  
  return {
    primaryValue: result,
    primaryUnit: "您的單位",
    primaryLabel: { "zh-TW": "結果標籤" },
    // ... 其他返回值
  };
}
```

### 4. 撰寫測試

編輯 `calculator.test.ts`：

```typescript
describe('Your Calculator', () => {
  it('should calculate correctly', () => {
    const inputs = { /* 測試輸入 */ };
    const result = calculate(inputs);
    expect(result.primaryValue).toBe(expectedValue);
  });
});
```

### 5. 更新說明文件

編輯 `README.md` 以描述您的計算機功能、使用方法和醫學背景。

## 📋 配置文件說明

### 基本資訊

- `id`: 計算機的唯一識別符（小寫字母、數字、連字符）
- `name`: 多語言顯示名稱
- `description`: 多語言詳細描述
- `category`: 醫療專科分類
- `version`: 版本號（語義化版本）
- `status`: 發布狀態（published/draft/deprecated）

### 輸入欄位 (fields)

支援的欄位類型：
- `number`: 數值輸入
- `select`: 下拉選單
- `checkbox`: 複選框
- `radio`: 單選按鈕
- `range`: 滑桿

每個欄位可配置：
- 標籤和說明文字（多語言）
- 驗證規則（最小值、最大值、必填等）
- 條件顯示邏輯
- 自定義驗證器

### 計算配置 (calculation)

- `functionName`: 計算函式名稱
- `validationRules`: 驗證規則

### 結果解釋 (interpretation)

定義不同結果範圍的解釋和建議：
- `condition`: 條件表達式
- `level`: 風險等級
- `message`: 解釋訊息
- `recommendations`: 建議事項

### 視覺化配置 (visualization)

定義結果的視覺化展示：
- `resultDisplay`: 結果展示配置
- `components`: 視覺化組件列表

支援的組件類型：
- `result-card`: 結果卡片
- `risk-indicator`: 風險指示器
- `chart`: 圖表
- `gauge`: 儀表盤
- `progress-bar`: 進度條

### 醫療資訊 (medical)

- `specialty`: 相關醫療專科
- `evidenceLevel`: 證據等級（A/B/C/D）
- `references`: 參考文獻
- `clinicalGuidelines`: 臨床指引

### 元資料 (metadata)

- `tags`: 標籤
- `difficulty`: 難度等級
- `lastUpdated`: 最後更新日期
- `author`: 作者
- `reviewedBy`: 審核者

## 🧪 測試指南

### 測試類型

1. **單元測試**: 測試個別函式
2. **整合測試**: 測試完整工作流程
3. **邊界測試**: 測試極值和邊界條件
4. **錯誤處理測試**: 測試錯誤情況
5. **效能測試**: 測試計算效能

### 測試覆蓋

確保測試覆蓋以下方面：
- ✅ 所有計算路徑
- ✅ 所有驗證規則
- ✅ 所有風險等級
- ✅ 邊界值和極值
- ✅ 錯誤處理
- ✅ 多語言支援

### 運行測試

```bash
# 運行特定計算機的測試
npm test calculator.test.ts

# 運行所有測試
npm test

# 生成測試覆蓋率報告
npm run test:coverage
```

## 🎨 視覺化組件

### 結果卡片 (ResultCard)

顯示主要計算結果：

```json
{
  "type": "result-card",
  "config": {
    "valueKey": "primaryValue",
    "format": "number",
    "precision": 2,
    "showUnit": true,
    "colorScheme": "risk-based"
  }
}
```

### 風險指示器 (RiskIndicator)

顯示風險等級：

```json
{
  "type": "risk-indicator",
  "config": {
    "riskKey": "riskLevel",
    "style": "badge",
    "thresholds": [
      {
        "min": 0,
        "max": 10,
        "level": "low",
        "color": "#22c55e",
        "label": { "zh-TW": "低風險" }
      }
    ]
  }
}
```

### 圖表 (Chart)

顯示數據圖表：

```json
{
  "type": "chart",
  "config": {
    "chartType": "pie",
    "dataKey": "chartData",
    "responsive": true,
    "height": 300
  }
}
```

## 📚 最佳實踐

### 計算邏輯

1. **純函式**: 所有計算函式應該是純函式
2. **類型安全**: 使用 TypeScript 確保類型安全
3. **錯誤處理**: 妥善處理邊界情況和錯誤
4. **效能**: 避免不必要的計算和記憶體分配

### 驗證

1. **客戶端驗證**: 提供即時回饋
2. **伺服器端驗證**: 確保資料完整性
3. **自定義驗證**: 實現醫療特定的驗證邏輯
4. **錯誤訊息**: 提供清晰的錯誤訊息

### 國際化

1. **多語言支援**: 所有使用者可見文字都要支援多語言
2. **文化適應**: 考慮不同地區的醫療慣例
3. **單位轉換**: 支援不同的度量單位

### 無障礙性

1. **語義化標籤**: 使用適當的 ARIA 標籤
2. **鍵盤導航**: 支援鍵盤操作
3. **螢幕閱讀器**: 確保相容性
4. **色彩對比**: 符合 WCAG 指引

## 🔧 開發工具

### JSON Schema 驗證

使用 `config.schema.json` 驗證配置文件：

```bash
# 安裝 JSON Schema 驗證工具
npm install -g ajv-cli

# 驗證配置文件
ajv validate -s config.schema.json -d config.json
```

### 程式碼品質

```bash
# 程式碼檢查
npm run lint

# 程式碼格式化
npm run format

# 類型檢查
npm run type-check
```

## 📖 參考資源

- [JSON Schema 規範](https://json-schema.org/)
- [TypeScript 文檔](https://www.typescriptlang.org/docs/)
- [Vitest 測試框架](https://vitest.dev/)
- [Chart.js 圖表庫](https://www.chartjs.org/)
- [WCAG 無障礙指引](https://www.w3.org/WAI/WCAG21/quickref/)

## 🤝 貢獻指南

1. Fork 專案
2. 創建功能分支
3. 實現計算機邏輯
4. 撰寫完整測試
5. 更新文檔
6. 提交 Pull Request

## 📄 授權

本模板遵循 MIT 授權條款。