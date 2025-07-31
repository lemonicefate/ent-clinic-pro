# 🏥 醫療衛教內容品質檢查工具

本專案包含一套完整的醫療衛教內容品質檢查工具，確保內容的準確性、可讀性和專業性。

## 📋 檢查工具概覽

### 1. 醫療術語檢查 (Medical Terminology Checker)
- **檔案**: `scripts/medical-terminology-checker.js`
- **功能**: 檢查醫療術語拼寫、用詞準確性和一致性
- **檢查項目**:
  - 醫療術語拼寫錯誤
  - 不當或不專業用詞
  - 術語使用一致性
  - 危險或誤導性表述
  - 藥物劑量格式
  - 縮寫使用規範

### 2. 無障礙性驗證 (Accessibility Validator)
- **檔案**: `scripts/accessibility-validator.js`
- **功能**: 確保內容符合無障礙性標準
- **檢查項目**:
  - 圖片 alt 文字品質
  - 標題結構層級
  - 連結描述性文字
  - 表格無障礙性
  - 顏色依賴檢查
  - 醫療術語簡化建議

### 3. 可讀性分析 (Readability Analyzer)
- **檔案**: `scripts/readability-analyzer.js`
- **功能**: 分析內容可讀性和理解難度
- **檢查項目**:
  - 字數統計和建議
  - 句子長度分析
  - 段落結構檢查
  - 閱讀時間估算
  - 醫療術語複雜度
  - 被動語態使用

### 4. 參考文獻檢查 (Reference Format Checker)
- **檔案**: `scripts/reference-format-checker.js`
- **功能**: 驗證參考文獻格式和來源可信度
- **檢查項目**:
  - 參考文獻格式標準化
  - 內文引用一致性
  - 來源可信度評估
  - 參考文獻時效性
  - 期刊影響因子檢查
  - 缺少引用的重要聲明

### 5. 品質檢查執行器 (Quality Check Runner)
- **檔案**: `scripts/quality-check-runner.js`
- **功能**: 統一執行所有品質檢查並生成綜合報告
- **輸出格式**:
  - 控制台摘要報告
  - JSON 詳細報告
  - HTML 視覺化報告
  - Markdown 文檔報告

## 🚀 使用方法

### 安裝依賴
```bash
npm install
```

### 執行單項檢查
```bash
# 醫療術語檢查
npm run quality:terminology

# 無障礙性驗證
npm run quality:accessibility

# 可讀性分析
npm run quality:readability

# 參考文獻檢查
npm run quality:references
```

### 執行完整品質檢查
```bash
# 執行所有品質檢查
npm run quality:check

# 執行所有檢查 + Markdown 語法檢查
npm run quality:all
```

### 指定檢查目錄
```bash
node scripts/quality-check-runner.js src/content/education
```

## 📊 品質評分標準

### 總體評分
- 🏆 **優秀** (90-100): 內容品質極佳，符合所有標準
- ✅ **良好** (75-89): 內容品質良好，有少量改善空間
- ⚠️ **普通** (60-74): 內容品質普通，需要一些改善
- ❌ **需改善** (0-59): 內容品質需要大幅改善

### 各項檢查權重
- 醫療術語檢查: 25%
- 無障礙性驗證: 25%
- 可讀性分析: 25%
- 參考文獻檢查: 25%

## 📄 報告輸出

執行品質檢查後，會在 `quality-reports/` 目錄生成以下報告：

### 1. 綜合報告
- `comprehensive-quality-report.json`: 完整的 JSON 格式報告
- `quality-report.html`: 視覺化 HTML 報告
- `quality-report.md`: Markdown 格式摘要

### 2. 單項報告
- `medical-terminology-report.json`: 醫療術語檢查詳細報告
- `accessibility-report.json`: 無障礙性驗證詳細報告
- `readability-report.json`: 可讀性分析詳細報告
- `reference-format-report.json`: 參考文獻檢查詳細報告
- `markdownlint-report.json`: Markdown 語法檢查報告

## 🔧 配置檔案

### Markdown 語法檢查
- `.markdownlint.json`: Markdownlint 規則配置

### 醫療術語詞典
各檢查工具內建醫療術語詞典，包含：
- 心臟科、神經科、小兒科、急診科、骨科術語
- 常見拼寫錯誤對照表
- 不當用詞警告清單
- 可信醫療資源域名清單

## 🎯 最佳實踐建議

### 內容撰寫
1. **使用標準醫療術語**，避免俗語或不準確表述
2. **為複雜術語提供解釋**，提高可讀性
3. **保持句子簡潔**，每句不超過 25 字
4. **適當分段**，每段不超過 100 字
5. **添加描述性圖片 alt 文字**

### 參考文獻
1. **使用權威醫療機構資源**（衛福部、WHO、知名醫學期刊）
2. **遵循標準引用格式**
3. **確保參考文獻時效性**（建議 5 年內）
4. **為重要醫療聲明添加引用**

### 無障礙性
1. **建立清晰的標題層級結構**
2. **使用描述性連結文字**
3. **避免僅用顏色傳達資訊**
4. **為表格添加標題和說明**

## 🔄 CI/CD 整合

### GitHub Actions 範例
```yaml
name: Content Quality Check

on:
  pull_request:
    paths:
      - 'src/content/**/*.md'

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run quality:all
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: quality-reports
          path: quality-reports/
```

## 🛠️ 自訂配置

### 修改檢查標準
可以在各檢查工具檔案中修改配置常數：

```javascript
// 修改可讀性標準
const READABILITY_CONFIG = {
  sentence: {
    maxLength: 20,  // 調整最大句子長度
    optimalLength: 12
  }
};

// 修改品質評分權重
const QUALITY_CHECKS = {
  terminology: { weight: 30 },  // 提高術語檢查權重
  accessibility: { weight: 20 },
  readability: { weight: 25 },
  references: { weight: 25 }
};
```

### 添加自訂醫療術語
```javascript
// 在 medical-terminology-checker.js 中添加
const MEDICAL_DICTIONARY = {
  cardiology: {
    correct: [
      // 添加新的心臟科術語
      'cardiac catheterization',
      'percutaneous coronary intervention'
    ]
  }
};
```

## 🐛 故障排除

### 常見問題

1. **執行權限錯誤**
   ```bash
   chmod +x scripts/*.js
   ```

2. **依賴套件缺失**
   ```bash
   npm install js-yaml markdownlint-cli2
   ```

3. **記憶體不足**
   ```bash
   node --max-old-space-size=4096 scripts/quality-check-runner.js
   ```

### 除錯模式
```bash
DEBUG=1 npm run quality:check
```

## 📞 支援與貢獻

如有問題或建議，請：
1. 查看現有 Issues
2. 建立新的 Issue 描述問題
3. 提交 Pull Request 改善工具

## 📜 授權

本品質檢查工具遵循專案主要授權條款。