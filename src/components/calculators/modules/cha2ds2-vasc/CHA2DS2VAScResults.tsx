/**
 * CHA2DS2-VASc 計算機結果組件
 */

import React from 'react';
import { CHA2DS2VAScResult, RISK_CATEGORIES } from './types';
import type { SupportedLocale } from '../../types';

interface CHA2DS2VAScResultsProps {
  result: CHA2DS2VAScResult;
  locale?: SupportedLocale;
  onReset?: () => void;
}

const CHA2DS2VAScResults: React.FC<CHA2DS2VAScResultsProps> = ({ 
  result, 
  locale = 'zh-TW',
  onReset 
}) => {
  const { score, riskLevel, strokeRiskPerYear, interpretation, recommendations, anticoagulationRecommendation, calculationSteps } = result;

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low':
        return (
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'moderate':
        return (
          <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'high':
        return (
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getAnticoagulationIcon = (strength: string) => {
    switch (strength) {
      case 'not-recommended':
        return (
          <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
        );
      case 'consider':
        return (
          <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'recommended':
        return (
          <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'strongly-recommended':
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.25-4.5a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 5.25v13.5A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V5.25z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const riskCategory = RISK_CATEGORIES.find(cat => cat.riskLevel === riskLevel) || RISK_CATEGORIES[0];

  return (
    <div className="space-y-6">
      {/* 主要結果 */}
      <div className={`p-6 rounded-lg border-2 ${riskCategory.color.bg} ${riskCategory.color.border}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getRiskIcon(riskLevel)}
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {score} <span className="text-lg font-normal text-gray-600">分</span>
              </h2>
              <p className={`text-sm font-medium ${riskCategory.color.text}`}>
                {riskCategory.description[locale] || riskCategory.description['zh-TW']}
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white bg-opacity-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-1">年中風風險</h3>
            <p className="text-2xl font-bold text-gray-900">{strokeRiskPerYear}%</p>
          </div>
          <div className="bg-white bg-opacity-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-1">風險等級</h3>
            <p className="text-lg font-semibold text-gray-900">
              {riskCategory.description[locale] || riskCategory.description['zh-TW']}
            </p>
          </div>
        </div>
        
        <p className="text-gray-700 leading-relaxed">
          {interpretation}
        </p>
      </div>

      {/* 抗凝治療建議 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.586V5L8 4z" />
          </svg>
          抗凝治療建議
        </h3>
        
        <div className={`p-4 rounded-lg border-l-4 ${
          anticoagulationRecommendation.strength === 'not-recommended' ? 'bg-gray-50 border-gray-400' :
          anticoagulationRecommendation.strength === 'consider' ? 'bg-yellow-50 border-yellow-400' :
          anticoagulationRecommendation.strength === 'recommended' ? 'bg-blue-50 border-blue-400' :
          'bg-green-50 border-green-400'
        }`}>
          <div className="flex items-center space-x-3 mb-2">
            {getAnticoagulationIcon(anticoagulationRecommendation.strength)}
            <h4 className="font-medium text-gray-900">
              {anticoagulationRecommendation.strength === 'not-recommended' && '不建議抗凝治療'}
              {anticoagulationRecommendation.strength === 'consider' && '可考慮抗凝治療'}
              {anticoagulationRecommendation.strength === 'recommended' && '建議抗凝治療'}
              {anticoagulationRecommendation.strength === 'strongly-recommended' && '強烈建議抗凝治療'}
            </h4>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {anticoagulationRecommendation.reasoning}
          </p>
        </div>
      </div>

      {/* 治療建議 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          臨床建議
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

      {/* 評分詳細 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          評分詳細
        </h3>
        <div className="space-y-3">
          {calculationSteps.map((step, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">{step.points}</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{step.factor}</h4>
                  <p className="text-xs text-gray-600">{step.description}</p>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-500">{step.points} 分</span>
            </div>
          ))}
          
          <div className="border-t border-gray-200 pt-3 mt-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">總</span>
                </div>
                <h4 className="text-sm font-bold text-gray-900">總分</h4>
              </div>
              <span className="text-lg font-bold text-blue-600">{score} 分</span>
            </div>
          </div>
        </div>
      </div>

      {/* 風險對照表 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          CHA2DS2-VASc 風險對照表
        </h3>
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-700 pb-2 border-b border-gray-200">
            <span>評分</span>
            <span>風險等級</span>
            <span>年中風風險</span>
          </div>
          {[
            { score: '0', risk: '低風險', rate: '0.2%' },
            { score: '1', risk: '中等風險', rate: '0.9%' },
            { score: '2', risk: '高風險', rate: '2.9%' },
            { score: '3', risk: '高風險', rate: '4.6%' },
            { score: '4', risk: '高風險', rate: '6.7%' },
            { score: '5', risk: '高風險', rate: '10.0%' },
            { score: '6+', risk: '極高風險', rate: '>13%' }
          ].map((item, index) => (
            <div
              key={index}
              className={`grid grid-cols-3 gap-4 text-sm py-2 px-3 rounded ${
                item.score === score.toString() || (item.score === '6+' && score >= 6)
                  ? 'bg-blue-50 border border-blue-200 font-medium'
                  : 'hover:bg-gray-50'
              }`}
            >
              <span>{item.score}</span>
              <span>{item.risk}</span>
              <span>{item.rate}</span>
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
              <p>• 此評分僅適用於非瓣膜性心房顫動患者</p>
              <p>• 抗凝治療決策還需考慮出血風險（建議使用 HAS-BLED 評分）</p>
              <p>• 評分結果應結合患者個人情況和臨床判斷</p>
              <p>• 定期重新評估風險變化比單次評分更重要</p>
              <p>• 如有疑問，請諮詢心臟科專科醫師</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CHA2DS2VAScResults;