# 生產環境上線指南

## 概述

本指南提供醫療衛教內容管理系統正式上線的完整流程，包括上線前檢查、部署步驟、驗證程序和上線後監控。

## 上線前準備

### 1. 環境變數設定

確保以下環境變數已在 GitHub Secrets 中正確設定：

```bash
# Cloudflare 配置
CLOUDFLARE_API_TOKEN=your_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here

# 網站配置
SITE_URL=https://ent-clinic-pro.pages.dev

# 監控配置（可選）
ALERT_EMAIL=admin@example.com
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 2. 分支保護規則

在 GitHub 儲存庫設定中配置以下分支保護規則：

- **保護分支**: `main`
- **需要 PR 審核**: ✅ 啟用
- **需要狀態檢查**: ✅ 啟用
- **需要分支為最新**: ✅ 啟用
- **管理員也需遵守規則**: ✅ 啟用

### 3. 團隊權限設定

確保團隊成員具有適當的權限：

| 角色 | GitHub 權限 | CMS 權限 | 說明 |
|------|-------------|----------|------|
| 管理員 | Admin | 完整權限 | 系統管理和配置 |
| 審核者 | Write | 審核權限 | 內容審核和批准 |
| 編輯者 | Write | 編輯權限 | 內容建立和編輯 |
| 檢視者 | Read | 檢視權限 | 內容檢視和回饋 |

### 4. 內容準備

- [ ] 現有內容已轉換為新格式
- [ ] 專科分類和審核者已設定
- [ ] 內容模板已建立
- [ ] 測試資料已準備

## 上線流程

### 步驟 1: 執行上線前檢查

```bash
# 執行生產環境設定檢查
node scripts/production-setup.js

# 檢查項目包括：
# - 環境變數設定
# - Cloudflare 配置
# - CMS 配置
# - 內容結構
# - Git 狀態
```

### 步驟 2: 執行最終建置和測試

```bash
# 清理並重新安裝依賴
npm ci

# 執行所有測試
npm test

# 執行品質檢查
node scripts/quality-check-runner.js

# 建置生產版本
npm run build
```

### 步驟 3: 部署到生產環境

```bash
# 使用自動化上線腳本
node scripts/production-launch.js

# 或手動部署
npx wrangler pages deploy dist --project-name=astro-clinical-platform --branch=main
```

### 步驟 4: 驗證部署

```bash
# 執行自動化驗證
node scripts/uat-automated-tests.js

# 手動檢查項目：
# - 網站首頁可正常訪問
# - CMS 管理介面可正常載入
# - 健康檢查端點回應正常
# - 搜尋功能運作正常
# - 多語言切換正常
```

### 步驟 5: 啟動監控系統

```bash
# 啟動持續監控
node scripts/post-launch-monitoring.js monitor

# 或執行單次檢查
node scripts/post-launch-monitoring.js check
```

## 上線後檢查清單

### 立即檢查（上線後 1 小時內）

- [ ] 網站首頁載入正常
- [ ] CMS 管理介面可訪問
- [ ] 使用者可以正常登入 CMS
- [ ] 文章列表顯示正確
- [ ] 搜尋功能運作正常
- [ ] 圖片載入正常
- [ ] 多語言切換正常
- [ ] 健康檢查端點回應正常
- [ ] 監控系統運作正常

### 短期檢查（上線後 24 小時內）

- [ ] 系統穩定性良好
- [ ] 無重大錯誤報告
- [ ] 效能指標符合預期
- [ ] 使用者回饋收集正常
- [ ] 自動化檢查通過
- [ ] 備份機制運作正常

### 中期檢查（上線後 1 週內）

- [ ] 使用者適應情況良好
- [ ] 工作流程運作順暢
- [ ] 內容發布流程正常
- [ ] 審核機制有效運作
- [ ] 效能保持穩定
- [ ] 無安全問題報告

## 監控和維護

### 日常監控

```bash
# 每日執行監控檢查
node scripts/post-launch-monitoring.js check

# 生成每日報告
node scripts/post-launch-monitoring.js report
```

### 週期性任務

| 頻率 | 任務 | 負責人 |
|------|------|--------|
| 每日 | 系統健康檢查 | 技術團隊 |
| 每日 | 使用者回饋檢視 | 產品團隊 |
| 每週 | 效能指標分析 | 技術團隊 |
| 每週 | 內容品質審核 | 內容團隊 |
| 每月 | 安全性檢查 | 安全團隊 |
| 每月 | 使用者滿意度調查 | 產品團隊 |

### 警報設定

系統會在以下情況發送警報：

- 網站無法訪問（立即）
- 回應時間超過 5 秒（5 分鐘內）
- 錯誤率超過 5%（10 分鐘內）
- CMS 無法訪問（立即）
- 健康檢查失敗（3 次連續失敗）

## 故障處理

### 緊急回復程序

1. **識別問題範圍**
   - 檢查監控儀表板
   - 確認影響範圍
   - 評估嚴重程度

2. **立即回應**
   - 通知相關團隊
   - 啟動應急程序
   - 記錄問題詳情

3. **回復操作**
   ```bash
   # 回復到上一個穩定版本
   git revert HEAD
   git push origin main
   
   # 或使用 Cloudflare Pages 回復功能
   npx wrangler pages deployment list
   npx wrangler pages deployment activate <DEPLOYMENT_ID>
   ```

4. **問題修復**
   - 分析根本原因
   - 開發修復方案
   - 測試修復效果
   - 重新部署

5. **事後檢討**
   - 記錄事件詳情
   - 分析改善機會
   - 更新應急程序
   - 加強監控機制

### 常見問題處理

#### 網站無法訪問

```bash
# 檢查 Cloudflare Pages 狀態
npx wrangler pages deployment list

# 檢查 DNS 設定
nslookup ent-clinic-pro.pages.dev

# 檢查 SSL 憑證
curl -I https://ent-clinic-pro.pages.dev
```

#### CMS 無法登入

```bash
# 檢查 GitHub OAuth 設定
# 確認 callback URL 正確
# 檢查 OAuth App 權限

# 檢查 CMS 配置
cat public/admin/config.yml
```

#### 效能問題

```bash
# 分析效能指標
node scripts/post-launch-monitoring.js check

# 檢查 Lighthouse 分數
npx lighthouse https://ent-clinic-pro.pages.dev

# 分析 Core Web Vitals
# 使用 Chrome DevTools 或 PageSpeed Insights
```

## 聯絡資訊

### 緊急聯絡

- **技術負責人**: dev-team@example.com
- **產品負責人**: product-team@example.com
- **系統管理員**: admin@example.com

### 支援資源

- **技術文件**: `/docs`
- **使用者手冊**: `/docs/user-guide`
- **故障排除**: `/docs/troubleshooting`
- **API 文件**: `/docs/api`

### 外部服務

- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **GitHub Repository**: https://github.com/your-org/astro-clinical-platform
- **監控儀表板**: https://ent-clinic-pro.pages.dev/admin/performance-analytics

## 持續改善

### 回饋收集

- 使用者回饋表單
- 定期滿意度調查
- 技術指標分析
- 業務指標追蹤

### 改善計畫

參考 `IMPROVEMENT_PLAN.md` 了解：

- 短期改善目標
- 中期功能規劃
- 長期架構升級
- 監控指標設定

### 版本更新

- 遵循語義化版本控制
- 維護更新日誌
- 執行回歸測試
- 漸進式部署

---

**文件版本**: 1.0.0  
**最後更新**: ${new Date().toLocaleDateString('zh-TW')}  
**維護者**: 技術團隊