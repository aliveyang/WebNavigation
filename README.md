# NavHub - 智能导航助手

<div align="center">

> 🤖 **本项目由 Vibe Coding 辅助构建**

一个轻量级、移动优先的个人导航仪表板（起始页），支持 PWA 安装、云端同步、拖拽排序及高度个性化定制。

[功能特性](#功能特性) • [使用指南](#使用指南) • [技术栈](#技术栈) • [项目结构](#项目结构) • [部署](#部署)

</div>

---

## 功能特性

### 📱 核心体验

- **移动优先设计** - 专为触屏设备优化，支持从任何设备极速访问
- **极简极净界面** - <span style="background-color: #e6f7ff; color: #0077b6; padding: 2px 6px; border-radius: 4px;">New</span> 默认隐藏非核心按钮，打造沉浸式体验
- **拖拽排序** - <span style="background-color: #e6f7ff; color: #0077b6; padding: 2px 6px; border-radius: 4px;">New</span> PC 端直接拖拽，移动端长按后拖拽排序
- **PWA 支持** - 可安装为独立应用，支持离线访问，体验接近原生 App
- **国际化支持** - 支持中文/英文界面一键切换

### 🖱️ 交互升级

- **多模态操作** - <span style="background-color: #e6f7ff; color: #0077b6; padding: 2px 6px; border-radius: 4px;">New</span>
    - **移动端**: 长按 (800ms) 呼出操作菜单；长按后拖拽 (250ms) 实现排序
    - **PC 端**: 右键点击呼出菜单；左键拖拽排序
- **快捷菜单** - <span style="background-color: #e6f7ff; color: #0077b6; padding: 2px 6px; border-radius: 4px;">New</span> 统一的 ActionSheet 菜单，集成编辑、删除、设置与同步入口
- **首次引导** - 新用户友好的功能介绍

### 🎨 深度定制

- **卡片外观** - 自由调整图标大小、文字大小及间距
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
- **添加书签**: 首次使用点击屏幕中央按钮；已有书签时，通过**长按**任意书签 -> 选择"添加新快捷方式"。
- **编辑/删除**: **长按**任意书签 (移动端) 或 **右键点击** (PC) 调出操作菜单。
- **排序**: 
    - **移动端**: 长按书签片刻后拖动。
    - **PC 端**: 鼠标直接拖动卡片。

### 2. 个性化设置 & 云同步
所有全局功能均收纳在 **长按/右键菜单** 底部：
- **云同步 (☁️)**: 设置 PIN 码实现多设备同步。
- **应用设置 (⚙️)**: 调节布局密度、卡片外观和语言。

### 3. 多设备同步流程
1. 打开长按菜单，点击云图标。
2. 设置一个 **4位以上 PIN 码**。
3. 点击 **启用同步**。
4. 在新设备输入相同 PIN 码即可拉取数据。

---

## 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite 6
- **状态管理**: React Context API (`AppContext`) + Hooks
- **交互库**: @dnd-kit (拖拽), use-long-press
- **样式方案**: Tailwind CSS
- **PWA 支持**: vite-plugin-pwa
- **云存储**: Vercel KV (Redis)
- **国际化**: 自研轻量级 i18n 方案

### 架构特点

- **组件化重构** - 核心逻辑拆分为 `BookmarkEditModal`, `SettingsModal`, `SyncModal` 等独立组件
- **全局状态管理** - 使用 Context 统一管理书签、设置与 UI 状态
- **Serverless Ready** - 前后端分离，API 适配 Vercel Serverless Functions

---

## 项目结构

```
WebNavigation/
├── index.html              # HTML 入口
├── src/
│   ├── App.tsx             # 应用外壳与路由
│   ├── store/              # 全局状态 (Context)
│   ├── components/         # UI 组件库
│   │   ├── bookmark/       # 书签相关 (Card, List, Modals)
│   │   ├── settings/       # 设置相关
│   │   ├── sync/           # 同步相关
│   │   ├── ui/             # 通用 UI (ContextMenu, Toast...)
│   │   └── ...
│   ├── hooks/              # 自定义 Hooks
│   ├── i18n.ts             # 国际化配置
│   ├── syncManager.ts      # 云同步管理器
│   ├── types/              # TS 类型定义
│   └── utils/              # 工具函数库
├── public/                 # 静态资源
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

如不需要云同步，可直接部署 `dist/` 目录到任何静态托管服务 (GitHub Pages, Netlify 等)。应用仍可作为纯本地 PWA 使用。

---

## 许可证

MIT License
