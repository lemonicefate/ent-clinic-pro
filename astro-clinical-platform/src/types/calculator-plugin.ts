/**
 * Calculator Plugin System Type Definitions
 * 
 * Defines TypeScript types for the new plugin-based calculator architecture.
 * This system replaces the centralized ModularCalculatorLoader with a 
 * decentralized, self-registering plugin system.
 */

import type { 
  CalculatorConfig, 
  CalculatorInputs, 
  CalculationResult, 
  ValidationResult, 
  SupportedLocale,
  LocalizedString,
  CalculatorImplementation,
  VisualizationConfig
} from './calculator.js';

// ============================================================================
// Core Plugin Interfaces
// ============================================================================

/**
 * Plugin metadata containing identification and dependency information
 */
export interface CalculatorMetadata {
  /** Unique identifier within the namespace (e.g., 'bmi', 'cha2ds2-vasc') */
  id: string;
  
  /** Namespace for grouping related calculators (e.g., 'cardiology', 'general') */
  namespace: string;
  
  /** Semantic version string (e.g., '1.0.0') */
  version: string;
  
  /** Human-readable name in supported locales */
  name: LocalizedString;
  
  /** Detailed description in supported locales */
  description: LocalizedString;
  
  /** Plugin author information */
  author: string;
  
  /** License identifier (e.g., 'MIT', 'Apache-2.0') */
  license: string;
  
  /** Array of plugin IDs this plugin depends on (full namespaced IDs) */
  dependencies: string[];
  
  /** Array of plugin IDs that conflict with this plugin */
  conflicts: string[];
  
  /** Tags for categorization and search */
  tags: string[];
  
  /** Minimum system version required */
  minSystemVersion?: string;
  
  /** Plugin creation timestamp */
  createdAt?: string;
  
  /** Plugin last update timestamp */
  updatedAt?: string;
}

/**
 * Main plugin interface that all calculator plugins must implement
 */
export interface CalculatorPlugin {
  /** Plugin metadata and identification */
  metadata: CalculatorMetadata;
  
  /** Calculator configuration (fields, validation, etc.) */
  config: CalculatorConfig;
  
  /** Calculator implementation (calculate, validate, format functions) */
  calculator: CalculatorImplementation;
  
  /** Optional React dashboard component for results visualization */
  dashboard?: React.ComponentType<DashboardProps>;
  
  /** Optional visualization configuration */
  visualization?: VisualizationConfig;
  
  // Lifecycle hooks
  /** Called when plugin is first loaded and registered */
  install(): Promise<void>;
  
  /** Called when plugin is unloaded or system shuts down */
  uninstall(): Promise<void>;
  
  /** Called to validate plugin integrity and configuration */
  validate(): Promise<boolean>;
  
  /** Called when plugin configuration is updated */
  onConfigUpdate?(newConfig: CalculatorConfig): Promise<void>;
  
  /** Called to check if plugin is compatible with current system */
  checkCompatibility?(): Promise<CompatibilityResult>;
}

/**
 * Props passed to dashboard components
 */
export interface DashboardProps {
  /** Calculation result to display */
  result: CalculationResult;
  
  /** Current locale for localization */
  locale: SupportedLocale;
  
  /** Original inputs used for calculation */
  inputs?: CalculatorInputs;
  
  /** Optional callback for user interactions */
  onInteraction?: (action: string, data?: any) => void;
  
  /** Optional theme configuration */
  theme?: 'light' | 'dark';
  
  /** Optional accessibility settings */
  accessibility?: {
    highContrast: boolean;
    largeText: boolean;
    screenReader: boolean;
  };
}

/**
 * Result of plugin loading operation
 */
export interface PluginLoadResult {
  /** Whether the plugin loaded successfully */
  success: boolean;
  
  /** The loaded plugin (if successful) */
  plugin?: CalculatorPlugin;
  
  /** Error message (if failed) */
  error?: string;
  
  /** Additional error details for debugging */
  errorDetails?: {
    code: string;
    stack?: string;
    context?: Record<string, any>;
  };
  
  /** Time taken to load the plugin (in milliseconds) */
  loadTime?: number;
  
  /** Warnings that occurred during loading */
  warnings?: string[];
}

/**
 * Plugin compatibility check result
 */
export interface CompatibilityResult {
  /** Whether the plugin is compatible */
  compatible: boolean;
  
  /** Compatibility issues found */
  issues: CompatibilityIssue[];
  
  /** Recommended actions to resolve issues */
  recommendations?: string[];
}

/**
 * Individual compatibility issue
 */
export interface CompatibilityIssue {
  /** Issue severity level */
  severity: 'error' | 'warning' | 'info';
  
