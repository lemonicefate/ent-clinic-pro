/**
 * Security Status API endpoint for administrators
 * Provides security metrics and system status
 */

import type { APIRoute } from 'astro';

// Disable prerendering for this API route
export const prerender = false;
import { 
  RateLimiter, 
  AuditLogger, 
  SecureErrorHandler,
  SecurityMiddleware 
} from '../../../utils/security-measures';
import { authService } from '../../../utils/auth';

/**
 * Verify admin authentication
 */
async function verifyAdminAuth(request: Request): Promise<{ isValid: boolean; user?: any }> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isValid: false };
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    
    // Simple JWT verification (in production, use proper JWT library)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { isValid: false };
    }

    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { isValid: false };
    }

    // Check if user has admin role
    if (payload.role !== 'admin') {
      return { isValid: false };
    }

    return { isValid: true, user: payload };
  } catch (error) {
    return { isValid: false };
  }
}

export const GET: APIRoute = async (context) => {
  const { request } = context;

  try {
    // Apply rate limiting
    const rateLimitResponse = await SecurityMiddleware.applyRateLimit(context, 'api');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (!authResult.isValid) {
      AuditLogger.logSecurityEvent(
        'admin_unauthorized_access',
        context,
        false,
        { endpoint: '/api/admin/security-status' },
        'high'
      );

      return SecureErrorHandler.createErrorResponse(
        '需要管理員權限',
        403,
        'permission'
      );
    }

    // Get security metrics
    const recentEvents = AuditLogger.getRecentEvents(50);
    const failedAuthAttempts = AuditLogger.getFailedAuthAttempts();
    
    // Calculate security metrics
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    const recentFailedLogins = failedAuthAttempts.filter(
      event => event.timestamp.getTime() > oneHourAgo
    ).length;

    const dailyFailedLogins = failedAuthAttempts.filter(
      event => event.timestamp.getTime() > oneDayAgo
    ).length;

    const criticalEvents = recentEvents.filter(
      event => event.severity === 'critical'
    ).length;

    const highSeverityEvents = recentEvents.filter(
      event => event.severity === 'high'
    ).length;

    // Get rate limiting status for common endpoints
    const rateLimitStatus = {
      login: RateLimiter.getStatus('sample:login', 'login'),
      api: RateLimiter.getStatus('sample:api', 'api'),
      password_reset: RateLimiter.getStatus('sample:password_reset', 'password_reset'),
    };

    // Security status summary
    const securityStatus = {
      overall: 'healthy', // This would be calculated based on various factors
      lastUpdated: new Date().toISOString(),
      metrics: {
        recentFailedLogins,
        dailyFailedLogins,
        criticalEvents,
        highSeverityEvents,
        totalEvents: recentEvents.length,
      },
      rateLimiting: {
        enabled: true,
        status: rateLimitStatus,
      },
      csrf: {
        enabled: true,
        tokensActive: 'N/A', // Would need to expose from CSRFProtection
      },
      auditLogging: {
        enabled: true,
        eventsLogged: recentEvents.length,
        oldestEvent: recentEvents.length > 0 ? 
          recentEvents[recentEvents.length - 1].timestamp : null,
      },
    };

    // Determine overall security status
    if (criticalEvents > 0) {
      securityStatus.overall = 'critical';
    } else if (highSeverityEvents > 5 || recentFailedLogins > 10) {
      securityStatus.overall = 'warning';
    } else if (recentFailedLogins > 5) {
      securityStatus.overall = 'attention';
    }

    // Log admin access
    AuditLogger.logSecurityEvent(
      'admin_security_status_accessed',
      context,
      true,
      { userId: authResult.user?.id },
      'low'
    );

    const response = new Response(
      JSON.stringify({
        success: true,
        data: securityStatus,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return SecurityMiddleware.addSecurityHeaders(response);
  } catch (error) {
    console.error('Security status error:', error);
    
    AuditLogger.logSecurityEvent(
      'admin_security_status_error',
      context,
      false,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'medium'
    );

    return SecureErrorHandler.createErrorResponse(
      '無法獲取安全狀態',
      500,
      'general'
    );
  }
};

export const POST: APIRoute = async (context) => {
  const { request } = context;

  try {
    // Apply rate limiting
    const rateLimitResponse = await SecurityMiddleware.applyRateLimit(context, 'api');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (!authResult.isValid) {
      return SecureErrorHandler.createErrorResponse(
        '需要管理員權限',
        403,
        'permission'
      );
    }

    const body = await request.json();
    const { action, target } = body;

    let result: any = {};

    switch (action) {
      case 'reset_rate_limit':
        if (target) {
          RateLimiter.reset(target);
          result = { message: `已重置 ${target} 的速率限制` };
          
          AuditLogger.logSecurityEvent(
            'admin_rate_limit_reset',
            context,
            true,
            { target, adminId: authResult.user?.id },
            'medium'
          );
        } else {
          return SecureErrorHandler.createErrorResponse(
            '缺少目標參數',
            400,
            'validation'
          );
        }
        break;

      case 'cleanup_events':
        const oldEventCount = AuditLogger.getRecentEvents().length;
        AuditLogger.clearOldEvents();
        const newEventCount = AuditLogger.getRecentEvents().length;
        
        result = { 
          message: `已清理舊事件，從 ${oldEventCount} 減少到 ${newEventCount}` 
        };
        
        AuditLogger.logSecurityEvent(
          'admin_events_cleanup',
          context,
          true,
          { oldCount: oldEventCount, newCount: newEventCount, adminId: authResult.user?.id },
          'low'
        );
        break;

      default:
        return SecureErrorHandler.createErrorResponse(
          '不支援的操作',
          400,
          'validation'
        );
    }

    const response = new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return SecurityMiddleware.addSecurityHeaders(response);
  } catch (error) {
    console.error('Security action error:', error);
    
    AuditLogger.logSecurityEvent(
      'admin_security_action_error',
      context,
      false,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'medium'
    );

    return SecureErrorHandler.createErrorResponse(
      '操作執行失敗',
      500,
      'general'
    );
  }
};