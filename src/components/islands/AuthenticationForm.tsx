/**
 * Authentication form island component
 * Handles login/logout functionality with secure token management
 */

import React, { useState, useEffect } from 'react';
import { useAuth, type LoginCredentials } from '../../utils/auth';
import { getRedirectUrl, isValidRedirectUrl } from '../../utils/redirect-handler';
import CSRFToken, { useCSRFToken, secureRequest } from './CSRFToken';

interface AuthenticationFormProps {
  redirectUrl?: string;
  showRegister?: boolean;
}

export default function AuthenticationForm({ 
  redirectUrl = '/', 
  showRegister = false 
}: AuthenticationFormProps) {
  const { isAuthenticated, user, loading, error, login, logout } = useAuth();
  const { token: csrfToken, loading: csrfLoading, refreshToken: refreshCSRF } = useCSRFToken();
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);

  // Rate limiting: lock after 5 failed attempts for 15 minutes
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  useEffect(() => {
    // Check if user is locked out
    const storedAttempts = localStorage.getItem('login_attempts');
    const storedLockout = localStorage.getItem('lockout_time');
    
    if (storedAttempts && storedLockout) {
      const attempts = parseInt(storedAttempts);
      const lockout = parseInt(storedLockout);
      
      if (attempts >= MAX_LOGIN_ATTEMPTS && Date.now() < lockout) {
        setIsLocked(true);
        setLockoutTime(lockout);
        setLoginAttempts(attempts);
      } else if (Date.now() >= lockout) {
        // Lockout expired, reset
        localStorage.removeItem('login_attempts');
        localStorage.removeItem('lockout_time');
        setIsLocked(false);
        setLockoutTime(null);
        setLoginAttempts(0);
      }
    }
  }, []);

  useEffect(() => {
    // Update lockout timer
    if (isLocked && lockoutTime) {
      const timer = setInterval(() => {
        if (Date.now() >= lockoutTime) {
          setIsLocked(false);
          setLockoutTime(null);
          setLoginAttempts(0);
          localStorage.removeItem('login_attempts');
          localStorage.removeItem('lockout_time');
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isLocked, lockoutTime]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      return;
    }

    if (!formData.email || !formData.password) {
      return;
    }

    try {
      await login(formData);
      
      // Reset login attempts on successful login
      setLoginAttempts(0);
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('lockout_time');
      
      // Handle post-login redirect safely
      const urlParams = new URLSearchParams(window.location.search);
      const safeRedirectUrl = getRedirectUrl(urlParams, window.location.origin);
      
      if (safeRedirectUrl) {
        window.location.href = safeRedirectUrl;
      } else if (redirectUrl && redirectUrl !== '/' && isValidRedirectUrl(redirectUrl, window.location.origin)) {
        window.location.href = redirectUrl;
      } else {
        // Default redirect based on user role
        const defaultPath = user?.role === 'admin' ? '/admin' : '/';
        window.location.href = defaultPath;
      }
    } catch (error) {
      // Increment login attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('login_attempts', newAttempts.toString());
      
      // Lock account if max attempts reached
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockout = Date.now() + LOCKOUT_DURATION;
        setIsLocked(true);
        setLockoutTime(lockout);
        localStorage.setItem('lockout_time', lockout.toString());
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getRemainingLockoutTime = (): string => {
    if (!lockoutTime) return '';
    
    const remaining = Math.max(0, lockoutTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // If user is already authenticated, show user info and logout option
  if (isAuthenticated && user) {
    return (
      <div className="auth-container authenticated">
        <div className="user-info">
          <div className="user-avatar">
            <span className="avatar-text">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="user-details">
            <h3 className="user-name">{user.name}</h3>
            <p className="user-email">{user.email}</p>
            <span className={`user-role role-${user.role}`}>
              {user.role === 'admin' ? '管理員' : '使用者'}
            </span>
          </div>
        </div>
        
        <div className="auth-actions">
          <button
            onClick={handleLogout}
            disabled={loading}
            className="btn btn-secondary logout-btn"
          >
            {loading ? '登出中...' : '登出'}
          </button>
        </div>
      </div>
    );
  }

  // Login form
  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <div className="auth-header">
          <h2 className="auth-title">醫療平台登入</h2>
          <p className="auth-subtitle">請輸入您的帳號密碼以存取管理功能</p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {isLocked && (
          <div className="alert alert-warning" role="alert">
            <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            帳號已被鎖定，請等待 {getRemainingLockoutTime()} 後再試
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* CSRF Protection */}
          <CSRFToken />
          
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              電子郵件
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading || isLocked}
              required
              className="form-input"
              placeholder="請輸入您的電子郵件"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              密碼
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading || isLocked}
                required
                className="form-input"
                placeholder="請輸入您的密碼"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
                disabled={loading || isLocked}
                aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
              >
                {showPassword ? (
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                ) : (
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading || isLocked}
                className="checkbox-input"
              />
              <span className="checkbox-text">記住我</span>
            </label>
          </div>

          {loginAttempts > 0 && loginAttempts < MAX_LOGIN_ATTEMPTS && (
            <div className="login-attempts-warning">
              登入失敗 {loginAttempts} 次，剩餘 {MAX_LOGIN_ATTEMPTS - loginAttempts} 次機會
            </div>
          )}

          <button
            type="submit"
            disabled={loading || isLocked || !formData.email || !formData.password || csrfLoading}
            className="btn btn-primary auth-submit"
          >
            {loading ? (
              <>
                <svg className="loading-spinner" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                登入中...
              </>
            ) : (
              '登入'
            )}
          </button>
        </form>

        {showRegister && (
          <div className="auth-footer">
            <p className="auth-footer-text">
              還沒有帳號？
              <a href="/register" className="auth-link">
                立即註冊
              </a>
            </p>
          </div>
        )}

        <div className="auth-security-notice">
          <p className="security-text">
            <svg className="security-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            您的登入資訊將透過安全加密連線傳輸
          </p>
        </div>
      </div>
    </div>
  );
}