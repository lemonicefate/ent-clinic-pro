import React, { useState, useEffect, useMemo } from 'react';
import type { Medication } from '../../types/medication';

interface MedicationInformationSystemProps {
  medications: Medication[];
  locale: string;
}

interface FilterState {
  category: string;
  searchTerm: string;
  sortBy: 'name' | 'category' | 'strength';
}

export default function MedicationInformationSystem({ 
  medications, 
  locale 
}: MedicationInformationSystemProps) {
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    searchTerm: '',
    sortBy: 'name'
  });
  
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [compareList, setCompareList] = useState<Medication[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'compare' | 'detail'>('list');

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const cats = [...new Set(medications.map(med => med.category))];
    return cats.sort();
  }, [medications]);

  // Filter and sort medications
  const filteredMedications = useMemo(() => {
    let filtered = medications.filter(med => {
      const matchesCategory = filters.category === 'all' || med.category === filters.category;
      const matchesSearch = filters.searchTerm === '' || 
        med.name[locale as keyof typeof med.name]?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        med.genericName[locale as keyof typeof med.genericName]?.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });

    // Sort medications
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return (a.name[locale as keyof typeof a.name] || '').localeCompare(
            b.name[locale as keyof typeof b.name] || ''
          );
        case 'category':
          return a.category.localeCompare(b.category);
        case 'strength':
          return a.strength.localeCompare(b.strength);
        default:
          return 0;
      }
    });

    return filtered;
  }, [medications, filters, locale]);

  const handleAddToCompare = (medication: Medication) => {
    if (compareList.length < 3 && !compareList.find(med => med.id === medication.id)) {
      setCompareList([...compareList, medication]);
    }
  };

  const handleRemoveFromCompare = (medicationId: string) => {
    setCompareList(compareList.filter(med => med.id !== medicationId));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      'pain-relief': {
        en: 'Pain Relief',
        zh: '止痛藥',
        ja: '鎮痛薬'
      },
      'diabetes': {
        en: 'Diabetes',
        zh: '糖尿病藥物',
        ja: '糖尿病薬'
      },
      'cardiovascular': {
        en: 'Cardiovascular',
        zh: '心血管藥物',
        ja: '心血管薬'
      }
    };
    return labels[category as keyof typeof labels]?.[locale as keyof typeof labels[keyof typeof labels]] || category;
  };

  if (viewMode === 'detail' && selectedMedication) {
    return (
      <div className="medication-detail bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <button
            onClick={() => setViewMode('list')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← {locale === 'zh' ? '返回列表' : locale === 'ja' ? 'リストに戻る' : 'Back to List'}
          </button>
          <button
            onClick={() => handleAddToCompare(selectedMedication)}
            disabled={compareList.length >= 3 || compareList.find(med => med.id === selectedMedication.id) !== undefined}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {locale === 'zh' ? '加入比較' : locale === 'ja' ? '比較に追加' : 'Add to Compare'}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {selectedMedication.name[locale as keyof typeof selectedMedication.name]}
              </h1>
              <p className="text-lg text-gray-600 mb-2">
                {selectedMedication.genericName[locale as keyof typeof selectedMedication.genericName]}
              </p>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>{selectedMedication.strength}</span>
                <span>{selectedMedication.dosageForm[locale as keyof typeof selectedMedication.dosageForm]}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {getCategoryLabel(selectedMedication.category)}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                {locale === 'zh' ? '描述' : locale === 'ja' ? '説明' : 'Description'}
              </h3>
              <p className="text-gray-700">
                {selectedMedication.description[locale as keyof typeof selectedMedication.description]}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                {locale === 'zh' ? '適應症' : locale === 'ja' ? '適応症' : 'Indications'}
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {selectedMedication.indications[locale as keyof typeof selectedMedication.indications]?.map((indication, index) => (
                  <li key={index} className="text-gray-700">{indication}</li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                {locale === 'zh' ? '用法用量' : locale === 'ja' ? '用法・用量' : 'Dosage'}
              </h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-800">
                  {selectedMedication.dosage.adult[locale as keyof typeof selectedMedication.dosage.adult]}
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                {locale === 'zh' ? '禁忌症' : locale === 'ja' ? '禁忌' : 'Contraindications'}
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {selectedMedication.contraindications[locale as keyof typeof selectedMedication.contraindications]?.map((contraindication, index) => (
                  <li key={index} className="text-red-700">{contraindication}</li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                {locale === 'zh' ? '副作用' : locale === 'ja' ? '副作用' : 'Side Effects'}
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-yellow-700 mb-2">
                    {locale === 'zh' ? '常見副作用' : locale === 'ja' ? '一般的な副作用' : 'Common Side Effects'}
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedMedication.sideEffects.common[locale as keyof typeof selectedMedication.sideEffects.common]?.map((effect, index) => (
                      <li key={index} className="text-gray-700">{effect}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-red-700 mb-2">
                    {locale === 'zh' ? '嚴重副作用' : locale === 'ja' ? '重篤な副作用' : 'Serious Side Effects'}
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedMedication.sideEffects.serious[locale as keyof typeof selectedMedication.sideEffects.serious]?.map((effect, index) => (
                      <li key={index} className="text-red-700">{effect}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {selectedMedication.interactions && selectedMedication.interactions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">
                  {locale === 'zh' ? '藥物交互作用' : locale === 'ja' ? '薬物相互作用' : 'Drug Interactions'}
                </h3>
                <div className="space-y-3">
                  {selectedMedication.interactions.map((interaction, index) => (
                    <div key={index} className={`p-3 rounded-lg ${getSeverityColor(interaction.severity)}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium">{interaction.medication}</span>
                        <span className="text-xs uppercase font-semibold">
                          {interaction.severity}
                        </span>
                      </div>
                      <p className="text-sm">
                        {interaction.description[locale as keyof typeof interaction.description]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'compare' && compareList.length > 0) {
    return (
      <div className="medication-compare bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {locale === 'zh' ? '藥物比較' : locale === 'ja' ? '薬物比較' : 'Medication Comparison'}
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
                {compareList.map(med => (
                  <th key={med.id} className="text-left p-4 min-w-64">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">
                          {med.name[locale as keyof typeof med.name]}
                        </div>
                        <div className="text-sm text-gray-600">
                          {med.genericName[locale as keyof typeof med.genericName]}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCompare(med.id)}
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
                  {locale === 'zh' ? '劑量' : locale === 'ja' ? '用量' : 'Strength'}
                </td>
                {compareList.map(med => (
                  <td key={med.id} className="p-4">{med.strength}</td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">
                  {locale === 'zh' ? '劑型' : locale === 'ja' ? '剤形' : 'Form'}
                </td>
                {compareList.map(med => (
                  <td key={med.id} className="p-4">
                    {med.dosageForm[locale as keyof typeof med.dosageForm]}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">
                  {locale === 'zh' ? '適應症' : locale === 'ja' ? '適応症' : 'Indications'}
                </td>
                {compareList.map(med => (
                  <td key={med.id} className="p-4">
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {med.indications[locale as keyof typeof med.indications]?.slice(0, 3).map((indication, index) => (
                        <li key={index}>{indication}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">
                  {locale === 'zh' ? '常見副作用' : locale === 'ja' ? '一般的な副作用' : 'Common Side Effects'}
                </td>
                {compareList.map(med => (
                  <td key={med.id} className="p-4">
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {med.sideEffects.common[locale as keyof typeof med.sideEffects.common]?.slice(0, 3).map((effect, index) => (
                        <li key={index}>{effect}</li>
                      ))}
                    </ul>
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
    <div className="medication-system bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {locale === 'zh' ? '藥物資訊系統' : locale === 'ja' ? '薬物情報システム' : 'Medication Information System'}
        </h2>
        {compareList.length > 0 && (
          <button
            onClick={() => setViewMode('compare')}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            {locale === 'zh' ? '比較藥物' : locale === 'ja' ? '薬物を比較' : 'Compare Medications'} ({compareList.length})
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {locale === 'zh' ? '搜尋' : locale === 'ja' ? '検索' : 'Search'}
          </label>
          <input
            type="text"
            value={filters.searchTerm}
            onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
            placeholder={locale === 'zh' ? '搜尋藥物名稱...' : locale === 'ja' ? '薬物名を検索...' : 'Search medications...'}
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
            {locale === 'zh' ? '排序' : locale === 'ja' ? 'ソート' : 'Sort By'}
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({...filters, sortBy: e.target.value as FilterState['sortBy']})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">
              {locale === 'zh' ? '名稱' : locale === 'ja' ? '名前' : 'Name'}
            </option>
            <option value="category">
              {locale === 'zh' ? '分類' : locale === 'ja' ? 'カテゴリー' : 'Category'}
            </option>
            <option value="strength">
              {locale === 'zh' ? '劑量' : locale === 'ja' ? '用量' : 'Strength'}
            </option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMedications.map(medication => (
          <div key={medication.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  {medication.name[locale as keyof typeof medication.name]}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {medication.genericName[locale as keyof typeof medication.genericName]}
                </p>
                <div className="flex gap-2 text-xs text-gray-500">
                  <span>{medication.strength}</span>
                  <span>{medication.dosageForm[locale as keyof typeof medication.dosageForm]}</span>
                </div>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {getCategoryLabel(medication.category)}
              </span>
            </div>

            <p className="text-sm text-gray-700 mb-4 line-clamp-2">
              {medication.description[locale as keyof typeof medication.description]}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedMedication(medication);
                  setViewMode('detail');
                }}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm"
              >
                {locale === 'zh' ? '詳細資訊' : locale === 'ja' ? '詳細情報' : 'View Details'}
              </button>
              <button
                onClick={() => handleAddToCompare(medication)}
                disabled={compareList.length >= 3 || compareList.find(med => med.id === medication.id) !== undefined}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {locale === 'zh' ? '比較' : locale === 'ja' ? '比較' : 'Compare'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredMedications.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {locale === 'zh' ? '未找到符合條件的藥物' : locale === 'ja' ? '条件に一致する薬物が見つかりません' : 'No medications found matching your criteria'}
        </div>
      )}
    </div>
  );
}