/**
 * 血脂管理計算機表單組件
 */

import React from 'react';
import { CalculatorFormProps } from '../../types';

const LipidManagementForm: React.FC<CalculatorFormProps> = ({
  values,
  errors,
  onChange,
  onSubmit,
  onReset,
  isLoading,
  locale
}) => {
  return (
    <div className="lipid-management-form">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">血脂管理與心血管風險計算機</h2>
      
      <div className="space-y-6">
        {/* 基本資料 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">基本資料</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                年齡 (歲) *
              </label>
              <input
                type="number"
                value={values.age || ''}
                onChange={(e) => onChange('age', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.age ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="請輸入年齡"
                min="18"
                max="120"
                disabled={isLoading}
              />
              {errors.age && (
                <p className="mt-1 text-sm text-red-600">{errors.age}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                性別 *
              </label>
              <select
                value={values.gender || ''}
                onChange={(e) => onChange('gender', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.gender ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              >
                <option value="">請選擇性別</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
              )}
            </div>
          </div>
        </div>

        {/* 血脂檢查 */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">血脂檢查</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                總膽固醇 (mg/dL) *
              </label>
              <input
                type="number"
                value={values.totalCholesterol || ''}
                onChange={(e) => onChange('totalCholesterol', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.totalCholesterol ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="例如: 200"
                min="100"
                max="500"
                disabled={isLoading}
              />
              {errors.totalCholesterol && (
                <p className="mt-1 text-sm text-red-600">{errors.totalCholesterol}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LDL 膽固醇 (mg/dL) *
              </label>
              <input
                type="number"
                value={values.ldlCholesterol || ''}
                onChange={(e) => onChange('ldlCholesterol', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.ldlCholesterol ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="例如: 130"
                min="50"
                max="300"
                disabled={isLoading}
              />
              {errors.ldlCholesterol && (
                <p className="mt-1 text-sm text-red-600">{errors.ldlCholesterol}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HDL 膽固醇 (mg/dL) *
              </label>
              <input
                type="number"
                value={values.hdlCholesterol || ''}
                onChange={(e) => onChange('hdlCholesterol', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.hdlCholesterol ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="例如: 50"
                min="20"
                max="100"
                disabled={isLoading}
              />
              {errors.hdlCholesterol && (
                <p className="mt-1 text-sm text-red-600">{errors.hdlCholesterol}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                三酸甘油脂 (mg/dL) *
              </label>
              <input
                type="number"
                value={values.triglycerides || ''}
                onChange={(e) => onChange('triglycerides', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.triglycerides ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="例如: 150"
                min="50"
                max="1000"
                disabled={isLoading}
              />
              {errors.triglycerides && (
                <p className="mt-1 text-sm text-red-600">{errors.triglycerides}</p>
              )}
            </div>
          </div>
        </div>

        {/* 血壓 */}
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">血壓</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                收縮壓 (mmHg) *
              </label>
              <input
                type="number"
                value={values.systolicBP || ''}
                onChange={(e) => onChange('systolicBP', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.systolicBP ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="例如: 120"
                min="80"
                max="250"
                disabled={isLoading}
              />
              {errors.systolicBP && (
                <p className="mt-1 text-sm text-red-600">{errors.systolicBP}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                舒張壓 (mmHg) *
              </label>
              <input
                type="number"
                value={values.diastolicBP || ''}
                onChange={(e) => onChange('diastolicBP', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.diastolicBP ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="例如: 80"
                min="40"
                max="150"
                disabled={isLoading}
              />
              {errors.diastolicBP && (
                <p className="mt-1 text-sm text-red-600">{errors.diastolicBP}</p>
              )}
            </div>
          </div>
        </div>

        {/* 風險因子 */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">風險因子</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'diabetes', label: '糖尿病', description: '是否患有糖尿病' },
              { key: 'smoking', label: '吸菸', description: '目前吸菸或過去一年內吸菸' },
              { key: 'familyHistory', label: '家族史', description: '早發性心血管疾病家族史' },
              { key: 'hypertension', label: '高血壓', description: '是否患有高血壓' },
              { key: 'ckd', label: '慢性腎病', description: '是否患有慢性腎病' },
              { key: 'previousCVD', label: '既往心血管疾病', description: '既往心肌梗塞、中風等' }
            ].map((factor) => (
              <div key={factor.key} className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id={factor.key}
                  checked={values[factor.key] || false}
                  onChange={(e) => onChange(factor.key, e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isLoading}
                />
                <div className="flex-1">
                  <label htmlFor={factor.key} className="text-sm font-medium text-gray-700">
                    {factor.label}
                  </label>
                  <p className="text-xs text-gray-500">{factor.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={onSubmit}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '計算中...' : '計算心血管風險'}
          </button>
          
          <button
            onClick={onReset}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            重設
          </button>
        </div>
      </div>
    </div>
  );
};

export default LipidManagementForm;