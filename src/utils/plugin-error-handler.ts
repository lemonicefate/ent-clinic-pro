/**
 * Plugin Error Handler Utility
 * 
 * Centralized error handling system for calculator plugins.
 * Provides error classification, reporting, and recovery mechanisms.
 */

import type {
  CalculatorPlugin,
  PluginError,
  PluginConflictError,
  PluginValidationError,
  DependencyError,
  PluginTimeoutError,
  VersionConflictError,
  PluginLoadError
} from '../types/calculator-plugin.js';

// ============================================================================
// Error Classification and Utilities
// ============================================================================

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  PLUGIN = 'plugin',
  CALCULATION = 'calculation',
  VALIDATION = 'validation',
  DEPENDENCY = 'dependency',
  TIMEOUT = 'timeout',
  NETWORK = 'network',
  CONFIGURATION = 'configuration',
  COMPATIBILITY = 'compatibility',
  UNKNOWN = 'unknown'
}

export interface ErrorContext {
  pluginId?: string;
  namespace?: string;
  version?: string;
  operation?: string;
  inputs?: any;
  timestamp: Date;
  userAgent?: string;
  url?: string;
  sessionId?: string;
  userId?: string;
}

export interface ErrorReport {
  id: string;
  error: Error;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context: ErrorContext;
  stackTrace?: string;
  componentStack?: string;
  recoverable: boolean;
  retryCount: number;
  resolved: boolean;
  resolvedAt?: Date;
  resolution?: string;
}

// ============================================================================
// Error Classification Service
// ============================================================================

export class ErrorClassifier {
  /**
   * Classify error by type and determine severity
   */
  static classifyError(error: Error, plugin?: CalculatorPlugin): {
    category: ErrorCategory;
    severity: ErrorSeverity;
    recoverable: boolean;
  } {
    // Plugin-specific errors
    if (error instanceof PluginValidationError) {
      return {
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        recoverable: true
      };
    }

    if (error instanceof PluginConflictError) {
      return {
        category: ErrorCategory.PLUGIN,
        severity: ErrorSeverity.HIGH,
        recoverable: false
      };
    }

    if (error instanceof DependencyError) {
      return {
        category: ErrorCategory.DEPENDENCY,
        severity: ErrorSeverity.HIGH,
        recoverable: true
      };
    }

    if (error instanceof PluginTimeoutError) {
      return {
        category: ErrorCategory.TIMEOUT,
        severity: ErrorSeverity.MEDIUM,
        recoverable: true
      };
    }

    if (error instanceof VersionConflictError) {
      return {
        category: ErrorCategory.COMPATIBILITY,
        severity: ErrorSeverity.HIGH,
        recoverable: false
      };
    }

    if (error instanceof PluginLoadError) {
      return {
        category: ErrorCategory.PLUGIN,
        severity: ErrorSeverity.CRITICAL,
        recoverable: true
      };
    }

    // Generic error classification based on message content
    const message = error.message.toLowerCase();

    if (message.includes('calculation') || message.includes('compute')) {
      return {
        category: ErrorCategory.CALCULATION,
        severity: ErrorSeverity.MEDIUM,
        recoverable: true
      };
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return {
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        recoverable: true
      };
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return {
        category: ErrorCategory.TIMEOUT,
        severity: ErrorSeverity.MEDIUM,
        recoverable: true
      };
    }

    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return {
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        recoverable: true
      };
    }

    if (message.includes('config') || message.includes('configuration')) {
      return {
        category: ErrorCategory.CONFIGURATION,
        severity: ErrorSeverity.HIGH,
        recoverable: true
      };
    }

