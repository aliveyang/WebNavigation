# 安全与性能建议

本文档提供 NavHub 项目的安全和性能优化建议，帮助构建更安全、更快速的应用。

---

## 🔒 安全建议

### 1. XSS (跨站脚本攻击) 防护

#### 当前风险

**高风险区域**：
- 用户输入的书签标题和 URL
- 自定义图片 URL
- 搜索查询参数

**潜在问题**：
```typescript
// ❌ 危险：直接使用用户输入的 URL
<img src={bgImage} />

// ❌ 危险：URL 可能包含 javascript: 协议
window.location.href = bookmark.url;
```

#### 解决方案

**1. URL 验证和清理**

创建 `src/utils/security.ts`：

```typescript
/**
 * 验证 URL 是否安全
 */
export const isSafeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    // 只允许 http 和 https 协议
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

/**
 * 清理 URL，移除危险协议
 */
export const sanitizeUrl = (url: string): string => {
  const trimmed = url.trim();

  // 检查危险协议
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
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

  return trimmed;
};

/**
 * 清理 HTML 字符串，防止 XSS
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
 * 验证图片 URL
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;

  // 允许 base64 图片
  if (url.startsWith('data:image/')) {
    return true;
  }

  // 验证 HTTP(S) URL
  if (!isSafeUrl(url)) {
    return false;
  }

  // 检查图片扩展名
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowerUrl.includes(ext));
};
```

**2. 在组件中使用**

```typescript
// src/App.tsx
import { sanitizeUrl, isValidImageUrl } from './utils/security';

const handleSaveBookmark = (data: Partial<Bookmark>) => {
  // 清理 URL
  const cleanUrl = sanitizeUrl(data.url || '');

  // 验证图片 URL
  if (data.bgImage && !isValidImageUrl(data.bgImage)) {
    alert('Invalid image URL');
    return;
  }

  const newBookmark: Bookmark = {
    // ...
    url: cleanUrl,
    bgImage: data.bgImage,
  };

  // ...
};
```

**3. 内容安全策略 (CSP)**

在 `index.html` 中添加 CSP meta 标签：

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://aistudiocdn.com;
  style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com;
  img-src 'self' data: https: http:;
  connect-src 'self' https://api.vercel.com;
  font-src 'self' data:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
">
```

---

### 2. 敏感数据保护

#### 当前风险

**问题**：
- PIN 码以明文存储在 localStorage
- 同步数据可能被拦截

#### 解决方案

**1. PIN 码加密存储**

```typescript
// src/utils/crypto.ts
/**
 * 简单的哈希函数（用于 PIN 码）
 */
export const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * 验证 PIN 码
 */
export const verifyPin = async (pin: string, hashedPin: string): Promise<boolean> => {
  const hash = await hashPin(pin);
  return hash === hashedPin;
};
```

**2. 使用加密存储**

```typescript
// src/syncManager.ts
import { hashPin } from './utils/crypto';

