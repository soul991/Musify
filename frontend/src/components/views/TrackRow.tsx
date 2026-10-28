import React, { useState, useRef, useEffect } from 'react';
import { Play, MoreVertical, Heart, ListPlus, Radio, Share2, Plus, Info } from 'lucide-react';
import { Track } from '../../types';
import { api } from '../../services/api';
import { usePlayer } from '../../context/PlayerContext';
import { useLibrary } from '../../context/LibraryContext';
import { useToast } from '../../context/ToastContext';
import { SongDetailsModal } from './SongDetailsModal';
import { motion, AnimatePresence } from 'framer-motion';

interface TrackRowProps {
  track: Track;
  index?: number;
  playlistContext?: Track[];
  showThumbnail?: boolean;
  showIndex?: boolean;
  trailingAction?: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  playlistContext,
  showThumbnail = true,
  showIndex = false,
  trailingAction,
  onRemove,
  className = ''
}) => {
  const { currentTrack, isPlaying, playTrack, addToQueue, playNextInQueue } = usePlayer();
  const { isLiked, toggleLike, playlists, addToPlaylist } = useLibrary();
  const { showToast } = useToast();

  const [menuOpen, setMenuOpen] = useState(false);
  const [playlistSubmenuOpen, setPlaylistSubmenuOpen] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<any>(null);
  const touchMovedRef = useRef<boolean>(false);

  const isCurrent = currentTrack?.id === track.id;
  const liked = isLiked(track.id);

  const handleTouchStart = () => {
    touchMovedRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      if (!touchMovedRef.current) {
        setMenuOpen(true);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(40);
        }
      }
    }, 450);
  };

  const handleTouchMove = () => {
    touchMovedRef.current = true;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?track=${track.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: track.title,
          text: `Listen to "${track.title}" on Musify`,
          url: shareUrl
        });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast(`Copied link for "${track.title}" to clipboard!`, 'success');
    } catch {
      showToast('Could not copy link to clipboard', 'error');
    }
  };

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setPlaylistSubmenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  const handleIntentWarm = () => {
    if (track.id) api.prefetchStream(track.id);
  };

  const handleRowClick = () => {
    playTrack(track, playlistContext);
  };

  const handleStartRadio = async (targetTrack: Track) => {
    try {
      const radioTracks = await api.getRadio(targetTrack.id);
      if (radioTracks.length > 0) {
        playTrack(targetTrack, [targetTrack, ...radioTracks]);
      } else {
        playTrack(targetTrack);
      }
    } catch {
      playTrack(targetTrack);
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={menuRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onPointerDown={handleIntentWarm}
      onMouseEnter={handleIntentWarm}
      className={`relative flex items-center justify-between p-2.5 sm:p-3 rounded-2xl glass-card cursor-pointer group transition-all duration-200 select-none ${
        isCurrent ? 'bg-white/15 border-white/25 shadow-md' : 'hover:bg-white/[0.08]'
      } ${className}`}
      onClick={handleRowClick}
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        {/* Index number or Equalizer animation */}
        {showIndex && (
          <div className="w-6 text-center shrink-0">
            {isCurrent && isPlaying ? (
              <div className="flex items-end justify-center gap-0.5 h-4 w-4 mx-auto">
                <span className="w-1 bg-[var(--accent-color)] rounded-full animate-bounce h-3" />
                <span className="w-1 bg-[var(--accent-color)] rounded-full animate-bounce h-4 [animation-delay:0.15s]" />
                <span className="w-1 bg-[var(--accent-color)] rounded-full animate-bounce h-2 [animation-delay:0.3s]" />
              </div>
            ) : (
              <span
                className={`text-xs sm:text-sm font-bold ${
                  isCurrent ? 'text-[var(--accent-color)]' : 'text-white/40 group-hover:text-white/80'
                }`}
              >
                {index !== undefined ? index + 1 : ''}
              </span>
            )}
          </div>
        )}

        {/* Artwork Thumbnail */}
        {showThumbnail && (
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/10 shrink-0 shadow-md border border-white/5">
            <img
              src={track.thumbnail || '/icons/musify-icon.svg'}
              alt={track.title}
              width={48}
              height={48}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (target.src.includes('maxresdefault.jpg')) {
                  target.src = target.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                } else if (!target.src.endsWith('/icons/musify-icon.svg')) {
                  target.src = '/icons/musify-icon.svg';
                }
              }}
            />
            {isCurrent && isPlaying && !showIndex && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                <div className="flex items-end gap-0.5 h-3.5">
                  <span className="w-1 bg-white rounded-full animate-pulse h-2.5" />
                  <span className="w-1 bg-white rounded-full animate-pulse h-3.5 [animation-delay:0.2s]" />
                  <span className="w-1 bg-white rounded-full animate-pulse h-2 [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Title and Artist */}
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-1.5">
            <p
              className={`text-sm font-bold truncate leading-snug ${
                isCurrent ? 'text-[var(--accent-color)]' : 'text-white/90 group-hover:text-white'
              }`}
            >
              {track.title}
            </p>
            {track.explicit && (
              <span className="px-1 py-0.2 rounded bg-white/20 text-white/70 text-[9px] font-black uppercase tracking-wider shrink-0">
                E
              </span>
            )}
          </div>
          <p className="text-xs text-white/50 truncate mt-0.5">
            {track.artists?.map((a) => a.name).join(', ') || 'Unknown Artist'}
          </p>
        </div>
      </div>

      {/* Trailing Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 pl-2">
        {/* Like Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(track);
          }}
          aria-label={liked ? 'Unlike' : 'Like'}
          className={`p-1.5 rounded-full transition-colors ${
            liked
              ? 'text-[#E5303D] opacity-100'
              : 'text-white/30 hover:text-white opacity-0 group-hover:opacity-100'
          }`}
        >
          <Heart size={16} className={liked ? 'fill-[#E5303D]' : ''} />
        </button>

        {/* Duration */}
        <span className="text-xs font-semibold text-white/40 tabular-nums">
          {track.durationFormatted || (track.duration ? formatDuration(track.duration) : '')}
        </span>

        {/* Custom trailing action or More Options Button */}
        {trailingAction || (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            aria-label="More options"
            className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
          >
            <MoreVertical size={16} />
          </button>
        )}
      </div>

      {/* Context Menu Dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-4 top-12 z-50 min-w-[210px] rounded-2xl bg-[#1A1A1A] border border-white/10 shadow-[0_15px_50px_rgba(0,0,0,0.95)] p-1.5 flex flex-col gap-0.5 text-xs font-semibold backdrop-blur-3xl"
          >
            <button
              onClick={() => {
                handleStartRadio(track);
                setMenuOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Radio size={15} />
              <span>Start Radio</span>
            </button>

            <button
              onClick={() => {
                addToQueue(track);
                setMenuOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <ListPlus size={15} />
              <span>Add to Queue</span>
            </button>

            <button
              onClick={() => {
                playNextInQueue(track);
                setMenuOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Play size={15} />
              <span>Play Next</span>
            </button>

            <button
              onClick={() => {
                handleShare();
                setMenuOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Share2 size={15} />
              <span>Share Song</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setPlaylistSubmenuOpen(!playlistSubmenuOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Plus size={15} />
                  <span>Add to Playlist</span>
                </div>
                <span className="text-[10px] text-white/40">›</span>
              </button>

              {playlistSubmenuOpen && (
                <div className="mt-1 p-1 rounded-xl bg-white/10 flex flex-col gap-0.5 max-h-36 overflow-y-auto no-scrollbar">
                  {playlists.length === 0 ? (
                    <span className="px-2 py-1 text-[11px] text-white/40 italic">
                      No playlists created
                    </span>
                  ) : (
                    playlists.map((pl) => (
                      <button
                        key={pl.id}
                        onClick={() => {
                          addToPlaylist(pl.id, track);
                          setMenuOpen(false);
                          setPlaylistSubmenuOpen(false);
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-left text-[11px] font-semibold text-white/90 hover:bg-white/15 truncate"
                      >
                        {pl.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setShowDetailsModal(true);
                setMenuOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Info size={15} />
              <span>Song Details</span>
            </button>

            <button
              onClick={() => {
                toggleLike(track);
                setMenuOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Heart size={15} className={liked ? 'fill-[#E5303D] text-[#E5303D]' : ''} />
              <span>{liked ? 'Remove from Favorites' : 'Add to Favorites'}</span>
            </button>

            {onRemove && (
              <button
                onClick={() => {
                  onRemove();
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/15 hover:text-red-300 transition-colors"
              >
                <span>Remove from Playlist</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Song Details Modal */}
      <SongDetailsModal
        track={track}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onStartRadio={handleStartRadio}
      />
    </div>
  );
};