    // Default classification
    return {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      recoverable: true
    };
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: Error, category: ErrorCategory): string {
    const messages = {
      [ErrorCategory.PLUGIN]: '插件載入或執行時發生錯誤',
      [ErrorCategory.CALCULATION]: '計算過程中發生錯誤，請檢查輸入數據',
      [ErrorCategory.VALIDATION]: '輸入數據驗證失敗，請檢查輸入格式',
      [ErrorCategory.DEPENDENCY]: '插件依賴項缺失或版本不相容',
      [ErrorCategory.TIMEOUT]: '操作超時，請稍後重試',
      [ErrorCategory.NETWORK]: '網路連接問題，請檢查網路狀態',
      [ErrorCategory.CONFIGURATION]: '插件配置錯誤，請聯繫管理員',
      [ErrorCategory.COMPATIBILITY]: '插件版本不相容，需要更新',
      [ErrorCategory.UNKNOWN]: '發生未知錯誤，請稍後重試'
    };

    return messages[category] || messages[ErrorCategory.UNKNOWN];
  }

  /**
   * Get recovery suggestions
   */
  static getRecoverySuggestions(error: Error, category: ErrorCategory): string[] {
    const suggestions = {
      [ErrorCategory.PLUGIN]: [
        '重新載入插件',
        '檢查插件是否正確安裝',
        '聯繫插件開發者'
      ],
      [ErrorCategory.CALCULATION]: [
        '檢查輸入數據是否正確',
        '確認數值範圍是否合理',
        '重新輸入數據並重試'
      ],
      [ErrorCategory.VALIDATION]: [
        '檢查必填欄位是否已填寫',
        '確認數據格式是否正確',
        '查看欄位說明和要求'
      ],
      [ErrorCategory.DEPENDENCY]: [
        '重新安裝插件依賴',
        '檢查系統相容性',
        '更新到最新版本'
      ],
      [ErrorCategory.TIMEOUT]: [
        '檢查網路連接',
        '稍後重試',
        '簡化輸入數據'
      ],
      [ErrorCategory.NETWORK]: [
        '檢查網路連接',
        '重新整理頁面',
        '稍後重試'
      ],
      [ErrorCategory.CONFIGURATION]: [
        '聯繫系統管理員',
        '檢查插件配置',
        '重新安裝插件'
      ],
      [ErrorCategory.COMPATIBILITY]: [
        '更新插件到最新版本',
        '檢查系統需求',
        '聯繫技術支援'
      ],
      [ErrorCategory.UNKNOWN]: [
        '重新整理頁面',
        '清除瀏覽器快取',
        '聯繫技術支援'
      ]
    };

    return suggestions[category] || suggestions[ErrorCategory.UNKNOWN];
  }
}

// ============================================================================
// Error Reporter Service
// ============================================================================

export class ErrorReporter {
  private static reports = new Map<string, ErrorReport>();
  private static listeners = new Set<(report: ErrorReport) => void>();

  /**
   * Report an error
   */
  static report(
    error: Error,
    plugin?: CalculatorPlugin,
    context?: Partial<ErrorContext>
  ): ErrorReport {
    const classification = ErrorClassifier.classifyError(error, plugin);
    
    const errorContext: ErrorContext = {
      pluginId: plugin?.metadata.id,
      namespace: plugin?.metadata.namespace,
      version: plugin?.metadata.version,
      timestamp: new Date(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      sessionId: this.getSessionId(),
      ...context
    };

    const report: ErrorReport = {
      id: this.generateErrorId(),
      error,
      category: classification.category,
      severity: classification.severity,
      context: errorContext,
      stackTrace: error.stack,
      recoverable: classification.recoverable,
      retryCount: 0,
      resolved: false
    };

    // Store report
    this.reports.set(report.id, report);

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(report);
      } catch (listenerError) {
        console.error('Error in error report listener:', listenerError);
      }
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      this.logErrorReport(report);
    }

