import type { Medication, MedicationSearchFilters, MedicationInteraction } from '../types/medication';

// Mock API client for demonstration - in production this would connect to real medical APIs
export class MedicationAPIClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = '', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Search medications using various criteria
   * In production, this would integrate with APIs like:
   * - Canvas Medical API
   * - OpenFDA API
   * - RxNorm API
   * - FDB (First Databank)
   */
  async searchMedications(filters: MedicationSearchFilters): Promise<Medication[]> {
    // Mock implementation - replace with actual API calls
    const mockResponse = await this.mockApiCall('/medications/search', {
      method: 'GET',
      params: filters
    });
    
    return mockResponse.data || [];
  }

  /**
   * Get detailed medication information by ID
   * Integrates with medical databases for comprehensive drug information
   */
  async getMedicationById(id: string): Promise<Medication | null> {
    try {
      const response = await this.mockApiCall(`/medications/${id}`, {
        method: 'GET'
      });
      
      return response.data || null;
    } catch (error) {
      console.error('Error fetching medication:', error);
      return null;
    }
  }

  /**
   * Get medication by RxNorm code
   * RxNorm is the standard for medication terminology
   */
  async getMedicationByRxNorm(rxnormCode: string): Promise<Medication | null> {
    try {
      const response = await this.mockApiCall('/medications/rxnorm', {
        method: 'GET',
        params: { code: rxnormCode }
      });
      
      return response.data || null;
    } catch (error) {
      console.error('Error fetching medication by RxNorm:', error);
      return null;
    }
  }

  /**
   * Check for drug interactions between medications
   * Critical for patient safety
   */
  async checkDrugInteractions(medicationIds: string[]): Promise<MedicationInteraction[]> {
    try {
      const response = await this.mockApiCall('/medications/interactions', {
        method: 'POST',
        body: { medications: medicationIds }
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Error checking drug interactions:', error);
      return [];
    }
  }

  /**
   * Get medications by category (e.g., diabetes, cardiovascular)
   */
  async getMedicationsByCategory(category: string): Promise<Medication[]> {
    try {
      const response = await this.mockApiCall('/medications/category', {
        method: 'GET',
        params: { category }
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching medications by category:', error);
      return [];
    }
  }

  /**
   * Search medications by indication/condition
   */
  async getMedicationsByIndication(indication: string): Promise<Medication[]> {
    try {
      const response = await this.mockApiCall('/medications/indication', {
        method: 'GET',
        params: { indication }
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching medications by indication:', error);
      return [];
    }
  }

  /**
   * Mock API call for demonstration
   * In production, replace with actual HTTP client
   */
  private async mockApiCall(endpoint: string, options: any): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock successful response
    return {
      status: 200,
      data: [],
      message: 'Success'
    };
  }

  /**
   * Real API integration example for Canvas Medical
   * Uncomment and configure for production use
   */
  /*
  private async canvasApiCall(endpoint: string, options: any): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
  */
}

/**
 * Utility functions for medication data processing
 */
export class MedicationUtils {
  /**
   * Format medication strength for display
   */
  static formatStrength(strength: string): string {
    return strength.replace(/(\d+)\s*mg/g, '$1 mg')
                  .replace(/(\d+)\s*mcg/g, '$1 mcg')
                  .replace(/(\d+)\s*g/g, '$1 g');
  }

  /**
   * Get severity color class for interactions
   */
  static getSeverityColorClass(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  /**
   * Extract active ingredients from medication name
   */
  static extractActiveIngredients(medicationName: string): string[] {
    // Simple extraction - in production, use medical terminology APIs
    const ingredients = medicationName
      .replace(/\d+\s*mg/g, '')
      .replace(/\d+\s*mcg/g, '')
      .replace(/tablet|capsule|liquid|injection/gi, '')
      .split(/[\/,\+]/)
      .map(ingredient => ingredient.trim())
      .filter(ingredient => ingredient.length > 0);
    
    return ingredients;
  }

  /**
   * Calculate medication dosage based on patient parameters
   */
  static calculateDosage(
    medication: Medication,
    patientWeight: number,
    patientAge: number,
    indication: string
  ): string {
    // Mock calculation - in production, use clinical decision support systems
    const baseStrength = parseFloat(medication.strength.match(/(\d+)/)?.[1] || '0');
    
    // Simple weight-based calculation (this is just for demo)
    if (patientWeight < 50) {
      return `${Math.round(baseStrength * 0.8)} mg`;
    } else if (patientWeight > 80) {
      return `${Math.round(baseStrength * 1.2)} mg`;
    }
    
    return medication.strength;
  }

  /**
   * Check if medication is safe for patient conditions
   */
  static checkSafetyForConditions(
    medication: Medication,
    patientConditions: string[],
    locale: string = 'en'
  ): { safe: boolean; warnings: string[] } {
    const warnings: string[] = [];
    const contraindications = medication.contraindications[locale as keyof typeof medication.contraindications] || [];
    
    patientConditions.forEach(condition => {
      const hasContraindication = contraindications.some(contraindication =>
        contraindication.toLowerCase().includes(condition.toLowerCase())
      );
      
      if (hasContraindication) {
        warnings.push(`Contraindicated for ${condition}`);
      }
    });
    
    return {
      safe: warnings.length === 0,
      warnings
    };
  }

  /**
   * Generate medication comparison summary
   */
  static generateComparisonSummary(
    medications: Medication[],
    locale: string = 'en'
  ): string {
    if (medications.length < 2) {
      return 'Need at least 2 medications to compare';
    }

    const categories = [...new Set(medications.map(med => med.category))];
    const strengths = medications.map(med => med.strength);
    
    return `Comparing ${medications.length} medications across ${categories.length} categories with strengths: ${strengths.join(', ')}`;
  }
}

/**
 * Default medication API client instance
 */
export const medicationAPI = new MedicationAPIClient();

/**
 * Load medication data from various sources
 */
export async function loadMedicationData(): Promise<Medication[]> {
  try {
    // In production, this would load from multiple sources:
    // 1. Local content collections
    // 2. External APIs (Canvas Medical, OpenFDA, etc.)
    // 3. Cached data
    
    // For now, load from local JSON file
    const response = await import('../content/medications/sample-medications.json');
    return response.default;
  } catch (error) {
    console.error('Error loading medication data:', error);
    return [];
  }
}

/**
 * Integration helpers for external medical APIs
 */
export class ExternalAPIIntegration {
  /**
   * Canvas Medical API integration
   */
  static async searchCanvasMedications(searchTerm: string, apiKey: string): Promise<any[]> {
    // Example Canvas Medical API integration
    try {
      const response = await fetch(`https://fumage-example.canvasmedical.com/Medication?_text=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Canvas API error: ${response.status}`);
      }

      const data = await response.json();
      return data.entry?.map((entry: any) => entry.resource) || [];
    } catch (error) {
      console.error('Canvas Medical API error:', error);
      return [];
    }
  }

  /**
   * OpenFDA API integration
   */
  static async searchOpenFDADrugs(searchTerm: string): Promise<any[]> {
    try {
      const response = await fetch(
        `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(searchTerm)}"&limit=10`
      );

      if (!response.ok) {
        throw new Error(`OpenFDA API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('OpenFDA API error:', error);
      return [];
    }
  }

  /**
   * RxNorm API integration
   */
  static async searchRxNorm(searchTerm: string): Promise<any[]> {
    try {
      const response = await fetch(
        `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(searchTerm)}`
      );

      if (!response.ok) {
        throw new Error(`RxNorm API error: ${response.status}`);
      }

      const data = await response.json();
      return data.drugGroup?.conceptGroup || [];
    } catch (error) {
      console.error('RxNorm API error:', error);
      return [];
    }
  }
}