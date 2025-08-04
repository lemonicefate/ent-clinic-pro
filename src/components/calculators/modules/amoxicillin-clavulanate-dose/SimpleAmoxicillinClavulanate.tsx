import React, { useState } from 'react';

interface AmoxicillinResult {
  totalDailyDose: number;
  singleDose: number;
  recommendedTablets: Array<{
    strength: string;
    count: number;
    totalAmoxicillin: number;
    totalClavulanate: number;
  }>;
  treatmentGoal: string;
  frequency: string;
}

interface AmoxicillinCalculatorProps {
  locale?: string;
  onCalculationComplete?: (result: any) => void;
}

const SimpleAmoxicillinClavulanateCalculator: React.FC<AmoxicillinCalculatorProps> = ({ 
  locale = 'zh-TW', 
  onCalculationComplete 
}) => {
  const [weight, setWeight] = useState<string>('');
  const [treatmentGoal, setTreatmentGoal] = useState<string>('mild');
  const [result, setResult] = useState<AmoxicillinResult | null>(null);

  // 可用的藥錠規格 (Amoxicillin/Clavulanate mg)
  const tabletStrengths = [
    { name: '250/62.5 mg', amoxicillin: 250, clavulanate: 62.5 },
    { name: '500/125 mg', amoxicillin: 500, clavulanate: 125 },
    { name: '875/125 mg', amoxicillin: 875, clavulanate: 125 },
    { name: '1000/62.5 mg', amoxicillin: 1000, clavulanate: 62.5 }
  ];

  const calculateDose = () => {
    const weightNum = parseFloat(weight);
    
    if (!weightNum || weightNum <= 0) {
      alert('請輸入有效的體重');
      return;
    }

    // 劑量目標 (mg/kg/day of amoxicillin)
    const dosePerKg = treatmentGoal === 'mild' ? 45 : 90;
    const totalDailyDose = weightNum * dosePerKg;
    
    // 一般每日三次給藥
    const frequency = '每日三次';
    const singleDose = totalDailyDose / 3;

    // 計算最佳藥錠組合
    const recommendedTablets = tabletStrengths.map(tablet => {
      const tabletsNeeded = Math.round(singleDose / tablet.amoxicillin);
      const actualAmoxicillin = tabletsNeeded * tablet.amoxicillin;
      const actualClavulanate = tabletsNeeded * tablet.clavulanate;
      
      return {
        strength: tablet.name,
        count: tabletsNeeded,
        totalAmoxicillin: actualAmoxicillin,
        totalClavulanate: actualClavulanate
      };
    }).filter(option => option.count > 0 && option.count <= 4); // 合理的藥錠數量

    const calculationResult: AmoxicillinResult = {
      totalDailyDose,
      singleDose,
      recommendedTablets,
      treatmentGoal: treatmentGoal === 'mild' ? '輕度感染 (45 mg/kg/day)' : '重度感染 (90 mg/kg/day)',
      frequency
    };

    setResult(calculationResult);
    onCalculationComplete?.(calculationResult);
  };

  const reset = () => {
    setWeight('');
    setTreatmentGoal('mild');
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
        兒童 Amoxicillin/Clavulanate 劑量計算器
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
            體重 (公斤)
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="例如：20"
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
            治療目標
          </label>
          <select
            value={treatmentGoal}
            onChange={(e) => setTreatmentGoal(e.target.value)}
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
            <option value="mild">輕度感染 (45 mg/kg/day)</option>
            <option value="severe">重度感染 (90 mg/kg/day)</option>
          </select>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <button
          onClick={calculateDose}
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
          計算劑量
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
            計算結果
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
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#3b82f6',
                marginBottom: '4px'
              }}>
                {Math.round(result.totalDailyDose)} mg
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                每日總劑量
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#10b981',
                marginBottom: '4px'
              }}>
                {Math.round(result.singleDose)} mg
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                單次劑量
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '4px'
              }}>
                {result.frequency}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                給藥頻率
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
              建議藥錠組合
            </h4>
            
            <div style={{ display: 'grid', gap: '8px' }}>
              {result.recommendedTablets.map((tablet, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  <span style={{ fontWeight: '500' }}>
                    {tablet.strength}
                  </span>
                  <span style={{ color: '#374151' }}>
                    {tablet.count} 錠 = {tablet.totalAmoxicillin}mg Amoxicillin
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#dbeafe',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '12px'
          }}>
            <p style={{
              fontSize: '14px',
              color: '#1e40af',
              margin: '0',
              fontWeight: '500'
            }}>
              治療目標: {result.treatmentGoal}
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
              <strong>注意：</strong> 請確認患者無青黴素過敏史。建議隨餐服用以減少胃腸不適。
              實際用藥請遵循醫師指示。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleAmoxicillinClavulanateCalculator;