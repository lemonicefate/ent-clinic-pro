/**
 * Token refresh API endpoint
 * Handles JWT token refresh using refresh tokens
 */

import type { APIRoute } from 'astro';

// Disable prerendering for this API route
export const prerender = false;

// Mock user database - same as login
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@medical.com',
    password: 'admin123',
    name: '系統管理員',
    role: 'admin' as const,
    permissions: ['read', 'write', 'admin', 'manage_users', 'manage_content'],
  },
  {
    id: '2',
    email: 'doctor@medical.com',
    password: 'doctor123',
    name: '王醫師',
    role: 'user' as const,
    permissions: ['read', 'write'],
  },
];

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

/**
 * Simple JWT creation (same as login)
 */
function createJWT(payload: any, expiresIn: string = '1h'): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const exp = expiresIn === '1h' ? now + 3600 : 
             expiresIn === '7d' ? now + 604800 : 
             now + 3600;

  const jwtPayload = {
    ...payload,
    iat: now,
    exp: exp,
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(jwtPayload)).replace(/=/g, '');
  
  const signature = btoa(`${encodedHeader}.${encodedPayload}.${JWT_SECRET}`).replace(/=/g, '');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Simple JWT verification (mock implementation)
 */
function verifyJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new Error('Token expired');
    }

    // In production, verify signature properly
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Get token from cookies
 */
function getTokenFromCookies(cookieHeader: string | null, tokenName: string): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return cookies[tokenName] || null;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const cookieHeader = request.headers.get('cookie');
    
    // Try to get refresh token from request body or cookies
    let refreshToken = body.refreshToken;
    if (!refreshToken) {
      refreshToken = getTokenFromCookies(cookieHeader, 'refresh_token');
    }

    if (!refreshToken) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '找不到刷新令牌',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Verify refresh token
    let tokenPayload;
    try {
      tokenPayload = verifyJWT(refreshToken);
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '刷新令牌無效或已過期',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Check if it's a refresh token
    if (tokenPayload.type !== 'refresh') {
      return new Response(
        JSON.stringify({
          success: false,
          message: '無效的刷新令牌類型',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Find user
    const user = MOCK_USERS.find(u => u.id === tokenPayload.id);
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '用戶不存在',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Create new access token
    const userPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
    };

    const newAccessToken = createJWT(userPayload, '1h');
    const newRefreshToken = createJWT({ id: user.id, type: 'refresh' }, '7d');

    // Set new HttpOnly cookies
    const response = new Response(
      JSON.stringify({
        success: true,
        message: '令牌刷新成功',
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': [
            `access_token=${newAccessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`,
            `refresh_token=${newRefreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`,
          ].join(', '),
        },
      }
    );

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: '令牌刷新失敗',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};