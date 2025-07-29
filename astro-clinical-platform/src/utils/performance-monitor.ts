/**
 * 效能監控工具
 * 監控 Core Web Vitals 和其他效能指標
 */

// Core Web Vitals 指標類型
export interface CoreWebVitals {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
  INP?: number; // Interaction to Next Paint
}

// 效能指標
export interface PerformanceMetrics extends CoreWebVitals {
  // 載入時間
  domContentLoaded?: number;
  windowLoad?: number;
  
  // 資源載入
  resourceCount?: number;
  totalResourceSize?: number;
  
  // 記憶體使用
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  
  // 網路資訊
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  
  // 自定義指標
  medicalContentLoadTime?: number;
  calculatorRenderTime?: number;
  searchResponseTime?: number;
}

// 效能事件
export interface PerformanceEvent {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userAgent: string;
}

/**
 * 效能監控器類別
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];
  private callbacks: Array<(event: PerformanceEvent) => void> = [];

  constructor() {
    this.initializeObservers();
    this.measureInitialMetrics();
  }

  /**
   * 初始化效能觀察器
   */
  private initializeObservers(): void {
    // 觀察 LCP
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          
          if (lastEntry) {
            this.metrics.LCP = lastEntry.startTime;
            this.reportMetric('LCP', lastEntry.startTime);
          }
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }

      // 觀察 FID
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.FID = entry.processingStart - entry.startTime;
            this.reportMetric('FID', this.metrics.FID);
          });
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('FID observer not supported:', error);
      }

      // 觀察 CLS
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          
          this.metrics.CLS = clsValue;
          this.reportMetric('CLS', clsValue);
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('CLS observer not supported:', error);
      }

      // 觀察資源載入
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          this.analyzeResourcePerformance(entries);
        });
        
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Resource observer not supported:', error);
      }
    }
  }

  /**
   * 測量初始指標
   */
  private measureInitialMetrics(): void {
    // 測量 FCP
    if ('performance' in window && 'getEntriesByType' in performance) {
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      
      if (fcpEntry) {
        this.metrics.FCP = fcpEntry.startTime;
        this.reportMetric('FCP', fcpEntry.startTime);
      }
    }

    // 測量 TTFB
    if ('performance' in window && 'timing' in performance) {
      const timing = performance.timing;
      this.metrics.TTFB = timing.responseStart - timing.requestStart;
      this.reportMetric('TTFB', this.metrics.TTFB);
    }

    // 測量 DOM 載入時間
    document.addEventListener('DOMContentLoaded', () => {
      this.metrics.domContentLoaded = performance.now();
    });

    window.addEventListener('load', () => {
      this.metrics.windowLoad = performance.now();
      this.measureMemoryUsage();
      this.measureNetworkInformation();
    });
  }

  /**
   * 分析資源效能
   */
  private analyzeResourcePerformance(entries: PerformanceEntry[]): void {
    let totalSize = 0;
    let resourceCount = 0;

    entries.forEach((entry: any) => {
      if (entry.transferSize) {
        totalSize += entry.transferSize;
        resourceCount++;
      }

      // 檢查慢速資源
      const loadTime = entry.responseEnd - entry.startTime;
      if (loadTime > 1000) { // 超過 1 秒
        console.warn(`Slow resource detected: ${entry.name} (${loadTime.toFixed(2)}ms)`);
      }
    });

    this.metrics.resourceCount = resourceCount;
    this.metrics.totalResourceSize = totalSize;
  }

  /**
   * 測量記憶體使用量
   */
  private measureMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.usedJSHeapSize = memory.usedJSHeapSize;
      this.metrics.totalJSHeapSize = memory.totalJSHeapSize;
    }
  }

  /**
   * 測量網路資訊
   */
  private measureNetworkInformation(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.connectionType = connection.type;
      this.metrics.effectiveType = connection.effectiveType;
      this.metrics.downlink = connection.downlink;
      this.metrics.rtt = connection.rtt;
    }
  }

  /**
   * 報告指標
   */
  private reportMetric(name: string, value: number): void {
    const rating = this.getRating(name, value);
    const event: PerformanceEvent = {
      name,
      value,
      rating,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // 執行回調
    this.callbacks.forEach(callback => callback(event));

    // 記錄到控制台（開發模式）
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance metric: ${name} = ${value.toFixed(2)}ms (${rating})`);
    }
  }

  /**
   * 獲取指標評級
   */
  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * 測量醫療內容載入時間
   */
  measureMedicalContentLoad(startTime: number): void {
    const loadTime = performance.now() - startTime;
    this.metrics.medicalContentLoadTime = loadTime;
    this.reportMetric('medicalContentLoad', loadTime);
  }

  /**
   * 測量計算機渲染時間
   */
  measureCalculatorRender(startTime: number): void {
    const renderTime = performance.now() - startTime;
    this.metrics.calculatorRenderTime = renderTime;
    this.reportMetric('calculatorRender', renderTime);
  }

  /**
   * 測量搜尋回應時間
   */
  measureSearchResponse(startTime: number): void {
    const responseTime = performance.now() - startTime;
    this.metrics.searchResponseTime = responseTime;
    this.reportMetric('searchResponse', responseTime);
  }

  /**
   * 添加效能事件監聽器
   */
  addEventListener(callback: (event: PerformanceEvent) => void): void {
    this.callbacks.push(callback);
  }

  /**
   * 移除效能事件監聽器
   */
  removeEventListener(callback: (event: PerformanceEvent) => void): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  /**
   * 獲取當前指標
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 生成效能報告
   */
  generateReport(): {
    summary: string;
    metrics: PerformanceMetrics;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    
    // 分析 LCP
    if (this.metrics.LCP && this.metrics.LCP > 2500) {
      recommendations.push('優化 Largest Contentful Paint：考慮優化圖片、減少 CSS 阻塞、使用 CDN');
    }

    // 分析 FID
    if (this.metrics.FID && this.metrics.FID > 100) {
      recommendations.push('優化 First Input Delay：減少 JavaScript 執行時間、使用 Web Workers');
    }

    // 分析 CLS
    if (this.metrics.CLS && this.metrics.CLS > 0.1) {
      recommendations.push('優化 Cumulative Layout Shift：為圖片設定尺寸、避免動態插入內容');
    }

    // 分析資源載入
    if (this.metrics.totalResourceSize && this.metrics.totalResourceSize > 2000000) { // 2MB
      recommendations.push('優化資源大小：壓縮圖片、啟用 Gzip、移除未使用的 CSS/JS');
    }

    // 分析記憶體使用
    if (this.metrics.usedJSHeapSize && this.metrics.totalJSHeapSize) {
      const memoryUsage = this.metrics.usedJSHeapSize / this.metrics.totalJSHeapSize;
      if (memoryUsage > 0.8) {
        recommendations.push('優化記憶體使用：檢查記憶體洩漏、優化 JavaScript 程式碼');
      }
    }

    const summary = this.generateSummary();

    return {
      summary,
      metrics: this.metrics,
      recommendations
    };
  }

  /**
   * 生成效能摘要
   */
  private generateSummary(): string {
    const goodMetrics = [];
    const poorMetrics = [];

    Object.entries(this.metrics).forEach(([key, value]) => {
      if (typeof value === 'number') {
        const rating = this.getRating(key, value);
        if (rating === 'good') {
          goodMetrics.push(key);
        } else if (rating === 'poor') {
          poorMetrics.push(key);
        }
      }
    });

    if (poorMetrics.length === 0) {
      return '效能表現良好，所有核心指標都在建議範圍內。';
    } else {
      return `需要改善的指標：${poorMetrics.join(', ')}。良好的指標：${goodMetrics.join(', ')}。`;
    }
  }

  /**
   * 發送效能資料到分析服務
   */
  async sendToAnalytics(endpoint: string): Promise<void> {
    try {
      const report = this.generateReport();
      
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...report,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      });
    } catch (error) {
      console.error('Failed to send performance data:', error);
    }
  }

  /**
   * 清理觀察器
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.callbacks = [];
  }

  /**
   * 檢查瀏覽器支援
   */
  static checkSupport(): {
    performanceObserver: boolean;
    performanceTiming: boolean;
    performanceMemory: boolean;
    networkInformation: boolean;
  } {
    return {
      performanceObserver: 'PerformanceObserver' in window,
      performanceTiming: 'performance' in window && 'timing' in performance,
      performanceMemory: 'performance' in window && 'memory' in performance,
      networkInformation: 'connection' in navigator
    };
  }
}

// 預設效能監控器實例
export const performanceMonitor = new PerformanceMonitor();

// 便利函數
export const measureMedicalContentLoad = (startTime: number) => 
  performanceMonitor.measureMedicalContentLoad(startTime);

export const measureCalculatorRender = (startTime: number) => 
  performanceMonitor.measureCalculatorRender(startTime);

export const measureSearchResponse = (startTime: number) => 
  performanceMonitor.measureSearchResponse(startTime);

export const getPerformanceMetrics = () => 
  performanceMonitor.getMetrics();

export const generatePerformanceReport = () => 
  performanceMonitor.generateReport();

// 自動初始化（如果在瀏覽器環境中）
if (typeof window !== 'undefined') {
  // 頁面卸載時清理
  window.addEventListener('beforeunload', () => {
    performanceMonitor.cleanup();
  });

  // 頁面可見性變化時報告
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      const report = performanceMonitor.generateReport();
      console.log('Performance report on page hide:', report);
    }
  });
}