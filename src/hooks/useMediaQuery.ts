/**
 * 媒体查询 Hook
 * 用于响应式设计
 */
import { useSyncExternalStore } from 'react';

// 移动端断点使用模块级共享 MediaQueryList：
// 所有卡片共用一个原生监听器，替代每卡片自挂 resize 监听（审计 C4）
let mobileMQL: MediaQueryList | null = null;
const getMobileMQL = (): MediaQueryList => {
    if (!mobileMQL) {
        mobileMQL = window.matchMedia('(max-width: 640px)');
    }
    return mobileMQL;
};

export function useIsMobile(): boolean {
    const subscribe = (onChange: () => void) => {
        const mql = getMobileMQL();
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    };
    return useSyncExternalStore(
        subscribe,
        () => getMobileMQL().matches,
        () => false
    );
}
