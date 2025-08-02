#!/usr/bin/env node

/**
 * 上線後監控腳本
 * 持續監控系統狀態、收集指標和管理回饋
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
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 系統健康監控
 */
class SystemHealthMonitor {
  constructor() {
    this.siteUrl = process.env.SITE_URL || 'https://ent-clinic-pro.pages.dev';
    this.checkInterval = 5 * 60 * 1000; // 5分鐘
    this.metrics = {
      uptime: 0,
      responseTime: [],
      errors: [],
      lastCheck: null
    };
  }

  async checkHealth() {
    const startTime = Date.now();
    
    try {
      // 檢查主頁
      const response = await fetch(this.siteUrl, { timeout: 10000 });
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // 記錄成功指標
      this.metrics.responseTime.push({
        timestamp: new Date().toISOString(),
        value: responseTime,
        endpoint: 'homepage'
      });
      
      // 保持最近100次記錄
      if (this.metrics.responseTime.length > 100) {
        this.metrics.responseTime = this.metrics.responseTime.slice(-100);
      }
      
      this.metrics.uptime++;
      this.metrics.lastCheck = new Date().toISOString();
      
      log(`✅ 健康檢查通過 - 回應時間: ${responseTime}ms`, 'green');
      
      return {
        status: 'healthy',
        responseTime: responseTime,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      // 記錄錯誤
      this.metrics.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        endpoint: 'homepage'
      });
      
      // 保持最近50次錯誤記錄
      if (this.metrics.errors.length > 50) {
        this.metrics.errors = this.metrics.errors.slice(-50);
      }
      
      log(`❌ 健康檢查失敗: ${error.message}`, 'red');
      
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkCMS() {
    try {
      const response = await fetch(`${this.siteUrl}/admin`, { timeout: 15000 });
      
      if (!response.ok) {
        throw new Error(`CMS HTTP ${response.status}: ${response.statusText}`);
      }
      
      log('✅ CMS 檢查通過', 'green');
      return { status: 'healthy' };
      
    } catch (error) {
      log(`❌ CMS 檢查失敗: ${error.message}`, 'red');
      return { status: 'unhealthy', error: error.message };
    }
  }

  async checkAPI() {
    try {
      const response = await fetch(`${this.siteUrl}/api/health`, { timeout: 5000 });
      
      if (!response.ok) {
        throw new Error(`API HTTP ${response.status}: ${response.statusText}`);
      }
      
      const health = await response.json();
      log(`✅ API 檢查通過 - 狀態: ${health.status}`, 'green');
      
      return health;
      
    } catch (error) {
      log(`❌ API 檢查失敗: ${error.message}`, 'red');
      return { status: 'unhealthy', error: error.message };
    }
  }

  getMetricsSummary() {
    const recentResponseTimes = this.metrics.responseTime.slice(-10);
    const avgResponseTime = recentResponseTimes.length > 0 
      ? recentResponseTimes.reduce((sum, m) => sum + m.value, 0) / recentResponseTimes.length 
      : 0;
    
    const recentErrors = this.metrics.errors.filter(
      e => new Date(e.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    return {
      uptime: this.metrics.uptime,
      avgResponseTime: Math.round(avgResponseTime),
      recentErrors: recentErrors.length,
      lastCheck: this.metrics.lastCheck,
      totalChecks: this.metrics.responseTime.length + this.metrics.errors.length
    };
  }
}

/**
 * 使用者回饋收集器
 */
class FeedbackCollector {
  constructor() {
    this.feedbackFile = path.join(rootDir, 'user-feedback.json');
  }

  async collectFeedback() {
    log('📝 收集使用者回饋...', 'blue');
    
    try {
      // 檢查是否有新的回饋檔案
      const feedbackFiles = [
        'USER_FEEDBACK_FORM.md',
        'USER_ACCEPTANCE_TEST_REPORT.md'
      ];
      
      const feedback = {
        timestamp: new Date().toISOString(),
        sources: []
      };
      
      for (const file of feedbackFiles) {
        const filePath = path.join(rootDir, file);
        try {
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf8');
          
          feedback.sources.push({
            file: file,
            lastModified: stats.mtime.toISOString(),
            size: stats.size,
            hasContent: content.length > 1000
          });
        } catch {
          // 檔案不存在，跳過
        }
      }
      
      // 儲存回饋摘要
      await fs.writeFile(this.feedbackFile, JSON.stringify(feedback, null, 2));
      
      log(`✅ 回饋收集完成 - 找到 ${feedback.sources.length} 個來源`, 'green');
      
      return feedback;
      
    } catch (error) {
      log(`❌ 回饋收集失敗: ${error.message}`, 'red');
      return null;
    }
  }

  async analyzeFeedback() {
    try {
      const feedback = JSON.parse(await fs.readFile(this.feedbackFile, 'utf8'));
      
      const analysis = {
        timestamp: new Date().toISOString(),
        totalSources: feedback.sources.length,
        recentUpdates: feedback.sources.filter(
          s => new Date(s.lastModified) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        recommendations: []
      };
      
      // 基於回饋生成建議
      if (analysis.recentUpdates > 0) {
        analysis.recommendations.push('有新的使用者回饋，建議進行檢視和分析');
      }
      
      if (analysis.totalSources === 0) {
        analysis.recommendations.push('缺少使用者回饋，建議主動收集使用者意見');
      }
      
      return analysis;
      
    } catch (error) {
      log(`⚠️ 回饋分析失敗: ${error.message}`, 'yellow');
      return null;
    }
  }
}

/**
 * 效能指標收集器
 */
class PerformanceCollector {
  constructor() {
    this.metricsFile = path.join(rootDir, 'performance-metrics.json');
  }

  async collectMetrics() {
    log('📊 收集效能指標...', 'blue');
    
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        site: {
          url: process.env.SITE_URL || 'https://ent-clinic-pro.pages.dev',
          status: 'unknown'
        },
        performance: {},
        resources: {}
      };
      
      // 檢查網站狀態
      try {
        const startTime = Date.now();
        const response = await fetch(metrics.site.url);
        const loadTime = Date.now() - startTime;
        
        metrics.site.status = response.ok ? 'online' : 'error';
        metrics.performance.loadTime = loadTime;
        metrics.performance.httpStatus = response.status;
        
      } catch (error) {
        metrics.site.status = 'offline';
        metrics.performance.error = error.message;
      }
      
      // 收集系統資源使用情況
      if (typeof process !== 'undefined') {
        const memUsage = process.memoryUsage();
        metrics.resources = {
          memory: {
            used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
            total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
            external: Math.round(memUsage.external / 1024 / 1024) // MB
          },
          uptime: Math.round(process.uptime()) // seconds
        };
      }
      
      // 儲存指標
      await fs.writeFile(this.metricsFile, JSON.stringify(metrics, null, 2));
      
      log(`✅ 效能指標收集完成 - 載入時間: ${metrics.performance.loadTime || 'N/A'}ms`, 'green');
      
      return metrics;
      
    } catch (error) {
      log(`❌ 效能指標收集失敗: ${error.message}`, 'red');
      return null;
    }
  }

  async generateReport() {
    try {
      const metrics = JSON.parse(await fs.readFile(this.metricsFile, 'utf8'));
      
      const report = `# 效能監控報告

## 基本資訊
- **生成時間**: ${new Date().toLocaleString('zh-TW')}
- **網站狀態**: ${metrics.site.status}
- **網站 URL**: ${metrics.site.url}

## 效能指標
- **頁面載入時間**: ${metrics.performance.loadTime || 'N/A'} ms
- **HTTP 狀態**: ${metrics.performance.httpStatus || 'N/A'}
${metrics.performance.error ? `- **錯誤**: ${metrics.performance.error}` : ''}

## 系統資源
${metrics.resources ? `
- **記憶體使用**: ${metrics.resources.memory.used} MB / ${metrics.resources.memory.total} MB
- **外部記憶體**: ${metrics.resources.memory.external} MB
- **運行時間**: ${Math.floor(metrics.resources.uptime / 3600)}h ${Math.floor((metrics.resources.uptime % 3600) / 60)}m
` : '- 系統資源資訊不可用'}

## 建議
${this.generateRecommendations(metrics)}

---
*此報告由自動化監控系統生成*
`;

      const reportPath = path.join(rootDir, 'PERFORMANCE_REPORT.md');
      await fs.writeFile(reportPath, report);
      
      return reportPath;
      
    } catch (error) {
      log(`❌ 效能報告生成失敗: ${error.message}`, 'red');
      return null;
    }
  }

  generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.site.status === 'offline') {
      recommendations.push('🚨 網站離線，需要立即檢查');
    } else if (metrics.site.status === 'error') {
      recommendations.push('⚠️ 網站回應異常，建議檢查伺服器狀態');
    }
    
    if (metrics.performance.loadTime > 3000) {
      recommendations.push('🐌 頁面載入時間過長，建議優化效能');
    } else if (metrics.performance.loadTime > 1000) {
      recommendations.push('⏱️ 頁面載入時間可以進一步優化');
    }
    
    if (metrics.resources && metrics.resources.memory.used / metrics.resources.memory.total > 0.8) {
      recommendations.push('💾 記憶體使用率較高，建議監控');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ 系統運行正常，繼續保持監控');
    }
    
    return recommendations.map(r => `- ${r}`).join('\n');
  }
}

