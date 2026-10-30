import { Track, Album, Artist, Playlist, HomeFeedSection, LyricsData } from '../types';
import { staleWhileRevalidate } from './apiCache';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

// Requirement 3: Use only VITE_STREAM_URL (configured in Netlify env).
// If missing, use same-origin /api proxy.
// For Netlify preview deploys (*.netlify.app excluding production host),
// direct streaming is bypassed in favor of same-origin /api proxy so previews never hit CORS issues.
const configuredStreamUrl = (import.meta as any).env?.VITE_STREAM_URL;
const isProductionHost = typeof window !== 'undefined' && window.location.hostname === 'musify-live.netlify.app';
const isNetlifyPreview = typeof window !== 'undefined' &&
  window.location.hostname.endsWith('.netlify.app') &&
  !isProductionHost;

export const STREAM_BASE = (configuredStreamUrl && !isNetlifyPreview)
  ? configuredStreamUrl.replace(/\/+$/, '')
  : API_BASE;

// In-memory cache for search suggestions
const suggestionCache = new Map<string, string[]>();

// Debounced prefetch queue (Requirement B.1: max 3 in-flight)
const activeResolves = new Set<string>();
const pendingResolves: { videoId: string; quality?: string }[] = [];
const resolvedSet = new Set<string>();
let drainScheduled = false;

function pumpResolveQueue() {
  while (activeResolves.size < 3 && pendingResolves.length > 0) {
    const next = pendingResolves.shift()!;
    if (resolvedSet.has(next.videoId)) continue;
    activeResolves.add(next.videoId);
    resolvedSet.add(next.videoId);

    const base = STREAM_BASE;
    const url = `${base}/resolve/${next.videoId}${next.quality ? `?quality=${encodeURIComponent(next.quality)}` : ''}`;
    fetch(url, { method: 'GET', keepalive: true })
      .finally(() => {
        activeResolves.delete(next.videoId);
        pumpResolveQueue();
      });
  }
}

export const resolveTrack = (videoId: string, quality?: string): void => {
  if (!videoId || resolvedSet.has(videoId)) return;
  if (!pendingResolves.some((item) => item.videoId === videoId)) {
    pendingResolves.push({ videoId, quality });
  }
  if (!drainScheduled) {
    drainScheduled = true;
    setTimeout(() => {
      drainScheduled = false;
      pumpResolveQueue();
    }, 120); // 120ms debounce
  }
};

