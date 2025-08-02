#!/usr/bin/env node

/**
 * 生產環境上線腳本
 * 執行正式的工作流程切換和系統監控設定
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

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
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 上線前最終檢查
 */
async function preLaunchChecks() {
  log('🔍 執行上線前最終檢查...', 'blue');
  
  const checks = [];
  
  // 檢查環境變數
  const requiredEnvVars = [
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
    'SITE_URL'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      checks.push({
        name: `環境變數 ${envVar}`,
        status: 'FAIL',
        message: '未設定'
      });
    } else {
      checks.push({
        name: `環境變數 ${envVar}`,
        status: 'PASS',
        message: '已設定'
      });
    }
  }
  
  // 檢查必要檔案
  const requiredFiles = [
    'wrangler.toml',
    'public/admin/config.yml',
    'src/content/config.ts',
    '.github/workflows/production-deploy.yml'
  ];
  
  for (const file of requiredFiles) {
    try {
      await fs.access(path.join(rootDir, file));
      checks.push({
        name: `檔案 ${file}`,
        status: 'PASS',
        message: '存在'
      });
    } catch {
      checks.push({
        name: `檔案 ${file}`,
        status: 'FAIL',
        message: '不存在'
      });
    }
  }
  
  // 檢查 Git 狀態
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim()) {
      checks.push({
        name: 'Git 工作目錄',
        status: 'WARN',
        message: '有未提交的變更'
      });
    } else {
      checks.push({
        name: 'Git 工作目錄',
        status: 'PASS',
        message: '乾淨'
      });
    }
  } catch (error) {
    checks.push({
      name: 'Git 狀態檢查',
      status: 'FAIL',
      message: error.message
    });
  }
  
  // 顯示檢查結果
  log('📋 檢查結果:', 'cyan');
  let hasFailures = false;
  
  for (const check of checks) {
    const statusColor = check.status === 'PASS' ? 'green' : 
                       check.status === 'WARN' ? 'yellow' : 'red';
    const statusIcon = check.status === 'PASS' ? '✅' : 
                      check.status === 'WARN' ? '⚠️' : '❌';
    
    log(`${statusIcon} ${check.name}: ${check.message}`, statusColor);
    
    if (check.status === 'FAIL') {
      hasFailures = true;
    }
  }
  
  if (hasFailures) {
    throw new Error('上線前檢查失敗，請修正問題後重試');
  }
  
  log('✅ 所有檢查通過', 'green');
}

/**
 * 執行最終建置
 */
