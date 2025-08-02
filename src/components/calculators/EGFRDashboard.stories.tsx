/**
 * eGFR Dashboard Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { EGFRDashboard } from './EGFRDashboard';
import type { EGFRResult } from '../../types/calculator';

// Mock data for different CKD stages
const createMockResult = (egfr: number, age: number, gender: 'male' | 'female'): EGFRResult => {
  const getCKDStage = (eGFR: number) => {
    if (eGFR >= 90) return 1;
    if (eGFR >= 60) return 2;
    if (eGFR >= 30) return 3;
    if (eGFR >= 15) return 4;
    return 5;
  };

  const getRiskLevel = (stage: number) => {
    if (stage <= 2) return 'low';
    if (stage === 3) return 'moderate';
    if (stage === 4) return 'high';
    return 'critical';
  };

  const ckdStage = getCKDStage(egfr);
  const riskLevel = getRiskLevel(ckdStage);

  return {
    primaryValue: egfr,
    primaryUnit: 'mL/min/1.73m²',
    primaryLabel: {
      'zh-TW': 'eGFR (估算腎絲球過濾率)',
      'en': 'eGFR (estimated Glomerular Filtration Rate)',
      'ja': 'eGFR (推定糸球体濾過量)'
    },
    egfr,
    ckdStage,
    riskLevel,
    interpretation: {
      'zh-TW': ckdStage === 1 
        ? `腎功能正常 (eGFR: ${egfr})。建議定期監測，特別是有腎病風險因子時。`
        : ckdStage === 2
        ? `腎功能輕度下降 (eGFR: ${egfr})。建議評估腎病風險因子並定期追蹤。`
        : ckdStage === 3
        ? `腎功能中度下降 (eGFR: ${egfr})。需要積極管理併發症並準備腎臟替代治療。`
        : ckdStage === 4
        ? `腎功能重度下降 (eGFR: ${egfr})。需要準備透析或腎移植，並積極治療併發症。`
        : `腎衰竭 (eGFR: ${egfr})。需要立即開始腎臟替代治療（透析或移植）。`,
      'en': ckdStage === 1
        ? `Normal kidney function (eGFR: ${egfr}). Regular monitoring recommended, especially with kidney disease risk factors.`
        : ckdStage === 2
        ? `Mild decrease in kidney function (eGFR: ${egfr}). Evaluate kidney disease risk factors and monitor regularly.`
        : ckdStage === 3
        ? `Moderate decrease in kidney function (eGFR: ${egfr}). Actively manage complications and prepare for renal replacement therapy.`
        : ckdStage === 4
        ? `Severe decrease in kidney function (eGFR: ${egfr}). Prepare for dialysis or transplant and aggressively treat complications.`
        : `Kidney failure (eGFR: ${egfr}). Immediate need for renal replacement therapy (dialysis or transplant).`,
      'ja': ckdStage === 1
        ? `腎機能正常 (eGFR: ${egfr})。腎疾患のリスク因子がある場合は定期的な監視を推奨。`
        : ckdStage === 2
        ? `腎機能軽度低下 (eGFR: ${egfr})。腎疾患のリスク因子を評価し、定期的に監視。`
        : ckdStage === 3
        ? `腎機能中等度低下 (eGFR: ${egfr})。合併症を積極的に管理し、腎代替療法の準備。`
        : ckdStage === 4
        ? `腎機能高度低下 (eGFR: ${egfr})。透析や移植の準備、合併症の積極的治療。`
        : `腎不全 (eGFR: ${egfr})。腎代替療法（透析または移植）の即座の必要性。`
    },
    recommendations: ckdStage <= 2 ? [
      {
        'zh-TW': '控制血壓 (<130/80 mmHg)',
        'en': 'Control blood pressure (<130/80 mmHg)',
        'ja': '血圧管理 (<130/80 mmHg)'
      },
      {
        'zh-TW': '控制血糖 (如有糖尿病)',
        'en': 'Control blood glucose (if diabetic)',
        'ja': '血糖管理 (糖尿病の場合)'
      }
    ] : ckdStage === 3 ? [
      {
        'zh-TW': '控制血壓 (<130/80 mmHg)',
        'en': 'Control blood pressure (<130/80 mmHg)',
        'ja': '血圧管理 (<130/80 mmHg)'
      },
      {
        'zh-TW': '限制蛋白質攝取 (0.8-1.0 g/kg/day)',
        'en': 'Limit protein intake (0.8-1.0 g/kg/day)',
        'ja': 'タンパク質制限 (0.8-1.0 g/kg/day)'
      },
      {
        'zh-TW': '監測骨質代謝異常',
        'en': 'Monitor bone metabolism disorders',
        'ja': '骨代謝異常の監視'
      }
    ] : [
      {
        'zh-TW': '準備腎臟替代治療',
        'en': 'Prepare for renal replacement therapy',
        'ja': '腎代替療法の準備'
      },
      {
        'zh-TW': '腎臟科專科醫師會診',
        'en': 'Nephrology specialist consultation',
        'ja': '腎臓専門医への紹介'
      },
      ...(ckdStage === 5 ? [{
        'zh-TW': '立即開始透析或評估移植適應症',
        'en': 'Immediate dialysis or transplant evaluation',
        'ja': '即座の透析開始または移植評価'
      }] : [])
    ],
    additionalTests: ckdStage >= 2 ? [
      {
        test: 'urine_protein',
        indication: {
          'zh-TW': '尿蛋白檢查以評估腎損傷程度',
          'en': 'Urine protein to assess kidney damage',
          'ja': '腎損傷評価のための尿蛋白検査'
        },
        urgency: 'routine' as const
      },
      ...(ckdStage >= 3 ? [
        {
          test: 'phosphorus_calcium',
          indication: {
            'zh-TW': '磷、鈣檢查以監測骨質代謝',
            'en': 'Phosphorus, calcium for bone metabolism',
            'ja': '骨代謝監視のためのリン、カルシウム'
          },
          urgency: 'routine' as const
        }
      ] : []),
      ...(ckdStage >= 4 ? [
        {
          test: 'hemoglobin',
          indication: {
            'zh-TW': '血紅素檢查以評估貧血',
            'en': 'Hemoglobin to assess anemia',
            'ja': '貧血評価のためのヘモグロビン'
          },
          urgency: 'urgent' as const
        }
      ] : []),
      ...(ckdStage === 5 ? [
        {
          test: 'dialysis_access',
          indication: {
            'zh-TW': '透析通路評估',
            'en': 'Dialysis access evaluation',
            'ja': '透析アクセス評価'
          },
          urgency: 'immediate' as const
        }
      ] : [])
    ] : [],
    visualizationData: {
      egfr,
      ckdStage,
      riskLevel,
      stageDistribution: {
        labels: ['第1期', '第2期', '第3期', '第4期', '第5期'],
        datasets: [{
          data: [1, 2, 3, 4, 5].map(stage => stage === ckdStage ? 1 : 0.2),
          backgroundColor: ['#22c55e', '#84cc16', '#f59e0b', '#ef4444', '#dc2626'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      ageComparison: {
        labels: ['您的 eGFR', '年齡預期值', '正常下限'],
        datasets: [{
          label: 'eGFR 比較',
          data: [egfr, Math.max(120 - (age - 20) * 0.8, 60), 60],
          backgroundColor: [
            egfr >= 90 ? '#22c55e' : egfr >= 60 ? '#f59e0b' : '#ef4444',
            '#6b7280',
            '#94a3b8'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      trendData: {
        labels: ['3個月前', '2個月前', '1個月前', '目前'],
        datasets: [{
          label: 'eGFR 趨勢',
          data: [egfr + 5, egfr + 3, egfr + 1, egfr],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5
        }]
      },
      riskFactors: {
        labels: ['年齡', '性別', '腎功能'],
        datasets: [{
          label: '風險因子',
          data: [
            age > 65 ? 80 : 40,
            gender === 'male' ? 60 : 40,
            egfr < 60 ? 90 : 30
          ],
          backgroundColor: ['#f59e0b40', '#8b5cf640', '#ef444440'],
          borderColor: ['#f59e0b', '#8b5cf6', '#ef4444'],
          borderWidth: 2
        }]
      }
    }
  };
};

const meta: Meta<typeof EGFRDashboard> = {
  title: 'Calculators/EGFRDashboard',
  component: EGFRDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'eGFR 計算機專用儀表板，展示完整的腎功能評估結果和視覺化圖表。'
      }
    }
  },
  argTypes: {
    locale: {
      control: 'select',
      options: ['zh-TW', 'en', 'ja'],
      description: '語言設定'
    },
    loading: {
      control: 'boolean',
      description: '載入狀態'
    },
    error: {
      control: 'text',
      description: '錯誤訊息'
    }
  }
};

export default meta;
type Story = StoryObj<typeof EGFRDashboard>;

// 正常腎功能 (Stage 1)
export const NormalFunction: Story = {
  args: {
    result: createMockResult(105, 30, 'female'),
    locale: 'zh-TW'
  },
  parameters: {
    docs: {
      description: {
        story: '正常腎功能：年輕女性，eGFR > 90，CKD 第1期。'
      }
    }
  }
};

// 輕度腎功能下降 (Stage 2)
export const MildDecrease: Story = {
  args: {
    result: createMockResult(75, 45, 'male'),
    locale: 'zh-TW'
  },
  parameters: {
    docs: {
      description: {
        story: '輕度腎功能下降：中年男性，eGFR 60-89，CKD 第2期。'
      }
    }
  }
};

// 中度腎功能下降 (Stage 3)
export const ModerateDecrease: Story = {
  args: {
    result: createMockResult(45, 65, 'female'),
    locale: 'zh-TW'
  },
  parameters: {
    docs: {
      description: {
        story: '中度腎功能下降：老年女性，eGFR 30-59，CKD 第3期，需要積極管理。'
      }
    }
  }
};

// 重度腎功能下降 (Stage 4)
export const SevereDecrease: Story = {
  args: {
    result: createMockResult(22, 70, 'male'),
    locale: 'zh-TW'
  },
  parameters: {
    docs: {
      description: {
        story: '重度腎功能下降：老年男性，eGFR 15-29，CKD 第4期，需要準備透析。'
      }
    }
  }
};

// 腎衰竭 (Stage 5)
export const KidneyFailure: Story = {
  args: {
    result: createMockResult(8, 60, 'female'),
    locale: 'zh-TW'
  },
  parameters: {
    docs: {
      description: {
        story: '腎衰竭：eGFR < 15，CKD 第5期，需要立即開始腎臟替代治療。'
      }
    }
  }
};

// 英文版本
export const EnglishVersion: Story = {
  args: {
    result: createMockResult(35, 68, 'male'),
    locale: 'en'
  },
  parameters: {
    docs: {
      description: {
        story: 'English version of the dashboard showing a stage 3 CKD patient.'
      }
    }
  }
};

// 日文版本
export const JapaneseVersion: Story = {
  args: {
    result: createMockResult(55, 72, 'female'),
    locale: 'ja'
  },
  parameters: {
    docs: {
      description: {
        story: 'Japanese version of the dashboard showing a stage 3 CKD patient.'
      }
    }
  }
};

// 載入狀態
export const LoadingState: Story = {
  args: {
    result: createMockResult(75, 50, 'male'),
    locale: 'zh-TW',
    loading: true
  },
  parameters: {
    docs: {
      description: {
        story: '儀表板載入狀態展示。'
      }
    }
  }
};

// 錯誤狀態
export const ErrorState: Story = {
  args: {
    result: createMockResult(75, 50, 'male'),
    locale: 'zh-TW',
    error: 'eGFR 計算結果載入失敗，請檢查輸入數據。'
  },
  parameters: {
    docs: {
      description: {
        story: '儀表板錯誤狀態展示。'
      }
    }
  }
};

// 互動示例
export const InteractiveExample: Story = {
  args: {
    result: createMockResult(42, 58, 'female'),
    locale: 'zh-TW',
    onComponentClick: (componentId: string, data: any) => {
      console.log('Component clicked:', componentId, data);
      alert(`點擊了組件: ${componentId}`);
    }
  },
  parameters: {
    docs: {
      description: {
        story: '可互動的儀表板，點擊各個組件會觸發事件。'
      }
    }
  }
};

// 邊界案例 - 極低 eGFR
export const ExtremeLowEGFR: Story = {
  args: {
    result: createMockResult(3, 55, 'male'),
    locale: 'zh-TW'
  },
  parameters: {
    docs: {
      description: {
        story: '極低 eGFR 案例：需要緊急透析的腎衰竭患者。'
      }
    }
  }
};

// 邊界案例 - 極高 eGFR
export const ExtremeHighEGFR: Story = {
  args: {
    result: createMockResult(130, 20, 'female'),
    locale: 'zh-TW'
  },
  parameters: {
    docs: {
      description: {
        story: '極高 eGFR 案例：年輕健康女性的優秀腎功能。'
      }
    }
  }
};