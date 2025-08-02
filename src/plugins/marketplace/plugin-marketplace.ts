/**
 * Plugin Marketplace Framework
 * 插件市場框架 - 提供插件發現、安裝和管理功能
 */

import type { 
  PluginRegistration, 
  PluginSearchOptions, 
  PluginSearchResult,
  MarketplaceStats 
} from '../registry/plugin-registry';
import type { Plugin, PluginMetadata, PluginState } from '../core/plugin-manager';
import { pluginRegistry } from '../registry/plugin-registry';
import { pluginManager } from '../core/plugin-manager';
import { createDefaultSecurityManager } from '../security/plugin-security';
import { pluginConfigManager } from '../config/plugin-config-manager';
import { AuditLogger } from '../../utils/security-measures';

// 安裝選項
export interface InstallOptions {
  autoStart?: boolean;
  configTemplate?: string;
  customConfig?: Record<string, any>;
  environment?: 'development' | 'staging' | 'production';
  skipSecurityCheck?: boolean;
}

// 安裝結果
export interface InstallResult {
  success: boolean;
  pluginId: string;
  message: string;
  warnings?: string[];
  securityRisk?: 'low' | 'medium' | 'high' | 'critical';
}

// 更新資訊
export interface UpdateInfo {
  pluginId: string;
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  updateType: 'patch' | 'minor' | 'major';
  changelog?: string[];
  breaking?: boolean;
}

// 市場統計
export interface MarketplaceMetrics {
  totalPlugins: number;
  installedPlugins: number;
  activePlugins: number;
  availableUpdates: number;
  popularPlugins: PluginRegistration[];
  recentInstalls: InstallRecord[];
  categoryDistribution: Record<string, number>;
}

// 安裝記錄
export interface InstallRecord {
  pluginId: string;
  pluginName: string;
  version: string;
  installedAt: Date;
  installedBy?: string;
  source: string;
}

/**
 * 插件市場管理器
 */
export class PluginMarketplace {
  private securityManager = createDefaultSecurityManager();
  private installHistory: InstallRecord[] = [];
  private updateChecks = new Map<string, Date>();

  constructor(private readonly options: {
    enableAutoUpdates?: boolean;
    updateCheckInterval?: number;
    maxInstallHistory?: number;
    requireApproval?: boolean;
  } = {}) {
    this.options = {
      enableAutoUpdates: false,
      updateCheckInterval: 24 * 60 * 60 * 1000, // 24 hours
      maxInstallHistory: 100,
      requireApproval: true,
      ...options
    };

    this.startUpdateChecker();
  }

  /**
   * 搜尋插件
   */
  async searchPlugins(options: PluginSearchOptions = {}): Promise<PluginSearchResult> {
    try {
      const results = pluginRegistry.searchPlugins(options);
      
      // 增強結果，添加安裝狀態
      const enhancedPlugins = results.plugins.map(plugin => ({
        ...plugin,
        installStatus: this.getInstallStatus(plugin.metadata.id),
        securityRating: this.getSecurityRating(plugin),
        compatibility: this.checkCompatibility(plugin.metadata)
      }));

      return {
        ...results,
        plugins: enhancedPlugins as any
      };
    } catch (error) {
      throw new Error(`Plugin search failed: ${error.message}`);
    }
  }

  /**
   * 獲取插件詳情
   */
  async getPluginDetails(pluginId: string): Promise<PluginRegistration & {
    installStatus: PluginInstallStatus;
    securityRating: SecurityRating;
    compatibility: CompatibilityInfo;
    dependencies: DependencyInfo[];
  } | null> {
    const plugin = pluginRegistry.getPlugin(pluginId);
    if (!plugin) {
      return null;
    }

    return {
      ...plugin,
      installStatus: this.getInstallStatus(pluginId),
      securityRating: this.getSecurityRating(plugin),
      compatibility: this.checkCompatibility(plugin.metadata),
      dependencies: this.analyzeDependencies(plugin.metadata)
    };
  }

