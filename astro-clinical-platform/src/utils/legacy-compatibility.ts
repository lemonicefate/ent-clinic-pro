/**
 * Legacy Compatibility Layer
 * 
 * This module provides backward compatibility for the old calculator system
 * while transitioning to the new plugin-based architecture. It includes:
 * 
 * - Legacy API wrappers that map to new plugin system
 * - Deprecation warnings for old usage patterns
 * - Migration helpers for smooth transition
 * - Fallback mechanisms for legacy calculator IDs
 */

import { CalculatorRegistry } from './calculator-registry.js';
import { CalculatorDiscovery } from './calculator-discovery.js';
import { DynamicCalculatorLoader } from './dynamic-calculator-loader.js';
import type { 
  CalculatorPlugin,
  CalculationResult as PluginCalculationResult,
  CalculatorInputs as PluginInputs,
  ValidationResult as PluginValidationResult,
  SupportedLocale 
} from '../types/calculator-plugin.js';

// Legacy types for backward compatibility
export interface LegacyCalculatorConfig {
  id: string;
  name: Record<SupportedLocale, string>;
  description: Record<SupportedLocale, string>;
  category: string;
  fields: LegacyField[];
  calculationFunction: (inputs: any) => Promise<LegacyCalculationResult>;
  interpretation?: LegacyInterpretation[];
  medicalSpecialties: string[];
  difficulty: 'basic' | 'intermediate' | 'advanced';
  isFeatured: boolean;
  isActive: boolean;
  tags: string[];
  usageCount?: number;
  lastUpdated?: Date;
  slug: string;
  icon?: string;
}

export interface LegacyField {
  id: string;
  type: 'text' | 'number' | 'select' | 'radio' | 'checkbox';
  label: Record<SupportedLocale, string>;
  placeholder?: Record<SupportedLocale, string>;
  required: boolean;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  options?: Array<{
    value: string | number;
    label: Record<SupportedLocale, string>;
  }>;
  defaultValue?: any;
  disabled?: boolean;
  showIf?: any;
  validation?: {
    required?: Record<SupportedLocale, string>;
    min?: Record<SupportedLocale, string>;
    max?: Record<SupportedLocale, string>;
    pattern?: Record<SupportedLocale, string>;
  };
}

export interface LegacyCalculationResult {
  score: number;
  risk: 'low' | 'moderate' | 'high' | 'critical';
  interpretation: {
    recommendation: string;
    color: string;
    icon: string;
    actionItems: string[];
  };
  details: {
    breakdown: Array<{
      field: string;
      label: string;
      value: any;
      points: number;
    }>;
    totalPoints: number;
    maxPossibleScore: number;
  };
}

export interface LegacyInterpretation {
  range: [number, number] | string;
  risk: 'low' | 'moderate' | 'high' | 'critical';
  color: string;
  recommendation: Record<SupportedLocale, string>;
}

export interface LegacyValidationError {
  field: string;
  message: string;
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
}

// Legacy ID to Plugin ID mapping
const LEGACY_ID_MAPPING: Record<string, string> = {
  'bmi': 'general.bmi',
  'bmi-calculator': 'general.bmi',
  'body-mass-index': 'general.bmi',
  'egfr': 'nephrology.egfr',
  'kidney-function': 'nephrology.egfr',
  'gfr-calculator': 'nephrology.egfr',
  'cha2ds2-vasc': 'cardiology.cha2ds2-vasc',
  'stroke-risk': 'cardiology.cha2ds2-vasc',
  'atrial-fibrillation': 'cardiology.cha2ds2-vasc',
  'framingham': 'cardiology.framingham-risk',
  'cardiovascular-risk': 'cardiology.framingham-risk',
  'heart-risk': 'cardiology.framingham-risk'
};

// Deprecation warnings tracker
const deprecationWarnings = new Set<string>();

/**
 * Shows deprecation warning once per session
 */
function showDeprecationWarning(oldApi: string, newApi: string, version: string = '2.0.0'): void {
  const warningKey = `${oldApi}->${newApi}`;
  
  if (!deprecationWarnings.has(warningKey)) {
    console.warn(
      `🚨 DEPRECATION WARNING: ${oldApi} is deprecated and will be removed in version ${version}. ` +
      `Please use ${newApi} instead. See migration guide: https://docs.astro-clinical-platform.com/migration`
    );
    deprecationWarnings.add(warningKey);
  }
}

/**
 * Maps legacy calculator ID to plugin ID
 */
