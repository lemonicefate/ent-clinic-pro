/**
 * eGFR 計算機表單組件
 */

import React, { useState, useCallback } from 'react';
import { EGFRInputs } from './types';
import { config } from './config';
import type { SupportedLocale } from '../../types';

interface EGFRFormProps {
  onCalculate: (inputs: EGFRInputs) => void;
  locale?: SupportedLocale;
  isLoading?: boolean;
}

const EGFRForm: React.FC<EGFRFormProps> = ({ 
  onCalculate, 
  locale = 'zh-TW',
  isLoading = false 
}) => {
  const [inputs, setInputs] = useState<EGFRInputs>({
    creatinine: 0,
    age: 0,
    gender: 'male'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = useCallback((field: keyof EGFRInputs, value: any) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // 基本驗證
    const newErrors: Record<string, string> = {};
    
    if (!inputs.creatinine || inputs.creatinine <= 0) {
      newErrors.creatinine = '請輸入有效的肌酸酐值';
    } else if (inputs.creatinine < 0.1 || inputs.creatinine > 20.0) {
      newErrors.creatinine = '肌酸酐值必須在 0.1-20.0 mg/dL 之間';
    }
    
    if (!inputs.age || inputs.age <= 0) {
      newErrors.age = '請輸入有效的年齡';
    } else if (inputs.age < 18 || inputs.age > 120) {
      newErrors.age = '年齡必須在 18-120 歲之間';
    }
    
    if (!inputs.gender) {
      newErrors.gender = '請選擇性別';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onCalculate(inputs);
  }, [inputs, onCalculate]);

  const creatinineField = config.fields.find(f => f.id === 'creatinine');
  const ageField = config.fields.find(f => f.id === 'age');
  const genderField = config.fields.find(f => f.id === 'gender');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 血清肌酸酐 */}
      <div>
        <label htmlFor="creatinine" className="block text-sm font-medium text-gray-700 mb-2">
          {creatinineField?.label[locale] || creatinineField?.label['zh-TW']}
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            id="creatinine"
            value={inputs.creatinine || ''}
            onChange={(e) => handleInputChange('creatinine', parseFloat(e.target.value) || 0)}
            placeholder={creatinineField?.placeholder?.[locale] || creatinineField?.placeholder?.['zh-TW']}
            min={creatinineField?.min}
            max={creatinineField?.max}
            step={creatinineField?.step}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.creatinine ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-500 text-sm">{creatinineField?.unit}</span>
          </div>
        </div>
        {creatinineField?.helpText && (
          <p className="mt-1 text-sm text-gray-600">
            {creatinineField.helpText[locale] || creatinineField.helpText['zh-TW']}
          </p>
        )}
        {errors.creatinine && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.creatinine}
          </p>
        )}
      </div>

      {/* 年齡 */}
      <div>
        <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
          {ageField?.label[locale] || ageField?.label['zh-TW']}
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            id="age"
            value={inputs.age || ''}
            onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
            placeholder={ageField?.placeholder?.[locale] || ageField?.placeholder?.['zh-TW']}
            min={ageField?.min}
            max={ageField?.max}
            step={ageField?.step}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.age ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-500 text-sm">{ageField?.unit}</span>
          </div>
        </div>
        {ageField?.helpText && (
          <p className="mt-1 text-sm text-gray-600">
            {ageField.helpText[locale] || ageField.helpText['zh-TW']}
          </p>
        )}
        {errors.age && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.age}
          </p>
        )}
      </div>

      {/* 性別 */}
      <div>
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
          {genderField?.label[locale] || genderField?.label['zh-TW']}
          <span className="text-red-500 ml-1">*</span>
        </label>
        <select
          id="gender"
          value={inputs.gender}
          onChange={(e) => handleInputChange('gender', e.target.value as 'male' | 'female')}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            errors.gender ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          disabled={isLoading}
        >
          <option value="">請選擇性別</option>
          {genderField?.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label[locale] || option.label['zh-TW']}
            </option>
          ))}
        </select>
        {genderField?.helpText && (
          <p className="mt-1 text-sm text-gray-600">
            {genderField.helpText[locale] || genderField.helpText['zh-TW']}
          </p>
        )}
        {errors.gender && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.gender}
          </p>
        )}
      </div>

      {/* 提交按鈕 */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              計算中...
            </div>
          ) : (
            '計算 eGFR'
          )}
        </button>
      </div>

      {/* 公式說明 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
          <svg className="h-4 w-4 text-gray-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          CKD-EPI 2021 公式
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          本計算器使用最新的 CKD-EPI 2021 公式，該公式移除了種族係數，提供更準確和公平的腎功能評估。
          適用於 18 歲以上成人，結果單位為 mL/min/1.73m²。
        </p>
      </div>
    </form>
  );
};

export default EGFRForm;