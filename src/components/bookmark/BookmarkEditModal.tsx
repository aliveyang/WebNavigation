import React, { useState, useEffect, useMemo } from 'react';
import { Bookmark, BackgroundType, AppSettings } from '../../types';
import { PRESET_ICONS, getRandomGradient } from '../../constants';
import {
    validateTitle,
    validateUrl,
    isValidImageUrl,
    sanitizeUrl,
    getFaviconUrl,
    compressImage,
} from '../../utils';
import { getTranslation } from '../../i18n';

interface BookmarkEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Bookmark>) => void;
    initialData?: Bookmark;
    appSettings: AppSettings;
}

export const BookmarkEditModal: React.FC<BookmarkEditModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData,
    appSettings,
}) => {
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [bgType, setBgType] = useState<BackgroundType>('gradient');
    const [bgImage, setBgImage] = useState('');
    const [iconKey, setIconKey] = useState('home');
    const [colors, setColors] = useState(getRandomGradient());

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title);
                setUrl(initialData.url);
                setBgType(initialData.bgType || 'gradient');
                setBgImage(initialData.bgImage || '');
                setIconKey(initialData.iconKey || 'home');
                setColors({ from: initialData.colorFrom, to: initialData.colorTo });
            } else {
                setTitle('');
                setUrl('');
                setBgType('gradient');
                setBgImage('');
                setIconKey('home');
                setColors(getRandomGradient());
            }
        }
    }, [isOpen, initialData]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const compressed = await compressImage(e.target.files[0], 800, 800, 0.8);
                setBgImage(compressed);
            } catch (err) {
                console.error("File upload failed", err);
                alert(err instanceof Error ? err.message : "Image upload failed. Try a smaller file.");
            }
        }
    };

    const faviconUrl = useMemo(() => {
        if (bgType === 'icon' && url) {
            return getFaviconUrl(url);
        }
        return '';
    }, [bgType, url]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const titleValidation = validateTitle(title);
        if (!titleValidation.valid) {
            alert(titleValidation.error);
            return;
        }

        const urlValidation = validateUrl(url);
        if (!urlValidation.valid) {
            alert(urlValidation.error);
            return;
        }

        if (bgImage && !isValidImageUrl(bgImage)) {
            alert('Invalid image URL. Please use a valid image URL or upload a local image.');
            return;
        }

        if (title && url) {
            onSave({
                title,
                url: sanitizeUrl(url),
                bgType,
                bgImage,
                iconKey: bgType === 'library' ? iconKey : undefined,
                colorFrom: colors.from,
                colorTo: colors.to
            });
            onClose();
        }
    };

    const tabs: { id: BackgroundType; label: string }[] = [
        { id: 'gradient', label: 'Color' },
        { id: 'library', label: 'Library' },
        { id: 'icon', label: 'Icon' },
        { id: 'image', label: 'Image' },
    ];

    const refreshColors = () => setColors(getRandomGradient());

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-slate-800 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-700/50 transform transition-all animate-in slide-in-from-bottom-10 fade-in flex flex-col max-h-[85vh]">

                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                        {initialData ? getTranslation(appSettings.language, 'editShortcutTitle') : getTranslation(appSettings.language, 'addShortcut')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
                    <div className="space-y-3">
                        <div>
                            <input
                                autoFocus
                                type="text"
                                placeholder={getTranslation(appSettings.language, 'titlePlaceholder')}
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder={getTranslation(appSettings.language, 'urlPlaceholder')}
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex bg-slate-900/50 p-1 rounded-xl mb-4">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setBgType(tab.id)}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${bgType === tab.id
                                            ? 'bg-slate-700 text-white shadow-md'
                                            : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    {getTranslation(appSettings.language, tab.id as any)}
                                </button>
                            ))}
                        </div>

                        {(bgType === 'gradient' || bgType === 'library') && (
                            <div className="flex items-center gap-4 mb-4">
                                <div
                                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colors.from} ${colors.to} flex items-center justify-center shadow-lg transition-all duration-300`}
                                >
                                    {bgType === 'library' && (
                                        <svg className="w-8 h-8 text-white drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                                            <path d={PRESET_ICONS[iconKey]} />
                                        </svg>
                                    )}
                                    {bgType === 'gradient' && (
                                        <span className="text-xl font-bold text-white drop-shadow-md">
                                            {(title || 'A').charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={refreshColors}
                                    className="flex-1 py-2 bg-slate-700/50 hover:bg-slate-700 text-sm text-slate-300 rounded-xl border border-slate-600/50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                    </svg>
                                    {getTranslation(appSettings.language, 'shuffleColor')}
                                </button>
                            </div>
                        )}

                        {bgType === 'library' && (
                            <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                                {Object.entries(PRESET_ICONS).map(([key, path]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setIconKey(key)}
                                        className={`aspect-square rounded-lg flex items-center justify-center transition-all ${iconKey === key
                                                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/50'
                                                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                                            }`}
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d={path} />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        )}

                        {bgType === 'image' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <input
                                    type="text"
                                    placeholder="Image URL (https://...)"
                                    value={bgImage}
                                    onChange={e => setBgImage(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                <div className="relative mt-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="w-full bg-slate-900/50 border border-dashed border-slate-700 hover:border-blue-500 text-slate-400 rounded-xl px-4 py-3 text-sm text-center transition-colors">
                                        {getTranslation(appSettings.language, 'chooseLocalImage')}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">{getTranslation(appSettings.language, 'imageNote')}</p>
                            </div>
                        )}
                        {bgType === 'icon' && url && (
                            <div className="space-y-3 animate-in fade-in">
                                <div className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-xl border border-slate-700/30">
                                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                                        <img src={faviconUrl} className="w-6 h-6 object-contain" alt="Preview" onError={(e) => e.currentTarget.style.display = 'none'} />
                                    </div>
                                    <span className="text-sm text-slate-400">{getTranslation(appSettings.language, 'faviconPreview')}</span>
                                </div>

                                {faviconUrl && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-400 font-medium">
                                                {appSettings.language === 'zh' ? 'Favicon URL（用于 Image 模式）:' : 'Favicon URL (for Image mode):'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(faviconUrl);
                                                    alert(appSettings.language === 'zh' ? '已复制到剪贴板！' : 'Copied to clipboard!');
                                                }}
                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                                                </svg>
                                                {appSettings.language === 'zh' ? '复制' : 'Copy'}
                                            </button>
                                        </div>
                                        <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                            <code className="text-[10px] text-slate-400 break-all font-mono leading-relaxed">
                                                {faviconUrl}
                                            </code>
                                        </div>
                                        <p className="text-[10px] text-slate-500 px-1">
                                            {appSettings.language === 'zh'
                                                ? '提示：复制此 URL，切换到 Image 模式粘贴即可使用。'
                                                : 'Tip: Copy this URL and paste it in Image mode to use.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 mt-6 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3.5 rounded-xl bg-slate-700/50 text-slate-200 font-bold hover:bg-slate-700 transition-colors"
                        >
                            {getTranslation(appSettings.language, 'cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={!title || !url}
                            className="flex-1 px-4 py-3.5 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 active:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                        >
                            {initialData ? getTranslation(appSettings.language, 'update') : getTranslation(appSettings.language, 'save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookmarkEditModal;
