/**
 * 血脂管理計算機配置
 */

import { CalculatorConfig } from '../../types';

export const config: CalculatorConfig = {
  id: 'lipid-management',
  name: {
    'zh-TW': '血脂管理與心血管風險計算機',
    'en': 'Lipid Management & Cardiovascular Risk Calculator',
    'ja': '脂質管理・心血管リスク計算機'
  },
  description: {
    'zh-TW': '根據2022臺灣高血壓、高血脂、糖尿病指引，評估心血管風險並提供血脂管理建議',
    'en': 'Assess cardiovascular risk and provide lipid management recommendations based on 2022 Taiwan guidelines',
    'ja': '2022年台湾ガイドラインに基づく心血管リスク評価と脂質管理推奨'
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
      description: {
        'zh-TW': '患者年齡（歲）',
        'en': 'Patient age in years',
        'ja': '患者の年齢（歳）'
      },
      required: true,
      min: 18,
      max: 120,
      defaultValue: 50
    },
    {
      id: 'gender',
      type: 'select',
      label: {
        'zh-TW': '性別',
        'en': 'Gender',
        'ja': '性別'
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
      ],
      defaultValue: 'male'
    },
    {
      id: 'totalCholesterol',
      type: 'number',
      label: {
        'zh-TW': '總膽固醇 (mg/dL)',
        'en': 'Total Cholesterol (mg/dL)',
        'ja': '総コレステロール (mg/dL)'
      },
      required: true,
      min: 100,
      max: 500,
      defaultValue: 200
    },
    {
      id: 'ldlCholesterol',
      type: 'number',
      label: {
        'zh-TW': 'LDL 膽固醇 (mg/dL)',
        'en': 'LDL Cholesterol (mg/dL)',
        'ja': 'LDLコレステロール (mg/dL)'
      },
      required: true,
      min: 50,
      max: 300,
      defaultValue: 130
    },
    {
      id: 'hdlCholesterol',
      type: 'number',
      label: {
        'zh-TW': 'HDL 膽固醇 (mg/dL)',
        'en': 'HDL Cholesterol (mg/dL)',
        'ja': 'HDLコレステロール (mg/dL)'
      },
      required: true,
      min: 20,
      max: 100,
      defaultValue: 50
    },
    {
      id: 'triglycerides',
      type: 'number',
      label: {
        'zh-TW': '三酸甘油脂 (mg/dL)',
        'en': 'Triglycerides (mg/dL)',
        'ja': 'トリグリセリド (mg/dL)'
      },
      required: true,
      min: 50,
      max: 1000,
      defaultValue: 150
    },
    {
      id: 'systolicBP',
      type: 'number',
      label: {
        'zh-TW': '收縮壓 (mmHg)',
        'en': 'Systolic BP (mmHg)',
        'ja': '収縮期血圧 (mmHg)'
      },
      required: true,
      min: 80,
      max: 250,
      defaultValue: 120
    },
    {
      id: 'diastolicBP',
      type: 'number',
      label: {
        'zh-TW': '舒張壓 (mmHg)',
        'en': 'Diastolic BP (mmHg)',
        'ja': '拡張期血圧 (mmHg)'
      },
      required: true,
      min: 40,
      max: 150,
      defaultValue: 80
    },
    {
      id: 'diabetes',
      type: 'boolean',
      label: {
        'zh-TW': '糖尿病',
        'en': 'Diabetes',
        'ja': '糖尿病'
      },
      description: {
        'zh-TW': '是否患有糖尿病',
        'en': 'Has diabetes mellitus',
        'ja': '糖尿病の有無'
      },
      required: true,
      defaultValue: false
    },
    {
      id: 'smoking',
      type: 'boolean',
      label: {
        'zh-TW': '吸菸',
        'en': 'Smoking',
        'ja': '喫煙'
      },
      description: {
        'zh-TW': '目前吸菸或過去一年內吸菸',
        'en': 'Current smoker or quit within past year',
        'ja': '現在喫煙中または過去1年以内に禁煙'
      },
      required: true,
      defaultValue: false
    },
    {
      id: 'familyHistory',
      type: 'boolean',
      label: {
        'zh-TW': '家族史',
        'en': 'Family History',
        'ja': '家族歴'
      },
      description: {
        'zh-TW': '早發性心血管疾病家族史',
        'en': 'Family history of premature CVD',
        'ja': '早発性心血管疾患の家族歴'
      },
      required: true,
      defaultValue: false
    },
    {
      id: 'hypertension',
      type: 'boolean',
      label: {
        'zh-TW': '高血壓',
        'en': 'Hypertension',
        'ja': '高血圧'
      },
      description: {
        'zh-TW': '是否患有高血壓',
        'en': 'Has hypertension',
        'ja': '高血圧の有無'
      },
      required: true,
      defaultValue: false
    },
    {
      id: 'ckd',
      type: 'boolean',
      label: {
        'zh-TW': '慢性腎病',
        'en': 'Chronic Kidney Disease',
        'ja': '慢性腎疾患'
      },
      description: {
        'zh-TW': '是否患有慢性腎病',
        'en': 'Has chronic kidney disease',
        'ja': '慢性腎疾患の有無'
      },
      required: true,
      defaultValue: false
    },
    {
      id: 'previousCVD',
      type: 'boolean',
      label: {
        'zh-TW': '既往心血管疾病',
        'en': 'Previous CVD',
        'ja': '既往心血管疾患'
      },
      description: {
        'zh-TW': '既往心肌梗塞、中風或其他心血管疾病',
        'en': 'Previous MI, stroke, or other CVD',
        'ja': '既往心筋梗塞、脳卒中、その他心血管疾患'
      },
      required: true,
      defaultValue: false
    }
  ],
  medical: {
    specialty: ['cardiology', 'internal-medicine'],
    evidenceLevel: 'A',
    clinicalGuidelines: {
      'zh-TW': '基於2022年臺灣高血壓、高血脂、糖尿病防治指引',
      'en': 'Based on 2022 Taiwan Guidelines for Hypertension, Dyslipidemia, and Diabetes',
      'ja': '2022年台湾高血圧・脂質異常症・糖尿病治療ガイドラインに基づく'
    },
    references: [
      {
        title: {
          'zh-TW': '2022臺灣高血脂防治指引',
          'en': '2022 Taiwan Dyslipidemia Guidelines',
          'ja': '2022年台湾脂質異常症ガイドライン'
        },
        url: 'https://www.tas.org.tw/',
        type: 'guideline'
      }
    ]
  },
  
  metadata: {
    tags: ['cardiology', 'lipid', 'cholesterol', 'cardiovascular-risk', 'taiwan-guidelines'],
    difficulty: 'intermediate',
    lastUpdated: '2024-01-26',
    author: 'Astro Clinical Platform',
    reviewedBy: 'Cardiology Team',
    estimatedTime: 5
  }
};