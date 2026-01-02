import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Bookmark } from '../types';
import { PRESET_ICONS } from '../constants';
import { getFaviconUrl } from '../utils';

interface BookmarkCardProps {
  item: Bookmark;
  gridCols: number;
  onLongPress: (item: Bookmark) => void;
}

const BookmarkCardComponent: React.FC<BookmarkCardProps> = ({ item, gridCols, onLongPress }) => {
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
    }, 1500);
  }, [item, onLongPress]);

  const cancelPress = useCallback(() => {
    setIsPressing(false);
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isLongPressTriggered.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  // 使用 useMemo 缓存计算结果
  const isDense = useMemo(() => gridCols > 4, [gridCols]);
  const bgType = useMemo(() => item.bgType || 'gradient', [item.bgType]);
  const isLibrary = useMemo(() => bgType === 'library', [bgType]);

  const getBackgroundStyle = useMemo(() => {
    if (bgType === 'image' && item.bgImage) {
      return {
        backgroundImage: `url(${item.bgImage})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
    return {};
  }, [bgType, item.bgImage]);

  const containerClasses = useMemo(() => `
    block aspect-square rounded-2xl flex flex-col items-center justify-center text-center p-2
    relative overflow-hidden
    shadow-lg transform transition-all duration-300
    border border-white/10 select-none
    ${(bgType === 'gradient' || isLibrary) ? `bg-gradient-to-br ${item.colorFrom} ${item.colorTo}` : 'bg-slate-800'}
    ${isPressing ? 'scale-95 brightness-90' : 'active:scale-95 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10'}
  `, [bgType, isLibrary, item.colorFrom, item.colorTo, isPressing]);

  const faviconUrl = useMemo(() => getFaviconUrl(item.url), [item.url]);

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
        style={getBackgroundStyle}
        draggable={false}
      >
        {isPressing && (
          <div className="absolute inset-0 bg-black/20 z-20 pointer-events-none">
            <div className="absolute bottom-0 left-0 h-1 bg-white/50 transition-all duration-[1500ms] ease-linear w-full" style={{ width: isPressing ? '100%' : '0%' }} />
          </div>
        )}

        {bgType === 'image' && (
          <div className="absolute inset-0 bg-black/40 transition-opacity hover:bg-black/30 pointer-events-none" />
        )}

        {bgType === 'icon' && (
          <div className="absolute inset-0 flex items-center justify-center p-6 opacity-30 pointer-events-none grayscale blur-xl transform scale-150">
            <img
              src={faviconUrl}
              alt=""
              className="w-full h-full object-contain"
              loading="lazy"
              decoding="async"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full gap-2 pointer-events-none">
          {isLibrary && item.iconKey && PRESET_ICONS[item.iconKey] ? (
            <div className={`${isDense ? 'w-8 h-8' : 'w-10 h-10'} text-white drop-shadow-md`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d={PRESET_ICONS[item.iconKey]} />
              </svg>
            </div>
          ) : bgType === 'icon' ? (
            <div className={`flex items-center justify-center pt-1 ${isDense ? 'w-10 h-10' : 'w-14 h-14'}`}>
              <img
                src={faviconUrl}
                alt="icon"
                className="w-full h-full object-contain drop-shadow-sm"
                loading="lazy"
                decoding="async"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          ) : !item.bgImage && (
            <span className={`font-bold text-white drop-shadow-md ${isDense ? 'text-2xl' : 'text-3xl'}`}>
              {item.title.charAt(0).toUpperCase()}
            </span>
          )}

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

// 使用 React.memo 优化组件，自定义比较函数
export const BookmarkCard = React.memo(BookmarkCardComponent, (prevProps, nextProps) => {
  // 只在关键 props 变化时重新渲染
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.item.url === nextProps.item.url &&
    prevProps.item.bgType === nextProps.item.bgType &&
    prevProps.item.bgImage === nextProps.item.bgImage &&
    prevProps.item.iconKey === nextProps.item.iconKey &&
    prevProps.item.colorFrom === nextProps.item.colorFrom &&
    prevProps.item.colorTo === nextProps.item.colorTo &&
    prevProps.gridCols === nextProps.gridCols
  );
});
