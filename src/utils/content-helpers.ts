/**
 * 內容處理輔助工具
 * 用於處理和轉換醫療內容
 */

import { getCollection } from 'astro:content';
import type { Calculator, EducationContent, Flowchart, MedicalSpecialty } from '../content/config';
import type { SupportedLocale } from '../env.d.ts';

/**
 * 獲取本地化文字
 */
export function getLocalizedText(
  multiLangText: Record<string, string> | undefined,
  locale: SupportedLocale,
  fallbackLocale: SupportedLocale = 'zh-TW'
): string {
  if (!multiLangText) return '';
  
  return multiLangText[locale] || 
         multiLangText[fallbackLocale] || 
         Object.values(multiLangText)[0] || 
         '';
}

/**
 * 獲取所有計算機
 */
export async function getAllCalculators(): Promise<Calculator[]> {
  const calculators = await getCollection('calculators');
  return calculators.map(calc => calc.data).filter(calc => calc.isActive);
}

/**
 * 根據分類獲取計算機
 */
export async function getCalculatorsByCategory(category: string): Promise<Calculator[]> {
  const calculators = await getAllCalculators();
  return calculators.filter(calc => calc.category === category);
}

/**
 * 根據醫療專科獲取計算機
 */
export async function getCalculatorsBySpecialty(specialty: string): Promise<Calculator[]> {
  const calculators = await getAllCalculators();
  return calculators.filter(calc => 
    calc.medicalSpecialties.includes(specialty)
  );
}

/**
 * 獲取精選計算機
 */
export async function getFeaturedCalculators(limit?: number): Promise<Calculator[]> {
  const calculators = await getAllCalculators();
  const featured = calculators.filter(calc => calc.isFeatured);
  
  return limit ? featured.slice(0, limit) : featured;
}

/**
 * 根據 slug 獲取計算機
 */
export async function getCalculatorBySlug(slug: string): Promise<Calculator | undefined> {
  const calculators = await getAllCalculators();
  return calculators.find(calc => calc.slug === slug);
}

/**
 * 獲取所有教育內容
 */
export async function getAllEducationContent(): Promise<EducationContent[]> {
  const education = await getCollection('education');
  return education.map(edu => edu.data).filter(edu => edu.isActive);
}

/**
 * 根據分類獲取教育內容
 */
export async function getEducationByCategory(category: string): Promise<EducationContent[]> {
  const education = await getAllEducationContent();
  return education.filter(edu => edu.category === category);
}

/**
 * 獲取病患友善的教育內容
 */
export async function getPatientFriendlyEducation(limit?: number): Promise<EducationContent[]> {
  const education = await getAllEducationContent();
  const patientFriendly = education.filter(edu => edu.patientFriendly);
  
  return limit ? patientFriendly.slice(0, limit) : patientFriendly;
}

/**
 * 獲取專業級教育內容
 */
export async function getProfessionalEducation(limit?: number): Promise<EducationContent[]> {
  const education = await getAllEducationContent();
  const professional = education.filter(edu => edu.professionalLevel);
  
  return limit ? professional.slice(0, limit) : professional;
}

/**
 * 獲取精選教育內容
 */
export async function getFeaturedEducation(limit?: number): Promise<EducationContent[]> {
  const education = await getAllEducationContent();
  const featured = education.filter(edu => edu.isFeatured);
  
  return limit ? featured.slice(0, limit) : featured;
}

/**
 * 獲取所有流程圖
 */
export async function getAllFlowcharts(): Promise<Flowchart[]> {
  const flowcharts = await getCollection('flowcharts');
  return flowcharts.map(flow => flow.data).filter(flow => flow.isActive);
}

/**
 * 根據分類獲取流程圖
 */
export async function getFlowchartsByCategory(category: string): Promise<Flowchart[]> {
  const flowcharts = await getAllFlowcharts();
  return flowcharts.filter(flow => flow.category === category);
}

/**
 * 獲取所有醫療專科
 */
