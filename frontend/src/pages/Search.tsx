import React, { useState, useEffect, useRef } from 'react';
import {
  Search as SearchIcon,
  X,
  Clock,
  ArrowUpLeft,
  Globe,
  Library as LibraryIcon,
  TrendingUp,
  Trash2,
  Mic,
  ArrowLeft,
  User,
  Play
} from 'lucide-react';
import { api } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { Track } from '../types';
import { ChipsRow } from '../components/views/ChipsRow';
import { TrackRow } from '../components/views/TrackRow';
import { TrackListSkeleton, EmptyState } from '../components/common/SkeletonLoader';
import { VirtualList } from '../components/common/VirtualList';

interface SearchProps {
  onBack?: () => void;
  onSelectAlbum?: (id: string) => void;
  onSelectArtist?: (id: string) => void;
  onSelectPlaylist?: (id: string) => void;
}

type SearchFilterType = 'all' | 'songs' | 'albums' | 'artists' | 'playlists';

export const Search: React.FC<SearchProps> = ({
  onBack,
  onSelectAlbum,
  onSelectArtist,
  onSelectPlaylist
}) => {
  const { playTrack } = usePlayer();
  const { likedSongs } = useLibrary();

  const [query, setQuery] = useState('');
  const [searchSource, setSearchSource] = useState<'online' | 'local'>('online');
  const [activeFilter, setActiveFilter] = useState<SearchFilterType>('all');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [results, setResults] = useState<{
    songs: Track[];
    albums: any[];
    artists: any[];
    playlists: any[];
  } | null>(null);

  // Persistent Search History stored in localStorage
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('musify_search_history');
      return saved ? JSON.parse(saved) : ['Taylor Swift', 'Dua Lipa', 'The Weeknd', 'Coldplay'];
    } catch {
      return [];
    }
  });

  const debounceRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const suggestionsAbortRef = useRef<AbortController | null>(null);

  // Save search history
  useEffect(() => {
    localStorage.setItem('musify_search_history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  const addSearchHistory = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setSearchHistory((prev) => [trimmed, ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 15));
  };

  const removeSearchHistory = (q: string) => {
    setSearchHistory((prev) => prev.filter((item) => item !== q));
  };

  const clearAllHistory = () => {
    setSearchHistory([]);
  };

  // Debounced auto-suggestions with AbortController
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      if (suggestionsAbortRef.current) {
        suggestionsAbortRef.current.abort();
      }
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (suggestionsAbortRef.current) {
        suggestionsAbortRef.current.abort();
      }
      const controller = new AbortController();
      suggestionsAbortRef.current = controller;

      api.getSuggestions(trimmed, controller.signal)
        .then((suggs) => {
          setSuggestions(suggs.slice(0, 6));
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            setSuggestions([]);
          }
        });
    }, 150);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Execute Search with 200ms debounce & AbortController to cancel stale requests
  const executeSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortRef.current = controller;

    addSearchHistory(trimmed);
    setSuggestions([]);
    setIsFocused(false);
    setLoading(true);

    if (searchSource === 'local') {
      // Local Library Search
      const lower = trimmed.toLowerCase();
      const matchedSongs = likedSongs.filter(
        (s) =>
          s.title.toLowerCase().includes(lower) ||
          s.artists.some((a) => a.name.toLowerCase().includes(lower))
      );
      setResults({
        songs: matchedSongs,
        albums: [],
        artists: [],
        playlists: []
      });
      setLoading(false);
      return;
    }

    // Online YouTube Music Search
    api.search(trimmed, undefined, controller.signal)
      .then((data) => {
        setResults(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setLoading(false);
        }
      });
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setQuery(transcript);
          executeSearch(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeSearch(query);
      inputRef.current?.blur();
    }
  };

  const filterChips: { id: SearchFilterType; label: string; count?: number }[] = [
    { id: 'all', label: 'All' },
    { id: 'songs', label: 'Songs', count: results?.songs?.length },
    { id: 'albums', label: 'Albums', count: results?.albums?.length },
    { id: 'artists', label: 'Artists', count: results?.artists?.length },
    { id: 'playlists', label: 'Playlists', count: results?.playlists?.length }
  ];

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    if (target.src.includes('maxresdefault.jpg')) {
      target.src = target.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
    } else if (!target.src.endsWith('/icons/musify-icon.svg')) {
      target.src = '/icons/musify-icon.svg';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 pt-safe pb-56 text-white no-scrollbar max-w-4xl mx-auto w-full">
      {/* Jetpack Compose Pill SearchBar (56dp height, glass effect, source toggle) */}
      <div className="sticky top-0 z-30 pt-2 pb-4 bg-[var(--bg-primary)]/80 backdrop-blur-xl">
        <div className="relative flex items-center h-14 rounded-full bg-white/[0.08] hover:bg-white/[0.12] focus-within:bg-white/[0.14] border border-white/10 shadow-lg px-4 transition-all duration-200">
          {onBack ? (
            <button
              onClick={onBack}
              className="w-9 h-9 -ml-1 mr-2 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 text-white/80 hover:text-white transition-all shrink-0"
              title="Go back"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <SearchIcon size={20} className="text-white/50 shrink-0 mr-3" />
          )}

          <input
            ref={inputRef}
            type="text"
            value={query}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => { const val = e.target.value; setQuery(val); if (!val.trim()) { setSuggestions([]); setResults(null); } }}
            onKeyDown={handleKeyDown}
            placeholder={
              searchSource === 'online'
                ? 'Search songs, albums, artists...'
                : 'Search your saved library...'
            }
            className="w-full h-full bg-transparent text-white placeholder-white/40 text-base font-medium focus:outline-none"
          />

          <div className="flex items-center gap-1 shrink-0 ml-2">
            {/* Voice / Audio Recognition Button */}
            <button
              onClick={handleVoiceSearch}
              title={isListening ? 'Listening...' : 'Voice Search'}
              aria-label={isListening ? 'Listening...' : 'Voice Search'}
              className={`p-2 rounded-full transition-all ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.6)]'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              <Mic size={16} />
            </button>

            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setSuggestions([]);
                  setResults(null);
                  inputRef.current?.focus();
                }}
                className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                title="Clear query"
                aria-label="Clear query"
              >
                <X size={16} />
              </button>
            )}

            {/* Source Switcher: Online YouTube Music vs Local Library */}
            <button
              onClick={() => {
                const next = searchSource === 'online' ? 'local' : 'online';
                setSearchSource(next);
                if (query.trim()) executeSearch(query);
              }}
              title={searchSource === 'online' ? 'Source: YouTube Music (Online)' : 'Source: Library (Local)'}
              className={`p-2 rounded-full border transition-all flex items-center gap-1.5 text-xs font-bold ${
                searchSource === 'online'
                  ? 'bg-[var(--accent-color)]/20 text-[var(--accent-color)] border-[var(--accent-color)]/30'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}
            >
              {searchSource === 'online' ? <Globe size={15} /> : <LibraryIcon size={15} />}
              <span className="hidden sm:inline">
                {searchSource === 'online' ? 'Online' : 'Library'}
              </span>
            </button>
          </div>
        </div>

        {/* Live Filter Chips Row */}
        {results && (
          <div className="mt-3">
            <ChipsRow
              chips={filterChips}
              activeId={activeFilter}
              onSelect={(id) => setActiveFilter(id)}
            />
          </div>
        )}
      </div>

      {/* Suggestion Dropdown or Recents View when focused / idle */}
      {(!results || isFocused) && query.trim() !== '' && suggestions.length > 0 && (
        <div className="mb-6 rounded-3xl bg-white/[0.06] border border-white/10 p-2 shadow-2xl backdrop-blur-xl flex flex-col gap-0.5">
          <div className="px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/40">
            Suggestions
          </div>
          {suggestions.map((sug, i) => (
            <div
              key={i}
              onClick={() => {
                setQuery(sug);
                executeSearch(sug);
              }}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl hover:bg-white/10 cursor-pointer text-sm font-medium text-white/90 group transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <SearchIcon size={15} className="text-white/40 group-hover:text-white" />
                <span className="truncate">{sug}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setQuery(sug);
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/10"
                title="Fill in textfield"
              >
                <ArrowUpLeft size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recent Searches (Search History) with Material 3 Expressive grouped list items */}
      {!results && !loading && (
        <div className="flex flex-col gap-6 mt-2">
          {searchHistory.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-[var(--accent-color)]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white/80">
                    Search History
                  </h3>
                </div>
                <button
                  onClick={clearAllHistory}
                  className="text-xs text-white/40 hover:text-rose-400 flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Clear all</span>
                </button>
              </div>

              {/* Grouped connected shapes */}
              <div className="flex flex-col gap-[2px]">
                {searchHistory.map((item, index) => {
                  const isSingle = searchHistory.length === 1;
                  const isFirst = index === 0;
                  const isLast = index === searchHistory.length - 1;

                  const cornerClass = isSingle
                    ? 'rounded-2xl'
                    : isFirst
                    ? 'rounded-t-2xl rounded-b-[4px]'
                    : isLast
                    ? 'rounded-t-[4px] rounded-b-2xl'
                    : 'rounded-[4px]';

                  return (
                    <div
                      key={item}
                      onClick={() => {
                        setQuery(item);
                        executeSearch(item);
                      }}
                      className={`flex items-center justify-between px-4 py-3 bg-white/[0.05] hover:bg-white/[0.09] cursor-pointer transition-colors group select-none ${cornerClass}`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Clock size={15} className="text-white/40 group-hover:text-white/80" />
                        <span className="text-sm font-semibold text-white/90 truncate">
                          {item}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuery(item);
                            inputRef.current?.focus();
                          }}
                          className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10"
                          title="Fill in search field"
                          aria-label="Fill in search field"
                        >
                          <ArrowUpLeft size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSearchHistory(item);
                          }}
                          className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-white/10"
                          title="Delete from history"
                          aria-label="Delete from history"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trending Suggestions / Genre Shortcuts */}
          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <TrendingUp size={16} className="text-[var(--accent-color)]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/80">
                Trending Searches
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                'Top Global 50',
                'New Music Friday',
                'Chill Lofi Beats',
                'Workout Motivation',
                'Acoustic Pop',
                'EDM Festival Hits',
                'Synthwave 80s'
              ].map((trend) => (
                <button
                  key={trend}
                  onClick={() => {
                    setQuery(trend);
                    executeSearch(trend);
                  }}
                  className="px-3.5 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/5 text-xs font-semibold text-white/80 hover:text-white transition-all active:scale-95"
                >
                  {trend}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeleton shimmer (no spinner) */}
      {loading && (
        <div className="py-6">
          <TrackListSkeleton count={8} />
        </div>
      )}

      {/* Results Rendering */}
      {results && !loading && (
        <div className="flex flex-col gap-8 mt-2">
          {/* Top Result Feature Card if present and filter is 'all' */}
          {activeFilter === 'all' && (results.artists[0] || results.songs[0]) && (
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-[var(--accent-color)] mb-3 block">
                Top Result
              </span>
              {results.artists[0] ? (
                <div
                  onClick={() => onSelectArtist?.(results.artists[0].id)}
                  className="p-5 rounded-3xl bg-white/[0.07] hover:bg-white/[0.11] border border-white/15 cursor-pointer flex items-center justify-between shadow-xl transition-all group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={results.artists[0].thumbnail}
                      alt={results.artists[0].name}
                      className="w-16 h-16 rounded-full object-cover shadow-lg border border-white/10 group-hover:scale-105 transition-transform"
                      onError={handleImageError}
                    />
                    <div className="min-w-0">
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-extrabold uppercase text-white/60 tracking-wider">
                        Artist
                      </span>
                      <h4 className="text-lg font-black text-white truncate mt-1">
                        {results.artists[0].name}
                      </h4>
                      <p className="text-xs text-white/50">
                        {results.artists[0].subscribers || 'Verified Artist'}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-full bg-white/10 text-white group-hover:bg-[var(--accent-color)] transition-colors">
                    <User size={20} />
                  </div>
                </div>
              ) : results.songs[0] ? (
                <div
                  onClick={() => playTrack(results.songs[0], results.songs)}
                  className="p-5 rounded-3xl bg-white/[0.07] hover:bg-white/[0.11] border border-white/15 cursor-pointer flex items-center justify-between shadow-xl transition-all group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={results.songs[0].thumbnail}
                      alt={results.songs[0].title}
                      className="w-16 h-16 rounded-2xl object-cover shadow-lg border border-white/10 group-hover:scale-105 transition-transform"
                      onError={handleImageError}
                    />
                    <div className="min-w-0">
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-extrabold uppercase text-white/60 tracking-wider">
                        Song
                      </span>
                      <h4 className="text-lg font-black text-white truncate mt-1">
                        {results.songs[0].title}
                      </h4>
                      <p className="text-xs text-white/50">
                        {results.songs[0].artists.map((a) => a.name).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[var(--accent-color)] text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <Play size={20} className="fill-white ml-0.5" />
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Songs List */}
          {(activeFilter === 'all' || activeFilter === 'songs') && results.songs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-lg font-black tracking-tight text-white/90">Songs</h3>
                <span className="text-xs font-semibold text-white/40">
                  {results.songs.length} tracks
                </span>
              </div>
              {results.songs.length > 20 ? (
                <VirtualList<Track>
                  items={results.songs}
                  itemHeight={64}
                  renderItem={(song, idx) => (
                    <TrackRow
                      key={song.id}
                      track={song}
                      index={idx}
                      playlistContext={results.songs}
                      showIndex={false}
                      showThumbnail={true}
                    />
                  )}
                  keyExtractor={(song) => song.id}
                  className="h-[520px]"
                />
              ) : (
                <div className="flex flex-col gap-1.5">
                  {results.songs.map((song, idx) => (
                    <TrackRow
                      key={song.id}
                      track={song}
                      index={idx}
                      playlistContext={results.songs}
                      showIndex={false}
                      showThumbnail={true}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Albums Shelf */}
          {(activeFilter === 'all' || activeFilter === 'albums') && results.albums.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-lg font-black tracking-tight text-white/90">Albums</h3>
                <span className="text-xs font-semibold text-white/40">
                  {results.albums.length} releases
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {results.albums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => onSelectAlbum?.(album.id)}
                    className="p-3.5 rounded-3xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/5 cursor-pointer flex flex-col gap-3 group transition-all"
                  >
                    <div className="aspect-square rounded-2xl overflow-hidden bg-white/10 shadow-lg border border-white/5">
                      <img
                        src={album.thumbnail}
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={handleImageError}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white/90 truncate group-hover:text-[var(--accent-color)]">
                        {album.title}
                      </h4>
                      <p className="text-xs text-white/50 truncate mt-0.5">
                        {album.artists?.map((a: any) => a.name).join(', ') || album.year || 'Album'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Artists Shelf */}
          {(activeFilter === 'all' || activeFilter === 'artists') && results.artists.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-lg font-black tracking-tight text-white/90">Artists</h3>
                <span className="text-xs font-semibold text-white/40">
                  {results.artists.length} artists
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {results.artists.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() => onSelectArtist?.(artist.id)}
                    className="p-4 rounded-3xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/5 cursor-pointer flex flex-col items-center text-center gap-3 group transition-all"
                  >
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-white/10 shadow-xl border border-white/10">
                      <img
                        src={artist.thumbnail}
                        alt={artist.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={handleImageError}
                      />
                    </div>
                    <div className="w-full">
                      <h4 className="text-sm font-bold text-white/90 truncate group-hover:text-[var(--accent-color)]">
                        {artist.name}
                      </h4>
                      <p className="text-xs text-white/45 truncate mt-0.5">
                        {artist.subscribers || 'Artist'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Playlists Shelf */}
          {(activeFilter === 'all' || activeFilter === 'playlists') && results.playlists.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-lg font-black tracking-tight text-white/90">Playlists</h3>
                <span className="text-xs font-semibold text-white/40">
                  {results.playlists.length} playlists
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {results.playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={() => onSelectPlaylist?.(playlist.id)}
                    className="p-3.5 rounded-3xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/5 cursor-pointer flex flex-col gap-3 group transition-all"
                  >
                    <div className="aspect-square rounded-2xl overflow-hidden bg-white/10 shadow-lg border border-white/5">
                      <img
                        src={playlist.thumbnail}
                        alt={playlist.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white/90 truncate group-hover:text-[var(--accent-color)]">
                        {playlist.title}
                      </h4>
                      <p className="text-xs text-white/50 truncate mt-0.5">
                        {playlist.author || `${playlist.itemCount || 0} tracks`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty Results Placeholder with Animated Icon */}
          {results.songs.length === 0 &&
            results.albums.length === 0 &&
            results.artists.length === 0 &&
            results.playlists.length === 0 && (
              <EmptyState
                icon="search"
                title="No results found"
                description="Try different keywords or switch between Online and Library search."
              />
            )}
        </div>
      )}
    </div>
  );
};
