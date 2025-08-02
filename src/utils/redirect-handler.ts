/**
 * Redirect handler utilities for post-authentication navigation
 * Handles secure redirects and prevents open redirect vulnerabilities
 */

/**
 * Validate if a redirect URL is safe
 */
export function isValidRedirectUrl(url: string, baseUrl: string): boolean {
  try {
    // Parse the URL
    const redirectUrl = new URL(url, baseUrl);
    const base = new URL(baseUrl);

    // Only allow same-origin redirects
    if (redirectUrl.origin !== base.origin) {
      return false;
    }

    // Prevent redirects to authentication pages to avoid loops
    const authPaths = ['/login', '/register', '/logout', '/auth'];
    if (authPaths.some(path => redirectUrl.pathname.startsWith(path))) {
      return false;
    }

    // Prevent redirects to API endpoints
    if (redirectUrl.pathname.startsWith('/api/')) {
      return false;
    }

    return true;
  } catch (error) {
    // Invalid URL
    return false;
  }
}

/**
 * Get redirect URL from query parameters
 */
export function getRedirectUrl(searchParams: URLSearchParams, baseUrl: string): string | null {
  const redirect = searchParams.get('redirect');
  
  if (!redirect) {
    return null;
  }

  // Decode the redirect URL
  const decodedRedirect = decodeURIComponent(redirect);
  
  // Validate the redirect URL
  if (isValidRedirectUrl(decodedRedirect, baseUrl)) {
    return decodedRedirect;
  }

  return null;
}

/**
 * Create a login URL with redirect parameter
 */
export function createLoginUrl(currentPath: string, loginPath: string = '/login'): string {
  const url = new URL(loginPath, window.location.origin);
  
  // Only add redirect if it's not already a login page
  if (!currentPath.startsWith('/login') && !currentPath.startsWith('/auth')) {
    url.searchParams.set('redirect', encodeURIComponent(currentPath));
  }
  
  return url.toString();
}

/**
 * Handle post-login redirect
 */
export function handlePostLoginRedirect(searchParams: URLSearchParams, defaultPath: string = '/'): void {
  const redirectUrl = getRedirectUrl(searchParams, window.location.origin);
  
  if (redirectUrl) {
    window.location.href = redirectUrl;
  } else {
    window.location.href = defaultPath;
  }
}

/**
 * Store intended destination before redirect to login
 */
export function storeIntendedDestination(path: string): void {
  if (typeof window !== 'undefined') {
    // Only store if it's a valid path and not an auth page
    if (path && !path.startsWith('/login') && !path.startsWith('/auth')) {
      sessionStorage.setItem('intended_destination', path);
    }
  }
}

/**
 * Get and clear stored intended destination
 */
export function getAndClearIntendedDestination(): string | null {
  if (typeof window !== 'undefined') {
    const destination = sessionStorage.getItem('intended_destination');
    if (destination) {
      sessionStorage.removeItem('intended_destination');
      
      // Validate the stored destination
      if (isValidRedirectUrl(destination, window.location.origin)) {
        return destination;
      }
    }
  }
  
  return null;
}

/**
 * Redirect with authentication check
 */
export function redirectWithAuth(path: string, requireAuth: boolean = true): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (requireAuth) {
    // Check if user is authenticated (this would integrate with your auth system)
    const isAuthenticated = checkAuthenticationStatus();
    
    if (!isAuthenticated) {
      // Store intended destination and redirect to login
      storeIntendedDestination(path);
      window.location.href = createLoginUrl(window.location.pathname);
      return;
    }
  }

  // Validate and redirect
  if (isValidRedirectUrl(path, window.location.origin)) {
    window.location.href = path;
  } else {
    console.warn('Invalid redirect URL:', path);
    window.location.href = '/';
  }
}

/**
 * Check authentication status (placeholder - integrate with your auth system)
 */
function checkAuthenticationStatus(): boolean {
  // This is a placeholder - you would integrate this with your actual auth system
  // For example, check for valid tokens, call an auth service, etc.
  
  if (typeof window !== 'undefined') {
    // Check for access token in localStorage as fallback
    const token = localStorage.getItem('auth_access_token');
    if (token) {
      try {
        // Simple JWT expiration check
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        return payload.exp > now;
      } catch (error) {
        return false;
      }
    }
  }
  
  return false;
}

/**
 * URL utilities for route protection
 */
export class RouteUtils {
  /**
   * Check if current route requires authentication
   */
  static requiresAuth(pathname: string): boolean {
    const protectedPaths = [
      '/admin',
      '/dashboard',
      '/profile',
      '/settings',
      '/cms',
      '/users',
    ];

    return protectedPaths.some(path => 
      pathname === path || pathname.startsWith(`${path}/`)
    );
  }

  /**
   * Check if current route is public
   */
  static isPublicRoute(pathname: string): boolean {
    const publicPaths = [
      '/',
      '/login',
      '/register',
      '/about',
      '/contact',
      '/tools',
      '/education',
      '/search',
      '/categories',
    ];

    // API auth routes are public
    if (pathname.startsWith('/api/auth/')) {
      return true;
    }

    return publicPaths.some(path => 
      pathname === path || pathname.startsWith(`${path}/`)
    );
  }

  /**
   * Get appropriate redirect URL based on user role
   */
  static getDefaultRedirectForRole(role: string): string {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'user':
        return '/dashboard';
      default:
        return '/';
    }
  }

  /**
   * Build URL with query parameters
   */
  static buildUrlWithParams(basePath: string, params: Record<string, string>): string {
    const url = new URL(basePath, window.location.origin);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });
    
    return url.toString();
  }
}

/**
 * Navigation guard for programmatic navigation
 */
export class NavigationGuard {
  private static instance: NavigationGuard;
  private guards: Array<(to: string, from: string) => boolean | string> = [];

  static getInstance(): NavigationGuard {
    if (!NavigationGuard.instance) {
      NavigationGuard.instance = new NavigationGuard();
    }
    return NavigationGuard.instance;
  }

  /**
   * Add a navigation guard
   */
  addGuard(guard: (to: string, from: string) => boolean | string): void {
    this.guards.push(guard);
  }

  /**
   * Remove a navigation guard
   */
  removeGuard(guard: (to: string, from: string) => boolean | string): void {
    const index = this.guards.indexOf(guard);
    if (index > -1) {
      this.guards.splice(index, 1);
    }
  }

  /**
   * Check if navigation is allowed
   */
  canNavigate(to: string, from: string = window.location.pathname): boolean | string {
    for (const guard of this.guards) {
      const result = guard(to, from);
      if (result !== true) {
        return result; // false or redirect URL
      }
    }
    return true;
  }

  /**
   * Navigate with guard checks
   */
  navigate(to: string): void {
    const from = window.location.pathname;
    const canNav = this.canNavigate(to, from);

    if (canNav === true) {
      window.location.href = to;
    } else if (typeof canNav === 'string') {
      // Redirect to guard-specified URL
      window.location.href = canNav;
    }
    // If canNav is false, navigation is blocked
  }
}

// Export singleton instance
export const navigationGuard = NavigationGuard.getInstance();