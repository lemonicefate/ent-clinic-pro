/**
 * 國際化工具函數
 * 用於處理多語言內容和路由
 */

import type { SupportedLocale } from '../env.d';

// 支援的語言配置
export const supportedLocales: SupportedLocale[] = ['zh-TW', 'en', 'ja'];
export const defaultLocale: SupportedLocale = 'zh-TW';

// 語言顯示名稱
export const localeNames: Record<SupportedLocale, { native: string; english: string; flag: string }> = {
  'zh-TW': { native: '繁體中文', english: 'Traditional Chinese', flag: '🇹🇼' },
  'en': { native: 'English', english: 'English', flag: '🇺🇸' },
  'ja': { native: '日本語', english: 'Japanese', flag: '🇯🇵' }
};

/**
 * 檢查是否為支援的語言
 */
export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return supportedLocales.includes(locale as SupportedLocale);
}

/**
 * 從 URL 路徑中提取語言代碼
 */
export function getLocaleFromPath(pathname: string): SupportedLocale {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (firstSegment && isSupportedLocale(firstSegment)) {
    return firstSegment;
  }
  
  return defaultLocale;
}

/**
 * 移除路徑中的語言前綴
 */
export function removeLocaleFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (firstSegment && isSupportedLocale(firstSegment)) {
    return '/' + segments.slice(1).join('/');
  }
  
  return pathname;
}

/**
 * 為路徑添加語言前綴
 */
export function addLocaleToPath(pathname: string, locale: SupportedLocale): string {
  const cleanPath = removeLocaleFromPath(pathname);
  
  if (locale === defaultLocale) {
    return cleanPath || '/';
  }
  
  return `/${locale}${cleanPath}`;
}

/**
 * 獲取本地化的文字內容
 */
export function getLocalizedText(
  content: Record<string, string> | string | undefined,
  locale: SupportedLocale,
  fallback = ''
): string {
  if (!content) return fallback;
  
  if (typeof content === 'string') return content;
  
  return content[locale] || content[defaultLocale] || Object.values(content)[0] || fallback;
}

/**
 * 翻譯鍵值對照表
 */
