/**
 * Astro Content Collections Configuration
 * 定義醫療平台的內容集合結構，與 Strapi CMS 保持一致
 * 
 * 更新日期：2025-01-30
 * 更新內容：新增 SOP 工作流程支援
 * - 新增文章狀態管理 (draft, in-review, needs-revision, quality-check, ready-to-publish, published)
 * - 新增審核流程和歷史記錄
 * - 新增品質檢查清單
 * - 新增專科特定的工作流程配置
 * - 新增 SOP 工作流程設定集合
 * - 新增版本控制和時間戳追蹤
 * 
 * 需求對應：
 * - 需求 1.1: 專科分類架構系統 ✓
 * - 需求 2.1: 標準化內容撰寫流程 ✓
 * - 需求 4.1: 內容品質控制系統 ✓
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

// SOP 工作流程相關枚舉
const articleStatusSchema = z.enum([
  'draft',           // 草稿
  'in-review',       // 審核中
  'needs-revision',  // 需要修改
  'quality-check',   // 品質檢查
  'ready-to-publish',// 準備發布
  'published'        // 已發布
]);

const reviewDecisionSchema = z.enum(['approved', 'rejected', 'needs-revision']);

const reviewerRoleSchema = z.enum([
  'specialist',      // 專科醫師
  'medical-editor',  // 醫學編輯
  'content-reviewer',// 內容審核員
  'senior-physician',// 資深醫師
  'department-head'  // 科室主任
]);

// 審核檢查清單 schema
const reviewChecklistSchema = z.object({
  medicalAccuracy: z.boolean().default(false),
  contentStructure: z.boolean().default(false),
  languageClarity: z.boolean().default(false),
  referencesValid: z.boolean().default(false),
  seoOptimized: z.boolean().default(false),
  accessibilityCompliant: z.boolean().default(false)
});

// 品質檢查 schema
const qualityChecksSchema = z.object({
  structureCheck: z.boolean().default(false),
  contentCheck: z.boolean().default(false),
  medicalAccuracyCheck: z.boolean().default(false),
  seoCheck: z.boolean().default(false),
  accessibilityCheck: z.boolean().default(false),
  referencesCheck: z.boolean().default(false),
  lastCheckedDate: z.string().optional(),
  checkedBy: z.string().optional()
});

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
 * 包含 SOP 工作流程支援
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

    // === SOP 工作流程欄位 ===
    // 文章狀態管理
    status: articleStatusSchema.default('draft'),

    // 版本控制
    version: z.string().default('1.0'),
    versionHistory: z.array(z.object({
      version: z.string(),
      date: z.string(),
      changes: z.array(z.string()),
      author: z.string(),
      status: z.string()
    })).default([]),

    // 審核流程
    reviewers: z.array(z.string()).default([]), // 指定審核者 ID
    reviewHistory: z.array(z.object({
      reviewer: z.string(),
      reviewDate: z.string(),
      decision: reviewDecisionSchema,
      comments: z.string().optional(),
      checklist: reviewChecklistSchema.optional()
    })).default([]),

    // 品質檢查
    qualityChecks: qualityChecksSchema.optional(),
    
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
    assignedWriter: z.string().optional(), // SOP: 指定撰寫者
    reviewedBy: z.string().optional(),
    lastReviewDate: z.string().optional(),
    nextReviewDate: z.string().optional(),
    
    // SOP 工作流程時間戳
    workflowTimestamps: z.object({
      createdAt: z.string().optional(),
      submittedForReview: z.string().optional(),
      reviewStarted: z.string().optional(),
      reviewCompleted: z.string().optional(),
      qualityCheckStarted: z.string().optional(),
      qualityCheckCompleted: z.string().optional(),
      publishedAt: z.string().optional(),
      lastModified: z.string().optional()
    }).optional(),

    // SOP 通知設定
    notifications: z.object({
      emailNotifications: z.boolean().default(true),
      slackNotifications: z.boolean().default(false),
      reviewReminders: z.boolean().default(true),
      deadlineAlerts: z.boolean().default(true)
    }).optional(),
    
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
 * 包含 SOP 工作流程配置
 */
const medicalSpecialties = defineCollection({
  type: 'data',
  schema: z.object({
    // 基本資訊
    id: z.string(),
    name: multiLangString,
    slug: z.string(),
    description: multiLangString.optional(),
    
    // === SOP 工作流程配置 ===
    workflowConfig: z.object({
      // 審核者角色配置
      reviewerRoles: z.array(reviewerRoleSchema).default(['specialist', 'medical-editor']),
      
      // 必要審核數量
      requiredApprovals: z.number().min(1).max(5).default(2),
      
      // 審核時限（天數）
      reviewTimeLimit: z.number().default(7),
      
      // 專科特定要求
      specialRequirements: z.array(z.enum([
        'evidence-level-check',    // 證據等級檢查
        'guideline-compliance',    // 指引符合性
        'peer-review',            // 同儕審查
        'statistical-review',     // 統計審查
        'ethics-review'           // 倫理審查
      ])).default([]),
      
      // 自動分配規則
      autoAssignmentRules: z.object({
        enabled: z.boolean().default(true),
        balanceWorkload: z.boolean().default(true), // 平衡工作量
        avoidConflicts: z.boolean().default(true),  // 避免利益衝突
        preferExpertise: z.boolean().default(true)  // 優先專業領域
      }).optional()
    }).optional(),

    // 內容模板配置
    contentTemplate: z.object({
      // 必要章節
      requiredSections: z.array(z.object({
        section: z.string(),
        description: multiLangString.optional(),
        order: z.number().optional()
      })).default([]),
      
      // 自定義欄位
      customFields: z.array(z.object({
        name: z.string(),
        type: z.enum(['text', 'number', 'select', 'multiselect', 'boolean', 'date']),
        label: multiLangString,
        required: z.boolean().default(false),
        options: z.array(z.object({
          value: z.string(),
          label: multiLangString
        })).optional(),
        validation: z.object({
          min: z.number().optional(),
          max: z.number().optional(),
          pattern: z.string().optional(),
          errorMessage: multiLangString.optional()
        }).optional()
      })).default([]),
      
      // 預設標籤
      defaultTags: z.array(z.string()).default([]),
      
      // 建議關鍵字
      suggestedKeywords: z.array(z.string()).default([])
    }).optional(),
    
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
    
    // SOP 統計
    sopStats: z.object({
      totalArticles: z.number().default(0),
      publishedArticles: z.number().default(0),
      inReviewArticles: z.number().default(0),
      averageReviewTime: z.number().default(0), // 平均審核時間（天）
      approvalRate: z.number().default(0)       // 通過率
    }).optional(),
    
    // SEO 和元資料
    seoTitle: multiLangString.optional(),
    seoDescription: multiLangString.optional(),
    keywords: z.array(z.string()).default([])
  })
});

/**
 * SOP 工作流程設定集合
 * 用於管理發布流程的全域設定
 */
