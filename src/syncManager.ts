// 同步管理模块
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
  private pin: string | null = null;
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
    const pin = localStorage.getItem('navhub_sync_pin');
    const deviceId = localStorage.getItem('navhub_device_id');

    if (pin) {
      this.pin = pin;
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
  enableSync(pin: string) {
    if (pin.length < 4) {
      throw new Error('PIN code must be at least 4 characters');
    }

    this.pin = pin;
    localStorage.setItem('navhub_sync_pin', pin);
    this.syncStatus.enabled = true;
    this.syncStatus.error = null;
    this.notifyListeners();
  }

  // 禁用同步
  disableSync() {
    this.pin = null;
    localStorage.removeItem('navhub_sync_pin');
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
    if (!this.pin) {
      throw new Error('Sync not enabled');
    }

    this.syncStatus.syncing = true;
    this.syncStatus.error = null;
    this.notifyListeners();

    try {
      const response = await fetch(`/api/sync/get?pin=${encodeURIComponent(this.pin)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      this.syncStatus.lastSyncTime = Date.now();
      this.syncStatus.syncing = false;
      this.notifyListeners();

      return data;
    } catch (error) {
      this.syncStatus.syncing = false;
      this.syncStatus.error = error instanceof Error ? error.message : 'Sync failed';
      this.notifyListeners();
      throw error;
    }
  }

  // 推送数据到云端
  async pushToCloud(bookmarks: any[], settings: any): Promise<void> {
    if (!this.pin) {
      throw new Error('Sync not enabled');
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
          pin: this.pin,
          bookmarks,
          settings,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      this.syncStatus.lastSyncTime = result.lastModified;
      this.syncStatus.syncing = false;
      this.notifyListeners();
    } catch (error) {
      this.syncStatus.syncing = false;
      this.syncStatus.error = error instanceof Error ? error.message : 'Sync failed';
      this.notifyListeners();
      throw error;
    }
  }

  // 双向同步
  async sync(localBookmarks: any[], localSettings: any): Promise<{ bookmarks: any[], settings: any }> {
    if (!this.pin) {
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

      // 3. 比较时间戳，使用最新的数据
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
