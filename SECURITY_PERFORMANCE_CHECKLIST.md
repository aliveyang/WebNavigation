# 安全与性能快速检查清单

快速参考指南，用于日常开发中的安全和性能检查。

---

## 🔒 安全检查清单

### 代码审查时必查项

#### ✅ 输入验证
```typescript
// ❌ 危险
const url = userInput;
window.location.href = url;

// ✅ 安全
const url = sanitizeUrl(userInput);
if (isSafeUrl(url)) {
  window.location.href = url;
}
```

#### ✅ URL 协议检查
```typescript
// 禁止的协议
const DANGEROUS = ['javascript:', 'data:', 'vbscript:', 'file:'];

// 允许的协议
const SAFE = ['http:', 'https:'];
```

#### ✅ XSS 防护
```typescript
// ❌ 危险：直接插入 HTML
element.innerHTML = userInput;

// ✅ 安全：使用 textContent 或转义
element.textContent = userInput;
// 或
element.innerHTML = escapeHtml(userInput);
```

#### ✅ 敏感数据
```typescript
// ❌ 危险：明文存储
localStorage.setItem('pin', pin);

// ✅ 安全：加密存储
const hashedPin = await hashPin(pin);
localStorage.setItem('pin_hash', hashedPin);
```

---

## ⚡ 性能检查清单

### 组件优化

#### ✅ 使用 React.memo
```typescript
// ❌ 每次父组件更新都重新渲染
const BookmarkCard = ({ item }) => { ... };

// ✅ 只在 props 变化时重新渲染
const BookmarkCard = React.memo(({ item }) => { ... });
```

#### ✅ 使用 useCallback
```typescript
// ❌ 每次渲染创建新函数
const handleClick = () => { ... };

// ✅ 缓存函数引用
const handleClick = useCallback(() => { ... }, [deps]);
```

#### ✅ 使用 useMemo
```typescript
// ❌ 每次渲染都计算
const expensiveValue = computeExpensiveValue(a, b);

// ✅ 缓存计算结果
const expensiveValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

### 资源优化

#### ✅ 图片优化
```typescript
// 检查项：
- [ ] 图片已压缩（< 500KB）
- [ ] 使用 WebP 格式
- [ ] 添加 loading="lazy"
- [ ] 设置合适的尺寸
```

#### ✅ 代码分割
```typescript
// ❌ 全部打包在一起
import EditModal from './EditModal';

// ✅ 按需加载
const EditModal = lazy(() => import('./EditModal'));
```

#### ✅ Bundle 大小
```bash
# 检查 bundle 大小
npm run build
ls -lh dist/assets/

# 目标：
# - JS < 200KB (gzipped)
# - CSS < 50KB (gzipped)
```

---

## 🚨 常见安全漏洞

### 1. XSS (跨站脚本)
**风险代码**：
```typescript
<div dangerouslySetInnerHTML={{ __html: userInput }} />
<img src={userInput} />
window.location.href = userInput;
```

**修复**：
```typescript
<div>{escapeHtml(userInput)}</div>
<img src={isValidImageUrl(userInput) ? userInput : placeholder} />
window.location.href = sanitizeUrl(userInput);
```

### 2. 敏感数据泄露
**风险代码**：
```typescript
console.log('PIN:', pin);
localStorage.setItem('password', password);
```

**修复**：
```typescript
// 生产环境移除 console.log
if (process.env.NODE_ENV !== 'production') {
  console.log('Debug info');
}

