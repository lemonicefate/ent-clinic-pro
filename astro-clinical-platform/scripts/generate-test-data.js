#!/usr/bin/env node

/**
 * 測試資料生成器
 * 為預覽環境生成範例醫療衛教內容和配置
 */

const fs = require('fs');
const path = require('path');

// 測試資料配置
const TEST_DATA_CONFIG = {
  // 測試文章數量
  articlesPerSpecialty: 3,
  
  // 支援的專科
  specialties: [
    { code: 'cardiology', name: '心臟科', emoji: '❤️' },
    { code: 'neurology', name: '神經科', emoji: '🧠' },
    { code: 'pediatrics', name: '小兒科', emoji: '👶' },
    { code: 'emergency', name: '急診科', emoji: '🚨' },
    { code: 'orthopedics', name: '骨科', emoji: '🦴' }
  ],
  
  // 文章狀態
  statuses: ['draft', 'in-review', 'published'],
  
  // 測試作者
  authors: [
    'Dr. Test Author',
    'Dr. Medical Expert',
    'Dr. Content Writer',
    'Dr. Review Specialist'
  ],
  
  // 測試審核者
  reviewers: [
    'cardiology-reviewer',
    'neurology-reviewer',
    'pediatrics-reviewer',
    'emergency-reviewer',
    'orthopedics-reviewer',
    'medical-advisor'
  ]
};

// 範例內容模板
const CONTENT_TEMPLATES = {
  cardiology: {
    title: '心房顫動的診斷與治療',
    content: `
# 心房顫動的診斷與治療

心房顫動（Atrial Fibrillation, AF）是最常見的心律不整疾病。

## 症狀

常見症狀包括：
- 心悸或心跳不規則
- 胸悶或胸痛  
- 呼吸困難
- 疲勞感
- 頭暈

## 診斷方法

### 心電圖檢查
心電圖（ECG）是診斷心房顫動的主要工具。

### 24小時心電圖監測
用於檢測間歇性心房顫動。

## 治療選項

### 藥物治療
- **抗凝血劑**：預防血栓形成
- **心律控制藥物**：恢復正常心律
- **心率控制藥物**：控制心跳速度

### 非藥物治療
- 電燒手術（Catheter Ablation）
- 心臟節律器植入

## 生活管理

- 規律運動
- 健康飲食
- 戒菸戒酒
- 定期追蹤

## 參考文獻

1. January CT, Wann LS, Alpert JS, et al. 2014 AHA/ACC/HRS guideline for the management of patients with atrial fibrillation. Circulation. 2014;130(23):e199-e267.
2. Kirchhof P, Benussi S, Kotecha D, et al. 2016 ESC Guidelines for the management of atrial fibrillation. Eur Heart J. 2016;37(38):2893-2962.
3. 中華民國心臟學會. 心房顫動診療指引. 2023年版.
`
  },
  
  neurology: {
    title: '中風的預防與急救',
    content: `
# 中風的預防與急救

中風是腦血管疾病的急症，需要立即醫療處置。

## 中風類型

### 缺血性中風
由血管阻塞引起，佔所有中風的80%。

### 出血性中風
由腦血管破裂引起，較為嚴重。

## 警告徵象（FAST）

- **F**ace（臉部）：臉部歪斜
- **A**rm（手臂）：手臂無力
- **S**peech（語言）：語言障礙
- **T**ime（時間）：把握黃金時間

## 危險因子

### 可控制因子
- 高血壓
- 糖尿病
- 高血脂
- 吸菸
- 心房顫動

### 不可控制因子
- 年齡
- 性別
- 家族史

## 預防措施

- 控制血壓
- 管理血糖
- 戒菸限酒
- 規律運動
- 健康飲食

## 急救處理

1. 立即撥打119
2. 記錄發作時間
3. 保持呼吸道暢通
4. 避免給予食物或水
5. 陪伴至醫院

## 參考文獻

1. Powers WJ, Rabinstein AA, Ackerson T, et al. Guidelines for the Early Management of Patients With Acute Ischemic Stroke. Stroke. 2019;50(12):e344-e418.
2. 台灣腦中風學會. 急性缺血性腦中風診療指引. 2021年版.
`
  },
  
  pediatrics: {
    title: '兒童疫苗接種指南',
    content: `
# 兒童疫苗接種指南

疫苗接種是保護兒童健康的重要措施。

## 疫苗接種時程

### 出生至2個月
- B型肝炎疫苗
- 卡介苗

### 2個月
- 五合一疫苗（第一劑）
- 肺炎鏈球菌疫苗（第一劑）
- 輪狀病毒疫苗（第一劑）

### 4個月
- 五合一疫苗（第二劑）
- 肺炎鏈球菌疫苗（第二劑）
- 輪狀病毒疫苗（第二劑）

## 疫苗種類

### 活性減毒疫苗
- 麻疹腮腺炎德國麻疹疫苗（MMR）
- 水痘疫苗
- 輪狀病毒疫苗

### 不活化疫苗
- 五合一疫苗
- 肺炎鏈球菌疫苗
- A型肝炎疫苗

## 接種注意事項

### 接種前
- 確認身體健康
- 告知過敏史
- 攜帶兒童健康手冊

### 接種後
- 觀察30分鐘
- 注意副作用
- 記錄接種資訊

## 常見副作用

- 注射部位紅腫
- 輕微發燒
- 食慾不振
- 煩躁不安

## 何時延後接種

- 發燒或急性疾病
- 免疫功能不全
- 正在使用免疫抑制劑
- 嚴重過敏反應史

## 參考文獻

1. 衛生福利部疾病管制署. 兒童預防接種時程及注意事項. 2023年版.
2. Advisory Committee on Immunization Practices. Recommended Child and Adolescent Immunization Schedule. 2023.
`
  }
};

