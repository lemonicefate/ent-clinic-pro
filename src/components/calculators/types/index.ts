/**
 * 統一計算機類型系統
 * 
 * 這個檔案定義了所有計算機模組必須遵循的統一介面和類型。
 * 確保所有計算機模組的一致性和互操作性。
 */

// 直接定義所有基本類型以避免導入問題
export type SupportedLocale = 'zh-TW' | 'en' | 'ja';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
export type CalculatorStatus = 'published' | 'draft' | 'deprecated';
export type FieldType = 'number' | 'select' | 'checkbox' | 'radio' | 'radio-cards' | 'text' | 'boolean' | 'range';

// 直接定義其他常用類型
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

// Re-export other types
export * from './results';
export * from './calculator';
export * from './config';