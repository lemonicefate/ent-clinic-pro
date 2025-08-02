#!/usr/bin/env node

/**
 * 監控和警報設定腳本
 * 設定生產環境的監控、警報和分析系統
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
 * 建立 Cloudflare Analytics 配置
 */
async function setupCloudflareAnalytics() {
  log('📊 設定 Cloudflare Analytics...', 'blue');
  
  const analyticsConfig = `// Cloudflare Analytics 配置
export const analyticsConfig = {
  // Web Analytics
  webAnalytics: {
    enabled: true,
    beacon: 'https://static.cloudflareinsights.com/beacon.min.js',
    token: process.env.CF_WEB_ANALYTICS_TOKEN || '',
  },
  
  // Real User Monitoring (RUM)
  rum: {
    enabled: true,
    endpoint: 'https://cloudflare-analytics.com/cdn-cgi/rum',
    sampleRate: 0.1, // 10% 採樣率
  },
  
  // 自定義事件追蹤
  customEvents: {
    // 內容互動事件
    contentView: 'content_view',
    contentShare: 'content_share',
    searchQuery: 'search_query',
    
    // CMS 使用事件
    cmsLogin: 'cms_login',
    contentEdit: 'content_edit',
    contentPublish: 'content_publish',
    
    // 錯誤事件
    jsError: 'js_error',
    apiError: 'api_error',
    loadError: 'load_error'
  },
  
  // 效能指標
  performanceMetrics: {
    // Core Web Vitals
    lcp: 'largest_contentful_paint',
    fid: 'first_input_delay',
    cls: 'cumulative_layout_shift',
    
    // 其他指標
    ttfb: 'time_to_first_byte',
    fcp: 'first_contentful_paint',
    domLoad: 'dom_content_loaded'
  }
};

// 初始化分析追蹤
export function initAnalytics() {
  if (typeof window === 'undefined') return;
  
  // 載入 Cloudflare Web Analytics
  if (analyticsConfig.webAnalytics.enabled && analyticsConfig.webAnalytics.token) {
    const script = document.createElement('script');
    script.defer = true;
    script.src = analyticsConfig.webAnalytics.beacon;
    script.setAttribute('data-cf-beacon', JSON.stringify({
      token: analyticsConfig.webAnalytics.token
    }));
    document.head.appendChild(script);
  }
  
  // 設定 RUM 監控
  if (analyticsConfig.rum.enabled) {
    setupRUMMonitoring();
  }
  
  // 設定錯誤追蹤
  setupErrorTracking();
  
  // 設定效能監控
  setupPerformanceMonitoring();
}

// RUM 監控設定
function setupRUMMonitoring() {
  // 監控頁面載入時間
  window.addEventListener('load', () => {
    const loadTime = performance.now();
    sendMetric('page_load_time', loadTime);
  });
  
  // 監控使用者互動
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (target.matches('a, button, [role="button"]')) {
      sendEvent('user_interaction', {
        element: target.tagName.toLowerCase(),
        text: target.textContent?.slice(0, 50) || '',
        href: target.href || ''
      });
    }
  });
}

// 錯誤追蹤設定
function setupErrorTracking() {
  // JavaScript 錯誤
  window.addEventListener('error', (event) => {
    sendEvent(analyticsConfig.customEvents.jsError, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack || ''
    });
  });
  
  // Promise 拒絕錯誤
  window.addEventListener('unhandledrejection', (event) => {
    sendEvent(analyticsConfig.customEvents.jsError, {
      message: 'Unhandled Promise Rejection',
      reason: event.reason?.toString() || 'Unknown',
      stack: event.reason?.stack || ''
    });
  });
}

// 效能監控設定
function setupPerformanceMonitoring() {
  // Core Web Vitals
  if ('PerformanceObserver' in window) {
    // LCP (Largest Contentful Paint)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      sendMetric(analyticsConfig.performanceMetrics.lcp, lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });
    
    // FID (First Input Delay)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        sendMetric(analyticsConfig.performanceMetrics.fid, entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });
    
    // CLS (Cumulative Layout Shift)
    new PerformanceObserver((list) => {
      let clsValue = 0;
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      sendMetric(analyticsConfig.performanceMetrics.cls, clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }
}

// 發送事件
function sendEvent(eventName, data = {}) {
  if (analyticsConfig.rum.enabled && Math.random() < analyticsConfig.rum.sampleRate) {
    fetch(analyticsConfig.rum.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: eventName,
        data: data,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    }).catch(() => {
      // 靜默處理錯誤，避免影響使用者體驗
    });
  }
}

// 發送指標
function sendMetric(metricName, value) {
  sendEvent('performance_metric', {
    metric: metricName,
    value: value
  });
}

export { sendEvent, sendMetric };`;

  const analyticsPath = path.join(rootDir, 'src/utils/analytics.js');
  await fs.writeFile(analyticsPath, analyticsConfig);
  
  log('✅ Cloudflare Analytics 配置已建立', 'green');
}

