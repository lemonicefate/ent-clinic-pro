// Decap CMS 欄位驗證配置
// 提供自定義驗證規則和幫助函數

// 驗證規則
const ValidationRules = {
  // 中文標題驗證
  chineseTitle: {
    pattern: /^[\u4e00-\u9fff\w\s\-\(\)（）：:，,。.！!？?]+$/,
    message: '標題只能包含中文、英文、數字和常用標點符號'
  },
  
  // 英文標題驗證
  englishTitle: {
    pattern: /^[a-zA-Z0-9\s\-\(\):,\.!?]+$/,
    message: 'Title can only contain English letters, numbers, and common punctuation'
  },
  
  // 日文標題驗證
  japaneseTitle: {
    pattern: /^[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff\w\s\-\(\)（）：:，,。.！!？?]+$/,
    message: 'タイトルは日本語、英数字、一般的な句読点のみ使用できます'
  },
  
  // URL 驗證
  url: {
    pattern: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    message: '請輸入有效的網址（以 http:// 或 https:// 開頭）'
  },
  
  // DOI 驗證
  doi: {
    pattern: /^10\.\d{4,}\/[-._;()\/:a-zA-Z0-9]+$/,
    message: '請輸入有效的 DOI（格式：10.xxxx/xxxxx）'
  },
  
  // 電子郵件驗證
  email: {
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    message: '請輸入有效的電子郵件地址'
  },
  
  // 醫學術語驗證
  medicalTerm: {
    pattern: /^[\u4e00-\u9fff\w\s\-\(\)（）]+$/,
    message: '醫學術語只能包含中英文、數字和括號'
  },
  
  // 標籤驗證
  tag: {
    pattern: /^[\u4e00-\u9fff\w\s\-_]+$/,
    message: '標籤只能包含中英文、數字、空格、連字符和底線'
  },
  
  // 關鍵字驗證
  keyword: {
    pattern: /^[\u4e00-\u9fff\w\s\-_]+$/,
    message: '關鍵字只能包含中英文、數字、空格、連字符和底線'
  },
  
  // 作者姓名驗證
  authorName: {
    pattern: /^[\u4e00-\u9fff\w\s\.,\-]+$/,
    message: '作者姓名只能包含中英文、數字、空格和常用標點符號'
  },
  
  // SEO 標題長度驗證
  seoTitle: {
    minLength: 10,
    maxLength: 60,
    message: 'SEO 標題應為 10-60 字元'
  },
  
  // SEO 描述長度驗證
  seoDescription: {
    minLength: 50,
    maxLength: 160,
    message: 'SEO 描述應為 50-160 字元'
  },
  
  // 年份驗證
  year: {
    min: 1990,
    max: new Date().getFullYear() + 1,
    message: `年份應在 1990 到 ${new Date().getFullYear() + 1} 之間`
  }
};

// 專科特定驗證規則
const SpecialtyValidations = {
  cardiology: {
    requiredSections: ['症狀識別', '診斷方法', '治療策略', '預防措施'],
    recommendedKeywords: ['心臟病', '冠心病', '心律不整', '心臟衰竭', '高血壓'],
    minWordCount: 800,
    maxWordCount: 3000
  },
  
  neurology: {
    requiredSections: ['神經學檢查', '影像學診斷', '治療方針', '復健計畫'],
    recommendedKeywords: ['中風', '癲癇', '帕金森氏症', '失智症', '頭痛'],
    minWordCount: 1000,
    maxWordCount: 3500
  },
  
  orthopedics: {
    requiredSections: ['理學檢查', '影像學檢查', '治療選項', '復健計畫'],
    recommendedKeywords: ['骨折', '關節炎', '脊椎疾病', '運動傷害', '人工關節'],
    minWordCount: 800,
    maxWordCount: 3000
  },
  
  pediatrics: {
    requiredSections: ['年齡特異性考量', '生長發育評估', '疫苗接種', '家長衛教'],
    recommendedKeywords: ['兒童疾病', '疫苗接種', '生長發育', '新生兒照護', '青少年健康'],
    minWordCount: 600,
    maxWordCount: 2500
  },
  
  emergency: {
    requiredSections: ['緊急評估', '急救處置', '穩定化治療', '轉診考量'],
    recommendedKeywords: ['急診', '急救', '檢傷分類', '心肺復甦術', '外傷處理'],
    minWordCount: 500,
    maxWordCount: 2000
  }
};

