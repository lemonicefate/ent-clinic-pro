/**
 * Client-side Route Guard Component
 * Provides additional client-side protection and session validation
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../utils/auth';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  fallbackUrl?: string;
  showLoader?: boolean;
  className?: string;
}

export default function RouteGuard({
  children,
  requireAuth = true,
  requiredRoles = [],
  requiredPermissions = [],
  fallbackUrl = '/login',
  showLoader = true,
  className = '',
}: RouteGuardProps) {
  const { isAuthenticated, user, loading, hasRole, hasPermission } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [deniedReason, setDeniedReason] = useState('');

  useEffect(() => {
    // Don't check access while still loading
    if (loading) {
      return;
    }

    // Check authentication requirements
    if (requireAuth && !isAuthenticated) {
      setShouldRedirect(true);
      return;
    }

    // Check role requirements
    if (requiredRoles.length > 0 && user) {
      const hasRequiredRole = requiredRoles.some(role => hasRole(role));
      if (!hasRequiredRole) {
        setAccessDenied(true);
        setDeniedReason(`需要以下角色之一: ${requiredRoles.join(', ')}`);
        return;
      }
    }

    // Check permission requirements
    if (requiredPermissions.length > 0 && user) {
      const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission));
      if (!hasAllPermissions) {
        setAccessDenied(true);
        setDeniedReason(`需要以下權限: ${requiredPermissions.join(', ')}`);
        return;
      }
    }

    // All checks passed
    setAccessDenied(false);
    setShouldRedirect(false);
  }, [isAuthenticated, user, loading, requiredRoles, requiredPermissions, requireAuth, hasRole, hasPermission]);

  // Handle redirect
  useEffect(() => {
    if (shouldRedirect) {
      const currentPath = window.location.pathname;
      const redirectUrl = `${fallbackUrl}${fallbackUrl.includes('?') ? '&' : '?'}redirect=${encodeURIComponent(currentPath)}`;
      window.location.href = redirectUrl;
    }
  }, [shouldRedirect, fallbackUrl]);

  // Show loading state
  if (loading && showLoader) {
    return (
      <div className={`route-guard loading ${className}`}>
        <div className="loading-container">
          <div className="loading-spinner">
            <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="loading-text">驗證中...</p>
        </div>
      </div>
    );
  }

  // Show access denied
  if (accessDenied) {
    return (
      <div className={`route-guard access-denied ${className}`}>
        <div className="access-denied-container">
          <svg className="access-denied-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd"/>
          </svg>
          
          <h2 className="access-denied-title">存取被拒絕</h2>
          <p className="access-denied-message">{deniedReason}</p>
          
          <div className="access-denied-actions">
            {user && (
              <div className="current-user-info">
                <p>目前使用者: {user.name} ({user.role})</p>
                <p>權限: {user.permissions.join(', ')}</p>
              </div>
            )}
            
            <div className="action-buttons">
              <button
                onClick={() => window.location.href = '/'}
                className="btn btn-secondary"
              >
                返回首頁
              </button>
              
              {!isAuthenticated && (
                <button
                  onClick={() => window.location.href = fallbackUrl}
                  className="btn btn-primary"
                >
                  登入
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if redirecting
  if (shouldRedirect) {
    return null;
  }

  // Render protected content
  return (
    <div className={`route-guard protected ${className}`}>
      {children}
    </div>
  );
}

// CSS styles (would typically be in a separate CSS file)
const styles = `
  .route-guard {
    width: 100%;
  }

  .route-guard.loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .loading-spinner {
    width: 2rem;
    height: 2rem;
    color: #3b82f6;
  }

  .loading-spinner svg {
    width: 100%;
    height: 100%;
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .loading-text {
    color: #6b7280;
    font-size: 0.875rem;
    margin: 0;
  }

  .route-guard.access-denied {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    padding: 2rem;
  }

  .access-denied-container {
    text-align: center;
    max-width: 500px;
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }

  .access-denied-icon {
    width: 4rem;
    height: 4rem;
    color: #ef4444;
    margin-bottom: 1.5rem;
  }

  .access-denied-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 1rem;
  }

  .access-denied-message {
    color: #6b7280;
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .access-denied-actions {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .current-user-info {
    padding: 1rem;
    background-color: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  .current-user-info p {
    margin: 0.25rem 0;
    font-size: 0.875rem;
    color: #4b5563;
  }

  .action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    text-decoration: none;
    min-height: 44px;
  }

  .btn-primary {
    background-color: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background-color: #2563eb;
  }

  .btn-secondary {
    background-color: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover {
    background-color: #e5e7eb;
  }

  @media (max-width: 640px) {
    .access-denied-container {
      padding: 1.5rem;
      margin: 1rem;
    }

    .access-denied-icon {
      width: 3rem;
      height: 3rem;
    }

    .access-denied-title {
      font-size: 1.25rem;
    }

    .action-buttons {
      flex-direction: column;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}