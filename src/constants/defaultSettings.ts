/**
 * 应用默认设置（唯一来源）
 * AppContext（初始 state）与 settingsSanitize（校验兜底值）共用
 */
import { AppSettings } from '../types';

export const defaultSettings: AppSettings = {
  gridCols: 4,
  searchEngine: 'google',
  globalBgType: 'default',
  globalBgGradient: { from: 'from-slate-900', to: 'to-slate-800' },
  cardAppearanceConfig: {
    iconSize: 24,
    iconMarginTop: 2,
    textSize: 8,
    textMarginTop: 6,
  },
  language: 'zh',
};
