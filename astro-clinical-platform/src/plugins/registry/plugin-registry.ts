/**
 * Plugin Registry and Marketplace System
 * 插件註冊表和市場系統
 */

import type { PluginMetadata, PluginType } from '../core/plugin-manager';
import { AuditLogger } from '../../utils/security-measures';

// 插件註冊資訊
export interface PluginRegistration {
  metadata: PluginMetadata;
  source: string;
  registeredAt: Date;
  lastUpdated: Date;
  status: PluginRegistrationStatus;
  downloads: number;
  rating: number;
  reviews: PluginReview[];
  verified: boolean;
  publisher: PluginPublisher;
  screenshots?: string[];
  documentation?: string;
  changelog?: PluginChangelogEntry[];
}

export enum PluginRegistrationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
  DEPRECATED = 'deprecated'
}

export interface PluginReview {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  helpful: number;
  version: string;
}

export interface PluginPublisher {
  id: string;
  name: string;
  email: string;
  organization?: string;
  verified: boolean;
  reputation: number;
  publishedPlugins: number;
}

export interface PluginChangelogEntry {
  version: string;
  date: Date;
  changes: string[];
  breaking: boolean;
}

// 搜尋和篩選選項
export interface PluginSearchOptions {
  query?: string;
  type?: PluginType;
  category?: string;
  tags?: string[];
  verified?: boolean;
  minRating?: number;
  sortBy?: 'name' | 'rating' | 'downloads' | 'updated' | 'created';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface PluginSearchResult {
  plugins: PluginRegistration[];
  total: number;
  hasMore: boolean;
}

// 插件市場統計
export interface MarketplaceStats {
  totalPlugins: number;
  verifiedPlugins: number;
  totalDownloads: number;
  averageRating: number;
  pluginsByType: Record<PluginType, number>;
  topPlugins: PluginRegistration[];
  recentPlugins: PluginRegistration[];
}

/**
 * 插件註冊表 - 管理插件的註冊、搜尋和元數據
 */
export class PluginRegistry {
  private plugins = new Map<string, PluginRegistration>();
  private publishers = new Map<string, PluginPublisher>();
  private categories = new Set<string>();
  private tags = new Set<string>();

  constructor(private readonly options: {
    enableReviews?: boolean;
    requireVerification?: boolean;
    maxPluginsPerPublisher?: number;
    enableAutoApproval?: boolean;
  } = {}) {
    this.options = {
      enableReviews: true,
      requireVerification: false,
      maxPluginsPerPublisher: 10,
      enableAutoApproval: false,
      ...options
    };

    this.loadBuiltinPlugins();
  }

  /**
   * 註冊插件
   */
  async registerPlugin(
    metadata: PluginMetadata,
    source: string,
    publisher: PluginPublisher,
    options?: {
      screenshots?: string[];
      documentation?: string;
      autoApprove?: boolean;
    }
  ): Promise<string> {
    // 驗證插件元數據
    this.validatePluginMetadata(metadata);

    // 檢查插件是否已存在
    if (this.plugins.has(metadata.id)) {
      throw new Error(`Plugin ${metadata.id} is already registered`);
    }

    // 檢查發布者限制
    const publisherPlugins = Array.from(this.plugins.values())
      .filter(p => p.publisher.id === publisher.id);
    
    if (publisherPlugins.length >= (this.options.maxPluginsPerPublisher || 10)) {
      throw new Error('Publisher has reached maximum plugin limit');
    }

    // 創建註冊記錄
    const registration: PluginRegistration = {
      metadata,
      source,
      registeredAt: new Date(),
      lastUpdated: new Date(),
      status: this.determineInitialStatus(publisher, options?.autoApprove),
      downloads: 0,
      rating: 0,
      reviews: [],
      verified: publisher.verified,
      publisher,
      screenshots: options?.screenshots,
      documentation: options?.documentation,
      changelog: []
    };

    // 儲存註冊資訊
    this.plugins.set(metadata.id, registration);
    this.updatePublisher(publisher);
    this.updateCategories(metadata);

    // 記錄審計日誌
    AuditLogger.logSecurityEvent(
      'plugin_registered',
      { request: { url: 'plugin-registry' } } as any,
      true,
      {
        pluginId: metadata.id,
        publisherId: publisher.id,
        status: registration.status
      },
      'medium'
    );

    return metadata.id;
  }

