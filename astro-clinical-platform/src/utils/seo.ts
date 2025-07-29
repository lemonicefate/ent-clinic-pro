/**
 * SEO 優化工具
 * 專為醫療內容設計的 SEO 功能
 */

import type { SupportedLocale } from '../env.d';

// SEO 配置介面
export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  locale: SupportedLocale;
  alternateUrls?: Record<SupportedLocale, string>;
  medicalContent?: boolean;
  lastModified?: Date;
  publishedTime?: Date;
  author?: string;
  medicalSpecialty?: string[];
  evidenceLevel?: string;
  reviewedBy?: string;
  nextReviewDate?: Date;
}

// 醫療結構化資料介面
export interface MedicalStructuredData {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  author?: {
    '@type': string;
    name: string;
  };
  reviewedBy?: {
    '@type': string;
    name: string;
  };
  medicalAudience?: {
    '@type': string;
    audienceType: string;
  };
  about?: {
    '@type': string;
    name: string;
  };
  mainEntity?: {
    '@type': string;
    name: string;
    description?: string;
  };
  medicalCode?: Array<{
    '@type': string;
    code: string;
    codingSystem: string;
  }>;
}

/**
 * 生成醫療內容的結構化資料
 */
export function generateMedicalStructuredData(config: SEOConfig): MedicalStructuredData {
  const structuredData: MedicalStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: config.title,
    description: config.description,
    url: config.canonicalUrl || '',
  };

  // 添加發布和修改日期
  if (config.publishedTime) {
    structuredData.datePublished = config.publishedTime.toISOString();
  }
  
  if (config.lastModified) {
    structuredData.dateModified = config.lastModified.toISOString();
  }

  // 添加作者資訊
  if (config.author) {
    structuredData.author = {
      '@type': 'Organization',
      name: config.author
    };
  }

  // 添加審核者資訊
  if (config.reviewedBy) {
    structuredData.reviewedBy = {
      '@type': 'Person',
      name: config.reviewedBy
    };
  }

  // 添加醫療受眾
  structuredData.medicalAudience = {
    '@type': 'MedicalAudience',
    audienceType: 'HealthcareProfessional'
  };

  // 添加主要實體
  structuredData.mainEntity = {
    '@type': 'MedicalCondition',
    name: config.title,
    description: config.description
  };

  return structuredData;
}

/**
 * 生成網站結構化資料
 */
export function generateWebsiteStructuredData(config: SEOConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Astro Clinical Platform',
    description: config.description,
    url: config.canonicalUrl || '',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${new URL(config.canonicalUrl || '').origin}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

/**
 * 生成組織結構化資料
 */
export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Astro Clinical Platform',
    description: '專為醫療專業人員設計的整合式數位平台',
    url: 'https://astro-clinical-platform.vercel.app',
    logo: 'https://astro-clinical-platform.vercel.app/images/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['zh-TW', 'en', 'ja']
    },
    sameAs: [
      // 社交媒體連結可以在這裡添加
    ]
  };
}

/**
 * 生成麵包屑結構化資料
 */
export function generateBreadcrumbStructuredData(
  breadcrumbs: Array<{ label: string; href?: string }>,
  baseUrl: string
) {
  if (breadcrumbs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: crumb.href ? new URL(crumb.href, baseUrl).href : undefined
    }))
  };
}

/**
 * 生成 FAQ 結構化資料
 */
