# 統一計算機架構效能優化指南

## 概述

本指南提供了針對統一計算機架構的效能優化策略和最佳實踐，確保系統能夠高效運行並提供良好的用戶體驗。

## 當前架構效能分析

### 模組載入機制
- ✅ **動態導入**: 使用 `import.meta.glob()` 實現懒載入
- ✅ **錯誤邊界**: 防止單個模組錯誤影響整個系統
- ⚠️ **快取機制**: 需要實現更進階的快取策略

### 已實現的優化

1. **模組懒載入**
   ```typescript
   // ModuleLoader.ts 中的實現
   const moduleImports = import.meta.glob('../modules/*/index.tsx');
   ```

2. **錯誤隔離**
   ```typescript
   // ErrorBoundary.tsx 確保模組間隔離
   <ErrorBoundary calculatorId={calculatorId}>
     <FormComponent />
   </ErrorBoundary>
   ```

3. **類型優化**
   ```typescript
   // 嚴格的 TypeScript 類型減少運行時錯誤
   interface CalculatorModule {
     id: string;
     config: CalculatorConfig;
     // ...
   }
   ```

## 效能優化策略

### 1. 模組快取機制

#### 實施建議
```typescript
// 在 CalculatorRegistry.ts 中添加快取層
class CalculatorRegistry {
  private moduleCache = new Map<string, CalculatorModule>();
  private configCache = new Map<string, CalculatorConfig>();
  
  async getModule(id: string): Promise<CalculatorModule> {
    if (this.moduleCache.has(id)) {
      return this.moduleCache.get(id)!;
    }
    
    const module = await this.loadModule(id);
    this.moduleCache.set(id, module);
    return module;
  }
}
```

#### 快取策略
- **記憶體快取**: 已載入的模組保存在記憶體中
- **配置快取**: 模組配置單獨快取，減少重複解析
- **結果快取**: 對於相同輸入的計算結果進行短期快取

### 2. 載入效能優化

#### 預載入策略
```typescript
// 預載入常用模組
const PRELOAD_MODULES = ['bmi', 'egfr', 'cha2ds2-vasc'];

class ModuleLoader {
  async preloadCommonModules(): Promise<void> {
    const preloadPromises = PRELOAD_MODULES.map(id => 
      this.loadModule(id).catch(error => 
        console.warn(`Failed to preload ${id}:`, error)
      )
    );
    
    await Promise.allSettled(preloadPromises);
  }
}
```

#### 分批載入
```typescript
// 分批載入模組，避免阻塞主線程
async loadModulesInBatches(batchSize: number = 3): Promise<void> {
  const moduleIds = Object.keys(this.moduleImports);
  
  for (let i = 0; i < moduleIds.length; i += batchSize) {
    const batch = moduleIds.slice(i, i + batchSize);
    await Promise.all(batch.map(id => this.loadModule(id)));
    
    // 讓出控制權給瀏覽器
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
```

### 3. 計算效能優化

#### 計算結果快取
```typescript
class CalculationCache {
  private cache = new Map<string, any>();
  private maxSize = 100;
  
  getCachedResult(inputs: any, calculatorId: string): any | null {
    const key = this.generateKey(inputs, calculatorId);
    return this.cache.get(key) || null;
  }
  
  setCachedResult(inputs: any, calculatorId: string, result: any): void {
    const key = this.generateKey(inputs, calculatorId);
    
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, result);
  }
  
  private generateKey(inputs: any, calculatorId: string): string {
    return `${calculatorId}:${JSON.stringify(inputs)}`;
  }
}
```

#### 防抖動計算
```typescript
// 在表單組件中實現防抖動
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};
```

### 4. 記憶體優化

#### 模組卸載機制
```typescript
class CalculatorRegistry {
  async unloadUnusedModules(): Promise<void> {
    const now = Date.now();
    const UNUSED_THRESHOLD = 5 * 60 * 1000; // 5分鐘
    
    for (const [id, module] of this.modules) {
      if (now - module.lastUsed > UNUSED_THRESHOLD) {
        await this.unloadModule(id);
      }
    }
  }
  
  private async unloadModule(id: string): Promise<void> {
    const module = this.modules.get(id);
    if (module?.onUnload) {
      await module.onUnload();
    }
    
    this.modules.delete(id);
    this.moduleCache.delete(id);
  }
}
```

