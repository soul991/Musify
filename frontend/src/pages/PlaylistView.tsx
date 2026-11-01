import React, { useEffect, useState } from 'react';
import { Trash2, Plus, ListMusic } from 'lucide-react';
import { api } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { useLibrary, UserPlaylist } from '../context/LibraryContext';
import { Track, Playlist } from '../types';
import { ParallaxHeader } from '../components/views/ParallaxHeader';
import { TrackRow } from '../components/views/TrackRow';
import { fisherYatesShuffle } from '../utils/shuffle';

interface PlaylistViewProps {
  playlistId?: string;
  customPlaylist?: UserPlaylist;
  onBack: () => void;
  onSelectArtist?: (id: string) => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
  playlistId,
  customPlaylist,
  onBack,
  onSelectArtist
}) => {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { colors } = useTheme();
  const { removeFromPlaylist, deletePlaylist, likedSongs, toggleLike } = useLibrary();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(!!playlistId);

  useEffect(() => {
    if (playlistId) {
      setLoading(true);
      api.getPlaylist(playlistId)
        .then((data) => {
          setPlaylist(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [playlistId]);

  const activeTitle = customPlaylist ? customPlaylist.name : playlist?.title || 'Playlist';
  const activeTracks: Track[] = customPlaylist ? customPlaylist.tracks : playlist?.tracks || [];
  const thumbnail =
    playlist?.thumbnail || activeTracks[0]?.thumbnail || '/icons/musify-icon.svg';

  const authorName = customPlaylist ? 'You' : playlist?.author || 'YouTube Music';

  // Calculate total duration
  const totalSeconds = activeTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  const metaString = `${activeTracks.length} tracks • ${durationText} • Curated by ${authorName}`;

  const isCurrentPlaylistPlaying = activeTracks.some((t) => t.id === currentTrack?.id);

  const handlePlayAll = () => {
    if (activeTracks.length > 0) {
      playTrack(activeTracks[0], activeTracks);
    }
  };

  const handleShuffleAll = () => {
    if (activeTracks.length > 0) {
      const shuffled = fisherYatesShuffle(activeTracks);
      playTrack(shuffled[0], shuffled);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 text-white/50 gap-3">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[var(--accent-color)] rounded-full animate-spin" />
        <span className="text-xs font-semibold">Loading Playlist...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-56 text-white no-scrollbar w-full">
      {/* Parallax Header */}
      <ParallaxHeader
        type="playlist"
        title={activeTitle}
        meta={metaString}
        thumbnail={thumbnail}
        isPlaying={isPlaying}
        isCurrentItemPlaying={isCurrentPlaylistPlaying}
        onPlayClick={activeTracks.length > 0 ? handlePlayAll : undefined}
        onShuffleClick={activeTracks.length > 0 ? handleShuffleAll : undefined}
        onBack={onBack}
        onOptionsClick={
          customPlaylist
            ? () => {
                if (confirm(`Delete playlist "${customPlaylist.name}"?`)) {
                  deletePlaylist(customPlaylist.id);
                  onBack();
                }
              }
            : undefined
        }
      />

      {/* Main Track List Container */}
      <div className="px-4 sm:px-8 max-w-4xl mx-auto flex flex-col gap-1.5">
        {activeTracks.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white/[0.04] border border-white/5 text-center text-white/40 flex flex-col items-center gap-3 my-6">
            <ListMusic size={36} className="text-white/20" />
            <p className="text-base font-bold text-white/70">Playlist is empty</p>
            <p className="text-xs">Find songs using Search and add them to this playlist</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-3 py-2 text-xs font-extrabold tracking-normal text-white/40">
              <span># Title</span>
              <span>Duration</span>
            </div>

            {activeTracks.map((track, idx) => (
              <TrackRow
                key={`${track.id}-${idx}`}
                track={track}
                index={idx}
                playlistContext={activeTracks}
                showIndex={true}
                showThumbnail={true}
                onRemove={
                  customPlaylist
                    ? () => removeFromPlaylist(customPlaylist.id, track.id)
                    : undefined
                }
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};
