/**
 * 錯誤處理器
 * 
 * 統一處理計算機模組相關的錯誤，提供錯誤記錄、恢復和降級功能。
 */

export interface CalculatorError extends Error {
  calculatorId?: string;
  type: 'LOAD_ERROR' | 'VALIDATION_ERROR' | 'CALCULATION_ERROR' | 'RENDER_ERROR' | 'UNKNOWN_ERROR';
  context?: Record<string, any>;
  recoverable: boolean;
}

export class ErrorHandler {
  private errors: CalculatorError[] = [];
  private maxErrors = 100; // 最多保存 100 個錯誤

  /**
   * 記錄錯誤
   */
  logError(error: Error, calculatorId?: string, context?: Record<string, any>): void {
    const calculatorError: CalculatorError = {
      ...error,
      name: error.name,
      message: error.message,
      stack: error.stack,
      calculatorId,
      type: this.categorizeError(error),
      context,
      recoverable: this.isRecoverable(error)
    };

    // 添加到錯誤列表
    this.errors.unshift(calculatorError);
    
    // 保持錯誤列表大小
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // 控制台輸出
    console.error(`[Calculator Error] ${calculatorError.type}:`, {
      message: calculatorError.message,
      calculatorId: calculatorError.calculatorId,
      context: calculatorError.context,
      stack: calculatorError.stack
    });

    // 如果是不可恢復的錯誤，發送到監控系統
    if (!calculatorError.recoverable) {
      this.reportCriticalError(calculatorError);
    }
  }

  /**
   * 分類錯誤類型
   */
  private categorizeError(error: Error): CalculatorError['type'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('load') || message.includes('import')) {
      return 'LOAD_ERROR';
    }
    
    if (message.includes('validation') || message.includes('validate')) {
      return 'VALIDATION_ERROR';
    }
    
    if (message.includes('calculation') || message.includes('calculate')) {
      return 'CALCULATION_ERROR';
    }
    
    if (message.includes('render') || message.includes('component')) {
      return 'RENDER_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * 判斷錯誤是否可恢復
   */
  private isRecoverable(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // 這些錯誤通常是可恢復的
    const recoverablePatterns = [
      'validation',
      'input',
      'parameter',
      'value',
      'range'
    ];
    
    // 這些錯誤通常是不可恢復的
    const unrecoverablePatterns = [
      'module',
      'import',
      'syntax',
      'reference',
      'undefined'
    ];
    
    if (unrecoverablePatterns.some(pattern => message.includes(pattern))) {
      return false;
    }
    
    if (recoverablePatterns.some(pattern => message.includes(pattern))) {
      return true;
    }
    
    // 預設為可恢復
    return true;
  }

  /**
   * 報告嚴重錯誤到監控系統
   */
  private reportCriticalError(error: CalculatorError): void {
    // 這裡可以整合外部監控服務，如 Sentry
    console.error('🚨 Critical Calculator Error:', error);
    
    // 如果在瀏覽器環境中，可以發送到分析服務
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: `Calculator Error: ${error.message}`,
        fatal: !error.recoverable,
        custom_map: {
          calculator_id: error.calculatorId,
          error_type: error.type
        }
      });
    }
  }

  /**
   * 獲取所有錯誤
   */
  getErrors(): CalculatorError[] {
    return [...this.errors];
  }

  /**
   * 獲取特定計算機的錯誤
   */
  getErrorsForCalculator(calculatorId: string): CalculatorError[] {
    return this.errors.filter(error => error.calculatorId === calculatorId);
  }

  /**
   * 獲取特定類型的錯誤
   */
  getErrorsByType(type: CalculatorError['type']): CalculatorError[] {
    return this.errors.filter(error => error.type === type);
  }

  /**
   * 清除所有錯誤
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * 清除特定計算機的錯誤
   */
  clearErrorsForCalculator(calculatorId: string): void {
    this.errors = this.errors.filter(error => error.calculatorId !== calculatorId);
  }

  /**
   * 獲取錯誤統計
   */
  getErrorStats(): {
    total: number;
    byType: Record<string, number>;
    byCalculator: Record<string, number>;
    recoverable: number;
    unrecoverable: number;
  } {
    const stats = {
      total: this.errors.length,
      byType: {} as Record<string, number>,
      byCalculator: {} as Record<string, number>,
      recoverable: 0,
      unrecoverable: 0
    };

    this.errors.forEach(error => {
      // 按類型統計
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      
      // 按計算機統計
      if (error.calculatorId) {
        stats.byCalculator[error.calculatorId] = (stats.byCalculator[error.calculatorId] || 0) + 1;
      }
      
      // 按可恢復性統計
      if (error.recoverable) {
        stats.recoverable++;
      } else {
        stats.unrecoverable++;
      }
    });

    return stats;
  }

  /**
   * 創建錯誤恢復建議
   */
  getRecoveryAdvice(error: CalculatorError): string[] {
    const advice: string[] = [];

    switch (error.type) {
      case 'VALIDATION_ERROR':
        advice.push('請檢查輸入值是否符合要求');
        advice.push('確認所有必填欄位都已填寫');
        advice.push('檢查數值是否在有效範圍內');
        break;

      case 'CALCULATION_ERROR':
        advice.push('請檢查輸入參數是否正確');
        advice.push('嘗試重新輸入數值');
        advice.push('如果問題持續，請聯繫技術支援');
        break;

      case 'LOAD_ERROR':
        advice.push('請重新整理頁面');
        advice.push('檢查網路連線是否正常');
        advice.push('清除瀏覽器快取後重試');
        break;

      case 'RENDER_ERROR':
        advice.push('請重新整理頁面');
        advice.push('嘗試使用其他瀏覽器');
        advice.push('如果問題持續，請回報給開發團隊');
        break;

      default:
        advice.push('請重新整理頁面');
        advice.push('如果問題持續，請聯繫技術支援');
    }

    return advice;
  }
}