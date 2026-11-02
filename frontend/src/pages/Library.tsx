import React, { useState } from 'react';
import {
  Heart,
  Plus,
  ListMusic,
  Clock,
  Trash2,
  Play,
  Pin,
  Download,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useLibrary, UserPlaylist } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { Track } from '../types';
import { ChipsRow } from '../components/views/ChipsRow';
import { AutoPlaylistButton } from '../components/views/AutoPlaylistButton';
import { SortHeader, SortOption } from '../components/views/SortHeader';
import { TrackRow } from '../components/views/TrackRow';
import { SpotifyImportModal } from '../components/views/SpotifyImportModal';
import { AiPlaylistModal } from '../components/views/AiPlaylistModal';
import { fisherYatesShuffle } from '../utils/shuffle';
import { motion, AnimatePresence } from 'framer-motion';
import { VirtualList } from '../components/common/VirtualList';

interface LibraryProps {
  onSelectPlaylistDetails?: (playlist: UserPlaylist) => void;
  _onSelectAlbum?: (id: string) => void;
  _onSelectArtist?: (id: string) => void;
}

type LibraryTab = 'all' | 'playlists' | 'songs' | 'albums' | 'artists' | 'offline';
type SortKey = 'date' | 'name' | 'count';

export const Library: React.FC<LibraryProps> = ({
  onSelectPlaylistDetails
}) => {
  const {
    likedSongs,
    playlists,
    history,
    createPlaylist,
    deletePlaylist,
    togglePinPlaylist,
    clearHistory
  } = useLibrary();

  const { playTrack, currentTrack } = usePlayer();

  const [activeTab, setActiveTab] = useState<LibraryTab>('all');
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDescending, setSortDescending] = useState<boolean>(true);

  // FAB Modal & Dialog States
  const [showFabModal, setShowFabModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSpotifyModal, setShowSpotifyModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  // Top Chips Tabs
  const libraryChips: { id: LibraryTab; label: string; count?: number }[] = [
    { id: 'all', label: 'All' },
    { id: 'playlists', label: 'Playlists', count: playlists.length },
    { id: 'songs', label: 'Favorites', count: likedSongs.length },
    { id: 'offline', label: 'Offline / Cache' },
    { id: 'albums', label: 'Albums' },
    { id: 'artists', label: 'Artists' }
  ];

  // Sort Options
  const sortOptions: SortOption<SortKey>[] = [
    { id: 'date', label: 'Recently Added' },
    { id: 'name', label: 'Alphabetical (Name)' },
    { id: 'count', label: 'Song Count' }
  ];

  // Sorting Playlists
  const sortedPlaylists = [...playlists].sort((a, b) => {
    let comp = 0;
    if (sortKey === 'date') comp = b.createdAt - a.createdAt;
    else if (sortKey === 'name') comp = a.name.localeCompare(b.name);
    else if (sortKey === 'count') comp = b.tracks.length - a.tracks.length;
    return sortDescending ? comp : -comp;
  });

  const pinnedPlaylists = sortedPlaylists.filter((p) => p.isPinned);
  const unpinnedPlaylists = sortedPlaylists.filter((p) => !p.isPinned);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      const pl = createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowCreateModal(false);
      onSelectPlaylistDetails?.(pl);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    if (target.src.includes('maxresdefault.jpg')) {
      target.src = target.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
    } else if (!target.src.endsWith('/icons/musify-icon.svg')) {
      target.src = '/icons/musify-icon.svg';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 pb-56 text-white no-scrollbar max-w-5xl mx-auto w-full relative">
      {/* Top Filter Chips Row */}
      <div className="mb-4">
        <ChipsRow
          chips={libraryChips}
          activeId={activeTab}
          onSelect={(id) => setActiveTab(id)}
        />
      </div>

      {/* Sort and View Layout Header */}
      <div className="mb-4">
        <SortHeader
          sortOptions={sortOptions}
          activeSort={sortKey}
          onSortChange={(k) => setSortKey(k)}
          sortDescending={sortDescending}
          onSortDescendingChange={(d) => setSortDescending(d)}
          itemCountText={`${playlists.length} playlists • ${likedSongs.length} favorites`}
          viewType={viewType}
          onViewTypeChange={(vt) => setViewType(vt)}
        />
      </div>

      {/* Quick Auto-Playlists 2-Column Grid (Echo Music's AutoPlaylistButton grid) */}
      {(activeTab === 'all' || activeTab === 'offline') && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 mb-8">
          <AutoPlaylistButton
            title="Liked Songs"
            subtitle={`${likedSongs.length} tracks`}
            icon={<Heart size={20} className="fill-rose-500 text-rose-500" />}
            iconColor="#F43F5E"
            onClick={() => setActiveTab('songs')}
          />

          <AutoPlaylistButton
            title="Offline Cache"
            subtitle="Local media store"
            icon={<Download size={20} />}
            iconColor="#10B981"
            onClick={() => {
              if (likedSongs.length > 0) playTrack(likedSongs[0], likedSongs);
            }}
          />

          <AutoPlaylistButton
            title="My Top 50"
            subtitle="Most played"
            icon={<TrendingUp size={20} />}
            iconColor="#3B82F6"
            onClick={() => {
              if (history.length > 0) playTrack(history[0], history);
            }}
          />

          <AutoPlaylistButton
            title="Taste Mix"
            subtitle="AI algorithmic queue"
            icon={<Sparkles size={20} />}
            iconColor="#A855F7"
            onClick={() => {
              if (likedSongs.length > 0) {
                const shuffled = fisherYatesShuffle(likedSongs);
                playTrack(shuffled[0], shuffled);
              }
            }}
          />
        </div>
      )}

      {/* Pinned playlists Row (Echo Music Pinned Feature) */}
      {(activeTab === 'all' || activeTab === 'playlists') && pinnedPlaylists.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Pin size={15} className="text-[var(--accent-color)] fill-[var(--accent-color)]" />
            <h2 className="text-sm font-bold text-white/80">
              Pinned playlists
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {pinnedPlaylists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => onSelectPlaylistDetails?.(pl)}
                className="p-4 rounded-3xl bg-white/[0.08] hover:bg-white/[0.13] border border-white/15 cursor-pointer flex flex-col gap-3 group transition-colors shadow-lg relative"
              >
                <div className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/40 backdrop-blur-md text-[var(--accent-color)]">
                  <Pin size={12} className="fill-current" />
                </div>

                <div className="aspect-square rounded-2xl bg-[var(--bg-card)] border border-white/10 flex items-center justify-center shadow-md overflow-hidden transition-transform">
                  {Boolean(pl.tracks[0]?.thumbnail) ? (
                    <img
                      src={pl.tracks[0].thumbnail}
                      alt={pl.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <ListMusic size={40} className="text-white/40" />
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm text-white/95 truncate group-hover:text-[var(--accent-color)]">
                    {pl.name}
                  </h3>
                  <p className="text-xs text-white/45 mt-0.5">{pl.tracks.length} tracks</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Favorites / Liked Songs Section */}
      {(activeTab === 'all' || activeTab === 'songs') && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Heart size={18} className="fill-rose-500 text-rose-500" />
              <h2 className="text-lg font-black tracking-tight text-white/95">
                Favorites ({likedSongs.length})
              </h2>
            </div>
            {likedSongs.length > 0 && (
              <button
                onClick={() => playTrack(likedSongs[0], likedSongs)}
                className="text-xs font-bold text-[var(--accent-color)] hover:underline flex items-center gap-1.5"
              >
                <Play size={12} className="fill-current" />
                <span>Play all</span>
              </button>
            )}
          </div>

          {likedSongs.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/5 text-center text-white/40 flex flex-col items-center gap-2">
              <Heart size={32} className="text-white/20" />
              <p className="text-sm font-semibold">No favorite songs yet</p>
              <p className="text-xs">Tap the heart on any song to add it here</p>
            </div>
          ) : activeTab === 'songs' && likedSongs.length > 25 ? (
            <VirtualList<Track>
              items={likedSongs}
              itemHeight={64}
              renderItem={(track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  playlistContext={likedSongs}
                  showIndex={true}
                  showThumbnail={true}
                />
              )}
              keyExtractor={(track) => track.id}
              className="h-[calc(100vh-250px)]"
            />
          ) : (
            <div className="flex flex-col gap-1.5">
              {likedSongs.slice(0, activeTab === 'songs' ? undefined : 6).map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  playlistContext={likedSongs}
                  showIndex={true}
                  showThumbnail={true}
                />
              ))}

              {activeTab === 'all' && likedSongs.length > 6 && (
                <button
                  onClick={() => setActiveTab('songs')}
                  className="py-3 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-white/60 hover:text-white text-center transition-colors"
                >
                  View all {likedSongs.length} favorites
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Playlists Shelf */}
      {(activeTab === 'all' || activeTab === 'playlists') && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-lg font-black tracking-tight text-white/95">
              Playlists ({playlists.length})
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-xs font-bold text-[var(--accent-color)] hover:underline flex items-center gap-1"
            >
              <Plus size={14} />
              <span>Create</span>
            </button>
          </div>

          {unpinnedPlaylists.length === 0 && pinnedPlaylists.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/5 text-center text-white/40 flex flex-col items-center gap-2">
              <ListMusic size={32} className="text-white/20" />
              <p className="text-sm font-semibold">No custom playlists created</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-bold"
              >
                Create your first playlist
              </button>
            </div>
          ) : viewType === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {unpinnedPlaylists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => onSelectPlaylistDetails?.(pl)}
                  className="p-4 rounded-3xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/5 cursor-pointer flex flex-col gap-3 group transition-colors shadow-md relative"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePinPlaylist(pl.id);
                    }}
                    title="Pin playlist"
                    className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/40 backdrop-blur-md text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Pin size={12} />
                  </button>

                  <div className="aspect-square rounded-2xl bg-[var(--bg-card)] border border-white/10 flex items-center justify-center shadow-md overflow-hidden transition-transform">
                    {Boolean(pl.tracks[0]?.thumbnail) ? (
                      <img
                        src={pl.tracks[0].thumbnail}
                        alt={pl.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    ) : (
                      <ListMusic size={40} className="text-white/35" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-white/95 truncate group-hover:text-[var(--accent-color)]">
                      {pl.name}
                    </h3>
                    <p className="text-xs text-white/45 mt-0.5">{pl.tracks.length} tracks</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {unpinnedPlaylists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => onSelectPlaylistDetails?.(pl)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/5 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      {Boolean(pl.tracks[0]?.thumbnail) ? (
                        <img
                          src={pl.tracks[0].thumbnail}
                          alt={pl.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                        />
                      ) : (
                        <ListMusic size={22} className="text-white/40" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white/90 truncate group-hover:text-[var(--accent-color)]">
                        {pl.name}
                      </h3>
                      <p className="text-xs text-white/45">{pl.tracks.length} tracks</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePinPlaylist(pl.id);
                      }}
                      className="p-2 rounded-full text-white/40 hover:text-white"
                      title="Pin playlist"
                      aria-label="Pin playlist"
                    >
                      <Pin size={15} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete playlist "${pl.name}"?`)) {
                          deletePlaylist(pl.id);
                        }
                      }}
                      className="p-2 rounded-full text-white/30 hover:text-rose-400"
                      title="Delete playlist"
                      aria-label="Delete playlist"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recently Played History */}
      {(activeTab === 'all' || activeTab === 'offline') && history.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-white/60" />
              <h2 className="text-lg font-black tracking-tight text-white/95">Recently Played</h2>
            </div>
            <button
              onClick={clearHistory}
              className="text-xs font-semibold text-white/40 hover:text-rose-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {history.slice(0, 8).map((track, idx) => (
              <TrackRow
                key={`${track.id}-${idx}`}
                track={track}
                index={idx}
                playlistContext={history}
                showIndex={false}
                showThumbnail={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) matching Compose BottomSheet trigger */}
      <div
        className={`fixed right-6 sm:right-10 z-30 transition-colors duration-300 ${
          currentTrack ? 'bottom-44 sm:bottom-48' : 'bottom-24 sm:bottom-28'
        }`}
      >
        <motion.button
          whileHover={{}}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFabModal(true)}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[var(--accent)] text-white flex items-center justify-center border border-white/25 transition-colors"
          title="New playlist or import"
          aria-label="New playlist or import"
        >
          <Plus size={24} strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* Fab Action Sheet Modal */}
      <AnimatePresence>
        {showFabModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#1C1D24] border border-white/15 p-6 shadow-2xl flex flex-col gap-2"
            >
              <h3 className="text-base font-extrabold text-white/50 mb-2">
                Library Actions
              </h3>

              <button
                onClick={() => {
                  setShowFabModal(false);
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-left text-sm font-bold text-white transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-color)]/20 text-[var(--accent-color)] flex items-center justify-center">
                  <Plus size={20} />
                </div>
                <div>
                  <p className="leading-snug">Create Playlist</p>
                  <p className="text-xs text-white/40 font-normal">Start a fresh custom collection</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowFabModal(false);
                  setShowAiModal(true);
                }}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-left text-sm font-bold text-white transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-raised)] text-[var(--text-2)] border border-[var(--hairline)] flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="leading-snug">Mood Playlists</p>
                  <p className="text-xs text-white/40 font-normal">Curate mix via preset moods & vibes</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowFabModal(false);
                  setShowSpotifyModal(true);
                }}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-left text-sm font-bold text-white transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Download size={20} />
                </div>
                <div>
                  <p className="leading-snug">Import Online Playlist</p>
                  <p className="text-xs text-white/40 font-normal">Sync via YouTube or Spotify link</p>
                </div>
              </button>

              <button
                onClick={() => setShowFabModal(false)}
                className="mt-3 w-full py-2.5 rounded-2xl bg-white/10 text-xs font-bold text-white/70 hover:text-white"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Playlist Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-[#1C1D24] p-6 border border-white/20 shadow-2xl flex flex-col gap-4"
            >
              <h3 className="text-xl font-black">New Playlist</h3>
              <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Playlist name"
                  className="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-[var(--accent-color)] font-medium text-sm"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-sm font-bold text-black bg-white hover:bg-white/90 active:scale-95 transition-transform"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Spotify & YouTube Online Playlist Importer */}
      <SpotifyImportModal
        isOpen={showSpotifyModal}
        onClose={() => setShowSpotifyModal(false)}
        onPlaylistCreated={(pl) => onSelectPlaylistDetails?.(pl)}
      />

      {/* Mood Playlists Modal */}
      <AiPlaylistModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onPlaylistCreated={(pl) => onSelectPlaylistDetails?.(pl)}
      />
    </div>
  );
};
