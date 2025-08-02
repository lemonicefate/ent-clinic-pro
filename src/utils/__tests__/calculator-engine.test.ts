/**
 * 計算引擎核心測試
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  CalculatorEngine,
  createCalculatorEngine,
  Success,
  Failure,
  success,
  failure,
  CalculationError,
  ValidationError,
  CalculatorNotFoundError,
  RequiredFieldValidator,
  NumericRangeValidator,
  TypeValidator,
  EnumValidator,
  CustomValidator,
  ValidationHandlerFactory,
  MemoryCacheStrategy,
  LRUCacheStrategy,
  NoCacheStrategy,
  CalculationConfigBuilder,
  StandardCalculationCommand
} from '../calculator-engine';
import type { 
  CalculatorConfig, 
  CalculationInput, 
  CalculationResult,
  CalculationObserver,
  CalculationEvent
} from '../../types/calculator';

describe('Result Pattern', () => {
  describe('Success', () => {
    it('should create success result', () => {
      const result = success(42);
      expect(result.isSuccess()).toBe(true);
      expect(result.isFailure()).toBe(false);
      expect(result.getOrElse(0)).toBe(42);
      expect(result.getOrThrow()).toBe(42);
    });

    it('should map values correctly', () => {
      const result = success(5);
      const mapped = result.map(x => x * 2);
      expect(mapped.isSuccess()).toBe(true);
      expect(mapped.getOrThrow()).toBe(10);
    });

    it('should flatMap correctly', () => {
      const result = success(5);
      const flatMapped = result.flatMap(x => success(x * 3));
      expect(flatMapped.isSuccess()).toBe(true);
      expect(flatMapped.getOrThrow()).toBe(15);
    });
  });

  describe('Failure', () => {
    it('should create failure result', () => {
      const error = new Error('test error');
      const result = failure(error);
      expect(result.isSuccess()).toBe(false);
      expect(result.isFailure()).toBe(true);
      expect(result.getOrElse('default')).toBe('default');
      expect(() => result.getOrThrow()).toThrow('test error');
    });

    it('should not map values', () => {
      const error = new Error('test error');
      const result = failure(error);
      const mapped = result.map(x => x * 2);
      expect(mapped.isFailure()).toBe(true);
      expect(mapped.error).toBe(error);
    });
  });
});

describe('Validation System', () => {
  describe('RequiredFieldValidator', () => {
    it('should validate required fields', () => {
      const validator = new RequiredFieldValidator();
      const request = {
        fieldName: 'weight',
        value: 70,
        input: { weight: 70 },
        config: {} as CalculatorConfig
      };

      const result = validator.handle(request);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for missing fields', () => {
      const validator = new RequiredFieldValidator();
      const request = {
        fieldName: 'weight',
        value: null,
        input: { weight: null },
        config: {} as CalculatorConfig
      };

      const result = validator.handle(request);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('required');
    });
  });

  describe('NumericRangeValidator', () => {
    it('should validate numeric ranges', () => {
      const validator = new NumericRangeValidator(0, 100);
      const request = {
        fieldName: 'weight',
        value: 70,
        input: { weight: 70 },
        config: {} as CalculatorConfig
      };

      const result = validator.handle(request);
      expect(result.isValid).toBe(true);
    });

    it('should fail for out of range values', () => {
      const validator = new NumericRangeValidator(0, 100);
      const request = {
        fieldName: 'weight',
        value: 150,
        input: { weight: 150 },
        config: {} as CalculatorConfig
      };

      const result = validator.handle(request);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('between 0 and 100');
    });

    it('should fail for non-numeric values', () => {
      const validator = new NumericRangeValidator(0, 100);
      const request = {
        fieldName: 'weight',
        value: 'invalid',
        input: { weight: 'invalid' },
        config: {} as CalculatorConfig
      };

      const result = validator.handle(request);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('valid number');
    });
  });

  describe('TypeValidator', () => {
    it('should validate correct types', () => {
      const validator = new TypeValidator('string');
      const request = {
        fieldName: 'name',
        value: 'John',
        input: { name: 'John' },
        config: {} as CalculatorConfig
      };

      const result = validator.handle(request);
      expect(result.isValid).toBe(true);
    });

    it('should fail for incorrect types', () => {
      const validator = new TypeValidator('string');
      const request = {
        fieldName: 'name',
        value: 123,
        input: { name: 123 },
        config: {} as CalculatorConfig
      };

      const result = validator.handle(request);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('type string');
    });
  });

  describe('EnumValidator', () => {
    it('should validate enum values', () => {
      const validator = new EnumValidator(['male', 'female', 'other']);
      const request = {
        fieldName: 'gender',
        value: 'male',
        input: { gender: 'male' },
        config: {} as CalculatorConfig
      };

      const result = validator.handle(request);
      expect(result.isValid).toBe(true);
    });

    it('should fail for invalid enum values', () => {
      const validator = new EnumValidator(['male', 'female', 'other']);
      const request = {
        fieldName: 'gender',
        value: 'invalid',
        input: { gender: 'invalid' },
        config: {} as CalculatorConfig
      };

      const result = validator.handle(request);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('one of: male, female, other');
    });
  });

  describe('ValidationHandlerFactory', () => {
    it('should create validation chains', () => {
      const chain = ValidationHandlerFactory.createChain(
        ValidationHandlerFactory.createRequiredField(),
        ValidationHandlerFactory.createNumericRange(0, 100)
      );

      const request = {
        fieldName: 'weight',
        value: 70,
        input: { weight: 70 },
        config: {} as CalculatorConfig
      };

      const result = chain.handle(request);
      expect(result.isValid).toBe(true);
    });

    it('should fail chain validation when any validator fails', () => {
      const chain = ValidationHandlerFactory.createChain(
        ValidationHandlerFactory.createRequiredField(),
        ValidationHandlerFactory.createNumericRange(0, 50)
      );

      const request = {
        fieldName: 'weight',
        value: 70,
        input: { weight: 70 },
        config: {} as CalculatorConfig
      };

      const result = chain.handle(request);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });
});

describe('Cache Strategies', () => {
  describe('MemoryCacheStrategy', () => {
    let cache: MemoryCacheStrategy;

    beforeEach(() => {
      cache = new MemoryCacheStrategy(1000); // 1 second TTL for testing
    });

    it('should store and retrieve values', async () => {
      const result: CalculationResult = { value: 25, unit: 'kg/m²' };
      await cache.set('test-key', result);
      
      const retrieved = await cache.get('test-key');
      expect(retrieved).toEqual(result);
    });

    it('should return null for non-existent keys', async () => {
      const retrieved = await cache.get('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should expire values after TTL', async () => {
      const result: CalculationResult = { value: 25, unit: 'kg/m²' };
      await cache.set('test-key', result, 100); // 100ms TTL
      
      // Should exist immediately
      let retrieved = await cache.get('test-key');
      expect(retrieved).toEqual(result);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      retrieved = await cache.get('test-key');
      expect(retrieved).toBeNull();
    });

    it('should clear all values', async () => {
      const result: CalculationResult = { value: 25, unit: 'kg/m²' };
      await cache.set('test-key-1', result);
      await cache.set('test-key-2', result);
      
      await cache.clear();
      
      expect(await cache.get('test-key-1')).toBeNull();
      expect(await cache.get('test-key-2')).toBeNull();
      expect(await cache.size()).toBe(0);
    });
  });

  describe('LRUCacheStrategy', () => {
    let cache: LRUCacheStrategy;

    beforeEach(() => {
      cache = new LRUCacheStrategy(2, 5000); // Max 2 items, 5 second TTL
    });

    it('should evict least recently used items', async () => {
      const result1: CalculationResult = { value: 25, unit: 'kg/m²' };
      const result2: CalculationResult = { value: 30, unit: 'kg/m²' };
      const result3: CalculationResult = { value: 35, unit: 'kg/m²' };
      
      await cache.set('key1', result1);
      await cache.set('key2', result2);
      
      // Access key1 to make it more recently used
      await cache.get('key1');
      
      // Add key3, should evict key2 (least recently used)
      await cache.set('key3', result3);
      
      expect(await cache.get('key1')).toEqual(result1);
      expect(await cache.get('key2')).toBeNull();
      expect(await cache.get('key3')).toEqual(result3);
    });
  });

  describe('NoCacheStrategy', () => {
    let cache: NoCacheStrategy;

    beforeEach(() => {
      cache = new NoCacheStrategy();
    });

    it('should never store or retrieve values', async () => {
      const result: CalculationResult = { value: 25, unit: 'kg/m²' };
      await cache.set('test-key', result);
      
      const retrieved = await cache.get('test-key');
      expect(retrieved).toBeNull();
      expect(await cache.size()).toBe(0);
    });
  });
});

describe('CalculatorEngine', () => {
  let engine: CalculatorEngine;
  let mockCalculator: CalculatorConfig;

  beforeEach(() => {
    engine = createCalculatorEngine({
      cacheStrategy: new MemoryCacheStrategy(),
      enableEvents: true,
      maxHistorySize: 10
    });

    mockCalculator = {
      id: 'test-calculator',
      name: 'Test Calculator',
      description: 'A test calculator',
      category: 'test',
      version: '1.0.0',
      requiredFields: ['weight', 'height'],
      calculate: vi.fn().mockResolvedValue({ value: 25, unit: 'kg/m²' }),
      cacheEnabled: true
    };
  });

  describe('Calculator Registration', () => {
    it('should register calculator successfully', () => {
      const result = engine.register(mockCalculator);
      expect(result.isSuccess()).toBe(true);
      
      const calculators = engine.getRegisteredCalculators();
      expect(calculators).toHaveLength(1);
      expect(calculators[0].id).toBe('test-calculator');
    });

    it('should fail to register duplicate calculator', () => {
      engine.register(mockCalculator);
      const result = engine.register(mockCalculator);
      
      expect(result.isFailure()).toBe(true);
      expect(result.error.code).toBe('DUPLICATE_CALCULATOR');
    });

    it('should fail to register invalid calculator', () => {
      const invalidCalculator = {
        id: '',
        name: 'Test',
        calculate: vi.fn()
      } as CalculatorConfig;

      const result = engine.register(invalidCalculator);
      expect(result.isFailure()).toBe(true);
      expect(result.error.code).toBe('INVALID_CONFIG');
    });

    it('should unregister calculator', () => {
      engine.register(mockCalculator);
      const result = engine.unregister('test-calculator');
      
      expect(result.isSuccess()).toBe(true);
      expect(engine.getRegisteredCalculators()).toHaveLength(0);
    });

    it('should fail to unregister non-existent calculator', () => {
      const result = engine.unregister('non-existent');
      expect(result.isFailure()).toBe(true);
      expect(result.error).toBeInstanceOf(CalculatorNotFoundError);
    });
  });

  describe('Calculation Execution', () => {
    beforeEach(() => {
      engine.register(mockCalculator);
    });

    it('should execute calculation successfully', async () => {
      const input = { weight: 70, height: 175 };
      const result = await engine.calculate('test-calculator', input);
      
      expect(result.isSuccess()).toBe(true);
      expect(result.value).toEqual({ value: 25, unit: 'kg/m²' });
      expect(mockCalculator.calculate).toHaveBeenCalledWith(input);
    });

    it('should fail for non-existent calculator', async () => {
      const input = { weight: 70, height: 175 };
      const result = await engine.calculate('non-existent', input);
      
      expect(result.isFailure()).toBe(true);
      expect(result.error).toBeInstanceOf(CalculatorNotFoundError);
    });

    it('should validate required fields', async () => {
      const input = { weight: 70 }; // missing height
      const result = await engine.calculate('test-calculator', input);
      
      expect(result.isFailure()).toBe(true);
      expect(result.error.code).toBe('VALIDATION_FAILED');
    });

    it('should use cache for repeated calculations', async () => {
      const input = { weight: 70, height: 175 };
      
      // First calculation
      const result1 = await engine.calculate('test-calculator', input);
      expect(result1.isSuccess()).toBe(true);
      expect(mockCalculator.calculate).toHaveBeenCalledTimes(1);
      
      // Second calculation should use cache
      const result2 = await engine.calculate('test-calculator', input);
      expect(result2.isSuccess()).toBe(true);
      expect(result2.value).toEqual(result1.value);
      expect(mockCalculator.calculate).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should handle calculation errors', async () => {
      const errorCalculator = {
        ...mockCalculator,
        id: 'error-calculator',
        calculate: vi.fn().mockRejectedValue(new Error('Calculation failed'))
      };
      
      engine.register(errorCalculator);
      
      const input = { weight: 70, height: 175 };
      const result = await engine.calculate('error-calculator', input);
      
      expect(result.isFailure()).toBe(true);
      expect(result.error.message).toContain('Calculation failed');
    });
  });

  describe('Event System', () => {
    let events: CalculationEvent[];
    let observer: CalculationObserver;

    beforeEach(() => {
      events = [];
      observer = {
        onEvent: (event: CalculationEvent) => events.push(event)
      };
      
      engine.subscribe(observer);
      engine.register(mockCalculator);
    });

    it('should emit calculation events', async () => {
      const input = { weight: 70, height: 175 };
      await engine.calculate('test-calculator', input);
      
      expect(events).toHaveLength(3); // started, cache_miss, completed
      expect(events[0].type).toBe('calculation_started');
      expect(events[1].type).toBe('cache_miss');
      expect(events[2].type).toBe('calculation_completed');
    });

    it('should emit cache hit events', async () => {
      const input = { weight: 70, height: 175 };
      
      // First calculation
      await engine.calculate('test-calculator', input);
      events.length = 0; // Clear events
      
      // Second calculation should hit cache
      await engine.calculate('test-calculator', input);
      
      expect(events.some(e => e.type === 'cache_hit')).toBe(true);
    });

    it('should emit validation failed events', async () => {
      const input = { weight: 70 }; // missing height
      await engine.calculate('test-calculator', input);
      
      expect(events.some(e => e.type === 'validation_failed')).toBe(true);
    });

    it('should unsubscribe observers', async () => {
      engine.unsubscribe(observer);
      
      const input = { weight: 70, height: 175 };
      await engine.calculate('test-calculator', input);
      
      expect(events).toHaveLength(0);
    });
  });

  describe('History Management', () => {
    beforeEach(() => {
      engine.register(mockCalculator);
    });

    it('should maintain calculation history', async () => {
      const input = { weight: 70, height: 175 };
      await engine.calculate('test-calculator', input);
      
      const history = engine.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].getMetadata().calculatorId).toBe('test-calculator');
    });

    it('should limit history size', async () => {
      const smallEngine = createCalculatorEngine({ maxHistorySize: 2 });
      smallEngine.register(mockCalculator);
      
      // Perform 3 calculations
      for (let i = 0; i < 3; i++) {
        await smallEngine.calculate('test-calculator', { weight: 70 + i, height: 175 });
      }
      
      const history = smallEngine.getHistory();
      expect(history).toHaveLength(2); // Limited to maxHistorySize
    });

    it('should clear history', async () => {
      const input = { weight: 70, height: 175 };
      await engine.calculate('test-calculator', input);
      
      engine.clearHistory();
      expect(engine.getHistory()).toHaveLength(0);
    });
  });

  describe('Cache Management', () => {
    beforeEach(() => {
      engine.register(mockCalculator);
    });

    it('should clear cache', async () => {
      const input = { weight: 70, height: 175 };
      await engine.calculate('test-calculator', input);
      
      const clearResult = await engine.clearCache();
      expect(clearResult.isSuccess()).toBe(true);
      
      const sizeResult = await engine.getCacheSize();
      expect(sizeResult.isSuccess()).toBe(true);
      expect(sizeResult.value).toBe(0);
    });

    it('should get cache size', async () => {
      const input1 = { weight: 70, height: 175 };
      const input2 = { weight: 80, height: 180 };
      
      await engine.calculate('test-calculator', input1);
      await engine.calculate('test-calculator', input2);
      
      const sizeResult = await engine.getCacheSize();
      expect(sizeResult.isSuccess()).toBe(true);
      expect(sizeResult.value).toBe(2);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      engine.register(mockCalculator);
    });

    it('should provide engine statistics', async () => {
      const input = { weight: 70, height: 175 };
      await engine.calculate('test-calculator', input);
      
      const stats = engine.getEngineStats();
      expect(stats.registeredCalculators).toBe(1);
      expect(stats.historySize).toBe(1);
      expect(stats.observers).toBe(0);
      expect(await stats.cacheSize).toBe(1);
    });
  });
});

describe('CalculationConfigBuilder', () => {
  it('should build calculator config', () => {
    const config = new CalculationConfigBuilder()
      .setId('test-calc')
      .setName('Test Calculator')
      .setDescription('A test calculator')
      .setCategory('test')
      .setVersion('1.0.0')
      .setRequiredFields(['weight', 'height'])
      .setCalculateFunction(async (input) => ({ value: 25, unit: 'kg/m²' }))
      .setCacheEnabled(true)
      .setCacheTTL(60000)
      .build();

    expect(config.id).toBe('test-calc');
    expect(config.name).toBe('Test Calculator');
    expect(config.requiredFields).toEqual(['weight', 'height']);
    expect(config.cacheEnabled).toBe(true);
    expect(config.cacheTTL).toBe(60000);
  });

  it('should fail to build without required fields', () => {
    expect(() => {
      new CalculationConfigBuilder().build();
    }).toThrow('Calculator ID is required');

    expect(() => {
      new CalculationConfigBuilder()
        .setId('test')
        .build();
    }).toThrow('Calculator name is required');

    expect(() => {
      new CalculationConfigBuilder()
        .setId('test')
        .setName('Test')
        .build();
    }).toThrow('Calculate function is required');
  });
});

describe('StandardCalculationCommand', () => {
  let mockCalculator: CalculatorConfig;

  beforeEach(() => {
    mockCalculator = {
      id: 'test-calculator',
      name: 'Test Calculator',
      description: 'A test calculator',
      category: 'test',
      version: '1.0.0',
      calculate: vi.fn().mockResolvedValue({ value: 25, unit: 'kg/m²' })
    };
  });

  it('should execute calculation command', async () => {
    const input = { weight: 70, height: 175 };
    const command = new StandardCalculationCommand(
      'test-calculator',
      input,
      mockCalculator
    );

    const result = await command.execute();
    expect(result.isSuccess()).toBe(true);
    expect(result.value).toEqual({ value: 25, unit: 'kg/m²' });
    expect(command.canUndo()).toBe(true);
  });

  it('should handle calculation errors', async () => {
    const errorCalculator = {
      ...mockCalculator,
      calculate: vi.fn().mockRejectedValue(new Error('Calculation failed'))
    };

    const input = { weight: 70, height: 175 };
    const command = new StandardCalculationCommand(
      'test-calculator',
      input,
      errorCalculator
    );

    const result = await command.execute();
    expect(result.isFailure()).toBe(true);
    expect(result.error.message).toContain('Calculation failed');
  });

  it('should provide command metadata', () => {
    const input = { weight: 70, height: 175 };
    const command = new StandardCalculationCommand(
      'test-calculator',
      input,
      mockCalculator
    );

    const metadata = command.getMetadata();
    expect(metadata.calculatorId).toBe('test-calculator');
    expect(metadata.input).toEqual(input);
    expect(metadata.timestamp).toBeTypeOf('number');
  });
});