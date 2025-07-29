/**
 * 錯誤邊界組件
 * 
 * 基於 React 官方文檔的錯誤邊界實作，提供強健的錯誤處理和恢復機制
 */

import React, { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  isolate?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 更新狀態以顯示錯誤 UI
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 記錄錯誤資訊
    this.setState({ errorInfo });

    // 呼叫自定義錯誤處理器
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 記錄到控制台（開發環境）
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught an Error');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      
      // 如果可用，記錄 owner stack（僅開發環境）
      if (React.captureOwnerStack) {
        console.error('Owner Stack:', React.captureOwnerStack());
      }
      
      console.groupEnd();
    }

    // 發送錯誤到分析服務（生產環境）
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToService(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // 如果有錯誤且啟用了 props 變更重置
    if (hasError && resetOnPropsChange) {
      // 檢查 resetKeys 是否有變化
      if (resetKeys && prevProps.resetKeys) {
        const hasResetKeyChanged = resetKeys.some(
          (key, index) => key !== prevProps.resetKeys![index]
        );
        
        if (hasResetKeyChanged) {
          this.resetErrorBoundary();
        }
      }
    }
  }

  private reportErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // 這裡可以整合錯誤報告服務，如 Sentry、LogRocket 等
    try {
      // 模擬錯誤報告
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        errorId: this.state.errorId
      };

      // 發送到錯誤報告服務
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('error:boundary', {
          detail: errorReport
        }));
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private resetErrorBoundary = () => {
    // 清除重置計時器
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  private handleRetry = () => {
    this.resetErrorBoundary();
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定義 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 預設錯誤 UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-container">
            <div className="error-boundary-icon">
              <svg 
                className="w-16 h-16 text-medical-error-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            
            <div className="error-boundary-content">
              <h2 className="error-boundary-title">
                計算機發生錯誤
              </h2>
              
              <p className="error-boundary-description">
                很抱歉，計算機遇到了意外錯誤。請嘗試重新載入或聯繫技術支援。
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="error-boundary-details">
                  <summary className="error-boundary-details-summary">
                    錯誤詳情（開發模式）
                  </summary>
                  <div className="error-boundary-details-content">
                    <div className="error-boundary-error-info">
                      <h4>錯誤訊息：</h4>
                      <pre>{this.state.error.message}</pre>
                    </div>
                    
                    {this.state.error.stack && (
                      <div className="error-boundary-error-info">
                        <h4>錯誤堆疊：</h4>
                        <pre>{this.state.error.stack}</pre>
                      </div>
                    )}
                    
                    {this.state.errorInfo?.componentStack && (
                      <div className="error-boundary-error-info">
                        <h4>組件堆疊：</h4>
                        <pre>{this.state.errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="error-boundary-actions">
                <button
                  onClick={this.handleRetry}
                  className="error-boundary-button error-boundary-button-primary"
                >
                  重試
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="error-boundary-button error-boundary-button-secondary"
                >
                  重新載入頁面
                </button>
              </div>

              {this.state.errorId && (
                <div className="error-boundary-error-id">
                  錯誤 ID: {this.state.errorId}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 便利的 Hook 版本（使用 react-error-boundary 庫的概念）
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    // 手動觸發錯誤邊界
    throw error;
  };
}

// 高階組件版本
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// 預設匯出
export default ErrorBoundary;