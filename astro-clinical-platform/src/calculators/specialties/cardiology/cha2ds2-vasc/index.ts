/**
 * CHA2DS2-VASc Calculator Plugin
 * 
 * Clinical scoring tool for assessing stroke risk in atrial fibrillation patients.
 * Based on 2020 ESC Guidelines for the management of atrial fibrillation.
 */

import type { CalculatorPlugin } from '../../../types/calculator-plugin.js';
import { validate, calculate } from './calculator.js';
import CHA2DS2VAScDashboard from './CHA2DS2VAScDashboard.tsx';
import config from './config.json';

const CHA2DS2VAScPlugin: CalculatorPlugin = {
  metadata: {
    id: config.id,
    namespace: 'cardiology',
    version: config.version,
    name: config.name,
    description: config.description,
    author: config.metadata.author,
    license: config.metadata.license,
    tags: config.metadata.tags,
    createdAt: '2025-01-28T00:00:00Z',
    updatedAt: new Date().toISOString(),
    dependencies: [],
    compatibility: {
      minPlatformVersion: '1.0.0',
      maxPlatformVersion: '2.0.0'
    }
  },

  config: {
    category: config.category,
    metadata: config.metadata,
    medical: config.medical,
    ui: config.ui,
    interpretation: config.interpretation,
    
    performance: {
      timeout: 5000,
      maxRetries: 3,
      cacheable: true,
      cacheTimeout: 300000
    },
    
    security: {
      allowedOrigins: ['*'],
      requireAuth: false,
      sanitizeInputs: true
    }
  },

  validate,
  calculate,
  component: CHA2DS2VAScDashboard,

  async onLoad() {
    console.log(`🔌 Loading CHA2DS2-VASc Calculator Plugin v${this.metadata.version}`);
    return true;
  },

  async onUnload() {
    console.log('🔌 Unloading CHA2DS2-VASc Calculator Plugin');
    return true;
  },

  async onError(error: Error, context?: any) {
    console.error('🚨 CHA2DS2-VASc Calculator Plugin Error:', error);
    return {
      handled: true,
      message: 'CHA2DS2-VASc calculation error. Please verify patient data.',
      recovery: 'retry'
    };
  },

  async healthCheck() {
    try {
      const testInputs = {
        age: 70,
        gender: 'female' as const,
        congestiveHeartFailure: false,
        hypertension: true,
        diabetes: false,
        strokeHistory: false,
        vascularDisease: false
      };
      
      const validationResult = validate(testInputs);
      
      if (!validationResult.isValid) {
        throw new Error('Validation test failed');
      }
      
      const calculationResult = calculate(testInputs);
      
      if (calculationResult.score === undefined) {
        throw new Error('Calculation test failed');
      }
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: this.metadata.version,
        tests: {
          validation: 'passed',
          calculation: 'passed'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: this.metadata.version,
        error: error instanceof Error ? error.message : 'Unknown error',
        tests: {
          validation: 'failed',
          calculation: 'failed'
        }
      };
    }
  }
};

export default CHA2DS2VAScPlugin;
export { validate, calculate, CHA2DS2VAScDashboard };
export type { CHA2DS2VAScInputs, CHA2DS2VAScResult } from './calculator.js';