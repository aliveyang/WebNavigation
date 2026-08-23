import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// 服务端限流：同一 IP 每分钟最多 10 次写入
const RATE_LIMIT_WINDOW = 60; // 秒
const RATE_LIMIT_MAX = 10;

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
    const { pin, bookmarks, settings } = req.body;

    // 验证 PIN 码
    if (!pin || typeof pin !== 'string' || pin.length < 4) {
      return res.status(400).json({ error: 'Invalid PIN code' });
    }

    // 验证数据
    if (!bookmarks && !settings) {
      return res.status(400).json({ error: 'No data to save' });
    }

    // 按 IP 限流
    const ip = getClientIp(req);
    const rateKey = `ratelimit:sync-save:${ip}`;
    const count = await kv.incr(rateKey);
    if (count === 1) {
      await kv.expire(rateKey, RATE_LIMIT_WINDOW);
    }
    if (count > RATE_LIMIT_MAX) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const now = Date.now();

    // 保存到 KV
    const promises = [];

    if (bookmarks) {
      promises.push(kv.set(`sync:${pin}:bookmarks`, bookmarks));
    }

    if (settings) {
      promises.push(kv.set(`sync:${pin}:settings`, settings));
    }

    promises.push(kv.set(`sync:${pin}:lastModified`, now));

    await Promise.all(promises);

    return res.status(200).json({
      success: true,
      lastModified: now,
    });
  } catch (error) {
    console.error('Sync save error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
