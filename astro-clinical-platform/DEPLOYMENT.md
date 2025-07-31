# Cloudflare Pages 部署指南

## 🎯 部署成功總結

本專案已成功從 SSR (Server-Side Rendering) 轉換為 SSG (Static Site Generation) 並部署至 Cloudflare Pages。

### 📊 最終結果
- ✅ **51 個頁面**成功生成
- ✅ **多語言支援** (zh-TW, en, ja)
- ✅ **動態路由**正常運作
- ✅ **醫療工具**完整功能
- ✅ **Context7 整合**完成
- ✅ **建置時間**: ~24 秒
- ✅ **部署網址**: https://ent-clinic-pro.pages.dev

---

## 🔧 技術架構轉換

### 轉換前 (SSR)
```javascript
// astro.config.mjs (舊版)
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  // ...
});
```

### 轉換後 (SSG)
```javascript
// astro.config.mjs (新版)
export default defineConfig({
  output: 'static', // 靜態網站生成
  site: 'https://ent-clinic-pro.pages.dev',
  // 移除 adapter 配置
  // ...
});
```

---

## 🚨 遇到的問題與解決方案

### 1. React Flow 匯入錯誤
**問題**: DecisionTree 組件中未使用的匯入導致建置警告
```javascript
// ❌ 問題代碼
import {
  addEdge,    // 未使用
  Node,       // 未使用  
  Edge,       // 未使用
  Connection, // 未使用
} from '@xyflow/react';
```

**解決方案**: 移除未使用的匯入，使用 TypeScript 類型匯入
```javascript
// ✅ 修正後
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Position,
  Handle,
  type Node,  // 類型匯入
  type Edge   // 類型匯入
} from '@xyflow/react';
```

### 2. 動態路由 getStaticPaths 缺失
**問題**: SSG 模式下動態路由需要 `getStaticPaths` 函數

**解決方案**: 為所有動態路由添加 `getStaticPaths`
```javascript
// ✅ 範例: [calculator].astro
export function getStaticPaths() {
  return [
    { params: { calculator: 'bmi' } },
    { params: { calculator: 'egfr' } },
    { params: { calculator: 'cha2ds2-vasc' } }
  ];
}
```

### 3. SSR 驗證邏輯衝突
**問題**: SSG 建置時執行 SSR 驗證邏輯導致頁面無法生成
```javascript
// ❌ 問題代碼
if (!calculatorId || !availableCalculators[calculatorId]) {
  Astro.response.status = 404;
  return Astro.rewrite('/404');
}
```

**解決方案**: 移除 SSG 模式下不需要的驗證
```javascript
// ✅ 修正後
// 在 SSG 模式下，getStaticPaths 確保只生成有效的計算器頁面
// 不需要運行時驗證
```

### 4. API 路由清理
**問題**: SSG 不支援 API 路由，但專案中存在多個 API 檔案

**解決方案**: 移除所有 `/api/` 路由檔案
- 刪除 `src/pages/api/` 整個目錄
- 移除相關的伺服器端邏輯

---

## 📁 專案結構與配置

### 核心配置檔案

#### astro.config.mjs
```javascript
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://ent-clinic-pro.pages.dev',
  output: 'static', // 靜態網站生成
  
  // 多語言配置
  i18n: {
    defaultLocale: 'zh-TW',
    locales: ['zh-TW', 'en', 'ja'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: true
    },
    fallback: {
      en: 'zh-TW',
      ja: 'zh-TW'
    }
  },
  
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: ['vitest']
    },
    define: {
      'import.meta.vitest': 'undefined'
    }
  },

  integrations: [
    react({
      experimentalReactChildren: true
    })
  ],

  build: {
    inlineStylesheets: 'auto'
  },

  compressHTML: true,
  
  security: {
    checkOrigin: true
  }
});
```

#### package.json 建置腳本
```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "build:static": "astro build && pagefind --site dist",
    "preview": "astro preview"
  }
}
```

### 動態路由配置

#### 醫療工具路由 (`[calculator].astro`)
```javascript
export function getStaticPaths() {
  return [
    { params: { calculator: 'bmi' } },
    { params: { calculator: 'egfr' } },
    { params: { calculator: 'cha2ds2-vasc' } }
  ];
}
```

#### 專科路由 (`[specialty].astro`)
```javascript
export function getStaticPaths() {
  const specialties = [
    { id: 'cardiology', name: '心臟科' },
    { id: 'neurology', name: '神經科' },
    { id: 'endocrinology', name: '內分泌科' },
    { id: 'general', name: '一般醫學' },
    { id: 'emergency', name: '急診醫學' },
    { id: 'pediatrics', name: '小兒科' }
  ];

  return specialties.map(specialty => ({
    params: { specialty: specialty.id },
    props: { specialty }
  }));
}
```

#### 教育內容路由 (`[slug].astro`, `[category].astro`)
```javascript
// [slug].astro
export async function getStaticPaths() {
  const educationEntries = await getCollection('education');
  return educationEntries.map(entry => ({
    params: { slug: entry.slug },
    props: { entry }
  }));
}

// [category].astro  
export function getStaticPaths() {
  const categories = [
    'disease', 'treatment', 'prevention',
    'procedure', 'medication', 'lifestyle'
  ];
  
  return categories.map(category => ({
    params: { category },
    props: { category }
  }));
}
```

