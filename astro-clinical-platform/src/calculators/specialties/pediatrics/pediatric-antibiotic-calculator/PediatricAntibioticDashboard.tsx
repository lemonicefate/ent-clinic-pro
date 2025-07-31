import React, { useState } from 'react';
import type { CalculationResult } from '../../../../types/calculator.js';
import type { SupportedLocale } from '../../../../types/calculator-plugin.js';

interface DashboardProps {
  result: CalculationResult;
  locale?: SupportedLocale;
  onRetry?: () => void;
}

interface DrugCalculation {
  drugName: string;
  brandName: string;
  unitMg: number;
  unitName: string;
  unitSymbol: string;
  drugType: 'capsule' | 'pill';
  recommendedFreq: number;
  recommendedFreqText: string;
  prescriptionText: string;
  totalDoseText: string;
  otherDetails: string;
  maxDoseText: string;
  note: string;
  borderColor?: string;
  category: 'bacterial' | 'viral' | 'fungal';
}

export default function PediatricAntibioticDashboard({
  result,
  locale = 'zh-TW',
  onRetry
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'bacterial' | 'viral' | 'fungal'>('bacterial');
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const bacterialDrugs = (result.secondaryValues?.bacterialDrugs as DrugCalculation[]) || [];
  const viralDrugs = (result.secondaryValues?.viralDrugs as DrugCalculation[]) || [];
  const weight = result.secondaryValues?.weight || 0;
  const age = result.secondaryValues?.age || null;
  const days = result.secondaryValues?.days || 0;
  const frequency = result.secondaryValues?.frequency || 0;
  const form = result.secondaryValues?.form || 'powder';

  const toggleCard = (index: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCards(newExpanded);
  };

  const renderDrugCard = (drug: DrugCalculation, index: number) => {
    const isExpanded = expandedCards.has(index);
    const borderColor = drug.borderColor || 'border-teal-500';
    
    return (
      <div
        key={`${drug.drugName}-${index}`}
        className={`bg-white rounded-xl shadow-lg border-l-4 ${borderColor} overflow-hidden transition-all duration-300`}
      >
        <div
          className="p-5 cursor-pointer flex justify-between items-center hover:bg-gray-50"
          onClick={() => toggleCard(index)}
        >
          <h3 className="text-xl font-bold text-gray-800">{drug.brandName}</h3>
          <svg
            className={`w-6 h-6 transform transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        
        {isExpanded && (
          <div className="px-5 pb-5 border-t border-gray-100">
            <div className="text-gray-700 space-y-2 mt-4">
              <p
                className="text-lg font-bold text-blue-700"
                dangerouslySetInnerHTML={{ __html: drug.prescriptionText }}
              />
              <p
                className="text-lg font-bold text-red-600"
                dangerouslySetInnerHTML={{ __html: drug.totalDoseText }}
              />
              <hr className="my-2 border-gray-200" />
              <div className="text-sm space-y-1">
                <div dangerouslySetInnerHTML={{ __html: drug.otherDetails }} />
                {drug.maxDoseText && (
                  <p className="text-xs text-gray-500 mt-1">{drug.maxDoseText}</p>
                )}
              </div>
            </div>
            {drug.note && (
              <div
                className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600"
                dangerouslySetInnerHTML={{ __html: drug.note }}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = (drugs: DrugCalculation[], emptyMessage: string) => {
    if (drugs.length === 0) {
      return (
        <div className="bg-white p-6 rounded-xl shadow-lg h-full flex items-center justify-center">
          <p className="text-gray-500 text-lg">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {drugs.map((drug, index) => renderDrugCard(drug, index))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 計算結果摘要 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center mb-4">
          <div className="text-2xl font-bold text-teal-600 mb-2">
            兒童抗生素劑量計算結果
          </div>
          <div className="text-gray-600">
            體重: {weight}kg {age && `| 年齡: ${age}歲`} | 療程: {days}天 | 頻次: {frequency}次/天 | 劑型: {form === 'powder' ? '藥粉' : '藥錠/膠囊'}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-lg text-gray-700">
            {result.interpretation?.[locale]}
          </div>
        </div>
      </div>

      {/* 藥物分類標籤 */}
      <div className="flex border-b border-gray-200">
        <button
          className={`py-2 px-4 font-semibold border-b-2 transition-colors ${
            activeTab === 'bacterial'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('bacterial')}
        >
          抗細菌藥物 ({bacterialDrugs.length})
        </button>
        <button
          className={`py-2 px-4 font-semibold border-b-2 transition-colors ${
            activeTab === 'viral'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('viral')}
        >
          抗病毒藥物 ({viralDrugs.length})
        </button>
        <button
          className={`py-2 px-4 font-semibold border-b-2 transition-colors ${
            activeTab === 'fungal'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('fungal')}
        >
          抗黴菌藥物 (0)
        </button>
      </div>

      {/* 藥物列表 */}
      <div className="mt-4">
        {activeTab === 'bacterial' && renderTabContent(bacterialDrugs, '請在左側輸入資料並點擊「計算」')}
        {activeTab === 'viral' && renderTabContent(viralDrugs, '請在左側輸入資料並點擊「計算」')}
        {activeTab === 'fungal' && renderTabContent([], '此功能待新增')}
      </div>

      {/* 建議事項 */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">重要提醒</h3>
          <ul className="space-y-2">
            {result.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-2 h-2 bg-yellow-600 rounded-full mt-2"></span>
                <span className="text-yellow-700">
                  {rec[locale] || rec['zh-TW']}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Amoxicillin 連結 */}
      <div className="bg-gray-100 rounded-lg p-4">
        <h3 className="font-bold text-gray-800 mb-2">相關計算器</h3>
        <div className="text-sm text-gray-600">
          <strong>Amoxicillin + Clavulanate (Augmentin)</strong>
          <br />
          <a
            href="/tools/amoxicillin-clavulanate-dose"
            className="text-teal-600 hover:text-teal-800 font-semibold underline mt-1 inline-block"
          >
            點此開啟 Amoxicillin 劑量計算頁面 →
          </a>
        </div>
      </div>

      {/* 重新計算按鈕 */}
      {onRetry && (
        <div className="text-center">
          <button
            onClick={onRetry}
            className="bg-teal-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
          >
            重新計算
          </button>
        </div>
      )}
    </div>
  );
}