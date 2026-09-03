/**
 * LocalStorage 工具
 */

/**
 * 立即保存到 localStorage
 */
export const saveToStorage = (key: string, data: unknown): void => {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error(`Failed to save to localStorage (key: ${key}):`, error);
  }
};

/**
 * 从 localStorage 读取
 * 注意：解析失败会吞掉错误并返回默认值；调用方若需区分"无数据"与"数据损坏"，
 * 应显式解析（参见 App.tsx 初始加载的 B8 防护）
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
