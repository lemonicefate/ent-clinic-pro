/**
 * Dynamic Calculator Loader
 * 
 * Replaces the current ModularCalculatorLoader with a plugin-aware system.
 * This loader manages the complete lifecycle of calculator plugins including
 * discovery, registration, loading, and rendering with error isolation.
 * 
 * Key Features:
 * - Plugin initialization and dependency resolution
 * - Lazy loading with Astro/Vite chunk generation
 * - Timeout protection and retry mechanisms for plugin loading
 * - Performance monitoring and caching
 * - Error isolation and graceful degradation
 * - Backward compatibility with existing calculator IDs
 */

import type {
  CalculatorPlugin,
  PluginLoadResult,
  PluginError,
  PluginTimeoutError,
  PluginLoadError,
  DependencyError,
  SystemPerformanceMetrics
} from '../types/calculator-plugin.js';

import type {
  CalculatorInputs,
  CalculationResult,
  SupportedLocale
} from '../types/calculator.js';

import { CalculatorRegistry } from './calculator-registry.js';
import { CalculatorDiscovery } from './calculator-discovery.js';

// ============================================================================
// Loader Configuration and Types
// ============================================================================

export interface LoaderOptions {
  /** Current locale for localization */
  locale?: SupportedLocale;
  
  /** Timeout for plugin loading in milliseconds */
  loadTimeout?: number;
  
  /** Timeout for calculation execution in milliseconds */
  calculationTimeout?: number;
  
  /** Maximum retry attempts for failed operations */
  maxRetries?: number;
  
  /** Callback for calculation completion */
  onCalculate?: (result: CalculationResult) => void;
  
  /** Callback for errors */
  onError?: (error: Error) => void;
  
  /** Callback for loading state changes */
  onLoadingChange?: (isLoading: boolean) => void;
  
  /** Enable performance monitoring */
  enablePerformanceMonitoring?: boolean;
  
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

export interface CalculatorInstance {
  /** Plugin identifier */
  pluginId: string;
  
  /** Plugin instance */
  plugin: CalculatorPlugin;
  
  /** Container element */
  container: HTMLElement;
  
  /** Loader options */
  options: LoaderOptions;
  
  /** Current calculation inputs */
  inputs: CalculatorInputs;
  
  /** Last calculation result */
  lastResult: CalculationResult | null;
  
  /** Instance status */
  status: 'loading' | 'ready' | 'calculating' | 'error' | 'destroyed';
  
  /** Performance metrics */
  metrics: {
    loadTime: number;
    calculationCount: number;
    averageCalculationTime: number;
    errorCount: number;
    lastUsed: Date;
  };
  
  /** Render the calculator */
  render(): Promise<void>;
  
  /** Calculate result */
  calculate(inputs: CalculatorInputs): Promise<CalculationResult>;
  
  /** Update inputs */
  updateInputs(inputs: Partial<CalculatorInputs>): void;
  
  /** Reset calculator state */
  reset(): void;
  
  /** Destroy instance and cleanup resources */
  destroy(): void;
  
  /** Get current status */
  getStatus(): string;
  
