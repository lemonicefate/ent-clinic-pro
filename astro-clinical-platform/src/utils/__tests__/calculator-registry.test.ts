/**
 * 計算機註冊表系統測試
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  CalculatorRegistry,
  createCalculatorRegistry,
  getCalculatorRegistry,
  resetCalculatorRegistry,
  SearchStrategyFactory,
  SortStrategyFactory,
  IndexStrategyFactory,
  ExactMatchSearchStrategy,
  FuzzySearchStrategy,
  SemanticSearchStrategy,
  NameSortStrategy,
  RelevanceSortStrategy,
  PopularitySortStrategy,
  CategoryIndexStrategy,
  TagIndexStrategy,
  SpecialtyIndexStrategy,
  RegistryEventEmitter,
  type RegistryObserver,
  type RegistryEvent,
  type RegistryOptions
} from '../calculator-registry';
import type { CalculatorModule, SearchQuery } from '../../types/calculator';

// Mock 服務
vi.mock('../../services/CalculatorService', () => ({
  calculatorService: {
    loadAllModules: vi.fn()
  }
}));

vi.mock('../../services/ContentService', () => ({
  contentService: {}
}));

describe('Registry Event System', () => {
  let eventEmitter: RegistryEventEmitter;
  let events: RegistryEvent[];
  let observer: RegistryObserver;

  beforeEach(() => {
    eventEmitter = new RegistryEventEmitter();
    events = [];
    observer = {
      onRegistryEvent: (event: RegistryEvent) => events.push(event)
    };
  });

  it('should subscribe and emit events', () => {
    eventEmitter.subscribe(observer);
    
    const event: RegistryEvent = {
      type: 'calculator_added',
      calculatorId: 'test-calc',
      timestamp: Date.now()
    };
    
    eventEmitter.emit(event);
    
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(event);
  });

  it('should unsubscribe observers', () => {
    eventEmitter.subscribe(observer);
    eventEmitter.unsubscribe(observer);
    
    eventEmitter.emit({
      type: 'calculator_added',
      timestamp: Date.now()
    });
    
    expect(events).toHaveLength(0);
  });

  it('should handle observer errors gracefully', () => {
    const errorObserver: RegistryObserver = {
      onRegistryEvent: () => {
        throw new Error('Observer error');
      }
    };
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    eventEmitter.subscribe(errorObserver);
    eventEmitter.subscribe(observer);
    
    eventEmitter.emit({
      type: 'calculator_added',
      timestamp: Date.now()
    });
    
    expect(consoleSpy).toHaveBeenCalled();
    expect(events).toHaveLength(1); // 正常觀察者仍然收到事件
    
    consoleSpy.mockRestore();
  });
});

describe('Search Strategies', () => {
  let mockModules: CalculatorModule[];

  beforeEach(() => {
    mockModules = [
      {
        config: {
          id: 'bmi-calculator',
          name: { 'zh-TW': 'BMI 計算機', 'en': 'BMI Calculator' },
          description: { 'zh-TW': '計算身體質量指數', 'en': 'Calculate Body Mass Index' },
          category: 'general',
          metadata: {
            tags: ['bmi', 'weight', 'health'],
            difficulty: 'basic' as const,
            author: 'test',
            lastUpdated: '2024-01-01'
          },
          medical: {
            specialty: ['general-medicine'],
            evidenceLevel: 'A' as const
          }
        }
      } as CalculatorModule,
      {
        config: {
          id: 'blood-pressure',
          name: { 'zh-TW': '血壓分類', 'en': 'Blood Pressure Classification' },
          description: { 'zh-TW': '血壓分類和風險評估', 'en': 'Blood pressure classification and risk assessment' },
          category: 'cardiology',
          metadata: {
            tags: ['blood-pressure', 'hypertension', 'cardiovascular'],
            difficulty: 'intermediate' as const,
            author: 'test',
            lastUpdated: '2024-01-02'
          },
          medical: {
            specialty: ['cardiology'],
            evidenceLevel: 'A' as const
          }
        }
      } as CalculatorModule
    ];
  });

  describe('ExactMatchSearchStrategy', () => {
    let strategy: ExactMatchSearchStrategy;

    beforeEach(() => {
      strategy = new ExactMatchSearchStrategy();
    });

    it('should return strategy name', () => {
      expect(strategy.getName()).toBe('exact_match');
    });

    it('should find exact name matches', () => {
      const query: SearchQuery = { text: 'BMI Calculator' };
      const results = strategy.search(mockModules, query);
      
      expect(results).toHaveLength(1);
      expect(results[0].config.id).toBe('bmi-calculator');
    });

    it('should find exact ID matches', () => {
      const query: SearchQuery = { text: 'blood-pressure' };
      const results = strategy.search(mockModules, query);
      
      expect(results).toHaveLength(1);
      expect(results[0].config.id).toBe('blood-pressure');
    });

    it('should not find partial matches', () => {
      const query: SearchQuery = { text: 'BMI' };
      const results = strategy.search(mockModules, query);
      
      expect(results).toHaveLength(0);
    });

    it('should return all modules when no text query', () => {
      const query: SearchQuery = {};
      const results = strategy.search(mockModules, query);
      
      expect(results).toHaveLength(2);
    });
  });

  describe('FuzzySearchStrategy', () => {
    let strategy: FuzzySearchStrategy;

    beforeEach(() => {
      strategy = new FuzzySearchStrategy();
    });

    it('should return strategy name', () => {
      expect(strategy.getName()).toBe('fuzzy');
    });

    it('should find partial name matches', () => {
      const query: SearchQuery = { text: 'BMI' };
      const results = strategy.search(mockModules, query);
      
      expect(results).toHaveLength(1);
      expect(results[0].config.id).toBe('bmi-calculator');
    });

    it('should find description matches', () => {
      const query: SearchQuery = { text: '身體質量' };
      const results = strategy.search(mockModules, query);
      
      expect(results).toHaveLength(1);
      expect(results[0].config.id).toBe('bmi-calculator');
    });

    it('should find tag matches', () => {
      const query: SearchQuery = { text: 'hypertension' };
      const results = strategy.search(mockModules, query);
      
      expect(results).toHaveLength(1);
      expect(results[0].config.id).toBe('blood-pressure');
    });

    it('should find specialty matches', () => {
      const query: SearchQuery = { text: 'cardiology' };
      const results = strategy.search(mockModules, query);
      
      expect(results).toHaveLength(1);
      expect(results[0].config.id).toBe('blood-pressure');
    });

    it('should be case insensitive', () => {
      const query: SearchQuery = { text: 'BLOOD' };
      const results = strategy.search(mockModules, query);
      
      expect(results).toHaveLength(1);
      expect(results[0].config.id).toBe('blood-pressure');
    });
  });

  describe('SemanticSearchStrategy', () => {
    let strategy: SemanticSearchStrategy;

    beforeEach(() => {
      strategy = new SemanticSearchStrategy();
    });

    it('should return strategy name', () => {
      expect(strategy.getName()).toBe('semantic');
    });

    it('should find synonym matches', () => {
      const query: SearchQuery = { text: 'body mass index' };
      const results = strategy.search(mockModules, query);
      
      expect(results).toHaveLength(1);
      expect(results[0].config.id).toBe('bmi-calculator');
    });

    it('should find Chinese synonym matches', () => {
      const query: SearchQuery = { text: '體重指數' };
      const results = strategy.search(mockModules, query);
      
      expect(results).toHaveLength(1);
      expect(results[0].config.id).toBe('bmi-calculator');
    });

    it('should find blood pressure synonyms', () => {
      const query: SearchQuery = { text: 'bp' };
      const results = strategy.search(mockModules, query);
      
      expect(results).toHaveLength(1);
      expect(results[0].config.id).toBe('blood-pressure');
    });
  });
});

describe('Sort Strategies', () => {
  let mockModules: CalculatorModule[];

  beforeEach(() => {
    mockModules = [
      {
        config: {
          id: 'z-calculator',
          name: { 'zh-TW': 'Z 計算機', 'en': 'Z Calculator' },
          metadata: {
            lastUpdated: '2024-01-01',
            difficulty: 'basic' as const,
            author: 'test',
            tags: []
          },
          medical: {
            specialty: [],
            evidenceLevel: 'C' as const
          }
        }
      } as CalculatorModule,
      {
        config: {
          id: 'a-calculator',
          name: { 'zh-TW': 'A 計算機', 'en': 'A Calculator' },
          metadata: {
            lastUpdated: '2024-01-02',
            difficulty: 'advanced' as const,
            author: 'test',
            tags: []
          },
          medical: {
            specialty: [],
            evidenceLevel: 'A' as const
          }
        }
      } as CalculatorModule
    ];
  });

  describe('NameSortStrategy', () => {
    let strategy: NameSortStrategy;

    beforeEach(() => {
      strategy = new NameSortStrategy();
    });

    it('should return strategy name', () => {
      expect(strategy.getName()).toBe('name');
    });

    it('should sort by name ascending', () => {
      const results = strategy.sort(mockModules, 'asc');
      
      expect(results[0].config.name['zh-TW']).toBe('A 計算機');
      expect(results[1].config.name['zh-TW']).toBe('Z 計算機');
    });

    it('should sort by name descending', () => {
      const results = strategy.sort(mockModules, 'desc');
      
      expect(results[0].config.name['zh-TW']).toBe('Z 計算機');
      expect(results[1].config.name['zh-TW']).toBe('A 計算機');
    });
  });

  describe('RelevanceSortStrategy', () => {
    it('should return strategy name', () => {
      const strategy = new RelevanceSortStrategy();
      expect(strategy.getName()).toBe('relevance');
    });

    it('should sort by relevance score', () => {
      const strategy = new RelevanceSortStrategy('A Calculator');
      const results = strategy.sort(mockModules, 'asc');
      
      // A Calculator 應該排在前面因為名稱完全匹配
      expect(results[0].config.id).toBe('a-calculator');
    });

    it('should handle no search query', () => {
      const strategy = new RelevanceSortStrategy();
      const results = strategy.sort(mockModules, 'asc');
      
      expect(results).toHaveLength(2);
    });
  });

  describe('PopularitySortStrategy', () => {
    let strategy: PopularitySortStrategy;

    beforeEach(() => {
      strategy = new PopularitySortStrategy();
    });

    it('should return strategy name', () => {
      expect(strategy.getName()).toBe('popularity');
    });

    it('should sort by evidence level and update time', () => {
      const results = strategy.sort(mockModules, 'asc');
      
      // A 證據等級的應該排在前面
      expect(results[0].config.medical.evidenceLevel).toBe('A');
    });
  });
});

describe('Index Strategies', () => {
  let mockModules: CalculatorModule[];

  beforeEach(() => {
    mockModules = [
      {
        config: {
          id: 'calc1',
          category: 'cardiology',
          metadata: {
            tags: ['heart', 'blood'],
            author: 'test',
            lastUpdated: '2024-01-01',
            difficulty: 'basic' as const
          },
          medical: {
            specialty: ['cardiology', 'internal-medicine'],
            evidenceLevel: 'A' as const
          }
        }
      } as CalculatorModule,
      {
        config: {
          id: 'calc2',
          category: 'general',
          metadata: {
            tags: ['general', 'basic'],
            author: 'test',
            lastUpdated: '2024-01-01',
            difficulty: 'basic' as const
          },
          medical: {
            specialty: ['general-medicine'],
            evidenceLevel: 'A' as const
          }
        }
      } as CalculatorModule
    ];
  });

  describe('CategoryIndexStrategy', () => {
    let strategy: CategoryIndexStrategy;

    beforeEach(() => {
      strategy = new CategoryIndexStrategy();
    });

    it('should return strategy name', () => {
      expect(strategy.getName()).toBe('category');
    });

    it('should build category index', () => {
      const index = strategy.buildIndex(mockModules);
      
      expect(index.has('cardiology')).toBe(true);
      expect(index.has('general')).toBe(true);
      expect(index.get('cardiology')).toHaveLength(1);
      expect(index.get('general')).toHaveLength(1);
    });
  });

  describe('TagIndexStrategy', () => {
    let strategy: TagIndexStrategy;

    beforeEach(() => {
      strategy = new TagIndexStrategy();
    });

    it('should return strategy name', () => {
      expect(strategy.getName()).toBe('tag');
    });

    it('should build tag index', () => {
      const index = strategy.buildIndex(mockModules);
      
      expect(index.has('heart')).toBe(true);
      expect(index.has('blood')).toBe(true);
      expect(index.has('general')).toBe(true);
      expect(index.has('basic')).toBe(true);
      expect(index.get('basic')).toHaveLength(1);
    });
  });

  describe('SpecialtyIndexStrategy', () => {
    let strategy: SpecialtyIndexStrategy;

    beforeEach(() => {
      strategy = new SpecialtyIndexStrategy();
    });

    it('should return strategy name', () => {
      expect(strategy.getName()).toBe('specialty');
    });

    it('should build specialty index', () => {
      const index = strategy.buildIndex(mockModules);
      
      expect(index.has('cardiology')).toBe(true);
      expect(index.has('internal-medicine')).toBe(true);
      expect(index.has('general-medicine')).toBe(true);
      expect(index.get('cardiology')).toHaveLength(1);
      expect(index.get('internal-medicine')).toHaveLength(1);
    });
  });
});

describe('Strategy Factories', () => {
  describe('SearchStrategyFactory', () => {
    it('should create exact search strategy', () => {
      const strategy = SearchStrategyFactory.create('exact');
      expect(strategy).toBeInstanceOf(ExactMatchSearchStrategy);
    });

    it('should create fuzzy search strategy', () => {
      const strategy = SearchStrategyFactory.create('fuzzy');
      expect(strategy).toBeInstanceOf(FuzzySearchStrategy);
    });

    it('should create semantic search strategy', () => {
      const strategy = SearchStrategyFactory.create('semantic');
      expect(strategy).toBeInstanceOf(SemanticSearchStrategy);
    });

    it('should throw error for unknown strategy', () => {
      expect(() => SearchStrategyFactory.create('unknown')).toThrow('Unknown search strategy: unknown');
    });

    it('should register custom strategy', () => {
      class CustomStrategy implements import('../calculator-registry').SearchStrategy {
        getName() { return 'custom'; }
        search() { return []; }
      }

      SearchStrategyFactory.register('custom', () => new CustomStrategy());
      const strategy = SearchStrategyFactory.create('custom');
      expect(strategy).toBeInstanceOf(CustomStrategy);
    });

    it('should get available types', () => {
      const types = SearchStrategyFactory.getAvailableTypes();
      expect(types).toContain('exact');
      expect(types).toContain('fuzzy');
      expect(types).toContain('semantic');
    });
  });

  describe('SortStrategyFactory', () => {
    it('should create name sort strategy', () => {
      const strategy = SortStrategyFactory.create('name');
      expect(strategy).toBeInstanceOf(NameSortStrategy);
    });

    it('should create relevance sort strategy', () => {
      const strategy = SortStrategyFactory.create('relevance', 'test query');
      expect(strategy).toBeInstanceOf(RelevanceSortStrategy);
    });

    it('should create popularity sort strategy', () => {
      const strategy = SortStrategyFactory.create('popularity');
      expect(strategy).toBeInstanceOf(PopularitySortStrategy);
    });

    it('should throw error for unknown strategy', () => {
      expect(() => SortStrategyFactory.create('unknown')).toThrow('Unknown sort strategy: unknown');
    });
  });

  describe('IndexStrategyFactory', () => {
    it('should create category index strategy', () => {
      const strategy = IndexStrategyFactory.create('category');
      expect(strategy).toBeInstanceOf(CategoryIndexStrategy);
    });

    it('should create tag index strategy', () => {
      const strategy = IndexStrategyFactory.create('tag');
      expect(strategy).toBeInstanceOf(TagIndexStrategy);
    });

    it('should create specialty index strategy', () => {
      const strategy = IndexStrategyFactory.create('specialty');
      expect(strategy).toBeInstanceOf(SpecialtyIndexStrategy);
    });

    it('should throw error for unknown strategy', () => {
      expect(() => IndexStrategyFactory.create('unknown')).toThrow('Unknown index strategy: unknown');
    });
  });
});

describe('CalculatorRegistry', () => {
  let registry: CalculatorRegistry;
  let mockModules: CalculatorModule[];

  beforeEach(async () => {
    mockModules = [
      {
        config: {
          id: 'test-calc-1',
          name: { 'zh-TW': '測試計算機 1', 'en': 'Test Calculator 1' },
          description: { 'zh-TW': '測試描述 1', 'en': 'Test description 1' },
          category: 'general',
          status: 'published' as const,
          version: '1.0.0',
          fields: [],
          calculation: { functionName: 'test' },
          metadata: {
            tags: ['test', 'general'],
            difficulty: 'basic' as const,
            author: 'test',
            lastUpdated: '2024-01-01'
          },
          medical: {
            specialty: ['general-medicine'],
            evidenceLevel: 'A' as const
          }
        }
      } as CalculatorModule,
      {
        config: {
          id: 'test-calc-2',
          name: { 'zh-TW': '測試計算機 2', 'en': 'Test Calculator 2' },
          description: { 'zh-TW': '測試描述 2', 'en': 'Test description 2' },
          category: 'cardiology',
          status: 'draft' as const,
          version: '1.0.0',
          fields: [],
          calculation: { functionName: 'test' },
          metadata: {
            tags: ['test', 'cardiology'],
            difficulty: 'intermediate' as const,
            author: 'test',
            lastUpdated: '2024-01-02'
          },
          medical: {
            specialty: ['cardiology'],
            evidenceLevel: 'B' as const
          }
        }
      } as CalculatorModule
    ];

    // Mock calculatorService
    const { calculatorService } = await import('../../services/CalculatorService');
    vi.mocked(calculatorService.loadAllModules).mockResolvedValue(mockModules);

    registry = new CalculatorRegistry({
      enableCache: true,
      includeDrafts: true,
      enableEvents: true
    });

    await registry.initialize();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with modules', async () => {
      const stats = await registry.getRegistryStats();
      expect(stats.totalCalculators).toBe(2);
      expect(stats.activeCalculators).toBe(1);
      expect(stats.draftCalculators).toBe(1);
    });

    it('should build indices', async () => {
      const categoryStats = await registry.getCategoryStats();
      expect(categoryStats['general']).toBe(1);
      expect(categoryStats['cardiology']).toBe(1);

      const tagStats = await registry.getTagStats();
      expect(tagStats['test']).toBe(2);
      expect(tagStats['general']).toBe(1);
      expect(tagStats['cardiology']).toBe(1);
    });

    it('should exclude drafts when configured', async () => {
      const registryNoDrafts = new CalculatorRegistry({
        includeDrafts: false
      });
      await registryNoDrafts.initialize();

      const stats = await registryNoDrafts.getRegistryStats();
      expect(stats.totalCalculators).toBe(1);
      expect(stats.draftCalculators).toBe(0);
    });
  });

  describe('Search Functionality', () => {
    it('should search by text using default strategy', async () => {
      const results = await registry.search({ text: '測試' });
      expect(results).toHaveLength(2);
    });

    it('should search by category', async () => {
      const results = await registry.search({ category: 'general' });
      expect(results).toHaveLength(1);
      expect(results[0].config.id).toBe('test-calc-1');
    });

    it('should search by specialty', async () => {
      const results = await registry.search({ specialty: 'cardiology' });
      expect(results).toHaveLength(1);
      expect(results[0].config.id).toBe('test-calc-2');
    });

    it('should search by tags', async () => {
      const results = await registry.search({ tags: ['cardiology'] });
      expect(results).toHaveLength(1);
      expect(results[0].config.id).toBe('test-calc-2');
    });

    it('should search by difficulty', async () => {
      const results = await registry.search({ difficulty: 'basic' });
      expect(results).toHaveLength(1);
      expect(results[0].config.id).toBe('test-calc-1');
    });

    it('should search by evidence level', async () => {
      const results = await registry.search({ evidenceLevel: 'A' });
      expect(results).toHaveLength(1);
      expect(results[0].config.id).toBe('test-calc-1');
    });

    it('should use custom search strategy', async () => {
      const results = await registry.search({ 
        text: 'Test Calculator 1',
        searchStrategy: 'exact'
      });
      expect(results).toHaveLength(1);
      expect(results[0].config.id).toBe('test-calc-1');
    });

    it('should sort results', async () => {
      const results = await registry.search({ 
        sortBy: 'name',
        sortOrder: 'asc'
      });
      expect(results[0].config.name['zh-TW']).toBe('測試計算機 1');
      expect(results[1].config.name['zh-TW']).toBe('測試計算機 2');
    });

    it('should paginate results', async () => {
      const results = await registry.search({ 
        limit: 1,
        page: 0
      });
      expect(results).toHaveLength(1);

      const results2 = await registry.search({ 
        limit: 1,
        page: 1
      });
      expect(results2).toHaveLength(1);
      expect(results2[0].config.id).not.toBe(results[0].config.id);
    });

    it('should record search metrics', async () => {
      await registry.search({ text: 'test' });
      await registry.search({ text: 'another' });

      const stats = await registry.getRegistryStats();
      expect(stats.searchPerformance.totalSearches).toBe(2);
      expect(stats.searchPerformance.averageSearchTime).toBeGreaterThan(0);
    });
  });

  describe('Event System', () => {
    it('should emit search events', async () => {
      const events: RegistryEvent[] = [];
      const observer: RegistryObserver = {
        onRegistryEvent: (event) => events.push(event)
      };

      registry.subscribe(observer);
      await registry.search({ text: 'test' });

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('search_performed');
    });

    it('should emit index rebuild events', async () => {
      const events: RegistryEvent[] = [];
      const observer: RegistryObserver = {
        onRegistryEvent: (event) => events.push(event)
      };

      registry.subscribe(observer);
      await registry.rebuildIndex();

      const rebuildEvents = events.filter(e => e.type === 'index_rebuilt');
      expect(rebuildEvents.length).toBeGreaterThan(0);
    });

    it('should limit number of observers', () => {
      const smallRegistry = new CalculatorRegistry({ maxObservers: 1 });
      const observer1: RegistryObserver = { onRegistryEvent: () => {} };
      const observer2: RegistryObserver = { onRegistryEvent: () => {} };

      smallRegistry.subscribe(observer1);
      expect(() => smallRegistry.subscribe(observer2)).toThrow('Maximum number of observers');
    });
  });

  describe('Strategy Management', () => {
    it('should get available strategies', () => {
      const searchStrategies = registry.getAvailableSearchStrategies();
      expect(searchStrategies).toContain('exact');
      expect(searchStrategies).toContain('fuzzy');
      expect(searchStrategies).toContain('semantic');

      const sortStrategies = registry.getAvailableSortStrategies();
      expect(sortStrategies).toContain('name');
      expect(sortStrategies).toContain('relevance');
      expect(sortStrategies).toContain('popularity');

      const indexStrategies = registry.getAvailableIndexStrategies();
      expect(indexStrategies).toContain('category');
      expect(indexStrategies).toContain('tag');
      expect(indexStrategies).toContain('specialty');
    });

    it('should register custom strategies', () => {
      class CustomSearchStrategy implements import('../calculator-registry').SearchStrategy {
        getName() { return 'custom'; }
        search() { return []; }
      }

      registry.registerSearchStrategy('custom', () => new CustomSearchStrategy());
      const strategies = registry.getAvailableSearchStrategies();
      expect(strategies).toContain('custom');
    });
  });

  describe('Configuration Updates', () => {
    it('should update options', () => {
      registry.updateOptions({ 
        defaultSearchStrategy: 'exact',
        enableEvents: false
      });

      expect(registry['options'].defaultSearchStrategy).toBe('exact');
      expect(registry['options'].enableEvents).toBe(false);
    });

    it('should rebuild index when index strategies change', async () => {
      const spy = vi.spyOn(registry, 'rebuildIndex');
      
      registry.updateOptions({ 
        indexStrategies: ['category'] // 移除 tag 和 specialty
      });

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Health Status', () => {
    it('should report healthy status', async () => {
      const health = await registry.getHealthStatus();
      expect(health.isHealthy).toBe(true);
      expect(health.issues).toHaveLength(0);
    });

    it('should detect empty registry', async () => {
      const emptyRegistry = new CalculatorRegistry();
      vi.mocked(calculatorService.loadAllModules).mockResolvedValue([]);
      await emptyRegistry.initialize();

      const health = await emptyRegistry.getHealthStatus();
      expect(health.isHealthy).toBe(false);
      expect(health.issues).toContain('No calculators found in registry');
    });

    it('should detect slow search performance', async () => {
      // 模擬慢速搜尋
      registry['searchMetrics'].totalSearches = 10;
      registry['searchMetrics'].totalSearchTime = 2000; // 200ms 平均

      const health = await registry.getHealthStatus();
      expect(health.isHealthy).toBe(false);
      expect(health.issues).toContain('Average search time is high');
    });
  });

  describe('Utility Methods', () => {
    it('should validate calculator config', () => {
      const validConfig = mockModules[0].config;
      const result = registry.validateConfig(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid config', () => {
      const invalidConfig = {
        ...mockModules[0].config,
        id: '', // 無效的 ID
        version: 'invalid' // 無效的版本號
      };

      const result = registry.validateConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should check if ID exists', () => {
      expect(registry.isIdExists('test-calc-1')).toBe(true);
      expect(registry.isIdExists('non-existent')).toBe(false);
    });

    it('should get similar calculators', async () => {
      const similar = await registry.getSimilarCalculators('test-calc-1', 5);
      expect(similar).toHaveLength(1);
      expect(similar[0].config.id).toBe('test-calc-2');
    });

    it('should export registry data', async () => {
      const exported = await registry.export();
      expect(exported.calculators).toHaveLength(2);
      expect(exported.stats).toBeDefined();
      expect(exported.timestamp).toBeDefined();
    });

    it('should serialize registry', async () => {
      const serialized = await registry.serialize();
      const parsed = JSON.parse(serialized);
      expect(parsed.calculators).toHaveLength(2);
    });
  });
});

describe('Registry Singleton', () => {
  afterEach(() => {
    resetCalculatorRegistry();
  });

  it('should create singleton instance', async () => {
    const registry1 = await getCalculatorRegistry();
    const registry2 = await getCalculatorRegistry();
    expect(registry1).toBe(registry2);
  });

  it('should reset singleton', async () => {
    const registry1 = await getCalculatorRegistry();
    resetCalculatorRegistry();
    const registry2 = await getCalculatorRegistry();
    expect(registry1).not.toBe(registry2);
  });

  it('should create new instance', async () => {
    const registry1 = await getCalculatorRegistry();
    const registry2 = await createCalculatorRegistry();
    expect(registry1).not.toBe(registry2);
  });
});