import React, { useState } from 'react';

interface LipidResult {
  totalCholesterol: number;
  ldlCholesterol: number;
  hdlCholesterol: number;
  triglycerides: number;
  riskLevel: string;
  riskColor: string;
  recommendations: string[];
  targets: {
    ldl: string;
    hdl: string;
    triglycerides: string;
  };
}

interface LipidCalculatorProps {
  locale?: string;
  onCalculationComplete?: (result: any) => void;
}

const SimpleLipidManagementCalculator: React.FC<LipidCalculatorProps> = ({ 
  locale = 'zh-TW', 
  onCalculationComplete 
}) => {
  const [totalCholesterol, setTotalCholesterol] = useState<string>('');
  const [ldlCholesterol, setLdlCholesterol] = useState<string>('');
  const [hdlCholesterol, setHdlCholesterol] = useState<string>('');
  const [triglycerides, setTriglycerides] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('male');
  const [diabetes, setDiabetes] = useState<boolean>(false);
  const [hypertension, setHypertension] = useState<boolean>(false);
  const [smoking, setSmoking] = useState<boolean>(false);
  const [familyHistory, setFamilyHistory] = useState<boolean>(false);
  const [result, setResult] = useState<LipidResult | null>(null);

  const assessRisk = () => {
    const tc = parseFloat(totalCholesterol);
    const ldl = parseFloat(ldlCholesterol);
    const hdl = parseFloat(hdlCholesterol);
    const tg = parseFloat(triglycerides);
    const ageNum = parseFloat(age);
    
    if (!tc || !ldl || !hdl || !tg || !ageNum) {
      alert('請填寫所有必要的數值');
      return;
    }

    // 風險評估
    let riskScore = 0;
    
    // 年齡風險
    if (ageNum >= 65) riskScore += 2;
    else if (ageNum >= 45) riskScore += 1;
    
    // 性別風險
    if (gender === 'male' && ageNum >= 45) riskScore += 1;
    if (gender === 'female' && ageNum >= 55) riskScore += 1;
    
    // 疾病風險
    if (diabetes) riskScore += 2;
    if (hypertension) riskScore += 1;
    if (smoking) riskScore += 1;
    if (familyHistory) riskScore += 1;
    
    // 血脂風險
    if (ldl >= 190) riskScore += 3;
    else if (ldl >= 160) riskScore += 2;
    else if (ldl >= 130) riskScore += 1;
    
    if (hdl < 40) riskScore += 1;
    if (tg >= 200) riskScore += 1;

    // 風險分級
    let riskLevel = '';
    let riskColor = '';
    let recommendations: string[] = [];
    let targets = { ldl: '', hdl: '', triglycerides: '' };

    if (riskScore <= 2) {
      riskLevel = '低風險';
      riskColor = '#22c55e';
      targets = {
        ldl: '< 130 mg/dL',
        hdl: '> 40 mg/dL (男性), > 50 mg/dL (女性)',
        triglycerides: '< 150 mg/dL'
      };
      recommendations = [
        '生活方式調整為主',
        '均衡飲食，減少飽和脂肪攝取',
        '規律運動，每週至少150分鐘',
        '維持健康體重',
        '每年檢查血脂'
      ];
    } else if (riskScore <= 4) {
      riskLevel = '中等風險';
      riskColor = '#f59e0b';
      targets = {
        ldl: '< 100 mg/dL',
        hdl: '> 40 mg/dL (男性), > 50 mg/dL (女性)',
        triglycerides: '< 150 mg/dL'
      };
      recommendations = [
        '積極生活方式調整',
        '考慮藥物治療（如 Statin）',
        '低飽和脂肪、低膽固醇飲食',
        '增加運動強度和頻率',
        '每6個月檢查血脂',
        '控制其他心血管風險因子'
      ];
    } else {
      riskLevel = '高風險';
      riskColor = '#ef4444';
      targets = {
        ldl: '< 70 mg/dL',
        hdl: '> 40 mg/dL (男性), > 50 mg/dL (女性)',
        triglycerides: '< 150 mg/dL'
      };
      recommendations = [
        '立即開始藥物治療',
        '高強度 Statin 治療',
        '嚴格飲食控制',
        '規律運動計劃',
        '每3個月檢查血脂',
        '積極控制血壓、血糖',
        '戒菸、限酒',
        '考慮心臟科會診'
      ];
    }

    const calculationResult: LipidResult = {
      totalCholesterol: tc,
      ldlCholesterol: ldl,
      hdlCholesterol: hdl,
      triglycerides: tg,
      riskLevel,
      riskColor,
      recommendations,
      targets
    };

    setResult(calculationResult);
    onCalculationComplete?.(calculationResult);
  };

  const reset = () => {
    setTotalCholesterol('');
    setLdlCholesterol('');
    setHdlCholesterol('');
    setTriglycerides('');
    setAge('');
    setGender('male');
    setDiabetes(false);
    setHypertension(false);
    setSmoking(false);
    setFamilyHistory(false);
    setResult(null);
  };

  return (
    <div style={{
      maxWidth: '900px',
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
        血脂管理與心血管風險評估
      </h2>
      
      {/* 血脂數值輸入 */}
      <div style={{
        backgroundColor: '#f9fafb',
        padding: '16px',
        borderRadius: '6px',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '16px'
        }}>
          血脂檢查數值 (mg/dL)
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              總膽固醇 (TC)
            </label>
            <input
              type="number"
              value={totalCholesterol}
              onChange={(e) => setTotalCholesterol(e.target.value)}
              placeholder="例如：200"
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
              低密度膽固醇 (LDL)
            </label>
            <input
              type="number"
              value={ldlCholesterol}
              onChange={(e) => setLdlCholesterol(e.target.value)}
              placeholder="例如：120"
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
              高密度膽固醇 (HDL)
            </label>
            <input
              type="number"
              value={hdlCholesterol}
              onChange={(e) => setHdlCholesterol(e.target.value)}
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
              三酸甘油脂 (TG)
            </label>
            <input
              type="number"
              value={triglycerides}
              onChange={(e) => setTriglycerides(e.target.value)}
              placeholder="例如：150"
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
      </div>
      
      {/* 基本資料 */}
      <div style={{
        backgroundColor: '#f9fafb',
        padding: '16px',
        borderRadius: '6px',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '16px'
        }}>
          基本資料與風險因子
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
              年齡 (歲)
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="例如：55"
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
        
        <div style={{ display: 'grid', gap: '8px' }}>
          {[
            { key: 'diabetes', label: '糖尿病', value: diabetes, setter: setDiabetes },
            { key: 'hypertension', label: '高血壓', value: hypertension, setter: setHypertension },
            { key: 'smoking', label: '吸菸', value: smoking, setter: setSmoking },
            { key: 'familyHistory', label: '心血管疾病家族史', value: familyHistory, setter: setFamilyHistory }
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
          onClick={assessRisk}
          style={{
            flex: '1',
            backgroundColor: '#059669',
            color: 'white',
            padding: '12px 16px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          評估風險
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
            風險評估結果
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: result.riskColor,
                marginBottom: '8px'
              }}>
                {result.riskLevel}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                心血管風險等級
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#ffffff',
              padding: '12px',
              borderRadius: '6px'
            }}>
              <h4 style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#111827',
                marginBottom: '8px'
              }}>
                目標數值
              </h4>
              <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.4' }}>
                <div>LDL: {result.targets.ldl}</div>
                <div>HDL: {result.targets.hdl}</div>
                <div>TG: {result.targets.triglycerides}</div>
              </div>
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#ffffff',
            padding: '16px',
            borderRadius: '6px'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '12px'
            }}>
              治療建議
            </h4>
            
            <div style={{ display: 'grid', gap: '6px' }}>
              {result.recommendations.map((rec, index) => (
                <div key={index} style={{
                  fontSize: '14px',
                  color: '#374151',
                  padding: '6px 12px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'flex-start'
                }}>
                  <span style={{
                    color: result.riskColor,
                    marginRight: '8px',
                    fontWeight: 'bold'
                  }}>
                    •
                  </span>
                  {rec}
                </div>
              ))}
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
              <strong>注意：</strong> 此評估僅供參考，實際治療方案應由醫師根據個人整體狀況決定。
              請定期追蹤血脂變化並遵循醫師指示。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleLipidManagementCalculator;