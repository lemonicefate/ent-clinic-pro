/**
 * 計算機模組快取系統
 * 提供模組快取、預載入和智能清理功能
 */

import type { CalculatorModule } from '../types/calculator';

export interface CacheEntry {
  module: CalculatorModule;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  memoryUsage: number;
  oldestEntry: number;
  mostAccessedModule: string;
}

class ModuleCache {
  private static instance: ModuleCache;
  private cache: Map<string, CacheEntry> = new Map();
  private maxCacheSize: number = 10; // 最多快取 10 個模組
  private maxAge: number = 30 * 60 * 1000; // 30 分鐘過期
  private hitCount: number = 0;
  private missCount: number = 0;

  private constructor() {
    // 定期清理過期快取
    setInterval(() => this.cleanupExpiredEntries(), 5 * 60 * 1000); // 每 5 分鐘清理一次
  }

  static getInstance(): ModuleCache {
    if (!ModuleCache.instance) {
      ModuleCache.instance = new ModuleCache();
    }
    return ModuleCache.instance;
  }

  /**
   * 設置快取配置
   */
  configure(options: {
    maxCacheSize?: number;
    maxAge?: number;
  }): void {
    if (options.maxCacheSize !== undefined) {
      this.maxCacheSize = options.maxCacheSize;
    }
    if (options.maxAge !== undefined) {
      this.maxAge = options.maxAge;
    }
  }

  /**
   * 獲取快取的模組
   */
  get(moduleId: string): CalculatorModule | null {
    const entry = this.cache.get(moduleId);
    
    if (!entry) {
      this.missCount++;
      return null;
    }

    // 檢查是否過期
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(moduleId);
      this.missCount++;
      return null;
    }

    // 更新存取統計
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.hitCount++;

    return entry.module;
  }

  /**
   * 設置模組快取
   */
  set(moduleId: string, module: CalculatorModule): void {
    const now = Date.now();
    
    // 如果快取已滿，移除最少使用的項目
    if (this.cache.size >= this.maxCacheSize && !this.cache.has(moduleId)) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry = {
      module,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now
    };

    this.cache.set(moduleId, entry);
  }

  /**
   * 檢查模組是否在快取中
   */
  has(moduleId: string): boolean {
    const entry = this.cache.get(moduleId);
    if (!entry) return false;

    // 檢查是否過期
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(moduleId);
      return false;
    }

    return true;
  }

  /**
   * 預載入模組
   */
  async preload(moduleIds: string[]): Promise<void> {
    const loadPromises = moduleIds.map(async (moduleId) => {
      if (this.has(moduleId)) return; // 已經在快取中

      try {
        // 動態載入模組
        const module = await this.loadModule(moduleId);
        if (module) {
          this.set(moduleId, module);
        }
      } catch (error) {
        console.warn(`預載入模組 ${moduleId} 失敗:`, error);
      }
    });

    await Promise.all(loadPromises);
  }

  /**
   * 清除特定模組快取
   */
  delete(moduleId: string): boolean {
    return this.cache.delete(moduleId);
  }

  /**
   * 清除所有快取
   */
  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * 獲取快取統計
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0;

    // 計算記憶體使用（估算）
    const memoryUsage = this.cache.size * 50; // 假設每個模組約 50KB

    // 找出最舊的條目
    const oldestEntry = entries.length > 0 
      ? Math.min(...entries.map(e => e.timestamp))
      : 0;

    // 找出最常存取的模組
    const mostAccessed = entries.reduce((max, entry) => 
      entry.accessCount > max.accessCount ? entry : max, 
      { accessCount: 0, module: { id: '' } } as any
    );

    return {
      totalEntries: this.cache.size,
      hitRate,
      memoryUsage,
      oldestEntry,
      mostAccessedModule: mostAccessed.module?.id || ''
    };
  }

  /**
   * 移除最少使用的項目
   */
  private evictLeastRecentlyUsed(): void {
    let lruEntry: [string, CacheEntry] | null = null;
    let lruTime = Date.now();

    for (const [moduleId, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruEntry = [moduleId, entry];
      }
    }

    if (lruEntry) {
      this.cache.delete(lruEntry[0]);
    }
  }

  /**
   * 清理過期的快取項目
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [moduleId, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        expiredKeys.push(moduleId);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      console.log(`清理了 ${expiredKeys.length} 個過期的模組快取`);
    }
  }

  /**
   * 動態載入模組
   */
  private async loadModule(moduleId: string): Promise<CalculatorModule | null> {
    try {
      // 根據模組 ID 動態載入
      const modulePath = `../modules/${moduleId}/index.tsx`;
      const moduleExport = await import(modulePath);
      return moduleExport.default;
    } catch (error) {
      console.error(`載入模組 ${moduleId} 失敗:`, error);
      return null;
    }
  }

  /**
   * 獲取快取使用報告
   */
  generateReport(): string {
    const stats = this.getStats();
    const entries = Array.from(this.cache.entries());

    return `
模組快取報告
============

快取統計:
- 總快取項目: ${stats.totalEntries}
- 命中率: ${stats.hitRate.toFixed(1)}%
- 記憶體使用: ${stats.memoryUsage}KB
- 最常存取模組: ${stats.mostAccessedModule}

快取項目詳情:
${entries.map(([moduleId, entry]) => 
  `- ${moduleId}: 存取 ${entry.accessCount} 次, 最後存取 ${new Date(entry.lastAccessed).toLocaleTimeString()}`
).join('\n')}

建議:
${this.generateRecommendations().join('\n')}
    `.trim();
  }

  /**
   * 生成優化建議
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.getStats();

    if (stats.hitRate < 50) {
      recommendations.push('- 考慮增加快取大小或延長快取時間');
    }

    if (stats.totalEntries === this.maxCacheSize) {
      recommendations.push('- 快取已滿，考慮增加 maxCacheSize');
    }

    if (stats.memoryUsage > 500) {
      recommendations.push('- 記憶體使用較高，考慮減少快取大小');
    }

    if (recommendations.length === 0) {
      recommendations.push('- 快取效能良好，無需調整');
    }

    return recommendations;
  }
}

export default ModuleCache;