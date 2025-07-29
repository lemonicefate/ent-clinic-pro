/**
 * Client-side authentication service for Astro Clinical Platform
 * Handles JWT tokens, secure storage, and authentication state management
 */

import React from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  permissions: string[];
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

/**
 * JWT token utilities
 */
export class JWTUtils {
  /**
   * Decode JWT payload without verification (client-side only)
   */
  static decodePayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Failed to decode JWT payload:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    const payload = this.decodePayload(token);
    if (!payload || !payload.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): number | null {
    const payload = this.decodePayload(token);
    return payload?.exp ? payload.exp * 1000 : null;
  }
}

/**
 * Secure token storage using HttpOnly cookies as primary method
 * with localStorage as fallback for development
 */
export class TokenStorage {
  private static readonly ACCESS_TOKEN_KEY = 'auth_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';
  private static readonly USER_KEY = 'auth_user';

  /**
   * Store authentication tokens securely
   */
  static async storeTokens(tokens: AuthToken): Promise<void> {
    // Only try HttpOnly cookies in browser environment
    if (typeof window !== 'undefined') {
      try {
        // Try to use HttpOnly cookies via API call
        const response = await fetch('/api/auth/store-tokens', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tokens),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to store tokens in HttpOnly cookies');
        }
      } catch (error) {
        console.warn('HttpOnly cookie storage failed, falling back to localStorage:', error);
        
        // Fallback to localStorage (less secure but functional)
        localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
        localStorage.setItem('token_expires_at', tokens.expiresAt.toString());
      }
    }
  }

  /**
   * Retrieve access token
   */
  static async getAccessToken(): Promise<string | null> {
    // Only try HttpOnly cookies in browser environment
    if (typeof window !== 'undefined') {
      try {
        // Try to get from HttpOnly cookies via API call
        const response = await fetch('/api/auth/get-token', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          return data.accessToken || null;
        }
      } catch (error) {
        console.warn('Failed to get token from HttpOnly cookies:', error);
      }

      // Fallback to localStorage
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }

    return null;
  }

  /**
   * Retrieve refresh token
   */
  static async getRefreshToken(): Promise<string | null> {
    // Only try HttpOnly cookies in browser environment
    if (typeof window !== 'undefined') {
      try {
        // Try to get from HttpOnly cookies via API call
        const response = await fetch('/api/auth/get-refresh-token', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          return data.refreshToken || null;
        }
      } catch (error) {
        console.warn('Failed to get refresh token from HttpOnly cookies:', error);
      }

      // Fallback to localStorage
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    return null;
  }

  /**
   * Clear all stored tokens
   */
  static async clearTokens(): Promise<void> {
    // Only try HttpOnly cookies in browser environment
    if (typeof window !== 'undefined') {
      try {
        // Clear HttpOnly cookies via API call
        await fetch('/api/auth/clear-tokens', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        console.warn('Failed to clear HttpOnly cookies:', error);
      }

      // Clear localStorage fallback
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem('token_expires_at');
      localStorage.removeItem(this.USER_KEY);
    }
  }

  /**
   * Store user information
   */
  static storeUser(user: AuthUser): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  /**
   * Retrieve user information
   */
  static getUser(): AuthUser | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(this.USER_KEY);
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch (error) {
          console.error('Failed to parse stored user data:', error);
          localStorage.removeItem(this.USER_KEY);
        }
      }
    }
    return null;
  }
}
/**
 
* Authentication service for managing user authentication state
 */
