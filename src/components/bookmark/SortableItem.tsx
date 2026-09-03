import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bookmark, AppSettings } from '../../types';
import { BookmarkCard } from '../BookmarkCard';

interface SortableItemProps {
    id: string;
    bookmark: Bookmark;
    settings: AppSettings;
    onLongPress: (bookmark: Bookmark) => void;
    onContextMenu: (e: React.MouseEvent, bookmark: Bookmark) => void;
    isDragging?: boolean;
}

export const SortableItem: React.FC<SortableItemProps> = ({
    id,
    bookmark,
    settings,
    onLongPress,
    onContextMenu,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 999 : 'auto',
        // 仅拖拽激活期间禁用触摸滚动，平时允许从卡片发起页面滚动（审计 D1）
        touchAction: isDragging ? 'none' : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={isDragging ? 'z-50' : ''}
        >
            <BookmarkCard
                item={bookmark}
                cardAppearanceConfig={settings.cardAppearanceConfig}
                onLongPress={onLongPress}
                onContextMenu={(e) => onContextMenu(e, bookmark)}
                isDragActive={isDragging}
            />
        </div>
    );
};
