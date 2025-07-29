/**
 * 動態表單生成器
 * 
 * 基於配置動態生成醫療計算機表單，支援：
 * - 多種欄位類型 (number, select, checkbox, radio, range)
 * - 即時驗證和錯誤提示
 * - 條件顯示和欄位依賴邏輯
 * - 無障礙支援和國際化
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { SupportedLocale } from '../../env.d';
import type { FieldValue, ValidationError } from '../../utils/calculator-engine';

// ============================================================================
// 類型定義
// ============================================================================

export interface FormField {
  id: string;
  type: 'number' | 'select' | 'checkbox' | 'radio' | 'range' | 'text' | 'boolean';
  label: Record<string, string>;
  description?: Record<string, string>;
  placeholder?: Record<string, string>;
  required?: boolean;
  defaultValue?: FieldValue;
  
  // 數值欄位屬性
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  
  // 選擇欄位屬性
  options?: Array<{
    value: string | number | boolean;
    label: Record<string, string>;
    description?: Record<string, string>;
    disabled?: boolean;
  }>;
  
  // 條件顯示
  condition?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
    value: FieldValue;
  };
  
  // 驗證規則
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    custom?: (value: FieldValue) => string | null;
  };
  
  // UI 屬性
  className?: string;
  disabled?: boolean;
  readonly?: boolean;
  autoFocus?: boolean;
  
  // 醫療特定屬性
  medical?: {
    category?: string;
    riskLevel?: 'low' | 'medium' | 'high';
    clinicalSignificance?: string;
  };
}

export interface FormSection {
  id: string;
  title: Record<string, string>;
  description?: Record<string, string>;
  fields: FormField[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
  condition?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than';
    value: FieldValue;
  };
}

export interface FormConfig {
  id: string;
  title: Record<string, string>;
  description?: Record<string, string>;
  sections?: FormSection[];
  fields?: FormField[];
  layout?: 'single-column' | 'two-column' | 'grid' | 'accordion';
  validation?: {
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    showErrorsImmediately?: boolean;
  };
}

interface CalculatorFormProps {
  config: FormConfig;
  values: Record<string, FieldValue>;
  errors: ValidationError[];
  touched: Record<string, boolean>;
  locale: SupportedLocale;
  disabled?: boolean;
  onChange: (fieldId: string, value: FieldValue) => void;
  onBlur: (fieldId: string) => void;
  onValidate?: (fieldId: string, value: FieldValue) => Promise<string | null>;
  className?: string;
}

// ============================================================================
// 輔助函數
// ============================================================================

const evaluateCondition = (
  condition: FormField['condition'] | FormSection['condition'],
  values: Record<string, FieldValue>
): boolean => {
  if (!condition) return true;
  
  const fieldValue = values[condition.field];
  const conditionValue = condition.value;
  
  switch (condition.operator) {
    case 'equals':
      return fieldValue === conditionValue;
    case 'not_equals':
      return fieldValue !== conditionValue;
    case 'greater_than':
      return typeof fieldValue === 'number' && typeof conditionValue === 'number' 
        ? fieldValue > conditionValue : false;
    case 'less_than':
      return typeof fieldValue === 'number' && typeof conditionValue === 'number' 
        ? fieldValue < conditionValue : false;
    case 'contains':
      return typeof fieldValue === 'string' && typeof conditionValue === 'string'
        ? fieldValue.includes(conditionValue) : false;
    case 'not_contains':
      return typeof fieldValue === 'string' && typeof conditionValue === 'string'
        ? !fieldValue.includes(conditionValue) : true;
    default:
      return true;
  }
};

const getFieldLabel = (field: FormField, locale: SupportedLocale): string => {
  return field.label[locale] || field.label['zh-TW'] || field.label['en'] || field.id;
};

const getFieldDescription = (field: FormField, locale: SupportedLocale): string | undefined => {
  return field.description?.[locale] || field.description?.['zh-TW'] || field.description?.['en'];
};

const getFieldPlaceholder = (field: FormField, locale: SupportedLocale): string | undefined => {
  return field.placeholder?.[locale] || field.placeholder?.['zh-TW'] || field.placeholder?.['en'];
};

// ============================================================================
// 欄位渲染組件
// ============================================================================

interface FieldRendererProps {
  field: FormField;
  value: FieldValue;
  error?: ValidationError;
  touched: boolean;
  locale: SupportedLocale;
  disabled: boolean;
  onChange: (value: FieldValue) => void;
  onBlur: () => void;
}

const NumberField: React.FC<FieldRendererProps> = ({
  field, value, error, touched, locale, disabled, onChange, onBlur
}) => {
  const fieldLabel = getFieldLabel(field, locale);
  const fieldDescription = getFieldDescription(field, locale);
  const fieldPlaceholder = getFieldPlaceholder(field, locale);
  
  const hasError = error && touched;
  
  return (
    <div className="form-field form-field-number">
      <label htmlFor={field.id} className="form-field-label">
        {fieldLabel}
        {field.required && <span className="form-field-required">*</span>}
      </label>
      
      {fieldDescription && (
        <p className="form-field-description">{fieldDescription}</p>
      )}
      
      <div className="form-field-input-wrapper">
        <input
          type="number"
          id={field.id}
          value={typeof value === 'number' ? value : ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          onBlur={onBlur}
          min={field.min}
          max={field.max}
          step={field.step || 1}
          placeholder={fieldPlaceholder}
          disabled={disabled || field.disabled}
          readOnly={field.readonly}
          autoFocus={field.autoFocus}
          className={`form-field-input ${hasError ? 'form-field-input-error' : ''} ${field.className || ''}`}
          aria-describedby={hasError ? `${field.id}-error` : undefined}
          aria-invalid={hasError}
        />
        
        {field.unit && (
          <div className="form-field-unit">{field.unit}</div>
        )}
      </div>
      
      {hasError && (
        <p id={`${field.id}-error`} className="form-field-error" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
};

const SelectField: React.FC<FieldRendererProps> = ({
  field, value, error, touched, locale, disabled, onChange, onBlur
}) => {
  const fieldLabel = getFieldLabel(field, locale);
  const fieldDescription = getFieldDescription(field, locale);
  
  const hasError = error && touched;
  
  return (
    <div className="form-field form-field-select">
      <label htmlFor={field.id} className="form-field-label">
        {fieldLabel}
        {field.required && <span className="form-field-required">*</span>}
      </label>
      
      {fieldDescription && (
        <p className="form-field-description">{fieldDescription}</p>
      )}
      
      <select
        id={field.id}
        value={value?.toString() || ''}
        onChange={(e) => {
          const selectedValue = e.target.value;
          const option = field.options?.find(opt => opt.value.toString() === selectedValue);
          onChange(option ? option.value : selectedValue);
        }}
        onBlur={onBlur}
        disabled={disabled || field.disabled}
        className={`form-field-input form-field-select-input ${hasError ? 'form-field-input-error' : ''} ${field.className || ''}`}
        aria-describedby={hasError ? `${field.id}-error` : undefined}
        aria-invalid={hasError}
      >
        <option value="">請選擇...</option>
        {field.options?.map((option, index) => (
          <option 
            key={index} 
            value={option.value.toString()}
            disabled={option.disabled}
          >
            {option.label[locale] || option.label['zh-TW'] || option.label['en'] || option.value.toString()}
          </option>
        ))}
      </select>
      
      {hasError && (
        <p id={`${field.id}-error`} className="form-field-error" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
};

const CheckboxField: React.FC<FieldRendererProps> = ({
  field, value, error, touched, locale, disabled, onChange, onBlur
}) => {
  const fieldLabel = getFieldLabel(field, locale);
  const fieldDescription = getFieldDescription(field, locale);
  
  const hasError = error && touched;
  
  return (
    <div className="form-field form-field-checkbox">
      <div className="form-field-checkbox-wrapper">
        <input
          type="checkbox"
          id={field.id}
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          onBlur={onBlur}
          disabled={disabled || field.disabled}
          className={`form-field-checkbox-input ${hasError ? 'form-field-input-error' : ''} ${field.className || ''}`}
          aria-describedby={hasError ? `${field.id}-error` : undefined}
          aria-invalid={hasError}
        />
        
        <label htmlFor={field.id} className="form-field-checkbox-label">
          {fieldLabel}
          {field.required && <span className="form-field-required">*</span>}
        </label>
      </div>
      
      {fieldDescription && (
        <p className="form-field-description">{fieldDescription}</p>
      )}
      
      {hasError && (
        <p id={`${field.id}-error`} className="form-field-error" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
};

const RadioField: React.FC<FieldRendererProps> = ({
  field, value, error, touched, locale, disabled, onChange, onBlur
}) => {
  const fieldLabel = getFieldLabel(field, locale);
  const fieldDescription = getFieldDescription(field, locale);
  
  const hasError = error && touched;
  
  return (
    <div className="form-field form-field-radio">
      <fieldset className="form-field-radio-fieldset">
        <legend className="form-field-label">
          {fieldLabel}
          {field.required && <span className="form-field-required">*</span>}
        </legend>
        
        {fieldDescription && (
          <p className="form-field-description">{fieldDescription}</p>
        )}
        
        <div className="form-field-radio-options">
          {field.options?.map((option, index) => (
            <div key={index} className="form-field-radio-option">
              <input
                type="radio"
                id={`${field.id}-${index}`}
                name={field.id}
                value={option.value.toString()}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                onBlur={onBlur}
                disabled={disabled || field.disabled || option.disabled}
                className={`form-field-radio-input ${hasError ? 'form-field-input-error' : ''}`}
                aria-describedby={hasError ? `${field.id}-error` : undefined}
              />
              
              <label htmlFor={`${field.id}-${index}`} className="form-field-radio-label">
                {option.label[locale] || option.label['zh-TW'] || option.label['en'] || option.value.toString()}
              </label>
              
              {option.description && (
                <p className="form-field-radio-description">
                  {option.description[locale] || option.description['zh-TW'] || option.description['en']}
                </p>
              )}
            </div>
          ))}
        </div>
      </fieldset>
      
      {hasError && (
        <p id={`${field.id}-error`} className="form-field-error" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
};

const RangeField: React.FC<FieldRendererProps> = ({
  field, value, error, touched, locale, disabled, onChange, onBlur
}) => {
  const fieldLabel = getFieldLabel(field, locale);
  const fieldDescription = getFieldDescription(field, locale);
  
  const hasError = error && touched;
  const numericValue = typeof value === 'number' ? value : field.min || 0;
  
  return (
    <div className="form-field form-field-range">
      <label htmlFor={field.id} className="form-field-label">
        {fieldLabel}
        {field.required && <span className="form-field-required">*</span>}
      </label>
      
      {fieldDescription && (
        <p className="form-field-description">{fieldDescription}</p>
      )}
      
      <div className="form-field-range-wrapper">
        <input
          type="range"
          id={field.id}
          value={numericValue}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onBlur={onBlur}
          min={field.min || 0}
          max={field.max || 100}
          step={field.step || 1}
          disabled={disabled || field.disabled}
          className={`form-field-range-input ${hasError ? 'form-field-input-error' : ''} ${field.className || ''}`}
          aria-describedby={hasError ? `${field.id}-error` : undefined}
          aria-invalid={hasError}
        />
        
        <div className="form-field-range-value">
          {numericValue} {field.unit}
        </div>
        
        <div className="form-field-range-labels">
          <span className="form-field-range-min">{field.min || 0}</span>
          <span className="form-field-range-max">{field.max || 100}</span>
        </div>
      </div>
      
      {hasError && (
        <p id={`${field.id}-error`} className="form-field-error" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
};

// ============================================================================
// 欄位渲染器
// ============================================================================

const FieldRenderer: React.FC<FieldRendererProps> = (props) => {
  switch (props.field.type) {
    case 'number':
      return <NumberField {...props} />;
    case 'select':
      return <SelectField {...props} />;
    case 'checkbox':
    case 'boolean':
      return <CheckboxField {...props} />;
    case 'radio':
      return <RadioField {...props} />;
    case 'range':
      return <RangeField {...props} />;
    default:
      return <NumberField {...props} />; // 預設為數字欄位
  }
};

// ============================================================================
// 主要組件
// ============================================================================

export const CalculatorForm: React.FC<CalculatorFormProps> = ({
  config,
  values,
  errors,
  touched,
  locale,
  disabled = false,
  onChange,
  onBlur,
  onValidate,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // 初始化展開狀態
  useEffect(() => {
    if (config.sections) {
      const initialExpanded: Record<string, boolean> = {};
      config.sections.forEach(section => {
        initialExpanded[section.id] = section.defaultExpanded !== false;
      });
      setExpandedSections(initialExpanded);
    }
  }, [config.sections]);

  // 切換區段展開狀態
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  // 過濾可見欄位
  const getVisibleFields = useCallback((fields: FormField[]): FormField[] => {
    return fields.filter(field => evaluateCondition(field.condition, values));
  }, [values]);

  // 過濾可見區段
  const getVisibleSections = useCallback((sections: FormSection[]): FormSection[] => {
    return sections.filter(section => evaluateCondition(section.condition, values));
  }, [values]);

  // 渲染欄位
  const renderField = useCallback((field: FormField) => {
    const fieldError = errors.find(e => e.field === field.id);
    const fieldTouched = touched[field.id] || false;
    const fieldValue = values[field.id];

    return (
      <FieldRenderer
        key={field.id}
        field={field}
        value={fieldValue}
        error={fieldError}
        touched={fieldTouched}
        locale={locale}
        disabled={disabled}
        onChange={(value) => onChange(field.id, value)}
        onBlur={() => onBlur(field.id)}
      />
    );
  }, [values, errors, touched, locale, disabled, onChange, onBlur]);

  // 渲染區段
  const renderSection = useCallback((section: FormSection) => {
    const visibleFields = getVisibleFields(section.fields);
    const isExpanded = expandedSections[section.id];
    const sectionTitle = section.title[locale] || section.title['zh-TW'] || section.title['en'];
    const sectionDescription = section.description?.[locale] || section.description?.['zh-TW'] || section.description?.['en'];

    if (visibleFields.length === 0) return null;

    return (
      <div key={section.id} className="form-section">
        {section.collapsible ? (
          <button
            type="button"
            onClick={() => toggleSection(section.id)}
            className="form-section-toggle"
            aria-expanded={isExpanded}
            aria-controls={`section-${section.id}`}
          >
            <span className="form-section-title">{sectionTitle}</span>
            <span className={`form-section-icon ${isExpanded ? 'expanded' : ''}`}>
              ▼
            </span>
          </button>
        ) : (
          <h3 className="form-section-title">{sectionTitle}</h3>
        )}
        
        {sectionDescription && (
          <p className="form-section-description">{sectionDescription}</p>
        )}
        
        <div
          id={`section-${section.id}`}
          className={`form-section-content ${!isExpanded && section.collapsible ? 'collapsed' : ''}`}
        >
          <div className="form-section-fields">
            {visibleFields.map(renderField)}
          </div>
        </div>
      </div>
    );
  }, [expandedSections, getVisibleFields, locale, renderField, toggleSection]);

  // 主要渲染
  const formTitle = config.title[locale] || config.title['zh-TW'] || config.title['en'];
  const formDescription = config.description?.[locale] || config.description?.['zh-TW'] || config.description?.['en'];

  return (
    <div className={`calculator-form calculator-form-${config.layout || 'single-column'} ${className}`}>
      {formTitle && (
        <h2 className="calculator-form-title">{formTitle}</h2>
      )}
      
      {formDescription && (
        <p className="calculator-form-description">{formDescription}</p>
      )}
      
      <div className="calculator-form-content">
        {config.sections ? (
          // 區段模式
          <div className="calculator-form-sections">
            {getVisibleSections(config.sections).map(renderSection)}
          </div>
        ) : (
          // 簡單欄位模式
          <div className="calculator-form-fields">
            {config.fields && getVisibleFields(config.fields).map(renderField)}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalculatorForm;