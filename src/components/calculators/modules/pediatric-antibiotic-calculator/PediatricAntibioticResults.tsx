/**
 * 兒童抗生素劑量計算結果組件
 */

import React from 'react';
import { CalculatorResultsProps } from '../../types';

interface AntibioticDose {
  name: string;
  dailyDose: number;
  singleDose: number;
  unit: string;
  notes?: string;
  ageRestriction?: string;
}

const DrugCard: React.FC<{ drug: AntibioticDose }> = ({ drug }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4">
    <h4 className="font-semibold text-gray-900 mb-2">{drug.name}</h4>
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm text-gray-600">每日總劑量:</span>
        <span className="text-sm font-medium">{drug.dailyDose.toFixed(1)} {drug.unit}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-gray-600">單次劑量:</span>
        <span className="text-sm font-medium">{drug.singleDose.toFixed(1)} {drug.unit}</span>
      </div>
      {drug.notes && (
        <p className="text-xs text-gray-500 mt-2">{drug.notes}</p>
      )}
      {drug.ageRestriction && (
        <p className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
          ⚠️ {drug.ageRestriction}
        </p>
      )}
    </div>
  </div>
);

const PediatricAntibioticResults: React.FC<CalculatorResultsProps> = ({
  result,
  locale,
  className = ''
}) => {
  if (!result) return null;

  // 模擬抗生素數據（實際應該從計算結果中獲取）
  const mockAntibiotics: AntibioticDose[] = [
    {
      name: 'Cefixime (希復欣明)',
      dailyDose: result.primaryValue * 8,
      singleDose: (result.primaryValue * 8) / 3,
      unit: 'mg',
      notes: '第三代頭孢菌素，適用於呼吸道感染'
    }
  ];

  const mockAntivirals: AntibioticDose[] = [
    {
      name: 'Acyclovir (阿昔洛韋)',
      dailyDose: result.primaryValue * 20,
      singleDose: (result.primaryValue * 20) / 3,
      unit: 'mg',
      notes: '抗疱疹病毒藥物，適用於疱疹感染'
    }
  ];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        計算結果
      </h3>

      {result.warnings && result.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">⚠️ 安全提醒</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {result.warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
            🦠 抗生素劑量
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockAntibiotics.map((antibiotic, index) => (
              <DrugCard key={index} drug={antibiotic} />
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
            🛡️ 抗病毒藥物劑量
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockAntivirals.map((antiviral, index) => (
              <DrugCard key={index} drug={antiviral} />
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">重要提醒</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 請遵循醫師處方，不可自行調整劑量</li>
            <li>• 需完成整個療程，即使症狀改善也不可提前停藥</li>
            <li>• 注意藥物過敏史和禁忌症</li>
            <li>• 部分藥物有年齡限制，請注意使用條件</li>
            <li>• 本計算結果僅供參考，實際用藥請諮詢醫師或藥師</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PediatricAntibioticResults;