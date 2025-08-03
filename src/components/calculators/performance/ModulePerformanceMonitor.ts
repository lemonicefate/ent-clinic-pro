/**
 * 計算機模組效能監控器
 * 監控模組載入時間、記憶體使用情況和快取效能
 */

export interface PerformanceMetrics {
  moduleId: string;
  loadTime: number;
  memoryUsage: number;
  cacheHit: boolean;
  timestamp: number;
}

export interface ModuleLoadStats {
  totalModules: number;
  averageLoadTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  slowestModule: string;
  fastestModule: string;
}

class ModulePerformanceMonitor {
  private static instance: ModulePerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private loadStartTimes: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): ModulePerformanceMonitor {
    if (!ModulePerformanceMonitor.instance) {
      ModulePerformanceMonitor.instance = new ModulePerformanceMonitor();
    }
    return ModulePerformanceMonitor.instance;
  }

  /**
   * 開始監控模組載入
   */
  startModuleLoad(moduleId: string): void {
    this.loadStartTimes.set(moduleId, performance.now());
  }

  /**
   * 結束監控模組載入
   */
  endModuleLoad(moduleId: string, cacheHit: boolean = false): void {
    const startTime = this.loadStartTimes.get(moduleId);
    if (!startTime) return;

    const loadTime = performance.now() - startTime;
    const memoryUsage = this.getMemoryUsage();

    const metric: PerformanceMetrics = {
      moduleId,
      loadTime,
      memoryUsage,
      cacheHit,
      timestamp: Date.now()
    };

    this.metrics.push(metric);
    this.loadStartTimes.delete(moduleId);

    // 保持最近 100 個記錄
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * 獲取載入統計
   */
  getLoadStats(): ModuleLoadStats {
    if (this.metrics.length === 0) {
      return {
        totalModules: 0,
        averageLoadTime: 0,
        cacheHitRate: 0,
        memoryUsage: 0,
        slowestModule: '',
        fastestModule: ''
      };
    }

    const totalLoadTime = this.metrics.reduce((sum, metric) => sum + metric.loadTime, 0);
    const cacheHits = this.metrics.filter(metric => metric.cacheHit).length;
    const currentMemoryUsage = this.getMemoryUsage();

    // 找出最慢和最快的模組
    const sortedByLoadTime = [...this.metrics].sort((a, b) => a.loadTime - b.loadTime);
    const slowestModule = sortedByLoadTime[sortedByLoadTime.length - 1]?.moduleId || '';
    const fastestModule = sortedByLoadTime[0]?.moduleId || '';

    return {
      totalModules: this.metrics.length,
      averageLoadTime: totalLoadTime / this.metrics.length,
      cacheHitRate: (cacheHits / this.metrics.length) * 100,
      memoryUsage: currentMemoryUsage,
      slowestModule,
      fastestModule
    };
  }

  /**
   * 獲取特定模組的效能指標
   */
  getModuleMetrics(moduleId: string): PerformanceMetrics[] {
    return this.metrics.filter(metric => metric.moduleId === moduleId);
  }

  /**
   * 清除效能指標
   */
  clearMetrics(): void {
    this.metrics = [];
    this.loadStartTimes.clear();
  }

  /**
   * 獲取記憶體使用情況
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  /**
   * 生成效能報告
   */
  generateReport(): string {
    const stats = this.getLoadStats();
    
    return `
計算機模組效能報告
==================

總載入模組數: ${stats.totalModules}
平均載入時間: ${stats.averageLoadTime.toFixed(2)}ms
快取命中率: ${stats.cacheHitRate.toFixed(1)}%
記憶體使用: ${stats.memoryUsage.toFixed(2)}MB
最慢模組: ${stats.slowestModule}
最快模組: ${stats.fastestModule}

詳細指標:
${this.metrics.map(metric => 
  `- ${metric.moduleId}: ${metric.loadTime.toFixed(2)}ms ${metric.cacheHit ? '(快取)' : '(載入)'}`
).join('\n')}
    `.trim();
  }

  /**
   * 檢查是否有效能問題
   */
  checkPerformanceIssues(): string[] {
    const issues: string[] = [];
    const stats = this.getLoadStats();

    // 檢查平均載入時間
    if (stats.averageLoadTime > 100) {
      issues.push(`平均載入時間過長: ${stats.averageLoadTime.toFixed(2)}ms (建議 < 100ms)`);
    }

    // 檢查快取命中率
    if (stats.cacheHitRate < 50) {
      issues.push(`快取命中率過低: ${stats.cacheHitRate.toFixed(1)}% (建議 > 50%)`);
    }

    // 檢查記憶體使用
    if (stats.memoryUsage > 50) {
      issues.push(`記憶體使用過高: ${stats.memoryUsage.toFixed(2)}MB (建議 < 50MB)`);
    }

    // 檢查個別模組載入時間
    const slowModules = this.metrics.filter(metric => metric.loadTime > 200);
    if (slowModules.length > 0) {
      issues.push(`發現載入緩慢的模組: ${slowModules.map(m => m.moduleId).join(', ')}`);
    }

    return issues;
  }
}

export default ModulePerformanceMonitor;