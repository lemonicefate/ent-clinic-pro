#!/usr/bin/env node

/**
 * 內容驗證腳本
 * 用於本地開發和 CI/CD 流程中的內容品質檢查
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 配置選項
const CONFIG = {
  contentDir: 'src/content/education',
  specialtiesDir: 'src/content/medical-specialties',
  templatesDir: 'src/content/templates',
  
  // 驗證規則
  rules: {
    minWordCount: 200,
    maxWordCount: 3000,
    minDescriptionLength: 50,
    maxDescriptionLength: 160,
    maxTitleLength: 60,
    minTitleLength: 10,
    maxTagCount: 10,
    minTagCount: 1,
    maxSentenceLength: 25,
    maxParagraphLength: 100
  },
  
  // 允許的值
  allowedSpecialties: [
    'cardiology', 'neurology', 'pediatrics', 
    'emergency', 'orthopedics', 'general'
  ],
  
  allowedStatuses: ['draft', 'in-review', 'published'],
  
  // 醫療相關配置
  requiredSections: {
    cardiology: ['症狀', '診斷', '治療', '預防'],
    neurology: ['症狀', '診斷', '治療', '預後'],
    pediatrics: ['症狀', '診斷', '治療', '照護'],
    emergency: ['症狀', '處理', '轉診', '預防'],
    orthopedics: ['症狀', '診斷', '治療', '復健'],
    general: ['症狀', '診斷', '治療']
  },
  
  // 危險詞彙
  dangerousTerms: [
    '一定會', '絕對', '永遠不會', '完全治癒',
    '立即停藥', '自行調整劑量', '不需要看醫生',
    '保證有效', '百分之百', '絕對安全'
  ]
};

class ContentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      totalFiles: 0,
      validFiles: 0,
      errorFiles: 0,
      warningFiles: 0
    };
  }

  // 主要驗證方法
  async validate() {
    console.log('🔍 開始內容驗證...\n');
    
    try {
      await this.validateContentStructure();
      await this.validateSpecialties();
      await this.validateTemplates();
      
      this.generateReport();
      
      return this.errors.length === 0;
    } catch (error) {
      console.error('❌ 驗證過程發生錯誤:', error.message);
      return false;
    }
  }

  // 驗證內容結構
  async validateContentStructure() {
    if (!fs.existsSync(CONFIG.contentDir)) {
      this.addError('系統', `內容目錄不存在: ${CONFIG.contentDir}`);
      return;
    }

    const files = this.getMarkdownFiles(CONFIG.contentDir);
    this.stats.totalFiles = files.length;

    console.log(`📁 找到 ${files.length} 個內容檔案`);

    for (const file of files) {
      await this.validateContentFile(file);
    }
  }

  // 驗證單個內容檔案
  async validateContentFile(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    let hasErrors = false;
    let hasWarnings = false;

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 驗證 frontmatter
      const frontmatterResult = this.validateFrontmatter(content, relativePath);
      if (frontmatterResult.errors.length > 0) {
        hasErrors = true;
        this.errors.push(...frontmatterResult.errors);
      }
      if (frontmatterResult.warnings.length > 0) {
        hasWarnings = true;
        this.warnings.push(...frontmatterResult.warnings);
      }

      // 驗證內容結構
      const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, '');
      const structureResult = this.validateContentStructure(bodyContent, relativePath, frontmatterResult.frontmatter);
      if (structureResult.errors.length > 0) {
        hasErrors = true;
        this.errors.push(...structureResult.errors);
      }
      if (structureResult.warnings.length > 0) {
        hasWarnings = true;
        this.warnings.push(...structureResult.warnings);
      }

      // 驗證醫療內容
      const medicalResult = this.validateMedicalContent(bodyContent, relativePath, frontmatterResult.frontmatter);
      if (medicalResult.errors.length > 0) {
        hasErrors = true;
        this.errors.push(...medicalResult.errors);
      }
      if (medicalResult.warnings.length > 0) {
        hasWarnings = true;
        this.warnings.push(...medicalResult.warnings);
      }

      // 更新統計
      if (hasErrors) {
        this.stats.errorFiles++;
      } else if (hasWarnings) {
        this.stats.warningFiles++;
      } else {
        this.stats.validFiles++;
      }

    } catch (error) {
      this.addError(relativePath, `檔案讀取錯誤: ${error.message}`);
      this.stats.errorFiles++;
    }
  }

  // 驗證 frontmatter
  validateFrontmatter(content, filePath) {
    const errors = [];
    const warnings = [];
    let frontmatter = null;

    // 檢查 frontmatter 存在
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      errors.push({ file: filePath, message: '缺少 frontmatter' });
      return { errors, warnings, frontmatter };
    }

    // 解析 YAML
    try {
      frontmatter = yaml.load(frontmatterMatch[1]);
    } catch (error) {
      errors.push({ file: filePath, message: `Frontmatter YAML 格式錯誤: ${error.message}` });
      return { errors, warnings, frontmatter };
    }

    // 檢查必要欄位
    const requiredFields = ['title', 'description', 'specialty', 'status', 'publishDate', 'author'];
    for (const field of requiredFields) {
      if (!frontmatter.hasOwnProperty(field)) {
        errors.push({ file: filePath, message: `缺少必要欄位: ${field}` });
      } else if (typeof frontmatter[field] === 'string' && frontmatter[field].trim() === '') {
        errors.push({ file: filePath, message: `欄位不能為空: ${field}` });
      }
    }

    // 驗證欄位值
    if (frontmatter.specialty && !CONFIG.allowedSpecialties.includes(frontmatter.specialty)) {
      errors.push({ 
        file: filePath, 
        message: `無效的專科值: ${frontmatter.specialty}，允許值: ${CONFIG.allowedSpecialties.join(', ')}` 
      });
    }

    if (frontmatter.status && !CONFIG.allowedStatuses.includes(frontmatter.status)) {
      errors.push({ 
        file: filePath, 
        message: `無效的狀態值: ${frontmatter.status}，允許值: ${CONFIG.allowedStatuses.join(', ')}` 
      });
    }

    // 驗證標題長度
    if (frontmatter.title) {
      if (frontmatter.title.length < CONFIG.rules.minTitleLength) {
        warnings.push({ file: filePath, message: `標題過短 (${frontmatter.title.length} 字元，建議 > ${CONFIG.rules.minTitleLength})` });
      }
      if (frontmatter.title.length > CONFIG.rules.maxTitleLength) {
        warnings.push({ file: filePath, message: `標題過長 (${frontmatter.title.length} 字元，建議 < ${CONFIG.rules.maxTitleLength})` });
      }
    }

    // 驗證描述長度
    if (frontmatter.description) {
      if (frontmatter.description.length < CONFIG.rules.minDescriptionLength) {
        warnings.push({ file: filePath, message: `描述過短 (${frontmatter.description.length} 字元，建議 > ${CONFIG.rules.minDescriptionLength})` });
      }
      if (frontmatter.description.length > CONFIG.rules.maxDescriptionLength) {
        warnings.push({ file: filePath, message: `描述過長 (${frontmatter.description.length} 字元，建議 < ${CONFIG.rules.maxDescriptionLength})` });
      }
    }

    // 驗證標籤
    if (frontmatter.tags) {
      if (!Array.isArray(frontmatter.tags)) {
        errors.push({ file: filePath, message: 'tags 必須是陣列' });
      } else {
        if (frontmatter.tags.length < CONFIG.rules.minTagCount) {
          warnings.push({ file: filePath, message: `標籤過少 (${frontmatter.tags.length} 個，建議 > ${CONFIG.rules.minTagCount})` });
        }
        if (frontmatter.tags.length > CONFIG.rules.maxTagCount) {
          warnings.push({ file: filePath, message: `標籤過多 (${frontmatter.tags.length} 個，建議 < ${CONFIG.rules.maxTagCount})` });
        }
      }
    } else {
      warnings.push({ file: filePath, message: '缺少標籤' });
    }

    // 驗證日期格式
    if (frontmatter.publishDate) {
      const date = new Date(frontmatter.publishDate);
      if (isNaN(date.getTime())) {
        errors.push({ file: filePath, message: '發布日期格式無效' });
      }
    }

    return { errors, warnings, frontmatter };
  }

  // 驗證內容結構
  validateContentStructure(content, filePath, frontmatter) {
    const errors = [];
    const warnings = [];

    // 字數檢查
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;

    if (wordCount < CONFIG.rules.minWordCount) {
      warnings.push({ file: filePath, message: `內容過短 (${wordCount} 字，建議 > ${CONFIG.rules.minWordCount})` });
    }
    if (wordCount > CONFIG.rules.maxWordCount) {
      warnings.push({ file: filePath, message: `內容過長 (${wordCount} 字，建議 < ${CONFIG.rules.maxWordCount})` });
    }

    // 標題結構檢查
    const headingPattern = /^(#{1,6})\s+(.+)$/gm;
    const headings = [];
    let match;

    while ((match = headingPattern.exec(content)) !== null) {
      headings.push({
        level: match[1].length,
        text: match[2],
        line: content.substring(0, match.index).split('\n').length
      });
    }

    if (headings.length === 0) {
      warnings.push({ file: filePath, message: '內容缺少標題結構' });
    } else {
      // 檢查標題層級跳躍
      for (let i = 1; i < headings.length; i++) {
        const prevLevel = headings[i - 1].level;
        const currentLevel = headings[i].level;
        
        if (currentLevel > prevLevel + 1) {
          warnings.push({ 
            file: filePath, 
            message: `標題層級跳躍 (H${prevLevel} -> H${currentLevel}) 第 ${headings[i].line} 行` 
          });
        }
      }
    }

    // 圖片 alt 文字檢查
    const imagePattern = /!\[([^\]]*)\]\([^)]+\)/g;
    while ((match = imagePattern.exec(content)) !== null) {
      const altText = match[1];
      if (!altText || altText.trim() === '') {
        errors.push({ file: filePath, message: `圖片缺少 alt 文字: ${match[0]}` });
      }
    }

    // 連結檢查
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    while ((match = linkPattern.exec(content)) !== null) {
      const linkText = match[1];
      const url = match[2];
      
      if (linkText.trim() === '') {
        errors.push({ file: filePath, message: `連結文字為空: ${match[0]}` });
      }
      
      // 檢查不良連結文字
      if (linkText.toLowerCase().includes('點擊') || 
          linkText.toLowerCase().includes('click') ||
          linkText.toLowerCase().includes('這裡')) {
        warnings.push({ file: filePath, message: `連結文字不夠描述性: "${linkText}"` });
      }
    }

    return { errors, warnings };
  }

  // 驗證醫療內容
  validateMedicalContent(content, filePath, frontmatter) {
    const errors = [];
    const warnings = [];

    if (!frontmatter || !frontmatter.specialty) {
      return { errors, warnings };
    }

    const specialty = frontmatter.specialty;

    // 檢查必要章節
    if (CONFIG.requiredSections[specialty]) {
      const requiredSecs = CONFIG.requiredSections[specialty];
      const headingPattern = /^#{2,6}\s+(.+)$/gm;
      const headings = [];
      let match;

      while ((match = headingPattern.exec(content)) !== null) {
        headings.push(match[1]);
      }

      for (const requiredSec of requiredSecs) {
        const hasSection = headings.some(heading => 
          heading.includes(requiredSec) || 
          heading.toLowerCase().includes(requiredSec.toLowerCase())
        );

        if (!hasSection) {
          warnings.push({ 
            file: filePath, 
            message: `建議包含「${requiredSec}」相關章節` 
          });
        }
      }
    }

    // 檢查危險詞彙
    for (const term of CONFIG.dangerousTerms) {
      if (content.includes(term)) {
        errors.push({ 
          file: filePath, 
          message: `發現可能危險的醫療建議詞彙「${term}」` 
        });
      }
    }

    // 檢查藥物劑量格式
    const dosagePattern = /\d+\s*(mg|g|ml|mcg|μg|IU|units?)\b/gi;
    const dosageMatches = content.match(dosagePattern);
    
    if (dosageMatches) {
      warnings.push({ 
        file: filePath, 
        message: `發現藥物劑量資訊，請確保準確性: ${dosageMatches.join(', ')}` 
      });
    }

    // 檢查醫療免責聲明
    const disclaimerKeywords = ['醫師', '專業', '建議', '診斷', '治療'];
    const hasDisclaimer = disclaimerKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );

    if (!hasDisclaimer && content.split(/\s+/).length > 500) {
      warnings.push({ 
        file: filePath, 
        message: '建議包含醫療免責聲明或專業建議提醒' 
      });
    }

    return { errors, warnings };
  }

  // 驗證專科配置
  async validateSpecialties() {
    if (!fs.existsSync(CONFIG.specialtiesDir)) {
      this.addWarning('系統', `專科配置目錄不存在: ${CONFIG.specialtiesDir}`);
      return;
    }

    const files = fs.readdirSync(CONFIG.specialtiesDir)
      .filter(file => file.endsWith('.json'));

    console.log(`📋 檢查 ${files.length} 個專科配置檔案`);

    for (const file of files) {
      const filePath = path.join(CONFIG.specialtiesDir, file);
      const relativePath = path.relative(process.cwd(), filePath);

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const config = JSON.parse(content);

        // 檢查必要欄位
        const requiredFields = ['name', 'description', 'reviewers'];
        for (const field of requiredFields) {
          if (!config.hasOwnProperty(field)) {
            this.addError(relativePath, `缺少必要欄位: ${field}`);
          }
        }

        // 檢查審核者格式
        if (config.reviewers && !Array.isArray(config.reviewers)) {
          this.addError(relativePath, 'reviewers 必須是陣列');
        }

      } catch (error) {
        this.addError(relativePath, `JSON 格式錯誤: ${error.message}`);
      }
    }
  }

  // 驗證模板
  async validateTemplates() {
    if (!fs.existsSync(CONFIG.templatesDir)) {
      this.addWarning('系統', `模板目錄不存在: ${CONFIG.templatesDir}`);
      return;
    }

    const files = this.getMarkdownFiles(CONFIG.templatesDir);
    console.log(`📄 檢查 ${files.length} 個模板檔案`);

    for (const file of files) {
      const relativePath = path.relative(process.cwd(), file);

      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // 檢查模板是否有 frontmatter
        if (!content.startsWith('---')) {
          this.addWarning(relativePath, '模板缺少 frontmatter');
        }

        // 檢查模板變數
        const variablePattern = /\{\{[^}]+\}\}/g;
        const variables = content.match(variablePattern);
        
        if (variables) {
          console.log(`  📝 ${relativePath}: 找到 ${variables.length} 個模板變數`);
        }

      } catch (error) {
        this.addError(relativePath, `模板讀取錯誤: ${error.message}`);
      }
    }
  }

  // 輔助方法
  getMarkdownFiles(dir) {
    const files = [];
    
    function scanDir(currentDir) {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (item.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    }
    
    scanDir(dir);
    return files;
  }

  addError(file, message) {
    this.errors.push({ file, message });
  }

  addWarning(file, message) {
    this.warnings.push({ file, message });
  }

  // 生成報告
  generateReport() {
    console.log('\n📊 驗證結果摘要');
    console.log('='.repeat(50));
    console.log(`總檔案數: ${this.stats.totalFiles}`);
    console.log(`✅ 通過: ${this.stats.validFiles}`);
    console.log(`⚠️ 警告: ${this.stats.warningFiles}`);
    console.log(`❌ 錯誤: ${this.stats.errorFiles}`);
    console.log(`🔍 總錯誤: ${this.errors.length}`);
    console.log(`⚠️ 總警告: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      console.log('\n❌ 錯誤詳情:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.file}: ${error.message}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ 警告詳情:');
      this.warnings.slice(0, 20).forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.file}: ${warning.message}`);
      });
      
      if (this.warnings.length > 20) {
        console.log(`... 還有 ${this.warnings.length - 20} 個警告`);
      }
    }

    // 生成 JSON 報告
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        passed: this.errors.length === 0,
        totalIssues: this.errors.length + this.warnings.length
      }
    };

    fs.writeFileSync('validation-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 詳細報告已儲存至 validation-report.json');
  }
}

// 主程式
async function main() {
  const validator = new ContentValidator();
  const success = await validator.validate();
  
  if (success) {
    console.log('\n🎉 所有內容驗證通過！');
    process.exit(0);
  } else {
    console.log('\n💥 內容驗證失敗，請修正錯誤後重試');
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

module.exports = ContentValidator;