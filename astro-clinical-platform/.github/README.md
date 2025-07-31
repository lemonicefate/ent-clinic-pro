# 🏥 GitHub 工作流程和 PR 模板

本目錄包含醫療衛教平台的 GitHub 工作流程配置、PR 模板和自動化設定。

## 📋 目錄結構

```
.github/
├── workflows/                    # GitHub Actions 工作流程
│   ├── content-quality-check.yml # 內容品質檢查
│   ├── cms-deploy.yml            # CMS 部署工作流程
│   └── pr-labeler.yml           # PR 自動標籤
├── PULL_REQUEST_TEMPLATE/        # PR 模板
│   ├── new_article.md           # 新增文章模板
│   ├── content_update.md        # 內容更新模板
│   └── system_config.md         # 系統配置模板
├── ISSUE_TEMPLATE/               # Issue 模板
│   ├── content_request.yml      # 內容請求模板
│   └── content_error.yml        # 內容錯誤回報模板
├── pull_request_template.md     # 預設 PR 模板
├── CODEOWNERS                   # 程式碼擁有者設定
├── labeler.yml                  # 自動標籤配置
└── README.md                    # 本說明檔案
```

## 🚀 工作流程說明

### 1. 內容品質檢查 (content-quality-check.yml)

**觸發條件**:
- PR 涉及 `src/content/**/*.md` 檔案變更
- 推送到 main/master 分支
- 手動觸發

**檢查項目**:
- ✅ 基礎驗證 (Content Collections, Frontmatter)
- 🏥 醫療術語檢查
- ♿ 無障礙性驗證
- 📖 可讀性分析
- 📚 參考文獻檢查
- 📝 Markdown 語法檢查
- 🎯 綜合品質評估

**輸出**:
- 品質檢查報告 (JSON 格式)
- PR 評論摘要
- 自動標籤分類
- 審核者自動指派

### 2. CMS 部署工作流程 (cms-deploy.yml)

**功能**:
- 內容驗證和格式檢查
- 自動建置和部署到 Cloudflare Pages
- 部署結果通知

### 3. PR 自動標籤 (pr-labeler.yml)

**功能**:
- 根據變更檔案自動添加標籤
- 分析 PR 內容添加特殊標籤
- 自動指派相關審核者

## 📝 PR 模板使用指南

### 選擇適當的 PR 模板

1. **新增文章** (`new_article.md`)
   - 用於新增醫療衛教文章
   - 包含完整的醫療內容審核清單
   - 專科特定檢查項目

2. **內容更新** (`content_update.md`)
   - 用於更新現有文章內容
   - 包含變更影響評估
   - 版本控制和風險評估

3. **系統配置** (`system_config.md`)
   - 用於 CMS 配置、模板或系統設定變更
   - 包含安全性和效能評估
   - 部署和回滾計畫

### 如何使用 PR 模板

1. **建立 PR 時選擇模板**:
   ```
   https://github.com/your-org/repo/compare/main...your-branch?template=new_article.md
   ```

2. **或在 PR 描述中手動選擇**:
   - 點擊 "Preview" 標籤旁的模板選擇器
   - 選擇適合的模板

3. **填寫完整資訊**:
   - 所有必填項目都需要完成
   - 勾選相關的檢查清單
   - 提供詳細的變更說明

## 👥 審核者自動指派

### CODEOWNERS 設定

系統會根據變更的檔案自動指派審核者：

- **醫療內容**: `@medical-advisors` `@content-team`
- **專科內容**: 對應的專科審核者
- **系統配置**: `@tech-team` `@content-manager`
- **品質工具**: `@tech-team` `@medical-advisors`

### 專科審核者對應

| 專科 | 審核者 | 觸發條件 |
|------|--------|----------|
| 心臟科 | `@cardiology-reviewer` | 檔案包含 cardiology, heart, cardiac |
| 神經科 | `@neurology-reviewer` | 檔案包含 neurology, brain, stroke |
| 小兒科 | `@pediatrics-reviewer` | 檔案包含 pediatrics, child, infant |
| 急診科 | `@emergency-reviewer` | 檔案包含 emergency, urgent, first-aid |
| 骨科 | `@orthopedics-reviewer` | 檔案包含 orthopedics, bone, joint |

