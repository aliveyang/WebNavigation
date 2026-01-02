/**
 * 加密工具函数
 * 用于敏感数据的加密和哈希
 */

/**
 * 使用 SHA-256 哈希 PIN 码
 * @param pin PIN 码
 * @returns 哈希后的 PIN 码（十六进制字符串）
 */
export const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * 验证 PIN 码
 * @param pin 用户输入的 PIN 码
 * @param hashedPin 存储的哈希 PIN 码
 * @returns 是否匹配
 */
export const verifyPin = async (pin: string, hashedPin: string): Promise<boolean> => {
  const hash = await hashPin(pin);
  return hash === hashedPin;
};

/**
 * 生成随机设备 ID
 * @returns 随机设备 ID
 */
export const generateDeviceId = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * 生成随机盐值
 * @returns 随机盐值
 */
export const generateSalt = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};
