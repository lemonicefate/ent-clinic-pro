# Decap CMS GitHub OAuth 設定指南

## 📋 概述

為了讓 Decap CMS 能夠正常連接到 GitHub，我們需要設定 GitHub OAuth App 和認證伺服器。

## 🔧 設定步驟

### 步驟 1: 建立 GitHub OAuth App

1. **前往 GitHub Settings**
   - 登入 GitHub
   - 前往 Settings > Developer settings > OAuth Apps
   - 點擊 "New OAuth App"

2. **填寫 OAuth App 資訊**
   ```
   Application name: ENT Clinic Pro CMS
   Homepage URL: https://ent-clinic-pro.pages.dev
   Application description: CMS for ENT Clinic Pro medical platform
   Authorization callback URL: https://your-project-name.glitch.me/callback
   ```
   
   ⚠️ **重要**: `Authorization callback URL` 需要等步驟 2 完成後再填入

3. **取得認證資訊**
   - 建立完成後，記下 `Client ID`
   - 點擊 "Generate a new client secret" 取得 `Client Secret`

### 步驟 2: 部署 Glitch 認證伺服器

1. **前往 Glitch**
   - 訪問: https://glitch.com
   - 註冊或登入帳號

2. **建立新專案**
   - 點擊 "New Project"
   - 選擇 "Import from GitHub"
   - 輸入: `decaporg/decap-cms-oauth-provider-node`

3. **設定環境變數**
   - 在 Glitch 專案中，點擊 "Tools" > "Terminal"
   - 建立 `.env` 檔案:
   ```bash
   OAUTH_CLIENT_ID=your_github_client_id_here
   OAUTH_CLIENT_SECRET=your_github_client_secret_here
   ```

4. **取得 Glitch 伺服器網址**
   - 在專案頁面上方會顯示您的網址，格式如: `https://your-project-name.glitch.me`

### 步驟 3: 更新 GitHub OAuth App 回呼網址

1. **回到 GitHub OAuth App 設定**
   - 前往您剛建立的 OAuth App
   - 編輯 "Authorization callback URL"
   - 更新為: `https://your-project-name.glitch.me/callback`

### 步驟 4: 更新 CMS 配置

將以下資訊填入 `config.yml`:

```yaml
backend:
  name: github
  repo: lemonicefate/ent-clinic-pro
  branch: master
  auth_type: pkce
  base_url: https://your-project-name.glitch.me
  app_id: your_github_client_id_here
```

## ✅ 驗證設定

1. 訪問 `https://ent-clinic-pro.pages.dev/admin`
2. 點擊 "Login with GitHub"
3. 應該會重定向到 GitHub 進行授權
4. 授權後應該能成功登入 CMS

## 🔍 故障排除

### 常見問題

1. **"Error: Unable to access identity"**
   - 檢查 `base_url` 是否正確
   - 確認 Glitch 伺服器正在運行

2. **"OAuth Error"**
   - 檢查 GitHub OAuth App 的回呼網址
   - 確認 Client ID 和 Secret 正確

3. **"Repository not found"**
   - 確認 GitHub 帳號有儲存庫的存取權限
   - 檢查儲存庫名稱是否正確

### 測試 Glitch 伺服器

訪問 `https://your-project-name.glitch.me/test` 應該會看到測試頁面。

## 📝 注意事項

- Glitch 免費版會在一段時間後休眠，首次訪問可能較慢
- 建議升級到付費版以獲得更穩定的服務
- 定期檢查 Client Secret 是否過期

## 🔗 相關連結

- [Decap CMS 官方文檔](https://decapcms.org/docs/authentication-backends/)
- [GitHub OAuth Apps 文檔](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Glitch 平台](https://glitch.com)