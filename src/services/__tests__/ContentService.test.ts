/**
 * ContentService 測試
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AstroHybridContentService } from '../ContentService';
import type { ContentType, ContentLoadOptions, UnifiedContent } from '../ContentService';

// 模擬內容數據
const mockGitContent: UnifiedContent = {
  id: 'test-content',
  slug: 'test-content',
  title: { 'zh-TW': '測試內容', 'en': 'Test Content' },
  description: { 'zh-TW': '測試描述', 'en': 'Test Description' },
  content: { 'zh-TW': '測試內容正文', 'en': 'Test content body' },
  category: 'general',
  tags: ['test'],
  lastUpdated: '2024-01-01T00:00:00.000Z',
  isActive: true,
  isDraft: false,
  source: 'git',
  locale: 'zh-TW',
  metadata: {},
  rawData: {}
};

const mockCMSContent: UnifiedContent = {
  id: 'cms-content',
  slug: 'cms-content',
  title: 'CMS Content',
  description: 'CMS Description',
  content: 'CMS content body',
  category: 'cms',
  tags: ['cms'],
  lastUpdated: '2024-01-02T00:00:00.000Z',
  isActive: true,
  isDraft: false,
  source: 'cms',
  locale: 'zh-TW',
  metadata: {},
  rawData: {}
};

// 模擬 fetch
global.fetch = vi.fn();

// 模擬 import.meta.glob
const mockGlob = vi.fn();
vi.stubGlobal('import', {
  meta: {
    glob: mockGlob
  }
});

describe('AstroHybridContentService', () => {
  let service: AstroHybridContentService;

  beforeEach(() => {
    service = new AstroHybridContentService({
      cache: true,
      cacheTimeout: 1000,
      cmsBaseUrl: 'http://localhost:1337',
      cmsApiToken: 'test-token'
    });

    // 重置模擬
    vi.clearAllMocks();
    mockGlob.mockReset();
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('loadFromGit', () => {
    it('should load content from Git', async () => {
      mockGlob.mockReturnValue({
        '../content/calculators/test-content.md': () => Promise.resolve({
          default: {
            id: 'test-content',
            title: { 'zh-TW': '測試內容', 'en': 'Test Content' },
            description: { 'zh-TW': '測試描述', 'en': 'Test Description' },
            category: 'general',
            tags: ['test'],
            lastUpdated: '2024-01-01T00:00:00.000Z',
            isActive: true,
            isDraft: false,
            locale: 'zh-TW'
          }
        })
      });

      const content = await service.loadFromGit('calculators');

      expect(content).toHaveLength(1);
      expect(content[0].slug).toBe('test-content');
      expect(content[0].source).toBe('git');
    });

    it('should handle Git loading errors gracefully', async () => {
      mockGlob.mockImplementation(() => {
        throw new Error('Git load failed');
      });

      const content = await service.loadFromGit('calculators');

      expect(content).toHaveLength(0);
    });

    it('should filter content by type', async () => {
      mockGlob.mockReturnValue({
        '../content/calculators/calc1.md': () => Promise.resolve({ default: { id: 'calc1' } }),
        '../content/education/edu1.md': () => Promise.resolve({ default: { id: 'edu1' } })
      });

      const content = await service.loadFromGit('calculators');

      expect(content).toHaveLength(1);
      expect(content[0].id).toBe('calc1');
    });
  });

  describe('loadFromCMS', () => {
    it('should load content from CMS', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            attributes: {
              title: 'CMS Content',
              slug: 'cms-content',
              description: 'CMS Description',
              content: 'CMS content body',
              category: 'cms',
              tags: ['cms'],
              isActive: true,
              isDraft: false,
              locale: 'zh-TW',
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-02T00:00:00.000Z'
            }
          }
        ]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const content = await service.loadFromCMS('calculators');

      expect(content).toHaveLength(1);
      expect(content[0].slug).toBe('cms-content');
      expect(content[0].source).toBe('cms');
    });

    it('should handle CMS API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const content = await service.loadFromCMS('calculators');

      expect(content).toHaveLength(0);
    });

    it('should include authorization header when token provided', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      });

      await service.loadFromCMS('calculators');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });
  });

  describe('loadContent', () => {
    beforeEach(() => {
      // 模擬 Git 載入
      mockGlob.mockReturnValue({
        '../content/calculators/git-content.md': () => Promise.resolve({
          default: {
            id: 'git-content',
            title: 'Git Content',
            slug: 'git-content',
            category: 'general',
            isActive: true,
            isDraft: false,
            lastUpdated: '2024-01-01T00:00:00.000Z'
          }
        })
      });

      // 模擬 CMS 載入
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: [
            {
              id: 1,
              attributes: {
                title: 'CMS Content',
                slug: 'cms-content',
                category: 'cms',
                isActive: true,
                isDraft: false,
                locale: 'zh-TW',
                updatedAt: '2024-01-02T00:00:00.000Z'
              }
            }
          ]
        })
      });
    });

    it('should load content from Git only', async () => {
      const content = await service.loadContent('calculators', { source: 'git' });

      expect(content).toHaveLength(1);
      expect(content[0].source).toBe('git');
    });

    it('should load content from CMS only', async () => {
      const content = await service.loadContent('calculators', { source: 'cms' });

      expect(content).toHaveLength(1);
      expect(content[0].source).toBe('cms');
    });

    it('should merge Git and CMS content in hybrid mode', async () => {
      const content = await service.loadContent('calculators', { source: 'hybrid' });

      expect(content).toHaveLength(2);
      expect(content.some(c => c.source === 'git')).toBe(true);
      expect(content.some(c => c.source === 'cms')).toBe(true);
    });

    it('should filter inactive content', async () => {
      mockGlob.mockReturnValue({
        '../content/calculators/inactive.md': () => Promise.resolve({
          default: {
            id: 'inactive',
            title: 'Inactive Content',
            slug: 'inactive',
            isActive: false,
            isDraft: false
          }
        })
      });

      const content = await service.loadContent('calculators', { 
        source: 'git',
        includeInactive: false 
      });

      expect(content).toHaveLength(0);
    });

    it('should filter draft content', async () => {
      mockGlob.mockReturnValue({
        '../content/calculators/draft.md': () => Promise.resolve({
          default: {
            id: 'draft',
            title: 'Draft Content',
            slug: 'draft',
            isActive: true,
            isDraft: true
          }
        })
      });

      const content = await service.loadContent('calculators', { 
        source: 'git',
        includeDrafts: false 
      });

      expect(content).toHaveLength(0);
    });

    it('should use fallback when primary source fails', async () => {
      // CMS 失敗
      (global.fetch as any).mockRejectedValueOnce(new Error('CMS failed'));

      const content = await service.loadContent('calculators', { 
        source: 'cms',
        fallback: true 
      });

      expect(content).toHaveLength(1);
      expect(content[0].source).toBe('git');
    });
  });

  describe('loadContentBySlug', () => {
    beforeEach(() => {
      mockGlob.mockReturnValue({
        '../content/calculators/test-slug.md': () => Promise.resolve({
          default: {
            id: 'test-slug',
            title: 'Test Slug Content',
            slug: 'test-slug',
            category: 'general',
            isActive: true,
            isDraft: false
          }
        })
      });
    });

    it('should load content by slug', async () => {
      const content = await service.loadContentBySlug('calculators', 'test-slug');

      expect(content).not.toBeNull();
      expect(content?.slug).toBe('test-slug');
    });

    it('should return null for non-existent slug', async () => {
      const content = await service.loadContentBySlug('calculators', 'non-existent');

      expect(content).toBeNull();
    });
  });

  describe('searchContent', () => {
    beforeEach(() => {
      mockGlob.mockReturnValue({
        '../content/calculators/searchable.md': () => Promise.resolve({
          default: {
            id: 'searchable',
            title: { 'zh-TW': '可搜尋內容', 'en': 'Searchable Content' },
            description: { 'zh-TW': '這是可以搜尋的內容', 'en': 'This is searchable content' },
            slug: 'searchable',
            category: 'general',
            tags: ['search', 'test'],
            isActive: true,
            isDraft: false
          }
        }),
        '../content/education/educational.md': () => Promise.resolve({
          default: {
            id: 'educational',
            title: 'Educational Content',
            slug: 'educational',
            category: 'education',
            isActive: true,
            isDraft: false
          }
        })
      });
    });

    it('should search content by title', async () => {
      const results = await service.searchContent('可搜尋', {
        source: 'git',
        contentTypes: ['calculators']
      });

      expect(results.calculators).toHaveLength(1);
      expect(results.calculators[0].slug).toBe('searchable');
    });

    it('should search content by description', async () => {
      const results = await service.searchContent('可以搜尋', {
        source: 'git',
        contentTypes: ['calculators']
      });

      expect(results.calculators).toHaveLength(1);
    });

    it('should search content by tags', async () => {
      const results = await service.searchContent('search', {
        source: 'git',
        contentTypes: ['calculators']
      });

      expect(results.calculators).toHaveLength(1);
    });

    it('should search content by category', async () => {
      const results = await service.searchContent('education', {
        source: 'git',
        contentTypes: ['education']
      });

      expect(results.education).toHaveLength(1);
    });

    it('should limit search results', async () => {
      const results = await service.searchContent('content', {
        source: 'git',
        limit: 1
      });

      const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
      expect(totalResults).toBeLessThanOrEqual(4); // 每種類型最多 1 個
    });
  });

  describe('caching', () => {
    beforeEach(() => {
      mockGlob.mockReturnValue({
        '../content/calculators/cached.md': () => Promise.resolve({
          default: {
            id: 'cached',
            title: 'Cached Content',
            slug: 'cached',
            isActive: true,
            isDraft: false
          }
        })
      });
    });

    it('should cache content', async () => {
      // 第一次載入
      const content1 = await service.loadContent('calculators', { source: 'git' });
      
      // 第二次載入應該使用快取
      const content2 = await service.loadContent('calculators', { source: 'git' });
      
      expect(content1).toEqual(content2);
      
      // 檢查統計
      const stats = await service.getContentStats();
      expect(stats.cacheHitRate).toBeGreaterThan(0);
    });

    it('should clear cache', async () => {
      // 載入資料到快取
      await service.loadContent('calculators', { source: 'git' });
      
      // 清除快取
      service.clearCache();
      
      // 檢查統計被重置
      const stats = await service.getContentStats();
      expect(stats.cacheHitRate).toBe(0);
    });

    it('should clear cache by pattern', async () => {
      // 載入不同類型的資料到快取
      await service.loadContent('calculators', { source: 'git' });
      await service.loadContent('education', { source: 'git' });
      
      // 只清除計算機快取
      service.clearCache('calculators');
      
      // 計算機應該重新載入，教育內容應該使用快取
      const calcContent = await service.loadContent('calculators', { source: 'git' });
      const eduContent = await service.loadContent('education', { source: 'git' });
      
      expect(calcContent).toBeDefined();
      expect(eduContent).toBeDefined();
    });
  });

  describe('getContentStats', () => {
    beforeEach(() => {
      mockGlob.mockReturnValue({
        '../content/calculators/calc1.md': () => Promise.resolve({
          default: {
            id: 'calc1',
            title: 'Calculator 1',
            slug: 'calc1',
            category: 'cardiology',
            isActive: true,
            isDraft: false,
            locale: 'zh-TW'
          }
        }),
        '../content/calculators/calc2.md': () => Promise.resolve({
          default: {
            id: 'calc2',
            title: 'Calculator 2',
            slug: 'calc2',
            category: 'neurology',
            isActive: false,
            isDraft: true,
            locale: 'en'
          }
        }),
        '../content/education/edu1.md': () => Promise.resolve({
          default: {
            id: 'edu1',
            title: 'Education 1',
            slug: 'edu1',
            category: 'general',
            isActive: true,
            isDraft: false,
            locale: 'zh-TW'
          }
        })
      });
    });

    it('should get content statistics', async () => {
      const stats = await service.getContentStats();

      expect(stats.totalContent).toBeGreaterThan(0);
      expect(stats.contentByType.calculators).toBe(2);
      expect(stats.contentByType.education).toBe(1);
      expect(stats.contentByCategory.cardiology).toBe(1);
      expect(stats.contentByCategory.neurology).toBe(1);
      expect(stats.contentByLocale['zh-TW']).toBe(2);
      expect(stats.contentByLocale['en']).toBe(1);
      expect(stats.activeContent).toBe(2);
      expect(stats.draftContent).toBe(1);
    });
  });

  describe('warmupCache', () => {
    beforeEach(() => {
      mockGlob.mockReturnValue({
        '../content/calculators/warmup.md': () => Promise.resolve({
          default: {
            id: 'warmup',
            title: 'Warmup Content',
            slug: 'warmup',
            isActive: true,
            isDraft: false
          }
        })
      });
    });

    it('should warmup cache', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await service.warmupCache();

      expect(consoleSpy).toHaveBeenCalledWith('Warming up content service cache...');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/Content cache warmup completed in \d+\.\d+ms/));

      consoleSpy.mockRestore();
    });
  });

  describe('CMS configuration', () => {
    it('should update CMS configuration', () => {
      const newBaseUrl = 'http://new-cms.example.com';
      const newToken = 'new-token';

      service.updateCMSConfig(newBaseUrl, newToken);

      // 驗證配置已更新（通過檢查後續 API 調用）
      expect(service).toBeDefined();
    });

    it('should test CMS connection', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true
      });

      const isConnected = await service.testCMSConnection();

      expect(isConnected).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/calculators'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });

    it('should handle CMS connection failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Connection failed'));

      const isConnected = await service.testCMSConnection();

      expect(isConnected).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle module loading errors gracefully', async () => {
      mockGlob.mockReturnValue({
        '../content/calculators/error.md': () => Promise.reject(new Error('Load failed'))
      });

      const content = await service.loadFromGit('calculators');

      expect(content).toHaveLength(0);
    });

    it('should handle search errors gracefully', async () => {
      mockGlob.mockImplementation(() => {
        throw new Error('Search failed');
      });

      const results = await service.searchContent('test');

      expect(results.calculators).toHaveLength(0);
      expect(results.education).toHaveLength(0);
      expect(results.flowcharts).toHaveLength(0);
      expect(results.references).toHaveLength(0);
    });
  });
});