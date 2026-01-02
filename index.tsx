import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { syncManager, type SyncStatus } from './src/syncManager';

// --- Types ---
type BackgroundType = 'gradient' | 'icon' | 'image' | 'library';
type GlobalBackgroundType = 'default' | 'gradient' | 'image';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  colorFrom: string;
  colorTo: string;
  bgType?: BackgroundType;
  bgImage?: string; 
  iconKey?: string;
}

interface AppSettings {
  gridCols: number;
  searchEngine: string;
  globalBgType: GlobalBackgroundType;
  globalBgImage?: string;
  globalBgGradient?: { from: string; to: string };
}

// --- Icons Data ---
const PRESET_ICONS: Record<string, string> = {
  // General
  'home': 'M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69zM12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z',
  'star': 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
  'heart': 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
  'work': 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  'mail': 'M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67zM22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z',
  'chat': 'M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-2.347a11.147 11.147 0 01-2.66-2.227c-1.177-1.425-1.164-3.483.055-5.26a.75.75 0 01.18-.198c.34-.323.714-.616 1.122-.878v-1.92c-.018-1.859 1.368-3.468 3.298-3.712z',
  'map': 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418',
  'calendar': 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
  'shopping': 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z',
  
  // Media / Entertainment
  'youtube': 'M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z',
  'play': 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z',
  'music': 'M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163z',
  'game': 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z',
  'camera': 'M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316zM16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z',
};

// --- Constants & Helpers ---
const STORAGE_KEY = 'navhub_bookmarks';
const SETTINGS_KEY = 'navhub_settings';

const GRADIENTS = [
  ['from-pink-500', 'to-rose-500'],
  ['from-purple-500', 'to-indigo-500'],
  ['from-blue-400', 'to-cyan-400'],
  ['from-emerald-400', 'to-teal-500'],
  ['from-orange-400', 'to-red-500'],
  ['from-yellow-400', 'to-orange-500'],
  ['from-gray-600', 'to-gray-800'],
  ['from-indigo-400', 'to-purple-400'],
  ['from-fuchsia-500', 'to-pink-500'],
  ['from-slate-600', 'to-slate-900'],
  ['from-red-500', 'to-orange-500'],
  ['from-cyan-500', 'to-blue-500'],
  ['from-teal-400', 'to-emerald-500'],
];

const SEARCH_ENGINES: Record<string, { name: string; url: string }> = {
  google: { name: 'Google', url: 'https://www.google.com/search?q=' },
  bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' },
  baidu: { name: 'Baidu', url: 'https://www.baidu.com/s?wd=' },
  duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
};

const getRandomGradient = () => {
  const idx = Math.floor(Math.random() * GRADIENTS.length);
  return { from: GRADIENTS[idx][0], to: GRADIENTS[idx][1] };
};

const formatUrl = (url: string) => {
  const trimmed = url.trim();
  // If no protocol specified, add http:// by default (not https)
  if (!trimmed.includes('://')) {
    return `http://${trimmed}`;
  }
  return trimmed;
};

const getFaviconUrl = (url: string) => {
  try {
    const domain = new URL(formatUrl(url)).hostname;
    return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
  } catch (e) {
    return '';
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// --- Components ---

const Header = ({ onAdd, syncStatus, onSyncClick }: {
  onAdd?: () => void;
  syncStatus?: SyncStatus;
  onSyncClick?: () => void;
}) => (
  <header className="relative flex flex-col gap-4 py-8 px-4 items-center justify-center animate-in fade-in slide-in-from-top-4 duration-500">
     {/* Sync Button */}
    {onSyncClick && (
        <button
            onClick={onSyncClick}
            className="absolute left-4 top-8 p-3 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full backdrop-blur-md transition-all text-white shadow-lg ring-1 ring-white/5 z-20"
            aria-label="Sync Settings"
            title={syncStatus?.enabled ? 'Sync enabled' : 'Enable sync'}
        >
            {syncStatus?.syncing ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 animate-spin">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
            )}
            {syncStatus?.enabled && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full ring-2 ring-slate-900" />
            )}
        </button>
    )}
     {/* Add Button */}
    {onAdd && (
        <button
            onClick={onAdd}
            className="absolute right-4 top-8 p-3 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full backdrop-blur-md transition-all text-white shadow-lg ring-1 ring-white/5 z-20"
            aria-label="Add Bookmark"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
        </button>
    )}
    <div className="flex flex-col items-center gap-2">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/20 ring-1 ring-white/10">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">NavHub</h1>
      <p className="text-xs text-slate-300/80 font-medium tracking-widest uppercase">
        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
      </p>
    </div>
  </header>
);

