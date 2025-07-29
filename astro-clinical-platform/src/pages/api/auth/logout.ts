/**
 * Logout API endpoint
 * Handles user logout and token invalidation
 */

import type { APIRoute } from 'astro';

// Disable prerendering for this API route
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Clear HttpOnly cookies by setting them to expire immediately
    const response = new Response(
      JSON.stringify({
        success: true,
        message: '登出成功',
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
    console.error('Logout error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: '登出時發生錯誤',
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