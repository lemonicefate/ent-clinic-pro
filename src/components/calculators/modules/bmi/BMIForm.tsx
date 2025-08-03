/**
 * BMI 計算機專用表單組件
 * 
 * 專為 BMI 計算機設計的表單，提供最佳的使用者體驗。
 */

import React from 'react';
import { CalculatorFormProps } from '../../types';

const BMIForm: React.FC<CalculatorFormProps> = ({
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

  const getFieldLabel = (key: string) => {
    const labels = {
      weight: {
        'zh-TW': '體重',
        'en': 'Weight',
        'ja': '体重'
      },
      height: {
        'zh-TW': '身高',
        'en': 'Height',
        'ja': '身長'
      },
      age: {
        'zh-TW': '年齡',
        'en': 'Age',
        'ja': '年齢'
      },
      gender: {
        'zh-TW': '性別',
        'en': 'Gender',
        'ja': '性別'
      }
    };
    return labels[key as keyof typeof labels]?.[locale] || labels[key as keyof typeof labels]?.['zh-TW'] || key;
  };

  const getPlaceholder = (key: string) => {
    const placeholders = {
      weight: {
        'zh-TW': '例如：70',
        'en': 'e.g., 70',
        'ja': '例：70'
      },
      height: {
        'zh-TW': '例如：170',
        'en': 'e.g., 170',
        'ja': '例：170'
      },
      age: {
        'zh-TW': '例如：30',
        'en': 'e.g., 30',
        'ja': '例：30'
      }
    };
    return placeholders[key as keyof typeof placeholders]?.[locale] || placeholders[key as keyof typeof placeholders]?.['zh-TW'] || '';
  };

  const getHelpText = (key: string) => {
    const helpTexts = {
      weight: {
        'zh-TW': '請輸入您的體重，單位為公斤',
        'en': 'Enter your weight in kilograms',
        'ja': '体重をキログラムで入力してください'
      },
      height: {
        'zh-TW': '請輸入您的身高，單位為公分',
        'en': 'Enter your height in centimeters',
        'ja': '身長をセンチメートルで入力してください'
      },
      age: {
        'zh-TW': '年齡用於提供更精確的健康建議（選填）',
        'en': 'Age is used to provide more accurate health recommendations (optional)',
        'ja': '年齢はより正確な健康アドバイスを提供するために使用されます（任意）'
      },
      gender: {
        'zh-TW': '性別用於提供更個人化的健康建議（選填）',
        'en': 'Gender is used to provide more personalized health recommendations (optional)',
        'ja': '性別はより個人化された健康アドバイスを提供するために使用されます（任意）'
      }
    };
    return helpTexts[key as keyof typeof helpTexts]?.[locale] || helpTexts[key as keyof typeof helpTexts]?.['zh-TW'] || '';
  };

  return (
    <div className={`bmi-form ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 體重輸入 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {getFieldLabel('weight')} *
            <span className="text-gray-500 ml-1">(kg)</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={values.weight || ''}
              onChange={(e) => onChange('weight', parseFloat(e.target.value) || 0)}
              onBlur={() => onBlur('weight')}
              min={20}
              max={300}
              step={0.1}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.weight ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={getPlaceholder('weight')}
              disabled={isLoading}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm">kg</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {getHelpText('weight')}
          </p>
          {errors.weight && touched.weight && (
            <p className="mt-1 text-sm text-red-600">{errors.weight}</p>
          )}
        </div>

        {/* 身高輸入 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {getFieldLabel('height')} *
            <span className="text-gray-500 ml-1">(cm)</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={values.height || ''}
              onChange={(e) => onChange('height', parseFloat(e.target.value) || 0)}
              onBlur={() => onBlur('height')}
              min={100}
              max={250}
              step={0.1}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.height ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={getPlaceholder('height')}
              disabled={isLoading}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm">cm</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {getHelpText('height')}
          </p>
          {errors.height && touched.height && (
            <p className="mt-1 text-sm text-red-600">{errors.height}</p>
          )}
        </div>

        {/* 年齡輸入（選填） */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {getFieldLabel('age')}
            <span className="text-gray-500 ml-1">(歲)</span>
            <span className="text-gray-400 ml-1 text-xs">- 選填</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={values.age || ''}
              onChange={(e) => onChange('age', e.target.value ? parseInt(e.target.value) : undefined)}
              onBlur={() => onBlur('age')}
              min={2}
              max={120}
              step={1}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.age ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={getPlaceholder('age')}
              disabled={isLoading}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm">歲</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {getHelpText('age')}
          </p>
          {errors.age && touched.age && (
            <p className="mt-1 text-sm text-red-600">{errors.age}</p>
          )}
        </div>

        {/* 性別選擇（選填） */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {getFieldLabel('gender')}
            <span className="text-gray-400 ml-1 text-xs">- 選填</span>
          </label>
          <select
            value={values.gender || ''}
            onChange={(e) => onChange('gender', e.target.value || undefined)}
            onBlur={() => onBlur('gender')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.gender ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          >
            <option value="">請選擇性別</option>
            <option value="male">
              {locale === 'zh-TW' ? '男性' : locale === 'en' ? 'Male' : '男性'}
            </option>
            <option value="female">
              {locale === 'zh-TW' ? '女性' : locale === 'en' ? 'Female' : '女性'}
            </option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {getHelpText('gender')}
          </p>
          {errors.gender && touched.gender && (
            <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
          )}
        </div>

        {/* 操作按鈕 */}
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {isLoading 
              ? (locale === 'zh-TW' ? '計算中...' : locale === 'en' ? 'Calculating...' : '計算中...')
              : (locale === 'zh-TW' ? '計算 BMI' : locale === 'en' ? 'Calculate BMI' : 'BMI計算')
            }
          </button>

          <button
            type="button"
            onClick={onReset}
            disabled={isLoading}
            className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {locale === 'zh-TW' ? '重設' : locale === 'en' ? 'Reset' : 'リセット'}
          </button>
        </div>

        {/* 必填欄位說明 */}
        <div className="text-xs text-gray-500 pt-2">
          * {locale === 'zh-TW' ? '必填欄位' : locale === 'en' ? 'Required fields' : '必須項目'}
        </div>
      </form>

      {/* BMI 快速參考 */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          {locale === 'zh-TW' ? 'BMI 分類參考' : locale === 'en' ? 'BMI Categories Reference' : 'BMI分類参考'}
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">
              {locale === 'zh-TW' ? '體重不足' : locale === 'en' ? 'Underweight' : '低体重'}
            </span>
            <span className="font-mono">&lt; 18.5</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">
              {locale === 'zh-TW' ? '正常體重' : locale === 'en' ? 'Normal' : '正常体重'}
            </span>
            <span className="font-mono">18.5-24.9</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">
              {locale === 'zh-TW' ? '體重過重' : locale === 'en' ? 'Overweight' : '過体重'}
            </span>
            <span className="font-mono">25.0-29.9</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">
              {locale === 'zh-TW' ? '肥胖' : locale === 'en' ? 'Obese' : '肥満'}
            </span>
            <span className="font-mono">≥ 30.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BMIForm;