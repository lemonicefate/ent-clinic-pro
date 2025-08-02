/**
 * 隱私友善分析工具
 * 提供符合隱私法規的使用者行為分析功能
 */

import type { 
  AnalyticsEvent, 
  MedicalContentEvent, 
  CalculatorEvent, 
  UserJourneyEvent,
  MedicalAnalytics 
} from '../types/analytics';

// 分析配置
interface AnalyticsConfig {
  enabled: boolean;
  endpoint?: string;
  domain?: string;
  trackOutboundLinks: boolean;
  trackFileDownloads: boolean;
  respectDoNotTrack: boolean;
  sessionTimeout: number; // in minutes
}

class PrivacyAnalytics implements MedicalAnalytics {
  private config: AnalyticsConfig;
  private sessionId: string;
  private sessionStartTime: number;
  private isInitialized: boolean = false;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enabled: true,
      trackOutboundLinks: true,
      trackFileDownloads: true,
      respectDoNotTrack: true,
      sessionTimeout: 30,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init(): void {
    // 檢查 Do Not Track 設定
    if (this.config.respectDoNotTrack && this.isDoNotTrackEnabled()) {
      this.config.enabled = false;
      console.log('Analytics disabled due to Do Not Track setting');
      return;
    }

    // 初始化 Plausible 或其他分析工具
    this.initializePlausible();
    
    // 設定自動事件追蹤
    this.setupAutoTracking();
    
    this.isInitialized = true;
  }

