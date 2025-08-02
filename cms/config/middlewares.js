module.exports = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'dl.airtable.com',
            'res.cloudinary.com',
            '*.amazonaws.com',
            '*.cloudflare.com',
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'dl.airtable.com',
            'res.cloudinary.com',
            '*.amazonaws.com',
            '*.cloudflare.com',
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: '*',
      origin: [
        'http://localhost:4321',
        'http://localhost:3000',
        process.env.FRONTEND_URL || 'https://astro-clinical-platform.pages.dev',
        process.env.PREVIEW_URL || 'https://preview.astro-clinical-platform.pages.dev',
      ],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  // 自訂中介軟體：醫療內容驗證
  {
    name: 'global::medical-content-validator',
    config: {
      enabled: true,
    },
  },
  // 自訂中介軟體：API 速率限制
  {
    name: 'global::rate-limiter',
    config: {
      enabled: true,
      max: 100, // 每分鐘最多 100 次請求
      duration: 60000, // 1 分鐘
    },
  },
];