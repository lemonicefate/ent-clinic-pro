/**
 * CSRF Token API endpoint
 * Generates and validates CSRF tokens for form protection
 */

import type { APIRoute } from 'astro';
import { CSRFProtection, AuditLogger, SecureErrorHandler } from '../../../utils/security-measures';

/**
 * Generate session ID from request
 */
function generateSessionId(request: Request, clientAddress?: string): string {
  const userAgent = request.headers.get('user-agent') || '';
  const ip = clientAddress || 'unknown';
  const timestamp = Date.now();
  
  // Create a simple session ID (in production, use proper session management)
  const sessionData = `${ip}:${userAgent}:${timestamp}`;
  return btoa(sessionData).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
}

export const GET: APIRoute = async (context) => {
  const { request } = context;
  
  try {
    // Get or create session ID
    let sessionId = request.headers.get('X-Session-ID');
    
    if (!sessionId) {
      // Try to get from cookie
      const cookies = request.headers.get('cookie');
      const sessionCookie = cookies?.split(';')
        .find(c => c.trim().startsWith('session_id='));
      
      if (sessionCookie) {
        sessionId = sessionCookie.split('=')[1];
      } else {
        // Generate new session ID
        sessionId = generateSessionId(request, context.clientAddress);
      }
    }

    // Generate CSRF token
    const csrfToken = CSRFProtection.generateToken(sessionId);

    // Log token generation
    AuditLogger.logSecurityEvent(
      'csrf_token_generated',
      context,
      true,
      { sessionId: sessionId.substring(0, 8) + '...' }, // Log partial session ID for privacy
      'low'
    );

    // Create response with token
    const response = new Response(
      JSON.stringify({
        success: true,
        token: csrfToken,
        sessionId,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );

    // Set session cookie if not exists
    if (!request.headers.get('cookie')?.includes('session_id=')) {
      response.headers.set(
        'Set-Cookie',
        `session_id=${sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`
      );
    }

    return response;
  } catch (error) {
    console.error('CSRF token generation error:', error);
    
    AuditLogger.logSecurityEvent(
      'csrf_token_error',
      context,
      false,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'medium'
    );

    return SecureErrorHandler.createErrorResponse(
      '無法生成安全令牌',
      500,
      'general'
    );
  }
};

export const POST: APIRoute = async (context) => {
  const { request } = context;
  
  try {
    const body = await request.json();
    const { token, sessionId } = body;

    if (!token || !sessionId) {
      return SecureErrorHandler.createErrorResponse(
        '缺少必要參數',
        400,
        'validation'
      );
    }

    // Validate CSRF token
    const isValid = CSRFProtection.validateToken(token, sessionId);

    if (isValid) {
      // Consume the token (one-time use)
      CSRFProtection.consumeToken(token);
      
      AuditLogger.logSecurityEvent(
        'csrf_token_validated',
        context,
        true,
        { sessionId: sessionId.substring(0, 8) + '...' },
        'low'
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: '令牌驗證成功',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } else {
      AuditLogger.logSecurityEvent(
        'csrf_token_invalid',
        context,
        false,
        { sessionId: sessionId.substring(0, 8) + '...' },
        'high'
      );

      return SecureErrorHandler.createErrorResponse(
        '安全令牌無效',
        403,
        'validation'
      );
    }
  } catch (error) {
    console.error('CSRF token validation error:', error);
    
    AuditLogger.logSecurityEvent(
      'csrf_validation_error',
      context,
      false,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'medium'
    );

    return SecureErrorHandler.createErrorResponse(
      '令牌驗證失敗',
      500,
      'general'
    );
  }
};