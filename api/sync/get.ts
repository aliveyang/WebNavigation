import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pin } = req.query;

    // 验证 PIN 码
    if (!pin || typeof pin !== 'string' || pin.length < 4) {
      return res.status(400).json({ error: 'Invalid PIN code' });
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