  /** Issue category */
  category: 'version' | 'dependency' | 'conflict' | 'api' | 'configuration';
  
  /** Human-readable issue description */
  message: string;
  
  /** Technical details about the issue */
  details?: Record<string, any>;
  
  /** Suggested resolution */
  resolution?: string;
}

// ============================================================================
// Plugin Registry and Management
// ============================================================================

/**
 * Plugin registry entry with additional metadata
 */
export interface PluginRegistryEntry {
  /** The plugin instance */
  plugin: CalculatorPlugin;
  
  /** Registration timestamp */
  registeredAt: Date;
  
  /** Plugin status */
  status: PluginStatus;
  
  /** Load statistics */
  stats: PluginStats;
  
  /** Last health check result */
  lastHealthCheck?: Date;
  
  /** Health check status */
  healthy: boolean;
}

/**
 * Plugin status enumeration
 */
export type PluginStatus = 
  | 'loading'      // Plugin is being loaded
  | 'active'       // Plugin is loaded and ready
  | 'inactive'     // Plugin is loaded but disabled
  | 'error'        // Plugin failed to load or has errors
  | 'unloading'    // Plugin is being unloaded
  | 'deprecated';  // Plugin is deprecated but still functional

/**
 * Plugin usage and performance statistics
 */
export interface PluginStats {
  /** Number of times plugin has been loaded */
  loadCount: number;
  
  /** Number of calculations performed */
  calculationCount: number;
  
  /** Average calculation time in milliseconds */
  averageCalculationTime: number;
  
  /** Number of errors encountered */
  errorCount: number;
  
  /** Last calculation timestamp */
  lastUsed?: Date;
  
  /** Memory usage information */
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
}

/**
 * Plugin search and filtering options
 */
export interface PluginSearchOptions {
  /** Text search in name and description */
  query?: string;
  
  /** Filter by namespace */
  namespace?: string;
  
  /** Filter by tags */
  tags?: string[];
  
  /** Filter by status */
  status?: PluginStatus[];
  
  /** Filter by author */
  author?: string;
  
  /** Minimum version requirement */
  minVersion?: string;
  
  /** Sort options */
  sortBy?: 'name' | 'namespace' | 'version' | 'lastUsed' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  
  /** Pagination */
  offset?: number;
  limit?: number;
}

/**
 * Plugin search results
 */
export interface PluginSearchResult {
  /** Found plugins */
  plugins: PluginRegistryEntry[];
  
  /** Total number of matching plugins */
  total: number;
  
  /** Search execution time */
  searchTime: number;
  
  /** Applied filters */
  appliedFilters: PluginSearchOptions;
}

// ============================================================================
// Error Types and Handling
// ============================================================================

/**
 * Base class for all plugin-related errors
 */
export class PluginError extends Error {
  constructor(
    message: string,
    public readonly pluginId?: string,
    public readonly namespace?: string,
    public readonly errorCode?: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'PluginError';
  }
  
  /** Get the full plugin identifier */
  get fullPluginId(): string | undefined {
    if (this.namespace && this.pluginId) {
      return `${this.namespace}.${this.pluginId}`;
    }
    return this.pluginId;
  }
}

/**
 * Error thrown when plugin conflicts are detected
 */
export class PluginConflictError extends PluginError {
  constructor(
    message: string,
    pluginId?: string,
    namespace?: string,
    public readonly conflictingPlugin?: string,
    context?: Record<string, any>
  ) {
    super(message, pluginId, namespace, 'PLUGIN_CONFLICT', context);
    this.name = 'PluginConflictError';
  }
}

/**
 * Error thrown when plugin validation fails
 */
export class PluginValidationError extends PluginError {
  constructor(
    message: string,
    pluginId?: string,
    namespace?: string,
    public readonly validationErrors?: ValidationError[],
    context?: Record<string, any>
  ) {
    super(message, pluginId, namespace, 'PLUGIN_VALIDATION', context);
    this.name = 'PluginValidationError';
  }
}

/**
 * Error thrown when plugin dependencies cannot be resolved
 */
export class DependencyError extends PluginError {
  constructor(
    message: string,
    pluginId?: string,
    namespace?: string,
    public readonly missingDependencies?: string[],
    public readonly circularDependencies?: string[],
    context?: Record<string, any>
  ) {
    super(message, pluginId, namespace, 'DEPENDENCY_ERROR', context);
    this.name = 'DependencyError';
  }
}

/**
 * Error thrown when plugin loading fails
 */
