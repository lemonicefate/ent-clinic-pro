#!/usr/bin/env node

/**
 * 可讀性分析工具
 * 分析醫療衛教內容的可讀性和內容長度
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 可讀性分析配置
const READABILITY_CONFIG = {
  // 字數統計
  wordCount: {
    min: 200,
    max: 3000,
    optimal: { min: 800, max: 1500 }
  },

  // 句子分析
  sentence: {
    maxLength: 25,        // 最大句子長度（字數）
    optimalLength: 15,    // 最佳句子長度
    maxPerParagraph: 8    // 每段最大句子數
  },

  // 段落分析
  paragraph: {
    maxLength: 100,       // 最大段落長度（字數）
    optimalLength: 60,    // 最佳段落長度
    minCount: 3,          // 最少段落數
    maxCount: 20          // 最多段落數
  },

  // 閱讀時間估算
  readingTime: {
    wordsPerMinute: 200,  // 每分鐘閱讀字數
    optimalMinutes: { min: 3, max: 8 }
  },

  // 複雜度指標
  complexity: {
    maxSyllablesPerWord: 3,
    maxComplexWordsRatio: 0.15,  // 複雜詞彙比例
    maxPassiveVoiceRatio: 0.20   // 被動語態比例
  }
};

// 醫療術語複雜度分類
const MEDICAL_COMPLEXITY = {
  // 簡單術語（一般民眾容易理解）
  simple: [
    '感冒', '發燒', '頭痛', '咳嗽', '流鼻水',
    '血壓', '心跳', '呼吸', '體溫', '體重',
    '藥物', '治療', '檢查', '手術', '復健'
  ],

  // 中等複雜度術語（需要簡單解釋）
  moderate: [
    '高血壓', '糖尿病', '心臟病', '中風', '癌症',
    '關節炎', '骨質疏鬆', '失智症', '憂鬱症',
    '肺炎', '腎臟病', '肝炎', '胃潰瘍'
  ],

  // 複雜術語（需要詳細解釋）
  complex: [
    'myocardial infarction', 'cerebrovascular accident',
    'hypertension', 'diabetes mellitus', 'osteoporosis',
    'rheumatoid arthritis', 'Alzheimer\'s disease',
    'pneumonia', 'gastroenteritis', 'nephritis'
  ],

  // 專業術語（醫療專業用語）
  professional: [
    'electrocardiogram', 'magnetic resonance imaging',
    'computed tomography', 'echocardiography',
    'endoscopy', 'biopsy', 'pathology', 'pharmacology'
  ]
};

// 可讀性改善建議
const READABILITY_SUGGESTIONS = {
  // 句子結構改善
  sentence_structure: [
    '使用主動語態代替被動語態',
    '將長句分割成短句',
    '避免使用過多的從句',
    '使用簡單的連接詞'
  ],

  // 詞彙選擇
  vocabulary: [
    '使用常見詞彙代替專業術語',
    '為專業術語提供解釋',
    '避免使用縮寫，或在首次使用時說明',
    '使用具體的詞彙代替抽象概念'
  ],

  // 段落組織
  paragraph_organization: [
    '每段只討論一個主題',
    '使用過渡句連接段落',
    '將重要資訊放在段落開頭',
    '使用列表來組織複雜資訊'
  ],

  // 視覺輔助
  visual_aids: [
    '使用標題和副標題組織內容',
    '添加圖表和插圖輔助說明',
    '使用粗體強調重要資訊',
    '適當使用空白和分隔線'
  ]
};

class ReadabilityAnalyzer {
  constructor() {
    this.results = [];
    this.stats = {
      filesAnalyzed: 0,
      totalWords: 0,
      totalSentences: 0,
      totalParagraphs: 0,
      averageReadingTime: 0,
      complexityDistribution: {
        simple: 0,
        moderate: 0,
        complex: 0,
        professional: 0
      }
    };
  }

  // 主要分析方法
  async analyzeContent(contentDir = 'src/content/education') {
    console.log('📖 開始可讀性分析...\n');

    if (!fs.existsSync(contentDir)) {
      console.error(`❌ 內容目錄不存在: ${contentDir}`);
      return false;
    }

    const files = this.getMarkdownFiles(contentDir);
    this.stats.filesAnalyzed = files.length;

    console.log(`📁 找到 ${files.length} 個內容檔案`);

    for (const file of files) {
      await this.analyzeFile(file);
    }

    this.calculateOverallStats();
    this.generateReport();
    return true;
  }

  // 分析單個檔案
  async analyzeFile(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      
      let frontmatter = null;
      if (frontmatterMatch) {
        frontmatter = yaml.load(frontmatterMatch[1]);
      }

      const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, '');
      
      // 執行各種可讀性分析
      const analysis = {
        file: relativePath,
        title: frontmatter?.title || '未知標題',
        specialty: frontmatter?.specialty || 'general',
        wordCount: this.countWords(bodyContent),
        sentenceCount: this.countSentences(bodyContent),
        paragraphCount: this.countParagraphs(bodyContent),
        readingTime: this.calculateReadingTime(bodyContent),
        averageSentenceLength: 0,
        averageParagraphLength: 0,
        complexityScore: 0,
        readabilityScore: 0,
        issues: [],
        suggestions: []
      };

      // 計算平均值
      analysis.averageSentenceLength = analysis.sentenceCount > 0 ? 
        Math.round(analysis.wordCount / analysis.sentenceCount) : 0;
      
      analysis.averageParagraphLength = analysis.paragraphCount > 0 ? 
        Math.round(analysis.wordCount / analysis.paragraphCount) : 0;

      // 詳細分析
      this.analyzeSentenceStructure(bodyContent, analysis);
      this.analyzeParagraphStructure(bodyContent, analysis);
      this.analyzeVocabularyComplexity(bodyContent, analysis);
      this.analyzeReadabilityMetrics(bodyContent, analysis);
      this.generateSuggestions(analysis);

      this.results.push(analysis);

      // 更新統計
      this.stats.totalWords += analysis.wordCount;
      this.stats.totalSentences += analysis.sentenceCount;
      this.stats.totalParagraphs += analysis.paragraphCount;

    } catch (error) {
      console.error(`❌ 分析檔案錯誤 ${relativePath}: ${error.message}`);
    }
  }

  // 字數統計
  countWords(content) {
    // 移除 Markdown 語法
    const cleanContent = content
      .replace(/!\[.*?\]\(.*?\)/g, '')  // 圖片
      .replace(/\[.*?\]\(.*?\)/g, '')   // 連結
      .replace(/#{1,6}\s+/g, '')        // 標題
      .replace(/\*\*.*?\*\*/g, '')      // 粗體
      .replace(/\*.*?\*/g, '')          // 斜體
      .replace(/`.*?`/g, '')            // 程式碼
      .replace(/---/g, '')              // 分隔線
      .replace(/\n+/g, ' ')             // 換行
      .trim();

    return cleanContent.split(/\s+/).filter(word => word.length > 0).length;
  }

  // 句子統計
  countSentences(content) {
    const sentences = content
      .replace(/[。！？.!?]+/g, '|')
      .split('|')
      .filter(sentence => sentence.trim().length > 0);
    
    return sentences.length;
  }

  // 段落統計
  countParagraphs(content) {
    const paragraphs = content
      .split(/\n\s*\n/)
      .filter(paragraph => paragraph.trim().length > 0);
    
    return paragraphs.length;
  }

  // 計算閱讀時間
  calculateReadingTime(content) {
    const wordCount = this.countWords(content);
    return Math.ceil(wordCount / READABILITY_CONFIG.readingTime.wordsPerMinute);
  }

  // 分析句子結構
  analyzeSentenceStructure(content, analysis) {
    const sentences = content
      .replace(/[。！？.!?]+/g, '|')
      .split('|')
      .filter(sentence => sentence.trim().length > 0);

    let longSentences = 0;
    let totalSentenceLength = 0;

    sentences.forEach(sentence => {
      const wordCount = this.countWords(sentence);
      totalSentenceLength += wordCount;

      if (wordCount > READABILITY_CONFIG.sentence.maxLength) {
        longSentences++;
      }
    });

    if (longSentences > 0) {
      analysis.issues.push({
        type: 'sentence_length',
        severity: 'warning',
        message: `發現 ${longSentences} 個過長句子（超過 ${READABILITY_CONFIG.sentence.maxLength} 字）`
      });
    }

    // 檢查被動語態
    const passivePatterns = [
      /被.*了/g, /受到.*影響/g, /遭受.*傷害/g,
      /is.*ed\b/gi, /was.*ed\b/gi, /were.*ed\b/gi
    ];

    let passiveCount = 0;
    passivePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) passiveCount += matches.length;
    });

    const passiveRatio = passiveCount / sentences.length;
    if (passiveRatio > READABILITY_CONFIG.complexity.maxPassiveVoiceRatio) {
      analysis.issues.push({
        type: 'passive_voice',
        severity: 'suggestion',
        message: `被動語態使用過多（${Math.round(passiveRatio * 100)}%），建議多使用主動語態`
      });
    }
  }

  // 分析段落結構
  analyzeParagraphStructure(content, analysis) {
    const paragraphs = content
      .split(/\n\s*\n/)
      .filter(paragraph => paragraph.trim().length > 0);

    let longParagraphs = 0;
    paragraphs.forEach(paragraph => {
      const wordCount = this.countWords(paragraph);
      if (wordCount > READABILITY_CONFIG.paragraph.maxLength) {
        longParagraphs++;
      }
    });

    if (longParagraphs > 0) {
      analysis.issues.push({
        type: 'paragraph_length',
        severity: 'warning',
        message: `發現 ${longParagraphs} 個過長段落（超過 ${READABILITY_CONFIG.paragraph.maxLength} 字）`
      });
    }

    if (analysis.paragraphCount < READABILITY_CONFIG.paragraph.minCount) {
      analysis.issues.push({
        type: 'paragraph_count',
        severity: 'suggestion',
        message: `段落數過少（${analysis.paragraphCount}），建議增加段落分隔`
      });
    }
  }

  // 分析詞彙複雜度
  analyzeVocabularyComplexity(content, analysis) {
    let complexityScore = 0;
    const words = content.toLowerCase().split(/\s+/);
    
    // 統計不同複雜度的術語
    const complexity = { simple: 0, moderate: 0, complex: 0, professional: 0 };

    for (const category in MEDICAL_COMPLEXITY) {
      for (const term of MEDICAL_COMPLEXITY[category]) {
        const regex = new RegExp(`\\b${term.toLowerCase()}\\b`, 'g');
        const matches = content.toLowerCase().match(regex);
        if (matches) {
          complexity[category] += matches.length;
        }
      }
    }

    // 計算複雜度分數
    const totalTerms = Object.values(complexity).reduce((sum, count) => sum + count, 0);
    if (totalTerms > 0) {
      complexityScore = (
        complexity.simple * 1 +
        complexity.moderate * 2 +
        complexity.complex * 3 +
        complexity.professional * 4
      ) / totalTerms;
    }

    analysis.complexityScore = Math.round(complexityScore * 10) / 10;
    analysis.termComplexity = complexity;

    // 更新全域統計
    for (const category in complexity) {
      this.stats.complexityDistribution[category] += complexity[category];
    }

    // 檢查複雜術語比例
    const complexRatio = (complexity.complex + complexity.professional) / Math.max(totalTerms, 1);
    if (complexRatio > READABILITY_CONFIG.complexity.maxComplexWordsRatio) {
      analysis.issues.push({
        type: 'vocabulary_complexity',
        severity: 'warning',
        message: `複雜術語比例過高（${Math.round(complexRatio * 100)}%），建議添加解釋或使用簡單詞彙`
      });
    }
  }

  // 分析可讀性指標
  analyzeReadabilityMetrics(content, analysis) {
    let score = 100;

    // 字數評分
    if (analysis.wordCount < READABILITY_CONFIG.wordCount.min) {
      score -= 20;
      analysis.issues.push({
        type: 'word_count',
        severity: 'warning',
        message: `內容過短（${analysis.wordCount} 字），建議增加到 ${READABILITY_CONFIG.wordCount.min} 字以上`
      });
    } else if (analysis.wordCount > READABILITY_CONFIG.wordCount.max) {
      score -= 15;
      analysis.issues.push({
        type: 'word_count',
        severity: 'warning',
        message: `內容過長（${analysis.wordCount} 字），建議分割或精簡到 ${READABILITY_CONFIG.wordCount.max} 字以下`
      });
    }

    // 句子長度評分
    if (analysis.averageSentenceLength > READABILITY_CONFIG.sentence.maxLength) {
      score -= 15;
    }

    // 段落長度評分
    if (analysis.averageParagraphLength > READABILITY_CONFIG.paragraph.maxLength) {
      score -= 10;
    }

    // 複雜度評分
    if (analysis.complexityScore > 3) {
      score -= 20;
    } else if (analysis.complexityScore > 2.5) {
      score -= 10;
    }

    // 閱讀時間評分
    const optimalTime = READABILITY_CONFIG.readingTime.optimalMinutes;
    if (analysis.readingTime < optimalTime.min || analysis.readingTime > optimalTime.max) {
      score -= 5;
    }

    analysis.readabilityScore = Math.max(0, Math.min(100, score));
  }

  // 生成改善建議
  generateSuggestions(analysis) {
    const suggestions = [];

    // 基於問題類型生成建議
    analysis.issues.forEach(issue => {
      switch (issue.type) {
        case 'sentence_length':
          suggestions.push('將長句分割成多個短句，每句不超過 25 字');
          break;
        case 'paragraph_length':
          suggestions.push('將長段落分割，每段不超過 100 字');
          break;
        case 'vocabulary_complexity':
          suggestions.push('為複雜醫療術語添加解釋或使用更簡單的詞彙');
          break;
        case 'passive_voice':
          suggestions.push('多使用主動語態，讓句子更直接明確');
          break;
        case 'word_count':
          if (analysis.wordCount < READABILITY_CONFIG.wordCount.min) {
            suggestions.push('增加內容深度，提供更多實用資訊');
          } else {
            suggestions.push('精簡內容，移除不必要的重複或冗餘資訊');
          }
          break;
      }
    });

    // 基於可讀性分數生成通用建議
    if (analysis.readabilityScore < 60) {
      suggestions.push(...READABILITY_SUGGESTIONS.sentence_structure);
      suggestions.push(...READABILITY_SUGGESTIONS.vocabulary);
    } else if (analysis.readabilityScore < 80) {
      suggestions.push(...READABILITY_SUGGESTIONS.paragraph_organization);
      suggestions.push(...READABILITY_SUGGESTIONS.visual_aids);
    }

    // 去重並限制建議數量
    analysis.suggestions = [...new Set(suggestions)].slice(0, 5);
  }

  // 計算整體統計
  calculateOverallStats() {
    if (this.stats.filesAnalyzed > 0) {
      this.stats.averageReadingTime = Math.round(
        this.results.reduce((sum, result) => sum + result.readingTime, 0) / this.stats.filesAnalyzed
      );
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

  // 生成報告
  generateReport() {
    console.log('\n📊 可讀性分析結果');
    console.log('='.repeat(60));
    console.log(`分析檔案: ${this.stats.filesAnalyzed}`);
    console.log(`總字數: ${this.stats.totalWords.toLocaleString()}`);
    console.log(`總句數: ${this.stats.totalSentences.toLocaleString()}`);
    console.log(`總段數: ${this.stats.totalParagraphs.toLocaleString()}`);
    console.log(`平均閱讀時間: ${this.stats.averageReadingTime} 分鐘`);

    // 複雜度分布
    console.log('\n📈 術語複雜度分布:');
    const total = Object.values(this.stats.complexityDistribution).reduce((sum, count) => sum + count, 0);
    if (total > 0) {
      for (const [category, count] of Object.entries(this.stats.complexityDistribution)) {
        const percentage = Math.round((count / total) * 100);
        console.log(`  ${category}: ${count} (${percentage}%)`);
      }
    }

    // 可讀性分數分布
    console.log('\n📊 可讀性分數分布:');
    const scoreRanges = { excellent: 0, good: 0, fair: 0, poor: 0 };
    
    this.results.forEach(result => {
      if (result.readabilityScore >= 90) scoreRanges.excellent++;
      else if (result.readabilityScore >= 75) scoreRanges.good++;
      else if (result.readabilityScore >= 60) scoreRanges.fair++;
      else scoreRanges.poor++;
    });

    console.log(`  優秀 (90+): ${scoreRanges.excellent} 篇`);
    console.log(`  良好 (75-89): ${scoreRanges.good} 篇`);
    console.log(`  普通 (60-74): ${scoreRanges.fair} 篇`);
    console.log(`  需改善 (<60): ${scoreRanges.poor} 篇`);

    // 顯示需要改善的檔案
    const needsImprovement = this.results
      .filter(result => result.readabilityScore < 75)
      .sort((a, b) => a.readabilityScore - b.readabilityScore);

    if (needsImprovement.length > 0) {
      console.log('\n⚠️ 需要改善的檔案:');
      needsImprovement.slice(0, 10).forEach((result, index) => {
        console.log(`${index + 1}. ${result.file} (分數: ${result.readabilityScore})`);
        console.log(`   字數: ${result.wordCount}, 閱讀時間: ${result.readingTime}分鐘`);
        if (result.issues.length > 0) {
          console.log(`   主要問題: ${result.issues[0].message}`);
        }
      });
      
      if (needsImprovement.length > 10) {
        console.log(`   ... 還有 ${needsImprovement.length - 10} 個檔案需要改善`);
      }
    }

    // 顯示表現最佳的檔案
    const bestPerforming = this.results
      .filter(result => result.readabilityScore >= 85)
      .sort((a, b) => b.readabilityScore - a.readabilityScore);

    if (bestPerforming.length > 0) {
      console.log('\n✅ 表現優秀的檔案:');
      bestPerforming.slice(0, 5).forEach((result, index) => {
        console.log(`${index + 1}. ${result.file} (分數: ${result.readabilityScore})`);
      });
    }

    // 生成 JSON 報告
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      results: this.results,
      summary: {
        averageReadabilityScore: Math.round(
          this.results.reduce((sum, result) => sum + result.readabilityScore, 0) / this.results.length
        ),
        filesNeedingImprovement: needsImprovement.length,
        excellentFiles: scoreRanges.excellent,
        totalIssues: this.results.reduce((sum, result) => sum + result.issues.length, 0)
      }
    };

    fs.writeFileSync('readability-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 詳細報告已儲存至 readability-report.json');
  }
}

// 主程式
async function main() {
  const analyzer = new ReadabilityAnalyzer();
  await analyzer.analyzeContent();
  
  console.log('\n🎉 可讀性分析完成！');
}

// 如果直接執行此腳本
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 執行錯誤:', error);
    process.exit(1);
  });
}

module.exports = ReadabilityAnalyzer;