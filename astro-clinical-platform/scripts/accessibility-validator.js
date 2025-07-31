#!/usr/bin/env node

/**
 * 無障礙性驗證工具
 * 專門檢查醫療衛教內容的無障礙性和可讀性
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 無障礙性檢查規則
const ACCESSIBILITY_RULES = {
  // 圖片無障礙性
  images: {
    minAltLength: 5,
    maxAltLength: 125,
    requiredAltPatterns: [
      /圖片|圖表|示意圖|照片|影像/,
      /chart|diagram|image|photo|figure/i
    ],
    avoidAltText: [
      '圖片', '圖', 'image', 'photo', 'picture',
      '點擊查看', 'click here', '這裡'
    ]
  },

  // 標題結構
  headings: {
    maxSkipLevel: 1,  // 標題層級最多跳躍1級
    minHeadingLength: 3,
    maxHeadingLength: 80,
    requiredHeadings: ['症狀', '治療', '預防'] // 醫療內容必要標題
  },

  // 連結無障礙性
  links: {
    minLinkTextLength: 3,
    avoidLinkText: [
      '點擊', '點此', '這裡', '更多', '詳情',
      'click', 'here', 'more', 'read more', 'link'
    ],
    requireDescriptiveText: true
  },

  // 表格無障礙性
  tables: {
    requireHeaders: true,
    requireCaption: true,
    maxColumns: 6,
    maxRows: 20
  },

  // 顏色和對比度
  colors: {
    avoidColorOnlyInfo: [
      '紅色', '綠色', '藍色', '黃色',
      'red', 'green', 'blue', 'yellow'
    ],
    requireTextAlternatives: true
  },

  // 可讀性
  readability: {
    maxSentenceLength: 25,      // 最大句子長度（字數）
    maxParagraphLength: 100,    // 最大段落長度（字數）
    minParagraphCount: 3,       // 最少段落數
    maxConsecutiveNumbers: 5,   // 連續數字最大長度
    requireSimpleLanguage: true
  }
};

// 醫療專業術語簡化建議
const MEDICAL_SIMPLIFICATION = {
  // 複雜術語的簡化建議
  complex_terms: {
    'myocardial infarction': '心肌梗塞（心臟病發作）',
    'cerebrovascular accident': '腦血管意外（中風）',
    'hypertension': '高血壓',
    'hypotension': '低血壓',
    'tachycardia': '心跳過快',
    'bradycardia': '心跳過慢',
    'arrhythmia': '心律不整',
    'pneumonia': '肺炎',
    'gastroenteritis': '腸胃炎',
    'osteoporosis': '骨質疏鬆症',
    'diabetes mellitus': '糖尿病',
    'rheumatoid arthritis': '類風濕性關節炎'
  },

  // 建議添加解釋的術語
  needs_explanation: [
    'ECG', 'MRI', 'CT', 'ICU', 'ER', 'IV', 'CPR',
    'BMI', 'HDL', 'LDL', 'HbA1c', 'PSA'
  ],

  // 避免使用的複雜句式
  complex_patterns: [
    /由於.*因此.*所以/g,
    /不僅.*而且.*同時/g,
    /雖然.*但是.*然而/g
  ]
};

class AccessibilityValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.suggestions = [];
    this.stats = {
      filesChecked: 0,
      imagesChecked: 0,
      linksChecked: 0,
      headingsChecked: 0,
      tablesChecked: 0,
      readabilityIssues: 0
    };
  }

  // 主要驗證方法
  async validateContent(contentDir = 'src/content/education') {
    console.log('♿ 開始無障礙性驗證...\n');

    if (!fs.existsSync(contentDir)) {
      this.addError('系統', `內容目錄不存在: ${contentDir}`);
      return false;
    }

    const files = this.getMarkdownFiles(contentDir);
    this.stats.filesChecked = files.length;

    console.log(`📁 找到 ${files.length} 個內容檔案`);

    for (const file of files) {
      await this.validateFile(file);
    }

    this.generateReport();
    return this.errors.length === 0;
  }

  // 驗證單個檔案
  async validateFile(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      
      let frontmatter = null;
      if (frontmatterMatch) {
        frontmatter = yaml.load(frontmatterMatch[1]);
      }

      const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, '');

      // 執行各種無障礙性檢查
      this.validateImages(bodyContent, relativePath);
      this.validateHeadings(bodyContent, relativePath);
      this.validateLinks(bodyContent, relativePath);
      this.validateTables(bodyContent, relativePath);
      this.validateColors(bodyContent, relativePath);
      this.validateReadability(bodyContent, relativePath);
      this.validateMedicalTerms(bodyContent, relativePath);

    } catch (error) {
      this.addError(relativePath, `檔案讀取錯誤: ${error.message}`);
    }
  }

  // 驗證圖片無障礙性
  validateImages(content, filePath) {
    const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    let imageCount = 0;

    while ((match = imagePattern.exec(content)) !== null) {
      imageCount++;
      const altText = match[1];
      const imagePath = match[2];

      // 檢查 alt 文字是否存在
      if (!altText || altText.trim() === '') {
        this.addError(filePath, `圖片缺少 alt 文字: ${match[0]}`);
        continue;
      }

      // 檢查 alt 文字長度
      if (altText.length < ACCESSIBILITY_RULES.images.minAltLength) {
        this.addWarning(filePath, `Alt 文字過短: "${altText}" (建議至少 ${ACCESSIBILITY_RULES.images.minAltLength} 字元)`);
      }

      if (altText.length > ACCESSIBILITY_RULES.images.maxAltLength) {
        this.addWarning(filePath, `Alt 文字過長: "${altText}" (建議少於 ${ACCESSIBILITY_RULES.images.maxAltLength} 字元)`);
      }

      // 檢查是否使用無意義的 alt 文字
      const hasAvoidText = ACCESSIBILITY_RULES.images.avoidAltText.some(avoid => 
        altText.toLowerCase().includes(avoid.toLowerCase())
      );

      if (hasAvoidText) {
        this.addWarning(filePath, `Alt 文字不夠描述性: "${altText}"，建議描述圖片內容而非圖片本身`);
      }

      // 檢查醫療圖片是否有適當描述
      if (this.isMedicalImage(imagePath, altText)) {
        this.validateMedicalImageAlt(altText, filePath);
      }
    }

    this.stats.imagesChecked += imageCount;

    // 檢查是否有圖片但沒有替代文字說明
    if (imageCount > 0) {
      const hasImageDescription = /圖.*說明|圖.*描述|如圖所示|圖中顯示/.test(content);
      if (!hasImageDescription && imageCount > 2) {
        this.addSuggestion(filePath, '建議在內文中提供圖片的文字說明，幫助視障使用者理解');
      }
    }
  }

  // 判斷是否為醫療相關圖片
  isMedicalImage(imagePath, altText) {
    const medicalKeywords = [
      '解剖', '器官', '症狀', '病變', '手術', '治療',
      'anatomy', 'organ', 'symptom', 'surgery', 'treatment',
      'x-ray', 'mri', 'ct', 'ultrasound', 'ecg'
    ];

    return medicalKeywords.some(keyword => 
      imagePath.toLowerCase().includes(keyword) || 
      altText.toLowerCase().includes(keyword)
    );
  }

  // 驗證醫療圖片的 alt 文字
  validateMedicalImageAlt(altText, filePath) {
    // 醫療圖片應該包含具體的醫療資訊
    const hasMedicalInfo = /位置|部位|症狀|病變|正常|異常|顯示|指出/.test(altText);
    
    if (!hasMedicalInfo) {
      this.addSuggestion(filePath, `醫療圖片建議: "${altText}" 可以更具體描述醫療相關資訊`);
    }
  }

  // 驗證標題結構
  validateHeadings(content, filePath) {
    const headingPattern = /^(#{1,6})\s+(.+)$/gm;
    const headings = [];
    let match;

    while ((match = headingPattern.exec(content)) !== null) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        line: content.substring(0, match.index).split('\n').length
      });
    }

    this.stats.headingsChecked += headings.length;

    if (headings.length === 0) {
      this.addError(filePath, '內容缺少標題結構，影響螢幕閱讀器導覽');
      return;
    }

    // 檢查標題層級跳躍
    for (let i = 1; i < headings.length; i++) {
      const prevLevel = headings[i - 1].level;
      const currentLevel = headings[i].level;
      
      if (currentLevel > prevLevel + ACCESSIBILITY_RULES.headings.maxSkipLevel) {
        this.addError(filePath, 
          `標題層級跳躍過大 (H${prevLevel} -> H${currentLevel}) 第 ${headings[i].line} 行: "${headings[i].text}"`
        );
      }
    }

    // 檢查標題長度
    headings.forEach(heading => {
      if (heading.text.length < ACCESSIBILITY_RULES.headings.minHeadingLength) {
        this.addWarning(filePath, `標題過短: "${heading.text}" (第 ${heading.line} 行)`);
      }
      
      if (heading.text.length > ACCESSIBILITY_RULES.headings.maxHeadingLength) {
        this.addWarning(filePath, `標題過長: "${heading.text}" (第 ${heading.line} 行)`);
      }
    });

    // 檢查醫療內容必要標題
    this.validateMedicalHeadings(headings, filePath);
  }

  // 驗證醫療內容標題
  validateMedicalHeadings(headings, filePath) {
    const headingTexts = headings.map(h => h.text);
    const missingHeadings = [];

    for (const required of ACCESSIBILITY_RULES.headings.requiredHeadings) {
      const hasHeading = headingTexts.some(text => 
        text.includes(required) || text.toLowerCase().includes(required.toLowerCase())
      );
      
      if (!hasHeading) {
        missingHeadings.push(required);
      }
    }

    if (missingHeadings.length > 0) {
      this.addSuggestion(filePath, 
        `建議添加醫療內容常見標題: ${missingHeadings.join(', ')}`
      );
    }
  }

  // 驗證連結無障礙性
  validateLinks(content, filePath) {
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    let linkCount = 0;

    while ((match = linkPattern.exec(content)) !== null) {
      linkCount++;
      const linkText = match[1];
      const url = match[2];

      // 檢查連結文字長度
      if (linkText.length < ACCESSIBILITY_RULES.links.minLinkTextLength) {
        this.addWarning(filePath, `連結文字過短: "${linkText}"`);
      }

      // 檢查是否使用無意義的連結文字
      const hasAvoidText = ACCESSIBILITY_RULES.links.avoidLinkText.some(avoid => 
        linkText.toLowerCase().includes(avoid.toLowerCase())
      );

      if (hasAvoidText) {
        this.addError(filePath, `連結文字不夠描述性: "${linkText}"，應描述連結目標內容`);
      }

      // 檢查外部連結是否有適當標示
      if (url.startsWith('http') && !url.includes(process.env.SITE_DOMAIN || 'localhost')) {
        this.validateExternalLink(linkText, url, filePath);
      }

      // 檢查醫療相關連結
      if (this.isMedicalLink(linkText, url)) {
        this.validateMedicalLink(linkText, url, filePath);
      }
    }

    this.stats.linksChecked += linkCount;
  }

  // 驗證外部連結
  validateExternalLink(linkText, url, filePath) {
    const hasExternalIndicator = /外部|external|新視窗|new window/.test(linkText);
    
    if (!hasExternalIndicator) {
      this.addSuggestion(filePath, 
        `外部連結建議: "${linkText}" 建議標示為外部連結或新視窗開啟`
      );
    }
  }

  // 判斷是否為醫療相關連結
  isMedicalLink(linkText, url) {
    const medicalKeywords = [
      '衛生署', '醫院', '診所', '醫學會', '健保',
      'hospital', 'clinic', 'medical', 'health', 'medicine'
    ];

    return medicalKeywords.some(keyword => 
      linkText.toLowerCase().includes(keyword) || 
      url.toLowerCase().includes(keyword)
    );
  }

  // 驗證醫療連結
  validateMedicalLink(linkText, url, filePath) {
    // 醫療連結應該指向可信的來源
    const trustedDomains = [
      'mohw.gov.tw',      // 衛福部
      'nhi.gov.tw',       // 健保署
      'cdc.gov.tw',       // 疾管署
      'fda.gov.tw',       // 食藥署
      'who.int',          // WHO
      'nih.gov',          // NIH
      'mayoclinic.org',   // Mayo Clinic
      'webmd.com'         // WebMD
    ];

    const isTrusted = trustedDomains.some(domain => url.includes(domain));
    
    if (!isTrusted && url.startsWith('http')) {
      this.addSuggestion(filePath, 
        `醫療連結建議: "${linkText}" 建議連結到官方或權威醫療機構網站`
      );
    }
  }

  // 驗證表格無障礙性
  validateTables(content, filePath) {
    const tablePattern = /\|.*\|/g;
    const tables = content.match(tablePattern);
    
    if (!tables) return;

    this.stats.tablesChecked++;

    // 檢查表格標題
    const hasTableHeader = /\|.*\|\s*\n\|[-:]+\|/.test(content);
    if (!hasTableHeader) {
      this.addError(filePath, '表格缺少標題行，影響螢幕閱讀器理解');
    }

    // 檢查表格說明
    const hasTableCaption = /表\s*\d+|Table\s*\d+|如下表|下表顯示/.test(content);
    if (!hasTableCaption) {
      this.addSuggestion(filePath, '建議為表格添加說明文字，幫助理解表格內容');
    }

    // 檢查表格複雜度
    const columnCount = (tables[0].match(/\|/g) || []).length - 1;
    if (columnCount > ACCESSIBILITY_RULES.tables.maxColumns) {
      this.addWarning(filePath, 
        `表格欄位過多 (${columnCount} 欄)，建議簡化或分割表格`
      );
    }
  }

  // 驗證顏色使用
  validateColors(content, filePath) {
    const colorReferences = ACCESSIBILITY_RULES.colors.avoidColorOnlyInfo;
    
    for (const color of colorReferences) {
      const colorPattern = new RegExp(`${color}.*表示|${color}.*代表|${color}.*顯示`, 'gi');
      if (colorPattern.test(content)) {
        this.addWarning(filePath, 
          `顏色無障礙: 發現僅使用顏色 "${color}" 傳達資訊，建議添加文字或符號說明`
        );
      }
    }
  }

  // 驗證可讀性
  validateReadability(content, filePath) {
    const sentences = content.split(/[。！？.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    // 檢查句子長度
    const longSentences = sentences.filter(sentence => {
      const wordCount = sentence.split(/\s+/).length;
      return wordCount > ACCESSIBILITY_RULES.readability.maxSentenceLength;
    });

    if (longSentences.length > 0) {
      this.addWarning(filePath, 
        `發現 ${longSentences.length} 個過長句子，建議分割以提高可讀性`
      );
      this.stats.readabilityIssues++;
    }

    // 檢查段落長度
    const longParagraphs = paragraphs.filter(paragraph => {
      const wordCount = paragraph.split(/\s+/).length;
      return wordCount > ACCESSIBILITY_RULES.readability.maxParagraphLength;
    });

    if (longParagraphs.length > 0) {
      this.addWarning(filePath, 
        `發現 ${longParagraphs.length} 個過長段落，建議分段以提高可讀性`
      );
      this.stats.readabilityIssues++;
    }

    // 檢查段落數量
    if (paragraphs.length < ACCESSIBILITY_RULES.readability.minParagraphCount) {
      this.addSuggestion(filePath, '建議增加段落分隔，提高內容結構清晰度');
    }

    // 檢查連續數字
    const numberPattern = /\d{6,}/g;
    const longNumbers = content.match(numberPattern);
    if (longNumbers) {
      this.addSuggestion(filePath, 
        `發現長數字串 ${longNumbers.join(', ')}，建議使用空格或連字號分隔`
      );
    }
  }

  // 驗證醫療術語可讀性
  validateMedicalTerms(content, filePath) {
    // 檢查複雜術語
    for (const [complex, simple] of Object.entries(MEDICAL_SIMPLIFICATION.complex_terms)) {
      const regex = new RegExp(`\\b${complex}\\b`, 'gi');
      if (regex.test(content)) {
        // 檢查是否已有解釋
        const hasExplanation = content.includes(simple) || 
                              content.includes('（') || 
                              content.includes('(');
        
        if (!hasExplanation) {
          this.addSuggestion(filePath, 
            `術語簡化建議: "${complex}" 建議添加解釋，如 "${simple}"`
          );
        }
      }
    }

    // 檢查需要解釋的縮寫
    for (const abbr of MEDICAL_SIMPLIFICATION.needs_explanation) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'g');
      const matches = content.match(regex);
      
      if (matches && matches.length > 0) {
        // 檢查首次出現時是否有完整名稱
        const firstOccurrence = content.indexOf(abbr);
        const beforeText = content.substring(Math.max(0, firstOccurrence - 50), firstOccurrence);
        const afterText = content.substring(firstOccurrence, firstOccurrence + 50);
        
        const hasFullForm = /\([^)]*\)|（[^）]*）/.test(beforeText + afterText);
        
        if (!hasFullForm) {
          this.addSuggestion(filePath, 
            `縮寫說明建議: "${abbr}" 首次出現時建議提供完整名稱`
          );
        }
      }
    }

    // 檢查複雜句式
    for (const pattern of MEDICAL_SIMPLIFICATION.complex_patterns) {
      if (pattern.test(content)) {
        this.addSuggestion(filePath, '句式簡化建議: 發現複雜句式，建議簡化以提高可讀性');
        break;
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
    this.errors.push({ file, message, type: 'error' });
  }

  addWarning(file, message) {
    this.warnings.push({ file, message, type: 'warning' });
  }

  addSuggestion(file, message) {
    this.suggestions.push({ file, message, type: 'suggestion' });
  }

  // 生成報告
  generateReport() {
    console.log('\n📊 無障礙性驗證結果');
    console.log('='.repeat(50));
    console.log(`檢查檔案: ${this.stats.filesChecked}`);
    console.log(`檢查圖片: ${this.stats.imagesChecked}`);
    console.log(`檢查連結: ${this.stats.linksChecked}`);
    console.log(`檢查標題: ${this.stats.headingsChecked}`);
    console.log(`檢查表格: ${this.stats.tablesChecked}`);
    console.log(`❌ 錯誤: ${this.errors.length}`);
    console.log(`⚠️ 警告: ${this.warnings.length}`);
    console.log(`💡 建議: ${this.suggestions.length}`);

    if (this.errors.length > 0) {
      console.log('\n❌ 無障礙性錯誤:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.file}: ${error.message}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ 無障礙性警告:');
      this.warnings.slice(0, 15).forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.file}: ${warning.message}`);
      });
      
      if (this.warnings.length > 15) {
        console.log(`... 還有 ${this.warnings.length - 15} 個警告`);
      }
    }

    if (this.suggestions.length > 0) {
      console.log('\n💡 無障礙性改善建議:');
      this.suggestions.slice(0, 10).forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion.file}: ${suggestion.message}`);
      });
      
      if (this.suggestions.length > 10) {
        console.log(`... 還有 ${this.suggestions.length - 10} 個建議`);
      }
    }

    // 生成 JSON 報告
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      errors: this.errors,
      warnings: this.warnings,
      suggestions: this.suggestions,
      summary: {
        passed: this.errors.length === 0,
        totalIssues: this.errors.length + this.warnings.length + this.suggestions.length,
        accessibilityScore: this.calculateAccessibilityScore()
      }
    };

    fs.writeFileSync('accessibility-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 詳細報告已儲存至 accessibility-report.json');
  }

  // 計算無障礙性分數
  calculateAccessibilityScore() {
    const totalChecks = this.stats.imagesChecked + this.stats.linksChecked + 
                       this.stats.headingsChecked + this.stats.tablesChecked;
    
    if (totalChecks === 0) return 0;

    const totalIssues = this.errors.length + this.warnings.length * 0.5;
    const score = Math.max(0, Math.min(100, 100 - (totalIssues / totalChecks * 100)));
    
    return Math.round(score);
  }
}

// 主程式
async function main() {
  const validator = new AccessibilityValidator();
  const success = await validator.validateContent();
  
  if (success) {
    console.log('\n🎉 無障礙性驗證通過！');
    process.exit(0);
  } else {
    console.log('\n💥 發現無障礙性問題，請修正後重試');
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

module.exports = AccessibilityValidator;