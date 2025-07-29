// 效能監控系統
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userAgent?: string;
  connectionType?: string;
}

export interface WebVitalsMetric extends PerformanceMetric {
  id: string;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export interface CustomMetric extends PerformanceMetric {
  category: 'navigation' | 'resource' | 'user-interaction' | 'api' | 'calculator';
  metadata?: Record<string, any>;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static isInitialized = false;
  private static reportingEndpoint = '/api/analytics/performance';
  private static batchSize = 10;
  private static reportingInterval = 30000; // 30 seconds

  static initialize() {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.isInitialized = true;
    this.setupWebVitalsTracking();
    this.setupNavigationTracking();
    this.setupResourceTracking();
    this.setupUserInteractionTracking();
    this.setupErrorTracking();
    this.startPeriodicReporting();

    console.log('Performance monitoring initialized');
  }

  // Web Vitals 追蹤
  private static setupWebVitalsTracking() {
    // 動態載入 web-vitals 庫
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(this.handleWebVital.bind(this));
      getFID(this.handleWebVital.bind(this));
      getFCP(this.handleWebVital.bind(this));
      getLCP(this.handleWebVital.bind(this));
      getTTFB(this.handleWebVital.bind(this));
    }).catch(error => {
      console.warn('Failed to load web-vitals:', error);
    });
  }

  private static handleWebVital(metric: any) {
    const webVitalMetric: WebVitalsMetric = {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      delta: metric.delta,
      rating: metric.rating,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType()
    };

    this.recordMetric(webVitalMetric);

    // 發送到 Google Analytics (如果可用)
    if (typeof gtag !== 'undefined') {
      gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.value),
        non_interaction: true,
        custom_map: {
          metric_id: metric.id,
          metric_value: metric.value,
          metric_delta: metric.delta,
          metric_rating: metric.rating
        }
      });
    }
  }

  // 導航效能追蹤
  private static setupNavigationTracking() {
    window.addEventListener('load', () => {
      // 使用 Navigation Timing API
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const metrics = [
          { name: 'dns-lookup', value: navigation.domainLookupEnd - navigation.domainLookupStart },
          { name: 'tcp-connect', value: navigation.connectEnd - navigation.connectStart },
          { name: 'ssl-negotiation', value: navigation.connectEnd - navigation.secureConnectionStart },
          { name: 'request-response', value: navigation.responseEnd - navigation.requestStart },
          { name: 'dom-processing', value: navigation.domContentLoadedEventEnd - navigation.responseEnd },
          { name: 'resource-loading', value: navigation.loadEventEnd - navigation.domContentLoadedEventEnd },
          { name: 'total-load-time', value: navigation.loadEventEnd - navigation.navigationStart }
        ];

        metrics.forEach(metric => {
          if (metric.value > 0) {
            this.recordMetric({
              name: metric.name,
              value: metric.value,
              timestamp: Date.now(),
              url: window.location.href,
              category: 'navigation'
            } as CustomMetric);
          }
        });
      }
    });
  }

  // 資源載入追蹤
  private static setupResourceTracking() {
    // 監控大型資源載入
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          
          // 只追蹤重要資源
          if (this.isImportantResource(resource.name)) {
            this.recordMetric({
              name: 'resource-load-time',
              value: resource.responseEnd - resource.startTime,
              timestamp: Date.now(),
              url: window.location.href,
              category: 'resource',
              metadata: {
                resourceUrl: resource.name,
                resourceType: this.getResourceType(resource.name),
                transferSize: resource.transferSize,
                encodedBodySize: resource.encodedBodySize
              }
            } as CustomMetric);
          }
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  // 用戶互動追蹤
  private static setupUserInteractionTracking() {
    let interactionStart = 0;

    // 追蹤點擊響應時間
    document.addEventListener('click', (event) => {
      interactionStart = performance.now();
      
      // 追蹤計算機按鈕點擊
      const target = event.target as HTMLElement;
      if (target.closest('[data-calculator-button]')) {
        this.trackCalculatorInteraction(target, interactionStart);
      }
    });

    // 追蹤表單提交時間
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const submitStart = performance.now();
      
      // 使用 requestIdleCallback 來測量處理時間
      requestIdleCallback(() => {
        this.recordMetric({
          name: 'form-submit-time',
          value: performance.now() - submitStart,
          timestamp: Date.now(),
          url: window.location.href,
          category: 'user-interaction',
          metadata: {
            formId: form.id,
            formAction: form.action
          }
        } as CustomMetric);
      });
    });

    // 追蹤頁面可見性變化
    document.addEventListener('visibilitychange', () => {
      this.recordMetric({
        name: 'visibility-change',
        value: document.hidden ? 0 : 1,
        timestamp: Date.now(),
        url: window.location.href,
        category: 'user-interaction',
        metadata: {
          hidden: document.hidden
        }
      } as CustomMetric);
    });
  }

  // 錯誤追蹤
  private static setupErrorTracking() {
    // JavaScript 錯誤
    window.addEventListener('error', (event) => {
      this.recordMetric({
        name: 'javascript-error',
        value: 1,
        timestamp: Date.now(),
        url: window.location.href,
        category: 'navigation',
        metadata: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        }
      } as CustomMetric);
    });

    // Promise 拒絕
    window.addEventListener('unhandledrejection', (event) => {
      this.recordMetric({
        name: 'unhandled-promise-rejection',
        value: 1,
        timestamp: Date.now(),
        url: window.location.href,
        category: 'navigation',
        metadata: {
          reason: event.reason?.toString(),
          stack: event.reason?.stack
        }
      } as CustomMetric);
    });
  }

  // 計算機互動追蹤
  private static trackCalculatorInteraction(element: HTMLElement, startTime: number) {
    const calculatorId = element.closest('[data-calculator-id]')?.getAttribute('data-calculator-id');
    
    // 使用 MutationObserver 來檢測結果更新
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const endTime = performance.now();
          
          this.recordMetric({
            name: 'calculator-response-time',
            value: endTime - startTime,
            timestamp: Date.now(),
            url: window.location.href,
            category: 'calculator',
            metadata: {
              calculatorId: calculatorId,
              buttonType: element.getAttribute('data-calculator-button')
            }
          } as CustomMetric);
          
          observer.disconnect();
        }
      });
    });

    // 觀察結果容器的變化
    const resultContainer = document.querySelector('[data-calculator-results]');
    if (resultContainer) {
      observer.observe(resultContainer, {
        childList: true,
        subtree: true,
        characterData: true
      });
      
      // 5 秒後自動停止觀察
      setTimeout(() => observer.disconnect(), 5000);
    }
  }

  // API 呼叫追蹤
  static trackAPICall(url: string, method: string, startTime: number, endTime: number, status: number) {
    this.recordMetric({
      name: 'api-call-time',
      value: endTime - startTime,
      timestamp: Date.now(),
      url: window.location.href,
      category: 'api',
      metadata: {
        apiUrl: url,
        method: method,
        status: status,
        success: status >= 200 && status < 300
      }
    } as CustomMetric);
  }

  // 記錄自定義指標
  static recordCustomMetric(name: string, value: number, metadata?: Record<string, any>) {
    this.recordMetric({
      name: name,
      value: value,
      timestamp: Date.now(),
      url: window.location.href,
      category: 'user-interaction',
      metadata: metadata
    } as CustomMetric);
  }

  // 記錄指標
  private static recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // 如果達到批次大小，立即發送
    if (this.metrics.length >= this.batchSize) {
      this.sendMetrics();
    }
  }

  // 定期報告
  private static startPeriodicReporting() {
    setInterval(() => {
      if (this.metrics.length > 0) {
        this.sendMetrics();
      }
    }, this.reportingInterval);

    // 頁面卸載時發送剩餘指標
    window.addEventListener('beforeunload', () => {
      if (this.metrics.length > 0) {
        this.sendMetrics(true);
      }
    });
  }

  // 發送指標
  private static sendMetrics(useBeacon = false) {
    if (this.metrics.length === 0) return;

    const payload = {
      metrics: [...this.metrics],
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer
    };

    this.metrics = []; // 清空已發送的指標

    if (useBeacon && navigator.sendBeacon) {
      // 使用 sendBeacon 確保在頁面卸載時也能發送
      navigator.sendBeacon(
        this.reportingEndpoint,
        JSON.stringify(payload)
      );
    } else {
      // 使用 fetch 發送
      fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }).catch(error => {
        console.warn('Failed to send performance metrics:', error);
        // 將失敗的指標重新加入佇列
        this.metrics.unshift(...payload.metrics);
      });
    }
  }

  // 輔助方法
  private static getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection ? connection.effectiveType || connection.type : 'unknown';
  }

  private static isImportantResource(url: string): boolean {
    // 只追蹤重要資源
    return url.includes('.js') || url.includes('.css') || url.includes('/api/') || url.includes('calculator');
  }

  private static getResourceType(url: string): string {
    if (url.includes('.js')) return 'javascript';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('/api/')) return 'api';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.svg')) return 'image';
    return 'other';
  }

  // 獲取效能報告
  static getPerformanceReport(): {
    webVitals: WebVitalsMetric[];
    navigation: CustomMetric[];
    resources: CustomMetric[];
    interactions: CustomMetric[];
    errors: CustomMetric[];
  } {
    const webVitals = this.metrics.filter(m => 'rating' in m) as WebVitalsMetric[];
    const custom = this.metrics.filter(m => 'category' in m) as CustomMetric[];
    
    return {
      webVitals,
      navigation: custom.filter(m => m.category === 'navigation'),
      resources: custom.filter(m => m.category === 'resource'),
      interactions: custom.filter(m => m.category === 'user-interaction'),
      errors: custom.filter(m => m.name.includes('error') || m.name.includes('rejection'))
    };
  }

  // 獲取效能分數
  static getPerformanceScore(): {
    overall: number;
    webVitals: number;
    navigation: number;
    resources: number;
  } {
    const report = this.getPerformanceReport();
    
    // Web Vitals 分數 (基於 Google 的評分標準)
    const webVitalsScore = this.calculateWebVitalsScore(report.webVitals);
    
    // 導航分數 (基於載入時間)
    const navigationScore = this.calculateNavigationScore(report.navigation);
    
    // 資源分數 (基於資源載入時間)
    const resourcesScore = this.calculateResourcesScore(report.resources);
    
    // 整體分數 (加權平均)
    const overall = Math.round(
      webVitalsScore * 0.5 + 
      navigationScore * 0.3 + 
      resourcesScore * 0.2
    );

    return {
      overall,
      webVitals: webVitalsScore,
      navigation: navigationScore,
      resources: resourcesScore
    };
  }

  private static calculateWebVitalsScore(vitals: WebVitalsMetric[]): number {
    if (vitals.length === 0) return 100;
    
    const scores = vitals.map(vital => {
      switch (vital.rating) {
        case 'good': return 100;
        case 'needs-improvement': return 70;
        case 'poor': return 30;
        default: return 50;
      }
    });
    
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  private static calculateNavigationScore(navigation: CustomMetric[]): number {
    const totalLoadTime = navigation.find(m => m.name === 'total-load-time');
    if (!totalLoadTime) return 100;
    
    // 基於載入時間評分 (2秒以下為滿分)
    if (totalLoadTime.value < 2000) return 100;
    if (totalLoadTime.value < 4000) return 80;
    if (totalLoadTime.value < 6000) return 60;
    return 40;
  }

  private static calculateResourcesScore(resources: CustomMetric[]): number {
    if (resources.length === 0) return 100;
    
    const avgLoadTime = resources.reduce((sum, r) => sum + r.value, 0) / resources.length;
    
    // 基於平均資源載入時間評分
    if (avgLoadTime < 500) return 100;
    if (avgLoadTime < 1000) return 80;
    if (avgLoadTime < 2000) return 60;
    return 40;
  }
}

// 自動初始化
if (typeof window !== 'undefined') {
  // 等待 DOM 載入完成後初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      PerformanceMonitor.initialize();
    });
  } else {
    PerformanceMonitor.initialize();
  }
}