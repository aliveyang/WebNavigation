/**
 * 安全工具函数
 * 用于防止 XSS 攻击和验证用户输入
 */

/**
 * 允许的本地应用协议列表
 * 这些协议用于跳转到本地应用
 */
export const ALLOWED_LOCAL_PROTOCOLS = [
  'http:',
  'https:',
  // 常见本地应用协议
  'file:',           // 本地文件
  'mailto:',         // 邮件客户端
  'tel:',            // 电话
  'sms:',            // 短信
  'slack:',          // Slack
  'discord:',        // Discord
  'spotify:',        // Spotify
  'steam:',          // Steam
  'vscode:',         // VS Code
  'cursor:',         // Cursor
  'notion:',         // Notion
  'obsidian:',       // Obsidian
  'figma:',          // Figma
  'zotero:',         // Zotero
  'calibre:',        // Calibre
  'potplayer:',      // PotPlayer
  'vlc:',            // VLC
  'iina:',           // IINA
  'weixin:',         // 微信
  'alipays:',        // 支付宝
  'dingtalk:',       // 钉钉
  'feishu:',         // 飞书
  'tencent:',        // 腾讯系应用
  'qqmusic:',        // QQ音乐
  'neteasemusic:',   // 网易云音乐
  'bilibili:',       // 哔哩哔哩
  'zhihu:',          // 知乎
  'taobao:',         // 淘宝
  'jd:',             // 京东
  'meituan:',        // 美团
  'dianping:',       // 大众点评
  'wechat:',         // 微信（英文）
  'whatsapp:',       // WhatsApp
  'telegram:',       // Telegram
  'zoom:',           // Zoom
  'teams:',          // Microsoft Teams
  'skype:',          // Skype
];

/**
 * 验证 URL 是否安全
 * 允许 http、https 和本地应用协议
 */
export const isSafeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    // 检查是否是允许的协议
    if (ALLOWED_LOCAL_PROTOCOLS.includes(parsed.protocol)) {
      return true;
    }
    // 允许自定义协议（格式为 xxx:// 或 xxx:）
    if (/^[a-z][a-z0-9+.-]*:$/i.test(parsed.protocol)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * 清理 URL，移除危险协议
 * @param url 用户输入的 URL
 * @returns 清理后的安全 URL
 */
export const sanitizeUrl = (url: string): string => {
  const trimmed = url.trim();

  // 检查危险协议（仅阻止真正危险的协议）
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
  const lowerUrl = trimmed.toLowerCase();

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      console.warn('Blocked dangerous URL protocol:', protocol);
      return 'about:blank';
    }
  }

  // 检查是否是本地应用协议（格式为 xxx: 或 xxx://）
  const protocolMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):(?:\/\/)?/i);
  if (protocolMatch) {
    const protocol = protocolMatch[1].toLowerCase() + ':';
    // 如果是允许的协议，直接返回
    if (ALLOWED_LOCAL_PROTOCOLS.includes(protocol) || /^[a-z][a-z0-9+.-]*:$/i.test(protocol)) {
      return trimmed;
    }
  }

  // 如果没有协议，添加 http://
  if (!trimmed.match(/^[a-z][a-z0-9+.-]*:(?:\/\/)?/i)) {
    return `http://${trimmed}`;
  }

  return trimmed;
};

/**
 * 转义 HTML 特殊字符，防止 XSS
 */
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
};

/**
 * 验证图片 URL 是否安全
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;

  // 允许 base64 图片
  if (url.startsWith('data:image/')) {
    // 验证 base64 格式
    const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/i;
    return base64Regex.test(url);
  }

  // 验证 HTTP(S) URL
  if (!isSafeUrl(url)) {
    return false;
  }

  // 检查图片扩展名或 MIME 类型
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const lowerUrl = url.toLowerCase();

  // 检查 URL 是否包含图片扩展名
  const hasImageExtension = imageExtensions.some(ext => lowerUrl.includes(ext));

  // 或者是常见的图片服务域名
  const imageServiceDomains = ['google.com/s2/favicons', 'imgur.com', 'cloudinary.com'];
  const hasImageServiceDomain = imageServiceDomains.some(domain => lowerUrl.includes(domain));

  return hasImageExtension || hasImageServiceDomain;
};

/**
 * 验证书签标题
 */
export const validateTitle = (title: string): { valid: boolean; error?: string } => {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: 'Title is required' };
  }

  if (title.length > 50) {
    return { valid: false, error: 'Title must be less than 50 characters' };
  }

  // 检查危险字符和脚本标签
  if (/<script|javascript:|onerror=|onclick=|onload=/i.test(title)) {
    return { valid: false, error: 'Title contains invalid characters' };
  }

  return { valid: true };
};

/**
 * 验证 URL
 * 支持 http、https 和本地应用协议
 */
export const validateUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url || url.trim().length === 0) {
    return { valid: false, error: 'URL is required' };
  }

  // 检查危险协议（仅阻止真正危险的协议）
  if (/^(javascript|data|vbscript):/i.test(url)) {
    return { valid: false, error: 'Invalid URL protocol' };
  }

  // 检查是否是本地应用协议（格式为 xxx: 或 xxx://）
  const protocolMatch = url.match(/^([a-z][a-z0-9+.-]*):(?:\/\/)?/i);
  if (protocolMatch) {
    const protocol = protocolMatch[1].toLowerCase() + ':';
    // 如果是允许的协议，验证通过
    if (ALLOWED_LOCAL_PROTOCOLS.includes(protocol)) {
      return { valid: true };
    }
    // 允许其他自定义协议（格式正确即可）
    if (/^[a-z][a-z0-9+.-]*:$/i.test(protocol)) {
      return { valid: true };
    }
  }

  // 验证 URL 格式（对于没有协议的 URL，添加 http:// 后验证）
  try {
    const testUrl = url.includes('://') || url.match(/^[a-z][a-z0-9+.-]*:/i) ? url : `http://${url}`;
    new URL(testUrl);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
};

/**
 * 验证 PIN 码
 */
export const validatePin = (pin: string): { valid: boolean; error?: string } => {
  if (!pin || pin.length < 4) {
    return { valid: false, error: 'PIN must be at least 4 characters' };
  }

  if (pin.length > 20) {
    return { valid: false, error: 'PIN must be less than 20 characters' };
  }

  // 检查是否包含危险字符
  if (/<|>|&|"|'|script/i.test(pin)) {
    return { valid: false, error: 'PIN contains invalid characters' };
  }

  return { valid: true };
};

/**
 * 清理用户输入的文本
 */
export const sanitizeText = (text: string, maxLength = 100): string => {
  // 移除 HTML 标签
  let cleaned = text.replace(/<[^>]*>/g, '');

  // 转义特殊字符
  cleaned = escapeHtml(cleaned);

  // 限制长度
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }

  return cleaned.trim();
};
