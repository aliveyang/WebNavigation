# AGENTS.md — 项目开发规范（NavHub）

> **权威规范**：本文件是仓库内 AI 代理（Claude Code、ZCode 等）与人工开发共同遵循的唯一权威规范。
> **快捷方式**：仓库根目录 `CLAUDE.md` 与 `AGENTS.md` 为 **Windows 硬链接**（同一文件的两个名字，改动任一个即同步）。本机重建命令：`mklink /H CLAUDE.md AGENTS.md`（管理员权限下可用 `mklink` 创建符号链接）。请直接编辑本文件。

---

## 1. 项目速览

NavHub 是一个**移动优先的个人导航仪表板（起始页）**，以 PWA 形式运行：卡片网格管理书签、自定义外观、拖拽排序、可选云端同步（PIN 鉴权，Vercel KV）。

| 项目名 | NavHub |
| --- | --- |
| 版本 | 1.2.0（`package.json` 为准；`SyncModal.tsx` 经 `__APP_VERSION__` 自动读取，无需手动同步） |
| 技术栈 | React 19 + TypeScript + Vite 6 + Tailwind CSS（构建期编译）+ @dnd-kit + Vercel KV |
| 平台 | Web PWA；无 Node 服务端，API 为 Vercel Serverless Functions |
| 包管理器 | npm（`package-lock.json` 锁定） |
| 默认语言 | 中文（`zh`），支持英文（`en`） |

---

## 2. 开发命令与验证基线

```bash
npm install          # 安装依赖
npm run dev          # 开发服务器 http://localhost:5173
npm run build        # 生产构建（输出 dist/）
npm run preview      # 预览生产构建
npm run lint         # ESLint 检查（flat config）
npm test             # Vitest 单测（vitest run）
npx tsc --noEmit     # 类型检查（strict 已开启）
```

**每次改动后必做**：`npm run lint`、`npm test`、`npx tsc --noEmit` 全部通过；涉及构建配置时跑 `npm run build`。
本地 `api/` 需 `vercel dev` 才能运行；`vite dev` 下 `/api/sync/*` 会 404（属预期）。

---

## 3. 目录结构与关键文件

```
WebNavigation/
├── index.html              # HTML 入口：CSP
├── src/styles.css           # Tailwind 构建期入口（@tailwind 指令）
├── index.tsx               # React 挂载入口
├── eslint.config.js        # ESLint flat config
├── vitest.config.ts        # Vitest 配置（node 环境）
├── AGENTS.md / CLAUDE.md   # ★ 本规范（硬链接）
├── src/
│   ├── App.tsx             # 应用外壳：状态加载/持久化/自动同步/模态框组装
│   ├── store/context/      # AppContext：全局状态（唯一数据源）
│   ├── components/         # UI 组件（bookmark/ settings/ sync/ ui/ onboarding/）
│   ├── constants/          # 静态数据（icons、gradients、searchEngines、storage）
│   ├── hooks/              # 自定义 Hooks（useOnline、useMediaQuery 等）
│   ├── i18n.ts             # 自研轻量国际化（en/zh）
│   ├── syncManager.ts      # 云同步单例
│   ├── types/index.ts      # TypeScript 类型定义（集中）
│   └── utils/              # 工具库（security、crypto、storage、performance...）
├── api/sync/               # Serverless Functions（get / save）
├── public/                 # PWA 静态资源
├── doc/                    # 文档目录（见第 10 节）
├── vercel.json             # Vercel 配置（headers、rewrites）
└── vite.config.ts          # Vite + PWA + 构建优化
```

**关键模块职责**：

| 模块 | 职责 | 约束 |
| --- | --- | --- |
| `store/context/AppContext.tsx` | 全局状态唯一数据源 | 持久化（localStorage）只在 `App.tsx` 的 useEffect 中做，组件不自行写 |
| `syncManager.ts` | enableSync / pullFromCloud / pushToCloud / 状态订阅 | 客户端限流 10 次/分钟；所有操作先校验 `pinHash` |
| `utils/security.ts` | URL/标题/PIN 校验净化 | 拦截 `javascript:` `data:` `vbscript:`；白名单见 `ALLOWED_LOCAL_PROTOCOLS` |
| `utils/crypto.ts` | SHA-256 哈希、随机 ID/盐 | 用 Web Crypto API；**禁止明文存储 PIN** |
| `BookmarkCard.tsx` | 卡片渲染 + 长按手势 + memo | 手势计时与 dnd-kit 激活需一致（当前有冲突，见第 11 节 P5） |

