# 🔍 預覽環境和測試系統

本文檔說明醫療衛教平台的預覽環境和測試系統的設置與使用方法。

## 📋 系統概述

預覽環境系統提供以下功能：

1. **PR 預覽部署** - 每個 Pull Request 自動建立預覽環境
2. **審核者專用介面** - 為內容審核者提供專門的審核工具
3. **內容變更比較** - 視覺化顯示內容變更差異
4. **測試資料生成** - 自動生成測試用的醫療內容
5. **品質檢查整合** - 整合所有品質檢查工具的結果

## 🚀 快速開始

### 建立預覽環境

1. **建立 Pull Request**：
   ```bash
   git checkout -b feature/new-medical-content
   git add .
   git commit -m "新增心臟科衛教內容"
   git push origin feature/new-medical-content
   ```

2. **自動觸發預覽部署**：
   - GitHub Actions 會自動檢測 PR 並開始建置
   - 預覽環境會在 Cloudflare Pages 上建立
   - 預覽 URL 會自動添加到 PR 評論中

3. **訪問預覽環境**：
   - 主要預覽：`https://pr-123.astro-clinical-platform.pages.dev`
   - 審核者介面：`https://pr-123.astro-clinical-platform.pages.dev/reviewer-dashboard`
   - 預覽資訊：`https://pr-123.astro-clinical-platform.pages.dev/preview-info`

### 本地預覽環境

```bash
# 生成測試資料並啟動開發環境
npm run preview:dev

# 或分別執行
npm run preview:generate-data
npm run dev
```

## 🛠️ 預覽環境組件

### 1. PreviewBanner 組件

在預覽模式下顯示的頂部橫幅，提供：
- PR 資訊顯示
- 快速導覽連結
- 預覽狀態指示

**使用方法**：
```astro
---
import PreviewBanner from '../components/PreviewBanner.astro';
---

<PreviewBanner />
```

### 2. ContentDiff 組件

用於顯示內容變更差異的組件：
- 行級差異比較
- 語法高亮顯示
- 可下載差異檔案

**使用方法**：
```astro
---
import ContentDiff from '../components/ContentDiff.astro';
---

<ContentDiff 
  originalContent={originalText}
  newContent={updatedText}
  filename="article.md"
  showLineNumbers={true}
/>
```

### 3. 審核者儀表板

位於 `/reviewer-dashboard` 的專用審核介面，包含：
- PR 資訊摘要
- 品質檢查結果
- 醫療內容審核清單
- 審核意見提交

### 4. 預覽資訊頁面

位於 `/preview-info` 的環境資訊頁面，顯示：
- PR 基本資訊
- 建置環境詳情
- 變更檔案列表
- 品質檢查狀態

## 🧪 測試資料系統

### 測試資料生成器

`scripts/generate-test-data.js` 提供完整的測試資料生成功能：

```bash
# 生成所有測試資料
npm run preview:generate-data

# 或直接執行腳本
node scripts/generate-test-data.js
```

### 生成的測試內容

1. **測試文章** (`test-content/education/`)：
   - 每個專科 3 篇範例文章
   - 不同狀態（draft, in-review, published）
   - 完整的 frontmatter 配置

2. **專科配置** (`test-content/medical-specialties/`)：
   - 各專科的審核者設定
   - 品質檢查規則
   - 內容模板配置

3. **內容模板** (`test-content/templates/`)：
   - 專科特定的文章模板
   - 標準化的內容結構
   - 預設的 frontmatter 欄位

### 測試資料結構

```
test-content/
├── education/           # 測試文章
│   ├── cardiology-test-1.md
│   ├── neurology-test-1.md
│   └── ...
├── medical-specialties/ # 專科配置
│   ├── cardiology.json
│   ├── neurology.json
│   └── reviewer-assignments.json
├── templates/          # 內容模板
│   ├── cardiology-template.md
│   ├── neurology-template.md
│   └── ...
└── test-data-report.json # 生成報告
```

## 🔄 GitHub Actions 工作流程

### PR 預覽部署工作流程

**檔案**: `.github/workflows/pr-preview-deploy.yml`

**觸發條件**:
- PR 建立、更新或重新開啟
- 涉及內容、頁面或組件變更

**主要步驟**:
1. **建置預覽版本** - 建立預覽環境配置並建置
2. **建立審核者介面** - 生成專用的審核工具
3. **生成內容變更比較** - 建立差異比較報告
4. **設定測試資料** - 準備測試用的範例內容
5. **通知預覽就緒** - 在 PR 中添加預覽連結評論

### 預覽環境變數

預覽環境會自動設定以下環境變數：

```bash
PUBLIC_SITE_URL=https://pr-123.astro-clinical-platform.pages.dev
PUBLIC_PREVIEW_MODE=true
PUBLIC_PR_NUMBER=123
PUBLIC_BRANCH_NAME=feature/new-content
PUBLIC_COMMIT_SHA=abc123def456
```

## 👥 審核者工作流程

### 1. 接收通知

當 PR 建立時，相關審核者會收到：
- GitHub 通知
- PR 評論中的預覽連結
- 自動指派的審核請求

### 2. 訪問審核介面

1. 點擊 PR 評論中的「審核者專用介面」連結
2. 或直接訪問 `{preview-url}/reviewer-dashboard`

### 3. 進行內容審核

審核者介面提供：
- **品質檢查摘要** - 自動化檢查結果
- **內容變更詳情** - 視覺化差異比較
- **醫療審核清單** - 專業審核檢查項目
- **審核意見表單** - 結構化的意見提交

### 4. 提交審核結果

- 選擇審核類型（批准/要求修改/僅評論）
- 填寫詳細的審核意見
- 完成醫療內容檢查清單
- 提交審核結果到 GitHub

## 🔧 配置和自訂

### Cloudflare Pages 設定

**環境變數**:
```bash
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ACCOUNT_ID=your-account-id
SITE_URL=https://your-domain.com
```

**建置設定**:
- 建置命令: `npm run build`
- 輸出目錄: `dist`
- Node.js 版本: `18`

### 預覽橫幅自訂

修改 `src/components/PreviewBanner.astro` 來自訂預覽橫幅：

```astro
---
// 自訂預覽橫幅配置
const customConfig = {
  showCommitInfo: true,
  showQuickActions: true,
  allowHide: true,
  theme: 'gradient' // 或 'solid'
};
---
```

### 審核清單自訂

在 `src/pages/reviewer-dashboard.astro` 中修改審核清單：

```javascript
const customChecklistItems = [
  {
    category: '醫療準確性',
    items: [
      '醫療資訊符合最新指引',
      '診斷建議適當且安全',
      // 添加更多檢查項目
    ]
  }
];
```

## 📊 監控和分析

### 預覽環境指標

- **建置時間** - 預覽環境建置所需時間
- **部署成功率** - 預覽部署的成功比例
- **審核完成時間** - 從預覽到審核完成的時間
- **品質檢查通過率** - 自動化品質檢查的通過率

### 使用分析

預覽環境會收集以下使用數據：
- 預覽頁面訪問量
- 審核者介面使用情況
- 內容變更比較查看次數
- 品質檢查結果分布

## 🚨 故障排除

### 常見問題

1. **預覽環境建置失敗**
   ```bash
   # 檢查建置日誌
   # 確認所有依賴已正確安裝
   npm ci
   npm run build
   ```

2. **預覽橫幅未顯示**
   ```bash
   # 檢查環境變數設定
   echo $PUBLIC_PREVIEW_MODE
   echo $PUBLIC_PR_NUMBER
   ```

3. **審核者介面載入錯誤**
   ```bash
   # 檢查預覽資訊 API
   curl https://preview-url/preview-info/info.json
   ```

4. **內容差異比較失效**
   ```bash
   # 檢查 Git 差異生成
   git diff origin/main...HEAD -- 'src/content/**/*.md'
   ```

### 除錯模式

啟用除錯模式來獲取更多資訊：

```bash
# 設定除錯環境變數
export DEBUG=preview:*
npm run dev
```

### 日誌查看

- **GitHub Actions 日誌** - 在 Actions 頁面查看建置日誌
- **Cloudflare Pages 日誌** - 在 Cloudflare 儀表板查看部署日誌
- **瀏覽器控制台** - 查看前端 JavaScript 錯誤

## 📞 支援和回饋

如有問題或建議：

- **技術問題** - 建立 GitHub Issue
- **功能請求** - 使用 Issue 模板
- **緊急問題** - 聯絡技術團隊

## 🔄 未來改進

計畫中的功能增強：

1. **即時協作** - 多人同時審核的即時更新
2. **行動裝置優化** - 改善手機和平板的審核體驗
3. **AI 輔助審核** - 整合 AI 工具協助內容審核
4. **效能監控** - 更詳細的預覽環境效能分析
5. **自動化測試** - 端到端的預覽環境測試

---

**📝 文檔版本**: 1.0  
**🔄 最後更新**: 2024-01-30  
**👥 維護者**: 技術團隊