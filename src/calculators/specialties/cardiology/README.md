# 心臟科計算器 (Cardiology Calculators)

本目錄包含心臟科相關的計算器，用於心血管疾病的風險評估、診斷輔助和治療決策。

## 現有計算器

### CHA2DS2-VASc 評分 (CHA2DS2-VASc Score)
- **路徑**: `cha2ds2-vasc/`
- **功能**: 評估心房顫動患者的中風風險
- **適用對象**: 心房顫動患者
- **輸入參數**: 年齡、性別、充血性心衰竭、高血壓、糖尿病、中風史、血管疾病
- **輸出結果**: 風險評分、風險等級、抗凝治療建議

## 計劃新增計算器

- **HAS-BLED 評分** - 評估抗凝治療出血風險
- **GRACE 評分** - 急性冠心症風險評估
- **TIMI 風險評分** - 心肌梗塞風險評估
- **Framingham 風險評分** - 10年心血管疾病風險
- **CHADS2 評分** - 簡化版中風風險評估
- **Wells 評分** - 肺栓塞風險評估
- **CRUSADE 出血風險評分** - 急性冠心症出血風險

## 使用方式

```typescript
// 在 SimpleCalculatorService 中的 ID
'cardiology.cha2ds2-vasc'
```

## 相關指引

- 2020 ESC Guidelines for the management of atrial fibrillation
- AHA/ACC/HRS Guideline for the Management of Patients with Atrial Fibrillation
- ESC Guidelines for acute coronary syndromes

## 相關專科

- 急診科 (急性心血管事件)
- 內科 (心血管風險管理)
- 神經科 (中風預防)