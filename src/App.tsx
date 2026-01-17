import React, { useEffect, useState, useRef } from 'react';
import {
  useApp, useBookmarks, useSettings, useUI, useToasts
} from './store';
import {
  Header, SearchWidget, BookmarkList,
  ActionSheet, BookmarkEditModal, SettingsModal,
  SyncModal, OnboardingGuide,
  ToastContainer, NetworkIndicator, ContextMenu,
  PageSkeleton
} from './components';
import { Bookmark, AppSettings } from './types';
import { STORAGE_KEY, SETTINGS_KEY } from './constants';
import { syncManager } from './syncManager';
import { saveToStorage, loadFromStorage } from './utils';
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

  // Sync Status Subscription
  const [syncStatus, setSyncStatus] = useState(syncManager.getStatus());

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    bookmark: Bookmark | null;
  }>({ isOpen: false, position: { x: 0, y: 0 }, bookmark: null });

  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // 初始状态
    setSyncStatus(syncManager.getStatus());

    // 订阅状态变化
    const unsubscribe = syncManager.onStatusChange((status) => {
      setSyncStatus(status);
    });
    return () => { unsubscribe(); };
  }, []);

  // --- Initial Load ---
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load LocalStorage
        const loadedBookmarks = loadFromStorage<Bookmark[]>(STORAGE_KEY, []);
        const loadedSettings = loadFromStorage<AppSettings>(SETTINGS_KEY, {} as AppSettings);

        // Check Onboarding
        const hasVisited = localStorage.getItem('navhub_has_visited');
        if (!hasVisited && loadedBookmarks.length === 0) {
          setShowOnboarding(true);
        }

        dispatch({ type: 'SET_BOOKMARKS', payload: loadedBookmarks });
        if (loadedSettings && Object.keys(loadedSettings).length > 0) {
          dispatch({ type: 'UPDATE_SETTINGS', payload: loadedSettings });
        }
      } catch (e) {
        console.error("Failed to load data", e);
        showToast('Failed to load local data', 'error');
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    loadData();
  }, [dispatch]);

  // --- Persistence & Auto Sync ---
  // Save Bookmarks
  useEffect(() => {
    if (!ui.isLoading) {
      saveToStorage(STORAGE_KEY, bookmarks);

      // Auto Sync Logic
      if (syncManager.getStatus().enabled && !isSyncingRef.current && isOnlineStatus.isOnline) {
        // Debounce inside logic handled by syncManager or manually?
        // syncManager doesn't have debounce built-in for push, maybe we should rely on syncManager logic
        // The previous app used SyncManager directly.
        // For now, let's just call it. SyncManager might need improvement for debounce/throttle which implies Phase 3.
        syncManager.pushToCloud(bookmarks, settings).catch(err => console.error("Auto sync failed", err));
      }
    }
  }, [bookmarks, ui.isLoading, settings, isOnlineStatus.isOnline]);

  // Save Settings & Apply Global Styles
  useEffect(() => {
    if (!ui.isLoading) {
      saveToStorage(SETTINGS_KEY, settings);

      // Apply Global Background Styles
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
        id: Date.now().toString(),
        createdAt: Date.now(),
        title: 'New Shortcut',
        url: 'https://',
        bgType: 'gradient',
        iconKey: 'home',
        ...data
      } as Bookmark);
      showToast(language === 'zh' ? '已添加' : 'Added', 'success');
    }
    actions.closeModal();
  };


  if (ui.isLoading) return <PageSkeleton />;

  return (
    <div className="min-h-screen text-slate-100 font-sans pb-safe">
      <NetworkIndicator
        language={language}
        showWhenOnline={false}
      />

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10 flex flex-col min-h-screen">
        <Header
          settings={settings}
          onOpenSettings={actions.openSettingsModal}
          onOpenSync={actions.openSyncModal}
          syncStatus={syncStatus}
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
  );
};

export default App;