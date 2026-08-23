import React from 'react';

// 完整页面骨架屏
interface PageSkeletonProps {
    gridCols?: number;
}

export const PageSkeleton: React.FC<PageSkeletonProps> = ({ gridCols = 4 }) => (
    <div className="min-h-screen bg-slate-900">
        <div className="flex items-center justify-between p-4 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-700/50" />
            <div className="w-24 h-6 rounded bg-slate-700/50" />
            <div className="w-8 h-8 rounded-full bg-slate-700/50" />
        </div>
        <div className="mx-4 mt-4 animate-pulse">
            <div className="h-12 rounded-2xl bg-slate-800/50 border border-slate-700/30" />
        </div>
        <div
            className="grid gap-3 p-4"
            style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
        >
            {Array.from({ length: 8 }).map((_, index) => (
                <div
                    key={index}
                    className="rounded-2xl aspect-square bg-slate-800/50 border border-slate-700/30 p-4 flex flex-col items-center justify-center gap-3 animate-pulse"
                >
                    <div className="w-8 h-8 rounded-lg bg-slate-700/50" />
                    <div className="w-3/4 h-2 rounded bg-slate-700/50" />
                </div>
            ))}
        </div>
    </div>
);

export default PageSkeleton;
