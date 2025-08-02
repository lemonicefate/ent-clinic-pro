/**
 * Plugin-Based Calculator Registry System
 * 
 * This is the new plugin-aware registry system that replaces the centralized
 * ModularCalculatorLoader with a decentralized, self-registering plugin architecture.
 * 
 * Key Features:
 * - Plugin registration with version-based conflict resolution
 * - Namespace isolation for calculator plugins
 * - Plugin validation and lifecycle management
 * - Error isolation and comprehensive logging
 * - Performance monitoring and health checks
 */

import type {
  CalculatorPlugin,
  PluginRegistryEntry,
  PluginStatus,
  PluginStats,
  PluginSearchOptions,
  PluginSearchResult,
  PluginEventEmitter,
  PluginEventListener,
  PluginLifecycleEvent,
  PluginEventData,
  PluginError,
  PluginConflictError,
  PluginValidationError,
  DependencyError,
  VersionConflictError,
  PluginVersion,
  PluginHealthCheck,
  HealthIssue,
  SystemPerformanceMetrics,
  PluginPerformanceMetrics
} from '../types/calculator-plugin.js';

// ============================================================================
// Plugin Event System
// ============================================================================

class PluginEventEmitterImpl implements PluginEventEmitter {
  private listeners = new Map<PluginLifecycleEvent, Set<PluginEventListener>>();

  on(event: PluginLifecycleEvent, listener: PluginEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: PluginLifecycleEvent, listener: PluginEventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit(event: PluginLifecycleEvent, data: Omit<PluginEventData, 'event' | 'timestamp'>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const eventData: PluginEventData = {
        ...data,
        event,
        timestamp: new Date()
      };

      eventListeners.forEach(async (listener) => {
        try {
          await listener(eventData);
        } catch (error) {
          console.error(`Error in plugin event listener for ${event}:`, error);
        }
      });
    }
  }

  removeAllListeners(event?: PluginLifecycleEvent): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  getListenerCount(event?: PluginLifecycleEvent): number {
    if (event) {
      return this.listeners.get(event)?.size || 0;
    }
    return Array.from(this.listeners.values()).reduce((total, set) => total + set.size, 0);
  }
}

// ============================================================================
// Version Management Utilities
// ============================================================================

class VersionManager {
  /**
   * Parse semantic version string into components
   */
  static parseVersion(versionString: string): PluginVersion {
    const versionRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9-]+))?(?:\+([a-zA-Z0-9-]+))?$/;
    const match = versionString.match(versionRegex);

    if (!match) {
      throw new Error(`Invalid version format: ${versionString}`);
    }

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4],
      build: match[5],
      raw: versionString
    };
  }

  /**
   * Compare two versions (-1: v1 < v2, 0: v1 = v2, 1: v1 > v2)
   */
  static compareVersions(v1: PluginVersion, v2: PluginVersion): number {
    // Compare major.minor.patch
    if (v1.major !== v2.major) return v1.major - v2.major;
    if (v1.minor !== v2.minor) return v1.minor - v2.minor;
    if (v1.patch !== v2.patch) return v1.patch - v2.patch;

    // Handle prerelease versions
    if (v1.prerelease && !v2.prerelease) return -1;
    if (!v1.prerelease && v2.prerelease) return 1;
    if (v1.prerelease && v2.prerelease) {
      return v1.prerelease.localeCompare(v2.prerelease);
    }

    return 0;
  }

  /**
   * Check if version satisfies a range requirement
   */
  static satisfiesRange(version: PluginVersion, range: string): boolean {
    // Simple implementation - can be enhanced with full semver range support
    if (range.startsWith('>=')) {
      const requiredVersion = this.parseVersion(range.substring(2));
      return this.compareVersions(version, requiredVersion) >= 0;
    }
    if (range.startsWith('>')) {
      const requiredVersion = this.parseVersion(range.substring(1));
      return this.compareVersions(version, requiredVersion) > 0;
    }
    if (range.startsWith('<=')) {
      const requiredVersion = this.parseVersion(range.substring(2));
      return this.compareVersions(version, requiredVersion) <= 0;
    }
    if (range.startsWith('<')) {
      const requiredVersion = this.parseVersion(range.substring(1));
      return this.compareVersions(version, requiredVersion) < 0;
    }
    if (range.startsWith('=')) {
      const requiredVersion = this.parseVersion(range.substring(1));
      return this.compareVersions(version, requiredVersion) === 0;
    }

    // Exact match by default
    const requiredVersion = this.parseVersion(range);
    return this.compareVersions(version, requiredVersion) === 0;
  }
}

