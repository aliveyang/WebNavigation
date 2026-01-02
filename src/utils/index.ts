export const formatUrl = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed.includes('://')) {
    return `http://${trimmed}`;
  }
  return trimmed;
};

export const getFaviconUrl = (url: string) => {
  try {
    const domain = new URL(formatUrl(url)).hostname;
    return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
  } catch (e) {
    return '';
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Export performance utilities
export { debounce, throttle, rafThrottle } from './performance';

// Export image optimization utilities
export {
  compressImage,
  convertToWebP,
  validateImageSize,
  validateImageType,
  getImageDimensions,
} from './imageOptimization';

// Export security utilities
export {
  isSafeUrl,
  sanitizeUrl,
  escapeHtml,
  isValidImageUrl,
  validateTitle,
  validateUrl,
  validatePin,
  sanitizeText,
} from './security';

// Export crypto utilities
export {
  hashPin,
  verifyPin,
  generateDeviceId,
  generateSalt,
} from './crypto';

// Export rate limiter
export {
  RateLimiter,
  syncRateLimiter,
  apiRateLimiter,
} from './rateLimit';
