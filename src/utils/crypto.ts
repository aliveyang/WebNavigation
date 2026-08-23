/**
 * 加密工具函数
 * 用于敏感数据的哈希
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
