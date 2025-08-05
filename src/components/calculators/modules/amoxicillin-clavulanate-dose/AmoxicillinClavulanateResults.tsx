/**
 * Amoxicillin/Clavulanate 劑量計算結果組件
 */

import React from 'react';
import { CalculatorResultsProps } from '../../types';

const AmoxicillinClavulanateResults: React.FC<CalculatorResultsProps> = ({
  result,
  locale,
  className = ''
}) => {
  if (!result) return null;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        計算結果
      </h3>

      <div className="space-y-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">每日總劑量</span>
            <span className="text-xl font-bold text-blue-900">
              {result.primaryValue?.toFixed(1)} mg/day
            </span>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-900">單次劑量</span>
            <span className="text-lg font-semibold text-green-900">
              {(result.primaryValue / 3)?.toFixed(1)} mg
            </span>
          </div>
          <p className="text-xs text-green-700 mt-1">每日三次服用</p>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">用藥建議</h4>
          <p className="text-sm text-gray-700">{result.interpretation}</p>
        </div>

        {result.warnings && result.warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">⚠️ 安全提醒</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {result.warnings.map((warning, index) => (
                <li key={index}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">重要提醒</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 請遵循醫師處方，不可自行調整劑量</li>
            <li>• 需完成整個療程，即使症狀改善也不可提前停藥</li>
            <li>• 如出現過敏反應，請立即停藥並就醫</li>
            <li>• 本計算結果僅供參考，實際用藥請諮詢醫師或藥師</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AmoxicillinClavulanateResults;