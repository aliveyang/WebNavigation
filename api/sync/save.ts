import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// 服务端限流：同一 IP 每分钟最多 10 次写入
const RATE_LIMIT_WINDOW = 60; // 秒
const RATE_LIMIT_MAX = 10;

// 请求体上限：书签可含 base64 图片，取 4MB（低于 Vercel Serverless 4.5MB 请求体硬限制）
const MAX_BODY_BYTES = 4 * 1024 * 1024;

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
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 请求体大小上限（优先看 content-length；缺失时按序列化结果估算）
    const contentLength = Number(req.headers['content-length'] || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return res.status(413).json({ error: 'Payload too large' });
    }

    const { pin, bookmarks, settings } = req.body || {};

    // 验证凭据格式
    if (!pin || typeof pin !== 'string' || !PIN_HASH_RE.test(pin)) {
      return res.status(400).json({ error: 'Invalid PIN credential' });
    }

    // 结构校验：bookmarks 必须为数组、settings 必须为普通对象，防止任意 JSON 直写 KV
    if (bookmarks !== undefined && bookmarks !== null && !Array.isArray(bookmarks)) {
      return res.status(400).json({ error: 'Invalid bookmarks format' });
    }
    if (
      settings !== undefined &&
      settings !== null &&
      (typeof settings !== 'object' || Array.isArray(settings))
    ) {
      return res.status(400).json({ error: 'Invalid settings format' });
    }

    // 验证数据
    if (!bookmarks && !settings) {
      return res.status(400).json({ error: 'No data to save' });
    }

    // content-length 缺失（chunked 传输）时的兜底检查
    if (!contentLength) {
      const serialized = JSON.stringify(req.body || {});
      if (Buffer.byteLength(serialized, 'utf8') > MAX_BODY_BYTES) {
        return res.status(413).json({ error: 'Payload too large' });
      }
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
