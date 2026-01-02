import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { syncManager, type SyncStatus } from './syncManager';
import { Bookmark, AppSettings } from './types';
import { PRESET_ICONS, GRADIENTS, SEARCH_ENGINES, STORAGE_KEY, SETTINGS_KEY, getRandomGradient } from './constants';
import {
  formatUrl,
  getFaviconUrl,
  fileToBase64,
  compressImage,
  sanitizeUrl,
  validateTitle,
  validateUrl,
  validatePin,
  isValidImageUrl,
} from './utils';
import { Header, SearchWidget, BookmarkCard } from './components';

// --- ActionSheet Component ---
const ActionSheet = ({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onAdd,
  title
}: {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAdd: () => void;
  title: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 rounded-t-3xl p-6 pb-10 shadow-2xl border-t border-slate-700/50 animate-in slide-in-from-bottom-full duration-300">
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6 opacity-50" />
        <h3 className="text-center text-white font-bold text-lg mb-6 truncate px-4">
          Actions for "{title}"
        </h3>
        <div className="space-y-3">
          <button 
            onClick={() => { onAdd(); onClose(); }}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-blue-500/20"
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add New Shortcut
          </button>
          <button 
            onClick={() => { onEdit(); onClose(); }}
            className="w-full bg-slate-700/50 hover:bg-slate-700 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Edit Shortcut
          </button>
          <button 
            onClick={() => { onDelete(); onClose(); }}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            Delete Shortcut
          </button>
          <button 
            onClick={onClose}
            className="w-full bg-transparent text-slate-500 font-semibold py-4 rounded-2xl"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const EditModal = ({ 
  isOpen, 
  onClose, 
  onSave,
  initialData,
  appSettings,
  onUpdateAppSettings
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: Partial<Bookmark>) => void; 
  initialData?: Bookmark;
  appSettings: AppSettings;
  onUpdateAppSettings: (s: Partial<AppSettings>) => void;
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [bgType, setBgType] = useState<BackgroundType>('gradient');
  const [bgImage, setBgImage] = useState('');
  const [iconKey, setIconKey] = useState('home');
  const [colors, setColors] = useState(getRandomGradient());
  
  // Settings Mode
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset or Load Data
      if (initialData) {
        setTitle(initialData.title);
        setUrl(initialData.url);
        setBgType(initialData.bgType || 'gradient');
        setBgImage(initialData.bgImage || '');
        setIconKey(initialData.iconKey || 'home');
        setColors({ from: initialData.colorFrom, to: initialData.colorTo });
      } else {
        setTitle('');
        setUrl('');
        setBgType('gradient');
        setBgImage('');
        setIconKey('home');
        setColors(getRandomGradient());
      }
      setShowSettings(false);
    }
  }, [isOpen, initialData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        // 使用图片压缩优化性能
        const compressed = await compressImage(e.target.files[0], 800, 800, 0.8);
        if (showSettings) {
            onUpdateAppSettings({ globalBgImage: compressed, globalBgType: 'image' });
        } else {
            setBgImage(compressed);
        }
      } catch (err) {
        console.error("File upload failed", err);
        alert(err instanceof Error ? err.message : "Image upload failed. Try a smaller file.");
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 验证标题
    const titleValidation = validateTitle(title);
    if (!titleValidation.valid) {
      alert(titleValidation.error);
      return;
    }

    // 验证 URL
    const urlValidation = validateUrl(url);
    if (!urlValidation.valid) {
      alert(urlValidation.error);
      return;
    }

    // 验证图片 URL（如果有）
    if (bgImage && !isValidImageUrl(bgImage)) {
      alert('Invalid image URL. Please use a valid image URL or upload a local image.');
      return;
    }

    if (title && url) {
      onSave({
        title,
        url: sanitizeUrl(url), // 清理 URL
        bgType,
        bgImage,
        iconKey: bgType === 'library' ? iconKey : undefined,
        colorFrom: colors.from,
        colorTo: colors.to
      });
      onClose();
    }
  };

  const tabs: { id: BackgroundType; label: string }[] = [
    { id: 'gradient', label: 'Color' },
    { id: 'library', label: 'Library' },
    { id: 'icon', label: 'Icon' },
    { id: 'image', label: 'Image' },
  ];

  const refreshColors = () => setColors(getRandomGradient());

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-slate-800 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-700/50 transform transition-all animate-in slide-in-from-bottom-10 fade-in flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-5">
           <h2 className="text-xl font-bold text-white tracking-tight">
             {showSettings ? 'App Settings' : (initialData ? 'Edit Shortcut' : 'Add Shortcut')}
           </h2>
           
           {/* Settings Toggle Button - Only show when adding new item or toggling */}
           <button 
             type="button"
             onClick={() => setShowSettings(!showSettings)}
             className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
           >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
               <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
             </svg>
           </button>
        </div>

        {showSettings ? (
          // --- App Settings View ---
          <div className="space-y-6 overflow-y-auto custom-scrollbar pr-1">
             {/* Layout */}
             <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Layout Density</label>
                  <span className="text-xs text-blue-400 font-mono bg-blue-400/10 px-2 py-0.5 rounded">{appSettings.gridCols} Cols</span>
                </div>
                <div className="flex items-center gap-3 bg-slate-900/50 p-4 rounded-xl">
                  <span className="text-xs text-slate-500 font-bold">2</span>
                  <input 
                    type="range" 
                    min="2" 
                    max="6" 
                    step="1" 
                    value={appSettings.gridCols} 
                    onChange={(e) => onUpdateAppSettings({ gridCols: Number(e.target.value) })}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                  />
                  <span className="text-xs text-slate-500 font-bold">6</span>
                </div>
             </div>

             {/* Search Engine */}
             <div>
               <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">Search Engine</label>
               <div className="grid grid-cols-2 gap-2">
                 {Object.entries(SEARCH_ENGINES).map(([key, engine]) => (
                   <button
                     key={key}
                     type="button"
                     onClick={() => onUpdateAppSettings({ searchEngine: key })}
                     className={`px-3 py-3 rounded-xl text-sm font-medium transition-all border ${
                       appSettings.searchEngine === key
                         ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                         : 'bg-slate-900/50 border-transparent text-slate-400 hover:bg-slate-700 hover:text-white'
                     }`}
                   >
                     {engine.name}
                   </button>
                 ))}
               </div>
             </div>

             {/* Global Background */}
             <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">Global Background</label>
                <div className="flex bg-slate-900/50 p-1 rounded-xl mb-4">
                    {(['default', 'gradient', 'image'] as GlobalBackgroundType[]).map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => onUpdateAppSettings({ globalBgType: type })}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${
                            appSettings.globalBgType === type
                                ? 'bg-slate-700 text-white shadow-md' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {appSettings.globalBgType === 'gradient' && (
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${appSettings.globalBgGradient?.from || 'from-slate-800'} ${appSettings.globalBgGradient?.to || 'to-slate-900'} shadow-inner ring-1 ring-white/10`} />
                        <button 
                            type="button"
                            onClick={() => onUpdateAppSettings({ globalBgGradient: getRandomGradient() })}
                            className="flex-1 py-3 bg-slate-700/50 hover:bg-slate-700 text-sm text-slate-300 rounded-xl border border-slate-600/50 transition-colors flex items-center justify-center gap-2"
                        >
                            Shuffle Gradient
                        </button>
                    </div>
                )}

                {appSettings.globalBgType === 'image' && (
                     <div className="space-y-3 animate-in fade-in">
                        <input
                            type="text"
                            placeholder="Image URL (https://...)"
                            value={appSettings.globalBgImage || ''}
                            onChange={(e) => onUpdateAppSettings({ globalBgImage: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                         <div className="relative">
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="w-full bg-slate-900/50 border border-dashed border-slate-700 hover:border-blue-500 text-slate-400 rounded-xl px-4 py-3 text-sm text-center transition-colors">
                                Choose Local Image
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 px-1">Note: Large images may affect performance.</p>
                     </div>
                )}
             </div>

             <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-700/50 text-slate-200 font-bold hover:bg-slate-700 transition-colors"
                >
                  Close Settings
                </button>
             </div>
          </div>
        ) : (
          // --- Edit/Add Form ---
          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
            <div className="space-y-3">
              <div>
                  <input
                  autoFocus
                  type="text"
                  placeholder="Title (e.g. YouTube)"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
                  />
              </div>
              <div>
                  <input
                  type="text"
                  placeholder="URL (e.g. youtube.com)"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
                  />
              </div>
            </div>

            <div>
              <div className="flex bg-slate-900/50 p-1 rounded-xl mb-4">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setBgType(tab.id)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      bgType === tab.id 
                        ? 'bg-slate-700 text-white shadow-md' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {(bgType === 'gradient' || bgType === 'library') && (
                  <div className="flex items-center gap-4 mb-4">
                      <div 
                          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colors.from} ${colors.to} flex items-center justify-center shadow-lg transition-all duration-300`}
                      >
                          {bgType === 'library' && (
                              <svg className="w-8 h-8 text-white drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                                  <path d={PRESET_ICONS[iconKey]} />
                              </svg>
                          )}
                          {bgType === 'gradient' && (
                              <span className="text-xl font-bold text-white drop-shadow-md">
                                  {(title || 'A').charAt(0).toUpperCase()}
                              </span>
                          )}
                      </div>
                      <button 
                          type="button"
                          onClick={refreshColors}
                          className="flex-1 py-2 bg-slate-700/50 hover:bg-slate-700 text-sm text-slate-300 rounded-xl border border-slate-600/50 transition-colors flex items-center justify-center gap-2"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                          </svg>
                          Shuffle Color
                      </button>
                  </div>
              )}

              {bgType === 'library' && (
                  <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                      {Object.entries(PRESET_ICONS).map(([key, path]) => (
                          <button
                              key={key}
                              type="button"
                              onClick={() => setIconKey(key)}
                              className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                                  iconKey === key 
                                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/50' 
                                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                              }`}
                          >
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                  <path d={path} />
                              </svg>
                          </button>
                      ))}
                  </div>
              )}

              {bgType === 'image' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <input
                    type="text"
                    placeholder="Image URL (https://...)"
                    value={bgImage}
                    onChange={e => setBgImage(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <div className="relative mt-2">
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="w-full bg-slate-900/50 border border-dashed border-slate-700 hover:border-blue-500 text-slate-400 rounded-xl px-4 py-3 text-sm text-center transition-colors">
                            Choose Local Image
                        </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Use URL for faster loading, or upload small images.</p>
                </div>
              )}
              {bgType === 'icon' && url && (
                <div className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-xl border border-slate-700/30 animate-in fade-in">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                      <img src={getFaviconUrl(url)} className="w-6 h-6 object-contain" alt="Preview" onError={(e) => e.currentTarget.style.display = 'none'} />
                  </div>
                  <span className="text-sm text-slate-400">Favicon Preview</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3.5 rounded-xl bg-slate-700/50 text-slate-200 font-bold hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title || !url}
                className="flex-1 px-4 py-3.5 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 active:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
              >
                {initialData ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// --- Sync Modal ---
const SyncModal = ({
  isOpen,
  onClose,
  onSyncComplete,
  isSyncingRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete: (bookmarks: Bookmark[], settings: AppSettings) => void;
  isSyncingRef: React.MutableRefObject<boolean>;
}) => {
  const [pin, setPin] = useState('');
  const [isEnabling, setIsEnabling] = useState(false);
  const [error, setError] = useState('');
  const syncStatus = syncManager.getStatus();

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setIsEnabling(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnableSync = async () => {
    // 验证 PIN 码
    const pinValidation = validatePin(pin);
    if (!pinValidation.valid) {
      setError(pinValidation.error || 'Invalid PIN code');
      return;
    }

    setIsEnabling(true);
    setError('');
    isSyncingRef.current = true; // 标记开始同步

    try {
      await syncManager.enableSync(pin); // 现在是异步的

      // 先检查云端是否有数据
      const storedBookmarks = localStorage.getItem(STORAGE_KEY);
      const storedSettings = localStorage.getItem(SETTINGS_KEY);
      const localBookmarks = storedBookmarks ? JSON.parse(storedBookmarks) : [];
      const localSettings = storedSettings ? JSON.parse(storedSettings) : {};

      // 尝试拉取云端数据
      const cloudData = await syncManager.pullFromCloud();

      let finalBookmarks = localBookmarks;
      let finalSettings = localSettings;

      // 如果云端有数据且本地也有数据，让用户选择
      if (cloudData && cloudData.bookmarks && cloudData.bookmarks.length > 0 && localBookmarks.length > 0) {
        const cloudTitles = cloudData.bookmarks.map((b: any) => `  • ${b.title}`).join('\n');
        const localTitles = localBookmarks.map((b: any) => `  • ${b.title}`).join('\n');

        const choice = confirm(
          `Both cloud and local have bookmarks:\n\n` +
          `CLOUD bookmarks (${cloudData.bookmarks.length}):\n${cloudTitles}\n\n` +
          `LOCAL bookmarks (${localBookmarks.length}):\n${localTitles}\n\n` +
          `Click OK to use CLOUD data (remote replaces local).\n` +
          `Click Cancel to use LOCAL data (local replaces remote).`
        );

        if (choice) {
          // 使用云端数据
          finalBookmarks = cloudData.bookmarks;
          finalSettings = cloudData.settings || localSettings;
        } else {
          // 使用本地数据，推送到云端
          await syncManager.pushToCloud(localBookmarks, localSettings);
        }
      } else if (cloudData && cloudData.bookmarks && cloudData.bookmarks.length > 0) {
        // 云端有数据，本地没有，直接使用云端数据
        finalBookmarks = cloudData.bookmarks;
        finalSettings = cloudData.settings || localSettings;
      } else {
        // 云端没有数据，推送本地数据
        await syncManager.pushToCloud(localBookmarks, localSettings);
      }

      // 更新本地存储
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalBookmarks));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(finalSettings));

      // 通过回调更新 React state
      onSyncComplete(finalBookmarks, finalSettings);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable sync');
    } finally {
      setIsEnabling(false);
      isSyncingRef.current = false; // 标记同步结束
    }
  };

  const handleDisableSync = () => {
    if (confirm('Are you sure you want to disable sync? Your local data will not be affected.')) {
      syncManager.disableSync();
      onClose();
    }
  };

  const handleManualSync = async () => {
    setIsEnabling(true);
    setError('');
    isSyncingRef.current = true; // 标记开始同步

    try {
      const storedBookmarks = localStorage.getItem(STORAGE_KEY);
      const storedSettings = localStorage.getItem(SETTINGS_KEY);
      const localBookmarks = storedBookmarks ? JSON.parse(storedBookmarks) : [];
      const localSettings = storedSettings ? JSON.parse(storedSettings) : {};

      // 先拉取云端数据
      const cloudData = await syncManager.pullFromCloud();

      let finalBookmarks = localBookmarks;
      let finalSettings = localSettings;
      let needsPush = false;

      // 如果云端有数据且本地也有数据，检查是否需要用户选择
      if (cloudData && cloudData.bookmarks && cloudData.bookmarks.length > 0 && localBookmarks.length > 0) {
        // 比较书签内容（通过 JSON 字符串比较）
        const cloudBookmarksStr = JSON.stringify(cloudData.bookmarks.map((b: any) => ({ id: b.id, title: b.title, url: b.url })).sort((a: any, b: any) => a.id.localeCompare(b.id)));
        const localBookmarksStr = JSON.stringify(localBookmarks.map((b: any) => ({ id: b.id, title: b.title, url: b.url })).sort((a: any, b: any) => a.id.localeCompare(b.id)));

        // 如果内容不同，让用户选择
        if (cloudBookmarksStr !== localBookmarksStr) {
          const cloudTitles = cloudData.bookmarks.map((b: any) => `  • ${b.title}`).join('\n');
          const localTitles = localBookmarks.map((b: any) => `  • ${b.title}`).join('\n');

          const choice = confirm(
            `Sync conflict detected!\n\n` +
            `CLOUD bookmarks (${cloudData.bookmarks.length}):\n${cloudTitles}\n\n` +
            `LOCAL bookmarks (${localBookmarks.length}):\n${localTitles}\n\n` +
            `Click OK to use CLOUD data.\n` +
            `Click Cancel to use LOCAL data.`
          );

          if (choice) {
            // 使用云端数据
            finalBookmarks = cloudData.bookmarks;
            finalSettings = cloudData.settings || localSettings;
          } else {
            // 使用本地数据，推送到云端
            needsPush = true;
          }
        } else {
          // 内容相同，数据已同步，使用云端数据（确保时间戳一致）
          finalBookmarks = cloudData.bookmarks;
          finalSettings = cloudData.settings || localSettings;
        }
      } else if (cloudData && cloudData.bookmarks && cloudData.bookmarks.length > 0) {
        // 云端有数据，本地没有，直接使用云端数据
        finalBookmarks = cloudData.bookmarks;
        finalSettings = cloudData.settings || localSettings;
      } else if (localBookmarks.length > 0) {
        // 本地有数据，云端没有，推送本地数据
        needsPush = true;
      }

      // 更新本地数据
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalBookmarks));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(finalSettings));

      // 如果需要推送，在更新 state 之前推送
      if (needsPush) {
        await syncManager.pushToCloud(localBookmarks, localSettings);
      }

      // 通过回调更新 React state
      onSyncComplete(finalBookmarks, finalSettings);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsEnabling(false);
      isSyncingRef.current = false; // 标记同步结束
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-slate-800 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-700/50 transform transition-all animate-in slide-in-from-bottom-10 fade-in">

        {/* Modal Header */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Cloud Sync</h2>
            <span className="text-xs text-slate-500 font-mono bg-slate-900/50 px-2 py-0.5 rounded">v1.0.0</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Status Display */}
          <div className={`p-4 rounded-xl border ${syncStatus.enabled ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-900/50 border-slate-700'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${syncStatus.enabled ? 'bg-green-500' : 'bg-slate-600'}`} />
              <div className="flex-1">
                <p className="text-sm font-bold text-white">
                  {syncStatus.enabled ? 'Sync Enabled' : 'Sync Disabled'}
                </p>
                {syncStatus.lastSyncTime && (
                  <p className="text-xs text-slate-400 mt-1">
                    Last sync: {new Date(syncStatus.lastSyncTime).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {!syncStatus.enabled ? (
            // Enable Sync Form
            <>
              <div className="space-y-3">
                <p className="text-sm text-slate-300">
                  Enter a PIN code (4+ characters) to enable multi-device sync. Use the same PIN on other devices to sync your bookmarks.
                </p>

                <input
                  type="text"
                  placeholder="Enter PIN code (e.g., 1234)"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-500"
                  autoFocus
                />

                {error && (
                  <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleEnableSync}
                  disabled={isEnabling || pin.length < 4}
                  className="w-full px-4 py-3.5 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                >
                  {isEnabling ? 'Enabling...' : 'Enable Sync'}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-700/50">
                <p className="text-xs text-slate-500 leading-relaxed">
                  <strong>Note:</strong> Your PIN code is used to identify your sync account. Keep it secure and don't share it with others.
                </p>
              </div>
            </>
          ) : (
            // Sync Management
            <>
              <div className="space-y-3">
                <button
                  onClick={handleManualSync}
                  disabled={isEnabling || syncStatus.syncing}
                  className="w-full px-4 py-3.5 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  {isEnabling || syncStatus.syncing ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 animate-spin">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      Sync Now
                    </>
                  )}
                </button>

                {error && (
                  <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                {syncStatus.error && (
                  <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                    {syncStatus.error}
                  </p>
                )}

                <button
                  onClick={handleDisableSync}
                  className="w-full px-4 py-3.5 rounded-xl bg-red-500/10 text-red-400 font-bold hover:bg-red-500/20 transition-colors"
                >
                  Disable Sync
                </button>
              </div>

              <div className="pt-2 border-t border-slate-700/50">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your bookmarks are automatically synced when you make changes. Use "Sync Now" to force an immediate sync.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    gridCols: 4,
    searchEngine: 'google',
    globalBgType: 'default',
    globalBgGradient: { from: 'from-slate-900', to: 'to-slate-800' }
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncManager.getStatus());

  // 标志：是否正在同步（避免同步时触发自动推送）
  const isSyncing = useRef(false);

  // 监听同步状态变化
  useEffect(() => {
    const unsubscribe = syncManager.onStatusChange(setSyncStatus);
    return unsubscribe;
  }, []);

  // Load from local storage and sync
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedBookmarks = localStorage.getItem(STORAGE_KEY);
        const storedSettings = localStorage.getItem(SETTINGS_KEY);

        let localBookmarks: Bookmark[] = [];
        let localSettings = settings;

        if (storedBookmarks) {
          localBookmarks = JSON.parse(storedBookmarks);
        } else {
          const defaults: Bookmark[] = [
            { id: '1', title: 'Google', url: 'https://google.com', colorFrom: 'from-blue-500', colorTo: 'to-blue-600', bgType: 'icon' },
            { id: '2', title: 'YouTube', url: 'https://youtube.com', colorFrom: 'from-red-500', colorTo: 'to-pink-600', bgType: 'library', iconKey: 'youtube' },
            { id: '3', title: 'GitHub', url: 'https://github.com', colorFrom: 'from-slate-700', colorTo: 'to-slate-900', bgType: 'library', iconKey: 'github' },
            { id: '4', title: 'ChatGPT', url: 'https://chat.openai.com', colorFrom: 'from-emerald-500', colorTo: 'to-teal-600', bgType: 'icon' },
          ];
          localBookmarks = defaults;
        }

        if (storedSettings) {
          localSettings = { ...settings, ...JSON.parse(storedSettings) };
        }

        // 如果启用了同步，尝试同步数据
        if (syncManager.getStatus().enabled) {
          try {
            const syncedData = await syncManager.sync(localBookmarks, localSettings);
            setBookmarks(syncedData.bookmarks);
            setSettings(syncedData.settings);
            // 不要在这里更新时间戳，应该使用云端返回的时间戳
          } catch (error) {
            console.error('Sync failed on startup:', error);
            // 同步失败时使用本地数据
            setBookmarks(localBookmarks);
            setSettings(localSettings);
          }
        } else {
          setBookmarks(localBookmarks);
          setSettings(localSettings);
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    };

    loadData();
  }, []);

  // Save to local storage and sync to cloud
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));

    // 如果启用了同步且不在同步过程中，推送到云端（防抖）
    if (syncManager.getStatus().enabled && bookmarks.length > 0 && !isSyncing.current) {
      syncManager.debouncedPush(bookmarks, settings);
    }
  }, [bookmarks, settings]); // 依赖 settings，这样只触发一次

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    // 不在这里推送，由上面的 useEffect 统一处理
  }, [settings]);

  // 使用 useCallback 优化事件处理函数
  const handleSaveBookmark = useCallback((data: Partial<Bookmark>) => {
    if (selectedBookmark) {
      // Update existing
      setBookmarks(prev => prev.map(b => b.id === selectedBookmark.id ? { ...b, ...data } : b) as Bookmark[]);
    } else {
      // Create new
      const newBookmark: Bookmark = {
        id: Date.now().toString(),
        title: data.title || 'New Site',
        url: formatUrl(data.url || ''),
        colorFrom: data.colorFrom || 'from-blue-500',
        colorTo: data.colorTo || 'to-purple-500',
        bgType: data.bgType || 'gradient',
        bgImage: data.bgImage,
        iconKey: data.iconKey
      };
      setBookmarks(prev => [...prev, newBookmark]);
    }
    setIsEditModalOpen(false);
    setSelectedBookmark(null);
  }, [selectedBookmark]);

  const handleDeleteBookmark = useCallback(() => {
    if (selectedBookmark) {
      setBookmarks(prev => prev.filter(b => b.id !== selectedBookmark.id));
      setIsActionSheetOpen(false);
      setSelectedBookmark(null);
    }
  }, [selectedBookmark]);

  const handleLongPress = useCallback((item: Bookmark) => {
    setSelectedBookmark(item);
    setIsActionSheetOpen(true);
  }, []);

  const handleUpdateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const handleSyncComplete = useCallback((newBookmarks: Bookmark[], newSettings: AppSettings) => {
    setBookmarks(newBookmarks);
    setSettings(newSettings);
  }, []);

  const handleCloseActionSheet = useCallback(() => {
    setIsActionSheetOpen(false);
  }, []);

  const handleOpenEditModal = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedBookmark(null);
  }, []);

  const handleOpenSyncModal = useCallback(() => {
    setIsSyncModalOpen(true);
  }, []);

  const handleCloseSyncModal = useCallback(() => {
    setIsSyncModalOpen(false);
  }, []);

  const handleAddNewBookmark = useCallback(() => {
    setIsActionSheetOpen(false);
    setSelectedBookmark(null);
    setIsEditModalOpen(true);
  }, []);

  const handleAddFromHeader = useCallback(() => {
    setSelectedBookmark(null);
    setIsEditModalOpen(true);
  }, []);

  // 使用 useMemo 缓存计算结果
  const gridColsClass = useMemo(() => {
    switch (settings.gridCols) {
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-3';
      case 5: return 'grid-cols-5';
      case 6: return 'grid-cols-6';
      default: return 'grid-cols-4';
    }
  }, [settings.gridCols]);

  const globalBgStyle = useMemo(() => {
    if (settings.globalBgType === 'image' && settings.globalBgImage) {
      return {
        backgroundImage: `url(${settings.globalBgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      };
    }
    return {};
  }, [settings.globalBgType, settings.globalBgImage]);

  const containerClassName = useMemo(() =>
    `min-h-screen text-slate-200 transition-colors duration-500 ${
      settings.globalBgType === 'gradient'
        ? `bg-gradient-to-br ${settings.globalBgGradient?.from || 'from-slate-900'} ${settings.globalBgGradient?.to || 'to-slate-800'}`
        : 'bg-slate-950'
    }`,
    [settings.globalBgType, settings.globalBgGradient]
  );

  const showImageOverlay = useMemo(() => settings.globalBgType === 'image', [settings.globalBgType]);

  const headerOnAdd = useMemo(() =>
    bookmarks.length === 0 ? handleAddFromHeader : undefined,
    [bookmarks.length, handleAddFromHeader]
  );

  return (
    <div
      className={containerClassName}
      style={globalBgStyle}
    >
      {/* Overlay for image bg to improve text readability */}
      {showImageOverlay && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none" />
      )}

      <div className="relative z-10 max-w-2xl mx-auto px-6 pb-24 min-h-screen flex flex-col">
        <Header
          onAdd={headerOnAdd}
          syncStatus={syncStatus}
          onSyncClick={handleOpenSyncModal}
        />

        <SearchWidget searchEngine={settings.searchEngine} />

        <div className={`grid gap-4 ${gridColsClass} w-full animate-in fade-in slide-in-from-bottom-4 duration-700`}>
          {bookmarks.map(bookmark => (
            <BookmarkCard
              key={bookmark.id}
              item={bookmark}
              gridCols={settings.gridCols}
              onLongPress={handleLongPress}
            />
          ))}
        </div>
      </div>

      <ActionSheet
        isOpen={isActionSheetOpen}
        onClose={handleCloseActionSheet}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteBookmark}
        onAdd={handleAddNewBookmark}
        title={selectedBookmark?.title || ''}
      />

      <EditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveBookmark}
        initialData={selectedBookmark || undefined}
        appSettings={settings}
        onUpdateAppSettings={handleUpdateSettings}
      />

      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={handleCloseSyncModal}
        onSyncComplete={handleSyncComplete}
        isSyncingRef={isSyncing}
      />
    </div>
  );
};

export default App;