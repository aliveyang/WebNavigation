import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bookmark, Language } from '../../types';
import { getTranslation } from '../../i18n';

interface ContextMenuProps {
    bookmark: Bookmark;
    position: { x: number; y: number };
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    language: Language;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
    bookmark,
    position,
    onClose,
    onEdit,
    onDelete,
    language,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [adjustedPosition, setAdjustedPosition] = useState(position);

    // 调整菜单位置，防止溢出屏幕
    useEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let { x, y } = position;

            // 向右溢出
            if (x + rect.width > viewportWidth) {
                x = x - rect.width;
            }
            // 向下溢出
            if (y + rect.height > viewportHeight) {
                y = y - rect.height;
            }

            setAdjustedPosition({ x, y });
        }
    }, [position]);

    // 点击外部关闭
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        // 滚动时关闭
        const handleScroll = () => onClose();

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);

        // 阻止浏览器默认右键菜单
        document.addEventListener('contextmenu', (e) => {
            if (menuRef.current && menuRef.current.contains(e.target as Node)) {
                e.preventDefault();
            }
        });

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [onClose]);

    const menuContent = (
        <div
            ref={menuRef}
            className="fixed z-[100] w-48 bg-slate-800 border border-slate-700/50 rounded-lg shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100"
            style={{ top: adjustedPosition.y, left: adjustedPosition.x }}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div className="px-3 py-2 text-xs text-slate-500 font-medium border-b border-slate-700/50 mb-1 truncate">
                {bookmark.title}
            </div>

            <button
                onClick={() => { onEdit(); onClose(); }}
                className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/50 hover:text-white transition-colors flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                {getTranslation(language, 'edit')}
            </button>

            <button
                onClick={() => {
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(bookmark.url);
                        onClose();
                    }
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/50 hover:text-white transition-colors flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                {language === 'zh' ? '复制链接' : 'Copy Link'}
            </button>

            <div className="my-1 border-t border-slate-700/50" />

            <button
                onClick={() => { onDelete(); onClose(); }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                {getTranslation(language, 'delete')}
            </button>
        </div>
    );

    // 使用 Portal 渲染到 document.body 或指定容器
    return createPortal(menuContent, document.body);
};

export default ContextMenu;
