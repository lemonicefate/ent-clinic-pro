# Astro Clinical Platform - Strapi CMS

這是 Astro Clinical Platform 的 Headless CMS，使用 Strapi 4.x 建構，專為醫療內容管理而設計。

## 🏥 功能特色

### 醫療內容類型
- **Medical Calculators**: 臨床計算工具配置
- **Educational Content**: 病患衛教內容
- **Medical Flowcharts**: 診斷和治療流程圖
- **Medical Specialties**: 醫療專科分類

### 多語言支援
- 繁體中文 (zh-TW) - 預設語言
- 英文 (en)
- 日文 (ja)

### 安全功能
- 醫療內容驗證中介軟體
- API 速率限制
- CORS 安全設定
- 角色權限管理

## 🚀 快速開始

### 1. 安裝依賴

```bash
cd cms
npm install
```

### 2. 環境設定

複製環境變數範例檔案：

```bash
cp .env.example .env
```

編輯 `.env` 檔案，設定必要的環境變數：

```env
# 基本設定
HOST=0.0.0.0
PORT=1337

# 安全金鑰（請更改為隨機字串）
APP_KEYS="your-app-key-1,your-app-key-2"
API_TOKEN_SALT=your-api-token-salt
ADMIN_JWT_SECRET=your-admin-jwt-secret
TRANSFER_TOKEN_SALT=your-transfer-token-salt
JWT_SECRET=your-jwt-secret

# 資料庫（開發環境使用 SQLite）
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

# 前端 URL（用於 CORS）
FRONTEND_URL=http://localhost:4321
```

### 3. 啟動開發伺服器

```bash
npm run develop
```

CMS 將在 http://localhost:1337 啟動。

### 4. 建立管理員帳戶

首次啟動時，訪問 http://localhost:1337/admin 建立管理員帳戶。

## 📊 內容類型說明

### Medical Calculator (醫療計算機)

用於配置動態醫療計算工具：

```json
{
  "name": "CHA₂DS₂-VASc 評分",
  "slug": "cha2ds2-vasc",
  "category": "cardiology",
  "fields": [...], // 計算欄位配置
  "calculationFunction": "calculateCHADSVASC",
  "interpretation": [...] // 結果解釋
}
```

### Educational Content (教育內容)

病患衛教和醫療資訊：

```json
{
  "title": "心房顫動衛教",
  "content": "...", // 富文本內容
  "category": "disease",
  "difficulty": "basic",
  "flowchartCode": "graph TD; A-->B", // Mermaid 流程圖
  "patientFriendly": true
}
```

### Medical Flowchart (醫療流程圖)

診斷和治療流程圖：

```json
{
  "title": "急性心肌梗塞診斷流程",
  "mermaidCode": "graph TD; A[胸痛]-->B{心電圖異常?}",
  "category": "diagnostic",
  "accessibility": {
    "textAlternative": "診斷流程的文字描述",
    "ariaLabel": "急性心肌梗塞診斷流程圖"
  }
}
```

## 🔧 API 使用

### 基本 API 端點

```
GET /api/calculators - 取得所有計算機
GET /api/calculators/:id - 取得特定計算機
GET /api/educations - 取得所有教育內容
GET /api/educations/:id - 取得特定教育內容
GET /api/flowcharts - 取得所有流程圖
GET /api/medical-specialties - 取得醫療專科
```

### 多語言 API

```
GET /api/calculators?locale=zh-TW - 繁體中文內容
GET /api/calculators?locale=en - 英文內容
GET /api/calculators?locale=ja - 日文內容
```

### 篩選和排序

```
GET /api/calculators?filters[category][$eq]=cardiology
GET /api/educations?sort=createdAt:desc
GET /api/calculators?populate=*
```

## 🔒 安全設定

### 角色權限

- **Public**: 只能讀取已發布的內容
- **Authenticated**: 基本讀取權限
- **Medical Professional**: 可建立和編輯醫療內容
- **Content Manager**: 完整的內容管理權限

### API 速率限制

- 一般使用者：每分鐘 30 次請求
- 已驗證使用者：每分鐘 100 次請求
- 醫療內容 API：已驗證使用者每分鐘 200 次請求

### 醫療內容驗證

自動檢查：
- 危險醫療建議用詞
- 計算機欄位配置正確性
- 教育內容完整性
- 免責聲明包含情況

## 🚀 部署

### 生產環境設定

1. 使用 PostgreSQL 資料庫：

```env
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://username:password@host:port/database
```

2. 設定檔案儲存（建議使用 Cloudflare R2 或 AWS S3）

3. 設定環境變數：

```env
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
ADMIN_URL=/admin
```

### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 1337
CMD ["npm", "start"]
```

## 🔄 與 Astro 整合

在 Astro 專案中使用 CMS 內容：

```typescript
// src/utils/cms.ts
const CMS_URL = import.meta.env.PUBLIC_CMS_URL || 'http://localhost:1337';

export async function getCalculators() {
  const response = await fetch(`${CMS_URL}/api/calculators?populate=*`);
  return response.json();
}

export async function getEducationContent() {
  const response = await fetch(`${CMS_URL}/api/educations?populate=*`);
  return response.json();
}
```

## 📝 內容管理工作流程

### 1. 內容建立
- 使用 Strapi 管理介面建立內容
- 支援富文本編輯器
- 多語言內容管理
- 媒體檔案上傳

### 2. 內容審核
- 醫療內容自動驗證
- 專業人員審核流程
- 版本控制和歷史記錄

### 3. 內容發布
- 草稿和發布狀態管理
- 排程發布功能
- Webhook 觸發 Astro 重建

## 🛠️ 開發工具

### GraphQL Playground

訪問 http://localhost:1337/graphql 使用 GraphQL API。

### API 文件

訪問 http://localhost:1337/documentation 查看自動生成的 API 文件。

### 資料庫管理

開發環境使用 SQLite，資料庫檔案位於 `.tmp/data.db`。

## 🆘 故障排除

### 常見問題

1. **無法啟動 CMS**
   - 檢查 Node.js 版本（需要 18.x 或 20.x）
   - 確認環境變數設定正確
   - 檢查端口 1337 是否被佔用

2. **CORS 錯誤**
   - 確認 `FRONTEND_URL` 環境變數正確
   - 檢查 `config/server.js` 中的 CORS 設定

3. **資料庫連線問題**
   - 檢查資料庫設定
   - 確認資料庫服務正在運行
   - 檢查連線字串格式

### 日誌檢查

```bash
# 檢查 Strapi 日誌
npm run develop -- --debug

# 檢查特定模組日誌
DEBUG=strapi:* npm run develop
```

## 📞 支援

如需協助，請：
1. 查看 [Strapi 官方文件](https://docs.strapi.io/)
2. 檢查專案 GitHub Issues
3. 聯繫開發團隊

---

**注意**: 這是醫療平台的 CMS，請確保所有內容都經過適當的醫療專家審核後再發布。