export type BackgroundType = 'gradient' | 'icon' | 'image' | 'library';
export type GlobalBackgroundType = 'default' | 'gradient' | 'image';
export type Language = 'en' | 'zh';

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  colorFrom: string;
  colorTo: string;
  bgType?: BackgroundType;
  bgImage?: string;
  iconKey?: string;
}

export interface MobileDenseConfig {
  iconSize: number;      // 图标大小 (px)
  iconMarginTop: number; // 图标上边距 (px)
  textSize: number;      // 文字大小 (px)
  textMarginTop: number; // 文字上边距 (px)
}

export interface AppSettings {
  gridCols: number;
  searchEngine: string;
  globalBgType: GlobalBackgroundType;
  globalBgImage?: string;
  globalBgGradient?: { from: string; to: string };
  mobileDenseConfig?: MobileDenseConfig;
  language: Language;
}
