/**
 * Performance Monitoring Initialization Script
 * 
 * This script initializes the performance monitoring system on all pages
 * and should be included in the main layout
 */

import { performanceMonitor } from '../utils/performance-monitor.ts';

// Initialize performance monitoring when DOM is ready
function initPerformanceMonitoring() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return;

  // Skip monitoring on localhost and development environments
  if (window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('dev.')) {
    console.log('Performance monitoring disabled in development environment');
    return;
  }

  // Initialize the performance monitor
  try {
    // Set user ID if available (from authentication system)
    const userId = getUserId();
    if (userId) {
      performanceMonitor.setUserId(userId);
    }

    // Track custom events based on page type
    trackPageSpecificEvents();

    // Set up error tracking
    setupErrorTracking();

    // Set up unhandled promise rejection tracking
    setupPromiseRejectionTracking();

    // Track page visibility changes
    setupVisibilityTracking();

    // Track connection changes
    setupConnectionTracking();

    console.log('Performance monitoring initialized successfully');

  } catch (error) {
    console.error('Failed to initialize performance monitoring:', error);
  }
}

function getUserId() {
  // Try to get user ID from various sources
  // This would depend on your authentication system
  
  // Check localStorage
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return user.id || user.userId;
    } catch (e) {
      // Invalid JSON, ignore
    }
  }

  // Check sessionStorage
  const sessionUser = sessionStorage.getItem('user');
  if (sessionUser) {
    try {
      const user = JSON.parse(sessionUser);
      return user.id || user.userId;
    } catch (e) {
      // Invalid JSON, ignore
    }
  }

  // Check for user data in meta tags
  const userMeta = document.querySelector('meta[name="user-id"]');
  if (userMeta) {
    return userMeta.getAttribute('content');
  }

  // Generate anonymous user ID
  let anonymousId = localStorage.getItem('anonymous_user_id');
  if (!anonymousId) {
    anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('anonymous_user_id', anonymousId);
  }
  
  return anonymousId;
}

function trackPageSpecificEvents() {
  const path = window.location.pathname;
  
  // Track calculator usage
  if (path.includes('calculator')) {
    trackCalculatorEvents();
  }
  
  // Track education content
  if (path.includes('education')) {
    trackEducationContentEvents();
  }
  
  // Track specialty pages
  if (path.includes('specialties')) {
    trackSpecialtyPageEvents();
  }
  
  // Track search functionality
  if (path.includes('search')) {
    trackSearchEvents();
  }
}

function trackCalculatorEvents() {
  // Track calculator form submissions
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (form.classList.contains('calculator-form') || 
        form.querySelector('.calculator-input')) {
      
      const calculatorType = form.dataset.calculatorType || 
                           document.title.toLowerCase().replace(/\s+/g, '_');
      
      performanceMonitor.trackCustomEvent('calculator_used', {
        calculatorType,
        formId: form.id,
        inputCount: form.querySelectorAll('input, select').length
      });
    }
  });

  // Track calculator input interactions
  document.addEventListener('input', (event) => {
    const input = event.target;
    if (input.closest('.calculator-form') || input.classList.contains('calculator-input')) {
      performanceMonitor.trackCustomEvent('calculator_input_change', {
        inputName: input.name,
        inputType: input.type,
        hasValue: !!input.value
      });
    }
  });
}

function trackEducationContentEvents() {
  // Track reading progress
  let readingStartTime = Date.now();
  let maxScrollDepth = 0;
  
  window.addEventListener('scroll', () => {
    const scrollDepth = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );
    
    if (scrollDepth > maxScrollDepth) {
      maxScrollDepth = scrollDepth;
      
      // Track reading milestones
      if (scrollDepth >= 25 && scrollDepth < 50) {
        performanceMonitor.trackCustomEvent('reading_milestone', {
          milestone: '25_percent',
          timeToReach: Date.now() - readingStartTime
        });
      } else if (scrollDepth >= 50 && scrollDepth < 75) {
        performanceMonitor.trackCustomEvent('reading_milestone', {
          milestone: '50_percent',
          timeToReach: Date.now() - readingStartTime
        });
      } else if (scrollDepth >= 75 && scrollDepth < 100) {
        performanceMonitor.trackCustomEvent('reading_milestone', {
          milestone: '75_percent',
          timeToReach: Date.now() - readingStartTime
        });
      } else if (scrollDepth >= 100) {
        performanceMonitor.trackCustomEvent('reading_milestone', {
          milestone: '100_percent',
          timeToReach: Date.now() - readingStartTime
        });
      }
    }
  });

  // Track content sharing
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (target.classList.contains('share-button') || 
        target.closest('.share-button')) {
      
      const shareType = target.dataset.shareType || 'unknown';
      performanceMonitor.trackCustomEvent('content_shared', {
        shareType,
        contentTitle: document.title,
        contentUrl: window.location.href
      });
    }
  });

  // Track print actions
  window.addEventListener('beforeprint', () => {
    performanceMonitor.trackCustomEvent('content_printed', {
      contentTitle: document.title,
      contentUrl: window.location.href
    });
  });
}