  /**
   * 安裝插件
   */
  async installPlugin(
    pluginId: string, 
    options: InstallOptions = {}
  ): Promise<InstallResult> {
    try {
      // 獲取插件註冊資訊
      const registration = pluginRegistry.getPlugin(pluginId);
      if (!registration) {
        return {
          success: false,
          pluginId,
          message: 'Plugin not found in registry'
        };
      }

      // 檢查是否已安裝
      const existingPlugin = pluginManager.getPlugin(pluginId);
      if (existingPlugin) {
        return {
          success: false,
          pluginId,
          message: 'Plugin is already installed'
        };
      }

      // 安全檢查
      if (!options.skipSecurityCheck) {
        const securityCheck = await this.performSecurityCheck(registration);
        if (!securityCheck.allowed) {
          return {
            success: false,
            pluginId,
            message: `Security check failed: ${securityCheck.reason}`,
            securityRisk: securityCheck.riskLevel
          };
        }
      }

      // 相容性檢查
      const compatibility = this.checkCompatibility(registration.metadata);
      if (!compatibility.compatible) {
        return {
          success: false,
          pluginId,
          message: `Compatibility check failed: ${compatibility.issues.join(', ')}`
        };
      }

      // 依賴檢查
      const dependencyCheck = await this.checkDependencies(registration.metadata);
      if (!dependencyCheck.satisfied) {
        return {
          success: false,
          pluginId,
          message: `Missing dependencies: ${dependencyCheck.missing.join(', ')}`
        };
      }

      // 載入插件
      await pluginManager.loadPlugin(registration.source);

      // 創建配置
      if (options.configTemplate) {
        await pluginConfigManager.createConfig(
          pluginId,
          options.configTemplate,
          options.environment,
          options.customConfig
        );
      }

      // 自動啟動
      if (options.autoStart !== false) {
        await pluginManager.startPlugin(pluginId);
      }

      // 記錄安裝
      const installRecord: InstallRecord = {
        pluginId,
        pluginName: registration.metadata.name,
        version: registration.metadata.version,
        installedAt: new Date(),
        source: registration.source
      };

      this.installHistory.unshift(installRecord);
      this.trimInstallHistory();

      // 更新下載計數
      pluginRegistry.recordDownload(pluginId);

      // 記錄審計日誌
      AuditLogger.logSecurityEvent(
        'plugin_installed',
        { request: { url: 'plugin-marketplace' } } as any,
        true,
        {
          pluginId,
          pluginName: registration.metadata.name,
          version: registration.metadata.version,
          autoStart: options.autoStart
        },
        'medium'
      );

      return {
        success: true,
        pluginId,
        message: 'Plugin installed successfully',
        warnings: compatibility.warnings,
        securityRisk: this.getSecurityRating(registration).level
      };

    } catch (error) {
      return {
        success: false,
        pluginId,
        message: `Installation failed: ${error.message}`
      };
    }
  }

  /**
   * 卸載插件
   */
  async uninstallPlugin(pluginId: string): Promise<InstallResult> {
    try {
      const plugin = pluginManager.getPlugin(pluginId);
      if (!plugin) {
        return {
          success: false,
          pluginId,
          message: 'Plugin is not installed'
        };
      }

      // 檢查依賴
      const dependents = this.findDependentPlugins(pluginId);
      if (dependents.length > 0) {
        return {
          success: false,
          pluginId,
          message: `Cannot uninstall: Plugin is required by ${dependents.join(', ')}`
        };
      }

      // 卸載插件
      await pluginManager.unloadPlugin(pluginId);

      // 刪除配置
      await pluginConfigManager.deleteConfig(pluginId);

      // 記錄審計日誌
      AuditLogger.logSecurityEvent(
        'plugin_uninstalled',
        { request: { url: 'plugin-marketplace' } } as any,
        true,
        { pluginId, pluginName: plugin.metadata.name },
        'medium'
      );

      return {
        success: true,
        pluginId,
        message: 'Plugin uninstalled successfully'
      };

    } catch (error) {
      return {
        success: false,
        pluginId,
        message: `Uninstallation failed: ${error.message}`
      };
    }
  }

