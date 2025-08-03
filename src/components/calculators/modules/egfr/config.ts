/**
 * eGFR 計算機配置
 */

import { CalculatorConfig } from '../../types';

export const config: CalculatorConfig = {
  id: 'egfr',
  name: {
    'zh-TW': 'eGFR 估算腎絲球過濾率計算機',
    'en': 'eGFR Estimated Glomerular Filtration Rate Calculator',
    'ja': 'eGFR 推定糸球体濾過率計算機'
  },
  description: {
    'zh-TW': '使用 CKD-EPI 2021 公式計算估算腎絲球過濾率 (eGFR)，評估腎功能並進行慢性腎臟病分期。',
    'en': 'Calculate estimated Glomerular Filtration Rate (eGFR) using CKD-EPI 2021 equation for kidney function assessment and CKD staging.',
    'ja': 'CKD-EPI 2021式を使用して推定糸球体濾過率（eGFR）を計算し、腎機能評価とCKD病期分類を行います。'
  },
  category: 'nephrology',
  version: '1.0.0',
  status: 'published',
  
  fields: [
    {
      id: 'creatinine',
      type: 'number',
      label: {
        'zh-TW': '血清肌酸酐',
        'en': 'Serum Creatinine',
        'ja': '血清クレアチニン'
      },
      placeholder: {
        'zh-TW': '例如：1.2',
        'en': 'e.g., 1.2',
        'ja': '例：1.2'
      },
      helpText: {
        'zh-TW': '請輸入血清肌酸酐濃度，單位為 mg/dL',
        'en': 'Enter serum creatinine concentration in mg/dL',
        'ja': '血清クレアチニン濃度をmg/dLで入力してください'
      },
      required: true,
      min: 0.1,
      max: 20.0,
      step: 0.01,
      unit: 'mg/dL',
      validation: {
        errorMessage: {
          'zh-TW': '肌酸酐值必須在 0.1-20.0 mg/dL 之間',
          'en': 'Creatinine must be between 0.1-20.0 mg/dL',
          'ja': 'クレアチニン値は0.1-20.0 mg/dLの間である必要があります'
        }
      }
    },
    {
      id: 'age',
      type: 'number',
      label: {
        'zh-TW': '年齡',
        'en': 'Age',
        'ja': '年齢'
      },
      placeholder: {
        'zh-TW': '例如：65',
        'en': 'e.g., 65',
        'ja': '例：65'
      },
      helpText: {
        'zh-TW': '請輸入患者年齡，必須為 18 歲以上成人',
        'en': 'Enter patient age, must be 18 years or older',
        'ja': '患者の年齢を入力してください。18歳以上である必要があります'
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
        'zh-TW': '性別是 eGFR 計算的必要參數',
        'en': 'Gender is required for eGFR calculation',
        'ja': '性別はeGFR計算に必要なパラメータです'
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
    }
  ],
  
  calculation: {
    functionName: 'calculate',
    validationRules: {
      required: ['creatinine', 'age', 'gender'],
      dependencies: []
    }
  },
  
  medical: {
    specialty: ['nephrology', 'internal-medicine', 'family-medicine'],
    evidenceLevel: 'A',
    references: [
      {
        title: 'A New Equation to Estimate Glomerular Filtration Rate',
        authors: ['Inker LA', 'Eneanya ND', 'Coresh J', 'et al.'],
        journal: 'Annals of Internal Medicine',
        year: 2021,
        volume: '175',
        pages: '1-11',
        doi: '10.7326/M21-2928',
        url: 'https://www.acpjournals.org/doi/10.7326/M21-2928'
      },
      {
        title: 'KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease',
        authors: ['KDIGO CKD Work Group'],
        journal: 'Kidney International',
        year: 2024,
        volume: '105',
        pages: 'S117-S314',
        url: 'https://kdigo.org/guidelines/ckd-evaluation-management/'
      },
      {
        title: 'Chronic Kidney Disease: Assessment and Management',
        authors: ['NICE Guideline Development Group'],
        journal: 'NICE Clinical Guideline',
        year: 2021,
        volume: 'NG203',
        url: 'https://www.nice.org.uk/guidance/ng203'
      }
    ],
    clinicalGuidelines: {
      'zh-TW': '根據 KDIGO 2024 指引，eGFR 是評估慢性腎臟病的核心指標。CKD-EPI 2021 公式移除了種族係數，提供更準確的腎功能評估。eGFR < 60 mL/min/1.73m² 持續 3 個月以上定義為慢性腎臟病。',
      'en': 'According to KDIGO 2024 guidelines, eGFR is the core indicator for CKD assessment. The CKD-EPI 2021 equation removes race coefficients for more accurate kidney function evaluation. eGFR < 60 mL/min/1.73m² for ≥3 months defines chronic kidney disease.',
      'ja': 'KDIGO 2024ガイドラインによると、eGFRはCKD評価の中核指標です。CKD-EPI 2021式は人種係数を除去し、より正確な腎機能評価を提供します。eGFR < 60 mL/min/1.73m²が3ヶ月以上持続する場合、慢性腎臓病と定義されます。'
    },
    contraindications: [
      {
        'zh-TW': '18歲以下兒童和青少年（需使用兒童專用公式）',
        'en': 'Children and adolescents under 18 years (pediatric formulas required)',
        'ja': '18歳未満の小児・青少年（小児用公式が必要）'
      },
      {
        'zh-TW': '急性腎損傷期間（肌酸酐不穩定）',
        'en': 'During acute kidney injury (unstable creatinine)',
        'ja': '急性腎障害期間中（クレアチニン不安定）'
      },
      {
        'zh-TW': '極端肌肉量（截肢、肌肉萎縮、健美運動員）',
        'en': 'Extreme muscle mass (amputation, muscle wasting, bodybuilders)',
        'ja': '極端な筋肉量（切断、筋萎縮、ボディビルダー）'
      },
      {
        'zh-TW': '素食者或肌酸補充劑使用者',
        'en': 'Vegetarians or creatine supplement users',
        'ja': 'ベジタリアンまたはクレアチンサプリメント使用者'
      }
    ],
    limitations: [
      {
        'zh-TW': '基於血清肌酸酐，可能受肌肉量影響',
        'en': 'Based on serum creatinine, may be affected by muscle mass',
        'ja': '血清クレアチニンに基づくため、筋肉量の影響を受ける可能性'
      },
      {
        'zh-TW': '在 eGFR > 60 時準確性較低',
        'en': 'Less accurate when eGFR > 60',
        'ja': 'eGFR > 60の場合、精度が低下'
      },
      {
        'zh-TW': '不能反映急性腎功能變化',
        'en': 'Cannot reflect acute changes in kidney function',
        'ja': '急性腎機能変化を反映できない'
      },
      {
        'zh-TW': '某些藥物可能影響肌酸酐水平',
        'en': 'Certain medications may affect creatinine levels',
        'ja': '特定の薬物がクレアチニン値に影響する可能性'
      }
    ]
  },
  
  metadata: {
    tags: ['eGFR', 'creatinine', 'kidney function', 'CKD', 'nephrology', 'CKD-EPI'],
    difficulty: 'intermediate',
    lastUpdated: '2024-01-26',
    author: 'Astro Clinical Platform',
    reviewedBy: 'Nephrology Team',
    estimatedTime: 3
  }
};