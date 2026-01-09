# NavHub - 智能导航助手

<div align="center">

> 🤖 **本项目由 Vibe Coding 辅助构建**

一个轻量级、移动优先的个人导航仪表板（起始页），支持 PWA 安装、云端同步及高度个性化定制。

[功能特性](#功能特性) • [使用指南](#使用指南) • [技术栈](#技术栈) • [项目结构](#项目结构) • [部署](#部署)

</div>

---

## 功能特性

### 📱 核心体验

- **移动优先设计** - 专为触屏设备优化，支持长按交互和触觉反馈
- **PWA 支持** - 可安装为独立应用，支持离线访问，体验接近原生 App
- **国际化支持** - <span style="background-color: #e6f7ff; color: #0077b6; padding: 2px 6px; border-radius: 4px;">New</span> 支持中文/英文界面一键切换
- **高性能架构** - 内置图片优化、Favicon 缓存及防抖机制，极速响应

### 🎨 深度定制

- **卡片外观** - <span style="background-color: #e6f7ff; color: #0077b6; padding: 2px 6px; border-radius: 4px;">New</span> 自由调整图标大小、文字大小及间距
- **背景样式** - 支持四种书签背景模式：
  - **渐变色** - 自动生成的渐变背景
  - **图标库** - 内置 50+ 精美 SVG 图标
  - **网站图标** - 自动获取并缓存网站 Favicon
  - **自定义图片** - 支持上传本地图片或使用网络 URL
- **全局主题** - 默认深色模式，支持自定义全局背景图或渐变色

### 🛡️ 安全与隐私

- **本地存储** - 数据默认保存在浏览器 localStorage，并在本地加密
- **云端同步** - 基于 Vercel KV 的安全同步，使用 PIN 码鉴权
- **安全防护** - 内置 XSS 防护、请求限流及数据完整性校验

---

## 使用指南

### 1. 基础操作
- **添加/编辑/删除书签**: **长按**书签卡片 1.5 秒调出操作菜单。
- **搜索**: 顶部搜索栏支持切换搜索引擎（Google/Bing/百度等）。

### 2. 个性化设置
点击右上角 **齿轮图标** 进入设置：
- **Language**: 切换语言 (中文/English)。
- **Layout Density**: 调整网格列数 (2-6 列)。
- **Card Appearance**: <span style="background-color: #FFF0F0; color: #D8000C; padding: 2px 6px; border-radius: 4px;">New</span>
    - **Icon Size**: 调节图标尺寸
    - **Text Size**: 调节字体大小
    - **Margins**: 调节间距
- **Global Background**: 更换应用背景。

### 3. 云同步 (Cloud Sync)
实现多设备数据互通：
1. 点击左上角 **云图标**。
2. 设置一个 **4位以上 PIN 码**（作为您的同步凭证）。
3. 点击 **Enable Sync**。
4. 在新设备输入相同 PIN 码即可拉取数据。

---

## 技术栈

- **前端框架**: React 19.2.1 + TypeScript
- **构建工具**: Vite 6.2.0
- **样式方案**: Tailwind CSS
- **PWA 支持**: vite-plugin-pwa
- **云存储**: Vercel KV (Redis)
- **国际化**: 自研轻量级 i18n 方案
- **工具库**: 
  - `crypto` (加密)
  - `image-optimization` (图片压缩)

### 架构特点

- **模块化架构** - 清晰的组件、Hooks、Utils 分层
- **Serverless Ready** - 前后端分离，API 适配 Vercel Serverless Functions
- **类型安全** - 全覆盖的 TypeScript 类型定义

---

## 项目结构

```
WebNavigation/
├── index.html              # HTML 入口
├── src/
│   ├── App.tsx             # 主逻辑组件
│   ├── i18n.ts             # 国际化配置
│   ├── syncManager.ts      # 云同步管理器
│   ├── components/         # UI 组件库
│   │   ├── BookmarkCard.tsx
│   │   ├── Header.tsx
│   │   └── ...
│   ├── constants/          # 常量 (图标、配置)
│   ├── types/              # TS 类型定义
│   └── utils/              # 工具函数库
│       ├── crypto.ts       # 加密工具
│       ├── security.ts     # 安全防护
│       ├── performance.ts  # 性能监控
│       ├── imageOptimization.ts # 图片处理
│       └── ...
├── public/                 # 静态资源 (PWA Icons)
└── vite.config.ts          # Vite & PWA 配置
```

---

## 部署

### Vercel 部署（推荐）

1. Fork 本项目到 GitHub。
2. 在 Vercel 导入并在 Environment Variables 添加：
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
3. 部署即可获得完整的 PWA 和云同步功能。

### 静态部署

如不需要云同步，可直接部署 `dist/` 目录到任何静态托管服务 (GitHub Pages, Netlify 等)。

---

## 许可证

MIT License
