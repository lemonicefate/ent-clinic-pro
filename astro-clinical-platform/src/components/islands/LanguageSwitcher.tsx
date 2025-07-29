/**
 * 語言切換器島嶼組件
 * 提供多語言切換功能和語言偏好持久化
 */

import { useState, useEffect, useRef } from 'react';
import type { SupportedLocale } from '../../env.d';
import { 
  localeNames, 
  supportedLocales, 
  getLocalizedUrl, 
  LanguagePreference,
  t 
} from '../../utils/i18n';

interface Props {
  currentLocale: SupportedLocale;
  mobile?: boolean;
}

interface Language {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = supportedLocales.map(locale => ({
  code: locale,
  name: localeNames[locale].english,
  nativeName: localeNames[locale].native,
  flag: localeNames[locale].flag
}));

export default function LanguageSwitcher({ currentLocale, mobile = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    languages.find(lang => lang.code === currentLocale) || languages[0]
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 處理語言切換
  const handleLanguageChange = (language: Language) => {
    // 儲存語言偏好
    LanguagePreference.set(language.code);
    
    // 獲取當前路徑並生成新的本地化 URL
    const currentPath = window.location.pathname;
    const newPath = getLocalizedUrl(currentPath, language.code);
    
    // 保留查詢參數和錨點
    const search = window.location.search;
    const hash = window.location.hash;
    
    // 導航到新的 URL
    window.location.href = newPath + search + hash;
  };

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ESC 鍵關閉下拉選單
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, []);

  // 行動版簡化顯示
  if (mobile) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-medical-neutral-600 hover:text-medical-primary-600 hover:bg-medical-neutral-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-medical-primary-500"
          aria-label={t('a11y.languageSelector', currentLocale)}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span className="text-lg">{selectedLanguage.flag}</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-medical-neutral-200 z-50">
            <div className="py-2">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => {
                    handleLanguageChange(language);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full text-left px-4 py-2 text-sm transition-colors flex items-center space-x-3
                    ${language.code === currentLocale
                      ? 'bg-medical-primary-50 text-medical-primary-700'
                      : 'text-medical-neutral-600 hover:bg-medical-neutral-50 hover:text-medical-neutral-800'
                    }
                    focus:outline-none focus:bg-medical-primary-50 focus:text-medical-primary-700
                  `}
                >
                  <span className="text-lg">{language.flag}</span>
                  <span>{language.nativeName}</span>
                  {language.code === currentLocale && (
                    <svg className="h-4 w-4 ml-auto text-medical-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 桌面版完整顯示
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-medical-neutral-600 hover:text-medical-primary-600 hover:bg-medical-primary-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-medical-primary-500 focus:ring-offset-2"
        aria-label={`${t('a11y.languageSelector', currentLocale)}: ${selectedLanguage.nativeName}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-lg">{selectedLanguage.flag}</span>
        <span className="hidden xl:inline">{selectedLanguage.nativeName}</span>
        <svg 
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-medical-neutral-200 z-50">
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-semibold text-medical-neutral-500 uppercase tracking-wide border-b border-medical-neutral-100">
              {currentLocale === 'zh-TW' ? '選擇語言' : currentLocale === 'en' ? 'Select Language' : '言語を選択'}
            </div>
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => {
                  handleLanguageChange(language);
                  setIsOpen(false);
                }}
                className={`
                  w-full text-left px-4 py-3 text-sm transition-colors flex items-center space-x-3
                  ${language.code === currentLocale
                    ? 'bg-medical-primary-50 text-medical-primary-700 border-r-2 border-medical-primary-600'
                    : 'text-medical-neutral-600 hover:bg-medical-neutral-50 hover:text-medical-neutral-800'
                  }
                  focus:outline-none focus:bg-medical-primary-50 focus:text-medical-primary-700
                `}
                role="menuitem"
              >
                <span className="text-lg">{language.flag}</span>
                <div className="flex-1">
                  <div className="font-medium">{language.nativeName}</div>
                  <div className="text-xs text-medical-neutral-500">{language.name}</div>
                </div>
                {language.code === currentLocale && (
                  <svg className="h-4 w-4 text-medical-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          
          {/* 語言偏好說明 */}
          <div className="px-4 py-2 text-xs text-medical-neutral-500 border-t border-medical-neutral-100">
            {currentLocale === 'zh-TW' ? '語言偏好將被記住' : 
             currentLocale === 'en' ? 'Language preference will be remembered' : 
             '言語設定は記憶されます'}
          </div>
        </div>
      )}
    </div>
  );
}

// 初始化語言偏好（在組件載入時執行）
if (typeof window !== 'undefined') {
  // 使用 i18n 工具的自動重定向功能
  LanguagePreference.autoRedirect();
}