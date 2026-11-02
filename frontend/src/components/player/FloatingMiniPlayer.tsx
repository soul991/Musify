import React, { useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Music } from 'lucide-react';
import { Track } from '../../types';
import { HeartBurstIcon } from './HeartBurstIcon';
import { useLibrary } from '../../context/LibraryContext';
import { useTheme } from '../../context/ThemeContext';

interface FloatingMiniPlayerProps {
  track: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onClick: () => void;
  isInline?: boolean;
  className?: string;
}

/**
 * Compact now playing controls docked inside the floating navigation bar,
 * mirroring Echo Music FloatingMiniPlayer.kt & MiniPlayer.kt:
 * - 48px circular progress ring surrounding 40px album art thumbnail
 * - Horizontal swipe gesture with spring resistance (swipeSensitivity = 0.73) to skip songs
 * - Press scale response: grows to 1.04x while pressed
 * - Mini player styling with specular highlight rim
 */
export const FloatingMiniPlayer: React.FC<FloatingMiniPlayerProps> = ({
  track,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onNext,
  onPrev,
  onClick,
  isInline = false,
  className = ''
}) => {
  const { isLiked, toggleLike } = useLibrary();
  const { colors } = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const dragX = useMotionValue(0);
  const smoothX = useSpring(dragX, { stiffness: 450, damping: 32 });

  const liked = isLiked(track.id);
  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  // Swipe sensitivity calculation matching FloatingMiniPlayer.kt & MiniPlayer.kt
  const swipeSensitivity = 0.73;
  const autoSwipeThreshold = Math.round(
    600 / (1.0 + Math.exp(-(-11.44748 * swipeSensitivity + 9.04945)))
  ); // ~150px
  const velocityThreshold = swipeSensitivity * -8.25 + 8.5; // ~2.47 px/ms

  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const currentOffset = info.offset.x;
    const velocity = Math.abs(info.velocity.x) / 1000;

    const shouldChange =
      (Math.abs(currentOffset) > 50 && velocity > velocityThreshold) ||
      Math.abs(currentOffset) > autoSwipeThreshold;

    if (shouldChange) {
      if (currentOffset > 0) {
        onPrev();
      } else {
        onNext();
      }
    }
  };

  // Circular progress ring parameters (48px outer size, 3px stroke, 40px inner artwork)
  const ringSize = isInline ? 38 : 46;
  const strokeWidth = 2.5;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;
  const artSize = ringSize - 8;

  return (
    <motion.div
      animate={{ scale: isPressed ? 1.03 : 1.0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerCancel={() => setIsPressed(false)}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.35}
      onDragEnd={handleDragEnd}
      style={{ x: smoothX }}
      onClick={onClick}
      className={`relative w-full max-w-[390px] md:max-w-[480px] h-[58px] rounded-full bg-[#121212]/85 backdrop-blur-3xl backdrop-saturate-[1.8] border border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_0_12px_rgba(255,255,255,0.05)] flex items-center justify-between px-3 cursor-pointer select-none pointer-events-auto transition-colors hover:border-white/30 active:scale-[0.99] ${className}`}
    >
      {/* Thin 2px progress line at top of mini player */}
      <div className="absolute top-0 inset-x-6 h-[2px] rounded-full bg-white/10 overflow-hidden pointer-events-none">
        <div className="h-full bg-[var(--accent)] transition-[width] duration-200" style={{ width: `${progressRatio * 100}%` }} />
      </div>

      {/* Left: 48px Circular Progress Ring surrounding 40px Album Art */}
      <div className="flex items-center gap-3 min-w-0 pr-1 flex-1">
        <div
          className="relative shrink-0 flex items-center justify-center"
          style={{ width: ringSize, height: ringSize }}
        >
          {/* SVG Progress Ring */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
            viewBox={`0 0 ${ringSize} ${ringSize}`}
          >
            {/* Inactive Track */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth={strokeWidth}
            />
            {/* Active Progress Arc */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-150 ease-linear"
            />
          </svg>

          {/* Album Art Thumbnail inside Ring */}
          <motion.div
            layoutId="player-artwork"
            className="relative rounded-full overflow-hidden shadow-inner bg-black/40 flex items-center justify-center"
            style={{ width: artSize, height: artSize }}
          >
            {Boolean(track.thumbnail) ? (
              <img
                src={track.thumbnail}
                alt={track.title}
                width={artSize}
                height={artSize}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/icons/musify-icon.svg';
                }}
                className="w-full h-full object-cover"
                loading="eager"
              />
            ) : (
              <Music size={18} className="text-white/60" />
            )}
          </motion.div>
        </div>

        {/* Title & Artist */}
        <div className="min-w-0 flex flex-col justify-center flex-1 pr-2">
          <motion.p
            layoutId="player-title"
            className="text-sm font-bold text-white truncate  leading-tight"
          >
            {track.title}
          </motion.p>
          <p className="text-xs text-white/65 font-medium truncate leading-tight mt-0.5">
            {track.artists?.map((a) => a.name).join(', ') || 'Unknown Artist'}
          </p>
        </div>
      </div>

      {/* Right Controls: Like, Prev, Play/Pause, Next */}
      <div
        className="flex items-center gap-0.5 sm:gap-1 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => toggleLike(track)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 active:scale-90 transition-colors"
          title={liked ? 'Unlike' : 'Like'}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          <HeartBurstIcon isLiked={liked} size={18} />
        </button>

        <button
          onClick={onPrev}
          className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center text-white/70 hover:text-white hover:bg-white/10 active:scale-90 transition-colors"
          title="Previous"
          aria-label="Previous track"
        >
          <SkipBack size={18} className="fill-current" />
        </button>

        <motion.button
          layoutId="player-play-button"
          onClick={onTogglePlay}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--accent)] text-white  active:scale-95 transition-colors  ml-0.5"
          title={isPlaying ? 'Pause' : 'Play'}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause size={18} className="fill-current" />
          ) : (
            <Play size={18} className="fill-current ml-0.5" />
          )}
        </motion.button>

        <button
          onClick={onNext}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 active:scale-90 transition-colors"
          title="Next"
          aria-label="Next track"
        >
          <SkipForward size={18} className="fill-current" />
        </button>
      </div>
    </motion.div>
  );
};
