# 代码审查修复方案（NavHub）

> **来源**：2026-08-23 全量代码审查（git main @ 89f5247）
> **范围**：`src/`、`api/`、`vercel.json`、`vite.config.ts`、`index.html`
> **目标**：先解决安全与数据一致性问题，再清理死代码与 UX 冲突。
> **原则**：按优先级排序，P1/P2 完成后即交付验证；不做大范围架构重写。

---

## 优先级概览

| 编号 | 问题 | 严重度 | 工作量 | 状态 |
| --- | --- | --- | --- | --- |
| P1 | 同步 API 无服务端限流，PIN 可枚举 | 🔴 高 | 中 | 待修复 |
| P2 | 自动同步无防抖，触发限流/频繁写入 | 🔴 高 | 小 | 待修复 |
| P3 | 云端数据未校验直接渲染（XSS 链路） | 🟠 中高 | 小 | 待修复 |
| P4 | Vite define 注入 API Key 到 bundle | 🟠 中 | 极小 | 待修复 |
| P5 | 长按菜单与拖拽手势冲突 | 🟠 中 | 中 | 待修复 |
| P6 | 大量死代码（未使用的模块/导出） | 🟡 中 | 中 | 待修复 |
| P7 | 低优先级杂项（同步写入频率、硬编码版本号、重复 confirm 逻辑等） | 🟢 低 | 中 | 待修复 |

> **补充（2026-08-23 ponytail-audit 结论）**：P6 的死代码清单已细化并部分扩展，见 P6 小节内的"审计验证清单"；P7 新增 vitest 配置指向不存在的 `src/test/setup.ts`、.eslintrc/.prettierrc 无对应脚本依赖两项。

---

## P1. 同步 API 无服务端限流，PIN 可枚举（安全：高）

### 问题分析

`api/sync/get.ts` 与 `api/sync/save.ts` 仅校验 PIN 长度 ≥ 4，无任何服务端限流/鉴权。客户端将 **未加盐的 SHA-256 PIN 哈希** 直接作为 KV key（`sync:<hash>:bookmarks`）与 URL 查询参数（`/api/sync/get?pin=<hash>`）传输。由于 `hashPin` 是公开逻辑，攻击者可：

1. 离线枚举 4~6 位数字 PIN 的全部 SHA-256 值（约 10^4~10^6 个，秒级完成）；
2. 直接请求 `/api/sync/get?pin=<哈希>` 读取任何用户的书签（**信息泄露**）；
3. 调用 `POST /api/sync/save` 覆盖他人数据（**数据篡改**）。

另外，客户端限流（`syncRateLimiter`，10 次/分钟）只在浏览器内存中，刷新即失效，不构成防护。

### 修复方案

**A. 服务端限流（必做，第 1 步）**
- 在 `api/sync/save.ts` 与 `api/sync/get.ts` 增加按 IP 的固定窗口限流：用 Vercel KV 计数（key `ratelimit:<ip>`, TTL 60s，阈值如 GET 20/分钟、POST 10/分钟）。
- 可用 `x-forwarded-for` 获取 IP（Vercel 代理后）；注意 `vercel.json` 的 rewrites 会作用于 `/api/*` 之外的路径，API 本身不会被 rewrite。
- 达到阈值返回 `429` + `{ error: 'Too many requests' }`。

**B. 提高 PIN 安全边界（必做，第 2 步）**
- 客户端 `validatePin`（`src/utils/security.ts`）最小值从 4 提升到 **8 位**；`syncManager.enableSync` 同步修改校验。
- 哈希改为 **加盐**：`hashPin(pin, salt)`，盐保存在客户端 localStorage 与 KV key 无关（仅提高离线枚举成本；服务端无法防枚举的根本手段是限流+高熵 PIN）。
- 若改动哈希方式，需要兼容旧数据：`enableSync` 时若检测到旧格式（无盐）则重新哈希。