function trackSpecialtyPageEvents() {
  // Track specialty navigation
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (link && link.href.includes('/specialties/')) {
      const specialty = link.href.split('/specialties/')[1]?.split('/')[0];
      if (specialty) {
        performanceMonitor.trackCustomEvent('specialty_navigation', {
          specialty,
          fromPage: window.location.pathname
        });
      }
    }
  });

  // Track specialty content filtering
  document.addEventListener('change', (event) => {
    const select = event.target;
    if (select.classList.contains('specialty-filter') || 
        select.name === 'specialty') {
      
      performanceMonitor.trackCustomEvent('specialty_filter_used', {
        selectedSpecialty: select.value,
        filterType: select.name || select.className
      });
    }
  });
}

function trackSearchEvents() {
  // Track search queries
  document.addEventListener('submit', (event) => {
    const form = event.target;
    const searchInput = form.querySelector('input[type="search"], input[name*="search"], input[name*="query"]');
    
    if (searchInput && searchInput.value) {
      performanceMonitor.trackCustomEvent('search_performed', {
        query: searchInput.value,
        queryLength: searchInput.value.length,
        searchType: form.dataset.searchType || 'general'
      });
    }
  });

  // Track search result interactions
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (link && link.closest('.search-results')) {
      const resultIndex = Array.from(link.closest('.search-results').querySelectorAll('a')).indexOf(link);
      
      performanceMonitor.trackCustomEvent('search_result_clicked', {
        resultIndex,
        resultUrl: link.href,
        resultTitle: link.textContent?.substring(0, 100)
      });
    }
  });
}

function setupErrorTracking() {
  // Track JavaScript errors
  window.addEventListener('error', (event) => {
    performanceMonitor.trackCustomEvent('javascript_error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack?.substring(0, 500),
      userAgent: navigator.userAgent
    });
  });

  // Track resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      performanceMonitor.trackCustomEvent('resource_error', {
        tagName: event.target.tagName,
        src: event.target.src || event.target.href,
        type: event.target.type,
        currentSrc: event.target.currentSrc
      });
    }
  }, true);
}

function setupPromiseRejectionTracking() {
  window.addEventListener('unhandledrejection', (event) => {
    performanceMonitor.trackCustomEvent('unhandled_promise_rejection', {
      reason: event.reason?.toString?.() || 'Unknown reason',
      stack: event.reason?.stack?.substring(0, 500),
      type: typeof event.reason
    });
  });
}

function setupVisibilityTracking() {
  let visibilityStartTime = Date.now();
  let isVisible = !document.hidden;

  document.addEventListener('visibilitychange', () => {
    const now = Date.now();
    
    if (document.hidden && isVisible) {
      // Page became hidden
      const visibleDuration = now - visibilityStartTime;
      performanceMonitor.trackCustomEvent('page_hidden', {
        visibleDuration,
        url: window.location.href
      });
      isVisible = false;
    } else if (!document.hidden && !isVisible) {
      // Page became visible
      performanceMonitor.trackCustomEvent('page_visible', {
        hiddenDuration: now - visibilityStartTime,
        url: window.location.href
      });
      visibilityStartTime = now;
      isVisible = true;
    }
  });
}

function setupConnectionTracking() {
  // Track connection changes
  if ('connection' in navigator) {
    const connection = navigator.connection;
    
    // Track initial connection info
    performanceMonitor.trackCustomEvent('connection_info', {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    });

    // Track connection changes
    connection.addEventListener('change', () => {
      performanceMonitor.trackCustomEvent('connection_changed', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      });
    });
  }
}

// Track page load completion
window.addEventListener('load', () => {
  performanceMonitor.trackCustomEvent('page_load_complete', {
    url: window.location.href,
    title: document.title,
    loadTime: Date.now() - performance.timing.navigationStart,
    domElements: document.querySelectorAll('*').length,
    images: document.querySelectorAll('img').length,
    scripts: document.querySelectorAll('script').length,
    stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length
  });
});

// Track beforeunload for session duration
window.addEventListener('beforeunload', () => {
  const sessionDuration = Date.now() - performance.timing.navigationStart;
  performanceMonitor.trackCustomEvent('session_end', {
    sessionDuration,
    url: window.location.href,
    pageViews: parseInt(sessionStorage.getItem('pageViews') || '1')
  });
});

// Track page views
let pageViews = parseInt(sessionStorage.getItem('pageViews') || '0') + 1;
sessionStorage.setItem('pageViews', pageViews.toString());

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPerformanceMonitoring);
} else {
  initPerformanceMonitoring();
}

// Export for manual initialization if needed
export { initPerformanceMonitoring };