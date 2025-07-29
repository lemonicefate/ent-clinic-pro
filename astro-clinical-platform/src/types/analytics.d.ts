/**
 * Analytics type definitions for medical platform
 */

export interface MedicalAnalytics {
  trackEvent(event: AnalyticsEvent): void;
  trackMedicalContent(event: MedicalContentEvent): void;
  trackCalculatorUsage(event: CalculatorEvent): void;
  trackSearch(query: string, results: number, category?: string): void;
  trackUserJourney(event: UserJourneyEvent): void;
  optOut(): void;
  optIn(): void;
  isOptedOut(): boolean;
  clearLocalData(): void;
}

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
  timestamp?: number;
}

export interface MedicalContentEvent extends AnalyticsEvent {
  contentType: 'calculator' | 'education' | 'flowchart';
  contentId: string;
  specialty?: string;
  language?: string;
}

export interface CalculatorEvent extends MedicalContentEvent {
  calculatorId: string;
  inputFields: string[];
  resultType?: 'low' | 'moderate' | 'high';
  calculationTime?: number;
}

export interface UserJourneyEvent extends AnalyticsEvent {
  page: string;
  action: 'page_view' | 'search' | 'navigation' | 'interaction';
  source?: string;
  sessionId?: string;
}

declare global {
  interface Window {
    medicalAnalytics?: MedicalAnalytics;
    plausible?: (eventName: string, options?: { props?: Record<string, any> }) => void;
  }
}

export {};