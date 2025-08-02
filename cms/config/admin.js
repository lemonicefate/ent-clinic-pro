module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
  // 自訂管理面板設定
  url: env('ADMIN_URL', '/admin'),
  autoOpen: false,
  watchIgnoreFiles: [
    './src/**/*.ts',
    './dist/**/*',
  ],
  // 醫療平台專用設定
  rateLimit: {
    enabled: true,
    max: 100, // 每分鐘最多 100 次請求
    duration: 60000, // 1 分鐘
  },
});