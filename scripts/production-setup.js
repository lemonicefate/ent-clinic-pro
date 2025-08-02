#!/usr/bin/env node

/**
 * 生產環境設定腳本
 * 用於初始化和配置生產環境所需的設定
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
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 檢查必要的環境變數
 */
async function checkEnvironmentVariables() {
  log('🔍 檢查環境變數...', 'blue');
  
  const requiredVars = [
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
    'SITE_URL'
  ];
  
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    log('❌ 缺少必要的環境變數:', 'red');
    missingVars.forEach(varName => {
      log(`  - ${varName}`, 'red');
    });
    log('\n請在 GitHub Secrets 中設定這些變數', 'yellow');
    return false;
  }
  
  log('✅ 環境變數檢查通過', 'green');
  return true;
}

/**
 * 驗證 Cloudflare Pages 配置
 */
async function validateCloudflareConfig() {
  log('🔍 驗證 Cloudflare Pages 配置...', 'blue');
  
  try {
    const wranglerPath = path.join(rootDir, 'wrangler.toml');
    const wranglerContent = await fs.readFile(wranglerPath, 'utf-8');
    
    // 檢查必要的配置項目
    const requiredConfigs = [
      'name = "astro-clinical-platform"',
      'pages_build_output_dir = "./dist"',
      'compatibility_date'
    ];
    
    for (const config of requiredConfigs) {
      if (!wranglerContent.includes(config.split('=')[0])) {
        log(`❌ wrangler.toml 缺少配置: ${config}`, 'red');
        return false;
      }
    }
    
    log('✅ Cloudflare Pages 配置驗證通過', 'green');
    return true;
  } catch (error) {
    log(`❌ 無法讀取 wrangler.toml: ${error.message}`, 'red');
    return false;
  }
}

/**
 * 檢查分支保護規則
 */
async function checkBranchProtection() {
  log('🔍 檢查分支保護規則...', 'blue');
  
  // 這裡可以使用 GitHub API 檢查分支保護規則
  // 目前只是提醒用戶手動設定
  
  log('⚠️ 請確保已設定以下分支保護規則:', 'yellow');
  log('  - main 分支需要 PR 審核', 'yellow');
  log('  - 需要狀態檢查通過', 'yellow');
  log('  - 需要分支為最新狀態', 'yellow');
  log('  - 管理員也需要遵守規則', 'yellow');
  
  return true;
}

/**
 * 驗證 CMS 配置
 */
async function validateCMSConfig() {
  log('🔍 驗證 CMS 配置...', 'blue');
  
  try {
    const cmsConfigPath = path.join(rootDir, 'public/admin/config.yml');
    const cmsConfig = await fs.readFile(cmsConfigPath, 'utf-8');
    
    // 檢查必要的 CMS 配置
    const requiredCMSConfigs = [
      'backend:',
      'name: github',
      'media_folder: "public/images"',
      'collections:'
    ];
    
    for (const config of requiredCMSConfigs) {
      if (!cmsConfig.includes(config)) {
        log(`❌ CMS 配置缺少: ${config}`, 'red');
        return false;
      }
    }
    
    log('✅ CMS 配置驗證通過', 'green');
    return true;
  } catch (error) {
    log(`❌ 無法讀取 CMS 配置: ${error.message}`, 'red');
    return false;
  }
}

/**
 * 檢查內容結構
 */
async function validateContentStructure() {
  log('🔍 檢查內容結構...', 'blue');
  
  const requiredDirs = [
    'src/content/education',
    'src/content/medical-specialties',
    'src/content/templates',
    'public/admin'
  ];
  
  for (const dir of requiredDirs) {
    const dirPath = path.join(rootDir, dir);
    try {
      await fs.access(dirPath);
      log(`✅ ${dir} 目錄存在`, 'green');
    } catch {
      log(`❌ ${dir} 目錄不存在`, 'red');
      return false;
    }
  }
  
  return true;
}

/**
 * 生成部署檢查清單
 */
async function generateDeploymentChecklist() {
  log('📋 生成部署檢查清單...', 'blue');
  
  const checklist = `# 生產環境部署檢查清單

## 部署前檢查

### 環境配置
- [ ] Cloudflare API Token 已設定
- [ ] Cloudflare Account ID 已設定
- [ ] SITE_URL 已設定
- [ ] GitHub Secrets 已配置

### 程式碼品質
- [ ] 所有測試通過
- [ ] 程式碼審核完成
- [ ] 內容格式驗證通過
- [ ] 無安全漏洞

### CMS 配置
- [ ] Decap CMS 配置正確
- [ ] GitHub OAuth 設定完成
- [ ] 內容模板已建立
- [ ] 審核者權限已設定

### 分支保護
- [ ] main 分支保護規則已啟用
- [ ] PR 審核要求已設定
- [ ] 狀態檢查要求已設定
- [ ] CODEOWNERS 檔案已配置

## 部署後檢查

### 功能驗證
- [ ] 網站可正常訪問
- [ ] CMS 管理介面可用
- [ ] 多語言切換正常
- [ ] 搜尋功能正常
- [ ] 圖片載入正常

### 效能檢查
- [ ] 頁面載入速度 < 3秒
- [ ] Lighthouse 分數 > 90
- [ ] 圖片優化正常
- [ ] CDN 快取正常

### SEO 和無障礙性
- [ ] Meta 標籤正確
- [ ] 結構化資料正確
- [ ] Alt 文字完整
- [ ] 鍵盤導覽正常

### 監控設定
- [ ] 錯誤監控已啟用
- [ ] 效能監控已啟用
- [ ] 使用者分析已設定
- [ ] 警報通知已配置

## 緊急回復計畫

### 回復步驟
1. 識別問題範圍
2. 回復到上一個穩定版本
3. 通知相關人員
4. 修復問題
5. 重新部署

### 聯絡資訊
- 技術負責人: [姓名] - [聯絡方式]
- 內容負責人: [姓名] - [聯絡方式]
- 系統管理員: [姓名] - [聯絡方式]

---
生成時間: ${new Date().toISOString()}
`;

  const checklistPath = path.join(rootDir, 'DEPLOYMENT_CHECKLIST.md');
  await fs.writeFile(checklistPath, checklist);
  
  log('✅ 部署檢查清單已生成', 'green');
}

/**
 * 主要執行函數
 */
async function main() {
  log('🚀 開始生產環境設定檢查...', 'blue');
  
  const checks = [
    checkEnvironmentVariables,
    validateCloudflareConfig,
    checkBranchProtection,
    validateCMSConfig,
    validateContentStructure
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    const result = await check();
    if (!result) {
      allPassed = false;
    }
    console.log(''); // 空行分隔
  }
  
  await generateDeploymentChecklist();
  
  if (allPassed) {
    log('🎉 所有檢查都通過！準備好進行生產部署', 'green');
    log('📋 請查看 DEPLOYMENT_CHECKLIST.md 進行最終確認', 'blue');
  } else {
    log('❌ 部分檢查未通過，請修正後再進行部署', 'red');
    process.exit(1);
  }
}

// 執行腳本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log(`❌ 執行錯誤: ${error.message}`, 'red');
    process.exit(1);
  });
}

export { main as setupProduction };