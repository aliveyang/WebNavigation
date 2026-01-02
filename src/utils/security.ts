/**
 * 安全工具函数
 * 用于防止 XSS 攻击和验证用户输入
 */

/**
 * 验证 URL 是否安全
 * 只允许 http 和 https 协议
 */
export const isSafeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
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

  // 检查危险协议
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
  const lowerUrl = trimmed.toLowerCase();

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      console.warn('Blocked dangerous URL protocol:', protocol);
      return 'about:blank';
    }
  }

  // 如果没有协议，添加 http://
  if (!trimmed.match(/^[a-z]+:\/\//i)) {
    return `http://${trimmed}`;
  }

  // 验证 URL 格式
  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      console.warn('Invalid URL protocol:', parsed.protocol);
      return 'about:blank';
    }
    return trimmed;
  } catch {
    console.warn('Invalid URL format:', trimmed);
    return 'about:blank';
  }
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
 */
export const validateUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url || url.trim().length === 0) {
    return { valid: false, error: 'URL is required' };
  }

  // 检查危险协议
  if (/^(javascript|data|vbscript|file|about):/i.test(url)) {
    return { valid: false, error: 'Invalid URL protocol' };
  }

  // 验证 URL 格式
  try {
    const testUrl = url.includes('://') ? url : `http://${url}`;
    const parsed = new URL(testUrl);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
    }

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
