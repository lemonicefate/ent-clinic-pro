# 故障排除指南

## 🚨 常見部署問題

### 1. 建置失敗

#### 問題: "getStaticPaths is required for dynamic routes"
```bash
錯誤訊息: [build] getStaticPaths() is required for dynamic routes
```

**解決方案:**
```javascript
// 在動態路由檔案中添加
export function getStaticPaths() {
  return [
    { params: { slug: 'example' } }
  ];
}
```

#### 問題: "Cannot resolve module"
```bash
錯誤訊息: Cannot resolve module '@xyflow/react'
```

**解決方案:**
```bash
# 重新安裝依賴
npm install
# 或清除快取
npm ci
```

### 2. 運行時錯誤

#### 問題: 頁面顯示 404
**檢查項目:**
- [ ] 檔案路徑是否正確
- [ ] `getStaticPaths` 是否包含該路由
- [ ] 建置是否成功生成該頁面

#### 問題: 醫療工具無法載入
**檢查項目:**
- [ ] React 組件是否有 `client:load` 指令
- [ ] JavaScript 是否正確載入
- [ ] 瀏覽器控制台是否有錯誤

### 3. Context7 問題

#### 問題: MCP 連接失敗
**解決步驟:**
1. 檢查 `.kiro/settings/mcp.json` 配置
2. 重啟 Kiro IDE
3. 確認 uvx 已安裝

```bash
# 安裝 uv 和 uvx
pip install uv
# 或使用 homebrew (macOS)
brew install uv
```

## 🔧 除錯命令

### 本地除錯
```bash
# 清除建置快取
rm -rf dist/ .astro/

# 重新建置
npm run build

# 檢查建置輸出
ls -la dist/

# 本地預覽
npm run preview
```

### 檢查特定頁面
```bash
# 檢查首頁
curl -I http://localhost:4321/

# 檢查醫療工具頁面
curl -I http://localhost:4321/tools/bmi/

# 檢查多語言頁面
curl -I http://localhost:4321/en/
```

### 分析建置日誌
```bash
# 詳細建置日誌
npm run build -- --verbose

# 檢查包大小
npm run build -- --analyze
```

## 📊 效能問題

### 問題: 建置時間過長
**優化方案:**
1. 減少不必要的依賴
2. 使用程式碼分割
3. 優化圖片資源

### 問題: 包大小過大
**解決方案:**
```javascript
// astro.config.mjs
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'charts': ['chart.js'],
          'flow': ['@xyflow/react']
        }
      }
    }
  }
});
```

## 🌐 多語言問題

### 問題: 語言切換無效
**檢查項目:**
- [ ] `i18n` 配置正確
- [ ] 所有語言的頁面都已生成
- [ ] 語言切換組件正確實作

### 問題: 預設語言錯誤
**解決方案:**
```javascript
// astro.config.mjs
i18n: {
  defaultLocale: 'zh-TW', // 確認預設語言
  locales: ['zh-TW', 'en', 'ja']
}
```

## 🔄 部署問題

### 問題: Cloudflare Pages 建置失敗
**檢查步驟:**
1. GitHub 儲存庫是否可存取
2. 建置命令是否正確
3. Node.js 版本是否相容
4. 環境變數是否設定

### 問題: 部署後頁面空白
**可能原因:**
- JavaScript 載入失敗
- 基礎路徑配置錯誤
- CSP 政策過於嚴格

**解決方案:**
```javascript
// astro.config.mjs
export default defineConfig({
  site: 'https://ent-clinic-pro.pages.dev', // 確認網址正確
  base: '/', // 確認基礎路徑
});
```

## 📞 獲取協助

### 日誌檢查位置
- **Cloudflare Pages**: 部署日誌在 Cloudflare Dashboard
- **本地開發**: 瀏覽器開發者工具
- **建置錯誤**: 終端機輸出

### 有用的除錯資訊
收集以下資訊有助於問題診斷：
- 錯誤訊息完整內容
- 瀏覽器和版本
- Node.js 版本
- 最後成功的 commit hash
- 建置日誌

### 聯絡支援
- **Astro 社群**: [Discord](https://astro.build/chat)
- **Cloudflare 支援**: [Community Forum](https://community.cloudflare.com/)
- **專案 Issues**: [GitHub Issues](https://github.com/lemonicefate/ent-clinic-pro/issues)

---

*保持此文檔更新，記錄新遇到的問題和解決方案*