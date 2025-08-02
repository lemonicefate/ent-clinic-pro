/**
 * Template Engine for Dynamic Result Rendering
 * 
 * Handles template string interpolation for visualization configurations.
 * Supports nested object access and conditional rendering.
 */

export class TemplateEngine {
  /**
   * Interpolate template strings with data
   */
  static interpolate(template: string, data: Record<string, any>): string {
    if (!template || typeof template !== 'string') {
      return template;
    }

    return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      try {
        const value = this.evaluateExpression(expression.trim(), data);
        return value !== undefined && value !== null ? String(value) : '';
      } catch (error) {
        console.warn(`Template interpolation error for "${expression}":`, error);
        return match; // Return original if evaluation fails
      }
    });
  }

  /**
   * Interpolate an entire object recursively
   */
  static interpolateObject<T>(obj: T, data: Record<string, any>): T {
    if (typeof obj === 'string') {
      return this.interpolate(obj, data) as T;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.interpolateObject(item, data)) as T;
    }

    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.interpolateObject(value, data);
      }
      return result;
    }

    return obj;
  }

  /**
   * Evaluate a simple expression against data
   */
  private static evaluateExpression(expression: string, data: Record<string, any>): any {
    // Handle simple property access (e.g., "bmi", "result.category")
    if (/^[a-zA-Z_$][a-zA-Z0-9_$.]*$/.test(expression)) {
      return this.getNestedProperty(data, expression);
    }

    // Handle simple conditional expressions (e.g., "frequency === 2 ? 'BID' : 'TID'")
    if (expression.includes('?') && expression.includes(':')) {
      return this.evaluateConditional(expression, data);
    }

    // Handle simple arithmetic and comparisons
    if (/^[a-zA-Z0-9_$.\s+\-*/()===!<>]+$/.test(expression)) {
      return this.evaluateSimpleExpression(expression, data);
    }

    // Fallback: try to get as nested property
    return this.getNestedProperty(data, expression);
  }

  /**
   * Get nested property from object using dot notation
   */
  private static getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Evaluate conditional expressions (ternary operator)
   */
  private static evaluateConditional(expression: string, data: Record<string, any>): any {
    const match = expression.match(/^(.+?)\s*\?\s*(.+?)\s*:\s*(.+)$/);
    if (!match) {
      return undefined;
    }

    const [, condition, trueValue, falseValue] = match;
    
    const conditionResult = this.evaluateSimpleExpression(condition.trim(), data);
    const resultValue = conditionResult ? trueValue.trim() : falseValue.trim();
    
    // Remove quotes if present
    if ((resultValue.startsWith("'") && resultValue.endsWith("'")) ||
        (resultValue.startsWith('"') && resultValue.endsWith('"'))) {
      return resultValue.slice(1, -1);
    }
    
    // Try to evaluate as expression
    return this.evaluateSimpleExpression(resultValue, data);
  }

  /**
   * Evaluate simple expressions with basic operators
   */
  private static evaluateSimpleExpression(expression: string, data: Record<string, any>): any {
    // Replace variables with their values
    let processedExpression = expression.replace(/[a-zA-Z_$][a-zA-Z0-9_$.]*(?!\s*['"()])/g, (match) => {
      const value = this.getNestedProperty(data, match);
      if (typeof value === 'string') {
        return `"${value}"`;
      }
      return value !== undefined ? String(value) : 'undefined';
    });

    // Handle string literals
    processedExpression = processedExpression.replace(/'/g, '"');

    try {
      // Use Function constructor for safe evaluation (limited scope)
      const func = new Function('return ' + processedExpression);
      return func();
    } catch (error) {
      // If evaluation fails, try to return as nested property
      return this.getNestedProperty(data, expression);
    }
  }

  /**
   * Check if a template contains placeholders
   */
  static hasPlaceholders(template: string): boolean {
    return typeof template === 'string' && /\{\{[^}]+\}\}/.test(template);
  }

  /**
   * Extract all placeholder expressions from a template
   */
  static extractPlaceholders(template: string): string[] {
    if (typeof template !== 'string') {
      return [];
    }

    const matches = template.match(/\{\{([^}]+)\}\}/g);
    return matches ? matches.map(match => match.slice(2, -2).trim()) : [];
  }

  /**
   * Validate that all required data is available for a template
   */
  static validateTemplate(template: string, data: Record<string, any>): { valid: boolean; missing: string[] } {
    const placeholders = this.extractPlaceholders(template);
    const missing: string[] = [];

    for (const placeholder of placeholders) {
      try {
        const value = this.evaluateExpression(placeholder, data);
        if (value === undefined) {
          missing.push(placeholder);
        }
      } catch (error) {
        missing.push(placeholder);
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }
}

/**
 * Utility function for template interpolation
 */
export function interpolate(template: string, data: Record<string, any>): string {
  return TemplateEngine.interpolate(template, data);
}

/**
 * Utility function for object interpolation
 */
export function interpolateObject<T>(obj: T, data: Record<string, any>): T {
  return TemplateEngine.interpolateObject(obj, data);
}