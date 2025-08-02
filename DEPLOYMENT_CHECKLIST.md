# 部署檢查清單

## 📋 部署前檢查

### 🔧 程式碼準備
- [ ] 所有變更已提交到 Git
- [ ] 程式碼已推送到 GitHub master 分支
- [ ] 沒有未解決的 merge conflicts
- [ ] 版本號已更新 (如適用)

### ⚙️ 配置檢查
- [ ] `astro.config.mjs` 配置正確
  - [ ] `output: 'static'` 設定
  - [ ] `site` URL 正確
  - [ ] 多語言配置完整
- [ ] `package.json` 建置腳本正確
- [ ] 所有依賴項已安裝且版本相容

### 🛣️ 路由檢查
- [ ] 所有動態路由都有 `getStaticPaths` 函數
  - [ ] `[calculator].astro` ✓
  - [ ] `[calculator]-simple.astro` ✓
  - [ ] `[specialty].astro` ✓
  - [ ] `[slug].astro` ✓
  - [ ] `[category].astro` ✓
  - [ ] `[tree].astro` ✓
- [ ] 靜態路由檔案存在且正確

### 🧪 本地測試
- [ ] `npm run build` 成功執行
- [ ] 建置輸出無錯誤或警告
- [ ] `npm run preview` 本地預覽正常
- [ ] 所有主要功能測試通過
  - [ ] 首頁載入
  - [ ] 醫療工具計算
  - [ ] 決策樹互動
  - [ ] 多語言切換
  - [ ] 搜尋功能

## 🚀 Cloudflare Pages 設定

### 📊 專案配置
- [ ] 專案名稱: `ent-clinic-pro`
- [ ] Git 儲存庫連接正確
- [ ] 分支設定: `master`
- [ ] 根目錄: `astro-clinical-platform`
- [ ] 建置命令: `npm run build`
- [ ] 建置輸出目錄: `/dist`

### 🌍 環境設定
- [ ] Node.js 版本: 18.x 或更高
- [ ] 建置超時: 300 秒 (5 分鐘)
- [ ] 環境變數 (如需要)

### 🔒 安全設定
- [ ] 自訂標頭配置 (可選)
- [ ] 存取控制設定 (如需要)
- [ ] SSL/TLS 憑證自動配置

## ✅ 部署後驗證

### 🌐 網站功能測試
- [ ] 主網址可存取: `https://ent-clinic-pro.pages.dev`
- [ ] 首頁正常載入
- [ ] 所有主要頁面可存取
  - [ ] `/tools/` - 醫療工具
  - [ ] `/education/` - 教育內容
  - [ ] `/specialties/` - 專科頁面
  - [ ] `/decision-trees/` - 決策樹

### 🔧 功能驗證
- [ ] 醫療計算器正常運作
  - [ ] BMI 計算器
  - [ ] eGFR 計算器
  - [ ] CHA2DS2-VASc 評分
- [ ] 決策樹互動功能
- [ ] 搜尋功能運作
- [ ] 多語言切換正常

### 📱 相容性測試
- [ ] 桌面瀏覽器 (Chrome, Firefox, Safari, Edge)
- [ ] 行動裝置瀏覽器
- [ ] 平板裝置顯示
- [ ] 不同螢幕解析度

### ⚡ 效能檢查
- [ ] 頁面載入速度 < 3 秒
- [ ] Lighthouse 分數 > 90
- [ ] 圖片正確載入
- [ ] JavaScript 功能正常

## 🔍 SEO 和可存取性

### 🎯 SEO 檢查
- [ ] 所有頁面有適當的 `<title>`
- [ ] Meta 描述完整
- [ ] 結構化資料正確
- [ ] Sitemap 生成並可存取
- [ ] Robots.txt 配置正確

### ♿ 可存取性檢查
- [ ] 鍵盤導航正常
- [ ] 螢幕閱讀器相容
- [ ] 色彩對比度符合標準
- [ ] Alt 文字完整

## 📊 監控設定

### 📈 分析工具
- [ ] Google Analytics (如已設定)
- [ ] Cloudflare Analytics 啟用
- [ ] 錯誤監控設定

### 🚨 警報設定
- [ ] 網站下線警報
- [ ] 效能警報
- [ ] 錯誤率警報

## 📝 文檔更新

### 📚 專案文檔
- [ ] README.md 更新
- [ ] DEPLOYMENT.md 完整
- [ ] CHANGELOG.md 記錄變更
- [ ] API 文檔 (如適用)

### 🔄 版本控制
- [ ] Git tag 建立 (如適用)
- [ ] Release notes 撰寫
- [ ] 部署記錄更新

## 🎉 部署完成確認

### ✅ 最終檢查
- [ ] 所有檢查項目完成
- [ ] 網站完全正常運作
- [ ] 團隊成員已通知
- [ ] 使用者可正常存取

### 📞 後續行動
- [ ] 監控部署後 24 小時
- [ ] 收集使用者回饋
- [ ] 記錄任何問題
- [ ] 規劃下次更新

---

## 🚨 緊急回滾程序

如果部署後發現重大問題：

1. **立即回滾**
   ```bash
   # 在 Cloudflare Pages 控制台
   # 選擇上一個成功的部署版本
   # 點擊 "Rollback to this deployment"
   ```

2. **問題修復**
   ```bash
   # 本地修復問題
   git checkout master
   # 修復程式碼
   git add .
   git commit -m "hotfix: 修復部署問題"
   git push origin master
   ```

3. **重新部署**
   - Cloudflare Pages 會自動觸發新的部署
   - 監控新部署的狀態
   - 重新執行驗證檢查

---

**部署負責人**: _______________  
**部署日期**: _______________  
**部署版本**: _______________  
**檢查完成**: _______________  

*使用此檢查清單確保每次部署都順利且完整*