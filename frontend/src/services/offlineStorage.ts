/**
 * Offline Audio Storage Service (IndexedDB)
 *
 * Implements Item 5:
 * - Cache audio of liked songs + last 20 played tracks in IndexedDB
 * - Size cap (default 500 MB, user-configurable via settings)
 * - Eviction rule: non-liked tracks evicted first (LRU), then liked songs if still over cap;
 *   and maximum 20 non-liked played tracks kept.
 * - Settings screen storage usage reporting and cache clearance.
 * - Synchronous memory blob URL map for 0ms startup playback without await.
 */

import { Track } from '../types';
import { api } from './api';

export interface OfflineAudioRecord {
  trackId: string;
  blob: Blob;
  mimeType: string;
  size: number;
  title: string;
  artist: string;
  thumbnail?: string;
  duration?: number;
  isLiked: boolean;
  lastPlayedAt: number;
  cachedAt: number;
}

export interface StorageUsage {
  usedBytes: number;
  sizeCapBytes: number;
  trackCount: number;
  formattedUsed: string;
  formattedCap: string;
}

const DB_NAME = 'musify_offline_audio_db';
const DB_VERSION = 1;
const STORE_NAME = 'cached_audio';

export const DEFAULT_SIZE_CAP_MB = 500;
const MAX_RECENT_UNLIKED_TRACKS = 20;

class OfflineAudioStorage {
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private activeDownloads = new Set<string>();
  private memoryBlobUrls = new Map<string, string>();

  constructor() {
    if (typeof window !== 'undefined' && window.indexedDB) {
      this.warmMemoryUrls().catch(() => {});
    }
  }

