/**
 * Medical SEO Utilities
 * 醫療內容 SEO 工具 - 專門針對醫療內容的 SEO 優化
 */

import type { CalculatorConfig } from '../components/calculators/types';

// 醫療內容類型定義
export interface MedicalContentSEO {
  type: 'MedicalWebPage' | 'MedicalScholarlyArticle' | 'MedicalGuidelineRecommendation' | 'MedicalCalculator';
  title: string;
  description: string;
  url: string;
  lastReviewed?: string;
  reviewedBy?: {
    type: 'Person' | 'Organization';
    name: string;
    affiliation?: string;
  };
  medicalAudience?: 'Patient' | 'Clinician' | 'MedicalResearcher';
  medicalSpecialty?: string[];
  about?: MedicalEntity[];
  mainContentOfPage?: string[];
  evidenceLevel?: 'EvidenceLevelA' | 'EvidenceLevelB' | 'EvidenceLevelC';
  medicalCode?: MedicalCode[];
}

export interface MedicalEntity {
  type: 'MedicalCondition' | 'Drug' | 'TherapeuticProcedure' | 'MedicalDevice';
  name: string;
  alternateName?: string[];
  code?: MedicalCode[];
  description?: string;
}

export interface MedicalCode {
  code: string;
  codingSystem: 'ICD-10' | 'ICD-11' | 'SNOMED-CT' | 'MeSH' | 'CPT' | 'LOINC';
  codeValue?: string;
  url?: string;
}

export interface CalculatorSEO extends MedicalContentSEO {
  type: 'MedicalCalculator';
  calculatorType: string;
  inputParameters: CalculatorParameter[];
  outputParameters: CalculatorOutput[];
  clinicalApplication: string[];
  validationStudies?: ValidationStudy[];
}

export interface CalculatorParameter {
  name: string;
  description: string;
  unit?: string;
  valueType: 'number' | 'boolean' | 'select';
  required: boolean;
  normalRange?: {
    min?: number;
    max?: number;
  };
}

export interface CalculatorOutput {
  name: string;
  description: string;
  unit?: string;
  interpretation: InterpretationRange[];
}

export interface InterpretationRange {
  range: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  recommendation: string;
  color?: string;
}

export interface ValidationStudy {
  title: string;
  authors: string[];
  journal?: string;
  year?: number;
  pmid?: string;
  doi?: string;
  url?: string;
}

/**
 * 生成醫療網頁的 Schema.org JSON-LD
 */
export function generateMedicalWebPageSchema(content: MedicalContentSEO): object {
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': content.type,
    name: content.title,
    description: content.description,
    url: content.url,
    lastReviewed: content.lastReviewed,
    reviewedBy: content.reviewedBy ? {
      '@type': content.reviewedBy.type,
      name: content.reviewedBy.name,
      ...(content.reviewedBy.affiliation && { affiliation: content.reviewedBy.affiliation })
    } : undefined,
    audience: content.medicalAudience ? `https://schema.org/${content.medicalAudience}` : undefined,
    specialty: content.medicalSpecialty?.map(specialty => `https://schema.org/${specialty}`),
    mainContentOfPage: content.mainContentOfPage,
    about: content.about?.map(entity => ({
      '@type': entity.type,
      name: entity.name,
      alternateName: entity.alternateName,
      description: entity.description,
      code: entity.code?.map(code => ({
        '@type': 'MedicalCode',
        code: code.code,
        codingSystem: code.codingSystem,
        codeValue: code.codeValue,
        ...(code.url && { url: code.url })
      }))
    }))
  };

  // 移除 undefined 值
  return JSON.parse(JSON.stringify(baseSchema));
}

/**
 * 生成醫療計算器的 Schema.org JSON-LD
 */
