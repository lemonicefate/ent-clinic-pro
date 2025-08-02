/**
 * Calculator Instance Management
 * 
 * Manages individual calculator instances with complete lifecycle control.
 * Each instance represents a single calculator plugin rendered in a specific
 * container with its own state, error handling, and performance tracking.
 * 
 * Key Features:
 * - React component rendering with error boundaries
 * - Input validation and calculation execution with timeout protection
 * - Memory management and resource cleanup
 * - Performance monitoring and metrics collection
 * - Error isolation and graceful degradation
 */

import type {
  CalculatorPlugin,
  PluginTimeoutError,
  PluginError
} from '../types/calculator-plugin.js';

import type {
  CalculatorInputs,
  CalculationResult,
  SupportedLocale
} from '../types/calculator.js';

// ============================================================================
// Calculator Instance Interface and Types
// ============================================================================

export interface CalculatorInstanceOptions {
  /** Current locale for localization */
  locale?: SupportedLocale;
  
  /** Timeout for calculation execution in milliseconds */
  calculationTimeout?: number;
  
  /** Callback for calculation completion */
  onCalculate?: (result: CalculationResult) => void;
  
  /** Callback for errors */
  onError?: (error: Error) => void;
  
  /** Callback for loading state changes */
  onLoadingChange?: (isLoading: boolean) => void;
  
  /** Custom error fallback component */
  errorFallback?: React.ComponentType<{ error: Error }>;
  
  /** Theme configuration */
  theme?: 'light' | 'dark';
  
  /** Accessibility settings */
  accessibility?: {
    highContrast: boolean;
    largeText: boolean;
    screenReader: boolean;
  };
}

export interface CalculatorInstanceMetrics {
  loadTime: number;
  calculationCount: number;
  averageCalculationTime: number;
  errorCount: number;
  lastUsed: Date;
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
}

export type CalculatorInstanceStatus = 'loading' | 'ready' | 'calculating' | 'error' | 'destroyed';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_INSTANCE_OPTIONS: Required<CalculatorInstanceOptions> = {
  locale: 'zh-TW',
  calculationTimeout: 10000, // 10 seconds
  onCalculate: () => {},
  onError: () => {},
  onLoadingChange: () => {},
  errorFallback: ({ error }) => React.createElement('div', {
    className: 'calculator-error',
    children: `計算器錯誤: ${error.message}`
  }),
  theme: 'light',
  accessibility: {
    highContrast: false,
    largeText: false,
    screenReader: false
  }
};

// ============================================================================
// Calculator Instance Implementation
// ============================================================================

export class CalculatorInstance {
  public readonly pluginId: string;
  public readonly plugin: CalculatorPlugin;
  public readonly container: HTMLElement;
  public readonly options: CalculatorInstanceOptions;
  
  public inputs: CalculatorInputs = {};
  public lastResult: CalculationResult | null = null;
  public status: CalculatorInstanceStatus = 'loading';
  
  public metrics: CalculatorInstanceMetrics = {
    loadTime: 0,
    calculationCount: 0,
    averageCalculationTime: 0,
    errorCount: 0,
    lastUsed: new Date()
  };

  private root: any = null;
  private destroyed = false;
  private calculationAbortController: AbortController | null = null;
  private React: any = null;

  constructor(plugin: CalculatorPlugin, container: HTMLElement, options: CalculatorInstanceOptions = {}) {
    this.pluginId = `${plugin.metadata.namespace}.${plugin.metadata.id}`;
    this.plugin = plugin;
    this.container = container;
    this.options = { ...DEFAULT_INSTANCE_OPTIONS, ...options };
  }

  /**
   * Render the calculator instance
   */
  async render(): Promise<void> {
    if (this.destroyed) {
      throw new Error('Cannot render destroyed calculator instance');
    }

    const startTime = performance.now();
    this.status = 'loading';
    this.options.onLoadingChange?.(true);

    try {
      // Import React and ReactDOM dynamically
      const [React, ReactDOM] = await Promise.all([
        import('react'),
        import('react-dom/client')
      ]);

      this.React = React;

      // Create React root
      this.root = ReactDOM.createRoot(this.container);

      // Create calculator app component
      const CalculatorApp = this.createCalculatorApp();

      // Render with error boundary
      this.root.render(
        React.createElement(this.createErrorBoundary(), {
          fallback: this.options.errorFallback!,
          onError: (error: Error) => {
            console.error(`Calculator error in ${this.pluginId}:`, error);
            this.status = 'error';
            this.metrics.errorCount++;
            this.options.onError?.(error);
          }
        }, React.createElement(CalculatorApp))
      );

      this.status = 'ready';
      this.metrics.loadTime = performance.now() - startTime;
      this.options.onLoadingChange?.(false);

      console.log(`✅ Calculator rendered: ${this.pluginId} (${this.metrics.loadTime.toFixed(2)}ms)`);

    } catch (error) {
      this.status = 'error';
      this.metrics.errorCount++;
      this.options.onLoadingChange?.(false);
      console.error('Failed to render calculator:', error);
      throw error;
    }
  }

