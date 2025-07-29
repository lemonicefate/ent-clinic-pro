# GitHub 發布設定指南

## 步驟 1: 建立 GitHub 儲存庫

### 儲存庫設定
- **Repository name**: `ent-clinic-pro`
- **Description**: `一個基於 Astro 的現代化耳鼻喉科醫療平台，提供模組化醫療計算工具和衛教內容管理系統`
- **Visibility**: Public（公開）
- **License**: MIT License

### 推送程式碼

```bash
# 添加 GitHub 遠端儲存庫（請替換 YOUR_USERNAME 為您的實際 GitHub 用戶名）
git remote add origin https://github.com/YOUR_USERNAME/ent-clinic-pro.git

# 推送程式碼到 GitHub
git push -u origin master
```

## 步驟 2: 設定 GitHub Pages 或 Cloudflare Pages 部署

### 選項 A: Cloudflare Pages（推薦）

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 進入 "Pages" 頁面
3. 點擊 "Create a project" → "Connect to Git"
4. 選擇您的 GitHub 儲存庫
5. 設定建置配置：
   - **Framework preset**: Astro
   - **Build command**: `cd astro-clinical-platform && npm run build`
   - **Build output directory**: `astro-clinical-platform/dist`
   - **Root directory**: `/`

### 選項 B: GitHub Pages

1. 進入您的 GitHub 儲存庫
2. 點擊 "Settings" → "Pages"
3. Source 選擇 "GitHub Actions"
4. 建立 `.github/workflows/deploy.yml` 檔案（見下方）

## 步驟 3: 設定環境變數（如果需要）

在 Cloudflare Pages 或 GitHub 中設定以下環境變數：

```
NODE_VERSION=18
PUBLIC_SITE_URL=https://your-domain.com
```

## 步驟 4: 更新 README 中的連結

將 README.md 中的以下內容更新為實際連結：

- GitHub 儲存庫連結
- 部署網站連結
- 聯絡資訊

## 步驟 5: 建立 GitHub Actions 工作流程（可選）

如果選擇 GitHub Pages，建立以下檔案：