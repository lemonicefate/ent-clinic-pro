#!/usr/bin/env node

/**
 * 使用者驗收測試腳本
 * 協助進行 Decap CMS 和整體工作流程的使用者測試
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 顏色輸出
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 測試場景定義
 */
const testScenarios = [
  {
    id: 'cms-login',
    name: 'CMS 登入測試',
    description: '測試使用者能否成功登入 Decap CMS',
    steps: [
      '1. 開啟瀏覽器，前往 /admin 頁面',
      '2. 點擊「Login with GitHub」按鈕',
      '3. 完成 GitHub OAuth 認證',
      '4. 確認成功進入 CMS 管理介面'
    ],
    expectedResults: [
      '✅ 能看到 CMS 登入頁面',
      '✅ GitHub OAuth 流程順暢',
      '✅ 成功進入管理介面',
      '✅ 能看到文章列表和新增按鈕'
    ],
    criticalPath: true
  },
  
  {
    id: 'content-creation',
    name: '內容建立測試',
    description: '測試使用者能否建立新的衛教文章',
    steps: [
      '1. 在 CMS 中點擊「新增文章」',
      '2. 選擇專科分類（如：心臟科）',
      '3. 填寫文章標題和內容',
      '4. 上傳相關圖片',
      '5. 設定文章狀態為「審核中」',
      '6. 儲存並提交'
    ],
    expectedResults: [
      '✅ 新增文章介面載入正常',
      '✅ 專科選擇器運作正常',
      '✅ 編輯器功能完整',
      '✅ 圖片上傳成功',
      '✅ 自動建立 GitHub PR'
    ],
    criticalPath: true
  },
  
  {
    id: 'content-editing',
    name: '內容編輯測試',
    description: '測試使用者能否編輯現有文章',
    steps: [
      '1. 在文章列表中選擇現有文章',
      '2. 點擊編輯按鈕',
      '3. 修改文章內容',
      '4. 更新圖片或新增圖片',
      '5. 儲存變更'
    ],
    expectedResults: [
      '✅ 能正確載入現有文章內容',
      '✅ 編輯功能正常運作',
      '✅ 圖片管理功能正常',
      '✅ 變更能正確儲存'
    ],
    criticalPath: true
  },
  
  {
    id: 'review-workflow',
    name: '審核工作流程測試',
    description: '測試 GitHub PR 審核流程',
    steps: [
      '1. 提交文章後檢查 GitHub PR',
      '2. 審核者在 PR 中添加評論',
      '3. 作者根據評論修改內容',
      '4. 審核者批准 PR',
      '5. 管理者合併 PR'
    ],
    expectedResults: [
      '✅ PR 自動建立',
      '✅ 審核者收到通知',
      '✅ 評論系統運作正常',
      '✅ 修改能正確同步',
      '✅ 合併後自動部署'
    ],
    criticalPath: true
  },
  
  {
    id: 'multilingual-support',
    name: '多語言支援測試',
    description: '測試多語言內容管理',
    steps: [
      '1. 建立中文文章',
      '2. 新增英文翻譯版本',
      '3. 新增日文翻譯版本',
      '4. 檢查語言切換功能',
      '5. 驗證翻譯狀態追蹤'
    ],
    expectedResults: [
      '✅ 多語言編輯介面正常',
      '✅ 翻譯版本管理正確',
      '✅ 語言切換功能正常',
      '✅ 翻譯狀態顯示正確'
    ],
    criticalPath: false
  },
  
  {
    id: 'search-functionality',
    name: '搜尋功能測試',
    description: '測試內容搜尋和過濾功能',
    steps: [
      '1. 使用關鍵字搜尋文章',
      '2. 按專科分類過濾',
      '3. 按作者過濾',
      '4. 按狀態過濾',
      '5. 測試複合條件搜尋'
    ],
    expectedResults: [
      '✅ 關鍵字搜尋準確',
      '✅ 分類過濾正確',
      '✅ 作者過濾正確',
      '✅ 狀態過濾正確',
      '✅ 複合搜尋結果正確'
    ],
    criticalPath: false
  },
  
  {
    id: 'performance-test',
    name: '效能測試',
    description: '測試系統效能和使用者體驗',
    steps: [
      '1. 測試頁面載入速度',
      '2. 測試大檔案上傳',
      '3. 測試同時多人編輯',
      '4. 測試行動裝置相容性',
      '5. 測試網路不穩定情況'
    ],
    expectedResults: [
      '✅ 頁面載入 < 3秒',
      '✅ 檔案上傳穩定',
      '✅ 多人協作無衝突',
      '✅ 行動裝置體驗良好',
      '✅ 網路問題處理得當'
    ],
    criticalPath: false
  }
];

