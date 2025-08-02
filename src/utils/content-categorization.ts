/**
 * 內容分類和標籤管理工具
 * 用於醫療內容的智能分類和相關內容推薦
 */

import type { SupportedLocale } from '../env.d';
import { 
  getAllCalculators, 
  getAllEducationContent, 
  getAllFlowcharts,
  getAllMedicalSpecialties,
} from './content-helpers';
import { getLocalizedText } from './content-helpers-client.js';

// 內容分類介面
export interface ContentCategory {
  id: string;
  name: Record<SupportedLocale, string>;
  description: Record<SupportedLocale, string>;
  icon: string;
  color: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
}

// 標籤介面
export interface ContentTag {
  id: string;
  name: Record<SupportedLocale, string>;
  category: string;
  weight: number;
  synonyms: string[];
  relatedTags: string[];
}

// 內容項目介面
export interface CategorizedContent {
  id: string;
  type: 'calculator' | 'education' | 'flowchart';
  title: string;
  slug: string;
  excerpt: string;
  categories: string[];
  tags: string[];
  specialty: string;
  difficulty?: string;
  lastUpdated: Date;
  featured: boolean;
  popularity: number;
}

/**
 * 預定義的醫療內容分類
 */
export const medicalCategories: ContentCategory[] = [
  // 主要分類
  {
    id: 'cardiology',
    name: {
      'zh-TW': '心臟科',
      'en': 'Cardiology',
      'ja': '循環器科'
    },
    description: {
      'zh-TW': '心血管疾病診斷和治療',
      'en': 'Cardiovascular disease diagnosis and treatment',
      'ja': '心血管疾患の診断と治療'
    },
    icon: 'heart',
    color: 'red',
    sortOrder: 1,
    isActive: true
  },
  {
    id: 'neurology',
    name: {
      'zh-TW': '神經科',
      'en': 'Neurology',
      'ja': '神経科'
    },
    description: {
      'zh-TW': '神經系統疾病診斷和治療',
      'en': 'Neurological disorders diagnosis and treatment',
      'ja': '神経系疾患の診断と治療'
    },
    icon: 'brain',
    color: 'purple',
    sortOrder: 2,
    isActive: true
  },
  {
    id: 'emergency',
    name: {
      'zh-TW': '急診醫學',
      'en': 'Emergency Medicine',
      'ja': '救急医学'
    },
    description: {
      'zh-TW': '急診和緊急醫療處置',
      'en': 'Emergency and critical care medicine',
      'ja': '救急・集中治療医学'
    },
    icon: 'emergency',
    color: 'orange',
    sortOrder: 3,
    isActive: true
  },
  {
    id: 'internal-medicine',
    name: {
      'zh-TW': '內科',
      'en': 'Internal Medicine',
      'ja': '内科'
    },
    description: {
      'zh-TW': '內科疾病診斷和治療',
      'en': 'Internal medicine diagnosis and treatment',
      'ja': '内科疾患の診断と治療'
    },
    icon: 'stethoscope',
    color: 'blue',
    sortOrder: 4,
    isActive: true
  },
  {
    id: 'surgery',
    name: {
      'zh-TW': '外科',
      'en': 'Surgery',
      'ja': '外科'
    },
    description: {
      'zh-TW': '外科手術和處置',
      'en': 'Surgical procedures and interventions',
      'ja': '外科手術と処置'
    },
    icon: 'scalpel',
    color: 'green',
    sortOrder: 5,
    isActive: true
  },
  {
    id: 'pediatrics',
    name: {
      'zh-TW': '小兒科',
      'en': 'Pediatrics',
      'ja': '小児科'
    },
    description: {
      'zh-TW': '兒童醫學和發育',
      'en': 'Pediatric medicine and development',
      'ja': '小児医学と発達'
    },
    icon: 'child',
    color: 'pink',
    sortOrder: 6,
    isActive: true
  },
  
  // 子分類 - 心臟科
  {
    id: 'arrhythmia',
    name: {
      'zh-TW': '心律不整',
      'en': 'Arrhythmia',
      'ja': '不整脈'
    },
    description: {
      'zh-TW': '心律異常的診斷和治療',
      'en': 'Diagnosis and treatment of cardiac arrhythmias',
      'ja': '心律異常の診断と治療'
    },
    icon: 'heartbeat',
    color: 'red',
    parentId: 'cardiology',
    sortOrder: 11,
    isActive: true
  },
  {
    id: 'heart-failure',
    name: {
      'zh-TW': '心臟衰竭',
      'en': 'Heart Failure',
      'ja': '心不全'
    },
    description: {
      'zh-TW': '心臟功能不全的管理',
      'en': 'Management of cardiac dysfunction',
      'ja': '心機能不全の管理'
    },
    icon: 'heart-broken',
    color: 'red',
    parentId: 'cardiology',
    sortOrder: 12,
    isActive: true
  },
  
  // 子分類 - 急診醫學
  {
    id: 'trauma',
    name: {
      'zh-TW': '外傷',
      'en': 'Trauma',
      'ja': '外傷'
    },
    description: {
      'zh-TW': '創傷和急性傷害處理',
      'en': 'Trauma and acute injury management',
      'ja': '外傷と急性損傷の管理'
    },
    icon: 'bandage',
    color: 'orange',
    parentId: 'emergency',
    sortOrder: 31,
    isActive: true
  },
  {
    id: 'resuscitation',
    name: {
      'zh-TW': '急救復甦',
      'en': 'Resuscitation',
      'ja': '蘇生'
    },
    description: {
      'zh-TW': '心肺復甦和急救處置',
      'en': 'CPR and emergency resuscitation',
      'ja': '心肺蘇生と救急処置'
    },
    icon: 'life-ring',
    color: 'orange',
    parentId: 'emergency',
    sortOrder: 32,
    isActive: true
  }
];

/**
 * 預定義的醫療標籤
 */
export const medicalTags: ContentTag[] = [
  // 疾病標籤
  {
    id: 'atrial-fibrillation',
    name: {
      'zh-TW': '心房顫動',
      'en': 'Atrial Fibrillation',
      'ja': '心房細動'
    },
    category: 'disease',
    weight: 10,
    synonyms: ['AF', 'AFib', '心房纖維性顫動'],
    relatedTags: ['arrhythmia', 'stroke-risk', 'anticoagulation']
  },
  {
    id: 'hypertension',
    name: {
      'zh-TW': '高血壓',
      'en': 'Hypertension',
      'ja': '高血圧'
    },
    category: 'disease',
    weight: 10,
    synonyms: ['HTN', '高血壓症'],
    relatedTags: ['cardiovascular-risk', 'blood-pressure']
  },
  {
    id: 'diabetes',
    name: {
      'zh-TW': '糖尿病',
      'en': 'Diabetes',
      'ja': '糖尿病'
    },
    category: 'disease',
    weight: 10,
    synonyms: ['DM', 'diabetes-mellitus'],
    relatedTags: ['blood-glucose', 'metabolic-syndrome']
  },
  
  // 風險評估標籤
  {
    id: 'stroke-risk',
    name: {
      'zh-TW': '中風風險',
      'en': 'Stroke Risk',
      'ja': '脳卒中リスク'
    },
    category: 'risk-assessment',
    weight: 8,
    synonyms: ['cerebrovascular-risk'],
    relatedTags: ['cha2ds2-vasc', 'anticoagulation']
  },
  {
    id: 'bleeding-risk',
    name: {
      'zh-TW': '出血風險',
      'en': 'Bleeding Risk',
      'ja': '出血リスク'
    },
    category: 'risk-assessment',
    weight: 8,
    synonyms: ['hemorrhage-risk'],
    relatedTags: ['has-bled', 'anticoagulation']
  },
  
  // 治療標籤
  {
    id: 'anticoagulation',
    name: {
      'zh-TW': '抗凝血治療',
      'en': 'Anticoagulation',
      'ja': '抗凝固療法'
    },
    category: 'treatment',
    weight: 7,
    synonyms: ['blood-thinner', '抗凝血劑'],
    relatedTags: ['warfarin', 'doac', 'bleeding-risk']
  },
  
  // 計算機標籤
  {
    id: 'cha2ds2-vasc',
    name: {
      'zh-TW': 'CHA₂DS₂-VASc',
      'en': 'CHA₂DS₂-VASc',
      'ja': 'CHA₂DS₂-VASc'
    },
    category: 'calculator',
    weight: 9,
    synonyms: ['chads2-vasc', 'stroke-risk-calculator'],
    relatedTags: ['atrial-fibrillation', 'stroke-risk']
  },
  {
    id: 'has-bled',
    name: {
      'zh-TW': 'HAS-BLED',
      'en': 'HAS-BLED',
      'ja': 'HAS-BLED'
    },
    category: 'calculator',
    weight: 8,
    synonyms: ['bleeding-risk-calculator'],
    relatedTags: ['bleeding-risk', 'anticoagulation']
  }
];

