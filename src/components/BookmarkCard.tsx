import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Bookmark, MobileDenseConfig } from '../types';
import { PRESET_ICONS } from '../constants';
import { getFaviconUrl } from '../utils';

interface BookmarkCardProps {
  item: Bookmark;
  gridCols: number;
  onLongPress: (item: Bookmark) => void;
  mobileDenseConfig?: MobileDenseConfig;
}

const BookmarkCardComponent: React.FC<BookmarkCardProps> = ({ item, gridCols, onLongPress, mobileDenseConfig }) => {
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

  // 检测移动设备 - 使用 useState + useEffect 监听窗口大小变化
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth <= 640;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getBackgroundStyle = useMemo(() => {
    if (bgType === 'image' && item.bgImage) {
      return {
        backgroundImage: `url(${item.bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
    return {};
  }, [bgType, item.bgImage]);

  const containerClasses = useMemo(() => `
    rounded-2xl flex flex-col items-center justify-center text-center p-2
    relative overflow-hidden aspect-square
    shadow-lg transform transition-all duration-300
    border border-white/10 select-none
    ${(bgType === 'gradient' || isLibrary) ? `bg-gradient-to-br ${item.colorFrom} ${item.colorTo}` : 'bg-slate-800'}
    ${isPressing ? 'scale-95 brightness-90' : 'active:scale-95 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10'}
    ${isMobile ? 'touch-manipulation' : ''}
  `, [bgType, isLibrary, item.colorFrom, item.colorTo, isPressing, isMobile]);

  const faviconUrl = useMemo(() => getFaviconUrl(item.url), [item.url]);

  // 获取移动端密集模式配置（带默认值）
  const denseConfig = useMemo(() => ({
    iconSize: mobileDenseConfig?.iconSize || 24,
    iconMarginTop: mobileDenseConfig?.iconMarginTop || 2,
    textSize: mobileDenseConfig?.textSize || 8,
    textMarginTop: mobileDenseConfig?.textMarginTop || 6
  }), [mobileDenseConfig]);

  return (
    <div
      className="relative group animate-in fade-in zoom-in duration-300 w-full h-full min-w-0"
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
        className={`${containerClasses} absolute inset-0`}
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

        {/* 移动端布局：图标在上，名称在下 */}
        {isMobile ? (
          <div
            className={`relative z-10 flex flex-col items-center w-full h-full pointer-events-none ${isDense ? 'py-0.5 pb-1' : 'py-2'}`}
            style={isDense ? { paddingTop: `${denseConfig.iconMarginTop}px` } : undefined}
          >
            {/* 图标区域 - 占据上半部分 */}
            <div className={`flex items-center justify-center min-h-0 ${isDense ? 'flex-shrink' : 'flex-1'}`}>
              {isLibrary && item.iconKey && PRESET_ICONS[item.iconKey] ? (
                <div
                  className="text-white drop-shadow-md"
                  style={isDense ? { width: `${denseConfig.iconSize}px`, height: `${denseConfig.iconSize}px` } : { width: '40px', height: '40px' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                    <path d={PRESET_ICONS[item.iconKey]} />
                  </svg>
                </div>
              ) : bgType === 'icon' ? (
                <div
                  className="flex items-center justify-center"
                  style={isDense ? { width: `${denseConfig.iconSize}px`, height: `${denseConfig.iconSize}px` } : { width: '40px', height: '40px' }}
                >
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
                <span
                  className="font-bold text-white drop-shadow-md"
                  style={isDense ? { fontSize: `${denseConfig.iconSize * 0.75}px` } : { fontSize: '24px' }}
                >
                  {item.title.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* 名称区域 - 固定在底部 */}
            <div
              className={`w-full overflow-hidden flex-shrink-0 ${isDense ? 'px-0.5' : 'px-1'}`}
              style={isDense ? { marginTop: `${denseConfig.textMarginTop}px` } : undefined}
            >
              <h3
                className="font-medium text-white leading-tight truncate"
                style={isDense ? {
                  fontSize: `${denseConfig.textSize}px`,
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                } : {
                  fontSize: '10px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}
              >
                {item.title}
              </h3>
            </div>
          </div>
        ) : (
          /* PC端布局：图标和名称居中 */
          <div className="relative z-10 flex flex-col items-center justify-center w-full h-full pointer-events-none">
            {/* 图标区域 */}
            <div className={`flex items-center justify-center ${isDense ? 'mb-1' : 'mb-2'}`}>
              {isLibrary && item.iconKey && PRESET_ICONS[item.iconKey] ? (
                <div className={`${isDense ? 'w-10 h-10' : 'w-12 h-12'} text-white drop-shadow-md`}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                    <path d={PRESET_ICONS[item.iconKey]} />
                  </svg>
                </div>
              ) : bgType === 'icon' ? (
                <div className={`flex items-center justify-center ${isDense ? 'w-12 h-12' : 'w-14 h-14'}`}>
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
                <span className={`font-bold text-white drop-shadow-md ${isDense ? 'text-3xl' : 'text-4xl'}`}>
                  {item.title.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* 名称区域 */}
            <div className="w-full overflow-hidden px-2">
              <h3 className={`font-medium text-white leading-tight truncate ${isDense ? 'text-[11px]' : 'text-xs tracking-wide'}`} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                {item.title}
              </h3>
            </div>
          </div>
        )}
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
