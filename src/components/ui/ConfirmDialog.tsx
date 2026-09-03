/**
 * 确认对话框（审计 D2）
 * 替换原生 confirm()：与整体 UI 风格一致、支持 en+zh 文案、Promise 化便于在异步流程中等待
 * 用法：const confirm = useConfirm(); if (await confirm({ title: '...' })) { ... }
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Language } from '../../types';
import { getTranslation } from '../../i18n';

export interface ConfirmOptions {
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
    resolve: (value: boolean) => void;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface ConfirmProviderProps {
    children: React.ReactNode;
    language: Language;
}

export function ConfirmProvider({ children, language }: ConfirmProviderProps) {
    const [pending, setPending] = useState<PendingConfirm | null>(null);

    const confirm = useCallback<ConfirmFn>((options) => {
        return new Promise<boolean>((resolve) => {
            setPending((prev) => {
                // 已有待确认请求时，让前一个以"取消"收尾，避免 Promise 悬挂
                prev?.resolve(false);
                return { ...options, resolve };
            });
        });
    }, []);

    const close = useCallback((result: boolean) => {
        setPending((prev) => {
            prev?.resolve(result);
            return null;
        });
    }, []);

    const value = useMemo(() => confirm, [confirm]);

    const dialog = pending ? createPortal(
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4 sm:p-0">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={() => close(false)}
            />
            <div
                className="relative bg-slate-800 w-full max-w-xs rounded-3xl p-6 shadow-2xl border border-slate-700/50 transform transition-all animate-in zoom-in-95 fade-in duration-150"
                role="alertdialog"
                aria-modal="true"
            >
                <h3 className="text-lg font-bold text-white mb-2">{pending.title}</h3>
                {pending.message && (
                    <p className="text-sm text-slate-300 whitespace-pre-line mb-5">{pending.message}</p>
                )}

                <div className={`flex gap-3 ${pending.message ? '' : 'mt-5'}`}>
                    <button
                        type="button"
                        onClick={() => close(false)}
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-700/50 text-slate-200 font-bold hover:bg-slate-700 transition-colors"
                    >
                        {pending.cancelText ?? getTranslation(language, 'cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={() => close(true)}
                        className={`flex-1 px-4 py-3 rounded-xl font-bold transition-colors ${
                            pending.danger
                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'
                        }`}
                    >
                        {pending.confirmText ?? getTranslation(language, 'confirmOk')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <ConfirmContext.Provider value={value}>
            {children}
            {dialog}
        </ConfirmContext.Provider>
    );
}

export function useConfirm(): ConfirmFn {
    const ctx = useContext(ConfirmContext);
    if (!ctx) {
        throw new Error('useConfirm must be used within ConfirmProvider');
    }
    return ctx;
}
