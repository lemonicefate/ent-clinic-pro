# 醫療專科計算器分類

本目錄按醫療專科對計算器進行分類組織，便於管理和維護。

## 專科分類結構

### 🏥 一般醫學 (General)
- **BMI 計算器** - 身體質量指數計算

### ❤️ 心臟科 (Cardiology)
- **CHA2DS2-VASc 評分** - 心房顫動中風風險評估

### 🫘 腎臟科 (Nephrology)
- **eGFR 計算器** - 估算腎絲球過濾率

### 👶 小兒科 (Pediatrics)
- **Amoxicillin/Clavulanate 劑量計算器** - 兒童抗生素劑量計算

### 🩺 內分泌科 (Endocrinology)
- *待添加計算器*

### 🚨 急診科 (Emergency)
- *待添加計算器*

### 🏥 內科 (Internal Medicine)
- *待添加計算器*

### 🔪 外科 (Surgery)
- *待添加計算器*

### 🤱 婦產科 (Obstetrics & Gynecology)
- *待添加計算器*

### 🧠 精神科 (Psychiatry)
- *待添加計算器*

### 🩴 皮膚科 (Dermatology)
- *待添加計算器*

## 目錄結構

```
specialties/
├── general/
│   └── bmi/
├── cardiology/
│   └── cha2ds2-vasc/
├── nephrology/
│   └── egfr/
├── pediatrics/
│   └── amoxicillin-clavulanate-dose/
├── endocrinology/
├── emergency/
├── internal-medicine/
├── surgery/
├── obstetrics-gynecology/
├── psychiatry/
└── dermatology/
```

## 新增計算器指南

1. 選擇適當的專科資料夾
2. 在該專科下創建計算器資料夾
3. 包含必要文件：
   - `config.json` - 計算器配置
   - `calculator.ts` - 計算邏輯
   - `visualization.json` - 結果顯示配置
   - `index.ts` - 導出文件（如需要）

## 命名規範

- 專科資料夾：使用英文小寫，多詞用連字符分隔
- 計算器資料夾：使用描述性名稱，多詞用連字符分隔
- 文件名：遵循現有慣例

## 維護注意事項

- 新增計算器時需要更新 `visualization-registry.ts`
- 新增計算器時需要更新 `simple-calculator-service.ts`
- 保持專科分類的一致性和邏輯性