/**
 * 生成測試報告模板
 */
async function generateTestReport() {
  log('📋 生成使用者驗收測試報告模板...', 'blue');
  
  const reportTemplate = `# 使用者驗收測試報告

## 測試概述

**測試日期**: ${new Date().toLocaleDateString('zh-TW')}
**測試版本**: v1.0.0
**測試環境**: 生產環境預覽
**測試人員**: [填寫測試人員姓名]

## 測試結果摘要

| 測試場景 | 狀態 | 關鍵路徑 | 備註 |
|---------|------|----------|------|
${testScenarios.map(scenario => 
  `| ${scenario.name} | ⏳ 待測試 | ${scenario.criticalPath ? '✅' : '❌'} | |`
).join('\n')}

## 詳細測試結果

${testScenarios.map(scenario => `
### ${scenario.name}

**測試 ID**: ${scenario.id}
**描述**: ${scenario.description}
**關鍵路徑**: ${scenario.criticalPath ? '是' : '否'}

#### 測試步驟
${scenario.steps.map(step => `- ${step}`).join('\n')}

#### 預期結果
${scenario.expectedResults.map(result => `- ${result}`).join('\n')}

#### 實際結果
- [ ] 測試通過
- [ ] 測試失敗
- [ ] 部分通過

**測試備註**:
[請填寫測試過程中的觀察和問題]

**問題記錄**:
- 問題描述:
- 嚴重程度: [低/中/高/嚴重]
- 重現步驟:
- 預期行為:
- 實際行為:

---
`).join('\n')}

## 使用者回饋

### 整體滿意度
- [ ] 非常滿意
- [ ] 滿意
- [ ] 普通
- [ ] 不滿意
- [ ] 非常不滿意

### CMS 使用體驗
**易用性評分**: ___/10
**功能完整性評分**: ___/10
**效能評分**: ___/10

**優點**:
- 

**缺點**:
- 

**改善建議**:
- 

### 工作流程評估
**審核流程評分**: ___/10
**協作體驗評分**: ___/10
**通知系統評分**: ___/10

**工作流程建議**:
- 

## 訓練需求評估

### 需要額外訓練的功能
- [ ] CMS 基本操作
- [ ] 圖片上傳和管理
- [ ] 多語言內容管理
- [ ] GitHub 審核流程
- [ ] 搜尋和過濾功能
- [ ] 其他: ___________

### 建議的訓練方式
- [ ] 線上教學影片
- [ ] 實體操作課程
- [ ] 一對一指導
- [ ] 書面操作手冊
- [ ] 其他: ___________

## 系統改善建議

### 高優先級改善項目
1. 
2. 
3. 

### 中優先級改善項目
1. 
2. 
3. 

### 低優先級改善項目
1. 
2. 
3. 

## 上線準備度評估

### 系統準備度
- [ ] 系統功能完整且穩定
- [ ] 效能符合要求
- [ ] 安全性措施到位
- [ ] 備份和恢復機制完善

### 團隊準備度
- [ ] 內容團隊已完成訓練
- [ ] 審核者了解工作流程
- [ ] 管理者熟悉系統操作
- [ ] 技術支援團隊準備就緒

### 流程準備度
- [ ] SOP 文件完整
- [ ] 應急處理流程明確
- [ ] 權限分配合理
- [ ] 監控機制運作正常

## 最終建議

**是否建議正式上線**: [ ] 是 [ ] 否 [ ] 需要修正後再評估

**上線前必須解決的問題**:
1. 
2. 
3. 

**測試人員簽名**: _______________
**日期**: ${new Date().toLocaleDateString('zh-TW')}

---

## 附錄

### 測試環境資訊
- **網站 URL**: https://ent-clinic-pro.pages.dev
- **CMS URL**: https://ent-clinic-pro.pages.dev/admin
- **GitHub Repository**: [Repository URL]
- **測試瀏覽器**: [Chrome/Firefox/Safari/Edge]
- **作業系統**: [Windows/macOS/Linux]

### 測試資料
- **測試帳號**: [測試用的 GitHub 帳號]
- **測試文章**: [使用的測試文章清單]
- **測試圖片**: [使用的測試圖片清單]
`;

  const reportPath = path.join(rootDir, 'USER_ACCEPTANCE_TEST_REPORT.md');
  await fs.writeFile(reportPath, reportTemplate);
  
  log('✅ 測試報告模板已生成', 'green');
  return reportPath;
}