---

## 4. 数据与存储约定

**localStorage Keys**：

| Key | 内容 |
| --- | --- |
| `navhub_bookmarks` | 书签数组 |
| `navhub_settings` | 应用设置（列数、搜索引擎、背景、语言） |
| `navhub_sync_pin_hash` | PIN 派生密钥（PBKDF2-SHA256，仅启用同步时存在；旧版无盐 SHA-256 账户在启用同步时经 `/api/sync/migrate` 自动迁移） |
| `navhub_device_id` / `navhub_last_modified` | 设备 ID / 云端最后修改时间戳 |
| `navhub_has_visited` / `navhub_favicon_cache` | 引导标记（`'true'`）/ Favicon 缓存 |

**云端（Vercel KV）**：key 前缀 `sync:<pin哈希>:`（bookmarks / settings / lastModified）。

---

## 5. 代码规范（必守）

| 维度 | 规则 |
| --- | --- |
| 类型安全 | 所有模块有 TS 类型；**禁止 `any`**（存量已清零，`tsconfig.strict` + lint 强制）；props 显式 interface |
| 状态管理 | 全局状态经 `useApp()` / `useBookmarks` / `useSettings` / `useUI` / `useToasts` 访问；新增 action 须同步扩展 `AppAction` + reducer + `actions` |
| 国际化 | 用户可见文案必须 en+zh 双语（`src/i18n.ts`）；用 `getTranslation(language, 'key')`；**禁止硬编码文案**（`BookmarkCard.tsx` 等遗留硬编码属技术债，新代码遵守） |
| 样式 | Tailwind 原子类；构建期编译（`src/styles.css` + `tailwind.config.js`，**禁止**改回 CDN 运行时方案）；**禁止新增 CSS 文件或样式库**（`src/styles.css` 为唯一例外）；深色主题（`bg-slate-900` 底、`blue-600` 强调、`red-400` 危险色）；动画用 `animate-in` 系列 |
| 组件 | 函数组件 + Hooks；回调 `useCallback`、派生值 `useMemo`；列表项用 `React.memo` + 自定义比较；浮层用 `createPortal` 到 `document.body` |
| 命名 | 组件 `PascalCase.tsx`；hooks `useXxx.ts`；工具 `camelCase.ts` |
| 质量 | 提交前 `npm run lint` + `npm test` + `npx tsc --noEmit` 全绿；生产构建 terser 压缩、移除 `console.*`；防御性代码优先，避免冗余抽象（YAGNI） |

---

## 6. 安全红线（逐条执行）

1. **URL 必须校验**：保存前 `validateUrl` + `sanitizeUrl`；从云端拉取的书签在渲染前也须校验（当前缺口 → P3）。
2. **危险协议拦截**：`javascript:` / `data:` / `vbscript:` 一律拒绝。
3. **PIN 安全**：只存派生密钥、不存明文；**最低 8 位**；云端凭据用 PBKDF2（`derivePinKey`）派生，禁止回退到无盐 SHA-256 直哈希。
4. **服务端限流**：`api/sync/*` 必须有服务端限流，不能只依赖客户端（→ P1）。
5. **CSP 一致性**：`index.html`（meta）与 `vercel.json`（headers）的 CSP 必须同步；新增外部域名两处都改。
6. **密钥不注入前端**：任何密钥不得经 `vite.config.ts` 的 `define` 打进 bundle；第三方密钥一律放 Serverless Function（`api/*` 读 `process.env`）。

---

## 7. 常见修改指南