/**
 * 主監控管理器
 */
class PostLaunchMonitor {
  constructor() {
    this.healthMonitor = new SystemHealthMonitor();
    this.feedbackCollector = new FeedbackCollector();
    this.performanceCollector = new PerformanceCollector();
    this.isRunning = false;
  }

  async runSingleCheck() {
    log('🔍 執行單次監控檢查...', 'blue');
    
    try {
      // 健康檢查
      const health = await this.healthMonitor.checkHealth();
      const cms = await this.healthMonitor.checkCMS();
      const api = await this.healthMonitor.checkAPI();
      
      // 效能指標
      const performance = await this.performanceCollector.collectMetrics();
      
      // 使用者回饋
      const feedback = await this.feedbackCollector.collectFeedback();
      
      // 生成摘要
      const summary = {
        timestamp: new Date().toISOString(),
        health: {
          site: health.status,
          cms: cms.status,
          api: api.status
        },
        performance: performance ? {
          loadTime: performance.performance.loadTime,
          status: performance.site.status
        } : null,
        feedback: feedback ? {
          sources: feedback.sources.length
        } : null,
        metrics: this.healthMonitor.getMetricsSummary()
      };
      
      log('📊 監控摘要:', 'cyan');
      log(`- 網站健康: ${summary.health.site}`, summary.health.site === 'healthy' ? 'green' : 'red');
      log(`- CMS 狀態: ${summary.health.cms}`, summary.health.cms === 'healthy' ? 'green' : 'red');
      log(`- API 狀態: ${summary.health.api}`, summary.health.api === 'healthy' ? 'green' : 'red');
      log(`- 平均回應時間: ${summary.metrics.avgResponseTime}ms`, 'cyan');
      log(`- 總檢查次數: ${summary.metrics.totalChecks}`, 'cyan');
      log(`- 近期錯誤: ${summary.metrics.recentErrors}`, summary.metrics.recentErrors > 0 ? 'yellow' : 'green');
      
      return summary;
      
    } catch (error) {
      log(`❌ 監控檢查失敗: ${error.message}`, 'red');
      throw error;
    }
  }

