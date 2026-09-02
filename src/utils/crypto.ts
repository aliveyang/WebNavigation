/**
 * 加密工具函数
 * 用于敏感数据的哈希与同步密钥派生
 */

/**
 * 使用 SHA-256 哈希 PIN 码（旧版方案，无盐）
 * 仅用于存量账户迁移识别（审计 A1），新账户一律使用 derivePinKey
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
 * 同步密钥派生盐（应用级固定值）
 * 说明：云端 KV key 必须能由 PIN 在任意设备上独立推导（服务端不提供预鉴权盐查询），
 * 因此无法使用每账户随机盐；以 PBKDF2（15 万次迭代）拖慢离线枚举，
 * 配合服务端限流构成防线。升级派生方案时递增版本号并走 migrate 流程。
 */
const PIN_KEY_SALT = 'navhub-sync-v2';
const PBKDF2_ITERATIONS = 150_000;

/**
 * 从 PIN 派生云同步密钥（PBKDF2-SHA256，审计 A1）
 * 确定性输出：同一 PIN 在任意设备得到相同密钥，可直接作为云端 KV key
 * @param pin PIN 码
 * @returns 256 位派生密钥（十六进制字符串）
 */
export const derivePinKey = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(PIN_KEY_SALT),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(bits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};