---

## 🔧 Context7 整合配置

### MCP 配置 (`.kiro/settings/mcp.json`)
```json
{
  "mcpServers": {
    "context7": {
      "command": "uvx",
      "args": ["context7-mcp-server@latest"],
      "env": {
        "FASTMCP_LOG_LEVEL": "ERROR"
      },
      "disabled": false,
      "autoApprove": [
        "mcp_Context7_resolve_library_id",
        "mcp_Context7_get_library_docs"
      ]
    }
  }
}
```

### Context7 使用範例
```javascript
// 解析函式庫 ID
const libraryId = await mcp_Context7_resolve_library_id('astro');

// 獲取文檔
const docs = await mcp_Context7_get_library_docs({
  context7CompatibleLibraryID: '/withastro/docs',
  topic: 'components integration medical',
  tokens: 5000
});
```

---

## 🚀 Cloudflare Pages 部署配置

### 部署設定
- **專案名稱**: ent-clinic-pro
- **Git 儲存庫**: https://github.com/lemonicefate/ent-clinic-pro.git
- **分支**: master
- **根目錄**: `astro-clinical-platform`
- **建置命令**: `npm run build`
- **建置輸出目錄**: `/dist`
- **Node.js 版本**: 18.x (自動偵測)

### 環境變數
目前無需設定額外環境變數，所有配置都在程式碼中。

### 自訂網域 (可選)
```
主網域: ent-clinic-pro.pages.dev
自訂網域: (可後續添加)
```

---

## 📊 建置效能分析

### 建置統計
- **總頁面數**: 51 頁
- **建置時間**: ~24 秒
- **JavaScript 包大小**: 
  - 最大包: 1,452.03 kB (flowchart-elk-definition)
  - 總計: ~3.2 MB (gzipped: ~1.1 MB)
- **CSS 檔案**: 15.66 kB (gzipped: 2.62 kB)

### 效能優化建議
```javascript
// 可考慮的優化 (未來)
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'medical-charts': ['chart.js', 'react-chartjs-2'],
          'decision-trees': ['@xyflow/react'],
          'mermaid': ['mermaid']
        }
      }
    }
  }
});
```

---

## 🔍 故障排除指南

### 常見問題

#### 1. 建置失敗: "getStaticPaths is required"
**解決方案**: 確保所有動態路由都有 `getStaticPaths` 函數

#### 2. 建置警告: "Some chunks are larger than 500 kB"
**解決方案**: 這是正常警告，不影響功能。可透過程式碼分割優化

#### 3. 多語言路由問題
**解決方案**: 檢查 `i18n` 配置和 `getStaticPaths` 是否正確處理所有語言

#### 4. Context7 連接問題
**解決方案**: 確認 MCP 配置正確，重啟 Kiro IDE

### 除錯命令
```bash
# 本地建置測試
npm run build

# 本地預覽
npm run preview

# 檢查建置輸出
ls -la dist/

# 檢查特定頁面
cat dist/tools/bmi/index.html
```

---

## 📝 部署檢查清單

### 部署前檢查
- [ ] `astro.config.mjs` 設定正確
- [ ] 所有動態路由有 `getStaticPaths`
- [ ] 移除所有 API 路由
- [ ] 建置成功無錯誤
- [ ] 本地預覽正常

### 部署後驗證
- [ ] 首頁載入正常
- [ ] 多語言切換功能
- [ ] 醫療工具計算正確
- [ ] 決策樹互動正常
- [ ] 搜尋功能運作
- [ ] 行動裝置相容性

---

## 🔄 未來維護指南

### 新增醫療工具
1. 在 `getStaticPaths` 中添加新的計算器 ID
2. 更新 `availableCalculators` 對應表
3. 建立對應的插件配置

### 新增教育內容
1. 在 `src/content/education/` 添加 Markdown 檔案
2. 確保 frontmatter 格式正確
3. `getStaticPaths` 會自動偵測新內容

### 新增專科
1. 更新 `[specialty].astro` 中的 specialties 陣列
2. 添加對應的內容和工具關聯

### 版本更新流程
```bash
# 1. 更新程式碼
git add .
git commit -m "feat: 新增功能描述"

# 2. 推送到 GitHub
git push origin master

# 3. Cloudflare Pages 自動部署
# 4. 驗證部署結果
```

---

## 📞 支援資源

### 相關文檔
- [Astro 官方文檔](https://docs.astro.build/)
- [Cloudflare Pages 文檔](https://developers.cloudflare.com/pages/)
- [Context7 文檔](https://context7.ai/)

### 專案連結
- **GitHub**: https://github.com/lemonicefate/ent-clinic-pro
- **部署網址**: https://ent-clinic-pro.pages.dev
- **Cloudflare Dashboard**: [Cloudflare Pages 控制台]

---

*最後更新: 2025-01-30*
*部署版本: SSG v1.0*
*狀態: ✅ 生產環境運行中*