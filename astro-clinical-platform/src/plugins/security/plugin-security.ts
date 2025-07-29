/**
 * Plugin Security System
 * 插件安全系統 - 權限管理、沙盒執行、安全驗證
 */

import type { Plugin, PluginMetadata, PluginPermissions, PluginContext } from '../core/plugin-manager';
import { AuditLogger } from '../../utils/security-measures';

// 安全策略定義
export interface SecurityPolicy {
  allowedDomains: string[];
  blockedDomains: string[];
  maxMemoryUsage: number; // bytes
  maxExecutionTime: number; // milliseconds
  allowedFileExtensions: string[];
  blockedFileExtensions: string[];
  requireSignature: boolean;
  allowRemotePlugins: boolean;
  sandboxEnabled: boolean;
  auditLevel: 'none' | 'basic' | 'detailed' | 'full';
}

// 權限檢查結果
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations?: string[];
}

// 安全事件類型
export enum SecurityEventType {
  PERMISSION_DENIED = 'permission_denied',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RESOURCE_LIMIT_EXCEEDED = 'resource_limit_exceeded',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  MALICIOUS_CODE_DETECTED = 'malicious_code_detected',
  SIGNATURE_VERIFICATION_FAILED = 'signature_verification_failed'
}

// 安全事件
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  pluginId: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: any;
  resolved: boolean;
}

// 插件簽名資訊
export interface PluginSignature {
  algorithm: string;
  signature: string;
  publicKey: string;
  timestamp: Date;
  issuer: string;
}

/**
 * 插件安全管理器
 */
export class PluginSecurityManager {
  private securityEvents: SecurityEvent[] = [];
  private trustedPublishers = new Set<string>();
  private blockedPlugins = new Set<string>();
  private resourceUsage = new Map<string, ResourceUsage>();

  constructor(private readonly policy: SecurityPolicy) {
    this.setupTrustedPublishers();
    this.startResourceMonitoring();
  }

  /**
   * 驗證插件安全性
   */
  async validatePluginSecurity(plugin: Plugin, source: string): Promise<PermissionCheckResult> {
    const metadata = plugin.metadata;
    
    try {
      // 1. 檢查插件是否被封鎖
      if (this.blockedPlugins.has(metadata.id)) {
        return {
          allowed: false,
          reason: 'Plugin is blocked',
          riskLevel: 'critical'
        };
      }

      // 2. 驗證插件簽名
      if (this.policy.requireSignature) {
        const signatureValid = await this.verifyPluginSignature(plugin, source);
        if (!signatureValid) {
          this.recordSecurityEvent({
            type: SecurityEventType.SIGNATURE_VERIFICATION_FAILED,
            pluginId: metadata.id,
            severity: 'high',
            description: 'Plugin signature verification failed',
            details: { source }
          });

          return {
            allowed: false,
            reason: 'Invalid or missing signature',
            riskLevel: 'high',
            recommendations: ['Obtain plugin from trusted source', 'Verify publisher identity']
          };
        }
      }

      // 3. 檢查權限
      const permissionCheck = this.checkPermissions(metadata.permissions);
      if (!permissionCheck.allowed) {
        return permissionCheck;
      }

      // 4. 檢查來源域名
      if (this.isRemoteSource(source)) {
        const domainCheck = this.checkSourceDomain(source);
        if (!domainCheck.allowed) {
          return domainCheck;
        }
      }

      // 5. 靜態代碼分析
      const codeAnalysis = await this.analyzePluginCode(plugin, source);
      if (!codeAnalysis.allowed) {
        return codeAnalysis;
      }

      // 6. 檢查發布者信譽
      const publisherCheck = this.checkPublisherReputation(metadata);
      
      return {
        allowed: true,
        riskLevel: publisherCheck.riskLevel,
        recommendations: publisherCheck.recommendations
      };

    } catch (error) {
      this.recordSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        pluginId: metadata.id,
        severity: 'medium',
        description: 'Security validation failed',
        details: { error: error.message, source }
      });

