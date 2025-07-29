/**
 * Plugin-Specific Error Boundary Component
 * 
 * Enhanced error boundary specifically designed for calculator plugins.
 * Provides isolation, recovery mechanisms, and detailed error reporting
 * for the plugin-based calculator architecture.
 */

import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import type { 
  CalculatorPlugin, 
  PluginError,
  PluginTimeoutError,
  PluginValidationError,
  PluginConflictError,
  DependencyError
} from '../../types/calculator-plugin.js';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface PluginErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  pluginId: string | null;
  errorType: 'plugin' | 'calculation' | 'validation' | 'timeout' | 'dependency' | 'unknown';
  retryCount: number;
  isRecovering: boolean;
}

interface PluginErrorBoundaryProps {
  children: ReactNode;
  plugin?: CalculatorPlugin;
  pluginId?: string;
  fallback?: ReactNode | ((error: Error, plugin?: CalculatorPlugin) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo, plugin?: CalculatorPlugin) => void;
  onRecovery?: (plugin?: CalculatorPlugin) => void;
  maxRetries?: number;
  autoRetry?: boolean;
  retryDelay?: number;
  isolateErrors?: boolean;
  showErrorDetails?: boolean;
  enableRecovery?: boolean;
}

interface ErrorRecoveryStrategy {
  canRecover(error: Error, plugin?: CalculatorPlugin): boolean;
  recover(error: Error, plugin?: CalculatorPlugin): Promise<boolean>;
  getRecoveryMessage(error: Error): string;
}

// ============================================================================
// Error Recovery Strategies
// ============================================================================

class CalculationErrorRecovery implements ErrorRecoveryStrategy {
  canRecover(error: Error): boolean {
    return error.message.includes('calculation') || 
           error.message.includes('compute') ||
           error.name === 'CalculationError';
  }

  async recover(error: Error, plugin?: CalculatorPlugin): Promise<boolean> {
    try {
      // Attempt to reset plugin state
      if (plugin) {
        console.log(`🔄 Attempting to recover calculation for plugin: ${plugin.metadata.namespace}.${plugin.metadata.id}`);
        
        // Validate plugin is still functional
        const isValid = await plugin.validate();
        if (isValid) {
          console.log(`✅ Plugin validation successful, recovery possible`);
          return true;
        }
      }
      return false;
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      return false;
    }
  }

  getRecoveryMessage(): string {
    return '正在重新初始化計算引擎...';
  }
}

class ValidationErrorRecovery implements ErrorRecoveryStrategy {
  canRecover(error: Error): boolean {
    return error instanceof PluginValidationError ||
           error.message.includes('validation') ||
           error.name === 'ValidationError';
  }

  async recover(error: Error, plugin?: CalculatorPlugin): Promise<boolean> {
    try {
      if (plugin) {
        console.log(`🔄 Attempting to recover validation for plugin: ${plugin.metadata.namespace}.${plugin.metadata.id}`);
        
        // Re-validate plugin configuration
        const isValid = await plugin.validate();
        return isValid;
      }
      return false;
    } catch (recoveryError) {
      console.error('Validation recovery failed:', recoveryError);
      return false;
    }
  }

  getRecoveryMessage(): string {
    return '正在重新驗證插件配置...';
  }
}

class TimeoutErrorRecovery implements ErrorRecoveryStrategy {
  canRecover(error: Error): boolean {
    return error instanceof PluginTimeoutError ||
           error.message.includes('timeout') ||
           error.message.includes('timed out');
  }

  async recover(error: Error, plugin?: CalculatorPlugin): Promise<boolean> {
    try {
      if (plugin) {
        console.log(`🔄 Attempting to recover from timeout for plugin: ${plugin.metadata.namespace}.${plugin.metadata.id}`);
        
        // Simple recovery - just validate the plugin is responsive
        const startTime = Date.now();
        const isValid = await Promise.race([
          plugin.validate(),
          new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('Recovery timeout')), 5000)
          )
        ]);
        
