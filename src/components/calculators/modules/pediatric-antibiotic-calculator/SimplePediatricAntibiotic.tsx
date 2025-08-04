import React, { useState } from 'react';

interface PediatricResult {
  medication: string;
  totalDailyDose: number;
  singleDose: number;
  frequency: string;
  duration: string;
  notes: string[];
}

interface PediatricCalculatorProps {
  locale?: string;
  onCalculationComplete?: (result: any) => void;
}

const SimplePediatricAntibioticCalculator: React.FC<PediatricCalculatorProps> = ({ 
  locale = 'zh-TW', 
  onCalculationComplete 
}) => {
  const [weight, setWeight] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [medication, setMedication] = useState<string>('amoxicillin');
  const [indication, setIndication] = useState<string>('mild');
  const [result, setResult] = useState<PediatricResult | null>(null);

  // 抗生素資料庫
  const antibiotics = {
    amoxicillin: {
      name: 'Amoxicillin',
      mildDose: 45, // mg/kg/day
      severeDose: 90,
      frequency: '每日三次',
      duration: '7-10天',
      notes: ['隨餐服用', '確認無青黴素過敏']
    },
    azithromycin: {
      name: 'Azithromycin',
      mildDose: 10,
      severeDose: 10,
      frequency: '每日一次',
      duration: '3-5天',
      notes: ['空腹服用效果更佳', '注意心律不整風險']
    },
    cephalexin: {
      name: 'Cephalexin',
      mildDose: 50,
      severeDose: 100,
      frequency: '每日四次',
      duration: '7-10天',
      notes: ['隨餐服用', '注意過敏反應']
    },
    clindamycin: {
      name: 'Clindamycin',
      mildDose: 20,
      severeDose: 40,
      frequency: '每日三次',
      duration: '7-10天',
      notes: ['注意腹瀉副作用', '可能引起偽膜性腸炎']
    }
  };

  const calculateDose = () => {
    const weightNum = parseFloat(weight);
    const ageNum = parseFloat(age);
    
    if (!weightNum || weightNum <= 0) {
      alert('請輸入有效的體重');
      return;
    }

    if (!ageNum || ageNum <= 0) {
      alert('請輸入有效的年齡');
      return;
    }

    const selectedAntibiotic = antibiotics[medication as keyof typeof antibiotics];
    const dosePerKg = indication === 'mild' ? selectedAntibiotic.mildDose : selectedAntibiotic.severeDose;
    const totalDailyDose = weightNum * dosePerKg;
    
    // 計算單次劑量
    const frequencyMap: { [key: string]: number } = {
      '每日一次': 1,
      '每日二次': 2,
      '每日三次': 3,
      '每日四次': 4
    };
    
    const timesPerDay = frequencyMap[selectedAntibiotic.frequency] || 3;
    const singleDose = totalDailyDose / timesPerDay;

    const calculationResult: PediatricResult = {
      medication: selectedAntibiotic.name,
      totalDailyDose,
      singleDose,
      frequency: selectedAntibiotic.frequency,
      duration: selectedAntibiotic.duration,
      notes: selectedAntibiotic.notes
    };

    setResult(calculationResult);
    onCalculationComplete?.(calculationResult);
  };

  const reset = () => {
    setWeight('');
    setAge('');
    setMedication('amoxicillin');
    setIndication('mild');
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
        兒童抗生素劑量計算器
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
            年齡 (歲)
          </label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="例如：5"
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
            抗生素選擇
          </label>
          <select
            value={medication}
            onChange={(e) => setMedication(e.target.value)}
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
            <option value="amoxicillin">Amoxicillin</option>
            <option value="azithromycin">Azithromycin</option>
            <option value="cephalexin">Cephalexin</option>
            <option value="clindamycin">Clindamycin</option>
          </select>
        </div>
        
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }}>
            感染嚴重程度
          </label>
          <select
            value={indication}
            onChange={(e) => setIndication(e.target.value)}
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
            <option value="mild">輕度感染</option>
            <option value="severe">重度感染</option>
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
            backgroundColor: '#ec4899',
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
            計算結果 - {result.medication}
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
                color: '#ec4899',
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
              用藥指導
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#dbeafe',
                borderRadius: '4px'
              }}>
                <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: '500' }}>
                  療程: {result.duration}
                </span>
              </div>
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#dcfce7',
                borderRadius: '4px'
              }}>
                <span style={{ fontSize: '12px', color: '#166534', fontWeight: '500' }}>
                  頻率: {result.frequency}
                </span>
              </div>
            </div>
            
            <div>
              <h5 style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                注意事項:
              </h5>
              <ul style={{ margin: '0', paddingLeft: '16px' }}>
                {result.notes.map((note, index) => (
                  <li key={index} style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '4px'
                  }}>
                    {note}
                  </li>
                ))}
              </ul>
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
              <strong>重要提醒：</strong> 此計算結果僅供參考，實際用藥劑量請遵循醫師處方。
              使用前請確認患者過敏史，並注意藥物交互作用。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimplePediatricAntibioticCalculator;