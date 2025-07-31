# 故障排除和常見問題解答

## 概述

本文件提供衛教文章發布系統常見問題的診斷和解決方案，幫助使用者快速解決遇到的技術問題。

## 目錄

1. [登入和認證問題](#登入和認證問題)
2. [內容編輯問題](#內容編輯問題)
3. [檔案上傳問題](#檔案上傳問題)
4. [審核流程問題](#審核流程問題)
5. [發布和部署問題](#發布和部署問題)
6. [效能和載入問題](#效能和載入問題)
7. [瀏覽器相容性問題](#瀏覽器相容性問題)
8. [網路連線問題](#網路連線問題)
9. [系統錯誤診斷](#系統錯誤診斷)
10. [緊急情況處理](#緊急情況處理)

## 登入和認證問題

### 問題：無法登入 Decap CMS

**症狀：**
- 點擊登入按鈕沒有反應
- 出現「認證失敗」錯誤訊息
- 重導向到錯誤頁面

**可能原因：**
1. GitHub 帳號沒有專案存取權限
2. 瀏覽器阻擋彈出視窗
3. GitHub OAuth 應用程式設定錯誤
4. 網路連線問題

**解決方案：**

1. **檢查 GitHub 權限**
   ```bash
   # 管理者可以檢查使用者是否在協作者清單中
   gh api repos/your-org/health-education-platform/collaborators/USERNAME
   ```

2. **允許彈出視窗**
   - Chrome：點擊網址列右側的彈出視窗圖示
   - Firefox：點擊網址列左側的盾牌圖示
   - Safari：偏好設定 → 網站 → 彈出式視窗

3. **清除瀏覽器資料**
   ```
   1. 按 Ctrl+Shift+Delete (Windows) 或 Cmd+Shift+Delete (Mac)
   2. 選擇「Cookie 和其他網站資料」
   3. 選擇「快取的圖片和檔案」
   4. 點擊「清除資料」
   ```

4. **檢查網路連線**
   - 確認可以存取 https://github.com
   - 檢查公司防火牆設定
   - 嘗試使用不同網路連線

### 問題：登入後立即被登出

**症狀：**
- 成功登入但幾秒後又回到登入頁面
- 出現「會話已過期」訊息

**可能原因：**
1. 瀏覽器不支援第三方 Cookie
2. 時間同步問題
3. 會話設定錯誤

**解決方案：**

1. **啟用第三方 Cookie**
   - Chrome：設定 → 隱私權和安全性 → Cookie 和其他網站資料 → 允許所有 Cookie
   - Firefox：設定 → 隱私權與安全性 → 標準

2. **同步系統時間**
   ```bash
   # Windows
   w32tm /resync
   
   # macOS
   sudo sntp -sS time.apple.com
   
   # Linux
   sudo ntpdate -s time.nist.gov
   ```

3. **使用無痕模式測試**
   - 開啟無痕/私人瀏覽視窗
   - 嘗試登入系統
   - 如果成功，問題可能是瀏覽器擴充功能或快取

### 問題：GitHub 雙因子認證問題

**症狀：**
- 輸入密碼後要求 2FA 代碼
- 2FA 代碼無效或過期

**解決方案：**

1. **使用 GitHub Personal Access Token**
   ```
   1. 前往 GitHub Settings → Developer settings → Personal access tokens
   2. 點擊 "Generate new token (classic)"
   3. 選擇適當的權限範圍
   4. 複製 token 並妥善保存
   5. 在登入時使用 token 代替密碼
   ```

2. **檢查時間同步**
   - 確保手機和電腦時間一致
   - 2FA 代碼有時間限制（通常 30 秒）

3. **使用備用代碼**
   - 如果有設定備用代碼，可以使用其中一個
   - 每個備用代碼只能使用一次

## 內容編輯問題

### 問題：編輯器載入緩慢或無法載入

**症狀：**
- 編輯器一直顯示載入中
- 編輯器介面不完整
- 無法輸入文字

**解決方案：**

1. **檢查瀏覽器控制台**
   ```
   1. 按 F12 開啟開發者工具
   2. 點擊 Console 分頁
   3. 查看是否有錯誤訊息
   4. 截圖錯誤訊息並回報
   ```

2. **禁用瀏覽器擴充功能**
   ```
   1. 開啟無痕模式測試
   2. 如果正常，逐一禁用擴充功能
   3. 找出衝突的擴充功能
   ```

3. **更新瀏覽器**
   - 確保使用最新版本的瀏覽器
   - 支援的瀏覽器版本：
     - Chrome 90+
     - Firefox 88+
     - Safari 14+
     - Edge 90+

### 問題：內容無法儲存

**症狀：**
- 點擊儲存按鈕沒有反應
- 出現「儲存失敗」錯誤
- 內容遺失

**解決方案：**

1. **檢查網路連線**
   ```javascript
   // 在瀏覽器控制台執行
   navigator.onLine ? console.log('線上') : console.log('離線');
   ```

2. **檢查內容大小**
   - 單篇文章建議不超過 50,000 字元
   - 圖片總大小不超過 10MB
   - 分段儲存大型內容

3. **使用本地備份**
   ```javascript
   // 手動備份內容到本地儲存
   localStorage.setItem('backup-content', document.querySelector('#content-editor').value);
   
   // 恢復備份內容
   const backup = localStorage.getItem('backup-content');
   if (backup) {
     document.querySelector('#content-editor').value = backup;
   }
   ```

### 問題：格式化功能異常

**症狀：**
- 粗體、斜體等格式無效
- 清單格式錯亂
- 連結無法建立

**解決方案：**

1. **使用 Markdown 語法**
   ```markdown
   # 標題 1
   ## 標題 2
   
   **粗體文字**
   *斜體文字*
   
   - 無序清單項目 1
   - 無序清單項目 2
   
   1. 有序清單項目 1
   2. 有序清單項目 2
   
   [連結文字](https://example.com)
   
   ![圖片替代文字](image-url.jpg)
   ```

2. **重新整理編輯器**
   - 按 Ctrl+F5 強制重新整理
   - 清除瀏覽器快取
   - 重新開啟編輯頁面

3. **切換編輯模式**
   - 在視覺編輯器和原始碼編輯器之間切換
   - 檢查 HTML 原始碼是否正確

## 檔案上傳問題

### 問題：圖片上傳失敗

**症狀：**
- 上傳進度條卡住
- 出現「上傳失敗」錯誤
- 圖片無法顯示

**解決方案：**

1. **檢查檔案格式和大小**
   ```
   支援的格式：JPG, PNG, WebP, SVG
   最大檔案大小：5MB
   建議解析度：1200px 寬度以內
   ```

2. **壓縮圖片**
   ```bash
   # 使用 ImageMagick 壓縮圖片
   convert input.jpg -quality 85 -resize 1200x output.jpg
   
   # 使用線上工具
   # TinyPNG: https://tinypng.com/
   # Squoosh: https://squoosh.app/
   ```

3. **檢查檔案名稱**
   - 避免使用中文檔名
   - 避免特殊字元（空格、符號等）
   - 建議使用英文和數字，用連字號分隔

### 問題：PDF 檔案無法上傳

**症狀：**
- PDF 檔案被拒絕
- 上傳後無法開啟

**解決方案：**

1. **檢查 PDF 設定**
   ```
   最大檔案大小：10MB
   確保 PDF 沒有密碼保護
   確保 PDF 不是掃描檔（建議使用 OCR 處理）
   ```

2. **優化 PDF 檔案**
   ```bash
   # 使用 Ghostscript 壓縮 PDF
   gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile=output.pdf input.pdf
   ```

3. **轉換為圖片**
   - 如果 PDF 主要是圖片內容
   - 可以轉換為 PNG 或 JPG 格式
   - 使用 PDF 轉圖片工具

## 審核流程問題

### 問題：審核者沒有收到通知

**症狀：**
- 文章已提交審核但審核者未收到通知
- GitHub PR 沒有自動建立
- 審核者清單為空

**解決方案：**

1. **檢查 GitHub 通知設定**
   ```
   1. 前往 GitHub Settings → Notifications
   2. 確保 "Email" 已啟用
   3. 檢查 "Participating" 和 "Watching" 設定
   4. 確認 Email 地址正確
   ```

2. **檢查專案權限**
   ```bash
   # 檢查使用者是否在 CODEOWNERS 檔案中
   cat .github/CODEOWNERS
   
   # 檢查使用者是否在相關團隊中
   gh api orgs/your-org/teams/cardiology-reviewers/members
   ```

3. **手動觸發通知**
   ```bash
   # 管理者可以手動分配審核者
   gh pr edit PR_NUMBER --add-reviewer @username
   ```

### 問題：無法在 GitHub 上查看 PR

**症狀：**
- PR 清單中找不到相關 PR
- PR 連結無效
- 權限不足錯誤

**解決方案：**

1. **檢查 PR 狀態**
   ```bash
   # 列出所有 PR
   gh pr list --state all
   
   # 搜尋特定 PR
   gh pr list --search "心房顫動"
   ```

2. **檢查分支權限**
   - 確認有 repository 的讀取權限
   - 檢查分支保護規則設定
   - 確認不在 IP 限制清單中

3. **使用正確的 URL**
   ```
   正確格式：https://github.com/your-org/health-education-platform/pull/123
   檢查組織名稱和儲存庫名稱是否正確
   ```

### 問題：審核意見無法提交

**症狀：**
- 審核表單無法提交
- 評論無法儲存
- 審核狀態無法更改

**解決方案：**

1. **檢查必填欄位**
   - 確保所有必填的審核項目已完成
   - 檢查評論內容是否符合最小長度要求
   - 確認已選擇審核結果（批准/要求修改/評論）

2. **檢查權限**
   ```bash
   # 檢查是否有審核權限
   gh api repos/your-org/health-education-platform/collaborators/USERNAME/permission
   ```

3. **重新整理頁面**
   - 儲存草稿後重新整理頁面
   - 檢查網路連線狀態
   - 嘗試使用不同瀏覽器

## 發布和部署問題

### 問題：文章發布後沒有出現在網站上

**症狀：**
- PR 已合併但網站沒有更新
- 新文章在文章列表中找不到
- 404 錯誤頁面

**解決方案：**

1. **檢查部署狀態**
   ```bash
   # 檢查 GitHub Actions 工作流程
   gh run list --workflow="Deploy to Production"
   
   # 查看最新部署的詳細資訊
   gh run view --log
   ```

2. **檢查 Cloudflare Pages 部署**
   ```
   1. 登入 Cloudflare Dashboard
   2. 前往 Pages 專案
   3. 檢查最新部署狀態
   4. 查看建置日誌
   ```

3. **手動觸發部署**
   ```bash
   # 觸發重新部署
   gh workflow run "Deploy to Production"
   ```

4. **檢查內容格式**
   ```yaml
   # 確保 frontmatter 格式正確
   ---
   title:
     zh_TW: "文章標題"
     en: "Article Title"
   status: "published"
   specialty: "cardiology"
   publishedAt: "2025-01-30"
   ---
   ```

### 問題：網站顯示舊版本內容

**症狀：**
- 修改後的內容沒有更新
- 顯示快取的舊版本
- 圖片沒有更新

**解決方案：**

1. **清除瀏覽器快取**
   ```
   強制重新整理：Ctrl+F5 (Windows) 或 Cmd+Shift+R (Mac)
   ```

2. **清除 CDN 快取**
   ```bash
   # 使用 Cloudflare API 清除快取
   curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}'
   ```

3. **檢查快取設定**
   - 檢查 Cloudflare 快取規則
   - 確認 Cache-Control 標頭設定
   - 檢查瀏覽器快取政策

### 問題：部署失敗

**症狀：**
- GitHub Actions 工作流程失敗
- 建置錯誤訊息
- 部署超時

**解決方案：**

1. **查看錯誤日誌**
   ```bash
   # 查看失敗的工作流程詳情
   gh run view RUN_ID --log-failed
   ```

2. **常見建置錯誤修復**
   ```bash
   # Node.js 版本問題
   # 在 .github/workflows/deploy.yml 中指定版本
   - uses: actions/setup-node@v4
     with:
       node-version: '18'
   
   # 依賴套件問題
   npm ci --legacy-peer-deps
   
   # 記憶體不足問題
   NODE_OPTIONS="--max-old-space-size=4096" npm run build
   ```

3. **檢查環境變數**
   ```yaml
   # 確保所有必要的環境變數都已設定
   env:
     GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
     CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
   ```

## 效能和載入問題

### 問題：頁面載入緩慢

**症狀：**
- 頁面載入時間超過 5 秒
- 圖片載入緩慢
- 互動延遲

**診斷工具：**

1. **使用瀏覽器開發者工具**
   ```
   1. 按 F12 開啟開發者工具
   2. 點擊 Network 分頁
   3. 重新整理頁面
   4. 查看載入時間和檔案大小
   ```

2. **使用 Lighthouse 分析**
   ```
   1. 在開發者工具中點擊 Lighthouse 分頁
   2. 選擇 Performance 類別
   3. 點擊 Generate report
   4. 查看建議改善項目
   ```

**解決方案：**

1. **優化圖片**
   ```bash
   # 使用 WebP 格式
   cwebp input.jpg -q 80 -o output.webp
   
   # 生成響應式圖片
   convert input.jpg -resize 800x output-800.jpg
   convert input.jpg -resize 400x output-400.jpg
   ```

2. **啟用快取**
   ```javascript
   // 在 astro.config.mjs 中設定快取
   export default defineConfig({
     vite: {
       build: {
         rollupOptions: {
           output: {
             manualChunks: {
               vendor: ['react', 'react-dom'],
               utils: ['lodash', 'date-fns']
             }
           }
         }
       }
     }
   });
   ```

3. **使用 CDN**
   - 確保靜態資源通過 CDN 提供
   - 檢查 Cloudflare 設定
   - 啟用自動最小化

### 問題：記憶體使用過高

**症狀：**
- 瀏覽器變慢或當機
- 系統記憶體不足警告
- 頁面無回應

**解決方案：**

1. **關閉不必要的分頁**
   - 只保留必要的瀏覽器分頁
   - 使用書籤管理常用頁面
   - 定期重啟瀏覽器

2. **清除瀏覽器資料**
   ```
   1. 清除瀏覽歷史
   2. 清除下載記錄
   3. 清除快取和 Cookie
   4. 清除自動填入資料
   ```

3. **檢查瀏覽器擴充功能**
   - 禁用不必要的擴充功能
   - 更新擴充功能到最新版本
   - 檢查擴充功能的記憶體使用量

## 瀏覽器相容性問題

### 支援的瀏覽器版本

| 瀏覽器 | 最低版本 | 建議版本 | 注意事項 |
|--------|----------|----------|----------|
| Chrome | 90 | 最新版 | 完全支援 |
| Firefox | 88 | 最新版 | 完全支援 |
| Safari | 14 | 最新版 | 部分功能限制 |
| Edge | 90 | 最新版 | 完全支援 |

### 問題：功能在某些瀏覽器中無法使用

**症狀：**
- 按鈕無法點擊
- 表單無法提交
- 樣式顯示異常

**解決方案：**

1. **更新瀏覽器**
   ```
   Chrome: 設定 → 關於 Chrome → 自動更新
   Firefox: 說明 → 關於 Firefox → 自動更新
   Safari: 系統偏好設定 → 軟體更新
   Edge: 設定 → 關於 Microsoft Edge → 自動更新
   ```

2. **啟用 JavaScript**
   ```
   Chrome: 設定 → 隱私權和安全性 → 網站設定 → JavaScript
   Firefox: about:config → javascript.enabled → true
   Safari: 偏好設定 → 安全性 → 啟用 JavaScript
   ```

3. **檢查瀏覽器設定**
   - 允許彈出視窗
   - 啟用 Cookie
   - 允許本地儲存
   - 禁用廣告攔截器（針對特定網站）

### 問題：行動裝置顯示異常

**症狀：**
- 版面配置錯亂
- 文字過小或過大
- 觸控操作無效

**解決方案：**

1. **檢查視窗設定**
   ```html
   <!-- 確保頁面包含正確的 viewport meta 標籤 -->
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   ```

2. **使用響應式設計**
   - 檢查 CSS 媒體查詢
   - 確保圖片可以縮放
   - 測試不同螢幕尺寸

3. **優化觸控體驗**
   - 確保按鈕大小適合觸控（最小 44px）
   - 增加點擊區域間距
   - 避免過小的連結

## 網路連線問題

### 問題：間歇性連線中斷

**症狀：**
- 載入時出現網路錯誤
- 操作中途失敗
- 自動登出

**診斷步驟：**

1. **檢查網路連線**
   ```bash
   # Windows
   ping google.com
   nslookup your-domain.com
   
   # macOS/Linux
   ping -c 4 google.com
   dig your-domain.com
   ```

2. **檢查 DNS 設定**
   ```bash
   # 使用公共 DNS
   # Google DNS: 8.8.8.8, 8.8.4.4
   # Cloudflare DNS: 1.1.1.1, 1.0.0.1
   ```

3. **測試不同網路**
   - 嘗試使用手機熱點
   - 連接不同的 Wi-Fi 網路
   - 使用有線網路連接

**解決方案：**

1. **重設網路設定**
   ```bash
   # Windows
   ipconfig /release
   ipconfig /renew
   ipconfig /flushdns
   
   # macOS
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder
   
   # Linux
   sudo systemctl restart NetworkManager
   ```

2. **檢查防火牆設定**
   - 確保允許 HTTPS (443) 連接
   - 檢查公司防火牆規則
   - 暫時禁用防毒軟體測試

3. **使用 VPN**
   - 如果地理位置限制
   - 繞過網路限制
   - 提高連線穩定性

### 問題：特定功能無法存取

**症狀：**
- GitHub 無法存取
- 圖片無法載入
- API 請求失敗

**解決方案：**

1. **檢查服務狀態**
   ```
   GitHub Status: https://www.githubstatus.com/
   Cloudflare Status: https://www.cloudflarestatus.com/
   ```

2. **使用替代 DNS**
   ```
   1. 開啟網路設定
   2. 修改 DNS 伺服器設定
   3. 使用 1.1.1.1 和 8.8.8.8
   4. 重新啟動網路連接
   ```

3. **檢查代理設定**
   - 確認瀏覽器代理設定
   - 檢查系統代理設定
   - 暫時禁用代理測試

## 系統錯誤診斷

### 常見錯誤代碼

| 錯誤代碼 | 說明 | 可能原因 | 解決方案 |
|----------|------|----------|----------|
| 400 | 錯誤請求 | 資料格式錯誤 | 檢查輸入資料 |
| 401 | 未授權 | 認證失敗 | 重新登入 |
| 403 | 禁止存取 | 權限不足 | 聯繫管理者 |
| 404 | 找不到頁面 | 連結錯誤 | 檢查 URL |
| 429 | 請求過多 | 超過速率限制 | 稍後再試 |
| 500 | 伺服器錯誤 | 系統問題 | 聯繫技術支援 |

### 錯誤日誌收集

1. **瀏覽器控制台錯誤**
   ```javascript
   // 在控制台執行以下代碼收集錯誤資訊
   console.log('User Agent:', navigator.userAgent);
   console.log('URL:', window.location.href);
   console.log('Timestamp:', new Date().toISOString());
   
   // 複製所有錯誤訊息
   copy(console.log);
   ```

2. **網路請求錯誤**
   ```
   1. 開啟開發者工具 Network 分頁
   2. 重現問題
   3. 找到失敗的請求（紅色標示）
   4. 右鍵點擊 → Copy → Copy as cURL
   5. 將資訊提供給技術支援
   ```

3. **系統資訊收集**
   ```javascript
   // 收集系統資訊
   const systemInfo = {
     userAgent: navigator.userAgent,
     language: navigator.language,
     platform: navigator.platform,
     cookieEnabled: navigator.cookieEnabled,
     onLine: navigator.onLine,
     screenResolution: `${screen.width}x${screen.height}`,
     windowSize: `${window.innerWidth}x${window.innerHeight}`,
     timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
     timestamp: new Date().toISOString()
   };
   
   console.log(JSON.stringify(systemInfo, null, 2));
   ```

## 緊急情況處理

### 系統完全無法存取

**立即行動：**

1. **檢查服務狀態**
   - 前往 https://status.your-domain.com
   - 檢查 GitHub Status 和 Cloudflare Status
   - 查看官方社群媒體公告

2. **聯繫技術支援**
   ```
   緊急熱線：+886-2-xxxx-xxxx
   Email：emergency@your-org.com
   
   提供資訊：
   - 錯誤發生時間
   - 錯誤訊息截圖
   - 受影響的功能
   - 使用者數量估計
   ```

3. **啟用備用方案**
   - 使用離線編輯工具
   - 準備內容備份
   - 通知相關人員

### 資料遺失或損壞

**立即行動：**

1. **停止所有操作**
   - 不要嘗試修復或重新儲存
   - 保持現狀等待技術支援
   - 記錄所有操作步驟

2. **聯繫管理者**
   ```
   提供資訊：
   - 遺失資料的詳細描述
   - 最後正常操作的時間
   - 可能的原因分析
   - 影響範圍評估
   ```

3. **啟動資料恢復程序**
   - 管理者將從備份恢復資料
   - 可能需要重新輸入部分內容
   - 等待恢復完成通知

### 安全事件

**發現可疑活動時：**

1. **立即報告**
   ```
   安全事件熱線：security-incident@your-org.com
   
   報告內容：
   - 發現時間和地點
   - 可疑活動描述
   - 可能的影響範圍
   - 已採取的行動
   ```

2. **保護帳號**
   - 立即更改密碼
   - 啟用雙因子認證
   - 檢查最近的登入記錄
   - 登出所有裝置

3. **配合調查**
   - 保留相關證據
   - 配合安全團隊調查
   - 不要自行處理可疑檔案

## 聯繫支援

### 技術支援管道

**一般問題：**
- Email：support@your-org.com
- 工作時間：週一至週五 9:00-18:00
- 回應時間：24 小時內

**緊急問題：**
- 熱線：+886-2-xxxx-xxxx
- 24 小時服務
- 立即回應

**線上資源：**
- 文件中心：https://docs.your-org.com
- 常見問題：https://faq.your-org.com
- 社群論壇：https://community.your-org.com

### 提交問題時請提供

1. **基本資訊**
   - 使用者帳號
   - 發生時間
   - 使用的瀏覽器和版本
   - 作業系統

2. **問題描述**
   - 詳細的問題描述
   - 重現步驟
   - 預期結果 vs 實際結果
   - 錯誤訊息截圖

3. **系統資訊**
   - 瀏覽器控制台錯誤
   - 網路連線狀態
   - 相關的系統設定

### 問題優先級

| 優先級 | 描述 | 回應時間 | 解決時間 |
|--------|------|----------|----------|
| 緊急 | 系統完全無法使用 | 立即 | 4 小時內 |
| 高 | 核心功能無法使用 | 2 小時內 | 24 小時內 |
| 中 | 部分功能異常 | 24 小時內 | 72 小時內 |
| 低 | 小問題或改善建議 | 72 小時內 | 1 週內 |

---

**文件版本**：v1.0.0 | **最後更新**：2025年1月 | **適用系統版本**：v1.0.0+