export function mapLegacyIdToPluginId(legacyId: string): string {
  const pluginId = LEGACY_ID_MAPPING[legacyId];
  
  if (pluginId) {
    showDeprecationWarning(
      `Calculator ID "${legacyId}"`,
      `Plugin ID "${pluginId}"`,
      '2.0.0'
    );
    return pluginId;
  }
  
  // If no mapping found, assume it might already be a plugin ID
  return legacyId;
}

/**
 * Legacy Calculator Engine Compatibility Wrapper
 */
export class LegacyCalculatorEngine {
  private registry: CalculatorRegistry;
  private loader: DynamicCalculatorLoader;
  private locale: SupportedLocale;

  constructor(locale: SupportedLocale = 'zh-TW') {
    this.registry = CalculatorRegistry.getInstance();
    this.loader = DynamicCalculatorLoader.getInstance();
    this.locale = locale;
    
    showDeprecationWarning(
      'CalculatorEngine class',
      'PluginCalculator component or DynamicCalculatorLoader',
      '2.0.0'
    );
  }

  /**
   * Legacy method: Get calculator config
   */
  async getCalculatorConfig(calculatorId: string): Promise<LegacyCalculatorConfig | null> {
    showDeprecationWarning(
      'getCalculatorConfig()',
      'CalculatorRegistry.get()',
      '2.0.0'
    );

    const pluginId = mapLegacyIdToPluginId(calculatorId);
    const plugin = this.registry.get(pluginId);
    
    if (!plugin) {
      // Try to discover and register the plugin
      try {
        const discovery = new CalculatorDiscovery();
        const plugins = await discovery.discoverCalculators();
        const foundPlugin = plugins.find(p => 
          `${p.metadata.namespace}.${p.metadata.id}` === pluginId ||
          p.metadata.id === calculatorId
        );
        
        if (foundPlugin) {
          await this.registry.register(foundPlugin);
          return this.convertPluginToLegacyConfig(foundPlugin);
        }
      } catch (error) {
        console.error('Failed to discover plugin:', error);
      }
      
      return null;
    }

    return this.convertPluginToLegacyConfig(plugin);
  }

  /**
   * Legacy method: Calculate
   */
  async calculate(calculatorId: string, inputs: any): Promise<LegacyCalculationResult> {
    showDeprecationWarning(
      'CalculatorEngine.calculate()',
      'Plugin.calculate()',
      '2.0.0'
    );

    const pluginId = mapLegacyIdToPluginId(calculatorId);
    const plugin = this.registry.get(pluginId);
    
    if (!plugin) {
      throw new Error(`Calculator plugin not found: ${pluginId}`);
    }

    // Validate inputs using plugin validation
    const validation = plugin.validate(inputs);
    if (!validation.isValid) {
      const errorMessages = validation.errors.map(e => e.message).join(', ');
      throw new Error(`Validation failed: ${errorMessages}`);
    }

    // Perform calculation
    const result = plugin.calculate(inputs);
    
    // Convert plugin result to legacy format
    return this.convertPluginResultToLegacy(result);
  }

  /**
   * Legacy method: Validate
   */
  async validate(calculatorId: string, inputs: any): Promise<LegacyValidationError[]> {
    showDeprecationWarning(
      'CalculatorEngine.validate()',
      'Plugin.validate()',
      '2.0.0'
    );

    const pluginId = mapLegacyIdToPluginId(calculatorId);
    const plugin = this.registry.get(pluginId);
    
    if (!plugin) {
      throw new Error(`Calculator plugin not found: ${pluginId}`);
    }

    const validation = plugin.validate(inputs);
    
    return validation.errors.map(error => ({
      field: error.field,
      message: error.message,
      type: error.type as any
    }));
  }

  /**
   * Convert plugin to legacy config format
   */
  private convertPluginToLegacyConfig(plugin: CalculatorPlugin): LegacyCalculatorConfig {
    return {
      id: plugin.metadata.id,
      name: plugin.metadata.name,
      description: plugin.metadata.description,
      category: plugin.config.category || 'general',
      fields: this.convertPluginFieldsToLegacy(plugin.config.ui?.fields || []),
      calculationFunction: async (inputs: any) => {
        const result = plugin.calculate(inputs);
        return this.convertPluginResultToLegacy(result);
      },
      interpretation: plugin.config.interpretation?.map(interp => ({
        range: interp.range as [number, number],
        risk: interp.risk as any,
        color: interp.color,
        recommendation: interp.recommendation
      })),
      medicalSpecialties: plugin.config.medical?.specialty || [plugin.metadata.namespace],
      difficulty: plugin.config.metadata?.difficulty || 'basic',
      isFeatured: plugin.metadata.tags?.includes('featured') || false,
      isActive: true,
      tags: plugin.metadata.tags || [],
      usageCount: 0,
      lastUpdated: new Date(plugin.metadata.updatedAt),
      slug: plugin.metadata.id,
      icon: undefined
    };
  }

