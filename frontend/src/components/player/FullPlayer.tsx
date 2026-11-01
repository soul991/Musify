import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion, Variants, Transition } from 'framer-motion';
import {
  ChevronDown,
  Shuffle,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  ListMusic,
  Mic2,
  Moon,
  Sparkles,
  MoreVertical,
  Volume2,
  VolumeX,
  Headphones,
  Download,
  CheckCircle2,
  Disc
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useTheme } from '../../context/ThemeContext';
import { useLibrary } from '../../context/LibraryContext';
import { AdaptiveSeekbar } from './AdaptiveSeekbar';
import { FlowerPlayButton } from './FlowerPlayButton';
import { HeartBurstIcon } from './HeartBurstIcon';
import { PlayerSyncedLyricsView } from './PlayerSyncedLyricsView';
import { SyncedLyricsView } from '../lyrics/SyncedLyricsView';
import { QueueSheet } from './QueueSheet';
import { AudioOutputModal } from './AudioOutputModal';
import { api } from '../../services/api';
import { LyricsData } from '../../types';
import { springPlayerExpand } from '../../utils/motion';
import { ArtworkCrossfade } from './ArtworkCrossfade';
import { useAccentColor } from '../../utils/accentColor';

/**
 * Shared-element Player Expand & Collapse Physics (R3)
 * Calibrated: stiffness: 380, damping: 40, mass: 1 (zeta ~= 1.026 critically damped)
 */
export const PLAYER_EXPAND_PHYSICS = {
  stiffness: 380,
  damping: 40,
  mass: 1,
  zeta: 40 / (2 * Math.sqrt(380 * 1))
} as const;

export const CONTENT_FADE_DELAY_SECONDS = 0.08; // 80ms delay
export const CONTENT_FADE_DELAY_MS = 80;
export const REDUCED_MOTION_DURATION_SECONDS = 0.1; // 100ms
export const REDUCED_MOTION_DURATION_MS = 100;

export const SHARED_LAYOUT_IDS = {
  ARTWORK: 'player-artwork',
  TITLE: 'player-title',
  PLAY_BUTTON: 'player-play-button'
} as const;

export const ALLOWED_ANIMATED_PROPERTIES = [
  'transform',
  'opacity',
  'y',
  'scale',
  'scaleX',
  'scaleY',
  'rotate'
] as const;

export const PROHIBITED_ANIMATED_PROPERTIES = [
  'top',
  'bottom',
  'left',
  'right',
  'width',
  'height',
  'margin',
  'padding'
] as const;

export const playerContainerSpring: Transition = springPlayerExpand;

export const playerReducedMotionTransition: Transition = {
  duration: REDUCED_MOTION_DURATION_SECONDS,
  ease: 'linear'
};

export const interiorContentFadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      delay: CONTENT_FADE_DELAY_SECONDS,
      duration: 0.24,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: REDUCED_MOTION_DURATION_SECONDS,
      ease: 'linear'
    }
  }
};

export const interiorContentReducedVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: REDUCED_MOTION_DURATION_SECONDS,
      ease: 'linear'
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: REDUCED_MOTION_DURATION_SECONDS,
      ease: 'linear'
    }
  }
};

