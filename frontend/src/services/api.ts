import { Track, Album, Artist, Playlist, HomeFeedSection, LyricsData } from '../types';
import { staleWhileRevalidate } from './apiCache';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

// In production on Netlify, stream audio directly from Catalyst to avoid Netlify function/rewrite overhead.
// VITE_STREAM_URL can explicitly override this origin.
const STREAM_BASE = (import.meta as any).env?.VITE_STREAM_URL ||
  (typeof window !== 'undefined' && (window.location.hostname === 'musify-live.netlify.app' || window.location.hostname.endsWith('.netlify.app'))
    ? 'https://musify-backend-50047147406.development.catalystappsail.in/api'
    : API_BASE);

// In-memory cache for search suggestions
const suggestionCache = new Map<string, string[]>();

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
    }, 15 * 60 * 1000); // 15 min
  },

  // Song details
  getSong: async (id: string): Promise<Track> => {
    return staleWhileRevalidate(`song_${id}`, async () => {
      const res = await fetch(`${API_BASE}/song/${id}`);
      if (!res.ok) throw new Error('Failed to fetch song');
      return res.json();
    }, 30 * 60 * 1000);
  },

  // Radio / Related queue
  getRadio: async (id: string): Promise<Track[]> => {
    return staleWhileRevalidate(`radio_${id}`, async () => {
      const res = await fetch(`${API_BASE}/radio/${id}`);
      if (!res.ok) return [];
      return res.json();
    }, 30 * 60 * 1000);
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
    }, 15 * 60 * 1000);
  },

  // Lyrics
  getLyrics: async (track: Track): Promise<LyricsData> => {
    const artistName = track.artists?.[0]?.name || '';
    const params = new URLSearchParams({
      title: track.title,
      artist: artistName,
      videoId: track.id
    });
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

  // Direct Audio Stream URL (bypasses Netlify proxy when direct origin available)
  getStreamUrl: (videoId: string, quality?: string, forceProxy = false): string => {
    const base = forceProxy ? API_BASE : STREAM_BASE;
    const url = `${base}/stream/${videoId}`;
    return quality ? `${url}?quality=${encodeURIComponent(quality)}` : url;
  },

  // Prefetch Stream URL (resolves and caches upstream stream URL without downloading payload)
  prefetchStream: (videoId: string, quality?: string): void => {
    if (!videoId) return;
    const base = STREAM_BASE;
    const url = `${base}/stream/prefetch/${videoId}${quality ? `?quality=${encodeURIComponent(quality)}` : ''}`;
    fetch(url, { method: 'GET', keepalive: true }).catch(() => {});
  },

  // Backend Wake-up Ping
  warmBackend: (): void => {
    fetch(`${API_BASE}/warm`, { method: 'GET', keepalive: true }).catch(() => {});
  }
};