  private isDoNotTrackEnabled(): boolean {
    if (typeof navigator === 'undefined') return false;
    
    return (
      navigator.doNotTrack === '1' ||
      (window as any).doNotTrack === '1' ||
      (navigator as any).msDoNotTrack === '1'
    );
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private initializePlausible(): void {
    if (!this.config.domain) return;

    // 動態載入 Plausible 腳本
    const script = document.createElement('script');
    script.defer = true;
    script.src = 'https://plausible.io/js/script.js';
    script.setAttribute('data-domain', this.config.domain);
    
    // 配置 Plausible 選項
    if (this.config.trackOutboundLinks) {
      script.setAttribute('data-api', 'https://plausible.io/api/event');
    }

    document.head.appendChild(script);

    // 等待 Plausible 載入
    script.onload = () => {
      console.log('Plausible analytics loaded');
    };
  }

  private setupAutoTracking(): void {
    // 頁面瀏覽追蹤
    this.trackPageView();

    // 外部連結追蹤
    if (this.config.trackOutboundLinks) {
      this.setupOutboundLinkTracking();
    }

    // 檔案下載追蹤
    if (this.config.trackFileDownloads) {
      this.setupFileDownloadTracking();
    }

    // 會話超時處理
    this.setupSessionTimeout();
  }

  private setupOutboundLinkTracking(): void {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && this.isOutboundLink(link.href)) {
        this.trackEvent({
          name: 'Outbound Link',
          properties: {
            url: link.href,
            text: link.textContent?.trim() || ''
          }
        });
      }
    });
  }

  private setupFileDownloadTracking(): void {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && this.isFileDownload(link.href)) {
        const fileName = link.href.split('/').pop() || '';
        const fileExtension = fileName.split('.').pop() || '';
        
        this.trackEvent({
          name: 'File Download',
          properties: {
            file: fileName,
            extension: fileExtension,
            url: link.href
          }
        });
      }
    });
  }

  private setupSessionTimeout(): void {
    let lastActivity = Date.now();
    
    const updateActivity = () => {
      lastActivity = Date.now();
    };

    // 監聽使用者活動
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // 定期檢查會話超時
    setInterval(() => {
      const inactiveTime = Date.now() - lastActivity;
      const timeoutMs = this.config.sessionTimeout * 60 * 1000;
      
      if (inactiveTime > timeoutMs) {
        this.endSession();
        this.sessionId = this.generateSessionId();
        this.sessionStartTime = Date.now();
      }
    }, 60000); // 每分鐘檢查一次
  }

  private isOutboundLink(url: string): boolean {
    try {
      const link = new URL(url);
      return link.hostname !== window.location.hostname;
    } catch {
      return false;
    }
  }

  private isFileDownload(url: string): boolean {
    const downloadExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar'];
    return downloadExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  // 公開方法
  public trackEvent(event: AnalyticsEvent): void {
    if (!this.config.enabled || !this.isInitialized) return;

    const enrichedEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      sessionId: this.sessionId,
      properties: {
        ...event.properties,
        page: window.location.pathname,
        referrer: document.referrer,
        language: navigator.language,
        userAgent: navigator.userAgent.substring(0, 100) // 限制長度保護隱私
      }
    };

    // 發送到 Plausible
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible(event.name, {
        props: enrichedEvent.properties
      });
    }

    // 本地儲存（可選，用於離線分析）
    this.storeEventLocally(enrichedEvent);
  }

  public trackMedicalContent(event: MedicalContentEvent): void {
    this.trackEvent({
      name: 'Medical Content Usage',
      properties: {
        contentType: event.contentType,
        contentId: event.contentId,
        ...(event.specialty && { specialty: event.specialty }),
        ...(event.language && { language: event.language }),
        ...event.properties
      }
    });
  }

  public trackCalculatorUsage(event: CalculatorEvent): void {
    this.trackEvent({
      name: 'Calculator Usage',
      properties: {
        calculatorId: event.calculatorId,
        inputFields: event.inputFields.join(','),
        ...(event.resultType && { resultType: event.resultType }),
        ...(event.calculationTime && { calculationTime: event.calculationTime }),
        ...(event.specialty && { specialty: event.specialty }),
        ...(event.language && { language: event.language }),
        ...event.properties
      }
    });
  }

  public trackUserJourney(event: UserJourneyEvent): void {
    this.trackEvent({
      name: 'User Journey',
      properties: {
        page: event.page,
        action: event.action,
        ...(event.source && { source: event.source }),
        sessionId: event.sessionId || this.sessionId,
        ...event.properties
      }
    });
  }

  public trackPageView(customProps?: Record<string, any>): void {
    this.trackUserJourney({
      name: 'Page View',
      page: window.location.pathname,
      action: 'page_view',
      properties: {
        title: document.title,
        ...customProps
      }
    });
  }

  public trackSearch(query: string, results: number, category?: string): void {
    this.trackEvent({
      name: 'Search',
      properties: {
        query: query.substring(0, 100), // 限制查詢長度
        results,
        ...(category && { category }),
        queryLength: query.length
      }
    });
  }

  private storeEventLocally(event: AnalyticsEvent & { sessionId: string }): void {
    try {
      const storageKey = 'medical_analytics_events';
      const existingEvents = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // 限制本地儲存的事件數量
      const maxEvents = 1000;
      if (existingEvents.length >= maxEvents) {
        existingEvents.splice(0, existingEvents.length - maxEvents + 1);
      }
      
      existingEvents.push(event);
      localStorage.setItem(storageKey, JSON.stringify(existingEvents));
    } catch (error) {
      console.warn('Failed to store analytics event locally:', error);
    }
  }

  private endSession(): void {
    const sessionDuration = Date.now() - this.sessionStartTime;
    
    this.trackEvent({
      name: 'Session End',
      properties: {
        sessionId: this.sessionId,
        duration: sessionDuration,
        durationMinutes: Math.round(sessionDuration / 60000)
      }
    });
  }

  // 隱私控制方法
  public optOut(): void {
    this.config.enabled = false;
    localStorage.setItem('analytics_opt_out', 'true');
    console.log('Analytics tracking disabled');
  }

  public optIn(): void {
    this.config.enabled = true;
    localStorage.removeItem('analytics_opt_out');
    console.log('Analytics tracking enabled');
  }

  public isOptedOut(): boolean {
    return localStorage.getItem('analytics_opt_out') === 'true';
  }

  public clearLocalData(): void {
    localStorage.removeItem('medical_analytics_events');
    localStorage.removeItem('analytics_opt_out');
    console.log('Local analytics data cleared');
  }

  // 獲取分析統計（用於管理面板）
  public getLocalStats(): {
    totalEvents: number;
    sessionCount: number;
    topPages: Array<{ page: string; count: number }>;
    topCalculators: Array<{ calculator: string; count: number }>;
  } {
    try {
      const events = JSON.parse(localStorage.getItem('medical_analytics_events') || '[]');
      const sessions = new Set(events.map((e: any) => e.sessionId)).size;
      
      // 統計頁面瀏覽
      const pageViews: Record<string, number> = {};
      const calculatorUsage: Record<string, number> = {};
      
      events.forEach((event: any) => {
        if (event.name === 'Page View') {
          pageViews[event.properties.page] = (pageViews[event.properties.page] || 0) + 1;
        } else if (event.name === 'Calculator Usage') {
          const calc = event.properties.calculatorId;
          calculatorUsage[calc] = (calculatorUsage[calc] || 0) + 1;
        }
      });
      
      return {
        totalEvents: events.length,
        sessionCount: sessions,
        topPages: Object.entries(pageViews)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([page, count]) => ({ page, count })),
        topCalculators: Object.entries(calculatorUsage)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([calculator, count]) => ({ calculator, count }))
      };
    } catch {
      return {
        totalEvents: 0,
        sessionCount: 0,
        topPages: [],
        topCalculators: []
      };
    }
  }
}

// 全域分析實例
let analyticsInstance: PrivacyAnalytics | null = null;

export function initializeAnalytics(config?: Partial<AnalyticsConfig>): PrivacyAnalytics {
  if (!analyticsInstance) {
    analyticsInstance = new PrivacyAnalytics(config);
  }
  return analyticsInstance;
}

export function getAnalytics(): PrivacyAnalytics | null {
  return analyticsInstance;
}

// 便利函數
export function trackMedicalContent(event: MedicalContentEvent): void {
  analyticsInstance?.trackMedicalContent(event);
}

export function trackCalculatorUsage(event: CalculatorEvent): void {
  analyticsInstance?.trackCalculatorUsage(event);
}

export function trackUserJourney(event: UserJourneyEvent): void {
  analyticsInstance?.trackUserJourney(event);
}

export function trackPageView(customProps?: Record<string, any>): void {
  analyticsInstance?.trackPageView(customProps);
}

export function trackSearch(query: string, results: number, category?: string): void {
  analyticsInstance?.trackSearch(query, results, category);
}