        const recoveryTime = Date.now() - startTime;
        console.log(`Plugin responded in ${recoveryTime}ms during recovery`);
        
        return isValid;
      }
      return false;
    } catch (recoveryError) {
      console.error('Timeout recovery failed:', recoveryError);
      return false;
    }
  }

  getRecoveryMessage(): string {
    return '正在重新建立連接...';
  }
}

class DependencyErrorRecovery implements ErrorRecoveryStrategy {
  canRecover(error: Error): boolean {
    return error instanceof DependencyError ||
           error.message.includes('dependency') ||
           error.message.includes('missing');
  }

  async recover(error: Error, plugin?: CalculatorPlugin): Promise<boolean> {
    try {
      if (plugin) {
        console.log(`🔄 Attempting to recover dependencies for plugin: ${plugin.metadata.namespace}.${plugin.metadata.id}`);
        
        // Check if dependencies are now available
        // This is a simplified check - in a real implementation,
        // you might try to reload or reinstall dependencies
        const isValid = await plugin.validate();
        return isValid;
      }
      return false;
    } catch (recoveryError) {
      console.error('Dependency recovery failed:', recoveryError);
      return false;
    }
  }

  getRecoveryMessage(): string {
    return '正在檢查插件依賴...';
  }
}

// ============================================================================
// Main Plugin Error Boundary Component
// ============================================================================

export class PluginErrorBoundary extends Component<PluginErrorBoundaryProps, PluginErrorBoundaryState> {
  private retryTimeoutId: number | null = null;
  private recoveryStrategies: ErrorRecoveryStrategy[] = [
    new CalculationErrorRecovery(),
    new ValidationErrorRecovery(),
    new TimeoutErrorRecovery(),
    new DependencyErrorRecovery()
  ];

