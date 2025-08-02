/**
 * Calculator Plugin Discovery System
 * 
 * Automatically discovers and loads calculator plugins from the file system.
 * This component operates during both build-time (SSG) and runtime to scan
 * and collect metadata and entry points for all calculator plugins.
 * 
 * Key Features:
 * - Build-time directory scanning using Node.js filesystem APIs
 * - Plugin validation and structure checking
 * - Graceful handling of malformed plugins with detailed error messages
 * - Support for both development and production environments
 * - Hot module replacement support in development
 * - Caching for improved performance
 */

import type {
  CalculatorPlugin,
  PluginLoadResult,
  PluginDiscoveryConfig,
  PluginDiscoveryResult,
  PluginLoadError,
  PluginValidationError
} from '../types/calculator-plugin.js';

import type { CalculatorConfig } from '../types/calculator.js';

// ============================================================================
// Discovery Configuration
// ============================================================================

const DEFAULT_DISCOVERY_CONFIG: PluginDiscoveryConfig = {
  baseDirectory: 'src/calculators',
  includePatterns: ['**/index.ts', '**/config.json', '**/calculator.ts'],
  excludePatterns: ['**/_template/**', '**/node_modules/**', '**/__tests__/**', '**/*.test.*', '**/*.spec.*'],
  recursive: true,
  maxDepth: 3,
  followSymlinks: false,
  loadTimeout: 30000, // 30 seconds
  hotReload: false, // Will be enabled in development
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100
  }
};

// ============================================================================
// Plugin Discovery Cache
// ============================================================================

interface CacheEntry {
  result: PluginLoadResult;
  timestamp: number;
  path: string;
}

class DiscoveryCache {
  private cache = new Map<string, CacheEntry>();
  private config: PluginDiscoveryConfig['cache'];

  constructor(config: PluginDiscoveryConfig['cache']) {
    this.config = config;
  }

  get(path: string): PluginLoadResult | null {
    if (!this.config.enabled) return null;

    const entry = this.cache.get(path);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.config.ttl) {
      this.cache.delete(path);
      return null;
    }

    return entry.result;
  }

  set(path: string, result: PluginLoadResult): void {
    if (!this.config.enabled) return;

    // Enforce cache size limit
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(path, {
      result,
      timestamp: Date.now(),
      path
    });
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      enabled: this.config.enabled,
      ttl: this.config.ttl
    };
  }
}

// ============================================================================
// File System Utilities
// ============================================================================

class FileSystemUtils {
  /**
   * Check if we're running in Node.js environment (build-time)
   */
  static isNodeEnvironment(): boolean {
    return typeof process !== 'undefined' && process.versions && process.versions.node;
  }

  /**
   * Get filesystem module (only available in Node.js)
   */
  static async getFileSystem() {
    if (!this.isNodeEnvironment()) {
      throw new Error('Filesystem operations are only available in Node.js environment');
    }

    const fs = await import('fs/promises');
    const path = await import('path');
    return { fs, path };
  }

