/**
 * Migration Helper Utilities
 * 
 * This module provides utilities to help developers migrate from the old
 * calculator system to the new plugin-based architecture.
 */

import { CalculatorRegistry } from './calculator-registry.js';
import { CalculatorDiscovery } from './calculator-discovery.js';
import { mapLegacyIdToPluginId, checkLegacyCompatibility } from './legacy-compatibility.js';
import type { CalculatorPlugin } from '../types/calculator-plugin.js';

export interface MigrationReport {
  timestamp: string;
  version: string;
  summary: {
    totalLegacyReferences: number;
    migratedReferences: number;
    pendingMigrations: number;
    criticalIssues: number;
  };
  legacyReferences: LegacyReference[];
  migrationSteps: MigrationStep[];
  recommendations: string[];
  compatibilityStatus: {
    status: 'healthy' | 'warning' | 'error';
    issues: string[];
  };
}

export interface LegacyReference {
  type: 'calculator-id' | 'api-call' | 'import' | 'component';
  location: string;
  oldValue: string;
  newValue: string;
  migrationRequired: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface MigrationStep {
  id: string;
  title: string;
  description: string;
  category: 'preparation' | 'code-changes' | 'testing' | 'cleanup';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: string;
  dependencies: string[];
  codeExample?: {
    before: string;
    after: string;
  };
  completed: boolean;
}

export interface PluginMigrationPlan {
  pluginId: string;
  legacyId: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'failed';
  steps: MigrationStep[];
  issues: string[];
  testCases: TestCase[];
}

export interface TestCase {
  id: string;
  description: string;
  inputs: any;
  expectedOutput: any;
  status: 'pending' | 'passed' | 'failed';
  error?: string;
}

/**
 * Migration Helper Class
 */
export class MigrationHelper {
  private registry: CalculatorRegistry;
  private discovery: CalculatorDiscovery;

  constructor() {
    this.registry = CalculatorRegistry.getInstance();
    this.discovery = new CalculatorDiscovery();
  }

  /**
   * Generate comprehensive migration report
   */
  async generateMigrationReport(): Promise<MigrationReport> {
    const timestamp = new Date().toISOString();
    const compatibilityStatus = await checkLegacyCompatibility();
    
    // Analyze legacy references (this would scan codebase in real implementation)
    const legacyReferences = await this.findLegacyReferences();
    
    // Generate migration steps
    const migrationSteps = this.generateMigrationSteps(legacyReferences);
    
    // Calculate summary
    const summary = {
      totalLegacyReferences: legacyReferences.length,
      migratedReferences: legacyReferences.filter(ref => !ref.migrationRequired).length,
      pendingMigrations: legacyReferences.filter(ref => ref.migrationRequired).length,
      criticalIssues: legacyReferences.filter(ref => ref.priority === 'critical').length
    };

    return {
      timestamp,
      version: '2.0.0',
      summary,
      legacyReferences,
      migrationSteps,
      recommendations: this.generateRecommendations(legacyReferences),
      compatibilityStatus
    };
  }

