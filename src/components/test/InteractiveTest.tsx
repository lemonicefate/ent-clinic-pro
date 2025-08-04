import React, { useState } from 'react';

const InteractiveTest: React.FC = () => {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #3b82f6', 
      borderRadius: '8px', 
      margin: '10px 0',
      backgroundColor: '#f8fafc'
    }}>
      <h3 style={{ color: '#1e40af', marginBottom: '15px' }}>
        🧪 React 互動測試
      </h3>
      
      <div style={{ marginBottom: '15px' }}>
        <p>計數器: <strong>{count}</strong></p>
        <button 
          onClick={() => setCount(count + 1)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          增加
        </button>
        <button 
          onClick={() => setCount(0)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          重設
        </button>
      </div>
      
      <div>
        <p>輸入測試:</p>
        <input 
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="輸入一些文字..."
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            width: '200px',
            marginRight: '10px'
          }}
        />
        <p>你輸入了: <strong>{text}</strong></p>
      </div>
      
      <p style={{ marginTop: '15px', fontSize: '14px', color: '#6b7280' }}>
        如果你能看到這個組件並且按鈕和輸入框能正常工作，表示 React 水合成功！
      </p>
    </div>
  );
};

export default InteractiveTest;