/**
 * 關鍵 CSS 內聯工具
 * 提取和內聯首屏關鍵 CSS 以優化載入效能
 */

// 關鍵 CSS 配置
export interface CriticalCSSConfig {
  width: number;
  height: number;
  inline: boolean;
  extract: boolean;
  minify: boolean;
  ignore?: string[];
  include?: string[];
}

// CSS 規則類型
interface CSSRule {
  selector: string;
  declarations: Record<string, string>;
  media?: string;
  important?: boolean;
}

/**
 * 關鍵 CSS 管理器
 */
export class CriticalCSSManager {
  private config: CriticalCSSConfig;
  private criticalCSS: string = '';
  private nonCriticalCSS: string = '';

  constructor(config: Partial<CriticalCSSConfig> = {}) {
    this.config = {
      width: 1200,
      height: 800,
      inline: true,
      extract: true,
      minify: true,
      ignore: [
        '@font-face',
        'print',
        'prefers-reduced-motion',
        'hover',
        'focus',
        'active'
      ],
      ...config
    };
  }

  /**
   * 生成醫療平台的關鍵 CSS
   */
  generateMedicalPlatformCriticalCSS(): string {
    const criticalStyles = `
      /* 重置和基礎樣式 */
      *, *::before, *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      html {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #1f2937;
        background-color: #ffffff;
      }

      body {
        min-height: 100vh;
        text-rendering: optimizeSpeed;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      /* 標頭樣式 */
      .header {
        position: sticky;
        top: 0;
        z-index: 50;
        background-color: #ffffff;
        border-bottom: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .header-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 64px;
      }

      .logo {
        display: flex;
        align-items: center;
        font-size: 1.25rem;
        font-weight: 700;
        color: #2563eb;
        text-decoration: none;
      }

      .logo-icon {
        width: 32px;
        height: 32px;
        margin-right: 0.5rem;
      }

      /* 導航樣式 */
      .nav {
        display: flex;
        align-items: center;
        gap: 2rem;
      }

      .nav-link {
        color: #4b5563;
        text-decoration: none;
        font-weight: 500;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        transition: color 0.2s ease, background-color 0.2s ease;
      }

      .nav-link:hover {
        color: #2563eb;
        background-color: #f3f4f6;
      }

      .nav-link.active {
        color: #2563eb;
        background-color: #dbeafe;
      }

      /* 主要內容區域 */
      .main {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem 1rem;
        min-height: calc(100vh - 64px);
      }

      /* 標題樣式 */
      h1, h2, h3, h4, h5, h6 {
        font-weight: 600;
        line-height: 1.25;
        margin-bottom: 1rem;
      }

      h1 {
        font-size: 2.25rem;
        color: #111827;
      }

      h2 {
        font-size: 1.875rem;
        color: #1f2937;
      }

      h3 {
        font-size: 1.5rem;
        color: #374151;
      }

      /* 段落和文字 */
      p {
        margin-bottom: 1rem;
        color: #4b5563;
      }

      /* 按鈕樣式 */
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        border-radius: 0.375rem;
        border: none;
        cursor: pointer;
        text-decoration: none;
        transition: all 0.2s ease;
      }

      .btn-primary {
        background-color: #2563eb;
        color: #ffffff;
      }

      .btn-primary:hover {
        background-color: #1d4ed8;
      }

      .btn-secondary {
        background-color: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;
      }

      .btn-secondary:hover {
        background-color: #e5e7eb;
      }

      /* 卡片樣式 */
      .card {
        background-color: #ffffff;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        padding: 1.5rem;
        margin-bottom: 1rem;
      }

      .card-header {
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
      }

      .card-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #111827;
        margin-bottom: 0.5rem;
      }

      /* 表單樣式 */
      .form-group {
        margin-bottom: 1rem;
      }

      .form-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.25rem;
      }

      .form-input {
        width: 100%;
        padding: 0.5rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }

      .form-input:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }

      /* 醫療內容特定樣式 */
      .medical-content {
        line-height: 1.7;
      }

      .medical-warning {
        background-color: #fef3c7;
        border: 1px solid #f59e0b;
        border-radius: 0.375rem;
        padding: 1rem;
        margin: 1rem 0;
      }

      .medical-warning-icon {
        color: #d97706;
        margin-right: 0.5rem;
      }

      .calculator-container {
        background-color: #f8fafc;
        border-radius: 0.5rem;
        padding: 1.5rem;
        margin: 1rem 0;
      }

      .result-display {
        background-color: #dbeafe;
        border: 1px solid #2563eb;
        border-radius: 0.375rem;
        padding: 1rem;
        margin-top: 1rem;
        text-align: center;
      }

      .result-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1d4ed8;
      }

      /* 響應式設計 */
      @media (max-width: 768px) {
        .header-container {
          padding: 0 0.5rem;
        }

        .nav {
          gap: 1rem;
        }

        .main {
          padding: 1rem 0.5rem;
        }

        h1 {
          font-size: 1.875rem;
        }

        h2 {
          font-size: 1.5rem;
        }

        .card {
          padding: 1rem;
        }
      }

      /* 載入狀態 */
      .loading {
        opacity: 0.6;
        pointer-events: none;
      }

      .loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid #e5e7eb;
        border-top-color: #2563eb;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* 可訪問性增強 */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* 跳過連結 */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #2563eb;
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 100;
      }

      .skip-link:focus {
        top: 6px;
      }

      /* 高對比度模式支援 */
      @media (prefers-contrast: high) {
        .card {
          border-width: 2px;
        }
        
        .btn {
          border-width: 2px;
        }
      }

      /* 減少動畫偏好 */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;

    return this.config.minify ? this.minifyCSS(criticalStyles) : criticalStyles;
  }

  /**
   * 生成非關鍵 CSS
   */
  generateNonCriticalCSS(): string {
    const nonCriticalStyles = `
      /* 動畫和過渡效果 */
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideIn {
        from { transform: translateY(-10px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .fade-in {
        animation: fadeIn 0.3s ease-in-out;
      }

      .slide-in {
        animation: slideIn 0.3s ease-out;
      }

      /* 懸停效果 */
      .card:hover {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transform: translateY(-1px);
      }

      .btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      /* 焦點樣式 */
      .btn:focus {
        outline: 2px solid #2563eb;
        outline-offset: 2px;
      }

      .nav-link:focus {
        outline: 2px solid #2563eb;
        outline-offset: 2px;
      }

      /* 打印樣式 */
      @media print {
        .header, .nav, .btn {
          display: none !important;
        }
        
        .main {
          max-width: none;
          padding: 0;
        }
        
        .card {
          border: 1px solid #000;
          box-shadow: none;
          page-break-inside: avoid;
        }
      }

      /* 深色模式支援 */
      @media (prefers-color-scheme: dark) {
        html {
          background-color: #111827;
          color: #f9fafb;
        }
        
        .header {
          background-color: #1f2937;
          border-bottom-color: #374151;
        }
        
        .card {
          background-color: #1f2937;
          border-color: #374151;
        }
        
        .btn-secondary {
          background-color: #374151;
          color: #f9fafb;
          border-color: #4b5563;
        }
      }

      /* 大螢幕優化 */
      @media (min-width: 1440px) {
        .main {
          max-width: 1400px;
        }
        
        .header-container {
          max-width: 1400px;
        }
      }

      /* 小螢幕優化 */
      @media (max-width: 480px) {
        .nav {
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .card {
          margin: 0 -0.5rem 1rem;
          border-radius: 0;
        }
      }
    `;

    return this.config.minify ? this.minifyCSS(nonCriticalStyles) : nonCriticalStyles;
  }

  /**
   * CSS 壓縮
   */
  private minifyCSS(css: string): string {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // 移除註釋
      .replace(/\s+/g, ' ') // 壓縮空白
      .replace(/;\s*}/g, '}') // 移除最後一個分號
      .replace(/\s*{\s*/g, '{') // 壓縮大括號
      .replace(/\s*}\s*/g, '}') // 壓縮大括號
      .replace(/\s*:\s*/g, ':') // 壓縮冒號
      .replace(/\s*;\s*/g, ';') // 壓縮分號
      .replace(/\s*,\s*/g, ',') // 壓縮逗號
      .trim();
  }

  /**
   * 生成內聯 CSS 標籤
   */
  generateInlineStyleTag(): string {
    const criticalCSS = this.generateMedicalPlatformCriticalCSS();
    return `<style>${criticalCSS}</style>`;
  }

  /**
   * 生成非關鍵 CSS 載入標籤
   */
  generateNonCriticalStyleTag(href: string): string {
    return `
      <link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'">
      <noscript><link rel="stylesheet" href="${href}"></noscript>
    `;
  }

  /**
   * 生成字體預載入標籤
   */
  generateFontPreloadTags(): string[] {
    const fonts = [
      {
        href: '/fonts/inter-var.woff2',
        type: 'font/woff2',
        crossorigin: 'anonymous'
      }
    ];

    return fonts.map(font => 
      `<link rel="preload" href="${font.href}" as="font" type="${font.type}" crossorigin="${font.crossorigin}">`
    );
  }

  /**
   * 檢查 CSS 是否為關鍵 CSS
   */
  isCriticalCSS(selector: string): boolean {
    const criticalSelectors = [
      'html', 'body', 'head',
      '.header', '.nav', '.main',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'a', 'button',
      '.btn', '.card', '.form-input',
      '.medical-content', '.calculator-container'
    ];

    return criticalSelectors.some(critical => 
      selector.includes(critical) || selector.startsWith(critical)
    );
  }

  /**
   * 生成 CSS 載入策略
   */
  generateLoadingStrategy(): {
    critical: string;
    nonCritical: string;
    fonts: string[];
  } {
    return {
      critical: this.generateInlineStyleTag(),
      nonCritical: this.generateNonCriticalStyleTag('/styles/non-critical.css'),
      fonts: this.generateFontPreloadTags()
    };
  }
}

// 預設關鍵 CSS 管理器
export const criticalCSSManager = new CriticalCSSManager();

// 便利函數
export const generateCriticalCSS = () => criticalCSSManager.generateMedicalPlatformCriticalCSS();
export const generateNonCriticalCSS = () => criticalCSSManager.generateNonCriticalCSS();
export const generateInlineStyleTag = () => criticalCSSManager.generateInlineStyleTag();
export const generateLoadingStrategy = () => criticalCSSManager.generateLoadingStrategy();