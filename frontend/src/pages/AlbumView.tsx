import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { useTheme } from '../context/ThemeContext';
import { Album, Track } from '../types';
import { ParallaxHeader } from '../components/views/ParallaxHeader';
import { TrackRow } from '../components/views/TrackRow';
import { fisherYatesShuffle } from '../utils/shuffle';

interface AlbumViewProps {
  albumId: string;
  onBack: () => void;
  onSelectArtist?: (id: string) => void;
}

export const AlbumView: React.FC<AlbumViewProps> = ({ albumId, onBack, onSelectArtist }) => {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { likedSongs, toggleLike } = useLibrary();
  const { colors } = useTheme();

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getAlbum(albumId)
      .then((data) => {
        setAlbum(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [albumId]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 text-white/50 gap-3">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[var(--accent-color)] rounded-full animate-spin" />
        <span className="text-xs font-semibold">Loading Album...</span>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex-1 p-8 text-center text-white/50 flex flex-col items-center justify-center gap-3">
        <p className="text-base font-bold">Album not found</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Calculate total formatted duration (e.g. "45m" or "1h 12m")
  const totalSeconds = album.tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  const metaString = [
    album.year,
    `${album.tracks.length} Tracks`,
    durationText
  ]
    .filter(Boolean)
    .join(' • ');

  const primaryArtist = album.artists?.[0];
  const isCurrentAlbumPlaying = album.tracks.some((t) => t.id === currentTrack?.id);

  // Check if first track or whole album is liked
  const isAlbumLiked = album.tracks.every((t) => likedSongs.some((s) => s.id === t.id));

  const handlePlayAll = () => {
    if (album.tracks.length > 0) {
      playTrack(album.tracks[0], album.tracks);
    }
  };

  const handleShuffleAll = () => {
    if (album.tracks.length > 0) {
      const shuffled = fisherYatesShuffle(album.tracks);
      playTrack(shuffled[0], shuffled);
    }
  };

  const handleToggleLikeAlbum = () => {
    // Toggle all tracks in album
    album.tracks.forEach((t) => {
      const alreadyLiked = likedSongs.some((s) => s.id === t.id);
      if (isAlbumLiked ? alreadyLiked : !alreadyLiked) {
        toggleLike(t);
      }
    });
  };

  return (
    <div className="flex-1 overflow-y-auto pb-56 text-white no-scrollbar w-full">
      {/* Echo Music Parallax Header with blurred backdrop */}
      <ParallaxHeader
        type="album"
        title={album.title}
        meta={metaString}
        thumbnail={album.thumbnail}
        isLiked={isAlbumLiked}
        isPlaying={isPlaying}
        isCurrentItemPlaying={isCurrentAlbumPlaying}
        onPlayClick={handlePlayAll}
        onShuffleClick={handleShuffleAll}
        onToggleLike={handleToggleLikeAlbum}
        onBack={onBack}
        artistAvatar={
          primaryArtist
            ? {
                name: primaryArtist.name,
                thumbnail: album.thumbnail,
                onClick: primaryArtist.id ? () => onSelectArtist?.(primaryArtist.id!) : undefined
              }
            : undefined
        }
      />

      {/* Track Listing Container */}
      <div className="px-4 sm:px-8 max-w-4xl mx-auto flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-3 py-2 text-xs font-extrabold uppercase tracking-widest text-white/40">
          <span># Track</span>
          <span>Duration</span>
        </div>

        {album.tracks.map((track, idx) => (
          <TrackRow
            key={track.id}
            track={track}
            index={idx}
            playlistContext={album.tracks}
            showIndex={true}
            showThumbnail={false}
          />
        ))}
      </div>
    </div>
  );
};
