/**
 * LocalStorage 工具
 */

/**
 * 立即保存到 localStorage
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
