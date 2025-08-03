/**
 * 通用類型定義
 */

export type SupportedLocale = 'zh-TW' | 'en' | 'ja';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export type CalculatorStatus = 'published' | 'draft' | 'deprecated';

export type FieldType = 'number' | 'select' | 'checkbox' | 'radio' | 'radio-cards' | 'text' | 'boolean' | 'range';

export interface LocalizedString {
  [key: string]: string;
  'zh-TW': string;
  'en'?: string;
  'ja'?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface Reference {
  title: string;
  authors: string[];
  journal: string;
  year: number;
  url?: string;
  doi?: string;
  pmid?: string;
}

export interface MedicalMetadata {
  specialty: string[];
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  references: Reference[];
  clinicalGuidelines?: LocalizedString;
  contraindications?: LocalizedString[];
  limitations?: LocalizedString[];
}