# ENT Clinic Pro

一個基於 Astro 的現代化耳鼻喉科醫療平台，提供模組化、可擴展的醫療計算工具和衛教內容管理系統。

## 🏥 專案概述

ENT Clinic Pro 是一個專為耳鼻喉科醫療專業人員設計的綜合平台，採用模組化架構，提供醫療計算工具、衛教內容管理系統，以及完整的 SOP 工作流程，包括 BMI、CHA₂DS₂-VASc、eGFR 等常用臨床計算工具。

### 主要特色

- 🧮 **模組化計算機**: 每個計算機都是獨立的模組，易於開發和維護
- 🌐 **多語言支援**: 支援繁體中文、英文、日文等多種語言
- 📱 **響應式設計**: 適配桌面、平板和手機等各種設備
- 🎨 **視覺化展示**: 豐富的圖表和視覺化組件
- 🧪 **完整測試**: 包含單元測試、整合測試和端到端測試
- ♿ **無障礙支援**: 符合 WCAG 無障礙標準
- 🔒 **安全可靠**: 嚴格的輸入驗證和錯誤處理

### 已實現的計算機

- **BMI 計算機**: 身體質量指數計算，支援不同族群標準
- **CHA₂DS₂-VASc**: 心房顫動中風風險評估
- **eGFR 計算機**: 腎絲球過濾率估算 (CKD-EPI 2021)

## 🚀 快速開始

### 環境要求

- Node.js 18+
- npm 或 yarn
- Git

### 安裝和運行

```bash
# 克隆專案
git clone https://github.com/your-username/ent-clinic-pro.git
cd ent-clinic-pro/astro-clinical-platform

# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 訪問 http://localhost:4321
```

### 建置和部署

```bash
# 建置生產版本
npm run build

# 預覽建置結果
npm run preview

# 運行測試
npm test

# 運行 Storybook
npm run storybook
```

## 🏗️ 專案架構

```
ent-clinic-pro/astro-clinical-platform/
├── src/
│   ├── calculators/           # 計算機模組
│   │   ├── _template/         # 開發模板
│   │   ├── bmi/              # BMI 計算機
│   │   ├── cha2ds2-vasc/     # CHA₂DS₂-VASc 計算機
│   │   └── egfr/             # eGFR 計算機
│   ├── components/           # React 組件
│   │   ├── calculators/      # 計算機專用組件
│   │   ├── forms/           # 表單組件
│   │   ├── results/         # 結果展示組件
│   │   └── visualization/   # 視覺化組件
│   ├── pages/               # Astro 頁面
│   ├── services/            # 服務層
│   ├── types/               # TypeScript 類型定義
│   ├── utils/               # 工具函數
│   └── test-utils/          # 測試工具
├── .storybook/              # Storybook 配置
├── docs/                    # 文檔
└── cms/                     # Strapi CMS
```

## 📚 開發文檔

### 核心文檔

- [模組化計算機開發指南](./MODULAR_CALCULATOR_GUIDE.md) - 如何開發新的計算機模組
- [開發最佳實踐](./MODULE_DEVELOPMENT_BEST_PRACTICES.md) - 程式碼品質和開發標準
- [模組貢獻指南](./MODULE_CONTRIBUTION_GUIDE.md) - 如何為專案貢獻新模組

### 技術文檔

- [Storybook 設置指南](./STORYBOOK_SETUP.md) - 組件開發環境
- [儀表板開發指南](./DASHBOARD_GUIDE.md) - 視覺化儀表板開發
- [插件系統指南](./PLUGIN_SYSTEM_GUIDE.md) - 擴展系統功能

### 整合文檔

- [API 整合摘要](./API_INTEGRATION_SUMMARY.md) - 外部 API 整合
- [醫療資料庫整合](./MEDICAL_DATABASE_INTEGRATION.md) - 醫療資料庫連接
- [部署指南](./DEPLOYMENT.md) - 生產環境部署

## 🧪 測試

### 測試類型

- **單元測試**: 使用 Vitest 進行函數級測試
- **整合測試**: 測試組件和服務的整合
- **端到端測試**: 完整的使用者工作流程測試
- **視覺化測試**: Storybook 視覺回歸測試

### 運行測試

```bash
# 運行所有測試
npm test

# 運行單元測試
npx vitest run --config=vitest.unit.config.ts

# 運行特定計算機測試
npm test src/calculators/bmi/__tests__/calculator.test.ts

# 生成覆蓋率報告
npm run test:coverage

# 監視模式
npm run test:watch
```

### 測試覆蓋率

目前測試覆蓋率：

- BMI 計算機: 100% (77/77 測試通過)
- CHA₂DS₂-VASc 計算機: 100% (48/48 測試通過)
- eGFR 計算機: 96% (57/59 測試通過)

## 🎨 組件開發

### Storybook

使用 Storybook 進行組件開發和文檔：

```bash
# 啟動 Storybook
npm run storybook

# 建置 Storybook
npm run build-storybook
```

### 視覺化組件

- **ResultCard**: 結果展示卡片
- **RiskIndicator**: 風險等級指示器
- **CalculatorChart**: 圖表組件
- **Dashboard**: 儀表板佈局

## 🌐 國際化

支援的語言：

- 繁體中文 (zh-TW) - 預設
- 英文 (en)
- 日文 (ja) - 部分支援

### 添加新語言

1. 更新計算機配置文件中的多語言欄位
2. 添加翻譯內容到相關組件
3. 更新測試以驗證新語言支援

## 🔧 開發工具

### 程式碼品質

```bash
# ESLint 檢查
npm run lint

# Prettier 格式化
npm run format

# TypeScript 類型檢查
npm run type-check
```

### 開發環境

- **VS Code**: 推薦的開發環境
- **TypeScript**: 類型安全
- **Tailwind CSS**: 樣式框架
- **Vitest**: 測試框架
- **Storybook**: 組件開發

## 🤝 貢獻

我們歡迎各種形式的貢獻！

### 貢獻類型

- 🐛 **錯誤修復**: 修復現有功能的問題
- ✨ **新功能**: 添加新的計算機或功能
- 📝 **文檔改進**: 改善文檔品質
- 🧪 **測試增強**: 增加測試覆蓋率
- 🎨 **UI/UX 改進**: 改善使用者體驗

### 貢獻流程

1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 創建 Pull Request

詳細流程請參考 [模組貢獻指南](./MODULE_CONTRIBUTION_GUIDE.md)。

## 📄 授權

本專案採用 MIT 授權條款。詳見 [LICENSE](LICENSE) 文件。

## 🙏 致謝

感謝所有為此專案做出貢獻的開發者。

### 主要貢獻者

lemonicefate
Kiro dev, Claude code, Gemini cli

- 開發團隊
- 醫學顧問團隊
- 測試和品質保證團隊
- 文檔和本地化團隊

### 技術支援

- [Astro](https://astro.build/) - 靜態網站生成器
- [React](https://reactjs.org/) - UI 組件庫
- [TypeScript](https://www.typescriptlang.org/) - 類型安全
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Vitest](https://vitest.dev/) - 測試框架
- [Storybook](https://storybook.js.org/) - 組件開發工具

## 📞 聯絡我們

- **GitHub Issues**: 錯誤報告和功能請求
- **GitHub Discussions**: 技術討論
- **Email**: lemonicefate@gmail.com

---

**免責聲明**: 本平台提供的計算工具僅供醫療專業人員參考使用，不能替代專業醫療判斷。使用者應該根據具體臨床情況和最新醫學指引做出醫療決策。
