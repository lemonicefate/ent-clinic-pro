/**
 * eGFR 計算機結果組件
 */

import React from 'react';
import { EGFRResult, CKD_STAGES } from './types';
import type { SupportedLocale } from '../../types';

interface EGFRResultsProps {
  result: EGFRResult;
  locale?: SupportedLocale;
  onReset?: () => void;
}

const EGFRResults: React.FC<EGFRResultsProps> = ({ 
  result, 
  locale = 'zh-TW',
  onReset 
}) => {
  const { egfr, stage, riskLevel, interpretation, recommendations, calculationSteps, nextSteps } = result;

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'normal':
        return (
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'mild':
        return (
          <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'moderate':
        return (
          <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'severe':
      case 'kidney-failure':
        return (
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 主要結果 */}
      <div className={`p-6 rounded-lg border-2 ${stage.color.bg} ${stage.color.border}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getRiskIcon(riskLevel)}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {egfr} <span className="text-lg font-normal text-gray-600">mL/min/1.73m²</span>
              </h2>
              <p className={`text-sm font-medium ${stage.color.text}`}>
                {stage.stage} - {stage.name[locale] || stage.name['zh-TW']}
              </p>
            </div>
          </div>
          {onReset && (
            <button
              onClick={onReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              重新計算
            </button>
          )}
        </div>
        
        <p className="text-gray-700 leading-relaxed">
          {interpretation}
        </p>
      </div>

      {/* CKD 分期表 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          CKD 分期對照表
        </h3>
        <div className="space-y-2">
          {CKD_STAGES.map((stageItem, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg border-l-3 ${
                stageItem.stage === stage.stage 
                  ? `${stageItem.color.bg} ${stageItem.color.border} border-l-4` 
                  : 'bg-gray-50 border-l-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={`text-sm font-medium ${
                  stageItem.stage === stage.stage ? stageItem.color.text : 'text-gray-700'
                }`}>
                  {stageItem.stage}
                </span>
                <span className={`text-sm ${
                  stageItem.stage === stage.stage ? stageItem.color.text : 'text-gray-600'
                }`}>
                  {stageItem.name[locale] || stageItem.name['zh-TW']}
                </span>
              </div>
              <span className={`text-sm font-mono ${
                stageItem.stage === stage.stage ? stageItem.color.text : 'text-gray-600'
              }`}>
                {stageItem.range}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 建議事項 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          治療建議
        </h3>
        <div className="space-y-3">
          {recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-sm text-gray-700 leading-relaxed">{recommendation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 後續步驟 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          後續步驟
        </h3>
        <div className="space-y-3">
          {nextSteps.map((step, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-blue-600">{index + 1}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 計算步驟 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 text-gray-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          計算步驟
        </h3>
        <div className="space-y-4">
          {calculationSteps.map((step, index) => (
            <div key={index} className="border-l-2 border-gray-300 pl-4">
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                {step.description}
              </h4>
              <p className="text-sm text-gray-600 mb-1">
                {step.value}
              </p>
              <p className="text-xs text-gray-500 font-mono">
                {step.formula}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 重要提醒 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <svg className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-yellow-800 mb-2">重要提醒</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• 此計算結果僅供醫療專業人員參考，不能替代臨床判斷</p>
              <p>• eGFR 結果應結合臨床症狀、尿液檢查等綜合評估</p>
              <p>• 如有疑問，請諮詢腎臟科專科醫師</p>
              <p>• 定期追蹤腎功能變化比單次數值更重要</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EGFRResults;