**C. 传输方式（可选增强）**
- 将 PIN 从 URL query 移到 POST body 或 header（`api/sync/get.ts` 当前是 GET，可改为 POST + body），避免进入访问日志/缓存。
- `api/sync/save.ts` 增加请求体大小上限（如 1MB），防御超大 payload。

### 验收标准

- [ ] 同一 IP 超过阈值后返回 429，客户端显示友好错误
- [ ] 枚举 4 位 PIN 的自动脚本命中限流
- [ ] 新的 8 位 + 加盐 PIN 正常启用/同步
- [ ] 旧 PIN（4~7 位）用户升级后提示重新设置

---

## P2. 自动同步无防抖（可靠性与性能：高）

### 问题分析

`src/App.tsx:88-94`：只要 `bookmarks`/`settings` 变化（每次拖拽、滑杆拖动、加删书签），立即调用 `syncManager.pushToCloud()`。没有防抖、没有比对时间戳。后果：

- 拖拽排序一次会连续触发多次推送（每个中间态一次）；
- `syncRateLimiter` 10 次/分钟后，第 11 次抛 `Rate limit exceeded`（且错误被 `.catch(console.error)` 静默吞掉，用户无感知）；
- 云端 KV 频繁写入，成本与延迟上升。

`syncManager.ts` 已实现 `debouncedPush(bookmarks, settings, delay)`（默认 1000ms）但**从未被使用**。

### 修复方案

1. `App.tsx` 自动同步改用 `syncManager.debouncedPush(bookmarks, settings, 2000)`（2 秒防抖，覆盖一次拖拽的多状态）。
2. 在 `pushToCloud` 前增加 `lastModified` 比较：优先在 `SyncManager` 内做，若本地 `navhub_last_modified` 与云端一致则跳过推送（避免无变化也写库）。
3. `pushToCloud` 失败时：保留 `syncStatus.error`，并设置重试标记（可选：下一次变化时再试，不额外轮询）。
4. 手动同步（SyncModal 内）不受影响，仍即时执行。

### 验收标准

- [ ] 连续拖拽/编辑 10+ 次，1 分钟内实际推送次数 ≤ 5
- [ ] 无内容变化时不产生推送
- [ ] 限流错误不再刷 console（改为 toast 提示一次）

---

## P3. 云端数据未校验直接渲染（XSS 链路：中高）

### 问题分析

`SyncModal.tsx` / `App.tsx` 将云端返回的 `bookmarks` 直接 `SET_BOOKMARKS`，未经过任何校验。`BookmarkCard.tsx:110` 将 `item.url` 直接渲染到 `<a href>`。若另一台共享同一 PIN 的设备（或 P1 攻击者）推入 `javascript:alert(1)` 的 URL，本地用户点击卡片即执行脚本（存储型 XSS）。

注意：`validateTitle` 只拦截 `<script|javascript:|onerror=|...` 的正则，且不用于云端数据；`validateUrl` 允许自定义协议（`xxx:` 正则）因此也会放行 `javascript:` —— 必须在**保存入口**拦截危险协议。

### 修复方案

1. 在云端数据落地 React state 前，逐条校验：
   - `Bookmark.url` 必须通过 `isSafeUrl`（并修正 `isSafeUrl` 排除 `javascript:`/`data:`/`vbscript:`，见 P5 附带逻辑修正说明，实际归入本项）；
   - 否则替换为 `about:blank` 或丢弃该条并 toast 提示。
2. 收口点：在 `AppContext` 新增 `SANITIZE_BOOKMARKS` action，或在 `SyncModal` 的 `onSyncComplete` 前统一处理——**推荐放到 reducer 外层工具函数 `sanitizeBookmarks(list)`**，同步与本地加载共用。
3. `BookmarkCard` 渲染时对 `href` 再做一次 `sanitizeUrl` 兜底（防御纵深）。

### 验收标准

- [ ] 云端返回含 `javascript:` URL 的书签，前端不渲染该链接、不执行脚本
- [ ] 本地新增 URL 依旧被校验（回归）

---

## P4. Vite define 注入 API Key（安全：中）

