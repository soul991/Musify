/**
 * In-memory + IndexedDB Stale-While-Revalidate API Cache (Phase 4)
 * Provides instant paint for home, explore, album, and artist feeds
 */

const DB_NAME = 'musify_api_cache_db';
const DB_VERSION = 1;
const STORE_NAME = 'api_cache';

const memoryCache = new Map<string, { data: any; timestamp: number }>();

function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function getFromIndexedDB(key: string): Promise<{ data: any; timestamp: number } | null> {
  const db = await openDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function saveToIndexedDB(key: string, data: any): Promise<void> {
  const db = await openDB();
  if (!db) return;

  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ key, data, timestamp: Date.now() });
  } catch {
    // ignore
  }
}

/**
 * Stale-while-revalidate fetch helper
 */
export async function staleWhileRevalidate<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 10 * 60 * 1000 // default 10 minutes fresh
): Promise<T> {
  const now = Date.now();

  // 1. Check in-memory cache
  const inMem = memoryCache.get(key);
  if (inMem) {
    const isStale = now - inMem.timestamp > ttlMs;
    if (isStale) {
      // Revalidate in background
      fetcher()
        .then((fresh) => {
          memoryCache.set(key, { data: fresh, timestamp: Date.now() });
          saveToIndexedDB(key, fresh);
        })
        .catch(() => {});
    }
    return inMem.data as T;
  }

  // 2. Check IndexedDB
  const idbRecord = await getFromIndexedDB(key);
  if (idbRecord) {
    memoryCache.set(key, idbRecord);
    const isStale = now - idbRecord.timestamp > ttlMs;
    if (isStale) {
      // Revalidate in background
      fetcher()
        .then((fresh) => {
          memoryCache.set(key, { data: fresh, timestamp: Date.now() });
          saveToIndexedDB(key, fresh);
        })
        .catch(() => {});
    }
    return idbRecord.data as T;
  }

  // 3. Cache miss: fetch fresh data
  const fresh = await fetcher();
  memoryCache.set(key, { data: fresh, timestamp: Date.now() });
  saveToIndexedDB(key, fresh);
  return fresh;
}