| 目的 | 位置 |
| --- | --- |
| 新增搜索引擎 | `src/constants/searchEngines.ts` |
| 新增/修改图标 | `src/constants/icons.ts` |
| 新增翻译 | `src/i18n.ts`（en + zh 同时） |
| 修改默认设置 | `src/constants/defaultSettings.ts`（AppContext 与 settingsSanitize 共用） |
| 修改卡片手势/外观 | `src/components/BookmarkCard.tsx` |
| 修改拖拽逻辑 | `src/components/bookmark/BookmarkList.tsx` + `SortableItem.tsx` |
| 修改云同步 | `src/syncManager.ts` + `api/sync/*.ts` |
| 修改 CSP/部署头 | `index.html` 与 `vercel.json` **两边同步改**。一致性策略（F2）：**vercel.json 为权威**（部署后实际生效的是 header 版），meta 版仅供本地 dev 生效。允许的已知差异：header 版多 `frame-ancestors 'none'`（meta 中本就不生效）；meta 版 `connect-src` 含 `registry.npmmirror.com`/`www.google.com` 供 dev 场景。新增外部域名时若与部署相关，两处都改 |

---

## 8. 测试与验证

- **测试框架**：Vitest（`vitest.config.ts`，node 环境，测试文件 `src/**/*.test.ts`），运行 `npm test`。
- **现有覆盖**：`utils/security.test.ts`（URL/PIN 校验、清洗）、`utils/settingsSanitize.test.ts`（设置白名单）、`store/context/appReducer.test.ts`（reducer）、`syncManager.test.ts`（同步指纹短路/migrate，stub localStorage/fetch）。
- **新增逻辑优先保持纯函数并补测试**；纯 UI 交互以手工清单兜底。
- **手工验证清单**：移动端长按/拖拽、PC 右键菜单、图片上传、云同步（启用/禁用/手动/冲突）、PWA 安装、离线。

---

## 9. 提交与发布

- 提交前缀：`feat:` `fix:` `chore:` `docs:` `style:` `refactor:` `perf:`。
- 功能变更同步更新 `doc/release/CHANGELOG.md`（Keep a Changelog 格式）。
- 版本号以 `package.json` 为权威，发布时同步 SyncModal 中的版本标签与根 README。

---

## 10. 文档结构与维护

```
WebNavigation/
├── AGENTS.md            # ★ 本规范（权威，根目录）
├── CLAUDE.md            # 硬链接 → AGENTS.md（同一文件）
├── doc/
│   ├── README.md        # 文档索引总览（登记所有文档）
│   ├── plans/           # 方案类（修复方案、实施计划、评审报告）
│   └── release/         # 发布类（CHANGELOG.md）
└── README.md            # 项目说明（面向用户）
```

**维护规则**：规范只写一份（本文件）；其他文档链接引用、不复制全文；新增/移动文档须在 `doc/README.md` 登记。修改规范请编辑 `AGENTS.md`（CLAUDE.md 因硬链接自动同步）。

---

## 11. 已知技术债（速查）

最新审查结论与修复方案见 `doc/plans/audit-report-2026-09-02.md`（批次修复已完成：第一批 dfde307、第二批 7ed3cae、第三批 ae2ac99、第四批见本次提交）。已闭环项不再列；剩余开放项：

1. **`isSafeUrl`/`validateUrl`/`sanitizeUrl` 协议语义**（低）：白名单形同虚设，实际语义为"仅拒绝 3 种危险协议"。为产品决策——本地应用协议（`spotify:`、`vscode:` 等）属有意支持，但 `ALLOWED_LOCAL_PROTOCOLS` 与"任意格式自定义协议放行"两套逻辑并存，易误导：建议明确为"白名单 ∪ 显式危险协议拦截"。硬编码 4->8 位 PIN 文案已 sync，但 `validatePin` 等错误文案仍为英文（依赖 UI 层翻译）.
2. **Context 全量重渲染**（中期优化）：已消除 value/actions 容器引用变化（C1），但 useApp 消费者仍订阅整个 state； 书签量大时可拆分 State/Dispatch context 或引入选择器。

3. **Tailwind 迁移构建期**（已完成）：首次构建不支持 JIT 运行时词法（`duration-[1500ms]`→`duration-500`、`pb-safe`→`pb-8`）；后续新增任意值类注意 `content` 扫描覆盖（`tailwind.config.js`）与 ambiguous 警告。
4. **i18n 覆盖**（收尾）：用户可见文案已全部收敛 `getTranslation`（含 ConfirmDialog、Onboarding、NetworkIndicator）；`validateTitle`/`validateUrl` 校验器错误信息仍为英文（供 UI 层展示，可后续翻译）。
