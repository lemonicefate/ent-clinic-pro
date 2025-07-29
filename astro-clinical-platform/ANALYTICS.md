# 隱私友善分析系統

本文檔說明 Astro Clinical Platform 的隱私友善分析系統實作。

## 概述

我們的分析系統基於 Plausible Analytics，提供隱私友善的網站使用統計，不收集個人識別資訊，完全符合 GDPR 和其他隱私法規要求。

## 主要特性

### 🔒 隱私保護
- **無 Cookie 追蹤**：不使用 Cookie 或本地儲存進行用戶識別
- **匿名化資料**：所有資料都經過匿名化處理
- **Do Not Track 支援**：自動檢測並尊重用戶的 Do Not Track 設定
- **用戶控制**：提供完整的選擇退出機制

### 📊 醫療內容追蹤
- **內容使用分析**：追蹤教育內容和計算機的使用情況
- **專科分類**：按醫療專科分類統計使用數據
- **滾動深度**：測量用戶對醫療內容的參與度
- **停留時間**：記錄用戶在醫療內容上的活躍時間

### 🧮 計算機分析
- **使用統計**：記錄各種醫療計算機的使用頻率
- **輸入分析**：分析用戶最常使用的輸入欄位
- **結果分佈**：統計計算結果的風險等級分佈
- **效能監控**：追蹤計算時間和錯誤率

### 🔍 搜尋分析
- **搜尋查詢**：記錄搜尋關鍵字（匿名化）
- **結果點擊**：追蹤搜尋結果的點擊率
- **搜尋效能**：監控搜尋響應時間
- **熱門內容**：識別最受歡迎的醫療內容

## 技術實作

### 核心組件

#### 1. PrivacyAnalytics 類別
```typescript
// 主要分析引擎
class PrivacyAnalytics implements MedicalAnalytics {
  // 隱私友善的事件追蹤
  // 自動會話管理
  // Do Not Track 檢測
  // 本地資料儲存（可選）
}
```

#### 2. AnalyticsInit 組件
```astro
<!-- 分析初始化和頁面特定追蹤 -->
<AnalyticsInit 
  locale={locale}
  medicalContent={medicalContent}
  pageType={pageType}
  contentId={contentId}
  specialty={specialty}
/>
```

#### 3. PrivacyControls 組件
```astro
<!-- 用戶隱私控制面板 -->
<PrivacyControls locale={locale} />
```

### 事件類型

#### 醫療內容事件
```typescript
interface MedicalContentEvent {
  contentType: 'calculator' | 'education' | 'flowchart';
  contentId: string;
  specialty?: string;
  language?: string;
}
```

#### 計算機事件
```typescript
interface CalculatorEvent {
  calculatorId: string;
  inputFields: string[];
  resultType?: 'low' | 'moderate' | 'high';
  calculationTime?: number;
}
```

#### 用戶旅程事件
```typescript
interface UserJourneyEvent {
  page: string;
  action: 'page_view' | 'search' | 'navigation' | 'interaction';
  source?: string;
  sessionId?: string;
}
```

## 配置設定

### 環境變數
```bash
# Plausible 分析域名
PUBLIC_ANALYTICS_DOMAIN=yourdomain.com

# 網站 URL
PUBLIC_SITE_URL=https://yourdomain.com
```

### 分析配置
```typescript
const analyticsConfig = {
  enabled: true,
  domain: 'yourdomain.com',
  trackOutboundLinks: true,
  trackFileDownloads: true,
  respectDoNotTrack: true,
  sessionTimeout: 30 // 分鐘
};
```

## 使用方式

### 1. 基本頁面追蹤
```astro
<BaseLayout 
  pageType="education"
  contentId="diabetes-guide"
  specialty="內分泌科"
  medicalContent={true}
>
  <!-- 頁面內容 -->
</BaseLayout>
```

### 2. 計算機事件追蹤
```typescript
// 在計算機組件中
window.dispatchEvent(new CustomEvent('calculator:used', {
  detail: {
    calculatorId: 'bmi',
    inputs: { height: 170, weight: 70 },
    result: { value: 24.2, risk: 'normal' },
    calculationTime: 150
  }
}));
```