export function generateCalculatorSchema(calculator: CalculatorSEO): object {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalCalculator',
    name: calculator.title,
    description: calculator.description,
    url: calculator.url,
    lastReviewed: calculator.lastReviewed,
    reviewedBy: calculator.reviewedBy,
    audience: calculator.medicalAudience ? `https://schema.org/${calculator.medicalAudience}` : undefined,
    specialty: calculator.medicalSpecialty?.map(specialty => `https://schema.org/${specialty}`),
    calculatorType: calculator.calculatorType,
    applicationCategory: 'MedicalApplication',
    about: calculator.about,
    clinicalApplication: calculator.clinicalApplication,
    inputParameters: calculator.inputParameters.map(param => ({
      '@type': 'PropertyValue',
      name: param.name,
      description: param.description,
      unitText: param.unit,
      valueRequired: param.required,
      ...(param.normalRange && {
        minValue: param.normalRange.min,
        maxValue: param.normalRange.max
      })
    })),
    outputParameters: calculator.outputParameters.map(output => ({
      '@type': 'PropertyValue',
      name: output.name,
      description: output.description,
      unitText: output.unit,
      interpretation: output.interpretation.map(interp => ({
        '@type': 'MedicalRiskEstimator',
        name: interp.range,
        riskFactor: interp.riskLevel,
        description: interp.recommendation
      }))
    })),
    ...(calculator.validationStudies && {
      citation: calculator.validationStudies.map(study => ({
        '@type': 'ScholarlyArticle',
        name: study.title,
        author: study.authors.map(author => ({
          '@type': 'Person',
          name: author
        })),
        ...(study.journal && { publisher: study.journal }),
        ...(study.year && { datePublished: study.year.toString() }),
        ...(study.doi && { doi: study.doi }),
        ...(study.url && { url: study.url })
      }))
    })
  };

  return JSON.parse(JSON.stringify(schema));
}

/**
 * 從計算器配置生成 SEO 數據
 */
export function generateCalculatorSEO(
  config: CalculatorConfig,
  url: string,
  locale: string = 'en'
): CalculatorSEO {
  const name = typeof config.name === 'string' ? config.name : config.name[locale] || config.name.en;
  const description = typeof config.description === 'string' ? config.description : config.description[locale] || config.description.en;

  return {
    type: 'MedicalCalculator',
    title: name,
    description: description,
    url: url,
    lastReviewed: new Date().toISOString().split('T')[0],
    reviewedBy: {
      type: 'Organization',
      name: 'Astro Clinical Platform',
      affiliation: 'Medical Technology Platform'
    },
    medicalAudience: 'Clinician',
    medicalSpecialty: [config.category || 'GeneralMedicine'],
    calculatorType: config.category || 'RiskAssessment',
    inputParameters: config.fields.map(field => ({
      name: typeof field.label === 'string' ? field.label : field.label[locale] || field.label.en,
      description: `Input parameter for ${name}`,
      unit: field.unit,
      valueType: field.type === 'number' ? 'number' : field.type === 'checkbox' ? 'boolean' : 'select',
      required: field.validation?.required || false,
      normalRange: field.validation ? {
        min: field.validation.min,
        max: field.validation.max
      } : undefined
    })),
    outputParameters: [{
      name: `${name} Score`,
      description: `Calculated result from ${name}`,
      unit: config.resultUnit || 'score',
      interpretation: config.interpretation?.map(interp => ({
        range: `${interp.range[0]}-${interp.range[1]}`,
        riskLevel: interp.risk,
        recommendation: typeof interp.recommendation === 'string' 
          ? interp.recommendation 
          : interp.recommendation[locale] || interp.recommendation.en,
        color: interp.color
      })) || []
    }],
    clinicalApplication: [
      'Clinical Decision Support',
      'Risk Assessment',
      'Patient Care'
    ],
    about: [{
      type: 'MedicalCondition',
      name: config.condition || name,
      description: description
    }],
    validationStudies: config.references?.map(ref => ({
      title: ref.title,
      authors: [ref.author || 'Clinical Research Team'],
      year: ref.year,
      url: ref.url
    }))
  };
}

/**
 * 生成醫療文章的 Schema.org JSON-LD
 */
