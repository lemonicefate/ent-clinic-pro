/**
 * BMI 計算機配置
 */

import { CalculatorConfig } from '../../types';

export const config: CalculatorConfig = {
  id: 'bmi',
  name: {
    'zh-TW': 'BMI 身體質量指數計算機',
    'en': 'BMI Body Mass Index Calculator',
    'ja': 'BMI 体格指数計算機'
  },
  description: {
    'zh-TW': '計算身體質量指數 (BMI) 並評估體重狀態，協助評估肥胖相關健康風險。',
    'en': 'Calculate Body Mass Index (BMI) and assess weight status to help evaluate obesity-related health risks.',
    'ja': '体格指数 (BMI) を計算し、体重状態を評価して肥胖関連の健康リスクを評価します。'
  },
  category: 'general',
  version: '1.0.0',
  status: 'published',
  
  fields: [
    {
      id: 'weight',
      type: 'number',
      label: {
        'zh-TW': '體重',
        'en': 'Weight',
        'ja': '体重'
      },
      placeholder: {
        'zh-TW': '例如：70',
        'en': 'e.g., 70',
        'ja': '例：70'
      },
      helpText: {
        'zh-TW': '請輸入您的體重，單位為公斤',
        'en': 'Enter your weight in kilograms',
        'ja': '体重をキログラムで入力してください'
      },
      required: true,
      min: 20,
      max: 300,
      step: 0.1,
      unit: 'kg',
      validation: {
        errorMessage: {
          'zh-TW': '體重必須在 20-300 公斤之間',
          'en': 'Weight must be between 20-300 kg',
          'ja': '体重は20-300kgの間である必要があります'
        }
      }
    },
    {
      id: 'height',
      type: 'number',
      label: {
        'zh-TW': '身高',
        'en': 'Height',
        'ja': '身長'
      },
      placeholder: {
        'zh-TW': '例如：170',
        'en': 'e.g., 170',
        'ja': '例：170'
      },
      helpText: {
        'zh-TW': '請輸入您的身高，單位為公分',
        'en': 'Enter your height in centimeters',
        'ja': '身長をセンチメートルで入力してください'
      },
      required: true,
      min: 100,
      max: 250,
      step: 0.1,
      unit: 'cm',
      validation: {
        errorMessage: {
          'zh-TW': '身高必須在 100-250 公分之間',
          'en': 'Height must be between 100-250 cm',
          'ja': '身長は100-250cmの間である必要があります'
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
        'zh-TW': '例如：30',
        'en': 'e.g., 30',
        'ja': '例：30'
      },
      helpText: {
        'zh-TW': '年齡用於提供更精確的健康建議（選填）',
        'en': 'Age is used to provide more accurate health recommendations (optional)',
        'ja': '年齢はより正確な健康アドバイスを提供するために使用されます（任意）'
      },
      required: false,
      min: 2,
      max: 120,
      step: 1,
      unit: '歲',
      validation: {
        errorMessage: {
          'zh-TW': '年齡必須在 2-120 歲之間',
          'en': 'Age must be between 2-120 years',
          'ja': '年齢は2-120歳の間である必要があります'
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
        'zh-TW': '性別用於提供更個人化的健康建議（選填）',
        'en': 'Gender is used to provide more personalized health recommendations (optional)',
        'ja': '性別はより個人化された健康アドバイスを提供するために使用されます（任意）'
      },
      required: false,
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
      required: ['weight', 'height'],
      dependencies: []
    }
  },
  
  medical: {
    specialty: ['general', 'internal-medicine', 'endocrinology'],
    evidenceLevel: 'A',
    references: [
      {
        title: 'WHO Expert Committee on Physical Status: the Use and Interpretation of Anthropometry',
        authors: ['World Health Organization'],
        journal: 'WHO Technical Report Series',
        year: 1995,
        url: 'https://www.who.int/publications/i/item/9241208546'
      },
      {
        title: 'Taiwan Ministry of Health and Welfare BMI Standards',
        authors: ['Taiwan Ministry of Health and Welfare'],
        journal: 'Health Promotion Administration',
        year: 2018,
        url: 'https://www.hpa.gov.tw/'
      }
    ],
    clinicalGuidelines: {
      'zh-TW': '根據世界衛生組織 (WHO) 和台灣衛生福利部的標準，BMI 是評估成人體重狀態的重要指標。正常 BMI 範圍為 18.5-24.9 kg/m²。BMI ≥27 被定義為肥胖，需要積極的健康管理。',
      'en': 'According to World Health Organization (WHO) standards, BMI is an important indicator for assessing adult weight status. Normal BMI range is 18.5-24.9 kg/m². BMI ≥30 is defined as obesity requiring active health management.',
      'ja': '世界保健機関（WHO）の基準によると、BMIは成人の体重状態を評価する重要な指標です。正常なBMI範囲は18.5-24.9 kg/m²です。BMI≥25は過体重、BMI≥30は肥満と定義され、積極的な健康管理が必要です。'
    },
    contraindications: [
      {
        'zh-TW': '孕婦和哺乳期婦女',
        'en': 'Pregnant and breastfeeding women',
        'ja': '妊娠中および授乳中の女性'
      },
      {
        'zh-TW': '18歲以下兒童和青少年',
        'en': 'Children and adolescents under 18 years',
        'ja': '18歳未満の子供と青少年'
      },
      {
        'zh-TW': '肌肉量異常高的運動員',
        'en': 'Athletes with exceptionally high muscle mass',
        'ja': '筋肉量が異常に多いアスリート'
      }
    ],
    limitations: [
      {
        'zh-TW': 'BMI 不能區分肌肉和脂肪組織',
        'en': 'BMI cannot distinguish between muscle and fat tissue',
        'ja': 'BMIは筋肉と脂肪組織を区別できません'
      },
      {
        'zh-TW': '不反映脂肪分布位置',
        'en': 'Does not reflect fat distribution',
        'ja': '脂肪分布を反映しません'
      },
      {
        'zh-TW': '可能不適用於某些族群',
        'en': 'May not be applicable to certain populations',
        'ja': '特定の集団には適用できない場合があります'
      }
    ]
  },
  
  metadata: {
    tags: ['BMI', 'body mass index', 'obesity', 'weight management', 'health assessment'],
    difficulty: 'basic',
    lastUpdated: '2024-01-26',
    author: 'Astro Clinical Platform',
    reviewedBy: 'Medical Team',
    estimatedTime: 2
  }
};