  async startContinuousMonitoring() {
    log('🚀 啟動持續監控...', 'magenta');
    
    this.isRunning = true;
    
    while (this.isRunning) {
      try {
        await this.runSingleCheck();
        
        // 等待下次檢查
        log(`⏳ 等待 ${this.healthMonitor.checkInterval / 1000} 秒後進行下次檢查...`, 'yellow');
        await new Promise(resolve => setTimeout(resolve, this.healthMonitor.checkInterval));
        
      } catch (error) {
        log(`❌ 監控循環錯誤: ${error.message}`, 'red');
        
        // 錯誤時等待較短時間後重試
        await new Promise(resolve => setTimeout(resolve, 60000)); // 1分鐘
      }
    }
  }

  stop() {
    log('⏹️ 停止監控...', 'yellow');
    this.isRunning = false;
  }

  async generateDailyReport() {
    log('📋 生成每日監控報告...', 'blue');
    
    try {
      const performanceReport = await this.performanceCollector.generateReport();
      const feedbackAnalysis = await this.feedbackCollector.analyzeFeedback();
      const healthSummary = this.healthMonitor.getMetricsSummary();
      
      const dailyReport = `# 每日監控報告 - ${new Date().toLocaleDateString('zh-TW')}

## 系統健康摘要
- **總檢查次數**: ${healthSummary.totalChecks}
- **成功檢查**: ${healthSummary.uptime}
- **平均回應時間**: ${healthSummary.avgResponseTime} ms
- **近期錯誤**: ${healthSummary.recentErrors}
- **最後檢查**: ${healthSummary.lastCheck}

## 使用者回饋狀況
${feedbackAnalysis ? `
- **回饋來源**: ${feedbackAnalysis.totalSources}
- **近期更新**: ${feedbackAnalysis.recentUpdates}
- **建議事項**: 
${feedbackAnalysis.recommendations.map(r => `  - ${r}`).join('\n')}
` : '- 回饋分析不可用'}

## 效能指標
${performanceReport ? `詳細效能報告已生成: ${performanceReport}` : '效能報告生成失敗'}

## 今日重點
- [ ] 檢查系統錯誤日誌
- [ ] 回覆使用者回饋
- [ ] 監控效能趨勢
- [ ] 更新改善計畫

## 明日計畫
- [ ] 繼續監控系統穩定性
- [ ] 分析使用者行為數據
- [ ] 準備週報摘要
- [ ] 檢查安全更新

---
*報告生成時間: ${new Date().toLocaleString('zh-TW')}*
`;

      const reportPath = path.join(rootDir, `DAILY_REPORT_${new Date().toISOString().split('T')[0]}.md`);
      await fs.writeFile(reportPath, dailyReport);
      
      log(`✅ 每日報告已生成: ${reportPath}`, 'green');
      
      return reportPath;
      
    } catch (error) {
      log(`❌ 每日報告生成失敗: ${error.message}`, 'red');
      return null;
    }
  }
}

/**
 * 主要執行函數
 */
async function main() {
  const monitor = new PostLaunchMonitor();
  
  // 處理命令行參數
  const args = process.argv.slice(2);
  const command = args[0] || 'check';
  
  try {
    switch (command) {
      case 'check':
        log('🔍 執行單次監控檢查', 'blue');
        await monitor.runSingleCheck();
        break;
        
      case 'monitor':
        log('🚀 啟動持續監控模式', 'magenta');
        
        // 處理優雅關閉
        process.on('SIGINT', () => {
          log('\n⏹️ 收到中斷信號，正在停止監控...', 'yellow');
          monitor.stop();
          process.exit(0);
        });
        
        await monitor.startContinuousMonitoring();
        break;
        
      case 'report':
        log('📋 生成每日監控報告', 'blue');
        await monitor.generateDailyReport();
        break;
        
      default:
        log('❓ 未知命令，可用命令:', 'yellow');
        log('  - check: 執行單次檢查', 'cyan');
        log('  - monitor: 啟動持續監控', 'cyan');
        log('  - report: 生成每日報告', 'cyan');
        break;
    }
    
  } catch (error) {
    log(`❌ 執行失敗: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 執行腳本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { PostLaunchMonitor };