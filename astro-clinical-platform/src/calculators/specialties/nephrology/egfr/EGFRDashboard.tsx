/**
 * eGFR Calculator Dashboard Component
 * 
 * Displays eGFR calculation results with CKD staging, risk assessment,
 * clinical recommendations, and visual indicators for kidney function.
 */

import React from 'react';
import type { CalculationResult, SupportedLocale } from '../../../types/calculator.js';
import type { DashboardProps } from '../../../types/calculator-plugin.js';

interface EGFRDashboardProps extends DashboardProps {
  result: CalculationResult;
  locale: SupportedLocale;
}

export default function EGFRDashboard({ 
  result, 
  locale = 'zh-TW', 
  inputs,
  theme = 'light',
  accessibility,
  onInteraction 
}: EGFRDashboardProps) {
  const egfr = result.primaryValue;
  const ckdStage = result.secondaryValues?.ckdStage || 1;
  const riskLevel = result.riskLevel || 'low';
  
  // Get stage styling
  const getStageStyling = (stage: number) => {
    const styles = {
      1: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        icon: 'text-green-600'
      },
      2: {
        bg: 'bg-lime-50',
        border: 'border-lime-200',
        text: 'text-lime-800',
        icon: 'text-lime-600'
      },
      3: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        icon: 'text-yellow-600'
      },
      4: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        icon: 'text-orange-600'
      },
      5: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: 'text-red-600'
      }
    };
    
    return styles[stage as keyof typeof styles] || styles[3];
  };
  
  const styling = getStageStyling(ckdStage);
  
  // Get stage icon
  const getStageIcon = (stage: number) => {
    switch (stage) {
      case 1:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 2:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 3:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 4:
      case 5:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  // CKD stages for reference table
  const ckdStages = [
    { 
      stage: 1, 
      range: '≥ 90', 
      description: { 'zh-TW': '正常或輕度下降', 'en': 'Normal or mildly decreased', 'ja': '正常または軽度低下' },
      isActive: ckdStage === 1
    },
    { 
      stage: 2, 
      range: '60-89', 
      description: { 'zh-TW': '輕度下降', 'en': 'Mildly decreased', 'ja': '軽度低下' },
      isActive: ckdStage === 2
    },
    { 
      stage: 3, 
      range: '30-59', 
      description: { 'zh-TW': '中度下降', 'en': 'Moderately decreased', 'ja': '中等度低下' },
      isActive: ckdStage === 3
    },
    { 
      stage: 4, 
      range: '15-29', 
      description: { 'zh-TW': '重度下降', 'en': 'Severely decreased', 'ja': '高度低下' },
      isActive: ckdStage === 4
    },
    { 
      stage: 5, 
      range: '< 15', 
      description: { 'zh-TW': '腎衰竭', 'en': 'Kidney failure', 'ja': '腎不全' },
      isActive: ckdStage === 5
    }
  ];
  
  const handleInteraction = (action: string, data?: any) => {
    onInteraction?.(action, data);
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : ''}`}>
      {/* eGFR Value Display */}
      <div className="text-center mb-6">
        <div className={`text-4xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {typeof egfr === 'number' ? egfr.toFixed(0) : egfr}
        </div>
        <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          {result.primaryUnit} - eGFR {locale === 'zh-TW' ? '估算腎絲球過濾率' : locale === 'en' ? 'Estimated GFR' : '推定糸球体濾過量'}
        </div>
      </div>

      {/* CKD Stage Indicator */}
      <div className={`flex items-center justify-center p-4 rounded-lg mb-6 ${styling.bg} ${styling.border} border`}>
        <div className="flex items-center space-x-3">
          <div className={styling.icon}>
            {getStageIcon(ckdStage)}
          </div>
          <div>
            <span className={`font-semibold ${styling.text}`}>
              {locale === 'zh-TW' ? `CKD 第 ${ckdStage} 期` : locale === 'en' ? `CKD Stage ${ckdStage}` : `CKDステージ${ckdStage}`}
            </span>
            <div className={`text-sm ${styling.text} opacity-80`}>
              {ckdStages.find(s => s.stage === ckdStage)?.description[locale]}
            </div>
          </div>
        </div>
      </div>

      {/* CKD Stages Reference Table */}
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {locale === 'zh-TW' ? 'CKD 分期標準' : locale === 'en' ? 'CKD Stages' : 'CKDステージ'}
        </h3>
        <div className="space-y-2">
          {ckdStages.map((stage, index) => {
            const stageStyle = getStageStyling(stage.stage);
            return (
              <div 
                key={index}
                className={`flex justify-between items-center p-3 rounded-lg transition-colors ${
                  stage.isActive 
                    ? `${stageStyle.bg} ${stageStyle.border} border-2` 
                    : theme === 'dark' 
                      ? 'bg-gray-700 border border-gray-600' 
                      : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${
                    stage.isActive 
                      ? stageStyle.text 
                      : theme === 'dark' 
                        ? 'text-gray-300' 
                        : 'text-gray-700'
                  }`}>
                    {locale === 'zh-TW' ? `第 ${stage.stage} 期` : locale === 'en' ? `Stage ${stage.stage}` : `ステージ${stage.stage}`}
                  </span>
                  <span className={`text-xs ${
                    stage.isActive 
                      ? stageStyle.text 
                      : theme === 'dark' 
                        ? 'text-gray-400' 
                        : 'text-gray-500'
                  }`}>
                    {stage.description[locale]}
                  </span>
                </div>
                <span className={`text-sm font-mono ${
                  stage.isActive 
                    ? stageStyle.text 
                    : theme === 'dark' 
                      ? 'text-gray-400' 
                      : 'text-gray-600'
                }`}>
                  {stage.range}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clinical Interpretation */}
      <div className={`rounded-lg p-4 mb-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {locale === 'zh-TW' ? '臨床解釋' : locale === 'en' ? 'Clinical Interpretation' : '臨床解釈'}
        </h3>
        <p className={`mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          {result.interpretation?.[locale] || result.interpretation?.['zh-TW'] || '請諮詢專業醫師獲得個人化建議。'}
        </p>
      </div>

      {/* Clinical Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div className={`rounded-lg p-4 mb-6 ${theme === 'dark' ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'} border`}>
          <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-900'}`}>
            {locale === 'zh-TW' ? '臨床建議' : locale === 'en' ? 'Clinical Recommendations' : '臨床推奨'}
          </h3>
          <ul className="space-y-2">
            {result.recommendations.map((item, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className={`mt-1 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>•</span>
                <span className={`text-sm ${theme === 'dark' ? 'text-blue-200' : 'text-blue-800'}`}>
                  {typeof item === 'string' ? item : item[locale] || item['zh-TW'] || ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Additional Tests */}
      {result.metadata?.additionalTests && result.metadata.additionalTests.length > 0 && (
        <div className={`rounded-lg p-4 mb-6 ${theme === 'dark' ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border`}>
          <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-900'}`}>
            {locale === 'zh-TW' ? '建議檢查' : locale === 'en' ? 'Recommended Tests' : '推奨検査'}
          </h3>
          <div className="space-y-2">
            {result.metadata.additionalTests.map((test: any, index: number) => {
              const urgencyColors = {
                routine: theme === 'dark' ? 'text-gray-400' : 'text-gray-600',
                urgent: theme === 'dark' ? 'text-orange-400' : 'text-orange-600',
                immediate: theme === 'dark' ? 'text-red-400' : 'text-red-600'
              };
              
              const urgencyLabels = {
                routine: locale === 'zh-TW' ? '常規' : locale === 'en' ? 'Routine' : '定期',
                urgent: locale === 'zh-TW' ? '急迫' : locale === 'en' ? 'Urgent' : '緊急',
                immediate: locale === 'zh-TW' ? '立即' : locale === 'en' ? 'Immediate' : '即座'
              };
              
              return (
                <div key={index} className="flex items-start justify-between">
                  <span className={`text-sm ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}`}>
                    {typeof test.indication === 'string' ? test.indication : test.indication[locale] || test.indication['zh-TW']}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${urgencyColors[test.urgency as keyof typeof urgencyColors]} bg-opacity-20`}>
                    {urgencyLabels[test.urgency as keyof typeof urgencyLabels]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calculation Details */}
      {result.metadata?.calculationSteps && (
        <div className={`pt-6 border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {locale === 'zh-TW' ? '計算詳情' : locale === 'en' ? 'Calculation Details' : '計算詳細'}
          </h3>
          <div className="space-y-2">
            {result.metadata.calculationSteps.map((step, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {step.description}:
                </span>
                <span className={`font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {step.value}
                </span>
              </div>
            ))}
          </div>
          
          {/* Formula Display */}
          <div className={`mt-4 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-600' : 'bg-blue-50'}`}>
            <div className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-blue-800'}`}>
              {locale === 'zh-TW' ? 'CKD-EPI 2021 公式：' : locale === 'en' ? 'CKD-EPI 2021 Formula:' : 'CKD-EPI 2021式：'}
            </div>
            <div className={`font-mono text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-blue-700'}`}>
              eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^(-1.200) × 0.9938^Age × (1.012 if female)
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => handleInteraction('share', { egfr, ckdStage, riskLevel })}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            theme === 'dark'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {locale === 'zh-TW' ? '分享結果' : locale === 'en' ? 'Share Result' : '結果を共有'}
        </button>
        
        <button
          onClick={() => handleInteraction('save', { egfr, ckdStage, riskLevel, timestamp: new Date() })}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            theme === 'dark'
              ? 'bg-gray-600 hover:bg-gray-700 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
        >
          {locale === 'zh-TW' ? '儲存記錄' : locale === 'en' ? 'Save Record' : '記録を保存'}
        </button>
        
        <button
          onClick={() => handleInteraction('print', { egfr, ckdStage, riskLevel })}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            theme === 'dark'
              ? 'border border-gray-500 text-gray-300 hover:bg-gray-700'
              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {locale === 'zh-TW' ? '列印報告' : locale === 'en' ? 'Print Report' : 'レポート印刷'}
        </button>
      </div>

      {/* Accessibility Features */}
      {accessibility?.screenReader && (
        <div className="sr-only">
          eGFR calculation result: {egfr} mL/min/1.73m², CKD Stage {ckdStage}, Risk Level: {riskLevel}. 
          {result.interpretation?.[locale]}
        </div>
      )}
    </div>
  );
}