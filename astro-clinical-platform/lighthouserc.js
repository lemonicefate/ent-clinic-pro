module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:4321',
        'http://localhost:4321/tools',
        'http://localhost:4321/education',
        'http://localhost:4321/zh-TW',
        'http://localhost:4321/en',
      ],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        // 醫療平台效能要求（更嚴格）
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        
        // Core Web Vitals（醫療應用要求）
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        
        // 無障礙要求（醫療平台必須）
        'color-contrast': 'error',
        'heading-order': 'error',
        'html-has-lang': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'button-name': 'error',
        'aria-allowed-attr': 'error',
        'aria-required-attr': 'error',
        'aria-valid-attr-value': 'error',
        'aria-valid-attr': 'error',
        'duplicate-id-aria': 'error',
        'duplicate-id-active': 'error',
        
        // SEO 要求
        'meta-description': 'error',
        'document-title': 'error',
        'html-lang-valid': 'error',
        'canonical': 'error',
        
        // 安全性要求
        'is-on-https': 'error',
        'external-anchors-use-rel-noopener': 'error',
        
        // 醫療內容特定要求
        'structured-data': 'warn',
        'viewport': 'error',
        'font-display': 'warn',
      },
      preset: 'lighthouse:no-pwa',
    },
    upload: {
      target: 'temporary-public-storage',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
    },
    server: {
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lhci.db',
      },
    },
  },
};