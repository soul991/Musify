import React from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { SkipBack, SkipForward } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useLibrary } from '../../context/LibraryContext';
import { FlowerPlayButton } from './FlowerPlayButton';
import { HeartBurstIcon } from './HeartBurstIcon';

export const MiniPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    nextTrack,
    prevTrack,
    currentTime,
    duration,
    setIsPlayerOpen
  } = usePlayer();
  const { isLiked, toggleLike } = useLibrary();

  const dragX = useMotionValue(0);
  const smoothX = useSpring(dragX, { stiffness: 450, damping: 32 });

  if (!currentTrack) return null;

  const liked = isLiked(currentTrack.id);
  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  // Swipe sensitivity calculation matching MiniPlayer.kt
  const swipeSensitivity = 0.73;
  const autoSwipeThreshold = Math.round(
    600 / (1.0 + Math.exp(-(-11.44748 * swipeSensitivity + 9.04945)))
  ); // ~150px
  const velocityThreshold = swipeSensitivity * -8.25 + 8.5; // ~2.47 px/ms = ~2470 px/s

  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const currentOffset = info.offset.x;
    const velocity = Math.abs(info.velocity.x) / 1000;

    const shouldChange =
      (Math.abs(currentOffset) > 50 && velocity > velocityThreshold) ||
      Math.abs(currentOffset) > autoSwipeThreshold;

    if (shouldChange) {
      if (currentOffset > 0) {
        prevTrack();
      } else {
        nextTrack();
      }
    }
  };

  // Circular progress ring parameters (48px outer size, 3px stroke, 40px inner artwork)
  const ringSize = 48;
  const strokeWidth = 3;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      className="fixed bottom-[74px] inset-x-3 sm:inset-x-6 md:left-[280px] md:right-8 z-30 flex justify-center pointer-events-none select-none"
    >
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.35}
        onDragEnd={handleDragEnd}
        style={{ x: smoothX }}
        onTap={() => setIsPlayerOpen(true)}
        onClick={() => setIsPlayerOpen(true)}
        className="w-full max-w-[360px] md:max-w-[480px] h-[64px] rounded-full bg-[#16171E]/90 backdrop-blur-3xl border border-white/20 shadow-[0_16px_36px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.25)] flex items-center justify-between px-3 cursor-pointer pointer-events-auto transition-colors hover:border-white/30 active:scale-[0.99]"
      >
        {/* Left: 48px Circular Progress Ring surrounding 40px Disc Thumbnail */}
        <div className="flex items-center gap-3 min-w-0 pr-1 flex-1">
          <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
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
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth={strokeWidth}
              />
              {/* Active Progress Arc */}
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-colors duration-150"
              />
            </svg>

            {/* Inner 40px Circular Artwork Disc */}
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 border border-white/20 shadow-inner">
              <img
                src={currentTrack.thumbnail || '/icons/musify-icon.svg'}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/icons/musify-icon.svg';
                }}
              />
            </div>
          </div>

          {/* Center Song Info with Marquee */}
          <div className="min-w-0 flex flex-col justify-center flex-1">
            <p className="text-sm font-semibold text-white truncate leading-tight">
              {currentTrack.title}
            </p>
            <p className="text-xs text-white/60 font-medium truncate mt-0.5">
              {currentTrack.artists?.map((a) => a.name).join(', ') || 'Unknown Artist'}
            </p>
          </div>
        </div>

        {/* Right Quick Controls matching MiniPlayerControls in MiniPlayer.kt */}
        <div
          className="flex items-center gap-1.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Like Button Burst */}
          <HeartBurstIcon
            isLiked={liked}
            onToggle={() => toggleLike(currentTrack)}
            size={22}
            className="p-1 hover:text-white"
          />

          {/* Previous Track: 32px button, 20px icon */}
          <button
            onClick={prevTrack}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors active:scale-90"
          >
            <SkipBack size={18} className="fill-current" />
          </button>

          {/* Play/Pause Button: 48px Flower / Wavy Squircle */}
          <FlowerPlayButton
            isPlaying={isPlaying}
            onClick={togglePlay}
            size={48}
            color="#FFFFFF"
            iconColor="#000000"
          />

          {/* Next Track: 32px button, 20px icon */}
          <button
            onClick={nextTrack}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors active:scale-90"
          >
            <SkipForward size={18} className="fill-current" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
