import React from 'react';
import type { CalculationResult } from '../../../types/calculator.js';
import type { SupportedLocale } from '../../../types/calculator-plugin.js';

interface AmoxicillinClavulanateDashboardProps {
  result: CalculationResult;
  locale?: SupportedLocale;
  onRetry?: () => void;
}

export default function AmoxicillinClavulanateDashboard({ 
  result, 
  locale = 'zh-TW',
  onRetry 
}: AmoxicillinClavulanateDashboardProps) {
  const isError = result.secondaryValues?.error === 'no_safe_combination';
  
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'high':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const labels = {
    'zh-TW': {
      title: '計算結果',
      totalTablets: '總藥錠數',
      curamTablets: 'Curam 625mg',
      amox500Tablets: 'Amox 500mg',
      amox250Tablets: 'Amox 250mg',
      finalDose: '最終 Amoxicillin 劑量',
      ratio: 'Amox:Clav 比例',
      dispensingInstructions: '用藥指示',
      recommendations: '臨床建議',
      recalculate: '重新計算',
      error: '計算錯誤',
      noSafeCombination: '找不到安全組合',
      frequency: '用藥頻次'
    },
    'en': {
      title: 'Calculation Results',
      totalTablets: 'Total Tablets',
      curamTablets: 'Curam 625mg',
      amox500Tablets: 'Amox 500mg',
      amox250Tablets: 'Amox 250mg',
      finalDose: 'Final Amoxicillin Dose',
      ratio: 'Amox:Clav Ratio',
      dispensingInstructions: 'Dispensing Instructions',
      recommendations: 'Clinical Recommendations',
      recalculate: 'Recalculate',
      error: 'Calculation Error',
      noSafeCombination: 'No Safe Combination Found',
      frequency: 'Dosing Frequency'
    },
    'ja': {
      title: '計算結果',
      totalTablets: '総錠数',
      curamTablets: 'Curam 625mg',
      amox500Tablets: 'Amox 500mg',
      amox250Tablets: 'Amox 250mg',
      finalDose: '最終アモキシシリン用量',
      ratio: 'Amox:Clav比',
      dispensingInstructions: '調剤指示',
      recommendations: '臨床推奨',
      recalculate: '再計算',
      error: '計算エラー',
      noSafeCombination: '安全な組み合わせが見つかりません',
      frequency: '投与頻度'
    }
  };

  const currentLabels = labels[locale] || labels['zh-TW'];

  if (isError) {
    return (
      <div className="space-y-6">
        <div className={`rounded-lg border-2 p-6 ${getRiskColor('high')}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getRiskIcon('high')}
              <h2 className="text-xl font-semibold">
                {currentLabels.error}
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

          <div className="text-center mb-4">
            <div className="text-2xl font-bold mb-2">
              {currentLabels.noSafeCombination}
            </div>
          </div>

          <div className="p-4 bg-white/50 rounded-lg">
            <p className="text-sm leading-relaxed">
              {result.interpretation?.[locale] || result.interpretation?.['zh-TW']}
            </p>
          </div>
        </div>

        {/* Recommendations for error case */}
        {result.recommendations && result.recommendations.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
              </svg>
              {currentLabels.recommendations}
            </h3>
            <ul className="space-y-2">
              {result.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></span>
                  <span className="text-gray-700">{recommendation[locale] || recommendation['zh-TW']}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Success case
  const numCuram = result.secondaryValues?.numCuram || 0;
  const numAmox500 = result.secondaryValues?.numAmox500 || 0;
  const numAmox250 = result.secondaryValues?.numAmox250 || 0;
  const finalAmoDose = result.secondaryValues?.finalAmoDose || 0;
  const ratio = result.secondaryValues?.ratio || 0;
  const days = result.secondaryValues?.days || 0;
  const frequency = result.secondaryValues?.frequency || 3;

  return (
    <div className="space-y-6">
      {/* Main Result Card */}
      <div className={`rounded-lg border-2 p-6 ${getRiskColor(result.riskLevel || 'low')}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getRiskIcon(result.riskLevel || 'low')}
            <h2 className="text-xl font-semibold">
              {currentLabels.title}
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

        <div className="text-center mb-6">
          <p className="text-gray-600">針對您的設定，建議的<strong className="text-gray-800">最佳</strong>總藥量如下：</p>
        </div>

        {/* Tablet Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">{currentLabels.curamTablets}</p>
            <p className="text-3xl font-bold text-blue-600">{numCuram}</p>
            <p className="text-sm text-gray-500">總顆數</p>
          </div>
          {numAmox500 > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800 font-medium">{currentLabels.amox500Tablets}</p>
              <p className="text-3xl font-bold text-green-600">{numAmox500}</p>
              <p className="text-sm text-gray-500">總顆數</p>
            </div>
          )}
          {numAmox250 > 0 && (
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-sm text-indigo-800 font-medium">{currentLabels.amox250Tablets}</p>
              <p className="text-3xl font-bold text-indigo-600">{numAmox250}</p>
              <p className="text-sm text-gray-500">總顆數</p>
            </div>
          )}
        </div>

        {/* Dose Information */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-100 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600 font-medium">{currentLabels.finalDose}</p>
            <p className="text-2xl font-bold text-gray-800">{finalAmoDose.toFixed(1)}</p>
            <p className="text-sm text-gray-500">mg/kg/day</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600 font-medium">{currentLabels.frequency}</p>
            <p className="text-2xl font-bold text-gray-800">
              {frequency === 2 ? 'BID' : frequency === 3 ? 'TID' : frequency === 4 ? 'QID' : `${frequency}x`}
            </p>
            <p className="text-sm text-gray-500">每日 {frequency} 次</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600 font-medium">{currentLabels.ratio}</p>
            <p className="text-2xl font-bold text-gray-800">
              {ratio === Infinity ? 'N/A' : `${ratio.toFixed(1)}:1`}
            </p>
            <p className="text-sm text-gray-500">(AMO : CLA)</p>
            {ratio !== Infinity && (
              <p className={`text-xs mt-1 ${
                ratio >= 4 && ratio <= 14 
                  ? 'text-green-600' 
                  : 'text-orange-600'
              }`}>
                {ratio >= 4 && ratio <= 14 ? '✓ 理想範圍' : '⚠ 超出範圍'}
              </p>
            )}
          </div>
        </div>

        {/* Interpretation */}
        <div className="p-4 bg-white/50 rounded-lg">
          <p className="text-sm leading-relaxed">
            {result.interpretation?.[locale] || result.interpretation?.['zh-TW']}
          </p>
        </div>
      </div>

      {/* Dispensing Instructions */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-teal-800 mb-4 flex items-center">
          <svg className="w-5 h-5 text-teal-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {currentLabels.dispensingInstructions}
        </h3>
        <div className="text-teal-700">
          <p className="mb-2">
            請將總共 <strong className="text-lg">{result.primaryValue}</strong> 顆藥錠 
            (<strong className="text-blue-700">{numCuram}顆 Curam</strong>
            {numAmox500 > 0 && <span>、<strong className="text-green-700">{numAmox500}顆 Amox 500</strong></span>}
            {numAmox250 > 0 && <span>、<strong className="text-indigo-700">{numAmox250}顆 Amox 250</strong></span>}) 
            完全磨成粉末並均勻混合。
          </p>
          <p className="mb-2">
            這將是 <strong className="text-lg">{days}</strong> 天的總藥量。
            若以每日{frequency}次服藥，請將總藥粉平均分成 <strong className="text-lg">{days * frequency}</strong> 份，每份為一次的劑量。
          </p>
          {ratio !== Infinity && ratio >= 4 && ratio <= 14 && (
            <p className="text-sm text-teal-600 bg-teal-100 p-2 rounded">
              ✓ 此組合的 Amoxicillin:Clavulanate 比例為 {ratio.toFixed(1)}:1，在理想範圍內 (4:1~14:1)
            </p>
          )}
        </div>
      </div>

      {/* Clinical Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
            </svg>
            {currentLabels.recommendations}
          </h3>
          <ul className="space-y-2">
            {result.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></span>
                <span className="text-gray-700">{recommendation[locale] || recommendation['zh-TW']}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Calculation Steps (Development Mode) */}
      {process.env.NODE_ENV === 'development' && result.metadata && (
        <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
          <h4 className="font-medium mb-2">Calculation Metadata</h4>
          <div className="space-y-1">
            {result.metadata.calculationSteps?.map((step, index) => (
              <div key={index}>
                <strong>{step.description}:</strong> {step.value} ({step.formula})
              </div>
            ))}
            <div>Calculated: {new Date(result.metadata.lastCalculated).toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
}