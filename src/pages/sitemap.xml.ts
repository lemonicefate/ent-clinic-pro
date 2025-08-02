/**
 * 網站地圖 API 端點
 * 生成主要的 XML 網站地圖
 */

import type { APIRoute } from 'astro';
import { generateSitemap, defaultSitemapConfig } from '../utils/sitemap-generator';

export const GET: APIRoute = async ({ site }) => {
  try {
    // 使用網站配置中的 URL，如果沒有則使用預設值
    const baseUrl = site?.toString().replace(/\/$/, '') || defaultSitemapConfig.baseUrl;
    
    const sitemap = await generateSitemap({
      ...defaultSitemapConfig,
      baseUrl
    });

    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // 快取 1 小時
        'X-Robots-Tag': 'noindex' // 防止搜尋引擎索引網站地圖本身
      }
    });
  } catch (error) {
    console.error('Failed to generate sitemap:', error);
    
    return new Response('Internal Server Error', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
};

export const prerender = true; // 靜態生成以提高性能