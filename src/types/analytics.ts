/**
 * 分析系統類型定義
 */

export interface AnalyticsEvent {
  name: string;
  timestamp?: number;
  properties?: Record<string, any>;
}

export interface MedicalContentEvent {
  contentType: 'calculator' | 'education' | 'flowchart';
  contentId: string;
  specialty?: string;
  language?: string;
  properties?: Record<string, any>;
}

export interface CalculatorEvent {
  calculatorId: string;
  inputFields: string[];
  resultType?: string;
  calculationTime?: number;
  specialty?: string;
  language?: string;
  properties?: Record<string, any>;
}

export interface UserJourneyEvent {
  name: string;
  page: string;
  action: string;
  source?: string;
  sessionId?: string;
  properties?: Record<string, any>;
}

export interface MedicalAnalytics {
  trackEvent(event: AnalyticsEvent): void;
  trackMedicalContent(event: MedicalContentEvent): void;
  trackCalculatorUsage(event: CalculatorEvent): void;
  trackUserJourney(event: UserJourneyEvent): void;
  trackPageView(customProps?: Record<string, any>): void;
  trackSearch(query: string, results: number, category?: string): void;
  optOut(): void;
  optIn(): void;
  isOptedOut(): boolean;
  clearLocalData(): void;
}