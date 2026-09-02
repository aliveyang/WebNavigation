import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// 服务端限流：同一 IP 每分钟最多 20 次 GET，防止 PIN 枚举
const RATE_LIMIT_WINDOW = 60; // 秒
const RATE_LIMIT_MAX = 20;

// 凭据为 64 位十六进制哈希/派生密钥（旧版 SHA-256 与新版 PBKDF2 输出一致）
const PIN_HASH_RE = /^[a-f0-9]{64}$/;

const getClientIp = (req: VercelRequest): string => {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') {
    return fwd.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // POST（body 传凭据，避免进入访问日志）为主；GET 仅兼容未升级的旧客户端
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pin = req.method === 'POST' ? (req.body || {}).pin : req.query.pin;

    // 验证凭据格式
    if (!pin || typeof pin !== 'string' || !PIN_HASH_RE.test(pin)) {
      return res.status(400).json({ error: 'Invalid PIN credential' });
    }

    // 按 IP 限流
    const ip = getClientIp(req);
    const rateKey = `ratelimit:sync-get:${ip}`;
    const count = await kv.incr(rateKey);
    if (count === 1) {
      await kv.expire(rateKey, RATE_LIMIT_WINDOW);
    }
    if (count > RATE_LIMIT_MAX) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    // 从 KV 获取数据
    const bookmarks = await kv.get(`sync:${pin}:bookmarks`);
    const settings = await kv.get(`sync:${pin}:settings`);
    const lastModified = await kv.get(`sync:${pin}:lastModified`);

    // 如果没有数据，返回空对象
    if (!bookmarks && !settings) {
      return res.status(200).json({
        bookmarks: null,
        settings: null,
        lastModified: null,
      });
    }

    return res.status(200).json({
      bookmarks,
      settings,
      lastModified,
    });
  } catch (error) {
    console.error('Sync get error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