// ============================================================================
// Main Plugin Calculator Registry
// ============================================================================

export class PluginCalculatorRegistry {
  private static instance: PluginCalculatorRegistry | null = null;
  
  private plugins = new Map<string, PluginRegistryEntry>();
  private namespaces = new Map<string, Set<string>>();
  private loadingPromises = new Map<string, Promise<void>>();
  private eventEmitter = new PluginEventEmitterImpl();
  private performanceMetrics = new Map<string, PluginPerformanceMetrics>();
  private healthChecks = new Map<string, PluginHealthCheck>();
  
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Singleton pattern - get registry instance
   */
  static getInstance(): PluginCalculatorRegistry {
    if (!this.instance) {
      this.instance = new PluginCalculatorRegistry();
    }
    return this.instance;
  }

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    // Set up error handling for unhandled plugin errors
    this.eventEmitter.on('error', (eventData) => {
      console.error('Plugin error:', eventData.error);
      this.handlePluginError(eventData.plugin, eventData.error!);
    });
  }

  /**
   * Initialize the registry
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
      console.log('🚀 Initializing Plugin Calculator Registry...');
      
      // Clear existing state
      this.plugins.clear();
      this.namespaces.clear();
      this.loadingPromises.clear();
      this.performanceMetrics.clear();
      this.healthChecks.clear();
      
      this.initialized = true;
      
      const initTime = performance.now() - startTime;
      console.log(`✅ Plugin Calculator Registry initialized in ${initTime.toFixed(2)}ms`);
      
    } catch (error) {
      console.error('❌ Failed to initialize Plugin Calculator Registry:', error);
      this.initialized = false;
      throw error;
    }
  }

  /**
   * Register a calculator plugin with version-based conflict resolution
   */
  async register(plugin: CalculatorPlugin): Promise<void> {
    await this.initialize();
    
    const fullId = `${plugin.metadata.namespace}.${plugin.metadata.id}`;
    const startTime = performance.now();
    
    try {
      // Emit beforeLoad event
      this.eventEmitter.emit('beforeLoad', { plugin });
      
      // Check for existing plugin with same ID
      const existingEntry = this.plugins.get(fullId);
      if (existingEntry) {
        await this.handleVersionConflict(plugin, existingEntry.plugin);
      }
      
      // Emit beforeValidation event
      this.eventEmitter.emit('beforeValidation', { plugin });
      
      // Validate plugin
      const isValid = await plugin.validate();
      if (!isValid) {
        throw new PluginValidationError(
          `Plugin validation failed: ${fullId}`,
          plugin.metadata.id,
          plugin.metadata.namespace
        );
      }
      
      // Emit afterValidation event
      this.eventEmitter.emit('afterValidation', { plugin });
      
      // Validate dependencies
      await this.validateDependencies(plugin);
      
      // Check for conflicts
      await this.checkConflicts(plugin);
      
      // Emit beforeInstall event
      this.eventEmitter.emit('beforeInstall', { plugin });
      
      // Install plugin
      await plugin.install();
      
      // Emit afterInstall event
      this.eventEmitter.emit('afterInstall', { plugin });
      
      // Create registry entry
      const registryEntry: PluginRegistryEntry = {
        plugin,
        registeredAt: new Date(),
        status: 'active',
        stats: this.createInitialStats(),
        healthy: true,
        lastHealthCheck: new Date()
      };
      
      // Register plugin
      this.plugins.set(fullId, registryEntry);
      this.ensureNamespace(plugin.metadata.namespace);
      this.namespaces.get(plugin.metadata.namespace)!.add(plugin.metadata.id);
      
      // Initialize performance metrics
      this.initializePerformanceMetrics(plugin);
      
      // Emit afterLoad event
      this.eventEmitter.emit('afterLoad', { plugin });
      
      const loadTime = performance.now() - startTime;
      console.log(`✅ Registered plugin: ${fullId} (${loadTime.toFixed(2)}ms)`);
      
    } catch (error) {
      const pluginError = error instanceof PluginError ? error : 
        new PluginError(`Failed to register plugin: ${error.message}`, plugin.metadata.id, plugin.metadata.namespace);
      
      this.eventEmitter.emit('error', { plugin, error: pluginError });
      throw pluginError;
    }
  }

  /**
   * Handle version conflicts between plugins
   */
  private async handleVersionConflict(newPlugin: CalculatorPlugin, existingPlugin: CalculatorPlugin): Promise<void> {
    const newVersion = VersionManager.parseVersion(newPlugin.metadata.version);
    const existingVersion = VersionManager.parseVersion(existingPlugin.metadata.version);
    
    const comparison = VersionManager.compareVersions(newVersion, existingVersion);
    
    if (comparison <= 0) {
      throw new VersionConflictError(
        `Plugin ${newPlugin.metadata.namespace}.${newPlugin.metadata.id} version ${newPlugin.metadata.version} is not higher than existing version ${existingPlugin.metadata.version}`,
        newPlugin.metadata.id,
        newPlugin.metadata.namespace,
        newPlugin.metadata.version,
        existingPlugin.metadata.version
      );
    }
    
    // Unregister existing version
    const fullId = `${existingPlugin.metadata.namespace}.${existingPlugin.metadata.id}`;
    await this.unregister(fullId);
    
    console.log(`🔄 Upgraded plugin: ${fullId} from ${existingPlugin.metadata.version} to ${newPlugin.metadata.version}`);
  }

  /**
   * Validate plugin dependencies
   */
  private async validateDependencies(plugin: CalculatorPlugin): Promise<void> {
    const missingDependencies: string[] = [];
    
    for (const depId of plugin.metadata.dependencies) {
      if (!this.plugins.has(depId)) {
        missingDependencies.push(depId);
      }
    }
    
    if (missingDependencies.length > 0) {
      throw new DependencyError(
        `Missing dependencies for plugin ${plugin.metadata.namespace}.${plugin.metadata.id}: ${missingDependencies.join(', ')}`,
        plugin.metadata.id,
        plugin.metadata.namespace,
        missingDependencies
      );
    }
    
    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(plugin);
    if (circularDeps.length > 0) {
      throw new DependencyError(
        `Circular dependencies detected for plugin ${plugin.metadata.namespace}.${plugin.metadata.id}: ${circularDeps.join(' -> ')}`,
        plugin.metadata.id,
        plugin.metadata.namespace,
        undefined,
        circularDeps
      );
    }
  }

  /**
   * Detect circular dependencies
   */
  private detectCircularDependencies(plugin: CalculatorPlugin): string[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const fullId = `${plugin.metadata.namespace}.${plugin.metadata.id}`;
    
    const hasCycle = (pluginId: string): boolean => {
      if (recursionStack.has(pluginId)) {
        return true;
      }
      
      if (visited.has(pluginId)) {
        return false;
      }
      
      visited.add(pluginId);
      recursionStack.add(pluginId);
      
      const pluginEntry = this.plugins.get(pluginId);
      if (pluginEntry) {
        for (const depId of pluginEntry.plugin.metadata.dependencies) {
          if (hasCycle(depId)) {
            return true;
          }
        }
      }
      
      recursionStack.delete(pluginId);
      return false;
    };
    
    if (hasCycle(fullId)) {
      return Array.from(recursionStack);
    }
    
    return [];
  }

  /**
   * Check for plugin conflicts
   */
  private async checkConflicts(plugin: CalculatorPlugin): Promise<void> {
    const fullId = `${plugin.metadata.namespace}.${plugin.metadata.id}`;
    
    for (const conflictId of plugin.metadata.conflicts) {
      if (this.plugins.has(conflictId)) {
        throw new PluginConflictError(
          `Plugin ${fullId} conflicts with existing plugin ${conflictId}`,
          plugin.metadata.id,
          plugin.metadata.namespace,
          conflictId
        );
      }
    }
    
    // Check if any existing plugins conflict with this one
    for (const [existingId, entry] of this.plugins) {
      if (entry.plugin.metadata.conflicts.includes(fullId)) {
        throw new PluginConflictError(
          `Existing plugin ${existingId} conflicts with new plugin ${fullId}`,
          plugin.metadata.id,
          plugin.metadata.namespace,
          existingId
        );
      }
    }
  }

  /**
   * Unregister a plugin
   */
  async unregister(fullId: string): Promise<void> {
    const entry = this.plugins.get(fullId);
    if (!entry) {
      return;
    }
    
    const plugin = entry.plugin;
    
    try {
      // Emit beforeUninstall event
      this.eventEmitter.emit('beforeUninstall', { plugin });
      
      // Update status
      entry.status = 'unloading';
      this.eventEmitter.emit('statusChange', { 
        plugin, 
        previousStatus: 'active', 
        newStatus: 'unloading' 
      });
      
      // Uninstall plugin
      await plugin.uninstall();
      
      // Remove from registry
      this.plugins.delete(fullId);
      
      // Clean up namespace
      const namespace = plugin.metadata.namespace;
      const namespaceSet = this.namespaces.get(namespace);
      if (namespaceSet) {
        namespaceSet.delete(plugin.metadata.id);
        if (namespaceSet.size === 0) {
          this.namespaces.delete(namespace);
        }
      }
      
      // Clean up metrics and health checks
      this.performanceMetrics.delete(fullId);
      this.healthChecks.delete(fullId);
      
      // Emit afterUninstall event
      this.eventEmitter.emit('afterUninstall', { plugin });
      
      console.log(`🗑️ Unregistered plugin: ${fullId}`);
      
    } catch (error) {
      const pluginError = new PluginError(`Failed to unregister plugin: ${error.message}`, plugin.metadata.id, plugin.metadata.namespace);
      this.eventEmitter.emit('error', { plugin, error: pluginError });
      throw pluginError;
    }
  }

  /**
   * Get a plugin by full ID
   */
  get(fullId: string): CalculatorPlugin | null {
    const entry = this.plugins.get(fullId);
    return entry?.plugin || null;
  }

  /**
   * Get all plugins in a namespace
   */
  getByNamespace(namespace: string): CalculatorPlugin[] {
    const ids = this.namespaces.get(namespace) || new Set();
    return Array.from(ids)
      .map(id => this.plugins.get(`${namespace}.${id}`))
      .filter(Boolean)
      .map(entry => entry!.plugin);
  }

  /**
   * List all registered plugins
   */
  listAll(): CalculatorPlugin[] {
    return Array.from(this.plugins.values()).map(entry => entry.plugin);
  }

  /**
   * Search plugins with advanced filtering
   */
  search(options: PluginSearchOptions): PluginSearchResult {
    const startTime = performance.now();
    
    let results = Array.from(this.plugins.values());
    
    // Filter by namespace
    if (options.namespace) {
      results = results.filter(entry => entry.plugin.metadata.namespace === options.namespace);
    }
    
    // Filter by status
    if (options.status && options.status.length > 0) {
      results = results.filter(entry => options.status!.includes(entry.status));
    }
    
    // Filter by author
    if (options.author) {
      results = results.filter(entry => 
        entry.plugin.metadata.author.toLowerCase().includes(options.author!.toLowerCase())
      );
    }
    
    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      results = results.filter(entry =>
        options.tags!.some(tag => entry.plugin.metadata.tags.includes(tag))
      );
    }
    
    // Text search in name and description
    if (options.query) {
      const query = options.query.toLowerCase();
      results = results.filter(entry => {
        const plugin = entry.plugin;
        const nameMatch = Object.values(plugin.metadata.name).some(name =>
          name.toLowerCase().includes(query)
        );
        const descMatch = Object.values(plugin.metadata.description).some(desc =>
          desc.toLowerCase().includes(query)
        );
        const tagMatch = plugin.metadata.tags.some(tag =>
          tag.toLowerCase().includes(query)
        );
        
        return nameMatch || descMatch || tagMatch;
      });
    }
    
    // Version filtering
    if (options.minVersion) {
      results = results.filter(entry => {
        try {
          const pluginVersion = VersionManager.parseVersion(entry.plugin.metadata.version);
          return VersionManager.satisfiesRange(pluginVersion, `>=${options.minVersion}`);
        } catch {
          return false;
        }
      });
    }
    
    // Sort results
    if (options.sortBy) {
      results = this.sortPluginResults(results, options.sortBy, options.sortOrder || 'asc');
    }
    
    // Apply pagination
    const total = results.length;
    const offset = options.offset || 0;
    const limit = options.limit || total;
    
    results = results.slice(offset, offset + limit);
    
    const searchTime = performance.now() - startTime;
    
    return {
      plugins: results,
      total,
      searchTime,
      appliedFilters: options
    };
  }

  /**
   * Sort plugin search results
   */
  private sortPluginResults(
    results: PluginRegistryEntry[], 
    sortBy: string, 
    sortOrder: 'asc' | 'desc'
  ): PluginRegistryEntry[] {
    return results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = Object.values(a.plugin.metadata.name)[0].localeCompare(
            Object.values(b.plugin.metadata.name)[0]
          );
          break;
        case 'namespace':
          comparison = a.plugin.metadata.namespace.localeCompare(b.plugin.metadata.namespace);
          break;
        case 'version':
          try {
            const versionA = VersionManager.parseVersion(a.plugin.metadata.version);
            const versionB = VersionManager.parseVersion(b.plugin.metadata.version);
            comparison = VersionManager.compareVersions(versionA, versionB);
          } catch {
            comparison = 0;
          }
          break;
        case 'lastUsed':
          const lastUsedA = a.stats.lastUsed?.getTime() || 0;
          const lastUsedB = b.stats.lastUsed?.getTime() || 0;
          comparison = lastUsedA - lastUsedB;
          break;
        case 'popularity':
          comparison = a.stats.calculationCount - b.stats.calculationCount;
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Get system performance metrics
   */
  getSystemPerformanceMetrics(): SystemPerformanceMetrics {
    const plugins = Array.from(this.plugins.values());
    const activePlugins = plugins.filter(entry => entry.status === 'active').length;
    
    const pluginMetrics = Array.from(this.performanceMetrics.values());
    const totalMemoryUsage = pluginMetrics.reduce((sum, metrics) => sum + metrics.memoryUsage, 0);
    const averageLoadTime = pluginMetrics.length > 0 
      ? pluginMetrics.reduce((sum, metrics) => sum + metrics.loadTime, 0) / pluginMetrics.length
      : 0;
    
    const totalCalculations = pluginMetrics.reduce((sum, metrics) => sum + metrics.calculationCount, 0);
    const totalErrors = pluginMetrics.reduce((sum, metrics) => sum + (metrics.errorRate * metrics.calculationCount), 0);
    const overallErrorRate = totalCalculations > 0 ? totalErrors / totalCalculations : 0;
    
    return {
      totalPlugins: this.plugins.size,
      activePlugins,
      totalMemoryUsage,
      averageLoadTime,
      uptime: Date.now() - (this.initializationPromise ? 0 : Date.now()), // Simplified uptime
      totalCalculations,
      overallErrorRate,
      pluginMetrics,
      timestamp: new Date()
    };
  }

  /**
   * Perform health check on a plugin
   */
  async performHealthCheck(fullId: string): Promise<PluginHealthCheck> {
    const entry = this.plugins.get(fullId);
    if (!entry) {
      throw new Error(`Plugin not found: ${fullId}`);
    }
    
    const startTime = performance.now();
    const issues: HealthIssue[] = [];
    
    try {
      // Check if plugin is responsive
      const isValid = await entry.plugin.validate();
      if (!isValid) {
        issues.push({
          severity: 'critical',
          category: 'configuration',
          message: 'Plugin validation failed',
          detectedAt: new Date()
        });
      }
      
      // Check performance metrics
      const metrics = this.performanceMetrics.get(fullId);
      if (metrics) {
        if (metrics.averageCalculationTime > 5000) { // 5 seconds
          issues.push({
            severity: 'warning',
            category: 'performance',
            message: `Slow calculation time: ${metrics.averageCalculationTime}ms`,
            resolution: 'Consider optimizing calculation logic',
            detectedAt: new Date()
          });
        }
        
        if (metrics.errorRate > 0.1) { // 10% error rate
          issues.push({
            severity: 'warning',
            category: 'errors',
            message: `High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`,
            resolution: 'Review error logs and fix calculation issues',
            detectedAt: new Date()
          });
        }
        
        if (metrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
          issues.push({
            severity: 'warning',
            category: 'memory',
            message: `High memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
            resolution: 'Check for memory leaks and optimize resource usage',
            detectedAt: new Date()
          });
        }
      }
      
      const responseTime = performance.now() - startTime;
      const healthy = issues.filter(issue => issue.severity === 'critical').length === 0;
      
      const healthCheck: PluginHealthCheck = {
        pluginId: fullId,
        healthy,
        timestamp: new Date(),
        responseTime,
        issues,
        metrics: metrics ? {
          calculationCount: metrics.calculationCount,
          averageCalculationTime: metrics.averageCalculationTime,
          errorRate: metrics.errorRate,
          memoryUsage: metrics.memoryUsage
        } : undefined
      };
      
      // Update registry entry
      entry.healthy = healthy;
      entry.lastHealthCheck = new Date();
      
      // Store health check result
      this.healthChecks.set(fullId, healthCheck);
      
      return healthCheck;
      
    } catch (error) {
      const healthCheck: PluginHealthCheck = {
        pluginId: fullId,
        healthy: false,
        timestamp: new Date(),
        responseTime: performance.now() - startTime,
        issues: [{
          severity: 'critical',
          category: 'errors',
          message: `Health check failed: ${error.message}`,
          detectedAt: new Date()
        }]
      };
      
      entry.healthy = false;
      entry.lastHealthCheck = new Date();
      this.healthChecks.set(fullId, healthCheck);
      
      return healthCheck;
    }
  }

  /**
   * Get event emitter for plugin lifecycle events
   */
  getEventEmitter(): PluginEventEmitter {
    return this.eventEmitter;
  }

  /**
   * Handle plugin errors
   */
  private handlePluginError(plugin: CalculatorPlugin, error: PluginError): void {
    const fullId = `${plugin.metadata.namespace}.${plugin.metadata.id}`;
    const entry = this.plugins.get(fullId);
    
    if (entry) {
      entry.status = 'error';
      entry.healthy = false;
      entry.stats.errorCount++;
      
      this.eventEmitter.emit('statusChange', {
        plugin,
        previousStatus: 'active',
        newStatus: 'error'
      });
    }
    
    // Log error details
    console.error(`Plugin error in ${fullId}:`, {
      error: error.message,
      type: error.constructor.name,
      context: error.context
    });
  }

  /**
   * Ensure namespace exists
   */
  private ensureNamespace(namespace: string): void {
    if (!this.namespaces.has(namespace)) {
      this.namespaces.set(namespace, new Set());
    }
  }

  /**
   * Create initial plugin statistics
   */
  private createInitialStats(): PluginStats {
    return {
      loadCount: 1,
      calculationCount: 0,
      averageCalculationTime: 0,
      errorCount: 0,
      memoryUsage: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0
      }
    };
  }

  /**
   * Initialize performance metrics for a plugin
   */
  private initializePerformanceMetrics(plugin: CalculatorPlugin): void {
    const fullId = `${plugin.metadata.namespace}.${plugin.metadata.id}`;
    
    const metrics: PluginPerformanceMetrics = {
      pluginId: plugin.metadata.id,
      namespace: plugin.metadata.namespace,
      loadTime: 0,
      installTime: 0,
      averageCalculationTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      calculationCount: 0,
      errorRate: 0,
      timestamp: new Date()
    };
    
    this.performanceMetrics.set(fullId, metrics);
  }

  /**
   * Update plugin statistics after calculation
   */
  updatePluginStats(fullId: string, calculationTime: number, hasError: boolean = false): void {
    const entry = this.plugins.get(fullId);
    const metrics = this.performanceMetrics.get(fullId);
    
    if (entry) {
      entry.stats.calculationCount++;
      entry.stats.lastUsed = new Date();
      
      // Update average calculation time
      const totalTime = entry.stats.averageCalculationTime * (entry.stats.calculationCount - 1) + calculationTime;
      entry.stats.averageCalculationTime = totalTime / entry.stats.calculationCount;
      
      if (hasError) {
        entry.stats.errorCount++;
      }
    }
    
    if (metrics) {
      metrics.calculationCount++;
      metrics.timestamp = new Date();
      
      // Update average calculation time
      const totalTime = metrics.averageCalculationTime * (metrics.calculationCount - 1) + calculationTime;
      metrics.averageCalculationTime = totalTime / metrics.calculationCount;
      
      // Update error rate
      if (hasError) {
        const totalErrors = metrics.errorRate * (metrics.calculationCount - 1) + 1;
        metrics.errorRate = totalErrors / metrics.calculationCount;
      } else {
        const totalErrors = metrics.errorRate * (metrics.calculationCount - 1);
        metrics.errorRate = totalErrors / metrics.calculationCount;
      }
    }
  }

  /**
   * Get registry statistics
   */
  getRegistryStats() {
    const plugins = Array.from(this.plugins.values());
    const namespaceCount = this.namespaces.size;
    const activePlugins = plugins.filter(entry => entry.status === 'active').length;
    const errorPlugins = plugins.filter(entry => entry.status === 'error').length;
    const healthyPlugins = plugins.filter(entry => entry.healthy).length;
    
    return {
      totalPlugins: this.plugins.size,
      activePlugins,
      errorPlugins,
      healthyPlugins,
      namespaceCount,
      eventListeners: this.eventEmitter.getListenerCount(),
      initialized: this.initialized
    };
  }
}

// Export singleton instance
export const pluginCalculatorRegistry = PluginCalculatorRegistry.getInstance();

// Export for testing and advanced usage
export { PluginCalculatorRegistry, VersionManager };