import React, { useState } from 'react';

const InlineStyleTest: React.FC = () => {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);

  const calculate = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h && w && h > 0 && w > 0) {
      const result = w / ((h / 100) ** 2);
      setBmi(Math.round(result * 100) / 100);
    } else {
      alert('請輸入有效的身高和體重');
    }
  };

  const reset = () => {
    setHeight('');
    setWeight('');
    setBmi(null);
  };

  return (
    <div style={{
      padding: '24px',
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      margin: '16px 0',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <h3 style={{
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: '16px',
        textAlign: 'center'
      }}>
        🧮 內聯樣式 BMI 計算器
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '16px'
      }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }}>
            身高 (公分)
          </label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="例如：170"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
        
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }}>
            體重 (公斤)
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="例如：65"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <button
          onClick={calculate}
          style={{
            flex: '1',
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '10px 16px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }}
        >
          計算 BMI
        </button>
        
        <button
          onClick={reset}
          style={{
            padding: '10px 16px',
            backgroundColor: 'transparent',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#f9fafb';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          重設
        </button>
      </div>
      
      {bmi && (
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '16px',
          borderRadius: '6px',
          marginTop: '16px'
        }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '12px'
          }}>
            計算結果
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '16px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#3b82f6',
                marginBottom: '4px'
              }}>
                {bmi}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                BMI 指數
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: bmi < 18.5 ? '#3b82f6' : 
                      bmi < 24 ? '#22c55e' : 
                      bmi < 27 ? '#f59e0b' : 
                      bmi < 30 ? '#f97316' : 
                      bmi < 35 ? '#ef4444' : '#dc2626',
                marginBottom: '4px'
              }}>
                {bmi < 18.5 ? '體重過輕' : 
                 bmi < 24 ? '正常體重' : 
                 bmi < 27 ? '體重過重' : 
                 bmi < 30 ? '輕度肥胖' : 
                 bmi < 35 ? '中度肥胖' : '重度肥胖'}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                體重分類
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px'
              }}>
                {bmi < 18.5 ? '營養不良風險' : 
                 bmi < 24 ? '健康風險最低' : 
                 bmi < 27 ? '輕度健康風險' : 
                 bmi < 30 ? '中度健康風險' : 
                 bmi < 35 ? '高度健康風險' : '極高健康風險'}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                健康風險
              </div>
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#dbeafe',
            padding: '12px',
            borderRadius: '6px',
            marginTop: '16px'
          }}>
            <h5 style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#1e40af',
              marginBottom: '8px'
            }}>
              BMI 分類標準 (成人)
            </h5>
            <div style={{
              fontSize: '12px',
              color: '#1e40af',
              lineHeight: '1.5'
            }}>
              <div>• 體重過輕：BMI &lt; 18.5</div>
              <div>• 正常體重：18.5 ≤ BMI &lt; 24</div>
              <div>• 體重過重：24 ≤ BMI &lt; 27</div>
              <div>• 輕度肥胖：27 ≤ BMI &lt; 30</div>
              <div>• 中度肥胖：30 ≤ BMI &lt; 35</div>
              <div>• 重度肥胖：BMI ≥ 35</div>
            </div>
          </div>
        </div>
      )}
      
      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#fef3c7',
        borderRadius: '6px'
      }}>
        <p style={{
          fontSize: '12px',
          color: '#92400e',
          margin: '0'
        }}>
          <strong>注意：</strong> BMI 僅供參考，不適用於孕婦、哺乳期婦女、18歲以下兒童及肌肉發達者。
          如有健康疑慮，請諮詢專業醫師。
        </p>
      </div>
    </div>
  );
};

export default InlineStyleTest;