export async function getAllMedicalSpecialties(): Promise<MedicalSpecialty[]> {
  const specialties = await getCollection('medical-specialties');
  return specialties
    .map(spec => spec.data)
    .filter(spec => spec.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * 根據 slug 獲取醫療專科
 */
export async function getMedicalSpecialtyBySlug(slug: string): Promise<MedicalSpecialty | undefined> {
  const specialties = await getAllMedicalSpecialties();
  return specialties.find(spec => spec.slug === slug);
}

/**
 * 獲取相關內容
 */
export async function getRelatedContent(
  contentType: 'calculator' | 'education' | 'flowchart',
  relatedIds: string[],
  limit = 5
) {
  if (relatedIds.length === 0) return [];

  switch (contentType) {
    case 'calculator':
      const calculators = await getAllCalculators();
      return calculators
        .filter(calc => relatedIds.includes(calc.slug))
        .slice(0, limit);
    
    case 'education':
      const education = await getAllEducationContent();
      return education
        .filter(edu => relatedIds.includes(edu.slug))
        .slice(0, limit);
    
    case 'flowchart':
      const flowcharts = await getAllFlowcharts();
      return flowcharts
        .filter(flow => relatedIds.includes(flow.slug))
        .slice(0, limit);
    
    default:
      return [];
  }
}

/**
 * 搜尋內容 (基於內容集合的基礎搜尋)
 */
export async function searchContentBasic(
  query: string,
  locale: SupportedLocale = 'zh-TW',
  options: {
    includeCalculators?: boolean;
    includeEducation?: boolean;
    includeFlowcharts?: boolean;
    limit?: number;
  } = {}
) {
  const {
    includeCalculators = true,
    includeEducation = true,
    includeFlowcharts = true,
    limit = 20
  } = options;

  const results: Array<{
    type: 'calculator' | 'education' | 'flowchart';
    title: string;
    slug: string;
    excerpt: string;
    category: string;
    relevance: number;
  }> = [];

  const searchTerm = query.toLowerCase();

  // 搜尋計算機
  if (includeCalculators) {
    const calculators = await getAllCalculators();
    calculators.forEach(calc => {
      const name = getLocalizedText(calc.name, locale).toLowerCase();
      const description = getLocalizedText(calc.description, locale).toLowerCase();
      
      let relevance = 0;
      if (name.includes(searchTerm)) relevance += 10;
      if (description.includes(searchTerm)) relevance += 5;
      if (calc.tags.some(tag => tag.toLowerCase().includes(searchTerm))) relevance += 3;
      
      if (relevance > 0) {
        results.push({
          type: 'calculator',
          title: getLocalizedText(calc.name, locale),
          slug: calc.slug,
          excerpt: getLocalizedText(calc.description, locale),
          category: calc.category,
          relevance
        });
      }
    });
  }

  // 搜尋教育內容
  if (includeEducation) {
    const education = await getAllEducationContent();
    education.forEach(edu => {
      const title = getLocalizedText(edu.title, locale).toLowerCase();
      const excerpt = getLocalizedText(edu.excerpt, locale).toLowerCase();
      
      let relevance = 0;
      if (title.includes(searchTerm)) relevance += 10;
      if (excerpt.includes(searchTerm)) relevance += 5;
      if (edu.tags.some(tag => tag.toLowerCase().includes(searchTerm))) relevance += 3;
      
      if (relevance > 0) {
        results.push({
          type: 'education',
          title: getLocalizedText(edu.title, locale),
          slug: edu.slug,
          excerpt: getLocalizedText(edu.excerpt, locale) || '',
          category: edu.category,
          relevance
        });
      }
    });
  }

  // 搜尋流程圖
  if (includeFlowcharts) {
    const flowcharts = await getAllFlowcharts();
    flowcharts.forEach(flow => {
      const title = getLocalizedText(flow.title, locale).toLowerCase();
      const description = getLocalizedText(flow.description, locale).toLowerCase();
      
      let relevance = 0;
      if (title.includes(searchTerm)) relevance += 10;
      if (description.includes(searchTerm)) relevance += 5;
      if (flow.tags.some(tag => tag.toLowerCase().includes(searchTerm))) relevance += 3;
      
      if (relevance > 0) {
        results.push({
          type: 'flowchart',
          title: getLocalizedText(flow.title, locale),
          slug: flow.slug,
          excerpt: getLocalizedText(flow.description, locale) || '',
          category: flow.category,
          relevance
        });
      }
    });
  }

  // 按相關性排序並限制結果數量
  return results
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}

/**
 * 搜尋內容 (優先使用 Pagefind，回退到基礎搜尋)
 */
export async function searchContent(
  query: string,
  locale: SupportedLocale = 'zh-TW',
  options: {
    includeCalculators?: boolean;
    includeEducation?: boolean;
    includeFlowcharts?: boolean;
    limit?: number;
  } = {}
) {
  // 在瀏覽器環境中，嘗試使用 Pagefind
  if (typeof window !== 'undefined') {
    try {
      // 動態導入 Pagefind 搜尋功能
      const { searchContent: pagefindSearch } = await import('./pagefind');
      const pagefindResults = await pagefindSearch(query, locale, options);
      
      // 如果 Pagefind 返回結果，轉換格式並返回
      if (pagefindResults.length > 0) {
        return pagefindResults.map(result => ({
          type: result.type,
          title: result.title,
          slug: result.url.split('/').pop() || result.url,
          excerpt: result.excerpt,
          category: result.category || '',
          relevance: Math.round(result.score * 10) // 將分數轉換為相關性
        }));
      }
    } catch (error) {
      console.warn('Pagefind search failed, falling back to basic search:', error);
    }
  }
  
  // 回退到基礎搜尋
  return searchContentBasic(query, locale, options);
}

/**
 * 獲取內容統計
 */
export async function getContentStats() {
  const [calculators, education, flowcharts, specialties] = await Promise.all([
    getAllCalculators(),
    getAllEducationContent(),
    getAllFlowcharts(),
    getAllMedicalSpecialties()
  ]);

  return {
    calculators: {
      total: calculators.length,
      featured: calculators.filter(c => c.isFeatured).length,
      byCategory: calculators.reduce((acc, calc) => {
        acc[calc.category] = (acc[calc.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    },
    education: {
      total: education.length,
      featured: education.filter(e => e.isFeatured).length,
      patientFriendly: education.filter(e => e.patientFriendly).length,
      professional: education.filter(e => e.professionalLevel).length,
      byCategory: education.reduce((acc, edu) => {
        acc[edu.category] = (acc[edu.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    },
    flowcharts: {
      total: flowcharts.length,
      byCategory: flowcharts.reduce((acc, flow) => {
        acc[flow.category] = (acc[flow.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byComplexity: flowcharts.reduce((acc, flow) => {
        acc[flow.complexity] = (acc[flow.complexity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    },
    specialties: {
      total: specialties.length,
      featured: specialties.filter(s => s.isFeatured).length
    }
  };
}

/**
 * 生成內容摘要
 */
export function generateContentSummary(
  content: string,
  maxLength = 150,
  locale: SupportedLocale = 'zh-TW'
): string {
  if (!content) return '';
  
  // 移除 Markdown 語法
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // 標題
    .replace(/\*\*(.*?)\*\*/g, '$1') // 粗體
    .replace(/\*(.*?)\*/g, '$1') // 斜體
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 連結
    .replace(/```[\s\S]*?```/g, '') // 程式碼區塊
    .replace(/`(.*?)`/g, '$1') // 行內程式碼
    .replace(/\n+/g, ' ') // 換行
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // 根據語言選擇適當的截斷方式
  if (locale === 'zh-TW' || locale === 'ja') {
    // 中文和日文可以直接截斷
    return plainText.substring(0, maxLength - 3) + '...';
  } else {
    // 英文按單詞截斷
    const words = plainText.split(' ');
    let summary = '';
    
    for (const word of words) {
      if ((summary + word).length > maxLength - 3) {
        break;
      }
      summary += (summary ? ' ' : '') + word;
    }
    
    return summary + '...';
  }
}

/**
 * 計算閱讀時間
 */
export function calculateReadingTime(
  content: string,
  locale: SupportedLocale = 'zh-TW'
): number {
  if (!content) return 0;

  // 移除 Markdown 語法
  const plainText = content
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\n+/g, ' ')
    .trim();

  // 根據語言計算閱讀速度
  let wordsPerMinute: number;
  let wordCount: number;

  if (locale === 'zh-TW' || locale === 'ja') {
    // 中文和日文：每分鐘約 300-400 字
    wordsPerMinute = 350;
    wordCount = plainText.length;
  } else {
    // 英文：每分鐘約 200-250 詞
    wordsPerMinute = 225;
    wordCount = plainText.split(/\s+/).length;
  }

  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, readingTime); // 至少 1 分鐘
}

/**
 * 格式化日期
 */
export function formatDate(
  date: Date | string,
  locale: SupportedLocale = 'zh-TW',
  options: Intl.DateTimeFormatOptions = {}
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  const formatOptions = { ...defaultOptions, ...options };
  
  // 語言對應
  const localeMap = {
    'zh-TW': 'zh-TW',
    'en': 'en-US',
    'ja': 'ja-JP'
  };

  return dateObj.toLocaleDateString(localeMap[locale], formatOptions);
}

/**
 * 生成 SEO 友善的 URL slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/\s+/g, '-') // 空格替換為連字符
    .replace(/-+/g, '-') // 多個連字符合併為一個
    .trim()
    .replace(/^-+|-+$/g, ''); // 移除開頭和結尾的連字符
}