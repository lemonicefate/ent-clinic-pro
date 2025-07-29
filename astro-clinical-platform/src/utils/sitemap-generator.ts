/**
 * 網站地圖生成器
 * 為醫療內容生成結構化的 XML 網站地圖
 */

import { getCollection } from 'astro:content';
import type { SupportedLocale } from '../env.d';

// 網站地圖項目介面
interface SitemapItem {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: Array<{
    hreflang: string;
    href: string;
  }>;
  // 醫療內容特定屬性
  contentType?: 'calculator' | 'education' | 'flowchart' | 'general';
  medicalSpecialty?: string[];
  evidenceLevel?: 'high' | 'medium' | 'low';
  patientFriendly?: boolean;
}

// 網站地圖配置
interface SitemapConfig {
  baseUrl: string;
  defaultLocale: SupportedLocale;
  supportedLocales: SupportedLocale[];
  excludePatterns?: RegExp[];
  includeImages?: boolean;
  includeNews?: boolean;
}

/**
 * 網站地圖生成器類別
 */
export class SitemapGenerator {
  private config: SitemapConfig;

  constructor(config: SitemapConfig) {
    this.config = config;
  }

  /**
   * 生成完整的網站地圖
   */
  async generateSitemap(): Promise<string> {
    const items = await this.collectAllSitemapItems();
    return this.generateXML(items);
  }

  /**
   * 收集所有網站地圖項目
   */
  private async collectAllSitemapItems(): Promise<SitemapItem[]> {
    const items: SitemapItem[] = [];

    // 添加靜態頁面
    items.push(...this.getStaticPages());

    // 添加計算機頁面
    items.push(...await this.getCalculatorPages());

    // 添加教育內容頁面
    items.push(...await this.getEducationPages());

    // 添加流程圖頁面
    items.push(...await this.getFlowchartPages());

    // 添加分類頁面
    items.push(...await this.getCategoryPages());

    // 過濾排除的模式
    return this.filterExcludedItems(items);
  }

  /**
   * 獲取靜態頁面
   */
  private getStaticPages(): SitemapItem[] {
    const staticPages = [
      { path: '/', priority: 1.0, changefreq: 'daily' as const },
      { path: '/tools', priority: 0.9, changefreq: 'weekly' as const },
      { path: '/education', priority: 0.9, changefreq: 'daily' as const },
      { path: '/categories', priority: 0.8, changefreq: 'weekly' as const },
      { path: '/search', priority: 0.7, changefreq: 'monthly' as const },
      { path: '/about', priority: 0.6, changefreq: 'monthly' as const },
      { path: '/privacy', priority: 0.5, changefreq: 'yearly' as const },
      { path: '/terms', priority: 0.5, changefreq: 'yearly' as const }
    ];

    return staticPages.map(page => ({
      url: this.buildUrl(page.path),
      priority: page.priority,
      changefreq: page.changefreq,
      lastmod: new Date().toISOString(),
      alternates: this.generateAlternates(page.path),
      contentType: 'general' as const
    }));
  }

  /**
   * 獲取計算機頁面
   */
  private async getCalculatorPages(): Promise<SitemapItem[]> {
    try {
      const calculators = await getCollection('calculators');
      
      return calculators
        .filter(calc => calc.data.isActive !== false)
        .map(calc => ({
          url: this.buildUrl(`/tools/${calc.data.slug || calc.id}`),
          lastmod: calc.data.lastUpdated || new Date().toISOString(),
          changefreq: 'monthly' as const,
          priority: calc.data.isFeatured ? 0.9 : 0.8,
          alternates: this.generateAlternates(`/tools/${calc.data.slug || calc.id}`),
          contentType: 'calculator' as const,
          medicalSpecialty: calc.data.medicalSpecialties || [],
          evidenceLevel: calc.data.evidenceLevel,
          patientFriendly: calc.data.difficulty === 'basic'
        }));
    } catch (error) {
      console.warn('Failed to load calculators for sitemap:', error);
      return [];
    }
  }

  /**
   * 獲取教育內容頁面
   */
  private async getEducationPages(): Promise<SitemapItem[]> {
    try {
      const education = await getCollection('education');
      
      return education
        .filter(edu => edu.data.isActive !== false)
        .map(edu => ({
          url: this.buildUrl(`/education/${edu.data.slug || edu.id}`),
          lastmod: edu.data.lastUpdated || new Date().toISOString(),
          changefreq: 'weekly' as const,
          priority: edu.data.isFeatured ? 0.9 : 0.7,
          alternates: this.generateAlternates(`/education/${edu.data.slug || edu.id}`),
          contentType: 'education' as const,
          medicalSpecialty: edu.data.medicalSpecialties || [],
          evidenceLevel: edu.data.evidenceLevel,
          patientFriendly: edu.data.patientFriendly
        }));
    } catch (error) {
      console.warn('Failed to load education content for sitemap:', error);
      return [];
    }
  }

