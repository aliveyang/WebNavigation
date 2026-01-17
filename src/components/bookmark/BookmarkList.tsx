import React, { useState, useCallback } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    TouchSensor,
    MouseSensor,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Bookmark, AppSettings } from '../../types';
import { SortableItem } from './SortableItem';

interface BookmarkListProps {
    bookmarks: Bookmark[];
    settings: AppSettings;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onLongPress: (bookmark: Bookmark) => void;
    onContextMenu: (e: React.MouseEvent, bookmark: Bookmark) => void;
}

export const BookmarkList: React.FC<BookmarkListProps> = ({
    bookmarks,
    settings,
    onReorder,
    onLongPress,
    onContextMenu,
}) => {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10, // PC (鼠标): 移动 10px 后开始拖拽
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 1000, // 移动端: 按住 1000ms 后开始拖拽
                tolerance: 5, // 容忍 5px 的移动
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const oldIndex = bookmarks.findIndex((b) => b.id === active.id);
            const newIndex = bookmarks.findIndex((b) => b.id === over.id);
            onReorder(oldIndex, newIndex);
        }
    };

    const handleDragCancel = () => {
        setActiveId(null);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <SortableContext
                items={bookmarks.map(b => b.id)}
                strategy={rectSortingStrategy}
            >
                <div
                    className="grid gap-3 sm:gap-6 p-4 pb-32 sm:p-8 mx-auto w-full max-w-7xl animate-in fade-in duration-500"
                    style={{
                        gridTemplateColumns: `repeat(${settings.gridCols}, minmax(0, 1fr))`
                    }}
                >
                    {bookmarks.map((bookmark) => (
                        <SortableItem
                            key={bookmark.id}
                            id={bookmark.id}
                            bookmark={bookmark}
                            settings={settings}
                            onLongPress={onLongPress}
                            onContextMenu={onContextMenu}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
};
