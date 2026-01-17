import React from 'react';
import { useIsOnline, useOnline } from '../../hooks';
import { Language } from '../../types';
import { getTranslation } from '../../i18n';

interface NetworkIndicatorProps {
    language: Language;
    showWhenOnline?: boolean;
}

/**
 * 网络状态指示器
 * 默认仅在离线时显示，可通过 showWhenOnline 配置
 */
export const NetworkIndicator: React.FC<NetworkIndicatorProps> = ({
    language,
    showWhenOnline = false,
}) => {
    const { isOnline, wasOffline } = useOnline();

    // 在线且不需要显示时返回 null
    if (isOnline && !showWhenOnline && !wasOffline) {
        return null;
    }

    return (
        <div
            className={`
        fixed top-16 left-1/2 -translate-x-1/2 z-50
        px-4 py-2 rounded-full
        flex items-center gap-2
        text-sm font-medium
        shadow-lg backdrop-blur-md
        transition-all duration-300
        ${isOnline
                    ? wasOffline
                        ? 'bg-green-500/90 text-white animate-in slide-in-from-top-4'
                        : 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-red-500/90 text-white animate-pulse'
                }
      `}
        >
            {/* 状态指示点 */}
            <span
                className={`
          w-2 h-2 rounded-full
          ${isOnline ? 'bg-green-300' : 'bg-red-300 animate-ping'}
        `}
            />

            {/* 状态文字 */}
            <span>
                {isOnline
                    ? wasOffline
                        ? language === 'zh' ? '已恢复连接' : 'Back Online'
                        : language === 'zh' ? '在线' : 'Online'
                    : language === 'zh' ? '离线模式' : 'Offline'
                }
            </span>

            {/* 离线时的提示图标 */}
            {!isOnline && (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                </svg>
            )}
        </div>
    );
};

/**
 * 简化版：仅显示小圆点
 */
export const NetworkDot: React.FC = () => {
    const isOnline = useIsOnline();

    return (
        <span
            className={`
        w-2 h-2 rounded-full
        ${isOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'}
      `}
            title={isOnline ? 'Online' : 'Offline'}
        />
    );
};

export default NetworkIndicator;
