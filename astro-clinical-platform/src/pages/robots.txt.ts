/**
 * Robots.txt API 端點
 * 生成搜尋引擎爬蟲指令檔案
 */

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site?.toString().replace(/\/$/, '') || 'https://astro-clinical-platform.com';
  
  const robotsTxt = `# Robots.txt for Astro Clinical Platform
# 醫療內容平台搜尋引擎爬蟲指令

User-agent: *
Allow: /

# 允許所有醫療內容
Allow: /tools/
Allow: /education/
Allow: /flowcharts/
Allow: /categories/

# 禁止爬取管理和 API 路徑
Disallow: /admin/
Disallow: /api/
Disallow: /_/
Disallow: /test/

# 禁止爬取搜尋結果頁面
Disallow: /search?*

# 網站地圖位置
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-medical.xml

# 特定搜尋引擎指令
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 2

# 醫療內容特定指令
User-agent: *
# 允許醫療搜尋引擎爬取
Allow: /tools/
Allow: /education/
Allow: /flowcharts/

# 快取指令（非標準但某些爬蟲支援）
Cache-delay: 3600

# 醫療內容品質標記
# Medical-content: verified
# Evidence-based: true
# Last-reviewed: ${new Date().toISOString().split('T')[0]}`;

  return new Response(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400' // 快取 24 小時
    }
  });
};

export const prerender = true;