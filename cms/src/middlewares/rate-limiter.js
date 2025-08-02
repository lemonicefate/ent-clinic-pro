/**
 * API 速率限制中介軟體
 * 防止 API 濫用，特別是醫療內容的存取
 */

'use strict';

const rateLimit = require('koa-ratelimit');
const Redis = require('ioredis');

module.exports = (config, { strapi }) => {
  // 使用記憶體儲存（開發環境）或 Redis（生產環境）
  const db = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : new Map();

  const limiter = rateLimit({
    driver: 'memory',
    db: db,
    duration: config.duration || 60000, // 1 分鐘
    errorMessage: {
      error: 'Rate limit exceeded',
      message: 'Too many requests, please try again later.',
      statusCode: 429
    },
    id: (ctx) => {
      // 使用 IP 地址和使用者 ID（如果已驗證）作為識別
      const ip = ctx.ip || ctx.request.ip;
      const userId = ctx.state.user?.id;
      return userId ? `${ip}:${userId}` : ip;
    },
    headers: {
      remaining: 'Rate-Limit-Remaining',
      reset: 'Rate-Limit-Reset',
      total: 'Rate-Limit-Total'
    },
    max: (ctx) => {
      // 根據不同的端點設定不同的限制
      const url = ctx.url;
      const isAuthenticated = !!ctx.state.user;
      
      // 醫療內容 API 的特殊限制
      if (url.includes('/api/calculators') || url.includes('/api/educations')) {
        return isAuthenticated ? 200 : 50; // 已驗證使用者有更高限制
      }
      
      // 檔案上傳限制
      if (url.includes('/upload')) {
        return isAuthenticated ? 20 : 5;
      }
      
      // 一般 API 限制
      return isAuthenticated ? config.max || 100 : 30;
    },
    disableHeader: false,
    whitelist: (ctx) => {
      // 白名單：管理員和特定 IP
      const adminIPs = (process.env.ADMIN_IPS || '').split(',').filter(Boolean);
      const isAdmin = ctx.state.user?.role?.type === 'admin';
      const isWhitelistedIP = adminIPs.includes(ctx.ip);
      
      return isAdmin || isWhitelistedIP;
    },
    skip: (ctx) => {
      // 跳過健康檢查和靜態資源
      return ctx.url.includes('/health') || 
             ctx.url.includes('/favicon') ||
             ctx.url.includes('/robots.txt');
    }
  });

  return async (ctx, next) => {
    // 記錄 API 使用情況
    if (ctx.url.includes('/api/')) {
      strapi.log.debug('API Request', {
        method: ctx.method,
        url: ctx.url,
        ip: ctx.ip,
        userAgent: ctx.get('User-Agent'),
        userId: ctx.state.user?.id,
        timestamp: new Date().toISOString()
      });
    }

    // 應用速率限制
    return limiter(ctx, next);
  };
};