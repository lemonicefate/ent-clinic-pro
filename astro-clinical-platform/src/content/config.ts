/**
 * Astro Content Collections Configuration
 * 定義醫療平台的內容集合結構，與 Strapi CMS 保持一致
 */

import { defineCollection, z } from 'astro:content';
import type { MedicalCategory, RiskLevel, SupportedLocale } from '../env.d.ts';

// 共用的多語言字串 schema
const multiLangString = z.record(z.string());

// 醫療專科枚舉
const medicalCategorySchema = z.enum([
  'cardiology',
  'neurology', 
  'orthopedics',
  'general',
  'emergency',
  'pediatrics',
  'surgery',
  'endocrinology',
  'nephrology',
  'pulmonology'
]);

// 風險等級枚舉
const riskLevelSchema = z.enum(['low', 'moderate', 'high', 'critical']);

// 難度等級枚舉
const difficultySchema = z.enum(['basic', 'intermediate', 'advanced']);

// 證據等級枚舉
const evidenceLevelSchema = z.enum(['A', 'B', 'C', 'D']);

/**
 * 醫療計算機集合
 * 用於臨床決策工具的配置
 */
const calculators = defineCollection({
  type: 'data',
  schema: z.object({
    // 基本資訊
    id: z.string(),
    name: multiLangString,
    description: multiLangString,
    category: medicalCategorySchema,
    
    // 計算機配置
    fields: z.array(z.object({
      id: z.string(),
      type: z.enum(['select', 'number', 'checkbox', 'radio', 'range']),
      label: multiLangString,
      placeholder: multiLangString.optional(),
      helpText: multiLangString.optional(),
      options: z.array(z.object({
        value: z.union([z.string(), z.number()]),
        label: multiLangString,
        description: multiLangString.optional()
      })).optional(),
      validation: z.object({
        required: z.boolean().default(false),
        min: z.number().optional(),
        max: z.number().optional(),
        step: z.number().optional(),
        pattern: z.string().optional(),
        errorMessage: multiLangString.optional()
      }).optional(),
      conditional: z.object({
        field: z.string(),
        value: z.union([z.string(), z.number()]),
        operator: z.enum(['eq', 'ne', 'gt', 'lt', 'gte', 'lte']).default('eq')
      }).optional()
    })),
    
    // 計算邏輯
    calculationFunction: z.string(), // 預定義函數名稱
    validationRules: z.object({
      maxScore: z.number().optional(),
      minScore: z.number().optional(),
      requiredFields: z.array(z.string()).optional()
    }).optional(),
    
    // 結果解釋
    interpretation: z.array(z.object({
      range: z.tuple([z.number(), z.number()]),
      risk: riskLevelSchema,
      recommendation: multiLangString,
      color: z.string().optional(),
      icon: z.string().optional(),
      actionItems: z.array(multiLangString).optional()
    })),
    
    // 醫療資訊
    clinicalGuidelines: multiLangString.optional(),
    evidenceLevel: evidenceLevelSchema.optional(),
    references: z.array(z.object({
      title: z.string(),
      authors: z.array(z.string()).optional(),
      journal: z.string().optional(),
      year: z.number().optional(),
      url: z.string().optional(),
      doi: z.string().optional(),
      pmid: z.string().optional()
    })).optional(),
    
    // 分類和標籤
    tags: z.array(z.string()).default([]),
    medicalSpecialties: z.array(z.string()).default([]),
    difficulty: difficultySchema.default('basic'),
    
    // 狀態和統計
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    usageCount: z.number().default(0),
    lastUpdated: z.string().optional(),
    
    // SEO 和元資料
    seoTitle: multiLangString.optional(),
    seoDescription: multiLangString.optional(),
    keywords: z.array(z.string()).default([]),
    
    // 媒體資源
    icon: z.string().optional(),
    featuredImage: z.string().optional(),
    screenshots: z.array(z.string()).default([])
  })
});

/**
 * 教育內容集合
 * 用於病患衛教和醫療資訊
 */
