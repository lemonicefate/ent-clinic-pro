/**
 * Store tokens API endpoint
 * Stores tokens in HttpOnly cookies
 */

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { accessToken, refreshToken, expiresAt } = body;

    if (!accessToken || !refreshToken) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '缺少必要的令牌',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Calculate max age for access token (default 1 hour)
    const accessTokenMaxAge = expiresAt ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)) : 3600;

    // Set HttpOnly cookies
    const response = new Response(
      JSON.stringify({
        success: true,
        message: '令牌儲存成功',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': [
            `access_token=${accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${accessTokenMaxAge}`,
            `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`, // 7 days
          ].join(', '),
        },
      }
    );

    return response;
  } catch (error) {
    console.error('Store tokens error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: '令牌儲存失敗',
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