const SearchWidget = ({ searchEngine }: { searchEngine: string }) => {
  const [query, setQuery] = useState('');

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const engine = SEARCH_ENGINES[searchEngine] || SEARCH_ENGINES['google'];
      window.open(`${engine.url}${encodeURIComponent(query)}`, '_blank');
      setQuery('');
    }
  };

  const placeholder = `Search ${SEARCH_ENGINES[searchEngine]?.name || 'Google'}...`;

  return (
    <form onSubmit={onSearch} className="w-full mb-8 relative z-10 px-2">
      <div className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-800/60 border border-slate-700/50 text-white rounded-2xl py-3.5 pl-4 pr-12 shadow-lg backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-500 text-base"
        />
        {query && (
           <button
             type="button"
             onClick={() => setQuery('')}
             className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300"
           >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
               <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
             </svg>
           </button>
        )}
      </div>
    </form>
  );
};

// --- Bookmark Card ---
interface BookmarkCardProps {
  item: Bookmark;
  gridCols: number;
  onLongPress: (item: Bookmark) => void;
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({ 
  item, 
  gridCols,
  onLongPress
}) => {
  const [isPressing, setIsPressing] = useState(false);
  const pressTimer = useRef<number | null>(null);
  const isLongPressTriggered = useRef(false);

  const startPress = useCallback(() => {
    isLongPressTriggered.current = false;
    setIsPressing(true);
    pressTimer.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      setIsPressing(false);
      if (navigator.vibrate) navigator.vibrate(50);
      onLongPress(item);
    }, 1500); // 1.5 seconds for snappier feel
  }, [item, onLongPress]);

  const cancelPress = useCallback(() => {
    setIsPressing(false);
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (isLongPressTriggered.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const isDense = gridCols > 4;
  const bgType = item.bgType || 'gradient'; 
  const isLibrary = bgType === 'library';

  const getBackgroundStyle = () => {
    if (bgType === 'image' && item.bgImage) {
      return { 
        backgroundImage: `url(${item.bgImage})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
    return {};
  };

  const containerClasses = `
    block aspect-square rounded-2xl flex flex-col items-center justify-center text-center p-2
    relative overflow-hidden
    shadow-lg transform transition-all duration-300
    border border-white/10 select-none
    ${(bgType === 'gradient' || isLibrary) ? `bg-gradient-to-br ${item.colorFrom} ${item.colorTo}` : 'bg-slate-800'}
    ${isPressing ? 'scale-95 brightness-90' : 'active:scale-95 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10'}
  `;

  return (
    <div 
      className="relative group animate-in fade-in zoom-in duration-300"
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
      onContextMenu={(e) => e.preventDefault()}
    >
      <a
        href={item.url}
        onClick={handleClick}
        className={containerClasses}
        style={getBackgroundStyle()}
        draggable={false}
      >
        {/* Long Press Progress Indicator */}
        {isPressing && (
           <div className="absolute inset-0 bg-black/20 z-20 pointer-events-none">
             <div className="absolute bottom-0 left-0 h-1 bg-white/50 transition-all duration-[1500ms] ease-linear w-full" style={{ width: isPressing ? '100%' : '0%' }} />
           </div>
        )}

        {/* Overlay for Image Mode */}
        {bgType === 'image' && (
          <div className="absolute inset-0 bg-black/40 transition-opacity hover:bg-black/30 pointer-events-none" />
        )}

        {/* Icon Mode: Background Favicon Blur */}
        {bgType === 'icon' && (
           <div className="absolute inset-0 flex items-center justify-center p-6 opacity-30 pointer-events-none grayscale blur-xl transform scale-150">
              <img 
                src={getFaviconUrl(item.url)} 
                alt=""
                className="w-full h-full object-contain"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
           </div>
        )}

        {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full gap-2 pointer-events-none">
          
          {/* Main Visual */}
          {isLibrary && item.iconKey && PRESET_ICONS[item.iconKey] ? (
             <div className={`${isDense ? 'w-8 h-8' : 'w-10 h-10'} text-white drop-shadow-md`}>
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                 <path d={PRESET_ICONS[item.iconKey]} />
               </svg>
             </div>
          ) : bgType === 'icon' ? (
             <div className={`
              flex items-center justify-center pt-1
              ${isDense ? 'w-10 h-10' : 'w-14 h-14'}
             `}>
               <img 
                src={getFaviconUrl(item.url)} 
                alt="icon"
                className="w-full h-full object-contain drop-shadow-sm"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
             </div>
          ) : !item.bgImage && (
              // Gradient Text Fallback
              <span className={`font-bold text-white drop-shadow-md ${isDense ? 'text-2xl' : 'text-3xl'}`}>
                {item.title.charAt(0).toUpperCase()}
              </span>
          )}

          {/* Title */}
          <div className="w-full overflow-hidden px-1">
            <h3 className={`font-medium text-white leading-tight truncate text-shadow-sm ${isDense ? 'text-[10px]' : 'text-xs tracking-wide'}`}>
              {item.title}
            </h3>
          </div>
        </div>
      </a>
    </div>
  );
};

// --- Modals ---

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
        const base64 = await fileToBase64(e.target.files[0]);
        if (showSettings) {
            onUpdateAppSettings({ globalBgImage: base64, globalBgType: 'image' });
        } else {
            setBgImage(base64);
        }
      } catch (err) {
        console.error("File upload failed", err);
        alert("Image upload failed. Try a smaller file.");
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && url) {
      onSave({ 
        title, 
        url, 
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
}: {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete: (bookmarks: Bookmark[], settings: AppSettings) => void;
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
    if (pin.length < 4) {
      setError('PIN code must be at least 4 characters');
      return;
    }

    setIsEnabling(true);
    setError('');

    try {
      syncManager.enableSync(pin);

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
        const choice = confirm(
          `Cloud has ${cloudData.bookmarks.length} bookmark(s), local has ${localBookmarks.length} bookmark(s).\n\n` +
          `Click OK to use CLOUD data (remote bookmarks will replace local).\n` +
          `Click Cancel to use LOCAL data (local bookmarks will replace remote).`
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

    try {
      const storedBookmarks = localStorage.getItem(STORAGE_KEY);
      const storedSettings = localStorage.getItem(SETTINGS_KEY);
      const localBookmarks = storedBookmarks ? JSON.parse(storedBookmarks) : [];
      const localSettings = storedSettings ? JSON.parse(storedSettings) : {};

      // 执行双向同步（会自动比较时间戳）
      const syncedData = await syncManager.sync(localBookmarks, localSettings);

      // 更新本地数据
      localStorage.setItem(STORAGE_KEY, JSON.stringify(syncedData.bookmarks));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(syncedData.settings));

      // 通过回调更新 React state
      onSyncComplete(syncedData.bookmarks, syncedData.settings);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsEnabling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-slate-800 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-700/50 transform transition-all animate-in slide-in-from-bottom-10 fade-in">

        {/* Modal Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-white tracking-tight">Cloud Sync</h2>
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

    // 如果启用了同步，推送到云端（防抖）
    if (syncManager.getStatus().enabled && bookmarks.length > 0) {
      syncManager.debouncedPush(bookmarks, settings);
    }
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

    // 如果启用了同步，推送到云端（防抖）
    if (syncManager.getStatus().enabled) {
      syncManager.debouncedPush(bookmarks, settings);
    }
  }, [settings]);

  const handleSaveBookmark = (data: Partial<Bookmark>) => {
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
  };

  const handleDeleteBookmark = () => {
    if (selectedBookmark) {
      setBookmarks(prev => prev.filter(b => b.id !== selectedBookmark.id));
      setIsActionSheetOpen(false);
      setSelectedBookmark(null);
    }
  };

  const handleLongPress = (item: Bookmark) => {
    setSelectedBookmark(item);
    setIsActionSheetOpen(true);
  };

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const getGridColsClass = () => {
    switch (settings.gridCols) {
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-3';
      case 5: return 'grid-cols-5';
      case 6: return 'grid-cols-6';
      default: return 'grid-cols-4';
    }
  };

  const getGlobalBgStyle = () => {
    if (settings.globalBgType === 'image' && settings.globalBgImage) {
      return {
        backgroundImage: `url(${settings.globalBgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      };
    }
    return {};
  };

  return (
    <div 
      className={`min-h-screen text-slate-200 transition-colors duration-500 ${
        settings.globalBgType === 'gradient' 
          ? `bg-gradient-to-br ${settings.globalBgGradient?.from || 'from-slate-900'} ${settings.globalBgGradient?.to || 'to-slate-800'}`
          : 'bg-slate-950'
      }`}
      style={getGlobalBgStyle()}
    >
      {/* Overlay for image bg to improve text readability */}
      {settings.globalBgType === 'image' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none" />
      )}

      <div className="relative z-10 max-w-2xl mx-auto px-6 pb-24 min-h-screen flex flex-col">
        <Header
          onAdd={bookmarks.length === 0 ? () => { setSelectedBookmark(null); setIsEditModalOpen(true); } : undefined}
          syncStatus={syncStatus}
          onSyncClick={() => setIsSyncModalOpen(true)}
        />

        <SearchWidget searchEngine={settings.searchEngine} />

        <div className={`grid gap-4 ${getGridColsClass()} w-full animate-in fade-in slide-in-from-bottom-4 duration-700`}>
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
        onClose={() => setIsActionSheetOpen(false)}
        onEdit={() => setIsEditModalOpen(true)}
        onDelete={handleDeleteBookmark}
        onAdd={() => {
            setIsActionSheetOpen(false);
            setSelectedBookmark(null);
            setIsEditModalOpen(true);
        }}
        title={selectedBookmark?.title || ''}
      />

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedBookmark(null); }}
        onSave={handleSaveBookmark}
        initialData={selectedBookmark || undefined}
        appSettings={settings}
        onUpdateAppSettings={handleUpdateSettings}
      />

      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSyncComplete={(newBookmarks, newSettings) => {
          setBookmarks(newBookmarks);
          setSettings(newSettings);
        }}
      />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);