### 3. 搜尋事件追蹤
```typescript
// 在搜尋組件中
window.dispatchEvent(new CustomEvent('search:performed', {
  detail: {
    query: 'diabetes',
    results: 15,
    category: 'education',
    searchTime: 250
  }
}));
```

### 4. 自定義事件追蹤
```typescript
// 使用全域分析實例
window.medicalAnalytics?.trackEvent({
  name: 'Custom Medical Event',
  properties: {
    specialty: '心臟科',
    contentType: 'guideline',
    userType: 'professional'
  }
});
```

## 隱私控制

### 用戶選擇退出
用戶可以通過頁腳的隱私控制面板選擇退出分析追蹤：

1. **即時切換**：立即停用所有追蹤
2. **本地儲存**：設定保存在用戶瀏覽器中
3. **跨會話持續**：設定在瀏覽器會話間保持

### 資料清除
用戶可以清除所有本地儲存的分析資料：

```typescript
window.medicalAnalytics?.clearLocalData();
```

### Do Not Track 支援
系統自動檢測並尊重瀏覽器的 Do Not Track 設定：

```typescript
private isDoNotTrackEnabled(): boolean {
  return (
    navigator.doNotTrack === '1' ||
    window.doNotTrack === '1' ||
    navigator.msDoNotTrack === '1'
  );
}
```

## 資料處理

### 本地儲存
- **事件緩存**：最多儲存 1000 個事件
- **會話管理**：自動生成匿名會話 ID
- **資料輪替**：自動清理舊資料

### 資料傳輸
- **批次傳送**：減少網路請求
- **錯誤處理**：失敗重試機制
- **隱私保護**：移除敏感資訊

### 統計報告
```typescript
const stats = window.medicalAnalytics?.getLocalStats();
// {
//   totalEvents: 1250,
//   sessionCount: 45,
//   topPages: [...],
//   topCalculators: [...]
// }
```

## 開發和測試

### 開發模式
在開發環境中，分析系統提供控制台日誌輸出：

```javascript
// 開發環境模擬
window.medicalAnalytics = {
  trackEvent: (event) => console.log('Analytics Event (DEV):', event),
  trackMedicalContent: (event) => console.log('Medical Content (DEV):', event),
  // ...
};
```

### 測試
運行分析系統測試：

```bash
npm run test -- privacy-analytics.test.ts
```

## 效能考量

### 載入優化
- **延遲載入**：分析腳本使用 `defer` 屬性
- **條件載入**：僅在生產環境載入
- **快取策略**：Plausible 腳本快取 6 小時

### 資源使用
- **輕量級**：Plausible 腳本 < 1KB
- **非阻塞**：不影響頁面載入速度
- **記憶體效率**：最小化本地儲存使用

## 合規性

### GDPR 合規
- ✅ 無個人資料收集
- ✅ 匿名化處理
- ✅ 用戶控制權
- ✅ 資料可攜性

### 醫療法規
- ✅ HIPAA 友善（無 PHI 收集）
- ✅ 醫療隱私保護
- ✅ 專業使用統計

## 故障排除

### 常見問題

1. **分析未載入**
   - 檢查 `PUBLIC_ANALYTICS_DOMAIN` 環境變數
   - 確認在生產環境中運行

2. **事件未觸發**
   - 檢查 `window.medicalAnalytics` 是否已初始化
   - 確認事件格式正確

3. **Do Not Track 問題**
   - 檢查瀏覽器 DNT 設定
   - 確認隱私設定正確

### 除錯工具
```javascript
// 檢查分析狀態
console.log('Analytics loaded:', !!window.medicalAnalytics);
console.log('Opted out:', window.medicalAnalytics?.isOptedOut());
console.log('Local stats:', window.medicalAnalytics?.getLocalStats());
```

## 更新日誌

### v1.0.0 (2024-01-25)
- ✨ 初始實作隱私友善分析系統
- ✨ 醫療內容使用追蹤
- ✨ 計算機分析功能
- ✨ 搜尋行為分析
- ✨ 用戶隱私控制面板
- ✨ Do Not Track 支援
- ✨ 本地資料管理

## 貢獻

如需改進分析系統，請：

1. 遵循隱私優先原則
2. 確保醫療合規性
3. 添加適當的測試
4. 更新相關文檔

## 授權

本分析系統遵循專案的 MIT 授權條款。