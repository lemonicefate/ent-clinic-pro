/**
 * Client-safe Content Helpers
 * 
 * This file provides client-safe versions of content helper functions
 * that don't use astro:content imports.
 */

import type { SupportedLocale } from '../env.d.ts';

/**
 * Get localized text (client-safe version)
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
 * Generate content summary (client-safe version)
 */
export function generateContentSummary(
  content: string,
  maxLength = 150,
  locale: SupportedLocale = 'zh-TW'
): string {
  if (!content) return '';
  
  // Remove Markdown syntax
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // Headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1') // Italic
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
    .replace(/```[\s\S]*?```/g, '') // Code blocks
    .replace(/`(.*?)`/g, '$1') // Inline code
    .replace(/\n+/g, ' ') // Line breaks
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Truncate based on language
  if (locale === 'zh-TW' || locale === 'ja') {
    // Chinese and Japanese can be truncated directly
    return plainText.substring(0, maxLength - 3) + '...';
  } else {
    // English truncate by words
    const words = plainText.split(' ');
    let summary = '';
    
    for (const word of words) {
      if ((summary + word).length > maxLength - 3) {
        break;
      }
      summary += (summary ? ' ' : '') + word;
    }
    
    return summary + '...';
  }
}

/**
 * Calculate reading time (client-safe version)
 */
export function calculateReadingTime(
  content: string,
  locale: SupportedLocale = 'zh-TW'
): number {
  if (!content) return 0;

  // Remove Markdown syntax
  const plainText = content
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\n+/g, ' ')
    .trim();

  // Calculate reading speed based on language
  let wordsPerMinute: number;
  let wordCount: number;

  if (locale === 'zh-TW' || locale === 'ja') {
    // Chinese and Japanese: ~300-400 characters per minute
    wordsPerMinute = 350;
    wordCount = plainText.length;
  } else {
    // English: ~200-250 words per minute
    wordsPerMinute = 225;
    wordCount = plainText.split(/\s+/).length;
  }

  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, readingTime); // At least 1 minute
}

/**
 * Format date (client-safe version)
 */
export function formatDate(
  date: Date | string,
  locale: SupportedLocale = 'zh-TW',
  options: Intl.DateTimeFormatOptions = {}
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  const formatOptions = { ...defaultOptions, ...options };
  
  // Language mapping
  const localeMap = {
    'zh-TW': 'zh-TW',
    'en': 'en-US',
    'ja': 'ja-JP'
  };

  return dateObj.toLocaleDateString(localeMap[locale], formatOptions);
}

/**
 * Generate SEO-friendly URL slug (client-safe version)
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Merge multiple hyphens
    .trim()
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
}