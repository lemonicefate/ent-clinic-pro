/**
 * CHA2DS2-VASc 計算機表單組件
 */

import React, { useState, useCallback } from 'react';
import { CHA2DS2VAScInputs } from './types';
import { config } from './config';
import type { SupportedLocale } from '../../types';

interface CHA2DS2VAScFormProps {
  onCalculate: (inputs: CHA2DS2VAScInputs) => void;
  locale?: SupportedLocale;
  isLoading?: boolean;
}

const CHA2DS2VAScForm: React.FC<CHA2DS2VAScFormProps> = ({ 
  onCalculate, 
  locale = 'zh-TW',
  isLoading = false 
}) => {
  const [inputs, setInputs] = useState<CHA2DS2VAScInputs>({
    age: 0,
    gender: 'male',
    congestiveHeartFailure: false,
    hypertension: false,
    diabetes: false,
    strokeTiaHistory: false,
    vascularDisease: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = useCallback((field: keyof CHA2DS2VAScInputs, value: any) => {
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

  const ageField = config.fields.find(f => f.id === 'age');
  const genderField = config.fields.find(f => f.id === 'gender');
  const checkboxFields = config.fields.filter(f => f.type === 'checkbox');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* 風險因子檢查項目 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">風險因子評估</h3>
        <div className="space-y-4">
          {checkboxFields.map((field) => {
            const fieldId = field.id as keyof CHA2DS2VAScInputs;
            const isChecked = inputs[fieldId] as boolean;
            
            return (
              <div key={field.id} className="relative">
                <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleInputChange(fieldId, e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={isLoading}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {field.label[locale] || field.label['zh-TW']}
                      </span>
                      <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {field.id === 'strokeTiaHistory' ? '2分' : '1分'}
                      </span>
                    </div>
                    {field.helpText && (
                      <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                        {field.helpText[locale] || field.helpText['zh-TW']}
                      </p>
                    )}
                  </div>
                </label>
              </div>
            );
          })}
        </div>
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
            '計算 CHA2DS2-VASc 評分'
          )}
        </button>
      </div>

      {/* 評分說明 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
          <svg className="h-4 w-4 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          CHA2DS2-VASc 評分說明
        </h3>
        <div className="text-xs text-blue-800 space-y-1">
          <p>• <strong>C</strong>ongestive heart failure (充血性心衰竭) - 1分</p>
          <p>• <strong>H</strong>ypertension (高血壓) - 1分</p>
          <p>• <strong>A</strong>ge ≥75 years (年齡≥75歲) - 2分</p>
          <p>• <strong>D</strong>iabetes mellitus (糖尿病) - 1分</p>
          <p>• <strong>S</strong>troke/TIA/Thromboembolism history (中風/TIA/血栓栓塞病史) - 2分</p>
          <p>• <strong>V</strong>ascular disease (血管疾病) - 1分</p>
          <p>• <strong>A</strong>ge 65-74 years (年齡65-74歲) - 1分</p>
          <p>• <strong>Sc</strong> Sex category (性別：女性) - 1分</p>
        </div>
      </div>

      {/* 重要提醒 */}
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <svg className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-yellow-800 mb-1">重要提醒</h4>
            <p className="text-xs text-yellow-700">
              此評分僅適用於非瓣膜性心房顫動患者。抗凝治療決策還需考慮出血風險（建議使用 HAS-BLED 評分）和患者個人因素。
            </p>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CHA2DS2VAScForm;