      return {
        allowed: false,
        reason: 'Security validation error',
        riskLevel: 'medium'
      };
    }
  }

  /**
   * 檢查權限
   */
  checkPermissions(permissions: PluginPermissions): PermissionCheckResult {
    const risks: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // 檢查敏感權限
    if (permissions.patientData) {
      risks.push('Access to patient data');
      riskLevel = 'high';
    }

    if (permissions.medicalData) {
      risks.push('Access to medical data');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    if (permissions.adminAccess) {
      risks.push('Administrative access requested');
      riskLevel = 'critical';
      
      return {
        allowed: false,
        reason: 'Administrative access is not allowed for plugins',
        riskLevel: 'critical'
      };
    }

    if (permissions.fileSystem) {
      risks.push('File system access');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    if (permissions.network) {
      risks.push('Network access');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    // 檢查 API 權限
    if (permissions.api && permissions.api.length > 0) {
      const sensitiveApis = permissions.api.filter(api => 
        api.includes('admin') || api.includes('auth') || api.includes('patient')
      );
      
      if (sensitiveApis.length > 0) {
        risks.push(`Access to sensitive APIs: ${sensitiveApis.join(', ')}`);
        riskLevel = 'high';
      }
    }

    const recommendations: string[] = [];
    if (risks.length > 0) {
      recommendations.push('Review plugin permissions carefully');
      recommendations.push('Monitor plugin behavior after installation');
    }

    return {
      allowed: true,
      riskLevel,
      recommendations: risks.length > 0 ? recommendations : undefined
    };
  }

  /**
   * 創建安全的插件上下文
   */
  createSecureContext(plugin: Plugin, baseContext: PluginContext): PluginContext {
    const metadata = plugin.metadata;
    const permissions = metadata.permissions;

    // 創建受限的上下文
    const secureContext: PluginContext = {
      ...baseContext,
      
      // 限制儲存訪問
      storage: permissions.storage ? baseContext.storage : {
        get: async () => { throw new Error('Storage access denied'); },
        set: async () => { throw new Error('Storage access denied'); },
        delete: async () => { throw new Error('Storage access denied'); },
        clear: async () => { throw new Error('Storage access denied'); }
      },

      // 包裝工具函數以添加安全檢查
      utils: {
        ...baseContext.utils,
        validateMedicalData: permissions.medicalData 
          ? baseContext.utils.validateMedicalData 
          : () => { throw new Error('Medical data access denied'); },
        
        sanitizeHtml: (html: string) => {
          // 增強的 HTML 清理
          return this.sanitizeHtml(html);
        },

        generateId: baseContext.utils.generateId
      }
    };

    // 監控資源使用
    this.startResourceMonitoringForPlugin(metadata.id);

    return secureContext;
  }

  /**
   * 檢查運行時權限
   */
  checkRuntimePermission(pluginId: string, permission: string, resource?: string): boolean {
    const plugin = this.getPluginById(pluginId);
    if (!plugin) {
      this.recordSecurityEvent({
        type: SecurityEventType.UNAUTHORIZED_ACCESS,
        pluginId,
        severity: 'high',
        description: 'Unknown plugin attempted access',
        details: { permission, resource }
      });
      return false;
    }

    // 檢查權限
    const hasPermission = this.hasPermission(plugin.metadata.permissions, permission);
    
    if (!hasPermission) {
      this.recordSecurityEvent({
        type: SecurityEventType.PERMISSION_DENIED,
        pluginId,
        severity: 'medium',
        description: `Permission denied: ${permission}`,
        details: { permission, resource }
      });
    }

    return hasPermission;
  }

  /**
   * 監控資源使用
   */
  monitorResourceUsage(pluginId: string): ResourceUsage {
    const usage = this.resourceUsage.get(pluginId) || {
      memoryUsage: 0,
      cpuUsage: 0,
      networkRequests: 0,
      storageUsage: 0,
      executionTime: 0,
      lastUpdated: new Date()
    };

    // 檢查是否超出限制
    if (usage.memoryUsage > this.policy.maxMemoryUsage) {
      this.recordSecurityEvent({
        type: SecurityEventType.RESOURCE_LIMIT_EXCEEDED,
        pluginId,
        severity: 'high',
        description: 'Memory usage limit exceeded',
        details: { usage: usage.memoryUsage, limit: this.policy.maxMemoryUsage }
      });
    }

    if (usage.executionTime > this.policy.maxExecutionTime) {
      this.recordSecurityEvent({
        type: SecurityEventType.RESOURCE_LIMIT_EXCEEDED,
        pluginId,
        severity: 'high',
        description: 'Execution time limit exceeded',
        details: { usage: usage.executionTime, limit: this.policy.maxExecutionTime }
      });
    }

    return usage;
  }

  /**
   * 獲取安全事件
   */
  getSecurityEvents(pluginId?: string, severity?: string): SecurityEvent[] {
    let events = this.securityEvents;

    if (pluginId) {
      events = events.filter(e => e.pluginId === pluginId);
    }

    if (severity) {
      events = events.filter(e => e.severity === severity);
    }

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * 封鎖插件
   */
  blockPlugin(pluginId: string, reason: string): void {
    this.blockedPlugins.add(pluginId);
    
    this.recordSecurityEvent({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      pluginId,
      severity: 'critical',
      description: `Plugin blocked: ${reason}`,
      details: { reason }
    });

    AuditLogger.logSecurityEvent(
      'plugin_blocked',
      { request: { url: 'plugin-security' } } as any,
      true,
      { pluginId, reason },
      'high'
    );
  }

  /**
   * 解除封鎖插件
   */
  unblockPlugin(pluginId: string): void {
    this.blockedPlugins.delete(pluginId);
    
    AuditLogger.logSecurityEvent(
      'plugin_unblocked',
      { request: { url: 'plugin-security' } } as any,
      true,
      { pluginId },
      'medium'
    );
  }

  /**
   * 獲取安全統計
   */
  getSecurityStats(): {
    totalEvents: number;
    eventsBySeverity: Record<string, number>;
    eventsByType: Record<string, number>;
    blockedPlugins: number;
    trustedPublishers: number;
  } {
    const eventsBySeverity: Record<string, number> = {};
    const eventsByType: Record<string, number> = {};

    this.securityEvents.forEach(event => {
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });

    return {
      totalEvents: this.securityEvents.length,
      eventsBySeverity,
      eventsByType,
      blockedPlugins: this.blockedPlugins.size,
      trustedPublishers: this.trustedPublishers.size
    };
  }

  // 私有方法

  private async verifyPluginSignature(plugin: Plugin, source: string): Promise<boolean> {
    // 在實際實現中，這裡應該驗證數位簽名
    // 目前返回 true 作為示例
    return true;
  }

  private isRemoteSource(source: string): boolean {
    try {
      const url = new URL(source);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private checkSourceDomain(source: string): PermissionCheckResult {
    try {
      const url = new URL(source);
      const domain = url.hostname;

      if (this.policy.blockedDomains.includes(domain)) {
        return {
          allowed: false,
          reason: `Domain ${domain} is blocked`,
          riskLevel: 'high'
        };
      }

      if (this.policy.allowedDomains.length > 0 && !this.policy.allowedDomains.includes(domain)) {
        return {
          allowed: false,
          reason: `Domain ${domain} is not in allowed list`,
          riskLevel: 'medium'
        };
      }

      return {
        allowed: true,
        riskLevel: 'low'
      };
    } catch {
      return {
        allowed: false,
        reason: 'Invalid source URL',
        riskLevel: 'medium'
      };
    }
  }

  private async analyzePluginCode(plugin: Plugin, source: string): Promise<PermissionCheckResult> {
    // 簡單的靜態代碼分析
    // 在實際實現中應該使用更複雜的分析工具
    
    const suspiciousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /document\.write/,
      /innerHTML\s*=/,
      /localStorage\.clear/,
      /sessionStorage\.clear/,
      /window\.location/,
      /XMLHttpRequest/,
      /fetch\s*\(/
    ];

    // 如果是遠程插件，獲取源代碼進行分析
    if (this.isRemoteSource(source)) {
      try {
        const response = await fetch(source);
        const code = await response.text();
        
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(code)) {
            return {
              allowed: false,
              reason: `Suspicious code pattern detected: ${pattern.source}`,
              riskLevel: 'high',
              recommendations: ['Review plugin source code', 'Contact plugin author for clarification']
            };
          }
        }
      } catch (error) {
        return {
          allowed: false,
          reason: 'Unable to analyze plugin code',
          riskLevel: 'medium'
        };
      }
    }

    return {
      allowed: true,
      riskLevel: 'low'
    };
  }

  private checkPublisherReputation(metadata: PluginMetadata): PermissionCheckResult {
    const publisherId = metadata.author;
    
    if (this.trustedPublishers.has(publisherId)) {
      return {
        allowed: true,
        riskLevel: 'low'
      };
    }

    // 檢查發布者信譽（在實際實現中應該查詢信譽數據庫）
    return {
      allowed: true,
      riskLevel: 'medium',
      recommendations: ['Verify publisher identity', 'Check plugin reviews and ratings']
    };
  }

  private hasPermission(permissions: PluginPermissions, permission: string): boolean {
    switch (permission) {
      case 'storage':
        return permissions.storage;
      case 'network':
        return permissions.network;
      case 'fileSystem':
        return permissions.fileSystem;
      case 'medicalData':
        return permissions.medicalData;
      case 'patientData':
        return permissions.patientData;
      case 'adminAccess':
        return permissions.adminAccess;
      default:
        return permissions.api?.includes(permission) || false;
    }
  }

  private recordSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      id: this.generateId(),
      timestamp: new Date(),
      resolved: false
    };

    this.securityEvents.push(securityEvent);

    // 記錄到審計日誌
    if (this.policy.auditLevel !== 'none') {
      AuditLogger.logSecurityEvent(
        'plugin_security_event',
        { request: { url: 'plugin-security' } } as any,
        false,
        securityEvent,
        event.severity as any
      );
    }

    // 限制事件數量
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-500);
    }
  }

  private sanitizeHtml(html: string): string {
    // 增強的 HTML 清理
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/on\w+\s*=\s*'[^']*'/gi, '')
      .replace(/javascript:/gi, '');
  }

  private setupTrustedPublishers(): void {
    // 設置信任的發布者
    this.trustedPublishers.add('astro-clinical-platform');
    this.trustedPublishers.add('verified-medical-publisher');
  }

  private startResourceMonitoring(): void {
    // 啟動資源監控
    setInterval(() => {
      this.cleanupOldEvents();
      this.updateResourceUsage();
    }, 60000); // 每分鐘檢查一次
  }

  private startResourceMonitoringForPlugin(pluginId: string): void {
    if (!this.resourceUsage.has(pluginId)) {
      this.resourceUsage.set(pluginId, {
        memoryUsage: 0,
        cpuUsage: 0,
        networkRequests: 0,
        storageUsage: 0,
        executionTime: 0,
        lastUpdated: new Date()
      });
    }
  }

  private cleanupOldEvents(): void {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.securityEvents = this.securityEvents.filter(event => event.timestamp > oneWeekAgo);
  }

  private updateResourceUsage(): void {
    // 更新資源使用統計
    // 在實際實現中應該收集真實的資源使用數據
    for (const [pluginId, usage] of this.resourceUsage) {
      usage.lastUpdated = new Date();
    }
  }

  private getPluginById(pluginId: string): Plugin | undefined {
    // 在實際實現中應該從插件管理器獲取
    return undefined;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 資源使用介面
interface ResourceUsage {
  memoryUsage: number;
  cpuUsage: number;
  networkRequests: number;
  storageUsage: number;
  executionTime: number;
  lastUpdated: Date;
}

// 創建預設安全管理器
export function createDefaultSecurityManager(): PluginSecurityManager {
  const policy: SecurityPolicy = {
    allowedDomains: [],
    blockedDomains: ['malicious-site.com', 'untrusted-plugins.net'],
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    maxExecutionTime: 30000, // 30 seconds
    allowedFileExtensions: ['.js', '.ts', '.json'],
    blockedFileExtensions: ['.exe', '.bat', '.sh'],
    requireSignature: process.env.NODE_ENV === 'production',
    allowRemotePlugins: process.env.NODE_ENV === 'development',
    sandboxEnabled: true,
    auditLevel: 'detailed'
  };

  return new PluginSecurityManager(policy);
}