import { describe, it, expect, beforeEach, vi } from 'vitest';

// stub 浏览器全局（syncManager 直接访问 localStorage / fetch）
const store = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
});

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// 动态导入，确保 stub 先于模块初始化生效
const { syncManager } = await import('./syncManager');

const jsonResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  json: async () => body,
});

beforeEach(() => {
  store.clear();
  mockFetch.mockReset();
  mockFetch.mockImplementation(async () => jsonResponse({ success: true, lastModified: Date.now() }));
  // 重置单例状态
  syncManager.disableSync();
});

describe('syncManager · enableSync', () => {
  it('rejects PINs shorter than 8 characters (A1)', async () => {
    await expect(syncManager.enableSync('short')).rejects.toThrow(/8 characters/);
  });

  it('persists the derived key (64-hex), not the plain PIN', async () => {
    await syncManager.enableSync('test-pin-12345');
    const stored = localStorage.getItem('navhub_sync_pin_hash');
    expect(stored).toMatch(/^[a-f0-9]{64}$/);
    expect(stored).not.toContain('test-pin');
  });

  it('migrates legacy accounts: POST /api/sync/migrate with old+new keys (A1)', async () => {
    mockFetch.mockImplementation(async (url: string) =>
      jsonResponse(url.includes('/api/sync/migrate') ? { migrated: false } : { success: true, lastModified: 1 })
    );

    await syncManager.enableSync('test-pin-12345');

    const migrateCall = mockFetch.mock.calls.find(([url]: string[]) =>
      url.includes('/api/sync/migrate')
    );
    expect(migrateCall).toBeDefined();
    const body = JSON.parse(migrateCall![1].body);
    expect(body.oldPin).toMatch(/^[a-f0-9]{64}$/);
    expect(body.newPin).toMatch(/^[a-f0-9]{64}$/);
    expect(body.oldPin).not.toBe(body.newPin);
  });

  it('does not fail enable when the migrate call fails', async () => {
    mockFetch.mockRejectedValue(new Error('network down'));
    await expect(syncManager.enableSync('test-pin-12345')).resolves.toBeUndefined();
    expect(syncManager.getStatus().enabled).toBe(true);
  });
});

describe('syncManager · pullFromCloud (A1: credential via POST body)', () => {
  it('POSTs the credential instead of putting it in the URL', async () => {
    await syncManager.enableSync('test-pin-12345');
    mockFetch.mockClear();
    mockFetch.mockImplementation(async () =>
      jsonResponse({ bookmarks: null, settings: null, lastModified: null })
    );

    await syncManager.pullFromCloud();

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/sync/get');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body).pin).toMatch(/^[a-f0-9]{64}$/);
    expect(url).not.toContain('pin=');
  });

  it('stores lastModified from the cloud payload', async () => {
    await syncManager.enableSync('test-pin-12345');
    mockFetch.mockImplementation(async () =>
      jsonResponse({ bookmarks: [], settings: {}, lastModified: 12345 })
    );

    await syncManager.pullFromCloud();
    expect(localStorage.getItem('navhub_last_modified')).toBe('12345');
  });

  it('throws when sync is not enabled', async () => {
    await expect(syncManager.pullFromCloud()).rejects.toThrow('Sync not enabled');
  });
});

describe('syncManager · pushToCloud (P2-2 fingerprint short-circuit)', () => {
  const data = [
    { id: '1', title: 'a', url: 'https://a.com', colorFrom: 'from-red-500', colorTo: 'to-orange-500' },
  ];
  const settings = { gridCols: 4, language: 'zh' as const };

  beforeEach(async () => {
    await syncManager.enableSync('test-pin-12345');
    mockFetch.mockClear();
    // 单例的指纹跨测试残留：先用哨兵数据重置，保证每个测试从"未同步"状态开始
    await syncManager.markSynced([], {});
  });

  it('pushes changed data', async () => {
    await syncManager.pushToCloud(data, settings);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('skips identical data (echo-push guard, B6①)', async () => {
    await syncManager.pushToCloud(data, settings);
    await syncManager.pushToCloud(data, settings);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('pushes again after data changes', async () => {
    await syncManager.pushToCloud(data, settings);
    await syncManager.pushToCloud([{ ...data[0], title: 'b' }], settings);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('skips data marked as synced via markSynced (pulled data, B6①)', async () => {
    const pulled = [
      { id: '2', title: 'from cloud', url: 'https://c.com', colorFrom: '', colorTo: '' },
    ];
    await syncManager.markSynced(pulled, settings);
    await syncManager.pushToCloud(pulled, settings);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('syncManager · debouncedPush (B6②)', () => {
  it('fires after the delay with changed data', async () => {
    await syncManager.enableSync('test-pin-12345');
    mockFetch.mockClear();
    await syncManager.markSynced([], {});

    syncManager.debouncedPush(
      [{ id: '9', title: 'z', url: 'https://z.com', colorFrom: '', colorTo: '' }],
      {},
      30
    );
    await new Promise((r) => setTimeout(r, 100));
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
