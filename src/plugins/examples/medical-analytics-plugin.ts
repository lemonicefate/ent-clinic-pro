/**
 * Medical Analytics Plugin Example
 * 示範醫療分析插件的實現
 */

import type { Plugin, PluginContext, PluginMetadata, PluginType } from '../core/plugin-manager';

// 醫療分析介面
export interface MedicalAnalytics {
  trackCalculatorUsage(calculatorId: string, result: any, metadata?: any): Promise<void>;
  trackContentView(contentId: string, contentType: string, metadata?: any): Promise<void>;
  trackUserAction(action: string, data?: any): Promise<void>;
  getUsageStats(timeRange?: TimeRange): Promise<UsageStats>;
  generateReport(type: ReportType, options?: ReportOptions): Promise<AnalyticsReport>;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface UsageStats {
  totalUsers: number;
  activeUsers: number;
  calculatorUsage: Record<string, number>;
  contentViews: Record<string, number>;
  topActions: Array<{ action: string; count: number }>;
  timeRange: TimeRange;
}

export enum ReportType {
  USAGE_SUMMARY = 'usage_summary',
  CALCULATOR_PERFORMANCE = 'calculator_performance',
  CONTENT_ENGAGEMENT = 'content_engagement',
  USER_BEHAVIOR = 'user_behavior',
  MEDICAL_COMPLIANCE = 'medical_compliance'
}

export interface ReportOptions {
  timeRange?: TimeRange;
  includeDetails?: boolean;
  format?: 'json' | 'csv' | 'pdf';
  filters?: Record<string, any>;
}

export interface AnalyticsReport {
  id: string;
  type: ReportType;
  generatedAt: Date;
  timeRange: TimeRange;
  data: any;
  summary: string;
  recommendations?: string[];
}

/**
 * 醫療分析插件實現
 */
export class MedicalAnalyticsPlugin implements Plugin {
  readonly metadata: PluginMetadata = {
    id: 'medical-analytics',
    name: 'Medical Analytics',
    version: '1.2.0',
    description: 'Privacy-compliant medical platform analytics and reporting',
    author: 'Astro Clinical Platform',
    type: PluginType.ANALYTICS,
    category: 'analytics',
    tags: ['analytics', 'reporting', 'privacy', 'medical'],
    homepage: 'https://astro-clinical.com/plugins/analytics',
    license: 'MIT',
    permissions: {
      api: ['analytics.provider', 'medical.calculator'],
      storage: true,
      network: true,
      fileSystem: false,
      medicalData: true,
      patientData: false, // 不處理患者個人資料
      adminAccess: false
    },
    medicalCompliance: {
      hipaa: true,
      fda: false,
      ce: true,
      iso13485: false
    },
    supportedLanguages: ['en', 'zh-TW', 'zh-CN', 'ja']
  };

  private context?: PluginContext;
  private analytics?: MedicalAnalytics;
  private eventBuffer: AnalyticsEvent[] = [];
  private flushInterval?: NodeJS.Timeout;

  async load(context: PluginContext): Promise<void> {
    this.context = context;
    context.logger.info('Loading Medical Analytics Plugin');

    // 初始化分析器
    this.analytics = new MedicalAnalyticsImpl(context);

    // 註冊擴展
    const pluginManager = (globalThis as any).pluginManager;
    if (pluginManager) {
      pluginManager.registerExtension({
        extensionPoint: 'analytics.provider',
        pluginId: this.metadata.id,
        priority: 90,
        implementation: this.analytics
      });
    }

    // 設置事件監聽
    this.setupEventListeners(context);

    context.logger.info('Medical Analytics Plugin loaded successfully');
  }

  async start(context: PluginContext): Promise<void> {
    context.logger.info('Starting Medical Analytics Plugin');

    // 載入配置
    const config = await context.storage.get('config') || {
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      enableRealTimeTracking: true,
      privacyMode: true
    };

    // 啟動批次處理
    this.startBatchProcessing(config.flushInterval);

    context.logger.info('Medical Analytics Plugin started', { config });
  }

  async stop(context: PluginContext): Promise<void> {
    context.logger.info('Stopping Medical Analytics Plugin');

    // 停止批次處理
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = undefined;
    }

    // 處理剩餘事件
    await this.flushEvents();
  }

  async unload(context: PluginContext): Promise<void> {
    context.logger.info('Unloading Medical Analytics Plugin');
    this.analytics = undefined;
    this.context = undefined;
    this.eventBuffer = [];
  }

  async healthCheck(): Promise<boolean> {
    if (!this.analytics) return false;

    try {
      // 測試基本功能
      await this.analytics.trackUserAction('health_check', { timestamp: Date.now() });
      return true;
    } catch (error) {
      this.context?.logger.error('Health check failed', error);
      return false;
    }
  }

