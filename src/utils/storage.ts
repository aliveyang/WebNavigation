/**
 * LocalStorage 优化工具
 * 使用防抖减少频繁的 I/O 操作
 */

import { debounce } from './performance';

const DEBOUNCE_DELAY = 500; // 500ms 防抖延迟

/**
 * 防抖保存到 localStorage
 */
export const debouncedSaveToStorage = debounce((key: string, data: any) => {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error(`Failed to save to localStorage (key: ${key}):`, error);

    // 如果是 QuotaExceededError，尝试清理旧数据
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('LocalStorage quota exceeded, attempting cleanup...');
      cleanupOldData();

      // 重试保存
      try {
        const serialized = JSON.stringify(data);
        localStorage.setItem(key, serialized);
      } catch (retryError) {
        console.error('Failed to save after cleanup:', retryError);
      }
    }
  }
}, DEBOUNCE_DELAY);

/**
 * 立即保存到 localStorage（不防抖）
 */
export const saveToStorage = (key: string, data: any): void => {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error(`Failed to save to localStorage (key: ${key}):`, error);
  }
};

/**
 * 从 localStorage 读取
 */
export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch (error) {
    console.error(`Failed to load from localStorage (key: ${key}):`, error);
  }
  return defaultValue;
};

/**
 * 清理旧数据（保留最重要的数据）
 */
const cleanupOldData = (): void => {
  try {
    // 清理 favicon 缓存
    localStorage.removeItem('navhub_favicon_cache');

    // 可以添加更多清理逻辑
    console.log('Cleaned up old data from localStorage');
  } catch (error) {
    console.error('Failed to cleanup localStorage:', error);
  }
};

/**
 * 获取 localStorage 使用情况
 */
export const getStorageStats = (): { used: number; available: number; percentage: number } => {
  let used = 0;

  try {
    // 计算已使用空间
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }
  } catch (error) {
    console.error('Failed to calculate storage stats:', error);
  }

  // 大多数浏览器的 localStorage 限制是 5-10MB
  const available = 5 * 1024 * 1024; // 假设 5MB
  const percentage = (used / available) * 100;

  return {
    used,
    available,
    percentage: Math.round(percentage * 100) / 100
  };
};

/**
 * 批量保存（合并多个更新）
 */
export class StorageBatcher {
  private pending: Map<string, any> = new Map();
  private timer: number | null = null;
  private delay: number;

  constructor(delay: number = 500) {
    this.delay = delay;
  }

  /**
   * 添加待保存的数据
   */
  set(key: string, data: any): void {
    this.pending.set(key, data);
    this.scheduleFlush();
  }

  /**
   * 调度刷新
   */
  private scheduleFlush(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }

    this.timer = window.setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  /**
   * 立即刷新所有待保存的数据
   */
  flush(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.pending.forEach((data, key) => {
      saveToStorage(key, data);
    });

    this.pending.clear();
  }
}

// 导出单例批处理器
export const storageBatcher = new StorageBatcher();