export function generateMedicalArticleSchema(article: {
  title: string;
  description: string;
  url: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  category: string;
  tags: string[];
  medicalConditions?: string[];
  treatments?: string[];
  lastReviewed?: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalScholarlyArticle',
    headline: article.title,
    description: article.description,
    url: article.url,
    author: {
      '@type': 'Person',
      name: article.author
    },
    publisher: {
      '@type': 'Organization',
      name: 'Astro Clinical Platform',
      logo: {
        '@type': 'ImageObject',
        url: '/logo.png'
      }
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    audience: 'https://schema.org/Clinician',
    specialty: `https://schema.org/${article.category}`,
    about: [
      ...(article.medicalConditions?.map(condition => ({
        '@type': 'MedicalCondition',
        name: condition
      })) || []),
      ...(article.treatments?.map(treatment => ({
        '@type': 'TherapeuticProcedure',
        name: treatment
      })) || [])
    ],
    keywords: article.tags.join(', '),
    ...(article.lastReviewed && { lastReviewed: article.lastReviewed }),
    mainContentOfPage: ['Diagnosis', 'Treatment', 'Prevention'],
    isAccessibleForFree: true,
    license: 'https://creativecommons.org/licenses/by-nc-sa/4.0/'
  };
}

/**
 * 生成醫療指南的 Schema.org JSON-LD
 */
export function generateMedicalGuidelineSchema(guideline: {
  title: string;
  description: string;
  url: string;
  recommendations: Array<{
    text: string;
    strength: 'Strong' | 'Weak' | 'Conditional';
    evidenceLevel: 'A' | 'B' | 'C';
    conditions: string[];
    treatments: string[];
  }>;
  lastReviewed?: string;
  organization: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalGuideline',
    name: guideline.title,
    description: guideline.description,
    url: guideline.url,
    publisher: {
      '@type': 'Organization',
      name: guideline.organization
    },
    lastReviewed: guideline.lastReviewed,
    audience: 'https://schema.org/Clinician',
    guideline: guideline.recommendations.map(rec => ({
      '@type': 'MedicalGuidelineRecommendation',
      recommendationStrength: `${rec.strength} recommendation`,
      evidenceLevel: `https://schema.org/EvidenceLevel${rec.evidenceLevel}`,
      guidelineSubject: [
        ...rec.conditions.map(condition => ({
          '@type': 'MedicalCondition',
          name: condition
        })),
        ...rec.treatments.map(treatment => ({
          '@type': 'TherapeuticProcedure',
          name: treatment
        }))
      ],
      text: rec.text
    }))
  };
}

/**
 * 生成醫療網站的麵包屑導航 Schema.org JSON-LD
 */
export function generateMedicalBreadcrumbSchema(breadcrumbs: Array<{
  name: string;
  url: string;
}>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url
    }))
  };
}

/**
 * 生成醫療 FAQ 的 Schema.org JSON-LD
 */
export function generateMedicalFAQSchema(faqs: Array<{
  question: string;
  answer: string;
}>): object {
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
 * 生成醫療組織的 Schema.org JSON-LD
 */
export function generateMedicalOrganizationSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalOrganization',
    name: 'Astro Clinical Platform',
    description: 'Digital platform for medical professionals providing clinical decision-making tools and patient education',
    url: 'https://astro-clinical.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://astro-clinical.com/logo.png',
      width: 200,
      height: 60
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@your-domain.com'
    },
    sameAs: [
      'https://twitter.com/astroclinical',
      'https://linkedin.com/company/astro-clinical'
    ],
    medicalSpecialty: [
      'https://schema.org/Cardiology',
      'https://schema.org/Endocrinology',
      'https://schema.org/GeneralMedicine',
      'https://schema.org/InternalMedicine'
    ],
    serviceType: [
      'Clinical Decision Support',
      'Medical Education',
      'Risk Assessment Tools',
      'Medical Calculators'
    ]
  };
}

/**
 * 生成醫療軟體應用的 Schema.org JSON-LD
 */
export function generateMedicalSoftwareSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Astro Clinical Platform',
    description: 'Comprehensive medical platform with clinical calculators, decision trees, and patient education tools',
    url: 'https://astro-clinical.com',
    applicationCategory: 'MedicalApplication',
    operatingSystem: 'Web Browser',
    permissions: 'No personal data collection',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    author: {
      '@type': 'Organization',
      name: 'Astro Clinical Platform Team'
    },
    datePublished: '2024-01-01',
    softwareVersion: '1.0.0',
    applicationSubCategory: [
      'Clinical Decision Support',
      'Medical Calculator',
      'Patient Education',
      'Risk Assessment'
    ],
    featureList: [
      'Medical Calculators',
      'Clinical Decision Trees',
      'Patient Education Content',
      'Multi-language Support',
      'Mobile Responsive Design',
      'Privacy-First Analytics'
    ],
    screenshot: 'https://astro-clinical.com/screenshots/main.png'
  };
}

/**
 * 醫療內容的 Meta Tags 生成器
 */