/**
 * 生成測試檢查清單
 */
async function generateTestChecklist() {
  log('📝 生成測試檢查清單...', 'blue');
  
  const checklist = `# 使用者驗收測試檢查清單

## 測試前準備

### 環境檢查
- [ ] 測試環境可正常訪問
- [ ] CMS 管理介面可正常載入
- [ ] GitHub OAuth 設定正確
- [ ] 測試帳號權限設定完成

### 測試資料準備
- [ ] 準備測試用的文章內容
- [ ] 準備測試用的圖片檔案
- [ ] 準備不同專科的測試案例
- [ ] 準備多語言測試內容

### 測試人員準備
- [ ] 內容編輯人員已到位
- [ ] 審核人員已到位
- [ ] 管理人員已到位
- [ ] 技術支援人員待命

## 功能測試檢查清單

### CMS 基本功能
- [ ] 登入/登出功能正常
- [ ] 文章列表顯示正確
- [ ] 新增文章功能正常
- [ ] 編輯文章功能正常
- [ ] 刪除文章功能正常
- [ ] 圖片上傳功能正常
- [ ] 預覽功能正常

### 內容管理功能
- [ ] 專科分類選擇正確
- [ ] 文章狀態管理正常
- [ ] 作者資訊設定正確
- [ ] 標籤系統運作正常
- [ ] 發布日期設定正確
- [ ] SEO 設定功能正常

### 多語言功能
- [ ] 語言選擇器正常
- [ ] 多語言內容編輯正常
- [ ] 翻譯狀態追蹤正確
- [ ] 語言切換功能正常

### 工作流程功能
- [ ] PR 自動建立
- [ ] 審核者自動分配
- [ ] 品質檢查自動執行
- [ ] 審核評論功能正常
- [ ] 修改同步功能正常
- [ ] 自動部署功能正常

### 搜尋和過濾功能
- [ ] 關鍵字搜尋正確
- [ ] 專科過濾正確
- [ ] 作者過濾正確
- [ ] 狀態過濾正確
- [ ] 日期範圍過濾正確
- [ ] 複合條件搜尋正確

## 使用者體驗測試

### 易用性測試
- [ ] 介面直觀易懂
- [ ] 操作流程順暢
- [ ] 錯誤訊息清楚
- [ ] 幫助文件完整
- [ ] 快捷鍵功能正常

### 效能測試
- [ ] 頁面載入速度 < 3秒
- [ ] 圖片上傳速度合理
- [ ] 搜尋回應速度快
- [ ] 大量內容處理正常
- [ ] 同時多人使用穩定

### 相容性測試
- [ ] Chrome 瀏覽器正常
- [ ] Firefox 瀏覽器正常
- [ ] Safari 瀏覽器正常
- [ ] Edge 瀏覽器正常
- [ ] 行動裝置瀏覽正常
- [ ] 平板裝置瀏覽正常

## 安全性測試

### 權限控制
- [ ] 未授權使用者無法訪問 CMS
- [ ] 不同角色權限正確
- [ ] 敏感操作需要確認
- [ ] 登出後無法訪問

### 資料安全
- [ ] 資料傳輸加密
- [ ] 檔案上傳安全檢查
- [ ] 輸入資料驗證
- [ ] XSS 防護正常

## 整合測試

### GitHub 整合
- [ ] OAuth 認證正常
- [ ] PR 建立正常
- [ ] 檔案同步正常
- [ ] 分支管理正常

### Cloudflare Pages 整合
- [ ] 自動部署正常
- [ ] 預覽環境正常
- [ ] CDN 快取正常
- [ ] SSL 憑證正常

## 錯誤處理測試

### 網路問題
- [ ] 網路中斷處理
- [ ] 連線超時處理
- [ ] 檔案上傳失敗處理

### 系統錯誤
- [ ] 伺服器錯誤處理
- [ ] 資料庫錯誤處理
- [ ] 第三方服務錯誤處理

### 使用者錯誤
- [ ] 輸入格式錯誤處理
- [ ] 權限不足錯誤處理
- [ ] 操作衝突錯誤處理

## 測試完成確認

### 關鍵功能確認
- [ ] 所有關鍵路徑測試通過
- [ ] 重大問題已解決
- [ ] 效能符合要求
- [ ] 安全性檢查通過

### 文件確認
- [ ] 使用者手冊完整
- [ ] 操作指南清楚
- [ ] 故障排除文件完整
- [ ] 訓練材料準備完成

### 團隊確認
- [ ] 內容團隊滿意度達標
- [ ] 審核團隊接受度良好
- [ ] 管理團隊認可系統
- [ ] 技術團隊支援到位

---

**測試負責人**: _______________
**完成日期**: _______________
**最終評估**: [ ] 通過 [ ] 需要改善 [ ] 不通過
`;

  const checklistPath = path.join(rootDir, 'UAT_CHECKLIST.md');
  await fs.writeFile(checklistPath, checklist);
  
  log('✅ 測試檢查清單已生成', 'green');
  return checklistPath;
}