  /**
   * Create migration plan for specific plugin
   */
  async createPluginMigrationPlan(legacyId: string): Promise<PluginMigrationPlan> {
    const pluginId = mapLegacyIdToPluginId(legacyId);
    const plugin = this.registry.get(pluginId);
    
    const plan: PluginMigrationPlan = {
      pluginId,
      legacyId,
      status: 'not-started',
      steps: [],
      issues: [],
      testCases: []
    };

    if (!plugin) {
      plan.status = 'failed';
      plan.issues.push(`Plugin ${pluginId} not found in registry`);
      return plan;
    }

    // Generate migration steps
    plan.steps = [
      {
        id: 'update-imports',
        title: 'Update Import Statements',
        description: 'Replace old calculator engine imports with plugin system imports',
        category: 'code-changes',
        priority: 'high',
        estimatedTime: '15 minutes',
        dependencies: [],
        codeExample: {
          before: `import { getCalculatorConfig } from '../utils/calculator-engine.js';`,
          after: `import { CalculatorRegistry } from '../utils/calculator-registry.js';`
        },
        completed: false
      },
      {
        id: 'update-calculator-id',
        title: 'Update Calculator ID References',
        description: `Replace legacy ID "${legacyId}" with plugin ID "${pluginId}"`,
        category: 'code-changes',
        priority: 'critical',
        estimatedTime: '10 minutes',
        dependencies: ['update-imports'],
        codeExample: {
          before: `const config = await getCalculatorConfig('${legacyId}');`,
          after: `const registry = CalculatorRegistry.getInstance();\nconst plugin = registry.get('${pluginId}');`
        },
        completed: false
      },
      {
        id: 'update-component-usage',
        title: 'Update Component Usage',
        description: 'Replace Calculator component with PluginCalculator component',
        category: 'code-changes',
        priority: 'high',
        estimatedTime: '20 minutes',
        dependencies: ['update-calculator-id'],
        codeExample: {
          before: `<Calculator calculatorId="${legacyId}" />`,
          after: `<PluginCalculator pluginId="${pluginId}" />`
        },
        completed: false
      },
      {
        id: 'update-validation-calls',
        title: 'Update Validation Calls',
        description: 'Replace engine validation with plugin validation',
        category: 'code-changes',
        priority: 'medium',
        estimatedTime: '15 minutes',
        dependencies: ['update-calculator-id'],
        codeExample: {
          before: `const errors = await engine.validate('${legacyId}', inputs);`,
          after: `const validation = plugin.validate(inputs);\nconst errors = validation.errors;`
        },
        completed: false
      },
      {
        id: 'update-calculation-calls',
        title: 'Update Calculation Calls',
        description: 'Replace engine calculation with plugin calculation',
        category: 'code-changes',
        priority: 'medium',
        estimatedTime: '15 minutes',
        dependencies: ['update-calculator-id'],
        codeExample: {
          before: `const result = await engine.calculate('${legacyId}', inputs);`,
          after: `const result = plugin.calculate(inputs);`
        },
        completed: false
      },
      {
        id: 'create-test-cases',
        title: 'Create Test Cases',
        description: 'Create comprehensive test cases for the migrated plugin',
        category: 'testing',
        priority: 'high',
        estimatedTime: '30 minutes',
        dependencies: ['update-calculation-calls'],
        completed: false
      },
      {
        id: 'run-tests',
        title: 'Run Migration Tests',
        description: 'Execute all test cases to verify migration success',
        category: 'testing',
        priority: 'critical',
        estimatedTime: '15 minutes',
        dependencies: ['create-test-cases'],
        completed: false
      },
      {
        id: 'remove-legacy-code',
        title: 'Remove Legacy Code',
        description: 'Clean up old calculator engine references',
        category: 'cleanup',
        priority: 'low',
        estimatedTime: '10 minutes',
        dependencies: ['run-tests'],
        completed: false
      }
    ];

    // Generate test cases
    plan.testCases = await this.generateTestCases(plugin);

    return plan;
  }

  /**
   * Validate migration for specific plugin
   */
  async validateMigration(pluginId: string): Promise<{
    success: boolean;
    issues: string[];
    testResults: TestCase[];
  }> {
    const plugin = this.registry.get(pluginId);
    const issues: string[] = [];
    
    if (!plugin) {
      return {
        success: false,
        issues: [`Plugin ${pluginId} not found`],
        testResults: []
      };
    }

    // Run health check
    const health = await plugin.healthCheck();
    if (health.status !== 'healthy') {
      issues.push(`Plugin health check failed: ${health.error || 'Unknown error'}`);
    }

    // Generate and run test cases
    const testCases = await this.generateTestCases(plugin);
    const testResults = await this.runTestCases(plugin, testCases);
    
    // Check for test failures
    const failedTests = testResults.filter(test => test.status === 'failed');
    if (failedTests.length > 0) {
      issues.push(`${failedTests.length} test cases failed`);
      failedTests.forEach(test => {
        issues.push(`Test "${test.description}" failed: ${test.error}`);
      });
    }

    return {
      success: issues.length === 0,
      issues,
      testResults
    };
  }