  /**
   * Perform calculation with the given inputs
   */
  async calculate(inputs: CalculatorInputs): Promise<CalculationResult> {
    if (this.destroyed) {
      throw new Error('Cannot calculate with destroyed instance');
    }

    const startTime = performance.now();
    this.status = 'calculating';
    this.inputs = inputs;
    this.metrics.lastUsed = new Date();

    // Cancel any ongoing calculation
    if (this.calculationAbortController) {
      this.calculationAbortController.abort();
    }
    this.calculationAbortController = new AbortController();

    try {
      // Validate inputs if plugin supports it
      if (this.plugin.calculator.validate) {
        const validation = await this.withTimeout(
          Promise.resolve(this.plugin.calculator.validate(inputs)),
          5000,
          'Input validation timeout'
        );

        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors?.map(e => e.message).join(', ')}`);
        }
      }

      // Perform calculation with timeout protection
      const result = await this.withTimeout(
        Promise.resolve(this.plugin.calculator.calculate(inputs)),
        this.options.calculationTimeout!,
        'Calculation timeout'
      );

      // Update metrics
      const calculationTime = performance.now() - startTime;
      this.metrics.calculationCount++;
      const totalTime = this.metrics.averageCalculationTime * (this.metrics.calculationCount - 1) + calculationTime;
      this.metrics.averageCalculationTime = totalTime / this.metrics.calculationCount;

      this.lastResult = result;
      this.status = 'ready';

      this.options.onCalculate?.(result);
      return result;

    } catch (error) {
      this.metrics.errorCount++;
      this.status = 'error';
      this.options.onError?.(error as Error);
      throw error;
    } finally {
      this.calculationAbortController = null;
    }
  }

  /**
   * Update inputs without triggering calculation
   */
  updateInputs(inputs: Partial<CalculatorInputs>): void {
    this.inputs = { ...this.inputs, ...inputs };
  }

  /**
   * Reset calculator state
   */
  reset(): void {
    this.inputs = {};
    this.lastResult = null;
    this.status = 'ready';
  }

  /**
   * Destroy instance and cleanup resources
   */
  destroy(): void {
    if (this.destroyed) return;

    try {
      // Cancel any ongoing calculations
      if (this.calculationAbortController) {
        this.calculationAbortController.abort();
      }

      // Unmount React component
      if (this.root) {
        this.root.unmount();
      }

      this.destroyed = true;
      this.status = 'destroyed';

      console.log(`🗑️ Calculator instance destroyed: ${this.pluginId}`);
    } catch (error) {
      console.error('Error destroying calculator instance:', error);
    }
  }

  /**
   * Get current status
   */
  getStatus(): CalculatorInstanceStatus {
    return this.status;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): CalculatorInstanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if instance is destroyed
   */
  isDestroyed(): boolean {
    return this.destroyed;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Create the main calculator React app component
   */
  private createCalculatorApp(): React.FC {
    const { plugin, options } = this;
    const { locale = 'zh-TW' } = options;

    return () => {
      const [inputs, setInputs] = this.React.useState<CalculatorInputs>({});
      const [result, setResult] = this.React.useState<CalculationResult | null>(null);
      const [errors, setErrors] = this.React.useState<any[]>([]);
      const [isCalculating, setIsCalculating] = this.React.useState(false);

      // Input change handler
      const handleInputChange = this.React.useCallback((fieldId: string, value: any) => {
        const newInputs = { ...inputs, [fieldId]: value };
        setInputs(newInputs);
        this.updateInputs(newInputs);
        setErrors([]);
      }, [inputs]);

      // Calculate handler
      const handleCalculate = this.React.useCallback(async () => {
        setIsCalculating(true);
        setErrors([]);

        try {
          const calculationResult = await this.calculate(inputs);
          setResult(calculationResult);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setErrors([{ field: 'general', message: errorMessage, type: 'error' }]);
        } finally {
          setIsCalculating(false);
        }
      }, [inputs]);

      // Reset handler
      const handleReset = this.React.useCallback(() => {
        setInputs({});
        setResult(null);
        setErrors([]);
        this.reset();
      }, []);

      return this.React.createElement('div', { 
        className: `calculator-app calculator-${plugin.metadata.namespace}-${plugin.metadata.id}`,
        'data-theme': options.theme,
        'data-plugin-id': this.pluginId
      }, [
        // Form section
        this.renderForm(plugin.config, inputs, handleInputChange, errors, isCalculating, handleCalculate, handleReset, locale),
        
        // Results section
        result && plugin.dashboard && this.React.createElement('div', {
          key: 'results',
          className: 'calculator-results'
        }, this.React.createElement(plugin.dashboard, { 
          result, 
          locale, 
          inputs,
          theme: options.theme,
          accessibility: options.accessibility
        }))
      ]);
    };
  }

  /**
   * Render the calculator form
   */
  private renderForm(
    config: any,
    inputs: CalculatorInputs,
    handleInputChange: (fieldId: string, value: any) => void,
    errors: any[],
    isCalculating: boolean,
    handleCalculate: () => void,
    handleReset: () => void,
    locale: SupportedLocale
  ): React.ReactElement {
    return this.React.createElement('form', {
      key: 'form',
      className: 'calculator-form',
      onSubmit: (e: Event) => {
        e.preventDefault();
        handleCalculate();
      }
    }, [
      // Render form fields
      ...config.fields.map((field: any, index: number) => 
        this.renderField(field, inputs[field.id], handleInputChange, errors, locale, index)
      ),
      
      // Action buttons
      this.React.createElement('div', {
        key: 'actions',
        className: 'calculator-actions'
      }, [
        this.React.createElement('button', {
          key: 'calculate',
          type: 'submit',
          disabled: isCalculating,
          className: 'btn btn-primary'
        }, isCalculating ? '計算中...' : '計算'),
        
        this.React.createElement('button', {
          key: 'reset',
          type: 'button',
          onClick: handleReset,
          className: 'btn btn-secondary'
        }, '重設')
      ]),
      
      // Error display
      errors.length > 0 && this.React.createElement('div', {
        key: 'errors',
        className: 'calculator-errors'
      }, errors.map((error, index) => 
        this.React.createElement('div', {
          key: index,
          className: `error error-${error.type || 'general'}`
        }, error.message)
      ))
    ]);
  }

  /**
   * Render individual form field
   */
  private renderField(
    field: any,
    value: any,
    onChange: (fieldId: string, value: any) => void,
    errors: any[],
    locale: SupportedLocale,
    index: number
  ): React.ReactElement {
    const fieldError = errors.find(e => e.field === field.id);
    const label = field.label[locale] || field.label['zh-TW'] || field.id;

    return this.React.createElement('div', {
      key: field.id,
      className: `form-field form-field-${field.type} ${fieldError ? 'has-error' : ''}`
    }, [
      this.React.createElement('label', {
        key: 'label',
        htmlFor: field.id,
        className: 'form-label'
      }, [
        label,
        field.required && this.React.createElement('span', {
          key: 'required',
          className: 'required'
        }, ' *')
      ]),
      
      this.renderFieldInput(field, value, onChange),
      
      fieldError && this.React.createElement('div', {
        key: 'error',
        className: 'field-error'
      }, fieldError.message)
    ]);
  }

  /**
   * Render field input based on type
   */
  private renderFieldInput(field: any, value: any, onChange: (fieldId: string, value: any) => void): React.ReactElement {
    const commonProps = {
      id: field.id,
      name: field.id,
      value: value || '',
      onChange: (e: any) => onChange(field.id, e.target.value),
      required: field.required,
      className: 'form-input'
    };

    switch (field.type) {
      case 'number':
        return this.React.createElement('input', {
          ...commonProps,
          type: 'number',
          min: field.min,
          max: field.max,
          step: field.step || 'any',
          placeholder: field.placeholder
        });

      case 'select':
        return this.React.createElement('select', {
          ...commonProps,
          onChange: (e: any) => onChange(field.id, e.target.value)
        }, [
          this.React.createElement('option', { key: '', value: '' }, '請選擇...'),
          ...field.options.map((option: any) => 
            this.React.createElement('option', {
              key: option.value,
              value: option.value
            }, option.label[this.options.locale!] || option.label['zh-TW'] || option.value)
          )
        ]);

      case 'checkbox':
        return this.React.createElement('input', {
          ...commonProps,
          type: 'checkbox',
          checked: !!value,
          onChange: (e: any) => onChange(field.id, e.target.checked)
        });

      case 'radio':
        return this.React.createElement('div', {
          className: 'radio-group'
        }, field.options.map((option: any) => 
          this.React.createElement('label', {
            key: option.value,
            className: 'radio-label'
          }, [
            this.React.createElement('input', {
              key: 'input',
              type: 'radio',
              name: field.id,
              value: option.value,
              checked: value === option.value,
              onChange: (e: any) => onChange(field.id, e.target.value)
            }),
            this.React.createElement('span', {
              key: 'text'
            }, option.label[this.options.locale!] || option.label['zh-TW'] || option.value)
          ])
        ));

      default:
        return this.React.createElement('input', {
          ...commonProps,
          type: 'text',
          placeholder: field.placeholder
        });
    }
  }

  /**
   * Create error boundary component
   */
  private createErrorBoundary(): React.ComponentType<any> {
    const React = this.React;
    
    return class ErrorBoundary extends React.Component {
      constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
      }

      static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
      }

      componentDidCatch(error: Error, errorInfo: any) {
        console.error('Calculator error boundary caught error:', error, errorInfo);
        this.props.onError?.(error);
      }

      render() {
        if (this.state.hasError) {
          return React.createElement(this.props.fallback, { error: this.state.error });
        }

        return this.props.children;
      }
    };
  }

  /**
   * Execute promise with timeout protection
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
    let timeoutHandle: NodeJS.Timeout;
    const timeoutPromise = new Promise<T>((_resolve, reject) => {
      timeoutHandle = setTimeout(() => reject(new PluginTimeoutError(
        errorMessage,
        this.plugin.metadata.id,
        this.plugin.metadata.namespace,
        timeoutMs,
        'calculation'
      )), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
      clearTimeout(timeoutHandle);
    });
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a new calculator instance
 */
export function createCalculatorInstance(
  plugin: CalculatorPlugin,
  container: HTMLElement,
  options?: CalculatorInstanceOptions
): CalculatorInstance {
  return new CalculatorInstance(plugin, container, options);
}

/**
 * Default export
 */
export default CalculatorInstance;