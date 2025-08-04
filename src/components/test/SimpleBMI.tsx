import React, { useState } from 'react';

const SimpleBMI: React.FC = () => {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);

  const calculate = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h && w) {
      const result = w / ((h / 100) ** 2);
      setBmi(Math.round(result * 100) / 100);
    }
  };

  return (
    <div className="p-6 bg-white border rounded-lg">
      <h3 className="text-xl font-bold mb-4">簡單 BMI 計算器</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">身高 (cm)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="170"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">體重 (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="65"
          />
        </div>
      </div>
      
      <button
        onClick={calculate}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        計算 BMI
      </button>
      
      {bmi && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p className="text-lg font-semibold">BMI: {bmi}</p>
        </div>
      )}
    </div>
  );
};

export default SimpleBMI;