/**
 * 生成測試腳本
 */
async function generateTestScripts() {
  log('🔧 生成自動化測試腳本...', 'blue');
  
  const testScript = `#!/usr/bin/env node

/**
 * 自動化 UAT 測試腳本
 * 執行基本的功能驗證測試
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';

const config = {
  baseUrl: process.env.SITE_URL || 'http://localhost:4321',
  cmsUrl: process.env.SITE_URL ? process.env.SITE_URL + '/admin' : 'http://localhost:4321/admin',
  timeout: 30000,
  headless: process.env.HEADLESS !== 'false'
};

class UATTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: config.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runTest(testName, testFunction) {
    console.log(\`🧪 執行測試: \${testName}\`);
    
    try {
      const startTime = Date.now();
      await testFunction();
      const duration = Date.now() - startTime;
      
      this.results.push({
        name: testName,
        status: 'PASS',
        duration: duration,
        error: null
      });
      
      console.log(\`✅ \${testName} - 通過 (\${duration}ms)\`);
    } catch (error) {
      this.results.push({
        name: testName,
        status: 'FAIL',
        duration: 0,
        error: error.message
      });
      
      console.log(\`❌ \${testName} - 失敗: \${error.message}\`);
    }
  }

  async testHomePage() {
    await this.page.goto(config.baseUrl, { waitUntil: 'networkidle0' });
    
    // 檢查頁面標題
    const title = await this.page.title();
    if (!title || title.includes('Error')) {
      throw new Error('首頁載入失敗或標題異常');
    }
    
    // 檢查主要導覽
    const nav = await this.page.$('nav');
    if (!nav) {
      throw new Error('找不到主要導覽');
    }
    
    // 檢查語言切換器
    const langSwitcher = await this.page.$('[data-lang-switcher]');
    if (!langSwitcher) {
      console.warn('⚠️ 找不到語言切換器');
    }
  }

  async testCMSAccess() {
    await this.page.goto(config.cmsUrl, { waitUntil: 'networkidle0' });
    
    // 檢查 CMS 載入
    const cmsContainer = await this.page.$('#nc-root');
    if (!cmsContainer) {
      throw new Error('CMS 介面載入失敗');
    }
    
    // 檢查登入按鈕
    const loginButton = await this.page.$('button[type="button"]');
    if (!loginButton) {
      throw new Error('找不到登入按鈕');
    }
  }

  async testEducationPages() {
    await this.page.goto(\`\${config.baseUrl}/education\`, { waitUntil: 'networkidle0' });
    
    // 檢查文章列表
    const articles = await this.page.$$('[data-article-card]');
    if (articles.length === 0) {
      console.warn('⚠️ 沒有找到文章卡片');
    }
    
    // 檢查搜尋功能
    const searchInput = await this.page.$('input[type="search"]');
    if (!searchInput) {
      console.warn('⚠️ 找不到搜尋輸入框');
    }
    
    // 檢查過濾器
    const filters = await this.page.$('[data-filter-container]');
    if (!filters) {
      console.warn('⚠️ 找不到過濾器');
    }
  }

  async testSpecialtyPages() {
    const specialties = ['cardiology', 'neurology', 'pediatrics'];
    
    for (const specialty of specialties) {
      try {
        await this.page.goto(\`\${config.baseUrl}/specialties/\${specialty}\`, { 
          waitUntil: 'networkidle0' 
        });
        
        // 檢查專科頁面載入
        const specialtyContent = await this.page.$('[data-specialty-content]');
        if (!specialtyContent) {
          console.warn(\`⚠️ \${specialty} 專科頁面內容載入異常\`);
        }
      } catch (error) {
        console.warn(\`⚠️ \${specialty} 專科頁面測試失敗: \${error.message}\`);
      }
    }
  }

  async testPerformance() {
    // 測試首頁載入時間
    const startTime = Date.now();
    await this.page.goto(config.baseUrl, { waitUntil: 'load' });
    const loadTime = Date.now() - startTime;
    
    if (loadTime > 5000) {
      throw new Error(\`頁面載入時間過長: \${loadTime}ms\`);
    }
    
    // 檢查 Core Web Vitals
    const metrics = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcp = entries.find(entry => entry.entryType === 'largest-contentful-paint');
          resolve({
            lcp: lcp ? lcp.startTime : null,
            loadTime: performance.now()
          });
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // 如果 3 秒內沒有 LCP，返回基本指標
        setTimeout(() => {
          resolve({
            lcp: null,
            loadTime: performance.now()
          });
        }, 3000);
      });
    });
    
    console.log(\`📊 效能指標 - 載入時間: \${loadTime}ms, LCP: \${metrics.lcp || 'N/A'}ms\`);
  }

  async testAccessibility() {
    await this.page.goto(config.baseUrl, { waitUntil: 'networkidle0' });
    
    // 檢查基本的無障礙性
    const issues = await this.page.evaluate(() => {
      const issues = [];
      
      // 檢查圖片 alt 屬性
      const images = document.querySelectorAll('img');
      images.forEach((img, index) => {
        if (!img.alt && !img.getAttribute('aria-label')) {
          issues.push(\`圖片 \${index + 1} 缺少 alt 屬性\`);
        }
      });
      
      // 檢查標題結構
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      if (headings.length === 0) {
        issues.push('頁面缺少標題結構');
      }
      
      // 檢查連結文字
      const links = document.querySelectorAll('a');
      links.forEach((link, index) => {
        if (!link.textContent.trim() && !link.getAttribute('aria-label')) {
          issues.push(\`連結 \${index + 1} 缺少描述文字\`);
        }
      });
      
      return issues;
    });
    
    if (issues.length > 0) {
      console.warn('⚠️ 無障礙性問題:', issues);
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.status === 'PASS').length,
        failed: this.results.filter(r => r.status === 'FAIL').length
      },
      results: this.results
    };
    
    const reportPath = 'uat-test-results.json';
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\\n📊 測試結果摘要:');
    console.log(\`總測試數: \${report.summary.total}\`);
    console.log(\`通過: \${report.summary.passed}\`);
    console.log(\`失敗: \${report.summary.failed}\`);
    console.log(\`成功率: \${((report.summary.passed / report.summary.total) * 100).toFixed(1)}%\`);
    console.log(\`\\n詳細報告已儲存至: \${reportPath}\`);
    
    return report;
  }

  async runAllTests() {
    await this.init();
    
    try {
      await this.runTest('首頁載入測試', () => this.testHomePage());
      await this.runTest('CMS 訪問測試', () => this.testCMSAccess());
      await this.runTest('衛教頁面測試', () => this.testEducationPages());
      await this.runTest('專科頁面測試', () => this.testSpecialtyPages());
      await this.runTest('效能測試', () => this.testPerformance());
      await this.runTest('無障礙性測試', () => this.testAccessibility());
      
      return await this.generateReport();
    } finally {
      await this.cleanup();
    }
  }
}

// 執行測試
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  const tester = new UATTester();
  tester.runAllTests().catch(error => {
    console.error('❌ 測試執行失敗:', error);
    process.exit(1);
  });
}

export { UATTester };`;

  const scriptPath = path.join(rootDir, 'scripts/uat-automated-tests.js');
  await fs.writeFile(scriptPath, testScript);
  
  log('✅ 自動化測試腳本已生成', 'green');
  return scriptPath;
}

