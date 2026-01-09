export type Language = 'en' | 'zh';

export interface Translations {
  // Header
  appName: string;

  // Search
  searchPlaceholder: string;

  // Action Sheet
  actionsFor: string;
  addNewShortcut: string;
  editShortcut: string;
  deleteShortcut: string;
  cancel: string;

  // Edit Modal
  addShortcut: string;
  editShortcutTitle: string;
  titlePlaceholder: string;
  urlPlaceholder: string;
  save: string;
  update: string;

  // Background Types
  color: string;
  library: string;
  icon: string;
  image: string;
  shuffleColor: string;
  shuffleGradient: string;
  chooseLocalImage: string;
  imageNote: string;
  faviconPreview: string;

  // Settings
  appSettings: string;
  layoutDensity: string;
  cols: string;
  searchEngine: string;
  globalBackground: string;
  default: string;
  gradient: string;
  cardAppearance: string;
  iconSize: string;
  iconTopMargin: string;
  textSize: string;
  textTopMargin: string;
  resetToDefault: string;
  closeSettings: string;
  language: string;

  // Sync Modal
  cloudSync: string;
  syncEnabled: string;
  syncDisabled: string;
  lastSync: string;
  enterPin: string;
  pinPlaceholder: string;
  enableSync: string;
  enabling: string;
  syncNow: string;
  syncing: string;
  disableSync: string;
  syncNote: string;
  syncNote2: string;
  pinNote: string;

  // Common
  close: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Header
    appName: 'NavHub',

    // Search
    searchPlaceholder: 'Search {engine}...',

    // Action Sheet
    actionsFor: 'Actions for "{title}"',
    addNewShortcut: 'Add New Shortcut',
    editShortcut: 'Edit Shortcut',
    deleteShortcut: 'Delete Shortcut',
    cancel: 'Cancel',

    // Edit Modal
    addShortcut: 'Add Shortcut',
    editShortcutTitle: 'Edit Shortcut',
    titlePlaceholder: 'Title (e.g. YouTube)',
    urlPlaceholder: 'URL or App (e.g. youtube.com, spotify:)',
    save: 'Save',
    update: 'Update',

    // Background Types
    color: 'Color',
    library: 'Library',
    icon: 'Icon',
    image: 'Image',
    shuffleColor: 'Shuffle Color',
    shuffleGradient: 'Shuffle Gradient',
    chooseLocalImage: 'Choose Local Image',
    imageNote: 'Note: Large images may affect performance.',
    faviconPreview: 'Favicon Preview',

    // Settings
    appSettings: 'App Settings',
    layoutDensity: 'Layout Density',
    cols: 'Cols',
    searchEngine: 'Search Engine',
    globalBackground: 'Global Background',
    default: 'Default',
    gradient: 'Gradient',
    cardAppearance: 'Card Appearance',
    iconSize: 'Icon Size',
    iconTopMargin: 'Icon Top Margin',
    textSize: 'Text Size',
    textTopMargin: 'Text Top Margin',
    resetToDefault: 'Reset to Default',
    closeSettings: 'Close Settings',
    language: 'Language',

    // Sync Modal
    cloudSync: 'Cloud Sync',
    syncEnabled: 'Sync Enabled',
    syncDisabled: 'Sync Disabled',
    lastSync: 'Last sync',
    enterPin: 'Enter a PIN code (4+ characters) to enable multi-device sync. Use the same PIN on other devices to sync your bookmarks.',
    pinPlaceholder: 'Enter PIN code (e.g., 1234)',
    enableSync: 'Enable Sync',
    enabling: 'Enabling...',
    syncNow: 'Sync Now',
    syncing: 'Syncing...',
    disableSync: 'Disable Sync',
    syncNote: 'Your bookmarks are automatically synced when you make changes. Use "Sync Now" to force an immediate sync.',
    syncNote2: 'Both cloud and local have bookmarks',
    pinNote: 'Note: Your PIN code is used to identify your sync account. Keep it secure and don\'t share it with others.',

    // Common
    close: 'Close',
  },
  zh: {
    // Header
    appName: 'NavHub',

    // Search
    searchPlaceholder: '搜索 {engine}...',

    // Action Sheet
    actionsFor: '"{title}" 的操作',
    addNewShortcut: '添加新快捷方式',
    editShortcut: '编辑快捷方式',
    deleteShortcut: '删除快捷方式',
    cancel: '取消',

    // Edit Modal
    addShortcut: '添加快捷方式',
    editShortcutTitle: '编辑快捷方式',
    titlePlaceholder: '标题（例如：YouTube）',
    urlPlaceholder: '网址或应用（例如：youtube.com、spotify:）',
    save: '保存',
    update: '更新',

    // Background Types
    color: '颜色',
    library: '图标库',
    icon: '图标',
    image: '图片',
    shuffleColor: '随机颜色',
    shuffleGradient: '随机渐变',
    chooseLocalImage: '选择本地图片',
    imageNote: '注意：大图片可能影响性能。',
    faviconPreview: '图标预览',

    // Settings
    appSettings: '应用设置',
    layoutDensity: '布局密度',
    cols: '列',
    searchEngine: '搜索引擎',
    globalBackground: '全局背景',
    default: '默认',
    gradient: '渐变',
    cardAppearance: '卡片外观',
    iconSize: '图标大小',
    iconTopMargin: '图标上边距',
    textSize: '文字大小',
    textTopMargin: '文字上边距',
    resetToDefault: '恢复默认',
    closeSettings: '关闭设置',
    language: '语言',

    // Sync Modal
    cloudSync: '云同步',
    syncEnabled: '同步已启用',
    syncDisabled: '同步已禁用',
    lastSync: '上次同步',
    enterPin: '输入 PIN 码（4位以上）以启用多设备同步。在其他设备上使用相同的 PIN 码来同步您的书签。',
    pinPlaceholder: '输入 PIN 码（例如：1234）',
    enableSync: '启用同步',
    enabling: '启用中...',
    syncNow: '立即同步',
    syncing: '同步中...',
    disableSync: '禁用同步',
    syncNote: '您的书签会在更改时自动同步。使用"立即同步"强制立即同步。',
    syncNote2: '云端和本地都有书签',
    pinNote: '注意：您的 PIN 码用于识别您的同步账户。请妥善保管，不要与他人分享。',

    // Common
    close: '关闭',
  }
};

export function getTranslation(lang: Language, key: keyof Translations, params?: Record<string, string>): string {
  let text = translations[lang][key];

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      text = text.replace(`{${key}}`, value);
    });
  }

  return text;
}