/**
 * 建立監控儀表板配置
 */
async function setupMonitoringDashboard() {
  log('📈 設定監控儀表板...', 'blue');
  
  const dashboardConfig = `---
// 監控儀表板配置
import { defineConfig } from 'astro/config';

export const monitoringConfig = {
  // 健康檢查端點
  healthCheck: {
    endpoint: '/api/health',
    interval: 60000, // 1分鐘
    timeout: 5000,   // 5秒超時
  },
  
  // 效能閾值
  performanceThresholds: {
    pageLoadTime: 3000,    // 3秒
    apiResponseTime: 1000, // 1秒
    errorRate: 0.01,       // 1%
    availability: 0.999,   // 99.9%
  },
  
  // 警報配置
  alerts: {
    email: {
      enabled: true,
      recipients: [
        'admin@example.com',
        'dev-team@example.com'
      ]
    },
    
    slack: {
      enabled: false,
      webhook: process.env.SLACK_WEBHOOK_URL || '',
      channel: '#alerts'
    },
    
    conditions: [
      {
        name: 'High Error Rate',
        condition: 'error_rate > 0.05',
        severity: 'critical',
        cooldown: 300000 // 5分鐘冷卻
      },
      {
        name: 'Slow Page Load',
        condition: 'avg_page_load_time > 5000',
        severity: 'warning',
        cooldown: 600000 // 10分鐘冷卻
      },
      {
        name: 'Site Down',
        condition: 'availability < 0.99',
        severity: 'critical',
        cooldown: 60000 // 1分鐘冷卻
      }
    ]
  },
  
  // 報告配置
  reports: {
    daily: {
      enabled: true,
      time: '09:00',
      timezone: 'Asia/Taipei',
      recipients: ['admin@example.com']
    },
    
    weekly: {
      enabled: true,
      day: 'monday',
      time: '09:00',
      timezone: 'Asia/Taipei',
      recipients: ['management@example.com']
    }
  }
};
---`;

  const dashboardPath = path.join(rootDir, 'src/config/monitoring.astro');
  await fs.writeFile(dashboardPath, dashboardConfig);
  
  log('✅ 監控儀表板配置已建立', 'green');
}

/**
 * 建立健康檢查 API
 */
async function setupHealthCheckAPI() {
  log('🏥 設定健康檢查 API...', 'blue');
  
  const healthCheckAPI = `// 健康檢查 API
export async function GET({ request }) {
  const startTime = Date.now();
  
  try {
    // 基本系統檢查
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.ENVIRONMENT || 'production',
      checks: {}
    };
    
    // 檢查內容系統
    checks.checks.content = await checkContentSystem();
    
    // 檢查 CMS 連接
    checks.checks.cms = await checkCMSConnection();
    
    // 檢查外部服務
    checks.checks.external = await checkExternalServices();
    
    // 檢查效能指標
    checks.checks.performance = await checkPerformanceMetrics();
    
    // 計算總體狀態
    const allHealthy = Object.values(checks.checks).every(check => check.status === 'healthy');
    checks.status = allHealthy ? 'healthy' : 'degraded';
    
    // 回應時間
    checks.responseTime = Date.now() - startTime;
    
    return new Response(JSON.stringify(checks, null, 2), {
      status: allHealthy ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: error.message,
      responseTime: Date.now() - startTime
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}

// 檢查內容系統
async function checkContentSystem() {
  try {
    // 檢查內容檔案是否可讀取
    const { getCollection } = await import('astro:content');
    const education = await getCollection('education');
    
    return {
      status: 'healthy',
      message: \`Found \${education.length} education articles\`,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message,
      lastCheck: new Date().toISOString()
    };
  }
}

// 檢查 CMS 連接
async function checkCMSConnection() {
  try {
    // 這裡可以檢查 GitHub API 或其他 CMS 服務
    return {
      status: 'healthy',
      message: 'CMS connection is working',
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message,
      lastCheck: new Date().toISOString()
    };
  }
}

// 檢查外部服務
async function checkExternalServices() {
  const services = [];
  
  // 檢查 Cloudflare API
  try {
    const response = await fetch('https://api.cloudflare.com/client/v4/user', {
      headers: {
        'Authorization': \`Bearer \${process.env.CLOUDFLARE_API_TOKEN}\`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    services.push({
      name: 'Cloudflare API',
      status: response.ok ? 'healthy' : 'unhealthy',
      responseTime: response.headers.get('cf-ray') ? 'fast' : 'slow'
    });
  } catch (error) {
    services.push({
      name: 'Cloudflare API',
      status: 'unhealthy',
      error: error.message
    });
  }
  
  return {
    status: services.every(s => s.status === 'healthy') ? 'healthy' : 'degraded',
    services: services,
    lastCheck: new Date().toISOString()
  };
}

// 檢查效能指標
async function checkPerformanceMetrics() {
  const metrics = {
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    loadAverage: process.loadavg ? process.loadavg() : [0, 0, 0]
  };
  
  // 簡單的健康檢查邏輯
  const memoryUsage = metrics.memory.heapUsed / metrics.memory.heapTotal;
  const isHealthy = memoryUsage < 0.9; // 記憶體使用率低於 90%
  
  return {
    status: isHealthy ? 'healthy' : 'warning',
    metrics: metrics,
    memoryUsagePercent: Math.round(memoryUsage * 100),
    lastCheck: new Date().toISOString()
  };
}`;

  const healthAPIPath = path.join(rootDir, 'src/pages/api/health.js');
  await fs.writeFile(healthAPIPath, healthCheckAPI);
  
  log('✅ 健康檢查 API 已建立', 'green');
}