#### 記憶體監控
```typescript
class MemoryMonitor {
  private checkInterval: number = 30000; // 30秒
  
  startMonitoring(): void {
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        console.log('Memory usage:', {
          used: Math.round(memory.usedJSHeapSize / 1048576) + 'MB',
          total: Math.round(memory.totalJSHeapSize / 1048576) + 'MB',
          limit: Math.round(memory.jsHeapSizeLimit / 1048576) + 'MB'
        });
        
        // 如果記憶體使用過高，觸發清理
        if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
          this.triggerCleanup();
        }
      }
    }, this.checkInterval);
  }
  
  private triggerCleanup(): void {
    // 觸發模組卸載和快取清理
    CalculatorRegistry.getInstance().unloadUnusedModules();
  }
}
```

## 效能監控指標

### 關鍵效能指標 (KPIs)

1. **載入時間**
   - 首次載入時間 < 3秒
   - 模組載入時間 < 1秒
   - 計算響應時間 < 500ms

2. **記憶體使用**
   - 基礎記憶體使用 < 50MB
   - 每個模組記憶體增量 < 5MB
   - 記憶體洩漏檢測

3. **用戶體驗**
   - 首次內容繪製 (FCP) < 2秒
   - 最大內容繪製 (LCP) < 3秒
   - 累積版面偏移 (CLS) < 0.1

### 監控實施

```typescript
class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // 保持最近100個數據點
    if (values.length > 100) {
      values.shift();
    }
  }
  
  getAverageMetric(name: string): number {
    const values = this.metrics.get(name) || [];
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  recordModuleLoadTime(moduleId: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      this.recordMetric(`module_load_${moduleId}`, loadTime);
    };
  }
}
```

## 實施計劃

### Phase 1: 基礎優化 (1週)
- [ ] 實現模組快取機制
- [ ] 添加計算結果快取
- [ ] 實施防抖動計算

### Phase 2: 進階優化 (2週)
- [ ] 實現預載入策略
- [ ] 添加記憶體監控
- [ ] 實施模組卸載機制

### Phase 3: 監控和調優 (1週)
- [ ] 部署效能監控
- [ ] 收集實際使用數據
- [ ] 根據數據調優參數

## 測試和驗證

### 效能測試
```typescript
describe('Performance Tests', () => {
  it('should load modules within time limit', async () => {
    const startTime = performance.now();
    await registry.initialize();
    const loadTime = performance.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000); // 3秒內載入
  });
  
  it('should calculate results quickly', async () => {
    const inputs = { /* test inputs */ };
    const startTime = performance.now();
    const result = await calculator.calculate(inputs);
    const calcTime = performance.now() - startTime;
    
    expect(calcTime).toBeLessThan(500); // 500ms內計算
  });
});
```

### 記憶體洩漏測試
```typescript
describe('Memory Leak Tests', () => {
  it('should not leak memory on repeated calculations', async () => {
    const initialMemory = getMemoryUsage();
    
    // 執行1000次計算
    for (let i = 0; i < 1000; i++) {
      await calculator.calculate(testInputs);
    }
    
    // 強制垃圾回收
    if (global.gc) global.gc();
    
    const finalMemory = getMemoryUsage();
    const memoryIncrease = finalMemory - initialMemory;
    
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
  });
});
```

## 結論

通過實施這些效能優化策略，我們可以確保統一計算機架構能夠：

1. **快速響應**: 載入和計算時間符合用戶期望
2. **高效運行**: 合理使用系統資源
3. **穩定可靠**: 長時間運行不出現效能衰減
4. **可擴展**: 支援更多計算機模組而不影響效能

這些優化措施將為用戶提供流暢的使用體驗，同時為系統的未來擴展奠定堅實基礎。