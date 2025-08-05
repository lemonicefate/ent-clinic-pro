/**
 * Amoxicillin/Clavulanate 劑量計算機配置
 */

import type { CalculatorConfig } from '../../types';

export const config: CalculatorConfig = {
  id: 'amoxicillin-clavulanate-dose',
  name: {
    'zh-TW': '兒童 Amoxicillin/Clavulanate 劑量計算器',
    'en': 'Pediatric Amoxicillin/Clavulanate Dose Calculator',
    'ja': '小児用アモキシシリン/クラブラン酸用量計算機'
  },
  description: {
    'zh-TW': '根據兒童體重與治療目標，智能計算最佳 Amoxicillin/Clavulanate 藥錠組合',
    'en': 'Calculate optimal Amoxicillin/Clavulanate tablet combinations for pediatric patients',
    'ja': '小児患者に最適なアモキシシリン/クラブラン酸錠剤の組み合わせを計算'
  },
  category: 'pediatrics',
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
        'zh-TW': '例如：25',
        'en': 'e.g., 25',
        'ja': '例：25'
      },
      required: true,
      min: 1,
      max: 100,
      step: 0.1,
      unit: 'kg',
      validation: {
        errorMessage: {
          'zh-TW': '體重必須在 1-100 公斤之間',
          'en': 'Weight must be between 1-100 kg',
          'ja': '体重は1-100kgの間である必要があります'
        }
      }
    },
    {
      id: 'doseTarget',
      type: 'select',
      label: {
        'zh-TW': '劑量選擇',
        'en': 'Dose Selection',
        'ja': '用量選択'
      },
      required: true,
      defaultValue: 'normal',
      options: [
        {
          value: 'normal',
          label: {
            'zh-TW': '正常劑量 (45 mg/kg/day)',
            'en': 'Normal Dose (45 mg/kg/day)',
            'ja': '通常用量 (45 mg/kg/day)'
          }
        },
        {
          value: 'high',
          label: {
            'zh-TW': '高劑量 (80-90 mg/kg/day)',
            'en': 'High Dose (80-90 mg/kg/day)',
            'ja': '高用量 (80-90 mg/kg/day)'
          }
        }
      ]
    }
  ],
  medical: {
    specialty: ['Pediatrics', 'Family Medicine', 'Infectious Disease'],
    evidenceLevel: 'A'
  },
  metadata: {
    difficulty: 'intermediate',
    tags: ['pediatrics', 'antibiotics', 'amoxicillin', 'dose-calculation']
  }
};