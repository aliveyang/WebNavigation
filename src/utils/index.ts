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

export const imageUrlToBase64 = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 尝试跨域

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL('image/png');
        resolve(base64);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = url;
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