  /**
   * 檢查更新
   */
  async checkForUpdates(pluginId?: string): Promise<UpdateInfo[]> {
    const updates: UpdateInfo[] = [];
    const pluginsToCheck = pluginId ? [pluginId] : Array.from(pluginManager.getAllPlugins().keys());

    for (const id of pluginsToCheck) {
      const installedPlugin = pluginManager.getPlugin(id);
      if (!installedPlugin) continue;

      const registryPlugin = pluginRegistry.getPlugin(id);
      if (!registryPlugin) continue;

      const currentVersion = installedPlugin.metadata.version;
      const latestVersion = registryPlugin.metadata.version;

      if (this.isNewerVersion(latestVersion, currentVersion)) {
        const updateType = this.getUpdateType(currentVersion, latestVersion);
        
        updates.push({
          pluginId: id,
          currentVersion,
          latestVersion,
          hasUpdate: true,
          updateType,
          changelog: registryPlugin.changelog?.slice(0, 5).map(entry => entry.changes.join(', ')),
          breaking: registryPlugin.changelog?.some(entry => entry.breaking) || false
        });
      }

      // 記錄檢查時間
      this.updateChecks.set(id, new Date());
    }

    return updates;
  }

  /**
   * 更新插件
   */
  async updatePlugin(pluginId: string, options: InstallOptions = {}): Promise<InstallResult> {
    try {
      const updateInfo = await this.checkForUpdates(pluginId);
      const update = updateInfo.find(u => u.pluginId === pluginId);

      if (!update || !update.hasUpdate) {
        return {
          success: false,
          pluginId,
          message: 'No update available'
        };
      }

      // 備份當前配置
      const currentConfig = await pluginConfigManager.getConfig(pluginId);

      // 卸載舊版本
      await pluginManager.unloadPlugin(pluginId);

      try {
        // 安裝新版本
        const installResult = await this.installPlugin(pluginId, {
          ...options,
          autoStart: false // 先不啟動，等配置恢復後再啟動
        });

        if (!installResult.success) {
          throw new Error(installResult.message);
        }

        // 恢復配置
        if (currentConfig) {
          await pluginConfigManager.updateConfig(pluginId, currentConfig);
        }

        // 啟動插件
        if (options.autoStart !== false) {
          await pluginManager.startPlugin(pluginId);
        }

        return {
          success: true,
          pluginId,
          message: `Plugin updated from ${update.currentVersion} to ${update.latestVersion}`,
          warnings: update.breaking ? ['This update contains breaking changes'] : undefined
        };

      } catch (error) {
        // 更新失敗，嘗試恢復舊版本
        console.error(`Update failed for plugin ${pluginId}, attempting rollback:`, error);
        
        return {
          success: false,
          pluginId,
          message: `Update failed: ${error.message}`
        };
      }

    } catch (error) {
      return {
        success: false,
        pluginId,
        message: `Update failed: ${error.message}`
      };
    }
  }

  /**
   * 獲取市場統計
   */
  async getMarketplaceMetrics(): Promise<MarketplaceMetrics> {
    const registryStats = pluginRegistry.getMarketplaceStats();
    const installedPlugins = pluginManager.getAllPlugins();
    const pluginStates = Array.from(installedPlugins.keys()).map(id => ({
      id,
      state: pluginManager.getPluginState(id)
    }));

    const activePlugins = pluginStates.filter(p => p.state === PluginState.STARTED).length;
    const updates = await this.checkForUpdates();

    // 分類分佈
    const categoryDistribution: Record<string, number> = {};
    for (const [, plugin] of installedPlugins) {
      const category = plugin.metadata.category || 'uncategorized';
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
    }

    return {
      totalPlugins: registryStats.totalPlugins,
      installedPlugins: installedPlugins.size,
      activePlugins,
      availableUpdates: updates.length,
      popularPlugins: registryStats.topPlugins,
      recentInstalls: this.installHistory.slice(0, 10),
      categoryDistribution
    };
  }

  /**
   * 獲取推薦插件
   */
  async getRecommendedPlugins(limit: number = 10): Promise<PluginRegistration[]> {
    // 基於用戶已安裝的插件類型推薦相似插件
    const installedPlugins = pluginManager.getAllPlugins();
    const installedTypes = new Set(Array.from(installedPlugins.values()).map(p => p.metadata.type));
    const installedCategories = new Set(Array.from(installedPlugins.values()).map(p => p.metadata.category).filter(Boolean));

    const searchResults = pluginRegistry.searchPlugins({
      sortBy: 'rating',
      sortOrder: 'desc',
      limit: limit * 2 // 獲取更多結果以便篩選
    });

    // 篩選推薦插件
    const recommendations = searchResults.plugins
      .filter(plugin => {
        // 排除已安裝的插件
        if (installedPlugins.has(plugin.metadata.id)) {
          return false;
        }

        // 優先推薦相同類型或分類的插件
        return installedTypes.has(plugin.metadata.type) || 
               (plugin.metadata.category && installedCategories.has(plugin.metadata.category));
      })
      .slice(0, limit);

    // 如果推薦不足，補充高評分插件
    if (recommendations.length < limit) {
      const additional = searchResults.plugins
        .filter(plugin => 
          !installedPlugins.has(plugin.metadata.id) && 
          !recommendations.some(r => r.metadata.id === plugin.metadata.id)
        )
        .slice(0, limit - recommendations.length);
      
      recommendations.push(...additional);
    }

    return recommendations;
  }

  // 私有方法

  private getInstallStatus(pluginId: string): PluginInstallStatus {
    const plugin = pluginManager.getPlugin(pluginId);
    if (!plugin) {
      return { installed: false };
    }

    const state = pluginManager.getPluginState(pluginId);
    return {
      installed: true,
      state,
      version: plugin.metadata.version,
      installedAt: this.getInstallDate(pluginId)
    };
  }

  private getSecurityRating(registration: PluginRegistration): SecurityRating {
    const permissions = registration.metadata.permissions;
    let score = 100;
    let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const issues: string[] = [];

    // 評估權限風險
    if (permissions.patientData) {
      score -= 30;
      level = 'critical';
      issues.push('Access to patient data');
    }

    if (permissions.medicalData) {
      score -= 20;
      if (level === 'low') level = 'high';
      issues.push('Access to medical data');
    }

    if (permissions.adminAccess) {
      score -= 50;
      level = 'critical';
      issues.push('Administrative access');
    }

    if (permissions.network) {
      score -= 10;
      if (level === 'low') level = 'medium';
      issues.push('Network access');
    }

    if (permissions.fileSystem) {
      score -= 15;
      if (level === 'low') level = 'medium';
      issues.push('File system access');
    }

    // 評估發布者信譽
    if (!registration.verified) {
      score -= 20;
      if (level === 'low') level = 'medium';
      issues.push('Unverified publisher');
    }

    if (registration.publisher.reputation < 50) {
      score -= 15;
      issues.push('Low publisher reputation');
    }

    return {
      score: Math.max(0, score),
      level,
      issues
    };
  }

  private checkCompatibility(metadata: PluginMetadata): CompatibilityInfo {
    const issues: string[] = [];
    const warnings: string[] = [];
    let compatible = true;

    // 檢查最低版本要求
    if (metadata.minimumVersion) {
      const currentVersion = '1.0.0'; // 應該從平台獲取
      if (!this.isVersionCompatible(currentVersion, metadata.minimumVersion)) {
        compatible = false;
        issues.push(`Requires platform version ${metadata.minimumVersion} or higher`);
      }
    }

    // 檢查最高版本限制
    if (metadata.maximumVersion) {
      const currentVersion = '1.0.0';
      if (this.isNewerVersion(currentVersion, metadata.maximumVersion)) {
        compatible = false;
        issues.push(`Not compatible with platform version ${currentVersion}`);
      }
    }

    // 檢查語言支援
    if (metadata.supportedLanguages && metadata.supportedLanguages.length > 0) {
      const currentLocale = 'en'; // 應該從平台獲取
      if (!metadata.supportedLanguages.includes(currentLocale)) {
        warnings.push(`Plugin may not support current language (${currentLocale})`);
      }
    }

    return {
      compatible,
      issues,
      warnings
    };
  }

