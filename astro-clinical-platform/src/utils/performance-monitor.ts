/**
 * Performance Monitoring and Analytics System
 * 
 * This module provides comprehensive performance monitoring capabilities including:
 * - Page load time tracking
 * - User behavior analysis
 * - Content interaction metrics
 * - SEO performance tracking
 */

// Web Vitals metrics interface
interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  delta: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

// Performance data interface
interface PerformanceData {
  url: string;
  timestamp: number;
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
  interactionToNextPaint?: number;
  timeToFirstByte: number;
  resourceCount: number;
  transferSize: number;
  userAgent: string;
  connectionType?: string;
  deviceMemory?: number;
}

// User behavior data interface
interface UserBehaviorData {
  sessionId: string;
  userId?: string;
  url: string;
  timestamp: number;
  event: 'page_view' | 'scroll' | 'click' | 'form_interaction' | 'search' | 'download' | 'exit';
  data: Record<string, any>;
  duration?: number;
  scrollDepth?: number;
  clickTarget?: string;
  searchQuery?: string;
}

// Content interaction metrics interface
interface ContentInteractionData {
  contentId: string;
  contentType: 'article' | 'calculator' | 'specialty_page' | 'search_results';
  specialty?: string;
  url: string;
  timestamp: number;
  interactions: {
    views: number;
    timeOnPage: number;
    scrollDepth: number;
    clicks: number;
    shares: number;
    downloads: number;
    searches: number;
  };
  userSegment?: string;
  referrer?: string;
}

// SEO performance data interface
interface SEOPerformanceData {
  url: string;
  timestamp: number;
  title: string;
  metaDescription?: string;
  h1Count: number;
  h2Count: number;
  imageCount: number;
  imagesWithoutAlt: number;
  internalLinks: number;
  externalLinks: number;
  wordCount: number;
  readabilityScore?: number;
  loadTime: number;
  mobileUsability: boolean;
  structuredData: boolean;
  canonicalUrl?: string;
}

class PerformanceMonitor {
  private sessionId: string;
  private userId?: string;
  private startTime: number;
  private isEnabled: boolean;
  private apiEndpoint: string;
  private batchSize: number = 10;
  private batchTimeout: number = 5000;
  private pendingData: any[] = [];
  private batchTimer?: number;

