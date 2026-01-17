import React from 'react';

interface SkeletonProps {
    className?: string;
}

// 基础骨架元素
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
    <div
        className={`animate-pulse bg-gradient-to-r from-slate-700/50 via-slate-600/50 to-slate-700/50 bg-[length:200%_100%] ${className}`}
        style={{ animation: 'shimmer 1.5s infinite' }}
    />
);

// 书签卡片骨架屏
export const BookmarkCardSkeleton: React.FC = () => (
    <div className="rounded-2xl aspect-square bg-slate-800/50 border border-slate-700/30 p-4 flex flex-col items-center justify-center gap-3 animate-pulse">
        {/* 图标占位 */}
        <div className="w-8 h-8 rounded-lg bg-slate-700/50" />
        {/* 文字占位 */}
        <div className="w-3/4 h-2 rounded bg-slate-700/50" />
    </div>
);

// 书签网格骨架屏
interface BookmarkGridSkeletonProps {
    count?: number;
    gridCols?: number;
}

export const BookmarkGridSkeleton: React.FC<BookmarkGridSkeletonProps> = ({
    count = 8,
    gridCols = 4
}) => (
    <div
        className="grid gap-3 p-4"
        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
    >
        {Array.from({ length: count }).map((_, index) => (
            <BookmarkCardSkeleton key={index} />
        ))}
    </div>
);

// 搜索栏骨架屏
export const SearchWidgetSkeleton: React.FC = () => (
    <div className="mx-4 mt-4 animate-pulse">
        <div className="h-12 rounded-2xl bg-slate-800/50 border border-slate-700/30" />
    </div>
);

// Header 骨架屏
export const HeaderSkeleton: React.FC = () => (
    <div className="flex items-center justify-between p-4 animate-pulse">
        <div className="w-8 h-8 rounded-full bg-slate-700/50" />
        <div className="w-24 h-6 rounded bg-slate-700/50" />
        <div className="w-8 h-8 rounded-full bg-slate-700/50" />
    </div>
);

// 完整页面骨架屏
interface PageSkeletonProps {
    gridCols?: number;
}

export const PageSkeleton: React.FC<PageSkeletonProps> = ({ gridCols = 4 }) => (
    <div className="min-h-screen bg-slate-900">
        <HeaderSkeleton />
        <SearchWidgetSkeleton />
        <BookmarkGridSkeleton gridCols={gridCols} count={8} />
    </div>
);

// 添加 shimmer 动画的 CSS (需要在全局样式中添加)
// @keyframes shimmer {
//   0% { background-position: 200% 0; }
//   100% { background-position: -200% 0; }
// }