class SyncManager {
  async enableSync(pin: string) {
    // 存储哈希后的 PIN
    const hashedPin = await hashPin(pin);
    localStorage.setItem('navhub_sync_pin_hash', hashedPin);

    // 使用哈希作为云端键名
    this.syncKey = hashedPin;
  }
}
```

**3. HTTPS 强制**

在 `vite.config.ts` 中添加：

```typescript
export default defineConfig({
  server: {
    https: process.env.NODE_ENV === 'production',
  },
  build: {
    // 在生产环境检查 HTTPS
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
});
```

---

### 3. 依赖安全

#### 建议

**1. 定期审计依赖**

```bash
# 检查已知漏洞
npm audit

# 自动修复
npm audit fix

# 查看详细报告
npm audit --json
```

**2. 添加依赖检查到 CI**

```yaml
# .github/workflows/security.yml
name: Security Audit

on:
  schedule:
    - cron: '0 0 * * 0'  # 每周日运行
  push:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm audit --audit-level=moderate
```

**3. 使用 Dependabot**

创建 `.github/dependabot.yml`：

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

---

### 4. API 安全

#### 当前风险

**问题**：
- 云同步 API 缺少速率限制
- 没有请求签名验证

#### 解决方案

**1. 添加速率限制**

```typescript
// src/utils/rateLimit.ts
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private timeWindow: number;

  constructor(maxRequests = 10, timeWindowMs = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    // 清理过期的请求记录
    this.requests = this.requests.filter(time => now - time < this.timeWindow);

    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

export const syncRateLimiter = new RateLimiter(10, 60000); // 10 requests per minute
```

**2. 在 syncManager 中使用**

```typescript
// src/syncManager.ts
import { syncRateLimiter } from './utils/rateLimit';

async pushToCloud(bookmarks: Bookmark[], settings: AppSettings) {
  if (!syncRateLimiter.canMakeRequest()) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  // ... 执行同步
}
```

**3. 添加请求超时**

```typescript
const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};
```

---

### 5. 输入验证

#### 解决方案

**创建验证工具**

```typescript
// src/utils/validation.ts
export const validators = {
  /**
   * 验证书签标题
   */
  title: (value: string): { valid: boolean; error?: string } => {
    if (!value || value.trim().length === 0) {
      return { valid: false, error: 'Title is required' };
    }
    if (value.length > 50) {
      return { valid: false, error: 'Title must be less than 50 characters' };
    }
    // 检查特殊字符
    if (/<script|javascript:|onerror=/i.test(value)) {
      return { valid: false, error: 'Title contains invalid characters' };
    }
    return { valid: true };
  },

  /**
   * 验证 URL
   */
  url: (value: string): { valid: boolean; error?: string } => {
    if (!value || value.trim().length === 0) {
      return { valid: false, error: 'URL is required' };
    }

    // 检查危险协议
    if (/^(javascript|data|vbscript|file):/i.test(value)) {
      return { valid: false, error: 'Invalid URL protocol' };
    }

    // 验证 URL 格式
    try {
      const url = value.includes('://') ? value : `http://${value}`;
      new URL(url);
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  },

  /**
   * 验证 PIN 码
   */
  pin: (value: string): { valid: boolean; error?: string } => {
    if (!value || value.length < 4) {
      return { valid: false, error: 'PIN must be at least 4 characters' };
    }
    if (value.length > 20) {
      return { valid: false, error: 'PIN must be less than 20 characters' };
    }
    return { valid: true };
  },
};
```

---

## ⚡ 性能建议

### 1. Bundle 大小优化

#### 当前状态分析

```bash
# 分析 bundle 大小
npm run build
npx vite-bundle-visualizer
```

#### 优化方案

**1. 代码分割**

```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';

// 懒加载大型组件
const EditModal = lazy(() => import('./components/EditModal'));
const SyncModal = lazy(() => import('./components/SyncModal'));

const App = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {isEditModalOpen && <EditModal {...props} />}
      {isSyncModalOpen && <SyncModal {...props} />}
    </Suspense>
  );
};
```

**2. Tree Shaking 优化**

```typescript
// ❌ 不好：导入整个库
import * as Icons from './constants/icons';

// ✅ 好：按需导入
import { PRESET_ICONS } from './constants/icons';
```

**3. 移除未使用的代码**

```bash
# 安装工具
npm install -D vite-plugin-compression

# vite.config.ts
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
  ],
});
```

---

### 2. 图片优化

#### 当前问题

- 用户上传的图片未压缩
- 没有图片尺寸限制
- 缺少图片格式验证

#### 解决方案

**1. 图片压缩**

```typescript
// src/utils/imageOptimization.ts
/**
 * 压缩图片
 */
export const compressImage = async (
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // 计算缩放比例
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // 转换为 base64
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * 验证图片大小
 */
export const validateImageSize = (file: File, maxSizeMB = 5): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};
```

**2. 使用 WebP 格式**

```typescript
/**
 * 转换为 WebP 格式（如果浏览器支持）
 */
export const convertToWebP = async (file: File): Promise<string> => {
  // 检查浏览器支持
  const canvas = document.createElement('canvas');
  const supportsWebP = canvas.toDataURL('image/webp').startsWith('data:image/webp');

  if (!supportsWebP) {
    return compressImage(file);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/webp', 0.8));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};
```

**3. 图片懒加载**

```typescript
// src/components/BookmarkCard.tsx
const BookmarkCard = ({ item }: { item: Bookmark }) => {
  return (
    <img
      src={item.bgImage}
      loading="lazy"
      decoding="async"
      alt={item.title}
    />
  );
};
```

---

### 3. 渲染性能优化

#### 优化方案

**1. 虚拟化长列表**

如果书签数量很多（>100），使用虚拟滚动：

```bash
npm install react-window
```

```typescript
// src/components/BookmarkGrid.tsx
import { FixedSizeGrid } from 'react-window';

const BookmarkGrid = ({ bookmarks, gridCols }: Props) => {
  const columnCount = gridCols;
  const rowCount = Math.ceil(bookmarks.length / columnCount);

  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * columnCount + columnIndex;
    const bookmark = bookmarks[index];

    if (!bookmark) return null;

    return (
      <div style={style}>
        <BookmarkCard item={bookmark} />
      </div>
    );
  };

  return (
    <FixedSizeGrid
      columnCount={columnCount}
      columnWidth={150}
      height={600}
      rowCount={rowCount}
      rowHeight={150}
      width={800}
    >
      {Cell}
    </FixedSizeGrid>
  );
};
```

**2. 使用 React.memo**

```typescript
// src/components/BookmarkCard.tsx
export const BookmarkCard = React.memo(({ item, gridCols, onLongPress }) => {
  // ...
}, (prevProps, nextProps) => {
  // 自定义比较函数
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.gridCols === nextProps.gridCols
  );
});
```

**3. 防抖和节流**

```typescript
// src/utils/performance.ts
/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * 节流函数
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
```

**使用示例**：

```typescript
// 搜索输入防抖
const handleSearchInput = debounce((query: string) => {
  performSearch(query);
}, 300);

