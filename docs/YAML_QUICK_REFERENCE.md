# YAML Frontmatter 快速參考

## 🚨 常見錯誤速查

### 錯誤 1: `Expected type "string", received "date"`
**原因**: 日期沒有加引號  
**修復**: 將所有日期用雙引號包起來

```yaml
# ❌ 錯誤
lastUpdated: 2025-01-30

# ✅ 正確  
lastUpdated: "2025-01-30"
```

### 錯誤 2: `Cannot read properties of undefined (reading 'zh-TW')`
**原因**: 語言鍵格式不一致  
**修復**: 統一使用 `zh-TW` 格式

```yaml
# ❌ 錯誤
title:
  zh_TW: "標題"

# ✅ 正確
title:
  zh-TW: "標題"
```

## 📋 檢查清單

部署前請確認：

- [ ] 所有日期都加了雙引號 `"2025-01-30"`
- [ ] 語言鍵使用 `zh-TW`（連字符，不是下劃線）
- [ ] 多語言物件包含所有語言版本
- [ ] 本地 `npm run build` 成功

## 🔍 快速檢查命令

```bash
# 找出未加引號的日期
grep -r ": [0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}$" src/content/

# 找出錯誤的語言鍵
grep -r "zh_TW:" src/content/

# 測試構建
npm run build
```

## 📝 標準格式模板

```yaml
---
title:
  zh-TW: "文章標題"
  en: "Article Title"
  ja: "記事タイトル"

excerpt:
  zh-TW: "文章摘要"
  en: "Article excerpt"
  ja: "記事の要約"

category: "disease"
lastUpdated: "2025-01-30"
publishedAt: "2025-01-30"
reviewDate: "2025-01-30"

author:
  zh-TW: "作者姓名"
  en: "Author Name"
  ja: "著者名"

versionHistory:
  - version: "1.0"
    date: "2025-01-15"  # 重要：日期加引號
    changes: ["初版發布"]

isActive: true
isFeatured: false
readingTime: 10
---
```

需要詳細說明請參考 [完整故障排除指南](./YAML_FRONTMATTER_TROUBLESHOOTING.md)。