  private setupEventListeners(context: PluginContext): void {
    // 監聽計算器使用事件
    context.events.on('calculator:used', (data) => {
      this.analytics?.trackCalculatorUsage(data.calculatorId, data.result, data.metadata);
    });

    // 監聽內容查看事件
    context.events.on('content:viewed', (data) => {
      this.analytics?.trackContentView(data.contentId, data.contentType, data.metadata);
    });

    // 監聽用戶行為事件
    context.events.on('user:action', (data) => {
      this.analytics?.trackUserAction(data.action, data.data);
    });
  }

  private startBatchProcessing(interval: number): void {
    this.flushInterval = setInterval(async () => {
      await this.flushEvents();
    }, interval);
  }

  private async flushEvents(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    try {
      const events = [...this.eventBuffer];
      this.eventBuffer = [];

      // 處理事件批次
      await this.processBatch(events);
      
      this.context?.logger.debug(`Processed ${events.length} analytics events`);
    } catch (error) {
      this.context?.logger.error('Failed to flush analytics events', error);
    }
  }

  private async processBatch(events: AnalyticsEvent[]): Promise<void> {
    // 在實際實現中，這裡會將事件發送到分析服務
    // 為了隱私合規，確保不包含個人識別資訊
    const sanitizedEvents = events.map(event => ({
      ...event,
      userId: event.userId ? this.hashUserId(event.userId) : undefined,
      sessionId: event.sessionId ? this.hashSessionId(event.sessionId) : undefined
    }));

    // 儲存到本地存儲（在生產環境中應該發送到分析服務）
    const existingData = await this.context?.storage.get('analytics_data') || [];
    await this.context?.storage.set('analytics_data', [...existingData, ...sanitizedEvents]);
  }

  private hashUserId(userId: string): string {
    // 簡單的雜湊實現，實際應使用加密雜湊
    return btoa(userId).substring(0, 8);
  }

  private hashSessionId(sessionId: string): string {
    return btoa(sessionId).substring(0, 12);
  }
}

/**
 * 分析事件介面
 */
interface AnalyticsEvent {
  id: string;
  type: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  data: any;
  metadata?: any;
}

/**
 * 醫療分析實現
 */
class MedicalAnalyticsImpl implements MedicalAnalytics {
  
  constructor(private context: PluginContext) {}

  async trackCalculatorUsage(calculatorId: string, result: any, metadata?: any): Promise<void> {
    const event: AnalyticsEvent = {
      id: this.context.utils.generateId(),
      type: 'calculator_usage',
      timestamp: new Date(),
      data: {
        calculatorId,
        result: this.sanitizeResult(result),
        metadata
      }
    };

    await this.recordEvent(event);
  }

  async trackContentView(contentId: string, contentType: string, metadata?: any): Promise<void> {
    const event: AnalyticsEvent = {
      id: this.context.utils.generateId(),
      type: 'content_view',
      timestamp: new Date(),
      data: {
        contentId,
        contentType,
        metadata
      }
    };

    await this.recordEvent(event);
  }

  async trackUserAction(action: string, data?: any): Promise<void> {
    const event: AnalyticsEvent = {
      id: this.context.utils.generateId(),
      type: 'user_action',
      timestamp: new Date(),
      data: {
        action,
        data: this.sanitizeData(data)
      }
    };

    await this.recordEvent(event);
  }

