import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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
  ListMusic,
  Headphones,
  Speaker,
  Bluetooth
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useTheme } from '../../context/ThemeContext';
import { useLibrary } from '../../context/LibraryContext';
import { AdaptiveSeekbar } from './AdaptiveSeekbar';
import { FlowerPlayButton } from './FlowerPlayButton';
import { HeartBurstIcon } from './HeartBurstIcon';
import { AudioOutputModal } from './AudioOutputModal';
import { getButtonPressFeedback } from '../../utils/motion';

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
    isPlayerOpen,
    audioOutputDeviceId,
    audioQuality
  } = usePlayer();

  const [showOutputModal, setShowOutputModal] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const buttonFeedback = getButtonPressFeedback(shouldReduceMotion);
  const { colors } = useTheme();
  const { isLiked, toggleLike } = useLibrary();

  const liked = currentTrack ? isLiked(currentTrack.id) : false;

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
    <AnimatePresence>
      {currentTrack && !isPlayerOpen && (
        <div
          className={`fixed bottom-5 inset-x-0 z-40 hidden md:flex justify-center px-6 pointer-events-none ${className}`}
        >
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { y: 50, opacity: 0 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { y: 50, opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0.1, ease: 'linear' } : { type: 'spring', damping: 28, stiffness: 350 }}
            className="relative w-full max-w-[1200px] h-[78px] rounded-full backdrop-blur-3xl backdrop-saturate-[1.6] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center px-6 gap-6 pointer-events-auto select-none overflow-hidden"
            style={{
              background: colors.primary
                ? 'linear-gradient(135deg, rgba(26, 26, 32, 0.92) 0%, rgba(18, 18, 22, 0.96) 100%)'
                : 'rgba(20, 20, 24, 0.94)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
            }}
          >
            {/* Thin 2px progress line at top of dock: GPU transform scaleX, no layout reflow */}
            <div className="absolute top-0 inset-x-8 h-[2px] rounded-full bg-white/10 overflow-hidden pointer-events-none">
              <div
                className="h-full bg-[var(--accent)] origin-left"
                style={{
                  width: '100%',
                  transform: `scaleX(${duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0})`,
                  transformOrigin: 'left center'
                }}
              />
            </div>

            {/* Left Section: Track Info & Room Status */}
            <div className="flex items-center gap-3.5 w-64 lg:w-72 shrink-0 min-w-0">
              {/* Circular Artwork */}
              <motion.div
                layoutId="player-artwork"
                onClick={() => setIsPlayerOpen(true)}
                className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-white/20 p-0.5 cursor-pointer shadow-md group"
              >
                <img
                  src={currentTrack.thumbnail || '/icons/musify-icon.svg'}
                  alt={currentTrack.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/icons/musify-icon.svg';
                  }}
                  className="w-full h-full object-cover rounded-full"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity">
                  <Maximize2 size={14} className="text-white" />
                </div>
              </motion.div>

          {/* Track Details */}
          <div className="flex-1 min-w-0">
            <div
              role="heading"
              aria-level={3}
              onClick={() => setIsPlayerOpen(true)}
              className="text-sm font-bold text-white truncate cursor-pointer hover:underline leading-tight"
            >
              {currentTrack.title}
            </div>
            <p className="text-xs text-white/50 truncate font-medium leading-tight mt-0.5">
              {currentTrack.artists?.map((a) => a.name).join(', ') || 'Unknown Artist'}
            </p>
          </div>

          {/* Like Heart Burst Button */}
          <motion.button
            type="button"
            whileTap={buttonFeedback.whileTap}
            transition={buttonFeedback.transition}
            onClick={() => toggleLike(currentTrack)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors duration-150 shrink-0 mx-1 p-2"
            title={liked ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={liked ? 'Remove from favorites' : 'Add to favorites'}
          >
            <HeartBurstIcon isLiked={liked} size={18} />
          </motion.button>
        </div>

        {/* Center Section: Playback Controls & Waveform Scrubber */}
        <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
          {/* Buttons Row */}
          <div className="flex items-center justify-center gap-3">
            {/* Shuffle */}
            <motion.button
              type="button"
              whileTap={buttonFeedback.whileTap}
              transition={buttonFeedback.transition}
              onClick={toggleShuffle}
              className={`p-2 rounded-full flex items-center justify-center min-w-[36px] min-h-[36px] hover:bg-white/10 transition-colors duration-150 ${
                isShuffled ? 'text-[var(--accent)]' : 'text-white/40 hover:text-white'
              }`}
              title="Shuffle"
              aria-label="Toggle shuffle"
            >
              <Shuffle size={16} />
            </motion.button>

            {/* Previous */}
            <motion.button
              type="button"
              whileTap={buttonFeedback.whileTap}
              transition={buttonFeedback.transition}
              onClick={prevTrack}
              className="p-2 rounded-full flex items-center justify-center min-w-[36px] min-h-[36px] text-white/60 hover:text-white hover:bg-white/10 transition-colors duration-150"
              title="Previous Track"
              aria-label="Previous track"
            >
              <SkipBack size={18} />
            </motion.button>

            {/* Scalloped Flower Play/Pause Button - Restrained Musify Red */}
            <FlowerPlayButton
              isPlaying={isPlaying}
              onClick={togglePlay}
              size={44}
              color="var(--accent)"
              iconColor="#FFFFFF"
              iconSize={18}
            />

            {/* Next */}
            <motion.button
              type="button"
              whileTap={buttonFeedback.whileTap}
              transition={buttonFeedback.transition}
              onClick={nextTrack}
              className="p-2 rounded-full flex items-center justify-center min-w-[36px] min-h-[36px] text-white/60 hover:text-white hover:bg-white/10 transition-colors duration-150"
              title="Next Track"
              aria-label="Next track"
            >
              <SkipForward size={18} />
            </motion.button>

            {/* Repeat */}
            <motion.button
              type="button"
              whileTap={buttonFeedback.whileTap}
              transition={buttonFeedback.transition}
              onClick={toggleRepeat}
              className={`p-2 rounded-full flex items-center justify-center min-w-[36px] min-h-[36px] hover:bg-white/10 transition-colors duration-150 ${
                repeatMode !== 'off' ? 'text-[var(--accent)]' : 'text-white/40 hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
              aria-label={`Repeat mode: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
            </motion.button>
          </div>

          {/* Scrubber & Timers */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-sans text-[var(--text-3)] w-8 text-right tabular-nums">
              {formatTime(currentTime)}
            </span>

            <div className="flex-1">
              <AdaptiveSeekbar
                value={currentTime}
                max={duration || 100}
                isPlaying={isPlaying}
                accentColor="var(--accent)"
                onSeek={seek}
              />
            </div>

            <span className="text-xs font-sans text-[var(--text-3)] w-8 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right Section: Visualizer, Volume, Toggles */}
        <div className="flex items-center gap-3.5 w-64 lg:w-72 justify-end shrink-0">
          {/* Live Equalizer Animation Bars (eliminated when paused or reduced motion) */}
          {isPlaying && !shouldReduceMotion && (
            <div className="flex items-end gap-1 h-5 px-2">
              <span className="w-1 bg-[var(--accent)] rounded-full h-3 animate-[bounce_0.6s_ease-in-out_infinite]" />
              <span className="w-1 bg-[var(--accent)] rounded-full h-5 animate-[bounce_0.8s_ease-in-out_0.2s_infinite]" />
              <span className="w-1 bg-[var(--accent)] rounded-full h-2 animate-[bounce_0.5s_ease-in-out_0.4s_infinite]" />
              <span className="w-1 bg-[var(--accent)] rounded-full h-4 animate-[bounce_0.7s_ease-in-out_0.1s_infinite]" />
            </div>
          )}

          {/* Volume Control */}
          <div className="flex items-center gap-2 group">
            <motion.button
              type="button"
              whileTap={buttonFeedback.whileTap}
              transition={buttonFeedback.transition}
              onClick={handleMuteToggle}
              className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors duration-150"
              title="Mute / Unmute"
              aria-label={volume === 0 ? 'Unmute' : 'Mute'}
            >
              {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </motion.button>
            <input
              id="desktop-volume-slider"
              name="volume"
              aria-label="Volume control"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 lg:w-20 h-1 accent-[var(--accent)] bg-white/10 rounded-full cursor-pointer"
            />
          </div>

          {/* Toggle Right Companion Panel (Lyrics / Vinyl) */}
          {onToggleCompanion && (
            <motion.button
              type="button"
              whileTap={buttonFeedback.whileTap}
              transition={buttonFeedback.transition}
              onClick={onToggleCompanion}
              className={`p-2 rounded-xl transition-colors duration-150 ${
                isCompanionOpen
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
              title={isCompanionOpen ? 'Hide companion panel' : 'Show lyrics & queue companion'}
              aria-label={isCompanionOpen ? 'Hide companion panel' : 'Show lyrics & queue companion'}
            >
              <Mic2 size={16} style={{ color: isCompanionOpen ? colors.primary : undefined }} />
            </motion.button>
          )}

          {/* Listen Together Room Pill */}
          {onOpenListenTogether && (
            <motion.button
              type="button"
              whileTap={buttonFeedback.whileTap}
              transition={buttonFeedback.transition}
              onClick={onOpenListenTogether}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/70 hover:text-white text-xs font-medium transition-colors duration-150"
              title="Listen Together Room"
              aria-label="Listen Together Room"
            >
              <Users size={13} className="text-[var(--accent)]" />
              <span className="hidden lg:inline">Room</span>
            </motion.button>
          )}

          {/* Audio Output Selector Trigger */}
          <motion.button
            type="button"
            whileTap={buttonFeedback.whileTap}
            transition={buttonFeedback.transition}
            onClick={() => setShowOutputModal(true)}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors duration-150 flex items-center gap-1"
            title="Audio Output & AirPlay"
            aria-label="Audio Output & AirPlay"
          >
            <Headphones size={16} />
          </motion.button>

          {/* Full Player Expand */}
          <motion.button
            type="button"
            whileTap={buttonFeedback.whileTap}
            transition={buttonFeedback.transition}
            onClick={() => setIsPlayerOpen(true)}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors duration-150"
            title="Expand Full Player"
            aria-label="Expand Full Player"
          >
            <Maximize2 size={16} />
          </motion.button>
        </div>
      </motion.div>

      {/* Audio Output Selector Modal */}
      <AudioOutputModal isOpen={showOutputModal} onClose={() => setShowOutputModal(false)} />
        </div>
      )}
    </AnimatePresence>
  );
};
