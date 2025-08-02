/**
 * Generic Calculator Form Component
 *
 * A reusable form component that dynamically renders form fields based on
 * configuration. This replaces the hardcoded form rendering in PluginCalculator.
 */

import React from 'react';
import type { SupportedLocale } from '../../types/calculator.js';

interface FormField {
  id: string;
  type: 'number' | 'select' | 'checkbox' | 'radio' | 'radio-cards' | 'text';
  label: string | Record<SupportedLocale, string>;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  defaultValue?: any;
  placeholder?: string;
  options?: Array<{
    value: string;
    label: string | Record<SupportedLocale, string>;
    description?: string;
    subtitle?: string;
  }>;
}

interface CalculatorFormProps {
  /** Form fields configuration */
  fields: FormField[];

  /** Current form values */
  values: Record<string, any>;

  /** Form value change handler */
  onValueChange: (fieldId: string, value: any) => void;

  /** Form submission handler */
  onSubmit: () => void;

  /** Form reset handler */
  onReset: () => void;

  /** Form validation errors */
  errors: Record<string, string>;

  /** Loading state */
  isLoading: boolean;

  /** Current locale */
  locale: SupportedLocale;

  /** Theme */
  theme?: 'light' | 'dark';

  /** Custom CSS classes */
  className?: string;
}

export default function CalculatorForm({
  fields,
  values,
  onValueChange,
  onSubmit,
  onReset,
  errors,
  isLoading,
  locale,
  theme = 'light',
  className = '',
}: CalculatorFormProps) {
  const getFieldLabel = (field: FormField): string => {
    if (typeof field.label === 'string') {
      return field.label;
    }
    return field.label[locale] || field.label['zh-TW'] || field.id;
  };

  const getOptionLabel = (option: any): string => {
    if (typeof option.label === 'string') {
      return option.label;
    }
    return option.label[locale] || option.label['zh-TW'] || option.value;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const renderField = (field: FormField) => {
    const value = values[field.id] || field.defaultValue || '';
    const error = errors[field.id];
    const label = getFieldLabel(field);

    return (
      <div key={field.id} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {field.unit && (
            <span className="text-gray-500 ml-1">({field.unit})</span>
          )}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {field.type === 'number' && (
          <input
            type="number"
            value={value}
            onChange={(e) => onValueChange(field.id, e.target.value)}
            min={field.min}
            max={field.max}
            step={field.step || 1}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={field.placeholder || `請輸入${label}`}
            disabled={isLoading}
          />
        )}

        {field.type === 'select' && (
          <select
            value={value}
            onChange={(e) => onValueChange(field.id, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          >
            <option value="">請選擇{label}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {getOptionLabel(option)}
              </option>
            ))}
          </select>
        )}

        {field.type === 'radio-cards' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field.options?.map((option) => (
              <div
                key={option.value}
                onClick={() =>
                  !isLoading && onValueChange(field.id, option.value)
                }
                className={`p-4 border-2 rounded-lg cursor-pointer text-center transition-all ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  value === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <h3 className="font-bold text-lg">{getOptionLabel(option)}</h3>
                {option.description && (
                  <p className="text-gray-600 font-medium">
                    {option.description}
                  </p>
                )}
                {option.subtitle && (
                  <p className="text-sm text-gray-500 mt-1">
                    {option.subtitle}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {field.type === 'checkbox' && (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onValueChange(field.id, e.target.checked)}
              className="mr-2"
              disabled={isLoading}
            />
            <span className="text-sm text-gray-600">是</span>
          </label>
        )}

        {field.type === 'radio' && (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name={field.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onValueChange(field.id, e.target.value)}
                  className="mr-2"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700">
                  {getOptionLabel(option)}
                </span>
              </label>
            ))}
          </div>
        )}

        {field.type === 'text' && (
          <input
            type="text"
            value={value}
            onChange={(e) => onValueChange(field.id, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={field.placeholder || `請輸入${label}`}
            disabled={isLoading}
          />
        )}

        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  };

  return (
    <div className={`calculator-form ${className}`} data-theme={theme}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form Fields */}
        <div className="space-y-4">{fields.map(renderField)}</div>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {isLoading ? '計算中...' : '計算'}
          </button>

          <button
            type="button"
            onClick={onReset}
            disabled={isLoading}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            重設
          </button>
        </div>
      </form>
    </div>
  );
}
