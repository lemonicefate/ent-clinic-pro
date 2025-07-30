import React, { useState, useEffect, useMemo } from 'react';
import type { MedicalProcedure, ProcedureSearchFilters } from '../../types/procedure';

interface ProcedureExplanationSystemProps {
  procedures: MedicalProcedure[];
  locale: string;
}

export default function ProcedureExplanationSystem({ 
  procedures, 
  locale 
}: ProcedureExplanationSystemProps) {
  const [filters, setFilters] = useState<ProcedureSearchFilters>({
    category: 'all',
    specialty: 'all',
    searchTerm: '',
    sortBy: 'name'
  });
  
  const [selectedProcedure, setSelectedProcedure] = useState<MedicalProcedure | null>(null);
  const [compareList, setCompareList] = useState<MedicalProcedure[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'compare' | 'detail'>('list');
  const [activeTab, setActiveTab] = useState<'overview' | 'preparation' | 'procedure' | 'risks' | 'aftercare'>('overview');

  // Get unique categories and specialties for filter dropdowns
  const categories = useMemo(() => {
    const cats = [...new Set(procedures.map(proc => proc.category))];
    return cats.sort();
  }, [procedures]);

  const specialties = useMemo(() => {
    const specs = [...new Set(procedures.map(proc => proc.specialty))];
    return specs.sort();
  }, [procedures]);

  // Filter and sort procedures
  const filteredProcedures = useMemo(() => {
    let filtered = procedures.filter(proc => {
      const matchesCategory = filters.category === 'all' || proc.category === filters.category;
      const matchesSpecialty = filters.specialty === 'all' || proc.specialty === filters.specialty;
      const matchesSearch = filters.searchTerm === '' || 
        proc.name[locale as keyof typeof proc.name]?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        proc.description[locale as keyof typeof proc.description]?.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      return matchesCategory && matchesSpecialty && matchesSearch;
    });

    // Sort procedures
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return (a.name[locale as keyof typeof a.name] || '').localeCompare(
            b.name[locale as keyof typeof b.name] || ''
          );
        case 'category':
          return a.category.localeCompare(b.category);
        case 'duration':
          return a.duration.typical - b.duration.typical;
        case 'specialty':
          return a.specialty.localeCompare(b.specialty);
        default:
          return 0;
      }
    });

    return filtered;
  }, [procedures, filters, locale]);

  const handleAddToCompare = (procedure: MedicalProcedure) => {
    if (compareList.length < 3 && !compareList.find(proc => proc.id === procedure.id)) {
      setCompareList([...compareList, procedure]);
    }
  };

  const handleRemoveFromCompare = (procedureId: string) => {
    setCompareList(compareList.filter(proc => proc.id !== procedureId));
  };

  const getRiskColor = (severity: string, probability: string) => {
    if (severity === 'severe') return 'text-red-600 bg-red-50 border-red-200';
    if (severity === 'moderate') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      'diagnostic': {
        en: 'Diagnostic',
        zh: '診斷性',
        ja: '診断'
      },
      'therapeutic': {
        en: 'Therapeutic',
        zh: '治療性',
        ja: '治療'
      },
      'surgical': {
        en: 'Surgical',
        zh: '手術',
        ja: '外科'
      },
      'preventive': {
        en: 'Preventive',
        zh: '預防性',
        ja: '予防'
      },
      'emergency': {
        en: 'Emergency',
        zh: '急診',
        ja: '救急'
      }
    };
    return labels[category as keyof typeof labels]?.[locale as keyof typeof labels[keyof typeof labels]] || category;
  };

  const getSpecialtyLabel = (specialty: string) => {
    const labels = {
      'cardiology': {
        en: 'Cardiology',
        zh: '心臟科',
        ja: '循環器科'
      },
      'gastroenterology': {
        en: 'Gastroenterology',
        zh: '消化科',
        ja: '消化器科'
      },
      'orthopedics': {
        en: 'Orthopedics',
        zh: '骨科',
        ja: '整形外科'
      },
      'neurology': {
        en: 'Neurology',
        zh: '神經科',
        ja: '神経科'
      }
    };
    return labels[specialty as keyof typeof labels]?.[locale as keyof typeof labels[keyof typeof labels]] || specialty;
  };

  if (viewMode === 'detail' && selectedProcedure) {
    return (
      <div className="procedure-detail bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <button
            onClick={() => setViewMode('list')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← {locale === 'zh' ? '返回列表' : locale === 'ja' ? 'リストに戻る' : 'Back to List'}
          </button>
          <button
            onClick={() => handleAddToCompare(selectedProcedure)}
            disabled={compareList.length >= 3 || compareList.find(proc => proc.id === selectedProcedure.id) !== undefined}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {locale === 'zh' ? '加入比較' : locale === 'ja' ? '比較に追加' : 'Add to Compare'}
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {selectedProcedure.name[locale as keyof typeof selectedProcedure.name]}
          </h1>
          <div className="flex gap-4 text-sm text-gray-500 mb-4">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
              {getCategoryLabel(selectedProcedure.category)}
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
              {getSpecialtyLabel(selectedProcedure.specialty)}
            </span>
            <span>{selectedProcedure.duration.typical} {locale === 'zh' ? '分鐘' : locale === 'ja' ? '分' : 'minutes'}</span>
          </div>
          <p className="text-lg text-gray-700">
            {selectedProcedure.description[locale as keyof typeof selectedProcedure.description]}
          </p>
        </div> 
       {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: locale === 'zh' ? '概述' : locale === 'ja' ? '概要' : 'Overview' },
              { id: 'preparation', label: locale === 'zh' ? '準備' : locale === 'ja' ? '準備' : 'Preparation' },
              { id: 'procedure', label: locale === 'zh' ? '程序' : locale === 'ja' ? '手順' : 'Procedure' },
              { id: 'risks', label: locale === 'zh' ? '風險' : locale === 'ja' ? 'リスク' : 'Risks' },
              { id: 'aftercare', label: locale === 'zh' ? '術後護理' : locale === 'ja' ? 'アフターケア' : 'Aftercare' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  {locale === 'zh' ? '目的' : locale === 'ja' ? '目的' : 'Purpose'}
                </h3>
                <p className="text-gray-700 mb-6">
                  {selectedProcedure.purpose[locale as keyof typeof selectedProcedure.purpose]}
                </p>

                <h3 className="text-lg font-semibold mb-3">
                  {locale === 'zh' ? '優點' : locale === 'ja' ? '利点' : 'Benefits'}
                </h3>
                <ul className="list-disc list-inside space-y-1 mb-6">
                  {selectedProcedure.benefits[locale as keyof typeof selectedProcedure.benefits]?.map((benefit, index) => (
                    <li key={index} className="text-gray-700">{benefit}</li>
                  ))}
                </ul>

                <h3 className="text-lg font-semibold mb-3">
                  {locale === 'zh' ? '持續時間' : locale === 'ja' ? '所要時間' : 'Duration'}
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-800">
                    {locale === 'zh' ? '典型時間' : locale === 'ja' ? '標準時間' : 'Typical'}: {selectedProcedure.duration.typical} {locale === 'zh' ? '分鐘' : locale === 'ja' ? '分' : 'minutes'}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {locale === 'zh' ? '範圍' : locale === 'ja' ? '範囲' : 'Range'}: {selectedProcedure.duration.range.min}-{selectedProcedure.duration.range.max} {locale === 'zh' ? '分鐘' : locale === 'ja' ? '分' : 'minutes'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">
                  {locale === 'zh' ? '禁忌症' : locale === 'ja' ? '禁忌' : 'Contraindications'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-red-700 mb-2">
                      {locale === 'zh' ? '絕對禁忌症' : locale === 'ja' ? '絶対禁忌' : 'Absolute Contraindications'}
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedProcedure.contraindications.absolute[locale as keyof typeof selectedProcedure.contraindications.absolute]?.map((contraindication, index) => (
                        <li key={index} className="text-red-700 text-sm">{contraindication}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-yellow-700 mb-2">
                      {locale === 'zh' ? '相對禁忌症' : locale === 'ja' ? '相対禁忌' : 'Relative Contraindications'}
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedProcedure.contraindications.relative[locale as keyof typeof selectedProcedure.contraindications.relative]?.map((contraindication, index) => (
                        <li key={index} className="text-yellow-700 text-sm">{contraindication}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-3 mt-6">
                  {locale === 'zh' ? '預估費用' : locale === 'ja' ? '推定費用' : 'Estimated Cost'}
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-800 font-medium">
                    ${selectedProcedure.cost.estimated.min.toLocaleString()} - ${selectedProcedure.cost.estimated.max.toLocaleString()} {selectedProcedure.cost.estimated.currency}
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    {locale === 'zh' ? '費用因素：' : locale === 'ja' ? '費用要因：' : 'Cost factors:'}
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                    {selectedProcedure.cost.factors[locale as keyof typeof selectedProcedure.cost.factors]?.slice(0, 3).map((factor, index) => (
                      <li key={index}>{factor}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (viewMode === 'compare' && compareList.length > 0) {
    return (
      <div className="procedure-compare bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {locale === 'zh' ? '程序比較' : locale === 'ja' ? '手順比較' : 'Procedure Comparison'}
          </h2>
          <button
            onClick={() => setViewMode('list')}
            className="text-blue-600 hover:text-blue-800"
          >
            {locale === 'zh' ? '返回列表' : locale === 'ja' ? 'リストに戻る' : 'Back to List'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-semibold">
                  {locale === 'zh' ? '項目' : locale === 'ja' ? '項目' : 'Attribute'}
                </th>
                {compareList.map(proc => (
                  <th key={proc.id} className="text-left p-4 min-w-64">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">
                          {proc.name[locale as keyof typeof proc.name]}
                        </div>
                        <div className="text-sm text-gray-600">
                          {getCategoryLabel(proc.category)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCompare(proc.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        ×
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4 font-medium">
                  {locale === 'zh' ? '持續時間' : locale === 'ja' ? '所要時間' : 'Duration'}
                </td>
                {compareList.map(proc => (
                  <td key={proc.id} className="p-4">
                    {proc.duration.typical} {locale === 'zh' ? '分鐘' : locale === 'ja' ? '分' : 'min'}
                    <div className="text-sm text-gray-500">
                      ({proc.duration.range.min}-{proc.duration.range.max} {locale === 'zh' ? '分鐘' : locale === 'ja' ? '分' : 'min'})
                    </div>
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">
                  {locale === 'zh' ? '專科' : locale === 'ja' ? '専門科' : 'Specialty'}
                </td>
                {compareList.map(proc => (
                  <td key={proc.id} className="p-4">
                    {getSpecialtyLabel(proc.specialty)}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">
                  {locale === 'zh' ? '主要優點' : locale === 'ja' ? '主な利点' : 'Key Benefits'}
                </td>
                {compareList.map(proc => (
                  <td key={proc.id} className="p-4">
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {proc.benefits[locale as keyof typeof proc.benefits]?.slice(0, 3).map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">
                  {locale === 'zh' ? '主要風險' : locale === 'ja' ? '主なリスク' : 'Major Risks'}
                </td>
                {compareList.map(proc => (
                  <td key={proc.id} className="p-4">
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {proc.risks.serious?.slice(0, 2).map((risk, index) => (
                        <li key={index} className="text-red-600">
                          {risk.risk[locale as keyof typeof risk.risk]}
                        </li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">
                  {locale === 'zh' ? '預估費用' : locale === 'ja' ? '推定費用' : 'Estimated Cost'}
                </td>
                {compareList.map(proc => (
                  <td key={proc.id} className="p-4">
                    <div className="text-sm">
                      ${proc.cost.estimated.min.toLocaleString()} - ${proc.cost.estimated.max.toLocaleString()}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="procedure-system bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {locale === 'zh' ? '醫療程序說明系統' : locale === 'ja' ? '医療手順説明システム' : 'Medical Procedure Explanation System'}
        </h2>
        {compareList.length > 0 && (
          <button
            onClick={() => setViewMode('compare')}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            {locale === 'zh' ? '比較程序' : locale === 'ja' ? '手順を比較' : 'Compare Procedures'} ({compareList.length})
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {locale === 'zh' ? '搜尋' : locale === 'ja' ? '検索' : 'Search'}
          </label>
          <input
            type="text"
            value={filters.searchTerm}
            onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
            placeholder={locale === 'zh' ? '搜尋程序名稱...' : locale === 'ja' ? '手順名を検索...' : 'Search procedures...'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {locale === 'zh' ? '分類' : locale === 'ja' ? 'カテゴリー' : 'Category'}
          </label>
          <select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">
              {locale === 'zh' ? '所有分類' : locale === 'ja' ? 'すべてのカテゴリー' : 'All Categories'}
            </option>
            {categories.map(category => (
              <option key={category} value={category}>
                {getCategoryLabel(category)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {locale === 'zh' ? '專科' : locale === 'ja' ? '専門科' : 'Specialty'}
          </label>
          <select
            value={filters.specialty}
            onChange={(e) => setFilters({...filters, specialty: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">
              {locale === 'zh' ? '所有專科' : locale === 'ja' ? 'すべての専門科' : 'All Specialties'}
            </option>
            {specialties.map(specialty => (
              <option key={specialty} value={specialty}>
                {getSpecialtyLabel(specialty)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {locale === 'zh' ? '排序' : locale === 'ja' ? 'ソート' : 'Sort By'}
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({...filters, sortBy: e.target.value as any})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">
              {locale === 'zh' ? '名稱' : locale === 'ja' ? '名前' : 'Name'}
            </option>
            <option value="category">
              {locale === 'zh' ? '分類' : locale === 'ja' ? 'カテゴリー' : 'Category'}
            </option>
            <option value="specialty">
              {locale === 'zh' ? '專科' : locale === 'ja' ? '専門科' : 'Specialty'}
            </option>
            <option value="duration">
              {locale === 'zh' ? '持續時間' : locale === 'ja' ? '所要時間' : 'Duration'}
            </option>
          </select>
        </div>
      </div> 
     {/* Results */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProcedures.map(procedure => (
          <div key={procedure.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  {procedure.name[locale as keyof typeof procedure.name]}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {procedure.description[locale as keyof typeof procedure.description]}
                </p>
                <div className="flex gap-2 text-xs text-gray-500">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {getCategoryLabel(procedure.category)}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                    {getSpecialtyLabel(procedure.specialty)}
                  </span>
                  <span>{procedure.duration.typical} {locale === 'zh' ? '分鐘' : locale === 'ja' ? '分' : 'min'}</span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>{locale === 'zh' ? '目的：' : locale === 'ja' ? '目的：' : 'Purpose:'}</strong>
              </p>
              <p className="text-sm text-gray-600 line-clamp-2">
                {procedure.purpose[locale as keyof typeof procedure.purpose]}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedProcedure(procedure);
                  setViewMode('detail');
                  setActiveTab('overview');
                }}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm"
              >
                {locale === 'zh' ? '詳細說明' : locale === 'ja' ? '詳細説明' : 'View Details'}
              </button>
              <button
                onClick={() => handleAddToCompare(procedure)}
                disabled={compareList.length >= 3 || compareList.find(proc => proc.id === procedure.id) !== undefined}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {locale === 'zh' ? '比較' : locale === 'ja' ? '比較' : 'Compare'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProcedures.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {locale === 'zh' ? '未找到符合條件的程序' : locale === 'ja' ? '条件に一致する手順が見つかりません' : 'No procedures found matching your criteria'}
        </div>
      )}
    </div>
  );
}