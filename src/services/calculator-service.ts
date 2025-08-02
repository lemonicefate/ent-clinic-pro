/**
 * Calculator Service
 * 
 * Service layer for loading calculator configurations and implementations.
 * This service abstracts the plugin loading logic and provides a clean API
 * for the PluginCalculator component.
 */

import type { SupportedLocale } from '../types/calculator.js';
import { DynamicCalculatorLoader } from '../utils/dynamic-calculator-loader.js';
import type { CalculatorPlugin } from '../types/calculator-plugin.js';

export interface CalculatorConfig {
  id: string;
  name: string;
  description: string;
  fields: Array<{
    id: string;
    type: 'number' | 'select' | 'checkbox' | 'radio' | 'radio-cards' | 'text';
    label: string | Record<SupportedLocale, string>;
    unit?: string;
    min?: number;
    max?: number;
    step?: number;
    required?: boolean;
    defaultValue?: any;
    placeholder?: string;
    options?: Array<{
      value: string;
      label: string | Record<SupportedLocale, string>;
      description?: string;
      subtitle?: string;
    }>;
  }>;
}

export interface VisualizationConfig {
  sections: Array<{
    title: string;
    cards: Array<{
      type: 'primary' | 'secondary' | 'info' | 'warning' | 'error';
      title: string;
      value: string | number;
      unit?: string;
      color?: string;
      description?: string;
      icon?: string;
    }>;
    layout?: 'grid' | 'list' | 'inline';
    columns?: number;
  }>;
  recommendations?: Array<{
    text: string;
    type: 'info' | 'warning' | 'success' | 'error';
  }>;
  notes?: string[];
}

export interface CalculatorData {
  config: CalculatorConfig;
  visualization?: VisualizationConfig;
  plugin: CalculatorPlugin;
}

export class CalculatorService {
  private static instance: CalculatorService | null = null;
  private loader: DynamicCalculatorLoader;
  private cache = new Map<string, CalculatorData>();

  private constructor() {
    this.loader = DynamicCalculatorLoader.getInstance();
  }

  static getInstance(): CalculatorService {
    if (!this.instance) {
      this.instance = new CalculatorService();
    }
    return this.instance;
  }

  /**
   * Load calculator configuration and plugin
   */
  async loadCalculator(pluginId: string): Promise<CalculatorData> {
    // Check cache first
    if (this.cache.has(pluginId)) {
      return this.cache.get(pluginId)!;
    }

    try {
      // Initialize loader if needed
      await this.loader.initialize();

      // Get plugin from registry
      const availableCalculators = await this.loader.getAvailableCalculators();
      const plugin = availableCalculators.find(p => 
        `${p.metadata.namespace}.${p.metadata.id}` === pluginId
      );

      if (!plugin) {
        throw new Error(`Calculator plugin not found: ${pluginId}`);
      }

      // Convert plugin config to our format
      const config: CalculatorConfig = {
        id: plugin.metadata.id,
        name: typeof plugin.metadata.name === 'string' 
          ? plugin.metadata.name 
          : plugin.metadata.name['zh-TW'] || plugin.metadata.name['en'] || plugin.metadata.id,
        description: typeof plugin.metadata.description === 'string'
          ? plugin.metadata.description
          : plugin.metadata.description['zh-TW'] || plugin.metadata.description['en'] || '',
        fields: plugin.config.fields || []
      };

      // Load visualization config if available
      let visualization: VisualizationConfig | undefined;
      try {
        visualization = await this.loadVisualizationConfig(pluginId);
      } catch (error) {
        console.warn(`No visualization config found for ${pluginId}, using default`);
      }

      const calculatorData: CalculatorData = {
        config,
        visualization,
        plugin
      };

      // Cache the result
      this.cache.set(pluginId, calculatorData);

      return calculatorData;

    } catch (error) {
      console.error(`Failed to load calculator ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Load visualization configuration for a plugin
   */
  private async loadVisualizationConfig(pluginId: string): Promise<VisualizationConfig | undefined> {
    // Use static registry to avoid dynamic imports during build
    const { getVisualizationConfig } = await import('../config/visualization-registry.js');
    return getVisualizationConfig(pluginId);
  }

  /**
   * Execute calculation using the plugin
   */
  async calculate(pluginId: string, inputs: Record<string, any>): Promise<any> {
    const calculatorData = await this.loadCalculator(pluginId);
    
    try {
      // Ensure plugin is installed
      if (calculatorData.plugin.calculator.calculate.toString().includes('not loaded')) {
        await calculatorData.plugin.install();
      }

      // Execute calculation
      const result = await calculatorData.plugin.calculator.calculate(inputs);
      return result;

    } catch (error) {
      console.error(`Calculation failed for ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Validate inputs using the plugin
   */
  async validate(pluginId: string, inputs: Record<string, any>): Promise<{ isValid: boolean; errors: any[] }> {
    const calculatorData = await this.loadCalculator(pluginId);
    
    try {
      // Ensure plugin is installed
      if (calculatorData.plugin.calculator.validate.toString().includes('not loaded')) {
        await calculatorData.plugin.install();
      }

      // Execute validation
      const validation = await calculatorData.plugin.calculator.validate(inputs);
      return validation;

    } catch (error) {
      console.error(`Validation failed for ${pluginId}:`, error);
      return {
        isValid: false,
        errors: [{ field: 'general', message: `Validation error: ${error.message}` }]
      };
    }
  }

  /**
   * Get available calculators
   */
  async getAvailableCalculators(): Promise<Array<{ id: string; name: string; namespace: string }>> {
    await this.loader.initialize();
    const calculators = await this.loader.getAvailableCalculators();
    
    return calculators.map(plugin => ({
      id: `${plugin.metadata.namespace}.${plugin.metadata.id}`,
      name: typeof plugin.metadata.name === 'string' 
        ? plugin.metadata.name 
        : plugin.metadata.name['zh-TW'] || plugin.metadata.name['en'] || plugin.metadata.id,
      namespace: plugin.metadata.namespace
    }));
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}