export const FullPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seek,
    nextTrack,
    prevTrack,
    isShuffled,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    isPlayerOpen,
    setIsPlayerOpen,
    sleepTimerMinutes,
    setSleepTimer,
    remainingSleepSeconds,
    volume = 1,
    setVolume,
    playbackSpeed,
    setPlaybackSpeed,
    audioOutputDeviceId
  } = usePlayer();

  const shouldReduceMotion = useReducedMotion();
  const activeSharedTransition = shouldReduceMotion
    ? playerReducedMotionTransition
    : playerContainerSpring;
  const activeInteriorVariants = shouldReduceMotion
    ? interiorContentReducedVariants
    : interiorContentFadeVariants;

  const [showOutputModal, setShowOutputModal] = useState(false);

  const { colors, playerStyle, setPlayerStyle } = useTheme();
  const { accentColor } = useAccentColor(currentTrack?.id, currentTrack?.thumbnail);
  const { isLiked, toggleLike } = useLibrary();

  const [activeSheet, setActiveSheet] = useState<'none' | 'lyrics' | 'queue'>('none');
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [isRotatingThumbnail, setIsRotatingThumbnail] = useState(false);
  const [volumeSliderHover, setVolumeSliderHover] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleArtMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({ x: (y / rect.height) * -14, y: (x / rect.width) * 14 });
  };

  const handleArtMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Background style selector (matching PlayerBackgroundStyle in PreferenceKeys.kt)
  const [bgStyle, _setBgStyle] = useState<'glow' | 'apple' | 'mesh' | 'gradient'>('glow');

  // Fetch lyrics for 1-line mini preview
  useEffect(() => {
    let cancelled = false;
    if (currentTrack) {
      api.getLyrics(currentTrack)
        .then((data) => {
          if (!cancelled) setLyricsData(data);
        })
        .catch(() => {
          if (!cancelled) setLyricsData(null);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [currentTrack]);

  // Close sub-sheets when full player closes
  useEffect(() => {
    if (!isPlayerOpen) {
      setActiveSheet('none');
      setShowSleepMenu(false);
      setShowMoreMenu(false);
    }
  }, [isPlayerOpen]);

  if (!currentTrack) return null;

  const liked = isLiked(currentTrack.id);
  const isMaterial = playerStyle === 'material';

  const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];
  const handleCycleSpeed = () => {
    const current = playbackSpeed || 1;
    const nextIdx = (SPEED_OPTIONS.indexOf(current) + 1) % SPEED_OPTIONS.length;
    setPlaybackSpeed(SPEED_OPTIONS[nextIdx]);
  };

  const formatSleepTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isPlayerOpen && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%', opacity: 0 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { y: '100%', opacity: 0 }}
          transition={shouldReduceMotion ? playerReducedMotionTransition : playerContainerSpring}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.05, bottom: 0.7 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 100 || info.velocity.y > 500) {
              setIsPlayerOpen(false);
            }
          }}
          data-testid="full-player-container"
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#0A0A0A] text-white select-none"
        >
          {/* Mobile Sheet Drag Handle */}
          <motion.div
            variants={activeInteriorVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mt-2.5 mb-0.5 shrink-0 cursor-grab active:cursor-grabbing sm:hidden"
          />
          {/* ========================================================= */}
          {/* BACKGROUND RENDERING ENGINES (Echo Music PlayerBackgroundStyle) */}
          {/* ========================================================= */}
          {bgStyle === 'apple' ? (
            /* Apple Music background: deep 150px blur backdrop + 65% height masked artwork */
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div
                className="absolute inset-0 scale-125 blur-[150px] opacity-70"
                style={{
                  backgroundImage: `url(${currentTrack.thumbnail})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <div
                className="absolute top-0 inset-x-0 h-[65%] opacity-40"
                style={{
                  backgroundImage: `url(${currentTrack.thumbnail})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  maskImage: 'linear-gradient(to bottom, black 0%, black 75%, rgba(0,0,0,0.4) 92%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 75%, rgba(0,0,0,0.4) 92%, transparent 100%)'
                }}
              />
              <div className="absolute inset-0 bg-black/40" />
            </div>
          ) : bgStyle === 'mesh' ? (
            /* Live Mesh background: 3 rotating saturated artwork discs */
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 80, repeat: isPlaying && !shouldReduceMotion ? Infinity : 0, ease: 'linear' }}
                className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] blur-[100px] opacity-60"
                style={{
                  backgroundImage: `url(${currentTrack.thumbnail})`,
                  backgroundSize: 'cover',
                  filter: 'saturate(1.8)'
                }}
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: isPlaying && !shouldReduceMotion ? Infinity : 0, ease: 'linear' }}
                className="absolute -top-[10%] left-[10%] w-[100%] h-[100%] blur-[120px] opacity-40"
                style={{
                  backgroundImage: `url(${currentTrack.thumbnail})`,
                  backgroundSize: 'cover',
                  filter: 'saturate(1.8)'
                }}
              />
              <div className="absolute inset-0 bg-black/35" />
            </div>
          ) : (
            /* Glow Animated / Dynamic Gradient background */
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div
                className="absolute inset-0 opacity-40"
                style={{ background: colors.gradientBackground }}
              />
              {/* 2 Animated Ambient Glowing Orbs */}
              <motion.div
                animate={{
                  x: [0, 40, -30, 0],
                  y: [0, -30, 20, 0],
                  scale: [1, 1.15, 0.95, 1]
                }}
                transition={{ duration: 20, repeat: isPlaying && !shouldReduceMotion ? Infinity : 0, ease: 'easeInOut' }}
                className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full blur-[120px] opacity-70"
                style={{ backgroundColor: `${accentColor || colors.primary}66` }}
              />
              <motion.div
                animate={{
                  x: [0, -40, 30, 0],
                  y: [0, 30, -20, 0],
                  scale: [1, 0.9, 1.1, 1]
                }}
                transition={{ duration: 18, repeat: isPlaying && !shouldReduceMotion ? Infinity : 0, ease: 'easeInOut' }}
                className="absolute top-[35%] -left-[15%] w-[420px] h-[420px] rounded-full blur-[100px] opacity-45"
                style={{ backgroundColor: `${colors.secondary}66` }}
              />
              <div className="absolute inset-0 bg-black/30" />
            </div>
          )}

          {/* ========================================================= */}
          {/* TOP BAR NAVIGATION (Interior Header with 80ms delayed fade) */}
          {/* ========================================================= */}
          <motion.div
            variants={activeInteriorVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            data-testid="player-interior-header"
            className="relative z-20 flex items-center justify-between px-6 pt-5 pb-2"
          >
            <button
              onClick={() => setIsPlayerOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-colors flex items-center justify-center border border-white/15 backdrop-blur-md shadow-md"
              aria-label="Collapse player"
            >
              <ChevronDown size={22} className="text-white" />
            </button>

            {/* Design Branch Switcher: Apple Inspired vs Material You */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPlayerStyle(isMaterial ? 'apple' : 'material')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 text-xs font-bold tracking-wider text-white/90 shadow-md transition-colors active:scale-95"
              >
                <Sparkles size={12} className="text-[var(--accent-color)]" />
                <span>{isMaterial ? 'MATERIAL YOU' : 'APPLE INSPIRED'}</span>
              </button>
            </div>

            {/* Vinyl Record Mode & Sleep Timer */}
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => setIsRotatingThumbnail(!isRotatingThumbnail)}
                title={isRotatingThumbnail ? 'Switch to Album Art' : 'Switch to Vinyl Turntable'}
                aria-label={isRotatingThumbnail ? 'Switch to Album Art' : 'Switch to Vinyl Turntable'}
                className={`w-10 h-10 rounded-full transition-colors flex items-center justify-center border backdrop-blur-md shadow-md active:scale-95 ${
                  isRotatingThumbnail
                    ? 'bg-[var(--accent-color)] text-black border-[var(--accent-color)]'
                    : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
                }`}
              >
                <Disc size={18} className={isRotatingThumbnail && isPlaying ? 'animate-spin' : ''} />
              </button>

              <button
                onClick={() => setShowSleepMenu(!showSleepMenu)}
                title={remainingSleepSeconds ? `Sleep timer: ${formatSleepTime(remainingSleepSeconds)}` : 'Sleep timer'}
                aria-label={remainingSleepSeconds ? `Sleep timer: ${formatSleepTime(remainingSleepSeconds)}` : 'Sleep timer'}
                className={`relative w-10 h-10 rounded-full transition-colors flex items-center justify-center border backdrop-blur-md shadow-md active:scale-95 ${
                  remainingSleepSeconds
                    ? 'bg-[var(--accent-color)]/25 border-[var(--accent-color)] text-[var(--accent-color)]'
                    : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
                }`}
              >
                <Moon size={18} />
                {remainingSleepSeconds ? (
                  <span className="absolute -bottom-1 -right-1 text-[9px] font-black px-1 rounded-full bg-[#E5303D] text-white leading-tight shadow-md">
                    {Math.ceil(remainingSleepSeconds / 60)}m
                  </span>
                ) : null}
              </button>

              {/* Sleep Menu Popup */}
              {showSleepMenu && (
                <div className="absolute right-0 top-12 w-48 rounded-2xl bg-[#18181D]/95 backdrop-blur-3xl border border-white/20 p-2 shadow-2xl flex flex-col gap-1 z-30">
                  <div className="px-3 py-1.5 text-xs font-bold text-white/50 uppercase tracking-wider">
                    Sleep Timer
                  </div>
                  {[
                    { label: 'Off', val: null },
                    { label: '15 Minutes', val: 15 },
                    { label: '30 Minutes', val: 30 },
                    { label: '45 Minutes', val: 45 },
                    { label: '60 Minutes', val: 60 }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSleepTimer(item.val);
                        setShowSleepMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/10 text-white flex items-center justify-between"
                    >
                      <span>{item.label}</span>
                      {sleepTimerMinutes === item.val && (
                        <CheckCircle2 size={13} className="text-[var(--accent-color)]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* ========================================================= */}
          {/* MAIN PLAYER BODY */}
          {/* ========================================================= */}
          <div className="relative z-10 flex-1 flex flex-col justify-between max-w-lg md:max-w-xl lg:max-w-2xl w-full mx-auto px-6 pt-3 pb-8 overflow-hidden">
            {/* TRACK ARTWORK / REALISTIC VINYL TURNTABLE */}
            <div className="flex-1 flex items-center justify-center min-h-0 my-auto py-2">
              {isRotatingThumbnail ? (
                /* Realistic Vinyl Turntable Mode */
                <div className="relative w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] lg:w-[420px] lg:h-[420px] flex items-center justify-center select-none">
                  {/* Vinyl Record Disc */}
                  <motion.div
                    animate={{ rotate: isPlaying ? 360 : 0 }}
                    transition={{ duration: 12, repeat: isPlaying && !shouldReduceMotion ? Infinity : 0, ease: 'linear' }}
                    onClick={() => setIsRotatingThumbnail(false)}
                    className="relative w-[280px] h-[280px] sm:w-[330px] sm:h-[330px] lg:w-[390px] lg:h-[390px] rounded-full cursor-pointer shadow-[0_25px_60px_rgba(0,0,0,0.9)] border-2 border-white/10 flex items-center justify-center overflow-hidden"
                    style={{
                      background:
                        'radial-gradient(circle, #25262c 0%, #16171d 40%, #0d0d11 100%), repeating-radial-gradient(circle, transparent 0, transparent 4px, rgba(255, 255, 255, 0.04) 5px, transparent 8px)'
                    }}
                  >
                    {/* Concentric sheen highlight overlays */}
                    <div
                      className="absolute inset-0 rounded-full opacity-25 pointer-events-none"
                      style={{
                        background:
                          'conic-gradient(from 45deg, transparent 0deg, rgba(255,255,255,0.2) 60deg, transparent 120deg, rgba(255,255,255,0.2) 240deg, transparent 300deg)'
                      }}
                    />

                    {/* Center Album Artwork Label */}
                    <div className="relative w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] lg:w-[150px] lg:h-[150px] rounded-full overflow-hidden border-2 border-white/30 shadow-inner flex items-center justify-center aspect-square">
                      <ArtworkCrossfade
                        trackId={currentTrack.id}
                        artworkUrl={currentTrack.thumbnail}
                        title={currentTrack.title}
                        artist={currentTrack.artists?.map((a) => a.name).join(', ')}
                        reducedMotion={shouldReduceMotion ?? false}
                        className="w-full h-full aspect-square rounded-full"
                      />
                      {/* Center Spindle Hole */}
                      <div className="absolute w-4 h-4 rounded-full bg-[#0B0C10] border border-white/60 shadow-lg pointer-events-none" />
                    </div>
                  </motion.div>

                  {/* Metallic Tonearm with Stylus */}
                  <motion.div
                    initial={{ rotate: -5 }}
                    animate={{ rotate: isPlaying ? 24 : -5 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 140 }}
                    style={{ transformOrigin: 'top right' }}
                    className="absolute top-2 right-4 w-[120px] sm:w-[150px] lg:w-[170px] h-[160px] sm:h-[200px] lg:h-[220px] pointer-events-none z-20"
                  >
                    {/* Tonearm Pivot Base */}
                    <div className="absolute top-0 right-0 w-8 h-8 rounded-full bg-gradient-to-br from-neutral-300 via-neutral-500 to-neutral-700 border border-white/40 shadow-xl flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-neutral-900 border border-neutral-400" />
                    </div>

                    {/* Metallic Arm Rod */}
                    <div
                      className="absolute top-4 right-3.5 w-1 h-[130px] sm:h-[165px] lg:h-[185px] bg-gradient-to-b from-neutral-200 via-neutral-400 to-neutral-600 rounded-full shadow-md"
                      style={{ transform: 'rotate(12deg)', transformOrigin: 'top center' }}
                    />

                    {/* Cartridge Head & Needle */}
                    <div
                      className="absolute bottom-1 left-4 w-4 h-7 rounded-sm bg-gradient-to-b from-neutral-700 to-neutral-900 border border-white/30 shadow-lg flex flex-col items-center justify-end"
                      style={{ transform: 'rotate(-10deg)' }}
                    >
                      <div className="w-1 h-2 bg-amber-400 rounded-full" />
                    </div>
                  </motion.div>
                </div>
              ) : (
                /* Standard Modern Rounded Artwork with Interactive 3D Tilt */
                <motion.div
                  layoutId="player-artwork"
                  transition={activeSharedTransition}
                  animate={{ scale: isPlaying ? 1.03 : 1.0 }}
                  onClick={() => setIsRotatingThumbnail(true)}
                  onMouseMove={handleArtMouseMove}
                  onMouseLeave={handleArtMouseLeave}
                  className="relative w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] lg:w-[400px] lg:h-[400px] aspect-square cursor-pointer drop-shadow-[0_25px_50px_rgba(0,0,0,0.85)] rounded-[28px] overflow-hidden border border-white/20 group"
                  style={{
                    transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                    transition: 'transform 0.15s ease-out',
                    boxShadow: `0 32px 80px -12px ${accentColor || colors.primary || "#E5303D"}80, 0 16px 32px -8px rgba(0,0,0,0.8)`
                  }}
                >
                  <ArtworkCrossfade
                    trackId={currentTrack.id}
                    artworkUrl={currentTrack.thumbnail}
                    title={currentTrack.title}
                    artist={currentTrack.artists?.map((a) => a.name).join(', ')}
                    reducedMotion={shouldReduceMotion ?? false}
                    className="w-full h-full aspect-square rounded-[28px]"
                  />
                  {/* Subtle Vinyl Mode Hint overlay */}
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 shadow-lg pointer-events-none">
                    <Disc size={12} />
                    <span>Turntable</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* COMPACT LIVE SYNCED LYRICS BANNER (80ms delayed fade) */}
            {lyricsData?.synced && lyricsData.lines.length > 0 && (
              <motion.div
                variants={activeInteriorVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                data-testid="player-interior-lyrics-banner"
              >
                <PlayerSyncedLyricsView
                  lines={lyricsData.lines}
                  currentTime={currentTime}
                  onOpenLyrics={() => setActiveSheet('lyrics')}
                />
              </motion.div>
            )}

            {/* TRACK METADATA + HEADER ACTION PILL BUTTONS */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="min-w-0 flex-1">
                <motion.h1
                  layoutId="player-title"
                  transition={activeSharedTransition}
                  className="text-xl sm:text-2xl font-black text-white truncate tracking-tight"
                >
                  {currentTrack.title}
                </motion.h1>
                <motion.p
                  variants={activeInteriorVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="text-sm sm:text-base font-semibold text-white/65 truncate mt-0.5"
                >
                  {currentTrack.artists?.map((a) => a.name).join(', ') || 'Unknown Artist'}
                </motion.p>
              </div>

              {/* Segmented Capsule Action Buttons (Material You: 50px-3px / 3px-50px) */}
              {isMaterial ? (
                <motion.div
                  variants={activeInteriorVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="flex items-center gap-1.5 shrink-0"
                >
                  {/* Share / Download Capsule */}
                  <button
                    onClick={() => {}}
                    className="w-11 h-11 bg-white/15 hover:bg-white/25 active:scale-95 rounded-l-[50px] rounded-r-[3px] border border-white/20 flex items-center justify-center text-white transition-colors shadow-md"
                    aria-label="Download song"
                  >
                    <Download size={18} />
                  </button>

                  {/* Heart Burst Favorite Capsule */}
                  <div className="w-11 h-11 bg-white/15 hover:bg-white/25 active:scale-95 rounded-l-[3px] rounded-r-[50px] border border-white/20 flex items-center justify-center text-white transition-colors shadow-md">
                    <HeartBurstIcon
                      isLiked={liked}
                      onToggle={() => toggleLike(currentTrack)}
                      size={20}
                    />
                  </div>
                </motion.div>
              ) : (
                /* Apple Inspired separate 40px rounded circles */
                <motion.div
                  variants={activeInteriorVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="flex items-center gap-2 shrink-0"
                >
                  <div className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 border border-white/20 flex items-center justify-center text-white transition-colors">
                    <HeartBurstIcon
                      isLiked={liked}
                      onToggle={() => toggleLike(currentTrack)}
                      size={20}
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* ADAPTIVE SEEKBAR (80ms delayed fade on opacity) */}
            <motion.div
              variants={activeInteriorVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              data-testid="player-interior-seekbar"
              className="pt-2"
            >
              <AdaptiveSeekbar
                value={currentTime}
                max={duration}
                isPlaying={isPlaying}
                accentColor="#E5303D"
                onSeek={seek}
              />
            </motion.div>

            {/* CONTROLS ROW: BRANCHING APPLE VS MATERIAL YOU */}
            {isMaterial ? (
              /* Material You 3-Circle Controls: 68px Prev, 84px Flower Play, 68px Next */
              <div className="flex items-center justify-center gap-6 py-2" data-testid="player-interior-controls">
                <motion.button
                  variants={activeInteriorVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  whileTap={{ scale: 0.90 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 500 }}
                  onClick={prevTrack}
                  className="w-[68px] h-[68px] rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center border border-white/20 shadow-lg transition-colors"
                  aria-label="Previous track"
                >
                  <SkipBack size={28} className="fill-current" />
                </motion.button>

                <FlowerPlayButton
                  isPlaying={isPlaying}
                  onClick={togglePlay}
                  size={84}
                  color="#E5303D"
                  iconColor="#FFFFFF"
                  styleType="wavy"
                  layoutId="player-play-button"
                />

                <motion.button
                  variants={activeInteriorVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  whileTap={{ scale: 0.90 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 500 }}
                  onClick={nextTrack}
                  className="w-[68px] h-[68px] rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center border border-white/20 shadow-lg transition-colors"
                  aria-label="Next track"
                >
                  <SkipForward size={28} className="fill-current" />
                </motion.button>
              </div>
            ) : (
              /* Apple Inspired Mode: 48px glyphs + 100px morphing squircle play button */
              <div className="flex flex-col gap-3 py-1" data-testid="player-interior-controls">
                <div className="flex items-center justify-between px-4">
                  <motion.button
                    variants={activeInteriorVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    onClick={prevTrack}
                    className="w-12 h-12 flex items-center justify-center text-white/90 hover:text-white active:scale-90 transition-colors"
                    aria-label="Previous track"
                  >
                    <SkipBack size={36} className="fill-current" />
                  </motion.button>

                  <FlowerPlayButton
                    isPlaying={isPlaying}
                    onClick={togglePlay}
                    size={96}
                    color="#E5303D"
                    iconColor="#FFFFFF"
                    styleType="apple_squircle"
                    layoutId="player-play-button"
                  />

                  <motion.button
                    variants={activeInteriorVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    onClick={nextTrack}
                    className="w-12 h-12 flex items-center justify-center text-white/90 hover:text-white active:scale-90 transition-colors"
                    aria-label="Next track"
                  >
                    <SkipForward size={36} className="fill-current" />
                  </motion.button>
                </div>

                {/* Apple-style Volume Slider Track */}
                <motion.div
                  variants={activeInteriorVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  data-testid="player-interior-volume"
                  onMouseEnter={() => setVolumeSliderHover(true)}
                  onMouseLeave={() => setVolumeSliderHover(false)}
                  className="flex items-center gap-3 px-2 pt-1"
                >
                  <VolumeX size={16} className="text-white/50" />
                  <div
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const newVol = Math.max(0, Math.min(1, x / rect.width));
                      if (setVolume) setVolume(newVol);
                    }}
                    className={`flex-1 rounded-full bg-white/20 cursor-pointer overflow-hidden transition-colors ${
                      volumeSliderHover ? 'h-3.5' : 'h-2'
                    }`}
                  >
                    <div
                      className="h-full bg-white/80 rounded-full origin-left"
                      style={{
                        width: '100%',
                        transform: `scaleX(${volume || 1})`,
                        transformOrigin: 'left center'
                      }}
                    />
                  </div>
                  <Volume2 size={16} className="text-white/50" />
                </motion.div>
              </div>
            )}

            {/* ========================================================= */}
            {/* BOTTOM BAR ACTION BUTTONS */}
            {/* ========================================================= */}
            {isMaterial ? (
              /* Material You: 42px Segmented Pill Group (Queue, Sleep, Lyrics, Shuffle, Repeat, More) */
              <motion.div
                variants={activeInteriorVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                data-testid="player-interior-triggers"
                className="flex items-center justify-between gap-1.5 pt-3"
              >
                <div className="flex items-center gap-1.5">
                  {/* Queue button: topStart 50px, bottomStart 50px, 3px right */}
                  <button
                    onClick={() => setActiveSheet('queue')}
                    className="w-[42px] h-[42px] rounded-l-[50px] rounded-r-[3px] bg-white/15 hover:bg-white/25 active:scale-95 border border-white/20 flex items-center justify-center text-white transition-colors shadow-md"
                    aria-label="Queue"
                  >
                    <ListMusic size={20} />
                  </button>

                  {/* Sleep Timer */}
                  <button
                    onClick={() => setShowSleepMenu(!showSleepMenu)}
                    aria-label="Sleep timer"
                    className={`h-[42px] px-3 rounded-[3px] border border-white/20 flex items-center justify-center gap-1 text-xs font-semibold transition-colors shadow-md ${
                      remainingSleepSeconds
                        ? 'bg-[var(--accent-color)] text-black font-bold'
                        : 'bg-white/15 hover:bg-white/25 text-white'
                    }`}
                  >
                    <Moon size={18} />
                    {remainingSleepSeconds ? (
                      <span>{formatSleepTime(remainingSleepSeconds)}</span>
                    ) : null}
                  </button>

                  {/* Lyrics Toggle */}
                  <button
                    onClick={() => setActiveSheet('lyrics')}
                    className="w-[42px] h-[42px] rounded-[3px] bg-white/15 hover:bg-white/25 active:scale-95 border border-white/20 flex items-center justify-center text-white transition-colors shadow-md"
                    aria-label="Synced lyrics"
                  >
                    <Mic2 size={19} />
                  </button>

                  {/* Shuffle Toggle */}
                  <button
                    onClick={toggleShuffle}
                    aria-label="Shuffle"
                    className={`w-[42px] h-[42px] rounded-[3px] border border-white/20 flex items-center justify-center transition-colors shadow-md ${
                      isShuffled
                        ? 'bg-[var(--accent-color)] text-black'
                        : 'bg-white/15 hover:bg-white/25 text-white'
                    }`}
                  >
                    <Shuffle size={18} />
                  </button>

                  {/* Repeat Toggle: 3px left, 50px right */}
                  <button
                    onClick={toggleRepeat}
                    aria-label={`Repeat mode: ${repeatMode}`}
                    className={`w-[42px] h-[42px] rounded-l-[3px] rounded-r-[50px] border border-white/20 flex items-center justify-center transition-colors shadow-md ${
                      repeatMode !== 'off'
                        ? 'bg-[var(--accent-color)] text-black'
                        : 'bg-white/15 hover:bg-white/25 text-white'
                    }`}
                  >
                    {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
                  </button>

                  {/* Playback Speed Toggle */}
                  <button
                    onClick={handleCycleSpeed}
                    className="h-[42px] px-2.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 border border-white/20 flex items-center justify-center text-xs font-bold text-white transition-colors shadow-md"
                    title={`Playback Speed: ${playbackSpeed || 1}x`}
                    aria-label={`Playback Speed: ${playbackSpeed || 1}x`}
                  >
                    {playbackSpeed || 1}x
                  </button>
                </div>

                {/* More vertical button: 42px circle */}
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="w-[42px] h-[42px] rounded-full bg-white/15 hover:bg-white/25 active:scale-95 border border-white/20 flex items-center justify-center text-white transition-colors shadow-md"
                  aria-label="More options"
                >
                  <MoreVertical size={20} />
                </button>
              </motion.div>
            ) : (
              /* Apple Inspired Mode Bottom Bar: Apple Queue, connected audio picker, speed, Apple Lyrics */
              <motion.div
                variants={activeInteriorVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                data-testid="player-interior-triggers"
                className="flex items-center justify-between px-2 pt-2"
              >
                <button
                  onClick={() => setActiveSheet('queue')}
                  className="w-11 h-11 flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-colors"
                  aria-label="Queue"
                >
                  <ListMusic size={26} />
                </button>

                {/* Connected Audio Output / Speed */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowOutputModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/15 hover:bg-white/25 active:scale-95 rounded-full border border-white/20 text-xs font-semibold text-white/90 transition-colors shadow-sm"
                    title="Change Audio Output Device"
                    aria-label="Change Audio Output Device"
                  >
                    <Headphones size={15} className="text-[#ED5564]" />
                    <span>{audioOutputDeviceId !== 'default' ? 'Connected Audio' : 'Audio Output'}</span>
                  </button>

                  <button
                    onClick={handleCycleSpeed}
                    className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white transition-colors"
                    title={`Playback Speed: ${playbackSpeed || 1}x`}
                    aria-label={`Playback Speed: ${playbackSpeed || 1}x`}
                  >
                    {playbackSpeed || 1}x
                  </button>
                </div>

                <button
                  onClick={() => setActiveSheet('lyrics')}
                  className="w-11 h-11 flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-colors"
                  aria-label="Synced lyrics"
                >
                  <Mic2 size={26} />
                </button>
              </motion.div>
            )}
          </div>

          {/* ========================================================= */}
          {/* BOTTOM SHEETS: FULL SYNCED LYRICS & UP NEXT QUEUE */}
          {/* ========================================================= */}
          <AnimatePresence>
            {activeSheet === 'lyrics' && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="absolute inset-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-3xl flex flex-col"
              >
                <SyncedLyricsView onClose={() => setActiveSheet('none')} />
              </motion.div>
            )}

            {activeSheet === 'queue' && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="absolute inset-x-0 bottom-0 top-16 z-40 bg-[#121212]/95 backdrop-blur-3xl rounded-t-[32px] border-t border-white/10 flex flex-col shadow-2xl"
              >
                <QueueSheet onClose={() => setActiveSheet('none')} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Audio Output & AirPlay / Chromecast Modal */}
          <AudioOutputModal isOpen={showOutputModal} onClose={() => setShowOutputModal(false)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