/**
 * 生成使用者回饋收集表單
 */
async function generateFeedbackForm() {
  log('📝 生成使用者回饋表單...', 'blue');
  
  const feedbackForm = `# 使用者回饋收集表單

## 基本資訊

**姓名**: _______________
**部門/角色**: _______________
**測試日期**: _______________
**使用時間**: _______________

## 功能評估

### CMS 使用體驗

1. **登入流程**
   - [ ] 非常容易  - [ ] 容易  - [ ] 普通  - [ ] 困難  - [ ] 非常困難
   - 建議: _______________

2. **文章編輯**
   - [ ] 非常容易  - [ ] 容易  - [ ] 普通  - [ ] 困難  - [ ] 非常困難
   - 建議: _______________

3. **圖片上傳**
   - [ ] 非常容易  - [ ] 容易  - [ ] 普通  - [ ] 困難  - [ ] 非常困難
   - 建議: _______________

4. **專科分類**
   - [ ] 非常清楚  - [ ] 清楚  - [ ] 普通  - [ ] 混亂  - [ ] 非常混亂
   - 建議: _______________

5. **預覽功能**
   - [ ] 非常有用  - [ ] 有用  - [ ] 普通  - [ ] 無用  - [ ] 非常無用
   - 建議: _______________

### 工作流程評估

6. **審核流程**
   - [ ] 非常順暢  - [ ] 順暢  - [ ] 普通  - [ ] 複雜  - [ ] 非常複雜
   - 建議: _______________

7. **協作體驗**
   - [ ] 非常好  - [ ] 好  - [ ] 普通  - [ ] 差  - [ ] 非常差
   - 建議: _______________

8. **通知系統**
   - [ ] 非常及時  - [ ] 及時  - [ ] 普通  - [ ] 延遲  - [ ] 非常延遲
   - 建議: _______________

### 系統效能

9. **載入速度**
   - [ ] 非常快  - [ ] 快  - [ ] 普通  - [ ] 慢  - [ ] 非常慢
   - 建議: _______________

10. **穩定性**
    - [ ] 非常穩定  - [ ] 穩定  - [ ] 普通  - [ ] 不穩定  - [ ] 非常不穩定
    - 建議: _______________

## 具體問題記錄

### 遇到的問題

**問題 1**:
- 描述: _______________
- 發生頻率: [ ] 總是  - [ ] 經常  - [ ] 偶爾  - [ ] 很少
- 影響程度: [ ] 嚴重  - [ ] 中等  - [ ] 輕微
- 建議解決方案: _______________

**問題 2**:
- 描述: _______________
- 發生頻率: [ ] 總是  - [ ] 經常  - [ ] 偶爾  - [ ] 很少
- 影響程度: [ ] 嚴重  - [ ] 中等  - [ ] 輕微
- 建議解決方案: _______________

**問題 3**:
- 描述: _______________
- 發生頻率: [ ] 總是  - [ ] 經常  - [ ] 偶爾  - [ ] 很少
- 影響程度: [ ] 嚴重  - [ ] 中等  - [ ] 輕微
- 建議解決方案: _______________

## 功能需求

### 希望新增的功能

1. _______________
2. _______________
3. _______________

### 希望改善的功能

1. _______________
2. _______________
3. _______________

### 希望移除的功能

1. _______________
2. _______________
3. _______________

## 訓練需求

### 需要額外說明的功能

- [ ] CMS 基本操作
- [ ] 圖片管理
- [ ] 多語言編輯
- [ ] 審核流程
- [ ] 搜尋功能
- [ ] 其他: _______________

### 偏好的學習方式

- [ ] 影片教學
- [ ] 實體課程
- [ ] 一對一指導
- [ ] 文字手冊
- [ ] 線上互動教學
- [ ] 其他: _______________

## 整體評價

### 滿意度評分

**整體滿意度**: ___/10
**推薦給同事的可能性**: ___/10

### 與舊系統比較

- [ ] 比舊系統好很多
- [ ] 比舊系統好一些
- [ ] 差不多
- [ ] 比舊系統差一些
- [ ] 比舊系統差很多

### 最喜歡的功能

1. _______________
2. _______________
3. _______________

### 最不喜歡的功能

1. _______________
2. _______________
3. _______________

## 建議和意見

### 系統改善建議

_______________
_______________
_______________

### 工作流程建議

_______________
_______________
_______________

### 其他意見

_______________
_______________
_______________

## 上線準備

### 您認為系統是否準備好正式上線？

- [ ] 是，可以立即上線
- [ ] 是，但需要小幅修正
- [ ] 否，需要重大改善
- [ ] 否，需要重新設計

### 上線前最重要的改善項目

1. _______________
2. _______________
3. _______________

---

**填寫日期**: _______________
**簽名**: _______________

感謝您的寶貴意見！`;

  const formPath = path.join(rootDir, 'USER_FEEDBACK_FORM.md');
  await fs.writeFile(formPath, feedbackForm);
  
  log('✅ 使用者回饋表單已生成', 'green');
  return formPath;
}

