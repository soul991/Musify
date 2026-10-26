import React from 'react';
import { motion } from 'framer-motion';
import {
  Shuffle,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Users,
  Mic2,
  ListMusic
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useTheme } from '../../context/ThemeContext';
import { useLibrary } from '../../context/LibraryContext';
import { SquigglySlider } from './SquigglySlider';
import { FlowerPlayButton } from './FlowerPlayButton';
import { HeartBurstIcon } from './HeartBurstIcon';

interface DesktopDockPlayerProps {
  onOpenListenTogether?: () => void;
  isCompanionOpen?: boolean;
  onToggleCompanion?: () => void;
  className?: string;
}

export const DesktopDockPlayer: React.FC<DesktopDockPlayerProps> = ({
  onOpenListenTogether,
  isCompanionOpen = true,
  onToggleCompanion,
  className = ''
}) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    volume,
    setVolume,
    isShuffled,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    setIsPlayerOpen,
    isPlayerOpen
  } = usePlayer();

  const { colors } = useTheme();
  const { isLiked, toggleLike } = useLibrary();

  if (!currentTrack || isPlayerOpen) {
    return null;
  }

  const liked = isLiked(currentTrack.id);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMuteToggle = () => {
    if (volume > 0) {
      setVolume(0);
    } else {
      setVolume(0.8);
    }
  };

  return (
    <div
      className={`fixed bottom-5 inset-x-0 z-40 hidden md:flex justify-center px-6 pointer-events-none ${className}`}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="w-full max-w-[1200px] h-[78px] rounded-full bg-[#101117]/90 backdrop-blur-3xl backdrop-saturate-[1.8] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.4)] flex items-center px-6 gap-6 pointer-events-auto select-none"
      >
        {/* Left Section: Track Info & Room Status */}
        <div className="flex items-center gap-3.5 w-64 lg:w-72 shrink-0 min-w-0">
          {/* Circular Artwork */}
          <div
            onClick={() => setIsPlayerOpen(true)}
            className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-white/20 p-0.5 cursor-pointer shadow-md group"
          >
            <img
              src={currentTrack.thumbnail || '/icons/musify-icon.svg'}
              alt={currentTrack.title}
              className={`w-full h-full object-cover rounded-full ${
                isPlaying ? 'animate-spin-vinyl' : 'animate-spin-vinyl-paused'
              }`}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity">
              <Maximize2 size={14} className="text-white" />
            </div>
          </div>

          {/* Track Details */}
          <div className="flex-1 min-w-0">
            <h4
              onClick={() => setIsPlayerOpen(true)}
              className="text-sm font-bold text-white truncate cursor-pointer hover:underline leading-tight"
            >
              {currentTrack.title}
            </h4>
            <p className="text-xs text-white/50 truncate font-medium leading-tight mt-0.5">
              {currentTrack.artists?.map((a) => a.name).join(', ') || 'Unknown Artist'}
            </p>
          </div>

          {/* Like Heart Burst Button */}
          <button
            onClick={() => toggleLike(currentTrack)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors shrink-0"
            title={liked ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={liked ? 'Remove from favorites' : 'Add to favorites'}
          >
            <HeartBurstIcon isLiked={liked} size={16} />
          </button>
        </div>

        {/* Center Section: Playback Controls & Waveform Scrubber */}
        <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
          {/* Buttons Row */}
          <div className="flex items-center justify-center gap-5">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={`transition-colors ${
                isShuffled ? 'text-[#ED5564]' : 'text-white/40 hover:text-white'
              }`}
              title="Shuffle"
              aria-label="Toggle shuffle"
            >
              <Shuffle size={15} />
            </button>

            {/* Previous */}
            <button
              onClick={prevTrack}
              className="text-white/60 hover:text-white transition-colors"
              title="Previous Track"
              aria-label="Previous track"
            >
              <SkipBack size={18} />
            </button>

            {/* Scalloped Flower Play/Pause Button */}
            <FlowerPlayButton
              isPlaying={isPlaying}
              onClick={togglePlay}
              size={44}
              color="#FFFFFF"
              iconColor="#000000"
              iconSize={18}
            />

            {/* Next */}
            <button
              onClick={nextTrack}
              className="text-white/60 hover:text-white transition-colors"
              title="Next Track"
              aria-label="Next track"
            >
              <SkipForward size={18} />
            </button>

            {/* Repeat */}
            <button
              onClick={toggleRepeat}
              className={`transition-colors ${
                repeatMode !== 'off' ? 'text-[#ED5564]' : 'text-white/40 hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
              aria-label={`Repeat mode: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 size={15} /> : <Repeat size={15} />}
            </button>
          </div>

          {/* Scrubber & Timers */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-white/40 w-8 text-right tabular-nums">
              {formatTime(currentTime)}
            </span>

            <div className="flex-1">
              <SquigglySlider
                value={currentTime}
                max={duration || 100}
                isPlaying={isPlaying}
                accentColor={colors.primary}
                onSeek={seek}
              />
            </div>

            <span className="text-[10px] font-mono text-white/40 w-8 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right Section: Visualizer, Volume, Toggles */}
        <div className="flex items-center gap-3.5 w-64 lg:w-72 justify-end shrink-0">
          {/* Live Equalizer Animation Bars */}
          {isPlaying && (
            <div className="flex items-end gap-1 h-5 px-2">
              <span className="w-1 bg-[#ED5564] rounded-full h-3 animate-[bounce_0.6s_ease-in-out_infinite]" />
              <span className="w-1 bg-[#ED5564] rounded-full h-5 animate-[bounce_0.8s_ease-in-out_0.2s_infinite]" />
              <span className="w-1 bg-[#ED5564] rounded-full h-2 animate-[bounce_0.5s_ease-in-out_0.4s_infinite]" />
              <span className="w-1 bg-[#ED5564] rounded-full h-4 animate-[bounce_0.7s_ease-in-out_0.1s_infinite]" />
            </div>
          )}

          {/* Volume Control */}
          <div className="flex items-center gap-2 group">
            <button
              onClick={handleMuteToggle}
              className="text-white/50 hover:text-white transition-colors"
              title="Mute / Unmute"
              aria-label={volume === 0 ? 'Unmute' : 'Mute'}
            >
              {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 lg:w-20 h-1 accent-[#ED5564] bg-white/10 rounded-full cursor-pointer"
            />
          </div>

          {/* Toggle Right Companion Panel (Lyrics / Vinyl) */}
          {onToggleCompanion && (
            <button
              onClick={onToggleCompanion}
              className={`p-2 rounded-xl transition-all ${
                isCompanionOpen
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
              title={isCompanionOpen ? 'Hide companion panel' : 'Show lyrics & queue companion'}
              aria-label={isCompanionOpen ? 'Hide companion panel' : 'Show lyrics & queue companion'}
            >
              <Mic2 size={16} style={{ color: isCompanionOpen ? colors.primary : undefined }} />
            </button>
          )}

          {/* Listen Together Room Pill */}
          {onOpenListenTogether && (
            <button
              onClick={onOpenListenTogether}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/70 hover:text-white text-[11px] font-bold transition-all"
              title="Listen Together Room"
              aria-label="Listen Together Room"
            >
              <Users size={13} className="text-[#ED5564]" />
              <span className="hidden lg:inline">Room</span>
            </button>
          )}

          {/* Full Player Expand */}
          <button
            onClick={() => setIsPlayerOpen(true)}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Expand Full Player"
            aria-label="Expand Full Player"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