### 问题分析

`vite.config.ts:171-174`：

```ts
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
},
```

只要 `.env` 中存在 `GEMINI_API_KEY`，该值就会被打进前端 bundle（任何用户可见）。全代码库 **无任何地方引用** `process.env.API_KEY` / `GEMINI_API_KEY`（grep 无结果），属遗留死配置。

### 修复方案

- **直接删除** `define` 块。若未来需要调用第三方服务，一律走 Serverless Function 服务端持有密钥（`api/*` 中读取 `process.env`），永不注入前端。
- 顺带删除 `vite.config.ts` 中 `loadEnv` 的 `''` 第三参数（无用途）。

### 验收标准

- [ ] 构建产物中无 `GEMINI_API_KEY` / `API_KEY` 字样

---

## P5. 长按菜单与拖拽手势冲突（UX：中）

### 问题分析

两套独立手势并存且**互相竞争**：

- `BookmarkCard.tsx:22`：自实现 2 秒长按 → 打开 ActionSheet（进度条 UI）
- `BookmarkList.tsx:46`：`TouchSensor` delay 1000ms → 触发拖拽

移动端长按卡片：1 秒时 dnd-kit 激活拖拽，2 秒时又弹出菜单，行为不可预测。且 `BookmarkList.tsx:6` 仍导入未使用的 `PointerSensor`（上轮修复 `MouseSensor` 后遗留）。README 宣传的 "长按 (800ms) 呼出菜单；长按后拖拽 (250ms)" 与代码现状（1000ms/2000ms）也不一致。

### 修复方案

**方案 A（推荐，最小改动）**：统一为 dnd-kit 单一条
- 移除 `BookmarkCard` 内联长按（含 `startPress`/`cancelPress`/`isPressing` 进度条 UI），长按菜单逻辑全部由 `BookmarkList` 的传感器决策；
- `TouchSensor` 增加 `onActivation` 或自定义 `useSensor` + `activationConstraint: { delay: 500, tolerance: 5 }`：拖拽激活前 500ms 内未松手则视为长按 → 打开 ActionSheet（在 `onDragStart` 判断 `event.active` 后延迟取消）；
- 实现细节：dnd-kit 没有内置"长按但禁止拖拽"，可用 `onDragStart` 中 `event.activatorEvent` 的 `type === 'touchstart'` + 计时判断，超过阈值则 `event.preventDefault` 并取消（`setActiveId(null)`）。

**方案 B（彻底）**：引入 `use-long-press`（README 已提及但未安装）或统一用 `onPointerDown` 手势状态机：按下 → 500ms 长按触发菜单；超过 10px 移动 → 交给 dnd-kit 拖拽。工作量较大。

**先决清理**：删除 `BookmarkList.tsx` 中未使用的 `PointerSensor` import。

### 验收标准

- [ ] 移动端长按卡片：只在 500~800ms 后弹出菜单，不触发拖拽
- [ ] 移动端按住后移动 ≥10px：只拖拽，不弹菜单
- [ ] PC 端右键菜单、左键拖拽不受影响

---

## P6. 死代码清理（维护性：中）

以下内容经全库 grep 确认**零引用**，建议删除（或补齐实现后再恢复）：

