/**
 * 设置校验与合并工具（审计 B1 / A2）
 *
 * 云端拉取与 localStorage 加载的 settings 统一经本模块清洗：
 * 与 defaultSettings 深合并 + 字段白名单校验。
 * - 防止缺字段导致 `getTranslation(undefined, ...)` 等崩溃（B1）
 * - 防止 globalBgGradient 注入任意 body 类名、globalBgImage 注入非法 url()（A2）
 *
 * 注意：新增 AppSettings 字段时必须同步更新本白名单，否则该字段会被丢弃。
 */
import { AppSettings, CardAppearanceConfig, GlobalBackgroundType, Language } from '../types';
import { SEARCH_ENGINES } from '../constants';
import { defaultSettings } from '../constants/defaultSettings';
import { isValidImageUrl } from './security';

const GLOBAL_BG_TYPES: readonly GlobalBackgroundType[] = ['default', 'gradient', 'image'];
const LANGUAGES: readonly Language[] = ['en', 'zh'];

// 渐变类仅允许 Tailwind 预设色板 token（from-/to- + 色名 + 档位），
// 覆盖 GRADIENTS 预设与 defaultSettings，杜绝拼接进 document.body.className 的任意值
const TAILWIND_PALETTE =
  '(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)';
const GRADIENT_CLASS_RE = new RegExp(`^(from|to)-${TAILWIND_PALETTE}-(\\d{3})$`);

const asNumber = (value: unknown, fallback: number, min: number, max: number): number => {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
};

const asEnum = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

/**
 * 清洗设置对象：只保留白名单字段，非法值回落到默认值
 * @param raw 任意来源（云端 / localStorage / 部分更新）的设置数据
 */
export const sanitizeSettings = (raw: unknown): AppSettings => {
  const s = (raw && typeof raw === 'object' ? raw : {}) as Partial<AppSettings>;

  const sanitized: AppSettings = {
    gridCols: asNumber(s.gridCols, defaultSettings.gridCols, 2, 6),
    searchEngine:
      typeof s.searchEngine === 'string' && s.searchEngine in SEARCH_ENGINES
        ? s.searchEngine
        : defaultSettings.searchEngine,
    globalBgType: asEnum(s.globalBgType, GLOBAL_BG_TYPES, defaultSettings.globalBgType),
    language: asEnum(s.language, LANGUAGES, defaultSettings.language),
  };

  // 全局渐变：仅接受合法色板类
  const gradient = s.globalBgGradient as { from?: unknown; to?: unknown } | undefined;
  if (
    gradient &&
    typeof gradient.from === 'string' &&
    typeof gradient.to === 'string' &&
    GRADIENT_CLASS_RE.test(gradient.from) &&
    GRADIENT_CLASS_RE.test(gradient.to)
  ) {
    sanitized.globalBgGradient = { from: gradient.from, to: gradient.to };
  } else if (defaultSettings.globalBgGradient) {
    sanitized.globalBgGradient = { ...defaultSettings.globalBgGradient };
  }

  // 全局背景图：必须通过图片 URL 校验（拦截危险协议）
  if (typeof s.globalBgImage === 'string' && s.globalBgImage && isValidImageUrl(s.globalBgImage)) {
    sanitized.globalBgImage = s.globalBgImage;
  }

  // 卡片外观：数值收敛到安全范围；缺失时补全默认值
  const config = s.cardAppearanceConfig as Partial<CardAppearanceConfig> | undefined;
  if (config && typeof config === 'object') {
    sanitized.cardAppearanceConfig = {
      iconSize: asNumber(config.iconSize, 24, 8, 64),
      iconMarginTop: asNumber(config.iconMarginTop, 2, 0, 24),
      textSize: asNumber(config.textSize, 8, 4, 24),
      textMarginTop: asNumber(config.textMarginTop, 6, 0, 32),
    };
  } else if (defaultSettings.cardAppearanceConfig) {
    sanitized.cardAppearanceConfig = { ...defaultSettings.cardAppearanceConfig };
  }

  return sanitized;
};
