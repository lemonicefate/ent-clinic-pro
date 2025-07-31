#!/usr/bin/env node

/**
 * 參考文獻格式檢查工具
 * 專門檢查醫療衛教內容的參考文獻格式和引用準確性
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 參考文獻格式規範
const REFERENCE_FORMATS = {
  // 期刊文章格式
  journal: {
    pattern: /^(.+?)\.\s*(.+?)\.\s*(.+?)\.\s*(\d{4});?\s*(\d+)?\(?(\d+)?\)?:?\s*(\d+-?\d*)\./,
    required: ['authors', 'title', 'journal', 'year'],
    example: 'Smith J, Doe A. Title of Article. Journal Name. 2023;15(2):123-130.'
  },

  // 書籍格式
  book: {
    pattern: /^(.+?)\.\s*(.+?)\.\s*(.+?):\s*(.+?);\s*(\d{4})\./,
    required: ['authors', 'title', 'city', 'publisher', 'year'],
    example: 'Author A. Book Title. City: Publisher; 2023.'
  },

  // 網站格式
  website: {
    pattern: /^(.+?)\.\s*(.+?)\.\s*Available at:\s*(https?:\/\/.+?)\.\s*Accessed\s+(.+?)\./,
    required: ['organization', 'title', 'url', 'accessDate'],
    example: 'Organization. Page Title. Available at: https://example.com. Accessed January 1, 2023.'
  },

  // 政府文件格式
  government: {
    pattern: /^(.+?)\.\s*(.+?)\.\s*(.+?);\s*(\d{4})\./,
    required: ['agency', 'title', 'location', 'year'],
    example: 'Ministry of Health. Document Title. Taipei; 2023.'
  }
};

// 可信的醫療資源域名
const TRUSTED_DOMAINS = [
  // 台灣官方機構
  'mohw.gov.tw',          // 衛生福利部
  'nhi.gov.tw',           // 健保署
  'cdc.gov.tw',           // 疾病管制署
  'fda.gov.tw',           // 食品藥物管理署
  'hpa.gov.tw',           // 國民健康署
  'tfda.gov.tw',          // 食藥署

  // 國際權威機構
  'who.int',              // 世界衛生組織
  'nih.gov',              // 美國國家衛生研究院
  'cdc.gov',              // 美國疾病控制中心
  'fda.gov',              // 美國食品藥物管理局
  'ema.europa.eu',        // 歐洲藥品管理局

  // 知名醫療機構
  'mayoclinic.org',       // 梅奧診所
  'clevelandclinic.org',  // 克里夫蘭診所
  'hopkinsmedicine.org',  // 約翰霍普金斯醫學院
  'health.harvard.edu',   // 哈佛健康

  // 醫學期刊和資料庫
  'pubmed.ncbi.nlm.nih.gov', // PubMed
  'cochranelibrary.com',      // Cochrane Library
  'nejm.org',                 // New England Journal of Medicine
  'thelancet.com',            // The Lancet
  'bmj.com',                  // BMJ
  'jamanetwork.com',          // JAMA Network

  // 專業醫學會
  'acc.org',              // 美國心臟病學會
  'heart.org',            // 美國心臟協會
  'diabetes.org',         // 美國糖尿病協會
  'cancer.org',           // 美國癌症協會
  'alzheimers.org.uk'     // 阿茲海默症協會
];

// 不可信或需要謹慎的來源
const QUESTIONABLE_SOURCES = [
  'wikipedia.org',
  'baidu.com',
  'yahoo.com',
  'ask.com',
  'answers.com',
  'quora.com',
  'reddit.com',
  'facebook.com',
  'twitter.com',
  'instagram.com',
  'youtube.com',
  'tiktok.com',
  'blog',
  'wordpress',
  'blogspot',
  'medium.com'
];

// 醫學期刊影響因子分級（簡化版）
const JOURNAL_IMPACT_LEVELS = {
  high: [
    'New England Journal of Medicine',
    'The Lancet',
    'JAMA',
    'Nature Medicine',
    'Cell',
    'Science',
    'Nature'
  ],
  medium: [
    'BMJ',
    'Circulation',
    'Journal of Clinical Investigation',
    'Annals of Internal Medicine',
    'PLOS Medicine'
  ],
  // 其他期刊歸類為 low 或 unknown
};

class ReferenceFormatChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.suggestions = [];
    this.stats = {
      filesChecked: 0,
      referencesFound: 0,
      validReferences: 0,
      invalidReferences: 0,
      trustedSources: 0,
      questionableSources: 0,
      missingReferences: 0
    };
  }

  // 主要檢查方法
  async checkReferences(contentDir = 'src/content/education') {
    console.log('📚 開始參考文獻格式檢查...\n');

    if (!fs.existsSync(contentDir)) {
      this.addError('系統', `內容目錄不存在: ${contentDir}`);
      return false;
    }

    const files = this.getMarkdownFiles(contentDir);
    this.stats.filesChecked = files.length;

    console.log(`📁 找到 ${files.length} 個內容檔案`);

    for (const file of files) {
      await this.checkFile(file);
    }

    this.generateReport();
    return this.errors.length === 0;
  }

  // 檢查單個檔案
  async checkFile(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      
      let frontmatter = null;
      if (frontmatterMatch) {
        frontmatter = yaml.load(frontmatterMatch[1]);
      }

      const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, '');

      // 檢查是否需要參考文獻
      const needsReferences = this.shouldHaveReferences(bodyContent, frontmatter);
      
      // 尋找參考文獻區段
      const referencesSection = this.extractReferencesSection(bodyContent);
      
      if (needsReferences && !referencesSection) {
        this.addError(relativePath, '醫療內容缺少參考文獻區段');
        this.stats.missingReferences++;
        return;
      }

      if (referencesSection) {
        this.checkReferencesFormat(referencesSection, relativePath);
        this.checkInTextCitations(bodyContent, referencesSection, relativePath);
        this.checkSourceCredibility(referencesSection, relativePath);
        this.checkReferenceRecency(referencesSection, relativePath);
      }

    } catch (error) {
      this.addError(relativePath, `檔案讀取錯誤: ${error.message}`);
    }
  }

  // 判斷是否需要參考文獻
  shouldHaveReferences(content, frontmatter) {
    // 醫療內容通常需要參考文獻
    const medicalKeywords = [
      '治療', '診斷', '症狀', '藥物', '手術', '研究', '臨床',
      'treatment', 'diagnosis', 'symptoms', 'medication', 'surgery', 'study', 'clinical'
    ];

    const hasStatistics = /\d+%|\d+\.\d+%|研究顯示|統計|數據/.test(content);
    const hasMedicalClaims = medicalKeywords.some(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );
    const isLongContent = content.split(/\s+/).length > 500;

    return hasStatistics || hasMedicalClaims || isLongContent;
  }

  // 提取參考文獻區段
  extractReferencesSection(content) {
    const referencePatterns = [
      /## 參考文獻\s*([\s\S]*?)(?=\n## |\n# |$)/i,
      /## References\s*([\s\S]*?)(?=\n## |\n# |$)/i,
      /## 參考資料\s*([\s\S]*?)(?=\n## |\n# |$)/i,
      /## 資料來源\s*([\s\S]*?)(?=\n## |\n# |$)/i
    ];

    for (const pattern of referencePatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  // 檢查參考文獻格式
  checkReferencesFormat(referencesSection, filePath) {
    const references = this.parseReferences(referencesSection);
    this.stats.referencesFound += references.length;

    if (references.length === 0) {
      this.addWarning(filePath, '參考文獻區段存在但沒有找到有效的參考文獻');
      return;
    }

    references.forEach((ref, index) => {
      const refNumber = index + 1;
      const formatResult = this.validateReferenceFormat(ref, refNumber);
      
      if (formatResult.isValid) {
        this.stats.validReferences++;
      } else {
        this.stats.invalidReferences++;
        this.addError(filePath, `參考文獻 ${refNumber} 格式錯誤: ${formatResult.error}`);
        
        if (formatResult.suggestion) {
          this.addSuggestion(filePath, `參考文獻 ${refNumber} 建議格式: ${formatResult.suggestion}`);
        }
      }
    });
  }

  // 解析參考文獻列表
  parseReferences(referencesSection) {
    const references = [];
    
    // 匹配編號列表格式
    const numberedPattern = /^\d+\.\s*(.+?)(?=\n\d+\.|\n\n|$)/gm;
    let match;

    while ((match = numberedPattern.exec(referencesSection)) !== null) {
      references.push(match[1].trim());
    }

    // 如果沒有找到編號格式，嘗試匹配項目符號格式
    if (references.length === 0) {
      const bulletPattern = /^[-*]\s*(.+?)(?=\n[-*]|\n\n|$)/gm;
      while ((match = bulletPattern.exec(referencesSection)) !== null) {
        references.push(match[1].trim());
      }
    }

    return references;
  }

  // 驗證單個參考文獻格式
  validateReferenceFormat(reference, refNumber) {
    // 移除多餘空白
    const cleanRef = reference.replace(/\s+/g, ' ').trim();

    // 檢查基本要求
    if (cleanRef.length < 20) {
      return {
        isValid: false,
        error: '參考文獻過短，缺少必要資訊',
        suggestion: '請包含作者、標題、來源、年份等完整資訊'
      };
    }

    // 檢查是否以句號結尾
    if (!cleanRef.endsWith('.')) {
      return {
        isValid: false,
        error: '參考文獻應以句號結尾',
        suggestion: cleanRef + '.'
      };
    }

    // 檢查年份
    const yearPattern = /\b(19|20)\d{2}\b/;
    if (!yearPattern.test(cleanRef)) {
      return {
        isValid: false,
        error: '缺少發表年份',
        suggestion: '請添加發表年份（格式：YYYY）'
      };
    }

    // 檢查URL格式（如果有的話）
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const urls = cleanRef.match(urlPattern);
    if (urls) {
      for (const url of urls) {
        if (!this.isValidUrl(url)) {
          return {
            isValid: false,
            error: `無效的URL格式: ${url}`,
            suggestion: '請檢查URL是否完整且可訪問'
          };
        }
      }
    }

    // 嘗試匹配已知格式
    const formatMatch = this.matchKnownFormat(cleanRef);
    if (formatMatch.matched) {
      return {
        isValid: true,
        format: formatMatch.format,
        details: formatMatch.details
      };
    }

    // 如果不匹配已知格式，但包含基本要素，給予警告而非錯誤
    return {
      isValid: true,
      warning: '參考文獻格式不標準，建議使用標準學術格式',
      suggestion: this.suggestStandardFormat(cleanRef)
    };
  }

  // 匹配已知格式
  matchKnownFormat(reference) {
    for (const [formatName, format] of Object.entries(REFERENCE_FORMATS)) {
      const match = reference.match(format.pattern);
      if (match) {
        return {
          matched: true,
          format: formatName,
          details: this.extractFormatDetails(match, format)
        };
      }
    }

    return { matched: false };
  }

  // 提取格式詳細資訊
  extractFormatDetails(match, format) {
    const details = {};
    
    switch (format) {
      case REFERENCE_FORMATS.journal:
        details.authors = match[1];
        details.title = match[2];
        details.journal = match[3];
        details.year = match[4];
        details.volume = match[5];
        details.issue = match[6];
        details.pages = match[7];
        break;
      
      case REFERENCE_FORMATS.book:
        details.authors = match[1];
        details.title = match[2];
        details.city = match[3];
        details.publisher = match[4];
        details.year = match[5];
        break;
      
      case REFERENCE_FORMATS.website:
        details.organization = match[1];
        details.title = match[2];
        details.url = match[3];
        details.accessDate = match[4];
        break;
    }

    return details;
  }

  // 建議標準格式
  suggestStandardFormat(reference) {
    if (reference.includes('http')) {
      return REFERENCE_FORMATS.website.example;
    } else if (reference.includes('Journal') || reference.includes('期刊')) {
      return REFERENCE_FORMATS.journal.example;
    } else {
      return REFERENCE_FORMATS.book.example;
    }
  }

  // 檢查內文引用
  checkInTextCitations(content, referencesSection, filePath) {
    const references = this.parseReferences(referencesSection);
    const totalRefs = references.length;

    // 尋找內文中的引用標記
    const citationPatterns = [
      /\[(\d+)\]/g,           // [1], [2]
      /\((\d+)\)/g,           // (1), (2)
      /\^(\d+)/g,             // ^1, ^2
      /\[(\d+)-(\d+)\]/g      // [1-3]
    ];

    const citedNumbers = new Set();
    
    citationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[2]) {
          // 範圍引用 [1-3]
          const start = parseInt(match[1]);
          const end = parseInt(match[2]);
          for (let i = start; i <= end; i++) {
            citedNumbers.add(i);
          }
        } else {
          citedNumbers.add(parseInt(match[1]));
        }
      }
    });

    // 檢查引用編號是否超出範圍
    const maxCited = Math.max(...citedNumbers);
    if (maxCited > totalRefs) {
      this.addError(filePath, `內文引用編號 ${maxCited} 超出參考文獻總數 ${totalRefs}`);
    }

    // 檢查是否有未被引用的參考文獻
    const uncitedRefs = [];
    for (let i = 1; i <= totalRefs; i++) {
      if (!citedNumbers.has(i)) {
        uncitedRefs.push(i);
      }
    }

    if (uncitedRefs.length > 0) {
      this.addWarning(filePath, `參考文獻 ${uncitedRefs.join(', ')} 在內文中未被引用`);
    }

    // 檢查是否有重要聲明缺少引用
    this.checkMissingCitations(content, filePath);
  }

  // 檢查缺少引用的重要聲明
  checkMissingCitations(content, filePath) {
    const needsCitationPatterns = [
      /研究顯示(?!\s*\[)/g,
      /統計資料(?!\s*\[)/g,
      /根據.*研究(?!\s*\[)/g,
      /\d+%的患者(?!\s*\[)/g,
      /臨床試驗證實(?!\s*\[)/g,
      /專家建議(?!\s*\[)/g,
      /最新研究(?!\s*\[)/g,
      /according to studies(?!\s*\[)/gi,
      /research shows(?!\s*\[)/gi,
      /\d+% of patients(?!\s*\[)/gi
    ];

    needsCitationPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          this.addWarning(filePath, `聲明 "${match}" 建議添加參考文獻引用`);
        });
      }
    });
  }

  // 檢查來源可信度
  checkSourceCredibility(referencesSection, filePath) {
    const references = this.parseReferences(referencesSection);

    references.forEach((ref, index) => {
      const refNumber = index + 1;
      
      // 檢查URL來源
      const urlPattern = /(https?:\/\/[^\s]+)/g;
      const urls = ref.match(urlPattern);
      
      if (urls) {
        urls.forEach(url => {
          const domain = this.extractDomain(url);
          
          if (TRUSTED_DOMAINS.some(trusted => domain.includes(trusted))) {
            this.stats.trustedSources++;
          } else if (QUESTIONABLE_SOURCES.some(questionable => domain.includes(questionable))) {
            this.stats.questionableSources++;
            this.addWarning(filePath, 
              `參考文獻 ${refNumber} 來源可信度存疑: ${domain}，建議使用權威醫療機構資源`
            );
          }
        });
      }

      // 檢查期刊影響因子
      this.checkJournalImpact(ref, refNumber, filePath);
    });
  }

  // 檢查期刊影響因子
  checkJournalImpact(reference, refNumber, filePath) {
    const journalName = this.extractJournalName(reference);
    
    if (journalName) {
      if (JOURNAL_IMPACT_LEVELS.high.some(journal => 
        journalName.toLowerCase().includes(journal.toLowerCase())
      )) {
        // 高影響因子期刊，給予正面標記
        this.addSuggestion(filePath, `參考文獻 ${refNumber} 來自高影響因子期刊: ${journalName}`);
      } else if (JOURNAL_IMPACT_LEVELS.medium.some(journal => 
        journalName.toLowerCase().includes(journal.toLowerCase())
      )) {
        // 中等影響因子期刊
        this.addSuggestion(filePath, `參考文獻 ${refNumber} 來自知名期刊: ${journalName}`);
      }
    }
  }

  // 提取期刊名稱
  extractJournalName(reference) {
    // 嘗試匹配期刊格式中的期刊名稱
    const journalPatterns = [
      /\.\s*(.+?)\.\s*\d{4}/,  // 標準期刊格式
      /in\s+(.+?)\.\s*\d{4}/i, // "in Journal Name. 2023"
      /Journal of (.+?)\./i,    // "Journal of ..."
      /(.+?)\s+Journal/i        // "Name Journal"
    ];

    for (const pattern of journalPatterns) {
      const match = reference.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  // 檢查參考文獻時效性
  checkReferenceRecency(referencesSection, filePath) {
    const references = this.parseReferences(referencesSection);
    const currentYear = new Date().getFullYear();
    const oldThreshold = 5; // 5年以上視為較舊

    let oldReferences = 0;
    let veryOldReferences = 0;

    references.forEach((ref, index) => {
      const refNumber = index + 1;
      const yearMatch = ref.match(/\b(19|20)(\d{2})\b/);
      
      if (yearMatch) {
        const year = parseInt(yearMatch[0]);
        const age = currentYear - year;
        
        if (age > oldThreshold) {
          oldReferences++;
          
          if (age > 10) {
            veryOldReferences++;
            this.addWarning(filePath, 
              `參考文獻 ${refNumber} 較為陳舊 (${year})，建議尋找更新的資料來源`
            );
          }
        }
      }
    });

    // 如果大部分參考文獻都很舊，給出整體建議
    const oldRatio = oldReferences / references.length;
    if (oldRatio > 0.5) {
      this.addSuggestion(filePath, 
        `${Math.round(oldRatio * 100)}% 的參考文獻超過 ${oldThreshold} 年，建議更新資料來源`
      );
    }
  }

  // 輔助方法
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return '';
    }
  }

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
    console.log('\n📊 參考文獻檢查結果');
    console.log('='.repeat(50));
    console.log(`檢查檔案: ${this.stats.filesChecked}`);
    console.log(`找到參考文獻: ${this.stats.referencesFound}`);
    console.log(`有效參考文獻: ${this.stats.validReferences}`);
    console.log(`無效參考文獻: ${this.stats.invalidReferences}`);
    console.log(`可信來源: ${this.stats.trustedSources}`);
    console.log(`存疑來源: ${this.stats.questionableSources}`);
    console.log(`缺少參考文獻: ${this.stats.missingReferences}`);
    console.log(`❌ 錯誤: ${this.errors.length}`);
    console.log(`⚠️ 警告: ${this.warnings.length}`);
    console.log(`💡 建議: ${this.suggestions.length}`);

    if (this.errors.length > 0) {
      console.log('\n❌ 參考文獻錯誤:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.file}: ${error.message}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ 參考文獻警告:');
      this.warnings.slice(0, 15).forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.file}: ${warning.message}`);
      });
      
      if (this.warnings.length > 15) {
        console.log(`... 還有 ${this.warnings.length - 15} 個警告`);
      }
    }

    if (this.suggestions.length > 0) {
      console.log('\n💡 參考文獻改善建議:');
      this.suggestions.slice(0, 10).forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion.file}: ${suggestion.message}`);
      });
      
      if (this.suggestions.length > 10) {
        console.log(`... 還有 ${this.suggestions.length - 10} 個建議`);
      }
    }

    // 顯示參考文獻格式範例
    console.log('\n📖 標準參考文獻格式範例:');
    console.log('期刊文章:', REFERENCE_FORMATS.journal.example);
    console.log('書籍:', REFERENCE_FORMATS.book.example);
    console.log('網站:', REFERENCE_FORMATS.website.example);
    console.log('政府文件:', REFERENCE_FORMATS.government.example);

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
        referenceQualityScore: this.calculateReferenceQualityScore()
      }
    };

    fs.writeFileSync('reference-format-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 詳細報告已儲存至 reference-format-report.json');
  }

  // 計算參考文獻品質分數
  calculateReferenceQualityScore() {
    if (this.stats.referencesFound === 0) return 0;

    const validRatio = this.stats.validReferences / this.stats.referencesFound;
    const trustedRatio = this.stats.trustedSources / Math.max(this.stats.referencesFound, 1);
    const errorPenalty = this.errors.length * 10;
    const warningPenalty = this.warnings.length * 5;

    const score = Math.max(0, Math.min(100, 
      (validRatio * 50) + (trustedRatio * 30) + 20 - errorPenalty - warningPenalty
    ));

    return Math.round(score);
  }
}

// 主程式
async function main() {
  const checker = new ReferenceFormatChecker();
  const success = await checker.checkReferences();
  
  if (success) {
    console.log('\n🎉 參考文獻檢查通過！');
    process.exit(0);
  } else {
    console.log('\n💥 發現參考文獻問題，請修正後重試');
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

module.exports = ReferenceFormatChecker;