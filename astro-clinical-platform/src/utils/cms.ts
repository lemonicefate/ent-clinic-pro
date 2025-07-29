/**
 * CMS 整合工具
 * 用於從 Strapi CMS 獲取醫療內容
 */

import type { SupportedLocale } from '../env.d.ts';

// CMS API 基礎 URL
const CMS_URL = import.meta.env.PUBLIC_CMS_URL || 'http://localhost:1337';
const API_BASE = `${CMS_URL}/api`;

// API Token（如果需要）
const API_TOKEN = import.meta.env.CMS_API_TOKEN;

// 請求標頭
const headers: HeadersInit = {
  'Content-Type': 'application/json',
};

if (API_TOKEN) {
  headers['Authorization'] = `Bearer ${API_TOKEN}`;
}

/**
 * 通用 API 請求函數
 */
async function fetchFromCMS<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`CMS API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch from CMS: ${url}`, error);
    throw error;
  }
}

/**
 * 醫療計算機相關 API
 */
export interface Calculator {
  id: number;
  attributes: {
    name: Record<string, string>;
    slug: string;
    description: Record<string, string>;
    category: string;
    fields: any[];
    calculationFunction: string;
    interpretation: any[];
    references?: any[];
    tags?: string[];
    difficulty: 'basic' | 'intermediate' | 'advanced';
    isActive: boolean;
    clinicalGuidelines?: Record<string, string>;
    seoTitle?: Record<string, string>;
    seoDescription?: Record<string, string>;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    locale: string;
  };
}

