/**
 * 懶載入工具
 * 提供組件和資源的懶載入功能
 */

// 懶載入選項
export interface LazyLoadOptions {
  rootMargin?: string;
  threshold?: number | number[];
  once?: boolean;
  placeholder?: string | HTMLElement;
  errorHandler?: (error: Error) => void;
  loadingClass?: string;
  loadedClass?: string;
  errorClass?: string;
}

// 懶載入狀態
export type LazyLoadState = 'idle' | 'loading' | 'loaded' | 'error';

// 懶載入項目
export interface LazyLoadItem {
  element: HTMLElement;
  loader: () => Promise<void>;
  state: LazyLoadState;
  options: LazyLoadOptions;
}

/**
 * 懶載入管理器
 */
export class LazyLoadManager {
  private observer: IntersectionObserver | null = null;
  private items = new Map<HTMLElement, LazyLoadItem>();
  private defaultOptions: LazyLoadOptions = {
    rootMargin: '50px',
    threshold: 0.1,
    once: true,
    loadingClass: 'lazy-loading',
    loadedClass: 'lazy-loaded',
    errorClass: 'lazy-error'
  };

  constructor(options: Partial<LazyLoadOptions> = {}) {
    this.defaultOptions = { ...this.defaultOptions, ...options };
    this.initializeObserver();
  }

  /**
   * 初始化 Intersection Observer
   */
  private initializeObserver(): void {
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported, falling back to immediate loading');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const item = this.items.get(entry.target as HTMLElement);
            if (item && item.state === 'idle') {
              this.loadItem(item);
            }
          }
        });
      },
      {
        rootMargin: this.defaultOptions.rootMargin,
        threshold: this.defaultOptions.threshold
      }
    );
  }

  /**
   * 註冊懶載入項目
   */
  register(
    element: HTMLElement,
    loader: () => Promise<void>,
    options: Partial<LazyLoadOptions> = {}
  ): void {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    const item: LazyLoadItem = {
      element,
      loader,
      state: 'idle',
      options: mergedOptions
    };

    this.items.set(element, item);

    // 添加初始樣式類
    if (mergedOptions.loadingClass) {
      element.classList.add('lazy-item');
    }

    // 如果支援 IntersectionObserver，開始觀察
    if (this.observer) {
      this.observer.observe(element);
    } else {
      // 回退：立即載入
      this.loadItem(item);
    }
  }

  /**
   * 載入項目
   */
  private async loadItem(item: LazyLoadItem): Promise<void> {
    const { element, loader, options } = item;
    
    // 設定載入狀態
    item.state = 'loading';
    
    if (options.loadingClass) {
      element.classList.add(options.loadingClass);
    }

    try {
      await loader();
      
      // 設定載入完成狀態
      item.state = 'loaded';
      
      if (options.loadingClass) {
        element.classList.remove(options.loadingClass);
      }
      
      if (options.loadedClass) {
        element.classList.add(options.loadedClass);
      }

      // 如果只載入一次，停止觀察
      if (options.once && this.observer) {
        this.observer.unobserve(element);
      }

    } catch (error) {
      // 設定錯誤狀態
      item.state = 'error';
      
      if (options.loadingClass) {
        element.classList.remove(options.loadingClass);
      }
      
      if (options.errorClass) {
        element.classList.add(options.errorClass);
      }

      // 執行錯誤處理器
      if (options.errorHandler) {
        options.errorHandler(error as Error);
      } else {
        console.error('Lazy load failed:', error);
      }
    }
  }

  /**
   * 取消註冊項目
   */
  unregister(element: HTMLElement): void {
    if (this.observer) {
      this.observer.unobserve(element);
    }
    this.items.delete(element);
  }

  /**
   * 強制載入項目
   */
  forceLoad(element: HTMLElement): void {
    const item = this.items.get(element);
    if (item && item.state === 'idle') {
      this.loadItem(item);
    }
  }

  /**
   * 載入所有項目
   */
  loadAll(): void {
    this.items.forEach((item) => {
      if (item.state === 'idle') {
        this.loadItem(item);
      }
    });
  }

  /**
   * 獲取項目狀態
   */
  getState(element: HTMLElement): LazyLoadState | null {
    const item = this.items.get(element);
    return item ? item.state : null;
  }

  /**
   * 清理資源
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.items.clear();
  }
}

/**
 * 圖片懶載入器
 */
export class LazyImageLoader {
  private manager: LazyLoadManager;

  constructor(options: Partial<LazyLoadOptions> = {}) {
    this.manager = new LazyLoadManager(options);
  }

  /**
   * 註冊圖片懶載入
   */
  registerImage(img: HTMLImageElement, options: Partial<LazyLoadOptions> = {}): void {
    const src = img.dataset.src || img.getAttribute('data-src');
    const srcset = img.dataset.srcset || img.getAttribute('data-srcset');

    if (!src && !srcset) {
      console.warn('No data-src or data-srcset found for lazy image');
      return;
    }

    const loader = async () => {
      return new Promise<void>((resolve, reject) => {
        const tempImg = new Image();
        
        tempImg.onload = () => {
          if (src) img.src = src;
          if (srcset) img.srcset = srcset;
          
          // 移除 data 屬性
          img.removeAttribute('data-src');
          img.removeAttribute('data-srcset');
          
          resolve();
        };
        
        tempImg.onerror = () => {
          reject(new Error(`Failed to load image: ${src || srcset}`));
        };
        
        // 開始載入
        if (src) tempImg.src = src;
      });
    };

    this.manager.register(img, loader, options);
  }

