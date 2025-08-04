import React, { useState } from 'react';

interface BMICalculatorProps {
  locale?: string;
  onCalculationComplete?: (result: any) => void;
}

const SimpleBMICalculator: React.FC<BMICalculatorProps> = ({ locale = 'zh-TW', onCalculationComplete }) => {
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState<string>('');
  const [categoryColor, setCategoryColor] = useState<string>('');

  const calculateBMI = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    
    if (!h || !w || h <= 0 || w <= 0) {
      alert('請輸入有效的身高和體重');
      return;
    }
    
    const heightInMeters = h / 100;
    const bmiValue = w / (heightInMeters * heightInMeters);
    const roundedBmi = Math.round(bmiValue * 100) / 100;
    
    let cat = '';
    let color = '';
    
    if (bmiValue < 18.5) {
      cat = '體重過輕';
      color = '#3b82f6';
    } else if (bmiValue < 24) {
      cat = '正常體重';
      color = '#22c55e';
    } else if (bmiValue < 27) {
      cat = '體重過重';
      color = '#f59e0b';
    } else if (bmiValue < 30) {
      cat = '輕度肥胖';
      color = '#f97316';
    } else if (bmiValue < 35) {
      cat = '中度肥胖';
      color = '#ef4444';
    } else {
      cat = '重度肥胖';
      color = '#dc2626';
    }
    
    setBmi(roundedBmi);
    setCategory(cat);
    setCategoryColor(color);
    
    const result = {
      bmi: roundedBmi,
      category: cat,
      categoryColor: color
    };
    
    onCalculationComplete?.(result);
  };

  const reset = () => {
    setHeight('');
    setWeight('');
    setBmi(null);
    setCategory('');
    setCategoryColor('');
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '24px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        BMI 身體質量指數計算器
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '24px'
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
              outline: 'none',
              boxSizing: 'border-box'
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
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <button
          onClick={calculateBMI}
          style={{
            flex: '1',
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '12px 16px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          計算 BMI
        </button>
        
        <button
          onClick={reset}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          重設
        </button>
      </div>
      
      {bmi && (
        <div style={{
          backgroundColor: '#f9fafb',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '16px'
          }}>
            計算結果
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{
                fontSize: '32px',
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
                fontSize: '18px',
                fontWeight: '600',
                color: categoryColor,
                marginBottom: '4px'
              }}>
                {category}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                體重分類
              </div>
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#dbeafe',
            padding: '16px',
            borderRadius: '6px',
            marginTop: '20px'
          }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#1e40af',
              marginBottom: '8px'
            }}>
              BMI 分類標準 (成人)
            </h4>
            <div style={{
              fontSize: '12px',
              color: '#1e40af',
              lineHeight: '1.6'
            }}>
              <div>• 體重過輕：BMI &lt; 18.5</div>
              <div>• 正常體重：18.5 ≤ BMI &lt; 24</div>
              <div>• 體重過重：24 ≤ BMI &lt; 27</div>
              <div>• 輕度肥胖：27 ≤ BMI &lt; 30</div>
              <div>• 中度肥胖：30 ≤ BMI &lt; 35</div>
              <div>• 重度肥胖：BMI ≥ 35</div>
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#fef3c7',
            padding: '12px',
            borderRadius: '6px',
            marginTop: '16px'
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
      )}
    </div>
  );
};

export default SimpleBMICalculator;