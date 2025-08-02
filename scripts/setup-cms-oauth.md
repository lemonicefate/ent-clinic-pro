# 🚀 CMS OAuth 快速設定腳本

## 📋 設定檢查清單

請按順序完成以下步驟：

### ✅ 步驟 1: GitHub OAuth App
- [ ] 前往 https://github.com/settings/developers
- [ ] 點擊 "New OAuth App"
- [ ] 填寫以下資訊：
  ```
  Application name: ENT Clinic Pro CMS
  Homepage URL: https://ent-clinic-pro.pages.dev
  Authorization callback URL: (先留空，步驟2完成後填入)
  ```
- [ ] 記錄 Client ID: `_________________`
- [ ] 生成並記錄 Client Secret: `_________________`

### ✅ 步驟 2: Glitch 認證伺服器
- [ ] 前往 https://glitch.com
- [ ] 建立新專案，選擇 "Import from GitHub"
- [ ] 輸入: `decaporg/decap-cms-oauth-provider-node`
- [ ] 等待專案建立完成
- [ ] 記錄您的 Glitch 網址: `https://_________________.glitch.me`
- [ ] 在 Glitch 專案中設定環境變數：
  - 點擊專案名稱旁的選單
  - 選擇 "Tools" > "Terminal"
  - 執行: `echo "OAUTH_CLIENT_ID=您的Client_ID" >> .env`
  - 執行: `echo "OAUTH_CLIENT_SECRET=您的Client_Secret" >> .env`

### ✅ 步驟 3: 更新 GitHub OAuth App
- [ ] 回到 GitHub OAuth App 設定頁面
- [ ] 編輯 "Authorization callback URL"
- [ ] 填入: `https://您的專案名稱.glitch.me/callback`
- [ ] 儲存變更

### ✅ 步驟 4: 更新 CMS 配置
- [ ] 編輯 `astro-clinical-platform/public/admin/config.yml`
- [ ] 找到 backend 區塊
- [ ] 將以下三行的值替換成您的實際資訊：
  ```yaml
  base_url: https://您的專案名稱.glitch.me
  app_id: 您的GitHub_Client_ID
  ```

### ✅ 步驟 5: 測試設定
- [ ] 提交並推送變更到 GitHub
- [ ] 等待 Cloudflare Pages 重新部署
- [ ] 訪問 https://ent-clinic-pro.pages.dev/admin
- [ ] 點擊 "Login with GitHub"
- [ ] 確認能成功登入

## 🔧 範例配置

完成後，您的 `config.yml` backend 區塊應該看起來像這樣：

```yaml
backend:
  name: github
  repo: lemonicefate/ent-clinic-pro
  branch: master
  auth_type: pkce
  base_url: https://melodic-imported-cello.glitch.me  # 您的實際網址
  app_id: Iv1.a1b2c3d4e5f6g7h8  # 您的實際 Client ID
```

## 🆘 需要幫助？

如果遇到問題，請檢查：
1. Glitch 伺服器是否正在運行（訪問您的 glitch.me 網址）
2. GitHub OAuth App 的回呼網址是否正確
3. Client ID 和 Secret 是否正確填入 Glitch 的 .env 檔案

## 📞 聯絡支援

如果仍有問題，請提供：
- 您的 Glitch 專案網址
- GitHub OAuth App 的 Client ID（不要提供 Secret）
- 錯誤訊息截圖