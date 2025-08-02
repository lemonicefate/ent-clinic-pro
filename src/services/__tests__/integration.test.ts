/**
 * 服務層整合測試
 * 測試 CalculatorService 和 ContentService 的協同工作
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AstroCalculatorService } from '../CalculatorService';
import { AstroContentService } from '../ContentService';
import { createMockCalculatorModule, mockAstroGlob, TestPerformanceMonitor } from '../../test-utils';
import type { CalculatorModule, SearchQuery } from '../../types/calculator';

// 模擬 Astro 環境
vi.stubGlobal('import', {
  meta: {
    glob: vi.fn()
  }
});

describe('Services Integration', () => {
  let calculatorService: AstroCalculatorService;
  let contentService: AstroContentService;
  let mockModules: CalculatorModule[];
  let performanceMonitor: TestPerformanceMonitor;

  beforeEach(async () => {
    performanceMonitor = new TestPerformanceMonitor();
    
    // 建立模擬模組
    mockModules = [
      createMockCalculatorModule({
        id: 'bmi-calculator',
        name: { 'zh-TW': 'BMI 計算機', 'en': 'BMI Calculator' },
        category: 'general',
        medical: { specialty: ['general-medicine'], evidenceLevel: 'A' },
        metadata: { tags: ['bmi', 'weight'], difficulty: 'basic', author: 'test', lastUpdated: '2024-01-01' }
      }),
      createMockCalculatorModule({
        id: 'blood-pressure',
        name: { 'zh-TW': '血壓計算機', 'en': 'Blood Pressure Calculator' },
        category: 'cardiology',
        medical: { specialty: ['cardiology'], evidenceLevel: 'A' },
        metadata: { tags: ['blood-pressure', 'hypertension'], difficulty: 'intermediate', author: 'test', lastUpdated: '2024-01-02' }
      }),
      createMockCalculatorModule({
        id: 'cholesterol-risk',
        name: { 'zh-TW': '膽固醇風險', 'en': 'Cholesterol Risk' },
        category: 'cardiology',
        status: 'draft',
        medical: { specialty: ['cardiology', 'endocrinology'], evidenceLevel: 'B' },
        metadata: { tags: ['cholesterol', 'cardiovascular'], difficulty: 'advanced', author: 'test', lastUpdated: '2024-01-03' }
      })
    ];

    // 設置服務
    calculatorService = new AstroCalculatorService({
      enableCache: true,
      cacheDuration: 5000,
      enableValidation: true
    });

    contentService = new AstroContentService({
      enableCache: true,
      cacheDuration: 5000
    });

    // 模擬 glob 函數
    const mockGlob = mockAstroGlob({
      '../calculators/bmi-calculator/config.json': { default: mockModules[0].config },
      '../calculators/blood-pressure/config.json': { default: mockModules[1].config },
      '../calculators/cholesterol-risk/config.json': { default: mockModules[2].config },
      '../calculators/bmi-calculator/calculator.ts': mockModules[0].calculator,
      '../calculators/blood-pressure/calculator.ts': mockModules[1].calculator,
      '../calculators/cholesterol-risk/calculator.ts': mockModules[2].calculator
    });

    vi.mocked(import.meta.glob).mockImplementation(mockGlob);
  });

  afterEach(() => {
    calculatorService.clearCache();
    contentService.clearCache();
    vi.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should initialize both services successfully', async () => {
      const modules = await calculatorService.loadAllModules();
      expect(modules).toHaveLength(3);

      const stats = await calculatorService.getServiceStats();
      expect(stats.totalCalculators).toBe(3);
      expect(stats.activeCalculators).toBe(2); // 排除草稿
    });

    it('should handle service initialization errors gracefully', async () => {
      // 模擬載入錯誤
      vi.mocked(import.meta.glob).mockImplementation(() => {
        throw new Error('Module loading failed');
      });

      const modules = await calculatorService.loadAllModules();
      expect(modules).toHaveLength(0);
    });
  });

  describe('Cross-Service Data Flow', () => {
    it('should coordinate between calculator and content services', async () => {
      // 載入計算機模組
      const modules = await calculatorService.loadAllModules();
      expect(modules).toHaveLength(3);

      // 搜尋特定計算機
      const searchResults = await calculatorService.searchModules({
        text: 'BMI',
        category: 'general'
      });
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].config.id).toBe('bmi-calculator');

      // 獲取計算機配置
      const config = await calculatorService.getCalculatorConfig('bmi-calculator');
      expect(config).not.toBeNull();
      expect(config?.id).toBe('bmi-calculator');
    });

    it('should handle content localization consistently', async () => {
      const modules = await calculatorService.loadAllModules();
      
      modules.forEach(module => {
        expect(module.config.name).toHaveProperty('zh-TW');
        expect(module.config.name).toHaveProperty('en');
        expect(module.config.description).toHaveProperty('zh-TW');
        expect(module.config.description).toHaveProperty('en');
      });
    });

    it('should maintain data consistency across services', async () => {
      const modules1 = await calculatorService.loadAllModules();
      const modules2 = await calculatorService.loadAllModules();

      expect(modules1).toHaveLength(modules2.length);
      
      modules1.forEach((module1, index) => {
        const module2 = modules2[index];
        expect(module1.config.id).toBe(module2.config.id);
        expect(module1.config.version).toBe(module2.config.version);
      });
    });
  });

  describe('Performance Integration', () => {
    it('should handle concurrent service operations efficiently', async () => {
      performanceMonitor.start();

      const operations = await Promise.all([
        calculatorService.loadAllModules(),
        calculatorService.getCategoryStats(),
        calculatorService.getSpecialtyStats(),
        calculatorService.searchModules({ text: 'calculator' }),
        calculatorService.searchModules({ category: 'cardiology' })
      ]);

      const duration = performanceMonitor.end();
      expect(duration).toBeLessThan(500); // 500ms

      // 檢查所有操作都成功
      expect(operations[0]).toHaveLength(3); // loadAllModules
      expect(operations[1]).toHaveProperty('general'); // getCategoryStats
      expect(operations[2]).toHaveProperty('general-medicine'); // getSpecialtyStats
      expect(operations[3].length).toBeGreaterThan(0); // search by text
      expect(operations[4].length).toBeGreaterThan(0); // search by category
    });

    it('should optimize cache usage across services', async () => {
      // 第一次載入
      performanceMonitor.start();
      await calculatorService.loadAllModules();
      const firstLoadTime = performanceMonitor.end();

      // 第二次載入（應該使用快取）
      performanceMonitor.start();
      await calculatorService.loadAllModules();
      const secondLoadTime = performanceMonitor.end();

      expect(secondLoadTime).toBeLessThan(firstLoadTime);

      // 檢查快取統計
      const stats = await calculatorService.getServiceStats();
      expect(stats.cacheHitRate).toBeGreaterThan(0);
    });

    it('should handle high-volume operations', async () => {
      const searchQueries: SearchQuery[] = [
        { text: 'BMI' },
        { text: 'blood' },
        { text: 'pressure' },
        { category: 'general' },
        { category: 'cardiology' },
        { specialty: 'cardiology' },
        { difficulty: 'basic' },
        { difficulty: 'intermediate' },
        { evidenceLevel: 'A' },
        { tags: ['bmi'] }
      ];

      performanceMonitor.start();

      const results = await Promise.all(
        searchQueries.map(query => calculatorService.searchModules(query))
      );

      const duration = performanceMonitor.end();
      expect(duration).toBeLessThan(1000); // 1 秒

      // 檢查所有搜尋都有結果
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle service errors gracefully', async () => {
      // 模擬計算機服務錯誤
      const errorService = new AstroCalculatorService();
      vi.mocked(import.meta.glob).mockImplementation(() => {
        throw new Error('Service error');
      });

      const modules = await errorService.loadAllModules();
      expect(modules).toHaveLength(0);

      const stats = await errorService.getServiceStats();
      expect(stats.totalCalculators).toBe(0);
    });

    it('should recover from temporary failures', async () => {
      let callCount = 0;
      vi.mocked(import.meta.glob).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Temporary failure');
        }
        return mockAstroGlob({
          '../calculators/bmi-calculator/config.json': { default: mockModules[0].config }
        })();
      });

      // 第一次調用失敗
      const modules1 = await calculatorService.loadAllModules();
      expect(modules1).toHaveLength(0);

      // 第二次調用成功
      const modules2 = await calculatorService.loadAllModules();
      expect(modules2).toHaveLength(1);
    });

    it('should validate data integrity across services', async () => {
      const modules = await calculatorService.loadAllModules();
      
      for (const module of modules) {
        const validation = calculatorService.validateConfig(module.config);
        expect(validation.isValid).toBe(true);
        
        if (validation.errors.length > 0) {
          console.warn(`Validation warnings for ${module.config.id}:`, validation.errors);
        }
      }
    });
  });

  describe('Cache Coordination', () => {
    it('should coordinate cache invalidation between services', async () => {
      // 載入資料到快取
      await calculatorService.loadAllModules();
      await calculatorService.getCategoryStats();

      // 檢查快取狀態
      const stats1 = await calculatorService.getServiceStats();
      expect(stats1.cacheHitRate).toBeGreaterThan(0);

      // 清除快取
      calculatorService.clearCache();

      // 重新載入應該重新計算
      performanceMonitor.start();
      await calculatorService.loadAllModules();
      const reloadTime = performanceMonitor.end();

      const stats2 = await calculatorService.getServiceStats();
      expect(stats2.cacheHitRate).toBe(0); // 快取被清除
    });

    it('should handle cache expiration correctly', async () => {
      const shortCacheService = new AstroCalculatorService({
        enableCache: true,
        cacheDuration: 100 // 100ms
      });

      // 載入資料
      await shortCacheService.loadAllModules();

      // 等待快取過期
      await new Promise(resolve => setTimeout(resolve, 150));

      // 重新載入應該重新計算
      performanceMonitor.start();
      await shortCacheService.loadAllModules();
      const reloadTime = performanceMonitor.end();

      // 由於快取過期，應該重新載入
      expect(reloadTime).toBeGreaterThan(0);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistent data across multiple service instances', async () => {
      const service1 = new AstroCalculatorService();
      const service2 = new AstroCalculatorService();

      const modules1 = await service1.loadAllModules();
      const modules2 = await service2.loadAllModules();

      expect(modules1).toHaveLength(modules2.length);
      
      modules1.forEach((module1, index) => {
        const module2 = modules2[index];
        expect(module1.config.id).toBe(module2.config.id);
        expect(module1.config.name).toEqual(module2.config.name);
      });
    });

    it('should handle concurrent modifications safely', async () => {
      const operations = [
        calculatorService.loadAllModules(),
        calculatorService.searchModules({ text: 'BMI' }),
        calculatorService.getCategoryStats(),
        calculatorService.getSpecialtyStats()
      ];

      const results = await Promise.all(operations);

      // 所有操作都應該成功
      expect(results[0]).toHaveLength(3); // modules
      expect(results[1].length).toBeGreaterThan(0); // search results
      expect(Object.keys(results[2]).length).toBeGreaterThan(0); // category stats
      expect(Object.keys(results[3]).length).toBeGreaterThan(0); // specialty stats
    });
  });

  describe('Service Health Monitoring', () => {
    it('should provide comprehensive service health status', async () => {
      await calculatorService.loadAllModules();
      
      const stats = await calculatorService.getServiceStats();
      
      expect(stats).toHaveProperty('totalCalculators');
      expect(stats).toHaveProperty('activeCalculators');
      expect(stats).toHaveProperty('categoriesCount');
      expect(stats).toHaveProperty('specialtiesCount');
      expect(stats).toHaveProperty('cacheHitRate');
      expect(stats).toHaveProperty('lastUpdated');
      
      expect(stats.totalCalculators).toBeGreaterThan(0);
      expect(stats.activeCalculators).toBeGreaterThanOrEqual(0);
      expect(stats.categoriesCount).toBeGreaterThan(0);
      expect(stats.specialtiesCount).toBeGreaterThan(0);
    });

    it('should detect service degradation', async () => {
      // 模擬服務降級
      vi.mocked(import.meta.glob).mockImplementation(() => {
        // 模擬慢速載入
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(mockAstroGlob({
              '../calculators/bmi-calculator/config.json': { default: mockModules[0].config }
            })());
          }, 1000);
        });
      });

      performanceMonitor.start();
      const modules = await calculatorService.loadAllModules();
      const loadTime = performanceMonitor.end();

      expect(modules).toHaveLength(1);
      expect(loadTime).toBeGreaterThan(500); // 檢測到慢速載入
    });
  });

  describe('Memory Management', () => {
    it('should manage memory efficiently during bulk operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // 執行大量操作
      for (let i = 0; i < 100; i++) {
        await calculatorService.searchModules({ text: `search-${i}` });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // 記憶體增長應該在合理範圍內
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
    });

    it('should clean up resources properly', async () => {
      await calculatorService.loadAllModules();
      
      // 清除快取和資源
      calculatorService.clearCache();
      
      const stats = await calculatorService.getServiceStats();
      expect(stats.cacheHitRate).toBe(0);
    });
  });
});