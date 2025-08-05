/**
 * Amoxicillin/Clavulanate 劑量計算機配置
 */

import { CalculatorConfig } from '../../types';

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
        'zh-TW': '兒童體重',
        'en': 'Child Weight',
        'ja': '小児体重'
      },
      required: true,
      validation: {
        min: 1,
        max: 100
      },
      unit: 'kg'
    },
    {
      id: 'doseTarget',
      type: 'select',
      label: {
        'zh-TW': 'Amoxicillin 劑量目標',
        'en': 'Amoxicillin Dose Target',
        'ja': 'アモキシシリン用量目標'
      },
      required: true,
      options: [
        {
          value: 'low',
          label: {
            'zh-TW': '標準劑量 (45 mg/kg/day)',
            'en': 'Standard Dose (45 mg/kg/day)',
            'ja': '標準用量 (45 mg/kg/day)'
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
    },
    {
      id: 'days',
      type: 'select',
      label: {
        'zh-TW': '治療天數',
        'en': 'Treatment Days',
        'ja': '治療日数'
      },
      required: true,
      defaultValue: '3',
      options: [
        { value: '1', label: { 'zh-TW': '1 天', 'en': '1 Day', 'ja': '1日' } },
        { value: '2', label: { 'zh-TW': '2 天', 'en': '2 Days', 'ja': '2日' } },
        { value: '3', label: { 'zh-TW': '3 天', 'en': '3 Days', 'ja': '3日' } },
        { value: '4', label: { 'zh-TW': '4 天', 'en': '4 Days', 'ja': '4日' } },
        { value: '5', label: { 'zh-TW': '5 天', 'en': '5 Days', 'ja': '5日' } }
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