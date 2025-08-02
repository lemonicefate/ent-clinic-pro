/**
 * 互動式醫療儀表板組件
 * 提供綜合的醫療數據視覺化和互動功能
 */

import { useState, useEffect, useMemo } from 'react';
import {
  RiskAssessmentChart,
  VitalSignsTrend,
  MedicationComparison,
  SymptomSeverityRadar,
  TreatmentEffectivenessScatter
} from './MedicalCharts';
import {
  generateMockVitalSigns,
  createRiskAssessmentData,
  calculateMedicationScore,
  generateMedicalSummary,
  MEDICAL_COLORS
} from '../../utils/medical-chart-utils';
import type { SupportedLocale } from '../../env.d';

interface Props {
  locale: SupportedLocale;
  patientId?: string;
  className?: string;
}

interface PatientData {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  diagnosis: string;
  riskScores: number[];
  medications: {
    name: string;
    effectiveness: number;
    sideEffects: number;
    cost: number;
  }[];
  symptoms: {
    name: string;
    severity: number;
  }[];
  treatments: {
    name: string;
    effectiveness: number;
    sideEffects: number;
    cost: number;
  }[];
}

// 模擬患者數據
const mockPatients: PatientData[] = [
  {
    id: 'P001',
    name: '張先生',
    age: 65,
    gender: 'male',
    diagnosis: '高血壓合併糖尿病',
    riskScores: [3, 5, 7, 4, 6, 8, 2, 5, 6, 7, 4, 3, 5, 8, 6, 4, 7, 5, 3, 6],
    medications: [
      { name: 'ACE抑制劑', effectiveness: 8, sideEffects: 3, cost: 4 },
      { name: '利尿劑', effectiveness: 7, sideEffects: 4, cost: 2 },
      { name: '鈣離子阻斷劑', effectiveness: 7, sideEffects: 2, cost: 5 },
      { name: 'β阻斷劑', effectiveness: 6, sideEffects: 5, cost: 3 }
    ],
    symptoms: [
      { name: '頭痛', severity: 6 },
      { name: '疲勞', severity: 7 },
      { name: '心悸', severity: 4 },
      { name: '呼吸困難', severity: 3 },
      { name: '水腫', severity: 5 },
      { name: '視力模糊', severity: 2 }
    ],
    treatments: [
      { name: '藥物治療', effectiveness: 7, sideEffects: 3, cost: 4 },
      { name: '生活方式調整', effectiveness: 6, sideEffects: 1, cost: 2 },
      { name: '定期監測', effectiveness: 5, sideEffects: 0, cost: 3 },
      { name: '營養諮詢', effectiveness: 5, sideEffects: 0, cost: 2 }
    ]
  },
  {
    id: 'P002',
    name: '李女士',
    age: 45,
    gender: 'female',
    diagnosis: '類風濕性關節炎',
    riskScores: [2, 4, 6, 3, 5, 7, 8, 6, 4, 5, 3, 2, 4, 6, 5, 3, 6, 4, 2, 5],
    medications: [
      { name: '甲氨蝶呤', effectiveness: 8, sideEffects: 6, cost: 6 },
      { name: '生物製劑', effectiveness: 9, sideEffects: 4, cost: 9 },
      { name: '類固醇', effectiveness: 7, sideEffects: 7, cost: 3 },
      { name: 'NSAIDs', effectiveness: 6, sideEffects: 5, cost: 2 }
    ],
    symptoms: [
      { name: '關節疼痛', severity: 8 },
      { name: '關節僵硬', severity: 7 },
      { name: '疲勞', severity: 6 },
      { name: '發燒', severity: 3 },
      { name: '食慾不振', severity: 4 },
      { name: '睡眠障礙', severity: 5 }
    ],
    treatments: [
      { name: '免疫抑制治療', effectiveness: 8, sideEffects: 6, cost: 8 },
      { name: '物理治療', effectiveness: 6, sideEffects: 1, cost: 4 },
      { name: '職能治療', effectiveness: 5, sideEffects: 0, cost: 3 },
      { name: '心理支持', effectiveness: 4, sideEffects: 0, cost: 2 }
    ]
  }
];

export default function InteractiveMedicalDashboard({ 
  locale, 
  patientId, 
  className = '' 
}: Props) {
  const [selectedPatient, setSelectedPatient] = useState<PatientData>(mockPatients[0]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'medications' | 'symptoms'>('overview');

  // 生成生命徵象數據
  const vitalSignsData = useMemo(() => {
    const hours = selectedTimeRange === '24h' ? 24 : selectedTimeRange === '7d' ? 168 : 720;
    const interval = selectedTimeRange === '24h' ? 60 : selectedTimeRange === '7d' ? 360 : 1440;
    return generateMockVitalSigns(hours, interval);
  }, [selectedTimeRange]);

  // 計算風險分布
  const riskData = useMemo(() => {
    return createRiskAssessmentData(selectedPatient.riskScores, {
      low: 3,
      moderate: 5,
      high: 7
    });
  }, [selectedPatient.riskScores]);

  // 計算藥物評分
  const medicationData = useMemo(() => {
    return {
      medications: selectedPatient.medications.map(med => med.name),
      effectiveness: selectedPatient.medications.map(med => med.effectiveness),
      sideEffects: selectedPatient.medications.map(med => med.sideEffects),
      cost: selectedPatient.medications.map(med => med.cost)
    };
  }, [selectedPatient.medications]);

  // 生成醫療摘要
  const medicalSummary = useMemo(() => {
    return generateMedicalSummary({
      riskDistribution: riskData,
      vitalSigns: {
        systolic: vitalSignsData.bloodPressureSystolic,
        diastolic: vitalSignsData.bloodPressureDiastolic,
        heartRate: vitalSignsData.heartRate
      },
      symptoms: selectedPatient.symptoms
    }, locale);
  }, [riskData, vitalSignsData, selectedPatient.symptoms, locale]);

  return (
    <div className={`medical-dashboard ${className}`}>
      {/* 患者選擇和控制面板 */}
      <div className="bg-white rounded-lg shadow-sm border border-medical-neutral-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-xl font-semibold text-medical-neutral-900">
                患者醫療儀表板
              </h2>
              <p className="text-medical-neutral-600">
                綜合醫療數據視覺化和分析工具
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* 患者選擇 */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-medical-neutral-700">
                患者：
              </label>
              <select
                value={selectedPatient.id}
                onChange={(e) => {
                  const patient = mockPatients.find(p => p.id === e.target.value);
                  if (patient) setSelectedPatient(patient);
                }}
                className="px-3 py-1 border border-medical-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-medical-primary-500"
              >
                {mockPatients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} ({patient.age}歲)
                  </option>
                ))}
              </select>
            </div>

            {/* 時間範圍選擇 */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-medical-neutral-700">
                時間範圍：
              </label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as '24h' | '7d' | '30d')}
                className="px-3 py-1 border border-medical-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-medical-primary-500"
              >
                <option value="24h">24 小時</option>
                <option value="7d">7 天</option>
                <option value="30d">30 天</option>
              </select>
            </div>

            {/* 進階指標開關 */}
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showAdvancedMetrics}
                onChange={(e) => setShowAdvancedMetrics(e.target.checked)}
                className="w-4 h-4 text-medical-primary-600 focus:ring-medical-primary-500 border-medical-neutral-300 rounded"
              />
              <span className="text-sm font-medium text-medical-neutral-700">
                進階指標
              </span>
            </label>
          </div>
        </div>

        {/* 患者基本資訊 */}
        <div className="mt-4 p-4 bg-medical-neutral-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-medical-neutral-600">姓名：</span>
              <span className="text-medical-neutral-900">{selectedPatient.name}</span>
            </div>
            <div>
              <span className="font-medium text-medical-neutral-600">年齡：</span>
              <span className="text-medical-neutral-900">{selectedPatient.age} 歲</span>
            </div>
            <div>
              <span className="font-medium text-medical-neutral-600">性別：</span>
              <span className="text-medical-neutral-900">
                {selectedPatient.gender === 'male' ? '男' : '女'}
              </span>
            </div>
            <div>
              <span className="font-medium text-medical-neutral-600">診斷：</span>
              <span className="text-medical-neutral-900">{selectedPatient.diagnosis}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 標籤導航 */}
      <div className="bg-white rounded-lg shadow-sm border border-medical-neutral-200 mb-6">
        <div className="border-b border-medical-neutral-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: '總覽', icon: '📊' },
              { id: 'vitals', label: '生命徵象', icon: '💓' },
              { id: 'medications', label: '藥物治療', icon: '💊' },
              { id: 'symptoms', label: '症狀評估', icon: '🩺' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-medical-primary-500 text-medical-primary-600'
                    : 'border-transparent text-medical-neutral-500 hover:text-medical-neutral-700 hover:border-medical-neutral-300'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 內容區域 */}
      <div className="space-y-6">
        {/* 總覽標籤 */}
        {activeTab === 'overview' && (
          <>
            {/* 醫療摘要 */}
            {medicalSummary.length > 0 && (
              <div className="bg-medical-primary-50 rounded-lg p-6">
                <h3 className="font-semibold text-medical-primary-900 mb-3">
                  📋 醫療摘要
                </h3>
                <ul className="space-y-2">
                  {medicalSummary.map((summary, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-2 h-2 bg-medical-primary-600 rounded-full mt-2 mr-3"></span>
                      <span className="text-medical-primary-700 text-sm">{summary}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 關鍵指標卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-medical-neutral-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 text-lg">✓</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-medical-neutral-600">低風險患者</p>
                    <p className="text-2xl font-semibold text-medical-neutral-900">
                      {riskData.low}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-medical-neutral-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <span className="text-red-600 text-lg">⚠</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-medical-neutral-600">高風險患者</p>
                    <p className="text-2xl font-semibold text-medical-neutral-900">
                      {riskData.high + riskData.critical}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-medical-neutral-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-lg">💊</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-medical-neutral-600">使用藥物</p>
                    <p className="text-2xl font-semibold text-medical-neutral-900">
                      {selectedPatient.medications.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-medical-neutral-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 text-lg">🩺</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-medical-neutral-600">症狀數量</p>
                    <p className="text-2xl font-semibold text-medical-neutral-900">
                      {selectedPatient.symptoms.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 風險評估圖表 */}
            <div className="bg-white rounded-lg shadow-sm border border-medical-neutral-200 p-6">
              <RiskAssessmentChart
                data={riskData}
                locale={locale}
                title="患者風險等級分布"
                showPercentages={true}
                height={300}
              />
            </div>
          </>
        )}

        {/* 生命徵象標籤 */}
        {activeTab === 'vitals' && (
          <div className="bg-white rounded-lg shadow-sm border border-medical-neutral-200 p-6">
            <VitalSignsTrend
              data={vitalSignsData}
              locale={locale}
              title={`生命徵象監測 - ${selectedTimeRange === '24h' ? '24小時' : selectedTimeRange === '7d' ? '7天' : '30天'}`}
              showGrid={true}
              height={500}
            />
          </div>
        )}

        {/* 藥物治療標籤 */}
        {activeTab === 'medications' && (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-medical-neutral-200 p-6">
              <MedicationComparison
                data={medicationData}
                locale={locale}
                title="藥物療效比較分析"
                showLegend={true}
                height={400}
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-medical-neutral-200 p-6">
              <TreatmentEffectivenessScatter
                data={{ treatments: selectedPatient.treatments }}
                locale={locale}
                title="治療方案效果分析"
                xAxis="effectiveness"
                yAxis="sideEffects"
                height={400}
              />
            </div>
          </>
        )}

        {/* 症狀評估標籤 */}
        {activeTab === 'symptoms' && (
          <div className="bg-white rounded-lg shadow-sm border border-medical-neutral-200 p-6">
            <SymptomSeverityRadar
              data={{
                symptoms: selectedPatient.symptoms.map(s => s.name),
                severity: selectedPatient.symptoms.map(s => s.severity),
                maxSeverity: 10
              }}
              locale={locale}
              title="症狀嚴重程度評估"
              showScale={true}
              height={500}
            />
          </div>
        )}
      </div>
    </div>
  );
}