  private analyzeDependencies(metadata: PluginMetadata): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];

    if (metadata.dependencies) {
      for (const [name, version] of Object.entries(metadata.dependencies)) {
        const installedPlugin = pluginManager.getPlugin(name);
        const satisfied = installedPlugin ? 
          this.isVersionCompatible(installedPlugin.metadata.version, version) : 
          false;

        dependencies.push({
          name,
          requiredVersion: version,
          installedVersion: installedPlugin?.metadata.version,
          satisfied,
          type: 'dependency'
        });
      }
    }

    if (metadata.peerDependencies) {
      for (const [name, version] of Object.entries(metadata.peerDependencies)) {
        const installedPlugin = pluginManager.getPlugin(name);
        const satisfied = installedPlugin ? 
          this.isVersionCompatible(installedPlugin.metadata.version, version) : 
          false;

        dependencies.push({
          name,
          requiredVersion: version,
          installedVersion: installedPlugin?.metadata.version,
          satisfied,
          type: 'peer'
        });
      }
    }

    return dependencies;
  }

  private async performSecurityCheck(registration: PluginRegistration): Promise<{
    allowed: boolean;
    reason?: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }> {
    // 創建臨時插件物件進行安全檢查
    const tempPlugin: Plugin = {
      metadata: registration.metadata
    };

    return await this.securityManager.validatePluginSecurity(tempPlugin, registration.source);
  }

  private async checkDependencies(metadata: PluginMetadata): Promise<{
    satisfied: boolean;
    missing: string[];
  }> {
    const missing: string[] = [];

    if (metadata.dependencies) {
      for (const [name, version] of Object.entries(metadata.dependencies)) {
        const installedPlugin = pluginManager.getPlugin(name);
        if (!installedPlugin || !this.isVersionCompatible(installedPlugin.metadata.version, version)) {
          missing.push(`${name}@${version}`);
        }
      }
    }

    return {
      satisfied: missing.length === 0,
      missing
    };
  }

  private findDependentPlugins(pluginId: string): string[] {
    const dependents: string[] = [];
    const allPlugins = pluginManager.getAllPlugins();

    for (const [id, plugin] of allPlugins) {
      if (id === pluginId) continue;

      const dependencies = plugin.metadata.dependencies || {};
      const peerDependencies = plugin.metadata.peerDependencies || {};

      if (dependencies[pluginId] || peerDependencies[pluginId]) {
        dependents.push(id);
      }
    }

    return dependents;
  }

  private isNewerVersion(version1: string, version2: string): boolean {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part > v2Part) return true;
      if (v1Part < v2Part) return false;
    }

    return false;
  }

  private isVersionCompatible(installedVersion: string, requiredVersion: string): boolean {
    // 簡化的版本相容性檢查
    // 在實際實現中應該支援 semver 範圍
    return installedVersion === requiredVersion || this.isNewerVersion(installedVersion, requiredVersion);
  }

  private getUpdateType(currentVersion: string, newVersion: string): 'patch' | 'minor' | 'major' {
    const current = currentVersion.split('.').map(Number);
    const newer = newVersion.split('.').map(Number);

    if (newer[0] > current[0]) return 'major';
    if (newer[1] > current[1]) return 'minor';
    return 'patch';
  }

  private getInstallDate(pluginId: string): Date | undefined {
    const record = this.installHistory.find(r => r.pluginId === pluginId);
    return record?.installedAt;
  }

  private trimInstallHistory(): void {
    const maxSize = this.options.maxInstallHistory || 100;
    if (this.installHistory.length > maxSize) {
      this.installHistory = this.installHistory.slice(0, maxSize);
    }
  }

  private startUpdateChecker(): void {
    if (!this.options.enableAutoUpdates) return;

    setInterval(async () => {
      try {
        const updates = await this.checkForUpdates();
        if (updates.length > 0) {
          console.log(`Found ${updates.length} plugin updates available`);
          // 在實際實現中，這裡可以發送通知給用戶
        }
      } catch (error) {
        console.error('Auto update check failed:', error);
      }
    }, this.options.updateCheckInterval);
  }
}

// 輔助介面定義
interface PluginInstallStatus {
  installed: boolean;
  state?: PluginState;
  version?: string;
  installedAt?: Date;
}

interface SecurityRating {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  issues: string[];
}

interface CompatibilityInfo {
  compatible: boolean;
  issues: string[];
  warnings: string[];
}

interface DependencyInfo {
  name: string;
  requiredVersion: string;
  installedVersion?: string;
  satisfied: boolean;
  type: 'dependency' | 'peer';
}

// 導出單例實例
export const pluginMarketplace = new PluginMarketplace({
  enableAutoUpdates: false,
  updateCheckInterval: 24 * 60 * 60 * 1000,
  maxInstallHistory: 100,
  requireApproval: true
});