/**
 * 內容分類管理器
 */
export class ContentCategorizer {
  private categories: Map<string, ContentCategory> = new Map();
  private tags: Map<string, ContentTag> = new Map();
  private contentCache: Map<string, CategorizedContent[]> = new Map();

  constructor() {
    this.initializeCategories();
    this.initializeTags();
  }

  /**
   * 初始化分類
   */
  private initializeCategories(): void {
    medicalCategories.forEach(category => {
      this.categories.set(category.id, category);
    });
  }

  /**
   * 初始化標籤
   */
  private initializeTags(): void {
    medicalTags.forEach(tag => {
      this.tags.set(tag.id, tag);
    });
  }

  /**
   * 獲取所有分類
   */
  getCategories(locale: SupportedLocale = 'zh-TW'): ContentCategory[] {
    return Array.from(this.categories.values())
      .filter(cat => cat.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * 獲取主要分類（無父分類）
   */
  getMainCategories(locale: SupportedLocale = 'zh-TW'): ContentCategory[] {
    return this.getCategories(locale).filter(cat => !cat.parentId);
  }

  /**
   * 獲取子分類
   */
  getSubCategories(parentId: string, locale: SupportedLocale = 'zh-TW'): ContentCategory[] {
    return this.getCategories(locale).filter(cat => cat.parentId === parentId);
  }

  /**
   * 根據 ID 獲取分類
   */
  getCategoryById(id: string): ContentCategory | undefined {
    return this.categories.get(id);
  }

  /**
   * 獲取所有標籤
   */
  getTags(category?: string): ContentTag[] {
    const allTags = Array.from(this.tags.values());
    return category ? allTags.filter(tag => tag.category === category) : allTags;
  }

  /**
   * 根據 ID 獲取標籤
   */
  getTagById(id: string): ContentTag | undefined {
    return this.tags.get(id);
  }

  /**
   * 搜尋標籤
   */
  searchTags(query: string, locale: SupportedLocale = 'zh-TW'): ContentTag[] {
    const searchTerm = query.toLowerCase();
    return Array.from(this.tags.values()).filter(tag => {
      const name = getLocalizedText(tag.name, locale).toLowerCase();
      const synonyms = tag.synonyms.map(s => s.toLowerCase());
      
      return name.includes(searchTerm) || 
             synonyms.some(synonym => synonym.includes(searchTerm));
    });
  }

  /**
   * 獲取相關標籤
   */
  getRelatedTags(tagId: string): ContentTag[] {
    const tag = this.tags.get(tagId);
    if (!tag) return [];

    return tag.relatedTags
      .map(id => this.tags.get(id))
      .filter((t): t is ContentTag => t !== undefined);
  }

  /**
   * 自動分類內容
   */
  async categorizeContent(
    content: string,
    title: string,
    existingTags: string[] = []
  ): Promise<{
    suggestedCategories: string[];
    suggestedTags: string[];
    confidence: number;
  }> {
    const text = (title + ' ' + content).toLowerCase();
    const suggestedCategories: string[] = [];
    const suggestedTags: string[] = [];
    let totalConfidence = 0;
    let matchCount = 0;

    // 分析標籤匹配
    for (const tag of this.tags.values()) {
      const tagName = getLocalizedText(tag.name, 'zh-TW').toLowerCase();
      const synonyms = tag.synonyms.map(s => s.toLowerCase());
      
      let matches = 0;
      if (text.includes(tagName)) matches += tag.weight;
      
      synonyms.forEach(synonym => {
        if (text.includes(synonym)) matches += tag.weight * 0.8;
      });

      if (matches > 0) {
        suggestedTags.push(tag.id);
        totalConfidence += matches;
        matchCount++;
      }
    }

    // 根據標籤推薦分類
    const tagCategories = suggestedTags
      .map(tagId => this.tags.get(tagId)?.category)
      .filter((cat): cat is string => cat !== undefined);

    // 分析分類匹配
    for (const category of this.categories.values()) {
      const categoryName = getLocalizedText(category.name, 'zh-TW').toLowerCase();
      const description = getLocalizedText(category.description, 'zh-TW').toLowerCase();
      
      if (text.includes(categoryName) || text.includes(description)) {
        suggestedCategories.push(category.id);
        totalConfidence += 5;
        matchCount++;
      }
    }

    // 添加從標籤推導的分類
    const uniqueTagCategories = [...new Set(tagCategories)];
    uniqueTagCategories.forEach(cat => {
      if (!suggestedCategories.includes(cat)) {
        suggestedCategories.push(cat);
      }
    });

    const confidence = matchCount > 0 ? Math.min(totalConfidence / matchCount / 10, 1) : 0;

    return {
      suggestedCategories: [...new Set(suggestedCategories)],
      suggestedTags: [...new Set([...suggestedTags, ...existingTags])],
      confidence
    };
  }

  /**
   * 獲取分類統計
   */
  async getCategoryStats(): Promise<Record<string, {
    calculators: number;
    education: number;
    flowcharts: number;
    total: number;
  }>> {
    const [calculators, education, flowcharts] = await Promise.all([
      getAllCalculators(),
      getAllEducationContent(),
      getAllFlowcharts()
    ]);

    const stats: Record<string, {
      calculators: number;
      education: number;
      flowcharts: number;
      total: number;
    }> = {};

    // 初始化統計
    this.categories.forEach((category, id) => {
      stats[id] = { calculators: 0, education: 0, flowcharts: 0, total: 0 };
    });

    // 統計計算機
    calculators.forEach(calc => {
      if (stats[calc.category]) {
        stats[calc.category].calculators++;
        stats[calc.category].total++;
      }
    });

    // 統計教育內容
    education.forEach(edu => {
      if (stats[edu.category]) {
        stats[edu.category].education++;
        stats[edu.category].total++;
      }
    });

    // 統計流程圖
    flowcharts.forEach(flow => {
      if (stats[flow.category]) {
        stats[flow.category].flowcharts++;
        stats[flow.category].total++;
      }
    });

    return stats;
  }

  /**
   * 獲取熱門標籤
   */
  getPopularTags(limit = 20): ContentTag[] {
    return Array.from(this.tags.values())
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit);
  }

  /**
   * 根據標籤獲取相關內容
   */
  async getContentByTags(
    tagIds: string[],
    contentType?: 'calculator' | 'education' | 'flowchart',
    limit = 10
  ): Promise<CategorizedContent[]> {
    // 這裡應該實現根據標籤搜尋內容的邏輯
    // 目前返回空陣列，實際實現需要查詢內容集合
    return [];
  }
}

// 全域分類器實例
export const contentCategorizer = new ContentCategorizer();

/**
 * 獲取內容的相關推薦
 */
export async function getRelatedContentByTags(
  currentTags: string[],
  currentId: string,
  contentType: 'calculator' | 'education' | 'flowchart',
  limit = 5
): Promise<any[]> {
  if (currentTags.length === 0) return [];

  // 獲取相關標籤
  const relatedTags = new Set<string>();
  currentTags.forEach(tagId => {
    const tag = contentCategorizer.getTagById(tagId);
    if (tag) {
      tag.relatedTags.forEach(relatedId => relatedTags.add(relatedId));
    }
  });

  const allRelevantTags = [...currentTags, ...Array.from(relatedTags)];

  // 根據內容類型獲取相關內容
  // 這裡需要實現具體的內容匹配邏輯
  return [];
}

/**
 * 生成內容標籤建議
 */
export async function generateTagSuggestions(
  title: string,
  content: string,
  existingTags: string[] = []
): Promise<{
  suggested: ContentTag[];
  confidence: number;
}> {
  const result = await contentCategorizer.categorizeContent(content, title, existingTags);
  
  const suggestedTags = result.suggestedTags
    .map(id => contentCategorizer.getTagById(id))
    .filter((tag): tag is ContentTag => tag !== undefined)
    .filter(tag => !existingTags.includes(tag.id));

  return {
    suggested: suggestedTags,
    confidence: result.confidence
  };
}