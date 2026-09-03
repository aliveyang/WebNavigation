/**
 * 应用全局状态 reducer（纯函数，独立模块以便单测）
 * 从 AppContext.tsx 抽出；状态结构与 Action 类型集中在此定义
 */
import { Bookmark, AppSettings } from '../../types';
import type { ToastMessage } from '../../components/ui';
import { defaultSettings } from '../../constants/defaultSettings';
import { sanitizeSettings } from '../../utils/settingsSanitize';

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

// ============ Reducer ============

let toastIdCounter = 0;

export function appReducer(state: AppState, action: AppAction): AppState {
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

        // 设置操作（落地前统一走白名单校验：云端/本地来源兜底，见 settingsSanitize）
        case 'UPDATE_SETTINGS':
            return { ...state, settings: sanitizeSettings({ ...state.settings, ...action.payload }) };

        case 'SET_SETTINGS':
            return { ...state, settings: sanitizeSettings(action.payload) };

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
                ui: {
                    ...state.ui,
                    isActionSheetOpen: true,
                    selectedBookmark: action.payload,
                },
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

// ============ 初始状态 ============

export const initialState: AppState = {
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
