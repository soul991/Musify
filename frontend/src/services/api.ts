import { Track, Album, Artist, Playlist, HomeFeedSection, LyricsData } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

export const api = {
  // Search
  search: async (query: string, filter?: string) => {
    const params = new URLSearchParams({ q: query });
    if (filter) params.set('filter', filter);
    const res = await fetch(`${API_BASE}/search?${params.toString()}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json() as Promise<{
      songs: Track[];
      albums: any[];
      artists: any[];
      playlists: any[];
    }>;
  },

  // Suggestions
  getSuggestions: async (query: string): Promise<string[]> => {
    try {
      const res = await fetch(`${API_BASE}/suggestions?q=${encodeURIComponent(query)}`);
      return res.json();
    } catch {
      return [];
    }
  },

  // Home feed
  getHome: async (): Promise<HomeFeedSection[]> => {
    const res = await fetch(`${API_BASE}/home`);
    if (!res.ok) throw new Error('Failed to load home feed');
    return res.json();
  },

  // Explore
  getExplore: async () => {
    const res = await fetch(`${API_BASE}/explore`);
    if (!res.ok) throw new Error('Failed to load explore feed');
    return res.json();
  },

  // Song details
  getSong: async (id: string): Promise<Track> => {
    const res = await fetch(`${API_BASE}/song/${id}`);
    if (!res.ok) throw new Error('Failed to fetch song');
    return res.json();
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

  // Album
  getAlbum: async (id: string): Promise<Album> => {
    const res = await fetch(`${API_BASE}/album/${id}`);
    if (!res.ok) throw new Error('Failed to fetch album');
    return res.json();
  },

  // Artist
  getArtist: async (id: string): Promise<Artist> => {
    const res = await fetch(`${API_BASE}/artist/${id}`);
    if (!res.ok) throw new Error('Failed to fetch artist');
    return res.json();
  },

  // Playlist
  getPlaylist: async (id: string): Promise<Playlist> => {
    const res = await fetch(`${API_BASE}/playlist/${id}`);
    if (!res.ok) throw new Error('Failed to fetch playlist');
    return res.json();
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