const education = defineCollection({
  type: 'content',
  schema: z.object({
    // 基本資訊
    title: multiLangString,
    excerpt: multiLangString.optional(),
    category: z.enum([
      'disease',
      'medication', 
      'procedure',
      'prevention',
      'lifestyle',
      'symptoms',
      'diagnosis',
      'treatment'
    ]),
    
    // 內容分類
    tags: z.array(z.string()).default([]),
    medicalSpecialties: z.array(z.string()).default([]),
    difficulty: difficultySchema.default('basic'),
    
    // 目標受眾
    patientFriendly: z.boolean().default(true),
    professionalLevel: z.boolean().default(false),
    ageGroup: z.enum(['all', 'pediatric', 'adult', 'geriatric']).default('all'),
    
    // 內容資訊
    readingTime: z.number().optional(),
    wordCount: z.number().optional(),
    lastUpdated: z.string(),
    
    // 作者和審核
    author: multiLangString.optional(),
    reviewedBy: z.string().optional(),
    lastReviewDate: z.string().optional(),
    nextReviewDate: z.string().optional(),
    
    // 相關內容
    relatedCalculators: z.array(z.string()).default([]),
    relatedEducation: z.array(z.string()).default([]),
    relatedFlowcharts: z.array(z.string()).default([]),
    
    // 流程圖整合
    flowchartCode: z.string().optional(), // 內嵌 Mermaid 語法
    hasFlowchart: z.boolean().default(false),
    
    // 媒體資源
    featuredImage: z.object({
      src: z.string(),
      alt: multiLangString,
      caption: multiLangString.optional(),
      credit: z.string().optional()
    }).optional(),
    
    gallery: z.array(z.object({
      type: z.enum(['image', 'video', 'audio']),
      src: z.string(),
      alt: multiLangString.optional(),
      caption: multiLangString.optional(),
      thumbnail: z.string().optional()
    })).default([]),
    
    // 互動元素
    hasQuiz: z.boolean().default(false),
    hasChecklist: z.boolean().default(false),
    downloadableResources: z.array(z.object({
      title: multiLangString,
      description: multiLangString.optional(),
      url: z.string(),
      type: z.enum(['pdf', 'doc', 'image', 'video']),
      size: z.string().optional()
    })).default([]),
    
    // 醫療資訊
    clinicalRelevance: multiLangString.optional(),
    evidenceLevel: evidenceLevelSchema.optional(),
    references: z.array(z.object({
      title: z.string(),
      authors: z.array(z.string()).optional(),
      journal: z.string().optional(),
      year: z.number().optional(),
      url: z.string().optional(),
      doi: z.string().optional()
    })).default([]),
    
    // 免責聲明和警告
    medicalDisclaimer: multiLangString.optional(),
    warnings: z.array(multiLangString).default([]),
    contraindications: z.array(multiLangString).default([]),
    
    // 狀態和統計
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    viewCount: z.number().default(0),
    
    // SEO 和元資料
    seoTitle: multiLangString.optional(),
    seoDescription: multiLangString.optional(),
    keywords: z.array(z.string()).default([]),
    canonicalUrl: z.string().optional()
  })
});

/**
 * 醫療流程圖集合
 * 用於診斷和治療流程的視覺化
 */
const flowcharts = defineCollection({
  type: 'data',
  schema: z.object({
    // 基本資訊
    id: z.string(),
    title: multiLangString,
    slug: z.string(),
    description: multiLangString.optional(),
    
    // 流程圖內容
    mermaidCode: z.string(),
    complexity: z.enum(['simple', 'moderate', 'complex']).default('simple'),
    
    // 分類
    category: z.enum([
      'diagnostic',
      'treatment', 
      'emergency',
      'screening',
      'management',
      'prevention'
    ]),
    medicalSpecialties: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    
    // 無障礙支援
    accessibility: z.object({
      textAlternative: multiLangString,
      ariaLabel: multiLangString,
      keyboardNavigation: z.boolean().default(false),
      screenReaderInstructions: multiLangString.optional()
    }),
    
    // 臨床資訊
    clinicalContext: multiLangString.optional(),
    usageInstructions: multiLangString.optional(),
    evidenceLevel: evidenceLevelSchema.optional(),
    
    // 相關內容
    relatedCalculators: z.array(z.string()).default([]),
    relatedEducation: z.array(z.string()).default([]),
    
    // 參考資料
    references: z.array(z.object({
      title: z.string(),
      authors: z.array(z.string()).optional(),
      guideline: z.string().optional(),
      year: z.number().optional(),
      url: z.string().optional()
    })).default([]),
    
    // 版本控制
    version: z.string().default('1.0'),
    lastUpdated: z.string().optional(),
    changeLog: z.array(z.object({
      version: z.string(),
      date: z.string(),
      changes: z.array(z.string())
    })).default([]),
    
    // 狀態和統計
    isActive: z.boolean().default(true),
    usageCount: z.number().default(0),
    
    // 媒體資源
    thumbnail: z.string().optional(),
    previewImage: z.string().optional(),
    
    // SEO 和元資料
    seoTitle: multiLangString.optional(),
    seoDescription: multiLangString.optional(),
    keywords: z.array(z.string()).default([])
  })
});

/**
 * 醫療決策樹集合
 * 用於互動式臨床決策支援
 */
