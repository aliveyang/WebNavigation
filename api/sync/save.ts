import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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