  /**
   * Convert plugin fields to legacy format
   */
  private convertPluginFieldsToLegacy(fields: any[]): LegacyField[] {
    return fields.map(field => ({
      id: field.id,
      type: field.type,
      label: field.label,
      placeholder: field.placeholder,
      required: field.required || false,
      min: field.validation?.min,
      max: field.validation?.max,
      step: field.validation?.step,
      pattern: field.validation?.pattern,
      options: field.options,
      defaultValue: field.defaultValue,
      disabled: field.disabled || false,
      showIf: field.showIf,
      validation: field.validation
    }));
  }

  /**
   * Convert plugin result to legacy format
   */
  private convertPluginResultToLegacy(result: PluginCalculationResult): LegacyCalculationResult {
    // Extract risk level from result or determine from score
    let risk: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    if ('riskCategory' in result) {
      risk = (result as any).riskCategory;
    } else if (typeof result.primaryValue === 'number') {
      // Simple risk categorization based on score
      if (result.primaryValue < 5) risk = 'low';
      else if (result.primaryValue < 15) risk = 'moderate';
      else if (result.primaryValue < 25) risk = 'high';
      else risk = 'critical';
    }

    return {
      score: typeof result.primaryValue === 'number' ? result.primaryValue : 0,
      risk,
      interpretation: {
        recommendation: result.interpretation[this.locale] || result.interpretation['en'] || '',
        color: this.getRiskColor(risk),
        icon: this.getRiskIcon(risk),
        actionItems: result.recommendations?.[this.locale] || result.recommendations?.['en'] || []
      },
      details: {
        breakdown: [], // Legacy format - would need to be populated if needed
        totalPoints: typeof result.primaryValue === 'number' ? result.primaryValue : 0,
        maxPossibleScore: 100 // Default max score
      }
    };
  }

  /**
   * Get risk color for legacy compatibility
   */
  private getRiskColor(risk: string): string {
    const colors = {
      low: '#10B981',
      moderate: '#F59E0B',
      high: '#EF4444',
      critical: '#DC2626'
    };
    return colors[risk as keyof typeof colors] || colors.low;
  }

  /**
   * Get risk icon for legacy compatibility
   */
  private getRiskIcon(risk: string): string {
    const icons = {
      low: '✅',
      moderate: '⚠️',
      high: '🚨',
      critical: '🔴'
    };
    return icons[risk as keyof typeof icons] || icons.low;
  }
}

/**
 * Legacy Calculator Loader Compatibility Wrapper
 */
export class LegacyCalculatorLoader {
  private registry: CalculatorRegistry;
  private discovery: CalculatorDiscovery;

  constructor() {
    this.registry = CalculatorRegistry.getInstance();
    this.discovery = new CalculatorDiscovery();
    
    showDeprecationWarning(
      'CalculatorLoader class',
      'CalculatorRegistry and CalculatorDiscovery',
      '2.0.0'
    );
  }

  /**
   * Legacy method: Load all calculators
   */
  async loadAllCalculators(options: any = {}): Promise<LegacyCalculatorConfig[]> {
    showDeprecationWarning(
      'loadAllCalculators()',
      'CalculatorRegistry.listAll()',
      '2.0.0'
    );

    // Ensure plugins are discovered and registered
    await this.ensurePluginsRegistered();

    const plugins = this.registry.listAll();
    const legacyEngine = new LegacyCalculatorEngine();
    
    const configs = await Promise.all(
      plugins.map(plugin => 
        legacyEngine.getCalculatorConfig(`${plugin.metadata.namespace}.${plugin.metadata.id}`)
      )
    );

    return configs.filter(config => config !== null) as LegacyCalculatorConfig[];
  }

  /**
   * Legacy method: Load calculator by ID
   */
  async loadCalculatorById(id: string): Promise<LegacyCalculatorConfig | null> {
    showDeprecationWarning(
      'loadCalculatorById()',
      'CalculatorRegistry.get()',
      '2.0.0'
    );

    const legacyEngine = new LegacyCalculatorEngine();
    return legacyEngine.getCalculatorConfig(id);
  }

  /**
   * Legacy method: Load calculator by slug
   */
  async loadCalculatorBySlug(slug: string): Promise<LegacyCalculatorConfig | null> {
    showDeprecationWarning(
      'loadCalculatorBySlug()',
      'CalculatorRegistry.get() with plugin ID',
      '2.0.0'
    );

    // Map slug to plugin ID and load
    return this.loadCalculatorById(slug);
  }

