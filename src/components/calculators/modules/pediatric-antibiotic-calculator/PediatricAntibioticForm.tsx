/**
 * 兒童抗生素劑量計算表單組件
 */

import React from 'react';
import { CalculatorFormProps } from '../../types';

const PediatricAntibioticForm: React.FC<CalculatorFormProps> = ({
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
          兒童體重 (kg) *
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
        <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
          兒童年齡 (歲) - 選填
        </label>
        <input
          type="number"
          id="age"
          value={values.age || ''}
          onChange={(e) => onChange('age', e.target.value ? parseInt(e.target.value) : undefined)}
          onBlur={() => onBlur('age')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="部分藥物計算所需"
          min="0"
          max="18"
        />
        <p className="mt-1 text-xs text-gray-500">年齡資訊有助於判斷藥物適用性</p>
        {errors.age && (
          <p className="mt-1 text-sm text-red-600">{errors.age}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          藥物劑型 *
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="form"
              value="powder"
              checked={values.form === 'powder'}
              onChange={(e) => onChange('form', e.target.value)}
              onBlur={() => onBlur('form')}
              className="mr-2"
            />
            <span>藥粉</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="form"
              value="pill"
              checked={values.form === 'pill'}
              onChange={(e) => onChange('form', e.target.value)}
              onBlur={() => onBlur('form')}
              className="mr-2"
            />
            <span>藥錠/膠囊</span>
          </label>
        </div>
        {errors.form && (
          <p className="mt-1 text-sm text-red-600">{errors.form}</p>
        )}
      </div>

      <div>
        <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-2">
          用藥頻次 *
        </label>
        <select
          id="frequency"
          value={values.frequency || '3'}
          onChange={(e) => onChange('frequency', e.target.value)}
          onBlur={() => onBlur('frequency')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="1">1 次 (QD)</option>
          <option value="2">2 次 (BID)</option>
          <option value="3">3 次 (TID)</option>
          <option value="4">4 次 (QID)</option>
        </select>
        {errors.frequency && (
          <p className="mt-1 text-sm text-red-600">{errors.frequency}</p>
        )}
      </div>

      <div>
        <label htmlFor="days" className="block text-sm font-medium text-gray-700 mb-2">
          治療天數 *
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

export default PediatricAntibioticForm;