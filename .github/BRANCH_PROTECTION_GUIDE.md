# GitHub 分支保護和權限設定指南

本指南說明如何為衛教文章發布系統設定 GitHub 分支保護規則和團隊權限。

## 🔒 分支保護規則

### 自動設定

1. 前往 Actions 頁面
2. 選擇 "分支保護設定" 工作流程
3. 點擊 "Run workflow"
4. 選擇動作類型：
   - `setup`: 初次設定分支保護規則
   - `update`: 更新現有規則
   - `check`: 檢查當前設定狀態
5. 輸入目標分支名稱（通常是 `main`）
6. 執行工作流程

### 手動設定

如果自動設定失敗，可以手動設定：

1. 前往儲存庫 Settings > Branches
2. 點擊 "Add rule" 或編輯現有規則
3. 設定以下選項：

#### 基本設定
- **Branch name pattern**: `main`
- **Restrict pushes that create files**: ✅
- **Require a pull request before merging**: ✅
  - Required approving reviews: `2`
  - Dismiss stale reviews: ✅
  - Require review from code owners: ✅
  - Require approval of the most recent push: ✅

#### 狀態檢查
- **Require status checks to pass**: ✅
- **Require branches to be up to date**: ✅
- 必要的狀態檢查：
  - `格式驗證`
  - `內容品質檢查`
  - `SEO 和無障礙性檢查`
  - `專科驗證`
  - `狀態檢查`

#### 其他限制
- **Require conversation resolution**: ✅
- **Include administrators**: ❌ (允許管理員緊急合併)
- **Allow force pushes**: ❌
- **Allow deletions**: ❌

## 👥 團隊設定

### 必要團隊

需要建立以下 GitHub 團隊：

#### 管理團隊
- **admin-team**: 系統管理員
  - 權限: Admin
  - 成員: 系統管理員、技術負責人

- **dev-team**: 開發團隊
  - 權限: Maintain
  - 成員: 前端開發者、系統工程師

#### 內容團隊
- **medical-content-team**: 醫療內容團隊
  - 權限: Write
  - 成員: 醫療編輯、內容管理員

- **clinical-reviewers**: 臨床審核者
  - 權限: Write
  - 成員: 主治醫師、醫療顧問

- **cms-admin-team**: CMS 管理團隊
  - 權限: Write
  - 成員: CMS 管理員、內容編輯

#### 專科團隊
- **cardiology-team**: 心臟科團隊
  - 權限: Triage
  - 成員: 心臟科醫師

- **neurology-team**: 神經科團隊
  - 權限: Triage
  - 成員: 神經科醫師

- **pediatrics-team**: 小兒科團隊
  - 權限: Triage
  - 成員: 小兒科醫師

- **emergency-team**: 急診科團隊
  - 權限: Triage
  - 成員: 急診科醫師

- **orthopedics-team**: 骨科團隊
  - 權限: Triage
  - 成員: 骨科醫師

#### 語言團隊
- **zh-tw-reviewers**: 繁體中文審核者
  - 權限: Triage
  - 成員: 中文編輯、翻譯人員

- **en-reviewers**: 英文審核者
  - 權限: Triage
  - 成員: 英文編輯、翻譯人員

### 建立團隊步驟

1. 前往組織設定 > Teams
2. 點擊 "New team"
3. 輸入團隊名稱和描述
4. 設定團隊可見性（建議設為 Visible）
5. 添加團隊成員
6. 設定儲存庫權限：
   - 前往 Teams > [團隊名稱] > Repositories
   - 添加儲存庫並設定適當權限

## 🔧 CODEOWNERS 檔案

CODEOWNERS 檔案已自動建立在 `.github/CODEOWNERS`，定義了：

- 全域預設審核者
- 專科特定內容的審核者
- 系統檔案的審核者
- 多語言內容的審核者

### 更新 CODEOWNERS

如需修改審核者分配：

1. 編輯 `.github/CODEOWNERS` 檔案
2. 使用以下格式：
   ```
   # 註解
   路徑模式 @團隊名稱 @使用者名稱
   ```
3. 提交變更

## 📋 Pull Request 模板

已建立 PR 模板 (`.github/pull_request_template.md`)，包含：

- 基本資訊收集
- 內容品質檢查清單
- 審核者檢查清單
- 參考資料要求
- 測試確認項目

## 🚨 Issue 模板

已建立醫療內容審核 Issue 模板，用於：

- 回報醫療資訊錯誤
- 內容更新建議
- 語言和 SEO 改善
- 緊急醫療安全問題

## ✅ 驗證設定

### 測試分支保護

1. 建立測試分支
2. 修改一個衛教文章
3. 建立 Pull Request
4. 確認：
   - 自動分配審核者
   - 狀態檢查執行
   - 需要審核才能合併
   - 無法直接推送到 main

### 測試團隊權限

1. 使用不同團隊成員帳號
2. 嘗試：
   - 建立 Pull Request
   - 審核 Pull Request
   - 合併 Pull Request
3. 確認權限設定正確

## 🔄 維護

### 定期檢查

- 每月檢查團隊成員是否正確
- 每季檢查分支保護規則
- 根據需要更新 CODEOWNERS

### 更新流程

1. 使用 "分支保護設定" 工作流程檢查狀態
2. 根據需要手動調整設定
3. 測試變更是否正常運作
4. 更新相關文件

## 📞 支援

如遇到設定問題：

1. 檢查 Actions 執行日誌
2. 確認團隊和權限設定
3. 聯繫系統管理員
4. 參考 GitHub 官方文件

---

**注意**: 此設定確保所有衛教內容都經過適當的醫療專業審核，維護內容品質和醫療安全。