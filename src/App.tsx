import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  useApp, useBookmarks, useSettings, useUI, useToasts
} from './store';
import {
  Header, SearchWidget, BookmarkList,
  ActionSheet, BookmarkEditModal, SettingsModal,
  SyncModal, OnboardingGuide,
  ToastContainer, NetworkIndicator, ContextMenu,
  PageSkeleton, ConfirmProvider
} from './components';
import { Bookmark, AppSettings } from './types';
import { STORAGE_KEY, SETTINGS_KEY } from './constants';
import { syncManager } from './syncManager';
import { saveToStorage, sanitizeBookmarks } from './utils';
import { useOnline, useIsMobile } from './hooks';

const App = () => {
  const { dispatch, actions } = useApp();
  const { bookmarks } = useBookmarks();
  const { settings, language } = useSettings();
  const ui = useUI();
  const { toasts, dismissToast, showToast } = useToasts();

  const isOnlineStatus = useOnline(); // Rename to avoid conflict if I used isOnline before
  const isMobile = useIsMobile();
  const isSyncingRef = useRef(false);
  // 初始数据加载失败标志：阻断持久化与自动推送，防止空数据覆盖本地/云端（审计 B8）
  const loadFailedRef = useRef(false);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    bookmark: Bookmark | null;
  }>({ isOpen: false, position: { x: 0, y: 0 }, bookmark: null });

  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(false);

  // --- Initial Load ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const rawBookmarks = localStorage.getItem(STORAGE_KEY);
        const rawSettings = localStorage.getItem(SETTINGS_KEY);

        let loadedBookmarks: Bookmark[] = [];
        let loadedSettings: Partial<AppSettings> = {};

        // 显式解析以区分"无数据"与"数据损坏"（loadFromStorage 会吞掉解析错误返回默认值，
        // 损坏数据若被当作空数组，会触发自动推送覆盖云端，审计 B8）
        try {
          if (rawBookmarks !== null) loadedBookmarks = JSON.parse(rawBookmarks);
          if (rawSettings !== null) loadedSettings = JSON.parse(rawSettings);
        } catch {
          loadFailedRef.current = true;
          showToast('Local data is corrupted. Cloud sync paused to protect your data.', 'error', 10000);
        }

        if (!Array.isArray(loadedBookmarks)) {
          loadedBookmarks = [];
        }

        // Check Onboarding
        const hasVisited = localStorage.getItem('navhub_has_visited');
        if (!hasVisited && loadedBookmarks.length === 0) {
          setShowOnboarding(true);
        }

        dispatch({ type: 'SET_BOOKMARKS', payload: sanitizeBookmarks(loadedBookmarks) });
        if (loadedSettings && Object.keys(loadedSettings).length > 0) {
          dispatch({ type: 'UPDATE_SETTINGS', payload: loadedSettings });
        }
      } catch (e) {
        // localStorage 不可用等异常：同样阻断自动推送（审计 B8）
        console.error("Failed to load data", e);
        loadFailedRef.current = true;
        showToast('Failed to load local data. Cloud sync paused to protect your data.', 'error', 10000);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    loadData();
  }, [dispatch, showToast]);

  // --- Persistence & Auto Sync ---
  // localStorage 写防抖（审计 C3）：书签/设置高频变化（如拖拽）合并为 300ms 一次写入，
  // 页面隐藏/关闭时立即 flush 防丢数据
  const pendingSaveRef = useRef<{ bookmarks: Bookmark[]; settings: AppSettings } | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  const scheduleSave = useCallback((bookmarks: Bookmark[], settings: AppSettings) => {
    pendingSaveRef.current = { bookmarks, settings };
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      const pending = pendingSaveRef.current;
      if (!pending) return;
      pendingSaveRef.current = null;
      saveToStorage(STORAGE_KEY, pending.bookmarks);
      saveToStorage(SETTINGS_KEY, pending.settings);
    }, 300);
  }, []);

  useEffect(() => {
    const flush = () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      const pending = pendingSaveRef.current;
      if (pending) {
        pendingSaveRef.current = null;
        saveToStorage(STORAGE_KEY, pending.bookmarks);
        saveToStorage(SETTINGS_KEY, pending.settings);
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
      flush();
    };
  }, []);

  // Save Bookmarks (+ Settings) & Auto Sync
  useEffect(() => {
    if (!ui.isLoading) {
      // 初始加载失败后阻断持久化与自动推送，直到用户显式操作（审计 B8）
      if (loadFailedRef.current) return;

      scheduleSave(bookmarks, settings);

      // Auto Sync Logic (debounced to avoid rate limit / write storms)
      if (syncManager.getStatus().enabled && !isSyncingRef.current && isOnlineStatus.isOnline) {
        syncManager.debouncedPush(bookmarks, settings, 2000);
      }
    }
  }, [bookmarks, ui.isLoading, settings, isOnlineStatus.isOnline, scheduleSave]);

  // Apply Global Styles & Document Language
  useEffect(() => {
    if (!ui.isLoading) {
      // <html lang> 随设置语言更新（审计 D3）
      document.documentElement.lang = settings.language === 'zh' ? 'zh-CN' : 'en';

      // Apply Global Styles（样式应用不受加载失败影响，但持久化阻断，见 B8）
      if (settings.globalBgType === 'gradient' && settings.globalBgGradient) {
        document.body.style.background = '';
        document.body.className = `min-h-screen bg-gradient-to-br ${settings.globalBgGradient.from} ${settings.globalBgGradient.to} fixed inset-0`;
      } else if (settings.globalBgType === 'image' && settings.globalBgImage) {
        document.body.style.backgroundImage = `url(${settings.globalBgImage})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.className = 'min-h-screen fixed inset-0 bg-slate-900';
      } else {
        // Default
        document.body.style.background = '';
        document.body.className = 'min-h-screen bg-slate-900 bg-[radial-gradient(circle_at_50%_0%,#1e293b_0%,#0f172a_70%)] fixed inset-0';
      }
    }
  }, [settings, ui.isLoading]);


  // --- Handlers ---
  const handleReorder = (fromIndex: number, toIndex: number) => {
    dispatch({ type: 'REORDER_BOOKMARKS', payload: { fromIndex, toIndex } });
  };

  const handleContextMenu = (e: React.MouseEvent, bookmark: Bookmark) => {
    e.preventDefault();
    // On mobile, DND logic or Long press handles this. Context menu is mainly for Desktop.
    if (isMobile) return;

    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      bookmark
    });
  };

  const handleCreateOrUpdateBookmark = (data: Partial<Bookmark>) => {
    if (ui.selectedBookmark) {
      actions.updateBookmark(ui.selectedBookmark.id, data);
      showToast(language === 'zh' ? '已更新' : 'Updated', 'success');
    } else {
      actions.addBookmark({
        id: crypto.randomUUID(),
        title: 'New Shortcut',
        url: 'https://',
        bgType: 'gradient',
        iconKey: 'home',
        colorFrom: 'from-blue-400',
        colorTo: 'to-cyan-400',
        ...data
      });
      showToast(language === 'zh' ? '已添加' : 'Added', 'success');
    }
    actions.closeModal();
  };


  if (ui.isLoading) return <PageSkeleton />;

  return (
    <ConfirmProvider language={language}>
    <div className="min-h-screen text-slate-100 font-sans pb-8">
      <NetworkIndicator
        language={language}
        showWhenOnline={false}
      />

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10 flex flex-col min-h-screen">
        <Header
          settings={settings}
        />

        <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full">
          <SearchWidget settings={settings} />

          <BookmarkList
            bookmarks={bookmarks}
            settings={settings}
            onReorder={handleReorder}
            onLongPress={(b) => {
              actions.openActionSheet(b);
            }}
            onContextMenu={handleContextMenu}
          />
        </div>

        {/* Empty State */}
        {bookmarks.length === 0 && (
          <div className="text-center py-10 animate-in fade-in slide-in-from-bottom-5">
            <p className="text-slate-400 mb-6 text-lg">
              {language === 'zh' ? '还没有书签，添加一个吧！' : 'No bookmarks yet. Add one!'}
            </p>
            <button
              onClick={() => actions.openEditModal()}
              className="px-8 py-3 bg-blue-600 rounded-full font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-500 hover:shadow-blue-500/50 transition-all active:scale-95"
            >
              + {language === 'zh' ? '添加快捷方式' : 'Add Shortcut'}
            </button>
          </div>
        )}
      </div>

      {/* Floating Add Button removed for minimalist mode */}
      {/* Modals & Overlays */}
      <SettingsModal
        isOpen={ui.activeModal === 'settings'}
        onClose={actions.closeModal}
        appSettings={settings}
        onUpdateAppSettings={actions.updateSettings}
      />

      <BookmarkEditModal
        isOpen={ui.activeModal === 'edit'}
        onClose={actions.closeModal}
        initialData={ui.selectedBookmark || undefined}
        onSave={handleCreateOrUpdateBookmark}
        appSettings={settings}
      />

      <SyncModal
        isOpen={ui.activeModal === 'sync'}
        onClose={actions.closeModal}
        onSyncComplete={(b, s) => {
          dispatch({ type: 'SET_BOOKMARKS', payload: b });
          dispatch({ type: 'SET_SETTINGS', payload: s });
          showToast(language === 'zh' ? '同步成功' : 'Sync successful', 'success');
        }}
        isSyncingRef={isSyncingRef}
        language={language}
      />

      <ActionSheet
        isOpen={ui.isActionSheetOpen}
        onClose={actions.closeActionSheet}
        onEdit={() => actions.openEditModal(ui.selectedBookmark!)}
        onDelete={() => {
          if (ui.selectedBookmark) {
            actions.deleteBookmark(ui.selectedBookmark.id);
            showToast(language === 'zh' ? '已删除' : 'Deleted', 'info');
          }
        }}
        onAdd={() => actions.openEditModal()}
        onOpenSettings={actions.openSettingsModal}
        onOpenSync={actions.openSyncModal}
        title={ui.selectedBookmark?.title || ''}
        language={language}
      />

      {contextMenu.isOpen && contextMenu.bookmark && (
        <ContextMenu
          bookmark={contextMenu.bookmark}
          position={contextMenu.position}
          onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
          onEdit={() => actions.openEditModal(contextMenu.bookmark!)}
          onDelete={() => {
            actions.deleteBookmark(contextMenu.bookmark!.id);
            showToast(language === 'zh' ? '已删除' : 'Deleted', 'info');
          }}
          language={language}
        />
      )}

      <OnboardingGuide
        isOpen={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          localStorage.setItem('navhub_has_visited', 'true');
        }}
        language={language}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
    </ConfirmProvider>
  );
};

export default App;