# 貢獻指南

感謝您對 ENT Clinic Pro 的興趣！我們歡迎各種形式的貢獻。

## 🚀 快速開始

1. Fork 此儲存庫
2. 克隆您的 fork：`git clone https://github.com/YOUR_USERNAME/ent-clinic-pro.git`
3. 安裝依賴：`cd ent-clinic-pro/astro-clinical-platform && npm install`
4. 建立功能分支：`git checkout -b feature/your-feature-name`

## 📋 貢獻類型

### 🐛 錯誤修復
- 修復現有功能的問題
- 改善錯誤處理
- 修正文檔錯誤

### ✨ 新功能
- 添加新的醫療計算機
- 改善現有功能
- 添加新的視覺化組件

### 📝 文檔改進
- 改善 README 和指南
- 添加程式碼註釋
- 建立教學文檔

### 🧪 測試增強
- 增加測試覆蓋率
- 改善測試品質
- 添加端到端測試

## 🔧 開發流程

### 1. 設定開發環境

```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 運行測試
npm test

# 啟動 Storybook
npm run storybook
```

### 2. 程式碼標準

- 使用 TypeScript
- 遵循 ESLint 規則
- 使用 Prettier 格式化
- 撰寫測試

### 3. 提交規範

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
feat: 添加新的 BMI 計算機
fix: 修復 CHA₂DS₂-VASc 計算錯誤
docs: 更新 README 文檔
test: 添加 eGFR 計算機測試
```

### 4. Pull Request 流程

1. 確保所有測試通過：`npm test`
2. 檢查程式碼品質：`npm run lint`
3. 建立 Pull Request
4. 填寫 PR 模板
5. 等待程式碼審查

## 🧮 添加新計算機

請參考 [模組化計算機開發指南](./MODULAR_CALCULATOR_GUIDE.md) 了解如何添加新的醫療計算機。

### 基本步驟

1. 複製 `src/calculators/_template/` 目錄
2. 重新命名為您的計算機名稱
3. 實作計算邏輯
4. 添加測試
5. 更新文檔

## 🧪 測試要求

- 新功能必須包含測試
- 測試覆蓋率應保持在 90% 以上
- 包含單元測試和整合測試
- 使用 Storybook 進行視覺化測試

## 📝 文檔要求

- 所有公開 API 必須有 JSDoc 註釋
- 新功能需要更新相關文檔
- 包含使用範例
- 支援多語言文檔

## 🔍 程式碼審查

所有 Pull Request 都需要經過程式碼審查：

- 至少一位維護者的批准
- 所有 CI 檢查必須通過
- 符合程式碼標準
- 包含適當的測試

## 🐛 錯誤報告

使用 GitHub Issues 報告錯誤：

1. 使用錯誤報告模板
2. 提供重現步驟
3. 包含環境資訊
4. 添加相關標籤

## 💡 功能請求

使用 GitHub Issues 提出功能請求：

1. 使用功能請求模板
2. 描述使用案例
3. 說明預期行為
4. 考慮實作方式

## 📞 聯絡方式

- GitHub Issues：錯誤報告和功能請求
- GitHub Discussions：技術討論
- Email：lemonicefate@gmail.com

## 📄 授權

貢獻的程式碼將採用 MIT 授權條款。

---

再次感謝您的貢獻！🙏