  /**
   * Check if a path exists
   */
  static async pathExists(filePath: string): Promise<boolean> {
    try {
      const { fs } = await this.getFileSystem();
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read directory contents
   */
  static async readDirectory(dirPath: string): Promise<string[]> {
    try {
      const { fs } = await this.getFileSystem();
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
    } catch (error) {
      console.warn(`Failed to read directory ${dirPath}:`, error);
      return [];
    }
  }

  /**
   * Read file contents
   */
  static async readFile(filePath: string): Promise<string> {
    const { fs } = await this.getFileSystem();
    return fs.readFile(filePath, 'utf-8');
  }

  /**
   * Check if file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      const { fs } = await this.getFileSystem();
      const stat = await fs.stat(filePath);
      return stat.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Join path components
   */
  static async joinPath(...components: string[]): Promise<string> {
    const { path } = await this.getFileSystem();
    return path.join(...components);
  }

  /**
   * Resolve absolute path
   */
  static async resolvePath(relativePath: string): Promise<string> {
    const { path } = await this.getFileSystem();
    return path.resolve(relativePath);
  }
}

// ============================================================================
// Plugin Validation Utilities
// ============================================================================

class PluginValidator {
  private static readonly REQUIRED_FILES = ['config.json', 'calculator.ts'];
  private static readonly OPTIONAL_FILES = ['index.ts', 'visualization.json', 'README.md'];

  /**
   * Validate plugin directory structure
   */
  static async validateDirectoryStructure(dirPath: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check if directory exists
      if (!(await FileSystemUtils.pathExists(dirPath))) {
        errors.push(`Directory does not exist: ${dirPath}`);
        return { valid: false, errors };
      }

      // Check required files
      for (const requiredFile of this.REQUIRED_FILES) {
        const filePath = await FileSystemUtils.joinPath(dirPath, requiredFile);
        if (!(await FileSystemUtils.fileExists(filePath))) {
          errors.push(`Required file missing: ${requiredFile}`);
        }
      }

      // Validate config.json structure
      const configPath = await FileSystemUtils.joinPath(dirPath, 'config.json');
      if (await FileSystemUtils.fileExists(configPath)) {
        try {
          const configContent = await FileSystemUtils.readFile(configPath);
          const config = JSON.parse(configContent) as CalculatorConfig;
          
          const configValidation = this.validateConfig(config);
          if (!configValidation.valid) {
            errors.push(...configValidation.errors.map(err => `Config validation: ${err}`));
          }
        } catch (error) {
          errors.push(`Invalid config.json: ${error.message}`);
        }
      }

      // Check calculator.ts exists and is readable
      const calculatorPath = await FileSystemUtils.joinPath(dirPath, 'calculator.ts');
      if (await FileSystemUtils.fileExists(calculatorPath)) {
        try {
          await FileSystemUtils.readFile(calculatorPath);
        } catch (error) {
          errors.push(`Cannot read calculator.ts: ${error.message}`);
        }
      }

    } catch (error) {
      errors.push(`Directory validation failed: ${error.message}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate calculator configuration
   */
  static validateConfig(config: CalculatorConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!config.id) errors.push('Missing required field: id');
    if (!config.name) errors.push('Missing required field: name');
    if (!config.description) errors.push('Missing required field: description');
    if (!config.category) errors.push('Missing required field: category');
    if (!config.version) errors.push('Missing required field: version');
    if (!config.status) errors.push('Missing required field: status');

    // Validate ID format
    if (config.id && !/^[a-z0-9-]+$/.test(config.id)) {
      errors.push('ID must contain only lowercase letters, numbers, and hyphens');
    }

    // Validate version format (semantic versioning)
    if (config.version && !/^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?(\+[a-zA-Z0-9-]+)?$/.test(config.version)) {
      errors.push('Version must follow semantic versioning format (x.y.z)');
    }

    // Validate fields array
    if (!config.fields || !Array.isArray(config.fields) || config.fields.length === 0) {
      errors.push('At least one input field must be defined');
    }

    // Validate calculation configuration
    if (!config.calculation?.functionName) {
      errors.push('Calculation function name is required');
    }

    // Validate medical information
    if (!config.medical?.specialty || !Array.isArray(config.medical.specialty) || config.medical.specialty.length === 0) {
      errors.push('At least one medical specialty must be specified');
    }

    if (!config.medical?.evidenceLevel) {
      errors.push('Evidence level is required');
    }

    // Validate metadata
    if (!config.metadata?.author) {
      errors.push('Author is required in metadata');
    }

    if (!config.metadata?.lastUpdated) {
      errors.push('Last updated date is required in metadata');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate plugin metadata for namespace and ID requirements
   */
  static validatePluginMetadata(metadata: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!metadata.id) errors.push('Plugin metadata missing: id');
    if (!metadata.namespace) errors.push('Plugin metadata missing: namespace');
    if (!metadata.version) errors.push('Plugin metadata missing: version');
    if (!metadata.name) errors.push('Plugin metadata missing: name');
    if (!metadata.description) errors.push('Plugin metadata missing: description');
    if (!metadata.author) errors.push('Plugin metadata missing: author');

    // Validate namespace format
    if (metadata.namespace && !/^[a-z0-9-]+$/.test(metadata.namespace)) {
      errors.push('Namespace must contain only lowercase letters, numbers, and hyphens');
    }

    // Validate dependencies format
    if (metadata.dependencies && !Array.isArray(metadata.dependencies)) {
      errors.push('Dependencies must be an array');
    }

    // Validate conflicts format
    if (metadata.conflicts && !Array.isArray(metadata.conflicts)) {
      errors.push('Conflicts must be an array');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// ============================================================================
// Main Calculator Discovery Class
// ============================================================================

export class CalculatorDiscovery {
  private config: PluginDiscoveryConfig;
  private cache: DiscoveryCache;
  private isInitialized = false;

  constructor(config: Partial<PluginDiscoveryConfig> = {}) {
    this.config = { ...DEFAULT_DISCOVERY_CONFIG, ...config };
    this.cache = new DiscoveryCache(this.config.cache);

    // Enable hot reload in development
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      this.config.hotReload = true;
    }
  }

  /**
   * Initialize the discovery system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🔍 Initializing Calculator Plugin Discovery...');
    
    // Validate base directory exists
    const baseDir = await FileSystemUtils.resolvePath(this.config.baseDirectory);
    if (!(await FileSystemUtils.pathExists(baseDir))) {
      throw new Error(`Base directory does not exist: ${baseDir}`);
    }

    this.isInitialized = true;
    console.log(`✅ Calculator Plugin Discovery initialized (base: ${baseDir})`);
  }

  /**
   * Discover all calculator plugins
   */
  async discoverCalculators(): Promise<PluginDiscoveryResult> {
    await this.initialize();

    const startTime = performance.now();
    const discovered: PluginLoadResult[] = [];
    const failed: PluginLoadResult[] = [];
    const warnings: string[] = [];

    try {
      console.log('🔍 Scanning for calculator plugins...');

      // Get all calculator directories
      const calculatorDirs = await this.scanCalculatorDirectories();
      console.log(`📁 Found ${calculatorDirs.length} potential calculator directories`);

      // Load plugins in parallel with error isolation
      const loadPromises = calculatorDirs.map(async (dir) => {
        try {
          return await this.loadCalculatorFromDirectory(dir);
        } catch (error) {
          return {
            success: false,
            error: `Failed to load calculator from ${dir}: ${error.message}`,
            errorDetails: {
              code: 'LOAD_ERROR',
              stack: error.stack,
              context: { directory: dir }
            }
          } as PluginLoadResult;
        }
      });

      const loadResults = await Promise.allSettled(loadPromises);

      // Process results
      loadResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const loadResult = result.value;
          if (loadResult.success) {
            discovered.push(loadResult);
          } else {
            failed.push(loadResult);
          }
        } else {
          failed.push({
            success: false,
            error: `Promise rejected for directory ${calculatorDirs[index]}: ${result.reason}`,
            errorDetails: {
              code: 'PROMISE_REJECTED',
              context: { directory: calculatorDirs[index] }
            }
          });
        }
      });

      const scanTime = performance.now() - startTime;

      console.log(`✅ Discovery complete: ${discovered.length} successful, ${failed.length} failed (${scanTime.toFixed(2)}ms)`);

      return {
        discovered,
        failed,
        stats: {
          totalScanned: calculatorDirs.length,
          totalDiscovered: discovered.length,
          totalFailed: failed.length,
          scanTime,
          loadTime: scanTime // For now, same as scan time
        },
        warnings
      };

    } catch (error) {
      console.error('❌ Calculator discovery failed:', error);
      
      return {
        discovered: [],
        failed: [{
          success: false,
          error: `Discovery failed: ${error.message}`,
          errorDetails: {
            code: 'DISCOVERY_FAILED',
            stack: error.stack
          }
        }],
        stats: {
          totalScanned: 0,
          totalDiscovered: 0,
          totalFailed: 1,
          scanTime: performance.now() - startTime,
          loadTime: 0
        },
        warnings: []
      };
    }
  }

  /**
   * Load a calculator plugin from a directory
   */
  async loadCalculatorFromDirectory(dirPath: string): Promise<PluginLoadResult> {
    const startTime = performance.now();

    try {
      // Check cache first
      const cachedResult = this.cache.get(dirPath);
      if (cachedResult) {
        console.log(`📦 Using cached result for ${dirPath}`);
        return cachedResult;
      }

      console.log(`🔄 Loading plugin from ${dirPath}...`);

      // Validate directory structure
      const validation = await PluginValidator.validateDirectoryStructure(dirPath);
      if (!validation.valid) {
        const result: PluginLoadResult = {
          success: false,
          error: `Invalid directory structure: ${validation.errors.join(', ')}`,
          errorDetails: {
            code: 'INVALID_STRUCTURE',
            context: { directory: dirPath, errors: validation.errors }
          },
          loadTime: performance.now() - startTime
        };
        
        this.cache.set(dirPath, result);
        return result;
      }

      // Load configuration
      const configPath = await FileSystemUtils.joinPath(dirPath, 'config.json');
      const configContent = await FileSystemUtils.readFile(configPath);
      const config = JSON.parse(configContent) as CalculatorConfig;

      // Determine namespace from directory structure
      const namespace = await this.determineNamespace(dirPath);

      // Create plugin metadata
      const metadata = {
        id: config.id,
        namespace,
        version: config.version,
        name: config.name,
        description: config.description,
        author: config.metadata.author,
        license: 'MIT', // Default license
        dependencies: [], // Will be populated from config if available
        conflicts: [], // Will be populated from config if available
        tags: config.metadata.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: config.metadata.lastUpdated
      };

      // Validate plugin metadata
      const metadataValidation = PluginValidator.validatePluginMetadata(metadata);
      if (!metadataValidation.valid) {
        const result: PluginLoadResult = {
          success: false,
          error: `Invalid plugin metadata: ${metadataValidation.errors.join(', ')}`,
          errorDetails: {
            code: 'INVALID_METADATA',
            context: { directory: dirPath, errors: metadataValidation.errors }
          },
          loadTime: performance.now() - startTime
        };
        
        this.cache.set(dirPath, result);
        return result;
      }

      // Dynamic import of the calculator module
      const calculatorModulePath = await this.resolveCalculatorModule(dirPath);
      
      // In build-time environment, we create a plugin descriptor rather than loading the actual module
      // The actual module loading will happen at runtime when needed
      const plugin: CalculatorPlugin = await this.createPluginDescriptor(
        metadata,
        config,
        calculatorModulePath,
        dirPath
      );

      const result: PluginLoadResult = {
        success: true,
        plugin,
        loadTime: performance.now() - startTime
      };

      // Cache successful result
      this.cache.set(dirPath, result);

      console.log(`✅ Successfully loaded plugin: ${namespace}.${config.id}`);
      return result;

    } catch (error) {
      const result: PluginLoadResult = {
        success: false,
        error: `Failed to load plugin from ${dirPath}: ${error.message}`,
        errorDetails: {
          code: 'LOAD_ERROR',
          stack: error.stack,
          context: { directory: dirPath }
        },
        loadTime: performance.now() - startTime
      };

      this.cache.set(dirPath, result);
      return result;
    }
  }

  /**
   * Scan for calculator directories using Node.js filesystem APIs
   */
  private async scanCalculatorDirectories(): Promise<string[]> {
    const directories: string[] = [];
    const baseDir = await FileSystemUtils.resolvePath(this.config.baseDirectory);

    try {
      const entries = await FileSystemUtils.readDirectory(baseDir);

      for (const entry of entries) {
        // Skip template and test directories
        if (entry.startsWith('_') || entry.includes('test') || entry.includes('spec')) {
          continue;
        }

        const dirPath = await FileSystemUtils.joinPath(baseDir, entry);
        
        // Validate directory structure
        const validation = await PluginValidator.validateDirectoryStructure(dirPath);
        if (validation.valid) {
          directories.push(dirPath);
        } else {
          console.warn(`⚠️ Skipping invalid directory ${entry}:`, validation.errors);
        }
      }

    } catch (error) {
      console.error('Failed to scan calculator directories:', error);
    }

    return directories;
  }

  /**
   * Determine namespace from directory path
   */
  private async determineNamespace(dirPath: string): Promise<string> {
    const { path } = await FileSystemUtils.getFileSystem();
    const dirName = path.basename(dirPath);
    
    // Check if directory is in a namespace subdirectory
    const parentDir = path.dirname(dirPath);
    const parentName = path.basename(parentDir);
    
    // If parent is not the base calculators directory, use it as namespace
    const baseDir = await FileSystemUtils.resolvePath(this.config.baseDirectory);
    if (parentDir !== baseDir && parentName !== 'calculators') {
      return parentName;
    }
    
    // Default namespace based on calculator category or use 'general'
    try {
      const configPath = await FileSystemUtils.joinPath(dirPath, 'config.json');
      const configContent = await FileSystemUtils.readFile(configPath);
      const config = JSON.parse(configContent) as CalculatorConfig;
      return config.category || 'general';
    } catch {
      return 'general';
    }
  }

  /**
   * Resolve calculator module path
   */
  private async resolveCalculatorModule(dirPath: string): Promise<string> {
    // Check for index.ts first, then calculator.ts
    const possibleFiles = ['index.ts', 'calculator.ts'];
    
    for (const file of possibleFiles) {
      const filePath = await FileSystemUtils.joinPath(dirPath, file);
      if (await FileSystemUtils.fileExists(filePath)) {
        return filePath;
      }
    }
    
    throw new Error(`No calculator module found in ${dirPath}`);
  }

  /**
   * Create plugin descriptor (for build-time discovery)
   */
  private async createPluginDescriptor(
    metadata: any,
    config: CalculatorConfig,
    modulePath: string,
    dirPath: string
  ): Promise<CalculatorPlugin> {
    // Create a plugin descriptor that can be used for registration
    // The actual implementation will be loaded dynamically when needed
    
    const plugin: CalculatorPlugin = {
      metadata,
      config,
      calculator: {
        calculate: () => {
          throw new Error('Calculator implementation not loaded. Use dynamic import.');
        },
        validate: () => {
          throw new Error('Calculator implementation not loaded. Use dynamic import.');
        },
        formatResult: () => {
          throw new Error('Calculator implementation not loaded. Use dynamic import.');
        }
      },
      
      // Lifecycle hooks
      async install() {
        console.log(`📦 Installing plugin: ${metadata.namespace}.${metadata.id}`);
        
        // Load the actual calculator implementation
        try {
          const calculatorModule = await this.loadCalculatorImplementation(modulePath);
          if (calculatorModule) {
            // Replace placeholder functions with actual implementation
            Object.assign(plugin.calculator, calculatorModule);
            console.log(`✅ Calculator implementation loaded for ${metadata.namespace}.${metadata.id}`);
          }
        } catch (error) {
          console.error(`❌ Failed to load calculator implementation for ${metadata.namespace}.${metadata.id}:`, error);
          throw error;
        }
      },
      
      async uninstall() {
        console.log(`🗑️ Uninstalling plugin: ${metadata.namespace}.${metadata.id}`);
        
        // Clean up any resources
        try {
          // Reset calculator functions to prevent memory leaks
          plugin.calculator = {
            calculate: () => { throw new Error('Plugin uninstalled'); },
            validate: () => { throw new Error('Plugin uninstalled'); },
            formatResult: () => { throw new Error('Plugin uninstalled'); }
          };
          
          console.log(`✅ Plugin ${metadata.namespace}.${metadata.id} uninstalled successfully`);
        } catch (error) {
          console.error(`❌ Error during plugin uninstall:`, error);
          throw error;
        }
      },
      
      async validate() {
        // Validate plugin configuration and dependencies
        const configValidation = PluginValidator.validateConfig(config);
        const metadataValidation = PluginValidator.validatePluginMetadata(metadata);
        
        if (!configValidation.valid) {
          console.warn(`Config validation failed for ${metadata.namespace}.${metadata.id}:`, configValidation.errors);
        }
        
        if (!metadataValidation.valid) {
          console.warn(`Metadata validation failed for ${metadata.namespace}.${metadata.id}:`, metadataValidation.errors);
        }
        
        return configValidation.valid && metadataValidation.valid;
      },
      
      async checkCompatibility() {
        const issues = [];
        
        // Check if required files exist
        try {
          if (!(await FileSystemUtils.fileExists(modulePath))) {
            issues.push({
              severity: 'error' as const,
              category: 'configuration' as const,
              message: `Calculator module not found: ${modulePath}`,
              details: { modulePath },
              resolution: 'Ensure calculator.ts or index.ts exists in the plugin directory'
            });
          }
          
          // Check if config is valid
          const configValidation = PluginValidator.validateConfig(config);
          if (!configValidation.valid) {
            issues.push(...configValidation.errors.map(error => ({
              severity: 'error' as const,
              category: 'configuration' as const,
              message: error,
              details: { config },
              resolution: 'Fix configuration errors in config.json'
            })));
          }
          
        } catch (error) {
          issues.push({
            severity: 'error' as const,
            category: 'api' as const,
            message: `Compatibility check failed: ${error.message}`,
            details: { error: error.message },
            resolution: 'Check plugin structure and dependencies'
          });
        }
        
        return {
          compatible: issues.filter(issue => issue.severity === 'error').length === 0,
          issues
        };
      }
    };

    // Add module path for dynamic loading
    (plugin as any).__modulePath = modulePath;
    (plugin as any).__dirPath = dirPath;

    return plugin;
  }

  /**
   * Load calculator implementation dynamically
   */
  private async loadCalculatorImplementation(modulePath: string): Promise<any> {
    try {
      // Convert absolute path to relative import path
      const relativePath = modulePath.replace(process.cwd(), '').replace(/\\/g, '/');
      const importPath = relativePath.startsWith('/') ? `.${relativePath}` : `./${relativePath}`;
      
      console.log(`🔄 Loading calculator implementation from ${importPath}...`);
      
      // Dynamic import of the calculator module
      const module = await import(importPath);
      
      // Extract calculator functions
      const calculator = {
        calculate: module.calculate || module.default?.calculate,
        validate: module.validate || module.default?.validate,
        formatResult: module.formatResult || module.default?.formatResult
      };
      
      // Validate that required functions exist
      if (!calculator.calculate) {
        throw new Error('Calculator module must export a calculate function');
      }
      
      if (!calculator.validate) {
        // Provide default validation if not present
        calculator.validate = () => ({ isValid: true, errors: [] });
      }
      
      if (!calculator.formatResult) {
        // Provide default formatting if not present
        calculator.formatResult = (result, locale) => ({
          displayValue: `${result.primaryValue} ${result.primaryUnit || ''}`,
          description: result.interpretation?.[locale] || result.interpretation?.['zh-TW'] || '',
          recommendations: result.recommendations?.map(rec => rec[locale] || rec['zh-TW']) || []
        });
      }
      
      return calculator;
      
    } catch (error) {
      console.error(`Failed to load calculator implementation from ${modulePath}:`, error);
      throw new Error(`Failed to load calculator implementation: ${error.message}`);
    }
  }

  /**
   * Clear discovery cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Discovery cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Get discovery configuration
   */
  getConfig(): PluginDiscoveryConfig {
    return { ...this.config };
  }

  /**
   * Update discovery configuration
   */
  updateConfig(newConfig: Partial<PluginDiscoveryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update cache configuration
    if (newConfig.cache) {
      this.cache = new DiscoveryCache({ ...this.config.cache, ...newConfig.cache });
    }
    
    console.log('⚙️ Discovery configuration updated');
  }

  /**
   * Load a single plugin by ID (runtime loading)
   */
  async loadPluginById(pluginId: string, namespace?: string): Promise<PluginLoadResult> {
    await this.initialize();

    try {
      // If namespace is provided, look in namespace directory
      let searchPaths: string[] = [];
      
      if (namespace) {
        const namespacePath = await FileSystemUtils.joinPath(
          await FileSystemUtils.resolvePath(this.config.baseDirectory),
          namespace,
          pluginId
        );
        searchPaths.push(namespacePath);
      }
      
      // Also search in root calculators directory
      const rootPath = await FileSystemUtils.joinPath(
        await FileSystemUtils.resolvePath(this.config.baseDirectory),
        pluginId
      );
      searchPaths.push(rootPath);

      // Try each search path
      for (const searchPath of searchPaths) {
        if (await FileSystemUtils.pathExists(searchPath)) {
          console.log(`🎯 Found plugin ${pluginId} at ${searchPath}`);
          return await this.loadCalculatorFromDirectory(searchPath);
        }
      }

      // Plugin not found
      return {
        success: false,
        error: `Plugin not found: ${pluginId}${namespace ? ` in namespace ${namespace}` : ''}`,
        errorDetails: {
          code: 'PLUGIN_NOT_FOUND',
          context: { pluginId, namespace, searchPaths }
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to load plugin ${pluginId}: ${error.message}`,
        errorDetails: {
          code: 'LOAD_ERROR',
          stack: error.stack,
          context: { pluginId, namespace }
        }
      };
    }
  }

  /**
   * Discover plugins in a specific namespace
   */
  async discoverPluginsInNamespace(namespace: string): Promise<PluginDiscoveryResult> {
    await this.initialize();

    const startTime = performance.now();
    const discovered: PluginLoadResult[] = [];
    const failed: PluginLoadResult[] = [];
    const warnings: string[] = [];

    try {
      const namespacePath = await FileSystemUtils.joinPath(
        await FileSystemUtils.resolvePath(this.config.baseDirectory),
        namespace
      );

      if (!(await FileSystemUtils.pathExists(namespacePath))) {
        warnings.push(`Namespace directory not found: ${namespace}`);
        return {
          discovered: [],
          failed: [],
          stats: {
            totalScanned: 0,
            totalDiscovered: 0,
            totalFailed: 0,
            scanTime: performance.now() - startTime,
            loadTime: 0
          },
          warnings
        };
      }

      const entries = await FileSystemUtils.readDirectory(namespacePath);
      console.log(`📁 Found ${entries.length} potential plugins in namespace ${namespace}`);

      // Load plugins in parallel
      const loadPromises = entries.map(async (entry) => {
        const pluginPath = await FileSystemUtils.joinPath(namespacePath, entry);
        try {
          return await this.loadCalculatorFromDirectory(pluginPath);
        } catch (error) {
          return {
            success: false,
            error: `Failed to load plugin from ${pluginPath}: ${error.message}`,
            errorDetails: {
              code: 'LOAD_ERROR',
              stack: error.stack,
              context: { directory: pluginPath, namespace }
            }
          } as PluginLoadResult;
        }
      });

      const loadResults = await Promise.allSettled(loadPromises);

      // Process results
      loadResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          const loadResult = result.value;
          if (loadResult.success) {
            discovered.push(loadResult);
          } else {
            failed.push(loadResult);
          }
        } else {
          failed.push({
            success: false,
            error: `Promise rejected: ${result.reason}`,
            errorDetails: {
              code: 'PROMISE_REJECTED',
              context: { namespace }
            }
          });
        }
      });