// 內容品質檢查
const ContentQualityChecks = {
  // 檢查必要章節
  checkRequiredSections: function(content, specialty) {
    const validation = SpecialtyValidations[specialty];
    if (!validation) return { valid: true };
    
    const missingSection = validation.requiredSections.find(section => 
      !content.toLowerCase().includes(section.toLowerCase())
    );
    
    return {
      valid: !missingSection,
      message: missingSection ? `缺少必要章節：${missingSection}` : null
    };
  },
  
  // 檢查字數
  checkWordCount: function(content, specialty) {
    const validation = SpecialtyValidations[specialty];
    if (!validation) return { valid: true };
    
    const wordCount = content.replace(/\s+/g, '').length; // 中文字數計算
    const englishWords = content.match(/[a-zA-Z]+/g);
    const totalWords = wordCount + (englishWords ? englishWords.length : 0);
    
    if (totalWords < validation.minWordCount) {
      return {
        valid: false,
        message: `內容過短，建議至少 ${validation.minWordCount} 字（目前：${totalWords} 字）`
      };
    }
    
    if (totalWords > validation.maxWordCount) {
      return {
        valid: false,
        message: `內容過長，建議不超過 ${validation.maxWordCount} 字（目前：${totalWords} 字）`
      };
    }
    
    return { valid: true };
  },
  
  // 檢查關鍵字覆蓋
  checkKeywordCoverage: function(content, keywords, specialty) {
    const validation = SpecialtyValidations[specialty];
    if (!validation) return { valid: true };
    
    const contentLower = content.toLowerCase();
    const recommendedKeywords = validation.recommendedKeywords;
    const coveredKeywords = recommendedKeywords.filter(keyword => 
      contentLower.includes(keyword.toLowerCase())
    );
    
    const coverageRate = coveredKeywords.length / recommendedKeywords.length;
    
    if (coverageRate < 0.3) {
      return {
        valid: false,
        message: `建議包含更多專科相關關鍵字，推薦：${recommendedKeywords.slice(0, 3).join('、')}`
      };
    }
    
    return { valid: true };
  },
  
  // 檢查圖片 alt 文字
  checkImageAltText: function(content) {
    const imageRegex = /!\[([^\]]*)\]\([^)]+\)/g;
    const images = content.match(imageRegex) || [];
    
    const imagesWithoutAlt = images.filter(img => {
      const altMatch = img.match(/!\[([^\]]*)\]/);
      return !altMatch || !altMatch[1].trim();
    });
    
    if (imagesWithoutAlt.length > 0) {
      return {
        valid: false,
        message: `發現 ${imagesWithoutAlt.length} 張圖片缺少替代文字，請為所有圖片添加描述性的 alt 文字`
      };
    }
    
    return { valid: true };
  },
  
  // 檢查連結有效性
  checkLinks: function(content) {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links = [];
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      links.push({
        text: match[1],
        url: match[2]
      });
    }
    
    const invalidLinks = links.filter(link => {
      // 檢查是否為有效 URL
      try {
        new URL(link.url);
        return false;
      } catch {
        return !link.url.startsWith('/') && !link.url.startsWith('#');
      }
    });
    
    if (invalidLinks.length > 0) {
      return {
        valid: false,
        message: `發現 ${invalidLinks.length} 個無效連結，請檢查連結格式`
      };
    }
    
    return { valid: true };
  }
};

// 自動建議功能
const AutoSuggestions = {
  // 根據內容建議標籤
  suggestTags: function(content, specialty) {
    const validation = SpecialtyValidations[specialty];
    if (!validation) return [];
    
    const contentLower = content.toLowerCase();
    const suggestedTags = validation.recommendedKeywords.filter(keyword => 
      contentLower.includes(keyword.toLowerCase())
    );
    
    return suggestedTags.slice(0, 5); // 最多建議 5 個標籤
  },
  
  // 建議 SEO 標題
  suggestSeoTitle: function(title, specialty) {
    const specialtyNames = {
      cardiology: '心臟科',
      neurology: '神經科',
      orthopedics: '骨科',
      pediatrics: '小兒科',
      emergency: '急診醫學科'
    };
    
    const specialtyName = specialtyNames[specialty] || '';
    const baseTitle = typeof title === 'object' ? title.zh_TW || title.en : title;
    
    if (!baseTitle) return '';
    
    return `${baseTitle} | ${specialtyName} | 醫療平台`;
  },
  
  // 建議 SEO 描述
  suggestSeoDescription: function(excerpt, specialty) {
    const specialtyNames = {
      cardiology: '心臟科',
      neurology: '神經科',
      orthopedics: '骨科',
      pediatrics: '小兒科',
      emergency: '急診醫學科'
    };
    
    const specialtyName = specialtyNames[specialty] || '';
    const baseExcerpt = typeof excerpt === 'object' ? excerpt.zh_TW || excerpt.en : excerpt;
    
    if (!baseExcerpt) return '';
    
    const truncatedExcerpt = baseExcerpt.length > 120 ? 
      baseExcerpt.substring(0, 120) + '...' : baseExcerpt;
    
    return `${truncatedExcerpt} 由${specialtyName}專家審核，提供準確可靠的醫療資訊。`;
  }
};

// 匯出所有功能
window.CMSValidations = {
  ValidationRules,
  SpecialtyValidations,
  ContentQualityChecks,
  AutoSuggestions
};