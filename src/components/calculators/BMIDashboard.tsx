import React from 'react';
import type { CalculationResult } from '../../utils/calculator-engine';

interface BMIDashboardProps {
  result: CalculationResult;
  className?: string;
}

export default function BMIDashboard({ result, className = '' }: BMIDashboardProps) {
  // 安全地獲取 BMI 值
  const bmiValue = Number(result.bmi || result.value) || 0;
  const riskLevel = result.riskLevel || result.risk || 'moderate';
  const category = result.category || '未知';
  
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
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

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* BMI 分數顯示 */}
      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-gray-900 mb-2">
          {typeof bmiValue === 'number' ? bmiValue.toFixed(1) : bmiValue}
        </div>
        <div className="text-sm text-gray-600">BMI 指數</div>
      </div>

      {/* 風險等級 */}
      <div className={`flex items-center justify-center p-4 rounded-lg mb-6 ${getRiskColor(riskLevel)}`}>
        <div className="flex items-center space-x-2">
          {getRiskIcon(riskLevel)}
          <span className="font-semibold">
            {category}
          </span>
        </div>
      </div>

      {/* BMI 分類表 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">BMI 分類標準</h3>
        <div className="space-y-2">
          <div className={`flex justify-between p-2 rounded ${bmiValue < 18.5 ? 'bg-blue-50 border border-blue-200' : ''}`}>
            <span>體重過輕</span>
            <span className="font-mono">&lt; 18.5</span>
          </div>
          <div className={`flex justify-between p-2 rounded ${bmiValue >= 18.5 && bmiValue < 24 ? 'bg-green-50 border border-green-200' : ''}`}>
            <span>正常體重</span>
            <span className="font-mono">18.5 - 23.9</span>
          </div>
          <div className={`flex justify-between p-2 rounded ${bmiValue >= 24 && bmiValue < 27 ? 'bg-yellow-50 border border-yellow-200' : ''}`}>
            <span>體重過重</span>
            <span className="font-mono">24.0 - 26.9</span>
          </div>
          <div className={`flex justify-between p-2 rounded ${bmiValue >= 27 && bmiValue < 30 ? 'bg-orange-50 border border-orange-200' : ''}`}>
            <span>輕度肥胖</span>
            <span className="font-mono">27.0 - 29.9</span>
          </div>
          <div className={`flex justify-between p-2 rounded ${bmiValue >= 30 && bmiValue < 35 ? 'bg-red-50 border border-red-200' : ''}`}>
            <span>中度肥胖</span>
            <span className="font-mono">30.0 - 34.9</span>
          </div>
          <div className={`flex justify-between p-2 rounded ${bmiValue >= 35 ? 'bg-red-100 border border-red-300' : ''}`}>
            <span>重度肥胖</span>
            <span className="font-mono">≥ 35.0</span>
          </div>
        </div>
      </div>

      {/* 建議 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">健康建議</h3>
        <p className="text-gray-700 mb-3">
          {result.interpretation?.['zh-TW'] || result.interpretation || '請諮詢專業醫師獲得個人化建議。'}
        </p>
        
        {result.recommendations && result.recommendations.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">建議行動：</h4>
            <ul className="space-y-1">
              {result.recommendations.map((item, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-gray-700">
                    {typeof item === 'string' ? item : item['zh-TW'] || item['en'] || ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 計算詳情 */}
      {result.metadata?.calculationSteps && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">計算詳情</h3>
          <div className="space-y-2">
            {result.metadata.calculationSteps.map((step, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">{step.description}:</span>
                <span className="font-mono text-gray-900">{step.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}