  private async warmMemoryUrls(): Promise<void> {
    const db = await this.getDB();
    if (!db) return;
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const records: OfflineAudioRecord[] = req.result || [];
        for (const r of records) {
          if (r.blob && !this.memoryBlobUrls.has(r.trackId)) {
            try {
              const url = URL.createObjectURL(r.blob);
              this.memoryBlobUrls.set(r.trackId, url);
            } catch {}
          }
        }
      };
    } catch {}
  }

  private getDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.resolve(null);
    }
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve) => {
        try {
          const req = indexedDB.open(DB_NAME, DB_VERSION);
          req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              const store = db.createObjectStore(STORE_NAME, { keyPath: 'trackId' });
              store.createIndex('lastPlayedAt', 'lastPlayedAt', { unique: false });
              store.createIndex('isLiked', 'isLiked', { unique: false });
              store.createIndex('cachedAt', 'cachedAt', { unique: false });
            }
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
    }
    return this.dbPromise;
  }

  public getCachedBlobUrlSync(trackId: string): string | null {
    if (!trackId) return null;
    return this.memoryBlobUrls.get(trackId) || null;
  }

  public getSizeCapMB(): number {
    if (typeof window === 'undefined') return DEFAULT_SIZE_CAP_MB;
    try {
      const stored = localStorage.getItem('musify_offline_size_cap');
      const val = stored ? Number(stored) : DEFAULT_SIZE_CAP_MB;
      return !isNaN(val) && val > 0 ? val : DEFAULT_SIZE_CAP_MB;
    } catch {
      return DEFAULT_SIZE_CAP_MB;
    }
  }

  public setSizeCapMB(mb: number): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('musify_offline_size_cap', String(mb));
      this.enforceLimits(0).catch(() => {});
    } catch {}
  }

  public getSizeCapBytes(): number {
    return this.getSizeCapMB() * 1024 * 1024;
  }

  public formatBytes(bytes: number): string {
    if (bytes <= 0) return '0.0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1000) {
      return `${mb.toFixed(1)} MB`;
    }
    return `${(mb / 1024).toFixed(2)} GB`;
  }

  public async getStorageUsage(): Promise<StorageUsage> {
    const db = await this.getDB();
    const capBytes = this.getSizeCapBytes();
    if (!db) {
      return {
        usedBytes: 0,
        sizeCapBytes: capBytes,
        trackCount: 0,
        formattedUsed: '0.0 MB',
        formattedCap: this.formatBytes(capBytes)
      };
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const records: OfflineAudioRecord[] = req.result || [];
          let totalBytes = 0;
          for (const r of records) {
            totalBytes += r.size || (r.blob ? r.blob.size : 0);
          }
          resolve({
            usedBytes: totalBytes,
            sizeCapBytes: capBytes,
            trackCount: records.length,
            formattedUsed: this.formatBytes(totalBytes),
            formattedCap: this.formatBytes(capBytes)
          });
        };
        req.onerror = () => {
          resolve({
            usedBytes: 0,
            sizeCapBytes: capBytes,
            trackCount: 0,
            formattedUsed: '0.0 MB',
            formattedCap: this.formatBytes(capBytes)
          });
        };
      } catch {
        resolve({
          usedBytes: 0,
          sizeCapBytes: capBytes,
          trackCount: 0,
          formattedUsed: '0.0 MB',
          formattedCap: this.formatBytes(capBytes)
        });
      }
    });
  }

  public async clearOfflineCache(): Promise<void> {
    const db = await this.getDB();
    for (const url of this.memoryBlobUrls.values()) {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }
    this.memoryBlobUrls.clear();

    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public async getTrackAudio(trackId: string): Promise<OfflineAudioRecord | null> {
    if (!trackId) return null;
    const db = await this.getDB();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(trackId);
        req.onsuccess = () => {
          const record = req.result as OfflineAudioRecord | undefined;
          if (record && record.blob) {
            record.lastPlayedAt = Date.now();
            store.put(record);
            if (!this.memoryBlobUrls.has(record.trackId)) {
              try {
                this.memoryBlobUrls.set(record.trackId, URL.createObjectURL(record.blob));
              } catch {}
            }
            resolve(record);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  public async getTrackAudioBlobUrl(trackId: string): Promise<string | null> {
    const syncUrl = this.getCachedBlobUrlSync(trackId);
    if (syncUrl) return syncUrl;

    try {
      const record = await this.getTrackAudio(trackId);
      if (record && record.blob) {
        let url = this.memoryBlobUrls.get(trackId);
        if (!url) {
          url = URL.createObjectURL(record.blob);
          this.memoryBlobUrls.set(trackId, url);
        }
        return url;
      }
      return null;
    } catch {
      return null;
    }
  }

  public async hasTrackAudio(trackId: string): Promise<boolean> {
    if (!trackId) return false;
    if (this.memoryBlobUrls.has(trackId)) return true;
    const db = await this.getDB();
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.count(IDBKeyRange.only(trackId));
        req.onsuccess = () => resolve((req.result || 0) > 0);
        req.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  private async enforceLimits(incomingBytes = 0, incomingIsLiked = false): Promise<void> {
    const db = await this.getDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          const records: OfflineAudioRecord[] = req.result || [];
          if (records.length === 0) {
            resolve();
            return;
          }

          const capBytes = this.getSizeCapBytes();
          let totalBytes = records.reduce((acc, r) => acc + (r.size || (r.blob ? r.blob.size : 0)), 0);

          const unliked = records
            .filter((r) => !r.isLiked)
            .sort((a, b) => a.lastPlayedAt - b.lastPlayedAt);

          const liked = records
            .filter((r) => r.isLiked)
            .sort((a, b) => a.lastPlayedAt - b.lastPlayedAt);

          // 1. Evict excess non-liked tracks if beyond MAX_RECENT_UNLIKED_TRACKS (20)
          const maxAllowedUnliked = incomingIsLiked ? MAX_RECENT_UNLIKED_TRACKS : MAX_RECENT_UNLIKED_TRACKS - 1;
          while ((unliked.length > MAX_RECENT_UNLIKED_TRACKS || unliked.length > maxAllowedUnliked) && unliked.length > 0) {
            const evict = unliked.shift()!;
            store.delete(evict.trackId);
            const url = this.memoryBlobUrls.get(evict.trackId);
            if (url) {
              try { URL.revokeObjectURL(url); } catch {}
              this.memoryBlobUrls.delete(evict.trackId);
            }
            totalBytes -= evict.size || (evict.blob ? evict.blob.size : 0);
          }

          // 2. Evict until within size cap (unliked first, then liked)
          while (totalBytes + incomingBytes > capBytes && unliked.length > 0) {
            const evict = unliked.shift()!;
            store.delete(evict.trackId);
            const url = this.memoryBlobUrls.get(evict.trackId);
            if (url) {
              try { URL.revokeObjectURL(url); } catch {}
              this.memoryBlobUrls.delete(evict.trackId);
            }
            totalBytes -= evict.size || (evict.blob ? evict.blob.size : 0);
          }

          while (totalBytes + incomingBytes > capBytes && liked.length > 0) {
            const evict = liked.shift()!;
            store.delete(evict.trackId);
            const url = this.memoryBlobUrls.get(evict.trackId);
            if (url) {
              try { URL.revokeObjectURL(url); } catch {}
              this.memoryBlobUrls.delete(evict.trackId);
            }
            totalBytes -= evict.size || (evict.blob ? evict.blob.size : 0);
          }

          resolve();
        };

        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public async cacheTrackAudio(track: Track, isLiked = false, preloadedBlob?: Blob): Promise<boolean> {
    if (!track?.id || track.id.length !== 11) return false;
    if (this.activeDownloads.has(track.id)) return false;

    const db = await this.getDB();
    if (!db) return false;

    const existing = await this.getTrackAudio(track.id);
    if (existing) {
      if (existing.isLiked !== isLiked) {
        existing.isLiked = isLiked || existing.isLiked;
        existing.lastPlayedAt = Date.now();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(existing);
      }
      return true;
    }

    this.activeDownloads.add(track.id);

    try {
      let blob: Blob;
      if (preloadedBlob) {
        blob = preloadedBlob;
      } else {
        const streamUrl = api.getStreamUrl(track.id, 'high');
        const res = await fetch(streamUrl);
        if (!res.ok) {
          this.activeDownloads.delete(track.id);
          return false;
        }
        blob = await res.blob();
      }

      if (!blob || blob.size === 0) {
        this.activeDownloads.delete(track.id);
        return false;
      }

      await this.enforceLimits(blob.size, isLiked);

      const record: OfflineAudioRecord = {
        trackId: track.id,
        blob,
        mimeType: blob.type || 'audio/webm',
        size: blob.size,
        title: track.title,
        artist: track.artists?.[0]?.name || 'Unknown Artist',
        thumbnail: track.thumbnail,
        duration: track.duration,
        isLiked,
        lastPlayedAt: Date.now(),
        cachedAt: Date.now()
      };

      await new Promise<void>((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.put(record);
          req.onsuccess = () => {
            try {
              const url = URL.createObjectURL(blob);
              this.memoryBlobUrls.set(record.trackId, url);
            } catch {}
            resolve();
          };
          req.onerror = () => resolve();
        } catch {
          resolve();
        }
      });

      this.activeDownloads.delete(track.id);
      return true;
    } catch (err) {
      this.activeDownloads.delete(track.id);
      console.warn('[OfflineStorage] Failed to cache track:', track.title, err);
      return false;
    }
  }

  public async setTrackLiked(track: Track, isLiked: boolean): Promise<void> {
    if (!track?.id) return;
    const db = await this.getDB();
    if (!db) return;

    const existing = await this.getTrackAudio(track.id);
    if (existing) {
      existing.isLiked = isLiked;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(existing);
      if (!isLiked) {
        this.enforceLimits(0, false).catch(() => {});
      }
    } else if (isLiked) {
      this.cacheTrackAudio(track, true).catch(() => {});
    }
  }

  public async onTrackPlayed(track: Track): Promise<void> {
    if (!track?.id || track.id.length !== 11) return;
    const existing = await this.getTrackAudio(track.id);
    if (existing) {
      return;
    }

    setTimeout(() => {
      this.cacheTrackAudio(track, false).catch(() => {});
    }, 1500);
  }
}

export const offlineStorage = new OfflineAudioStorage();
