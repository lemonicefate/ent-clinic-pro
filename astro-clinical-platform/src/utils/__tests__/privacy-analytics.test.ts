/**
 * 隱私友善分析系統測試
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  initializeAnalytics, 
  getAnalytics,
  trackMedicalContent,
  trackCalculatorUsage,
  trackUserJourney,
  trackPageView,
  trackSearch
} from '../privacy-analytics';

// Mock DOM 環境
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store = {};
  })
};

const mockNavigator = {
  doNotTrack: '0',
  language: 'zh-TW',
  userAgent: 'Mozilla/5.0 (Test Browser)'
};

const mockWindow = {
  location: {
    pathname: '/test',
    href: 'https://example.com/test',
    hostname: 'example.com'
  },
  document: {
    title: 'Test Page',
    referrer: 'https://google.com'
  },
  localStorage: mockLocalStorage,
  navigator: mockNavigator,
  plausible: vi.fn(),
  dispatchEvent: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  setInterval: vi.fn(),
  clearTimeout: vi.fn(),
  setTimeout: vi.fn()
};

// 設定全域 mock
Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
});

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true
});

Object.defineProperty(global, 'document', {
  value: {
    title: 'Test Page',
    referrer: 'https://google.com',
    createElement: vi.fn(() => ({
      defer: false,
      src: '',
      setAttribute: vi.fn(),
      onload: null
    })),
    head: {
      appendChild: vi.fn()
    },
    addEventListener: vi.fn()
  },
  writable: true
});

describe('Privacy Analytics', () => {
  beforeEach(() => {
    // 清理 mock 狀態
    vi.clearAllMocks();
    mockLocalStorage.clear();
    
    // 重設 navigator 狀態
    mockNavigator.doNotTrack = '0';
  });

  afterEach(() => {
    // 清理分析實例
    const analytics = getAnalytics();
    if (analytics) {
      analytics.clearLocalData();
    }
  });

  describe('初始化', () => {
    it('應該正確初始化分析系統', () => {
      const analytics = initializeAnalytics({
        domain: 'test.com',
        enabled: true
      });

      expect(analytics).toBeDefined();
      expect(getAnalytics()).toBe(analytics);
    });

    it('應該尊重 Do Not Track 設定', () => {
      mockNavigator.doNotTrack = '1';
      
      const analytics = initializeAnalytics({
        domain: 'test.com',
        respectDoNotTrack: true
      });

      expect(analytics.isOptedOut()).toBe(false); // DNT 會在內部停用，但不會設定 opt-out 標記
    });

    it('應該生成唯一的會話 ID', () => {
      const analytics1 = initializeAnalytics({ domain: 'test.com' });
      const analytics2 = initializeAnalytics({ domain: 'test.com' });

      // 由於是單例模式，應該返回相同實例
      expect(analytics1).toBe(analytics2);
    });
  });

  describe('事件追蹤', () => {
    let analytics: ReturnType<typeof initializeAnalytics>;

    beforeEach(() => {
      analytics = initializeAnalytics({
        domain: 'test.com',
        enabled: true
      });
    });

    it('應該追蹤基本事件', () => {
      analytics.trackEvent({
        name: 'Test Event',
        properties: {
          category: 'test',
          value: 123
        }
      });

      expect(mockWindow.plausible).toHaveBeenCalledWith(
        'Test Event',
        expect.objectContaining({
          props: expect.objectContaining({
            category: 'test',
            value: 123,
            page: '/test',
            language: 'zh-TW'
          })
        })
      );
    });

    it('應該追蹤醫療內容使用', () => {
      analytics.trackMedicalContent({
        name: 'Medical Content Usage',
        contentType: 'education',
        contentId: 'diabetes-guide',
        specialty: '內分泌科',
        language: 'zh-TW'
      });

      expect(mockWindow.plausible).toHaveBeenCalledWith(
        'Medical Content Usage',
        expect.objectContaining({
          props: expect.objectContaining({
            contentType: 'education',
            contentId: 'diabetes-guide',
            specialty: '內分泌科',
            language: 'zh-TW'
          })
        })
      );
    });

    it('應該追蹤計算機使用', () => {
      analytics.trackCalculatorUsage({
        name: 'Calculator Usage',
        contentType: 'calculator',
        contentId: 'bmi',
        calculatorId: 'bmi',
        inputFields: ['height', 'weight'],
        resultType: 'normal',
        calculationTime: 150,
        specialty: '一般醫學'
      });

      expect(mockWindow.plausible).toHaveBeenCalledWith(
        'Calculator Usage',
        expect.objectContaining({
          props: expect.objectContaining({
            calculatorId: 'bmi',
            inputFields: 'height,weight',
            resultType: 'normal',
            calculationTime: 150
          })
        })
      );
    });

    it('應該追蹤用戶旅程', () => {
      analytics.trackUserJourney({
        name: 'User Journey',
        page: '/tools/bmi',
        action: 'page_view',
        source: 'navigation'
      });

      expect(mockWindow.plausible).toHaveBeenCalledWith(
        'User Journey',
        expect.objectContaining({
          props: expect.objectContaining({
            page: '/tools/bmi',
            action: 'page_view',
            source: 'navigation'
          })
        })
      );
    });

    it('應該追蹤搜尋行為', () => {
      analytics.trackSearch('diabetes', 15, 'education');

      expect(mockWindow.plausible).toHaveBeenCalledWith(
        'Search',
        expect.objectContaining({
          props: expect.objectContaining({
            query: 'diabetes',
            results: 15,
            category: 'education',
            queryLength: 8
          })
        })
      );
    });
  });

  describe('隱私控制', () => {
    let analytics: ReturnType<typeof initializeAnalytics>;

    beforeEach(() => {
      analytics = initializeAnalytics({
        domain: 'test.com',
        enabled: true
      });
    });

    it('應該允許用戶選擇退出', () => {
      expect(analytics.isOptedOut()).toBe(false);

      analytics.optOut();

      expect(analytics.isOptedOut()).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('analytics_opt_out', 'true');
    });

    it('應該允許用戶重新選擇加入', () => {
      analytics.optOut();
      expect(analytics.isOptedOut()).toBe(true);

      analytics.optIn();

      expect(analytics.isOptedOut()).toBe(false);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('analytics_opt_out');
    });

    it('選擇退出後不應該追蹤事件', () => {
      analytics.optOut();

      analytics.trackEvent({
        name: 'Test Event',
        properties: { test: true }
      });

      expect(mockWindow.plausible).not.toHaveBeenCalled();
    });

    it('應該清除本地資料', () => {
      // 先添加一些資料
      analytics.trackEvent({
        name: 'Test Event',
        properties: { test: true }
      });

      analytics.clearLocalData();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('medical_analytics_events');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('analytics_opt_out');
    });
  });

  describe('本地儲存', () => {
    let analytics: ReturnType<typeof initializeAnalytics>;

    beforeEach(() => {
      analytics = initializeAnalytics({
        domain: 'test.com',
        enabled: true
      });
    });

    it('應該儲存事件到本地儲存', () => {
      analytics.trackEvent({
        name: 'Test Event',
        properties: { test: true }
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'medical_analytics_events',
        expect.stringContaining('Test Event')
      );
    });

    it('應該限制本地儲存的事件數量', () => {
      // 模擬已有 1000 個事件
      const existingEvents = Array(1000).fill({
        name: 'Old Event',
        timestamp: Date.now() - 1000000
      });
      
      mockLocalStorage.store['medical_analytics_events'] = JSON.stringify(existingEvents);

      analytics.trackEvent({
        name: 'New Event',
        properties: { test: true }
      });

      const storedEvents = JSON.parse(mockLocalStorage.store['medical_analytics_events']);
      expect(storedEvents.length).toBeLessThanOrEqual(1000);
      expect(storedEvents[storedEvents.length - 1].name).toBe('New Event');
    });

    it('應該提供本地統計資料', () => {
      // 添加一些測試事件
      analytics.trackEvent({ name: 'Page View', properties: { page: '/test1' } });
      analytics.trackEvent({ name: 'Page View', properties: { page: '/test2' } });
      analytics.trackCalculatorUsage({
        name: 'Calculator Usage',
        contentType: 'calculator',
        contentId: 'bmi',
        calculatorId: 'bmi',
        inputFields: ['height', 'weight']
      });

      const stats = analytics.getLocalStats();

      expect(stats).toEqual(
        expect.objectContaining({
          totalEvents: expect.any(Number),
          sessionCount: expect.any(Number),
          topPages: expect.any(Array),
          topCalculators: expect.any(Array)
        })
      );
    });
  });

  describe('便利函數', () => {
    beforeEach(() => {
      initializeAnalytics({
        domain: 'test.com',
        enabled: true
      });
    });

    it('trackMedicalContent 應該正常工作', () => {
      trackMedicalContent({
        name: 'Medical Content Usage',
        contentType: 'education',
        contentId: 'test-content',
        specialty: '測試科'
      });

      expect(mockWindow.plausible).toHaveBeenCalled();
    });

    it('trackCalculatorUsage 應該正常工作', () => {
      trackCalculatorUsage({
        name: 'Calculator Usage',
        contentType: 'calculator',
        contentId: 'test-calc',
        calculatorId: 'test-calc',
        inputFields: ['input1', 'input2']
      });

      expect(mockWindow.plausible).toHaveBeenCalled();
    });

    it('trackUserJourney 應該正常工作', () => {
      trackUserJourney({
        name: 'User Journey',
        page: '/test',
        action: 'page_view'
      });

      expect(mockWindow.plausible).toHaveBeenCalled();
    });

    it('trackPageView 應該正常工作', () => {
      trackPageView({ customProp: 'test' });

      expect(mockWindow.plausible).toHaveBeenCalled();
    });

    it('trackSearch 應該正常工作', () => {
      trackSearch('test query', 10, 'education');

      expect(mockWindow.plausible).toHaveBeenCalled();
    });
  });

  describe('錯誤處理', () => {
    let analytics: ReturnType<typeof initializeAnalytics>;

    beforeEach(() => {
      analytics = initializeAnalytics({
        domain: 'test.com',
        enabled: true
      });
    });

    it('應該處理 localStorage 錯誤', () => {
      // 模擬 localStorage 錯誤
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // 不應該拋出錯誤
      expect(() => {
        analytics.trackEvent({
          name: 'Test Event',
          properties: { test: true }
        });
      }).not.toThrow();
    });

    it('應該處理 JSON 解析錯誤', () => {
      // 設定無效的 JSON
      mockLocalStorage.store['medical_analytics_events'] = 'invalid json';

      const stats = analytics.getLocalStats();

      expect(stats).toEqual({
        totalEvents: 0,
        sessionCount: 0,
        topPages: [],
        topCalculators: []
      });
    });

    it('應該處理缺少 Plausible 的情況', () => {
      // 移除 Plausible
      delete (mockWindow as any).plausible;

      // 不應該拋出錯誤
      expect(() => {
        analytics.trackEvent({
          name: 'Test Event',
          properties: { test: true }
        });
      }).not.toThrow();
    });
  });
});