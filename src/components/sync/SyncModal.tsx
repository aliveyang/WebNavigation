import React, { useState, useEffect } from 'react';
import { syncManager, type SyncStatus } from '../../syncManager';
import { Bookmark, AppSettings, Language } from '../../types';
import { validatePin } from '../../utils';
import { getTranslation } from '../../i18n';
import { STORAGE_KEY, SETTINGS_KEY } from '../../constants';

interface SyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSyncComplete: (bookmarks: Bookmark[], settings: AppSettings) => void;
    isSyncingRef: React.MutableRefObject<boolean>;
    language: Language;
}

export const SyncModal: React.FC<SyncModalProps> = ({
    isOpen,
    onClose,
    onSyncComplete,
    isSyncingRef,
    language,
}) => {
    const [pin, setPin] = useState('');
    const [isEnabling, setIsEnabling] = useState(false);
    const [error, setError] = useState('');
    const syncStatus = syncManager.getStatus();

    useEffect(() => {
        if (isOpen) {
            setPin('');
            setError('');
            setIsEnabling(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleEnableSync = async () => {
        // 验证 PIN 码
        const pinValidation = validatePin(pin);
        if (!pinValidation.valid) {
            setError(pinValidation.error || 'Invalid PIN code');
            return;
        }

        setIsEnabling(true);
        setError('');
        isSyncingRef.current = true; // 标记开始同步

        try {
            await syncManager.enableSync(pin); // 现在是异步的

            // 先检查云端是否有数据
            const storedBookmarks = localStorage.getItem(STORAGE_KEY);
            const storedSettings = localStorage.getItem(SETTINGS_KEY);
            const localBookmarks = storedBookmarks ? JSON.parse(storedBookmarks) : [];
            const localSettings = storedSettings ? JSON.parse(storedSettings) : {};

            // 尝试拉取云端数据
            const cloudData = await syncManager.pullFromCloud();

            let finalBookmarks = localBookmarks;
            let finalSettings = localSettings;

            // 如果云端有数据且本地也有数据，让用户选择
            if (cloudData && cloudData.bookmarks && cloudData.bookmarks.length > 0 && localBookmarks.length > 0) {
                const cloudTitles = cloudData.bookmarks.map((b: any) => `  • ${b.title}`).join('\n');
                const localTitles = localBookmarks.map((b: any) => `  • ${b.title}`).join('\n');

                const choice = confirm(
                    `Both cloud and local have bookmarks:\n\n` +
                    `CLOUD bookmarks (${cloudData.bookmarks.length}):\n${cloudTitles}\n\n` +
                    `LOCAL bookmarks (${localBookmarks.length}):\n${localTitles}\n\n` +
                    `Click OK to use CLOUD data (remote replaces local).\n` +
                    `Click Cancel to use LOCAL data (local replaces remote).`
                );

                if (choice) {
                    // 使用云端数据
                    finalBookmarks = cloudData.bookmarks;
                    finalSettings = cloudData.settings || localSettings;
                } else {
                    // 使用本地数据，推送到云端
                    await syncManager.pushToCloud(localBookmarks, localSettings);
                }
            } else if (cloudData && cloudData.bookmarks && cloudData.bookmarks.length > 0) {
                // 云端有数据，本地没有，直接使用云端数据
                finalBookmarks = cloudData.bookmarks;
                finalSettings = cloudData.settings || localSettings;
            } else {
                // 云端没有数据，推送本地数据
                await syncManager.pushToCloud(localBookmarks, localSettings);
            }

            // 更新本地存储
            localStorage.setItem(STORAGE_KEY, JSON.stringify(finalBookmarks));
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(finalSettings));

            // 通过回调更新 React state
            onSyncComplete(finalBookmarks, finalSettings);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to enable sync');
        } finally {
            setIsEnabling(false);
            isSyncingRef.current = false; // 标记同步结束
        }
    };

    const handleDisableSync = () => {
        if (confirm('Are you sure you want to disable sync? Your local data will not be affected.')) {
            syncManager.disableSync();
            onClose();
        }
    };

    const handleManualSync = async () => {
        setIsEnabling(true);
        setError('');
        isSyncingRef.current = true; // 标记开始同步

        try {
            const storedBookmarks = localStorage.getItem(STORAGE_KEY);
            const storedSettings = localStorage.getItem(SETTINGS_KEY);
            const localBookmarks = storedBookmarks ? JSON.parse(storedBookmarks) : [];
            const localSettings = storedSettings ? JSON.parse(storedSettings) : {};

            // 先拉取云端数据
            const cloudData = await syncManager.pullFromCloud();

            let finalBookmarks = localBookmarks;
            let finalSettings = localSettings;
            let needsPush = false;

            // 如果云端有数据且本地也有数据，检查是否需要用户选择
            if (cloudData && cloudData.bookmarks && cloudData.bookmarks.length > 0 && localBookmarks.length > 0) {
                // 比较书签内容（通过 JSON 字符串比较）
                const cloudBookmarksStr = JSON.stringify(cloudData.bookmarks.map((b: any) => ({ id: b.id, title: b.title, url: b.url })).sort((a: any, b: any) => a.id.localeCompare(b.id)));
                const localBookmarksStr = JSON.stringify(localBookmarks.map((b: any) => ({ id: b.id, title: b.title, url: b.url })).sort((a: any, b: any) => a.id.localeCompare(b.id)));

                // 如果内容不同，让用户选择
                if (cloudBookmarksStr !== localBookmarksStr) {
                    const cloudTitles = cloudData.bookmarks.map((b: any) => `  • ${b.title}`).join('\n');
                    const localTitles = localBookmarks.map((b: any) => `  • ${b.title}`).join('\n');

                    const choice = confirm(
                        `Sync conflict detected!\n\n` +
                        `CLOUD bookmarks (${cloudData.bookmarks.length}):\n${cloudTitles}\n\n` +
                        `LOCAL bookmarks (${localBookmarks.length}):\n${localTitles}\n\n` +
                        `Click OK to use CLOUD data.\n` +
                        `Click Cancel to use LOCAL data.`
                    );

                    if (choice) {
                        // 使用云端数据
                        finalBookmarks = cloudData.bookmarks;
                        finalSettings = cloudData.settings || localSettings;
                    } else {
                        // 使用本地数据，推送到云端
                        needsPush = true;
                    }
                } else {
                    // 内容相同，数据已同步，使用云端数据（确保时间戳一致）
                    finalBookmarks = cloudData.bookmarks;
                    finalSettings = cloudData.settings || localSettings;
                }
            } else if (cloudData && cloudData.bookmarks && cloudData.bookmarks.length > 0) {
                // 云端有数据，本地没有，直接使用云端数据
                finalBookmarks = cloudData.bookmarks;
                finalSettings = cloudData.settings || localSettings;
            } else if (localBookmarks.length > 0) {
                // 本地有数据，云端没有，推送本地数据
                needsPush = true;
            }

            // 更新本地数据
            localStorage.setItem(STORAGE_KEY, JSON.stringify(finalBookmarks));
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(finalSettings));

            // 如果需要推送，在更新 state 之前推送
            if (needsPush) {
                await syncManager.pushToCloud(localBookmarks, localSettings);
            }

            // 通过回调更新 React state
            onSyncComplete(finalBookmarks, finalSettings);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sync failed');
        } finally {
            setIsEnabling(false);
            isSyncingRef.current = false; // 标记同步结束
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-slate-800 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-700/50 transform transition-all animate-in slide-in-from-bottom-10 fade-in">

                {/* Modal Header */}
                <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white tracking-tight">{getTranslation(language, 'cloudSync')}</h2>
                        <span className="text-xs text-slate-500 font-mono bg-slate-900/50 px-2 py-0.5 rounded">v1.1.0</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Status Display */}
                    <div className={`p-4 rounded-xl border ${syncStatus.enabled ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-900/50 border-slate-700'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${syncStatus.enabled ? 'bg-green-500' : 'bg-slate-600'}`} />
                            <div className="flex-1">
                                <p className="text-sm font-bold text-white">
                                    {syncStatus.enabled ? getTranslation(language, 'syncEnabled') : getTranslation(language, 'syncDisabled')}
                                </p>
                                {syncStatus.lastSyncTime && (
                                    <p className="text-xs text-slate-400 mt-1">
                                        {getTranslation(language, 'lastSync')}: {new Date(syncStatus.lastSyncTime).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {!syncStatus.enabled ? (
                        // Enable Sync Form
                        <>
                            <div className="space-y-3">
                                <p className="text-sm text-slate-300">
                                    {getTranslation(language, 'enterPin')}
                                </p>

                                <input
                                    type="text"
                                    placeholder={getTranslation(language, 'pinPlaceholder')}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-500"
                                    autoFocus
                                />

                                {error && (
                                    <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                                        {error}
                                    </p>
                                )}

                                <button
                                    onClick={handleEnableSync}
                                    disabled={isEnabling || pin.length < 4}
                                    className="w-full px-4 py-3.5 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                                >
                                    {isEnabling ? getTranslation(language, 'enabling') : getTranslation(language, 'enableSync')}
                                </button>
                            </div>

                            <div className="pt-2 border-t border-slate-700/50">
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    {getTranslation(language, 'pinNote')}
                                </p>
                            </div>
                        </>
                    ) : (
                        // Sync Management
                        <>
                            <div className="space-y-3">
                                <button
                                    onClick={handleManualSync}
                                    disabled={isEnabling || syncStatus.syncing}
                                    className="w-full px-4 py-3.5 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                                >
                                    {isEnabling || syncStatus.syncing ? (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 animate-spin">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                            </svg>
                                            {getTranslation(language, 'syncing')}
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                            </svg>
                                            {getTranslation(language, 'syncNow')}
                                        </>
                                    )}
                                </button>

                                {error && (
                                    <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                                        {error}
                                    </p>
                                )}

                                {syncStatus.error && (
                                    <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                                        {syncStatus.error}
                                    </p>
                                )}

                                <button
                                    onClick={handleDisableSync}
                                    className="w-full px-4 py-3.5 rounded-xl bg-red-500/10 text-red-400 font-bold hover:bg-red-500/20 transition-colors"
                                >
                                    {getTranslation(language, 'disableSync')}
                                </button>
                            </div>

                            <div className="pt-2 border-t border-slate-700/50">
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    {getTranslation(language, 'syncNote')}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SyncModal;
