import React from 'react';
import { Play, Pause, Shuffle, Heart, MoreVertical, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

interface ParallaxHeaderProps {
  type: 'album' | 'artist' | 'playlist';
  title: string;
  subtitle?: string;
  meta?: string;
  thumbnail: string;
  isLiked?: boolean;
  isPlaying?: boolean;
  isCurrentItemPlaying?: boolean;
  onPlayClick?: () => void;
  onShuffleClick?: () => void;
  onToggleLike?: () => void;
  onBack?: () => void;
  onOptionsClick?: () => void;
  artistAvatar?: {
    name: string;
    thumbnail: string;
    onClick?: () => void;
  };
  children?: React.ReactNode;
}

export const ParallaxHeader: React.FC<ParallaxHeaderProps> = ({
  type,
  title,
  subtitle,
  meta,
  thumbnail,
  isLiked,
  isPlaying,
  isCurrentItemPlaying,
  onPlayClick,
  onShuffleClick,
  onToggleLike,
  onBack,
  onOptionsClick,
  artistAvatar,
  children
}) => {
  const { colors } = useTheme();

  const isArtist = type === 'artist';

  return (
    <div className="relative w-full overflow-hidden mb-6 -mt-2">
      {/* Blurred Parallax Backdrop */}
      <div className="absolute inset-0 h-80 sm:h-96 w-full overflow-hidden pointer-events-none select-none">
        <img
          src={thumbnail || '/icons/musify-icon.svg'}
          alt=""
          className="w-full h-full object-cover scale-125 blur-3xl opacity-40 brightness-75 transform-gpu"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/icons/musify-icon.svg';
          }}
        />
        {/* Dual Gradient Scrim for Contrast & Smooth Bottom Fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/80 to-transparent" />
        <div className="absolute inset-0 bg-black/35" />
      </div>

      {/* Navigation Top Action Row */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 pt-safe pt-4 pb-2">
        {onBack ? (
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 active:scale-95 transition-all flex items-center justify-center border border-white/15 backdrop-blur-md text-white shadow-md"
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          <div />
        )}

        {onOptionsClick && (
          <button
            onClick={onOptionsClick}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 active:scale-95 transition-all flex items-center justify-center border border-white/15 backdrop-blur-md text-white shadow-md"
          >
            <MoreVertical size={18} />
          </button>
        )}
      </div>

      {/* Main Header Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-8 pt-2 pb-6">
        {/* Cover Artwork */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className={`relative mb-5 shadow-2xl shrink-0 overflow-hidden border border-white/20 bg-white/10 ${
            isArtist
              ? 'w-44 h-44 sm:w-56 sm:h-56 rounded-full'
              : 'w-48 h-48 sm:w-60 sm:h-60 rounded-3xl'
          }`}
        >
          <img
            src={thumbnail || '/icons/musify-icon.svg'}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/icons/musify-icon.svg';
            }}
          />
        </motion.div>

        {/* Type pill label */}
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-white/50 mb-1.5 select-none">
          {type}
        </span>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white max-w-2xl px-2 leading-tight">
          {title}
        </h1>

        {/* Artist Link Avatar (if album / playlist with creator) */}
        {artistAvatar && (
          <div
            onClick={artistAvatar.onClick}
            className={`mt-2.5 flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 transition-all select-none ${
              artistAvatar.onClick ? 'cursor-pointer active:scale-95' : ''
            }`}
          >
            <img
              src={artistAvatar.thumbnail || '/icons/musify-icon.svg'}
              alt={artistAvatar.name}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="text-xs font-bold text-white/90">
              {artistAvatar.name}
            </span>
          </div>
        )}

        {/* Subtitle / Metadata details */}
        {subtitle && !artistAvatar && (
          <p className="text-sm font-semibold text-white/75 mt-1.5 max-w-lg">
            {subtitle}
          </p>
        )}

        {meta && (
          <p className="text-xs font-medium text-white/45 mt-1">
            {meta}
          </p>
        )}

        {/* Custom children (e.g. subscriber pills, bio preview) */}
        {children && <div className="mt-3 w-full max-w-2xl">{children}</div>}

        {/* Action Bar (Play, Shuffle, Favorite) */}
        <div className="flex items-center justify-center gap-3 mt-6 w-full max-w-md">
          {/* Favorite button */}
          {onToggleLike && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onToggleLike}
              className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all shadow-md ${
                isLiked
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : 'bg-white/10 text-white/70 hover:text-white border-white/10 hover:bg-white/15'
              }`}
            >
              <Heart size={20} className={isLiked ? 'fill-rose-500 text-rose-500' : ''} />
            </motion.button>
          )}

          {/* Big Play Pill Button */}
          {onPlayClick && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onPlayClick}
              className="h-12 px-7 rounded-full flex items-center justify-center gap-2.5 text-white font-bold text-sm shadow-xl active:scale-95 transition-all flex-1 max-w-[200px]"
              style={{ backgroundColor: colors.primary }}
            >
              {isCurrentItemPlaying && isPlaying ? (
                <>
                  <Pause size={18} className="fill-white" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play size={18} className="fill-white ml-0.5" />
                  <span>Play</span>
                </>
              )}
            </motion.button>
          )}

          {/* Shuffle Button */}
          {onShuffleClick && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onShuffleClick}
              title="Shuffle"
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 transition-all flex items-center justify-center text-white/80 hover:text-white border border-white/10 shadow-md"
            >
              <Shuffle size={19} />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};
