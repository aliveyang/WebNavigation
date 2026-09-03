/**
 * 应用全局状态管理
 * 使用 React Context + useReducer 模式
 * reducer 与状态类型定义在 ./appReducer（独立纯函数模块，便于单测）
 */
import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { Bookmark, AppSettings } from '../../types';
import { ToastType } from '../../components/ui';
import { appReducer, initialState, type AppState, type AppAction } from './appReducer';

// 兼容导出：状态与 Action 类型由 appReducer 模块定义
export type { AppState, AppAction };

// ============ Context ============

interface AppContextValue {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;

    // 便捷方法
    actions: {
        // 书签
        addBookmark: (bookmark: Bookmark) => void;
        updateBookmark: (id: string, data: Partial<Bookmark>) => void;
        deleteBookmark: (id: string) => void;

        // 设置
        updateSettings: (settings: Partial<AppSettings>) => void;

        // Modal
        openEditModal: (bookmark?: Bookmark) => void;
        openSettingsModal: () => void;
        openSyncModal: () => void;
        closeModal: () => void;

        // Action Sheet
        openActionSheet: (bookmark: Bookmark) => void;
        closeActionSheet: () => void;

        // Toast
        showToast: (message: string, type?: ToastType, duration?: number) => void;
        dismissToast: (id: string) => void;
    };
}

const AppContext = createContext<AppContextValue | null>(null);

// ============ Provider ============

interface AppProviderProps {
    children: ReactNode;
    initialBookmarks?: Bookmark[];
    initialSettings?: AppSettings;
}

export function AppProvider({ children, initialBookmarks, initialSettings }: AppProviderProps) {
    const [state, dispatch] = useReducer(appReducer, {
        ...initialState,
        bookmarks: initialBookmarks || initialState.bookmarks,
        settings: initialSettings || initialState.settings,
    });

    // 便捷方法
    const actions = {
        // 书签
        addBookmark: useCallback((bookmark: Bookmark) => {
            dispatch({ type: 'ADD_BOOKMARK', payload: bookmark });
        }, []),

        updateBookmark: useCallback((id: string, data: Partial<Bookmark>) => {
            dispatch({ type: 'UPDATE_BOOKMARK', payload: { id, data } });
        }, []),

        deleteBookmark: useCallback((id: string) => {
            dispatch({ type: 'DELETE_BOOKMARK', payload: id });
        }, []),

        // 设置
        updateSettings: useCallback((settings: Partial<AppSettings>) => {
            dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
        }, []),

        // Modal
        openEditModal: useCallback((bookmark?: Bookmark) => {
            dispatch({ type: 'OPEN_EDIT_MODAL', payload: bookmark });
        }, []),

        openSettingsModal: useCallback(() => {
            dispatch({ type: 'OPEN_SETTINGS_MODAL' });
        }, []),

        openSyncModal: useCallback(() => {
            dispatch({ type: 'OPEN_SYNC_MODAL' });
        }, []),

        closeModal: useCallback(() => {
            dispatch({ type: 'CLOSE_MODAL' });
        }, []),

        // Action Sheet
        openActionSheet: useCallback((bookmark: Bookmark) => {
            dispatch({ type: 'OPEN_ACTION_SHEET', payload: bookmark });
        }, []),

        closeActionSheet: useCallback(() => {
            dispatch({ type: 'CLOSE_ACTION_SHEET' });
        }, []),

        // Toast
        showToast: useCallback((message: string, type: ToastType = 'info', duration?: number) => {
            dispatch({ type: 'ADD_TOAST', payload: { message, type, duration } });
        }, []),

        dismissToast: useCallback((id: string) => {
            dispatch({ type: 'REMOVE_TOAST', payload: id });
        }, []),
    };

    return (
        <AppContext.Provider value={{ state, dispatch, actions }}>
            {children}
        </AppContext.Provider>
    );
}

// ============ Hook ============

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}

// 便捷 hooks
export function useBookmarks() {
    const { state, actions } = useApp();
    return {
        bookmarks: state.bookmarks,
        addBookmark: actions.addBookmark,
        updateBookmark: actions.updateBookmark,
        deleteBookmark: actions.deleteBookmark,
    };
}

export function useSettings() {
    const { state, actions } = useApp();
    return {
        settings: state.settings,
        updateSettings: actions.updateSettings,
        language: state.settings.language,
    };
}

export function useUI() {
    const { state, actions } = useApp();
    return {
        ...state.ui,
        openEditModal: actions.openEditModal,
        openSettingsModal: actions.openSettingsModal,
        openSyncModal: actions.openSyncModal,
        closeModal: actions.closeModal,
        openActionSheet: actions.openActionSheet,
        closeActionSheet: actions.closeActionSheet,
    };
}

export function useToasts() {
    const { state, actions } = useApp();
    return {
        toasts: state.toasts,
        showToast: actions.showToast,
        dismissToast: actions.dismissToast,
        success: (message: string, duration?: number) => actions.showToast(message, 'success', duration),
        error: (message: string, duration?: number) => actions.showToast(message, 'error', duration),
        info: (message: string, duration?: number) => actions.showToast(message, 'info', duration),
        warning: (message: string, duration?: number) => actions.showToast(message, 'warning', duration),
    };
}
