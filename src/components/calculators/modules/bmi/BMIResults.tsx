/**
 * BMI 計算機專用結果組件
 * 
 * 專為 BMI 計算機設計的結果展示，提供豐富的視覺化和健康建議。
 */

import React from 'react';
import { CalculatorResultsProps } from '../../types';
import { BMI_CATEGORIES, getBMICategory } from './types';

const BMIResults: React.FC<CalculatorResultsProps> = ({
  result,
  locale,
  onExport,
  onShare,
  onSave,
  className = ''
}) => {
  const bmi = result.primaryValue;
  const category = getBMICategory(bmi);

  // 獲取風險圖示
  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'moderate':
        return (
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'high':
      case 'critical':
        return (
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleExport = (format: 'pdf' | 'png' | 'json' | 'csv') => {
    if (onExport) {
      onExport(format);
    } else {
      // 預設匯出邏輯
      const data = {
        bmi: result.primaryValue,
        category: category.category[locale],
        riskLevel: result.riskLevel,
        interpretation: result.interpretation?.[locale],
        recommendations: result.recommendations?.map(rec => rec[locale]),
        timestamp: new Date().toISOString()
      };
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bmi-result-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  const handleShare = (platform: 'email' | 'link' | 'print') => {
    if (onShare) {
      onShare(platform);
    } else {
      // 預設分享邏輯
      const shareText = `我的 BMI 計算結果：${bmi.toFixed(1)} kg/m² (${category.category[locale]})`;
      
      switch (platform) {
        case 'print':
          window.print();
          break;
        case 'link':
          if (navigator.share) {
            navigator.share({
              title: 'BMI 計算結果',
              text: shareText,
              url: window.location.href
            });
          }
          break;
        case 'email':
          const subject = encodeURIComponent('BMI 計算結果');
          const body = encodeURIComponent(shareText);
          window.open(`mailto:?subject=${subject}&body=${body}`);
          break;
      }
    }
  };

  return (
    <div className={`bmi-results ${className}`}>
      <h3 className="text-xl font-semibold mb-6 text-gray-900">
        {locale === 'zh-TW' ? '計算結果' : locale === 'en' ? 'Calculation Results' : '計算結果'}
      </h3>
      
      {/* 主要結果卡片 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-900 mb-2">
            {bmi.toFixed(1)}
          </div>
          <div className="text-lg text-gray-600 mb-4">kg/m²</div>
          
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${category.color.bg} ${category.color.border} ${category.color.text} border`}>
            <div className="mr-2">
              {getRiskIcon(category.riskLevel)}
            </div>
            {category.category[locale] || category.category['zh-TW']}
          </div>
        </div>
      </div>

      {/* BMI 分類表 */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h4 className="font-semibold text-gray-900 mb-4">
          {locale === 'zh-TW' ? 'BMI 分類標準' : locale === 'en' ? 'BMI Categories' : 'BMI分類'}
        </h4>
        <div className="space-y-2">
          {BMI_CATEGORIES.map((cat, index) => {
            const isActive = bmi >= (index === 0 ? 0 : index === 1 ? 16 : index === 2 ? 18.5 : index === 3 ? 25 : index === 4 ? 30 : index === 5 ? 35 : 40) &&
                           bmi < (index === 0 ? 16 : index === 1 ? 18.5 : index === 2 ? 25 : index === 3 ? 30 : index === 4 ? 35 : index === 5 ? 40 : 999);
            
            return (
              <div 
                key={index}
                className={`flex justify-between items-center p-3 rounded border-l-4 ${
                  isActive 
                    ? `${cat.color.bg} ${cat.color.border} border-l-current` 
                    : 'bg-white border-gray-200 border-l-gray-300'
                }`}
              >
                <span className={`font-medium ${
                  isActive ? cat.color.text : 'text-gray-700'
                }`}>
                  {cat.category[locale] || cat.category['zh-TW']}
                </span>
                <span className={`font-mono text-sm ${
                  isActive ? cat.color.text : 'text-gray-600'
                }`}>
                  {cat.range}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 健康解釋 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">
          {locale === 'zh-TW' ? '健康評估' : locale === 'en' ? 'Health Assessment' : '健康評価'}
        </h4>
        <p className="text-gray-700 mb-4 leading-relaxed">
          {result.interpretation?.[locale] || result.interpretation?.['zh-TW'] || '請諮詢專業醫師獲得個人化建議。'}
        </p>
        
        {result.recommendations && result.recommendations.length > 0 && (
          <>
            <h5 className="font-medium text-gray-900 mb-3">
              {locale === 'zh-TW' ? '建議行動' : locale === 'en' ? 'Recommended Actions' : '推奨アクション'}
            </h5>
            <ul className="space-y-2">
              {result.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                  <span className="text-gray-700">
                    {rec[locale] || rec['zh-TW'] || ''}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* 計算詳情 */}
      {result.breakdown && result.breakdown.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h4 className="font-semibold text-gray-900 mb-4">
            {locale === 'zh-TW' ? '計算詳情' : locale === 'en' ? 'Calculation Details' : '計算詳細'}
          </h4>
          <div className="space-y-3">
            {result.breakdown.map((step, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-600">
                  {step.label[locale] || step.label['zh-TW']}:
                </span>
                <span className="font-mono text-gray-900">
                  {step.value}
                </span>
              </div>
            ))}
          </div>
          
          {/* 公式顯示 */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-800 mb-1">
              {locale === 'zh-TW' ? '計算公式：' : locale === 'en' ? 'Formula:' : '計算式：'}
            </div>
            <div className="font-mono text-sm text-blue-700">
              BMI = {locale === 'zh-TW' ? '體重 (kg) ÷ 身高 (m)²' : locale === 'en' ? 'weight (kg) ÷ height (m)²' : '体重 (kg) ÷ 身長 (m)²'}
            </div>
          </div>
        </div>
      )}

      {/* 操作按鈕 */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleShare('link')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          {locale === 'zh-TW' ? '分享結果' : locale === 'en' ? 'Share Result' : '結果を共有'}
        </button>
        
        <button
          onClick={() => handleExport('json')}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
        >
          {locale === 'zh-TW' ? '匯出資料' : locale === 'en' ? 'Export Data' : 'データエクスポート'}
        </button>
        
        <button
          onClick={() => handleShare('print')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
        >
          {locale === 'zh-TW' ? '列印報告' : locale === 'en' ? 'Print Report' : 'レポート印刷'}
        </button>
        
        {onSave && (
          <button
            onClick={onSave}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            {locale === 'zh-TW' ? '儲存記錄' : locale === 'en' ? 'Save Record' : '記録を保存'}
          </button>
        )}
      </div>

      {/* 重要提醒 */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex">
          <svg className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h5 className="text-sm font-medium text-yellow-800 mb-1">
              {locale === 'zh-TW' ? '重要提醒' : locale === 'en' ? 'Important Notice' : '重要な注意'}
            </h5>
            <p className="text-sm text-yellow-700">
              {locale === 'zh-TW' 
                ? 'BMI 計算結果僅供參考，不能取代專業醫師的診斷。如有健康疑慮，請諮詢合格的醫療專業人員。'
                : locale === 'en'
                ? 'BMI calculation results are for reference only and cannot replace professional medical diagnosis. If you have health concerns, please consult qualified healthcare professionals.'
                : 'BMI計算結果は参考のみであり、専門医の診断に代わるものではありません。健康上の懸念がある場合は、資格のある医療専門家にご相談ください。'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BMIResults;