export const api = {
  // Search with AbortSignal cancellation support
  search: async (query: string, filter?: string, signal?: AbortSignal) => {
    const params = new URLSearchParams({ q: query });
    if (filter) params.set('filter', filter);
    const res = await fetch(`${API_BASE}/search?${params.toString()}`, { signal });
    if (!res.ok) throw new Error('Search failed');
    return res.json() as Promise<{
      songs: Track[];
      albums: any[];
      artists: any[];
      playlists: any[];
    }>;
  },

  // Suggestions with instant memory cache & signal abort
  getSuggestions: async (query: string, signal?: AbortSignal): Promise<string[]> => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    if (suggestionCache.has(normalized)) {
      return suggestionCache.get(normalized)!;
    }
    try {
      const res = await fetch(`${API_BASE}/suggestions?q=${encodeURIComponent(query)}`, { signal });
      if (!res.ok) return [];
      const data = await res.json();
      if (Array.isArray(data)) {
        suggestionCache.set(normalized, data);
      }
      return data;
    } catch {
      return [];
    }
  },

  // Home feed with stale-while-revalidate cache (instant paint from IndexedDB)
  getHome: async (): Promise<HomeFeedSection[]> => {
    return staleWhileRevalidate('home_feed', async () => {
      const res = await fetch(`${API_BASE}/home`);
      if (!res.ok) throw new Error('Failed to load home feed');
      return res.json();
    }, 10 * 60 * 1000); // 10 min
  },

  // Explore with stale-while-revalidate cache
  getExplore: async () => {
    return staleWhileRevalidate('explore_feed', async () => {
      const res = await fetch(`${API_BASE}/explore`);
      if (!res.ok) throw new Error('Failed to load explore feed');
      return res.json();
    }, 10 * 60 * 1000); // 10 min
  },

  // Song details
  getSong: async (id: string): Promise<Track> => {
    return staleWhileRevalidate(`song_${id}`, async () => {
      const res = await fetch(`${API_BASE}/song/${id}`);
      if (!res.ok) throw new Error('Failed to fetch song');
      return res.json();
    }, 30 * 60 * 1000);
  },

  // Radio / Related queue with deduplication against current queue + history
  getRadio: async (id: string, excludeIds?: string[]): Promise<Track[]> => {
    if (!id || id.length !== 11 || id.startsWith('VL') || id.startsWith('RD') || id.startsWith('MPREb')) {
      return [];
    }
    const params = new URLSearchParams();
    if (excludeIds && excludeIds.length > 0) {
      params.set('exclude', excludeIds.slice(0, 50).join(','));
    }
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/radio/${id}${queryString}`);
    if (!res.ok) return [];
    return res.json();
  },

  // Album with stale-while-revalidate cache
  getAlbum: async (id: string): Promise<Album> => {
    return staleWhileRevalidate(`album_${id}`, async () => {
      const res = await fetch(`${API_BASE}/album/${id}`);
      if (!res.ok) throw new Error('Failed to fetch album');
      return res.json();
    }, 30 * 60 * 1000);
  },

  // Artist with stale-while-revalidate cache
  getArtist: async (id: string): Promise<Artist> => {
    return staleWhileRevalidate(`artist_${id}`, async () => {
      const res = await fetch(`${API_BASE}/artist/${id}`);
      if (!res.ok) throw new Error('Failed to fetch artist');
      return res.json();
    }, 30 * 60 * 1000);
  },

  // Playlist with stale-while-revalidate cache
  getPlaylist: async (id: string): Promise<Playlist> => {
    return staleWhileRevalidate(`playlist_${id}`, async () => {
      const res = await fetch(`${API_BASE}/playlist/${id}`);
      if (!res.ok) throw new Error('Failed to fetch playlist');
      return res.json();
    }, 30 * 60 * 1000);
  },

  // Lyrics
  getLyrics: async (track: Track): Promise<LyricsData> => {
    const artistName = track.artists?.[0]?.name || '';
    const params = new URLSearchParams({
      title: track.title,
      artist: artistName
    });
    if (
      track.id &&
      track.id.length === 11 &&
      !track.id.startsWith('VL') &&
      !track.id.startsWith('RD') &&
      !track.id.startsWith('MPREb')
    ) {
      params.set('videoId', track.id);
    }
    if (track.album?.name) params.set('album', track.album.name);
    if (track.duration) params.set('duration', track.duration.toString());

    try {
      const res = await fetch(`${API_BASE}/lyrics?${params.toString()}`);
      if (!res.ok) throw new Error('Lyrics failed');
      return res.json();
    } catch {
      return {
        synced: false,
        lines: [],
        plain: 'No lyrics available for this song.',
        source: 'none'
      };
    }
  },

  // Audio Stream URL (defaults to same-origin STREAM_BASE)
  getStreamUrl: (videoId: string, quality?: string, forceProxy = false): string => {
    const base = forceProxy ? API_BASE : STREAM_BASE;
    const url = `${base}/stream/${videoId}`;
    return quality ? `${url}?quality=${encodeURIComponent(quality)}` : url;
  },

  // Resolve Track (pre-warm stream URL cache without streaming body)
  resolve: (videoId: string, quality?: string): void => {
    resolveTrack(videoId, quality);
  },

  // Prefetch Stream URL
  prefetchStream: (videoId: string, quality?: string): void => {
    resolveTrack(videoId, quality);
  },

  // Backend Wake-up Ping
  warmBackend: (): void => {
    fetch(`${API_BASE}/warm`, { method: 'GET', keepalive: true }).catch(() => {});
  }
};
