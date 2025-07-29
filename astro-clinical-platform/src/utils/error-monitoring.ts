// 錯誤監控和報告系統
export interface ErrorReport {
  id: string;
  timestamp: number;
  type: 'javascript' | 'promise' | 'network' | 'calculator' | 'user-feedback';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

export interface UserFeedback {
  id: string;
  timestamp: number;
  type: 'bug' | 'feature' | 'improvement' | 'complaint';
  rating: number; // 1-5
  message: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  screenshot?: string;
}

export class ErrorMonitor {
  private static errors: ErrorReport[] = [];
  private static feedback: UserFeedback[] = [];
  private static sessionId: string = '';
  private static isInitialized = false;
  private static reportingEndpoint = '/api/analytics/errors';
  private static feedbackEndpoint = '/api/analytics/feedback';
  private static maxStoredErrors = 100;

  static initialize() {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.isInitialized = true;
    this.sessionId = this.generateSessionId();
    
    this.setupGlobalErrorHandlers();
    this.setupCalculatorErrorHandlers();
    this.setupNetworkErrorHandlers();
    this.setupUserFeedbackSystem();
    this.setupPeriodicReporting();

    console.log('Error monitoring initialized with session:', this.sessionId);
  }

  // 設置全域錯誤處理器
  private static setupGlobalErrorHandlers() {
    // JavaScript 錯誤
    window.addEventListener('error', (event) => {
      this.reportError({
        type: 'javascript',
        severity: this.determineSeverity(event.error),
        message: event.message,
        stack: event.error?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          source: 'window.error'
        }
      });
    });

