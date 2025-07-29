/**
 * 客戶端輔助工具
 * 不依賴 astro:content 的純客戶端工具函數
 */

import type { SupportedLocale } from '../env.d.ts';

/**
 * 獲取本地化文字
 */
export function getLocalizedText(
  multiLangText: Record<string, string> | undefined,
  locale: SupportedLocale,
  fallbackLocale: SupportedLocale = 'zh-TW'
): string {
  if (!multiLangText) return '';
  
  return multiLangText[locale] || 
         multiLangText[fallbackLocale] || 
         Object.values(multiLangText)[0] || 
         '';
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string, locale: SupportedLocale = 'zh-TW'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return dateObj.toLocaleDateString(locale, options);
}

/**
 * 計算閱讀時間
 */
export function calculateReadingTime(text: string, locale: SupportedLocale = 'zh-TW'): string {
  const wordsPerMinute = locale === 'zh-TW' ? 200 : 250; // 中文閱讀速度較慢
  const words = text.length;
  const minutes = Math.ceil(words / wordsPerMinute);
  
  if (locale === 'zh-TW') {
    return `約 ${minutes} 分鐘閱讀`;
  } else {
    return `${minutes} min read`;
  }
}