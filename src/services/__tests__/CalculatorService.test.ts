/**
 * CalculatorService 測試
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AstroCalculatorService } from '../CalculatorService';
import type { CalculatorConfig, CalculatorModule, SearchQuery } from '../../types/calculator';

// 模擬計算機配置
const mockConfig: CalculatorConfig = {
  id: 'test-calculator',
  name: { 'zh-TW': '測試計算機', 'en': 'Test Calculator' },
  description: { 'zh-TW': '測試用計算機', 'en': 'Test calculator' },
  category: 'general',
  version: '1.0.0',
  status: 'published',
  fields: [
    {
      id: 'input1',
      type: 'number',
      label: { 'zh-TW': '輸入1', 'en': 'Input 1' },
      required: true,
      min: 0,
      max: 100
    }
  ],
  calculation: {
    functionName: 'calculate'
  },
  interpretation: [],
  visualization: {
    resultDisplay: {
      type: 'card',
      layout: 'single',
      components: []
    }
  },
  medical: {
    specialty: ['general'],
    evidenceLevel: 'A',
    references: []
  },
  metadata: {
    tags: ['test'],
    difficulty: 'basic',
    lastUpdated: '2024-01-01',
    author: 'Test Author'
  }
};

const mockModule: CalculatorModule = {
  config: mockConfig,
  calculator: {
    calculate: vi.fn(),
    validate: vi.fn()
  },
  visualization: {},
  tests: {}
};

// 模擬 import.meta.glob
const mockGlob = vi.fn();
vi.stubGlobal('import', {
  meta: {
    glob: mockGlob
  }
});

describe('AstroCalculatorService', () => {
  let service: AstroCalculatorService;

  beforeEach(() => {
    service = new AstroCalculatorService({
      enableCache: true,
      cacheDuration: 1000,
      enableValidation: true
    });

    // 重置模擬
    mockGlob.mockReset();
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('loadAllModules', () => {
    it('should load all calculator modules', async () => {
      // 模擬 glob 結果
      mockGlob.mockImplementation((pattern: string) => {
        if (pattern.includes('config.json')) {
          return {
            '../calculators/test-calculator/config.json': () => Promise.resolve({ default: mockConfig })
          };
        }
        if (pattern.includes('calculator.ts')) {
          return {
            '../calculators/test-calculator/calculator.ts': () => Promise.resolve(mockModule.calculator)
          };
        }
        if (pattern.includes('visualization.json')) {
          return {
            '../calculators/test-calculator/visualization.json': () => Promise.resolve({ default: {} })
          };
        }
        if (pattern.includes('calculator.test.ts')) {
          return {
            '../calculators/test-calculator/calculator.test.ts': () => Promise.resolve({})
          };
        }
        return {};
      });

      const modules = await service.loadAllModules();
      
      expect(modules).toHaveLength(1);
      expect(modules[0].config.id).toBe('test-calculator');
    });

    it('should filter modules by options', async () => {
      const draftConfig = { ...mockConfig, id: 'draft-calculator', status: 'draft' as const };
      
      mockGlob.mockImplementation((pattern: string) => {
        if (pattern.includes('config.json')) {
          return {
            '../calculators/test-calculator/config.json': () => Promise.resolve({ default: mockConfig }),
            '../calculators/draft-calculator/config.json': () => Promise.resolve({ default: draftConfig })
          };
        }
        return {};
      });

      // 不包含草稿
      const publishedModules = await service.loadAllModules({ includeInactive: false });
      expect(publishedModules).toHaveLength(1);
      expect(publishedModules[0].config.status).toBe('published');

      // 包含草稿
      const allModules = await service.loadAllModules({ includeInactive: true });
      expect(allModules).toHaveLength(2);
    });

    it('should filter by category', async () => {
      const cardioConfig = { ...mockConfig, id: 'cardio-calculator', category: 'cardiology' };
      
      mockGlob.mockImplementation((pattern: string) => {
        if (pattern.includes('config.json')) {
          return {
            '../calculators/test-calculator/config.json': () => Promise.resolve({ default: mockConfig }),
            '../calculators/cardio-calculator/config.json': () => Promise.resolve({ default: cardioConfig })
          };
        }
        return {};
      });

      const modules = await service.loadAllModules({ category: 'cardiology' });
      expect(modules).toHaveLength(1);
      expect(modules[0].config.category).toBe('cardiology');
    });
  });

  describe('loadModuleById', () => {
    beforeEach(() => {
      mockGlob.mockImplementation((pattern: string) => {
        if (pattern.includes('config.json')) {
          return {
            '../calculators/test-calculator/config.json': () => Promise.resolve({ default: mockConfig })
          };
        }
        return {};
      });
    });

    it('should load module by ID', async () => {
      const module = await service.loadModuleById('test-calculator');
      
      expect(module).not.toBeNull();
      expect(module?.config.id).toBe('test-calculator');
    });

    it('should return null for non-existent ID', async () => {
      const module = await service.loadModuleById('non-existent');
      
      expect(module).toBeNull();
    });
  });

  describe('searchModules', () => {
    beforeEach(() => {
      const cardioConfig = { 
        ...mockConfig, 
        id: 'cardio-calculator', 
        category: 'cardiology',
        name: { 'zh-TW': '心臟計算機', 'en': 'Cardio Calculator' },
        medical: { ...mockConfig.medical, specialty: ['cardiology'] }
      };
      
      mockGlob.mockImplementation((pattern: string) => {
        if (pattern.includes('config.json')) {
          return {
            '../calculators/test-calculator/config.json': () => Promise.resolve({ default: mockConfig }),
            '../calculators/cardio-calculator/config.json': () => Promise.resolve({ default: cardioConfig })
          };
        }
        return {};
      });
    });

    it('should search by text', async () => {
      const query: SearchQuery = { text: '心臟' };
      const results = await service.searchModules(query);
      
      expect(results).toHaveLength(1);
      expect(results[0].config.id).toBe('cardio-calculator');
    });

    it('should search by category', async () => {
      const query: SearchQuery = { category: 'cardiology' };
      const results = await service.searchModules(query);
      
      expect(results).toHaveLength(1);
      expect(results[0].config.category).toBe('cardiology');
    });

    it('should search by specialty', async () => {
      const query: SearchQuery = { specialty: 'cardiology' };
      const results = await service.searchModules(query);
      
      expect(results).toHaveLength(1);
      expect(results[0].config.medical.specialty).toContain('cardiology');
    });

    it('should search by difficulty', async () => {
      const query: SearchQuery = { difficulty: 'basic' };
      const results = await service.searchModules(query);
      
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.config.metadata.difficulty).toBe('basic');
      });
    });

    it('should search by tags', async () => {
      const query: SearchQuery = { tags: ['test'] };
      const results = await service.searchModules(query);
      
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.config.metadata.tags).toContain('test');
      });
    });

    it('should limit results', async () => {
      const query: SearchQuery = { limit: 1 };
      const results = await service.searchModules(query);
      
      expect(results).toHaveLength(1);
    });

    it('should sort results', async () => {
      const query: SearchQuery = { sortBy: 'name', sortOrder: 'asc' };
      const results = await service.searchModules(query);
      
      expect(results).toHaveLength(2);
      expect(results[0].config.name['zh-TW']).toBe('心臟計算機');
      expect(results[1].config.name['zh-TW']).toBe('測試計算機');
    });
  });

  describe('validateConfig', () => {
    it('should validate valid config', () => {
      const result = service.validateConfig(mockConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidConfig = { ...mockConfig, id: '' };
      const result = service.validateConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ID 為必填欄位');
    });

    it('should detect invalid ID format', () => {
      const invalidConfig = { ...mockConfig, id: 'Invalid_ID!' };
      const result = service.validateConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ID 只能包含小寫字母、數字和連字符');
    });

    it('should detect invalid version format', () => {
      const invalidConfig = { ...mockConfig, version: '1.0' };
      const result = service.validateConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('版本號必須遵循語義化版本規範 (x.y.z)');
    });

    it('should generate warnings for missing optional fields', () => {
      const configWithoutReferences = {
        ...mockConfig,
        medical: { ...mockConfig.medical, references: [] }
      };
      const result = service.validateConfig(configWithoutReferences);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('建議提供參考文獻');
    });
  });

  describe('caching', () => {
    beforeEach(() => {
      mockGlob.mockImplementation((pattern: string) => {
        if (pattern.includes('config.json')) {
          return {
            '../calculators/test-calculator/config.json': () => Promise.resolve({ default: mockConfig })
          };
        }
        return {};
      });
    });

    it('should cache results', async () => {
      // 第一次載入
      const config1 = await service.getCalculatorConfig('test-calculator');
      
      // 第二次載入應該使用快取
      const config2 = await service.getCalculatorConfig('test-calculator');
      
      expect(config1).toEqual(config2);
      
      // 檢查統計
      const stats = await service.getServiceStats();
      expect(stats.cacheHitRate).toBeGreaterThan(0);
    });

    it('should clear cache', async () => {
      // 載入資料到快取
      await service.getCalculatorConfig('test-calculator');
      
      // 清除快取
      service.clearCache();
      
      // 檢查統計被重置
      const stats = await service.getServiceStats();
      expect(stats.cacheHitRate).toBe(0);
    });

    it('should clear cache by pattern', async () => {
      // 載入不同類型的資料到快取
      await service.getCalculatorConfig('test-calculator');
      await service.getCategoryStats();
      
      // 只清除配置快取
      service.clearCache('config-');
      
      // 配置應該重新載入，統計應該使用快取
      const config = await service.getCalculatorConfig('test-calculator');
      const stats = await service.getCategoryStats();
      
      expect(config).toBeDefined();
      expect(stats).toBeDefined();
    });
  });

  describe('statistics', () => {
    beforeEach(() => {
      const configs = [
        mockConfig,
        { ...mockConfig, id: 'cardio-calc', category: 'cardiology', medical: { ...mockConfig.medical, specialty: ['cardiology'] } },
        { ...mockConfig, id: 'neuro-calc', category: 'neurology', medical: { ...mockConfig.medical, specialty: ['neurology'] } }
      ];
      
      mockGlob.mockImplementation((pattern: string) => {
        if (pattern.includes('config.json')) {
          const result: Record<string, () => Promise<any>> = {};
          configs.forEach(config => {
            result[`../calculators/${config.id}/config.json`] = () => Promise.resolve({ default: config });
          });
          return result;
        }
        return {};
      });
    });

    it('should get category stats', async () => {
      const stats = await service.getCategoryStats();
      
      expect(stats).toEqual({
        general: 1,
        cardiology: 1,
        neurology: 1
      });
    });

    it('should get specialty stats', async () => {
      const stats = await service.getSpecialtyStats();
      
      expect(stats).toEqual({
        general: 1,
        cardiology: 1,
        neurology: 1
      });
    });

    it('should get service stats', async () => {
      const stats = await service.getServiceStats();
      
      expect(stats.totalCalculators).toBe(3);
      expect(stats.activeCalculators).toBe(3);
      expect(stats.categoriesCount).toBe(3);
      expect(stats.specialtiesCount).toBe(3);
      expect(stats.lastUpdated).toBeDefined();
    });
  });

  describe('warmupCache', () => {
    beforeEach(() => {
      mockGlob.mockImplementation((pattern: string) => {
        if (pattern.includes('config.json')) {
          return {
            '../calculators/test-calculator/config.json': () => Promise.resolve({ default: mockConfig })
          };
        }
        return {};
      });
    });

    it('should warmup cache', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await service.warmupCache();
      
      expect(consoleSpy).toHaveBeenCalledWith('Warming up calculator service cache...');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/Cache warmup completed in \d+\.\d+ms/));
      
      consoleSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle glob errors gracefully', async () => {
      mockGlob.mockImplementation(() => {
        throw new Error('Glob failed');
      });

      const modules = await service.loadAllModules();
      
      expect(modules).toHaveLength(0);
    });

    it('should handle module loading errors gracefully', async () => {
      mockGlob.mockImplementation((pattern: string) => {
        if (pattern.includes('config.json')) {
          return {
            '../calculators/test-calculator/config.json': () => Promise.reject(new Error('Load failed'))
          };
        }
        return {};
      });

      const modules = await service.loadAllModules();
      
      expect(modules).toHaveLength(0);
    });
  });
});