  /** Get performance metrics */
  getMetrics(): any;
}

interface LoaderCache {
  plugins: Map<string, CalculatorPlugin>;
  instances: Map<string, CalculatorInstance>;
  loadingPromises: Map<string, Promise<CalculatorPlugin>>;
  lastCleanup: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_LOADER_OPTIONS: Required<LoaderOptions> = {
  locale: 'zh-TW',
  loadTimeout: 30000, // 30 seconds
  calculationTimeout: 10000, // 10 seconds
  maxRetries: 3,
  onCalculate: () => {},
  onError: () => {},
  onLoadingChange: () => {},
  enablePerformanceMonitoring: true,
  errorFallback: ({ error }) => React.createElement('div', {
    className: 'calculator-error',
    children: `計算器載入失敗: ${error.message}`
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

class CalculatorInstanceImpl implements CalculatorInstance {
  public pluginId: string;
  public plugin: CalculatorPlugin;
  public container: HTMLElement;
  public options: LoaderOptions;
  public inputs: CalculatorInputs = {};
  public lastResult: CalculationResult | null = null;
  public status: CalculatorInstance['status'] = 'loading';
  
  public metrics = {
    loadTime: 0,
    calculationCount: 0,
    averageCalculationTime: 0,
    errorCount: 0,
    lastUsed: new Date()
  };

  private root: any = null;
  private destroyed = false;
  private calculationAbortController: AbortController | null = null;

  constructor(plugin: CalculatorPlugin, container: HTMLElement, options: LoaderOptions) {
    this.pluginId = `${plugin.metadata.namespace}.${plugin.metadata.id}`;
    this.plugin = plugin;
    this.container = container;
    this.options = { ...DEFAULT_LOADER_OPTIONS, ...options };
  }

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

      // Create React root
      this.root = ReactDOM.createRoot(this.container);

      // Create calculator app component
      const CalculatorApp = this.createCalculatorApp(React);

      // Render with error boundary
      this.root.render(
        React.createElement(this.createErrorBoundary(React), {
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

      // Update registry statistics
      const registry = CalculatorRegistry.getInstance();
      registry.updatePluginStats(this.pluginId, calculationTime, false);

      this.options.onCalculate?.(result);
      return result;

    } catch (error) {
      const calculationTime = performance.now() - startTime;
      this.metrics.errorCount++;
      this.status = 'error';

      // Update registry statistics with error
      const registry = CalculatorRegistry.getInstance();
      registry.updatePluginStats(this.pluginId, calculationTime, true);

      this.options.onError?.(error as Error);
      throw error;
    } finally {
      this.calculationAbortController = null;
    }
  }

  updateInputs(inputs: Partial<CalculatorInputs>): void {
    this.inputs = { ...this.inputs, ...inputs };
  }

  reset(): void {
    this.inputs = {};
    this.lastResult = null;
    this.status = 'ready';
  }

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

  getStatus(): string {
    return this.status;
  }

  getMetrics(): any {
    return { ...this.metrics };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private createCalculatorApp(React: any): React.FC {
    const { plugin, options } = this;
    const { locale = 'zh-TW' } = options;

    return () => {
      const [inputs, setInputs] = React.useState<CalculatorInputs>({});
      const [result, setResult] = React.useState<CalculationResult | null>(null);
      const [errors, setErrors] = React.useState<any[]>([]);
      const [isCalculating, setIsCalculating] = React.useState(false);

      // Input change handler
      const handleInputChange = React.useCallback((fieldId: string, value: any) => {
        const newInputs = { ...inputs, [fieldId]: value };
        setInputs(newInputs);
        this.updateInputs(newInputs);
        setErrors([]);
      }, [inputs]);

      // Calculate handler
      const handleCalculate = React.useCallback(async () => {
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
      const handleReset = React.useCallback(() => {
        setInputs({});
        setResult(null);
        setErrors([]);
        this.reset();
      }, []);

      return React.createElement('div', { 
        className: `calculator-app calculator-${plugin.metadata.namespace}-${plugin.metadata.id}`,
        'data-theme': options.theme,
        'data-plugin-id': this.pluginId
      }, [
        // Form section
        this.renderForm(React, plugin.config, inputs, handleInputChange, errors, isCalculating, handleCalculate, handleReset, locale),
        
        // Results section
        result && plugin.dashboard && React.createElement('div', {
          key: 'results',
          className: 'calculator-results'
        }, React.createElement(plugin.dashboard, { 
          result, 
          locale, 
          inputs,
          theme: options.theme,
          accessibility: options.accessibility
        }))
      ]);
    };
  }

  private renderForm(
    React: any,
    config: any,
    inputs: CalculatorInputs,
    handleInputChange: (fieldId: string, value: any) => void,
    errors: any[],
    isCalculating: boolean,
    handleCalculate: () => void,
    handleReset: () => void,
    locale: SupportedLocale
  ): React.ReactElement {
    return React.createElement('form', {
      key: 'form',
      className: 'calculator-form',
      onSubmit: (e: Event) => {
        e.preventDefault();
        handleCalculate();
      }
    }, [
      // Render form fields
      ...config.fields.map((field: any, index: number) => 
        this.renderField(React, field, inputs[field.id], handleInputChange, errors, locale, index)
      ),
      
      // Action buttons
      React.createElement('div', {
        key: 'actions',
        className: 'calculator-actions'
      }, [
        React.createElement('button', {
          key: 'calculate',
          type: 'submit',
          disabled: isCalculating,
          className: 'btn btn-primary'
        }, isCalculating ? '計算中...' : '計算'),
        
        React.createElement('button', {
          key: 'reset',
          type: 'button',
          onClick: handleReset,
          className: 'btn btn-secondary'
        }, '重設')
      ]),
      
      // Error display
      errors.length > 0 && React.createElement('div', {
        key: 'errors',
        className: 'calculator-errors'
      }, errors.map((error, index) => 
        React.createElement('div', {
          key: index,
          className: `error error-${error.type || 'general'}`
        }, error.message)
      ))
    ]);
  }

  private renderField(
    React: any,
    field: any,
    value: any,
    onChange: (fieldId: string, value: any) => void,
    errors: any[],
    locale: SupportedLocale,
    index: number
  ): React.ReactElement {
    const fieldError = errors.find(e => e.field === field.id);
    const label = field.label[locale] || field.label['zh-TW'] || field.id;

    return React.createElement('div', {
      key: field.id,
      className: `form-field form-field-${field.type} ${fieldError ? 'has-error' : ''}`
    }, [
      React.createElement('label', {
        key: 'label',
        htmlFor: field.id,
        className: 'form-label'
      }, [
        label,
        field.required && React.createElement('span', {
          key: 'required',
          className: 'required'
        }, ' *')
      ]),
      
      this.renderFieldInput(React, field, value, onChange),
      
      fieldError && React.createElement('div', {
        key: 'error',
        className: 'field-error'
      }, fieldError.message)
    ]);
  }

  private renderFieldInput(React: any, field: any, value: any, onChange: (fieldId: string, value: any) => void): React.ReactElement {
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
        return React.createElement('input', {
          ...commonProps,
          type: 'number',
          min: field.min,
          max: field.max,
          step: field.step || 'any',
          placeholder: field.placeholder
        });

      case 'select':
        return React.createElement('select', {
          ...commonProps,
          onChange: (e: any) => onChange(field.id, e.target.value)
        }, [
          React.createElement('option', { key: '', value: '' }, '請選擇...'),
          ...field.options.map((option: any) => 
            React.createElement('option', {
              key: option.value,
              value: option.value
            }, option.label[this.options.locale!] || option.label['zh-TW'] || option.value)
          )
        ]);

      case 'checkbox':
        return React.createElement('input', {
          ...commonProps,
          type: 'checkbox',
          checked: !!value,
          onChange: (e: any) => onChange(field.id, e.target.checked)
        });

      case 'radio':
        return React.createElement('div', {
          className: 'radio-group'
        }, field.options.map((option: any) => 
          React.createElement('label', {
            key: option.value,
            className: 'radio-label'
          }, [
            React.createElement('input', {
              key: 'input',
              type: 'radio',
              name: field.id,
              value: option.value,
              checked: value === option.value,
              onChange: (e: any) => onChange(field.id, e.target.value)
            }),
            React.createElement('span', {
              key: 'text'
            }, option.label[this.options.locale!] || option.label['zh-TW'] || option.value)
          ])
        ));

      default:
        return React.createElement('input', {
          ...commonProps,
          type: 'text',
          placeholder: field.placeholder
        });
    }
  }

  private createErrorBoundary(React: any): React.ComponentType<any> {
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
// Main Dynamic Calculator Loader Class
// ============================================================================

export class DynamicCalculatorLoader {
  private static instance: DynamicCalculatorLoader | null = null;
  
  private registry: CalculatorRegistry;
  private discovery: CalculatorDiscovery;
  private cache: LoaderCache;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Singleton pattern - get loader instance
   */
  static getInstance(): DynamicCalculatorLoader {
    if (!this.instance) {
      this.instance = new DynamicCalculatorLoader();
    }
    return this.instance;
  }

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.registry = CalculatorRegistry.getInstance();
    this.discovery = new CalculatorDiscovery();
    this.cache = {
      plugins: new Map(),
      instances: new Map(),
      loadingPromises: new Map(),
      lastCleanup: Date.now()
    };

    // Set up periodic cache cleanup
    setInterval(() => this.cleanupCache(), 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Initialize the plugin system
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  private async doInitialize(): Promise<void> {
    const startTime = performance.now();

    try {
      console.log('🚀 Initializing Dynamic Calculator Loader...');

      // Initialize registry and discovery
      await Promise.all([
        this.registry.initialize(),
        this.discovery.initialize()
      ]);

      // Discover all plugins
      const discoveryResults = await this.discovery.discoverCalculators();

      // Separate successful and failed loads
      const successfulLoads = discoveryResults.discovered.filter(r => r.success && r.plugin);
      const failedLoads = [...discoveryResults.failed, ...discoveryResults.discovered.filter(r => !r.success)];

      // Log failed loads
      failedLoads.forEach(result => {
        console.warn('⚠️ Plugin load failed:', result.error);
      });

      // Sort plugins by dependencies
      const plugins = successfulLoads.map(r => r.plugin!);
      const sortedPlugins = this.sortByDependencies(plugins);

      // Register plugins in dependency order
      for (const plugin of sortedPlugins) {
        try {
          await this.registry.register(plugin);
          this.cache.plugins.set(`${plugin.metadata.namespace}.${plugin.metadata.id}`, plugin);
        } catch (error) {
          console.error(`❌ Failed to register plugin ${plugin.metadata.namespace}.${plugin.metadata.id}:`, error);
        }
      }

      this.initialized = true;
      const initTime = performance.now() - startTime;
      
      console.log(`✅ Dynamic Calculator Loader initialized with ${this.registry.listAll().length} plugins (${initTime.toFixed(2)}ms)`);

    } catch (error) {
      console.error('❌ Failed to initialize Dynamic Calculator Loader:', error);
      this.initialized = false;
      throw error;
    }
  }

  /**
   * Load and render a calculator
   */
  async loadCalculator(
    calculatorId: string,
    container: HTMLElement,
    options: LoaderOptions = {}
  ): Promise<CalculatorInstance | null> {
    await this.initialize();

    const startTime = performance.now();
    options.onLoadingChange?.(true);

    try {
      // Get plugin from cache or registry
      let plugin = this.cache.plugins.get(calculatorId);
      if (!plugin) {
        plugin = this.registry.get(calculatorId);
        if (plugin) {
          this.cache.plugins.set(calculatorId, plugin);
        }
      }

      if (!plugin) {
        throw new PluginLoadError(
          `Calculator plugin not found: ${calculatorId}`,
          calculatorId.split('.')[1],
          calculatorId.split('.')[0],
          'discovery'
        );
      }

      // Create calculator instance
      const instance = new CalculatorInstanceImpl(plugin, container, options);
      
      // Store instance in cache
      const instanceKey = `${calculatorId}-${Date.now()}`;
      this.cache.instances.set(instanceKey, instance);

      // Render calculator
      await instance.render();

      const loadTime = performance.now() - startTime;
      console.log(`✅ Calculator loaded: ${calculatorId} (${loadTime.toFixed(2)}ms)`);

      return instance;

    } catch (error) {
      const loadTime = performance.now() - startTime;
      console.error(`❌ Failed to load calculator ${calculatorId} (${loadTime.toFixed(2)}ms):`, error);
      options.onLoadingChange?.(false);
      options.onError?.(error as Error);
      return null;
    }
  }

  /**
   * Get available calculators
   */
  async getAvailableCalculators(): Promise<CalculatorPlugin[]> {
    await this.initialize();
    return this.registry.listAll();
  }

  /**
   * Get calculators by namespace
   */
  async getCalculatorsByNamespace(namespace: string): Promise<CalculatorPlugin[]> {
    await this.initialize();
    return this.registry.getByNamespace(namespace);
  }

  /**
   * Search calculators
   */
  async searchCalculators(query: string, namespace?: string): Promise<CalculatorPlugin[]> {
    await this.initialize();
    
    const searchResult = this.registry.search({
      query,
      namespace,
      sortBy: 'name',
      sortOrder: 'asc'
    });

    return searchResult.plugins.map(entry => entry.plugin);
  }

  /**
   * Get system performance metrics
   */
  getSystemPerformanceMetrics(): SystemPerformanceMetrics {
    return this.registry.getSystemPerformanceMetrics();
  }

  /**
   * Get loader statistics
   */
  getLoaderStats() {
    return {
      initialized: this.initialized,
      registryStats: this.registry.getRegistryStats(),
      cacheStats: {
        plugins: this.cache.plugins.size,
        instances: this.cache.instances.size,
        loadingPromises: this.cache.loadingPromises.size,
        lastCleanup: this.cache.lastCleanup
      },
      discoveryStats: this.discovery.getCacheStats()
    };
  }

  /**
   * Reload a specific plugin
   */
  async reloadPlugin(pluginId: string): Promise<void> {
    await this.initialize();

    try {
      // Unregister existing plugin
      await this.registry.unregister(pluginId);
      
      // Remove from cache
      this.cache.plugins.delete(pluginId);
      
      // Reload plugin
      const plugin = await this.discovery.loadPluginById(pluginId);
      if (plugin) {
        await this.registry.register(plugin);
        this.cache.plugins.set(pluginId, plugin);
        console.log(`🔄 Plugin reloaded: ${pluginId}`);
      }
    } catch (error) {
      console.error(`❌ Failed to reload plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.cache.plugins.clear();
    this.cache.instances.clear();
    this.cache.loadingPromises.clear();
    this.discovery.clearCache();
    console.log('🧹 All caches cleared');
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Sort plugins by dependencies using topological sort
   */
  private sortByDependencies(plugins: CalculatorPlugin[]): CalculatorPlugin[] {
    const sorted: CalculatorPlugin[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (plugin: CalculatorPlugin) => {
      const fullId = `${plugin.metadata.namespace}.${plugin.metadata.id}`;

      if (visiting.has(fullId)) {
        throw new DependencyError(
          `Circular dependency detected: ${fullId}`,
          plugin.metadata.id,
          plugin.metadata.namespace,
          undefined,
          Array.from(visiting)
        );
      }

      if (visited.has(fullId)) return;

      visiting.add(fullId);

      // Visit dependencies first
      for (const depId of plugin.metadata.dependencies) {
        const depPlugin = plugins.find(p => `${p.metadata.namespace}.${p.metadata.id}` === depId);
        if (depPlugin) {
          visit(depPlugin);
        }
      }

      visiting.delete(fullId);
      visited.add(fullId);
      sorted.push(plugin);
    };

    plugins.forEach(visit);
    return sorted;
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    // Clean up destroyed instances
    for (const [key, instance] of this.cache.instances) {
      if (instance.status === 'destroyed' || (now - instance.metrics.lastUsed.getTime()) > maxAge) {
        instance.destroy();
        this.cache.instances.delete(key);
      }
    }

    // Clean up old loading promises
    for (const [key, promise] of this.cache.loadingPromises) {
      // Remove promises that are older than 5 minutes
      if ((now - this.cache.lastCleanup) > 5 * 60 * 1000) {
        this.cache.loadingPromises.delete(key);
      }
    }

    this.cache.lastCleanup = now;
  }
}

// ============================================================================
// Convenience Functions and Exports
// ============================================================================

/**
 * Load a calculator with simplified API
 */
export async function loadCalculator(
  calculatorId: string,
  container: HTMLElement,
  options?: LoaderOptions
): Promise<CalculatorInstance | null> {
  const loader = DynamicCalculatorLoader.getInstance();
  return loader.loadCalculator(calculatorId, container, options);
}

/**
 * Get available calculators
 */
export async function getAvailableCalculators(): Promise<CalculatorPlugin[]> {
  const loader = DynamicCalculatorLoader.getInstance();
  return loader.getAvailableCalculators();
}

/**
 * Search calculators
 */
export async function searchCalculators(query: string, namespace?: string): Promise<CalculatorPlugin[]> {
  const loader = DynamicCalculatorLoader.getInstance();
  return loader.searchCalculators(query, namespace);
}

/**
 * Get calculators by namespace
 */
export async function getCalculatorsByNamespace(namespace: string): Promise<CalculatorPlugin[]> {
  const loader = DynamicCalculatorLoader.getInstance();
  return loader.getCalculatorsByNamespace(namespace);
}

/**
 * Get system performance metrics
 */
export function getSystemPerformanceMetrics(): SystemPerformanceMetrics {
  const loader = DynamicCalculatorLoader.getInstance();
  return loader.getSystemPerformanceMetrics();
}

/**
 * Get loader statistics
 */
export function getLoaderStats() {
  const loader = DynamicCalculatorLoader.getInstance();
  return loader.getLoaderStats();
}

/**
 * Reload a specific plugin
 */
export async function reloadPlugin(pluginId: string): Promise<void> {
  const loader = DynamicCalculatorLoader.getInstance();
  return loader.reloadPlugin(pluginId);
}

/**
 * Clear all caches
 */
export function clearCaches(): void {
  const loader = DynamicCalculatorLoader.getInstance();
  loader.clearCaches();
}

// Main loader class is already exported above

// Export types
export type {
  LoaderOptions,
  CalculatorInstance
};

// Default export
export default DynamicCalculatorLoader;