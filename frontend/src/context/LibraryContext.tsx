import React, { createContext, useContext, useState, useEffect } from 'react';
import { Track } from '../types';

export interface UserPlaylist {
  id: string;
  name: string;
  createdAt: number;
  tracks: Track[];
  isPinned?: boolean;
}

export interface TrackPlayStat {
  count: number;
  lastPlayed: number;
  track: Track;
}

interface LibraryContextType {
  likedSongs: Track[];
  isLiked: (trackId: string) => boolean;
  toggleLike: (track: Track) => void;
  playlists: UserPlaylist[];
  createPlaylist: (name: string) => UserPlaylist;
  createPlaylistWithTracks: (name: string, tracks: Track[]) => UserPlaylist;
  addToPlaylist: (playlistId: string, trackId: Track) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  togglePinPlaylist: (playlistId: string) => void;
  history: Track[];
  addToHistory: (track: Track) => void;
  clearHistory: () => void;
  playStats: Record<string, TrackPlayStat>;
  exportLibraryData: () => string;
  importLibraryData: (jsonStr: string) => boolean;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [likedSongs, setLikedSongs] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('musify_liked_songs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [playlists, setPlaylists] = useState<UserPlaylist[]>(() => {
    try {
      const saved = localStorage.getItem('musify_user_playlists');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [history, setHistory] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('musify_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [playStats, setPlayStats] = useState<Record<string, TrackPlayStat>>(() => {
    try {
      const saved = localStorage.getItem('musify_play_stats');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Save changes to localStorage safely
  useEffect(() => {
    try {
      localStorage.setItem('musify_liked_songs', JSON.stringify(likedSongs));
    } catch {}
  }, [likedSongs]);

  useEffect(() => {
    try {
      localStorage.setItem('musify_user_playlists', JSON.stringify(playlists));
    } catch {}
  }, [playlists]);

  useEffect(() => {
    try {
      localStorage.setItem('musify_history', JSON.stringify(history));
    } catch {}
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem('musify_play_stats', JSON.stringify(playStats));
    } catch {}
  }, [playStats]);

  const isLiked = (trackId: string) => {
    return likedSongs.some((s) => s.id === trackId);
  };

  const toggleLike = (track: Track) => {
    setLikedSongs((prev) => {
      const exists = prev.some((s) => s.id === track.id);
      if (exists) {
        return prev.filter((s) => s.id !== track.id);
      } else {
        return [track, ...prev];
      }
    });
  };

  const createPlaylist = (name: string): UserPlaylist => {
    const newPl: UserPlaylist = {
      id: `custom_${Date.now()}`,
      name,
      createdAt: Date.now(),
      tracks: []
    };
    setPlaylists((prev) => [newPl, ...prev]);
    return newPl;
  };

  const createPlaylistWithTracks = (name: string, tracks: Track[]): UserPlaylist => {
    const newPl: UserPlaylist = {
      id: `custom_${Date.now()}`,
      name,
      createdAt: Date.now(),
      tracks
    };
    setPlaylists((prev) => [newPl, ...prev]);
    return newPl;
  };

  const addToPlaylist = (playlistId: string, track: Track) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          if (pl.tracks.some((t) => t.id === track.id)) return pl;
          return { ...pl, tracks: [...pl.tracks, track] };
        }
        return pl;
      })
    );
  };

  const removeFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          return { ...pl, tracks: pl.tracks.filter((t) => t.id !== trackId) };
        }
        return pl;
      })
    );
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists((prev) => prev.filter((pl) => pl.id !== playlistId));
  };

  const togglePinPlaylist = (playlistId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => (pl.id === playlistId ? { ...pl, isPinned: !pl.isPinned } : pl))
    );
  };

  const addToHistory = (track: Track) => {
    setHistory((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id);
      return [track, ...filtered].slice(0, 50); // Keep last 50
    });

    setPlayStats((prev) => {
      const current = prev[track.id];
      return {
        ...prev,
        [track.id]: {
          count: (current?.count || 0) + 1,
          lastPlayed: Date.now(),
          track
        }
      };
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const exportLibraryData = (): string => {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      likedSongs,
      playlists,
      history,
      playStats
    };
    return JSON.stringify(backup, null, 2);
  };

  const importLibraryData = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.likedSongs)) {
        setLikedSongs(parsed.likedSongs);
      }
      if (Array.isArray(parsed.playlists)) {
        setPlaylists(parsed.playlists);
      }
      if (Array.isArray(parsed.history)) {
        setHistory(parsed.history);
      }
      if (parsed.playStats && typeof parsed.playStats === 'object') {
        setPlayStats(parsed.playStats);
      }
      return true;
    } catch (e) {
      console.error('Failed to import library data:', e);
      return false;
    }
  };

  return (
    <LibraryContext.Provider
      value={{
        likedSongs,
        isLiked,
        toggleLike,
        playlists,
        createPlaylist,
        createPlaylistWithTracks,
        addToPlaylist,
        removeFromPlaylist,
        deletePlaylist,
        togglePinPlaylist,
        history,
        addToHistory,
        clearHistory,
        playStats,
        exportLibraryData,
        importLibraryData
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used within LibraryProvider');
  return context;
};