  async getUsageStats(timeRange?: TimeRange): Promise<UsageStats> {
    const events = await this.getEvents(timeRange);
    
    const calculatorUsage: Record<string, number> = {};
    const contentViews: Record<string, number> = {};
    const actionCounts: Record<string, number> = {};
    const uniqueUsers = new Set<string>();
    const activeSessions = new Set<string>();

    events.forEach(event => {
      if (event.userId) uniqueUsers.add(event.userId);
      if (event.sessionId) activeSessions.add(event.sessionId);

      switch (event.type) {
        case 'calculator_usage':
          const calcId = event.data.calculatorId;
          calculatorUsage[calcId] = (calculatorUsage[calcId] || 0) + 1;
          break;

        case 'content_view':
          const contentId = event.data.contentId;
          contentViews[contentId] = (contentViews[contentId] || 0) + 1;
          break;

        case 'user_action':
          const action = event.data.action;
          actionCounts[action] = (actionCounts[action] || 0) + 1;
          break;
      }
    });

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalUsers: uniqueUsers.size,
      activeUsers: activeSessions.size,
      calculatorUsage,
      contentViews,
      topActions,
      timeRange: timeRange || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date()
      }
    };
  }

  async generateReport(type: ReportType, options?: ReportOptions): Promise<AnalyticsReport> {
    const timeRange = options?.timeRange || {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      end: new Date()
    };

    const stats = await this.getUsageStats(timeRange);
    
    let data: any;
    let summary: string;
    let recommendations: string[] = [];

    switch (type) {
      case ReportType.USAGE_SUMMARY:
        data = stats;
        summary = `Platform had ${stats.activeUsers} active users with ${stats.totalUsers} total users in the specified period.`;
        recommendations = this.generateUsageRecommendations(stats);
        break;

      case ReportType.CALCULATOR_PERFORMANCE:
        data = {
          calculatorUsage: stats.calculatorUsage,
          totalCalculations: Object.values(stats.calculatorUsage).reduce((sum, count) => sum + count, 0)
        };
        summary = `${data.totalCalculations} calculations performed across ${Object.keys(stats.calculatorUsage).length} different calculators.`;
        recommendations = this.generateCalculatorRecommendations(stats.calculatorUsage);
        break;

      case ReportType.CONTENT_ENGAGEMENT:
        data = {
          contentViews: stats.contentViews,
          totalViews: Object.values(stats.contentViews).reduce((sum, count) => sum + count, 0)
        };
        summary = `${data.totalViews} content views across ${Object.keys(stats.contentViews).length} different pieces of content.`;
        recommendations = this.generateContentRecommendations(stats.contentViews);
        break;

      default:
        throw new Error(`Unsupported report type: ${type}`);
    }

    return {
      id: this.context.utils.generateId(),
      type,
      generatedAt: new Date(),
      timeRange,
      data,
      summary,
      recommendations
    };
  }

  private async recordEvent(event: AnalyticsEvent): Promise<void> {
    // 在實際實現中，這裡會將事件添加到批次處理佇列
    this.context.logger.debug('Analytics event recorded', { type: event.type, id: event.id });
  }

  private async getEvents(timeRange?: TimeRange): Promise<AnalyticsEvent[]> {
    const allEvents = await this.context.storage.get('analytics_data') || [];
    
    if (!timeRange) return allEvents;

    return allEvents.filter((event: AnalyticsEvent) => {
      const eventTime = new Date(event.timestamp);
      return eventTime >= timeRange.start && eventTime <= timeRange.end;
    });
  }

  private sanitizeResult(result: any): any {
    // 移除可能包含個人資訊的欄位
    if (typeof result === 'object' && result !== null) {
      const sanitized = { ...result };
      delete sanitized.patientId;
      delete sanitized.userId;
      delete sanitized.personalInfo;
      return sanitized;
    }
    return result;
  }

  private sanitizeData(data: any): any {
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      delete sanitized.email;
      delete sanitized.phone;
      delete sanitized.address;
      delete sanitized.ssn;
      return sanitized;
    }
    return data;
  }

  private generateUsageRecommendations(stats: UsageStats): string[] {
    const recommendations: string[] = [];

    if (stats.activeUsers < stats.totalUsers * 0.3) {
      recommendations.push('Consider improving user engagement strategies');
    }

    if (Object.keys(stats.calculatorUsage).length < 5) {
      recommendations.push('Promote underutilized calculators to increase adoption');
    }

    if (stats.topActions.length > 0 && stats.topActions[0].count > stats.totalUsers * 0.8) {
      recommendations.push('Most popular action indicates strong user preference - consider expanding similar features');
    }

    return recommendations;
  }

  private generateCalculatorRecommendations(usage: Record<string, number>): string[] {
    const recommendations: string[] = [];
    const sortedUsage = Object.entries(usage).sort(([,a], [,b]) => b - a);

    if (sortedUsage.length > 0) {
      const [topCalculator] = sortedUsage[0];
      recommendations.push(`${topCalculator} is the most popular calculator - ensure it's prominently featured`);
    }

    const lowUsageCalculators = sortedUsage.filter(([, count]) => count < 10);
    if (lowUsageCalculators.length > 0) {
      recommendations.push(`${lowUsageCalculators.length} calculators have low usage - consider improving discoverability`);
    }

    return recommendations;
  }

  private generateContentRecommendations(views: Record<string, number>): string[] {
    const recommendations: string[] = [];
    const sortedViews = Object.entries(views).sort(([,a], [,b]) => b - a);

    if (sortedViews.length > 0) {
      const [topContent] = sortedViews[0];
      recommendations.push(`${topContent} is the most viewed content - consider creating similar content`);
    }

    const lowViewContent = sortedViews.filter(([, count]) => count < 5);
    if (lowViewContent.length > 0) {
      recommendations.push(`${lowViewContent.length} pieces of content have low engagement - review and optimize`);
    }

    return recommendations;
  }
}

// 導出插件實例
export default new MedicalAnalyticsPlugin();