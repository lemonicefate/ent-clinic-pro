/**
 * Search Data Loader
 * Loads and prepares medical content data for the advanced search engine
 */

import type { SearchItem } from './advanced-search';

/**
 * Sample medical content data for search indexing
 */
export const sampleSearchData: SearchItem[] = [
  // Calculators
  {
    id: 'calc-cha2ds2-vasc',
    title: 'CHA₂DS₂-VASc 評分計算器',
    content: '心房顫動患者中風風險評估工具，用於評估非瓣膜性心房顫動患者的血栓栓塞風險，幫助決定是否需要抗凝治療。包含年齡、性別、心衰、高血壓、糖尿病、中風史、血管疾病等風險因子。',
    type: 'calculator',
    category: '心臟科',
    tags: ['心房顫動', '中風風險', '抗凝治療', 'CHA2DS2-VASc'],
    url: '/tools/cha2ds2-vasc',
    lastModified: new Date('2024-01-15'),
    popularity: 85,
    difficulty: 'intermediate',
    specialty: '心臟科',
  },
  {
    id: 'calc-bmi',
    title: 'BMI 身體質量指數計算器',
    content: '身體質量指數計算工具，用於評估成人體重狀態。BMI = 體重(kg) / 身高(m)²。正常範圍18.5-24.9，可用於初步評估肥胖程度和相關健康風險。',
    type: 'calculator',
    category: '一般醫學',
    tags: ['BMI', '體重', '肥胖', '營養評估'],
    url: '/tools/bmi',
    lastModified: new Date('2024-01-10'),
    popularity: 92,
    difficulty: 'beginner',
    specialty: '家醫科',
  },
  {
    id: 'calc-gfr',
    title: 'eGFR 腎絲球過濾率計算器',
    content: '估算腎絲球過濾率計算工具，使用CKD-EPI公式評估腎功能。根據血清肌酸酐、年齡、性別、種族計算eGFR值，用於慢性腎病分期和腎功能監測。',
    type: 'calculator',
    category: '腎臟科',
    tags: ['腎功能', 'eGFR', '慢性腎病', '肌酸酐'],
    url: '/tools/egfr',
    lastModified: new Date('2024-01-20'),
    popularity: 78,
    difficulty: 'intermediate',
    specialty: '腎臟科',
  },

  // Educational Content
  {
    id: 'edu-hypertension-management',
    title: '高血壓診斷與治療指引',
    content: '高血壓是常見的心血管疾病，本文詳細介紹高血壓的診斷標準、分類、治療目標、藥物選擇和生活方式調整。包含最新的治療指引和臨床決策流程圖。',
    type: 'education',
    category: '心臟科',
    tags: ['高血壓', '心血管疾病', '藥物治療', '生活方式'],
    url: '/education/hypertension-management',
    lastModified: new Date('2024-01-25'),
    popularity: 88,
    difficulty: 'intermediate',
    specialty: '心臟科',
  },
  {
    id: 'edu-diabetes-care',
    title: '糖尿病照護完整指南',
    content: '糖尿病是慢性代謝疾病，需要長期管理。本指南涵蓋第1型和第2型糖尿病的診斷、治療、併發症預防、血糖監測、飲食控制和運動建議。',
    type: 'education',
    category: '內分泌科',
    tags: ['糖尿病', '血糖控制', '胰島素', '併發症'],
    url: '/education/diabetes-care',
    lastModified: new Date('2024-01-18'),
    popularity: 91,
    difficulty: 'intermediate',
    specialty: '內分泌科',
  },
  {
    id: 'edu-covid-prevention',
    title: 'COVID-19 預防與防護措施',
    content: 'COVID-19疫情防護指南，包含病毒傳播途徑、預防措施、疫苗接種、個人防護設備使用、居家隔離指引和症狀監測。適用於醫護人員和一般民眾。',
    type: 'education',
    category: '感染科',
    tags: ['COVID-19', '感染控制', '疫苗', '防護措施'],
    url: '/education/covid-prevention',
    lastModified: new Date('2024-01-30'),
    popularity: 95,
    difficulty: 'beginner',
    specialty: '感染科',
  },

  // Procedures
  {
    id: 'proc-cpr',
    title: '心肺復甦術 (CPR) 操作流程',
    content: '心肺復甦術是緊急救命技術，用於心跳停止患者。包含成人CPR步驟、胸外按壓技巧、人工呼吸、AED使用和團隊復甦流程。',
    type: 'procedure',
    category: '急診醫學',
    tags: ['CPR', '急救', '心跳停止', 'AED'],
    url: '/procedures/cpr',
    lastModified: new Date('2024-01-22'),
    popularity: 87,
    difficulty: 'advanced',
    specialty: '急診科',
  },
  {
    id: 'proc-wound-care',
    title: '傷口照護與換藥技術',
    content: '傷口評估、清潔、消毒和敷料選擇的完整指南。包含不同類型傷口的處理原則、感染預防、癒合過程監測和併發症處理。',
    type: 'procedure',
    category: '外科',
    tags: ['傷口照護', '換藥', '感染預防', '癒合'],
    url: '/procedures/wound-care',
    lastModified: new Date('2024-01-12'),
    popularity: 82,
    difficulty: 'intermediate',
    specialty: '外科',
  },
  {
    id: 'proc-blood-pressure',
    title: '血壓測量標準操作程序',
    content: '正確的血壓測量技術對診斷和監測高血壓至關重要。包含測量前準備、袖帶選擇、測量步驟、記錄方式和常見錯誤避免。',
    type: 'procedure',
    category: '一般醫學',
    tags: ['血壓測量', '生命徵象', '高血壓', '監測'],
    url: '/procedures/blood-pressure',
    lastModified: new Date('2024-01-08'),
    popularity: 89,
    difficulty: 'beginner',
    specialty: '護理',
  },

  // Medications
  {
    id: 'med-aspirin',
    title: '阿斯匹靈 (Aspirin) 用藥指引',
    content: '阿斯匹靈是常用的抗血小板藥物，用於心血管疾病預防和治療。包含適應症、劑量、副作用、禁忌症和藥物交互作用。',
    type: 'medication',
    category: '心臟科',
    tags: ['阿斯匹靈', '抗血小板', '心血管預防', '副作用'],
    url: '/medications/aspirin',
    lastModified: new Date('2024-01-28'),
    popularity: 84,
    difficulty: 'intermediate',
    specialty: '心臟科',
  },
  {
    id: 'med-metformin',
    title: 'Metformin 糖尿病用藥指南',
    content: 'Metformin是第2型糖尿病的第一線治療藥物。詳細介紹作用機轉、適應症、劑量調整、副作用管理和禁忌症。',
    type: 'medication',
    category: '內分泌科',
    tags: ['Metformin', '糖尿病', '血糖控制', '副作用'],
    url: '/medications/metformin',
    lastModified: new Date('2024-01-16'),
    popularity: 86,
    difficulty: 'intermediate',
    specialty: '內分泌科',
  },
  {
    id: 'med-antibiotics',
    title: '抗生素合理使用指引',
    content: '抗生素的正確使用對治療感染和預防抗藥性至關重要。包含抗生素分類、選擇原則、劑量計算、療程長度和抗藥性預防。',
    type: 'medication',
    category: '感染科',
    tags: ['抗生素', '感染治療', '抗藥性', '合理用藥'],
    url: '/medications/antibiotics',
    lastModified: new Date('2024-01-24'),
    popularity: 90,
    difficulty: 'advanced',
    specialty: '感染科',
  },

  // Additional content for better search variety
  {
    id: 'edu-pediatric-fever',
    title: '兒童發燒處理指引',
    content: '兒童發燒是常見症狀，需要正確評估和處理。包含發燒定義、測量方法、退燒藥物使用、危險徵象識別和就醫時機。',
    type: 'education',
    category: '小兒科',
    tags: ['兒童發燒', '退燒', '小兒科', '症狀評估'],
    url: '/education/pediatric-fever',
    lastModified: new Date('2024-01-14'),
    popularity: 83,
    difficulty: 'beginner',
    specialty: '小兒科',
  },
  {
    id: 'calc-wells-score',
    title: 'Wells Score 肺栓塞風險評估',
    content: 'Wells Score用於評估肺栓塞的臨床可能性。包含臨床症狀、體徵和風險因子評分，幫助決定進一步檢查策略。',
    type: 'calculator',
    category: '胸腔科',
    tags: ['Wells Score', '肺栓塞', '風險評估', '診斷'],
    url: '/tools/wells-score',
    lastModified: new Date('2024-01-26'),
    popularity: 76,
    difficulty: 'advanced',
    specialty: '胸腔科',
  },
  {
    id: 'proc-intubation',
    title: '氣管內插管操作程序',
    content: '氣管內插管是重要的急救技術，用於建立人工氣道。包含適應症、設備準備、插管步驟、確認方法和併發症處理。',
    type: 'procedure',
    category: '急診醫學',
    tags: ['氣管插管', '氣道管理', '急救', '麻醉'],
    url: '/procedures/intubation',
    lastModified: new Date('2024-01-21'),
    popularity: 79,
    difficulty: 'advanced',
    specialty: '急診科',
  },
  {
    id: 'med-insulin',
    title: '胰島素治療完整指南',
    content: '胰島素是糖尿病治療的重要藥物。包含胰島素種類、作用時間、注射技巧、劑量調整和低血糖處理。',
    type: 'medication',
    category: '內分泌科',
    tags: ['胰島素', '糖尿病治療', '注射技巧', '血糖控制'],
    url: '/medications/insulin',
    lastModified: new Date('2024-01-19'),
    popularity: 88,
    difficulty: 'intermediate',
    specialty: '內分泌科',
  },
];

/**
 * Load search data from various sources
 */
export async function loadSearchData(): Promise<SearchItem[]> {
  try {
    // In a real application, this would fetch from:
    // - Content collections
    // - CMS API
    // - Database
    // - External APIs
    
    const data: SearchItem[] = [...sampleSearchData];
    
    // Add dynamic popularity based on recent interactions
    if (typeof window !== 'undefined') {
      try {
        const interactions = localStorage.getItem('advanced_search_interactions');
        if (interactions) {
          const interactionMap = new Map(JSON.parse(interactions));
          
          data.forEach(item => {
            const interactionCount = interactionMap.get(item.id) || 0;
            item.popularity = Math.min(100, item.popularity + interactionCount * 2);
          });
        }
      } catch (error) {
        console.warn('Failed to load interaction data:', error);
      }
    }
    
    // Sort by popularity and last modified date
    data.sort((a, b) => {
      const popularityDiff = (b.popularity || 0) - (a.popularity || 0);
      if (popularityDiff !== 0) return popularityDiff;
      
      return b.lastModified.getTime() - a.lastModified.getTime();
    });
    
    return data;
  } catch (error) {
    console.error('Failed to load search data:', error);
    return sampleSearchData;
  }
}

/**
 * Load search data from content collections (Astro specific)
 */
