import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bookmark } from '../../types';
import { BookmarkCard } from '../BookmarkCard';

interface SortableItemProps {
    id: string;
    bookmark: Bookmark;
    settings: any;
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
        touchAction: 'none', // Prevent scrolling while dragging
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
                gridCols={settings.gridCols}
                cardAppearanceConfig={settings.cardAppearanceConfig}
                onLongPress={onLongPress}
                onContextMenu={(e) => onContextMenu(e, bookmark)}
            />
        </div>
    );
};
