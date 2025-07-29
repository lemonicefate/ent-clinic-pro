/**
 * Medical Specialties Index
 * 
 * This file provides metadata about medical specialties and their calculators
 * for use in navigation, categorization, and discovery features.
 */

export interface MedicalSpecialty {
  id: string;
  name: {
    'zh-TW': string;
    'en': string;
  };
  description: {
    'zh-TW': string;
    'en': string;
  };
  icon: string;
  color: string;
  calculators: string[];
  isActive: boolean;
}

export const medicalSpecialties: Record<string, MedicalSpecialty> = {
  general: {
    id: 'general',
    name: {
      'zh-TW': '一般醫學',
      'en': 'General Medicine'
    },
    description: {
      'zh-TW': '基礎健康評估和常見醫療指標計算',
      'en': 'Basic health assessment and common medical indicators'
    },
    icon: '🏥',
    color: 'blue',
    calculators: ['general.bmi'],
    isActive: true
  },
  
  cardiology: {
    id: 'cardiology',
    name: {
      'zh-TW': '心臟科',
      'en': 'Cardiology'
    },
    description: {
      'zh-TW': '心血管疾病風險評估和診斷輔助',
      'en': 'Cardiovascular disease risk assessment and diagnostic support'
    },
    icon: '❤️',
    color: 'red',
    calculators: ['cardiology.cha2ds2-vasc', 'cardiology.lipid-management'],
    isActive: true
  },
  
  nephrology: {
    id: 'nephrology',
    name: {
      'zh-TW': '腎臟科',
      'en': 'Nephrology'
    },
    description: {
      'zh-TW': '腎功能評估和慢性腎病管理',
      'en': 'Kidney function assessment and chronic kidney disease management'
    },
    icon: '🫘',
    color: 'green',
    calculators: ['nephrology.egfr'],
    isActive: true
  },
  
  pediatrics: {
    id: 'pediatrics',
    name: {
      'zh-TW': '小兒科',
      'en': 'Pediatrics'
    },
    description: {
      'zh-TW': '兒童醫療劑量計算和生長發育評估',
      'en': 'Pediatric dosage calculations and growth assessment'
    },
    icon: '👶',
    color: 'purple',
    calculators: ['pediatrics.amoxicillin-clavulanate-dose'],
    isActive: true
  },
  
  endocrinology: {
    id: 'endocrinology',
    name: {
      'zh-TW': '內分泌科',
      'en': 'Endocrinology'
    },
    description: {
      'zh-TW': '內分泌疾病診斷和代謝評估',
      'en': 'Endocrine disease diagnosis and metabolic assessment'
    },
    icon: '🩺',
    color: 'yellow',
    calculators: [],
    isActive: false
  },
  
  emergency: {
    id: 'emergency',
    name: {
      'zh-TW': '急診科',
      'en': 'Emergency Medicine'
    },
    description: {
      'zh-TW': '急診醫療評估和緊急處置',
      'en': 'Emergency medical assessment and urgent care'
    },
    icon: '🚨',
    color: 'orange',
    calculators: [],
    isActive: false
  },
  
  'internal-medicine': {
    id: 'internal-medicine',
    name: {
      'zh-TW': '內科',
      'en': 'Internal Medicine'
    },
    description: {
      'zh-TW': '內科疾病診斷和治療評估',
      'en': 'Internal medicine diagnosis and treatment assessment'
    },
    icon: '🏥',
    color: 'indigo',
    calculators: [],
    isActive: false
  },
  
  surgery: {
    id: 'surgery',
    name: {
      'zh-TW': '外科',
      'en': 'Surgery'
    },
    description: {
      'zh-TW': '外科手術風險評估和術前評估',
      'en': 'Surgical risk assessment and preoperative evaluation'
    },
    icon: '🔪',
    color: 'gray',
    calculators: [],
    isActive: false
  },
  
  'obstetrics-gynecology': {
    id: 'obstetrics-gynecology',
    name: {
      'zh-TW': '婦產科',
      'en': 'Obstetrics & Gynecology'
    },
    description: {
      'zh-TW': '婦產科醫療評估和孕期計算',
      'en': 'Obstetric and gynecologic assessment and pregnancy calculations'
    },
    icon: '🤱',
    color: 'pink',
    calculators: [],
    isActive: false
  },
  
  psychiatry: {
    id: 'psychiatry',
    name: {
      'zh-TW': '精神科',
      'en': 'Psychiatry'
    },
    description: {
      'zh-TW': '精神疾病評估和心理健康篩檢',
      'en': 'Psychiatric assessment and mental health screening'
    },
    icon: '🧠',
    color: 'teal',
    calculators: [],
    isActive: false
  },
  
  dermatology: {
    id: 'dermatology',
    name: {
      'zh-TW': '皮膚科',
      'en': 'Dermatology'
    },
    description: {
      'zh-TW': '皮膚疾病診斷和治療評估',
      'en': 'Dermatologic diagnosis and treatment assessment'
    },
    icon: '🩴',
    color: 'amber',
    calculators: [],
    isActive: false
  }
};

/**
 * Get all active medical specialties
 */
export function getActiveSpecialties(): MedicalSpecialty[] {
  return Object.values(medicalSpecialties).filter(specialty => specialty.isActive);
}

/**
 * Get specialty by ID
 */
export function getSpecialtyById(id: string): MedicalSpecialty | undefined {
  return medicalSpecialties[id];
}

/**
 * Get calculators by specialty
 */
export function getCalculatorsBySpecialty(specialtyId: string): string[] {
  const specialty = medicalSpecialties[specialtyId];
  return specialty ? specialty.calculators : [];
}

/**
 * Get specialty for a calculator
 */
export function getSpecialtyForCalculator(calculatorId: string): MedicalSpecialty | undefined {
  return Object.values(medicalSpecialties).find(specialty => 
    specialty.calculators.includes(calculatorId)
  );
}