export function generateMedicalMetaTags(content: MedicalContentSEO): Record<string, string> {
  const baseTags = {
    'title': content.title,
    'description': content.description,
    'robots': 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
    'author': content.reviewedBy?.name || 'Astro Clinical Platform',
    'viewport': 'width=device-width, initial-scale=1.0',
    'charset': 'UTF-8'
  };

  // Open Graph tags
  const ogTags = {
    'og:type': 'website',
    'og:title': content.title,
    'og:description': content.description,
    'og:url': content.url,
    'og:site_name': 'Astro Clinical Platform',
    'og:locale': 'en_US',
    'og:image': '/og-medical-default.jpg',
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:image:alt': `${content.title} - Medical Information`
  };

  // Twitter Card tags
  const twitterTags = {
    'twitter:card': 'summary_large_image',
    'twitter:site': '@astroclinical',
    'twitter:title': content.title,
    'twitter:description': content.description,
    'twitter:image': '/twitter-medical-default.jpg',
    'twitter:image:alt': `${content.title} - Medical Information`
  };

  // Medical-specific meta tags
  const medicalTags = {
    'medical:audience': content.medicalAudience || 'Clinician',
    'medical:specialty': content.medicalSpecialty?.join(', ') || 'General Medicine',
    'medical:last-reviewed': content.lastReviewed || new Date().toISOString().split('T')[0],
    'medical:content-type': content.type,
    'medical:evidence-level': content.evidenceLevel || 'EvidenceLevelB'
  };

  return {
    ...baseTags,
    ...ogTags,
    ...twitterTags,
    ...medicalTags
  };
}

/**
 * 生成醫療內容的 Canonical URL
 */
export function generateCanonicalUrl(baseUrl: string, path: string, locale?: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const localePrefix = locale && locale !== 'en' ? `/${locale}` : '';
  return `${baseUrl}${localePrefix}${cleanPath}`;
}

/**
 * 生成多語言 Hreflang 標籤
 */
export function generateHreflangTags(
  baseUrl: string, 
  path: string, 
  supportedLocales: string[]
): Array<{ hreflang: string; href: string }> {
  return supportedLocales.map(locale => ({
    hreflang: locale === 'en' ? 'x-default' : locale,
    href: generateCanonicalUrl(baseUrl, path, locale === 'en' ? undefined : locale)
  }));
}

/**
 * 醫療內容的結構化數據驗證
 */
export function validateMedicalSchema(schema: object): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 基本驗證
  if (!schema['@context']) {
    errors.push('Missing @context property');
  }

  if (!schema['@type']) {
    errors.push('Missing @type property');
  }

  if (!schema['name'] && !schema['headline']) {
    errors.push('Missing name or headline property');
  }

  if (!schema['description']) {
    warnings.push('Missing description property - recommended for better SEO');
  }

  if (!schema['url']) {
    warnings.push('Missing url property - recommended for better SEO');
  }

  // 醫療特定驗證
  if (schema['@type']?.toString().includes('Medical')) {
    if (!schema['audience']) {
      warnings.push('Missing audience property - recommended for medical content');
    }

    if (!schema['lastReviewed']) {
      warnings.push('Missing lastReviewed property - important for medical content credibility');
    }

    if (!schema['reviewedBy']) {
      warnings.push('Missing reviewedBy property - important for medical content authority');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// 預設的醫療專科對應
export const MEDICAL_SPECIALTIES = {
  'cardiology': 'Cardiovascular',
  'endocrinology': 'Endocrinology',
  'neurology': 'Neurology',
  'oncology': 'Oncology',
  'pediatrics': 'Pediatrics',
  'psychiatry': 'Psychiatry',
  'surgery': 'Surgery',
  'emergency': 'EmergencyMedicine',
  'family': 'FamilyMedicine',
  'internal': 'InternalMedicine',
  'general': 'GeneralMedicine'
} as const;

// 醫療編碼系統
export const MEDICAL_CODING_SYSTEMS = {
  'ICD-10': 'International Classification of Diseases, 10th Revision',
  'ICD-11': 'International Classification of Diseases, 11th Revision',
  'SNOMED-CT': 'Systematized Nomenclature of Medicine Clinical Terms',
  'MeSH': 'Medical Subject Headings',
  'CPT': 'Current Procedural Terminology',
  'LOINC': 'Logical Observation Identifiers Names and Codes'
} as const;