/**
 * In-memory TTL cache with concurrent in-flight promise de-duplication.
 * Prevents redundant upstream calls when multiple concurrent requests ask for the same data.
 */

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class AsyncTtlCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private inFlight = new Map<string, Promise<T>>();
  private maxSize: number;

  constructor(maxSize = 500) {
    this.maxSize = maxSize;
  }

  public get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.data;
  }

  public set(key: string, data: T, ttlMs: number): void {
    this.cleanup();
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs
    });
  }

  public has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
    this.inFlight.clear();
  }

  public size(): number {
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [k, v] of this.cache.entries()) {
      if (now > v.expiresAt) {
        this.cache.delete(k);
      }
    }
    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      } else {
        break;
      }
    }
  }

  /**
   * Fetch with in-flight de-duplication and TTL caching.
   * If a fetch for `key` is already running, concurrent callers will join the SAME promise.
   */
  public async fetchDedupe(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const running = this.inFlight.get(key);
    if (running) {
      return running;
    }

    const promise = (async () => {
      try {
        const result = await fetcher();
        this.set(key, result, ttlMs);
        return result;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }
}

// Global server-side caches
export const musicCache = new AsyncTtlCache<any>(500);

export const TTL = {
  SEARCH: 5 * 60 * 1000,      // 5 min
  SUGGESTIONS: 10 * 60 * 1000, // 10 min
  HOME: 10 * 60 * 1000,        // 10 min
  EXPLORE: 15 * 60 * 1000,     // 15 min
  RADIO: 30 * 60 * 1000,       // 30 min
  DETAILS: 30 * 60 * 1000      // 30 min (album, artist, playlist, song)
};
