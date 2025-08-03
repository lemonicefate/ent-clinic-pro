/**
 * 計算機錯誤邊界組件
 * 
 * 捕獲和處理計算機組件中的錯誤，提供優雅的降級體驗。
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { CalculatorError } from '../registry/ErrorHandler';

interface ErrorBoundaryProps {
  children: ReactNode;
  calculatorId?: string;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Calculator Error Boundary caught error:', error, errorInfo);

    // 更新狀態
    this.setState({
      errorInfo
    });

    // 調用外部錯誤處理器
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 創建增強的錯誤對象
    const calculatorError: CalculatorError = {
      ...error,
      name: error.name,
      message: error.message,
      stack: error.stack,
      calculatorId: this.props.calculatorId,
      type: 'RENDER_ERROR',
      context: {
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount
      },
      recoverable: this.state.retryCount < this.maxRetries
    };

    // 記錄到錯誤處理系統
    this.logError(calculatorError);
  }

  private logError(error: CalculatorError): void {
    // 發送到監控系統
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: `Calculator Render Error: ${error.message}`,
        fatal: !error.recoverable,
        custom_map: {
          calculator_id: error.calculatorId,
          retry_count: this.state.retryCount
        }
      });
    }

    // 發送到控制台
    console.group(`🚨 Calculator Error [${error.calculatorId || 'unknown'}]`);
    console.error('Error:', error.message);
    console.error('Type:', error.type);
    console.error('Recoverable:', error.recoverable);
    console.error('Context:', error.context);
    console.error('Stack:', error.stack);
    console.groupEnd();
  }

  private handleRetry = (): void => {
    if (this.state.retryCount >= this.maxRetries) {
      console.warn('Maximum retry attempts reached');
      return;
    }

    console.log(`Retrying calculator (attempt ${this.state.retryCount + 1}/${this.maxRetries})`);

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定義降級組件，使用它
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.error!} 
            retry={this.handleRetry}
          />
        );
      }

      // 預設錯誤 UI
      return (
        <DefaultErrorFallback
          error={this.state.error!}
          errorInfo={this.state.errorInfo}
          calculatorId={this.props.calculatorId}
          retryCount={this.state.retryCount}
          maxRetries={this.maxRetries}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

// 預設錯誤降級組件
interface DefaultErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  calculatorId?: string;
  retryCount: number;
  maxRetries: number;
  onRetry: () => void;
  onReload: () => void;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  errorInfo,
  calculatorId,
  retryCount,
  maxRetries,
  onRetry,
  onReload
}) => {
  const canRetry = retryCount < maxRetries;

  return (
    <div className="calculator-error-boundary">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-red-600"
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
          
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-medium text-red-800 mb-2">
              計算機載入錯誤
            </h3>
            
            <div className="text-sm text-red-700 mb-4">
              <p className="mb-2">
                {calculatorId ? `計算機 "${calculatorId}" ` : '計算機'}發生錯誤，無法正常顯示。
              </p>
              
              <details className="mb-4">
                <summary className="cursor-pointer font-medium hover:text-red-800">
                  錯誤詳情
                </summary>
                <div className="mt-2 p-3 bg-red-100 rounded border">
                  <p className="font-mono text-xs break-all">
                    {error.message}
                  </p>
                  {process.env.NODE_ENV === 'development' && errorInfo && (
                    <pre className="mt-2 text-xs overflow-auto">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            </div>

            <div className="flex space-x-3">
              {canRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  重試 ({maxRetries - retryCount} 次機會)
                </button>
              )}
              
              <button
                onClick={onReload}
                className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                重新載入頁面
              </button>
            </div>

            {!canRetry && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  已達到最大重試次數。請重新載入頁面或聯繫技術支援。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;