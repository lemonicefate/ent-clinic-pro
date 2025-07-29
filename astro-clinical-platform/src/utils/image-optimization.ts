/**
 * 圖片優化工具
 * 提供響應式圖片和效能優化功能
 */

// 圖片格式類型
export type ImageFormat = 'webp' | 'avif' | 'jpeg' | 'png' | 'svg';

// 圖片尺寸配置
export interface ImageSize {
  width: number;
  height?: number;
  quality?: number;
  format?: ImageFormat;
}

// 響應式圖片配置
export interface ResponsiveImageConfig {
  src: string;
  alt: string;
  sizes: ImageSize[];
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  fetchpriority?: 'high' | 'low' | 'auto';
  className?: string;
  style?: Record<string, string>;
}

// 圖片優化選項
export interface ImageOptimizationOptions {
  quality?: number;
  format?: ImageFormat;
  progressive?: boolean;
  blur?: number;
  sharpen?: boolean;
  removeMetadata?: boolean;
}

/**
 * 圖片優化器類別
 */
export class ImageOptimizer {
  private baseUrl: string;
  private defaultQuality: number = 80;
  private supportedFormats: ImageFormat[] = ['avif', 'webp', 'jpeg', 'png'];

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * 生成響應式圖片 srcset
   */
  generateSrcSet(src: string, sizes: ImageSize[]): string {
    return sizes
      .map(size => {
        const optimizedSrc = this.optimizeImageUrl(src, {
          width: size.width,
          height: size.height,
          quality: size.quality || this.defaultQuality,
          format: size.format
        });
        return `${optimizedSrc} ${size.width}w`;
      })
      .join(', ');
  }

  /**
   * 生成 sizes 屬性
   */
  generateSizesAttribute(breakpoints: Array<{ condition: string; size: string }>): string {
    return breakpoints
      .map(bp => `${bp.condition} ${bp.size}`)
      .join(', ');
  }

