# 專案結構統一重構需求文件

## 簡介

當前專案存在結構混亂問題：
- Git 儲存庫根目錄是外層的 `ent-pro`
- Astro 專案根目錄是內層的 `astro-clinical-platform`
- Decap CMS 遵從 Git 根目錄，將文章存放在 `ent-pro/src/content/education/`
- Astro 建置流程在 `astro-clinical-platform` 內運作，只會從 `astro-clinical-platform/src/content/education/` 讀取文章

這導致 CMS 新增的文章無法被 Astro 正確讀取。需要統一 Git 儲存庫根目錄和 Astro 專案根目錄。

## 需求

### 需求 1：專案備份與安全準備

**使用者故事：** 作為開發者，我需要在重構前建立完整備份，以確保資料安全和可回滾性。

#### 驗收標準

1. WHEN 開始重構前 THEN 開發者 SHALL 將整個 ent-pro 資料夾複製到其他位置作為備份
2. WHEN 備份完成 THEN 系統 SHALL 確認備份資料夾包含所有原始檔案
3. WHEN 需要回滾 THEN 開發者 SHALL 能夠從備份完全恢復原始狀態

### 需求 2：檔案結構合併重組

**使用者故事：** 作為開發者，我需要將 astro-clinical-platform 內的所有檔案移動到 ent-pro 根目錄，統一專案結構。

#### 驗收標準

1. WHEN 進入 astro-clinical-platform 資料夾 THEN 開發者 SHALL 全選所有檔案和資料夾（Ctrl+A）
2. WHEN 剪下檔案 THEN 開發者 SHALL 執行剪下操作（Ctrl+X）
3. WHEN 回到 ent-pro 根目錄 THEN 開發者 SHALL 執行貼上操作（Ctrl+V）
4. WHEN 遇到檔案衝突（如 package.json）THEN 系統 SHALL 選擇「取代目的地中的檔案」，以 astro-clinical-platform 內的檔案為準
5. WHEN 移動完成 THEN astro-clinical-platform 資料夾 SHALL 變成空資料夾並被安全刪除
6. WHEN 驗證結構 THEN ent-pro 根目錄 SHALL 直接包含 src/, public/, astro.config.mjs, package.json 等 Astro 專案檔案

### 需求 3：內容路徑統一整合

**使用者故事：** 作為內容編輯者，我需要 Decap CMS 和 Astro 使用相同的內容路徑，確保新文章能正確顯示。

#### 驗收標準

1. WHEN 重構完成後 THEN CMS 儲存的文章 SHALL 位於統一的 src/content/education/ 路徑
2. WHEN Astro 讀取文章 THEN Astro SHALL 從相同的 src/content/education/ 路徑讀取
3. WHEN 檢查現有文章 THEN 原本在 ent-pro/src/content/education/ 的文章 SHALL 與新結構中的文章合併
4. WHEN 測試 CMS 功能 THEN 新建立的文章 SHALL 立即在網站上可見

### 需求 4：Netlify 部署設定更新

**使用者故事：** 作為開發者，我需要更新 Netlify 部署設定以適應扁平化的專案結構。

#### 驗收標準

1. WHEN 訪問 Netlify Site configuration THEN 開發者 SHALL 進入 Build & deploy 設定頁面
2. WHEN 更新 Base directory THEN 開發者 SHALL 將 astro-clinical-platform 完全刪除，讓欄位留空
3. WHEN 保持其他設定 THEN Build command SHALL 維持 "npm run build"
4. WHEN 保持發布設定 THEN Publish directory SHALL 維持 "dist"
5. WHEN 儲存設定 THEN Netlify SHALL 接受新的部署配置

### 需求 5：版本控制提交與部署

**使用者故事：** 作為開發者，我需要將重構後的結構提交到版本控制並觸發自動部署。

#### 驗收標準

1. WHEN 在 ent-pro 根目錄執行 git add . THEN 系統 SHALL 添加所有變更檔案
2. WHEN 執行 git commit THEN 系統 SHALL 建立描述性提交訊息說明結構重構
3. WHEN 執行 git push THEN 系統 SHALL 推送變更到遠端儲存庫
4. WHEN 推送完成 THEN Netlify SHALL 自動觸發重新部署
5. WHEN 部署完成 THEN 網站 SHALL 使用新的專案結構正常運作

### 需求 6：功能完整性驗證

**使用者故事：** 作為使用者，我需要確認重構後所有功能正常運作，特別是 CMS 與網站的整合。

#### 驗收標準

1. WHEN 訪問網站首頁 THEN 頁面 SHALL 正常載入並顯示所有內容
2. WHEN 訪問教育內容頁面 THEN 現有文章 SHALL 正確顯示
3. WHEN 使用 Decap CMS 建立新文章 THEN 文章 SHALL 儲存到正確路徑
4. WHEN 發布新文章 THEN 文章 SHALL 立即在網站教育頁面顯示
5. WHEN 檢查 Netlify 建置日誌 THEN 部署過程 SHALL 無錯誤完成
6. WHEN 測試所有主要功能 THEN 計算機、流程圖等功能 SHALL 正常運作

## 風險評估

### 高風險項目
- 檔案移動過程中可能遺失資料
- Git 歷史記錄可能受到影響
- 部署設定錯誤可能導致網站無法訪問

### 緩解措施
- 完整備份專案
- 分階段執行重構
- 在每個階段進行驗證
- 保留回滾方案

## 成功標準

1. 專案結構統一：Git 根目錄 = Astro 專案根目錄
2. CMS 整合正常：新文章能在網站正確顯示
3. 部署流程正常：Netlify 自動部署成功
4. 功能完整性：所有現有功能正常運作