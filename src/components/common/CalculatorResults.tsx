/**
 * Generic Calculator Results Component
 * 
 * A reusable results display component that dynamically renders calculation
 * results based on visualization configuration. This replaces the hardcoded
 * result rendering in PluginCalculator.
 */

import React from 'react';
import type { SupportedLocale } from '../../types/calculator.js';
import { TemplateEngine } from '../../utils/template-engine.js';

interface ResultCard {
  type: 'primary' | 'secondary' | 'info' | 'warning' | 'error';
  title: string;
  value: string | number;
  unit?: string;
  color?: string;
  description?: string;
  icon?: string;
}

interface ResultSection {
  title: string;
  cards: ResultCard[];
  layout?: 'grid' | 'list' | 'inline';
  columns?: number;
}

interface VisualizationConfig {
  sections: ResultSection[];
  recommendations?: Array<{
    text: string;
    type: 'info' | 'warning' | 'success' | 'error';
  }>;
  notes?: string[];
}

interface CalculatorResultsProps {
  /** Calculation result data */
  result: any;
  
  /** Visualization configuration */
  visualization?: VisualizationConfig;
  
  /** Current locale */
  locale: SupportedLocale;
  
  /** Theme */
  theme?: 'light' | 'dark';
  
  /** Custom CSS classes */
  className?: string;
}

export default function CalculatorResults({
  result,
  visualization,
  locale,
  theme = 'light',
  className = ''
}: CalculatorResultsProps) {
  
  if (!result) {
    return null;
  }

  // If no visualization config provided, create a default one
  const defaultVisualization: VisualizationConfig = {
    sections: [{
      title: '計算結果',
      cards: Object.entries(result).map(([key, value]) => ({
        type: 'primary' as const,
        title: key,
        value: String(value),
        color: typeof value === 'object' && value && 'color' in value ? value.color : undefined
      })),
      layout: 'grid',
      columns: 2
    }]
  };

  const rawConfig = visualization || defaultVisualization;
  
  // Interpolate the configuration with result data
  console.log('CalculatorResults - Raw config:', rawConfig);
  console.log('CalculatorResults - Result data:', result);
  
  const config = TemplateEngine.interpolateObject(rawConfig, result);
  
  console.log('CalculatorResults - Interpolated config:', config);

  const renderCard = (card: ResultCard, index: number) => {
    const cardTypeClasses = {
      primary: 'bg-blue-50 border-blue-200 text-blue-800',
      secondary: 'bg-gray-50 border-gray-200 text-gray-800',
      info: 'bg-cyan-50 border-cyan-200 text-cyan-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      error: 'bg-red-50 border-red-200 text-red-800'
    };

    return (
      <div
        key={index}
        className={`p-4 border-2 rounded-lg ${cardTypeClasses[card.type]}`}
      >
        <div className="text-center">
          {card.icon && (
            <div className="text-2xl mb-2">{card.icon}</div>
          )}
          
          <div className="text-sm font-medium mb-1">
            {card.title}
          </div>
          
          <div className={`text-2xl font-bold ${card.color || ''}`}>
            {card.value}
            {card.unit && (
              <span className="text-sm font-normal ml-1">
                {card.unit}
              </span>
            )}
          </div>
          
          {card.description && (
            <div className="text-sm mt-2 opacity-80">
              {card.description}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSection = (section: ResultSection, sectionIndex: number) => {
    const layoutClasses = {
      grid: `grid gap-4 ${section.columns ? `grid-cols-${section.columns}` : 'grid-cols-1 sm:grid-cols-2'}`,
      list: 'space-y-4',
      inline: 'flex flex-wrap gap-4'
    };

    return (
      <div key={sectionIndex} className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {section.title}
        </h3>
        
        <div className={layoutClasses[section.layout || 'grid']}>
          {section.cards.map(renderCard)}
        </div>
      </div>
    );
  };

  const renderRecommendations = () => {
    if (!config.recommendations || config.recommendations.length === 0) {
      return null;
    }

    const typeClasses = {
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800'
    };

    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          建議事項
        </h3>
        
        <div className="space-y-3">
          {config.recommendations.map((rec, index) => (
            <div
              key={index}
              className={`p-3 border rounded-lg ${typeClasses[rec.type]}`}
            >
              <div className="text-sm">
                {rec.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderNotes = () => {
    if (!config.notes || config.notes.length === 0) {
      return null;
    }

    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          注意事項
        </h3>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <ul className="text-sm text-gray-600 space-y-1">
            {config.notes.map((note, index) => (
              <li key={index} className="flex items-start">
                <span className="text-gray-400 mr-2">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className={`calculator-results ${className}`} data-theme={theme}>
      <div className="bg-gray-50 rounded-lg p-6">
        {config.sections.map(renderSection)}
        {renderRecommendations()}
        {renderNotes()}
      </div>
    </div>
  );
}