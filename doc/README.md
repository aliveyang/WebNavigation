# 文档索引（NavHub）

本项目文档分布如下：**根目录 `AGENTS.md` 为权威开发规范**，其余文档统一收纳于 `doc/` 目录，按类别分类存储：

```
WebNavigation/
├── AGENTS.md                       # ★ 项目开发规范（权威，中文）
├── CLAUDE.md                       # 快捷方式：@AGENTS.md 导入规范全文
├── doc/
│   ├── README.md                   # ★ 本文档：索引总览
│   ├── plans/                      # 方案类
│   │   └── code-review-fix-plan.md # 代码审查修复方案（P1~P7）
│   └── release/                    # 发布类
│       └── CHANGELOG.md            # 版本变更记录（原根目录 CHANGELOG.md）
└── README.md                       # 项目说明（面向用户）
```

> 根目录不再承载详细文档；`CLAUDE.md` 是通过 `@AGENTS.md` 导入规范全文的快捷方式，供 Claude Code 等 AI 代理读取。
> 新增文档请按类别放入对应子目录，并在本文件登记。

---

## 按类别浏览

### 📘 规范类

| 文档 | 说明 | 适用读者 |
| --- | --- | --- |
| [../AGENTS.md](../AGENTS.md) | 项目开发规范：架构、约定、安全要求、部署、常见修改指南、已知技术债（权威，位于仓库根目录） | AI 代理 / 全体开发者 |

### 🗂️ 方案类（doc/plans/）

| 文档 | 说明 | 适用读者 |
| --- | --- | --- |
| [code-review-fix-plan.md](plans/code-review-fix-plan.md) | 2026-08-23 代码审查结论 → 分级修复方案（P1 安全 / P2 同步 / P3 XSS / P4 密钥 / P5 手势 / P6 死代码 / P7 杂项），含验收标准与实施顺序 | 开发者 / 维护者 |

### 🚀 发布类（doc/release/）

| 文档 | 说明 | 适用读者 |
| --- | --- | --- |
| [CHANGELOG.md](release/CHANGELOG.md) | Keep a Changelog 格式的版本历史，含升级指南 | 维护者 / 发布者 |

---

## 文档编写约定

1. **单一权威**：规范类内容只写一份（根目录 `AGENTS.md`），其他文档通过链接引用，不复制全文。
2. **中文为主**：规范与方案类文档使用中文；代码注释与提交信息语义化前缀（`feat:` / `fix:` / `docs:` 等）。
3. **登记制度**：新增/移动文档后，必须在本文档目录树与对应类别表格中登记。
4. **版本联动**：发布新版本时同步更新 `doc/release/CHANGELOG.md` 与根目录 README 中的版本号。
