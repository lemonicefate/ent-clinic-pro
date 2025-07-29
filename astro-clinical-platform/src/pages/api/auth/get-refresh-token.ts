/**
 * Get refresh token API endpoint
 * Retrieves refresh token from HttpOnly cookies
 */

import type { APIRoute } from 'astro';

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

export const GET: APIRoute = async ({ request }) => {
  try {
    const cookieHeader = request.headers.get('cookie');
    const refreshToken = getTokenFromCookies(cookieHeader, 'refresh_token');

    return new Response(
      JSON.stringify({
        success: true,
        refreshToken: refreshToken || null,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Get refresh token error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: '獲取刷新令牌失敗',
        refreshToken: null,
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