/**
 * 內容搜尋數據 API 端點
 * 提供所有教育內容的搜尋數據
 * 
 * 更新日期：2025-01-30
 * 更新內容：新增內容搜尋數據 API
 * 
 * 需求對應：
 * - 需求 1.1: 專科分類架構系統 ✓
 * - 需求 7.1: 多語言支援機制 ✓
 */

import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  try {
    // 獲取所有教育內容
    const allEducation = await getCollection('education');
    
    // 檢查是否為開發環境
    const isDevelopment = import.meta.env.DEV;
    const url = new URL(request.url);
    const showAll = url.searchParams.get('showAll') === 'true';
    
    // 過濾內容：生產環境只顯示已發布內容
    const filteredEducation = allEducation.filter(entry => {
      if (isDevelopment || showAll) {
        return entry.data.isActive !== false;
      }
      return entry.data.status === 'published' && entry.data.isActive !== false;
    });

    // 轉換為搜尋友好的格式
    const searchData = filteredEducation.map(entry => {
      const data = entry.data;
      
      return {
        slug: entry.slug,
        title: data.title?.['zh-TW'] || data.title || '',
        excerpt: data.excerpt?.['zh-TW'] || data.excerpt || '',
        category: data.category || '',
        medicalSpecialties: data.medicalSpecialties || [],
        tags: data.tags || [],
        author: data.author?.['zh-TW'] || data.assignedWriter || '',
        status: data.status || 'published',
        difficulty: data.difficulty || 'basic',
        readingTime: data.readingTime || 5,
        lastUpdated: data.lastUpdated || '',
        publishedAt: data.workflowTimestamps?.publishedAt || data.lastUpdated || '',
        patientFriendly: data.patientFriendly || false,
        professionalLevel: data.professionalLevel || false,
        hasFlowchart: data.hasFlowchart || false,
        isFeatured: data.isFeatured || false,
        evidenceLevel: data.evidenceLevel || '',
        version: data.version || '1.0',
        
        // 搜尋權重計算
        searchWeight: calculateSearchWeight(data),
        
        // 新鮮度計算
        freshness: calculateFreshness(data.lastUpdated),
        
        // 品質分數
        qualityScore: calculateQualityScore(data)
      };
    });

    // 按搜尋權重和新鮮度排序
    searchData.sort((a, b) => {
      const weightDiff = b.searchWeight - a.searchWeight;
      if (weightDiff !== 0) return weightDiff;
      return b.freshness - a.freshness;
    });

    // 計算統計資料
    const stats = {
      total: searchData.length,
      published: searchData.filter(item => item.status === 'published').length,
      inReview: searchData.filter(item => item.status === 'in-review').length,
      draft: searchData.filter(item => item.status === 'draft').length,
      patientFriendly: searchData.filter(item => item.patientFriendly).length,
      withFlowchart: searchData.filter(item => item.hasFlowchart).length,
      featured: searchData.filter(item => item.isFeatured).length,
      
      // 按專科統計
      bySpecialty: getStatsByField(searchData, 'medicalSpecialties'),
      
      // 按分類統計
      byCategory: getStatsByField(searchData, 'category'),
      
      // 按難度統計
      byDifficulty: getStatsByField(searchData, 'difficulty'),
      
      // 按狀態統計
      byStatus: getStatsByField(searchData, 'status')
    };

    // 提取所有可用的過濾選項
    const filterOptions = {
      specialties: [...new Set(searchData.flatMap(item => item.medicalSpecialties))].sort(),
      categories: [...new Set(searchData.map(item => item.category))].sort(),
      authors: [...new Set(searchData.map(item => item.author).filter(Boolean))].sort(),
      tags: [...new Set(searchData.flatMap(item => item.tags))].sort(),
      difficulties: ['basic', 'intermediate', 'advanced'],
      statuses: isDevelopment || showAll ? 
        ['published', 'in-review', 'draft', 'needs-revision', 'quality-check', 'ready-to-publish'] :
        ['published']
    };

    const response = {
      content: searchData,
      stats,
      filterOptions,
      meta: {
        timestamp: new Date().toISOString(),
        isDevelopment,
        totalItems: searchData.length,
        version: '1.0'
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': isDevelopment ? 'no-cache' : 'public, max-age=300', // 5分鐘快取
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Error in search-data API:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to load search data',
      message: error.message,
      content: [],
      stats: {},
      filterOptions: {},
      meta: {
        timestamp: new Date().toISOString(),
        error: true
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

// 計算搜尋權重
function calculateSearchWeight(data: any): number {
  let weight = 0;
  
  // 基礎權重
  weight += 1;
  
  // 精選內容加權
  if (data.isFeatured) weight += 5;
  
  // 病患友善內容加權
  if (data.patientFriendly) weight += 2;
  
  // 有流程圖的內容加權
  if (data.hasFlowchart) weight += 2;
  
  // 證據等級加權
  if (data.evidenceLevel === 'A') weight += 3;
  else if (data.evidenceLevel === 'B') weight += 2;
  else if (data.evidenceLevel === 'C') weight += 1;
  
  // 內容完整性加權
  if (data.excerpt) weight += 1;
  if (data.tags && data.tags.length > 0) weight += 1;
  if (data.references && data.references.length > 0) weight += 2;
  
  return weight;
}

// 計算內容新鮮度（天數的倒數）
function calculateFreshness(lastUpdated: string): number {
  if (!lastUpdated) return 0;
  
  const now = new Date();
  const updated = new Date(lastUpdated);
  const daysDiff = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
  
  // 新鮮度分數：越新分數越高
  if (daysDiff <= 7) return 10;
  if (daysDiff <= 30) return 8;
  if (daysDiff <= 90) return 6;
  if (daysDiff <= 180) return 4;
  if (daysDiff <= 365) return 2;
  return 1;
}

// 計算品質分數
function calculateQualityScore(data: any): number {
  let score = 0;
  
  // 基本品質檢查
  if (data.qualityChecks) {
    const checks = data.qualityChecks;
    if (checks.structureCheck) score += 1;
    if (checks.contentCheck) score += 1;
    if (checks.medicalAccuracyCheck) score += 2;
    if (checks.seoCheck) score += 1;
    if (checks.accessibilityCheck) score += 1;
    if (checks.referencesCheck) score += 1;
  }
  
  // 審核歷史加分
  if (data.reviewHistory && data.reviewHistory.length > 0) {
    const approvedReviews = data.reviewHistory.filter(r => r.decision === 'approved').length;
    score += approvedReviews;
  }
  
  return score;
}

// 按欄位統計
function getStatsByField(data: any[], field: string): Record<string, number> {
  const stats: Record<string, number> = {};
  
  data.forEach(item => {
    const values = Array.isArray(item[field]) ? item[field] : [item[field]];
    values.forEach(value => {
      if (value) {
        stats[value] = (stats[value] || 0) + 1;
      }
    });
  });
  
  return stats;
}