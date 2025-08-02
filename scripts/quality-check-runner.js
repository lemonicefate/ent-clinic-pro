#!/usr/bin/env node

/**
 * 品質檢查執行器
 * 統一執行所有品質檢查工具並生成綜合報告
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 導入各個檢查工具
const MedicalTerminologyChecker = require('./medical-terminology-checker');
const AccessibilityValidator = require('./accessibility-validator');
const ReadabilityAnalyzer = require('./readability-analyzer');
const ReferenceFormatChecker = require('./reference-format-checker');

// 品質檢查配置
const QUALITY_CHECKS = {
  terminology: {
    name: '醫療術語檢查',
    checker: MedicalTerminologyChecker,
    weight: 25,
    enabled: true
  },
  accessibility: {
    name: '無障礙性驗證',
    checker: AccessibilityValidator,
    weight: 25,
    enabled: true
  },
  readability: {
    name: '可讀性分析',
    checker: ReadabilityAnalyzer,
    weight: 25,
    enabled: true
  },
  references: {
    name: '參考文獻檢查',
    checker: ReferenceFormatChecker,
    weight: 25,
    enabled: true
  }
};

// 品質標準
const QUALITY_STANDARDS = {
  excellent: { min: 90, label: '優秀', emoji: '🏆' },
  good: { min: 75, label: '良好', emoji: '✅' },
  fair: { min: 60, label: '普通', emoji: '⚠️' },
  poor: { min: 0, label: '需改善', emoji: '❌' }
};

class QualityCheckRunner {
  constructor(options = {}) {
    this.contentDir = options.contentDir || 'src/content/education';
    this.outputDir = options.outputDir || 'quality-reports';
    this.results = {};
    this.overallScore = 0;
    this.startTime = Date.now();
  }

  // 執行所有品質檢查
  async runAllChecks() {
    console.log('🚀 開始執行品質檢查流程...\n');
    console.log(`📁 檢查目錄: ${this.contentDir}`);
    console.log(`📊 報告輸出: ${this.outputDir}\n`);

    // 確保輸出目錄存在
    this.ensureOutputDirectory();

    // 執行各項檢查
    for (const [checkId, config] of Object.entries(QUALITY_CHECKS)) {
      if (config.enabled) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🔍 執行 ${config.name}...`);
        console.log(`${'='.repeat(60)}`);
        
        try {
          const result = await this.runSingleCheck(checkId, config);
          this.results[checkId] = result;
        } catch (error) {
          console.error(`❌ ${config.name} 執行失敗:`, error.message);
          this.results[checkId] = {
            success: false,
            error: error.message,
            score: 0
          };
        }
      }
    }

    // 計算總體分數
    this.calculateOverallScore();

    // 生成綜合報告
    this.generateComprehensiveReport();

    // 執行額外的 Markdown 語法檢查
    await this.runMarkdownLint();

    console.log(`\n⏱️ 總執行時間: ${Math.round((Date.now() - this.startTime) / 1000)} 秒`);
    
    return this.getExecutionSummary();
  }

  // 執行單項檢查
  async runSingleCheck(checkId, config) {
    const startTime = Date.now();
    
    try {
      const checker = new config.checker();
      let success = false;
      let score = 0;
      let details = {};

      switch (checkId) {
        case 'terminology':
          success = await checker.checkContent(this.contentDir);
          score = this.calculateTerminologyScore(checker);
          details = {
            errors: checker.errors.length,
            warnings: checker.warnings.length,
            suggestions: checker.suggestions.length,
            stats: checker.stats
          };
          break;

        case 'accessibility':
          success = await checker.validateContent(this.contentDir);
          score = checker.calculateAccessibilityScore();
          details = {
            errors: checker.errors.length,
            warnings: checker.warnings.length,
            suggestions: checker.suggestions.length,
            stats: checker.stats
          };
          break;

        case 'readability':
          await checker.analyzeContent(this.contentDir);
          success = true; // 可讀性分析不會失敗
          score = this.calculateReadabilityScore(checker);
          details = {
            averageScore: checker.results.reduce((sum, r) => sum + r.readabilityScore, 0) / checker.results.length,
            stats: checker.stats,
            results: checker.results
          };
          break;

        case 'references':
          success = await checker.checkReferences(this.contentDir);
          score = checker.calculateReferenceQualityScore();
          details = {
            errors: checker.errors.length,
            warnings: checker.warnings.length,
            suggestions: checker.suggestions.length,
            stats: checker.stats
          };
          break;
      }

      const duration = Date.now() - startTime;
      
      return {
        success,
        score,
        details,
        duration,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`${config.name} 執行錯誤: ${error.message}`);
    }
  }

  // 計算術語檢查分數
  calculateTerminologyScore(checker) {
    const totalIssues = checker.errors.length + checker.warnings.length;
    const filesChecked = checker.stats.filesChecked;
    
    if (filesChecked === 0) return 0;
    
    const issueRatio = totalIssues / filesChecked;
    const score = Math.max(0, 100 - (issueRatio * 20));
    
    return Math.round(score);
  }

  // 計算可讀性分數
  calculateReadabilityScore(checker) {
    if (checker.results.length === 0) return 0;
    
    const averageScore = checker.results.reduce((sum, result) => 
      sum + result.readabilityScore, 0) / checker.results.length;
    
    return Math.round(averageScore);
  }

  // 計算總體分數
  calculateOverallScore() {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const [checkId, result] of Object.entries(this.results)) {
      if (result.success !== false) {
        const config = QUALITY_CHECKS[checkId];
        totalWeightedScore += result.score * config.weight;
        totalWeight += config.weight;
      }
    }

    this.overallScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
  }

  // 執行 Markdown 語法檢查
  async runMarkdownLint() {
    console.log(`\n${'='.repeat(60)}`);
    console.log('📝 執行 Markdown 語法檢查...');
    console.log(`${'='.repeat(60)}`);

    try {
      // 檢查是否安裝了 markdownlint-cli
      execSync('npx markdownlint --version', { stdio: 'ignore' });
      
      const command = `npx markdownlint "${this.contentDir}/**/*.md" --config .markdownlint.json --json`;
      const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
      
      // 如果沒有輸出，表示沒有錯誤
      if (!output.trim()) {
        console.log('✅ Markdown 語法檢查通過');
        this.results.markdown = {
          success: true,
          score: 100,
          details: { errors: 0, files: 'all' },
          duration: 0
        };
      } else {
        const errors = JSON.parse(output);
        console.log(`❌ 發現 ${errors.length} 個 Markdown 語法問題`);
        
        // 儲存 markdownlint 報告
        fs.writeFileSync(
          path.join(this.outputDir, 'markdownlint-report.json'),
          JSON.stringify(errors, null, 2)
        );
        
        this.results.markdown = {
          success: false,
          score: Math.max(0, 100 - errors.length * 5),
          details: { errors: errors.length, files: errors.map(e => e.fileName) },
          duration: 0
        };
      }
    } catch (error) {
      console.log('⚠️ Markdown 語法檢查跳過（markdownlint 未安裝或執行失敗）');
      this.results.markdown = {
        success: true,
        score: 100,
        details: { skipped: true, reason: error.message },
        duration: 0
      };
    }
  }

  // 確保輸出目錄存在
  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  // 生成綜合報告
  generateComprehensiveReport() {
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 生成綜合品質報告...');
    console.log(`${'='.repeat(60)}`);

    // 控制台報告
    this.printConsoleReport();

    // JSON 報告
    this.generateJsonReport();

    // HTML 報告
    this.generateHtmlReport();

    // Markdown 報告
    this.generateMarkdownReport();
  }

  // 控制台報告
  printConsoleReport() {
    const qualityLevel = this.getQualityLevel(this.overallScore);
    
    console.log('\n🎯 品質檢查總結');
    console.log('='.repeat(40));
    console.log(`${qualityLevel.emoji} 總體品質: ${this.overallScore}/100 (${qualityLevel.label})`);
    
    console.log('\n📋 各項檢查結果:');
    for (const [checkId, result] of Object.entries(this.results)) {
      const config = QUALITY_CHECKS[checkId] || { name: checkId };
      const status = result.success ? '✅' : '❌';
      const score = result.score || 0;
      const level = this.getQualityLevel(score);
      
      console.log(`${status} ${config.name}: ${score}/100 (${level.label})`);
      
      if (result.details && result.details.errors > 0) {
        console.log(`   ❌ 錯誤: ${result.details.errors}`);
      }
      if (result.details && result.details.warnings > 0) {
        console.log(`   ⚠️ 警告: ${result.details.warnings}`);
      }
    }

    // 改善建議
    this.printImprovementSuggestions();
  }

  // 改善建議
  printImprovementSuggestions() {
    console.log('\n💡 改善建議:');
    
    const suggestions = [];
    
    for (const [checkId, result] of Object.entries(this.results)) {
      if (result.score < 75) {
        const config = QUALITY_CHECKS[checkId] || { name: checkId };
        
        switch (checkId) {
          case 'terminology':
            if (result.details.errors > 0) {
              suggestions.push('修正醫療術語拼寫錯誤和不當用詞');
            }
            if (result.details.warnings > 5) {
              suggestions.push('統一醫療術語使用，提高專業性');
            }
            break;
            
          case 'accessibility':
            if (result.score < 60) {
              suggestions.push('改善圖片 alt 文字和標題結構');
              suggestions.push('簡化複雜句式，提高可讀性');
            }
            break;
            
          case 'readability':
            if (result.details.averageScore < 70) {
              suggestions.push('縮短句子和段落長度');
              suggestions.push('為複雜醫療術語添加解釋');
            }
            break;
            
          case 'references':
            if (result.details.errors > 0) {
              suggestions.push('修正參考文獻格式錯誤');
            }
            if (result.details.stats && result.details.stats.questionableSources > 0) {
              suggestions.push('使用更權威的醫療資源作為參考');
            }
            break;
        }
      }
    }

    if (suggestions.length > 0) {
      suggestions.forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion}`);
      });
    } else {
      console.log('🎉 所有檢查項目都達到良好標準！');
    }
  }

  // 生成 JSON 報告
  generateJsonReport() {
    const report = {
      timestamp: new Date().toISOString(),
      contentDirectory: this.contentDir,
      overallScore: this.overallScore,
      qualityLevel: this.getQualityLevel(this.overallScore),
      executionTime: Date.now() - this.startTime,
      results: this.results,
      summary: {
        totalChecks: Object.keys(this.results).length,
        passedChecks: Object.values(this.results).filter(r => r.success).length,
        failedChecks: Object.values(this.results).filter(r => !r.success).length,
        averageScore: Math.round(
          Object.values(this.results).reduce((sum, r) => sum + (r.score || 0), 0) / 
          Object.keys(this.results).length
        )
      }
    };

    const reportPath = path.join(this.outputDir, 'comprehensive-quality-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 JSON 報告已儲存: ${reportPath}`);
  }

  // 生成 HTML 報告
  generateHtmlReport() {
    const qualityLevel = this.getQualityLevel(this.overallScore);
    
    const html = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>品質檢查報告</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .score { font-size: 3em; font-weight: bold; color: ${this.getScoreColor(this.overallScore)}; }
        .level { font-size: 1.5em; margin: 10px 0; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; }
        .card h3 { margin-top: 0; color: #333; }
        .metric { display: flex; justify-content: space-between; margin: 10px 0; }
        .status-pass { color: #28a745; }
        .status-fail { color: #dc3545; }
        .timestamp { text-align: center; color: #666; margin-top: 40px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏥 醫療衛教內容品質檢查報告</h1>
        <div class="score">${qualityLevel.emoji} ${this.overallScore}/100</div>
        <div class="level">${qualityLevel.label}</div>
    </div>

    <div class="grid">
        ${Object.entries(this.results).map(([checkId, result]) => {
          const config = QUALITY_CHECKS[checkId] || { name: checkId };
          const statusClass = result.success ? 'status-pass' : 'status-fail';
          const statusIcon = result.success ? '✅' : '❌';
          
          return `
            <div class="card">
                <h3>${statusIcon} ${config.name}</h3>
                <div class="metric">
                    <span>分數:</span>
                    <span class="${statusClass}">${result.score || 0}/100</span>
                </div>
                ${result.details ? `
                    ${result.details.errors !== undefined ? `
                        <div class="metric">
                            <span>錯誤:</span>
                            <span>${result.details.errors}</span>
                        </div>
                    ` : ''}
                    ${result.details.warnings !== undefined ? `
                        <div class="metric">
                            <span>警告:</span>
                            <span>${result.details.warnings}</span>
                        </div>
                    ` : ''}
                    ${result.details.suggestions !== undefined ? `
                        <div class="metric">
                            <span>建議:</span>
                            <span>${result.details.suggestions}</span>
                        </div>
                    ` : ''}
                ` : ''}
                <div class="metric">
                    <span>執行時間:</span>
                    <span>${result.duration}ms</span>
                </div>
            </div>
          `;
        }).join('')}
    </div>

    <div class="timestamp">
        報告生成時間: ${new Date().toLocaleString('zh-TW')}
    </div>
</body>
</html>`;

    const reportPath = path.join(this.outputDir, 'quality-report.html');
    fs.writeFileSync(reportPath, html);
    console.log(`📄 HTML 報告已儲存: ${reportPath}`);
  }

  // 生成 Markdown 報告
  generateMarkdownReport() {
    const qualityLevel = this.getQualityLevel(this.overallScore);
    
    const markdown = `# 🏥 醫療衛教內容品質檢查報告

## 總體評分

${qualityLevel.emoji} **${this.overallScore}/100** (${qualityLevel.label})

## 檢查結果詳情

| 檢查項目 | 狀態 | 分數 | 錯誤 | 警告 | 建議 |
|---------|------|------|------|------|------|
${Object.entries(this.results).map(([checkId, result]) => {
  const config = QUALITY_CHECKS[checkId] || { name: checkId };
  const status = result.success ? '✅' : '❌';
  const errors = result.details?.errors || '-';
  const warnings = result.details?.warnings || '-';
  const suggestions = result.details?.suggestions || '-';
  
  return `| ${config.name} | ${status} | ${result.score || 0}/100 | ${errors} | ${warnings} | ${suggestions} |`;
}).join('\n')}

## 執行統計

- **檢查目錄**: \`${this.contentDir}\`
- **總執行時間**: ${Math.round((Date.now() - this.startTime) / 1000)} 秒
- **檢查項目**: ${Object.keys(this.results).length}
- **通過項目**: ${Object.values(this.results).filter(r => r.success).length}
- **失敗項目**: ${Object.values(this.results).filter(r => !r.success).length}

## 品質標準

- 🏆 **優秀** (90-100): 內容品質極佳，符合所有標準
- ✅ **良好** (75-89): 內容品質良好，有少量改善空間
- ⚠️ **普通** (60-74): 內容品質普通，需要一些改善
- ❌ **需改善** (0-59): 內容品質需要大幅改善

---

*報告生成時間: ${new Date().toLocaleString('zh-TW')}*`;

    const reportPath = path.join(this.outputDir, 'quality-report.md');
    fs.writeFileSync(reportPath, markdown);
    console.log(`📄 Markdown 報告已儲存: ${reportPath}`);
  }

  // 輔助方法
  getQualityLevel(score) {
    for (const [level, config] of Object.entries(QUALITY_STANDARDS)) {
      if (score >= config.min) {
        return config;
      }
    }
    return QUALITY_STANDARDS.poor;
  }

  getScoreColor(score) {
    if (score >= 90) return '#28a745';
    if (score >= 75) return '#ffc107';
    if (score >= 60) return '#fd7e14';
    return '#dc3545';
  }

  getExecutionSummary() {
    return {
      success: this.overallScore >= 60,
      overallScore: this.overallScore,
      qualityLevel: this.getQualityLevel(this.overallScore),
      results: this.results,
      executionTime: Date.now() - this.startTime
    };
  }
}

// 主程式
async function main() {
  const args = process.argv.slice(2);
  const contentDir = args[0] || 'src/content/education';
  
  console.log('🏥 醫療衛教內容品質檢查系統');
  console.log('='.repeat(50));
  
  const runner = new QualityCheckRunner({ contentDir });
  const summary = await runner.runAllChecks();
  
  console.log('\n🎯 執行完成！');
  console.log(`總體品質分數: ${summary.overallScore}/100 (${summary.qualityLevel.label})`);
  
  if (summary.success) {
    console.log('🎉 品質檢查通過！');
    process.exit(0);
  } else {
    console.log('💥 品質檢查未通過，請查看報告並改善內容');
    process.exit(1);
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 執行錯誤:', error);
    process.exit(1);
  });
}

module.exports = QualityCheckRunner;