export const translations: Record<SupportedLocale, Record<string, string>> = {
  'zh-TW': {
    // 導航
    'nav.home': '首頁',
    'nav.tools': '醫療工具',
    'nav.education': '衛教資源',
    'nav.about': '關於我們',
    'nav.search': '搜尋',
    'nav.menu': '選單',
    
    // 搜尋
    'search.placeholder': '搜尋醫療工具和衛教內容...',
    'search.button': '搜尋',
    'search.results': '搜尋結果',
    'search.noResults': '找不到相關內容',
    'search.loading': '搜尋中...',
    
    // 計算機
    'calculator.title': '醫療計算機',
    'calculator.calculate': '計算',
    'calculator.reset': '重設',
    'calculator.result': '計算結果',
    'calculator.interpretation': '結果解釋',
    'calculator.references': '參考文獻',
    'calculator.guidelines': '臨床指引',
    
    // 教育內容
    'education.title': '衛教資源',
    'education.readingTime': '閱讀時間',
    'education.minutes': '分鐘',
    'education.lastUpdated': '最後更新',
    'education.reviewedBy': '審核者',
    'education.relatedContent': '相關內容',
    
    // 流程圖
    'flowchart.title': '診療流程',
    'flowchart.complexity': '複雜度',
    'flowchart.category': '分類',
    'flowchart.textAlternative': '文字說明',
    
    // 一般
    'common.loading': '載入中...',
    'common.error': '發生錯誤',
    'common.retry': '重試',
    'common.close': '關閉',
    'common.back': '返回',
    'common.next': '下一步',
    'common.previous': '上一步',
    'common.save': '儲存',
    'common.cancel': '取消',
    'common.confirm': '確認',
    
    // 風險等級
    'risk.low': '低風險',
    'risk.moderate': '中等風險',
    'risk.high': '高風險',
    'risk.critical': '極高風險',
    
    // 難度等級
    'difficulty.basic': '基礎',
    'difficulty.intermediate': '中級',
    'difficulty.advanced': '進階',
    
    // 醫療專科
    'specialty.cardiology': '心臟科',
    'specialty.neurology': '神經科',
    'specialty.orthopedics': '骨科',
    'specialty.emergency': '急診醫學',
    'specialty.pediatrics': '小兒科',
    'specialty.general': '一般醫學',
    
    // 頁腳
    'footer.copyright': '版權所有',
    'footer.disclaimer': '醫療免責聲明',
    'footer.privacy': '隱私政策',
    'footer.terms': '使用條款',
    'footer.contact': '聯絡我們',
    
    // 無障礙
    'a11y.skipToContent': '跳至主要內容',
    'a11y.openMenu': '開啟選單',
    'a11y.closeMenu': '關閉選單',
    'a11y.languageSelector': '語言選擇器',
    'a11y.searchButton': '搜尋按鈕',
    
    // 錯誤頁面
    'error.404.title': '找不到頁面',
    'error.404.message': '您要找的頁面不存在',
    'error.500.title': '伺服器錯誤',
    'error.500.message': '伺服器發生錯誤，請稍後再試'
  },
  
  'en': {
    // Navigation
    'nav.home': 'Home',
    'nav.tools': 'Medical Tools',
    'nav.education': 'Education',
    'nav.about': 'About',
    'nav.search': 'Search',
    'nav.menu': 'Menu',
    
    // Search
    'search.placeholder': 'Search medical tools and educational content...',
    'search.button': 'Search',
    'search.results': 'Search Results',
    'search.noResults': 'No results found',
    'search.loading': 'Searching...',
    
    // Calculator
    'calculator.title': 'Medical Calculators',
    'calculator.calculate': 'Calculate',
    'calculator.reset': 'Reset',
    'calculator.result': 'Result',
    'calculator.interpretation': 'Interpretation',
    'calculator.references': 'References',
    'calculator.guidelines': 'Clinical Guidelines',
    
    // Education
    'education.title': 'Educational Resources',
    'education.readingTime': 'Reading Time',
    'education.minutes': 'minutes',
    'education.lastUpdated': 'Last Updated',
    'education.reviewedBy': 'Reviewed By',
    'education.relatedContent': 'Related Content',
    
    // Flowchart
    'flowchart.title': 'Clinical Flowcharts',
    'flowchart.complexity': 'Complexity',
    'flowchart.category': 'Category',
    'flowchart.textAlternative': 'Text Alternative',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error occurred',
    'common.retry': 'Retry',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    
    // Risk levels
    'risk.low': 'Low Risk',
    'risk.moderate': 'Moderate Risk',
    'risk.high': 'High Risk',
    'risk.critical': 'Critical Risk',
    
    // Difficulty levels
    'difficulty.basic': 'Basic',
    'difficulty.intermediate': 'Intermediate',
    'difficulty.advanced': 'Advanced',
    
    // Medical specialties
    'specialty.cardiology': 'Cardiology',
    'specialty.neurology': 'Neurology',
    'specialty.orthopedics': 'Orthopedics',
    'specialty.emergency': 'Emergency Medicine',
    'specialty.pediatrics': 'Pediatrics',
    'specialty.general': 'General Medicine',
    
    // Footer
    'footer.copyright': 'All Rights Reserved',
    'footer.disclaimer': 'Medical Disclaimer',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'footer.contact': 'Contact Us',
    
    // Accessibility
    'a11y.skipToContent': 'Skip to main content',
    'a11y.openMenu': 'Open menu',
    'a11y.closeMenu': 'Close menu',
    'a11y.languageSelector': 'Language selector',
    'a11y.searchButton': 'Search button',
    
    // Error pages
    'error.404.title': 'Page Not Found',
    'error.404.message': 'The page you are looking for does not exist',
    'error.500.title': 'Server Error',
    'error.500.message': 'A server error occurred, please try again later'
  },
  
  'ja': {
    // ナビゲーション
    'nav.home': 'ホーム',
    'nav.tools': '医療ツール',
    'nav.education': '教育リソース',
    'nav.about': '私たちについて',
    'nav.search': '検索',
    'nav.menu': 'メニュー',
    
    // 検索
    'search.placeholder': '医療ツールと教育コンテンツを検索...',
    'search.button': '検索',
    'search.results': '検索結果',
    'search.noResults': '結果が見つかりません',
    'search.loading': '検索中...',
    
    // 計算機
    'calculator.title': '医療計算機',
    'calculator.calculate': '計算',
    'calculator.reset': 'リセット',
    'calculator.result': '結果',
    'calculator.interpretation': '解釈',
    'calculator.references': '参考文献',
    'calculator.guidelines': '臨床ガイドライン',
    
    // 教育
    'education.title': '教育リソース',
    'education.readingTime': '読書時間',
    'education.minutes': '分',
    'education.lastUpdated': '最終更新',
    'education.reviewedBy': 'レビュー者',
    'education.relatedContent': '関連コンテンツ',
    
    // フローチャート
    'flowchart.title': '臨床フローチャート',
    'flowchart.complexity': '複雑さ',
    'flowchart.category': 'カテゴリ',
    'flowchart.textAlternative': 'テキスト代替',
    
    // 共通
    'common.loading': '読み込み中...',
    'common.error': 'エラーが発生しました',
    'common.retry': '再試行',
    'common.close': '閉じる',
    'common.back': '戻る',
    'common.next': '次へ',
    'common.previous': '前へ',
    'common.save': '保存',
    'common.cancel': 'キャンセル',
    'common.confirm': '確認',
    
    // リスクレベル
    'risk.low': '低リスク',
    'risk.moderate': '中等度リスク',
    'risk.high': '高リスク',
    'risk.critical': '重篤リスク',
    
    // 難易度レベル
    'difficulty.basic': '基本',
    'difficulty.intermediate': '中級',
    'difficulty.advanced': '上級',
    
    // 医療専門科
    'specialty.cardiology': '循環器科',
    'specialty.neurology': '神経科',
    'specialty.orthopedics': '整形外科',
    'specialty.emergency': '救急医学',
    'specialty.pediatrics': '小児科',
    'specialty.general': '一般内科',
    
    // フッター
    'footer.copyright': '全著作権所有',
    'footer.disclaimer': '医療免責事項',
    'footer.privacy': 'プライバシーポリシー',
    'footer.terms': '利用規約',
    'footer.contact': 'お問い合わせ',
    
    // アクセシビリティ
    'a11y.skipToContent': 'メインコンテンツにスキップ',
    'a11y.openMenu': 'メニューを開く',
    'a11y.closeMenu': 'メニューを閉じる',
    'a11y.languageSelector': '言語セレクター',
    'a11y.searchButton': '検索ボタン',
    
    // エラーページ
    'error.404.title': 'ページが見つかりません',
    'error.404.message': 'お探しのページは存在しません',
    'error.500.title': 'サーバーエラー',
    'error.500.message': 'サーバーエラーが発生しました。後でもう一度お試しください'
  }
};