export async function loadContentCollections(): Promise<SearchItem[]> {
  try {
    // This would be implemented to load from Astro content collections
    // Example:
    // const calculators = await getCollection('calculators');
    // const education = await getCollection('education');
    // const procedures = await getCollection('procedures');
    // const medications = await getCollection('medications');
    
    // For now, return sample data
    return await loadSearchData();
  } catch (error) {
    console.error('Failed to load content collections:', error);
    return sampleSearchData;
  }
}

/**
 * Load search data from CMS
 */
export async function loadCMSData(): Promise<SearchItem[]> {
  try {
    // This would fetch from your CMS API
    // Example:
    // const response = await fetch('/api/cms/search-content');
    // const cmsData = await response.json();
    // return transformCMSData(cmsData);
    
    // For now, return sample data
    return await loadSearchData();
  } catch (error) {
    console.error('Failed to load CMS data:', error);
    return sampleSearchData;
  }
}

/**
 * Transform CMS data to SearchItem format
 */
function transformCMSData(cmsData: any[]): SearchItem[] {
  return cmsData.map(item => ({
    id: item.id || item.slug,
    title: item.title,
    content: item.content || item.description || '',
    type: item.type || 'education',
    category: item.category || '一般醫學',
    tags: item.tags || [],
    url: item.url || `/${item.type}/${item.slug}`,
    lastModified: new Date(item.updatedAt || item.createdAt),
    popularity: item.views || 0,
    difficulty: item.difficulty,
    specialty: item.specialty,
  }));
}

/**
 * Initialize search engine with all available data
 */
export async function initializeSearchWithAllData(): Promise<SearchItem[]> {
  try {
    // Load data from multiple sources
    const [contentData, cmsData] = await Promise.all([
      loadContentCollections(),
      loadCMSData(),
    ]);
    
    // Combine and deduplicate data
    const allData = [...contentData, ...cmsData];
    const uniqueData = allData.filter((item, index, array) => 
      array.findIndex(i => i.id === item.id) === index
    );
    
    return uniqueData;
  } catch (error) {
    console.error('Failed to initialize search data:', error);
    return sampleSearchData;
  }
}