// 同步管理模块
import { syncRateLimiter } from './utils/rateLimit';
import { hashPin } from './utils/crypto';

export interface SyncData {
  bookmarks: any[] | null;
  settings: any | null;
  lastModified: number | null;
}

export interface SyncStatus {
  enabled: boolean;
  syncing: boolean;
  lastSyncTime: number | null;
  error: string | null;
}

class SyncManager {
  private pinHash: string | null = null;
  private deviceId: string | null = null;
  private syncStatus: SyncStatus = {
    enabled: false,
    syncing: false,
    lastSyncTime: null,
    error: null,
  };
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  constructor() {
    // 从 localStorage 加载配置
    this.loadConfig();
  }

  // 加载同步配置
  private loadConfig() {
    const pinHash = localStorage.getItem('navhub_sync_pin_hash');
    const deviceId = localStorage.getItem('navhub_device_id');

    if (pinHash) {
      this.pinHash = pinHash;
      this.syncStatus.enabled = true;
    }

    if (!deviceId) {
      // 生成设备 ID
      const newDeviceId = this.generateDeviceId();
      localStorage.setItem('navhub_device_id', newDeviceId);
      this.deviceId = newDeviceId;
    } else {
      this.deviceId = deviceId;
    }
  }

  // 生成设备 ID
  private generateDeviceId(): string {
    return 'device_' + Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
  }

  // 启用同步
  async enableSync(pin: string) {
    if (pin.length < 4) {
      throw new Error('PIN code must be at least 4 characters');
    }

    // 哈希 PIN 码
    const pinHash = await hashPin(pin);
    this.pinHash = pinHash;

    // 存储哈希后的 PIN
    localStorage.setItem('navhub_sync_pin_hash', pinHash);
    this.syncStatus.enabled = true;
    this.syncStatus.error = null;
    this.notifyListeners();
  }

  // 禁用同步
  disableSync() {
    this.pinHash = null;
    localStorage.removeItem('navhub_sync_pin_hash');
    this.syncStatus.enabled = false;
    this.syncStatus.error = null;
    this.notifyListeners();
  }

  // 获取同步状态
  getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // 监听状态变化
  onStatusChange(listener: (status: SyncStatus) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // 通知监听器
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getStatus()));
  }

  // 从云端拉取数据
  async pullFromCloud(): Promise<SyncData | null> {
    if (!this.pinHash) {
      throw new Error('Sync not enabled');
    }

    // 检查速率限制
    if (!syncRateLimiter.canMakeRequest()) {
      const remaining = syncRateLimiter.getRemainingRequests();
      throw new Error(`Rate limit exceeded. ${remaining} requests remaining. Please try again later.`);
    }

    this.syncStatus.syncing = true;
    this.syncStatus.error = null;
    this.notifyListeners();

    try {
      // 使用哈希后的 PIN 作为键
      const response = await fetch(`/api/sync/get?pin=${encodeURIComponent(this.pinHash)}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('API not found. If running locally, please use "vercel dev" or configure API proxy.');
        }
        throw new Error(`Cloud Sync failed (Status: ${response.status})`);
      }

      const data = await response.json();

      this.syncStatus.lastSyncTime = Date.now();
      this.syncStatus.syncing = false;
      this.notifyListeners();

      // 如果从云端拉取到数据，更新本地的 lastModified
      if (data && data.lastModified) {
        localStorage.setItem('navhub_last_modified', data.lastModified.toString());
      }

      return data;
    } catch (error) {
      this.syncStatus.syncing = false;
      this.syncStatus.error = error instanceof Error ? error.message : 'Sync failed';
      this.notifyListeners();
      // Don't verify re-throw, UI should handle error state via listeners or returned error
      throw error;
    }
  }

  // 推送数据到云端
  async pushToCloud(bookmarks: any[], settings: any): Promise<void> {
    if (!this.pinHash) {
      throw new Error('Sync not enabled');
    }

    // 检查速率限制
    if (!syncRateLimiter.canMakeRequest()) {
      const remaining = syncRateLimiter.getRemainingRequests();
      throw new Error(`Rate limit exceeded. ${remaining} requests remaining. Please try again later.`);
    }

    this.syncStatus.syncing = true;
    this.syncStatus.error = null;
    this.notifyListeners();

    try {
      const response = await fetch('/api/sync/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pin: this.pinHash, // 使用哈希后的 PIN
          bookmarks,
          settings,
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('API not found. If running locally, use "vercel dev".');
        }
        throw new Error(`Cloud Sync failed (Status: ${response.status})`);
      }

      const result = await response.json();

      this.syncStatus.lastSyncTime = result.lastModified;
      this.syncStatus.syncing = false;
      this.notifyListeners();

      // 更新本地的 lastModified 为云端返回的时间戳
      localStorage.setItem('navhub_last_modified', result.lastModified.toString());
    } catch (error) {
      this.syncStatus.syncing = false;
      this.syncStatus.error = error instanceof Error ? error.message : 'Sync failed';
      this.notifyListeners();
      throw error;
    }
  }

  // 双向同步
  async sync(localBookmarks: any[], localSettings: any, isFirstSync: boolean = false): Promise<{ bookmarks: any[], settings: any }> {
    if (!this.pinHash) {
      throw new Error('Sync not enabled');
    }

    try {
      // 1. 先拉取云端数据
      const cloudData = await this.pullFromCloud();

      // 2. 如果云端没有数据，直接推送本地数据
      if (!cloudData || (!cloudData.bookmarks && !cloudData.settings)) {
        await this.pushToCloud(localBookmarks, localSettings);
        return { bookmarks: localBookmarks, settings: localSettings };
      }

      // 3. 如果是首次同步（刚启用同步），优先使用云端数据
      if (isFirstSync) {
        return {
          bookmarks: cloudData.bookmarks || localBookmarks,
          settings: cloudData.settings || localSettings,
        };
      }

      // 4. 比较时间戳，使用最新的数据
      const localLastModified = parseInt(localStorage.getItem('navhub_last_modified') || '0');
      const cloudLastModified = cloudData.lastModified || 0;

      if (cloudLastModified > localLastModified) {
        // 云端数据更新，使用云端数据
        return {
          bookmarks: cloudData.bookmarks || localBookmarks,
          settings: cloudData.settings || localSettings,
        };
      } else {
        // 本地数据更新，推送到云端
        await this.pushToCloud(localBookmarks, localSettings);
        return { bookmarks: localBookmarks, settings: localSettings };
      }
    } catch (error) {
      console.error('Sync error:', error);
      // 同步失败时返回本地数据
      return { bookmarks: localBookmarks, settings: localSettings };
    }
  }

  // 防抖推送
  private pushTimeout: NodeJS.Timeout | null = null;

  debouncedPush(bookmarks: any[], settings: any, delay: number = 1000) {
    if (this.pushTimeout) {
      clearTimeout(this.pushTimeout);
    }

    this.pushTimeout = setTimeout(() => {
      this.pushToCloud(bookmarks, settings).catch(console.error);
    }, delay);
  }
}

// 导出单例
export const syncManager = new SyncManager();
