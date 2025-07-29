# Cloudflare Pages 部署指南

本文件說明如何將 Astro Clinical Platform 部署到 Cloudflare Pages。

## 🚀 快速開始

### 1. 準備工作

確保你有：
- Cloudflare 帳戶
- GitHub 儲存庫存取權限
- 專案已推送到 GitHub

### 2. 建立 Cloudflare Pages 專案

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 選擇 **Pages** > **Create a project**
3. 選擇 **Connect to Git**
4. 授權 Cloudflare 存取你的 GitHub 帳戶
5. 選擇 `astro-clinical-platform` 儲存庫

### 3. 配置建置設定

在 Cloudflare Pages 設定頁面中：

```
Framework preset: Astro
Build command: npm run build
Build output directory: dist
Root directory: astro-clinical-platform
```

### 4. 環境變數設定

在 Cloudflare Pages 專案設定中，添加以下環境變數：

#### 生產環境變數
```
NODE_VERSION=20
PUBLIC_SITE_URL=https://your-domain.com
PUBLIC_ANALYTICS_ID=your-plausible-domain
PUBLIC_CMS_URL=https://your-cms-url.com
CMS_API_KEY=your-cms-api-key
```

#### 預覽環境變數
```
NODE_VERSION=20
PUBLIC_SITE_URL=https://preview.your-domain.com
PUBLIC_ANALYTICS_ID=your-plausible-preview-domain
PUBLIC_CMS_URL=https://your-cms-preview-url.com
CMS_API_KEY=your-cms-preview-api-key
```

## 🔧 進階配置

### 自訂域名設定

1. 在 Cloudflare Pages 專案中，前往 **Custom domains**
2. 點擊 **Set up a custom domain**
3. 輸入你的域名（例如：`astro-clinical-platform.com`）
4. 按照指示更新 DNS 記錄

### 安全標頭

專案已包含 `_headers` 檔案，會自動套用以下安全標頭：
- Content Security Policy
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security
- 醫療平台專用標頭

### 重定向規則

專案已包含 `_redirects` 檔案，處理：
- URL 正規化
- 舊版 URL 重定向
- 語言路由重定向
- 404 錯誤處理

## 🔄 CI/CD 流程

### 自動部署

每次推送到以下分支時會自動觸發部署：
- `main` → 生產環境
- `develop` → 預覽環境

### GitHub Actions

專案包含以下 GitHub Actions 工作流程：

1. **CI/CD Pipeline** (`.github/workflows/ci.yml`)
   - 程式碼品質檢查
   - 測試執行
   - 建構專案
   - 部署到 Cloudflare Pages
   - Lighthouse 效能檢查

2. **Deploy Preview** (`.github/workflows/deploy-preview.yml`)
   - PR 預覽部署
   - 自動標籤分類
   - 預覽 URL 留言

### 必要的 GitHub Secrets

在 GitHub 儲存庫設定中添加以下 secrets：

```
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
PUBLIC_SITE_URL=https://your-domain.com
PUBLIC_ANALYTICS_ID=your-analytics-id
LHCI_GITHUB_APP_TOKEN=your-lighthouse-ci-token
```

## 📊 監控與分析

### Cloudflare Analytics

Cloudflare Pages 提供內建分析功能：
- 頁面瀏覽量
- 獨特訪客
- 頻寬使用量
- 錯誤率

### Web Vitals 監控

專案整合 Lighthouse CI，自動監控：
- Core Web Vitals
- 效能分數
- 無障礙性檢查
- SEO 優化

### 錯誤追蹤

建議整合錯誤追蹤服務：
- Sentry
- LogRocket
- Cloudflare Workers Analytics Engine

## 🔒 安全性考量

### HTTPS

Cloudflare Pages 自動提供：
- 免費 SSL/TLS 憑證
- HTTP/2 和 HTTP/3 支援
- 自動 HTTPS 重定向

### DDoS 防護

Cloudflare 提供內建 DDoS 防護：
- 自動威脅偵測
- 速率限制
- Bot 管理

### 醫療資料合規

確保符合醫療資料保護規範：
- 不在客戶端儲存 PHI
- 使用 HTTPS 加密傳輸
- 實施適當的存取控制

## 🚨 故障排除

### 常見問題

1. **建置失敗**
   - 檢查 Node.js 版本是否正確
   - 確認所有依賴都已安裝
   - 查看建置日誌中的錯誤訊息

2. **環境變數問題**
   - 確認變數名稱正確
   - 檢查是否設定在正確的環境中
   - 重新部署以套用變更

3. **域名設定問題**
   - 確認 DNS 記錄正確
   - 等待 DNS 傳播完成（最多 24 小時）
   - 檢查 SSL 憑證狀態

### 除錯工具

- Cloudflare Pages 建置日誌
- GitHub Actions 執行記錄
- 瀏覽器開發者工具
- Lighthouse CI 報告

## 📞 支援

如需協助，請：
1. 查看 [Cloudflare Pages 文件](https://developers.cloudflare.com/pages/)
2. 檢查 GitHub Issues
3. 聯繫開發團隊

## 🔄 更新與維護

### 定期維護

- 每週檢查依賴更新
- 每月檢查安全性更新
- 每季檢查效能指標

### 備份策略

- GitHub 儲存庫作為主要備份
- Cloudflare Pages 自動保留部署歷史
- 定期匯出重要配置設定

---

**注意**: 這是醫療平台，請確保所有部署都經過適當的測試和醫療專家審核。