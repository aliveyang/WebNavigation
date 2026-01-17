/**
 * 网络状态 Hook
 * 监测在线/离线状态
 */
import { useState, useEffect, useCallback } from 'react';

export interface OnlineStatus {
    isOnline: boolean;
    wasOffline: boolean;  // 曾经离线过（可用于提示用户同步）
    lastOnlineTime: number | null;
}

export function useOnline(): OnlineStatus {
    const [status, setStatus] = useState<OnlineStatus>({
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        wasOffline: false,
        lastOnlineTime: Date.now(),
    });

    const handleOnline = useCallback(() => {
        setStatus((prev) => ({
            isOnline: true,
            wasOffline: prev.wasOffline || !prev.isOnline,
            lastOnlineTime: Date.now(),
        }));
    }, []);

    const handleOffline = useCallback(() => {
        setStatus((prev) => ({
            ...prev,
            isOnline: false,
        }));
    }, []);

    useEffect(() => {
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [handleOnline, handleOffline]);

    return status;
}

/**
 * 简化版：仅返回是否在线
 */
export function useIsOnline(): boolean {
    const { isOnline } = useOnline();
    return isOnline;
}
