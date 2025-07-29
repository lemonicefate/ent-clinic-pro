import React from 'react';
import type { CHA2DS2VAScResult } from './calculator.js';
import type { SupportedLocale } from '../../../types/calculator-plugin.js';

interface CHA2DS2VAScDashboardProps {
  result: CHA2DS2VAScResult;
  locale?: SupportedLocale;
  onRetry?: () => void;
}

export default function CHA2DS2VAScDashboard({ 
  result, 
  locale = 'en',
  onRetry 
}: CHA2DS2VAScDashboardProps) {
  const getRiskColor = (category: string) => {
    switch (category) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'low-moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (category: string) => {
    switch (category) {
      case 'low':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'low-moderate':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'high':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const labels = {
    'zh-TW': {
      score: 'CHA2DS2-VASc 評分',
      annualRisk: '年中風風險',
      anticoagulation: '抗凝建議',
      recommendations: '臨床建議',
      recalculate: '重新計算',
      recommended: '建議',
      notRecommended: '不建議',
      consider: '考慮'
    },
    'en': {
      score: 'CHA2DS2-VASc Score',
      annualRisk: 'Annual Stroke Risk',
      anticoagulation: 'Anticoagulation',
      recommendations: 'Clinical Recommendations',
      recalculate: 'Recalculate',
      recommended: 'Recommended',
      notRecommended: 'Not Recommended',
      consider: 'Consider'
    },
    'ja': {
      score: 'CHA2DS2-VAScスコア',
      annualRisk: '年間脳卒中リスク',
      anticoagulation: '抗凝固療法',
      recommendations: '臨床推奨',
      recalculate: '再計算',
      recommended: '推奨',
      notRecommended: '推奨されない',
      consider: '検討'
    }
  };

  const currentLabels = labels[locale] || labels['en'];

  const getAnticoagulationText = () => {
    if (result.anticoagulationRecommended) {
      return currentLabels.recommended;
    } else if (result.riskCategory === 'low-moderate') {
      return currentLabels.consider;
    } else {
      return currentLabels.notRecommended;
    }
  };

  const getAnticoagulationColor = () => {
    if (result.anticoagulationRecommended) {
      return 'text-red-600 bg-red-100';
    } else if (result.riskCategory === 'low-moderate') {
      return 'text-yellow-600 bg-yellow-100';
    } else {
      return 'text-green-600 bg-green-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Result Card */}
      <div className={`rounded-lg border-2 p-6 ${getRiskColor(result.riskCategory)}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getRiskIcon(result.riskCategory)}
            <h2 className="text-xl font-semibold">
              {currentLabels.score}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Score */}
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">
              {result.score}
            </div>
            <div className="text-sm opacity-75">
              {result.primaryLabel[locale] || result.primaryLabel['en']}
            </div>
          </div>

          {/* Annual Risk */}
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">
              {result.annualStrokeRisk}%
            </div>
            <div className="text-sm opacity-75">
              {currentLabels.annualRisk}
            </div>
          </div>

          {/* Anticoagulation */}
          <div className="text-center">
            <div className={`inline-block px-3 py-2 rounded-lg text-sm font-medium ${getAnticoagulationColor()}`}>
              {getAnticoagulationText()}
            </div>
            <div className="text-sm opacity-75 mt-2">
              {currentLabels.anticoagulation}
            </div>
          </div>
        </div>

        {/* Interpretation */}
        <div className="mt-4 p-4 bg-white/50 rounded-lg">
          <p className="text-sm leading-relaxed">
            {result.interpretation[locale] || result.interpretation['en']}
          </p>
        </div>
      </div>

      {/* Recommendations */}
      {result.recommendations && result.recommendations[locale]?.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
            </svg>
            {currentLabels.recommendations}
          </h3>
          <ul className="space-y-2">
            {result.recommendations[locale].map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></span>
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Factors Breakdown */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {locale === 'zh-TW' ? 'CHA2DS2-VASc 評分組成' : 
           locale === 'ja' ? 'CHA2DS2-VAScスコア構成' : 
           'CHA2DS2-VASc Score Components'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="font-medium text-gray-700">
              {locale === 'zh-TW' ? '風險因子' : locale === 'ja' ? 'リスク因子' : 'Risk Factors'}
            </div>
            <div className="text-gray-600">
              <div>C - {locale === 'zh-TW' ? '充血性心衰竭' : locale === 'ja' ? 'うっ血性心不全' : 'Congestive Heart Failure'} (1分)</div>
              <div>H - {locale === 'zh-TW' ? '高血壓' : locale === 'ja' ? '高血圧' : 'Hypertension'} (1分)</div>
              <div>A - {locale === 'zh-TW' ? '年齡 ≥75歲' : locale === 'ja' ? '年齢 ≥75歳' : 'Age ≥75 years'} (2分)</div>
              <div>D - {locale === 'zh-TW' ? '糖尿病' : locale === 'ja' ? '糖尿病' : 'Diabetes'} (1分)</div>
              <div>S - {locale === 'zh-TW' ? '中風/TIA/血栓病史' : locale === 'ja' ? '脳卒中/TIA/血栓症既往' : 'Stroke/TIA/Thromboembolism'} (2分)</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-medium text-gray-700">
              {locale === 'zh-TW' ? '其他因子' : locale === 'ja' ? 'その他の因子' : 'Other Factors'}
            </div>
            <div className="text-gray-600">
              <div>V - {locale === 'zh-TW' ? '血管疾病' : locale === 'ja' ? '血管疾患' : 'Vascular Disease'} (1分)</div>
              <div>A - {locale === 'zh-TW' ? '年齡 65-74歲' : locale === 'ja' ? '年齢 65-74歳' : 'Age 65-74 years'} (1分)</div>
              <div>Sc - {locale === 'zh-TW' ? '性別（女性）' : locale === 'ja' ? '性別（女性）' : 'Sex Category (Female)'} (1分)</div>
            </div>
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