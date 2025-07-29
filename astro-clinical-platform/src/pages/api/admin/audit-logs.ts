/**
 * Audit Logs API endpoint for administrators
 * Provides access to security audit logs and events
 */

import type { APIRoute } from 'astro';
import { 
  AuditLogger, 
  SecureErrorHandler,
  SecurityMiddleware 
} from '../../../utils/security-measures';

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
  const url = new URL(request.url);

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
        'admin_unauthorized_audit_access',
        context,
        false,
        { endpoint: '/api/admin/audit-logs' },
        'high'
      );

      return SecureErrorHandler.createErrorResponse(
        '需要管理員權限',
        403,
        'permission'
      );
    }

    // Parse query parameters
    const eventType = url.searchParams.get('type');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const severity = url.searchParams.get('severity');
    const timeWindow = parseInt(url.searchParams.get('timeWindow') || '86400000'); // 24 hours default
    const format = url.searchParams.get('format') || 'json';

    let events;

    if (eventType) {
      events = AuditLogger.getEventsByType(eventType, limit);
    } else {
      events = AuditLogger.getRecentEvents(limit);
    }

    // Filter by severity if specified
    if (severity) {
      events = events.filter(event => event.severity === severity);
    }

    // Filter by time window
    const cutoff = new Date(Date.now() - timeWindow);
    events = events.filter(event => event.timestamp > cutoff);

    // Log admin access
    AuditLogger.logSecurityEvent(
      'admin_audit_logs_accessed',
      context,
      true,
      { 
        userId: authResult.user?.id,
        filters: { eventType, limit, severity, timeWindow },
        resultCount: events.length 
      },
      'low'
    );

    // Return in requested format
    if (format === 'csv') {
      const csvData = AuditLogger.exportEvents('csv');
      
      const response = new Response(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });

      return SecurityMiddleware.addSecurityHeaders(response);
    }

    // Prepare response data
    const responseData = {
      success: true,
      data: {
        events,
        metadata: {
          totalEvents: events.length,
          filters: {
            eventType,
            severity,
            timeWindow,
            limit,
          },
          generatedAt: new Date().toISOString(),
          generatedBy: authResult.user?.id,
        },
      },
    };

    const response = new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return SecurityMiddleware.addSecurityHeaders(response);
  } catch (error) {
    console.error('Audit logs error:', error);
    
    AuditLogger.logSecurityEvent(
      'admin_audit_logs_error',
      context,
      false,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'medium'
    );

    return SecureErrorHandler.createErrorResponse(
      '無法獲取審計日誌',
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
    const { action, filters } = body;

    let result: any = {};

    switch (action) {
      case 'export':
        const format = filters?.format || 'json';
        const exportData = AuditLogger.exportEvents(format);
        
        result = {
          data: exportData,
          format,
          timestamp: new Date().toISOString(),
        };

        AuditLogger.logSecurityEvent(
          'admin_audit_export',
          context,
          true,
          { format, adminId: authResult.user?.id },
          'medium'
        );
        break;

      case 'search':
        const { eventType, severity, timeWindow = 86400000 } = filters || {};
        
        let searchResults;
        if (eventType) {
          searchResults = AuditLogger.getEventsByType(eventType, 1000);
        } else {
          searchResults = AuditLogger.getRecentEvents(1000);
        }

        if (severity) {
          searchResults = searchResults.filter(event => event.severity === severity);
        }

        const cutoff = new Date(Date.now() - timeWindow);
        searchResults = searchResults.filter(event => event.timestamp > cutoff);

        result = {
          events: searchResults,
          count: searchResults.length,
          filters: { eventType, severity, timeWindow },
        };

        AuditLogger.logSecurityEvent(
          'admin_audit_search',
          context,
          true,
          { filters, resultCount: searchResults.length, adminId: authResult.user?.id },
          'low'
        );
        break;

      case 'get_failed_logins':
        const timeRange = filters?.timeWindow || 3600000; // 1 hour default
        const failedLogins = AuditLogger.getFailedAuthAttempts(timeRange);
        
        // Group by IP address for analysis
        const ipGroups: Record<string, any[]> = {};
        failedLogins.forEach(event => {
          if (!ipGroups[event.ip]) {
            ipGroups[event.ip] = [];
          }
          ipGroups[event.ip].push(event);
        });

        result = {
          failedLogins,
          summary: {
            totalAttempts: failedLogins.length,
            uniqueIPs: Object.keys(ipGroups).length,
            topIPs: Object.entries(ipGroups)
              .sort(([, a], [, b]) => b.length - a.length)
              .slice(0, 10)
              .map(([ip, events]) => ({ ip, attempts: events.length })),
          },
        };

        AuditLogger.logSecurityEvent(
          'admin_failed_logins_analysis',
          context,
          true,
          { timeRange, totalAttempts: failedLogins.length, adminId: authResult.user?.id },
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
    console.error('Audit logs action error:', error);
    
    AuditLogger.logSecurityEvent(
      'admin_audit_action_error',
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