/**
 * CSRF Token component for form protection
 * Automatically includes CSRF token in forms and AJAX requests
 */

import React, { useEffect, useState } from 'react';

interface CSRFTokenProps {
  /**
   * Whether to render as hidden input field (for forms)
   */
  asInput?: boolean;
  /**
   * Custom session ID (optional)
   */
  sessionId?: string;
  /**
   * Callback when token is loaded
   */
  onTokenLoaded?: (token: string) => void;
}

/**
 * CSRF Token component
 * Fetches and manages CSRF tokens for secure form submissions
 */
export default function CSRFToken({ 
  asInput = true, 
  sessionId,
  onTokenLoaded 
}: CSRFTokenProps) {
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCSRFToken();
  }, [sessionId]);

  const fetchCSRFToken = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/csrf-token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId && { 'X-Session-ID': sessionId }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }

      const data = await response.json();
      const csrfToken = data.token;

      setToken(csrfToken);
      onTokenLoaded?.(csrfToken);
    } catch (err) {
      console.error('Failed to fetch CSRF token:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch CSRF token');
    } finally {
      setLoading(false);
    }
  };

  // Refresh token function (can be called externally)
  const refreshToken = () => {
    fetchCSRFToken();
  };

  // Expose refresh function globally for forms
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshCSRFToken = refreshToken;
    }
  }, []);

  if (loading) {
    return asInput ? (
      <input type="hidden" name="_csrf_token" value="" disabled />
    ) : (
      <span className="csrf-loading">Loading security token...</span>
    );
  }

  if (error) {
    return asInput ? (
      <input type="hidden" name="_csrf_token" value="" disabled />
    ) : (
      <span className="csrf-error text-red-500 text-sm">
        Security token error: {error}
      </span>
    );
  }

  if (asInput) {
    return (
      <input 
        type="hidden" 
        name="_csrf_token" 
        value={token}
        data-csrf-token={token}
      />
    );
  }

  return (
    <div className="csrf-token-info text-xs text-gray-500">
      Security token loaded
      <button 
        type="button"
        onClick={refreshToken}
        className="ml-2 text-blue-500 hover:text-blue-700"
        title="Refresh security token"
      >
        ↻
      </button>
    </div>
  );
}

/**
 * Hook for using CSRF token in React components
 */
export function useCSRFToken(sessionId?: string) {
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/csrf-token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId && { 'X-Session-ID': sessionId }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }

      const data = await response.json();
      setToken(data.token);
    } catch (err) {
      console.error('Failed to fetch CSRF token:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch CSRF token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();
  }, [sessionId]);

  return {
    token,
    loading,
    error,
    refreshToken: fetchToken,
  };
}

/**
 * Utility function to add CSRF token to fetch requests
 */
export function addCSRFToRequest(
  url: string, 
  options: RequestInit = {}, 
  token?: string
): RequestInit {
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('X-CSRF-Token', token);
  } else {
    // Try to get token from hidden input
    const tokenInput = document.querySelector('input[name="_csrf_token"]') as HTMLInputElement;
    if (tokenInput?.value) {
      headers.set('X-CSRF-Token', tokenInput.value);
    }
  }

  return {
    ...options,
    headers,
    credentials: 'include',
  };
}

/**
 * Enhanced fetch function with automatic CSRF token inclusion
 */
export async function secureRequest(
  url: string,
  options: RequestInit = {},
  csrfToken?: string
): Promise<Response> {
  const secureOptions = addCSRFToRequest(url, options, csrfToken);
  
  try {
    const response = await fetch(url, secureOptions);
    
    // If CSRF validation fails, try to refresh token and retry once
    if (response.status === 403 && !options.headers?.['X-Retry-CSRF']) {
      try {
        // Refresh CSRF token
        const tokenResponse = await fetch('/api/auth/csrf-token', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          const newToken = tokenData.token;
          
          // Retry with new token
          const retryOptions = addCSRFToRequest(url, {
            ...options,
            headers: {
              ...options.headers,
              'X-Retry-CSRF': 'true',
            },
          }, newToken);
          
          return await fetch(url, retryOptions);
        }
      } catch (retryError) {
        console.error('Failed to refresh CSRF token:', retryError);
      }
    }
    
    return response;
  } catch (error) {
    console.error('Secure request failed:', error);
    throw error;
  }
}