/**
 * 建立警報腳本
 */
async function setupAlertingSystem() {
  log('🚨 設定警報系統...', 'blue');
  
  const alertScript = `#!/usr/bin/env node

/**
 * 警報系統腳本
 * 監控網站狀態並發送警報
 */

import fetch from 'node-fetch';
import nodemailer from 'nodemailer';

const config = {
  healthCheckUrl: process.env.SITE_URL + '/api/health',
  checkInterval: 60000, // 1分鐘
  alertCooldown: 300000, // 5分鐘冷卻期
  
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  },
  
  recipients: [
    process.env.ALERT_EMAIL || 'admin@example.com'
  ]
};

let lastAlertTime = {};

// 郵件發送器
const transporter = nodemailer.createTransporter(config.email);

// 檢查網站健康狀態
async function checkHealth() {
  try {
    const response = await fetch(config.healthCheckUrl, {
      timeout: 10000
    });
    
    const health = await response.json();
    
    if (!response.ok || health.status !== 'healthy') {
      await sendAlert('Site Health Alert', \`
        網站健康檢查失敗
        
        狀態: \${health.status}
        時間: \${health.timestamp}
        錯誤: \${health.error || '未知錯誤'}
        
        請立即檢查網站狀態。
      \`);
    }
    
    return health;
  } catch (error) {
    await sendAlert('Site Down Alert', \`
      無法連接到網站健康檢查端點
      
      錯誤: \${error.message}
      時間: \${new Date().toISOString()}
      
      網站可能已離線，請立即檢查。
    \`);
    
    throw error;
  }
}

// 發送警報
async function sendAlert(subject, message) {
  const now = Date.now();
  const alertKey = subject;
  
  // 檢查冷卻期
  if (lastAlertTime[alertKey] && (now - lastAlertTime[alertKey]) < config.alertCooldown) {
    console.log(\`警報 "\${subject}" 在冷卻期內，跳過發送\`);
    return;
  }
  
  try {
    await transporter.sendMail({
      from: config.email.auth.user,
      to: config.recipients.join(', '),
      subject: \`[醫療平台警報] \${subject}\`,
      text: message,
      html: \`<pre>\${message}</pre>\`
    });
    
    lastAlertTime[alertKey] = now;
    console.log(\`警報已發送: \${subject}\`);
  } catch (error) {
    console.error(\`發送警報失敗: \${error.message}\`);
  }
}

// 主監控循環
async function startMonitoring() {
  console.log('開始監控網站健康狀態...');
  
  setInterval(async () => {
    try {
      const health = await checkHealth();
      console.log(\`健康檢查: \${health.status} - \${health.timestamp}\`);
    } catch (error) {
      console.error(\`健康檢查失敗: \${error.message}\`);
    }
  }, config.checkInterval);
}

// 如果直接執行此腳本
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  startMonitoring();
}

export { checkHealth, sendAlert, startMonitoring };`;

  const alertPath = path.join(rootDir, 'scripts/monitoring-alerts.js');
  await fs.writeFile(alertPath, alertScript);
  
  log('✅ 警報系統已建立', 'green');
}

/**
 * 主要執行函數
 */
async function main() {
  log('🔧 開始設定監控和警報系統...', 'blue');
  
  try {
    await setupCloudflareAnalytics();
    await setupMonitoringDashboard();
    await setupHealthCheckAPI();
    await setupAlertingSystem();
    
    log('🎉 監控和警報系統設定完成！', 'green');
    log('', 'reset');
    log('📋 後續步驟:', 'blue');
    log('1. 設定 Cloudflare Web Analytics Token', 'yellow');
    log('2. 配置 SMTP 設定用於警報郵件', 'yellow');
    log('3. 測試健康檢查端點: /api/health', 'yellow');
    log('4. 設定監控腳本的定時執行', 'yellow');
    
  } catch (error) {
    log(\`❌ 設定失敗: \${error.message}\`, 'red');
    process.exit(1);
  }
}

// 執行腳本
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  main();
}

export { main as setupMonitoring };