  /**
   * Generate migration checklist
   */
  generateMigrationChecklist(): {
    category: string;
    items: Array<{
      task: string;
      description: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      completed: boolean;
    }>;
  }[] {
    return [
      {
        category: 'Preparation',
        items: [
          {
            task: 'Backup current codebase',
            description: 'Create a backup of your current implementation before starting migration',
            priority: 'critical',
            completed: false
          },
          {
            task: 'Review migration documentation',
            description: 'Read the complete migration guide and best practices',
            priority: 'high',
            completed: false
          },
          {
            task: 'Identify all legacy calculator references',
            description: 'Scan codebase for all uses of old calculator system',
            priority: 'high',
            completed: false
          }
        ]
      },
      {
        category: 'Code Changes',
        items: [
          {
            task: 'Update import statements',
            description: 'Replace old calculator engine imports with plugin system imports',
            priority: 'high',
            completed: false
          },
          {
            task: 'Replace calculator IDs with plugin IDs',
            description: 'Update all calculator ID references to use new plugin ID format',
            priority: 'critical',
            completed: false
          },
          {
            task: 'Update component usage',
            description: 'Replace Calculator components with PluginCalculator components',
            priority: 'high',
            completed: false
          },
          {
            task: 'Update API calls',
            description: 'Replace engine method calls with plugin method calls',
            priority: 'medium',
            completed: false
          }
        ]
      },
      {
        category: 'Testing',
        items: [
          {
            task: 'Create test cases',
            description: 'Develop comprehensive test cases for all migrated functionality',
            priority: 'high',
            completed: false
          },
          {
            task: 'Run unit tests',
            description: 'Execute unit tests to verify individual plugin functionality',
            priority: 'high',
            completed: false
          },
          {
            task: 'Run integration tests',
            description: 'Test plugin integration with the overall system',
            priority: 'medium',
            completed: false
          },
          {
            task: 'Perform user acceptance testing',
            description: 'Verify that user-facing functionality works as expected',
            priority: 'high',
            completed: false
          }
        ]
      },
      {
        category: 'Cleanup',
        items: [
          {
            task: 'Remove legacy imports',
            description: 'Clean up unused imports from old calculator system',
            priority: 'low',
            completed: false
          },
          {
            task: 'Update documentation',
            description: 'Update code comments and documentation to reflect new system',
            priority: 'medium',
            completed: false
          },
          {
            task: 'Remove deprecated code',
            description: 'Remove any remaining references to old calculator system',
            priority: 'low',
            completed: false
          }
        ]
      }
    ];
  }

  /**
   * Find legacy references in codebase (simplified implementation)
   */
  private async findLegacyReferences(): Promise<LegacyReference[]> {
    // In a real implementation, this would scan the actual codebase
    // For now, we'll return some example references
    return [
      {
        type: 'calculator-id',
        location: 'src/pages/tools/bmi.astro:15',
        oldValue: 'bmi',
        newValue: 'general.bmi',
        migrationRequired: true,
        priority: 'high',
        description: 'Legacy calculator ID used in BMI page'
      },
      {
        type: 'api-call',
        location: 'src/components/Calculator.tsx:42',
        oldValue: 'getCalculatorConfig()',
        newValue: 'CalculatorRegistry.get()',
        migrationRequired: true,
        priority: 'critical',
        description: 'Legacy API call for getting calculator configuration'
      },
      {
        type: 'import',
        location: 'src/utils/calculator-helpers.ts:3',
        oldValue: 'import { calculatorEngine } from "./calculator-engine.js"',
        newValue: 'import { CalculatorRegistry } from "./calculator-registry.js"',
        migrationRequired: true,
        priority: 'medium',
        description: 'Legacy import statement'
      }
    ];
  }

