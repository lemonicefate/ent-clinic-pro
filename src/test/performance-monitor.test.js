/**
 * Performance Monitor Test Suite
 * 
 * Tests for the performance monitoring and analytics system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the web-vitals library
vi.mock('web-vitals', () => ({
  getCLS: vi.fn((callback) => callback({ name: 'CLS', value: 0.05, rating: 'good' })),
  getFID: vi.fn((callback) => callback({ name: 'FID', value: 50, rating: 'good' })),
  getFCP: vi.fn((callback) => callback({ name: 'FCP', value: 1200, rating: 'good' })),
  getLCP: vi.fn((callback) => callback({ name: 'LCP', value: 2000, rating: 'good' })),
  getTTFB: vi.fn((callback) => callback({ name: 'TTFB', value: 600, rating: 'good' })),
  getINP: vi.fn((callback) => callback({ name: 'INP', value: 150, rating: 'good' }))
}));

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock performance API
global.performance = {
  timing: {
    navigationStart: 1640995200000,
    loadEventEnd: 1640995203000,
    loadEventStart: 1640995202500,
    domContentLoadedEventEnd: 1640995202000,
    domContentLoadedEventStart: 1640995201500,
    responseStart: 1640995200800,
    requestStart: 1640995200200
  },
  getEntriesByType: vi.fn((type) => {
    if (type === 'navigation') {
      return [{
        loadEventEnd: 3000,
        loadEventStart: 2500,
        domContentLoadedEventEnd: 2000,
        domContentLoadedEventStart: 1500,
        responseStart: 800,
        requestStart: 200,
        transferSize: 50000
      }];
    }
    if (type === 'paint') {
      return [
        { name: 'first-paint', startTime: 1000 },
        { name: 'first-contentful-paint', startTime: 1200 }
      ];
    }
    if (type === 'resource') {
      return [
        { name: 'script.js', duration: 100, transferSize: 5000 },
        { name: 'style.css', duration: 50, transferSize: 3000 }
      ];
    }
    return [];
  }),
  now: vi.fn(() => Date.now())
};

// Mock navigator
global.navigator = {
  userAgent: 'Mozilla/5.0 (Test Browser)',
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false
  },
  sendBeacon: vi.fn(() => true)
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.sessionStorage = sessionStorageMock;

// Mock window and document
global.window = {
  location: {
    href: 'https://example.com/test',
    hostname: 'example.com',
    pathname: '/test'
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  performance: global.performance,
  navigator: global.navigator,
  localStorage: localStorageMock,
  sessionStorage: sessionStorageMock,
  setTimeout: vi.fn((fn) => fn()),
  clearTimeout: vi.fn(),
  setInterval: vi.fn(),
  clearInterval: vi.fn()
};

global.document = {
  title: 'Test Page',
  referrer: 'https://example.com/previous',
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 'complete',
  documentElement: {
    scrollHeight: 2000
  },
  body: {
    textContent: 'This is a test page with some content for word count calculation.'
  }
};

describe('Performance Monitor', () => {
  let PerformanceMonitor;
  let performanceMonitor;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Reset fetch mock
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    // Import the module after mocks are set up
    const module = await import('../utils/performance-monitor.ts');
    PerformanceMonitor = module.default;
    
    // Create a new instance for testing
    performanceMonitor = new PerformanceMonitor({
      isEnabled: true,
      apiEndpoint: '/api/analytics'
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create a performance monitor instance', () => {
      expect(performanceMonitor).toBeDefined();
      expect(performanceMonitor.getSessionId()).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it('should generate unique session IDs', () => {
      const monitor1 = new PerformanceMonitor();
      const monitor2 = new PerformanceMonitor();
      
      expect(monitor1.getSessionId()).not.toBe(monitor2.getSessionId());
    });

    it('should be disabled by default in test environment', () => {
      const monitor = new PerformanceMonitor();
      expect(monitor.isEnabled).toBeFalsy();
    });
  });

  describe('User ID Management', () => {
    it('should set and get user ID', () => {
      const userId = 'test-user-123';
      performanceMonitor.setUserId(userId);
      
      // We can't directly test the private userId, but we can test that it's used in events
      performanceMonitor.trackCustomEvent('test_event', { data: 'test' });
      
      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('Custom Event Tracking', () => {
    it('should track custom events', () => {
      const eventName = 'test_event';
      const eventData = { key: 'value', number: 123 };
      
      performanceMonitor.trackCustomEvent(eventName, eventData);
      
      // Should batch the event and eventually send it
      expect(performanceMonitor.pendingData).toBeDefined();
    });

    it('should track page views', () => {
      performanceMonitor.trackPageView();
      
      // Verify that the page view was tracked
      expect(fetch).toHaveBeenCalled();
    });

    it('should track user behavior events', () => {
      performanceMonitor.trackUserBehavior('click', {
        target: 'button',
        x: 100,
        y: 200
      });
      
      expect(fetch).toHaveBeenCalled();
    });

    it('should track content interactions', () => {
      performanceMonitor.trackContentInteraction('article-123', 'article', {
        event: 'view',
        specialty: 'cardiology'
      });
      
      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('Data Batching', () => {
    it('should batch events before sending', () => {
      // Track multiple events
      performanceMonitor.trackCustomEvent('event1', { data: 1 });
      performanceMonitor.trackCustomEvent('event2', { data: 2 });
      performanceMonitor.trackCustomEvent('event3', { data: 3 });
      
      // Should not have sent yet (batching)
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should send batch when size limit is reached', () => {
      // Set a small batch size for testing
      performanceMonitor.batchSize = 2;
      
      performanceMonitor.trackCustomEvent('event1', { data: 1 });
      performanceMonitor.trackCustomEvent('event2', { data: 2 });
      
      // Should send when batch size is reached
      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      fetch.mockRejectedValue(new Error('Network error'));
      
      performanceMonitor.trackCustomEvent('test_event', { data: 'test' });
      
      // Should not throw an error
      expect(() => {
        performanceMonitor.flushPendingData();
      }).not.toThrow();
    });

    it('should retry failed requests', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
      
      performanceMonitor.trackCustomEvent('test_event', { data: 'test' });
      
      // Should retry the request
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance Data Collection', () => {
    it('should collect basic performance metrics', () => {
      const perfData = performanceMonitor.collectPerformanceData();
      
      expect(perfData).toMatchObject({
        url: expect.any(String),
        timestamp: expect.any(Number),
        loadTime: expect.any(Number),
        domContentLoaded: expect.any(Number),
        firstPaint: expect.any(Number),
        firstContentfulPaint: expect.any(Number),
        timeToFirstByte: expect.any(Number),
        resourceCount: expect.any(Number),
        userAgent: expect.any(String)
      });
    });

    it('should collect SEO data', () => {
      // Mock DOM elements for SEO analysis
      document.querySelector.mockImplementation((selector) => {
        if (selector === 'meta[name="description"]') {
          return { getAttribute: () => 'Test description' };
        }
        if (selector === 'link[rel="canonical"]') {
          return { getAttribute: () => 'https://example.com/test' };
        }
        if (selector === 'meta[name="viewport"]') {
          return { getAttribute: () => 'width=device-width, initial-scale=1' };
        }
        return null;
      });

      document.querySelectorAll.mockImplementation((selector) => {
        if (selector === 'h1') return [{}];
        if (selector === 'h2') return [{}, {}];
        if (selector === 'img') return [{}, {}, {}];
        if (selector === 'img:not([alt])') return [{}];
        if (selector.includes('href^="/')) return [{}, {}];
        if (selector.includes('href^="http')) return [{}];
        if (selector === 'script[type="application/ld+json"]') return [{}];
        return [];
      });
      
      const seoData = performanceMonitor.collectSEOData();
      
      expect(seoData).toMatchObject({
        url: expect.any(String),
        timestamp: expect.any(Number),
        title: expect.any(String),
        metaDescription: expect.any(String),
        h1Count: expect.any(Number),
        h2Count: expect.any(Number),
        imageCount: expect.any(Number),
        imagesWithoutAlt: expect.any(Number),
        internalLinks: expect.any(Number),
        externalLinks: expect.any(Number),
        wordCount: expect.any(Number),
        loadTime: expect.any(Number),
        mobileUsability: expect.any(Boolean),
        structuredData: expect.any(Boolean)
      });
    });
  });

  describe('Enable/Disable Functionality', () => {
    it('should enable monitoring', () => {
      performanceMonitor.disable();
      performanceMonitor.enable();
      
      performanceMonitor.trackCustomEvent('test_event', { data: 'test' });
      expect(fetch).toHaveBeenCalled();
    });

    it('should disable monitoring', () => {
      performanceMonitor.disable();
      
      performanceMonitor.trackCustomEvent('test_event', { data: 'test' });
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should flush data when disabled', () => {
      performanceMonitor.trackCustomEvent('test_event', { data: 'test' });
      performanceMonitor.disable();
      
      expect(fetch).toHaveBeenCalled();
    });
  });
});

describe('Analytics API', () => {
  let analyticsModule;

  beforeEach(async () => {
    vi.clearAllMocks();
    analyticsModule = await import('../pages/api/analytics.ts');
  });

  describe('POST endpoint', () => {
    it('should accept valid analytics data', async () => {
      const validData = [
        {
          type: 'web_vitals',
          data: { name: 'LCP', value: 2000, rating: 'good' },
          timestamp: Date.now()
        }
      ];

      const request = new Request('http://localhost/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validData)
      });

      const response = await analyticsModule.POST({ request });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.processed).toBe(1);
    });

    it('should reject invalid data format', async () => {
      const invalidData = 'invalid json';

      const request = new Request('http://localhost/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: invalidData
      });

      const response = await analyticsModule.POST({ request });
      expect(response.status).toBe(500);
    });

    it('should handle rate limiting', async () => {
      const validData = [
        {
          type: 'test',
          data: { test: true },
          timestamp: Date.now()
        }
      ];

      const request = new Request('http://localhost/api/analytics', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify(validData)
      });

      // Make multiple requests to trigger rate limiting
      const responses = await Promise.all([
        ...Array(150).fill().map(() => analyticsModule.POST({ request }))
      ]);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('GET endpoint', () => {
    it('should return analytics summary', async () => {
      const url = new URL('http://localhost/api/analytics');
      const response = await analyticsModule.GET({ url });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('events');
      expect(result.summary).toHaveProperty('totalEvents');
      expect(result.summary).toHaveProperty('eventTypes');
    });

    it('should filter by event type', async () => {
      const url = new URL('http://localhost/api/analytics?type=web_vitals');
      const response = await analyticsModule.GET({ url });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.events.every(e => e.type === 'web_vitals')).toBe(true);
    });

    it('should limit results', async () => {
      const url = new URL('http://localhost/api/analytics?limit=5');
      const response = await analyticsModule.GET({ url });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.events.length).toBeLessThanOrEqual(5);
    });
  });
});

describe('Performance Initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should skip initialization on localhost', async () => {
    global.window.location.hostname = 'localhost';
    
    const { initPerformanceMonitoring } = await import('../scripts/performance-init.js');
    
    // Should not initialize on localhost
    expect(() => initPerformanceMonitoring()).not.toThrow();
  });

  it('should initialize on production domains', async () => {
    global.window.location.hostname = 'example.com';
    
    const { initPerformanceMonitoring } = await import('../scripts/performance-init.js');
    
    expect(() => initPerformanceMonitoring()).not.toThrow();
  });
});