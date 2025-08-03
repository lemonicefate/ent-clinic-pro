/**
 * CHA2DS2-VASc 計算機配置
 */

import { CalculatorConfig } from '../../types';

export const config: CalculatorConfig = {
  id: 'cha2ds2-vasc',
  name: {
    'zh-TW': 'CHA2DS2-VASc 中風風險評估',
    'en': 'CHA2DS2-VASc Stroke Risk Assessment',
    'ja': 'CHA2DS2-VASc 脳卒中リスク評価'
  },
  description: {
    'zh-TW': '評估心房顫動患者的中風風險，協助決定抗凝治療策略。CHA2DS2-VASc 評分是目前最廣泛使用的中風風險評估工具。',
    'en': 'Assess stroke risk in patients with atrial fibrillation to guide anticoagulation therapy decisions. CHA2DS2-VASc score is the most widely used stroke risk assessment tool.',
    'ja': '心房細動患者の脳卒中リスクを評価し、抗凝固療法の決定を支援します。CHA2DS2-VAScスコアは最も広く使用されている脳卒中リスク評価ツールです。'
  },
  category: 'cardiology',
  version: '1.0.0',
  status: 'published',
  
  fields: [
    {
      id: 'age',
      type: 'number',
      label: {
        'zh-TW': '年齡',
        'en': 'Age',
        'ja': '年齢'
      },
      placeholder: {
        'zh-TW': '例如：70',
        'en': 'e.g., 70',
        'ja': '例：70'
      },
      helpText: {
        'zh-TW': '65-74歲得1分，≥75歲得2分',
        'en': '65-74 years: 1 point, ≥75 years: 2 points',
        'ja': '65-74歳：1点、≥75歳：2点'
      },
      required: true,
      min: 18,
      max: 120,
      step: 1,
      unit: '歲',
      validation: {
        errorMessage: {
          'zh-TW': '年齡必須在 18-120 歲之間',
          'en': 'Age must be between 18-120 years',
          'ja': '年齢は18-120歳の間である必要があります'
        }
      }
    },
    {
      id: 'gender',
      type: 'select',
      label: {
        'zh-TW': '性別',
        'en': 'Gender',
        'ja': '性別'
      },
      helpText: {
        'zh-TW': '女性得1分',
        'en': 'Female sex: 1 point',
        'ja': '女性：1点'
      },
      required: true,
      options: [
        {
          value: 'male',
          label: {
            'zh-TW': '男性',
            'en': 'Male',
            'ja': '男性'
          }
        },
        {
          value: 'female',
          label: {
            'zh-TW': '女性',
            'en': 'Female',
            'ja': '女性'
          }
        }
      ]
    },
    {
      id: 'congestiveHeartFailure',
      type: 'checkbox',
      label: {
        'zh-TW': '充血性心衰竭',
        'en': 'Congestive Heart Failure',
        'ja': 'うっ血性心不全'
      },
      helpText: {
        'zh-TW': '左心室功能不全或近期失代償性心衰竭 (1分)',
        'en': 'Left ventricular dysfunction or recent decompensated heart failure (1 point)',
        'ja': '左室機能不全または最近の非代償性心不全 (1点)'
      },
      required: false
    },
    {
      id: 'hypertension',
      type: 'checkbox',
      label: {
        'zh-TW': '高血壓',
        'en': 'Hypertension',
        'ja': '高血圧'
      },
      helpText: {
        'zh-TW': '休息時血壓 >140/90 mmHg 或正在服用降壓藥 (1分)',
        'en': 'Resting BP >140/90 mmHg or on antihypertensive treatment (1 point)',
        'ja': '安静時血圧 >140/90 mmHg または降圧薬治療中 (1点)'
      },
      required: false
    },
    {
      id: 'diabetes',
      type: 'checkbox',
      label: {
        'zh-TW': '糖尿病',
        'en': 'Diabetes Mellitus',
        'ja': '糖尿病'
      },
      helpText: {
        'zh-TW': '空腹血糖 >125 mg/dL 或正在服用降糖藥或胰島素 (1分)',
        'en': 'Fasting glucose >125 mg/dL or on antidiabetic treatment (1 point)',
        'ja': '空腹時血糖 >125 mg/dL または糖尿病治療中 (1点)'
      },
      required: false
    },
    {
      id: 'strokeTiaHistory',
      type: 'checkbox',
      label: {
        'zh-TW': '中風/TIA/血栓栓塞病史',
        'en': 'Stroke/TIA/Thromboembolism History',
        'ja': '脳卒中/TIA/血栓塞栓症の既往'
      },
      helpText: {
        'zh-TW': '既往中風、短暫性腦缺血發作或全身性栓塞 (2分)',
        'en': 'Previous stroke, TIA, or systemic embolism (2 points)',
        'ja': '脳卒中、TIA、または全身性塞栓症の既往 (2点)'
      },
      required: false
    },
    {
      id: 'vascularDisease',
      type: 'checkbox',
      label: {
        'zh-TW': '血管疾病',
        'en': 'Vascular Disease',
        'ja': '血管疾患'
      },
      helpText: {
        'zh-TW': '心肌梗塞、周邊動脈疾病或主動脈斑塊 (1分)',
        'en': 'Myocardial infarction, peripheral artery disease, or aortic plaque (1 point)',
        'ja': '心筋梗塞、末梢動脈疾患、または大動脈プラーク (1点)'
      },
      required: false
    }
  ],
  
  calculation: {
    functionName: 'calculate',
    validationRules: {
      required: ['age', 'gender'],
      dependencies: []
    }
  },
  
  medical: {
    specialty: ['cardiology', 'internal-medicine', 'neurology'],
    evidenceLevel: 'A',
    references: [
      {
        title: 'Refining clinical risk stratification for predicting stroke and thromboembolism in atrial fibrillation using a novel risk factor-based approach: the euro heart survey on atrial fibrillation',
        authors: ['Lip GY', 'Nieuwlaat R', 'Pisters R', 'Lane DA', 'Crijns HJ'],
        journal: 'Chest',
        year: 2010,
        volume: '137',
        pages: '263-272',
        doi: '10.1378/chest.09-1584',
        url: 'https://journal.chestnet.org/article/S0012-3692(10)60013-6/fulltext'
      },
      {
        title: '2020 ESC Guidelines for the diagnosis and management of atrial fibrillation',
        authors: ['Hindricks G', 'Potpara T', 'Dagres N', 'et al.'],
        journal: 'European Heart Journal',
        year: 2021,
        volume: '42',
        pages: '373-498',
        doi: '10.1093/eurheartj/ehaa612',
        url: 'https://academic.oup.com/eurheartj/article/42/5/373/5899003'
      },
      {
        title: '2019 AHA/ACC/HRS Focused Update of the 2014 AHA/ACC/HRS Guideline for the Management of Patients with Atrial Fibrillation',
        authors: ['January CT', 'Wann LS', 'Calkins H', 'et al.'],
        journal: 'Circulation',
        year: 2019,
        volume: '140',
        pages: 'e125-e151',
        doi: '10.1161/CIR.0000000000000665',
        url: 'https://www.ahajournals.org/doi/10.1161/CIR.0000000000000665'
      }
    ],
    clinicalGuidelines: {
      'zh-TW': '根據 2020 ESC 和 2019 AHA/ACC/HRS 指引，CHA2DS2-VASc 評分是評估心房顫動患者中風風險的標準工具。評分 ≥2 分（男性）或 ≥3 分（女性）建議抗凝治療，評分 1 分（男性）或 2 分（女性）可考慮抗凝治療。',
      'en': 'According to 2020 ESC and 2019 AHA/ACC/HRS guidelines, CHA2DS2-VASc score is the standard tool for stroke risk assessment in atrial fibrillation patients. Anticoagulation is recommended for scores ≥2 (males) or ≥3 (females), and may be considered for scores of 1 (males) or 2 (females).',
      'ja': '2020年ESCおよび2019年AHA/ACC/HRSガイドラインによると、CHA2DS2-VAScスコアは心房細動患者の脳卒中リスク評価の標準ツールです。スコア≥2点（男性）または≥3点（女性）で抗凝固療法が推奨され、1点（男性）または2点（女性）で抗凝固療法を考慮します。'
    },
    contraindications: [
      {
        'zh-TW': '非心房顫動患者（此評分專用於心房顫動）',
        'en': 'Non-atrial fibrillation patients (this score is specific for AF)',
        'ja': '心房細動以外の患者（このスコアは心房細動専用）'
      },
      {
        'zh-TW': '急性中風期間（需要特殊考量）',
        'en': 'During acute stroke period (requires special consideration)',
        'ja': '急性脳卒中期間中（特別な考慮が必要）'
      },
      {
        'zh-TW': '已有抗凝禁忌症的患者',
        'en': 'Patients with contraindications to anticoagulation',
        'ja': '抗凝固療法の禁忌がある患者'
      }
    ],
    limitations: [
      {
        'zh-TW': '不考慮出血風險（需搭配 HAS-BLED 評分）',
        'en': 'Does not consider bleeding risk (should be used with HAS-BLED score)',
        'ja': '出血リスクを考慮しない（HAS-BLEDスコアと併用すべき）'
      },
      {
        'zh-TW': '基於歐洲人群數據，其他族群可能有差異',
        'en': 'Based on European population data, may differ in other ethnicities',
        'ja': 'ヨーロッパ人集団データに基づく、他の民族では異なる可能性'
      },
      {
        'zh-TW': '不適用於瓣膜性心房顫動',
        'en': 'Not applicable to valvular atrial fibrillation',
        'ja': '弁膜症性心房細動には適用されない'
      }
    ]
  },
  
  metadata: {
    tags: ['CHA2DS2-VASc', 'atrial fibrillation', 'stroke risk', 'anticoagulation', 'cardiology'],
    difficulty: 'intermediate',
    lastUpdated: '2024-01-26',
    author: 'Astro Clinical Platform',
    reviewedBy: 'Cardiology Team',
    estimatedTime: 5
  }
};