class TestDataGenerator {
  constructor() {
    this.outputDir = 'test-content';
    this.generatedFiles = [];
  }

  // 生成所有測試資料
  async generateAllTestData() {
    console.log('🧪 開始生成測試資料...\n');

    try {
      // 建立輸出目錄
      this.ensureOutputDirectory();

      // 生成測試文章
      await this.generateTestArticles();

      // 生成測試專科配置
      await this.generateTestSpecialties();

      // 生成測試模板
      await this.generateTestTemplates();

      // 生成測試審核者配置
      await this.generateTestReviewers();

      // 生成測試報告
      this.generateTestReport();

      console.log('\n🎉 測試資料生成完成！');
      console.log(`📁 輸出目錄: ${this.outputDir}`);
      console.log(`📄 生成檔案: ${this.generatedFiles.length} 個`);

    } catch (error) {
      console.error('❌ 測試資料生成失敗:', error);
      process.exit(1);
    }
  }

  // 確保輸出目錄存在
  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // 建立子目錄
    const subdirs = ['education', 'medical-specialties', 'templates'];
    subdirs.forEach(subdir => {
      const dirPath = path.join(this.outputDir, subdir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  // 生成測試文章
  async generateTestArticles() {
    console.log('📝 生成測試文章...');

    for (const specialty of TEST_DATA_CONFIG.specialties) {
      for (let i = 1; i <= TEST_DATA_CONFIG.articlesPerSpecialty; i++) {
        const article = this.createTestArticle(specialty, i);
        const filename = `${specialty.code}-test-${i}.md`;
        const filepath = path.join(this.outputDir, 'education', filename);
        
        fs.writeFileSync(filepath, article);
        this.generatedFiles.push(filepath);
        
        console.log(`  ✅ ${filename}`);
      }
    }
  }

  // 建立測試文章
  createTestArticle(specialty, index) {
    const template = CONTENT_TEMPLATES[specialty.code] || CONTENT_TEMPLATES.cardiology;
    const status = TEST_DATA_CONFIG.statuses[index % TEST_DATA_CONFIG.statuses.length];
    const author = TEST_DATA_CONFIG.authors[index % TEST_DATA_CONFIG.authors.length];
    const reviewer = TEST_DATA_CONFIG.reviewers.find(r => r.includes(specialty.code)) || 'medical-advisor';

    const frontmatter = {
      title: `${template.title} - 測試 ${index}`,
      specialty: specialty.code,
      status: status,
      author: author,
      reviewers: [reviewer],
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0],
      tags: [`${specialty.name}`, '測試', '範例'],
      description: `這是一篇用於測試的${specialty.name}文章`,
      readingTime: Math.floor(Math.random() * 10) + 5,
      difficulty: ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)],
      qualityChecks: {
        terminology: Math.random() > 0.3,
        accessibility: Math.random() > 0.2,
        readability: Math.random() > 0.4,
        references: Math.random() > 0.3
      }
    };

    const yamlFrontmatter = Object.entries(frontmatter)
      .map(([key, value]) => {
        if (typeof value === 'object') {
          return `${key}:\n${JSON.stringify(value, null, 2).split('\n').map(line => `  ${line}`).join('\n')}`;
        }
        return `${key}: ${JSON.stringify(value)}`;
      })
      .join('\n');

    return `---\n${yamlFrontmatter}\n---\n${template.content}`;
  }

  // 生成測試專科配置
  async generateTestSpecialties() {
    console.log('🏥 生成測試專科配置...');

    for (const specialty of TEST_DATA_CONFIG.specialties) {
      const config = {
        name: specialty.name,
        code: specialty.code,
        emoji: specialty.emoji,
        description: `${specialty.name}相關的醫療衛教內容`,
        reviewers: [
          `${specialty.code}-reviewer`,
          'medical-advisor'
        ],
        requiredFields: [
          'title',
          'content',
          'author',
          'reviewers'
        ],
        templates: [
          `${specialty.code}-template`
        ],
        qualityChecks: {
          terminology: true,
          accessibility: true,
          readability: true,
          references: true,
          specialtySpecific: true
        },
        contentGuidelines: [
          '使用專業但易懂的語言',
          '提供準確的醫療資訊',
          '包含適當的參考文獻',
          '添加必要的免責聲明'
        ],
        reviewCriteria: [
          '醫療資訊準確性',
          '內容完整性',
          '語言表達清晰度',
          '參考文獻可靠性'
        ]
      };

      const filename = `${specialty.code}.json`;
      const filepath = path.join(this.outputDir, 'medical-specialties', filename);
      
      fs.writeFileSync(filepath, JSON.stringify(config, null, 2));
      this.generatedFiles.push(filepath);
      
      console.log(`  ✅ ${filename}`);
    }
  }

  // 生成測試模板
  async generateTestTemplates() {
    console.log('📋 生成測試模板...');

    for (const specialty of TEST_DATA_CONFIG.specialties) {
      const template = this.createTestTemplate(specialty);
      const filename = `${specialty.code}-template.md`;
      const filepath = path.join(this.outputDir, 'templates', filename);
      
      fs.writeFileSync(filepath, template);
      this.generatedFiles.push(filepath);
      
      console.log(`  ✅ ${filename}`);
    }
  }

  // 建立測試模板
  createTestTemplate(specialty) {
    return `---
title: "${specialty.name}文章模板"
specialty: "${specialty.code}"
status: "draft"
author: ""
reviewers: ["${specialty.code}-reviewer"]
version: "1.0"
lastUpdated: "${new Date().toISOString().split('T')[0]}"
tags: ["${specialty.name}", "模板"]
description: ""
---

# ${specialty.name}文章標題

## 概述

請在此處提供疾病或主題的簡要概述。

## 症狀

### 常見症狀
- 症狀1
- 症狀2
- 症狀3

### 嚴重症狀
- 需要立即就醫的症狀

## 診斷

### 診斷方法
- 檢查方法1
- 檢查方法2

### 診斷標準
- 標準1
- 標準2

## 治療

### 藥物治療
- 藥物1：用法用量
- 藥物2：用法用量

### 非藥物治療
- 治療方法1
- 治療方法2

## 預防

- 預防措施1
- 預防措施2
- 預防措施3

## 生活管理

- 生活建議1
- 生活建議2

## 何時就醫

- 情況1
- 情況2

## 參考文獻

1. 參考文獻1
2. 參考文獻2
3. 參考文獻3

---

**醫療免責聲明**: 本文僅供教育參考，不能替代專業醫療建議。如有健康問題，請諮詢合格的醫療專業人員。`;
  }

  // 生成測試審核者配置
  async generateTestReviewers() {
    console.log('👥 生成測試審核者配置...');

    const reviewerConfig = {
      reviewers: {},
      specialtyMapping: {},
      reviewRules: {
        minimumReviewers: 2,
        requiredApprovals: 1,
        autoAssignment: true,
        escalationRules: {
          highRisk: ['medical-advisor', 'senior-reviewer'],
          medication: ['pharmacist-reviewer', 'medical-advisor'],
          surgery: ['surgeon-reviewer', 'medical-advisor']
        }
      }
    };

    // 為每個專科建立審核者
    for (const specialty of TEST_DATA_CONFIG.specialties) {
      const reviewerId = `${specialty.code}-reviewer`;
      
      reviewerConfig.reviewers[reviewerId] = {
        name: `${specialty.name}審核者`,
        specialty: specialty.code,
        email: `${reviewerId}@example.com`,
        role: 'specialist-reviewer',
        qualifications: [
          `${specialty.name}專科醫師`,
          '醫療衛教內容審核經驗'
        ],
        reviewAreas: [
          'medical-accuracy',
          'clinical-guidelines',
          'safety-information'
        ]
      };

      reviewerConfig.specialtyMapping[specialty.code] = [reviewerId, 'medical-advisor'];
    }

    // 添加通用審核者
    reviewerConfig.reviewers['medical-advisor'] = {
      name: '醫療顧問',
      specialty: 'general',
      email: 'medical-advisor@example.com',
      role: 'senior-advisor',
      qualifications: [
        '資深醫師',
        '醫療內容審核專家',
        '醫療教育專家'
      ],
      reviewAreas: [
        'overall-quality',
        'medical-accuracy',
        'compliance',
        'safety'
      ]
    };

    const filename = 'reviewer-assignments.json';
    const filepath = path.join(this.outputDir, 'medical-specialties', filename);
    
    fs.writeFileSync(filepath, JSON.stringify(reviewerConfig, null, 2));
    this.generatedFiles.push(filepath);
    
    console.log(`  ✅ ${filename}`);
  }

  // 生成測試報告
  generateTestReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalFiles: this.generatedFiles.length,
        articles: this.generatedFiles.filter(f => f.includes('education')).length,
        specialties: TEST_DATA_CONFIG.specialties.length,
        templates: this.generatedFiles.filter(f => f.includes('templates')).length,
        configurations: this.generatedFiles.filter(f => f.includes('medical-specialties')).length
      },
      files: this.generatedFiles.map(filepath => ({
        path: filepath,
        size: fs.statSync(filepath).size,
        type: this.getFileType(filepath)
      })),
      usage: {
        description: '此測試資料可用於預覽環境測試',
        instructions: [
          '將生成的檔案複製到對應的 src/content/ 目錄',
          '重新啟動開發伺服器以載入新內容',
          '使用 CMS 介面測試編輯功能',
          '驗證品質檢查工具是否正常運作'
        ]
      }
    };

    const reportPath = path.join(this.outputDir, 'test-data-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📊 測試報告已生成: ${reportPath}`);
  }

  // 取得檔案類型
  getFileType(filepath) {
    if (filepath.includes('education')) return 'article';
    if (filepath.includes('templates')) return 'template';
    if (filepath.includes('medical-specialties')) return 'configuration';
    return 'other';
  }
}

// 主程式
async function main() {
  const generator = new TestDataGenerator();
  await generator.generateAllTestData();
}

// 如果直接執行此腳本
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 執行錯誤:', error);
    process.exit(1);
  });
}

module.exports = TestDataGenerator;