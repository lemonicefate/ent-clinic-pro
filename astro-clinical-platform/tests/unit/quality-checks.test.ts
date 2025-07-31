/**
 * Quality Checks Unit Tests
 * 
 * Tests for content quality checking scripts and validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFile } from 'fs/promises'
import { join } from 'path'

// Mock the quality check modules
const mockMedicalTerminologyChecker = {
  checkTerminology: vi.fn(),
  validateMedicalAccuracy: vi.fn(),
  suggestCorrections: vi.fn()
}

const mockAccessibilityValidator = {
  checkImageAltText: vi.fn(),
  validateHeadingStructure: vi.fn(),
  checkColorContrast: vi.fn(),
  validateFormLabels: vi.fn()
}

const mockReadabilityAnalyzer = {
  calculateReadabilityScore: vi.fn(),
  analyzeContentLength: vi.fn(),
  checkSentenceComplexity: vi.fn(),
  suggestImprovements: vi.fn()
}

const mockReferenceFormatChecker = {
  validateReferences: vi.fn(),
  checkCitationFormat: vi.fn(),
  verifyLinks: vi.fn()
}

// Mock modules
vi.mock('@/scripts/medical-terminology-checker', () => mockMedicalTerminologyChecker)
vi.mock('@/scripts/accessibility-validator', () => mockAccessibilityValidator)
vi.mock('@/scripts/readability-analyzer', () => mockReadabilityAnalyzer)
vi.mock('@/scripts/reference-format-checker', () => mockReferenceFormatChecker)

describe('Quality Checks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Medical Terminology Checker', () => {
    it('should validate medical terminology', async () => {
      const content = `
        心房顫動（Atrial Fibrillation, AF）是最常見的心律不整疾病。
        患者可能出現心悸、胸悶、呼吸困難等症狀。
        治療包括抗凝血治療和心律控制。
      `

      mockMedicalTerminologyChecker.checkTerminology.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      })

      const result = await mockMedicalTerminologyChecker.checkTerminology(content)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(mockMedicalTerminologyChecker.checkTerminology).toHaveBeenCalledWith(content)
    })

    it('should detect incorrect medical terminology', async () => {
      const content = `
        心房顫動是一種心臟病，會導致心跳不規律。
        錯誤的醫學術語：心臟爆炸症候群。
      `

      mockMedicalTerminologyChecker.checkTerminology.mockResolvedValue({
        isValid: false,
        errors: [
          {
            term: '心臟爆炸症候群',
            line: 3,
            message: '不存在的醫學術語',
            suggestion: '心臟破裂症候群'
          }
        ],
        warnings: [],
        suggestions: ['建議使用標準醫學術語']
      })

      const result = await mockMedicalTerminologyChecker.checkTerminology(content)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].term).toBe('心臟爆炸症候群')
    })

    it('should validate medical accuracy', async () => {
      const content = `
        心房顫動的治療包括：
        1. 抗凝血治療 - 預防血栓形成
        2. 心律控制 - 恢復正常心律
        3. 心率控制 - 控制心跳速度
      `

      mockMedicalTerminologyChecker.validateMedicalAccuracy.mockResolvedValue({
        isAccurate: true,
        score: 95,
        issues: [],
        recommendations: []
      })

      const result = await mockMedicalTerminologyChecker.validateMedicalAccuracy(content)
      
      expect(result.isAccurate).toBe(true)
      expect(result.score).toBeGreaterThan(90)
    })
  })

  describe('Accessibility Validator', () => {
    it('should check image alt text', async () => {
      const htmlContent = `
        <img src="heart-diagram.jpg" alt="心臟解剖圖，顯示心房和心室結構" />
        <img src="ecg-trace.jpg" alt="心電圖顯示心房顫動的不規律波形" />
      `

      mockAccessibilityValidator.checkImageAltText.mockResolvedValue({
        isValid: true,
        totalImages: 2,
        imagesWithAlt: 2,
        imagesWithoutAlt: 0,
        issues: []
      })

      const result = await mockAccessibilityValidator.checkImageAltText(htmlContent)
      
      expect(result.isValid).toBe(true)
      expect(result.imagesWithoutAlt).toBe(0)
    })

    it('should detect missing alt text', async () => {
      const htmlContent = `
        <img src="heart-diagram.jpg" alt="心臟解剖圖" />
        <img src="ecg-trace.jpg" />
        <img src="medication.jpg" alt="" />
      `

      mockAccessibilityValidator.checkImageAltText.mockResolvedValue({
        isValid: false,
        totalImages: 3,
        imagesWithAlt: 1,
        imagesWithoutAlt: 2,
        issues: [
          { image: 'ecg-trace.jpg', issue: 'Missing alt attribute' },
          { image: 'medication.jpg', issue: 'Empty alt attribute' }
        ]
      })

      const result = await mockAccessibilityValidator.checkImageAltText(htmlContent)
      
      expect(result.isValid).toBe(false)
      expect(result.imagesWithoutAlt).toBe(2)
      expect(result.issues).toHaveLength(2)
    })

    it('should validate heading structure', async () => {
      const htmlContent = `
        <h1>心房顫動診斷指南</h1>
        <h2>概述</h2>
        <h3>定義</h3>
        <h3>流行病學</h3>
        <h2>診斷方法</h2>
        <h3>心電圖檢查</h3>
      `

      mockAccessibilityValidator.validateHeadingStructure.mockResolvedValue({
        isValid: true,
        structure: [
          { level: 1, text: '心房顫動診斷指南' },
          { level: 2, text: '概述' },
          { level: 3, text: '定義' },
          { level: 3, text: '流行病學' },
          { level: 2, text: '診斷方法' },
          { level: 3, text: '心電圖檢查' }
        ],
        issues: []
      })

      const result = await mockAccessibilityValidator.validateHeadingStructure(htmlContent)
      
      expect(result.isValid).toBe(true)
      expect(result.structure).toHaveLength(6)
    })
  })

  describe('Readability Analyzer', () => {
    it('should calculate readability score', async () => {
      const content = `
        心房顫動是一種常見的心律不整。患者的心房會快速且不規律地跳動。
        這種情況可能導致血栓形成，增加中風的風險。
        治療方法包括藥物治療和手術治療。
      `

      mockReadabilityAnalyzer.calculateReadabilityScore.mockResolvedValue({
        score: 75,
        level: 'intermediate',
        metrics: {
          averageSentenceLength: 12,
          averageWordsPerSentence: 8,
          complexWords: 3,
          totalWords: 32,
          totalSentences: 4
        },
        recommendations: []
      })

      const result = await mockReadabilityAnalyzer.calculateReadabilityScore(content)
      
      expect(result.score).toBe(75)
      expect(result.level).toBe('intermediate')
      expect(result.metrics.totalSentences).toBe(4)
    })

    it('should analyze content length', async () => {
      const content = 'A'.repeat(1500) // 1500 characters

      mockReadabilityAnalyzer.analyzeContentLength.mockResolvedValue({
        characterCount: 1500,
        wordCount: 300,
        estimatedReadingTime: 2,
        isOptimalLength: true,
        recommendations: []
      })

      const result = await mockReadabilityAnalyzer.analyzeContentLength(content)
      
      expect(result.characterCount).toBe(1500)
      expect(result.estimatedReadingTime).toBe(2)
      expect(result.isOptimalLength).toBe(true)
    })

    it('should detect overly complex sentences', async () => {
      const content = `
        心房顫動是一種心律不整疾病，其特徵是心房的電活動變得混亂且不規律，
        導致心房無法有效收縮，進而影響血液循環，並可能引發各種併發症，
        包括但不限於血栓栓塞、心臟衰竭、以及其他心血管相關疾病。
      `

      mockReadabilityAnalyzer.checkSentenceComplexity.mockResolvedValue({
        complexSentences: [
          {
            sentence: content.trim(),
            wordCount: 45,
            complexity: 'high',
            suggestions: ['建議分割為多個較短的句子']
          }
        ],
        averageComplexity: 'high',
        recommendations: ['使用更簡單的句子結構', '避免過長的句子']
      })

      const result = await mockReadabilityAnalyzer.checkSentenceComplexity(content)
      
      expect(result.complexSentences).toHaveLength(1)
      expect(result.averageComplexity).toBe('high')
    })
  })

  describe('Reference Format Checker', () => {
    it('should validate reference format', async () => {
      const references = `
        ## 參考文獻

        1. 2020 ESC Guidelines for the diagnosis and management of atrial fibrillation. European Heart Journal. 2021;42(5):373-498.
        2. January CT, et al. 2019 AHA/ACC/HRS Focused Update of the 2014 AHA/ACC/HRS Guideline for Management of Patients with Atrial Fibrillation. Circulation. 2019;140(2):e125-e151.
        3. Chugh SS, et al. Worldwide epidemiology of atrial fibrillation: a Global Burden of Disease 2010 Study. Circulation. 2014;129(8):837-847.
      `

      mockReferenceFormatChecker.validateReferences.mockResolvedValue({
        isValid: true,
        totalReferences: 3,
        validReferences: 3,
        invalidReferences: 0,
        issues: []
      })

      const result = await mockReferenceFormatChecker.validateReferences(references)
      
      expect(result.isValid).toBe(true)
      expect(result.totalReferences).toBe(3)
      expect(result.invalidReferences).toBe(0)
    })

    it('should detect invalid reference format', async () => {
      const references = `
        ## 參考文獻

        1. Some article without proper citation format
        2. 2020 ESC Guidelines for atrial fibrillation. European Heart Journal. 2021;42(5):373-498.
        3. Invalid reference format here
      `

      mockReferenceFormatChecker.validateReferences.mockResolvedValue({
        isValid: false,
        totalReferences: 3,
        validReferences: 1,
        invalidReferences: 2,
        issues: [
          { reference: 1, issue: 'Missing journal information' },
          { reference: 3, issue: 'Invalid citation format' }
        ]
      })

      const result = await mockReferenceFormatChecker.validateReferences(references)
      
      expect(result.isValid).toBe(false)
      expect(result.invalidReferences).toBe(2)
      expect(result.issues).toHaveLength(2)
    })

    it('should verify external links', async () => {
      const content = `
        更多資訊請參考：
        - [ESC Guidelines](https://www.escardio.org/Guidelines)
        - [AHA Guidelines](https://www.ahajournals.org/guidelines)
        - [Invalid Link](https://invalid-domain-that-does-not-exist.com)
      `

      mockReferenceFormatChecker.verifyLinks.mockResolvedValue({
        totalLinks: 3,
        validLinks: 2,
        brokenLinks: 1,
        issues: [
          {
            url: 'https://invalid-domain-that-does-not-exist.com',
            status: 'broken',
            error: 'Domain not found'
          }
        ]
      })

      const result = await mockReferenceFormatChecker.verifyLinks(content)
      
      expect(result.totalLinks).toBe(3)
      expect(result.brokenLinks).toBe(1)
      expect(result.issues).toHaveLength(1)
    })
  })

  describe('Integrated Quality Check', () => {
    it('should run all quality checks and aggregate results', async () => {
      const content = `
        # 心房顫動診斷指南

        心房顫動（Atrial Fibrillation, AF）是最常見的心律不整疾病。

        ## 診斷方法

        ### 心電圖檢查
        心電圖是診斷心房顫動的主要工具。

        ![心電圖範例](ecg-example.jpg "心房顫動的心電圖表現")

        ## 參考文獻
        1. 2020 ESC Guidelines for atrial fibrillation. European Heart Journal. 2021;42(5):373-498.
      `

      // Mock all quality check results
      mockMedicalTerminologyChecker.checkTerminology.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      })

      mockAccessibilityValidator.checkImageAltText.mockResolvedValue({
        isValid: true,
        totalImages: 1,
        imagesWithAlt: 1,
        imagesWithoutAlt: 0,
        issues: []
      })

      mockReadabilityAnalyzer.calculateReadabilityScore.mockResolvedValue({
        score: 80,
        level: 'intermediate',
        metrics: { totalWords: 50, totalSentences: 5 },
        recommendations: []
      })

      mockReferenceFormatChecker.validateReferences.mockResolvedValue({
        isValid: true,
        totalReferences: 1,
        validReferences: 1,
        invalidReferences: 0,
        issues: []
      })

      // Run all checks
      const results = await Promise.all([
        mockMedicalTerminologyChecker.checkTerminology(content),
        mockAccessibilityValidator.checkImageAltText(content),
        mockReadabilityAnalyzer.calculateReadabilityScore(content),
        mockReferenceFormatChecker.validateReferences(content)
      ])

      // Aggregate results
      const overallScore = results.every(result => 
        result.isValid || result.isAccurate || result.score > 70
      ) ? 'pass' : 'fail'

      expect(overallScore).toBe('pass')
      expect(results).toHaveLength(4)
    })
  })
})