  /**
   * 批量註冊圖片
   */
  registerImages(selector: string = 'img[data-src], img[data-srcset]'): void {
    const images = document.querySelectorAll(selector) as NodeListOf<HTMLImageElement>;
    images.forEach(img => this.registerImage(img));
  }
}

/**
 * 組件懶載入器
 */
export class LazyComponentLoader {
  private manager: LazyLoadManager;

  constructor(options: Partial<LazyLoadOptions> = {}) {
    this.manager = new LazyLoadManager(options);
  }

  /**
   * 註冊組件懶載入
   */
  registerComponent(
    element: HTMLElement,
    componentLoader: () => Promise<any>,
    options: Partial<LazyLoadOptions> = {}
  ): void {
    const loader = async () => {
      try {
        const component = await componentLoader();
        
        // 如果是 React 組件
        if (typeof component.default === 'function') {
          const { createRoot } = await import('react-dom/client');
          const { createElement } = await import('react');
          
          const root = createRoot(element);
          root.render(createElement(component.default));
        }
        // 如果是 Vue 組件
        else if (component.default && component.default.render) {
          const { createApp } = await import('vue');
          createApp(component.default).mount(element);
        }
        // 如果是普通函數
        else if (typeof component === 'function') {
          await component(element);
        }
        
      } catch (error) {
        throw new Error(`Failed to load component: ${error}`);
      }
    };

    this.manager.register(element, loader, options);
  }

  /**
   * 註冊醫療計算機組件
   */
  registerCalculator(element: HTMLElement, calculatorId: string): void {
    const loader = async () => {
      const startTime = performance.now();
      
      try {
        // 動態載入計算機組件
        const { Calculator } = await import('../components/islands/Calculator');
        const { createRoot } = await import('react-dom/client');
        const { createElement } = await import('react');
        
        // 載入計算機配置
        const calculatorConfig = await import(`../content/calculators/${calculatorId}.json`);
        
        const root = createRoot(element);
        root.render(createElement(Calculator, { 
          config: calculatorConfig.default,
          onCalculate: (result: any) => {
            // 報告計算機渲染時間
            const renderTime = performance.now() - startTime;
            console.log(`Calculator ${calculatorId} rendered in ${renderTime.toFixed(2)}ms`);
          }
        }));
        
      } catch (error) {
        throw new Error(`Failed to load calculator ${calculatorId}: ${error}`);
      }
    };

    this.manager.register(element, loader, {
      loadingClass: 'calculator-loading',
      loadedClass: 'calculator-loaded',
      errorClass: 'calculator-error'
    });
  }

  /**
   * 註冊流程圖組件
   */
  registerFlowchart(element: HTMLElement, flowchartId: string): void {
    const loader = async () => {
      try {
        // 動態載入流程圖組件
        const { FlowchartRenderer } = await import('../components/islands/FlowchartRenderer');
        const { createRoot } = await import('react-dom/client');
        const { createElement } = await import('react');
        
        // 載入流程圖配置
        const flowchartConfig = await import(`../content/flowcharts/${flowchartId}.json`);
        
        const root = createRoot(element);
        root.render(createElement(FlowchartRenderer, { 
          config: flowchartConfig.default 
        }));
        
      } catch (error) {
        throw new Error(`Failed to load flowchart ${flowchartId}: ${error}`);
      }
    };

    this.manager.register(element, loader, {
      loadingClass: 'flowchart-loading',
      loadedClass: 'flowchart-loaded',
      errorClass: 'flowchart-error'
    });
  }
}

/**
 * 資源懶載入器
 */
export class LazyResourceLoader {
  private manager: LazyLoadManager;

  constructor(options: Partial<LazyLoadOptions> = {}) {
    this.manager = new LazyLoadManager(options);
  }

  /**
   * 註冊 CSS 懶載入
   */
  registerCSS(element: HTMLElement, href: string): void {
    const loader = async () => {
      return new Promise<void>((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
        
        document.head.appendChild(link);
      });
    };

    this.manager.register(element, loader);
  }

  /**
   * 註冊 JavaScript 懶載入
   */
  registerScript(element: HTMLElement, src: string): void {
    const loader = async () => {
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        
        document.head.appendChild(script);
      });
    };

    this.manager.register(element, loader);
  }
}

// 預設實例
export const lazyImageLoader = new LazyImageLoader();
export const lazyComponentLoader = new LazyComponentLoader();
export const lazyResourceLoader = new LazyResourceLoader();

// 便利函數
export const registerLazyImages = (selector?: string) => 
  lazyImageLoader.registerImages(selector);

export const registerLazyCalculator = (element: HTMLElement, calculatorId: string) =>
  lazyComponentLoader.registerCalculator(element, calculatorId);

export const registerLazyFlowchart = (element: HTMLElement, flowchartId: string) =>
  lazyComponentLoader.registerFlowchart(element, flowchartId);

// 自動初始化
if (typeof window !== 'undefined') {
  // DOM 載入完成後自動註冊懶載入圖片
  document.addEventListener('DOMContentLoaded', () => {
    registerLazyImages();
  });

  // 頁面卸載時清理資源
  window.addEventListener('beforeunload', () => {
    lazyImageLoader.manager.destroy();
    lazyComponentLoader.manager.destroy();
    lazyResourceLoader.manager.destroy();
  });
}