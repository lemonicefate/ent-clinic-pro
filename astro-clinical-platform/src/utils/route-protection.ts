/**
 * Route protection utilities for Astro Clinical Platform
 * Handles authentication guards and route access control
 */

import type { APIContext } from 'astro';
import { authService, type AuthUser } from './auth';

export interface RouteProtectionConfig {
  requireAuth?: boolean;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  redirectTo?: string;
  allowedPaths?: string[];
  excludedPaths?: string[];
}

export interface ProtectedRouteResult {
  allowed: boolean;
  user?: AuthUser | null;
  redirectUrl?: string;
  reason?: string;
}

/**
 * Route matcher utility for pattern matching
 */
export class RouteMatcher {
  /**
   * Check if a path matches any of the given patterns
   */
  static matchesAny(path: string, patterns: string[]): boolean {
    return patterns.some(pattern => this.matches(path, pattern));
  }

  /**
   * Check if a path matches a specific pattern
   * Supports wildcards (*) and parameter matching ([param])
   */
  static matches(path: string, pattern: string): boolean {
    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*') // * becomes .*
      .replace(/\[([^\]]+)\]/g, '([^/]+)') // [param] becomes ([^/]+)
      .replace(/\//g, '\\/'); // escape forward slashes

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  /**
   * Extract parameters from a path using a pattern
   */
  static extractParams(path: string, pattern: string): Record<string, string> {
    const params: Record<string, string> = {};
    
    // Find parameter names in pattern
    const paramNames: string[] = [];
    const paramRegex = /\[([^\]]+)\]/g;
    let match;
    
    while ((match = paramRegex.exec(pattern)) !== null) {
      paramNames.push(match[1]);
    }

    if (paramNames.length === 0) {
      return params;
    }

    // Convert pattern to regex with capture groups
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\[([^\]]+)\]/g, '([^/]+)')
      .replace(/\//g, '\\/');

    const regex = new RegExp(`^${regexPattern}$`);
    const pathMatch = path.match(regex);

    if (pathMatch) {
      paramNames.forEach((name, index) => {
        params[name] = pathMatch[index + 1];
      });
    }

    return params;
  }
}

/**
 * Protected route configurations for different areas of the application
 */
export const ROUTE_CONFIGS: Record<string, RouteProtectionConfig> = {
  // Admin routes - require admin role
  admin: {
    requireAuth: true,
    requiredRoles: ['admin'],
    redirectTo: '/login?redirect=admin',
    allowedPaths: ['/admin', '/admin/*'],
  },

  // API routes - require authentication
  api: {
    requireAuth: true,
    redirectTo: '/login',
    allowedPaths: ['/api/protected/*'],
    excludedPaths: ['/api/auth/*', '/api/public/*'],
  },

  // User dashboard - require any authenticated user
  dashboard: {
    requireAuth: true,
    redirectTo: '/login?redirect=dashboard',
    allowedPaths: ['/dashboard', '/dashboard/*'],
  },

  // Content management - require write permissions
  cms: {
    requireAuth: true,
    requiredPermissions: ['write', 'manage_content'],
    redirectTo: '/login?redirect=cms',
    allowedPaths: ['/cms', '/cms/*'],
  },

  // User management - require admin permissions
  users: {
    requireAuth: true,
    requiredPermissions: ['admin', 'manage_users'],
    redirectTo: '/login?redirect=users',
    allowedPaths: ['/users', '/users/*'],
  },
};

/**
 * Check if a user has the required role
 */
export function hasRequiredRole(user: AuthUser | null, requiredRoles: string[]): boolean {
  if (!user || !requiredRoles.length) {
    return !requiredRoles.length; // If no roles required, allow access
  }

  return requiredRoles.includes(user.role);
}

/**
 * Check if a user has the required permissions
 */
export function hasRequiredPermissions(user: AuthUser | null, requiredPermissions: string[]): boolean {
  if (!user || !requiredPermissions.length) {
    return !requiredPermissions.length; // If no permissions required, allow access
  }

  return requiredPermissions.every(permission => 
    user.permissions.includes(permission)
  );
}

/**
 * Check if a path should be protected based on configuration
 */
export function shouldProtectPath(path: string, config: RouteProtectionConfig): boolean {
  // Check if path is explicitly excluded
  if (config.excludedPaths && RouteMatcher.matchesAny(path, config.excludedPaths)) {
    return false;
  }

  // Check if path is in allowed paths (if specified)
  if (config.allowedPaths && config.allowedPaths.length > 0) {
    return RouteMatcher.matchesAny(path, config.allowedPaths);
  }

  // Default to requiring protection if requireAuth is true
  return config.requireAuth || false;
}

/**
 * Validate route access for a user
 */