/**
 * 主要執行函數
 */
async function main() {
  log('🧪 開始設定使用者驗收測試...', 'blue');
  
  try {
    const reportPath = await generateTestReport();
    const checklistPath = await generateTestChecklist();
    const scriptPath = await generateTestScripts();
    const formPath = await generateFeedbackForm();
    
    log('🎉 使用者驗收測試設定完成！', 'green');
    log('', 'reset');
    log('📋 生成的檔案:', 'blue');
    log(`- 測試報告模板: ${reportPath}`, 'cyan');
    log(`- 測試檢查清單: ${checklistPath}`, 'cyan');
    log(`- 自動化測試腳本: ${scriptPath}`, 'cyan');
    log(`- 使用者回饋表單: ${formPath}`, 'cyan');
    log('', 'reset');
    log('📝 後續步驟:', 'blue');
    log('1. 安排內容團隊進行實際測試', 'yellow');
    log('2. 執行自動化測試腳本驗證基本功能', 'yellow');
    log('3. 收集使用者回饋並記錄問題', 'yellow');
    log('4. 根據測試結果調整系統和流程', 'yellow');
    log('5. 完成測試報告並評估上線準備度', 'yellow');
    
  } catch (error) {
    log(`❌ 設定失敗: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 執行腳本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as setupUserAcceptanceTesting };