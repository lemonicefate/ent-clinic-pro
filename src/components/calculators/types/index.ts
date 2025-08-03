/**
 * 統一計算機類型系統
 * 
 * 這個檔案定義了所有計算機模組必須遵循的統一介面和類型。
 * 確保所有計算機模組的一致性和互操作性。
 */

// Common types
export type {
  SupportedLocale,
  RiskLevel,
  CalculatorStatus,
  FieldType,
  LocalizedString,
  ValidationError,
  ValidationResult,
  Reference,
  MedicalMetadata
} from './common';

// Config types
export type {
  CalculatorField,
  FieldOption,
  CalculatorConfig
} from './config';

// Result types
export type {
  CalculationResult,
  CalculationBreakdown,
  FormattedResult
} from './results';

// Calculator types
export type {
  CalculatorImplementation,
  CalculatorFormProps,
  CalculatorResultsProps,
  CalculatorMetadata,
  CalculatorModule,
  ModuleLoadResult,
  CalculatorContainerProps,
  SearchQuery
} from './calculator';