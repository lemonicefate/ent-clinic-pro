export interface Medication {
  id: string;
  name: {
    en: string;
    zh: string;
    ja: string;
  };
  genericName: {
    en: string;
    zh: string;
    ja: string;
  };
  strength: string;
  dosageForm: {
    en: string;
    zh: string;
    ja: string;
  };
  category: string;
  description: {
    en: string;
    zh: string;
    ja: string;
  };
  indications: {
    en: string[];
    zh: string[];
    ja: string[];
  };
  contraindications: {
    en: string[];
    zh: string[];
    ja: string[];
  };
  sideEffects: {
    common: {
      en: string[];
      zh: string[];
      ja: string[];
    };
    serious: {
      en: string[];
      zh: string[];
      ja: string[];
    };
  };
  dosage: {
    adult: {
      en: string;
      zh: string;
      ja: string;
    };
  };
  interactions?: {
    medication: string;
    severity: 'low' | 'moderate' | 'high';
    description: {
      en: string;
      zh: string;
      ja: string;
    };
  }[];
  rxnormCode?: string;
  fdcCode?: string;
  image?: string;
}

export interface MedicationSearchFilters {
  category?: string;
  searchTerm?: string;
  sortBy?: 'name' | 'category' | 'strength';
}

export interface MedicationInteraction {
  medication1: string;
  medication2: string;
  severity: 'low' | 'moderate' | 'high';
  description: {
    en: string;
    zh: string;
    ja: string;
  };
  mechanism?: string;
  management?: {
    en: string;
    zh: string;
    ja: string;
  };
}