const decisionTrees = defineCollection({
  type: 'data',
  schema: z.object({
    // 基本資訊
    id: z.string(),
    title: multiLangString,
    slug: z.string(),
    description: multiLangString.optional(),
    
    // 決策樹結構
    nodes: z.array(z.object({
      id: z.string(),
      type: z.enum(['start', 'question', 'result', 'action']),
      position: z.object({
        x: z.number(),
        y: z.number()
      }),
      data: z.object({
        label: multiLangString,
        content: multiLangString.optional(),
        // 問題節點特有屬性
        question: multiLangString.optional(),
        options: z.array(z.object({
          id: z.string(),
          label: multiLangString,
          value: z.union([z.string(), z.number()]),
          nextNodeId: z.string().optional()
        })).optional(),
        // 結果節點特有屬性
        result: z.object({
          type: z.enum(['diagnosis', 'recommendation', 'referral', 'test']),
          severity: riskLevelSchema.optional(),
          recommendation: multiLangString.optional(),
          actions: z.array(multiLangString).optional(),
          followUp: multiLangString.optional()
        }).optional(),
        // 視覺樣式
        style: z.object({
          backgroundColor: z.string().optional(),
          borderColor: z.string().optional(),
          textColor: z.string().optional(),
          icon: z.string().optional()
        }).optional()
      })
    })),
    
    edges: z.array(z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      label: multiLangString.optional(),
      condition: z.object({
        field: z.string(),
        operator: z.enum(['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'contains']),
        value: z.union([z.string(), z.number()])
      }).optional(),
      style: z.object({
        strokeColor: z.string().optional(),
        strokeWidth: z.number().optional(),
        strokeDasharray: z.string().optional()
      }).optional()
    })),
    
    // 分類和標籤
    category: z.enum([
      'diagnostic',
      'treatment',
      'emergency',
      'screening',
      'triage',
      'management'
    ]),
    medicalSpecialties: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    difficulty: difficultySchema.default('basic'),
    
    // 臨床資訊
    clinicalContext: multiLangString.optional(),
    usageInstructions: multiLangString.optional(),
    evidenceLevel: evidenceLevelSchema.optional(),
    targetAudience: z.enum(['physician', 'nurse', 'student', 'patient']).default('physician'),
    
    // 無障礙支援
    accessibility: z.object({
      textAlternative: multiLangString,
      ariaLabel: multiLangString,
      keyboardNavigation: z.boolean().default(true),
      screenReaderInstructions: multiLangString.optional()
    }),
    
    // 相關內容
    relatedCalculators: z.array(z.string()).default([]),
    relatedEducation: z.array(z.string()).default([]),
    relatedFlowcharts: z.array(z.string()).default([]),
    
    // 參考資料
    references: z.array(z.object({
      title: z.string(),
      authors: z.array(z.string()).optional(),
      guideline: z.string().optional(),
      year: z.number().optional(),
      url: z.string().optional(),
      doi: z.string().optional()
    })).default([]),
    
    // 版本控制
    version: z.string().default('1.0'),
    lastUpdated: z.string().optional(),
    changeLog: z.array(z.object({
      version: z.string(),
      date: z.string(),
      changes: z.array(z.string())
    })).default([]),
    
    // 狀態和統計
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    usageCount: z.number().default(0),
    completionRate: z.number().default(0),
    averageTime: z.number().default(0), // 平均完成時間（秒）
    
    // 媒體資源
    thumbnail: z.string().optional(),
    previewImage: z.string().optional(),
    
    // SEO 和元資料
    seoTitle: multiLangString.optional(),
    seoDescription: multiLangString.optional(),
    keywords: z.array(z.string()).default([])
  })
});

/**
 * 醫療專科集合
 * 用於內容分類和導覽
 */
const medicalSpecialties = defineCollection({
  type: 'data',
  schema: z.object({
    // 基本資訊
    id: z.string(),
    name: multiLangString,
    slug: z.string(),
    description: multiLangString.optional(),
    
    // 視覺設計
    color: z.string().optional(),
    icon: z.string().optional(),
    coverImage: z.string().optional(),
    
    // 排序和狀態
    sortOrder: z.number().default(0),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    
    // 統計資訊
    calculatorCount: z.number().default(0),
    educationCount: z.number().default(0),
    flowchartCount: z.number().default(0),
    
    // SEO 和元資料
    seoTitle: multiLangString.optional(),
    seoDescription: multiLangString.optional(),
    keywords: z.array(z.string()).default([])
  })
});

/**
 * 匯出所有內容集合
 */
export const collections = {
  calculators,
  education,
  flowcharts,
  'decision-trees': decisionTrees,
  'medical-specialties': medicalSpecialties
};

// 匯出類型定義供其他模組使用
export type Calculator = z.infer<typeof calculators.schema>;
export type EducationContent = z.infer<typeof education.schema>;
export type Flowchart = z.infer<typeof flowcharts.schema>;
export type DecisionTree = z.infer<typeof decisionTrees.schema>;
export type MedicalSpecialty = z.infer<typeof medicalSpecialties.schema>;