# 腎臟科計算器 (Nephrology Calculators)

本目錄包含腎臟科相關的計算器，用於腎功能評估、慢性腎病分期和治療決策。

## 現有計算器

### eGFR 計算器 (Estimated Glomerular Filtration Rate)
- **路徑**: `egfr/`
- **功能**: 估算腎絲球過濾率，評估腎功能
- **適用對象**: 成人腎功能評估
- **輸入參數**: 年齡、性別、血清肌酸酐
- **輸出結果**: eGFR 值、腎功能分期、臨床建議
- **計算公式**: CKD-EPI 2021 方程式

## 計劃新增計算器

- **Cockcroft-Gault 公式** - 肌酸酐清除率計算
- **MDRD 公式** - 替代 eGFR 計算方法
- **腎功能藥物劑量調整** - 根據腎功能調整藥物劑量
- **蛋白尿風險評估** - 評估蛋白尿對腎功能的影響
- **透析充分性計算** - Kt/V 和 URR 計算
- **腎移植風險評估** - 移植前風險評估

## 使用方式

```typescript
// 在 SimpleCalculatorService 中的 ID
'nephrology.egfr'
```

## 相關指引

- KDIGO 2024 Clinical Practice Guideline for CKD evaluation and management
- NKF-KDOQI Guidelines
- 台灣腎臟醫學會慢性腎臟病防治指引

## 相關專科

- 內分泌科 (糖尿病腎病變)
- 心臟科 (心腎症候群)
- 泌尿科 (泌尿系統疾病)
- 家庭醫學科 (慢性病管理)