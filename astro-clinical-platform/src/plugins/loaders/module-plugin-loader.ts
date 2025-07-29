/**
 * Module Plugin Loader
 * 支持載入 ES Module 格式的插件
 */

import type { Plugin, PluginLoader } from '../core/plugin-manager';

/**
 * ES Module 插件載入器
 */
export class ModulePluginLoader implements PluginLoader {
  
  canLoad(source: string): boolean {
    // 支持 .js, .ts, .mjs 文件和 npm 包
    return source.endsWith('.js') || 
           source.endsWith('.ts') || 
           source.endsWith('.mjs') ||
           !source.includes('/') && !source.includes('\\'); // npm package
  }

  async load(source: string): Promise<Plugin> {
    try {
      let module: any;

      if (this.isFilePath(source)) {
        // 載入文件
        module = await import(source);
      } else {
        // 載入 npm 包
        module = await import(source);
      }

      // 獲取插件實例
      const plugin = this.extractPlugin(module);
      
      // 驗證插件結構
      this.validatePlugin(plugin);

      return plugin;
    } catch (error) {
      throw new Error(`Failed to load module plugin from ${source}: ${error.message}`);
    }
  }

  async unload(plugin: Plugin): Promise<void> {
    // ES Module 無法真正卸載，但可以清理引用
    // 在實際實現中可能需要使用動態導入和模組快取管理
    console.log(`Unloading plugin: ${plugin.metadata.id}`);
  }

  private isFilePath(source: string): boolean {
    return source.includes('/') || source.includes('\\') || source.startsWith('.');
  }

  private extractPlugin(module: any): Plugin {
    // 嘗試不同的導出方式
    if (module.default && typeof module.default === 'object') {
      return module.default;
    }
    
    if (module.plugin && typeof module.plugin === 'object') {
      return module.plugin;
    }
    
    if (typeof module === 'object' && module.metadata) {
      return module;
    }

    // 如果是類，嘗試實例化
    if (typeof module.default === 'function') {
      return new module.default();
    }

    if (typeof module === 'function') {
      return new module();
    }

    throw new Error('Invalid plugin module structure');
  }

  private validatePlugin(plugin: any): void {
    if (!plugin || typeof plugin !== 'object') {
      throw new Error('Plugin must be an object');
    }

    if (!plugin.metadata || typeof plugin.metadata !== 'object') {
      throw new Error('Plugin must have metadata object');
    }

    const required = ['id', 'name', 'version', 'type', 'permissions'];
    for (const field of required) {
      if (!plugin.metadata[field]) {
        throw new Error(`Plugin metadata must include ${field}`);
      }
    }
  }
}

/**
 * JSON 配置插件載入器
 */
export class JsonPluginLoader implements PluginLoader {
  
  canLoad(source: string): boolean {
    return source.endsWith('.json');
  }

  async load(source: string): Promise<Plugin> {
    try {
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const config = await response.json();
      return this.createPluginFromConfig(config);
    } catch (error) {
      throw new Error(`Failed to load JSON plugin from ${source}: ${error.message}`);
    }
  }

  async unload(plugin: Plugin): Promise<void> {
    console.log(`Unloading JSON plugin: ${plugin.metadata.id}`);
  }

  private createPluginFromConfig(config: any): Plugin {
    this.validateConfig(config);

    return {
      metadata: config.metadata,
      
      async load(context) {
        if (config.lifecycle?.load) {
          await this.executeScript(config.lifecycle.load, context);
        }
      },

      async start(context) {
        if (config.lifecycle?.start) {
          await this.executeScript(config.lifecycle.start, context);
        }
      },

      async stop(context) {
        if (config.lifecycle?.stop) {
          await this.executeScript(config.lifecycle.stop, context);
        }
      },

      async unload(context) {
        if (config.lifecycle?.unload) {
          await this.executeScript(config.lifecycle.unload, context);
        }
      },

      async configure(pluginConfig) {
        if (config.lifecycle?.configure) {
          await this.executeScript(config.lifecycle.configure, { config: pluginConfig });
        }
      },

      async validate(pluginConfig) {
        if (config.lifecycle?.validate) {
          return await this.executeScript(config.lifecycle.validate, { config: pluginConfig });
        }
        return true;
      },

      async healthCheck() {
        if (config.lifecycle?.healthCheck) {
          return await this.executeScript(config.lifecycle.healthCheck, {});
        }
        return true;
      }
    };
  }

