export type BackgroundType = 'gradient' | 'icon' | 'image' | 'library';
export type GlobalBackgroundType = 'default' | 'gradient' | 'image';

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

export interface AppSettings {
  gridCols: number;
  searchEngine: string;
  globalBgType: GlobalBackgroundType;
  globalBgImage?: string;
  globalBgGradient?: { from: string; to: string };
}
