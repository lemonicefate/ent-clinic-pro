/**
 * Calculator Types
 */

export type SupportedLocale = 'zh-TW' | 'en' | 'ja';

export interface LocalizedString {
  'zh-TW': string;
  'en': string;
  'ja'?: string;
}

export interface CalculatorInputs {
  [key: string]: any;
}

export interface CalculationResult {
  primaryValue: number;
  primaryUnit?: string;
  primaryLabel?: LocalizedString;
  secondaryValues?: Record<string, any>;
  interpretation?: LocalizedString;
  recommendations?: Array<Record<SupportedLocale, string>>;
  riskLevel?: string;
  metadata?: {
    calculationDate?: string;
    calculationSteps?: Array<{
      description: string;
      value: string;
      formula: string;
    }>;
    references?: string[];
    lastCalculated?: string;
    version?: string;
    algorithm?: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'invalid' | 'range';
}

export interface CalculatorField {
  id: string;
  type: 'number' | 'select' | 'checkbox' | 'radio' | 'text';
  label: LocalizedString;
  required: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{
    value: string | number;
    label: LocalizedString;
  }>;
  unit?: LocalizedString;
  helpText?: LocalizedString;
  placeholder?: LocalizedString;
}

export interface CalculatorConfig {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  category: string;
  version: string;
  status: string;
  fields: CalculatorField[];
  calculation: {
    functionName: string;
    validationRules?: any;
  };
  medical: {
    specialty: string[];
    evidenceLevel: string;
    clinicalGuidelines: LocalizedString;
    references?: any[];
  };
  metadata: {
    author: string;
    lastUpdated: string;
    tags: string[];
    difficulty: string;
  };
  interpretation?: any[];
}