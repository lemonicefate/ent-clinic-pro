import React from 'react';

const SimpleTest: React.FC = () => {
  return (
    <div className="p-4 bg-green-100 border border-green-300 rounded">
      <h2 className="text-lg font-bold text-green-800">React 組件測試</h2>
      <p className="text-green-700">如果你看到這個訊息，表示 React 組件正常工作！</p>
    </div>
  );
};

export default SimpleTest;