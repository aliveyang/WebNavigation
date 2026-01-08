/**
 * Favicon 缓存工具
 * 使用内存缓存减少对 Google Favicon 服务的重复请求
 */

const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours
const MAX_CACHE_SIZE = 100; // 最多缓存 100 个 favicon

interface CacheEntry {
  url: string;
  timestamp: number;
}

class FaviconCache {
  private cache: Map<string, CacheEntry>;

  constructor() {
    this.cache = new Map();
    this.loadFromStorage();
  }

  /**
   * 从 localStorage 加载缓存
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('navhub_favicon_cache');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([domain, entry]) => {
          this.cache.set(domain, entry as CacheEntry);
        });
        this.cleanExpired();
      }
    } catch (error) {
      console.error('Failed to load favicon cache:', error);
    }
  }

  /**
   * 保存缓存到 localStorage
   */
  private saveToStorage(): void {
    try {
      const data: Record<string, CacheEntry> = {};
      this.cache.forEach((entry, domain) => {
        data[domain] = entry;
      });
      localStorage.setItem('navhub_favicon_cache', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save favicon cache:', error);
    }
  }

  /**
   * 清理过期的缓存条目
   */
  private cleanExpired(): void {
    const now = Date.now();
    let cleaned = false;

    this.cache.forEach((entry, domain) => {
      if (now - entry.timestamp > CACHE_DURATION) {
        this.cache.delete(domain);
        cleaned = true;
      }
    });

    if (cleaned) {
      this.saveToStorage();
    }
  }

  /**
   * 限制缓存大小，使用 LRU 策略
   */
  private limitCacheSize(): void {
    if (this.cache.size > MAX_CACHE_SIZE) {
      // 找到最旧的条目并删除
      let oldestDomain: string | null = null;
      let oldestTime = Date.now();

      this.cache.forEach((entry, domain) => {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestDomain = domain;
        }
      });

      if (oldestDomain) {
        this.cache.delete(oldestDomain);
      }
    }
  }

  /**
   * 获取缓存的 favicon URL
   */
  get(domain: string): string | null {
    const entry = this.cache.get(domain);

    if (!entry) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      this.cache.delete(domain);
      this.saveToStorage();
      return null;
    }

    return entry.url;
  }

  /**
   * 缓存 favicon URL
   */
  set(domain: string, url: string): void {
    this.cache.set(domain, {
      url,
      timestamp: Date.now()
    });

    this.limitCacheSize();
    this.saveToStorage();
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    localStorage.removeItem('navhub_favicon_cache');
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: MAX_CACHE_SIZE
    };
  }
}

// 导出单例
export const faviconCache = new FaviconCache();