// 加密存储
const encrypted = await encrypt(password);
localStorage.setItem('password_hash', encrypted);
```

### 3. 不安全的依赖
**检查**：
```bash
npm audit
npm outdated
```

**修复**：
```bash
npm audit fix
npm update
```

---

## 🎯 性能优化快速修复

### 1. 减少重新渲染
```typescript
// 问题：组件频繁重新渲染
// 解决：
1. 使用 React.memo
2. 拆分大组件
3. 使用 useCallback/useMemo
4. 避免在 render 中创建对象/数组
```

### 2. 优化图片加载
```typescript
// 问题：图片加载慢
// 解决：
1. 压缩图片（< 500KB）
2. 使用 WebP 格式
3. 添加 loading="lazy"
4. 使用 CDN
5. 设置合适的尺寸
```

### 3. 减少 Bundle 大小
```typescript
// 问题：首次加载慢
// 解决：
1. 代码分割（lazy loading）
2. Tree shaking
3. 移除未使用的依赖
4. 压缩代码
5. 使用 CDN 加载第三方库
```

---

## 📊 性能指标

### 目标值
```
FCP (First Contentful Paint)    < 1.8s
LCP (Largest Contentful Paint)  < 2.5s
FID (First Input Delay)         < 100ms
CLS (Cumulative Layout Shift)   < 0.1
TTI (Time to Interactive)       < 3.8s
Bundle Size (gzipped)           < 200KB
```

### 测试命令
```bash
# Lighthouse
npx lighthouse http://localhost:5174 --view

# Bundle 分析
npm run build
npx vite-bundle-visualizer

# Web Vitals
npm install web-vitals
```

---

## 🔍 代码审查检查点

### 提交前检查

```bash
# 1. 运行 linter
npm run lint

# 2. 运行测试
npm run test

# 3. 检查 bundle 大小
npm run build
ls -lh dist/assets/

# 4. 安全审计
npm audit

# 5. 性能测试
npx lighthouse http://localhost:5174
```

### PR 审查检查

- [ ] 所有用户输入都经过验证
- [ ] 没有使用 dangerouslySetInnerHTML
- [ ] URL 已清理和验证
- [ ] 敏感数据已加密
- [ ] 组件使用了 memo/useCallback/useMemo
- [ ] 图片已优化
- [ ] 没有引入大型依赖
- [ ] 测试覆盖率 > 70%
- [ ] 没有 console.log（生产环境）
- [ ] 没有 TODO 或 FIXME

---

## 🛠️ 常用工具

### 安全工具
```bash
# 依赖审计
npm audit

# 查找敏感信息
git secrets --scan

# 代码扫描
npm install -D eslint-plugin-security
```

### 性能工具
```bash
# Lighthouse
npx lighthouse <url>

# Bundle 分析
npx vite-bundle-visualizer

# 性能监控
npm install web-vitals

# 图片优化
npm install sharp
```

---

## 📚 快速参考

### 安全函数模板

```typescript
// URL 验证
export const isSafeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

// HTML 转义
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#x27;', '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, (c) => map[c]);
};

// PIN 加密
export const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};
```

### 性能优化模板

```typescript
// 防抖
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// 节流
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// 图片压缩
export const compressImage = async (
  file: File,
  maxWidth = 800,
  quality = 0.8
): Promise<string> => {
  // ... 实现见完整文档
};
```

---

## ⚠️ 禁止事项

### 绝对不要做

```typescript
// ❌ 永远不要
eval(userInput);
new Function(userInput);
innerHTML = userInput;
location.href = userInput;
localStorage.setItem('password', password);

// ❌ 避免
console.log(sensitiveData);
alert(errorDetails);
fetch(url, { mode: 'no-cors' });
```

### 必须做

```typescript
// ✅ 总是
- 验证所有用户输入
- 清理 URL
- 加密敏感数据
- 使用 HTTPS
- 定期更新依赖
- 运行安全审计
- 测试性能
```

---

## 📞 紧急响应

### 发现安全漏洞

1. **立即**停止受影响的功能
2. 评估影响范围
3. 修复漏洞
4. 部署补丁
5. 通知用户（如需要）
6. 记录事件

### 性能问题

1. 使用 Lighthouse 诊断
2. 检查 Network 面板
3. 分析 Bundle 大小
4. 检查组件渲染次数
5. 优化关键路径
6. 测试验证

---

## 🎓 学习资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web.dev](https://web.dev/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [MDN Security](https://developer.mozilla.org/en-US/docs/Web/Security)

---

**记住**：安全和性能不是一次性任务，而是持续的过程。定期审查和更新是关键。
