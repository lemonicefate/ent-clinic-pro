/**
 * Get Token API endpoint
 * Returns access token from HttpOnly cookies for authenticated requests
 */

import type { APIRoute } from 'astro';
import { SecureErrorHandler } from '../../../utils/security-measures';

export const GET: APIRoute = async (context) => {
  const { request } = context;
  
  try {
    // Get access token from HttpOnly cookie
    const cookies = request.headers.get('cookie');
    const accessTokenCookie = cookies?.split(';')
      .find(c => c.trim().startsWith('access_token='));
    
    if (!accessTokenCookie) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '未找到存取令牌',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const accessToken = accessTokenCookie.split('=')[1];
    
    // Verify token is not expired (basic check)
    try {
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (payload.exp && payload.exp < currentTime) {
          return new Response(
            JSON.stringify({
              success: false,
              message: '存取令牌已過期',
            }),
            {
              status: 401,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
        }
      }
    } catch (error) {
      return SecureErrorHandler.createErrorResponse(
        '無效的存取令牌',
        401,
        'auth'
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        accessToken,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Get token error:', error);
    
    return SecureErrorHandler.createErrorResponse(
      '無法獲取存取令牌',
      500,
      'general'
    );
  }
};