export class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null,
  };
  private listeners: ((state: AuthState) => void)[] = [];

  private constructor() {
    // Initialize authentication state on instantiation (only in browser)
    if (typeof window !== 'undefined') {
      this.initializeAuth();
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize authentication state from stored tokens
   */
  private async initializeAuth(): Promise<void> {
    this.setLoading(true);

    try {
      const accessToken = await TokenStorage.getAccessToken();
      const user = TokenStorage.getUser();

      if (accessToken && user && !JWTUtils.isTokenExpired(accessToken)) {
        this.authState = {
          isAuthenticated: true,
          user,
          loading: false,
          error: null,
        };
      } else if (accessToken && JWTUtils.isTokenExpired(accessToken)) {
        // Try to refresh the token
        await this.refreshToken();
      } else {
        this.authState = {
          isAuthenticated: false,
          user: null,
          loading: false,
          error: null,
        };
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      this.authState = {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: 'Failed to initialize authentication',
      };
    }

    this.notifyListeners();
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      const { accessToken, refreshToken, user } = data;

      // Store tokens securely
      await TokenStorage.storeTokens({
        accessToken,
        refreshToken,
        expiresAt: JWTUtils.getTokenExpiration(accessToken) || Date.now() + 3600000, // 1 hour fallback
      });

      // Store user information
      TokenStorage.storeUser(user);

      // Update auth state
      this.authState = {
        isAuthenticated: true,
        user,
        loading: false,
        error: null,
      };

      this.notifyListeners();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      this.setError(errorMessage);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Logout user and clear all tokens
   */
  async logout(): Promise<void> {
    this.setLoading(true);

    try {
      // Call logout endpoint to invalidate server-side session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.warn('Failed to call logout endpoint:', error);
    }

    // Clear all stored tokens and user data
    await TokenStorage.clearTokens();

    // Update auth state
    this.authState = {
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
    };

    this.notifyListeners();
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<void> {
    try {
      const refreshToken = await TokenStorage.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const { accessToken, refreshToken: newRefreshToken } = data;

      // Store new tokens
      await TokenStorage.storeTokens({
        accessToken,
        refreshToken: newRefreshToken || refreshToken,
        expiresAt: JWTUtils.getTokenExpiration(accessToken) || Date.now() + 3600000,
      });

      // Update auth state if user was previously authenticated
      if (this.authState.user) {
        this.authState = {
          ...this.authState,
          isAuthenticated: true,
          error: null,
        };
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout the user
      await this.logout();
      throw error;
    }
  }

  /**
   * Get current authentication state
   */
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  /**
   * Get current user
   */
  getCurrentUser(): AuthUser | null {
    return this.authState.user;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    return this.authState.user?.permissions.includes(permission) || false;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    return this.authState.user?.role === role;
  }

  /**
   * Subscribe to authentication state changes
   */
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get access token for API calls
   */
  async getAccessToken(): Promise<string | null> {
    const token = await TokenStorage.getAccessToken();
    
    if (token && JWTUtils.isTokenExpired(token)) {
      try {
        await this.refreshToken();
        return await TokenStorage.getAccessToken();
      } catch (error) {
        console.error('Failed to refresh expired token:', error);
        return null;
      }
    }
    
    return token;
  }

  /**
   * Create authenticated fetch wrapper
   */
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getAccessToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    // If we get a 401, try to refresh the token once
    if (response.status === 401 && !(options.headers as any)?.['X-Retry-Auth']) {
      try {
        await this.refreshToken();
        const newToken = await this.getAccessToken();
        
        if (newToken) {
          return await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${newToken}`,
              'X-Retry-Auth': 'true', // Prevent infinite retry loop
            },
            credentials: 'include',
          });
        }
      } catch (error) {
        console.error('Token refresh failed during authenticated fetch:', error);
      }
    }

    return response;
  }

  // Private helper methods
  private setLoading(loading: boolean): void {
    this.authState = { ...this.authState, loading };
    this.notifyListeners();
  }

  private setError(error: string | null): void {
    this.authState = { ...this.authState, error };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.authState));
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

/**
 * React hook for using authentication in components
 */
export function useAuth() {
  if (typeof window === 'undefined') {
    // Server-side rendering fallback
    return {
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
      login: async () => {},
      logout: async () => {},
      hasPermission: () => false,
      hasRole: () => false,
    };
  }

  const [authState, setAuthState] = React.useState<AuthState>(authService.getAuthState());

  React.useEffect(() => {
    const unsubscribe = authService.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  return {
    ...authState,
    login: authService.login.bind(authService),
    logout: authService.logout.bind(authService),
    hasPermission: authService.hasPermission.bind(authService),
    hasRole: authService.hasRole.bind(authService),
  };
}