  private validateConfig(config: any): void {
    if (!config.metadata) {
      throw new Error('JSON plugin must have metadata');
    }

    const required = ['id', 'name', 'version', 'type', 'permissions'];
    for (const field of required) {
      if (!config.metadata[field]) {
        throw new Error(`Plugin metadata must include ${field}`);
      }
    }
  }

  private async executeScript(script: string, context: any): Promise<any> {
    // 安全的腳本執行環境
    // 在實際實現中應該使用沙盒環境
    try {
      const func = new Function('context', script);
      return await func(context);
    } catch (error) {
      throw new Error(`Script execution failed: ${error.message}`);
    }
  }
}

/**
 * 遠程插件載入器
 */
export class RemotePluginLoader implements PluginLoader {
  
  constructor(private readonly options: {
    allowedDomains?: string[];
    timeout?: number;
    maxSize?: number;
  } = {}) {
    this.options = {
      allowedDomains: [],
      timeout: 30000,
      maxSize: 10 * 1024 * 1024, // 10MB
      ...options
    };
  }

  canLoad(source: string): boolean {
    try {
      const url = new URL(source);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  async load(source: string): Promise<Plugin> {
    try {
      // 驗證域名白名單
      if (this.options.allowedDomains?.length) {
        const url = new URL(source);
        if (!this.options.allowedDomains.includes(url.hostname)) {
          throw new Error(`Domain ${url.hostname} is not in allowed list`);
        }
      }

      // 載入遠程插件
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

      try {
        const response = await fetch(source, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/javascript, application/json',
            'User-Agent': 'Astro-Clinical-Platform-Plugin-Loader/1.0'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // 檢查文件大小
        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > (this.options.maxSize || 0)) {
          throw new Error('Plugin file too large');
        }

        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('application/javascript') || contentType.includes('text/javascript')) {
          return await this.loadJavaScriptPlugin(response);
        } else if (contentType.includes('application/json')) {
          return await this.loadJsonPlugin(response);
        } else {
          throw new Error(`Unsupported content type: ${contentType}`);
        }

      } finally {
        clearTimeout(timeoutId);
      }

    } catch (error) {
      throw new Error(`Failed to load remote plugin from ${source}: ${error.message}`);
    }
  }

  async unload(plugin: Plugin): Promise<void> {
    console.log(`Unloading remote plugin: ${plugin.metadata.id}`);
  }

  private async loadJavaScriptPlugin(response: Response): Promise<Plugin> {
    const code = await response.text();
    
    // 創建安全的執行環境
    const module = { exports: {} };
    const require = (id: string) => {
      throw new Error(`require('${id}') is not allowed in remote plugins`);
    };

    // 執行插件代碼
    const func = new Function('module', 'exports', 'require', code);
    func(module, module.exports, require);

    // 提取插件
    const plugin = module.exports.default || module.exports;
    
    if (typeof plugin === 'function') {
      return new plugin();
    }

    return plugin;
  }

  private async loadJsonPlugin(response: Response): Promise<Plugin> {
    const config = await response.json();
    const jsonLoader = new JsonPluginLoader();
    return jsonLoader['createPluginFromConfig'](config);
  }
}

/**
 * 複合插件載入器 - 組合多個載入器
 */
export class CompositePluginLoader implements PluginLoader {
  private loaders: PluginLoader[] = [];

  constructor(loaders: PluginLoader[] = []) {
    this.loaders = loaders;
  }

  addLoader(loader: PluginLoader): void {
    this.loaders.push(loader);
  }

  canLoad(source: string): boolean {
    return this.loaders.some(loader => loader.canLoad(source));
  }

  async load(source: string): Promise<Plugin> {
    const loader = this.loaders.find(l => l.canLoad(source));
    if (!loader) {
      throw new Error(`No suitable loader found for: ${source}`);
    }

    return await loader.load(source);
  }

  async unload(plugin: Plugin): Promise<void> {
    // 嘗試所有載入器的卸載方法
    await Promise.allSettled(
      this.loaders.map(loader => loader.unload(plugin))
    );
  }
}

// 創建預設的複合載入器
export function createDefaultPluginLoader(): CompositePluginLoader {
  const composite = new CompositePluginLoader();
  
  // 添加內建載入器
  composite.addLoader(new ModulePluginLoader());
  composite.addLoader(new JsonPluginLoader());
  
  // 在生產環境中可能不啟用遠程載入器
  if (process.env.NODE_ENV === 'development') {
    composite.addLoader(new RemotePluginLoader({
      allowedDomains: ['localhost', '127.0.0.1'],
      timeout: 10000
    }));
  }

  return composite;
}