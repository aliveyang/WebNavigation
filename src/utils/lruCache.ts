/**
 * 通用 LRU (Least Recently Used) 缓存
 * 当缓存满时，自动淘汰最久未使用的条目
 */

export class LRUCache<K, V> {
    private capacity: number;
    private cache: Map<K, V>;
    private accessOrder: K[];

    constructor(capacity: number = 100) {
        this.capacity = capacity;
        this.cache = new Map();
        this.accessOrder = [];
    }

    /**
     * 获取缓存值
     * 如果存在，更新访问顺序
     */
    get(key: K): V | undefined {
        if (!this.cache.has(key)) {
            return undefined;
        }

        // 更新访问顺序 (移到最后)
        this.updateAccessOrder(key);

        return this.cache.get(key);
    }

    /**
     * 设置缓存值
     * 如果超出容量，淘汰最久未使用的条目
     */
    set(key: K, value: V): void {
        // 如果 key 已存在，更新值和访问顺序
        if (this.cache.has(key)) {
            this.cache.set(key, value);
            this.updateAccessOrder(key);
            return;
        }

        // 如果超出容量，淘汰最久未使用的
        if (this.cache.size >= this.capacity) {
            this.evictLRU();
        }

        // 添加新条目
        this.cache.set(key, value);
        this.accessOrder.push(key);
    }

    /**
     * 检查 key 是否存在
     */
    has(key: K): boolean {
        return this.cache.has(key);
    }

    /**
     * 删除指定 key
     */
    delete(key: K): boolean {
        if (!this.cache.has(key)) {
            return false;
        }

        this.cache.delete(key);
        this.accessOrder = this.accessOrder.filter((k) => k !== key);
        return true;
    }

    /**
     * 清空缓存
     */
    clear(): void {
        this.cache.clear();
        this.accessOrder = [];
    }

    /**
     * 获取缓存大小
     */
    get size(): number {
        return this.cache.size;
    }

    /**
     * 获取所有 keys
     */
    keys(): K[] {
        return [...this.accessOrder];
    }

    /**
     * 获取所有 values
     */
    values(): V[] {
        return this.accessOrder.map((k) => this.cache.get(k)!);
    }

    /**
     * 获取所有 entries
     */
    entries(): [K, V][] {
        return this.accessOrder.map((k) => [k, this.cache.get(k)!]);
    }

    /**
     * 遍历缓存
     */
    forEach(callback: (value: V, key: K) => void): void {
        this.accessOrder.forEach((key) => {
            callback(this.cache.get(key)!, key);
        });
    }

    /**
     * 获取缓存统计
     */
    getStats(): { size: number; capacity: number; usage: number } {
        return {
            size: this.cache.size,
            capacity: this.capacity,
            usage: Math.round((this.cache.size / this.capacity) * 100),
        };
    }

    /**
     * 更新访问顺序 (私有方法)
     */
    private updateAccessOrder(key: K): void {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
        this.accessOrder.push(key);
    }

    /**
     * 淘汰最久未使用的条目 (私有方法)
     */
    private evictLRU(): void {
        const lruKey = this.accessOrder.shift();
        if (lruKey !== undefined) {
            this.cache.delete(lruKey);
        }
    }
}

/**
 * 带过期时间的 LRU 缓存
 */
export class LRUCacheWithTTL<K, V> extends LRUCache<K, { value: V; expiry: number }> {
    private defaultTTL: number;

    constructor(capacity: number = 100, defaultTTL: number = 1000 * 60 * 60) {
        super(capacity);
        this.defaultTTL = defaultTTL;
    }

    /**
     * 获取值 (自动检查过期)
     */
    getValue(key: K): V | undefined {
        const entry = super.get(key);

        if (!entry) {
            return undefined;
        }

        // 检查是否过期
        if (Date.now() > entry.expiry) {
            super.delete(key);
            return undefined;
        }

        return entry.value;
    }

    /**
     * 设置值 (可指定 TTL)
     */
    setValue(key: K, value: V, ttl?: number): void {
        super.set(key, {
            value,
            expiry: Date.now() + (ttl || this.defaultTTL),
        });
    }

    /**
     * 清理所有过期条目
     */
    cleanExpired(): number {
        let cleaned = 0;
        const now = Date.now();

        super.forEach((entry, key) => {
            if (now > entry.expiry) {
                super.delete(key);
                cleaned++;
            }
        });

        return cleaned;
    }
}

// 导出预配置的缓存实例
export const imageCache = new LRUCacheWithTTL<string, string>(50, 1000 * 60 * 60 * 24); // 24小时
export const apiCache = new LRUCacheWithTTL<string, unknown>(20, 1000 * 60 * 5); // 5分钟
