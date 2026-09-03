import { describe, it, expect } from 'vitest';
import { appReducer, initialState, type AppState } from './appReducer';
import { defaultSettings } from '../../constants/defaultSettings';
import type { Bookmark } from '../../types';

const bookmark = (id: string, overrides: Partial<Bookmark> = {}): Bookmark => ({
  id,
  title: `Bookmark ${id}`,
  url: `https://example.com/${id}`,
  colorFrom: 'from-red-500',
  colorTo: 'to-orange-500',
  ...overrides,
});

const stateWith = (overrides: Partial<AppState>): AppState => ({ ...initialState, ...overrides });

describe('appReducer · bookmarks', () => {
  it('SET_BOOKMARKS replaces the list', () => {
    const next = appReducer(initialState, { type: 'SET_BOOKMARKS', payload: [bookmark('1')] });
    expect(next.bookmarks).toHaveLength(1);
    expect(next.bookmarks[0].id).toBe('1');
  });

  it('ADD_BOOKMARK appends', () => {
    const base = stateWith({ bookmarks: [bookmark('1')] });
    const next = appReducer(base, { type: 'ADD_BOOKMARK', payload: bookmark('2') });
    expect(next.bookmarks.map((b) => b.id)).toEqual(['1', '2']);
  });

  it('UPDATE_BOOKMARK merges by id', () => {
    const base = stateWith({ bookmarks: [bookmark('1'), bookmark('2')] });
    const next = appReducer(base, {
      type: 'UPDATE_BOOKMARK',
      payload: { id: '2', data: { title: 'Renamed' } },
    });
    expect(next.bookmarks[1].title).toBe('Renamed');
    expect(next.bookmarks[0].title).toBe('Bookmark 1');
  });

  it('DELETE_BOOKMARK removes by id', () => {
    const base = stateWith({ bookmarks: [bookmark('1'), bookmark('2')] });
    const next = appReducer(base, { type: 'DELETE_BOOKMARK', payload: '1' });
    expect(next.bookmarks.map((b) => b.id)).toEqual(['2']);
  });

  it('REORDER_BOOKMARKS moves an item', () => {
    const base = stateWith({ bookmarks: [bookmark('1'), bookmark('2'), bookmark('3')] });
    const next = appReducer(base, {
      type: 'REORDER_BOOKMARKS',
      payload: { fromIndex: 0, toIndex: 2 },
    });
    expect(next.bookmarks.map((b) => b.id)).toEqual(['2', '3', '1']);
  });
});

describe('appReducer · settings (B1/A2 收口)', () => {
  it('SET_SETTINGS sanitizes cloud payloads: empty object falls back to defaults', () => {
    const next = appReducer(stateWith({ settings: { ...defaultSettings, language: 'en' } }), {
      type: 'SET_SETTINGS',
      // 模拟另一台设备从未写过设置时推上云端的空对象
      payload: {} as AppState['settings'],
    });
    expect(next.settings).toEqual(defaultSettings);
  });

  it('SET_SETTINGS strips malicious gradient/image payloads', () => {
    const next = appReducer(initialState, {
      type: 'SET_SETTINGS',
      payload: {
        ...defaultSettings,
        globalBgGradient: { from: 'evil', to: 'to-red-500' },
        globalBgImage: 'javascript:alert(1)',
      } as AppState['settings'],
    });
    expect(next.settings.globalBgGradient).toEqual(defaultSettings.globalBgGradient);
    expect(next.settings.globalBgImage).toBeUndefined();
  });

  it('UPDATE_SETTINGS merges and sanitizes partial payloads', () => {
    const next = appReducer(initialState, {
      type: 'UPDATE_SETTINGS',
      payload: { gridCols: 3, language: 'en' },
    });
    expect(next.settings.gridCols).toBe(3);
    expect(next.settings.language).toBe('en');
    expect(next.settings.searchEngine).toBe('google');
  });
});

describe('appReducer · ui', () => {
  it('OPEN_EDIT_MODAL selects a bookmark', () => {
    const next = appReducer(initialState, { type: 'OPEN_EDIT_MODAL', payload: bookmark('1') });
    expect(next.ui.activeModal).toBe('edit');
    expect(next.ui.selectedBookmark?.id).toBe('1');
  });

  it('OPEN_ACTION_SHEET / CLOSE_ACTION_SHEET toggle the sheet', () => {
    const opened = appReducer(initialState, { type: 'OPEN_ACTION_SHEET', payload: bookmark('1') });
    expect(opened.ui.isActionSheetOpen).toBe(true);
    const closed = appReducer(opened, { type: 'CLOSE_ACTION_SHEET' });
    expect(closed.ui.isActionSheetOpen).toBe(false);
  });

  it('SET_LOADING toggles loading', () => {
    const next = appReducer(initialState, { type: 'SET_LOADING', payload: false });
    expect(next.ui.isLoading).toBe(false);
  });
});

describe('appReducer · toasts', () => {
  it('ADD_TOAST assigns incrementing ids and REMOVE_TOAST deletes', () => {
    const added = appReducer(initialState, {
      type: 'ADD_TOAST',
      payload: { message: 'hello', type: 'info' },
    });
    expect(added.toasts).toHaveLength(1);
    const id = added.toasts[0].id;

    const removed = appReducer(added, { type: 'REMOVE_TOAST', payload: id });
    expect(removed.toasts).toHaveLength(0);
  });
});