    // Promise 拒絕
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        type: 'promise',
        severity: 'medium',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        metadata: {
          reason: event.reason?.toString(),
          source: 'unhandledrejection'
        }
      });
    });

    // 資源載入錯誤
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement;
        this.reportError({
          type: 'network',
          severity: 'low',
          message: `Resource failed to load: ${target.tagName}`,
          url: window.location.href,
          userAgent: navigator.userAgent,
          sessionId: this.sessionId,
          metadata: {
            tagName: target.tagName,
            src: (target as any).src || (target as any).href,
            source: 'resource.error'
          }
        });
      }
    }, true);
  }

  // 設置計算機錯誤處理器
  private static setupCalculatorErrorHandlers() {
    // 監聽計算機錯誤事件
    document.addEventListener('calculator-error', (event: any) => {
      this.reportError({
        type: 'calculator',
        severity: 'high',
        message: event.detail.message || 'Calculator error occurred',
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        metadata: {
          calculatorId: event.detail.calculatorId,
          inputData: event.detail.inputData,
          errorCode: event.detail.errorCode,
          source: 'calculator'
        }
      });
    });

    // 包裝計算機函數以捕獲錯誤
    this.wrapCalculatorFunctions();
  }

  // 設置網路錯誤處理器
  private static setupNetworkErrorHandlers() {
    // 包裝 fetch 以監控 API 錯誤
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          this.reportError({
            type: 'network',
            severity: response.status >= 500 ? 'high' : 'medium',
            message: `HTTP ${response.status}: ${response.statusText}`,
            url: window.location.href,
            userAgent: navigator.userAgent,
            sessionId: this.sessionId,
            metadata: {
              requestUrl: args[0]?.toString(),
              status: response.status,
              statusText: response.statusText,
              source: 'fetch'
            }
          });
        }
        
        return response;
      } catch (error) {
        this.reportError({
          type: 'network',
          severity: 'high',
          message: `Network error: ${error.message}`,
          stack: error.stack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          sessionId: this.sessionId,
          metadata: {
            requestUrl: args[0]?.toString(),
            source: 'fetch.error'
          }
        });
        throw error;
      }
    };
  }

  // 設置使用者回饋系統
  private static setupUserFeedbackSystem() {
    // 創建回饋按鈕
    this.createFeedbackButton();
    
    // 監聽回饋事件
    document.addEventListener('user-feedback', (event: any) => {
      this.submitFeedback(event.detail);
    });
  }

  // 包裝計算機函數
  private static wrapCalculatorFunctions() {
    // 尋找所有計算機相關的函數並包裝
    const calculatorElements = document.querySelectorAll('[data-calculator-id]');
    
    calculatorElements.forEach(element => {
      const calculatorId = element.getAttribute('data-calculator-id');
      
      // 包裝計算按鈕點擊事件
      const buttons = element.querySelectorAll('button[data-calculator-button]');
      buttons.forEach(button => {
        button.addEventListener('click', (event) => {
          try {
            // 原始點擊處理邏輯會在這裡執行
          } catch (error) {
            this.reportError({
              type: 'calculator',
              severity: 'high',
              message: `Calculator button error: ${error.message}`,
              stack: error.stack,
              url: window.location.href,
              userAgent: navigator.userAgent,
              sessionId: this.sessionId,
              metadata: {
                calculatorId: calculatorId,
                buttonType: button.getAttribute('data-calculator-button'),
                source: 'calculator.button'
              }
            });
          }
        });
      });
    });
  }

  // 創建回饋按鈕
  private static createFeedbackButton() {
    const feedbackButton = document.createElement('div');
    feedbackButton.id = 'error-feedback-button';
    feedbackButton.innerHTML = `
      <button class="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        </svg>
      </button>
    `;
    
    feedbackButton.addEventListener('click', () => {
      this.showFeedbackModal();
    });
    
    document.body.appendChild(feedbackButton);
  }

  // 顯示回饋模態框
  private static showFeedbackModal() {
    const modal = document.createElement('div');
    modal.id = 'feedback-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">提供回饋</h3>
          <button id="close-feedback" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <form id="feedback-form">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">回饋類型</label>
            <select name="type" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
              <option value="bug">錯誤回報</option>
              <option value="feature">功能建議</option>
              <option value="improvement">改進建議</option>
              <option value="complaint">問題反映</option>
            </select>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">評分</label>
            <div class="flex space-x-2">
              ${[1, 2, 3, 4, 5].map(rating => `
                <button type="button" class="rating-star w-8 h-8 text-gray-300 hover:text-yellow-400" data-rating="${rating}">
                  <svg class="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                  </svg>
                </button>
              `).join('')}
            </div>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">詳細說明</label>
            <textarea name="message" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="請詳細描述您的回饋..."></textarea>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button type="button" id="cancel-feedback" class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
              取消
            </button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              提交回饋
            </button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 綁定事件
    let selectedRating = 0;
    
    modal.querySelectorAll('.rating-star').forEach(star => {
      star.addEventListener('click', (e) => {
        const rating = parseInt((e.currentTarget as HTMLElement).getAttribute('data-rating') || '0');
        selectedRating = rating;
        
        modal.querySelectorAll('.rating-star').forEach((s, index) => {
          if (index < rating) {
            s.classList.add('text-yellow-400');
            s.classList.remove('text-gray-300');
          } else {
            s.classList.add('text-gray-300');
            s.classList.remove('text-yellow-400');
          }
        });
      });
    });
    
    modal.querySelector('#close-feedback')?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('#cancel-feedback')?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('#feedback-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      
      this.submitFeedback({
        type: formData.get('type') as string,
        rating: selectedRating,
        message: formData.get('message') as string
      });
      
      document.body.removeChild(modal);
      
      // 顯示感謝訊息
      this.showThankYouMessage();
    });
  }

  // 顯示感謝訊息
  private static showThankYouMessage() {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.textContent = '感謝您的回饋！我們會仔細考慮您的建議。';
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  }

  // 報告錯誤
  static reportError(errorData: Omit<ErrorReport, 'id' | 'timestamp'>) {
    const error: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      ...errorData
    };

    this.errors.push(error);
    
    // 限制儲存的錯誤數量
    if (this.errors.length > this.maxStoredErrors) {
      this.errors.shift();
    }

    // 立即發送嚴重錯誤
    if (error.severity === 'critical' || error.severity === 'high') {
      this.sendErrorReport([error]);
    }

    // 在開發環境中記錄錯誤
    if (import.meta.env.DEV) {
      console.error('Error reported:', error);
    }
  }

  // 提交使用者回饋
  static submitFeedback(feedbackData: Omit<UserFeedback, 'id' | 'timestamp' | 'url' | 'userAgent' | 'sessionId'>) {
    const feedback: UserFeedback = {
      id: this.generateFeedbackId(),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      ...feedbackData
    };

    this.feedback.push(feedback);
    this.sendFeedback([feedback]);
  }

  // 設置定期報告
  private static setupPeriodicReporting() {
    // 每 30 秒發送一次錯誤報告
    setInterval(() => {
      if (this.errors.length > 0) {
        this.sendErrorReport([...this.errors]);
        this.errors = [];
      }
    }, 30000);

    // 頁面卸載時發送剩餘錯誤
    window.addEventListener('beforeunload', () => {
      if (this.errors.length > 0) {
        this.sendErrorReport([...this.errors], true);
      }
    });
  }

  // 發送錯誤報告
  private static sendErrorReport(errors: ErrorReport[], useBeacon = false) {
    const payload = {
      errors,
      sessionId: this.sessionId,
      timestamp: Date.now()
    };

    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(
        this.reportingEndpoint,
        JSON.stringify(payload)
      );
    } else {
      fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }).catch(error => {
        console.warn('Failed to send error report:', error);
      });
    }
  }

  // 發送回饋
  private static sendFeedback(feedback: UserFeedback[]) {
    const payload = {
      feedback,
      sessionId: this.sessionId,
      timestamp: Date.now()
    };

    fetch(this.feedbackEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).catch(error => {
      console.warn('Failed to send feedback:', error);
    });
  }

  // 確定錯誤嚴重程度
  private static determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (!error) return 'low';
    
    const message = error.message?.toLowerCase() || '';
    const stack = error.stack?.toLowerCase() || '';
    
    // 關鍵錯誤
    if (message.includes('calculator') || message.includes('medical')) {
      return 'critical';
    }
    
    // 高嚴重性錯誤
    if (message.includes('network') || message.includes('api') || message.includes('fetch')) {
      return 'high';
    }
    
    // 中等嚴重性錯誤
    if (message.includes('reference') || message.includes('undefined') || message.includes('null')) {
      return 'medium';
    }
    
    return 'low';
  }

  // 生成 ID
  private static generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateFeedbackId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 獲取錯誤統計
  static getErrorStats() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    const recentErrors = this.errors.filter(e => now - e.timestamp < oneHour);
    const dailyErrors = this.errors.filter(e => now - e.timestamp < oneDay);

    return {
      total: this.errors.length,
      lastHour: recentErrors.length,
      lastDay: dailyErrors.length,
      bySeverity: {
        critical: this.errors.filter(e => e.severity === 'critical').length,
        high: this.errors.filter(e => e.severity === 'high').length,
        medium: this.errors.filter(e => e.severity === 'medium').length,
        low: this.errors.filter(e => e.severity === 'low').length
      },
      byType: {
        javascript: this.errors.filter(e => e.type === 'javascript').length,
        promise: this.errors.filter(e => e.type === 'promise').length,
        network: this.errors.filter(e => e.type === 'network').length,
        calculator: this.errors.filter(e => e.type === 'calculator').length
      }
    };
  }

  // 清除錯誤資料
  static clearErrors() {
    this.errors = [];
    this.feedback = [];
  }
}

// 自動初始化
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ErrorMonitor.initialize();
    });
  } else {
    ErrorMonitor.initialize();
  }
}