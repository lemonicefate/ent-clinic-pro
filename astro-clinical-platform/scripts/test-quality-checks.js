#!/usr/bin/env node

/**
 * 品質檢查工具測試腳本
 * 驗證所有品質檢查工具是否正常運作
 */

const fs = require('fs');
const path = require('path');

// 測試用的範例內容
const TEST_CONTENT = `---
title: "心房顫動治療指南"
specialty: "cardiology"
status: "published"
author: "Dr. Test"
reviewers: ["Dr. A", "Dr. B"]
version: "1.0"
lastUpdated: "2024-01-30"
---

# 心房顫動治療指南

## 症狀

心房顫動（Atrial Fibrillation, AF）是最常見的心律不整。研究顯示約有2-3%的成年人患有此疾病[1]。

主要症狀包括：
- 心悸或心跳不規則
- 胸悶或胸痛
- 呼吸困難
- 疲勞感

![心電圖顯示心房顫動的典型波形](ecg-af.png)

## 治療

### 藥物治療

常用藥物包括：
1. **抗凝血劑**：如 warfarin 5mg 每日一次
2. **心律控制藥物**：如 amiodarone
3. **心率控制藥物**：如 metoprolol

> **重要提醒**：請遵醫囑服用，不可自行調整劑量。

### 手術治療

對於藥物治療無效的患者，可考慮：
- 電燒手術（Catheter Ablation）
- 心臟節律器植入

## 預防

預防心房顫動的方法：
- 控制血壓
- 維持健康體重
- 規律運動
- 戒菸戒酒

更多資訊請參考[衛生福利部網站](https://www.mohw.gov.tw)。

## 參考文獻

1. Chugh SS, Havmoeller R, Narayanan K, et al. Worldwide epidemiology of atrial fibrillation: a Global Burden of Disease 2010 Study. Circulation. 2014;129(8):837-847.
2. January CT, Wann LS, Alpert JS, et al. 2014 AHA/ACC/HRS guideline for the management of patients with atrial fibrillation. Circulation. 2014;130(23):e199-e267.
3. 衛生福利部. 心房顫動診療指引. Available at: https://www.mohw.gov.tw/guidelines/af. Accessed January 30, 2024.
`;

class QualityCheckTester {
  constructor() {
    this.testDir = 'test-content';
    this.testFile = path.join(this.testDir, 'test-article.md');
    this.results = {};
  }

  async runTests() {
    console.log('🧪 開始品質檢查工具測試...\n');

    try {
      // 準備測試環境
      await this.setupTestEnvironment();

      // 測試各個檢查工具
      await this.testMedicalTerminologyChecker();
      await this.testAccessibilityValidator();
      await this.testReadabilityAnalyzer();
      await this.testReferenceFormatChecker();
      await this.testQualityCheckRunner();

      // 清理測試環境
      await this.cleanupTestEnvironment();

      // 顯示測試結果
      this.displayResults();

    } catch (error) {
      console.error('❌ 測試執行失敗:', error);
      await this.cleanupTestEnvironment();
      process.exit(1);
    }
  }

  async setupTestEnvironment() {
    console.log('📁 準備測試環境...');
    
    // 建立測試目錄
    if (!fs.existsSync(this.testDir)) {
      fs.mkdirSync(this.testDir, { recursive: true });
    }

    // 建立測試檔案
    fs.writeFileSync(this.testFile, TEST_CONTENT);
    
    console.log(`✅ 測試檔案已建立: ${this.testFile}\n`);
  }

  async testMedicalTerminologyChecker() {
    console.log('🔍 測試醫療術語檢查工具...');
    
    try {
      const MedicalTerminologyChecker = require('./medical-terminology-checker');
      const checker = new MedicalTerminologyChecker();
      
      const success = await checker.checkContent(this.testDir);
      
      this.results.terminology = {
        success: true,
        passed: success,
        errors: checker.errors.length,
        warnings: checker.warnings.length,
        suggestions: checker.suggestions.length
      };
      
      console.log(`✅ 醫療術語檢查完成 - 錯誤: ${checker.errors.length}, 警告: ${checker.warnings.length}`);
      
    } catch (error) {
      this.results.terminology = {
        success: false,
        error: error.message
      };
      console.log(`❌ 醫療術語檢查失敗: ${error.message}`);
    }
  }

  async testAccessibilityValidator() {
    console.log('♿ 測試無障礙性驗證工具...');
    
    try {
      const AccessibilityValidator = require('./accessibility-validator');
      const validator = new AccessibilityValidator();
      
      const success = await validator.validateContent(this.testDir);
      
      this.results.accessibility = {
        success: true,
        passed: success,
        errors: validator.errors.length,
        warnings: validator.warnings.length,
        suggestions: validator.suggestions.length
      };
      
      console.log(`✅ 無障礙性驗證完成 - 錯誤: ${validator.errors.length}, 警告: ${validator.warnings.length}`);
      
    } catch (error) {
      this.results.accessibility = {
        success: false,
        error: error.message
      };
      console.log(`❌ 無障礙性驗證失敗: ${error.message}`);
    }
  }

