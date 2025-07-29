import React from 'react';
import type { LipidManagementResult } from './calculator.js';
import type { SupportedLocale } from '../../../types/calculator-plugin.js';

interface LipidManagementDashboardProps {
  result: LipidManagementResult;
  locale?: SupportedLocale;
  onRetry?: () => void;
}

export default function LipidManagementDashboard({ 
  result, 
  locale = 'zh-TW',
  onRetry 
}: LipidManagementDashboardProps) {
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'very-high': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'very-high':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'high':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'moderate':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'low':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const labels = {
    'zh-TW': {
      riskLevel: '風險等級',
      ldlCholesterol: 'LDL-C 膽固醇',
      triglycerides: '三酸甘油脂',
      target: '目標',
      current: '當前值',
      status: '狀態',
      atTarget: '✅ 達標',
      aboveTarget: '⚠️ 超標',
      normal: '✅ 正常',
      borderline: '⚠️ 邊界',
      high: '⚠️ 偏高',
      veryHigh: '🚨 過高',
      medicationAdvice: '用藥建議',
      reductionNeeded: '需要降低',
      recommendations: '臨床建議',
      recalculate: '重新計算',
      riskFactors: '風險因子數量',
      importantReminder: '重要提醒'
    },
    'en': {
      riskLevel: 'Risk Level',
      ldlCholesterol: 'LDL-C Cholesterol',
      triglycerides: 'Triglycerides',
      target: 'Target',
      current: 'Current',
      status: 'Status',
      atTarget: '✅ At Target',
      aboveTarget: '⚠️ Above Target',
      normal: '✅ Normal',
      borderline: '⚠️ Borderline',
      high: '⚠️ High',
      veryHigh: '🚨 Very High',
      medicationAdvice: 'Medication Advice',
      reductionNeeded: 'Reduction Needed',
      recommendations: 'Clinical Recommendations',
      recalculate: 'Recalculate',
      riskFactors: 'Risk Factor Count',
      importantReminder: 'Important Reminder'
    },
    'ja': {
      riskLevel: 'リスクレベル',
      ldlCholesterol: 'LDL-Cコレステロール',
      triglycerides: 'トリグリセリド',
      target: '目標',
      current: '現在値',
      status: 'ステータス',
      atTarget: '✅ 目標達成',
      aboveTarget: '⚠️ 目標超過',
      normal: '✅ 正常',
      borderline: '⚠️ 境界域',
      high: '⚠️ 高値',
      veryHigh: '🚨 超高値',
      medicationAdvice: '薬物療法アドバイス',
      reductionNeeded: '必要な低下',
      recommendations: '臨床推奨',
      recalculate: '再計算',
      riskFactors: 'リスク因子数',
      importantReminder: '重要な注意事項'
    }
  };

  const currentLabels = labels[locale] || labels['zh-TW'];

  const getRiskLevelText = (riskLevel: string) => {
    const riskTexts = {
      'very-high': { 'zh-TW': '極高風險', 'en': 'Very High Risk', 'ja': '超高リスク' },
      'high': { 'zh-TW': '中高風險', 'en': 'High Risk', 'ja': '高リスク' },
      'moderate': { 'zh-TW': '中風險', 'en': 'Moderate Risk', 'ja': '中等度リスク' },
      'low': { 'zh-TW': '低風險', 'en': 'Low Risk', 'ja': '低リスク' }
    };
    return riskTexts[riskLevel]?.[locale] || riskTexts[riskLevel]?.['zh-TW'] || riskLevel;
  };

  const getTGStatusText = (tgLevel: string) => {
    switch (tgLevel) {
      case 'normal': return currentLabels.normal;
      case 'borderline': return currentLabels.borderline;
      case 'high': return currentLabels.high;
      case 'very-high': return currentLabels.veryHigh;
      default: return currentLabels.normal;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Result Card */}
      <div className={`rounded-lg border-2 p-6 ${getRiskColor(result.riskLevel)}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getRiskIcon(result.riskLevel)}
            <h2 className="text-xl font-semibold">
              {currentLabels.riskLevel}：{getRiskLevelText(result.riskLevel)}
            </h2>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 text-sm border rounded-md hover:bg-white/50 transition-colors"
              aria-label={currentLabels.recalculate}
            >
              {currentLabels.recalculate}
            </button>
          )}
        </div>

        {/* Lipid Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          {/* LDL Cholesterol */}
          <div className="p-4 border rounded-lg bg-white/50">
            <h4 className="font-bold text-gray-800 mb-2">{currentLabels.ldlCholesterol}</h4>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {result.primaryValue} mg/dL
            </div>
            <div className="text-sm text-gray-600 mb-1">
              {currentLabels.target}：{result.ldlTarget}
            </div>
            <div className="text-sm">
              {result.ldlStatus === 'at-target' ? currentLabels.atTarget : currentLabels.aboveTarget}
            </div>
          </div>

          {/* Triglycerides */}
          <div className="p-4 border rounded-lg bg-white/50">
            <h4 className="font-bold text-gray-800 mb-2">{currentLabels.triglycerides}</h4>
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {result.tgValue} mg/dL
            </div>
            <div className="text-sm text-gray-600 mb-1">
              {currentLabels.target}：{result.tgStatus}
            </div>
            <div className="text-sm">
              {getTGStatusText(result.tgLevel)}
            </div>
          </div>
        </div>

        {/* Risk Factor Count */}
        <div className="p-4 bg-white/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{currentLabels.riskFactors}</span>
            <span className="text-lg font-bold">{result.riskFactorCount}</span>
          </div>
        </div>
      </div>

      {/* Medication Advice */}
      {result.medicationAdvice.needed ? (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
            </svg>
            {currentLabels.medicationAdvice}
          </h3>
          
          <div className="mb-3">
            <p className="text-orange-700 font-medium">
              {currentLabels.reductionNeeded}：<span className="font-bold">{result.medicationAdvice.reductionNeeded}%</span>
            </p>
            <p className="text-orange-600 text-sm mt-1">{result.medicationAdvice.urgencyNote}</p>
          </div>
          
          {result.medicationAdvice.medications.map((med, index) => (
            <div key={index} className="bg-white border border-orange-100 rounded-lg p-3 mb-3">
              <h5 className="font-bold text-gray-800 mb-2">
                {med.category} <span className="text-sm text-gray-600">(降幅：{med.reduction})</span>
              </h5>
              <ul className="space-y-1 mb-2">
                {med.options.map((option, optIndex) => (
                  <li key={optIndex} className="text-gray-700 text-sm">• {option}</li>
                ))}
              </ul>
              <p className="text-xs text-gray-600 italic">{med.note}</p>
            </div>
          ))}
          
          <div className="border-t border-orange-200 pt-3 mt-3">
            <h6 className="font-bold text-orange-800 mb-2 text-sm">{currentLabels.importantReminder}：</h6>
            <ul className="space-y-1">
              {result.medicationAdvice.additionalNotes.map((note, index) => (
                <li key={index} className="text-orange-700 text-xs">• {note}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {currentLabels.medicationAdvice}
          </h3>
          <p className="text-green-700">{result.medicationAdvice.urgencyNote}</p>
        </div>
      )}

      {/* Clinical Recommendations */}
      {result.recommendations && result.recommendations[locale]?.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
            </svg>
            {currentLabels.recommendations}
          </h3>
          <ul className="space-y-2">
            {result.recommendations[locale].map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></span>
                <span className="text-blue-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-yellow-800 mb-1">
              {locale === 'zh-TW' ? '免責聲明' : locale === 'ja' ? '免責事項' : 'Disclaimer'}
            </h4>
            <p className="text-sm text-yellow-700">
              {locale === 'zh-TW' 
                ? '此工具僅供衛教參考，不能取代專業醫療建議。所有治療決策請務必與您的醫師討論。'
                : locale === 'ja'
                ? 'このツールは教育目的のみであり、専門的な医療アドバイスに代わるものではありません。すべての治療決定は医師と相談してください。'
                : 'This tool is for educational purposes only and cannot replace professional medical advice. All treatment decisions must be discussed with your physician.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Metadata (Development Mode) */}
      {process.env.NODE_ENV === 'development' && result.metadata && (
        <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
          <h4 className="font-medium mb-2">Calculation Metadata</h4>
          <div className="space-y-1">
            <div>Algorithm: {result.metadata.algorithm}</div>
            <div>Version: {result.metadata.version}</div>
            <div>Calculated: {new Date(result.metadata.calculationDate).toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
}