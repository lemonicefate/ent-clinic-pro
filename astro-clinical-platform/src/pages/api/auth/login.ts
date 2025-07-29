/**
 * Login API endpoint
 * Handles user authentication and JWT token generation
 */

import type { APIRoute } from 'astro';

// Disable prerendering for this API route
export const prerender = false;
import {
  RateLimiter,
  AuditLogger,
  SecureErrorHandler,
  SecurityMiddleware,
} from '../../../utils/security-measures';

// Mock user database - In production, this would be a real database
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@medical.com',
    password: 'admin123', // In production, this would be hashed
    name: '系統管理員',
    role: 'admin' as const,
    permissions: ['read', 'write', 'admin', 'manage_users', 'manage_content'],
  },
  {
    id: '2',
    email: 'doctor@medical.com',
    password: 'doctor123', // In production, this would be hashed
    name: '王醫師',
    role: 'user' as const,
    permissions: ['read', 'write'],
  },
];

// JWT secret - In production, this should be in environment variables
const JWT_SECRET =
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

/**
 * Simple JWT implementation for demonstration
 * In production, use a proper JWT library like 'jsonwebtoken'
 */
function createJWT(payload: any, expiresIn: string = '1h'): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const exp =
    expiresIn === '1h'
      ? now + 3600
      : expiresIn === '7d'
        ? now + 604800
        : now + 3600; // default 1 hour

  const jwtPayload = {
    ...payload,
    iat: now,
    exp: exp,
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(jwtPayload)).replace(/=/g, '');

  // Simple HMAC-SHA256 signature (in production, use crypto library)
  const signature = btoa(
    `${encodedHeader}.${encodedPayload}.${JWT_SECRET}`
  ).replace(/=/g, '');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Hash password (mock implementation)
 * In production, use bcrypt or similar
 */
function hashPassword(password: string): string {
  // This is a mock implementation - use bcrypt in production
  return btoa(password + 'salt');
}

/**
 * Verify password (mock implementation)
 */
function verifyPassword(password: string, hashedPassword: string): boolean {
  // This is a mock implementation - use bcrypt.compare in production
  return (
    btoa(password + 'salt') === hashedPassword || password === hashedPassword
  );
}

export const POST: APIRoute = async (context) => {
  const { request } = context;

  try {
    // Apply rate limiting for login attempts
    const rateLimitResponse = await SecurityMiddleware.applyRateLimit(
      context,
      'login'
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      // Record failed attempt for rate limiting
      let clientIP = 'unknown';
      try {
        clientIP = context.clientAddress || 'unknown';
      } catch (error) {
        // Skip rate limiting during prerendering
      }
      const identifier = `${clientIP}:login`;
      RateLimiter.recordAttempt(identifier, false);

      // Log failed attempt
      AuditLogger.logAuthAttempt(
        email || 'unknown',
        false,
        context,
        'Missing credentials'
      );

      return SecureErrorHandler.createErrorResponse(
        '請輸入電子郵件和密碼',
        400,
        'auth'
      );
    }

    // Find user
    const user = MOCK_USERS.find((u) => u.email === email);
    if (!user) {
      // Record failed attempt for rate limiting
      let clientIP = 'unknown';
      try {
        clientIP = context.clientAddress || 'unknown';
      } catch (error) {
        // Skip rate limiting during prerendering
      }
      const identifier = `${clientIP}:login`;
      RateLimiter.recordAttempt(identifier, false);

      // Log failed attempt
      AuditLogger.logAuthAttempt(email, false, context, 'User not found');

      return SecureErrorHandler.createErrorResponse(
        '電子郵件或密碼錯誤',
        401,
        'auth'
      );
    }

    // Verify password
    if (!verifyPassword(password, user.password)) {
      // Record failed attempt for rate limiting
      let clientIP = 'unknown';
      try {
        clientIP = context.clientAddress || 'unknown';
      } catch (error) {
        // Skip rate limiting during prerendering
      }
      const identifier = `${clientIP}:login`;
      RateLimiter.recordAttempt(identifier, false);

      // Log failed attempt
      AuditLogger.logAuthAttempt(email, false, context, 'Invalid password');

      return SecureErrorHandler.createErrorResponse(
        '電子郵件或密碼錯誤',
        401,
        'auth'
      );
    }

    // Create JWT tokens
    const userPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
    };

    const accessToken = createJWT(userPayload, '1h');
    const refreshToken = createJWT({ id: user.id, type: 'refresh' }, '7d');

    // Prepare user data (without sensitive information)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
    };

    // Record successful attempt for rate limiting
    let clientIP = 'unknown';
    try {
      clientIP = context.clientAddress || 'unknown';
    } catch (error) {
      // Skip rate limiting during prerendering
    }
    const identifier = `${clientIP}:login`;
    RateLimiter.recordAttempt(identifier, true);

    // Log successful attempt
    AuditLogger.logAuthAttempt(email, true, context, 'Login successful');

    // Set HttpOnly cookies for tokens
    const response = new Response(
      JSON.stringify({
        success: true,
        message: '登入成功',
        accessToken,
        refreshToken,
        user: userData,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': [
            `access_token=${accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`,
            `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`,
          ].join(', '),
        },
      }
    );

    return SecurityMiddleware.addSecurityHeaders(response);
  } catch (error) {
    console.error('Login error:', error);

    // Log system error
    AuditLogger.logSecurityEvent(
      'login_system_error',
      context,
      false,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'high'
    );

    return SecureErrorHandler.createErrorResponse(
      error instanceof Error ? error : '伺服器錯誤，請稍後再試',
      500,
      'general'
    );
  }
};