  /**
   * Ensure plugins are discovered and registered
   */
  private async ensurePluginsRegistered(): Promise<void> {
    const registeredPlugins = this.registry.listAll();
    
    if (registeredPlugins.length === 0) {
      try {
        const discoveredPlugins = await this.discovery.discoverCalculators();
        
        for (const plugin of discoveredPlugins) {
          try {
            await this.registry.register(plugin);
          } catch (error) {
            console.error(`Failed to register plugin ${plugin.metadata.namespace}.${plugin.metadata.id}:`, error);
          }
        }
      } catch (error) {
        console.error('Failed to discover plugins:', error);
      }
    }
  }
}

/**
 * Legacy function wrappers for backward compatibility
 */

/**
 * @deprecated Use CalculatorRegistry.get() instead
 */
export async function getCalculatorConfig(calculatorId: string): Promise<LegacyCalculatorConfig | null> {
  showDeprecationWarning(
    'getCalculatorConfig() function',
    'CalculatorRegistry.get()',
    '2.0.0'
  );

  const engine = new LegacyCalculatorEngine();
  return engine.getCalculatorConfig(calculatorId);
}

/**
 * @deprecated Use CalculatorRegistry.listAll() instead
 */
export async function getAllCalculatorConfigs(options: any = {}): Promise<LegacyCalculatorConfig[]> {
  showDeprecationWarning(
    'getAllCalculatorConfigs() function',
    'CalculatorRegistry.listAll()',
    '2.0.0'
  );

  const loader = new LegacyCalculatorLoader();
  return loader.loadAllCalculators(options);
}

/**
 * @deprecated Use CalculatorRegistry.get() instead
 */
export async function getCalculatorBySlug(slug: string): Promise<LegacyCalculatorConfig | null> {
  showDeprecationWarning(
    'getCalculatorBySlug() function',
    'CalculatorRegistry.get() with plugin ID',
    '2.0.0'
  );

  const loader = new LegacyCalculatorLoader();
  return loader.loadCalculatorBySlug(slug);
}

/**
 * Migration helper: Convert legacy calculator to plugin
 */
export function createMigrationGuide(legacyId: string): {
  pluginId: string;
  migrationSteps: string[];
  codeExamples: {
    before: string;
    after: string;
  };
} {
  const pluginId = mapLegacyIdToPluginId(legacyId);
  
  return {
    pluginId,
    migrationSteps: [
      `Replace calculator ID "${legacyId}" with plugin ID "${pluginId}"`,
      'Update imports to use PluginCalculator component',
      'Replace CalculatorEngine with DynamicCalculatorLoader',
      'Update validation and calculation calls to use plugin methods',
      'Test thoroughly with new plugin system'
    ],
    codeExamples: {
      before: `
// Old way
import { getCalculatorConfig } from '../utils/calculator-engine.js';
const config = await getCalculatorConfig('${legacyId}');
      `,
      after: `
// New way
import { CalculatorRegistry } from '../utils/calculator-registry.js';
const registry = CalculatorRegistry.getInstance();
const plugin = registry.get('${pluginId}');
      `
    }
  };
}

/**
 * Health check for legacy compatibility
 */
export async function checkLegacyCompatibility(): Promise<{
  status: 'healthy' | 'warning' | 'error';
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check if legacy IDs are still being used
  const legacyIds = Object.keys(LEGACY_ID_MAPPING);
  const registry = CalculatorRegistry.getInstance();
  
  for (const legacyId of legacyIds) {
    const pluginId = LEGACY_ID_MAPPING[legacyId];
    const plugin = registry.get(pluginId);
    
    if (!plugin) {
      issues.push(`Legacy calculator "${legacyId}" maps to plugin "${pluginId}" but plugin not found`);
      recommendations.push(`Ensure plugin "${pluginId}" is properly implemented and registered`);
    }
  }

  // Check deprecation warnings
  if (deprecationWarnings.size > 0) {
    issues.push(`${deprecationWarnings.size} deprecation warnings have been shown`);
    recommendations.push('Review and update code to use new plugin system APIs');
  }

  let status: 'healthy' | 'warning' | 'error' = 'healthy';
  if (issues.length > 0) {
    status = issues.some(issue => issue.includes('not found')) ? 'error' : 'warning';
  }

  return {
    status,
    issues,
    recommendations
  };
}

// Export legacy instances for backward compatibility
export const calculatorEngine = new LegacyCalculatorEngine();
export const calculatorLoader = new LegacyCalculatorLoader();

// Export migration utilities
export { mapLegacyIdToPluginId, createMigrationGuide, checkLegacyCompatibility };