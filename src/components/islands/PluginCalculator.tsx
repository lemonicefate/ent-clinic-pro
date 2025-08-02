/**
 * Plugin-based Calculator Island Component
 * 
 * Refactored version following modular architecture principles.
 * This component now uses the plugin system and service layer
 * instead of hardcoded calculator implementations.
 */

import React, { useState, useEffect } from 'react';
import type { SupportedLocale } from '../../types/calculator.js';
import { SimpleCalculatorService } from '../../services/simple-calculator-service.js';
import CalculatorForm from '../common/CalculatorForm.js';
import CalculatorResults from '../common/CalculatorResults.js';

interface PluginCalculatorProps {
  /** Plugin ID in format 'namespace.id' */
  pluginId: string;

  /** Current locale */
  locale?: SupportedLocale;

  /** Theme preference */
  theme?: 'light' | 'dark';

  /** Accessibility settings */
  accessibility?: {
    highContrast: boolean;
    largeText: boolean;
    screenReader: boolean;
  };

  /** Custom CSS classes */
  className?: string;

  /** Error callback */
  onError?: (error: Error) => void;

  /** Loading callback */
  onLoadingChange?: (isLoading: boolean) => void;
}

export default function PluginCalculator({
  pluginId,
  locale = 'zh-TW',
  theme = 'light',
  accessibility,
  className = '',
  onError,
  onLoadingChange,
}: PluginCalculatorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculatorData, setCalculatorData] = useState<any>(null);
  const [generalError, setGeneralError] = useState<string>('');

  const calculatorService = SimpleCalculatorService.getInstance();

  // Initialize calculator
  useEffect(() => {
    let isMounted = true;

    const initializeCalculator = async () => {
      try {
        setIsLoading(true);
        setGeneralError('');
        onLoadingChange?.(true);

        console.log(`🔄 Loading calculator: ${pluginId}`);
        
        const data = await calculatorService.loadCalculator(pluginId);
        
        if (!isMounted) return;

        setCalculatorData(data);
        
        // Set default values from config
        const initialInputs: Record<string, any> = {};
        data.config.fields.forEach((field: any) => {
          if (field.defaultValue !== undefined) {
            initialInputs[field.id] = field.defaultValue;
          }
        });
        setInputs(initialInputs);

        console.log(`✅ Calculator loaded: ${pluginId}`);

      } catch (error) {
        console.error(`❌ Failed to load calculator ${pluginId}:`, error);
        
        if (!isMounted) return;
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setGeneralError(`載入計算器失敗: ${errorMessage}`);
        onError?.(error as Error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          onLoadingChange?.(false);
        }
      }
    };

    initializeCalculator();

    return () => {
      isMounted = false;
    };
  }, [pluginId, onError, onLoadingChange]);

  // Handle input changes
  const handleInputChange = (fieldId: string, value: any) => {
    setInputs(prev => ({ ...prev, [fieldId]: value }));
    setErrors(prev => ({ ...prev, [fieldId]: '' }));
    setGeneralError('');
  };

  // Handle form submission
  const handleCalculate = async () => {
    if (!calculatorData) return;

    try {
      setIsCalculating(true);
      setErrors({});
      setGeneralError('');

      console.log(`🧮 Calculating with inputs:`, inputs);

      // Validate inputs
      const validation = await calculatorService.validate(pluginId, inputs);
      if (!validation.isValid) {
        const fieldErrors: Record<string, string> = {};
        validation.errors.forEach((error: any) => {
          if (error.field && error.field !== 'general') {
            fieldErrors[error.field] = error.message;
          } else {
            setGeneralError(error.message);
          }
        });
        setErrors(fieldErrors);
        return;
      }

      // Perform calculation
      const calculationResult = await calculatorService.calculate(pluginId, inputs);
      
      console.log(`✅ Calculation completed:`, calculationResult);
      
      setResult(calculationResult);

    } catch (error) {
      console.error(`❌ Calculation failed for ${pluginId}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setGeneralError(`計算失敗: ${errorMessage}`);
      onError?.(error as Error);
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle form reset
  const handleReset = () => {
    setInputs({});
    setResult(null);
    setErrors({});
    setGeneralError('');
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className={`calculator-plugin ${className}`} data-theme={theme}>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">載入中...</span>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (generalError && !calculatorData) {
    return (
      <div className={`calculator-plugin ${className}`} data-theme={theme}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-red-800">{generalError}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!calculatorData) {
    return (
      <div className={`calculator-plugin ${className}`} data-theme={theme}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-yellow-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-yellow-800">找不到計算器: {pluginId}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`calculator-plugin ${className}`} data-theme={theme}>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {calculatorData.config.name}
        </h2>

        {calculatorData.config.description && (
          <p className="text-gray-600 mb-6">
            {calculatorData.config.description}
          </p>
        )}

        {/* General Error Display */}
        {generalError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{generalError}</p>
          </div>
        )}

        {/* Calculator Form */}
        <CalculatorForm
          fields={calculatorData.config.fields}
          values={inputs}
          onValueChange={handleInputChange}
          onSubmit={handleCalculate}
          onReset={handleReset}
          errors={errors}
          isLoading={isCalculating}
          locale={locale}
          theme={theme}
          className="mb-6"
        />

        {/* Results Display */}
        {result && (
          <CalculatorResults
            result={result}
            visualization={calculatorData.visualization}
            locale={locale}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
}