  async testReadabilityAnalyzer() {
    console.log('📖 測試可讀性分析工具...');
    
    try {
      const ReadabilityAnalyzer = require('./readability-analyzer');
      const analyzer = new ReadabilityAnalyzer();
      
      await analyzer.analyzeContent(this.testDir);
      
      const averageScore = analyzer.results.length > 0 ? 
        analyzer.results.reduce((sum, r) => sum + r.readabilityScore, 0) / analyzer.results.length : 0;
      
      this.results.readability = {
        success: true,
        passed: true,
        averageScore: Math.round(averageScore),
        filesAnalyzed: analyzer.results.length,
        totalIssues: analyzer.results.reduce((sum, r) => sum + r.issues.length, 0)
      };
      
      console.log(`✅ 可讀性分析完成 - 平均分數: ${Math.round(averageScore)}, 檔案: ${analyzer.results.length}`);
      
    } catch (error) {
      this.results.readability = {
        success: false,
        error: error.message
      };
      console.log(`❌ 可讀性分析失敗: ${error.message}`);
    }
  }

  async testReferenceFormatChecker() {
    console.log('📚 測試參考文獻檢查工具...');
    
    try {
      const ReferenceFormatChecker = require('./reference-format-checker');
      const checker = new ReferenceFormatChecker();
      
      const success = await checker.checkReferences(this.testDir);
      
      this.results.references = {
        success: true,
        passed: success,
        errors: checker.errors.length,
        warnings: checker.warnings.length,
        suggestions: checker.suggestions.length,
        referencesFound: checker.stats.referencesFound
      };
      
      console.log(`✅ 參考文獻檢查完成 - 找到: ${checker.stats.referencesFound}, 錯誤: ${checker.errors.length}`);
      
    } catch (error) {
      this.results.references = {
        success: false,
        error: error.message
      };
      console.log(`❌ 參考文獻檢查失敗: ${error.message}`);
    }
  }

  async testQualityCheckRunner() {
    console.log('🚀 測試品質檢查執行器...');
    
    try {
      const QualityCheckRunner = require('./quality-check-runner');
      const runner = new QualityCheckRunner({ 
        contentDir: this.testDir,
        outputDir: 'test-reports'
      });
      
      const summary = await runner.runAllChecks();
      
      this.results.runner = {
        success: true,
        passed: summary.success,
        overallScore: summary.overallScore,
        qualityLevel: summary.qualityLevel.label,
        checksRun: Object.keys(summary.results).length
      };
      
      console.log(`✅ 品質檢查執行器完成 - 總分: ${summary.overallScore}, 等級: ${summary.qualityLevel.label}`);
      
    } catch (error) {
      this.results.runner = {
        success: false,
        error: error.message
      };
      console.log(`❌ 品質檢查執行器失敗: ${error.message}`);
    }
  }

  async cleanupTestEnvironment() {
    console.log('\n🧹 清理測試環境...');
    
    try {
      // 刪除測試檔案和目錄
      if (fs.existsSync(this.testFile)) {
        fs.unlinkSync(this.testFile);
      }
      
      if (fs.existsSync(this.testDir)) {
        fs.rmdirSync(this.testDir);
      }

      // 清理測試報告
      const testReportsDir = 'test-reports';
      if (fs.existsSync(testReportsDir)) {
        const files = fs.readdirSync(testReportsDir);
        files.forEach(file => {
          fs.unlinkSync(path.join(testReportsDir, file));
        });
        fs.rmdirSync(testReportsDir);
      }

      // 清理生成的報告檔案
      const reportFiles = [
        'medical-terminology-report.json',
        'accessibility-report.json',
        'readability-report.json',
        'reference-format-report.json'
      ];

      reportFiles.forEach(file => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      });
      
      console.log('✅ 測試環境已清理');
      
    } catch (error) {
      console.log(`⚠️ 清理測試環境時發生錯誤: ${error.message}`);
    }
  }

  displayResults() {
    console.log('\n📊 測試結果摘要');
    console.log('='.repeat(50));
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    for (const [testName, result] of Object.entries(this.results)) {
      totalTests++;
      
      if (result.success) {
        passedTests++;
        console.log(`✅ ${testName}: 測試通過`);
        
        // 顯示額外資訊
        if (result.errors !== undefined) {
          console.log(`   錯誤: ${result.errors}, 警告: ${result.warnings}, 建議: ${result.suggestions}`);
        }
        if (result.averageScore !== undefined) {
          console.log(`   平均分數: ${result.averageScore}`);
        }
        if (result.overallScore !== undefined) {
          console.log(`   總體分數: ${result.overallScore} (${result.qualityLevel})`);
        }
      } else {
        failedTests++;
        console.log(`❌ ${testName}: 測試失敗 - ${result.error}`);
      }
    }

    console.log('\n📈 測試統計');
    console.log(`總測試數: ${totalTests}`);
    console.log(`通過: ${passedTests}`);
    console.log(`失敗: ${failedTests}`);
    console.log(`成功率: ${Math.round((passedTests / totalTests) * 100)}%`);

    if (failedTests === 0) {
      console.log('\n🎉 所有品質檢查工具測試通過！');
      console.log('品質檢查系統已準備就緒。');
    } else {
      console.log('\n💥 部分測試失敗，請檢查錯誤訊息並修正。');
      process.exit(1);
    }
  }
}

// 主程式
async function main() {
  const tester = new QualityCheckTester();
  await tester.runTests();
}

// 如果直接執行此腳本
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 測試執行錯誤:', error);
    process.exit(1);
  });
}

module.exports = QualityCheckTester;