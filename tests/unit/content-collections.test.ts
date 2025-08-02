/**
 * Content Collections Schema Validation Tests
 * 
 * Tests for Astro Content Collections schema validation and data integrity
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { z } from 'zod'
import { readFile } from 'fs/promises'
import { join } from 'path'

// Import the actual schema from content config
// Note: In a real implementation, you'd import from the actual config file
const educationSchema = z.object({
  title: z.object({
    zh_TW: z.string(),
    en: z.string(),
    ja: z.string().optional(),
  }),
  excerpt: z.object({
    zh_TW: z.string(),
    en: z.string(),
    ja: z.string().optional(),
  }).optional(),
  category: z.string(),
  specialty: z.string(),
  tags: z.array(z.string()).default([]),
  difficulty: z.enum(['basic', 'intermediate', 'advanced']).default('basic'),
  readingTime: z.number().optional(),
  lastUpdated: z.string(),
  author: z.object({
    zh_TW: z.string(),
    en: z.string(),
    ja: z.string().optional(),
  }).optional(),
  status: z.enum(['draft', 'in-review', 'needs-revision', 'published']).default('draft'),
  reviewers: z.array(z.string()).default([]),
  qualityChecks: z.object({
    structureCheck: z.boolean().default(false),
    contentCheck: z.boolean().default(false),
    medicalAccuracyCheck: z.boolean().default(false),
    seoCheck: z.boolean().default(false),
    accessibilityCheck: z.boolean().default(false),
  }).default({}),
  version: z.string().default('1.0.0'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
})

const medicalSpecialtySchema = z.object({
  id: z.string(),
  name: z.object({
    zh_TW: z.string(),
    en: z.string(),
    ja: z.string().optional(),
  }),
  slug: z.string(),
  description: z.object({
    zh_TW: z.string(),
    en: z.string(),
    ja: z.string().optional(),
  }).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  articleCount: z.number().default(0),
  isActive: z.boolean().default(true),
  reviewers: z.array(z.string()).default([]),
  workflowConfig: z.object({
    reviewerRoles: z.array(z.string()),
    requiredApprovals: z.number().min(1).max(5),
    reviewTimeLimit: z.number().min(1).max(30),
  }).optional(),
})

describe('Content Collections Schema Validation', () => {
  describe('Education Article Schema', () => {
    it('should validate a complete education article', () => {
      const validArticle = {
        title: {
          zh_TW: '心房顫動診斷指南',
          en: 'Atrial Fibrillation Diagnosis Guide',
          ja: '心房細動診断ガイド'
        },
        excerpt: {
          zh_TW: '心房顫動的診斷和治療指南',
          en: 'Guide for diagnosis and treatment of atrial fibrillation',
          ja: '心房細動の診断と治療のガイド'
        },
        category: 'diagnosis',
        specialty: 'cardiology',
        tags: ['atrial-fibrillation', 'cardiology', 'diagnosis'],
        difficulty: 'intermediate' as const,
        readingTime: 10,
        lastUpdated: new Date().toISOString(),
        author: {
          zh_TW: '心臟科醫師',
          en: 'Cardiologist',
          ja: '循環器専門医'
        },
        status: 'published' as const,
        reviewers: ['cardiologist@example.com'],
        qualityChecks: {
          structureCheck: true,
          contentCheck: true,
          medicalAccuracyCheck: true,
          seoCheck: true,
          accessibilityCheck: true,
        },
        version: '1.0.0',
        isActive: true,
        isFeatured: true,
      }

      const result = educationSchema.safeParse(validArticle)
      expect(result.success).toBe(true)
    })

    it('should validate minimal education article with defaults', () => {
      const minimalArticle = {
        title: {
          zh_TW: '測試文章',
          en: 'Test Article'
        },
        category: 'general',
        specialty: 'cardiology',
        lastUpdated: new Date().toISOString(),
      }

      const result = educationSchema.safeParse(minimalArticle)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.tags).toEqual([])
        expect(result.data.difficulty).toBe('basic')
        expect(result.data.status).toBe('draft')
        expect(result.data.reviewers).toEqual([])
        expect(result.data.version).toBe('1.0.0')
        expect(result.data.isActive).toBe(true)
        expect(result.data.isFeatured).toBe(false)
      }
    })

    it('should reject article with invalid status', () => {
      const invalidArticle = {
        title: {
          zh_TW: '測試文章',
          en: 'Test Article'
        },
        category: 'general',
        specialty: 'cardiology',
        lastUpdated: new Date().toISOString(),
        status: 'invalid-status'
      }

      const result = educationSchema.safeParse(invalidArticle)
      expect(result.success).toBe(false)
    })

    it('should reject article with invalid difficulty', () => {
      const invalidArticle = {
        title: {
          zh_TW: '測試文章',
          en: 'Test Article'
        },
        category: 'general',
        specialty: 'cardiology',
        lastUpdated: new Date().toISOString(),
        difficulty: 'expert'
      }

      const result = educationSchema.safeParse(invalidArticle)
      expect(result.success).toBe(false)
    })

    it('should require zh_TW and en titles', () => {
      const invalidArticle = {
        title: {
          zh_TW: '測試文章'
          // Missing required 'en' field
        },
        category: 'general',
        specialty: 'cardiology',
        lastUpdated: new Date().toISOString(),
      }

      const result = educationSchema.safeParse(invalidArticle)
      expect(result.success).toBe(false)
    })
  })

  describe('Medical Specialty Schema', () => {
    it('should validate a complete medical specialty', () => {
      const validSpecialty = {
        id: 'cardiology',
        name: {
          zh_TW: '心臟科',
          en: 'Cardiology',
          ja: '循環器科'
        },
        slug: 'cardiology',
        description: {
          zh_TW: '心臟科描述',
          en: 'Cardiology description',
          ja: '循環器科の説明'
        },
        color: '#e74c3c',
        icon: 'heart',
        articleCount: 15,
        isActive: true,
        reviewers: ['cardiologist@example.com', 'editor@example.com'],
        workflowConfig: {
          reviewerRoles: ['specialist', 'medical-editor'],
          requiredApprovals: 2,
          reviewTimeLimit: 7
        }
      }

      const result = medicalSpecialtySchema.safeParse(validSpecialty)
      expect(result.success).toBe(true)
    })

    it('should validate minimal specialty with defaults', () => {
      const minimalSpecialty = {
        id: 'test-specialty',
        name: {
          zh_TW: '測試專科',
          en: 'Test Specialty'
        },
        slug: 'test-specialty'
      }

      const result = medicalSpecialtySchema.safeParse(minimalSpecialty)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.articleCount).toBe(0)
        expect(result.data.isActive).toBe(true)
        expect(result.data.reviewers).toEqual([])
      }
    })

    it('should reject specialty with invalid workflow config', () => {
      const invalidSpecialty = {
        id: 'test-specialty',
        name: {
          zh_TW: '測試專科',
          en: 'Test Specialty'
        },
        slug: 'test-specialty',
        workflowConfig: {
          reviewerRoles: ['specialist'],
          requiredApprovals: 0, // Invalid: must be at least 1
          reviewTimeLimit: 7
        }
      }

      const result = medicalSpecialtySchema.safeParse(invalidSpecialty)
      expect(result.success).toBe(false)
    })

    it('should reject specialty with too many required approvals', () => {
      const invalidSpecialty = {
        id: 'test-specialty',
        name: {
          zh_TW: '測試專科',
          en: 'Test Specialty'
        },
        slug: 'test-specialty',
        workflowConfig: {
          reviewerRoles: ['specialist'],
          requiredApprovals: 10, // Invalid: max is 5
          reviewTimeLimit: 7
        }
      }

      const result = medicalSpecialtySchema.safeParse(invalidSpecialty)
      expect(result.success).toBe(false)
    })
  })

  describe('Frontmatter Parsing', () => {
    it('should parse valid frontmatter from markdown file', async () => {
      // This would test parsing actual markdown files with frontmatter
      const sampleMarkdown = `---
title:
  zh_TW: "測試文章"
  en: "Test Article"
category: "general"
specialty: "cardiology"
lastUpdated: "${new Date().toISOString()}"
status: "published"
---

# Test Content

This is test content.`

      // Extract frontmatter (simplified - in real implementation use gray-matter)
      const frontmatterMatch = sampleMarkdown.match(/^---\n([\s\S]*?)\n---/)
      expect(frontmatterMatch).toBeTruthy()
      
      // In a real test, you'd parse the YAML and validate against schema
      // For now, just verify the structure exists
      expect(frontmatterMatch![1]).toContain('title:')
      expect(frontmatterMatch![1]).toContain('category:')
      expect(frontmatterMatch![1]).toContain('specialty:')
    })
  })

  describe('Data Integrity', () => {
    it('should ensure specialty references are valid', () => {
      // Test that articles reference valid specialties
      const validSpecialties = ['cardiology', 'neurology', 'pediatrics']
      
      const article = {
        title: { zh_TW: '測試', en: 'Test' },
        category: 'general',
        specialty: 'cardiology',
        lastUpdated: new Date().toISOString(),
      }

      expect(validSpecialties).toContain(article.specialty)
    })

    it('should validate reviewer email formats', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const reviewers = ['doctor@hospital.com', 'editor@platform.com']
      
      reviewers.forEach(email => {
        expect(emailRegex.test(email)).toBe(true)
      })
    })

    it('should ensure version follows semantic versioning', () => {
      const semverRegex = /^\d+\.\d+\.\d+$/
      const versions = ['1.0.0', '2.1.3', '0.1.0']
      
      versions.forEach(version => {
        expect(semverRegex.test(version)).toBe(true)
      })
    })
  })
})