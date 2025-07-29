module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
  // CORS 設定，允許 Astro 應用存取
  cors: {
    enabled: true,
    origin: [
      'http://localhost:4321', // Astro 開發伺服器
      'http://localhost:3000', // 備用開發端口
      env('FRONTEND_URL', 'https://astro-clinical-platform.pages.dev'), // 生產環境
      env('PREVIEW_URL', 'https://preview.astro-clinical-platform.pages.dev'), // 預覽環境
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    keepHeaderOnError: true,
  },
  // 安全設定
  security: {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'connect-src': ["'self'", 'https:'],
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'media-src': ["'self'", 'data:', 'blob:', 'https:'],
        upgradeInsecureRequests: null,
      },
    },
  },
});