import type { Language } from './types';

export type { Language };

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

  // Sync conflicts (D2: 原生 confirm 替换为 ConfirmDialog)
  syncConflictTitle: string;
  enableConflictHint: string;
  cloudBookmarksLabel: string;
  localBookmarksLabel: string;
  useCloudData: string;
  useLocalData: string;
  disableSyncConfirm: string;
  confirmOk: string;

  // Network Indicator
  networkOnline: string;
  networkOffline: string;
  networkBackOnline: string;

  // Context Menu
  copyLink: string;
  copiedToClipboard: string;

  // Bookmark Edit Modal（Favicon 区块与校验提示）
  faviconUrlLabel: string;
  copy: string;
  faviconTip: string;
  invalidImageUrl: string;
  imageUploadFailed: string;

  // Onboarding
  onboardingWelcomeTitle: string;
  onboardingWelcomeDesc: string;
  onboardingLongPressTitle: string;
  onboardingLongPressDesc: string;
  onboardingSyncTitle: string;
  onboardingSyncDesc: string;
  onboardingReadyTitle: string;
  onboardingReadyDesc: string;
  onboardingNext: string;
  onboardingStart: string;
  onboardingSkip: string;

  // Common
  close: string;
  edit: string;
  delete: string;
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
    enterPin: 'Enter a PIN code (8+ characters) to enable multi-device sync. Use the same PIN on other devices to sync your bookmarks.',
    pinPlaceholder: 'Enter PIN code (8+ characters)',
    enableSync: 'Enable Sync',
    enabling: 'Enabling...',
    syncNow: 'Sync Now',
    syncing: 'Syncing...',
    disableSync: 'Disable Sync',
    syncNote: 'Your bookmarks are automatically synced when you make changes. Use "Sync Now" to force an immediate sync.',
    syncNote2: 'Both cloud and local have bookmarks',
    pinNote: 'Note: Your PIN code is used to identify your sync account. Keep it secure and don\'t share it with others.',

    // Sync conflicts
    syncConflictTitle: 'Sync conflict detected',
    enableConflictHint: 'Both cloud and local have bookmarks. Choose which version to keep:',
    cloudBookmarksLabel: 'Cloud bookmarks',
    localBookmarksLabel: 'Local bookmarks',
    useCloudData: 'Use cloud data',
    useLocalData: 'Use local data',
    disableSyncConfirm: 'Disable sync? Your local data will not be affected.',
    confirmOk: 'OK',

    // Network Indicator
    networkOnline: 'Online',
    networkOffline: 'Offline',
    networkBackOnline: 'Back Online',

    // Context Menu
    copyLink: 'Copy Link',
    copiedToClipboard: 'Copied to clipboard!',

    // Bookmark Edit Modal
    faviconUrlLabel: 'Favicon URL (for Image mode):',
    copy: 'Copy',
    faviconTip: 'Tip: Copy this URL and paste it in Image mode to use.',
    invalidImageUrl: 'Invalid image URL. Please use a valid image URL or upload a local image.',
    imageUploadFailed: 'Image upload failed. Try a smaller file.',

    // Onboarding
    onboardingWelcomeTitle: 'Welcome to NavHub',
    onboardingWelcomeDesc: 'This is a minimal and efficient browser start page. Let me give you a quick tour.',
    onboardingLongPressTitle: 'Long Press to Edit',
    onboardingLongPressDesc: 'On mobile, long press any card to edit, delete or reorder. On desktop, right click to open menu.',
    onboardingSyncTitle: 'Cloud Sync',
    onboardingSyncDesc: 'Tap the settings icon to enable Cloud Sync. Sync your bookmarks across devices with just a PIN code.',
    onboardingReadyTitle: 'Ready to Go',
    onboardingReadyDesc: 'Now, add your favorite websites and customize your start page!',
    onboardingNext: 'Next',
    onboardingStart: 'Get Started',
    onboardingSkip: 'Skip Intro',

    // Common
    close: 'Close',
    edit: 'Edit',
    delete: 'Delete',
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
    enterPin: '输入 PIN 码（8位以上）以启用多设备同步。在其他设备上使用相同的 PIN 码来同步您的书签。',
    pinPlaceholder: '输入 PIN 码（8位以上）',
    enableSync: '启用同步',
    enabling: '启用中...',
    syncNow: '立即同步',
    syncing: '同步中...',
    disableSync: '禁用同步',
    syncNote: '您的书签会在更改时自动同步。使用"立即同步"强制立即同步。',
    syncNote2: '云端和本地都有书签',
    pinNote: '注意：您的 PIN 码用于识别您的同步账户。请妥善保管，不要与他人分享。',

    // Sync conflicts
    syncConflictTitle: '检测到同步冲突',
    enableConflictHint: '云端和本地都有书签，请选择保留哪一边：',
    cloudBookmarksLabel: '云端书签',
    localBookmarksLabel: '本地书签',
    useCloudData: '使用云端数据',
    useLocalData: '使用本地数据',
    disableSyncConfirm: '确定要禁用同步吗？本地数据不受影响。',
    confirmOk: '确定',

    // Network Indicator
    networkOnline: '在线',
    networkOffline: '离线模式',
    networkBackOnline: '网络已恢复',

    // Context Menu
    copyLink: '复制链接',
    copiedToClipboard: '已复制到剪贴板！',

    // Bookmark Edit Modal
    faviconUrlLabel: 'Favicon URL（用于 Image 模式）：',
    copy: '复制',
    faviconTip: '提示：复制此 URL，切换到 Image 模式粘贴即可使用。',
    invalidImageUrl: '图片地址无效，请使用有效的图片 URL 或上传本地图片。',
    imageUploadFailed: '图片上传失败，请尝试更小的文件。',

    // Onboarding
    onboardingWelcomeTitle: '欢迎使用 NavHub',
    onboardingWelcomeDesc: '这是一个极简、高效的浏览器起始页。让我为您简单介绍一下功能。',
    onboardingLongPressTitle: '长按编辑',
    onboardingLongPressDesc: '在手机上，长按任意卡片即可进行编辑、删除或重新排序。在电脑上，点击右键呼出菜单。',
    onboardingSyncTitle: '云端同步',
    onboardingSyncDesc: '点击右上角设置图标，开启云同步功能。只需一个 PIN 码，即可在多设备间无缝同步书签。',
    onboardingReadyTitle: '开始探索',
    onboardingReadyDesc: '现在，添加您最爱的网站，定制您的专属起始页吧！',
    onboardingNext: '下一步',
    onboardingStart: '开启旅程',
    onboardingSkip: '跳过介绍',

    // Common
    close: '关闭',
    edit: '编辑',
    delete: '删除',
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
