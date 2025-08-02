# YAML Frontmatter 故障排除指南

## 概述

本文檔記錄了在 Astro Clinical Platform 開發過程中遇到的 YAML frontmatter 格式問題及其解決方案，幫助開發者快速識別和修復類似問題。

## 常見問題類型

### 1. 日期格式問題

#### 問題描述
```
Expected type "string", received "date"
```

#### 問題原因
YAML 解析器會自動將符合日期格式的值（如 `2025-01-30`）解析為 JavaScript Date 物件，但 Astro 的內容集合 schema 期望收到字串格式。

#### 錯誤示例
```yaml
---
lastUpdated: 2025-01-30
reviewDate: 2025-01-28
nextReviewDate: 2025-07-30
versionHistory:
  - version: "1.0"
    date: 2025-01-15  # ❌ 會被解析為 Date 物件
    changes: ["初版發布"]
---
```

#### 正確格式
```yaml
---
lastUpdated: "2025-01-30"
reviewDate: "2025-01-28"
nextReviewDate: "2025-07-30"
versionHistory:
  - version: "1.0"
    date: "2025-01-15"  # ✅ 保持為字串格式
    changes: ["初版發布"]
---
```

#### 修復步驟
1. 找出所有日期相關欄位
2. 將日期值用雙引號包起來
3. 檢查嵌套物件中的日期欄位
4. 驗證修復結果

### 2. 語言鍵不一致問題

#### 問題描述
```
Cannot read properties of undefined (reading 'zh-TW')
```

#### 問題原因
系統中同時存在兩種語言鍵格式：
- `zh-TW`（帶連字符，系統標準）
- `zh_TW`（帶下劃線，錯誤格式）

#### 錯誤示例
```yaml
---
title:
  zh_TW: "標題"  # ❌ 使用下劃線
  en: "Title"
  ja: "タイトル"
excerpt:
  zh_TW: "摘要"  # ❌ 使用下劃線
  en: "Excerpt"
  ja: "要約"
---
```

#### 正確格式
```yaml
---
title:
  zh-TW: "標題"  # ✅ 使用連字符
  en: "Title"
  ja: "タイトル"
excerpt:
  zh-TW: "摘要"  # ✅ 使用連字符
  en: "Excerpt"
  ja: "要約"
---
```

#### 修復步驟
1. 檢查 `src/env.d.ts` 中的 `SupportedLocale` 類型定義
2. 統一所有 markdown 文件中的語言鍵格式
3. 更新模板文件中的語言鍵
4. 在代碼中添加防護性檢查

## 診斷工具和方法

### 1. 快速檢查命令

```bash
# 搜尋未加引號的日期格式
grep -r ": [0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}$" src/content/

# 搜尋錯誤的語言鍵格式
grep -r "zh_TW:" src/content/

# 檢查所有日期欄位
grep -r "Date:" src/content/
grep -r "date:" src/content/
```

### 2. 構建測試

```bash
# 本地構建測試
npm run build

# 開發模式測試
npm run dev
```

### 3. Schema 驗證

檢查 `src/content/config.ts` 中的 schema 定義，確保：
- 日期欄位定義為 `z.string()`
- 多語言欄位正確定義語言鍵

## 防護性編程實踐

### 1. 安全的語言鍵訪問

```typescript
// ❌ 不安全的訪問
{edu.title[locale]}

// ✅ 安全的訪問
{edu.title?.[locale] || edu.title?.['zh-TW'] || entry.slug}
```

### 2. 類型檢查

```typescript
// 在組件中添加類型檢查
if (!edu.title || typeof edu.title !== 'object') {
  console.warn(`Invalid title format for ${entry.slug}`);
  return null;
}
```

### 3. 預設值處理

```typescript
// 提供合理的預設值
const title = edu.title?.[locale] || edu.title?.['zh-TW'] || '未命名文章';
const excerpt = edu.excerpt?.[locale] || edu.excerpt?.['zh-TW'] || '';
const author = edu.author?.[locale] || edu.author?.['zh-TW'] || '未知作者';
```

## 最佳實踐

### 1. YAML 格式規範

```yaml
---
# 字串值統一使用雙引號
title: "文章標題"

# 日期值必須用引號包起來
lastUpdated: "2025-01-30"
publishedAt: "2025-01-30"

# 多語言物件使用標準語言鍵
title:
  zh-TW: "繁體中文標題"
  en: "English Title"
  ja: "日本語タイトル"

# 陣列中的日期也要加引號
versionHistory:
  - version: "1.0"
    date: "2025-01-15"  # 重要：日期加引號
    changes: ["初版發布"]

# 布林值不需要引號
isActive: true
isFeatured: false

# 數字值不需要引號
readingTime: 10
wordCount: 2500
---
```

### 2. 內容驗證清單

在創建或修改 markdown 文件時，請檢查：

- [ ] 所有日期欄位都用雙引號包起來
- [ ] 語言鍵使用 `zh-TW` 格式（連字符）
- [ ] 多語言物件包含所有必要的語言版本
- [ ] 字串值使用雙引號
- [ ] 嵌套物件中的日期也加了引號
- [ ] 本地構建測試通過

### 3. 模板文件維護

創建新的模板文件時：

```yaml
---
# 使用正確的語言鍵格式
title:
  zh-TW: "模板標題"
  en: "Template Title"
  ja: "テンプレートタイトル"

# 日期欄位預設為字串格式
lastUpdated: "YYYY-MM-DD"
publishedAt: "YYYY-MM-DD"

# 提供完整的多語言支援
author:
  zh-TW: "作者姓名"
  en: "Author Name"
  ja: "著者名"
---
```

## 故障排除流程

### 步驟 1：識別錯誤類型
1. 查看構建錯誤訊息
2. 確定是 schema 驗證錯誤還是運行時錯誤
3. 定位問題文件

### 步驟 2：檢查 YAML 格式
1. 驗證日期格式是否正確
2. 檢查語言鍵是否一致
3. 確認引號使用是否正確

### 步驟 3：修復問題
1. 統一日期格式（加引號）
2. 統一語言鍵格式
3. 添加防護性代碼

### 步驟 4：驗證修復
1. 本地構建測試
2. 檢查相關頁面渲染
3. 提交並部署

## 相關文件

- `src/content/config.ts` - 內容集合 schema 定義
- `src/env.d.ts` - 類型定義
- `src/utils/i18n.ts` - 國際化工具函數
- `src/pages/education/index.astro` - 教育內容列表頁面

## 更新記錄

| 日期 | 版本 | 更新內容 |
|------|------|----------|
| 2025-01-31 | 1.0 | 初版發布，記錄日期格式和語言鍵問題的解決方案 |

## 聯絡資訊

如果遇到本文檔未涵蓋的問題，請：
1. 檢查 GitHub Issues
2. 查看 Astro 官方文檔
3. 聯絡開發團隊

---

*本文檔將持續更新，記錄新發現的問題和解決方案。*