| 位置 | 内容 | 建议 |
| --- | --- | --- |
| `src/hooks/useLongPress.ts` | 整个 hook（卡片已自实现长按） | 删除 + 从 `src/hooks/index.ts` 移除导出 |
| `src/hooks/useLocalStorage.ts` | `useDebouncedLocalStorage`（名不副实，注释自述"有矛盾"）+ `useLocalStorage` | 删除文件 + 索引导出；仅保留 `useOnline`/`useMediaQuery` |
| `src/components/ui/Toast.tsx` | `useToast` hook 与全局 `toast` 对象（与 AppContext toast 体系重复） | 删除这两个导出，保留 `ToastContainer` |
| `src/syncManager.ts` | `sync()`（双向合并，未使用）、`debouncedPush()` 被 P2 启用 → **保留** | `sync()` 删除 |
| `src/utils/rateLimit.ts` | `apiRateLimiter` 实例 | 删除导出 |
| `src/utils/lruCache.ts` | `LRUCache`/`LRUCacheWithTTL`/`imageCache`/`apiCache`，整个文件 | 删除文件 + 索引导出 |
| `src/utils/storage.ts` | `debouncedSaveToStorage`、`StorageBatcher`/`storageBatcher` | 删除（App 用同步 `saveToStorage`） |
| `src/utils/security.ts` | `escapeHtml`/`sanitizeText`/`validateTitle` 中未用部分 | 保留（被引用），仅清理明显冗余 |
| `vite.config.ts` | `manualChunks` 的 `utils`/`constants` 说明性注释 | 保留（尚有效） |
| `src/components/index.ts` | 导出 `useToast`/`toast` | 随 Toast.tsx 一并移除 |

**注意**：删除前再次用 IDE 或 `grep -rn` 核对引用；`faviconCache`、`getFaviconUrl`、`syncRateLimiter` 等**已被使用**，不要误删。

### 验收标准

- [ ] `npm run build` 通过（删除后无导入错误）
- [ ] 运行时无 `undefined` 引用错误（重点 Toast、storage）

---

## P7. 低优先级杂项（可按批次处理）

| 项 | 位置 | 建议 |
| --- | --- | --- |
| localStorage 高频写入 | `App.tsx:83-96` | 书签持久化也做 500ms 防抖（复用 `debouncedSaveToStorage` 或 `storageBatcher`）——注意与 P2 配合设计，避免 double-write |
| 版本号硬编码 | `SyncModal.tsx:205` `v1.1.0` | 改为从 `package.json` 导入（或定义单一常量 `APP_VERSION`） |
| 重复 confirm 逻辑 | `SyncModal.tsx` `handleEnableSync` / `handleManualSync` | 提取公共函数 `mergeWithCloud(local, cloud)`，冲突弹窗中英文混杂文案统一按 `language` 输出 |
| 非原子写入 | `api/sync/save.ts` Promise.all | 先写 bookmarks/settings，最后写 lastModified；或接受最终一致性并注释 |
| `isSafeUrl` 协议逻辑矛盾 | `src/utils/security.ts:57-72` | 将 `javascript:`/`data:`/`vbscript:` 从"允许自定义协议"分支显式排除（与 P3 联动） |
| `isValidImageUrl` 域名匹配 | `src/utils/security.ts:152-153` | `includes` 改为 `URL.hostname` 精确匹配 + 白名单后缀 |
| 未装依赖的构建工具 | `vite.config.ts` minify: `'terser'` | `terser` 在 package-lock 中存在（vite 可选依赖），若 build 报错则显式加入 devDependencies |
| README 手势参数陈旧 | `README.md` "800ms/250ms" | 与最终手势参数（P5 结论）同步 |

---

## 实施顺序建议

1. **冲刺 1（安全）**：P1 服务端限流 + PIN 强度 + P4 删除 define + P3 云端校验。→ 部署验证。
2. **冲刺 2（可靠性）**：P2 防抖推送 + P7 localStorage 防抖。
3. **冲刺 3（UX）**：P5 手势统一。
4. **冲刺 4（清理）**：P6 死代码 + P7 剩余杂项，全量回归（构建 + 手工测试移动/PC 手势、同步、图片上传）。

## 遗留风险

- P1 的"PIN 枚举"在纯客户端哈希方案下无法彻底消除（不持有服务端密钥），限流是主要防御；若产品对安全性要求高，P1-C 可升级为引入 Vercel Edge Config / Vercel KV 存储带随机盐的密码派生（PBKDF2），成本较高，本期不实施。
- `api/sync/get.ts` 的 GET + query 方案在 CDN 日志/代理中记录哈希，若无法改 POST 至少保持哈希非明文。
- 本仓库 `node_modules` 未安装，**实施前先 `npm install` 并运行 `npm run build` 建立基线**。
