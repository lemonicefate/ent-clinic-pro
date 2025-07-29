# Cloudflare Pages 部署指南

## 🚀 為什麼選擇 Cloudflare Pages？

- ⚡ **更快的全球 CDN**：200+ 個數據中心
- 🔒 **免費 SSL 證書**：自動 HTTPS
- 🌐 **自定義域名**：支援您自己的域名
- 📊 **Web Analytics**：免費的網站分析
- 🛡️ **DDoS 保護**：企業級安全防護
- 💰 **慷慨的免費額度**：每月 100,000 次請求

## 📋 部署步驟

### 步驟 1: 登入 Cloudflare

1. 前往 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 登入您的帳號（如果沒有帳號請先註冊）

### 步驟 2: 建立 Pages 專案

1. 在左側選單點擊 **"Pages"**
2. 點擊 **"Create a project"**
3. 選擇 **"Connect to Git"**

### 步驟 3: 連接 GitHub 儲存庫

1. 選擇 **GitHub** 作為 Git 提供商
2. 授權 Cloudflare 存取您的 GitHub 帳號
3. 選擇 **"lemonicefate/ent-clinic-pro"** 儲存庫

### 步驟 4: 配置建置設定

```yaml
專案名稱: ent-clinic-pro
生產分支: master
建置命令: npm run build
建置輸出目錄: dist
根目錄: astro-clinical-platform
Node.js 版本: 18
```

### 重要配置說明

專案現在使用 **Server-Side Rendering (SSR)** 模式配合 Cloudflare 適配器：

- ✅ 使用 `@astrojs/cloudflare` 適配器
- ✅ 輸出模式設定為 `server`
- ✅ API 路由設定為 `prerender = false` 以支援動態功能
- ✅ 支援 Cloudflare Workers 環境
- ✅ 修正了 `clientAddress` 和 `request.headers` 的預渲染問題

**重要**：請將 **根目錄** 設定為 `astro-clinical-platform`，這樣 Cloudflare Pages 就能找到正確的 `package.json` 檔案。

### 步驟 5: 環境變數設定（可選）

如果您的專案需要環境變數，可以在 **"Settings" → "Environment variables"** 中添加：

```
NODE_VERSION=18
PUBLIC_SITE_URL=https://your-custom-domain.com
```

### 步驟 6: 部署

1. 點擊 **"Save and Deploy"**
2. Cloudflare 會自動開始建置和部署
3. 首次部署通常需要 2-5 分鐘

## 🌐 部署後設定

### 自動生成的網址

部署完成後，您會獲得一個自動生成的網址：
```
https://ent-clinic-pro.pages.dev
```

### 設定自定義域名（可選）

1. 在 Pages 專案中點擊 **"Custom domains"**
2. 點擊 **"Set up a custom domain"**
3. 輸入您的域名（例如：`ent-clinic-pro.com`）
4. 按照指示更新 DNS 設定

## 🔄 自動部署

### Git 整合

- **自動部署**：每次推送到 `master` 分支都會自動觸發部署
- **預覽部署**：Pull Request 會自動建立預覽環境
- **回滾功能**：可以輕鬆回滾到之前的版本

### 部署狀態

您可以在以下位置查看部署狀態：
- Cloudflare Dashboard → Pages → ent-clinic-pro
- GitHub 儲存庫的 Deployments 標籤

## ⚡ 效能優化

### 自動優化功能

Cloudflare Pages 自動提供：
- **Brotli 壓縮**：更好的檔案壓縮
- **HTTP/2 和 HTTP/3**：更快的協議
- **Smart Routing**：智能路由優化
- **Image Optimization**：圖片自動優化

### 快取設定

建立 `astro-clinical-platform/public/_headers` 檔案：

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable

/*.woff2
  Cache-Control: public, max-age=31536000, immutable
```

## 📊 監控和分析

### Web Analytics

1. 在 Pages 專案中點擊 **"Analytics"**
2. 啟用 **"Web Analytics"**
3. 將追蹤代碼添加到您的網站

### 效能監控

- **Core Web Vitals**：自動監控網站效能指標
- **流量分析**：訪客統計和地理分布
- **錯誤追蹤**：自動捕獲 JavaScript 錯誤

## 🛠️ 進階設定

### Functions（可選）

如果需要伺服器端功能，可以使用 Cloudflare Functions：

```javascript
// astro-clinical-platform/functions/api/hello.js
export async function onRequest(context) {
  return new Response("Hello from Cloudflare Functions!");
}
```

### 重定向規則

建立 `astro-clinical-platform/public/_redirects` 檔案：

```
# 重定向舊路徑
/old-path/* /new-path/:splat 301

# SPA 回退
/* /index.html 200
```

## 🔧 故障排除

### 常見問題

1. **建置失敗**：
   - 檢查 Node.js 版本是否正確
   - 確認建置命令路徑正確
   - 查看建置日誌中的錯誤訊息

2. **404 錯誤**：
   - 確認建置輸出目錄設定正確
   - 檢查 Astro 配置中的 base 路徑

3. **環境變數問題**：
   - 確認變數名稱正確
   - 檢查是否需要 `PUBLIC_` 前綴

### 支援資源

- [Cloudflare Pages 文檔](https://developers.cloudflare.com/pages/)
- [Astro 部署指南](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [社群支援](https://community.cloudflare.com/)

## 🎉 完成！

您的 ENT Clinic Pro 現在已經部署到 Cloudflare Pages！

**網站網址**：https://ent-clinic-pro.pages.dev

享受快速、安全、可靠的網站託管服務！🚀