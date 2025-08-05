/**
 * 兒童抗生素劑量計算機配置
 */

import { CalculatorConfig } from '../../types';

export const config: CalculatorConfig = {
  id: 'pediatric-antibiotic-calculator',
  name: {
    'zh-TW': '兒童抗生素劑量計算器',
    'en': 'Pediatric Antibiotic Dose Calculator',
    'ja': '小児抗生物質用量計算機'
  },
  description: {
    'zh-TW': '專業的兒童抗生素劑量計算工具，支援多種抗生素和抗病毒藥物的劑量計算',
    'en': 'Professional pediatric antibiotic dose calculation tool supporting multiple antibiotics and antiviral medications',
    'ja': '複数の抗生物質と抗ウイルス薬の用量計算をサポートする専門的な小児抗生物質用量計算ツール'
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
      id: 'age',
      type: 'number',
      label: {
        'zh-TW': '兒童年齡',
        'en': 'Child Age',
        'ja': '小児年齢'
      },
      required: false,
      validation: {
        min: 0,
        max: 18
      },
      unit: 'years'
    },
    {
      id: 'form',
      type: 'select',
      label: {
        'zh-TW': '藥物劑型',
        'en': 'Drug Form',
        'ja': '薬物剤形'
      },
      required: true,
      defaultValue: 'powder',
      options: [
        {
          value: 'powder',
          label: {
            'zh-TW': '藥粉',
            'en': 'Powder',
            'ja': '粉薬'
          }
        },
        {
          value: 'pill',
          label: {
            'zh-TW': '藥錠/膠囊',
            'en': 'Tablet/Capsule',
            'ja': '錠剤/カプセル'
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
        { value: '3', label: { 'zh-TW': '3 天', 'en': '3 Days', 'ja': '3日' } }
      ]
    },
    {
      id: 'frequency',
      type: 'select',
      label: {
        'zh-TW': '用藥頻次',
        'en': 'Dosing Frequency',
        'ja': '投与頻度'
      },
      required: true,
      defaultValue: '3',
      options: [
        { value: '1', label: { 'zh-TW': '1 次 (QD)', 'en': 'Once Daily (QD)', 'ja': '1日1回 (QD)' } },
        { value: '2', label: { 'zh-TW': '2 次 (BID)', 'en': 'Twice Daily (BID)', 'ja': '1日2回 (BID)' } },
        { value: '3', label: { 'zh-TW': '3 次 (TID)', 'en': 'Three Times Daily (TID)', 'ja': '1日3回 (TID)' } },
        { value: '4', label: { 'zh-TW': '4 次 (QID)', 'en': 'Four Times Daily (QID)', 'ja': '1日4回 (QID)' } }
      ]
    }
  ],
  medical: {
    specialty: ['Pediatrics', 'Family Medicine', 'Internal Medicine', 'Infectious Disease'],
    evidenceLevel: 'A'
  },
  metadata: {
    difficulty: 'intermediate',
    tags: ['pediatrics', 'antibiotics', 'antivirals', 'dose-calculation', 'infection']
  }
};