/**
 * Static Visualization Configuration Registry
 * 
 * This file contains all visualization configurations to avoid dynamic imports
 * during the build process.
 */

import type { VisualizationConfig } from '../services/calculator-service.js';

// Import visualization configs from new specialty-based structure
import bmiVisualization from '../calculators/specialties/general/bmi/visualization.json';
import egfrVisualization from '../calculators/specialties/nephrology/egfr/visualization.json';
import cha2ds2VascVisualization from '../calculators/specialties/cardiology/cha2ds2-vasc/visualization.json';
import amoxicillinVisualization from '../calculators/specialties/pediatrics/amoxicillin-clavulanate-dose/visualization.json';
import pediatricAntibioticVisualization from '../calculators/specialties/pediatrics/pediatric-antibiotic-calculator/visualization.json';
import lipidManagementVisualization from '../calculators/specialties/cardiology/lipid-management/visualization.json';

export const visualizationRegistry: Record<string, VisualizationConfig> = {
  'general.bmi': bmiVisualization as VisualizationConfig,
  'nephrology.egfr': egfrVisualization as VisualizationConfig,
  'cardiology.cha2ds2-vasc': cha2ds2VascVisualization as VisualizationConfig,
  'pediatrics.amoxicillin-clavulanate-dose': amoxicillinVisualization as VisualizationConfig,
  'pediatrics.pediatric-antibiotic-calculator': pediatricAntibioticVisualization as VisualizationConfig,
  'cardiology.lipid-management': lipidManagementVisualization as VisualizationConfig,
};

/**
 * Get visualization configuration for a plugin
 */
export function getVisualizationConfig(pluginId: string): VisualizationConfig | undefined {
  return visualizationRegistry[pluginId];
}