      const scanTime = performance.now() - startTime;

      console.log(`✅ Namespace ${namespace} discovery complete: ${discovered.length} successful, ${failed.length} failed`);

      return {
        discovered,
        failed,
        stats: {
          totalScanned: entries.length,
          totalDiscovered: discovered.length,
          totalFailed: failed.length,
          scanTime,
          loadTime: scanTime
        },
        warnings
      };

    } catch (error) {
      console.error(`❌ Namespace ${namespace} discovery failed:`, error);
      
      return {
        discovered: [],
        failed: [{
          success: false,
          error: `Namespace discovery failed: ${error.message}`,
          errorDetails: {
            code: 'NAMESPACE_DISCOVERY_FAILED',
            stack: error.stack,
            context: { namespace }
          }
        }],
        stats: {
          totalScanned: 0,
          totalDiscovered: 0,
          totalFailed: 1,
          scanTime: performance.now() - startTime,
          loadTime: 0
        },
        warnings: []
      };
    }
  }

  /**
   * Get available namespaces
   */
  async getAvailableNamespaces(): Promise<string[]> {
    await this.initialize();

    try {
      const baseDir = await FileSystemUtils.resolvePath(this.config.baseDirectory);
      const entries = await FileSystemUtils.readDirectory(baseDir);
      
      const namespaces: string[] = [];
      
      for (const entry of entries) {
        if (entry.startsWith('_')) continue; // Skip template directories
        
        const entryPath = await FileSystemUtils.joinPath(baseDir, entry);
        
        // Check if this is a namespace directory (contains subdirectories with calculators)
        const subEntries = await FileSystemUtils.readDirectory(entryPath);
        const hasCalculators = await Promise.all(
          subEntries.map(async (subEntry) => {
            const subPath = await FileSystemUtils.joinPath(entryPath, subEntry);
            const validation = await PluginValidator.validateDirectoryStructure(subPath);
            return validation.valid;
          })
        );
        
        if (hasCalculators.some(Boolean)) {
          namespaces.push(entry);
        }
      }
      
      return namespaces;
      
    } catch (error) {
      console.error('Failed to get available namespaces:', error);
      return [];
    }
  }

  /**
   * Watch for file changes (development mode)
   */
  async watchForChanges(callback: (changedPath: string) => void): Promise<void> {
    if (!this.config.hotReload || !FileSystemUtils.isNodeEnvironment()) {
      return;
    }

    try {
      const { fs } = await FileSystemUtils.getFileSystem();
      const baseDir = await FileSystemUtils.resolvePath(this.config.baseDirectory);
      
      console.log(`👀 Watching for changes in ${baseDir}...`);
      
      const watcher = fs.watch(baseDir, { recursive: true }, (eventType, filename) => {
        if (filename && (filename.endsWith('.ts') || filename.endsWith('.json'))) {
          console.log(`📝 File changed: ${filename}`);
          this.clearCache(); // Clear cache on file changes
          callback(filename);
        }
      });

      // Handle process termination
      process.on('SIGINT', () => {
        watcher.close();
        console.log('👋 File watcher stopped');
      });

    } catch (error) {
      console.warn('⚠️ Failed to set up file watcher:', error);
    }
  }
}

// Export singleton instance for convenience
export const calculatorDiscovery = new CalculatorDiscovery();

// Export utilities for testing and advanced usage
export { PluginValidator, FileSystemUtils };