### 特殊審核要求

- **藥物相關**: `@pharmacist-reviewer`
- **手術相關**: `@surgeon-reviewer`
- **營養相關**: `@nutritionist-reviewer`
- **復健相關**: `@physiotherapist-reviewer`
- **護理相關**: `@nurse-reviewer`

## 🏷️ 自動標籤系統

### 內容類型標籤

- `content` - 所有內容變更
- `medical-content` - 醫療衛教內容
- `cardiology`, `neurology`, `pediatrics` 等 - 專科分類
- `medication`, `surgery`, `prevention` 等 - 內容類型

### 系統標籤

- `cms-config` - CMS 配置變更
- `content-schema` - Content Collections 變更
- `quality-tools` - 品質檢查工具變更
- `github-actions` - 工作流程變更

### 品質標籤

- `quality-excellent` (90-100分)
- `quality-good` (75-89分)
- `quality-fair` (60-74分)
- `quality-needs-improvement` (<60分)

### 審核需求標籤

- `needs-medical-review` - 需要醫療審核
- `needs-pharmacist-review` - 需要藥師審核
- `needs-accessibility-fixes` - 需要無障礙性修正
- `needs-reference-fixes` - 需要參考文獻修正

## 📊 品質檢查報告

### 報告格式

品質檢查會生成多種格式的報告：

1. **JSON 報告** - 機器可讀的詳細數據
2. **HTML 報告** - 視覺化的品質儀表板
3. **Markdown 報告** - 適合文檔的摘要格式
4. **PR 評論** - 直接在 PR 中的摘要

### 品質分數計算

- **醫療術語檢查**: 25%
- **無障礙性驗證**: 25%
- **可讀性分析**: 25%
- **參考文獻檢查**: 25%

### 品質標準

- 🏆 **優秀** (90-100): 可直接發布
- ✅ **良好** (75-89): 小幅修正後可發布
- ⚠️ **普通** (60-74): 需要改善後發布
- ❌ **需改善** (0-59): 需要大幅修正

## 🔧 自訂配置

### 修改審核者

編輯 `CODEOWNERS` 檔案來調整審核者指派：

```
# 添加新的專科審核者
src/content/education/*dermatology* @dermatology-reviewer @medical-advisors
```

### 調整自動標籤

編輯 `labeler.yml` 檔案來修改標籤規則：

```yaml
# 添加新的標籤規則
dermatology:
  - 'src/content/education/**/*dermatology*'
  - 'src/content/education/**/*skin*'
```

### 修改品質檢查標準

編輯品質檢查工具的配置常數：

```javascript
// 在 scripts/quality-check-runner.js 中
const QUALITY_CHECKS = {
  terminology: { weight: 30 },  // 調整權重
  accessibility: { weight: 20 },
  readability: { weight: 25 },
  references: { weight: 25 }
};
```

## 🚨 故障排除

### 常見問題

1. **品質檢查失敗**
   - 檢查 Actions 日誌中的詳細錯誤訊息
   - 確認所有依賴套件已正確安裝
   - 驗證內容格式符合 Content Collections schema

2. **審核者未自動指派**
   - 檢查 CODEOWNERS 檔案語法
   - 確認審核者帳號存在且有權限
   - 檢查檔案路徑是否符合規則

3. **標籤未自動添加**
   - 檢查 labeler.yml 配置
   - 確認 PR 變更的檔案符合標籤規則
   - 檢查 GitHub Actions 權限設定

### 除錯模式

啟用 GitHub Actions 除錯模式：

1. 在儲存庫設定中添加 Secret: `ACTIONS_STEP_DEBUG = true`
2. 重新執行失敗的工作流程
3. 查看詳細的除錯日誌

## 📞 支援聯絡

如有問題或需要協助：

- **技術問題**: @tech-team
- **內容問題**: @content-manager
- **醫療審核**: @medical-advisors
- **緊急問題**: 請直接聯絡專案負責人

## 📚 相關文件

- [品質檢查工具說明](../QUALITY_CHECKS.md)
- [CMS 設定指南](../CMS_SETUP.md)
- [內容編輯指南](../CMS_EDITING_GUIDE.md)
- [專案主要 README](../README.md)