import React, { useState } from 'react';

interface EGFRCalculatorProps {
  locale?: string;
  onCalculationComplete?: (result: any) => void;
}

const SimpleEGFRCalculator: React.FC<EGFRCalculatorProps> = ({ locale = 'zh-TW', onCalculationComplete }) => {
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('male');
  const [creatinine, setCreatinine] = useState<string>('');
  const [egfr, setEgfr] = useState<number | null>(null);
  const [stage, setStage] = useState<string>('');
  const [stageColor, setStageColor] = useState<string>('');

  const calculateEGFR = () => {
    const ageNum = parseFloat(age);
    const creatinineNum = parseFloat(creatinine);
    
    if (!ageNum || !creatinineNum || ageNum <= 0 || creatinineNum <= 0) {
      alert('請輸入有效的年齡和肌酸酐值');
      return;
    }
    
    // CKD-EPI 公式 (2021年版本)
    const kappa = gender === 'female' ? 0.7 : 0.9;
    const alpha = gender === 'female' ? -0.329 : -0.411;
    const genderFactor = gender === 'female' ? 1.018 : 1;
    
    const creatinineRatio = creatinineNum / kappa;
    const minValue = Math.min(creatinineRatio, 1);
    const maxValue = Math.max(creatinineRatio, 1);
    
    let egfrValue = 141 * Math.pow(minValue, alpha) * Math.pow(maxValue, -1.209) * Math.pow(0.993, ageNum) * genderFactor;
    egfrValue = Math.round(egfrValue * 10) / 10;
    
    let stageText = '';
    let color = '';
    
    if (egfrValue >= 90) {
      stageText = '第1期 (正常或高)';
      color = '#22c55e';
    } else if (egfrValue >= 60) {
      stageText = '第2期 (輕度下降)';
      color = '#84cc16';
    } else if (egfrValue >= 45) {
      stageText = '第3a期 (中度下降)';
      color = '#f59e0b';
    } else if (egfrValue >= 30) {
      stageText = '第3b期 (中重度下降)';
      color = '#f97316';
    } else if (egfrValue >= 15) {
      stageText = '第4期 (重度下降)';
      color = '#ef4444';
    } else {
      stageText = '第5期 (腎衰竭)';
      color = '#dc2626';
    }
    
    setEgfr(egfrValue);
    setStage(stageText);
    setStageColor(color);
    
    const result = {
      egfr: egfrValue,
      stage: stageText,
      stageColor: color
    };
    
    onCalculationComplete?.(result);
  };

  const reset = () => {
    setAge('');
    setGender('male');
    setCreatinine('');
    setEgfr(null);
    setStage('');
    setStageColor('');
  };

  return (
    <div style={{
      maxWidth: '700px',
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
        eGFR 腎絲球過濾率計算器
      </h2>
      
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
            年齡 (歲)
          </label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="例如：45"
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
            性別
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
              backgroundColor: 'white'
            }}
          >
            <option value="male">男性</option>
            <option value="female">女性</option>
          </select>
        </div>
      </div>
      
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '8px'
        }}>
          血清肌酸酐 (mg/dL)
        </label>
        <input
          type="number"
          step="0.01"
          value={creatinine}
          onChange={(e) => setCreatinine(e.target.value)}
          placeholder="例如：1.2"
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
        <p style={{
          fontSize: '12px',
          color: '#6b7280',
          marginTop: '4px',
          margin: '4px 0 0 0'
        }}>
          正常值：男性 0.7-1.3 mg/dL，女性 0.6-1.1 mg/dL
        </p>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <button
          onClick={calculateEGFR}
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
          計算 eGFR
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
      
      {egfr && (
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
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <div>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#3b82f6',
                marginBottom: '4px'
              }}>
                {egfr}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                mL/min/1.73m²
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '18px',
                fontWeight: '600',
                color: stageColor,
                marginBottom: '4px'
              }}>
                {stage}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                慢性腎臟病分期
              </div>
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#dbeafe',
            padding: '16px',
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#1e40af',
              marginBottom: '8px'
            }}>
              慢性腎臟病分期標準
            </h4>
            <div style={{
              fontSize: '12px',
              color: '#1e40af',
              lineHeight: '1.6'
            }}>
              <div>• 第1期：eGFR ≥ 90 (正常或高)</div>
              <div>• 第2期：eGFR 60-89 (輕度下降)</div>
              <div>• 第3a期：eGFR 45-59 (中度下降)</div>
              <div>• 第3b期：eGFR 30-44 (中重度下降)</div>
              <div>• 第4期：eGFR 15-29 (重度下降)</div>
              <div>• 第5期：eGFR &lt; 15 (腎衰竭)</div>
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#fef3c7',
            padding: '12px',
            borderRadius: '6px'
          }}>
            <p style={{
              fontSize: '12px',
              color: '#92400e',
              margin: '0'
            }}>
              <strong>注意：</strong> 此計算使用 CKD-EPI 2021 公式。結果僅供參考，
              實際診斷和治療請諮詢腎臟科專科醫師。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleEGFRCalculator;