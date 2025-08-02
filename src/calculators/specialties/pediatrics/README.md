# 小兒科計算器 (Pediatrics Calculators)

本目錄包含小兒科相關的計算器，用於兒童醫療的劑量計算、生長發育評估和疾病診斷輔助。

## 現有計算器

### Amoxicillin/Clavulanate 劑量計算器
- **路徑**: `amoxicillin-clavulanate-dose/`
- **功能**: 計算兒童 Amoxicillin/Clavulanate 的最佳劑量組合
- **適用對象**: 兒童抗生素治療
- **輸入參數**: 體重、劑量目標、用藥頻次、治療天數
- **輸出結果**: 藥錠組合、最終劑量、用藥指示
- **特色**: 考慮 Amox:Clav 比例限制和安全性

## 計劃新增計算器

- **兒童 BMI 百分位數** - 兒童體重狀態評估
- **生長曲線計算器** - 身高體重百分位數
- **兒童藥物劑量計算器** - 常用兒童藥物劑量
- **新生兒黃疸風險評估** - Bhutani 曲線評估
- **兒童脫水程度評估** - 脫水嚴重度計算
- **兒童發燒處理指引** - 退燒藥劑量計算
- **兒童營養需求計算** - 熱量和營養素需求

## 使用方式

```typescript
// 在 SimpleCalculatorService 中的 ID
'pediatrics.amoxicillin-clavulanate-dose'
```

## 相關指引

- AAP (American Academy of Pediatrics) Guidelines
- 台灣兒科醫學會臨床指引
- WHO Child Growth Standards
- 兒童藥物治療指引

## 相關專科

- 家庭醫學科 (兒童健康照護)
- 急診科 (兒童急症處理)
- 感染科 (兒童感染症治療)
- 新生兒科 (新生兒照護)