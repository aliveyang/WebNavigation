import React, { useEffect, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastProps {
    toast: ToastMessage;
    onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastProps> = ({ toast, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // 触发进入动画
        requestAnimationFrame(() => setIsVisible(true));

        // 自动消失
        const timer = setTimeout(() => {
            handleDismiss();
        }, toast.duration || 3000);

        return () => clearTimeout(timer);
    }, [toast.duration]);

    const handleDismiss = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => {
            onDismiss(toast.id);
        }, 300); // 动画时长
    }, [onDismiss, toast.id]);

    const iconMap: Record<ToastType, React.ReactNode> = {
        success: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        error: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
        ),
        info: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
        ),
        warning: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
        ),
    };

    const colorMap: Record<ToastType, string> = {
        success: 'bg-emerald-500/90 text-white',
        error: 'bg-red-500/90 text-white',
        info: 'bg-blue-500/90 text-white',
        warning: 'bg-amber-500/90 text-white',
    };

    return (
        <div
            className={`
        flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-md
        ${colorMap[toast.type]}
        transform transition-all duration-300 ease-out
        ${isVisible && !isExiting ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
        cursor-pointer hover:scale-[1.02]
      `}
            onClick={handleDismiss}
            role="alert"
        >
            <span className="flex-shrink-0">{iconMap[toast.type]}</span>
            <span className="text-sm font-medium">{toast.message}</span>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss();
                }}
                className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
                aria-label="关闭"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

// Toast 容器
interface ToastContainerProps {
    toasts: ToastMessage[];
    onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <ToastItem toast={toast} onDismiss={onDismiss} />
                </div>
            ))}
        </div>
    );
};

// Toast Hook
let toastIdCounter = 0;
let globalAddToast: ((toast: Omit<ToastMessage, 'id'>) => void) | null = null;

export const useToast = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
        const id = `toast-${++toastIdCounter}`;
        setToasts((prev) => [...prev, { ...toast, id }]);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    // 注册全局方法
    useEffect(() => {
        globalAddToast = addToast;
        return () => {
            globalAddToast = null;
        };
    }, [addToast]);

    return {
        toasts,
        addToast,
        dismissToast,
        success: (message: string, duration?: number) => addToast({ message, type: 'success', duration }),
        error: (message: string, duration?: number) => addToast({ message, type: 'error', duration }),
        info: (message: string, duration?: number) => addToast({ message, type: 'info', duration }),
        warning: (message: string, duration?: number) => addToast({ message, type: 'warning', duration }),
    };
};

// 全局 Toast 方法 (可在非组件中使用)
export const toast = {
    success: (message: string, duration?: number) => globalAddToast?.({ message, type: 'success', duration }),
    error: (message: string, duration?: number) => globalAddToast?.({ message, type: 'error', duration }),
    info: (message: string, duration?: number) => globalAddToast?.({ message, type: 'info', duration }),
    warning: (message: string, duration?: number) => globalAddToast?.({ message, type: 'warning', duration }),
};
