import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * 存量账户迁移（审计 A1）
 * 旧版以无盐 SHA-256(pin) 作为云端 KV key；新版改用 PBKDF2 派生密钥。
 * 客户端可确定性重算旧 key，本接口把旧 key 数据搬到新 key 并删除旧数据，
 * 使旧账户在 PIN 强度升级后无感迁移。
 *
 * 安全性说明：调用本接口需要持有旧 key（即完整凭据），
 * 与直接用旧凭据读写数据的权限等价，不构成额外攻击面。
 */

// 服务端限流：同一 IP 每分钟最多 10 次
const RATE_LIMIT_WINDOW = 60; // 秒
const RATE_LIMIT_MAX = 10;

// 凭据为 64 位十六进制哈希/派生密钥
const PIN_HASH_RE = /^[a-f0-9]{64}$/;

const getClientIp = (req: VercelRequest): string => {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') {
    return fwd.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { oldPin, newPin } = req.body || {};

    // 验证凭据格式
    if (
      !oldPin ||
      !newPin ||
      typeof oldPin !== 'string' ||
      typeof newPin !== 'string' ||
      !PIN_HASH_RE.test(oldPin) ||
      !PIN_HASH_RE.test(newPin) ||
      oldPin === newPin
    ) {
      return res.status(400).json({ error: 'Invalid PIN credentials' });
    }

    // 按 IP 限流
    const ip = getClientIp(req);
    const rateKey = `ratelimit:sync-migrate:${ip}`;
    const count = await kv.incr(rateKey);
    if (count === 1) {
      await kv.expire(rateKey, RATE_LIMIT_WINDOW);
    }
    if (count > RATE_LIMIT_MAX) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    // 新 key 已有数据（已迁移或其他设备已写入）时不做任何事，避免覆盖新数据
    const targetExists = await kv.get(`sync:${newPin}:lastModified`);
    if (targetExists) {
      return res.status(200).json({ migrated: false, reason: 'target-exists' });
    }

    const oldBookmarks = await kv.get(`sync:${oldPin}:bookmarks`);
    const oldSettings = await kv.get(`sync:${oldPin}:settings`);
    const oldLastModified = await kv.get(`sync:${oldPin}:lastModified`);

    // 旧 key 无数据：无需迁移（新账户或已迁移过）
    if (!oldBookmarks && !oldSettings) {
      return res.status(200).json({ migrated: false, reason: 'no-legacy-data' });
    }

    // 复制到新 key
    const writes: Promise<unknown>[] = [];
    if (oldBookmarks) {
      writes.push(kv.set(`sync:${newPin}:bookmarks`, oldBookmarks));
    }
    if (oldSettings) {
      writes.push(kv.set(`sync:${newPin}:settings`, oldSettings));
    }
    writes.push(kv.set(`sync:${newPin}:lastModified`, oldLastModified ?? Date.now()));
    await Promise.all(writes);

    // 删除旧 key：旧凭据（更弱）随之失效
    await Promise.all([
      kv.del(`sync:${oldPin}:bookmarks`),
      kv.del(`sync:${oldPin}:settings`),
      kv.del(`sync:${oldPin}:lastModified`),
    ]);

    return res.status(200).json({ migrated: true });
  } catch (error) {
    console.error('Sync migrate error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