  /**
   * 更新插件
   */
  async updatePlugin(
    pluginId: string,
    updates: Partial<PluginMetadata>,
    changelog?: PluginChangelogEntry
  ): Promise<void> {
    const registration = this.plugins.get(pluginId);
    if (!registration) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // 更新元數據
    registration.metadata = { ...registration.metadata, ...updates };
    registration.lastUpdated = new Date();

    // 添加變更日誌
    if (changelog) {
      registration.changelog = registration.changelog || [];
      registration.changelog.unshift(changelog);
    }

    // 如果是重大更新，可能需要重新審核
    if (changelog?.breaking) {
      registration.status = PluginRegistrationStatus.PENDING;
    }

    this.plugins.set(pluginId, registration);
    this.updateCategories(registration.metadata);

    AuditLogger.logSecurityEvent(
      'plugin_updated',
      { request: { url: 'plugin-registry' } } as any,
      true,
      { pluginId, hasBreakingChanges: changelog?.breaking },
      'low'
    );
  }

  /**
   * 搜尋插件
   */
  searchPlugins(options: PluginSearchOptions = {}): PluginSearchResult {
    let results = Array.from(this.plugins.values());

    // 只顯示已批准的插件
    results = results.filter(p => p.status === PluginRegistrationStatus.APPROVED);

    // 文字搜尋
    if (options.query) {
      const query = options.query.toLowerCase();
      results = results.filter(p => 
        p.metadata.name.toLowerCase().includes(query) ||
        p.metadata.description.toLowerCase().includes(query) ||
        p.metadata.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 類型篩選
    if (options.type) {
      results = results.filter(p => p.metadata.type === options.type);
    }

    // 分類篩選
    if (options.category) {
      results = results.filter(p => p.metadata.category === options.category);
    }

    // 標籤篩選
    if (options.tags && options.tags.length > 0) {
      results = results.filter(p => 
        options.tags!.some(tag => p.metadata.tags?.includes(tag))
      );
    }

    // 驗證狀態篩選
    if (options.verified !== undefined) {
      results = results.filter(p => p.verified === options.verified);
    }

    // 評分篩選
    if (options.minRating) {
      results = results.filter(p => p.rating >= options.minRating!);
    }

    // 排序
    const sortBy = options.sortBy || 'name';
    const sortOrder = options.sortOrder || 'asc';
    
    results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.metadata.name.localeCompare(b.metadata.name);
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'downloads':
          comparison = a.downloads - b.downloads;
          break;
        case 'updated':
          comparison = a.lastUpdated.getTime() - b.lastUpdated.getTime();
          break;
        case 'created':
          comparison = a.registeredAt.getTime() - b.registeredAt.getTime();
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // 分頁
    const offset = options.offset || 0;
    const limit = options.limit || 20;
    const total = results.length;
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      plugins: paginatedResults,
      total,
      hasMore: offset + limit < total
    };
  }

  /**
   * 獲取插件詳情
   */
  getPlugin(pluginId: string): PluginRegistration | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * 獲取插件列表
   */
  getPluginsByType(type: PluginType): PluginRegistration[] {
    return Array.from(this.plugins.values())
      .filter(p => p.metadata.type === type && p.status === PluginRegistrationStatus.APPROVED);
  }

  /**
   * 獲取發布者的插件
   */
  getPluginsByPublisher(publisherId: string): PluginRegistration[] {
    return Array.from(this.plugins.values())
      .filter(p => p.publisher.id === publisherId);
  }

  /**
   * 添加評論
   */
  async addReview(
    pluginId: string,
    review: Omit<PluginReview, 'id' | 'createdAt' | 'helpful'>
  ): Promise<void> {
    if (!this.options.enableReviews) {
      throw new Error('Reviews are not enabled');
    }

    const registration = this.plugins.get(pluginId);
    if (!registration) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // 檢查用戶是否已經評論過
    const existingReview = registration.reviews.find(r => r.userId === review.userId);
    if (existingReview) {
      throw new Error('User has already reviewed this plugin');
    }

    const newReview: PluginReview = {
      ...review,
      id: this.generateId(),
      createdAt: new Date(),
      helpful: 0
    };

    registration.reviews.push(newReview);
    
    // 重新計算平均評分
    registration.rating = registration.reviews.reduce((sum, r) => sum + r.rating, 0) / registration.reviews.length;

    this.plugins.set(pluginId, registration);
  }

  /**
   * 記錄下載
   */
  recordDownload(pluginId: string): void {
    const registration = this.plugins.get(pluginId);
    if (registration) {
      registration.downloads++;
      this.plugins.set(pluginId, registration);
    }
  }

  /**
   * 批准插件
   */
  async approvePlugin(pluginId: string, reviewerId: string): Promise<void> {
    const registration = this.plugins.get(pluginId);
    if (!registration) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    registration.status = PluginRegistrationStatus.APPROVED;
    registration.lastUpdated = new Date();

    this.plugins.set(pluginId, registration);

    AuditLogger.logSecurityEvent(
      'plugin_approved',
      { request: { url: 'plugin-registry' } } as any,
      true,
      { pluginId, reviewerId },
      'medium'
    );
  }

  /**
   * 拒絕插件
   */
  async rejectPlugin(pluginId: string, reason: string, reviewerId: string): Promise<void> {
    const registration = this.plugins.get(pluginId);
    if (!registration) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    registration.status = PluginRegistrationStatus.REJECTED;
    registration.lastUpdated = new Date();

    this.plugins.set(pluginId, registration);

    AuditLogger.logSecurityEvent(
      'plugin_rejected',
      { request: { url: 'plugin-registry' } } as any,
      true,
      { pluginId, reason, reviewerId },
      'medium'
    );
  }

  /**
   * 獲取市場統計
   */
  getMarketplaceStats(): MarketplaceStats {
    const allPlugins = Array.from(this.plugins.values());
    const approvedPlugins = allPlugins.filter(p => p.status === PluginRegistrationStatus.APPROVED);
    const verifiedPlugins = approvedPlugins.filter(p => p.verified);

    const pluginsByType = {} as Record<PluginType, number>;
    Object.values(PluginType).forEach(type => {
      pluginsByType[type] = approvedPlugins.filter(p => p.metadata.type === type).length;
    });

    const topPlugins = approvedPlugins
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 10);

    const recentPlugins = approvedPlugins
      .sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime())
      .slice(0, 10);