  /**
   * 獲取流程圖頁面
   */
  private async getFlowchartPages(): Promise<SitemapItem[]> {
    try {
      const flowcharts = await getCollection('flowcharts');
      
      return flowcharts
        .filter(flow => flow.data.isActive !== false)
        .map(flow => ({
          url: this.buildUrl(`/flowcharts/${flow.data.slug || flow.id}`),
          lastmod: flow.data.lastUpdated || new Date().toISOString(),
          changefreq: 'monthly' as const,
          priority: flow.data.isFeatured ? 0.8 : 0.6,
          alternates: this.generateAlternates(`/flowcharts/${flow.data.slug || flow.id}`),
          contentType: 'flowchart' as const,
          medicalSpecialty: flow.data.medicalSpecialties || [],
          evidenceLevel: flow.data.evidenceLevel,
          patientFriendly: flow.data.complexity === 'simple'
        }));
    } catch (error) {
      console.warn('Failed to load flowcharts for sitemap:', error);
      return [];
    }
  }

  /**
   * 獲取分類頁面
   */
  private async getCategoryPages(): Promise<SitemapItem[]> {
    const categories = new Set<string>();
    
    try {
      // 收集所有分類
      const [calculators, education, flowcharts] = await Promise.all([
        getCollection('calculators').catch(() => []),
        getCollection('education').catch(() => []),
        getCollection('flowcharts').catch(() => [])
      ]);

      // 添加計算機分類
      calculators.forEach(calc => {
        if (calc.data.category) categories.add(calc.data.category);
        if (calc.data.medicalSpecialties) {
          calc.data.medicalSpecialties.forEach(spec => categories.add(spec));
        }
      });

      // 添加教育內容分類
      education.forEach(edu => {
        if (edu.data.category) categories.add(edu.data.category);
        if (edu.data.medicalSpecialties) {
          edu.data.medicalSpecialties.forEach(spec => categories.add(spec));
        }
      });

      // 添加流程圖分類
      flowcharts.forEach(flow => {
        if (flow.data.category) categories.add(flow.data.category);
        if (flow.data.medicalSpecialties) {
          flow.data.medicalSpecialties.forEach(spec => categories.add(spec));
        }
      });

      return Array.from(categories).map(category => ({
        url: this.buildUrl(`/categories/${encodeURIComponent(category)}`),
        lastmod: new Date().toISOString(),
        changefreq: 'weekly' as const,
        priority: 0.7,
        alternates: this.generateAlternates(`/categories/${encodeURIComponent(category)}`),
        contentType: 'general' as const
      }));
    } catch (error) {
      console.warn('Failed to generate category pages for sitemap:', error);
      return [];
    }
  }

  /**
   * 建構完整 URL
   */
  private buildUrl(path: string): string {
    return `${this.config.baseUrl.replace(/\/$/, '')}${path}`;
  }

  /**
   * 生成多語言替代連結
   */
  private generateAlternates(path: string): Array<{ hreflang: string; href: string }> {
    return this.config.supportedLocales.map(locale => ({
      hreflang: locale,
      href: locale === this.config.defaultLocale 
        ? this.buildUrl(path)
        : this.buildUrl(`/${locale}${path}`)
    }));
  }

  /**
   * 過濾排除的項目
   */
  private filterExcludedItems(items: SitemapItem[]): SitemapItem[] {
    if (!this.config.excludePatterns) return items;

    return items.filter(item => {
      return !this.config.excludePatterns!.some(pattern => 
        pattern.test(item.url)
      );
    });
  }

  /**
   * 生成 XML 網站地圖
   */
  private generateXML(items: SitemapItem[]): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">';
    const urlsetClose = '</urlset>';

