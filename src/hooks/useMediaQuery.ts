/**
 * 媒体查询 Hook
 * 用于响应式设计
 */
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(query).matches;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);

        const handler = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        // 兼容旧版浏览器
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handler);
        } else {
            mediaQuery.addListener(handler);
        }

        // 确保初始状态正确
        setMatches(mediaQuery.matches);

        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handler);
            } else {
                mediaQuery.removeListener(handler);
            }
        };
    }, [query]);

    return matches;
}

/**
 * 预设的常用媒体查询
 */
export function useIsMobile(): boolean {
    return useMediaQuery('(max-width: 640px)');
}

export function useIsTablet(): boolean {
    return useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
}

export function useIsDesktop(): boolean {
    return useMediaQuery('(min-width: 1025px)');
}

export function usePrefersDarkMode(): boolean {
    return useMediaQuery('(prefers-color-scheme: dark)');
}

export function usePrefersReducedMotion(): boolean {
    return useMediaQuery('(prefers-reduced-motion: reduce)');
}
