export interface MedicalProcedure {
  id: string;
  name: {
    en: string;
    zh: string;
    ja: string;
  };
  category: 'diagnostic' | 'therapeutic' | 'surgical' | 'preventive' | 'emergency';
  specialty: string;
  description: {
    en: string;
    zh: string;
    ja: string;
  };
  purpose: {
    en: string;
    zh: string;
    ja: string;
  };
  duration: {
    typical: number; // in minutes
    range: {
      min: number;
      max: number;
    };
  };
  preparation: {
    beforeProcedure: {
      en: string[];
      zh: string[];
      ja: string[];
    };
    medications: {
      en: string[];
      zh: string[];
      ja: string[];
    };
    fasting: {
      required: boolean;
      duration?: number; // hours
      description: {
        en: string;
        zh: string;
        ja: string;
      };
    };
  };
  procedure: {
    steps: {
      step: number;
      title: {
        en: string;
        zh: string;
        ja: string;
      };
      description: {
        en: string;
        zh: string;
        ja: string;
      };
      duration?: number; // minutes
      image?: string;
    }[];
    anesthesia?: {
      type: 'local' | 'regional' | 'general' | 'sedation' | 'none';
      description: {
        en: string;
        zh: string;
        ja: string;
      };
    };
    equipment: {
      en: string[];
      zh: string[];
      ja: string[];
    };
  };
  risks: {
    common: {
      risk: {
        en: string;
        zh: string;
        ja: string;
      };
      probability: 'low' | 'moderate' | 'high';
      severity: 'mild' | 'moderate' | 'severe';
      description: {
        en: string;
        zh: string;
        ja: string;
      };
    }[];
    serious: {
      risk: {
        en: string;
        zh: string;
        ja: string;
      };
      probability: 'low' | 'moderate' | 'high';
      severity: 'mild' | 'moderate' | 'severe';
      description: {
        en: string;
        zh: string;
        ja: string;
      };
    }[];
  };
  benefits: {
    en: string[];
    zh: string[];
    ja: string[];
  };
  alternatives: {
    procedure: {
      en: string;
      zh: string;
      ja: string;
    };
    description: {
      en: string;
      zh: string;
      ja: string;
    };
    pros: {
      en: string[];
      zh: string[];
      ja: string[];
    };
    cons: {
      en: string[];
      zh: string[];
      ja: string[];
    };
  }[];
  aftercare: {
    immediate: {
      en: string[];
      zh: string[];
      ja: string[];
    };
    recovery: {
      timeline: {
        period: string;
        activities: {
          en: string[];
          zh: string[];
          ja: string[];
        };
      }[];
      fullRecovery: {
        duration: number; // days
        description: {
          en: string;
          zh: string;
          ja: string;
        };
      };
    };
    followUp: {
      required: boolean;
      schedule: {
        en: string;
        zh: string;
        ja: string;
      };
    };
    warning_signs: {
      en: string[];
      zh: string[];
      ja: string[];
    };
  };
  contraindications: {
    absolute: {
      en: string[];
      zh: string[];
      ja: string[];
    };
    relative: {
      en: string[];
      zh: string[];
      ja: string[];
    };
  };
  cost: {
    estimated: {
      min: number;
      max: number;
      currency: string;
    };
    factors: {
      en: string[];
      zh: string[];
      ja: string[];
    };
  };
  cptCode?: string;
  icdCodes?: string[];
  references: {
    title: string;
    authors?: string[];
    journal?: string;
    year?: number;
    url?: string;
    doi?: string;
  }[];
  lastUpdated: string;
  reviewedBy?: string;
  images?: {
    before?: string;
    during?: string;
    after?: string;
    diagram?: string;
  };
}

export interface ProcedureComparison {
  procedures: MedicalProcedure[];
  comparisonCriteria: {
    duration: boolean;
    risks: boolean;
    benefits: boolean;
    cost: boolean;
    recovery: boolean;
  };
}

export interface ProcedureSearchFilters {
  category?: string;
  specialty?: string;
  searchTerm?: string;
  duration?: {
    min?: number;
    max?: number;
  };
  riskLevel?: 'low' | 'moderate' | 'high';
  sortBy?: 'name' | 'duration' | 'category' | 'specialty';
}