// 滚动事件节流
const handleScroll = throttle(() => {
  updateScrollPosition();
}, 100);
```

---

### 4. 网络性能优化

#### 优化方案

**1. Service Worker 缓存策略**

```typescript
// vite.config.ts
VitePWA({
  workbox: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'tailwind-cache',
          expiration: {
            maxEntries: 5,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
          },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
    ],
  },
});
```

**2. 预加载关键资源**

```html
<!-- index.html -->
<head>
  <!-- 预连接到 CDN -->
  <link rel="preconnect" href="https://cdn.tailwindcss.com">
  <link rel="preconnect" href="https://aistudiocdn.com">

  <!-- 预加载关键资源 -->
  <link rel="preload" href="/icon-192.png" as="image">

  <!-- DNS 预解析 -->
  <link rel="dns-prefetch" href="https://api.vercel.com">
</head>
```

**3. 资源压缩**

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 移除 console.log
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'utils': ['./src/utils/index.ts'],
        },
      },
    },
  },
});
```

---

### 5. 性能监控

#### 实施方案

**1. Web Vitals 监控**

```bash
npm install web-vitals
```

```typescript
// src/utils/analytics.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export const reportWebVitals = () => {
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);
};

// 在生产环境发送到分析服务
export const sendToAnalytics = (metric: any) => {
  if (process.env.NODE_ENV === 'production') {
    // 发送到 Google Analytics 或其他服务
    console.log('Metric:', metric);
  }
};
```

**2. 性能预算**

创建 `performance-budget.json`：

```json
{
  "budgets": [
    {
      "resourceSizes": [
        {
          "resourceType": "script",
          "budget": 300
        },
        {
          "resourceType": "total",
          "budget": 500
        }
      ]
    }
  ]
}
```

**3. Lighthouse CI**

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on: [push]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:3000
          uploadArtifacts: true
```

---

## 📊 性能指标目标

### 关键指标

| 指标 | 目标 | 当前 | 优先级 |
|------|------|------|--------|
| FCP (First Contentful Paint) | < 1.8s | ? | 高 |
| LCP (Largest Contentful Paint) | < 2.5s | ? | 高 |
| FID (First Input Delay) | < 100ms | ? | 中 |
| CLS (Cumulative Layout Shift) | < 0.1 | ? | 中 |
| TTI (Time to Interactive) | < 3.8s | ? | 高 |
| Bundle Size (gzipped) | < 200KB | ? | 高 |

### 测试工具

```bash
# Lighthouse
npx lighthouse http://localhost:5174 --view

# Bundle 分析
npm run build
npx vite-bundle-visualizer

# 性能分析
npm run dev
# 打开 Chrome DevTools > Performance
```

---

## 🎯 实施优先级

### 立即实施（高优先级）

1. ✅ **XSS 防护** - URL 验证和清理
2. ✅ **图片压缩** - 限制上传大小
3. ✅ **React.memo** - 优化组件渲染
4. ✅ **CSP 配置** - 添加内容安全策略

### 短期实施（中优先级）

5. ✅ **PIN 码加密** - 使用哈希存储
6. ✅ **速率限制** - 防止 API 滥用
7. ✅ **代码分割** - 懒加载大型组件
8. ✅ **依赖审计** - 定期检查漏洞

### 长期实施（低优先级）

9. ✅ **虚拟滚动** - 优化大量书签场景
10. ✅ **性能监控** - Web Vitals 集成
11. ✅ **Lighthouse CI** - 自动化性能测试

---

## 📝 检查清单

### 安全检查

- [ ] 所有用户输入都经过验证和清理
- [ ] URL 协议已验证（禁止 javascript:, data: 等）
- [ ] 图片 URL 已验证
- [ ] PIN 码已加密存储
- [ ] CSP 已配置
- [ ] HTTPS 已启用（生产环境）
- [ ] 依赖已审计（无高危漏洞）
- [ ] API 有速率限制
- [ ] 敏感数据不在日志中

### 性能检查

- [ ] Bundle 大小 < 200KB (gzipped)
- [ ] 图片已压缩和优化
- [ ] 组件使用 React.memo
- [ ] 回调使用 useCallback
- [ ] 计算使用 useMemo
- [ ] 大型组件已懒加载
- [ ] Service Worker 已配置
- [ ] 关键资源已预加载
- [ ] Lighthouse 分数 > 90

---

## 🔗 相关资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web.dev Performance](https://web.dev/performance/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
