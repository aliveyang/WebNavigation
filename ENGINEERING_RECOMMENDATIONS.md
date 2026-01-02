# 工程建议 (Engineering Recommendations)

本文档提供了 NavHub 项目的工程改进建议，帮助提升代码质量、可维护性和开发体验。

---

## 📋 当前状态评估

### ✅ 已完成的优化

- **模块化架构** - 代码已从单文件拆分为清晰的模块结构
- **TypeScript 支持** - 完整的类型定义
- **PWA 支持** - 已配置 Service Worker 和离线缓存
- **云同步功能** - 基于 Vercel KV 的多设备同步
- **响应式设计** - 移动优先的 UI 设计

### 🔧 待改进项

以下是建议的改进方向，按优先级排序：

---

## 🎯 高优先级建议

### 1. 代码质量工具配置

**问题**: 项目中有 `.eslintrc.json` 和 `.prettierrc.json` 文件，但可能未完全配置。

**建议**:

```bash
# 安装 ESLint 和 Prettier 依赖
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
npm install -D eslint-plugin-react eslint-plugin-react-hooks
```

**配置示例** (`.eslintrc.json`):
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "react", "react-hooks"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

**添加脚本** (`package.json`):
```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css,md}\""
  }
}
```

---

### 2. 测试框架

**问题**: 项目缺少测试，难以保证代码质量和重构安全性。

**建议**: 添加 Vitest + React Testing Library

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event jsdom
```

**配置** (`vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

**测试示例** (`src/components/__tests__/BookmarkCard.test.tsx`):
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookmarkCard } from '../BookmarkCard';

describe('BookmarkCard', () => {
  it('renders bookmark title', () => {
    const bookmark = {
      id: '1',
      title: 'Test',
      url: 'https://test.com',
      colorFrom: 'from-blue-500',
      colorTo: 'to-blue-600',
    };

    render(<BookmarkCard item={bookmark} gridCols={4} onLongPress={vi.fn()} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

**添加脚本**:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

### 3. 自定义 Hooks 提取

**问题**: `App.tsx` 中有大量状态管理逻辑，可以提取为自定义 Hooks。

**建议**: 创建以下 Hooks

**`src/hooks/useBookmarks.ts`**:
```typescript
import { useState, useEffect } from 'react';
import { Bookmark } from '../types';
import { STORAGE_KEY } from '../constants';

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setBookmarks(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  }, [bookmarks]);

  const addBookmark = (bookmark: Bookmark) => {
    setBookmarks(prev => [...prev, bookmark]);
  };

  const updateBookmark = (id: string, data: Partial<Bookmark>) => {
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
  };

  const deleteBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  return { bookmarks, addBookmark, updateBookmark, deleteBookmark };
};
```

**`src/hooks/useLongPress.ts`**:
```typescript
import { useRef, useCallback } from 'react';

export const useLongPress = (
  onLongPress: () => void,
  delay = 1500
) => {
  const timerRef = useRef<NodeJS.Timeout>();
  const isLongPressRef = useRef(false);

  const start = useCallback(() => {
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  return { start, clear, isLongPress: isLongPressRef };
};
```

---

### 4. 错误边界 (Error Boundary)

**问题**: 缺少全局错误处理，应用崩溃时用户体验差。

**建议**: 添加错误边界组件

**`src/components/ErrorBoundary.tsx`**:
```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-slate-400 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**使用**:
```typescript
// index.tsx
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
```

---

## 🚀 中优先级建议

### 5. 性能优化

**建议**:

1. **使用 React.memo 优化组件渲染**:
```typescript
// src/components/BookmarkCard.tsx
export const BookmarkCard = React.memo(({ item, gridCols, onLongPress }) => {
  // ...
});
```

2. **使用 useMemo 缓存计算结果**:
```typescript
const gridColsClass = useMemo(() => {
  switch (settings.gridCols) {
    case 2: return 'grid-cols-2';
    case 3: return 'grid-cols-3';
    // ...
  }
}, [settings.gridCols]);
```

3. **使用 useCallback 缓存回调函数**:
```typescript
const handleSaveBookmark = useCallback((data: Partial<Bookmark>) => {
  // ...
}, [selectedBookmark]);
```

---

### 6. 环境变量管理

**问题**: 云同步 API 端点硬编码在代码中。

**建议**: 使用环境变量

**`.env.example`**:
```env
VITE_API_BASE_URL=https://your-domain.com
VITE_SYNC_API_ENDPOINT=/api/sync
```

**使用**:
```typescript
// src/syncManager.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const SYNC_ENDPOINT = import.meta.env.VITE_SYNC_API_ENDPOINT || '/api/sync';
```

---

### 7. 日志系统

**建议**: 添加结构化日志

**`src/utils/logger.ts`**:
```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDev = import.meta.env.DEV;

  private log(level: LogLevel, message: string, data?: any) {
    if (!this.isDev && level === 'debug') return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    console[level === 'debug' ? 'log' : level](`${prefix} ${message}`, data || '');
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }
}

export const logger = new Logger();
```

---

### 8. CI/CD 配置

**建议**: 添加 GitHub Actions 工作流

**`.github/workflows/ci.yml`**:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

---

## 💡 低优先级建议

### 9. 国际化 (i18n)

**建议**: 使用 `react-i18next` 支持多语言

```bash
npm install react-i18next i18next
```

---

### 10. 组件文档

**建议**: 使用 Storybook 或 Docusaurus 创建组件文档

```bash
npx storybook@latest init
```

---

### 11. 数据导出/导入功能

**建议**: 添加书签导出为 JSON 和导入功能

```typescript
export const exportBookmarks = (bookmarks: Bookmark[]) => {
  const data = JSON.stringify(bookmarks, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `navhub-bookmarks-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
```

---

### 12. 分析和监控

**建议**: 集成分析工具（如 Google Analytics 或 Plausible）

---

## 📊 代码质量指标

建议设置以下目标：

- **测试覆盖率**: ≥ 70%
- **TypeScript 严格模式**: 启用
- **ESLint 错误**: 0
- **构建大小**: < 500KB (gzipped)
- **Lighthouse 分数**: ≥ 90

---

## 🔄 实施路线图

### 第一阶段（1-2 周）
1. ✅ 配置 ESLint 和 Prettier
2. ✅ 添加错误边界
3. ✅ 提取自定义 Hooks

### 第二阶段（2-3 周）
4. ✅ 添加测试框架和基础测试
5. ✅ 性能优化（memo, useMemo, useCallback）
6. ✅ 环境变量管理

### 第三阶段（3-4 周）
7. ✅ CI/CD 配置
8. ✅ 日志系统
9. ✅ 数据导出/导入功能

### 第四阶段（按需）
10. ✅ 国际化支持
11. ✅ 组件文档
12. ✅ 分析和监控

---

## 📝 总结

这些建议旨在提升项目的：
- **可维护性** - 通过测试和代码质量工具
- **开发体验** - 通过 Hooks 和工具配置
- **用户体验** - 通过性能优化和错误处理
- **可扩展性** - 通过模块化架构和文档

建议按优先级逐步实施，避免一次性改动过大。每个阶段完成后进行充分测试，确保功能稳定。