  constructor(config: {
    apiEndpoint?: string;
    userId?: string;
    isEnabled?: boolean;
  } = {}) {
    this.sessionId = this.generateSessionId();
    this.userId = config.userId;
    this.startTime = Date.now();
    this.isEnabled = config.isEnabled ?? true;
    this.apiEndpoint = config.apiEndpoint ?? '/api/analytics';

    if (this.isEnabled && typeof window !== 'undefined') {
      this.initializeMonitoring();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMonitoring(): void {
    // Initialize Web Vitals monitoring
    this.initWebVitals();
    
    // Initialize performance monitoring
    this.initPerformanceMonitoring();
    
    // Initialize user behavior tracking
    this.initUserBehaviorTracking();
    
    // Initialize content interaction tracking
    this.initContentInteractionTracking();
    
    // Initialize SEO performance monitoring
    this.initSEOMonitoring();

    // Send data before page unload
    window.addEventListener('beforeunload', () => {
      this.flushPendingData();
    });

    // Send data periodically
    setInterval(() => {
      this.flushPendingData();
    }, 30000); // Every 30 seconds
  }

  private async initWebVitals(): Promise<void> {
    try {
      // Dynamic import of web-vitals library
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');
      
      const sendToAnalytics = (metric: WebVitalsMetric) => {
        this.trackWebVital(metric);
      };

      getCLS(sendToAnalytics);
      getFID(sendToAnalytics);
      getFCP(sendToAnalytics);
      getLCP(sendToAnalytics);
      getTTFB(sendToAnalytics);

      // Try to get INP if available (newer metric)
      try {
        const { getINP } = await import('web-vitals');
        getINP(sendToAnalytics);
      } catch (e) {
        // INP not available in older versions
      }
    } catch (error) {
      console.warn('Web Vitals library not available:', error);
      // Fallback to basic performance monitoring
      this.initBasicPerformanceMonitoring();
    }
  }

  private initBasicPerformanceMonitoring(): void {
    if (!window.performance) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = this.collectPerformanceData();
        this.addToBatch('performance', perfData);
      }, 0);
    });
  }

  private initPerformanceMonitoring(): void {
    // Monitor navigation timing
    if (window.performance && window.performance.navigation) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = this.collectPerformanceData();
          this.addToBatch('performance', perfData);
        }, 0);
      });
    }

    // Monitor resource loading
    if (window.performance && window.performance.getEntriesByType) {
      window.addEventListener('load', () => {
        const resources = window.performance.getEntriesByType('resource');
        const resourceData = resources.map(resource => ({
          name: resource.name,
          type: (resource as any).initiatorType,
          duration: resource.duration,
          transferSize: (resource as any).transferSize || 0,
          timestamp: Date.now()
        }));
        this.addToBatch('resources', resourceData);
      });
    }
  }

  private initUserBehaviorTracking(): void {
    // Track page views
    this.trackPageView();

    // Track scroll behavior
    let scrollDepth = 0;
    let scrollTimer: number;
    
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        const currentScrollDepth = Math.round(
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );
        
        if (currentScrollDepth > scrollDepth) {
          scrollDepth = currentScrollDepth;
          this.trackUserBehavior('scroll', { scrollDepth: currentScrollDepth });
        }
      }, 100);
    });

    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const clickData = {
        tagName: target.tagName,
        className: target.className,
        id: target.id,
        text: target.textContent?.substring(0, 100),
        href: (target as HTMLAnchorElement).href,
        x: event.clientX,
        y: event.clientY
      };
      this.trackUserBehavior('click', clickData);
    });

    // Track form interactions
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        this.trackUserBehavior('form_interaction', {
          formId: target.closest('form')?.id,
          fieldName: (target as HTMLInputElement).name,
          fieldType: (target as HTMLInputElement).type
        });
      }
    });

    // Track search interactions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const searchInput = form.querySelector('input[type="search"], input[name*="search"], input[name*="query"]') as HTMLInputElement;
      
      if (searchInput && searchInput.value) {
        this.trackUserBehavior('search', {
          query: searchInput.value,
          formId: form.id
        });
      }
    });
  }

  private initContentInteractionTracking(): void {
    // Track content views
    const contentElements = document.querySelectorAll('[data-content-id]');
    
    contentElements.forEach(element => {
      const contentId = element.getAttribute('data-content-id');
      const contentType = element.getAttribute('data-content-type') || 'article';
      const specialty = element.getAttribute('data-specialty');
      
      if (contentId) {
        // Track when content comes into view
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.trackContentInteraction(contentId, contentType as any, {
                event: 'view',
                specialty,
                timestamp: Date.now()
              });
            }
          });
        }, { threshold: 0.5 });
        
        observer.observe(element);
      }
    });

    // Track time on page for content
    let pageStartTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Date.now() - pageStartTime;
      const contentId = document.querySelector('[data-content-id]')?.getAttribute('data-content-id');
      
      if (contentId) {
        this.trackContentInteraction(contentId, 'article', {
          event: 'time_on_page',
          duration: timeOnPage
        });
      }
    });
  }

  private initSEOMonitoring(): void {
    // Collect SEO data on page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        const seoData = this.collectSEOData();
        this.addToBatch('seo', seoData);
      }, 1000);
    });
  }

  private collectPerformanceData(): PerformanceData {
    const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const connection = (navigator as any).connection;
    
    return {
      url: window.location.href,
      timestamp: Date.now(),
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstPaint: this.getFirstPaint(),
      firstContentfulPaint: this.getFirstContentfulPaint(),
      timeToFirstByte: navigation.responseStart - navigation.requestStart,
      resourceCount: window.performance.getEntriesByType('resource').length,
      transferSize: navigation.transferSize || 0,
      userAgent: navigator.userAgent,
      connectionType: connection?.effectiveType,
      deviceMemory: (navigator as any).deviceMemory
    };
  }

  private getFirstPaint(): number {
    const paintEntries = window.performance.getEntriesByType('paint');
    const fpEntry = paintEntries.find(entry => entry.name === 'first-paint');
    return fpEntry ? fpEntry.startTime : 0;
  }

  private getFirstContentfulPaint(): number {
    const paintEntries = window.performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcpEntry ? fcpEntry.startTime : 0;
  }

  private collectSEOData(): SEOPerformanceData {
    const title = document.title;
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content');
    const h1Elements = document.querySelectorAll('h1');
    const h2Elements = document.querySelectorAll('h2');
    const images = document.querySelectorAll('img');
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="' + window.location.origin + '"]');
    const externalLinks = document.querySelectorAll('a[href^="http"]:not([href^="' + window.location.origin + '"])');
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
    const structuredData = document.querySelectorAll('script[type="application/ld+json"]').length > 0;
    
    // Calculate word count
    const textContent = document.body.textContent || '';
    const wordCount = textContent.trim().split(/\s+/).length;
    
    // Check mobile usability (basic check)
    const viewport = document.querySelector('meta[name="viewport"]');
    const mobileUsability = !!viewport && viewport.getAttribute('content')?.includes('width=device-width');

    return {
      url: window.location.href,
      timestamp: Date.now(),
      title,
      metaDescription,
      h1Count: h1Elements.length,
      h2Count: h2Elements.length,
      imageCount: images.length,
      imagesWithoutAlt: imagesWithoutAlt.length,
      internalLinks: internalLinks.length,
      externalLinks: externalLinks.length,
      wordCount,
      loadTime: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart,
      mobileUsability,
      structuredData,
      canonicalUrl: canonical
    };
  }

  // Public methods for tracking
  public trackWebVital(metric: WebVitalsMetric): void {
    this.addToBatch('web_vitals', {
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href,
      timestamp: Date.now(),
      ...metric
    });
  }

  public trackPageView(): void {
    this.trackUserBehavior('page_view', {
      referrer: document.referrer,
      title: document.title,
      url: window.location.href
    });
  }

  public trackUserBehavior(event: UserBehaviorData['event'], data: Record<string, any>): void {
    const behaviorData: UserBehaviorData = {
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href,
      timestamp: Date.now(),
      event,
      data
    };

    this.addToBatch('user_behavior', behaviorData);
  }

  public trackContentInteraction(
    contentId: string, 
    contentType: ContentInteractionData['contentType'], 
    data: Record<string, any>
  ): void {
    const interactionData: Partial<ContentInteractionData> = {
      contentId,
      contentType,
      url: window.location.href,
      timestamp: Date.now(),
      userSegment: this.getUserSegment(),
      referrer: document.referrer,
      ...data
    };

    this.addToBatch('content_interaction', interactionData);
  }

  public trackCustomEvent(eventName: string, data: Record<string, any>): void {
    this.addToBatch('custom_event', {
      sessionId: this.sessionId,
      userId: this.userId,
      eventName,
      url: window.location.href,
      timestamp: Date.now(),
      ...data
    });
  }

  private getUserSegment(): string {
    // Simple user segmentation based on behavior
    const isReturningUser = localStorage.getItem('returning_user') === 'true';
    const sessionCount = parseInt(localStorage.getItem('session_count') || '0');
    
    if (!isReturningUser) {
      localStorage.setItem('returning_user', 'true');
      localStorage.setItem('session_count', '1');
      return 'new_user';
    } else {
      localStorage.setItem('session_count', (sessionCount + 1).toString());
      if (sessionCount < 5) {
        return 'returning_user';
      } else {
        return 'loyal_user';
      }
    }
  }

  private addToBatch(type: string, data: any): void {
    if (!this.isEnabled) return;

    this.pendingData.push({ type, data, timestamp: Date.now() });

    if (this.pendingData.length >= this.batchSize) {
      this.flushPendingData();
    } else if (!this.batchTimer) {
      this.batchTimer = window.setTimeout(() => {
        this.flushPendingData();
      }, this.batchTimeout);
    }
  }

  private async flushPendingData(): Promise<void> {
    if (this.pendingData.length === 0) return;

    const dataToSend = [...this.pendingData];
    this.pendingData = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }

    try {
      // Use sendBeacon if available for better reliability
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(dataToSend)], { type: 'application/json' });
        navigator.sendBeacon(this.apiEndpoint, blob);
      } else {
        // Fallback to fetch
        await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend),
          keepalive: true
        });
      }
    } catch (error) {
      console.warn('Failed to send analytics data:', error);
      // Re-add data to pending queue for retry
      this.pendingData.unshift(...dataToSend);
    }
  }

  // Utility methods
  public getSessionId(): string {
    return this.sessionId;
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
    this.flushPendingData();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor({
  isEnabled: typeof window !== 'undefined' && !window.location.hostname.includes('localhost')
});

export default PerformanceMonitor;