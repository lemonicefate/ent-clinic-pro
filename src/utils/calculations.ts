// Medical calculation functions
// All calculations are performed client-side for security and privacy

export interface CalculationInput {
  [key: string]: number | string | boolean;
}

export interface CalculationResult {
  score: number;
  risk: 'low' | 'moderate' | 'high' | 'critical';
  interpretation: string;
  recommendations: string[];
}

export interface CalculationError {
  type: 'validation_error' | 'calculation_error' | 'system_error';
  message: string;
  suggestions?: string[];
  fallback?: CalculationResult;
  error?: string;
  timestamp?: string;
}

// Safe calculation wrapper with function-based approach
const calculationFunctions: Record<string, (inputs: CalculationInput) => number> = {
  calculateCHADSVASC: (inputs: CalculationInput) => {
    // CHA₂DS₂-VASc Score calculation
    const age = Number(inputs.age) || 0;
    const gender = Number(inputs.gender) || 0; // 0 = male, 1 = female
    const chf = inputs.chf ? 1 : 0;
    const hypertension = inputs.hypertension ? 1 : 0;
    const stroke = Number(inputs.stroke) || 0; // 0 or 2 points
    const vascular = inputs.vascular ? 1 : 0;
    const diabetes = inputs.diabetes ? 1 : 0;

    return age + gender + chf + hypertension + stroke + vascular + diabetes;
  },

  calculateHASBLED: (inputs: CalculationInput) => {
    // HAS-BLED Score calculation for bleeding risk
    const hypertension = inputs.hypertension ? 1 : 0;
    const abnormalRenal = inputs.abnormalRenal ? 1 : 0;
    const abnormalLiver = inputs.abnormalLiver ? 1 : 0;
    const stroke = inputs.stroke ? 1 : 0;
    const bleeding = inputs.bleeding ? 1 : 0;
    const labile = inputs.labile ? 1 : 0;
    const elderly = inputs.elderly ? 1 : 0; // Age > 65
    const drugs = inputs.drugs ? 1 : 0;

    return hypertension + abnormalRenal + abnormalLiver + stroke + bleeding + labile + elderly + drugs;
  }
};

// Input validation
export function validateInputs(inputs: CalculationInput, requiredFields: string[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const field of requiredFields) {
    if (inputs[field] === undefined || inputs[field] === null || inputs[field] === '') {
      errors.push(`${field} is required`);
    }
  }

  // Validate numeric fields
  for (const [key, value] of Object.entries(inputs)) {
    if (typeof value === 'string' && !isNaN(Number(value))) {
      // Convert string numbers to numbers
      inputs[key] = Number(value);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Safe calculation wrapper
export function safeCalculate(
  inputs: CalculationInput,
  calculationFunction: string,
  requiredFields: string[] = []
): CalculationResult | CalculationError {
  try {
    // Validate inputs
    const validationResult = validateInputs(inputs, requiredFields);
    if (!validationResult.isValid) {
      return {
        type: 'validation_error',
        message: 'Invalid input values',
        suggestions: validationResult.errors
      };
    }

    // Use predefined function instead of eval() for security
    const calcFunction = calculationFunctions[calculationFunction];
    if (!calcFunction) {
      throw new Error(`Unknown calculation function: ${calculationFunction}`);
    }

    const score = calcFunction(inputs);
    
    // Validate result
    if (typeof score !== 'number' || isNaN(score)) {
      return {
        type: 'calculation_error',
        message: 'Invalid calculation result',
        fallback: {
          score: 0,
          risk: 'low',
          interpretation: 'Unable to calculate score',
          recommendations: ['Please check input values and try again']
        }
      };
    }

    // Return basic result - interpretation will be handled by the component
    return {
      score,
      risk: score >= 2 ? 'high' : score === 1 ? 'moderate' : 'low',
      interpretation: `Score: ${score}`,
      recommendations: []
    };

  } catch (error) {
    return {
      type: 'system_error',
      message: 'Calculation failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

// Utility function to get risk level color
export function getRiskColor(risk: string): string {
  switch (risk) {
    case 'low':
      return '#10B981'; // Green
    case 'moderate':
      return '#F59E0B'; // Amber
    case 'high':
      return '#EF4444'; // Red
    case 'critical':
      return '#DC2626'; // Dark red
    default:
      return '#6B7280'; // Gray
  }
}

// Utility function to format calculation results for display
export function formatCalculationResult(
  result: CalculationResult | CalculationError,
  locale: string = 'en'
): {
  isError: boolean;
  display: string;
  color?: string;
  suggestions?: string[];
} {
  if ('type' in result) {
    // This is an error
    return {
      isError: true,
      display: result.message,
      suggestions: result.suggestions
    };
  }

  // This is a successful result
  return {
    isError: false,
    display: `${result.interpretation} (${result.risk} risk)`,
    color: getRiskColor(result.risk)
  };
}