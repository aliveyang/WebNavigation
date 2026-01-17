import React from 'react';
import { AppSettings, GlobalBackgroundType, Language } from '../../types';
import { SEARCH_ENGINES, getRandomGradient } from '../../constants';
import { compressImage } from '../../utils';
import { getTranslation } from '../../i18n';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    appSettings: AppSettings;
    onUpdateAppSettings: (s: Partial<AppSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    appSettings,
    onUpdateAppSettings,
}) => {
    if (!isOpen) return null;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const compressed = await compressImage(e.target.files[0], 1920, 1080, 0.8);
                onUpdateAppSettings({ globalBgImage: compressed, globalBgType: 'image' });
            } catch (err) {
                console.error("File upload failed", err);
                alert(err instanceof Error ? err.message : "Image upload failed. Try a smaller file.");
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-slate-800 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-700/50 transform transition-all animate-in slide-in-from-bottom-10 fade-in flex flex-col max-h-[85vh]">

                {/* Modal Header */}
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                        {getTranslation(appSettings.language, 'appSettings')}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-6 overflow-y-auto custom-scrollbar pr-1">
                    {/* Layout */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">{getTranslation(appSettings.language, 'layoutDensity')}</label>
                            <span className="text-xs text-blue-400 font-mono bg-blue-400/10 px-2 py-0.5 rounded">{appSettings.gridCols} {getTranslation(appSettings.language, 'cols')}</span>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-900/50 p-4 rounded-xl">
                            <span className="text-xs text-slate-500 font-bold">2</span>
                            <input
                                type="range"
                                min="2"
                                max="6"
                                step="1"
                                value={appSettings.gridCols}
                                onChange={(e) => onUpdateAppSettings({ gridCols: Number(e.target.value) })}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                            />
                            <span className="text-xs text-slate-500 font-bold">6</span>
                        </div>
                    </div>

                    {/* Search Engine */}
                    <div>
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">{getTranslation(appSettings.language, 'searchEngine')}</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(SEARCH_ENGINES).map(([key, engine]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => onUpdateAppSettings({ searchEngine: key })}
                                    className={`px-3 py-3 rounded-xl text-sm font-medium transition-all border ${appSettings.searchEngine === key
                                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                            : 'bg-slate-900/50 border-transparent text-slate-400 hover:bg-slate-700 hover:text-white'
                                        }`}
                                >
                                    {engine.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Global Background */}
                    <div>
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">{getTranslation(appSettings.language, 'globalBackground')}</label>
                        <div className="flex bg-slate-900/50 p-1 rounded-xl mb-4">
                            {(['default', 'gradient', 'image'] as GlobalBackgroundType[]).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => onUpdateAppSettings({ globalBgType: type })}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${appSettings.globalBgType === type
                                            ? 'bg-slate-700 text-white shadow-md'
                                            : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    {getTranslation(appSettings.language, type as keyof typeof import('../../i18n').translations.en)}
                                </button>
                            ))}
                        </div>

                        {appSettings.globalBgType === 'gradient' && (
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${appSettings.globalBgGradient?.from || 'from-slate-800'} ${appSettings.globalBgGradient?.to || 'to-slate-900'} shadow-inner ring-1 ring-white/10`} />
                                <button
                                    type="button"
                                    onClick={() => onUpdateAppSettings({ globalBgGradient: getRandomGradient() })}
                                    className="flex-1 py-3 bg-slate-700/50 hover:bg-slate-700 text-sm text-slate-300 rounded-xl border border-slate-600/50 transition-colors flex items-center justify-center gap-2"
                                >
                                    {getTranslation(appSettings.language, 'shuffleGradient')}
                                </button>
                            </div>
                        )}

                        {appSettings.globalBgType === 'image' && (
                            <div className="space-y-3 animate-in fade-in">
                                <input
                                    type="text"
                                    placeholder="Image URL (https://...)"
                                    value={appSettings.globalBgImage || ''}
                                    onChange={(e) => onUpdateAppSettings({ globalBgImage: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                                <div className="relative">
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
                                <p className="text-[10px] text-slate-500 px-1">{getTranslation(appSettings.language, 'imageNote')}</p>
                            </div>
                        )}
                    </div>

                    {/* Card Appearance Config */}
                    <div>
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">{getTranslation(appSettings.language, 'cardAppearance')}</label>
                        <div className="space-y-4 bg-slate-900/30 p-4 rounded-xl">
                            {/* Icon Size */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs text-slate-400">{getTranslation(appSettings.language, 'iconSize')}</label>
                                    <span className="text-xs text-blue-400 font-mono">{appSettings.cardAppearanceConfig?.iconSize || 24}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="16"
                                    max="40"
                                    step="2"
                                    value={appSettings.cardAppearanceConfig?.iconSize || 24}
                                    onChange={(e) => onUpdateAppSettings({
                                        cardAppearanceConfig: {
                                            ...appSettings.cardAppearanceConfig!,
                                            iconSize: Number(e.target.value)
                                        }
                                    })}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>

                            {/* Icon Margin Top */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs text-slate-400">{getTranslation(appSettings.language, 'iconTopMargin')}</label>
                                    <span className="text-xs text-blue-400 font-mono">{appSettings.cardAppearanceConfig?.iconMarginTop || 2}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="12"
                                    step="1"
                                    value={appSettings.cardAppearanceConfig?.iconMarginTop || 2}
                                    onChange={(e) => onUpdateAppSettings({
                                        cardAppearanceConfig: {
                                            ...appSettings.cardAppearanceConfig!,
                                            iconMarginTop: Number(e.target.value)
                                        }
                                    })}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>

                            {/* Text Size */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs text-slate-400">{getTranslation(appSettings.language, 'textSize')}</label>
                                    <span className="text-xs text-blue-400 font-mono">{appSettings.cardAppearanceConfig?.textSize || 8}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="6"
                                    max="12"
                                    step="1"
                                    value={appSettings.cardAppearanceConfig?.textSize || 8}
                                    onChange={(e) => onUpdateAppSettings({
                                        cardAppearanceConfig: {
                                            ...appSettings.cardAppearanceConfig!,
                                            textSize: Number(e.target.value)
                                        }
                                    })}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>

                            {/* Text Margin Top */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs text-slate-400">{getTranslation(appSettings.language, 'textTopMargin')}</label>
                                    <span className="text-xs text-blue-400 font-mono">{appSettings.cardAppearanceConfig?.textMarginTop || 6}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="16"
                                    step="1"
                                    value={appSettings.cardAppearanceConfig?.textMarginTop || 6}
                                    onChange={(e) => onUpdateAppSettings({
                                        cardAppearanceConfig: {
                                            ...appSettings.cardAppearanceConfig!,
                                            textMarginTop: Number(e.target.value)
                                        }
                                    })}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => onUpdateAppSettings({
                                    cardAppearanceConfig: {
                                        iconSize: 24,
                                        iconMarginTop: 2,
                                        textSize: 8,
                                        textMarginTop: 6
                                    }
                                })}
                                className="w-full py-2 bg-slate-700/50 hover:bg-slate-700 text-xs text-slate-300 rounded-lg transition-colors"
                            >
                                {getTranslation(appSettings.language, 'resetToDefault')}
                            </button>
                        </div>
                    </div>

                    {/* Language Selection */}
                    <div>
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">{getTranslation(appSettings.language, 'language')}</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['zh', 'en'] as Language[]).map(lang => (
                                <button
                                    key={lang}
                                    type="button"
                                    onClick={() => onUpdateAppSettings({ language: lang })}
                                    className={`px-3 py-3 rounded-xl text-sm font-medium transition-all border ${appSettings.language === lang
                                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                            : 'bg-slate-900/50 border-transparent text-slate-400 hover:bg-slate-700 hover:text-white'
                                        }`}
                                >
                                    {lang === 'zh' ? '中文' : 'English'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full px-4 py-3.5 rounded-xl bg-slate-700/50 text-slate-200 font-bold hover:bg-slate-700 transition-colors"
                        >
                            {getTranslation(appSettings.language, 'closeSettings')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