  /**
   * 優化圖片 URL
   */
  private optimizeImageUrl(src: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: ImageFormat;
  }): string {
    // 如果是外部 URL，直接返回
    if (src.startsWith('http')) {
      return src;
    }

    const params = new URLSearchParams();
    
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format) params.set('f', options.format);

    const queryString = params.toString();
    const separator = src.includes('?') ? '&' : '?';
    
    return queryString ? `${src}${separator}${queryString}` : src;
  }

  /**
   * 生成響應式圖片 HTML
   */
  generateResponsiveImage(config: ResponsiveImageConfig): string {
    const { src, alt, sizes, loading = 'lazy', decoding = 'async', fetchpriority, className, style } = config;

    // 生成 srcset
    const srcset = this.generateSrcSet(src, sizes);
    
    // 生成 sizes 屬性（基於常見斷點）
    const sizesAttr = this.generateSizesAttribute([
      { condition: '(max-width: 640px)', size: '100vw' },
      { condition: '(max-width: 1024px)', size: '50vw' },
      { condition: '', size: '33vw' }
    ]);

    // 構建屬性
    const attributes: string[] = [
      `src="${src}"`,
      `alt="${alt}"`,
      `srcset="${srcset}"`,
      `sizes="${sizesAttr}"`,
      `loading="${loading}"`,
      `decoding="${decoding}"`
    ];

    if (fetchpriority) {
      attributes.push(`fetchpriority="${fetchpriority}"`);
    }

    if (className) {
      attributes.push(`class="${className}"`);
    }

    if (style) {
      const styleString = Object.entries(style)
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ');
      attributes.push(`style="${styleString}"`);
    }

    return `<img ${attributes.join(' ')} />`;
  }

  /**
   * 生成 WebP 和 AVIF 的 picture 元素
   */
  generatePictureElement(config: ResponsiveImageConfig): string {
    const { src, alt, sizes, loading = 'lazy', decoding = 'async', className, style } = config;

    // 生成不同格式的 source 元素
    const sources: string[] = [];

    // AVIF 格式
    if (this.supportedFormats.includes('avif')) {
      const avifSizes = sizes.map(size => ({ ...size, format: 'avif' as ImageFormat }));
      const avifSrcset = this.generateSrcSet(src, avifSizes);
      sources.push(`<source srcset="${avifSrcset}" type="image/avif" />`);
    }

    // WebP 格式
    if (this.supportedFormats.includes('webp')) {
      const webpSizes = sizes.map(size => ({ ...size, format: 'webp' as ImageFormat }));
      const webpSrcset = this.generateSrcSet(src, webpSizes);
      sources.push(`<source srcset="${webpSrcset}" type="image/webp" />`);
    }

    // 回退的 img 元素
    const imgAttributes: string[] = [
      `src="${src}"`,
      `alt="${alt}"`,
      `loading="${loading}"`,
      `decoding="${decoding}"`
    ];

    if (className) {
      imgAttributes.push(`class="${className}"`);
    }

    if (style) {
      const styleString = Object.entries(style)
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ');
      imgAttributes.push(`style="${styleString}"`);
    }

    const imgElement = `<img ${imgAttributes.join(' ')} />`;

    return `<picture>${sources.join('')}${imgElement}</picture>`;
  }

  /**
   * 生成醫療圖片的預設配置
   */
  generateMedicalImageConfig(src: string, alt: string, type: 'hero' | 'thumbnail' | 'diagram' | 'icon'): ResponsiveImageConfig {
    const configs = {
      hero: {
        sizes: [
          { width: 320, quality: 75 },
          { width: 640, quality: 80 },
          { width: 1024, quality: 85 },
          { width: 1920, quality: 90 }
        ],
        loading: 'eager' as const,
        fetchpriority: 'high' as const
      },
      thumbnail: {
        sizes: [
          { width: 150, quality: 75 },
          { width: 300, quality: 80 },
          { width: 450, quality: 85 }
        ],
        loading: 'lazy' as const
      },
      diagram: {
        sizes: [
          { width: 400, quality: 85 },
          { width: 800, quality: 90 },
          { width: 1200, quality: 95 }
        ],
        loading: 'lazy' as const
      },
      icon: {
        sizes: [
          { width: 24, quality: 90 },
          { width: 48, quality: 90 },
          { width: 96, quality: 90 }
        ],
        loading: 'lazy' as const
      }
    };

    return {
      src,
      alt,
      ...configs[type]
    };
  }

  /**
   * 檢查瀏覽器對圖片格式的支援
   */
  static checkFormatSupport(): Promise<{ webp: boolean; avif: boolean }> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      
      const webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      
      // AVIF 支援檢測
      const avifImage = new Image();
      avifImage.onload = () => resolve({ webp: webpSupport, avif: true });
      avifImage.onerror = () => resolve({ webp: webpSupport, avif: false });
      avifImage.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    });
  }

  /**
   * 預載入關鍵圖片
   */
  static preloadImage(src: string, options: {
    as?: 'image';
    type?: string;
    media?: string;
    fetchpriority?: 'high' | 'low' | 'auto';
  } = {}): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = src;
    link.as = options.as || 'image';
    
    if (options.type) link.type = options.type;
    if (options.media) link.media = options.media;
    if (options.fetchpriority) link.setAttribute('fetchpriority', options.fetchpriority);
    
    document.head.appendChild(link);
  }

  /**
   * 圖片懶載入觀察器
   */
  static createLazyLoadObserver(options: {
    rootMargin?: string;
    threshold?: number;
    callback?: (entry: IntersectionObserverEntry) => void;
  } = {}): IntersectionObserver {
    const { rootMargin = '50px', threshold = 0.1, callback } = options;

    return new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          
          // 載入圖片
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            img.removeAttribute('data-srcset');
          }
          
          // 移除載入中的樣式
          img.classList.remove('loading');
          img.classList.add('loaded');
          
          // 執行回調
          if (callback) callback(entry);
          
          // 停止觀察
          this.unobserve(img);
        }
      });
    }, {
      rootMargin,
      threshold
    });
  }

  /**
   * 生成圖片載入中的佔位符
   */
  static generatePlaceholder(width: number, height: number, color: string = '#f3f4f6'): string {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${color}"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="system-ui, sans-serif" font-size="14">
          載入中...
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * 計算圖片的內容長寬比
   */
  static calculateAspectRatio(width: number, height: number): string {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    return `${width / divisor}/${height / divisor}`;
  }

  /**
   * 生成醫療圖片的 CSS 類別
   */
  static generateMedicalImageCSS(): string {
    return `
      .medical-image {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transition: opacity 0.3s ease;
      }
      
      .medical-image.loading {
        opacity: 0.6;
        filter: blur(2px);
      }
      
      .medical-image.loaded {
        opacity: 1;
        filter: none;
      }
      
      .medical-image-hero {
        width: 100%;
        aspect-ratio: 16/9;
        object-fit: cover;
      }
      
      .medical-image-thumbnail {
        width: 100%;
        aspect-ratio: 4/3;
        object-fit: cover;
      }
      
      .medical-image-diagram {
        width: 100%;
        height: auto;
        background: white;
        padding: 1rem;
      }
      
      .medical-image-icon {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
      }
      
      @media (prefers-reduced-motion: reduce) {
        .medical-image {
          transition: none;
        }
      }
    `;
  }
}

// 預設圖片優化器實例
export const imageOptimizer = new ImageOptimizer();

// 便利函數
export const generateResponsiveImage = (config: ResponsiveImageConfig) => 
  imageOptimizer.generateResponsiveImage(config);

export const generatePictureElement = (config: ResponsiveImageConfig) => 
  imageOptimizer.generatePictureElement(config);

export const generateMedicalImageConfig = (src: string, alt: string, type: 'hero' | 'thumbnail' | 'diagram' | 'icon') =>
  imageOptimizer.generateMedicalImageConfig(src, alt, type);