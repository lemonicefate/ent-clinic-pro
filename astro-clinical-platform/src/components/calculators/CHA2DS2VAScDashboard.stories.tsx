/**
 * CHA₂DS₂-VASc Dashboard Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { CHA2DS2VAScDashboard } from './CHA2DS2VAScDashboard';
import type { CHA2DS2VAScResult } from '../../types/calculator';

// Mock data for different risk scenarios
const createMockResult = (score: number): CHA2DS2VAScResult => {
  const getRiskLevel = (s: number) => {
    if (s === 0) return 'low';
    if (s === 1) return 'moderate';
    return 'high';
  };

  const getAnnualRisk = (s: number) => {
    const riskTable: Record<number, number> = {
      0: 0.2, 1: 0.6, 2: 2.2, 3: 3.2, 4: 4.8,
      5: 7.2, 6: 9.7, 7: 11.2, 8: 10.8, 9: 12.2
    };
    return riskTable[Math.min(s, 9)] || 12.2;
  };

  const riskLevel = getRiskLevel(score);
  const annualStrokeRisk = getAnnualRisk(score);

  return {
    primaryValue: score,
    primaryUnit: '分',
    primaryLabel: {
      'zh-TW': 'CHA₂DS₂-VASc 評分',
      'en': 'CHA₂DS₂-VASc Score',
      'ja': 'CHA₂DS₂-VAScスコア'
    },
    score,
    riskLevel,
    annualStrokeRisk,
    riskFactors: [
      {
        factor: 'chf',
        present: score >= 1,
        points: score >= 1 ? 1 : 0,
        description: {
          'zh-TW': '充血性心衰竭',
          'en': 'Congestive Heart Failure',
          'ja': 'うっ血性心不全'
        }
      },
      {
        factor: 'hypertension',
        present: score >= 2,
        points: score >= 2 ? 1 : 0,
        description: {
          'zh-TW': '高血壓',
          'en': 'Hypertension',
          'ja': '高血圧'
        }
      },
      {
        factor: 'age',
        present: score >= 3,
        points: score >= 3 ? (score >= 5 ? 2 : 1) : 0,
        description: {
          'zh-TW': score >= 5 ? '年齡 ≥75歲' : score >= 3 ? '年齡 65-74歲' : '年齡 <65歲',
          'en': score >= 5 ? 'Age ≥75 years' : score >= 3 ? 'Age 65-74 years' : 'Age <65 years',
          'ja': score >= 5 ? '年齢 ≥75歳' : score >= 3 ? '年齢 65-74歳' : '年齢 <65歳'
        }
      },
      {
        factor: 'diabetes',
        present: score >= 4,
        points: score >= 4 ? 1 : 0,
        description: {
          'zh-TW': '糖尿病',
          'en': 'Diabetes Mellitus',
          'ja': '糖尿病'
        }
      },
      {
        factor: 'gender',
        present: score >= 6,
        points: score >= 6 ? 1 : 0,
        description: {
          'zh-TW': '女性',
          'en': 'Female',
          'ja': '女性'
        }
      }
    ],
    interpretation: {
      'zh-TW': score === 0 
        ? '低風險：年度中風風險約 0.2%，可考慮不使用抗凝血劑'
        : score === 1 
        ? '中等風險：年度中風風險約 0.6%，可考慮使用抗凝血劑'
        : `高風險：年度中風風險約 ${annualStrokeRisk}%，強烈建議使用抗凝血劑`,
      'en': score === 0
        ? 'Low risk: Annual stroke risk ~0.2%, may consider no anticoagulation'
        : score === 1
        ? 'Moderate risk: Annual stroke risk ~0.6%, may consider anticoagulation'
        : `High risk: Annual stroke risk ~${annualStrokeRisk}%, strongly recommend anticoagulation`,
      'ja': score === 0
        ? '低リスク：年間脳卒中リスク約0.2%、抗凝固薬なしを検討可能'
        : score === 1
        ? '中等度リスク：年間脳卒中リスク約0.6%、抗凝固薬を検討可能'
        : `高リスク：年間脳卒中リスク約${annualStrokeRisk}%、抗凝固薬を強く推奨`
    },
    recommendations: score === 0 ? [
      {
        'zh-TW': '定期追蹤心房顫動狀況',
        'en': 'Regular follow-up for atrial fibrillation',
        'ja': '心房細動の定期的なフォローアップ'
      },
      {
        'zh-TW': '評估其他心血管風險因子',
        'en': 'Assess other cardiovascular risk factors',
        'ja': '他の心血管リスク因子の評価'
      }
    ] : score === 1 ? [
      {
        'zh-TW': '評估 HAS-BLED 出血風險評分',
        'en': 'Assess HAS-BLED bleeding risk score',
        'ja': 'HAS-BLED出血リスクスコアの評価'
      },
      {
        'zh-TW': '與患者討論抗凝血治療的利弊',
        'en': 'Discuss benefits and risks of anticoagulation with patient',
        'ja': '患者と抗凝固治療の利益とリスクを議論'
      }
    ] : [
      {
        'zh-TW': '開始口服抗凝血劑治療',
        'en': 'Initiate oral anticoagulation therapy',
        'ja': '経口抗凝固薬治療の開始'
      },
      {
        'zh-TW': '定期監測抗凝血效果和出血風險',
        'en': 'Regular monitoring of anticoagulation effect and bleeding risk',
        'ja': '抗凝固効果と出血リスクの定期的なモニタリング'
      },
      {
        'zh-TW': '考慮使用新型口服抗凝血劑 (NOAC)',
        'en': 'Consider novel oral anticoagulants (NOACs)',
        'ja': '新規経口抗凝固薬（NOAC）の検討'
      }
    ],
    visualizationData: {
      score,
      riskLevel,
      annualStrokeRisk,
      riskFactorsChart: {
        labels: ['充血性心衰竭', '高血壓', '年齡', '糖尿病', '女性'].slice(0, Math.max(1, score)),
        datasets: [{
          label: '風險因子分數',
          data: [1, 1, score >= 5 ? 2 : 1, 1, 1].slice(0, Math.max(1, score)),
          backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'].slice(0, Math.max(1, score)),
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      annualRiskTrend: {
        labels: ['0分', '1分', '2分', '3分', '4分', '5分', '6分', '7分', '8分', '9分'],
        datasets: [{
          label: '年度中風風險',
          data: [0.2, 0.6, 2.2, 3.2, 4.8, 7.2, 9.7, 11.2, 10.8, 12.2],
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#ef4444',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      riskComparison: {
        labels: ['目前風險', '平均風險', '其他'],
        datasets: [{
          data: [annualStrokeRisk, 2.5, Math.max(0, 97.5 - annualStrokeRisk)],
          backgroundColor: [
            score === 0 ? '#22c55e' : score === 1 ? '#f59e0b' : '#ef4444',
            '#6b7280',
            '#e5e7eb'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      }
    }
  };
};

const meta: Meta<typeof CHA2DS2VAScDashboard> = {
  title: 'Calculators/CHA2DS2VAScDashboard',
  component: CHA2DS2VAScDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'CHA₂DS₂-VASc 計算機專用儀表板，展示完整的風險評估結果和視覺化圖表。'
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
type Story = StoryObj<typeof CHA2DS2VAScDashboard>;

// 低風險案例 (0分)
export const LowRisk: Story = {
  args: {
    result: createMockResult(0),
    locale: 'zh-TW'
  },
  parameters: {
    docs: {
      description: {
        story: '低風險患者：年輕男性，無任何風險因子，CHA₂DS₂-VASc 評分為 0 分。'
      }
    }
  }
};

// 中等風險案例 (1分)
export const ModerateRisk: Story = {
  args: {
    result: createMockResult(1),
    locale: 'zh-TW'
  },
  parameters: {
    docs: {
      description: {
        story: '中等風險患者：有一個風險因子，CHA₂DS₂-VASc 評分為 1 分，需要評估抗凝血治療。'
      }
    }
  }
};

// 高風險案例 (4分)
export const HighRisk: Story = {
  args: {
    result: createMockResult(4),
    locale: 'zh-TW'
  },
  parameters: {
    docs: {
      description: {
        story: '高風險患者：多個風險因子，CHA₂DS₂-VASc 評分為 4 分，強烈建議抗凝血治療。'
      }
    }
  }
};

// 極高風險案例 (7分)
export const CriticalRisk: Story = {
  args: {
    result: createMockResult(7),
    locale: 'zh-TW'
  },
  parameters: {
    docs: {
      description: {
        story: '極高風險患者：多個高分風險因子，CHA₂DS₂-VASc 評分為 7 分，必須進行抗凝血治療。'
      }
    }
  }
};

// 英文版本
export const EnglishVersion: Story = {
  args: {
    result: createMockResult(3),
    locale: 'en'
  },
  parameters: {
    docs: {
      description: {
        story: 'English version of the dashboard showing a moderate-high risk patient.'
      }
    }
  }
};

// 日文版本
export const JapaneseVersion: Story = {
  args: {
    result: createMockResult(2),
    locale: 'ja'
  },
  parameters: {
    docs: {
      description: {
        story: 'Japanese version of the dashboard showing a high risk patient.'
      }
    }
  }
};

// 載入狀態
export const LoadingState: Story = {
  args: {
    result: createMockResult(0),
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
    result: createMockResult(0),
    locale: 'zh-TW',
    error: '計算結果載入失敗，請重試。'
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
    result: createMockResult(3),
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