export class PluginLoadError extends PluginError {
  constructor(
    message: string,
    pluginId?: string,
    namespace?: string,
    public readonly loadPhase?: 'discovery' | 'validation' | 'installation' | 'registration',
    context?: Record<string, any>
  ) {
    super(message, pluginId, namespace, 'PLUGIN_LOAD_ERROR', context);
    this.name = 'PluginLoadError';
  }
}

/**
 * Error thrown when plugin execution times out
 */
export class PluginTimeoutError extends PluginError {
  constructor(
    message: string,
    pluginId?: string,
    namespace?: string,
    public readonly timeoutMs?: number,
    public readonly operation?: string,
    context?: Record<string, any>
  ) {
    super(message, pluginId, namespace, 'PLUGIN_TIMEOUT', context);
    this.name = 'PluginTimeoutError';
  }
}

/**
 * Error thrown when plugin version conflicts occur
 */
export class VersionConflictError extends PluginError {
  constructor(
    message: string,
    pluginId?: string,
    namespace?: string,
    public readonly requiredVersion?: string,
    public readonly availableVersion?: string,
    context?: Record<string, any>
  ) {
    super(message, pluginId, namespace, 'VERSION_CONFLICT', context);
    this.name = 'VersionConflictError';
  }
}

// ============================================================================
// Plugin Lifecycle and Events
// ============================================================================

/**
 * Plugin lifecycle events
 */
export type PluginLifecycleEvent = 
  | 'beforeLoad'
  | 'afterLoad'
  | 'beforeInstall'
  | 'afterInstall'
  | 'beforeUninstall'
  | 'afterUninstall'
  | 'beforeValidation'
  | 'afterValidation'
  | 'configUpdate'
  | 'error'
  | 'statusChange';

/**
 * Plugin event data
 */
export interface PluginEventData {
  /** Event type */
  event: PluginLifecycleEvent;
  
  /** Plugin that triggered the event */
  plugin: CalculatorPlugin;
  
  /** Event timestamp */
  timestamp: Date;
  
  /** Additional event-specific data */
  data?: Record<string, any>;
  
  /** Error information (for error events) */
  error?: PluginError;
  
  /** Previous status (for statusChange events) */
  previousStatus?: PluginStatus;
  
  /** New status (for statusChange events) */
  newStatus?: PluginStatus;
}

/**
 * Plugin event listener function
 */
export type PluginEventListener = (eventData: PluginEventData) => void | Promise<void>;

/**
 * Plugin event emitter interface
 */
export interface PluginEventEmitter {
  /** Add event listener */
  on(event: PluginLifecycleEvent, listener: PluginEventListener): void;
  
  /** Remove event listener */
  off(event: PluginLifecycleEvent, listener: PluginEventListener): void;
  
  /** Emit event */
  emit(event: PluginLifecycleEvent, data: Omit<PluginEventData, 'event' | 'timestamp'>): void;
  
  /** Remove all listeners */
  removeAllListeners(event?: PluginLifecycleEvent): void;
}

// ============================================================================
// Plugin Configuration and Validation
// ============================================================================

/**
 * Plugin configuration schema for validation
 */
export interface PluginConfigSchema {
  /** JSON Schema for plugin metadata */
  metadata: Record<string, any>;
  
  /** JSON Schema for calculator configuration */
  config: Record<string, any>;
  
  /** Required files in plugin directory */
  requiredFiles: string[];
  
  /** Optional files in plugin directory */
  optionalFiles: string[];
  
  /** Validation rules */
  validationRules: ValidationRule[];
}

/**
 * Plugin validation rule
 */
export interface ValidationRule {
  /** Rule identifier */
  id: string;
  
  /** Rule description */
  description: string;
  
  /** Rule severity */
  severity: 'error' | 'warning' | 'info';
  
  /** Validation function */
  validate: (plugin: CalculatorPlugin) => Promise<ValidationResult>;
}

/**
 * Enhanced validation error for plugins
 */
export interface ValidationError {
  /** Field that failed validation */
  field: string;
  
  /** Error message */
  message: string;
  
  /** Error code for programmatic handling */
  code?: string;
  
  /** Error severity */
  severity?: 'error' | 'warning' | 'info';
  
  /** Path to the problematic value */
  path?: string;
  
  /** Expected value or format */
  expected?: any;
  
  /** Actual value that caused the error */
  actual?: any;
  
  /** Suggestions for fixing the error */
  suggestions?: string[];
}

// ============================================================================
// Plugin Discovery and Loading
// ============================================================================

/**
 * Plugin discovery configuration
 */
export interface PluginDiscoveryConfig {
  /** Base directory to scan for plugins */
  baseDirectory: string;
  
  /** File patterns to include */
  includePatterns: string[];
  
  /** File patterns to exclude */
  excludePatterns: string[];
  
  /** Whether to scan subdirectories recursively */
  recursive: boolean;
  
  /** Maximum depth for recursive scanning */
  maxDepth?: number;
  
  /** Whether to follow symbolic links */
  followSymlinks: boolean;
  
  /** Timeout for plugin loading (in milliseconds) */
  loadTimeout: number;
  
  /** Whether to enable hot reloading in development */
  hotReload: boolean;
  
  /** Cache configuration */
  cache: {
    enabled: boolean;
    ttl: number; // Time to live in milliseconds
    maxSize: number; // Maximum number of cached entries
  };
}

/**
 * Plugin discovery result
 */
export interface PluginDiscoveryResult {
  /** Successfully discovered plugins */
  discovered: PluginLoadResult[];
  
  /** Failed discovery attempts */
  failed: PluginLoadResult[];
  
  /** Discovery statistics */
  stats: {
    totalScanned: number;
    totalDiscovered: number;
    totalFailed: number;
    scanTime: number;
    loadTime: number;
  };
  
  /** Warnings encountered during discovery */
  warnings: string[];
}

// ============================================================================
// Plugin Performance and Monitoring
// ============================================================================

/**
 * Plugin performance metrics
 */
export interface PluginPerformanceMetrics {
  /** Plugin identifier */
  pluginId: string;
  
  /** Namespace */
  namespace: string;
  
  /** Load time in milliseconds */
  loadTime: number;
  
  /** Installation time in milliseconds */
  installTime: number;
  
  /** Average calculation time in milliseconds */
  averageCalculationTime: number;
  
  /** Memory usage in bytes */
  memoryUsage: number;
  
  /** CPU usage percentage */
  cpuUsage: number;
  
  /** Number of calculations performed */
  calculationCount: number;
  
  /** Error rate (errors per calculation) */
  errorRate: number;
  
  /** Last measurement timestamp */
  timestamp: Date;
}

/**
 * System-wide plugin performance summary
 */
export interface SystemPerformanceMetrics {
  /** Total number of registered plugins */
  totalPlugins: number;
  
  /** Number of active plugins */
  activePlugins: number;
  
  /** Total memory usage by all plugins */
  totalMemoryUsage: number;
  
  /** Average plugin load time */
  averageLoadTime: number;
  
  /** System uptime */
  uptime: number;
  
  /** Total calculations performed */
  totalCalculations: number;
  
  /** Overall error rate */
  overallErrorRate: number;
  
  /** Performance metrics by plugin */
  pluginMetrics: PluginPerformanceMetrics[];
  
  /** Timestamp of metrics collection */
  timestamp: Date;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Plugin version information
 */
export interface PluginVersion {
  /** Major version number */
  major: number;
  
  /** Minor version number */
  minor: number;
  
  /** Patch version number */
  patch: number;
  
  /** Pre-release identifier */
  prerelease?: string;
  
  /** Build metadata */
  build?: string;
  
  /** Original version string */
  raw: string;
}

/**
 * Plugin dependency specification
 */
export interface PluginDependency {
  /** Plugin identifier */
  id: string;
  
  /** Plugin namespace */
  namespace: string;
  
  /** Version requirement (semver range) */
  version: string;
  
  /** Whether this dependency is optional */
  optional: boolean;
  
  /** Reason for the dependency */
  reason?: string;
}

/**
 * Plugin health check result
 */
export interface PluginHealthCheck {
  /** Plugin identifier */
  pluginId: string;
  
  /** Health status */
  healthy: boolean;
  
  /** Health check timestamp */
  timestamp: Date;
  
  /** Response time in milliseconds */
  responseTime: number;
  
  /** Health issues found */
  issues: HealthIssue[];
  
  /** Additional health metrics */
  metrics?: Record<string, number>;
}

/**
 * Individual health issue
 */
export interface HealthIssue {
  /** Issue severity */
  severity: 'critical' | 'warning' | 'info';
  
  /** Issue category */
  category: 'performance' | 'memory' | 'errors' | 'dependencies' | 'configuration';
  
  /** Issue description */
  message: string;
  
  /** Suggested resolution */
  resolution?: string;
  
  /** Issue detection timestamp */
  detectedAt: Date;
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  // Re-export commonly used types from calculator.ts
  CalculatorConfig,
  CalculatorInputs,
  CalculationResult,
  ValidationResult,
  SupportedLocale,
  LocalizedString,
  CalculatorImplementation,
  VisualizationConfig
};

// Default export for convenience
export default {
  // Plugin system is ready for implementation
  version: '1.0.0',
  description: 'Calculator Plugin System Type Definitions'
};