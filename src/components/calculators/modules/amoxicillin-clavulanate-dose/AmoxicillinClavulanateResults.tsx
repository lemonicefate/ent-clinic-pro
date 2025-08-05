/**
 * Amoxicillin/Clavulanate 劑量計算結果組件
 */

import React from 'react';
import type { CalculatorResultsProps } from '../../types';

const AmoxicillinClavulanateResults: React.FC<CalculatorResultsProps> = ({
  result,
  locale,
  className = ''
}) => {
  if (!result) return null;

  const calculation = result.customData?.calculation;
  const targetSingle = result.customData?.targetAmoxicillinSingle;

  if (!calculation) return null;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        用藥建議
      </h3>

      {/* 劑量摘要 */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-900 mb-1">
            {result.primaryValue?.toFixed(1)} mg/day
          </div>
          <div className="text-sm text-blue-700">
            Amoxicillin 每日總劑量，分3次服用
          </div>
          <div className="text-xs text-blue-600 mt-1">
            單次劑量：{targetSingle?.toFixed(1)} mg
          </div>
        </div>
      </div>

      {/* 藥物總顆數卡片 */}
      <div className="space-y-4 mb-6">
        <h4 className="text-sm font-medium text-gray-900">建議藥物組合：</h4>
        
        {/* 總顆數計算 - 分成兩個並排卡片 */}
        {(() => {
          const days = result.customData?.days || 3;
          const totalAugmentin = calculation.augmentin500Count;
          const totalAmoxicillin500 = calculation.useAmoxicillin500 ? calculation.amoxicillin500Count : 0;
          const totalAmoxicillin250 = !calculation.useAmoxicillin500 ? calculation.amoxicillin250Count : 0;
          
          return (
            <div className="mb-4">
              <div className="text-lg font-semibold text-gray-900 mb-3 text-center">藥物總顆數（{days}天療程）</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Augmentin 卡片 */}
                {totalAugmentin > 0 && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-6 shadow-sm">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      </div>
                      <div className="text-3xl font-bold text-purple-900 mb-2">{totalAugmentin}</div>
                      <div className="text-sm font-medium text-purple-800 mb-1">Augmentin</div>
                      <div className="text-xs text-purple-600">500/125mg</div>
                      <div className="text-xs text-purple-500 mt-2">含 Clavulanate</div>
                    </div>
                  </div>
                )}
                
                {/* Amoxicillin 卡片 */}
                {(totalAmoxicillin500 > 0 || totalAmoxicillin250 > 0) && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-6 shadow-sm">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-3xl font-bold text-green-900 mb-2">
                        {totalAmoxicillin500 > 0 ? totalAmoxicillin500 : totalAmoxicillin250}
                      </div>
                      <div className="text-sm font-medium text-green-800 mb-1">Amoxicillin</div>
                      <div className="text-xs text-green-600">
                        {totalAmoxicillin500 > 0 ? '500mg' : '250mg'}
                      </div>
                      <div className="text-xs text-green-500 mt-2">純抗生素</div>
                    </div>
                  </div>
                )}
                
                {/* 如果只有一種藥物，顯示空的第二個卡片說明 */}
                {totalAugmentin === 0 && (totalAmoxicillin500 > 0 || totalAmoxicillin250 > 0) && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-lg p-6 shadow-sm opacity-60">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-gray-500 mb-2">0</div>
                      <div className="text-sm font-medium text-gray-600 mb-1">Augmentin</div>
                      <div className="text-xs text-gray-500">未使用</div>
                    </div>
                  </div>
                )}
                
                {(totalAmoxicillin500 === 0 && totalAmoxicillin250 === 0) && totalAugmentin > 0 && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-lg p-6 shadow-sm opacity-60">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-gray-500 mb-2">0</div>
                      <div className="text-sm font-medium text-gray-600 mb-1">Amoxicillin</div>
                      <div className="text-xs text-gray-500">未使用</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}


      </div>

      {/* 藥物比例卡片 */}
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-indigo-900 mb-3 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          實際藥物比例
        </h4>
        <div className="text-center">
          {calculation.actualClavulanate > 0 ? (
            <>
              <div className="text-2xl font-bold text-indigo-900 mb-2">
                {calculation.ratio.toFixed(1)} : 1
              </div>
              <div className="text-sm text-indigo-700">
                Amoxicillin : Clavulanate
              </div>
              <div className="text-xs text-indigo-600 mt-2">
                {calculation.isRatioValid ? (
                  <span className="text-green-600">✓ 比例適當</span>
                ) : (
                  <span className="text-yellow-600">⚠ 比例略高但安全</span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-indigo-900 mb-2">
                純 Amoxicillin
              </div>
              <div className="text-sm text-indigo-700">
                無 Clavulanate 成分
              </div>
            </>
          )}
        </div>
      </div>

      {/* 實際濃度卡片 */}
      <div className="bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-teal-900 mb-3 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          實際濃度
        </h4>
        <div className="text-center">
          <div className="text-2xl font-bold text-teal-900 mb-2">
            {result.customData?.dailyDosePerKg || 45} mg/kg/day
          </div>
          <div className="text-sm text-teal-700">
            實際 Amoxicillin 濃度
          </div>
          <div className="text-xs text-teal-600 mt-2">
            每日總劑量：{result.primaryValue?.toFixed(1)} mg
          </div>
        </div>
      </div>



      {/* 警告訊息 */}
      {result.warnings && result.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            安全提醒
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {result.warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 用藥指導 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          用藥指導
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          {result.recommendations?.map((rec, index) => (
            <li key={index}>
              • {typeof rec === 'string' ? rec : rec['zh-TW'] || rec['en'] || ''}
            </li>
          ))}
          <li>• 建議隨餐服用，減少胃腸道不適</li>
          <li>• 本計算結果僅供參考，實際用藥請諮詢醫師或藥師</li>
        </ul>
      </div>
    </div>
  );
};

export default AmoxicillinClavulanateResults;