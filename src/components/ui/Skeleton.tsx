import React from 'react';
import { SETTINGS_KEY } from '../../constants/storage';

// 骨架屏渲染于全局 state 就绪之前：直接从 localStorage 预读已保存列数，避免加载后布局跳变（审计 B7）
const readSavedGridCols = (): number => {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) {
            const cols = Number(JSON.parse(raw)?.gridCols);
            if (Number.isFinite(cols) && cols >= 2 && cols <= 6) return cols;
        }
    } catch {
        // 预读失败时用默认值
    }
    return 4;
};

// 完整页面骨架屏
interface PageSkeletonProps {
    gridCols?: number;
}

export const PageSkeleton: React.FC<PageSkeletonProps> = ({ gridCols }) => {
    const cols = gridCols ?? readSavedGridCols();
    return (
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
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
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
};

export default PageSkeleton;
