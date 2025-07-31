// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://ent-clinic-pro.pages.dev', // Cloudflare Pages URL
  output: 'static', // Static site generation
  
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
    tailwind(),
    react({
      // Only hydrate interactive islands
      experimentalReactChildren: true
    })
  ],

  // Optimize build for medical content
  build: {
    inlineStylesheets: 'auto'
  },



  // SEO and performance optimizations
  compressHTML: true,
  
  // Security headers
  security: {
    checkOrigin: true
  }
});