import React from 'react';
import { Language } from '../../types';
import { getTranslation } from '../../i18n';

interface ActionSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onAdd: () => void;
    onOpenSettings?: () => void;
    onOpenSync?: () => void;
    title: string;
    language: Language;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({
    isOpen,
    onClose,
    onEdit,
    onDelete,
    onAdd,
    onOpenSettings,
    onOpenSync,
    title,
    language,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-800 rounded-t-3xl p-6 pb-10 shadow-2xl border-t border-slate-700/50 animate-in slide-in-from-bottom-full duration-300">
                <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6 opacity-50" />

                {/* Global Actions Row */}
                <div className="flex gap-4 mb-6">
                    {onOpenSync && (
                        <button
                            onClick={() => { onOpenSync(); onClose(); }}
                            className="flex-1 bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 py-3 rounded-2xl flex flex-col items-center gap-1 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                            </svg>
                            <span className="text-xs font-medium">{getTranslation(language, 'cloudSync')}</span>
                        </button>
                    )}
                    {onOpenSettings && (
                        <button
                            onClick={() => { onOpenSettings(); onClose(); }}
                            className="flex-1 bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 py-3 rounded-2xl flex flex-col items-center gap-1 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.212 1.281c-.09.543-.56.941-1.11.941h-2.592c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.212-1.281z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-xs font-medium">{getTranslation(language, 'appSettings')}</span>
                        </button>
                    )}
                </div>

                <h3 className="text-center text-white font-bold text-lg mb-6 truncate px-4">
                    {getTranslation(language, 'actionsFor', { title })}
                </h3>
                <div className="space-y-3">
                    <button
                        onClick={() => {
                            onAdd();
                            onClose();
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-blue-500/20"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-5 h-5"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        {getTranslation(language, 'addNewShortcut')}
                    </button>
                    <button
                        onClick={() => {
                            onEdit();
                            onClose();
                        }}
                        className="w-full bg-slate-700/50 hover:bg-slate-700 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-5 h-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                            />
                        </svg>
                        {getTranslation(language, 'editShortcut')}
                    </button>
                    <button
                        onClick={() => {
                            onDelete();
                            onClose();
                        }}
                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-5 h-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                        </svg>
                        {getTranslation(language, 'deleteShortcut')}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full bg-transparent text-slate-500 font-semibold py-4 rounded-2xl"
                    >
                        {getTranslation(language, 'cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActionSheet;
