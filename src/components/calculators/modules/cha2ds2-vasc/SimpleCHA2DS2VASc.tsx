import React, { useState } from 'react';

interface CHA2DS2VAScResult {
  score: number;
  riskLevel: string;
  riskColor: string;
  strokeRisk: string;
  recommendation: string;
  details: string[];
}

interface CHA2DS2VAScCalculatorProps {
  locale?: string;
  onCalculationComplete?: (result: any) => void;
}

const SimpleCHA2DS2VAScCalculator: React.FC<CHA2DS2VAScCalculatorProps> = ({ 
  locale = 'zh-TW', 
  onCalculationComplete 
}) => {
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('male');
  const [congestiveHeartFailure, setCongestiveHeartFailure] = useState<boolean>(false);
  const [hypertension, setHypertension] = useState<boolean>(false);
  const [diabetes, setDiabetes] = useState<boolean>(false);
  const [stroke, setStroke] = useState<boolean>(false);
  const [vascularDisease, setVascularDisease] = useState<boolean>(false);
  const [result, setResult] = useState<CHA2DS2VAScResult | null>(null);

  const calculateScore = () => {
    const ageNum = parseFloat(age);
    
    if (!ageNum || ageNum <= 0) {
      alert('請輸入有效的年齡');
      return;
    }

    let score = 0;
    const details: string[] = [];

    // C - Congestive heart failure (1 point)
    if (congestiveHeartFailure) {
      score += 1;
      details.push('充血性心衰竭 (+1)');
    }

    // H - Hypertension (1 point)
    if (hypertension) {
      score += 1;
      details.push('高血壓 (+1)');
    }

    // A - Age ≥75 (2 points), Age 65-74 (1 point)
    if (ageNum >= 75) {
      score += 2;
      details.push('年齡 ≥75歲 (+2)');
    } else if (ageNum >= 65) {
      score += 1;
      details.push('年齡 65-74歲 (+1)');
    }

    // D - Diabetes (1 point)
    if (diabetes) {
      score += 1;
      details.push('糖尿病 (+1)');
    }

    // S - Stroke/TIA (2 points)
    if (stroke) {
      score += 2;
      details.push('中風/TIA 病史 (+2)');
    }

    // V - Vascular disease (1 point)
    if (vascularDisease) {
      score += 1;
      details.push('血管疾病 (+1)');
    }

    // S - Sex (female) (1 point if other risk factors present)
    if (gender === 'female' && score > 0) {
      score += 1;
      details.push('女性 (+1)');
    }

    // 風險評估
    let riskLevel = '';
    let riskColor = '';
    let strokeRisk = '';
    let recommendation = '';

    if (score === 0) {
      riskLevel = '極低風險';
      riskColor = '#22c55e';
      strokeRisk = '< 1% 每年';
      recommendation = '不建議抗凝治療，可考慮阿司匹林';
    } else if (score === 1) {
      riskLevel = '低風險';
      riskColor = '#84cc16';
      strokeRisk = '1-2% 每年';
      recommendation = '可考慮抗凝治療，評估出血風險';
    } else if (score === 2) {
      riskLevel = '中等風險';
      riskColor = '#f59e0b';
      strokeRisk = '2-4% 每年';
      recommendation = '建議抗凝治療，除非有禁忌症';
    } else {
      riskLevel = '高風險';
      riskColor = '#ef4444';
      strokeRisk = '> 4% 每年';
      recommendation = '強烈建議抗凝治療';
    }

    const calculationResult: CHA2DS2VAScResult = {
      score,
      riskLevel,
      riskColor,
      strokeRisk,
      recommendation,
      details
    };

    setResult(calculationResult);
    onCalculationComplete?.(calculationResult);
  };

  const reset = () => {
    setAge('');
    setGender('male');
    setCongestiveHeartFailure(false);
    setHypertension(false);
    setDiabetes(false);
    setStroke(false);
    setVascularDisease(false);
    setResult(null);
  };

  return (
    <div style={{
      maxWidth: '800px',
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
        CHA₂DS₂-VASc 評分計算器
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
            年齡 (歲)
          </label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="例如：70"
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
      
      <div style={{
        backgroundColor: '#f9fafb',
        padding: '16px',
        borderRadius: '6px',
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '16px'
        }}>
          風險因子評估
        </h3>
        
        <div style={{ display: 'grid', gap: '12px' }}>
          {[
            { key: 'congestiveHeartFailure', label: 'C - 充血性心衰竭', value: congestiveHeartFailure, setter: setCongestiveHeartFailure },
            { key: 'hypertension', label: 'H - 高血壓', value: hypertension, setter: setHypertension },
            { key: 'diabetes', label: 'D - 糖尿病', value: diabetes, setter: setDiabetes },
            { key: 'stroke', label: 'S - 中風/TIA 病史', value: stroke, setter: setStroke },
            { key: 'vascularDisease', label: 'V - 血管疾病', value: vascularDisease, setter: setVascularDisease }
          ].map((item) => (
            <label key={item.key} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              backgroundColor: item.value ? '#dbeafe' : '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              <input
                type="checkbox"
                checked={item.value}
                onChange={(e) => item.setter(e.target.checked)}
                style={{
                  marginRight: '8px',
                  width: '16px',
                  height: '16px'
                }}
              />
              {item.label}
            </label>
          ))}
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <button
          onClick={calculateScore}
          style={{
            flex: '1',
            backgroundColor: '#7c3aed',
            color: 'white',
            padding: '12px 16px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          計算評分
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
      
      {result && (
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
            評分結果
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '16px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#7c3aed',
                marginBottom: '4px'
              }}>
                {result.score}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                CHA₂DS₂-VASc 評分
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '18px',
                fontWeight: '600',
                color: result.riskColor,
                marginBottom: '4px'
              }}>
                {result.riskLevel}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                風險等級
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '4px'
              }}>
                {result.strokeRisk}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                年中風風險
              </div>
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#ffffff',
            padding: '16px',
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '12px'
            }}>
              評分詳情
            </h4>
            
            {result.details.length > 0 ? (
              <div style={{ display: 'grid', gap: '4px' }}>
                {result.details.map((detail, index) => (
                  <div key={index} style={{
                    fontSize: '14px',
                    color: '#374151',
                    padding: '4px 8px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '4px'
                  }}>
                    {detail}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: '0'
              }}>
                無風險因子
              </p>
            )}
          </div>
          
          <div style={{
            backgroundColor: '#dbeafe',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '12px'
          }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#1e40af',
              marginBottom: '4px'
            }}>
              治療建議
            </h4>
            <p style={{
              fontSize: '14px',
              color: '#1e40af',
              margin: '0'
            }}>
              {result.recommendation}
            </p>
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
              <strong>注意：</strong> 此評分僅供參考，實際治療決策應結合患者整體狀況，
              並評估出血風險（如 HAS-BLED 評分）。請諮詢心臟科醫師。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleCHA2DS2VAScCalculator;