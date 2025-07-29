/**
 * Amoxicillin/Clavulanate Dose Calculator Plugin Entry Point
 * 
 * This file exports the complete Amoxicillin/Clavulanate dose calculator plugin
 * following the new plugin architecture.
 */

import type { CalculatorPlugin } from '../../../types/calculator-plugin.js';
import { calculate, validate, formatResult } from './calculator.js';
import AmoxicillinClavulanateDashboard from './AmoxicillinClavulanateDashboard.tsx';
import config from './config.json';

// ============================================================================
// Plugin Implementation
// ============================================================================

const AmoxicillinClavulanateCalculatorPlugin: CalculatorPlugin = {
  // Plugin metadata from config.json
  metadata: {
    id: config.id,
    namespace: 'pediatrics',
    version: config.version,
    name: config.name,
    description: config.description,
    author: config.metadata.author,
    license: config.metadata.license,
    dependencies: [],
    conflicts: [],
    tags: config.metadata.tags,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  },

  // Calculator configuration
  config: {
    id: config.id,
    name: config.name,
    description: config.description,
    category: config.category,
    version: config.version,
    status: 'active',
    fields: config.ui.fields,
    calculation: config.calculation,
    medical: config.medical,
    metadata: config.metadata
  },

  // Calculator implementation
  calculator: {
    calculate,
    validate,
    formatResult
  },

  // Dashboard component for results visualization
  dashboard: AmoxicillinClavulanateDashboard,

  // Lifecycle hooks
  async install() {
    console.log('📦 Installing Amoxicillin/Clavulanate Dose Calculator Plugin...');
    
    try {
      // Validate plugin configuration
      if (!this.metadata.id || !this.metadata.namespace) {
        throw new Error('Invalid plugin metadata: missing id or namespace');
      }
      
      // Validate calculator configuration
      if (!this.config.fields || this.config.fields.length === 0) {
        throw new Error('Invalid calculator configuration: no fields defined');
      }
      
      // Test calculation function with sample inputs
      const testInputs = { 
        weight: 15, 
        doseTarget: 'low', 
        days: 3 
      };
      const testResult = await this.calculator.calculate(testInputs);
      
      if (!testResult || typeof testResult.primaryValue !== 'number') {
        throw new Error('Calculator function test failed');
      }
      
      console.log('✅ Amoxicillin/Clavulanate Dose Calculator Plugin installed successfully');
      
    } catch (error) {
      console.error('❌ Amoxicillin/Clavulanate Dose Calculator Plugin installation failed:', error);
      throw error;
    }
  },

  async uninstall() {
    console.log('🗑️ Uninstalling Amoxicillin/Clavulanate Dose Calculator Plugin...');
    
    try {
      // Clean up any resources
      // For this calculator, no special cleanup is needed
      
      console.log('✅ Amoxicillin/Clavulanate Dose Calculator Plugin uninstalled successfully');
      
    } catch (error) {
      console.error('❌ Amoxicillin/Clavulanate Dose Calculator Plugin uninstall failed:', error);
      throw error;
    }
  },

  async validate() {
    console.log('🔍 Validating Amoxicillin/Clavulanate Dose Calculator Plugin...');
    
    try {
      // Validate metadata
      if (!this.metadata.id || !this.metadata.namespace || !this.metadata.version) {
        console.error('Invalid metadata: missing required fields');
        return false;
      }
      
      // Validate configuration
      if (!this.config.fields || this.config.fields.length === 0) {
        console.error('Invalid configuration: no fields defined');
        return false;
      }
      
      // Check required fields
      const requiredFields = ['weight', 'doseTarget', 'days'];
      const fieldIds = this.config.fields.map(f => f.id);
      const missingFields = requiredFields.filter(id => !fieldIds.includes(id));
      
      if (missingFields.length > 0) {
        console.error(`Missing required fields: ${missingFields.join(', ')}`);
        return false;
      }
      
      // Test validation function
      const testInputs = { weight: 15, doseTarget: 'low', days: 3 };
      const validationResult = this.calculator.validate(testInputs);
      
      if (!validationResult.isValid) {
        console.error('Validation function test failed:', validationResult.errors);
        return false;
      }
      
      // Test calculation function
      const calculationResult = this.calculator.calculate(testInputs);
      
      if (!calculationResult || typeof calculationResult.primaryValue !== 'number') {
        console.error('Calculation function test failed');
        return false;
      }
      
      console.log('✅ Amoxicillin/Clavulanate Dose Calculator Plugin validation passed');
      return true;
      
    } catch (error) {
      console.error('❌ Amoxicillin/Clavulanate Dose Calculator Plugin validation failed:', error);
      return false;
    }
  },

  async checkCompatibility() {
    const issues = [];
    
    try {
      // Check if React is available (required for dashboard)
      if (typeof React === 'undefined') {
        try {
          await import('react');
        } catch {
          issues.push({
            severity: 'error' as const,
            category: 'dependency' as const,
            message: 'React is required but not available',
            details: { dependency: 'react' },
            resolution: 'Ensure React is installed and available'
          });
        }
      }
      
      // Check if required types are available
      try {
        const types = await import('../../../types/calculator.js');
        if (!types) {
          issues.push({
            severity: 'warning' as const,
            category: 'api' as const,
            message: 'Calculator types may not be available',
            details: { types: 'calculator types' },
            resolution: 'Ensure calculator types are properly exported'
          });
        }
      } catch (error) {
        issues.push({
          severity: 'error' as const,
          category: 'api' as const,
          message: 'Failed to import calculator types',
          details: { error: error.message },
          resolution: 'Check calculator type definitions'
        });
      }
      
    } catch (error) {
      issues.push({
        severity: 'error' as const,
        category: 'api' as const,
        message: `Compatibility check failed: ${error.message}`,
        details: { error: error.message },
        resolution: 'Check plugin dependencies and API compatibility'
      });
    }
    
    return {
      compatible: issues.filter(issue => issue.severity === 'error').length === 0,
      issues
    };
  },

  async onConfigUpdate(newConfig) {
    console.log('⚙️ Amoxicillin/Clavulanate Dose Calculator Plugin configuration updated');
    
    // Update internal configuration
    Object.assign(this.config, newConfig);
    
    // Re-validate with new configuration
    const isValid = await this.validate();
    if (!isValid) {
      throw new Error('New configuration is invalid');
    }
    
    console.log('✅ Amoxicillin/Clavulanate Dose Calculator Plugin configuration updated successfully');
  }
};

// ============================================================================
// Export Plugin
// ============================================================================

export default AmoxicillinClavulanateCalculatorPlugin;

// Named exports for convenience
export { calculate, validate, formatResult, AmoxicillinClavulanateDashboard };
export { AmoxicillinClavulanateCalculatorPlugin };