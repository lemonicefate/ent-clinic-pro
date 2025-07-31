#!/usr/bin/env node

/**
 * 醫療術語和拼寫檢查工具
 * 專門針對醫療衛教內容的術語準確性和拼寫檢查
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 醫療術語詞典
const MEDICAL_DICTIONARY = {
  // 心臟科術語
  cardiology: {
    correct: [
      'electrocardiogram', 'ECG', 'EKG', 'myocardial infarction', 'MI',
      'atrial fibrillation', 'AF', 'ventricular tachycardia', 'VT',
      'coronary artery disease', 'CAD', 'heart failure', 'HF',
      'hypertension', 'hypotension', 'bradycardia', 'tachycardia',
      'angina', 'pectoris', 'stenosis', 'regurgitation', 'murmur',
      'pericarditis', 'endocarditis', 'cardiomyopathy', 'arrhythmia'
    ],
    common_errors: {
      'heart attack': 'myocardial infarction',
      'irregular heartbeat': 'arrhythmia',
      'high blood pressure': 'hypertension',
      'low blood pressure': 'hypotension'
    }
  },

  // 神經科術語
  neurology: {
    correct: [
      'cerebrovascular accident', 'CVA', 'stroke', 'transient ischemic attack', 'TIA',
      'epilepsy', 'seizure', 'migraine', 'headache', 'dementia',
      'Alzheimer', 'Parkinson', 'multiple sclerosis', 'MS',
      'neuropathy', 'neuralgia', 'encephalitis', 'meningitis',
      'cerebral palsy', 'spinal cord', 'brain stem', 'cortex'
    ],
    common_errors: {
      'brain attack': 'stroke',
      'mini stroke': 'transient ischemic attack',
      'fits': 'seizure'
    }
  },

  // 小兒科術語
  pediatrics: {
    correct: [
      'pediatric', 'paediatric', 'infant', 'neonate', 'toddler',
      'vaccination', 'immunization', 'growth chart', 'developmental milestone',
      'congenital', 'hereditary', 'genetic', 'chromosomal',
      'respiratory syncytial virus', 'RSV', 'bronchiolitis',
      'gastroenteritis', 'dehydration', 'fever', 'febrile'
    ],
    common_errors: {
      'baby shots': 'vaccination',
      'growing problems': 'developmental delays'
    }
  },

  // 急診科術語
  emergency: {
    correct: [
      'emergency', 'urgent', 'critical', 'trauma', 'resuscitation',
      'cardiopulmonary resuscitation', 'CPR', 'defibrillation',
      'intubation', 'ventilation', 'shock', 'sepsis',
      'anaphylaxis', 'poisoning', 'overdose', 'fracture',
      'laceration', 'contusion', 'hemorrhage', 'bleeding'
    ],
    common_errors: {
      'heart massage': 'cardiopulmonary resuscitation',
      'electric shock treatment': 'defibrillation'
    }
  },

  // 骨科術語
  orthopedics: {
    correct: [
      'orthopedic', 'orthopaedic', 'fracture', 'dislocation',
      'sprain', 'strain', 'ligament', 'tendon', 'cartilage',
      'arthritis', 'osteoarthritis', 'rheumatoid arthritis',
      'osteoporosis', 'scoliosis', 'kyphosis', 'lordosis',
      'prosthesis', 'implant', 'joint replacement'
    ],
    common_errors: {
      'broken bone': 'fracture',
      'joint wear': 'arthritis'
    }
  },

  // 一般醫學術語
  general: {
    correct: [
      'diagnosis', 'prognosis', 'symptom', 'syndrome', 'disease',
      'disorder', 'condition', 'treatment', 'therapy', 'medication',
      'prescription', 'dosage', 'side effect', 'adverse reaction',
      'contraindication', 'indication', 'chronic', 'acute',
      'benign', 'malignant', 'inflammation', 'infection'
    ],
    common_errors: {
      'sickness': 'disease',
      'medicine': 'medication',
      'bad reaction': 'adverse reaction'
    }
  }
};

// 常見拼寫錯誤
const SPELLING_ERRORS = {
  // 醫療術語拼寫錯誤
  'alzhiemer': 'Alzheimer',
  'alzhiemers': 'Alzheimer\'s',
  'diabetis': 'diabetes',
  'diabetic': 'diabetic',
  'hypertention': 'hypertension',
  'hipotension': 'hypotension',
  'pnemonia': 'pneumonia',
  'asthama': 'asthma',
  'rhuematoid': 'rheumatoid',
  'osteoporsis': 'osteoporosis',
  'alergic': 'allergic',
  'alergy': 'allergy',
  'anestesia': 'anesthesia',
  'anesthesia': 'anaesthesia', // 英式拼寫
  'hemmorhage': 'hemorrhage',
  'hemorrage': 'hemorrhage',
  'inflamation': 'inflammation',
  'inflamatory': 'inflammatory',
  'antibiotics': 'antibiotics',
  'antibiotic': 'antibiotic',
  'vacination': 'vaccination',
  'imunization': 'immunization',
  'symtom': 'symptom',
  'symtoms': 'symptoms',
  'treatement': 'treatment',
  'perscription': 'prescription',
  'presciption': 'prescription',
  'dosege': 'dosage',
  'medecine': 'medicine',
  'medicene': 'medicine'
};

// 危險或不當用詞
const INAPPROPRIATE_TERMS = {
  // 過於絕對的表述
  'always_fatal': ['總是致命', '必死無疑', '一定會死'],
  'never_happens': ['絕對不會', '永遠不會發生', '不可能'],
  'guaranteed_cure': ['保證治癒', '一定會好', '百分百有效'],
  'completely_safe': ['完全安全', '絕對安全', '沒有風險'],
  
  // 不當醫療建議
  'self_medication': ['自己買藥', '不用看醫生', '自行調整劑量'],
  'stop_medication': ['立即停藥', '馬上停止服藥', '不要吃藥'],
  'ignore_symptoms': ['不用理會', '沒關係', '不嚴重'],
  
  // 歧視性或不當用語
  'discriminatory': ['正常人', '異常', '不正常的', '怪異'],
  'stigmatizing': ['精神病', '瘋子', '神經病']
};

// 藥物劑量格式檢查
const DOSAGE_PATTERNS = {
  valid: [
    /\d+\s*mg\b/gi,           // 毫克
    /\d+\s*g\b/gi,            // 克
    /\d+\s*ml\b/gi,           // 毫升
    /\d+\s*mcg\b/gi,          // 微克
    /\d+\s*μg\b/gi,           // 微克 (希臘字母)
    /\d+\s*IU\b/gi,           // 國際單位
    /\d+\s*units?\b/gi,       // 單位
    /\d+\s*tablets?\b/gi,     // 錠劑
    /\d+\s*capsules?\b/gi,    // 膠囊
    /\d+\s*drops?\b/gi        // 滴劑
  ],
  suspicious: [
    /\d+\s*pills?\b/gi,       // 避免使用 "pills"
    /\d+\s*pieces?\b/gi,      // 避免使用 "pieces"
    /一些|幾顆|很多/gi          // 模糊劑量描述
  ]
};

class MedicalTerminologyChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.suggestions = [];
    this.stats = {
      filesChecked: 0,
      termsChecked: 0,
      errorsFound: 0,
      warningsFound: 0
    };
  }

  // 主要檢查方法
  async checkContent(contentDir = 'src/content/education') {
    console.log('🔍 開始醫療術語和拼寫檢查...\n');

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
      const specialty = frontmatter?.specialty || 'general';

      // 執行各種檢查
      this.checkSpelling(bodyContent, relativePath);
      this.checkMedicalTerminology(bodyContent, relativePath, specialty);
      this.checkInappropriateTerms(bodyContent, relativePath);
      this.checkDosageFormats(bodyContent, relativePath);
      this.checkAbbreviations(bodyContent, relativePath);

    } catch (error) {
      this.addError(relativePath, `檔案讀取錯誤: ${error.message}`);
    }
  }

  // 拼寫檢查
  checkSpelling(content, filePath) {
    for (const [incorrect, correct] of Object.entries(SPELLING_ERRORS)) {
      const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
      const matches = content.match(regex);
      
      if (matches) {
        this.addError(filePath, `拼寫錯誤: "${incorrect}" 應為 "${correct}" (出現 ${matches.length} 次)`);
        this.stats.errorsFound++;
      }
    }
  }

  // 醫療術語檢查
  checkMedicalTerminology(content, filePath, specialty) {
    const specialtyDict = MEDICAL_DICTIONARY[specialty] || MEDICAL_DICTIONARY.general;
    
    // 檢查常見錯誤用法
    if (specialtyDict.common_errors) {
      for (const [incorrect, correct] of Object.entries(specialtyDict.common_errors)) {
        const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
        const matches = content.match(regex);
        
        if (matches) {
          this.addWarning(filePath, `建議用詞: "${incorrect}" 建議改為更專業的 "${correct}"`);
          this.stats.warningsFound++;
        }
      }
    }

    // 檢查術語一致性
    this.checkTermConsistency(content, filePath, specialtyDict.correct);
  }

  // 術語一致性檢查
  checkTermConsistency(content, filePath, correctTerms) {
    const usedTerms = new Map();
    
    for (const term of correctTerms) {
      const variations = this.findTermVariations(content, term);
      if (variations.length > 1) {
        usedTerms.set(term, variations);
      }
    }

    for (const [term, variations] of usedTerms) {
      if (variations.length > 1) {
        this.addWarning(filePath, `術語一致性: "${term}" 有多種寫法 [${variations.join(', ')}]，建議統一使用`);
      }
    }
  }

  // 尋找術語變體
  findTermVariations(content, term) {
    const variations = new Set();
    
    // 檢查不同大小寫變體
    const patterns = [
      new RegExp(`\\b${term}\\b`, 'g'),           // 原始
      new RegExp(`\\b${term}\\b`, 'gi'),          // 忽略大小寫
      new RegExp(`\\b${term.toLowerCase()}\\b`, 'g'), // 小寫
      new RegExp(`\\b${term.toUpperCase()}\\b`, 'g')  // 大寫
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => variations.add(match));
      }
    }

    return Array.from(variations);
  }

  // 檢查不當用詞
  checkInappropriateTerms(content, filePath) {
    for (const [category, terms] of Object.entries(INAPPROPRIATE_TERMS)) {
      for (const term of terms) {
        if (content.includes(term)) {
          const severity = this.getInappropriateSeverity(category);
          if (severity === 'error') {
            this.addError(filePath, `不當用詞 (${category}): 發現 "${term}"，請修正`);
            this.stats.errorsFound++;
          } else {
            this.addWarning(filePath, `建議修改用詞 (${category}): "${term}" 可能不夠專業或準確`);
            this.stats.warningsFound++;
          }
        }
      }
    }
  }

  // 判斷不當用詞嚴重程度
  getInappropriateSeverity(category) {
    const errorCategories = ['always_fatal', 'self_medication', 'stop_medication', 'discriminatory'];
    return errorCategories.includes(category) ? 'error' : 'warning';
  }

  // 檢查藥物劑量格式
  checkDosageFormats(content, filePath) {
    // 檢查可疑的劑量描述
    for (const pattern of DOSAGE_PATTERNS.suspicious) {
      const matches = content.match(pattern);
      if (matches) {
        this.addWarning(filePath, `劑量格式建議: 發現 "${matches[0]}"，建議使用更精確的劑量單位`);
        this.stats.warningsFound++;
      }
    }

    // 檢查是否有劑量資訊但缺乏警告
    const hasValidDosage = DOSAGE_PATTERNS.valid.some(pattern => pattern.test(content));
    if (hasValidDosage) {
      const hasWarning = /請遵醫囑|諮詢醫師|醫師指示|專業建議/.test(content);
      if (!hasWarning) {
        this.addWarning(filePath, '劑量安全提醒: 內容包含藥物劑量資訊，建議添加 "請遵醫囑" 等安全提醒');
      }
    }
  }

  // 檢查縮寫
  checkAbbreviations(content, filePath) {
    const abbreviationPattern = /\b[A-Z]{2,}\b/g;
    const abbreviations = content.match(abbreviationPattern) || [];
    
    const commonAbbreviations = new Set([
      'ECG', 'EKG', 'MRI', 'CT', 'ICU', 'ER', 'BP', 'HR', 'IV', 'PO', 'PRN',
      'CVA', 'TIA', 'MI', 'AF', 'VT', 'CAD', 'HF', 'MS', 'RSV', 'CPR'
    ]);

    const uncommonAbbreviations = abbreviations.filter(abbr => 
      !commonAbbreviations.has(abbr) && abbr.length > 2
    );

    if (uncommonAbbreviations.length > 0) {
      this.addSuggestion(filePath, `縮寫建議: 發現較少見的縮寫 [${uncommonAbbreviations.join(', ')}]，建議首次出現時提供完整名稱`);
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
    console.log('\n📊 醫療術語檢查結果');
    console.log('='.repeat(50));
    console.log(`檢查檔案: ${this.stats.filesChecked}`);
    console.log(`❌ 錯誤: ${this.errors.length}`);
    console.log(`⚠️ 警告: ${this.warnings.length}`);
    console.log(`💡 建議: ${this.suggestions.length}`);

    if (this.errors.length > 0) {
      console.log('\n❌ 錯誤詳情:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.file}: ${error.message}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ 警告詳情:');
      this.warnings.slice(0, 15).forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.file}: ${warning.message}`);
      });
      
      if (this.warnings.length > 15) {
        console.log(`... 還有 ${this.warnings.length - 15} 個警告`);
      }
    }

    if (this.suggestions.length > 0) {
      console.log('\n💡 改善建議:');
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
        totalIssues: this.errors.length + this.warnings.length + this.suggestions.length
      }
    };

    fs.writeFileSync('medical-terminology-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 詳細報告已儲存至 medical-terminology-report.json');
  }
}

// 主程式
async function main() {
  const checker = new MedicalTerminologyChecker();
  const success = await checker.checkContent();
  
  if (success) {
    console.log('\n🎉 醫療術語檢查通過！');
    process.exit(0);
  } else {
    console.log('\n💥 發現醫療術語問題，請修正後重試');
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

module.exports = MedicalTerminologyChecker;