export interface CalculatorsResponse {
  data: Calculator[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

/**
 * 獲取所有計算機
 */
export async function getCalculators(
  locale: SupportedLocale = 'zh-TW',
  options: {
    category?: string;
    populate?: string;
    sort?: string;
    pagination?: {
      page?: number;
      pageSize?: number;
    };
  } = {}
): Promise<CalculatorsResponse> {
  const params = new URLSearchParams({
    locale,
    'populate': options.populate || '*',
    'sort': options.sort || 'name:asc',
  });

  if (options.category) {
    params.append('filters[category][$eq]', options.category);
  }

  if (options.pagination?.page) {
    params.append('pagination[page]', options.pagination.page.toString());
  }

  if (options.pagination?.pageSize) {
    params.append('pagination[pageSize]', options.pagination.pageSize.toString());
  }

  // 只獲取已發布且啟用的計算機
  params.append('filters[isActive][$eq]', 'true');
  params.append('publicationState', 'live');

  return fetchFromCMS<CalculatorsResponse>(`/calculators?${params}`);
}

/**
 * 根據 slug 獲取特定計算機
 */
export async function getCalculatorBySlug(
  slug: string,
  locale: SupportedLocale = 'zh-TW'
): Promise<Calculator | null> {
  const params = new URLSearchParams({
    locale,
    'populate': '*',
    'filters[slug][$eq]': slug,
    'filters[isActive][$eq]': 'true',
    'publicationState': 'live',
  });

  try {
    const response = await fetchFromCMS<CalculatorsResponse>(`/calculators?${params}`);
    return response.data[0] || null;
  } catch (error) {
    console.error(`Failed to fetch calculator: ${slug}`, error);
    return null;
  }
}

/**
 * 教育內容相關 API
 */
export interface EducationContent {
  id: number;
  attributes: {
    title: Record<string, string>;
    slug: string;
    content: Record<string, string>;
    excerpt?: Record<string, string>;
    category: string;
    tags?: string[];
    difficulty: 'basic' | 'intermediate' | 'advanced';
    readingTime?: number;
    flowchartCode?: string;
    author?: Record<string, string>;
    reviewedBy?: string;
    lastReviewDate?: string;
    isActive: boolean;
    patientFriendly: boolean;
    professionalLevel: boolean;
    ageGroup: 'all' | 'pediatric' | 'adult' | 'geriatric';
    seoTitle?: Record<string, string>;
    seoDescription?: Record<string, string>;
    keywords?: string[];
    featuredImage?: any;
    gallery?: any[];
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    locale: string;
  };
}

export interface EducationResponse {
  data: EducationContent[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

/**
 * 獲取教育內容
 */
export async function getEducationContent(
  locale: SupportedLocale = 'zh-TW',
  options: {
    category?: string;
    difficulty?: string;
    patientFriendly?: boolean;
    populate?: string;
    sort?: string;
    pagination?: {
      page?: number;
      pageSize?: number;
    };
  } = {}
): Promise<EducationResponse> {
  const params = new URLSearchParams({
    locale,
    'populate': options.populate || '*',
    'sort': options.sort || 'title:asc',
  });

  if (options.category) {
    params.append('filters[category][$eq]', options.category);
  }

  if (options.difficulty) {
    params.append('filters[difficulty][$eq]', options.difficulty);
  }

  if (options.patientFriendly !== undefined) {
    params.append('filters[patientFriendly][$eq]', options.patientFriendly.toString());
  }

  if (options.pagination?.page) {
    params.append('pagination[page]', options.pagination.page.toString());
  }

  if (options.pagination?.pageSize) {
    params.append('pagination[pageSize]', options.pagination.pageSize.toString());
  }

  // 只獲取已發布且啟用的內容
  params.append('filters[isActive][$eq]', 'true');
  params.append('publicationState', 'live');

  return fetchFromCMS<EducationResponse>(`/educations?${params}`);
}

/**
 * 根據 slug 獲取特定教育內容
 */
export async function getEducationBySlug(
  slug: string,
  locale: SupportedLocale = 'zh-TW'
): Promise<EducationContent | null> {
  const params = new URLSearchParams({
    locale,
    'populate': '*',
    'filters[slug][$eq]': slug,
    'filters[isActive][$eq]': 'true',
    'publicationState': 'live',
  });

  try {
    const response = await fetchFromCMS<EducationResponse>(`/educations?${params}`);
    return response.data[0] || null;
  } catch (error) {
    console.error(`Failed to fetch education content: ${slug}`, error);
    return null;
  }
}

/**
 * 流程圖相關 API
 */
export interface Flowchart {
  id: number;
  attributes: {
    title: Record<string, string>;
    slug: string;
    description?: Record<string, string>;
    mermaidCode: string;
    category: string;
    complexity: 'simple' | 'moderate' | 'complex';
    accessibility: {
      textAlternative: Record<string, string>;
      ariaLabel: Record<string, string>;
    };
    tags?: string[];
    isActive: boolean;
    clinicalContext?: Record<string, string>;
    evidenceLevel?: 'A' | 'B' | 'C' | 'D';
    references?: any[];
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    locale: string;
  };
}

export interface FlowchartsResponse {
  data: Flowchart[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

/**
 * 獲取流程圖
 */
export async function getFlowcharts(
  locale: SupportedLocale = 'zh-TW',
  options: {
    category?: string;
    complexity?: string;
    populate?: string;
    sort?: string;
    pagination?: {
      page?: number;
      pageSize?: number;
    };
  } = {}
): Promise<FlowchartsResponse> {
  const params = new URLSearchParams({
    locale,
    'populate': options.populate || '*',
    'sort': options.sort || 'title:asc',
  });

  if (options.category) {
    params.append('filters[category][$eq]', options.category);
  }

  if (options.complexity) {
    params.append('filters[complexity][$eq]', options.complexity);
  }

  if (options.pagination?.page) {
    params.append('pagination[page]', options.pagination.page.toString());
  }

  if (options.pagination?.pageSize) {
    params.append('pagination[pageSize]', options.pagination.pageSize.toString());
  }

  // 只獲取已發布且啟用的流程圖
  params.append('filters[isActive][$eq]', 'true');
  params.append('publicationState', 'live');

  return fetchFromCMS<FlowchartsResponse>(`/flowcharts?${params}`);
}

/**
 * 根據 slug 獲取特定流程圖
 */
export async function getFlowchartBySlug(
  slug: string,
  locale: SupportedLocale = 'zh-TW'
): Promise<Flowchart | null> {
  const params = new URLSearchParams({
    locale,
    'populate': '*',
    'filters[slug][$eq]': slug,
    'filters[isActive][$eq]': 'true',
    'publicationState': 'live',
  });

  try {
    const response = await fetchFromCMS<FlowchartsResponse>(`/flowcharts?${params}`);
    return response.data[0] || null;
  } catch (error) {
    console.error(`Failed to fetch flowchart: ${slug}`, error);
    return null;
  }
}

/**
 * 醫療專科相關 API
 */
export interface MedicalSpecialty {
  id: number;
  attributes: {
    name: Record<string, string>;
    slug: string;
    description?: Record<string, string>;
    color?: string;
    isActive: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    locale: string;
  };
}

export interface MedicalSpecialtiesResponse {
  data: MedicalSpecialty[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

/**
 * 獲取醫療專科
 */
export async function getMedicalSpecialties(
  locale: SupportedLocale = 'zh-TW'
): Promise<MedicalSpecialtiesResponse> {
  const params = new URLSearchParams({
    locale,
    'sort': 'sortOrder:asc',
    'filters[isActive][$eq]': 'true',
    'publicationState': 'live',
  });

  return fetchFromCMS<MedicalSpecialtiesResponse>(`/medical-specialties?${params}`);
}

/**
 * 搜尋功能
 */
export async function searchContent(
  query: string,
  locale: SupportedLocale = 'zh-TW',
  options: {
    contentTypes?: ('calculators' | 'educations' | 'flowcharts')[];
    limit?: number;
  } = {}
) {
  const { contentTypes = ['calculators', 'educations', 'flowcharts'], limit = 10 } = options;
  
  const results = await Promise.allSettled(
    contentTypes.map(async (type) => {
      const params = new URLSearchParams({
        locale,
        'populate': '*',
        'pagination[limit]': limit.toString(),
        'filters[isActive][$eq]': 'true',
        'publicationState': 'live',
      });

      // 根據內容類型設定搜尋欄位
      if (type === 'calculators') {
        params.append('filters[$or][0][name][$containsi]', query);
        params.append('filters[$or][1][description][$containsi]', query);
      } else if (type === 'educations') {
        params.append('filters[$or][0][title][$containsi]', query);
        params.append('filters[$or][1][content][$containsi]', query);
        params.append('filters[$or][2][excerpt][$containsi]', query);
      } else if (type === 'flowcharts') {
        params.append('filters[$or][0][title][$containsi]', query);
        params.append('filters[$or][1][description][$containsi]', query);
      }

      const response = await fetchFromCMS<any>(`/${type}?${params}`);
      return {
        type,
        data: response.data,
      };
    })
  );

  return results
    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
    .map(result => result.value)
    .flat();
}

/**
 * 錯誤處理和重試機制
 */
export class CMSError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'CMSError';
  }
}

/**
 * 帶重試的 CMS 請求
 */
export async function fetchWithRetry<T>(
  endpoint: string,
  options: RequestInit = {},
  maxRetries = 3
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fetchFromCMS<T>(endpoint, options);
    } catch (error) {
      lastError = error as Error;
      
      if (i === maxRetries) {
        break;
      }

      // 指數退避
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new CMSError(
    `Failed to fetch after ${maxRetries + 1} attempts: ${lastError.message}`,
    undefined,
    endpoint
  );
}