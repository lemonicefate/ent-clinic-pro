/**
 * 語言初始化腳本
 * 在頁面載入時執行語言偏好檢查和自動重定向
 */

import { initializeLanguage } from '../utils/i18n';

// 在 DOM 載入完成後初始化語言設定
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLanguage);
  } else {
    initializeLanguage();
  }
}