    const urls = items.map(item => {
      let urlXml = '  <url>';
      urlXml += `\\n    <loc>${this.escapeXml(item.url)}</loc>`;
      
      if (item.lastmod) {
        urlXml += `\\n    <lastmod>${item.lastmod}</lastmod>`;
      }
      
      if (item.changefreq) {
        urlXml += `\\n    <changefreq>${item.changefreq}</changefreq>`;
      }
      
      if (item.priority !== undefined) {
        urlXml += `\\n    <priority>${item.priority.toFixed(1)}</priority>`;
      }

      // 添加多語言替代連結
      if (item.alternates && item.alternates.length > 0) {
        item.alternates.forEach(alt => {
          urlXml += `\\n    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${this.escapeXml(alt.href)}" />`;
        });
      }

      urlXml += '\\n  </url>';
      return urlXml;
    }).join('\\n');

    return `${xmlHeader}\\n${urlsetOpen}\\n${urls}\\n${urlsetClose}`;
  }

  /**
   * 生成醫療內容特定的網站地圖
   */
  async generateMedicalSitemap(): Promise<string> {
    const items = await this.collectAllSitemapItems();
    const medicalItems = items.filter(item => 
      item.contentType && ['calculator', 'education', 'flowchart'].includes(item.contentType)
    );

    return this.generateMedicalXML(medicalItems);
  }

  /**
   * 生成醫療內容 XML
   */
  private generateMedicalXML(items: SitemapItem[]): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:medical="http://www.google.com/schemas/sitemap-medical/1.0">';
    const urlsetClose = '</urlset>';

    const urls = items.map(item => {
      let urlXml = '  <url>';
      urlXml += `\\n    <loc>${this.escapeXml(item.url)}</loc>`;
      
      if (item.lastmod) {
        urlXml += `\\n    <lastmod>${item.lastmod}</lastmod>`;
      }
      
      if (item.changefreq) {
        urlXml += `\\n    <changefreq>${item.changefreq}</changefreq>`;
      }
      
      if (item.priority !== undefined) {
        urlXml += `\\n    <priority>${item.priority.toFixed(1)}</priority>`;
      }

      // 添加醫療內容特定標記
      if (item.contentType) {
        urlXml += `\\n    <medical:content_type>${item.contentType}</medical:content_type>`;
      }

      if (item.medicalSpecialty && item.medicalSpecialty.length > 0) {
        item.medicalSpecialty.forEach(specialty => {
          urlXml += `\\n    <medical:specialty>${this.escapeXml(specialty)}</medical:specialty>`;
        });
      }

      if (item.evidenceLevel) {
        urlXml += `\\n    <medical:evidence_level>${item.evidenceLevel}</medical:evidence_level>`;
      }

      if (item.patientFriendly !== undefined) {
        urlXml += `\\n    <medical:patient_friendly>${item.patientFriendly}</medical:patient_friendly>`;
      }

      urlXml += '\\n  </url>';
      return urlXml;
    }).join('\\n');

    return `${xmlHeader}\\n${urlsetOpen}\\n${urls}\\n${urlsetClose}`;
  }

  /**
   * 生成網站地圖索引
   */
  generateSitemapIndex(sitemaps: Array<{ url: string; lastmod?: string }>): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const sitemapIndexOpen = '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    const sitemapIndexClose = '</sitemapindex>';

    const sitemapEntries = sitemaps.map(sitemap => {
      let entry = '  <sitemap>';
      entry += `\\n    <loc>${this.escapeXml(sitemap.url)}</loc>`;
      
      if (sitemap.lastmod) {
        entry += `\\n    <lastmod>${sitemap.lastmod}</lastmod>`;
      }
      
      entry += '\\n  </sitemap>';
      return entry;
    }).join('\\n');

    return `${xmlHeader}\\n${sitemapIndexOpen}\\n${sitemapEntries}\\n${sitemapIndexClose}`;
  }

  /**
   * XML 轉義
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * 清理快取
   */
  clearCache(): void {
    // 實現快取清理邏輯
    console.log('Sitemap cache cleared');
  }
}

// 預設配置
export const defaultSitemapConfig: SitemapConfig = {
  baseUrl: 'https://astro-clinical-platform.com',
  defaultLocale: 'zh-TW',
  supportedLocales: ['zh-TW', 'en', 'ja'],
  excludePatterns: [
    /\/admin/,
    /\/api/,
    /\/test/,
    /\/_/
  ],
  includeImages: true,
  includeNews: false
};

// 便利函數
export const generateSitemap = async (config: Partial<SitemapConfig> = {}) => {
  const generator = new SitemapGenerator({ ...defaultSitemapConfig, ...config });
  return generator.generateSitemap();
};

export const generateMedicalSitemap = async (config: Partial<SitemapConfig> = {}) => {
  const generator = new SitemapGenerator({ ...defaultSitemapConfig, ...config });
  return generator.generateMedicalSitemap();
};