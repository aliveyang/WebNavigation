/**
 * 应用全局状态管理
 * 使用 React Context + useReducer 模式
 */
import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { Bookmark, AppSettings, Language } from '../../types';
import { ToastMessage, ToastType } from '../../components/ui';

// ============ State 类型定义 ============

export interface AppState {
    // 书签数据
    bookmarks: Bookmark[];

    // 应用设置
    settings: AppSettings;

    // UI 状态
    ui: {
        activeModal: 'edit' | 'settings' | 'sync' | null;
        selectedBookmark: Bookmark | null;
        isActionSheetOpen: boolean;
        isLoading: boolean;
    };

    // Toast 通知
    toasts: ToastMessage[];
}

// ============ Action 类型定义 ============

export type AppAction =
    // 书签操作
    | { type: 'SET_BOOKMARKS'; payload: Bookmark[] }
    | { type: 'ADD_BOOKMARK'; payload: Bookmark }
    | { type: 'UPDATE_BOOKMARK'; payload: { id: string; data: Partial<Bookmark> } }
    | { type: 'DELETE_BOOKMARK'; payload: string }
    | { type: 'REORDER_BOOKMARKS'; payload: { fromIndex: number; toIndex: number } }

    // 设置操作
    | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
    | { type: 'SET_SETTINGS'; payload: AppSettings }

    // UI 操作
    | { type: 'OPEN_EDIT_MODAL'; payload?: Bookmark }
    | { type: 'OPEN_SETTINGS_MODAL' }
    | { type: 'OPEN_SYNC_MODAL' }
    | { type: 'CLOSE_MODAL' }
    | { type: 'OPEN_ACTION_SHEET'; payload: Bookmark }
    | { type: 'CLOSE_ACTION_SHEET' }
    | { type: 'SET_LOADING'; payload: boolean }

    // Toast 操作
    | { type: 'ADD_TOAST'; payload: Omit<ToastMessage, 'id'> }
    | { type: 'REMOVE_TOAST'; payload: string };

// ============ 初始状态 ============

const defaultSettings: AppSettings = {
    gridCols: 4,
    searchEngine: 'google',
    globalBgType: 'default',
    globalBgGradient: { from: 'from-slate-900', to: 'to-slate-800' },
    cardAppearanceConfig: {
        iconSize: 24,
        iconMarginTop: 2,
        textSize: 8,
        textMarginTop: 6,
    },
    language: 'zh',
};

const initialState: AppState = {
    bookmarks: [],
    settings: defaultSettings,
    ui: {
        activeModal: null,
        selectedBookmark: null,
        isActionSheetOpen: false,
        isLoading: true,
    },
    toasts: [],
};

// ============ Reducer ============

let toastIdCounter = 0;

function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        // 书签操作
        case 'SET_BOOKMARKS':
            return { ...state, bookmarks: action.payload };

        case 'ADD_BOOKMARK':
            return { ...state, bookmarks: [...state.bookmarks, action.payload] };

        case 'UPDATE_BOOKMARK':
            return {
                ...state,
                bookmarks: state.bookmarks.map((b) =>
                    b.id === action.payload.id ? { ...b, ...action.payload.data } : b
                ),
            };

        case 'DELETE_BOOKMARK':
            return {
                ...state,
                bookmarks: state.bookmarks.filter((b) => b.id !== action.payload),
            };

        case 'REORDER_BOOKMARKS': {
            const { fromIndex, toIndex } = action.payload;
            const newBookmarks = [...state.bookmarks];
            const [removed] = newBookmarks.splice(fromIndex, 1);
            newBookmarks.splice(toIndex, 0, removed);
            return { ...state, bookmarks: newBookmarks };
        }

        // 设置操作
        case 'UPDATE_SETTINGS':
            return { ...state, settings: { ...state.settings, ...action.payload } };

        case 'SET_SETTINGS':
            return { ...state, settings: action.payload };

        // UI 操作
        case 'OPEN_EDIT_MODAL':
            return {
                ...state,
                ui: {
                    ...state.ui,
                    activeModal: 'edit',
                    selectedBookmark: action.payload || null,
                    isActionSheetOpen: false,
                },
            };

        case 'OPEN_SETTINGS_MODAL':
            return {
                ...state,
                ui: { ...state.ui, activeModal: 'settings', isActionSheetOpen: false },
            };

        case 'OPEN_SYNC_MODAL':
            return {
                ...state,
                ui: { ...state.ui, activeModal: 'sync', isActionSheetOpen: false },
            };

        case 'CLOSE_MODAL':
            return {
                ...state,
                ui: { ...state.ui, activeModal: null, selectedBookmark: null },
            };

        case 'OPEN_ACTION_SHEET':
            return {
                ...state,
                ui: { ...state.ui, isActionSheetOpen: true, selectedBookmark: action.payload },
            };

        case 'CLOSE_ACTION_SHEET':
            return {
                ...state,
                ui: { ...state.ui, isActionSheetOpen: false },
            };

        case 'SET_LOADING':
            return {
                ...state,
                ui: { ...state.ui, isLoading: action.payload },
            };

        // Toast 操作
        case 'ADD_TOAST':
            return {
                ...state,
                toasts: [
                    ...state.toasts,
                    { ...action.payload, id: `toast-${++toastIdCounter}` },
                ],
            };

        case 'REMOVE_TOAST':
            return {
                ...state,
                toasts: state.toasts.filter((t) => t.id !== action.payload),
            };

        default:
            return state;
    }
}

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