/**
 * 翻譯函數
 */
export function t(key: string, locale: SupportedLocale = defaultLocale): string {
  return translations[locale]?.[key] || translations[defaultLocale]?.[key] || key;
}

/**
 * 獲取當前語言的翻譯對象
 */
export function getTranslations(locale: SupportedLocale) {
  return translations[locale] || translations[defaultLocale];
}

/**
 * 格式化本地化日期
 */
export function formatLocalizedDate(
  date: Date | string,
  locale: SupportedLocale,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const localeMap = {
    'zh-TW': 'zh-TW',
    'en': 'en-US',
    'ja': 'ja-JP'
  };
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return dateObj.toLocaleDateString(localeMap[locale], { ...defaultOptions, ...options });
}

/**
 * 簡化的日期格式化函數
 */
export function formatDate(
  date: Date | string,
  locale: SupportedLocale = defaultLocale,
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '無效日期';
  }
  
  const localeMap = {
    'zh-TW': 'zh-TW',
    'en': 'en-US',
    'ja': 'ja-JP'
  };
  
  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    short: {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    },
    medium: {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    },
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  };
  
  return dateObj.toLocaleDateString(localeMap[locale], formatOptions[format]);
}

/**
 * 計算閱讀時間（基於字數）
 */
export function calculateReadingTime(content: string, wordsPerMinute: number = 200): number {
  // 移除 HTML 標籤和 Markdown 語法
  const cleanContent = content
    .replace(/<[^>]*>/g, '') // 移除 HTML 標籤
    .replace(/[#*`_~\[\]()]/g, '') // 移除 Markdown 語法
    .replace(/\s+/g, ' ') // 合併空白字符
    .trim();
  
  // 計算中文字符和英文單詞
  const chineseChars = (cleanContent.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = cleanContent
    .replace(/[\u4e00-\u9fff]/g, '') // 移除中文字符
    .split(/\s+/)
    .filter(word => word.length > 0).length;
  
  // 中文字符按每分鐘 300 字計算，英文單詞按每分鐘 200 字計算
  const totalWords = chineseChars * (300 / 200) + englishWords;
  const readingTime = Math.ceil(totalWords / wordsPerMinute);
  
  return Math.max(1, readingTime); // 至少 1 分鐘
}

/**
 * 獲取語言方向（LTR/RTL）
 */
export function getTextDirection(locale: SupportedLocale): 'ltr' | 'rtl' {
  // 目前支援的語言都是 LTR
  return 'ltr';
}

/**
 * 生成本地化的 URL
 */
export function getLocalizedUrl(path: string, locale: SupportedLocale): string {
  const cleanPath = removeLocaleFromPath(path);
  return addLocaleToPath(cleanPath, locale);
}

/**
 * 獲取替代語言的 URL
 */
export function getAlternateUrls(currentPath: string): Record<SupportedLocale, string> {
  const cleanPath = removeLocaleFromPath(currentPath);
  
  return supportedLocales.reduce((urls, locale) => {
    urls[locale] = addLocaleToPath(cleanPath, locale);
    return urls;
  }, {} as Record<SupportedLocale, string>);
}

/**
 * 語言偏好管理
 */
export class LanguagePreference {
  private static readonly STORAGE_KEY = 'preferred-language';
  private static readonly SESSION_KEY = 'language-redirect-done';

  /**
   * 獲取儲存的語言偏好
   */
  static get(): SupportedLocale | null {
    if (typeof window === 'undefined') return null;
    
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved && isSupportedLocale(saved) ? saved : null;
  }

  /**
   * 儲存語言偏好
   */
  static set(locale: SupportedLocale): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.STORAGE_KEY, locale);
  }

  /**
   * 清除語言偏好
   */
  static clear(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.removeItem(this.SESSION_KEY);
  }

  /**
   * 檢查是否已經進行過重定向
   */
  static hasRedirected(): boolean {
    if (typeof window === 'undefined') return false;
    
    return sessionStorage.getItem(this.SESSION_KEY) === 'true';
  }

  /**
   * 標記已進行重定向
   */
  static markRedirected(): void {
    if (typeof window === 'undefined') return;
    
    sessionStorage.setItem(this.SESSION_KEY, 'true');
  }

  /**
   * 自動重定向到偏好語言
   */
  static autoRedirect(): void {
    if (typeof window === 'undefined') return;
    if (this.hasRedirected()) return;

    const preferredLocale = this.get();
    if (!preferredLocale) return;

    const currentPath = window.location.pathname;
    const currentLocale = getLocaleFromPath(currentPath);
    
    if (currentLocale === preferredLocale) return;

    const newPath = getLocalizedUrl(currentPath, preferredLocale);
    if (newPath !== currentPath) {
      this.markRedirected();
      window.location.href = newPath + window.location.search + window.location.hash;
    }
  }
}

/**
 * 瀏覽器語言偵測
 */
export function detectBrowserLanguage(): SupportedLocale {
  if (typeof window === 'undefined') return defaultLocale;

  const browserLang = navigator.language || navigator.languages?.[0];
  if (!browserLang) return defaultLocale;

  // 精確匹配
  if (isSupportedLocale(browserLang)) {
    return browserLang;
  }

  // 語言代碼匹配（忽略地區）
  const langCode = browserLang.split('-')[0];
  const matchedLocale = supportedLocales.find(locale => 
    locale.split('-')[0] === langCode
  );

  return matchedLocale || defaultLocale;
}

/**
 * 初始化語言設定
 */
export function initializeLanguage(): void {
  if (typeof window === 'undefined') return;

  // 檢查是否有儲存的語言偏好
  const savedLanguage = LanguagePreference.get();
  
  if (savedLanguage) {
    // 使用儲存的語言偏好
    LanguagePreference.autoRedirect();
  } else {
    // 首次訪問，偵測瀏覽器語言
    const browserLanguage = detectBrowserLanguage();
    const currentLocale = getLocaleFromPath(window.location.pathname);
    
    // 如果瀏覽器語言與當前語言不同，且不是預設語言，則儲存偏好
    if (browserLanguage !== defaultLocale && browserLanguage !== currentLocale) {
      LanguagePreference.set(browserLanguage);
    }
  }
}