export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
  if (faqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

/**
 * 生成醫療計算機結構化資料
 */
export function generateMedicalCalculatorStructuredData(config: {
  name: string;
  description: string;
  url: string;
  medicalSpecialty: string;
  evidenceLevel?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalRiskCalculator',
    name: config.name,
    description: config.description,
    url: config.url,
    medicalSpecialty: config.medicalSpecialty,
    applicationCategory: 'Medical Calculator',
    operatingSystem: 'Web Browser',
    isAccessibleForFree: true,
    creator: {
      '@type': 'Organization',
      name: 'Astro Clinical Platform'
    }
  };
}

/**
 * 生成 Meta 標籤
 */
export function generateMetaTags(config: SEOConfig): string {
  const tags: string[] = [];

  // 基本 Meta 標籤
  tags.push(`<title>${config.title}</title>`);
  tags.push(`<meta name="description" content="${config.description}" />`);
  
  if (config.keywords && config.keywords.length > 0) {
    tags.push(`<meta name="keywords" content="${config.keywords.join(', ')}" />`);
  }

  if (config.canonicalUrl) {
    tags.push(`<link rel="canonical" href="${config.canonicalUrl}" />`);
  }

  // Open Graph 標籤
  tags.push(`<meta property="og:type" content="${config.ogType || 'website'}" />`);
  tags.push(`<meta property="og:title" content="${config.title}" />`);
  tags.push(`<meta property="og:description" content="${config.description}" />`);
  
  if (config.canonicalUrl) {
    tags.push(`<meta property="og:url" content="${config.canonicalUrl}" />`);
  }
  
  if (config.ogImage) {
    tags.push(`<meta property="og:image" content="${config.ogImage}" />`);
  }

  tags.push(`<meta property="og:locale" content="${config.locale}" />`);
  tags.push(`<meta property="og:site_name" content="Astro Clinical Platform" />`);

  // Twitter Card 標籤
  tags.push(`<meta name="twitter:card" content="summary_large_image" />`);
  tags.push(`<meta name="twitter:title" content="${config.title}" />`);
  tags.push(`<meta name="twitter:description" content="${config.description}" />`);
  
  if (config.ogImage) {
    tags.push(`<meta name="twitter:image" content="${config.ogImage}" />`);
  }

  // 醫療內容特定標籤
  if (config.medicalContent) {
    tags.push(`<meta name="medical-content" content="true" />`);
    
    if (config.medicalSpecialty && config.medicalSpecialty.length > 0) {
      tags.push(`<meta name="medical-specialty" content="${config.medicalSpecialty.join(', ')}" />`);
    }
    
    if (config.evidenceLevel) {
      tags.push(`<meta name="evidence-level" content="${config.evidenceLevel}" />`);
    }
    
    if (config.reviewedBy) {
      tags.push(`<meta name="reviewed-by" content="${config.reviewedBy}" />`);
    }
    
    if (config.nextReviewDate) {
      tags.push(`<meta name="next-review-date" content="${config.nextReviewDate.toISOString()}" />`);
    }

    // 醫療免責聲明
    const disclaimer = config.locale === 'zh-TW' 
      ? '本內容僅供教育參考，不能取代專業醫療建議。'
      : config.locale === 'en'
      ? 'This content is for educational purposes only and cannot replace professional medical advice.'
      : 'この内容は教育目的のみであり、専門的な医療アドバイスに代わるものではありません。';
    
    tags.push(`<meta name="medical-disclaimer" content="${disclaimer}" />`);
  }

  // 多語言替代 URL
  if (config.alternateUrls) {
    Object.entries(config.alternateUrls).forEach(([lang, url]) => {
      tags.push(`<link rel="alternate" hreflang="${lang}" href="${url}" />`);
    });
  }

  // 時間相關標籤
  if (config.lastModified) {
    tags.push(`<meta name="last-modified" content="${config.lastModified.toISOString()}" />`);
  }

  if (config.publishedTime) {
    tags.push(`<meta name="article:published_time" content="${config.publishedTime.toISOString()}" />`);
  }

  return tags.join('\n');
}

/**
 * 生成 XML Sitemap 項目
 */
export function generateSitemapEntry(config: {
  url: string;
  lastModified?: Date;
  changeFreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternateUrls?: Record<string, string>;
}) {
  const entry = {
    url: config.url,
    lastmod: config.lastModified?.toISOString().split('T')[0],
    changefreq: config.changeFreq || 'monthly',
    priority: config.priority || 0.5,
    alternates: config.alternateUrls ? Object.entries(config.alternateUrls).map(([lang, url]) => ({
      lang,
      url
    })) : []
  };

  return entry;
}

/**
 * 驗證 SEO 配置
 */
export function validateSEOConfig(config: SEOConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 標題驗證
  if (!config.title || config.title.trim().length === 0) {
    errors.push('Title is required');
  } else if (config.title.length > 60) {
    errors.push('Title should be 60 characters or less');
  }

  // 描述驗證
  if (!config.description || config.description.trim().length === 0) {
    errors.push('Description is required');
  } else if (config.description.length > 160) {
    errors.push('Description should be 160 characters or less');
  }

  // 關鍵字驗證
  if (config.keywords && config.keywords.length > 10) {
    errors.push('Too many keywords (max 10 recommended)');
  }

  // URL 驗證
  if (config.canonicalUrl) {
    try {
      new URL(config.canonicalUrl);
    } catch {
      errors.push('Invalid canonical URL format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 生成醫療內容的關鍵字建議
 */
export function generateMedicalKeywords(content: {
  title: string;
  description: string;
  medicalSpecialty?: string[];
  category?: string;
}): string[] {
  const keywords = new Set<string>();

  // 從標題提取關鍵字
  const titleWords = content.title
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  titleWords.forEach(word => keywords.add(word));

  // 醫療專科關鍵字
  if (content.medicalSpecialty) {
    content.medicalSpecialty.forEach(specialty => {
      keywords.add(specialty);
      
      // 專科相關關鍵字
      const specialtyKeywords = {
        'cardiology': ['心臟', '心血管', 'heart', 'cardiovascular'],
        'neurology': ['神經', '腦部', 'brain', 'neurological'],
        'emergency': ['急診', '急救', 'emergency', 'first aid'],
        'internal-medicine': ['內科', '內科醫學', 'internal medicine'],
        'surgery': ['外科', '手術', 'surgery', 'surgical'],
        'pediatrics': ['小兒科', '兒童', 'pediatric', 'children']
      };
      
      const relatedKeywords = specialtyKeywords[specialty as keyof typeof specialtyKeywords];
      if (relatedKeywords) {
        relatedKeywords.forEach(keyword => keywords.add(keyword));
      }
    });
  }

  // 分類相關關鍵字
  if (content.category) {
    const categoryKeywords = {
      'disease': ['疾病', '症狀', 'disease', 'symptoms'],
      'treatment': ['治療', '藥物', 'treatment', 'medication'],
      'prevention': ['預防', '保健', 'prevention', 'health'],
      'procedure': ['程序', '檢查', 'procedure', 'examination'],
      'lifestyle': ['生活方式', '健康', 'lifestyle', 'wellness']
    };
    
    const relatedKeywords = categoryKeywords[content.category as keyof typeof categoryKeywords];
    if (relatedKeywords) {
      relatedKeywords.forEach(keyword => keywords.add(keyword));
    }
  }

  // 通用醫療關鍵字
  const commonMedicalKeywords = [
    '醫療', '健康', '診斷', '治療', 'medical', 'health', 'diagnosis', 'treatment'
  ];
  
  commonMedicalKeywords.forEach(keyword => keywords.add(keyword));

  return Array.from(keywords).slice(0, 10); // 限制關鍵字數量
}

/**
 * 生成規範 URL
 */
export function generateCanonicalUrl(
  baseUrl: string, 
  path: string, 
  locale?: string,
  defaultLocale: string = 'zh-TW'
): string {
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // 如果是預設語言，不添加語言前綴
  if (!locale || locale === defaultLocale) {
    return `${cleanBaseUrl}${cleanPath}`;
  }
  
  return `${cleanBaseUrl}/${locale}${cleanPath}`;
}

/**
 * 生成多語言替代 URL
 */
export function generateAlternateUrls(
  baseUrl: string,
  path: string,
  supportedLocales: string[],
  defaultLocale: string = 'zh-TW'
): Record<string, string> {
  const alternates: Record<string, string> = {};
  
  supportedLocales.forEach(locale => {
    alternates[locale] = generateCanonicalUrl(baseUrl, path, locale, defaultLocale);
  });
  
  return alternates;
}

/**
 * 生成醫療內容的 Schema.org 結構化資料
 */
export function generateMedicalContentSchema(config: {
  title: string;
  description: string;
  url: string;
  contentType: 'calculator' | 'education' | 'flowchart';
  medicalSpecialty?: string[];
  evidenceLevel?: string;
  author?: string;
  reviewedBy?: string;
  lastReviewed?: string;
  publishedDate?: string;
  readingTime?: number;
  difficulty?: string;
}) {
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: config.title,
    description: config.description,
    url: config.url,
    inLanguage: 'zh-TW',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Astro Clinical Platform',
      url: new URL(config.url).origin
    }
  };

  // 根據內容類型添加特定 schema
  switch (config.contentType) {
    case 'calculator':
      return {
        ...baseSchema,
        '@type': ['MedicalWebPage', 'SoftwareApplication'],
        applicationCategory: 'HealthApplication',
        applicationSubCategory: 'MedicalCalculator',
        operatingSystem: 'Web Browser',
        isAccessibleForFree: true,
        medicalSpecialty: config.medicalSpecialty,
        creator: {
          '@type': 'Organization',
          name: 'Astro Clinical Platform'
        }
      };

    case 'education':
      return {
        ...baseSchema,
        '@type': ['MedicalWebPage', 'Article'],
        articleSection: 'Medical Education',
        wordCount: config.readingTime ? config.readingTime * 200 : undefined,
        timeRequired: config.readingTime ? `PT${config.readingTime}M` : undefined,
        educationalLevel: config.difficulty,
        author: config.author ? {
          '@type': 'Person',
          name: config.author
        } : undefined,
        reviewedBy: config.reviewedBy ? {
          '@type': 'Person',
          name: config.reviewedBy
        } : undefined,
        dateReviewed: config.lastReviewed,
        datePublished: config.publishedDate
      };

    case 'flowchart':
      return {
        ...baseSchema,
        '@type': ['MedicalWebPage', 'CreativeWork'],
        creativeWorkStatus: 'Published',
        workExample: {
          '@type': 'VisualArtwork',
          artform: 'Flowchart'
        },
        medicalSpecialty: config.medicalSpecialty
      };

    default:
      return baseSchema;
  }
}

/**
 * 生成醫療免責聲明
 */
export function generateMedicalDisclaimer(locale: string = 'zh-TW'): string {
  const disclaimers = {
    'zh-TW': '本內容僅供教育和資訊目的，不應作為專業醫療建議、診斷或治療的替代品。使用前請務必諮詢合格的醫療專業人員。',
    'en': 'This content is for educational and informational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals before use.',
    'ja': 'この内容は教育および情報提供のみを目的としており、専門的な医療アドバイス、診断、または治療の代替として使用すべきではありません。使用前に必ず資格のある医療専門家にご相談ください。'
  };
  
  return disclaimers[locale as keyof typeof disclaimers] || disclaimers['zh-TW'];
}

/**
 * 優化醫療內容標題
 */
export function optimizeMedicalTitle(
  title: string,
  contentType: 'calculator' | 'education' | 'flowchart',
  medicalSpecialty?: string
): string {
  const typeLabels = {
    calculator: '計算器',
    education: '教育',
    flowchart: '流程圖'
  };
  
  let optimizedTitle = title;
  
  // 添加內容類型標籤
  if (!title.includes(typeLabels[contentType])) {
    optimizedTitle = `${title} - ${typeLabels[contentType]}`;
  }
  
  // 添加醫療專科
  if (medicalSpecialty && !title.includes(medicalSpecialty)) {
    optimizedTitle = `${optimizedTitle} | ${medicalSpecialty}`;
  }
  
  // 添加平台名稱
  if (!optimizedTitle.includes('Astro Clinical Platform')) {
    optimizedTitle = `${optimizedTitle} - Astro Clinical Platform`;
  }
  
  // 確保標題長度適當
  if (optimizedTitle.length > 60) {
    optimizedTitle = optimizedTitle.substring(0, 57) + '...';
  }
  
  return optimizedTitle;
}

/**
 * 生成醫療內容描述
 */
export function generateMedicalDescription(
  baseDescription: string,
  contentType: 'calculator' | 'education' | 'flowchart',
  medicalSpecialty?: string,
  evidenceLevel?: string
): string {
  let description = baseDescription;
  
  // 添加內容類型說明
  const typeDescriptions = {
    calculator: '專業醫療計算工具',
    education: '醫療教育內容',
    flowchart: '醫療流程圖'
  };
  
  // 添加證據等級說明
  const evidenceDescriptions = {
    high: '基於高品質證據',
    medium: '基於中等品質證據',
    low: '基於有限證據'
  };
  
  let suffix = typeDescriptions[contentType];
  
  if (evidenceLevel && evidenceDescriptions[evidenceLevel as keyof typeof evidenceDescriptions]) {
    suffix += `，${evidenceDescriptions[evidenceLevel as keyof typeof evidenceDescriptions]}`;
  }
  
  if (medicalSpecialty) {
    suffix += `，適用於${medicalSpecialty}專科`;
  }
  
  description = `${description} ${suffix}。`;
  
  // 確保描述長度適當
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }
  
  return description;
}