export async function validateRouteAccess(
  path: string,
  config: RouteProtectionConfig,
  user: AuthUser | null = null
): Promise<ProtectedRouteResult> {
  // If route doesn't require protection, allow access
  if (!shouldProtectPath(path, config)) {
    return { allowed: true, user };
  }

  // If authentication is required but user is not authenticated
  if (config.requireAuth && !user) {
    return {
      allowed: false,
      redirectUrl: config.redirectTo || '/login',
      reason: 'Authentication required',
    };
  }

  // Check role requirements
  if (config.requiredRoles && !hasRequiredRole(user, config.requiredRoles)) {
    return {
      allowed: false,
      user,
      redirectUrl: config.redirectTo || '/login',
      reason: `Required role: ${config.requiredRoles.join(' or ')}`,
    };
  }

  // Check permission requirements
  if (config.requiredPermissions && !hasRequiredPermissions(user, config.requiredPermissions)) {
    return {
      allowed: false,
      user,
      redirectUrl: config.redirectTo || '/login',
      reason: `Required permissions: ${config.requiredPermissions.join(', ')}`,
    };
  }

  // All checks passed
  return { allowed: true, user };
}

/**
 * Get user from request context (server-side)
 */
export async function getUserFromContext(context: APIContext): Promise<AuthUser | null> {
  try {
    // Try to get access token from cookies
    const accessToken = context.cookies.get('access_token')?.value;
    
    if (!accessToken) {
      return null;
    }

    // Decode JWT payload (simple implementation)
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    // Return user data from token
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      permissions: payload.permissions || [],
    };
  } catch (error) {
    console.error('Failed to get user from context:', error);
    return null;
  }
}

/**
 * Create a route protection middleware for specific configuration
 */
export function createRouteProtection(configName: string) {
  const config = ROUTE_CONFIGS[configName];
  
  if (!config) {
    throw new Error(`Route protection config '${configName}' not found`);
  }

  return async (context: APIContext, next: () => Promise<Response>): Promise<Response> => {
    const path = context.url.pathname;
    const user = await getUserFromContext(context);

    // Validate route access
    const result = await validateRouteAccess(path, config, user);

    if (!result.allowed) {
      // Store the original URL for redirect after login
      const redirectUrl = result.redirectUrl || '/login';
      const urlWithRedirect = `${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}redirect=${encodeURIComponent(path)}`;
      
      return context.redirect(urlWithRedirect);
    }

    // Store user in locals for access in pages
    context.locals.user = result.user;
    context.locals.isAuthenticated = !!result.user;

    return next();
  };
}

/**
 * Generic route protection middleware that checks multiple configurations
 */
export async function protectRoute(
  context: APIContext,
  next: () => Promise<Response>
): Promise<Response> {
  const path = context.url.pathname;
  const user = await getUserFromContext(context);

  // Check each route configuration to see if any apply
  for (const [configName, config] of Object.entries(ROUTE_CONFIGS)) {
    if (shouldProtectPath(path, config)) {
      const result = await validateRouteAccess(path, config, user);

      if (!result.allowed) {
        // Store the original URL for redirect after login
        const redirectUrl = result.redirectUrl || '/login';
        const urlWithRedirect = `${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}redirect=${encodeURIComponent(path)}`;
        
        return context.redirect(urlWithRedirect);
      }

      // Store user in locals for access in pages
      context.locals.user = result.user;
      context.locals.isAuthenticated = !!result.user;
      
      break; // Found matching config, stop checking
    }
  }

  // If no protection config matched, allow access but still set user if available
  if (user) {
    context.locals.user = user;
    context.locals.isAuthenticated = true;
  }

  return next();
}

/**
 * Session management utilities
 */
export class SessionManager {
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly REFRESH_THRESHOLD = 60 * 60 * 1000; // 1 hour

  /**
   * Check if session needs refresh
   */
  static needsRefresh(tokenExpiration: number): boolean {
    const now = Date.now();
    const timeUntilExpiry = tokenExpiration - now;
    return timeUntilExpiry < this.REFRESH_THRESHOLD;
  }

  /**
   * Get session expiration time
   */
  static getSessionExpiration(): number {
    return Date.now() + this.SESSION_DURATION;
  }

  /**
   * Validate session and refresh if needed
   */
  static async validateAndRefreshSession(context: APIContext): Promise<AuthUser | null> {
    const user = await getUserFromContext(context);
    
    if (!user) {
      return null;
    }

    // Check if we need to refresh the token
    const accessToken = context.cookies.get('access_token')?.value;
    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const tokenExpiration = payload.exp * 1000;

        if (this.needsRefresh(tokenExpiration)) {
          // Try to refresh the token
          const refreshToken = context.cookies.get('refresh_token')?.value;
          if (refreshToken) {
            try {
              const response = await fetch(`${context.url.origin}/api/auth/refresh`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
              });

              if (response.ok) {
                const data = await response.json();
                
                // Update cookies with new tokens
                context.cookies.set('access_token', data.accessToken, {
                  httpOnly: true,
                  secure: true,
                  sameSite: 'strict',
                  path: '/',
                  maxAge: 3600, // 1 hour
                });

                if (data.refreshToken) {
                  context.cookies.set('refresh_token', data.refreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'strict',
                    path: '/',
                    maxAge: 604800, // 7 days
                  });
                }
              }
            } catch (error) {
              console.error('Failed to refresh token:', error);
              // Clear invalid tokens
              context.cookies.delete('access_token', { path: '/' });
              context.cookies.delete('refresh_token', { path: '/' });
              return null;
            }
          }
        }
      } catch (error) {
        console.error('Failed to validate session:', error);
        return null;
      }
    }

    return user;
  }
}