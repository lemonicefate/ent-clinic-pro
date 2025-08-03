/**
 * 血脂管理計算機結果組件
 */

import React from 'react';
import { CalculatorResultsProps } from '../../types';
import { RISK_CATEGORIES } from './types';

const LipidManagementResults: React.FC<CalculatorResultsProps> = ({
  result,
  locale
}) => {
  if (!result.success || !result.result) {
    return (
      <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">計算結果無效</p>
      </div>
    );
  }

  const { primaryValue, category, interpretation, recommendations, breakdown, warnings, nextSteps } = result.result;
  const riskCategory = category as keyof typeof RISK_CATEGORIES;
  const categoryInfo = RISK_CATEGORIES[riskCategory];

  return (
    <div className="lipid-management-results mt-8">
      <h3 className="text-xl font-semibold mb-6">計算結果</h3>
      
      {/* 主要結果卡片 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {primaryValue.toFixed(1)}%
          </div>
          <div className="text-lg text-gray-600 mb-4">10年心血管疾病風險</div>
          
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${categoryInfo.color.text} ${categoryInfo.color.bg} ${categoryInfo.color.border} border`}>
            {riskCategory === 'low' && '低風險'}
            {riskCategory === 'moderate' && '中等風險'}
            {riskCategory === 'high' && '高風險'}
            {riskCategory === 'very-high' && '極高風險'}
            <span className="ml-2 text-xs">({categoryInfo.range})</span>
          </div>
        </div>
      </div>

      {/* LDL 目標值 */}
      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">LDL 膽固醇目標</h4>
        <div className="flex items-center justify-between">
          <span className="text-gray-700">建議目標值</span>
          <span className="text-2xl font-bold text-blue-600">
            &lt; {categoryInfo.ldlTarget} mg/dL
          </span>
        </div>
      </div>

      {/* 風險分類說明 */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h4 className="font-semibold text-gray-900 mb-4">風險分類標準</h4>
        <div className="space-y-2">
          {Object.entries(RISK_CATEGORIES).map(([key, info]) => (
            <div 
              key={key} 
              className={`flex justify-between items-center p-3 bg-white rounded border-l-4 ${info.color.border} ${
                key === riskCategory ? 'ring-2 ring-blue-200' : ''
              }`}
            >
              <span className="font-medium">
                {key === 'low' && '低風險'}
                {key === 'moderate' && '中等風險'}
                {key === 'high' && '高風險'}
                {key === 'very-high' && '極高風險'}
              </span>
              <div className="text-right">
                <div className="text-gray-600">{info.range}</div>
                <div className="text-sm text-gray-500">LDL &lt; {info.ldlTarget} mg/dL</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 治療建議 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">治療建議</h4>
        
        {/* 生活型態調整 */}
        <div className="mb-4">
          <h5 className="font-medium text-gray-800 mb-2">生活型態調整</h5>
          <ul className="space-y-1">
            {recommendations && recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                <span className="text-gray-700 text-sm">
                  {rec[locale] || rec['zh-TW']}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* 藥物治療 */}
        {result.result.secondaryValues && (
          <div className="border-t pt-4">
            <h5 className="font-medium text-gray-800 mb-2">藥物治療建議</h5>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-800">
                根據風險分類和 LDL 膽固醇數值，建議諮詢醫師評估是否需要藥物治療。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 計算步驟 */}
      {breakdown && breakdown.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h4 className="font-semibold text-gray-900 mb-4">風險評估詳情</h4>
          <div className="space-y-3">
            {breakdown.map((step, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium text-gray-800">
                    {step.description[locale] || step.description['zh-TW']}
                  </span>
                  {step.formula && (
                    <div className="text-sm text-gray-600 mt-1">{step.formula}</div>
                  )}
                </div>
                <span className="text-lg font-semibold text-blue-600">
                  {step.value} 分
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 警告訊息 */}
      {warnings && warnings.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h4 className="font-semibold text-red-800 mb-3">⚠️ 注意事項</h4>
          <ul className="space-y-2">
            {warnings.map((warning, index) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 w-2 h-2 bg-red-600 rounded-full mt-2 mr-3"></span>
                <span className="text-red-700 text-sm">
                  {warning[locale] || warning['zh-TW']}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 追蹤建議 */}
      {nextSteps && nextSteps.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h4 className="font-semibold text-blue-800 mb-3">📅 追蹤建議</h4>
          <ul className="space-y-2">
            {nextSteps.map((step, index) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                <span className="text-blue-700 text-sm">
                  {step[locale] || step['zh-TW']}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 結果解釋 */}
      {interpretation && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-3">結果解釋</h4>
          <p className="text-gray-700 leading-relaxed">
            {interpretation[locale] || interpretation['zh-TW']}
          </p>
          
          <div className="mt-4 p-3 bg-gray-50 rounded border-l-4 border-gray-400">
            <p className="text-sm text-gray-600">
              <strong>免責聲明：</strong>
              此計算結果僅供參考，不能替代專業醫療建議。請諮詢您的醫師以獲得個人化的治療建議。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LipidManagementResults;