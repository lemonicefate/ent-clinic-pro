/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

/**
 * Astro Clinical Platform - 類型定義
 * 定義平台使用的全局類型和介面
 */

// 支援的語言類型
export type SupportedLocale = 'zh-TW' | 'en' | 'ja';

// 醫療專科類型
export type MedicalCategory = 
  | 'cardiology'
  | 'neurology' 
  | 'orthopedics'
  | 'general'
  | 'emergency'
  | 'pediatrics'
  | 'surgery'
  | 'endocrinology'
  | 'nephrology'
  | 'pulmonology';

// 風險等級類型
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

// 難度等級類型
export type DifficultyLevel = 'basic' | 'intermediate' | 'advanced';

// 證據等級類型
export type EvidenceLevel = 'A' | 'B' | 'C' | 'D';

// 內容類型
export type ContentType = 'calculator' | 'education' | 'flowchart' | 'general';

// 多語言文字介面
export interface MultiLangText {
  'zh-TW': string;
  'en': string;
  'ja': string;
}

// 計算機欄位類型
export type CalculatorFieldType = 'select' | 'number' | 'checkbox' | 'radio' | 'range';

// 計算機欄位選項
export interface CalculatorFieldOption {
  value: string | number;
  label: MultiLangText;
  description?: MultiLangText;
}

// 計算機欄位驗證規則
export interface CalculatorFieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  errorMessage?: MultiLangText;
}

// 計算機欄位條件邏輯
export interface CalculatorFieldConditional {
  field: string;
  value: string | number;
  operator?: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte';
}

// 計算機欄位定義
export interface CalculatorField {
  id: string;
  type: CalculatorFieldType;
  label: MultiLangText;
  placeholder?: MultiLangText;
  helpText?: MultiLangText;
  unit?: string;
  options?: CalculatorFieldOption[];
  validation?: CalculatorFieldValidation;
  conditional?: CalculatorFieldConditional;
}

// 計算機結果解釋
export interface CalculatorInterpretation {
  range: [number, number];
  risk: RiskLevel;
  recommendation: MultiLangText;
  color?: string;
  icon?: string;
  actionItems?: MultiLangText[];
}

// 參考文獻
export interface Reference {
  title: string;
  authors?: string[];
  journal?: string;
  year?: number;
  volume?: string;
  pages?: string;
  url?: string;
  doi?: string;
  pmid?: string;
}

// 媒體資源
export interface MediaAsset {
  type: 'image' | 'video' | 'audio';
  src: string;
  alt?: MultiLangText;
  caption?: MultiLangText;
  thumbnail?: string;
  credit?: string;
}

// 特色圖片
export interface FeaturedImage {
  src: string;
  alt: MultiLangText;
  caption?: MultiLangText;
  credit?: string;
}

// 下載資源
export interface DownloadableResource {
  title: MultiLangText;
  description?: MultiLangText;
  url: string;
  type: 'pdf' | 'doc' | 'image' | 'video';
  size?: string;
}

// 流程圖無障礙支援
export interface FlowchartAccessibility {
  textAlternative: MultiLangText;
  ariaLabel: MultiLangText;
  keyboardNavigation?: boolean;
  screenReaderInstructions?: MultiLangText;
}

// 版本變更記錄
export interface ChangeLogEntry {
  version: string;
  date: Date;
  changes: string[];
}

// SEO 配置
export interface SEOConfig {
  title?: MultiLangText;
  description?: MultiLangText;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  noIndex?: boolean;
}

// 分析事件類型
export type AnalyticsEventType = 
  | 'page_view'
  | 'search_performed'
  | 'search_result_clicked'
  | 'calculator_used'
  | 'calculator_result_viewed'
  | 'education_article_viewed'
  | 'flowchart_viewed'
  | 'download_initiated'
  | 'external_link_clicked';

// 分析事件資料
export interface AnalyticsEventData {
  event: AnalyticsEventType;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

// 搜尋結果類型
export interface SearchResult {
  title: string;
  url: string;
  excerpt: string;
  type: ContentType;
  category?: string;
  specialty?: string;
  score?: number;
}

// 搜尋過濾器
export interface SearchFilters {
  type?: ContentType[];
  category?: string[];
  specialty?: string[];
  difficulty?: DifficultyLevel[];
  language?: SupportedLocale;
}

// 導覽項目
export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
  description?: string;
  children?: NavigationItem[];
}

// 麵包屑項目
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// 頁面 Props 基礎介面
export interface BasePageProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  noIndex?: boolean;
  locale?: SupportedLocale;
  medicalContent?: boolean;
  pageType?: 'home' | 'calculator' | 'education' | 'search' | 'category';
  contentId?: string;
  specialty?: string;
  breadcrumbs?: BreadcrumbItem[];
}

// 計算機頁面 Props
export interface CalculatorPageProps extends BasePageProps {
  calculator: any; // 從 content collections 來的類型
}

// 教育內容頁面 Props
export interface EducationPageProps extends BasePageProps {
  article: any; // 從 content collections 來的類型
}

// 流程圖頁面 Props
export interface FlowchartPageProps extends BasePageProps {
  flowchart: any; // 從 content collections 來的類型
}

// 環境變數類型擴展
declare namespace App {
  interface Locals {
    locale: SupportedLocale;
    translations: Record<string, string>;
  }
}

// 全局 Window 物件擴展
declare global {
  interface Window {
    // 分析追蹤
    plausible?: (event: string, options?: { props?: Record<string, any> }) => void;
    gtag?: (...args: any[]) => void;
    
    // 語言偏好
    preferredLanguage?: SupportedLocale;
    
    // 醫療免責聲明
    medicalDisclaimerAccepted?: boolean;
    
    // 搜尋功能
    pagefind?: {
      search: (query: string) => Promise<any>;
      init: () => Promise<void>;
    };
    
    // 主題切換
    toggleTheme?: () => void;
    currentTheme?: 'light' | 'dark' | 'auto';
  }
}

// 模組聲明
declare module '*.astro' {
  const Component: any;
  export default Component;
}

declare module '*.md' {
  const Component: any;
  export default Component;
}

declare module '*.mdx' {
  const Component: any;
  export default Component;
}

// Astro 內容集合類型擴展
declare module 'astro:content' {
  interface ContentEntryMap {
    'calculators': any;
    'education': any;
    'flowcharts': any;
    'medical-specialties': any;
  }
}

// 匯出所有類型供其他模組使用
export * from './content/config';