    return {
      totalPlugins: approvedPlugins.length,
      verifiedPlugins: verifiedPlugins.length,
      totalDownloads: approvedPlugins.reduce((sum, p) => sum + p.downloads, 0),
      averageRating: approvedPlugins.reduce((sum, p) => sum + p.rating, 0) / approvedPlugins.length || 0,
      pluginsByType,
      topPlugins,
      recentPlugins
    };
  }

  /**
   * 獲取所有分類
   */
  getCategories(): string[] {
    return Array.from(this.categories);
  }

  /**
   * 獲取所有標籤
   */
  getTags(): string[] {
    return Array.from(this.tags);
  }

  // 私有方法

  private validatePluginMetadata(metadata: PluginMetadata): void {
    const required = ['id', 'name', 'version', 'description', 'author', 'type', 'license', 'permissions'];
    
    for (const field of required) {
      if (!metadata[field as keyof PluginMetadata]) {
        throw new Error(`Plugin metadata must include ${field}`);
      }
    }

    // 驗證版本格式
    if (!/^\d+\.\d+\.\d+/.test(metadata.version)) {
      throw new Error('Plugin version must follow semantic versioning (x.y.z)');
    }

    // 驗證權限
    if (!metadata.permissions || typeof metadata.permissions !== 'object') {
      throw new Error('Plugin must specify permissions');
    }
  }

  private determineInitialStatus(
    publisher: PluginPublisher,
    autoApprove?: boolean
  ): PluginRegistrationStatus {
    if (autoApprove || this.options.enableAutoApproval) {
      return PluginRegistrationStatus.APPROVED;
    }

    if (publisher.verified && publisher.reputation > 80) {
      return PluginRegistrationStatus.APPROVED;
    }

    return PluginRegistrationStatus.PENDING;
  }

  private updatePublisher(publisher: PluginPublisher): void {
    const existing = this.publishers.get(publisher.id);
    if (existing) {
      existing.publishedPlugins++;
    } else {
      this.publishers.set(publisher.id, { ...publisher, publishedPlugins: 1 });
    }
  }

  private updateCategories(metadata: PluginMetadata): void {
    if (metadata.category) {
      this.categories.add(metadata.category);
    }
    
    if (metadata.tags) {
      metadata.tags.forEach(tag => this.tags.add(tag));
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadBuiltinPlugins(): void {
    // 載入內建插件註冊資訊
    const builtinPublisher: PluginPublisher = {
      id: 'astro-clinical-platform',
      name: 'Astro Clinical Platform',
      email: 'plugins@your-domain.com',
      organization: 'Astro Clinical Platform',
      verified: true,
      reputation: 100,
      publishedPlugins: 0
    };

    // 這裡可以註冊內建插件
    // 實際實現中應該從配置文件或數據庫載入
  }
}

// 導出單例實例
export const pluginRegistry = new PluginRegistry({
  enableReviews: true,
  requireVerification: false,
  maxPluginsPerPublisher: 20,
  enableAutoApproval: false
});