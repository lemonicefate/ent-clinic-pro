// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://ent-clinic-pro.pages.dev', // Cloudflare Pages URL
  output: 'static', // Static site generation for Cloudflare Pages
  
  // 多語言配置
  i18n: {
    defaultLocale: 'zh-TW',
    locales: ['zh-TW', 'en', 'ja'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: true
    },
    fallback: {
      en: 'zh-TW',
      ja: 'zh-TW'
    }
  },
  
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: ['vitest']
    },
    // 完全排除測試相關文件
    define: {
      'import.meta.vitest': 'undefined'
    },
    ssr: {
      noExternal: []
    }
  },

  integrations: [
    react({
      // Only hydrate interactive islands
      experimentalReactChildren: true
    })
  ],

  // Optimize build for medical content
  build: {
    inlineStylesheets: 'auto'
  },

  // 排除測試文件和相關文件
  exclude: [
    '**/*.test.{ts,tsx,js,jsx}',
    '**/*.spec.{ts,tsx,js,jsx}',
    '**/test-setup.ts',
    '**/__tests__/**',
    '**/vitest.config.ts',
    '**/vitest.unit.config.ts'
  ],

  // SEO and performance optimizations
  compressHTML: true,
  
  // Security headers
  security: {
    checkOrigin: true
  }
});