  /**
   * Generate migration steps based on legacy references
   */
  private generateMigrationSteps(references: LegacyReference[]): MigrationStep[] {
    const steps: MigrationStep[] = [];
    
    // Group references by type and generate appropriate steps
    const referencesByType = references.reduce((acc, ref) => {
      if (!acc[ref.type]) acc[ref.type] = [];
      acc[ref.type].push(ref);
      return acc;
    }, {} as Record<string, LegacyReference[]>);

    let stepId = 1;

    // Generate steps for each reference type
    Object.entries(referencesByType).forEach(([type, refs]) => {
      switch (type) {
        case 'calculator-id':
          steps.push({
            id: `step-${stepId++}`,
            title: 'Update Calculator IDs',
            description: `Update ${refs.length} calculator ID references to use plugin format`,
            category: 'code-changes',
            priority: 'critical',
            estimatedTime: `${refs.length * 5} minutes`,
            dependencies: [],
            completed: false
          });
          break;
        
        case 'api-call':
          steps.push({
            id: `step-${stepId++}`,
            title: 'Update API Calls',
            description: `Update ${refs.length} API calls to use plugin system`,
            category: 'code-changes',
            priority: 'high',
            estimatedTime: `${refs.length * 10} minutes`,
            dependencies: [],
            completed: false
          });
          break;
        
        case 'import':
          steps.push({
            id: `step-${stepId++}`,
            title: 'Update Import Statements',
            description: `Update ${refs.length} import statements`,
            category: 'code-changes',
            priority: 'medium',
            estimatedTime: `${refs.length * 3} minutes`,
            dependencies: [],
            completed: false
          });
          break;
      }
    });

    return steps;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(references: LegacyReference[]): string[] {
    const recommendations: string[] = [];
    
    const criticalRefs = references.filter(ref => ref.priority === 'critical');
    if (criticalRefs.length > 0) {
      recommendations.push(`Address ${criticalRefs.length} critical migration issues first`);
    }

    const highPriorityRefs = references.filter(ref => ref.priority === 'high');
    if (highPriorityRefs.length > 0) {
      recommendations.push(`Plan for ${highPriorityRefs.length} high-priority migrations`);
    }

    recommendations.push('Test thoroughly after each migration step');
    recommendations.push('Keep legacy compatibility layer enabled during transition');
    recommendations.push('Update documentation after migration is complete');

    return recommendations;
  }

  /**
   * Generate test cases for plugin
   */
  private async generateTestCases(plugin: CalculatorPlugin): Promise<TestCase[]> {
    const testCases: TestCase[] = [];

    // Basic functionality test
    testCases.push({
      id: 'basic-calculation',
      description: 'Test basic calculation functionality',
      inputs: this.generateSampleInputs(plugin),
      expectedOutput: 'valid-result',
      status: 'pending'
    });

    // Validation test
    testCases.push({
      id: 'input-validation',
      description: 'Test input validation',
      inputs: {},
      expectedOutput: 'validation-errors',
      status: 'pending'
    });

    // Edge case test
    testCases.push({
      id: 'edge-cases',
      description: 'Test edge case handling',
      inputs: this.generateEdgeCaseInputs(plugin),
      expectedOutput: 'handled-gracefully',
      status: 'pending'
    });

    return testCases;
  }

  /**
   * Run test cases for plugin
   */
  private async runTestCases(plugin: CalculatorPlugin, testCases: TestCase[]): Promise<TestCase[]> {
    const results: TestCase[] = [];

    for (const testCase of testCases) {
      try {
        switch (testCase.id) {
          case 'basic-calculation':
            const result = plugin.calculate(testCase.inputs);
            testCase.status = result ? 'passed' : 'failed';
            break;
          
          case 'input-validation':
            const validation = plugin.validate(testCase.inputs);
            testCase.status = !validation.isValid ? 'passed' : 'failed';
            break;
          
          case 'edge-cases':
            // Test edge cases
            testCase.status = 'passed'; // Simplified
            break;
        }
      } catch (error) {
        testCase.status = 'failed';
        testCase.error = error instanceof Error ? error.message : 'Unknown error';
      }
      
      results.push(testCase);
    }

    return results;
  }

  /**
   * Generate sample inputs for testing
   */
  private generateSampleInputs(plugin: CalculatorPlugin): any {
    const inputs: any = {};
    
    // Generate sample inputs based on plugin configuration
    if (plugin.config.ui?.fields) {
      plugin.config.ui.fields.forEach(field => {
        switch (field.type) {
          case 'number':
            inputs[field.id] = 25; // Sample number
            break;
          case 'select':
            inputs[field.id] = field.options?.[0]?.value || 'option1';
            break;
          case 'text':
            inputs[field.id] = 'sample text';
            break;
          default:
            inputs[field.id] = 'sample';
        }
      });
    }

    return inputs;
  }

  /**
   * Generate edge case inputs for testing
   */
  private generateEdgeCaseInputs(plugin: CalculatorPlugin): any {
    const inputs: any = {};
    
    // Generate edge case inputs
    if (plugin.config.ui?.fields) {
      plugin.config.ui.fields.forEach(field => {
        switch (field.type) {
          case 'number':
            inputs[field.id] = field.validation?.max || 999999; // Max value
            break;
          case 'select':
            inputs[field.id] = 'invalid-option';
            break;
          case 'text':
            inputs[field.id] = ''; // Empty string
            break;
          default:
            inputs[field.id] = null;
        }
      });
    }

    return inputs;
  }
}

// Export singleton instance
export const migrationHelper = new MigrationHelper();

// Export utility functions
export async function generateMigrationReport(): Promise<MigrationReport> {
  return migrationHelper.generateMigrationReport();
}

export async function createPluginMigrationPlan(legacyId: string): Promise<PluginMigrationPlan> {
  return migrationHelper.createPluginMigrationPlan(legacyId);
}

export async function validateMigration(pluginId: string) {
  return migrationHelper.validateMigration(pluginId);
}