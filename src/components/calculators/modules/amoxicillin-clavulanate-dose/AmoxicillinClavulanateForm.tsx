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
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      <div>
        <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
          兒童體重 (kg)
        </label>
        <input
          type="number"
          id="weight"
          value={values.weight || ''}
          onChange={(e) => onChange('weight', parseFloat(e.target.value) || 0)}
          onBlur={() => onBlur('weight')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="請輸入體重"
          min="1"
          max="100"
          step="0.1"
          required
        />
        {errors.weight && (
          <p className="mt-1 text-sm text-red-600">{errors.weight}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amoxicillin 劑量目標
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="doseTarget"
              value="low"
              checked={values.doseTarget === 'low'}
              onChange={(e) => onChange('doseTarget', e.target.value)}
              onBlur={() => onBlur('doseTarget')}
              className="mr-2"
            />
            <span>標準劑量 (45 mg/kg/day) - 適用於一般感染</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="doseTarget"
              value="high"
              checked={values.doseTarget === 'high'}
              onChange={(e) => onChange('doseTarget', e.target.value)}
              onBlur={() => onBlur('doseTarget')}
              className="mr-2"
            />
            <span>高劑量 (80-90 mg/kg/day) - 適用於頑固細菌感染</span>
          </label>
        </div>
        {errors.doseTarget && (
          <p className="mt-1 text-sm text-red-600">{errors.doseTarget}</p>
        )}
      </div>

      <div>
        <label htmlFor="days" className="block text-sm font-medium text-gray-700 mb-2">
          治療天數
        </label>
        <select
          id="days"
          value={values.days || '3'}
          onChange={(e) => onChange('days', e.target.value)}
          onBlur={() => onBlur('days')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="1">1 天</option>
          <option value="2">2 天</option>
          <option value="3">3 天</option>
          <option value="4">4 天</option>
          <option value="5">5 天</option>
        </select>
        {errors.days && (
          <p className="mt-1 text-sm text-red-600">{errors.days}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isLoading ? '計算中...' : '計算劑量'}
      </button>
    </form>
  );
};

export default AmoxicillinClavulanateForm;