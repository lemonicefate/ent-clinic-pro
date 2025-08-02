# Decap CMS 設定指南

## 概述

本專案整合了 Decap CMS（前身為 Netlify CMS）來管理衛教文章的發布工作流程。CMS 提供了一個視覺化的編輯介面，支援完整的 SOP 工作流程，包括文章撰寫、審核、品質檢查和發布。

## 功能特色

### 🔄 SOP 工作流程支援
- **狀態管理**：支援 6 種文章狀態（草稿、審核中、需要修改、品質檢查、準備發布、已發布）
- **版本控制**：完整的版本歷史追蹤
- **審核流程**：多層級審核機制，支援審核者分配和審核歷史
- **品質檢查**：內建品質檢查清單和自動化檢查
- **時間戳追蹤**：記錄工作流程各階段的時間

### 🏥 醫療專科管理
- **專科分類**：完整的醫療專科分類系統
- **工作流程配置**：每個專科可設定特定的審核流程
- **內容模板**：專科特定的內容模板和檢查清單

### 🌐 多語言支援
- 支援繁體中文、英文、日文
- 多語言內容編輯和管理
- 語言特定的 SEO 設定

## 安裝步驟

### 1. 安裝依賴套件

```bash
npm install decap-cms-app
```

### 2. 設定環境變數

複製 `.env.cms.example` 為 `.env.local` 並填入實際值：

```bash
cp .env.cms.example .env.local
```

### 3. 設定 GitHub OAuth App

1. 前往 GitHub Settings > Developer settings > OAuth Apps
2. 點擊 "New OAuth App"
3. 填入以下資訊：
   - **Application name**: 醫療平台 CMS
   - **Homepage URL**: `https://your-domain.com`
   - **Authorization callback URL**: `https://your-domain.com/admin/`
4. 記錄 Client ID 和 Client Secret

### 4. 更新 CMS 配置

編輯 `public/admin/config.yml`：

```yaml
backend:
  name: github
  repo: your-username/astro-clinical-platform
  branch: main
```

### 5. 設定 GitHub 權限

確保 CMS 使用者具有儲存庫的寫入權限：

1. 前往 GitHub 儲存庫設定
2. 在 "Manage access" 中新增協作者
3. 或設定適當的團隊權限

## 使用方式

### 存取 CMS 管理介面

1. 前往 `https://your-domain.com/admin/`
2. 使用 GitHub 帳號登入
3. 開始建立和編輯內容

### 衛教文章工作流程

#### 1. 建立新文章
- 點擊「衛教文章」→「新增衛教文章」
- 填寫基本資訊（標題、摘要、分類）
- 設定狀態為「草稿」
- 撰寫內容

#### 2. 提交審核
- 將狀態改為「審核中」
- 指定審核者
- 系統會自動記錄提交時間

#### 3. 審核流程
- 審核者在 CMS 中檢視文章
- 填寫審核檢查清單
- 選擇審核決定（通過/拒絕/需要修改）
- 系統記錄審核歷史

#### 4. 品質檢查
- 文章通過審核後進入品質檢查階段
- 執行結構、內容、SEO 等檢查
- 完成所有檢查項目

#### 5. 發布
- 品質檢查通過後，狀態變為「準備發布」
- 管理者執行最終發布
- 文章狀態變為「已發布」

### 醫療專科管理

#### 新增專科
1. 前往「醫療專科」→「新增醫療專科」
2. 填寫基本資訊（名稱、描述、網址代碼）
3. 設定工作流程配置：
   - 審核者角色
   - 必要審核數量
   - 審核時限
   - 專科特定要求
4. 配置內容模板（必要章節、預設標籤）

#### 工作流程配置
每個專科可以設定不同的工作流程：
- **審核者角色**：專科醫師、醫學編輯、內容審核員等
- **審核數量**：需要多少人審核通過
- **時限設定**：審核時限（天數）
- **特殊要求**：證據等級檢查、指引符合性等

## 進階功能

### 自定義預覽模板

CMS 包含自定義的預覽模板，可以即時預覽文章外觀：

- **衛教文章預覽**：顯示標題、狀態、專科標籤和內容
- **專科預覽**：顯示專科資訊和狀態

### 編輯器功能

- **Markdown 編輯器**：支援富文本和原始碼模式
- **圖片上傳**：拖放上傳圖片到媒體資料夾
- **程式碼區塊**：支援語法高亮
- **Mermaid 流程圖**：內建流程圖編輯器

### 搜尋和過濾

- **全文搜尋**：搜尋文章標題和內容
- **狀態過濾**：按文章狀態過濾
- **專科分組**：按醫療專科分組檢視
- **排序功能**：按標題、日期、作者排序

## 本地開發

### 啟用本地後端

在 `public/admin/config.yml` 中啟用：

```yaml
local_backend: true
```

然後執行：

```bash
npx decap-server
```

### 開發模式

```bash
npm run dev
```

前往 `http://localhost:4321/admin/` 存取本地 CMS。

## 故障排除

### 常見問題

#### 1. 無法登入 CMS
- 檢查 GitHub OAuth 設定
- 確認 callback URL 正確
- 檢查儲存庫權限

#### 2. 圖片上傳失敗
- 檢查媒體資料夾權限
- 確認 `public/images/uploads` 目錄存在

#### 3. 預覽不顯示
- 檢查瀏覽器控制台錯誤
- 確認預覽模板 JavaScript 正確載入

#### 4. 內容不同步
- 檢查 Git 提交權限
- 確認分支設定正確

### 除錯模式

在瀏覽器控制台中啟用除錯：

```javascript
localStorage.setItem('debug', 'decap-cms:*');
```

## 安全性考量

### 權限管理
- 使用 GitHub 團隊管理存取權限
- 定期檢查協作者清單
- 實施最小權限原則

### 內容審核
- 啟用編輯工作流程（editorial workflow）
- 要求 Pull Request 審核
- 設定分支保護規則

### 備份策略
- Git 提供自動版本控制
- 定期備份媒體檔案
- 監控儲存庫活動

## 效能優化

### 圖片優化
- 使用適當的圖片格式（WebP、AVIF）
- 設定圖片壓縮
- 實施延遲載入

### 快取策略
- 設定適當的 CDN 快取
- 使用瀏覽器快取
- 實施服務工作者

## 支援和維護

### 更新 CMS
定期更新 Decap CMS：

```bash
npm update decap-cms-app
```

### 監控和分析
- 監控 CMS 使用情況
- 分析內容發布流程
- 收集使用者回饋

### 文件維護
- 保持設定文件更新
- 記錄自定義修改
- 維護使用者指南

## 相關資源

- [Decap CMS 官方文件](https://decapcms.org/docs/)
- [GitHub OAuth 設定指南](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Astro 整合指南](https://docs.astro.build/en/guides/cms/)
- [Markdown 語法參考](https://www.markdownguide.org/basic-syntax/)

## 聯絡支援

如有問題或需要協助，請：
1. 檢查本文件的故障排除章節
2. 查看 GitHub Issues
3. 聯絡開發團隊