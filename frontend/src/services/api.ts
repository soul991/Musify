import { Track, Album, Artist, Playlist, HomeFeedSection, LyricsData } from '../types';
import { staleWhileRevalidate } from './apiCache';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

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

  // Suggestions
  getSuggestions: async (query: string, signal?: AbortSignal): Promise<string[]> => {
    try {
      const res = await fetch(`${API_BASE}/suggestions?q=${encodeURIComponent(query)}`, { signal });
      return res.json();
    } catch {
      return [];
    }
  },

  // Home feed with stale-while-revalidate cache
  getHome: async (): Promise<HomeFeedSection[]> => {
    return staleWhileRevalidate('home_feed', async () => {
      const res = await fetch(`${API_BASE}/home`);
      if (!res.ok) throw new Error('Failed to load home feed');
      return res.json();
    }, 5 * 60 * 1000); // 5 min
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

  // Radio / Related queue
  getRadio: async (id: string): Promise<Track[]> => {
    try {
      const res = await fetch(`${API_BASE}/radio/${id}`);
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
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

  // Audio Stream URL
  getStreamUrl: (videoId: string, quality?: string): string => {
    const url = `${API_BASE}/stream/${videoId}`;
    return quality ? `${url}?quality=${encodeURIComponent(quality)}` : url;
  }
};
