/**
 * Astro 中介軟體
 * 處理多語言路由、重定向和路由保護
 */

import { defineMiddleware, sequence } from 'astro:middleware';
import { getLocaleFromPath, supportedLocales, defaultLocale } from './utils/i18n';
import { protectRoute, SessionManager } from './utils/route-protection';
import { SecurityMiddleware, AuditLogger } from './utils/security-measures';
import type { AuthUser } from './utils/auth';

// I18n middleware for language handling
const i18nMiddleware = defineMiddleware(async (context, next) => {
  const { url, redirect } = context;
  const pathname = url.pathname;

  // 獲取當前語言
  const currentLocale = getLocaleFromPath(pathname);
  
  // 檢查是否為有效的語言路徑
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  // 如果第一個段落是語言代碼但不是支援的語言，重定向到預設語言
  if (firstSegment && firstSegment.length === 2 && !supportedLocales.includes(firstSegment as any)) {
    const newPath = pathname.replace(`/${firstSegment}`, '');
    return redirect(newPath || '/', 301);
  }
  
  // 設定語言資訊到 locals，供頁面使用
  context.locals.locale = currentLocale;
  context.locals.pathname = pathname;
  
  return next();
});

// Security middleware for rate limiting and CSRF protection
const securityMiddleware = defineMiddleware(async (context, next) => {
  // Apply rate limiting to authentication endpoints
  if (context.url.pathname.startsWith('/api/auth/') && context.request.method === 'POST') {
    const rateLimitResponse = await SecurityMiddleware.applyRateLimit(context, 'login');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  // Apply general API rate limiting
  if (context.url.pathname.startsWith('/api/')) {
    const rateLimitResponse = await SecurityMiddleware.applyRateLimit(context, 'api');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  return next();
});

// Authentication middleware for session management
const authMiddleware = defineMiddleware(async (context, next) => {
  // Validate and refresh session if needed
  const user = await SessionManager.validateAndRefreshSession(context);
  
  // Set authentication state in locals
  context.locals.user = user;
  context.locals.isAuthenticated = !!user;
  
  return next();
});

// Route protection middleware
const routeProtectionMiddleware = defineMiddleware(async (context, next) => {
  return protectRoute(context, next);
});

// Response headers middleware
const headersMiddleware = defineMiddleware(async (context, next) => {
  const response = await next();
  
  // 添加語言相關的 HTTP 標頭
  if (context.locals.locale) {
    response.headers.set('Content-Language', context.locals.locale);
  }
  
  // 添加 Vary 標頭以支援快取
  response.headers.set('Vary', 'Accept-Language');
  
  // Apply comprehensive security headers
  return SecurityMiddleware.addSecurityHeaders(response);
});

// Combine all middleware in sequence
export const onRequest = sequence(
  i18nMiddleware,
  securityMiddleware,
  authMiddleware,
  routeProtectionMiddleware,
  headersMiddleware
);

// 擴展 Astro.locals 類型
declare global {
  namespace App {
    interface Locals {
      locale: string;
      pathname: string;
      user?: AuthUser | null;
      isAuthenticated: boolean;
    }
  }
}