async function finalBuild() {
  log('🔨 執行最終建置...', 'blue');
  
  try {
    // 清理舊的建置檔案
    log('🧹 清理舊的建置檔案...', 'cyan');
    try {
      await fs.rm(path.join(rootDir, 'dist'), { recursive: true, force: true });
    } catch {
      // 忽略清理錯誤
    }
    
    // 安裝依賴
    log('📦 安裝依賴...', 'cyan');
    execSync('npm ci', { cwd: rootDir, stdio: 'inherit' });
    
    // 執行測試
    log('🧪 執行測試...', 'cyan');
    execSync('npm test', { cwd: rootDir, stdio: 'inherit' });
    
    // 執行建置
    log('🏗️ 執行建置...', 'cyan');
    execSync('npm run build', { 
      cwd: rootDir, 
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    // 驗證建置結果
    const distPath = path.join(rootDir, 'dist');
    const distStats = await fs.stat(distPath);
    if (!distStats.isDirectory()) {
      throw new Error('建置目錄不存在');
    }
    
    const indexPath = path.join(distPath, 'index.html');
    await fs.access(indexPath);
    
    log('✅ 建置完成', 'green');
    
  } catch (error) {
    log(`❌ 建置失敗: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * 部署到生產環境
 */
async function deployToProduction() {
  log('🚀 部署到生產環境...', 'blue');
  
  try {
    // 使用 Wrangler 部署
    log('📤 上傳到 Cloudflare Pages...', 'cyan');
    execSync('npx wrangler pages deploy dist --project-name=astro-clinical-platform --branch=main', {
      cwd: rootDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
        CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID
      }
    });
    
    log('✅ 部署完成', 'green');
    
  } catch (error) {
    log(`❌ 部署失敗: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * 驗證部署
 */
async function verifyDeployment() {
  log('🔍 驗證部署...', 'blue');
  
  const siteUrl = process.env.SITE_URL || 'https://ent-clinic-pro.pages.dev';
  
  try {
    // 等待部署完成
    log('⏳ 等待部署完成...', 'cyan');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // 檢查網站可訪問性
    log('🌐 檢查網站可訪問性...', 'cyan');
    const response = await fetch(siteUrl);
    if (!response.ok) {
      throw new Error(`網站回應錯誤: ${response.status}`);
    }
    
    // 檢查 CMS 可訪問性
    log('🔧 檢查 CMS 可訪問性...', 'cyan');
    const cmsResponse = await fetch(`${siteUrl}/admin`);
    if (!cmsResponse.ok) {
      throw new Error(`CMS 回應錯誤: ${cmsResponse.status}`);
    }
    
    // 檢查健康檢查端點
    log('🏥 檢查健康檢查端點...', 'cyan');
    try {
      const healthResponse = await fetch(`${siteUrl}/api/health`);
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        log(`📊 系統狀態: ${health.status}`, 'cyan');
      }
    } catch {
      log('⚠️ 健康檢查端點不可用', 'yellow');
    }
    
    log('✅ 部署驗證通過', 'green');
    
  } catch (error) {
    log(`❌ 部署驗證失敗: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * 啟動監控系統
 */
async function startMonitoring() {
  log('📊 啟動監控系統...', 'blue');
  
  try {
    // 建立監控配置
    const monitoringConfig = {
      enabled: true,
      startTime: new Date().toISOString(),
      endpoints: [
        {
          name: 'Homepage',
          url: process.env.SITE_URL || 'https://ent-clinic-pro.pages.dev',
          interval: 300000, // 5分鐘
          timeout: 10000    // 10秒
        },
        {
          name: 'CMS Admin',
          url: `${process.env.SITE_URL || 'https://ent-clinic-pro.pages.dev'}/admin`,
          interval: 600000, // 10分鐘
          timeout: 15000    // 15秒
        },
        {
          name: 'Health Check',
          url: `${process.env.SITE_URL || 'https://ent-clinic-pro.pages.dev'}/api/health`,
          interval: 180000, // 3分鐘
          timeout: 5000     // 5秒
        }
      ],
      alerts: {
        email: {
          enabled: true,
          recipients: [
            process.env.ALERT_EMAIL || 'admin@example.com'
          ]
        },
        thresholds: {
          responseTime: 5000,  // 5秒
          errorRate: 0.05,     // 5%
          availability: 0.99   // 99%
        }
      }
    };
    
    const configPath = path.join(rootDir, 'monitoring-config.json');
    await fs.writeFile(configPath, JSON.stringify(monitoringConfig, null, 2));
    
    log('✅ 監控配置已建立', 'green');
    
    // 如果有監控腳本，啟動它
    try {
      const monitoringScript = path.join(rootDir, 'scripts/monitoring-alerts.js');
      await fs.access(monitoringScript);
      
      log('🚨 啟動監控警報系統...', 'cyan');
      // 這裡可以啟動監控程序，或者提供啟動指令
      log('💡 請執行以下命令啟動監控:', 'yellow');
      log('   node scripts/monitoring-alerts.js', 'yellow');
      
    } catch {
      log('⚠️ 監控腳本不存在，請手動設定監控', 'yellow');
    }
    
  } catch (error) {
    log(`❌ 監控系統啟動失敗: ${error.message}`, 'red');
    // 監控失敗不應該阻止上線
  }
}

/**
 * 建立上線記錄
 */
async function createLaunchRecord() {
  log('📝 建立上線記錄...', 'blue');
  
  try {
    const launchRecord = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: 'production',
      deployedBy: process.env.USER || process.env.USERNAME || 'unknown',
      gitCommit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
      gitBranch: execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim(),
      siteUrl: process.env.SITE_URL || 'https://ent-clinic-pro.pages.dev',
      features: [
        'Decap CMS 整合',
        'GitHub 工作流程',
        'Cloudflare Pages 部署',
        '多語言支援',
        '內容搜尋和過濾',
        '效能監控',
        '品質檢查自動化'
      ],
      metrics: {
        totalArticles: 0, // 這裡可以從實際內容計算
        supportedLanguages: 3,
        medicalSpecialties: 5,
        automatedChecks: 8
      },
      contacts: {
        technical: 'dev-team@example.com',
        content: 'content-team@example.com',
        admin: 'admin@example.com'
      }
    };
    
    // 儲存上線記錄
    const recordPath = path.join(rootDir, 'LAUNCH_RECORD.json');
    await fs.writeFile(recordPath, JSON.stringify(launchRecord, null, 2));
    
    // 更新部署歷史
    const historyEntry = `
## 正式上線 - ${new Date().toLocaleDateString('zh-TW')}

**版本**: ${launchRecord.version}
**時間**: ${launchRecord.timestamp}
**提交**: ${launchRecord.gitCommit}
**部署者**: ${launchRecord.deployedBy}

### 主要功能
${launchRecord.features.map(feature => `- ${feature}`).join('\n')}

### 系統指標
- 支援語言: ${launchRecord.metrics.supportedLanguages} 種
- 醫療專科: ${launchRecord.metrics.medicalSpecialties} 個
- 自動化檢查: ${launchRecord.metrics.automatedChecks} 項

---
`;
    
    const historyPath = path.join(rootDir, 'DEPLOYMENT_HISTORY.md');
    try {
      const existingHistory = await fs.readFile(historyPath, 'utf8');
      await fs.writeFile(historyPath, historyEntry + existingHistory);
    } catch {
      await fs.writeFile(historyPath, `# 部署歷史\n${historyEntry}`);
    }
    
    log('✅ 上線記錄已建立', 'green');
    
  } catch (error) {
    log(`❌ 建立上線記錄失敗: ${error.message}`, 'red');
    // 記錄失敗不應該阻止上線
  }
}

/**
 * 發送上線通知
 */
async function sendLaunchNotification() {
  log('📢 發送上線通知...', 'blue');
  
  const siteUrl = process.env.SITE_URL || 'https://ent-clinic-pro.pages.dev';
  
  const notification = `
🎉 醫療衛教內容管理系統正式上線！

📊 系統資訊:
- 網站: ${siteUrl}
- CMS 管理: ${siteUrl}/admin
- 健康檢查: ${siteUrl}/api/health

🚀 主要功能:
- ✅ Decap CMS 視覺化編輯
- ✅ GitHub 審核工作流程
- ✅ 多語言內容支援
- ✅ 自動化品質檢查
- ✅ 即時預覽和部署
- ✅ 效能監控和分析

👥 聯絡資訊:
- 技術支援: dev-team@example.com
- 內容管理: content-team@example.com
- 系統管理: admin@example.com

📚 相關文件:
- 使用者手冊: ${siteUrl}/docs/user-guide
- 管理者指南: ${siteUrl}/docs/admin-guide
- 故障排除: ${siteUrl}/docs/troubleshooting

🔧 後續步驟:
1. 內容團隊開始使用 CMS 建立內容
2. 審核者熟悉 GitHub 審核流程
3. 管理者監控系統運作狀況
4. 定期檢查效能和使用者回饋

祝使用愉快！🎊
`;
  
  log(notification, 'cyan');
  
  // 這裡可以整合實際的通知系統（如 Slack、Email 等）
  log('💡 請將上述通知發送給相關團隊成員', 'yellow');
}

/**
 * 建立持續改善計畫
 */
async function createImprovementPlan() {
  log('📈 建立持續改善計畫...', 'blue');
  
  const improvementPlan = `# 持續改善計畫

## 短期目標 (1-3個月)

### 使用者體驗優化
- [ ] 收集使用者回饋並分析使用模式
- [ ] 優化 CMS 介面的易用性
- [ ] 改善行動裝置使用體驗
- [ ] 加強錯誤訊息的清晰度

### 功能增強
- [ ] 新增批次操作功能
- [ ] 實作內容版本比較
- [ ] 加強搜尋功能的準確性
- [ ] 新增內容統計和分析

### 效能優化
- [ ] 優化圖片載入和壓縮
- [ ] 實作更智能的快取策略
- [ ] 減少首次載入時間
- [ ] 優化 SEO 表現

## 中期目標 (3-6個月)

### 進階功能
- [ ] 實作內容排程發布
- [ ] 新增協作編輯功能
- [ ] 建立內容模板系統
- [ ] 實作自動翻譯建議

### 整合擴展
- [ ] 整合更多第三方服務
- [ ] 實作 API 接口
- [ ] 建立 Webhook 系統
- [ ] 新增更多分析工具

### 自動化改善
- [ ] 增強品質檢查規則
- [ ] 實作智能內容建議
- [ ] 自動化更多工作流程
- [ ] 改善監控和警報系統

## 長期目標 (6-12個月)

### 架構升級
- [ ] 評估後端系統遷移
- [ ] 實作微服務架構
- [ ] 建立 CDN 優化策略
- [ ] 實作多區域部署

### 進階分析
- [ ] 建立使用者行為分析
- [ ] 實作 A/B 測試框架
- [ ] 建立預測性分析
- [ ] 實作個人化推薦

### 生態系統
- [ ] 建立開發者 API
- [ ] 實作插件系統
- [ ] 建立社群功能
- [ ] 實作知識庫系統

## 監控指標

### 技術指標
- 頁面載入時間 < 2秒
- 系統可用性 > 99.9%
- 錯誤率 < 0.1%
- API 回應時間 < 500ms

### 業務指標
- 使用者滿意度 > 4.5/5
- 內容發布效率提升 50%
- 審核時間縮短 30%
- 搜尋成功率 > 95%

### 使用者指標
- 月活躍使用者成長 20%
- 內容互動率提升 25%
- 使用者留存率 > 90%
- 支援請求減少 40%

## 回饋機制

### 定期檢討
- 每週技術團隊檢討會議
- 每月使用者回饋收集
- 每季系統效能評估
- 每半年功能規劃會議

### 改善流程
1. 問題識別和優先級排序
2. 解決方案設計和評估
3. 開發和測試實作
4. 部署和效果監控
5. 結果評估和經驗總結

### 溝通管道
- 使用者回饋表單
- 定期滿意度調查
- 技術支援統計
- 社群討論平台

---

**建立日期**: ${new Date().toLocaleDateString('zh-TW')}
**負責人**: 技術團隊
**審核人**: 專案經理
**更新頻率**: 每月檢討更新
`;

  const planPath = path.join(rootDir, 'IMPROVEMENT_PLAN.md');
  await fs.writeFile(planPath, improvementPlan);
  
  log('✅ 持續改善計畫已建立', 'green');
}

/**
 * 主要執行函數
 */
async function main() {
  log('🚀 開始生產環境上線流程...', 'magenta');
  log('', 'reset');
  
  try {
    // 執行上線流程
    await preLaunchChecks();
    log('', 'reset');
    
    await finalBuild();
    log('', 'reset');
    
    await deployToProduction();
    log('', 'reset');
    
    await verifyDeployment();
    log('', 'reset');
    
    await startMonitoring();
    log('', 'reset');
    
    await createLaunchRecord();
    log('', 'reset');
    
    await createImprovementPlan();
    log('', 'reset');
    
    await sendLaunchNotification();
    log('', 'reset');
    
    log('🎉 生產環境上線完成！', 'green');
    log('', 'reset');
    log('📋 後續工作提醒:', 'blue');
    log('1. 監控系統運作狀況', 'yellow');
    log('2. 收集使用者回饋', 'yellow');
    log('3. 定期檢查效能指標', 'yellow');
    log('4. 執行持續改善計畫', 'yellow');
    log('5. 維護系統文件更新', 'yellow');
    
  } catch (error) {
    log(`❌ 上線流程失敗: ${error.message}`, 'red');
    log('', 'reset');
    log('🔧 請檢查錯誤並修正後重試', 'yellow');
    process.exit(1);
  }
}

// 執行腳本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as launchProduction };