  constructor(props: PluginErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      pluginId: null,
      errorType: 'unknown',
      retryCount: 0,
      isRecovering: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<PluginErrorBoundaryState> {
    const errorType = PluginErrorBoundary.classifyError(error);
    
    return {
      hasError: true,
      error,
      errorType,
      errorId: `plugin-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { plugin, pluginId, onError } = this.props;
    
    // Update state with error info and plugin details
    this.setState({ 
      errorInfo,
      pluginId: plugin?.metadata.id || pluginId || 'unknown'
    });

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo, plugin);
    }

    // Log error details
    this.logError(error, errorInfo, plugin);

    // Report error to monitoring service
    this.reportError(error, errorInfo, plugin);

    // Attempt automatic recovery if enabled
    if (this.props.autoRetry && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.attemptRecovery(error, plugin);
    }
  }

  private static classifyError(error: Error): PluginErrorBoundaryState['errorType'] {
    if (error instanceof PluginValidationError) return 'validation';
    if (error instanceof PluginTimeoutError) return 'timeout';
    if (error instanceof DependencyError) return 'dependency';
    if (error instanceof PluginError) return 'plugin';
    if (error.message.includes('calculation') || error.message.includes('compute')) return 'calculation';
    return 'unknown';
  }

  private logError(error: Error, errorInfo: ErrorInfo, plugin?: CalculatorPlugin) {
    const pluginInfo = plugin ? `${plugin.metadata.namespace}.${plugin.metadata.id}` : 'unknown';
    
    console.group(`🚨 Plugin Error Boundary - ${pluginInfo}`);
    console.error('Error:', error);
    console.error('Error Type:', this.state.errorType);
    console.error('Plugin:', plugin?.metadata);
    console.error('Component Stack:', errorInfo.componentStack);
    
    if (error instanceof PluginError) {
      console.error('Plugin Error Context:', error.context);
    }
    
    console.groupEnd();
  }

  private reportError(error: Error, errorInfo: ErrorInfo, plugin?: CalculatorPlugin) {
    try {
      const errorReport = {
        errorId: this.state.errorId,
        pluginId: plugin?.metadata.id || 'unknown',
        pluginNamespace: plugin?.metadata.namespace || 'unknown',
        pluginVersion: plugin?.metadata.version || 'unknown',
        errorType: this.state.errorType,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        retryCount: this.state.retryCount
      };

      // Dispatch custom event for error reporting
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('plugin:error', {
          detail: errorReport
        }));
      }
    } catch (reportingError) {
      console.error('Failed to report plugin error:', reportingError);
    }
  }

  private async attemptRecovery(error: Error, plugin?: CalculatorPlugin) {
    if (this.state.isRecovering) return;

    this.setState({ isRecovering: true });

    try {
      // Find appropriate recovery strategy
      const strategy = this.recoveryStrategies.find(s => s.canRecover(error, plugin));
      
      if (strategy) {
        console.log(`🔄 Attempting recovery using ${strategy.constructor.name}`);
        
        const recovered = await strategy.recover(error, plugin);
        
        if (recovered) {
          console.log('✅ Plugin recovery successful');
          
          // Reset error state after successful recovery
          this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            isRecovering: false,
            retryCount: this.state.retryCount + 1
          });

          // Call recovery callback
          if (this.props.onRecovery) {
            this.props.onRecovery(plugin);
          }

          return;
        }
      }

      // Recovery failed, try simple retry after delay
      const retryDelay = this.props.retryDelay || 2000;
      this.retryTimeoutId = window.setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          isRecovering: false,
          retryCount: this.state.retryCount + 1
        });
      }, retryDelay);

    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      this.setState({ isRecovering: false });
    }
  }

  private handleManualRetry = () => {
    if (this.state.retryCount >= (this.props.maxRetries || 3)) {
      // Force reload if max retries exceeded
      window.location.reload();
      return;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1,
      isRecovering: false
    });
  };

  private handleReportIssue = () => {
    const { error, errorId, pluginId } = this.state;
    const { plugin } = this.props;
    
    const issueUrl = `mailto:support@your-domain.com?subject=Plugin Error Report&body=${encodeURIComponent(
      `Error ID: ${errorId}\n` +
      `Plugin: ${plugin?.metadata.namespace}.${plugin?.metadata.id || pluginId}\n` +
      `Error: ${error?.message}\n` +
      `Time: ${new Date().toISOString()}`
    )}`;
    
    window.open(issueUrl);
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      const { fallback, plugin, showErrorDetails = false } = this.props;
      const { error, errorType, isRecovering, retryCount } = this.state;
      
      // Use custom fallback if provided
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error!, plugin);
        }
        return fallback;
      }

      // Show recovery UI if recovering
      if (isRecovering) {
        const strategy = this.recoveryStrategies.find(s => s.canRecover(error!, plugin));
        const recoveryMessage = strategy?.getRecoveryMessage(error!) || '正在嘗試恢復...';
        
        return (
          <div className="plugin-error-boundary plugin-error-boundary--recovering">
            <div className="plugin-error-boundary__container">
              <div className="plugin-error-boundary__spinner">
                <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div className="plugin-error-boundary__content">
                <h3 className="plugin-error-boundary__title">
                  正在恢復插件
                </h3>
                <p className="plugin-error-boundary__message">
                  {recoveryMessage}
                </p>
              </div>
            </div>
          </div>
        );
      }

      // Default error UI
      return (
        <div className="plugin-error-boundary">
          <div className="plugin-error-boundary__container">
            <div className="plugin-error-boundary__icon">
              <svg 
                className="w-12 h-12 text-red-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            
            <div className="plugin-error-boundary__content">
              <h3 className="plugin-error-boundary__title">
                插件發生錯誤
              </h3>
              
              <p className="plugin-error-boundary__description">
                {plugin ? (
                  <>計算機插件 <strong>{plugin.metadata.namespace}.{plugin.metadata.id}</strong> 遇到錯誤</>
                ) : (
                  '計算機插件遇到意外錯誤'
                )}
              </p>

              <div className="plugin-error-boundary__error-type">
                錯誤類型: <span className={`error-type error-type--${errorType}`}>
                  {this.getErrorTypeLabel(errorType)}
                </span>
              </div>

              {showErrorDetails && error && (
                <details className="plugin-error-boundary__details">
                  <summary>錯誤詳情</summary>
                  <div className="plugin-error-boundary__error-details">
                    <div className="error-detail">
                      <strong>錯誤訊息:</strong>
                      <pre>{error.message}</pre>
                    </div>
                    
                    {error instanceof PluginError && error.context && (
                      <div className="error-detail">
                        <strong>錯誤上下文:</strong>
                        <pre>{JSON.stringify(error.context, null, 2)}</pre>
                      </div>
                    )}
                    
                    {plugin && (
                      <div className="error-detail">
                        <strong>插件資訊:</strong>
                        <pre>{JSON.stringify({
                          id: plugin.metadata.id,
                          namespace: plugin.metadata.namespace,
                          version: plugin.metadata.version,
                          author: plugin.metadata.author
                        }, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="plugin-error-boundary__actions">
                <button
                  onClick={this.handleManualRetry}
                  className="plugin-error-boundary__button plugin-error-boundary__button--primary"
                  disabled={retryCount >= (this.props.maxRetries || 3)}
                >
                  {retryCount >= (this.props.maxRetries || 3) ? '重新載入頁面' : '重試'}
                </button>
                
                <button
                  onClick={this.handleReportIssue}
                  className="plugin-error-boundary__button plugin-error-boundary__button--secondary"
                >
                  回報問題
                </button>
              </div>

              {this.state.errorId && (
                <div className="plugin-error-boundary__error-id">
                  錯誤 ID: <code>{this.state.errorId}</code>
                </div>
              )}

              {retryCount > 0 && (
                <div className="plugin-error-boundary__retry-count">
                  重試次數: {retryCount}/{this.props.maxRetries || 3}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  private getErrorTypeLabel(errorType: PluginErrorBoundaryState['errorType']): string {
    const labels = {
      plugin: '插件錯誤',
      calculation: '計算錯誤',
      validation: '驗證錯誤',
      timeout: '超時錯誤',
      dependency: '依賴錯誤',
      unknown: '未知錯誤'
    };
    
    return labels[errorType] || '未知錯誤';
  }
}

// ============================================================================
// Higher-Order Component and Hooks
// ============================================================================

/**
 * Higher-order component to wrap components with plugin error boundary
 */
export function withPluginErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<PluginErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <PluginErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </PluginErrorBoundary>
  );

  WrappedComponent.displayName = `withPluginErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook for manual error handling in plugin components
 */
export function usePluginErrorHandler(plugin?: CalculatorPlugin) {
  return React.useCallback((error: Error, context?: any) => {
    // Create enhanced plugin error
    const pluginError = new PluginError(
      error.message,
      plugin?.metadata.id,
      plugin?.metadata.namespace,
      'MANUAL_ERROR',
      context
    );
    
    // Throw to trigger error boundary
    throw pluginError;
  }, [plugin]);
}

/**
 * Hook for plugin error recovery
 */
export function usePluginErrorRecovery(plugin?: CalculatorPlugin) {
  const [isRecovering, setIsRecovering] = React.useState(false);
  
  const recover = React.useCallback(async () => {
    if (!plugin) return false;
    
    setIsRecovering(true);
    
    try {
      const isValid = await plugin.validate();
      if (isValid) {
        console.log(`✅ Plugin ${plugin.metadata.namespace}.${plugin.metadata.id} recovered successfully`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Plugin recovery failed:', error);
      return false;
    } finally {
      setIsRecovering(false);
    }
  }, [plugin]);
  
  return { recover, isRecovering };
}

// Default export
export default PluginErrorBoundary;