const sopWorkflowSettings = defineCollection({
  type: 'data',
  schema: z.object({
    // 基本設定
    id: z.string(),
    name: multiLangString,
    description: multiLangString.optional(),
    
    // 狀態轉換規則
    statusTransitions: z.array(z.object({
      from: articleStatusSchema,
      to: articleStatusSchema,
      requiredRole: z.array(z.string()).optional(),
      conditions: z.array(z.object({
        field: z.string(),
        operator: z.enum(['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'contains']),
        value: z.union([z.string(), z.number(), z.boolean()])
      })).optional(),
      autoTrigger: z.boolean().default(false)
    })).default([]),
    
    // 通知模板
    notificationTemplates: z.object({
      reviewAssigned: z.object({
        subject: multiLangString,
        body: multiLangString,
        channels: z.array(z.enum(['email', 'slack', 'teams'])).default(['email'])
      }).optional(),
      reviewCompleted: z.object({
        subject: multiLangString,
        body: multiLangString,
        channels: z.array(z.enum(['email', 'slack', 'teams'])).default(['email'])
      }).optional(),
      revisionRequired: z.object({
        subject: multiLangString,
        body: multiLangString,
        channels: z.array(z.enum(['email', 'slack', 'teams'])).default(['email'])
      }).optional(),
      published: z.object({
        subject: multiLangString,
        body: multiLangString,
        channels: z.array(z.enum(['email', 'slack', 'teams'])).default(['email'])
      }).optional()
    }).optional(),
    
    // 品質檢查清單模板
    qualityCheckTemplates: z.array(z.object({
      name: z.string(),
      category: z.string().optional(),
      checks: z.array(z.object({
        id: z.string(),
        name: multiLangString,
        description: multiLangString.optional(),
        required: z.boolean().default(false),
        automated: z.boolean().default(false),
        weight: z.number().default(1) // 權重
      }))
    })).default([]),
    
    // 自動化規則
    automationRules: z.array(z.object({
      name: z.string(),
      trigger: z.enum(['status_change', 'time_based', 'field_update', 'manual']),
      conditions: z.array(z.object({
        field: z.string(),
        operator: z.enum(['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'contains']),
        value: z.union([z.string(), z.number(), z.boolean()])
      })),
      actions: z.array(z.object({
        type: z.enum(['send_notification', 'assign_reviewer', 'update_status', 'create_task']),
        parameters: z.record(z.any())
      })),
      enabled: z.boolean().default(true)
    })).default([]),
    
    // 報告設定
    reportingConfig: z.object({
      dashboardMetrics: z.array(z.enum([
        'articles_by_status',
        'review_times',
        'approval_rates',
        'quality_scores',
        'productivity_metrics'
      ])).default([]),
      scheduledReports: z.array(z.object({
        name: z.string(),
        frequency: z.enum(['daily', 'weekly', 'monthly']),
        recipients: z.array(z.string()),
        metrics: z.array(z.string())
      })).default([])
    }).optional(),
    
    // 系統設定
    systemSettings: z.object({
      defaultReviewTimeLimit: z.number().default(7),
      maxConcurrentReviews: z.number().default(5),
      autoArchiveAfterDays: z.number().default(365),
      enableVersionControl: z.boolean().default(true),
      enableAuditLog: z.boolean().default(true)
    }).optional(),
    
    // 狀態和元資料
    isActive: z.boolean().default(true),
    version: z.string().default('1.0'),
    lastUpdated: z.string().optional(),
    createdBy: z.string().optional()
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
  'medical-specialties': medicalSpecialties,
  'sop-workflow-settings': sopWorkflowSettings
};

// 匯出類型定義供其他模組使用
export type Calculator = z.infer<typeof calculators.schema>;
export type EducationContent = z.infer<typeof education.schema>;
export type Flowchart = z.infer<typeof flowcharts.schema>;
export type DecisionTree = z.infer<typeof decisionTrees.schema>;
export type MedicalSpecialty = z.infer<typeof medicalSpecialties.schema>;
export type SOPWorkflowSettings = z.infer<typeof sopWorkflowSettings.schema>;

// SOP 工作流程相關類型
export type ArticleStatus = 'draft' | 'in-review' | 'needs-revision' | 'quality-check' | 'ready-to-publish' | 'published';
export type ReviewDecision = 'approved' | 'rejected' | 'needs-revision';
export type ReviewerRole = 'specialist' | 'medical-editor' | 'content-reviewer' | 'senior-physician' | 'department-head';

// 審核歷史類型
export type ReviewHistoryEntry = {
  reviewer: string;
  reviewDate: string;
  decision: ReviewDecision;
  comments?: string;
  checklist?: {
    medicalAccuracy: boolean;
    contentStructure: boolean;
    languageClarity: boolean;
    referencesValid: boolean;
    seoOptimized: boolean;
    accessibilityCompliant: boolean;
  };
};

// 品質檢查類型
export type QualityChecks = {
  structureCheck: boolean;
  contentCheck: boolean;
  medicalAccuracyCheck: boolean;
  seoCheck: boolean;
  accessibilityCheck: boolean;
  referencesCheck: boolean;
  lastCheckedDate?: string;
  checkedBy?: string;
};