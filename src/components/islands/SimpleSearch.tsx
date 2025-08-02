/**
 * 簡化搜尋組件 - 用於測試渲染
 */

import { useState } from 'react';

interface Props {
  placeholder?: string;
  className?: string;
}

export default function SimpleSearch({ placeholder = "搜尋...", className = "" }: Props) {
  const [query, setQuery] = useState('');
  const [isActive, setIsActive] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('搜尋查詢:', query);
    setIsActive(true);
  };

  return (
    <div className={`simple-search ${className}`}>
      <form onSubmit={handleSubmit} className="flex space-x-4">
        <div className="flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          搜尋
        </button>
      </form>
      
      {isActive && query && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            您搜尋了: <strong>{query}</strong>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            搜尋功能正常運作！
          </p>
        </div>
      )}
    </div>
  );
}