    // Send to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(report);
    }

    return report;
  }

  /**
   * Mark error as resolved
   */
  static resolve(errorId: string, resolution: string): boolean {
    const report = this.reports.get(errorId);
    if (report) {
      report.resolved = true;
      report.resolvedAt = new Date();
      report.resolution = resolution;
      return true;
    }
    return false;
  }

  /**
   * Get error report by ID
   */
  static getReport(errorId: string): ErrorReport | undefined {
    return this.reports.get(errorId);
  }

  /**
   * Get all error reports
   */
  static getAllReports(): ErrorReport[] {
    return Array.from(this.reports.values());
  }

  /**
   * Get error reports by plugin
   */
  static getReportsByPlugin(pluginId: string, namespace?: string): ErrorReport[] {
    return Array.from(this.reports.values()).filter(report => {
      const matchesId = report.context.pluginId === pluginId;
      const matchesNamespace = !namespace || report.context.namespace === namespace;
      return matchesId && matchesNamespace;
    });
  }

  /**
   * Get error statistics
   */
  static getStatistics() {
    const reports = Array.from(this.reports.values());
    const total = reports.length;
    const resolved = reports.filter(r => r.resolved).length;
    const unresolved = total - resolved;

    const byCategory = reports.reduce((acc, report) => {
      acc[report.category] = (acc[report.category] || 0) + 1;
      return acc;
    }, {} as Record<ErrorCategory, number>);

    const bySeverity = reports.reduce((acc, report) => {
      acc[report.severity] = (acc[report.severity] || 0) + 1;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    return {
      total,
      resolved,
      unresolved,
      byCategory,
      bySeverity,
      resolutionRate: total > 0 ? (resolved / total) * 100 : 0
    };
  }

  /**
   * Add error report listener
   */
  static addListener(listener: (report: ErrorReport) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove error report listener
   */
  static removeListener(listener: (report: ErrorReport) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Clear all error reports
   */
  static clear(): void {
    this.reports.clear();
  }

  // Private helper methods
  private static generateErrorId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private static getSessionId(): string {
    // Simple session ID generation - in production, use a proper session management system
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('plugin-session-id');
      if (!sessionId) {
        sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('plugin-session-id', sessionId);
      }
      return sessionId;
    }
    return 'server-session';
  }

  private static logErrorReport(report: ErrorReport): void {
    console.group(`🚨 Plugin Error Report - ${report.id}`);
    console.error('Error:', report.error);
    console.log('Category:', report.category);
    console.log('Severity:', report.severity);
    console.log('Recoverable:', report.recoverable);
    console.log('Context:', report.context);
    
    if (report.stackTrace) {
      console.log('Stack Trace:', report.stackTrace);
    }
    
    console.groupEnd();
  }

  private static async sendToExternalService(report: ErrorReport): Promise<void> {
    try {
      // In a real implementation, send to error tracking service like Sentry
      const payload = {
        id: report.id,
        message: report.error.message,
        category: report.category,
        severity: report.severity,
        context: report.context,
        stackTrace: report.stackTrace,
        timestamp: report.context.timestamp.toISOString()
      };

      // Simulate sending to external service
      console.log('Sending error report to external service:', payload);
      
      // Example: await fetch('/api/errors', { method: 'POST', body: JSON.stringify(payload) });
      
    } catch (error) {
      console.error('Failed to send error report to external service:', error);
    }
  }
}

// ============================================================================
// Error Recovery Service
// ============================================================================

export class ErrorRecoveryService {
  private static recoveryAttempts = new Map<string, number>();
  private static maxRetries = 3;

  /**
   * Attempt to recover from an error
   */
  static async attemptRecovery(
    error: Error,
    plugin?: CalculatorPlugin,
    context?: any
  ): Promise<{ success: boolean; message: string }> {
    const errorId = `${plugin?.metadata.namespace || 'unknown'}.${plugin?.metadata.id || 'unknown'}-${error.message}`;
    const attempts = this.recoveryAttempts.get(errorId) || 0;

    if (attempts >= this.maxRetries) {
      return {
        success: false,
        message: `已達到最大重試次數 (${this.maxRetries})`
      };
    }

    this.recoveryAttempts.set(errorId, attempts + 1);

    try {
      const classification = ErrorClassifier.classifyError(error, plugin);
      
      if (!classification.recoverable) {
        return {
          success: false,
          message: '此錯誤無法自動恢復'
        };
      }

      // Attempt recovery based on error category
      switch (classification.category) {
        case ErrorCategory.CALCULATION:
          return await this.recoverCalculationError(error, plugin, context);
          
        case ErrorCategory.VALIDATION:
          return await this.recoverValidationError(error, plugin, context);
          
        case ErrorCategory.TIMEOUT:
          return await this.recoverTimeoutError(error, plugin, context);
          
        case ErrorCategory.DEPENDENCY:
          return await this.recoverDependencyError(error, plugin, context);
          
        case ErrorCategory.PLUGIN:
          return await this.recoverPluginError(error, plugin, context);
          
        default:
          return await this.recoverGenericError(error, plugin, context);
      }
      
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      return {
        success: false,
        message: `恢復嘗試失敗: ${recoveryError.message}`
      };
    }
  }

  /**
   * Reset recovery attempts for a plugin
   */
  static resetRecoveryAttempts(plugin: CalculatorPlugin): void {
    const prefix = `${plugin.metadata.namespace}.${plugin.metadata.id}`;
    const keysToDelete = Array.from(this.recoveryAttempts.keys())
      .filter(key => key.startsWith(prefix));
    
    keysToDelete.forEach(key => this.recoveryAttempts.delete(key));
  }

  /**
   * Get recovery attempt count
   */
  static getRecoveryAttempts(plugin: CalculatorPlugin, error: Error): number {
    const errorId = `${plugin.metadata.namespace}.${plugin.metadata.id}-${error.message}`;
    return this.recoveryAttempts.get(errorId) || 0;
  }

  // Private recovery methods
  private static async recoverCalculationError(
    error: Error,
    plugin?: CalculatorPlugin,
    context?: any
  ): Promise<{ success: boolean; message: string }> {
    if (!plugin) {
      return { success: false, message: '無法恢復：插件未定義' };
    }

    try {
      // Validate plugin is still functional
      const isValid = await plugin.validate();
      if (isValid) {
        return { success: true, message: '計算引擎已重新初始化' };
      } else {
        return { success: false, message: '插件驗證失敗' };
      }
    } catch (validationError) {
      return { success: false, message: `驗證過程中發生錯誤: ${validationError.message}` };
    }
  }

  private static async recoverValidationError(
    error: Error,
    plugin?: CalculatorPlugin,
    context?: any
  ): Promise<{ success: boolean; message: string }> {
    // For validation errors, we typically can't auto-recover
    // The user needs to fix their input
    return {
      success: false,
      message: '請檢查並修正輸入數據'
    };
  }

  private static async recoverTimeoutError(
    error: Error,
    plugin?: CalculatorPlugin,
    context?: any
  ): Promise<{ success: boolean; message: string }> {
    if (!plugin) {
      return { success: false, message: '無法恢復：插件未定義' };
    }

    try {
      // Test if plugin is responsive with a shorter timeout
      const startTime = Date.now();
      const isValid = await Promise.race([
        plugin.validate(),
        new Promise<boolean>((_, reject) => 
          setTimeout(() => reject(new Error('Recovery timeout')), 5000)
        )
      ]);

      const responseTime = Date.now() - startTime;
      
      if (isValid) {
        return { 
          success: true, 
          message: `連接已恢復 (響應時間: ${responseTime}ms)` 
        };
      } else {
        return { success: false, message: '插件仍無響應' };
      }
    } catch (recoveryError) {
      return { success: false, message: '恢復超時，插件可能仍有問題' };
    }
  }

  private static async recoverDependencyError(
    error: Error,
    plugin?: CalculatorPlugin,
    context?: any
  ): Promise<{ success: boolean; message: string }> {
    if (!plugin) {
      return { success: false, message: '無法恢復：插件未定義' };
    }

    try {
      // Check if dependencies are now available
      const isValid = await plugin.validate();
      if (isValid) {
        return { success: true, message: '依賴項已恢復' };
      } else {
        return { success: false, message: '依賴項仍然缺失' };
      }
    } catch (validationError) {
      return { success: false, message: `依賴檢查失敗: ${validationError.message}` };
    }
  }

  private static async recoverPluginError(
    error: Error,
    plugin?: CalculatorPlugin,
    context?: any
  ): Promise<{ success: boolean; message: string }> {
    if (!plugin) {
      return { success: false, message: '無法恢復：插件未定義' };
    }

    try {
      // Try to reinstall the plugin
      await plugin.uninstall();
      await plugin.install();
      
      const isValid = await plugin.validate();
      if (isValid) {
        return { success: true, message: '插件已重新安裝' };
      } else {
        return { success: false, message: '插件重新安裝後仍有問題' };
      }
    } catch (reinstallError) {
      return { success: false, message: `重新安裝失敗: ${reinstallError.message}` };
    }
  }

  private static async recoverGenericError(
    error: Error,
    plugin?: CalculatorPlugin,
    context?: any
  ): Promise<{ success: boolean; message: string }> {
    // Generic recovery attempt
    if (plugin) {
      try {
        const isValid = await plugin.validate();
        if (isValid) {
          return { success: true, message: '插件狀態已恢復正常' };
        }
      } catch (validationError) {
        // Ignore validation errors in generic recovery
      }
    }

    return { success: false, message: '無法自動恢復，請手動重試' };
  }
}

// ============================================================================
// Export utilities
// ============================================================================

export {
  ErrorClassifier,
  ErrorReporter,
  ErrorRecoveryService
};

// Convenience functions
export function reportPluginError(
  error: Error,
  plugin?: CalculatorPlugin,
  context?: Partial<ErrorContext>
): ErrorReport {
  return ErrorReporter.report(error, plugin, context);
}

export async function recoverFromError(
  error: Error,
  plugin?: CalculatorPlugin,
  context?: any
): Promise<{ success: boolean; message: string }> {
  return ErrorRecoveryService.attemptRecovery(error, plugin, context);
}

export function classifyPluginError(error: Error, plugin?: CalculatorPlugin) {
  return ErrorClassifier.classifyError(error, plugin);
}

export function getUserFriendlyErrorMessage(error: Error, plugin?: CalculatorPlugin): string {
  const classification = ErrorClassifier.classifyError(error, plugin);
  return ErrorClassifier.getUserFriendlyMessage(error, classification.category);
}

export function getErrorRecoverySuggestions(error: Error, plugin?: CalculatorPlugin): string[] {
  const classification = ErrorClassifier.classifyError(error, plugin);
  return ErrorClassifier.getRecoverySuggestions(error, classification.category);
}

export default {
  ErrorClassifier,
  ErrorReporter,
  ErrorRecoveryService,
  reportPluginError,
  recoverFromError,
  classifyPluginError,
  getUserFriendlyErrorMessage,
  getErrorRecoverySuggestions
};