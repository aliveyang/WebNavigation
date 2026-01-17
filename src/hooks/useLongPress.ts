/**
 * 长按交互 Hook
 * 支持触屏和鼠标设备
 */
import React, { useRef, useCallback, useState } from 'react';

interface UseLongPressOptions {
    delay?: number;
    onStart?: () => void;
    onCancel?: () => void;
    vibrate?: boolean;
}

interface UseLongPressReturn {
    isPressing: boolean;
    handlers: {
        onMouseDown: () => void;
        onMouseUp: () => void;
        onMouseLeave: () => void;
        onTouchStart: () => void;
        onTouchEnd: () => void;
        onTouchMove: () => void;
        onContextMenu: (e: React.MouseEvent) => void;
    };
}

export function useLongPress(
    callback: () => void,
    options: UseLongPressOptions = {}
): UseLongPressReturn {
    const { delay = 800, onStart, onCancel, vibrate = true } = options;

    const [isPressing, setIsPressing] = useState(false);
    const pressTimer = useRef<number | null>(null);
    const isLongPressTriggered = useRef(false);

    const startPress = useCallback(() => {
        isLongPressTriggered.current = false;
        setIsPressing(true);
        onStart?.();

        pressTimer.current = window.setTimeout(() => {
            isLongPressTriggered.current = true;
            setIsPressing(false);

            if (vibrate && navigator.vibrate) {
                navigator.vibrate(50);
            }

            callback();
        }, delay);
    }, [callback, delay, onStart, vibrate]);

    const cancelPress = useCallback(() => {
        setIsPressing(false);
        onCancel?.();

        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    }, [onCancel]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
    }, []);

    return {
        isPressing,
        handlers: {
            onMouseDown: startPress,
            onMouseUp: cancelPress,
            onMouseLeave: cancelPress,
            onTouchStart: startPress,
            onTouchEnd: cancelPress,
            onTouchMove: cancelPress,
            onContextMenu: handleContextMenu,
        },
    };
}
