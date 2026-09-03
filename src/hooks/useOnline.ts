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
        lastOnlineTime: null, // 首次上线时间由 online 事件回填（渲染期不可调用 Date.now）
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

    // 恢复在线数秒后自动清除 wasOffline，让"已恢复连接"横幅可以消失（审计 B3）
    useEffect(() => {
        if (!status.isOnline || !status.wasOffline) return;
        const timer = window.setTimeout(() => {
            setStatus((prev) => ({ ...prev, wasOffline: false }));
        }, 5000);
        return () => window.clearTimeout(timer);
    }, [status.isOnline, status.wasOffline]);

    return status;
}
