/**
 * BMI Calculator Dashboard Component
 * 
 * Displays BMI calculation results with visual indicators,
 * health recommendations, and educational information.
 */

import React from 'react';
import type { CalculationResult, SupportedLocale } from '../../../types/calculator.js';
import type { DashboardProps } from '../../../types/calculator-plugin.js';

interface BMIDashboardProps extends DashboardProps {
  result: CalculationResult;
  locale: SupportedLocale;
}

export default function BMIDashboard({ 
  result, 
  locale = 'zh-TW', 
  inputs,
  theme = 'light',
  accessibility,
  onInteraction 
}: BMIDashboardProps) {
  const bmi = result.primaryValue;
  const category = result.secondaryValues?.category || '';
  const risk = result.riskLevel || 'moderate';
  
  // Get risk styling
  const getRiskStyling = (riskLevel: string) => {
    const styles = {
      low: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        icon: 'text-green-600'
      },
      moderate: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        icon: 'text-yellow-600'
      },
      high: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        icon: 'text-orange-600'
      },
      critical: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: 'text-red-600'
      }
    };
    
    return styles[riskLevel as keyof typeof styles] || styles.moderate;
  };
  
  const styling = getRiskStyling(risk);
  
  // Get risk icon
  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'moderate':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'high':
      case 'critical':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  // BMI categories for reference table
  const bmiCategories = [
    { 
      range: '< 16.0', 
      category: { 'zh-TW': '嚴重體重不足', 'en': 'Severely Underweight', 'ja': '重度の低体重' },
      isActive: bmi < 16
    },
    { 
      range: '16.0 - 18.4', 
      category: { 'zh-TW': '體重不足', 'en': 'Underweight', 'ja': '低体重' },
      isActive: bmi >= 16 && bmi < 18.5
    },
    { 
      range: '18.5 - 24.9', 
      category: { 'zh-TW': '正常體重', 'en': 'Normal Weight', 'ja': '正常体重' },
      isActive: bmi >= 18.5 && bmi < 25
    },
    { 
      range: '25.0 - 29.9', 
      category: { 'zh-TW': '體重過重', 'en': 'Overweight', 'ja': '過体重' },
      isActive: bmi >= 25 && bmi < 30
    },
    { 
      range: '30.0 - 34.9', 
      category: { 'zh-TW': '輕度肥胖', 'en': 'Class I Obesity', 'ja': 'クラスI肥満' },
      isActive: bmi >= 30 && bmi < 35
    },
    { 
      range: '35.0 - 39.9', 
      category: { 'zh-TW': '中度肥胖', 'en': 'Class II Obesity', 'ja': 'クラスII肥満' },
      isActive: bmi >= 35 && bmi < 40
    },
    { 
      range: '≥ 40.0', 
      category: { 'zh-TW': '重度肥胖', 'en': 'Class III Obesity', 'ja': 'クラスIII肥満' },
      isActive: bmi >= 40
    }
  ];
  
  const handleInteraction = (action: string, data?: any) => {
    onInteraction?.(action, data);
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : ''}`}>
      {/* BMI Score Display */}
      <div className="text-center mb-6">
        <div className={`text-4xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {typeof bmi === 'number' ? bmi.toFixed(1) : bmi}
        </div>
        <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          BMI {locale === 'zh-TW' ? '指數' : locale === 'en' ? 'Index' : 'インデックス'}
        </div>
      </div>

      {/* Risk Level Indicator */}
      <div className={`flex items-center justify-center p-4 rounded-lg mb-6 ${styling.bg} ${styling.border} border`}>
        <div className="flex items-center space-x-2">
          <div className={styling.icon}>
            {getRiskIcon(risk)}
          </div>
          <span className={`font-semibold ${styling.text}`}>
            {category}
          </span>
        </div>
      </div>

      {/* BMI Categories Reference Table */}
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {locale === 'zh-TW' ? 'BMI 分類標準' : locale === 'en' ? 'BMI Categories' : 'BMI分類'}
        </h3>
        <div className="space-y-2">
          {bmiCategories.map((cat, index) => (
            <div 
              key={index}
              className={`flex justify-between p-3 rounded-lg transition-colors ${
                cat.isActive 
                  ? `${styling.bg} ${styling.border} border-2` 
                  : theme === 'dark' 
                    ? 'bg-gray-700 border border-gray-600' 
                    : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <span className={`text-sm font-medium ${
                cat.isActive 
                  ? styling.text 
                  : theme === 'dark' 
                    ? 'text-gray-300' 
                    : 'text-gray-700'
              }`}>
                {cat.category[locale]}
              </span>
              <span className={`text-sm font-mono ${
                cat.isActive 
                  ? styling.text 
                  : theme === 'dark' 
                    ? 'text-gray-400' 
                    : 'text-gray-600'
              }`}>
                {cat.range}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Health Interpretation */}
      <div className={`rounded-lg p-4 mb-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {locale === 'zh-TW' ? '健康評估' : locale === 'en' ? 'Health Assessment' : '健康評価'}
        </h3>
        <p className={`mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          {result.interpretation?.[locale] || result.interpretation?.['zh-TW'] || '請諮詢專業醫師獲得個人化建議。'}
        </p>
        
        {result.recommendations && result.recommendations.length > 0 && (
          <div>
            <h4 className={`font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {locale === 'zh-TW' ? '建議行動：' : locale === 'en' ? 'Recommended Actions:' : '推奨アクション：'}
            </h4>
            <ul className="space-y-2">
              {result.recommendations.map((item, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className={`mt-1 ${styling.icon}`}>•</span>
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {typeof item === 'string' ? item : item[locale] || item['zh-TW'] || ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

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
              {locale === 'zh-TW' ? '計算公式：' : locale === 'en' ? 'Formula:' : '計算式：'}
            </div>
            <div className={`font-mono text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-blue-700'}`}>
              BMI = {locale === 'zh-TW' ? '體重 (kg) ÷ 身高 (m)²' : locale === 'en' ? 'weight (kg) ÷ height (m)²' : '体重 (kg) ÷ 身長 (m)²'}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => handleInteraction('share', { bmi, category, risk })}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            theme === 'dark'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {locale === 'zh-TW' ? '分享結果' : locale === 'en' ? 'Share Result' : '結果を共有'}
        </button>
        
        <button
          onClick={() => handleInteraction('save', { bmi, category, risk, timestamp: new Date() })}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            theme === 'dark'
              ? 'bg-gray-600 hover:bg-gray-700 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
        >
          {locale === 'zh-TW' ? '儲存記錄' : locale === 'en' ? 'Save Record' : '記録を保存'}
        </button>
        
        <button
          onClick={() => handleInteraction('print', { bmi, category, risk })}
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
          BMI calculation result: {bmi.toFixed(1)} kg/m², Category: {category}, Risk Level: {risk}. 
          {result.interpretation?.[locale]}
        </div>
      )}
    </div>
  );
}