# NavHub - 智能导航助手

<div align="center">

一个轻量级、移动优先的个人导航仪表板（起始页），支持 PWA 安装和云端同步。

[功能特性](#功能特性) • [技术栈](#技术栈) • [快速开始](#快速开始) • [使用指南](#使用指南) • [部署](#部署)

</div>

---

## 功能特性

### 📱 核心功能

- **移动优先设计** - 专为触屏设备优化，支持长按交互和触觉反馈
- **PWA 支持** - 可安装为独立应用，支持离线访问
- **云端同步** - 使用 PIN 码在多设备间同步书签和设置
- **本地存储** - 数据保存在浏览器 localStorage，无需登录
- **智能搜索** - 集成多个搜索引擎（Google、Bing、百度、DuckDuckGo）

### 🎨 书签定制

支持四种背景样式：
- **渐变色** - 自动生成的渐变背景 + 首字母
- **图标库** - 内置 50+ 精美 SVG 图标，涵盖系统、导航、社交、品牌、工具等多种类别
- **网站图标** - 自动获取网站 favicon
- **自定义图片** - 支持 URL 或本地上传

### ⚙️ 个性化设置

- **网格布局** - 2-6 列可调，适配不同屏幕尺寸
- **全局背景** - 支持默认/渐变/自定义图片三种模式
- **搜索引擎** - 可切换默认搜索引擎
- **深色主题** - 默认深色模式，护眼舒适

### 🔄 云同步功能

- 使用 4 位以上 PIN 码启用同步
- 自动检测冲突并提供解决方案
- 支持手动同步和自动同步
- 基于 Vercel KV 的可靠云存储

---

## 技术栈

- **前端框架**: React 19.2.1 + TypeScript
- **构建工具**: Vite 6.2.0
- **样式方案**: Tailwind CSS (CDN)
- **PWA 支持**: vite-plugin-pwa
- **云存储**: Vercel KV
- **状态管理**: React Hooks (useState, useEffect)

### 架构特点

- **模块化架构** - 组件化设计，代码按功能拆分为独立模块
- **无后端依赖** - 除云同步外，完全运行在浏览器中
- **CDN 加载** - React 通过 importmap 从 CDN 加载
- **Service Worker** - 自动缓存静态资源和 CDN 资源
- **TypeScript** - 完整的类型定义，提供更好的开发体验

---

## 快速开始

### 环境要求

- Node.js 16+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

开发服务器将在 `http://localhost:3000` 启动，并绑定到 `0.0.0.0` 以支持局域网访问。

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 预览生产版本

```bash
npm run preview
```

---

## 使用指南

### 添加书签

1. 点击右上角的 **+** 按钮
2. 输入标题和 URL（无需输入协议，默认添加 `http://`）
3. 选择背景样式：
   - **Color** - 随机渐变色，可点击"Shuffle Color"刷新
   - **Library** - 从系统、品牌、社交等 50+ 种预设图标中选择
   - **Icon** - 自动获取网站 favicon
   - **Image** - 输入图片 URL 或上传本地图片
4. 点击 **Save** 保存

### 编辑/删除书签

1. **长按**书签卡片 1.5 秒（会有进度条提示）
2. 在弹出的操作菜单中选择：
   - **Add New Shortcut** - 添加新书签
   - **Edit Shortcut** - 编辑当前书签
   - **Delete Shortcut** - 删除当前书签

### 应用设置

1. 点击编辑模态框右上角的 **齿轮图标**
2. 可调整：
   - **Layout Density** - 网格列数（2-6 列）
   - **Search Engine** - 默认搜索引擎
   - **Global Background** - 全局背景样式

### 启用云同步

1. 点击左上角的 **云图标**
2. 输入 4 位以上的 PIN 码
3. 点击 **Enable Sync**
4. 在其他设备上使用相同 PIN 码即可同步数据

**注意事项：**
- PIN 码用于标识您的同步账户，请妥善保管
- 首次启用同步时，如果云端和本地都有数据，会提示选择保留哪一方
- 启用同步后，数据会自动推送到云端（防抖 1 秒）

---

## 部署

### Vercel 部署（推荐）

1. 将代码推送到 GitHub 仓库
2. 在 [Vercel](https://vercel.com) 导入项目
3. 框架预设选择 **Vite**
4. 如需云同步功能，添加环境变量：
   - `KV_REST_API_URL` - Vercel KV REST API URL
   - `KV_REST_API_TOKEN` - Vercel KV REST API Token
5. 点击 **Deploy**

### 其他静态托管平台

支持部署到任何静态托管平台：
- Netlify
- Cloudflare Pages
- GitHub Pages
- Surge.sh

**构建命令**: `npm run build`
**输出目录**: `dist`

### 云同步 API 配置

如需启用云同步功能，需要部署以下 API 端点：

- `GET /api/sync/get?pin=<PIN>` - 获取云端数据
- `POST /api/sync/save` - 保存数据到云端

参考 `src/syncManager.ts` 了解 API 接口规范。

---

## 项目结构

```
WebNavigation/
├── index.html              # HTML 入口文件
├── index.tsx               # 应用入口（React 渲染）
├── src/
│   ├── App.tsx             # 主应用组件
│   ├── syncManager.ts      # 云同步管理器
│   ├── components/         # UI 组件
│   │   ├── BookmarkCard.tsx    # 书签卡片组件
│   │   ├── Header.tsx          # 头部组件
│   │   ├── SearchWidget.tsx    # 搜索组件
│   │   └── index.ts            # 组件导出
│   ├── constants/          # 常量定义
│   │   ├── gradients.ts        # 渐变色配置
│   │   ├── icons.ts            # 图标库
│   │   ├── searchEngines.ts    # 搜索引擎配置
│   │   ├── storage.ts          # 存储键名
│   │   └── index.ts            # 常量导出
│   ├── types/              # TypeScript 类型定义
│   │   └── index.ts            # 类型导出
│   ├── utils/              # 工具函数
│   │   └── index.ts            # 工具函数导出
│   └── hooks/              # 自定义 Hooks（预留）
├── public/
│   ├── icon-192.png        # PWA 图标 (192x192)
│   └── icon-512.png        # PWA 图标 (512x512)
├── vite.config.ts          # Vite 配置 + PWA 设置
├── package.json            # 依赖配置
├── tsconfig.json           # TypeScript 配置
└── CLAUDE.md               # Claude Code 项目指南
```

---

## 开发说明

### 代码架构

项目采用模块化架构，主要模块包括：

**组件层 (components/)**
- `BookmarkCard.tsx` - 书签卡片，支持长按交互
- `Header.tsx` - 应用头部，包含添加按钮和同步状态
- `SearchWidget.tsx` - 搜索栏组件

**业务逻辑层 (App.tsx)**
- `ActionSheet` - 底部操作菜单
- `EditModal` - 编辑/设置模态框
- `SyncModal` - 云同步配置模态框
- `App` - 主应用组件，管理状态和数据流

**数据层**
- `syncManager.ts` - 云同步逻辑，处理数据推送和拉取
- `constants/` - 应用常量（图标、渐变、搜索引擎等）
- `types/` - TypeScript 类型定义
- `utils/` - 工具函数（URL 格式化、文件转换等）

### 数据存储

应用使用两个 localStorage 键：
- `navhub_bookmarks` - 书签数据（Bookmark[] 数组）
- `navhub_settings` - 应用设置（AppSettings 对象）
- `navhub_sync_pin` - 同步 PIN 码（启用同步时）
- `navhub_device_id` - 设备唯一标识
- `navhub_last_modified` - 最后修改时间戳

### 类型定义

```typescript
interface Bookmark {
  id: string;
  title: string;
  url: string;
  colorFrom: string;
  colorTo: string;
  bgType?: 'gradient' | 'icon' | 'image' | 'library';
  bgImage?: string;
  iconKey?: string;
}

interface AppSettings {
  gridCols: number;
  searchEngine: string;
  globalBgType: 'default' | 'gradient' | 'image';
  globalBgImage?: string;
  globalBgGradient?: { from: string; to: string };
}
```

### 添加新图标

在 `src/constants/icons.ts` 的 `PRESET_ICONS` 对象中添加新的 SVG 路径数据：

```typescript
export const PRESET_ICONS: Record<string, string> = {
  'icon-name': 'M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z',
  
  // System Icons
  'settings': '...',
  'user': '...',
  
  // Brand Icons
  'github': '...',
  // ... 更多图标
};
```

图标应使用 24x24 viewBox。

---

## 注意事项

### URL 处理

- 默认协议为 **http://**（不是 https://）
- 输入 URL 时无需添加协议前缀
- 书签在**当前标签页**打开（不是新标签页）

### PWA 安装

- 生产环境需要 HTTPS 才能注册 Service Worker
- 开发模式已启用 PWA（`devOptions.enabled: true`）
- 图标文件必须放在 `public/` 目录

### 性能优化

- 大图片会影响性能，建议使用 URL 而非上传
- Service Worker 会缓存 CDN 资源（Tailwind CSS 和 React）
- 长按交互延迟为 1.5 秒，可在代码中调整

---

## 常见问题

**Q: 如何更改默认书签？**
A: 修改 `src/App.tsx` 中的 `defaults` 数组（约 805-810 行）。

**Q: 如何添加新的搜索引擎？**
A: 在 `src/constants/searchEngines.ts` 的 `SEARCH_ENGINES` 对象中添加新条目。

**Q: 云同步数据存储在哪里？**
A: 数据存储在 Vercel KV（Redis）中，使用 PIN 码作为键。

**Q: 可以导出/导入书签吗？**
A: 当前版本不支持，但可以通过浏览器开发者工具访问 localStorage 手动导出。

**Q: 为什么使用 http:// 而不是 https://？**
A: 这是设计选择，可在 `src/utils/index.ts` 的 `formatUrl` 函数中修改。

---

## 许可证

MIT License

---

## 贡献

欢迎提交 Issue 和 Pull Request！

---

<div align="center">

**NavHub** - 让导航更简单 ✨

</div>
