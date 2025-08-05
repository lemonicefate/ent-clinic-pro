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
        
        {/* 總顆數計算 */}
        {(() => {
          const days = result.customData?.days || 3;
          const totalAugmentin = calculation.augmentin500Count * 3 * days;
          const totalAmoxicillin500 = calculation.useAmoxicillin500 ? calculation.amoxicillin500Count * 3 * days : 0;
          const totalAmoxicillin250 = !calculation.useAmoxicillin500 ? calculation.amoxicillin250Count * 3 * days : 0;
          
          return (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-900 mb-2">藥物總顆數（{days}天療程）</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {totalAugmentin > 0 && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-900">{totalAugmentin}</div>
                      <div className="text-sm text-purple-700">Augmentin 500/125mg</div>
                    </div>
                  )}
                  {totalAmoxicillin500 > 0 && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-900">{totalAmoxicillin500}</div>
                      <div className="text-sm text-green-700">Amoxicillin 500mg</div>
                    </div>
                  )}
                  {totalAmoxicillin250 > 0 && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-900">{totalAmoxicillin250}</div>
                      <div className="text-sm text-orange-700">Amoxicillin 250mg</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        <h4 className="text-sm font-medium text-gray-900">每次服用：</h4>
        
        {/* Augmentin 500/125mg 卡片 */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-purple-900">Augmentin 500/125mg</div>
              <div className="text-xs text-purple-700">
                Amoxicillin 500mg + Clavulanate 125mg
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-900">
                {calculation.augmentin500Count}
              </div>
              <div className="text-xs text-purple-700">顆</div>
            </div>
          </div>
        </div>

        {/* Amoxicillin 500mg 卡片 */}
        {calculation.useAmoxicillin500 && (
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-green-900">Amoxicillin 500mg</div>
                <div className="text-xs text-green-700">
                  純 Amoxicillin 錠劑
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-900">
                  {calculation.amoxicillin500Count}
                </div>
                <div className="text-xs text-green-700">顆</div>
              </div>
            </div>
          </div>
        )}

        {/* Amoxicillin 250mg 卡片 */}
        {!calculation.useAmoxicillin500 && calculation.amoxicillin250Count > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-orange-900">Amoxicillin 250mg</div>
                <div className="text-xs text-orange-700">
                  純 Amoxicillin 錠劑
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-900">
                  {calculation.amoxicillin250Count}
                </div>
                <div className="text-xs text-orange-700">顆</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 藥物比例卡片 */}
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-indigo-900 mb-3 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          實際藥物比例
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-indigo-600">Amoxicillin：</span>
            <span className="font-semibold text-indigo-900">
              {calculation.actualAmoxicillin.toFixed(1)} mg
            </span>
          </div>
          <div>
            <span className="text-indigo-600">Clavulanate：</span>
            <span className="font-semibold text-indigo-900">
              {calculation.actualClavulanate.toFixed(1)} mg
            </span>
          </div>
        </div>
        {calculation.actualClavulanate > 0 && (
          <div className="mt-3 text-center">
            <div className="text-lg font-bold text-indigo-900">
              比例 = {calculation.ratio.toFixed(1)} : 1
            </div>
            <div className="text-xs text-indigo-700">
              (Amoxicillin : Clavulanate)
              {calculation.isRatioValid ? (
                <span className="text-green-600 ml-2">✓ 比例適當</span>
              ) : (
                <span className="text-yellow-600 ml-2">⚠ 比例略高但安全</span>
              )}
            </div>
          </div>
        )}
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

      {/* 實際劑量資訊 */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">實際劑量（每次）：</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Amoxicillin：</span>
            <span className="font-semibold text-gray-900">
              {calculation.actualAmoxicillin.toFixed(1)} mg
            </span>
          </div>
          <div>
            <span className="text-gray-600">Clavulanate：</span>
            <span className="font-semibold text-gray-900">
              {calculation.actualClavulanate.toFixed(1)} mg
            </span>
          </div>
        </div>
        {calculation.actualClavulanate > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            比例 (Amoxicillin:Clavulanate) = {calculation.ratio.toFixed(1)}:1
            {calculation.isRatioValid ? (
              <span className="text-green-600 ml-2">✓ 比例適當</span>
            ) : (
              <span className="text-yellow-600 ml-2">⚠ 比例略高但安全</span>
            )}
          </div>
        )}
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