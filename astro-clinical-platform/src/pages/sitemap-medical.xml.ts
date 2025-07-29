/**
 * 醫療內容網站地圖 API 端點
 * 生成醫療內容特定的 XML 網站地圖
 */

import type { APIRoute } from 'astro';
import { generateMedicalSitemap, defaultSitemapConfig } from '../utils/sitemap-generator';

export const GET: APIRoute = async ({ site }) => {
  try {
    // 使用網站配置中的 URL，如果沒有則使用預設值
    const baseUrl = site?.toString().replace(/\/$/, '') || defaultSitemapConfig.baseUrl;
    
    const medicalSitemap = await generateMedicalSitemap({
      ...defaultSitemapConfig,
      baseUrl
    });

    return new Response(medicalSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800', // 快取 30 分鐘
        'X-Robots-Tag': 'noindex',
        'X-Content-Type': 'medical-sitemap' // 自定義標頭標識醫療內容
      }
    });
  } catch (error) {
    console.error('Failed to generate medical sitemap:', error);
    
    return new Response('Internal Server Error', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
};

export const prerender = true; // 靜態生成以提高性能