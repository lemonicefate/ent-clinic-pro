/**
 * Clear tokens API endpoint
 * Clears tokens from HttpOnly cookies
 */

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Clear HttpOnly cookies by setting them to expire immediately
    const response = new Response(
      JSON.stringify({
        success: true,
        message: '令牌清除成功',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': [
            'access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
            'refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
          ].join(', '),
        },
      }
    );

    return response;
  } catch (error) {
    console.error('Clear tokens error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: '令牌清除失敗',
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