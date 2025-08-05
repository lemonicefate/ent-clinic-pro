/**
 * Amoxicillin/Clavulanate 劑量計算表單組件
 */

import React from 'react';
import { CalculatorFormProps } from '../../types';

const AmoxicillinClavulanateForm: React.FC<CalculatorFormProps> = ({
  values,
  errors,
  touched,
  onChange,
  onBlur,
  onSubmit,
  onReset,
  isLoading,
  locale,
  className = ''
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        輸入參數
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 體重輸入 */}
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
            體重 (kg)
          </label>
          <input
            type="number"
            id="weight"
            value={values.weight || ''}
            onChange={(e) => onChange('weight', parseFloat(e.target.value) || 0)}
            onBlur={() => onBlur('weight')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="例如：25"
            min="1"
            max="100"
            step="0.1"
            required
          />
          {errors.weight && (
            <p className="mt-1 text-sm text-red-600">{errors.weight}</p>
          )}
        </div>

        {/* 劑量選擇 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            劑量選擇
          </label>
          <div className="space-y-3">
            <label className="flex items-start cursor-pointer">
              <input
                type="radio"
                name="doseTarget"
                value="normal"
                checked={values.doseTarget === 'normal'}
                onChange={(e) => onChange('doseTarget', e.target.value)}
                onBlur={() => onBlur('doseTarget')}
                className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">正常劑量</div>
                <div className="text-xs text-gray-500">45 mg/kg/day - 適用於一般感染</div>
              </div>
            </label>
            <label className="flex items-start cursor-pointer">
              <input
                type="radio"
                name="doseTarget"
                value="high"
                checked={values.doseTarget === 'high'}
                onChange={(e) => onChange('doseTarget', e.target.value)}
                onBlur={() => onBlur('doseTarget')}
                className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">高劑量</div>
                <div className="text-xs text-gray-500">80-90 mg/kg/day - 適用於頑固細菌感染</div>
              </div>
            </label>
          </div>
          {errors.doseTarget && (
            <p className="mt-1 text-sm text-red-600">{errors.doseTarget}</p>
          )}
        </div>

        {/* 按鈕組 */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                計算中...
              </div>
            ) : (
              '計算劑量'
            )}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            重設
          </button>
        </div>
      </form>
    </div>
  );
};

export default AmoxicillinClavulanateForm;