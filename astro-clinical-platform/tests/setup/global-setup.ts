/**
 * Global Test Setup
 * 
 * This file runs once before all tests and sets up the global test environment
 */

import { mkdir, writeFile, rm } from 'fs/promises'
import { join } from 'path'
import type { GlobalSetupContext } from 'vitest/node'

export default async function globalSetup({ provide }: GlobalSetupContext) {
  console.log('🚀 Setting up global test environment...')
  
  // Create test directories
  const testDirs = [
    'tests/fixtures',
    'tests/temp',
    'coverage',
    'test-results'
  ]
  
  for (const dir of testDirs) {
    await mkdir(dir, { recursive: true })
  }
  
  // Create test fixtures
  await createTestFixtures()
  
  // Set up test database/storage
  await setupTestStorage()
  
  // Provide global test configuration
  provide('testConfig', {
    baseUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:3000/api',
    testDataPath: join(process.cwd(), 'tests/fixtures'),
    tempPath: join(process.cwd(), 'tests/temp')
  })
  
  console.log('✅ Global test environment ready')
  
  // Cleanup function
  return async () => {
    console.log('🧹 Cleaning up global test environment...')
    
    // Clean up temporary files
    try {
      await rm('tests/temp', { recursive: true, force: true })
    } catch (error) {
      console.warn('Warning: Could not clean temp directory:', error)
    }
    
    console.log('✅ Global cleanup complete')
  }
}

async function createTestFixtures() {
  const fixturesPath = 'tests/fixtures'
  
  // Create sample content collections data
  const sampleEducationArticle = {
    title: {
      zh_TW: '測試衛教文章',
      en: 'Test Education Article',
      ja: 'テスト教育記事'
    },
    excerpt: {
      zh_TW: '這是一篇測試用的衛教文章摘要',
      en: 'This is a test education article excerpt',
      ja: 'これはテスト教育記事の抜粋です'
    },
    category: 'general',
    specialty: 'cardiology',
    tags: ['test', 'cardiology', 'education'],
    difficulty: 'basic',
    readingTime: 5,
    lastUpdated: new Date().toISOString(),
    author: {
      zh_TW: '測試作者',
      en: 'Test Author',
      ja: 'テスト著者'
    },
    status: 'published',
    reviewers: ['reviewer1@example.com'],
    qualityChecks: {
      structureCheck: true,
      contentCheck: true,
      medicalAccuracyCheck: true,
      seoCheck: true,
      accessibilityCheck: true
    },
    version: '1.0.0',
    isActive: true,
    isFeatured: false
  }
  
  await writeFile(
    join(fixturesPath, 'sample-education-article.json'),
    JSON.stringify(sampleEducationArticle, null, 2)
  )
  
  // Create sample medical specialty data
  const sampleSpecialty = {
    id: 'test-cardiology',
    name: {
      zh_TW: '測試心臟科',
      en: 'Test Cardiology',
      ja: 'テスト循環器科'
    },
    slug: 'test-cardiology',
    description: {
      zh_TW: '測試心臟科描述',
      en: 'Test cardiology description',
      ja: 'テスト循環器科の説明'
    },
    color: '#e74c3c',
    icon: 'heart',
    articleCount: 5,
    isActive: true,
    reviewers: ['cardiologist@example.com', 'editor@example.com'],
    workflowConfig: {
      reviewerRoles: ['specialist', 'medical-editor'],
      requiredApprovals: 2,
      reviewTimeLimit: 7
    }
  }
  
  await writeFile(
    join(fixturesPath, 'sample-specialty.json'),
    JSON.stringify(sampleSpecialty, null, 2)
  )
  
  // Create sample markdown content
  const sampleMarkdown = `---
title:
  zh_TW: "心房顫動診斷指南"
  en: "Atrial Fibrillation Diagnosis Guide"
  ja: "心房細動診断ガイド"
excerpt:
  zh_TW: "心房顫動的診斷和治療指南"
  en: "Guide for diagnosis and treatment of atrial fibrillation"
  ja: "心房細動の診断と治療のガイド"
category: "diagnosis"
specialty: "cardiology"
tags: ["atrial-fibrillation", "cardiology", "diagnosis"]
difficulty: "intermediate"
readingTime: 10
lastUpdated: "${new Date().toISOString()}"
author:
  zh_TW: "心臟科醫師"
  en: "Cardiologist"
  ja: "循環器専門医"
status: "published"
reviewers: ["cardiologist@example.com"]
qualityChecks:
  structureCheck: true
  contentCheck: true
  medicalAccuracyCheck: true
  seoCheck: true
  accessibilityCheck: true
version: "1.0.0"
isActive: true
isFeatured: true
---

# 心房顫動診斷指南

## 概述

心房顫動（Atrial Fibrillation, AF）是最常見的心律不整疾病...

## 診斷標準

### 心電圖特徵

1. **不規則的 R-R 間距**
2. **缺乏明顯的 P 波**
3. **心房顫動波（f 波）**

### 臨床症狀

- 心悸
- 胸悶
- 呼吸困難
- 疲勞

## 治療建議

### 藥物治療

1. **抗凝血治療**
2. **心律控制**
3. **心率控制**

### 非藥物治療

- 電燒治療
- 外科手術

## 參考文獻

1. 2020 ESC Guidelines for Atrial Fibrillation
2. AHA/ACC/HRS Guideline for Management of AF
`
  
  await writeFile(
    join(fixturesPath, 'sample-article.md'),
    sampleMarkdown
  )
}

async function setupTestStorage() {
  // Set up in-memory storage for tests
  // This could be a mock database or file system
  const testStorage = {
    articles: new Map(),
    specialties: new Map(),
    users: new Map(),
    analytics: []
  }
  
  // Store in global for access in tests
  ;(global as any).testStorage = testStorage
}