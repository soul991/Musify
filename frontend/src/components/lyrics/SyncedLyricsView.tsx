import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, SkipBack, SkipForward, RefreshCw, Maximize2, Minimize2, Info } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { FlowerPlayButton } from '../player/FlowerPlayButton';
import { api } from '../../services/api';
import { LyricsData } from '../../types';
import { getButtonPressFeedback } from '../../utils/motion';
import {
  processLyrics,
  calculateWordProgress,
  findActiveLineIndex,
  LyricWord as LyricWordType,
  ProcessedLyricLine
} from '../../utils/lyrics';

interface SyncedLyricsViewProps {
  onClose: () => void;
}

export interface LyricWordProps {
  word: LyricWordType;
  progress: number;
  isLineActive: boolean;
  isFullscreen: boolean;
  prefersReducedMotion: boolean;
  onWordClick?: (time: number) => void;
}

/**
 * Memoized single word element for word-by-word synchronized lyrics (R2).
 * Only the currently active word re-renders during progress ticks.
 * Uses transform: scaleX clip/mask to fill the current word with zero layout reflow,
 * counter-scaling the inner text to preserve exact font kerning and geometry.
 */
export const LyricWord = React.memo<LyricWordProps>(
  ({ word, progress, isLineActive, isFullscreen, prefersReducedMotion, onWordClick }) => {
    const p = Math.max(0, Math.min(1, progress));
    const isUnfilled = p <= 0;
    const isFilling = p > 0 && p < 1;

    // Word click seeks directly to this word's start time
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onWordClick) {
        onWordClick(word.startTime);
      }
    };

    return (
      <span
        onClick={handleClick}
        className="relative inline-block select-none mr-[0.28em] last:mr-0 align-baseline cursor-pointer"
        data-testid="lyric-word"
        data-word={word.text}
        data-progress={p.toFixed(3)}
        data-estimated={String(word.isEstimated)}
        title={word.isEstimated ? 'Estimated word sync' : 'Accurate word sync'}
      >
        {/* Base layer: Dimmed/unhighlighted text in standard document flow */}
        <span
          className={`inline-block ${
            'text-[var(--text-3)]'
          }`}
        >
          {word.text}
        </span>

        {/* Highlighted active layer: Clipped via transform: scaleX on compositor, NOT width */}
        <span
          className="absolute inset-0 overflow-hidden pointer-events-none"
          data-testid="lyric-word-fill"
          style={{
            transform: prefersReducedMotion
              ? p >= 0.5 ? 'scaleX(1)' : 'scaleX(0)'
              : `scaleX(${p})`,
            transformOrigin: 'left center',
            visibility: isUnfilled && !prefersReducedMotion ? 'hidden' : 'visible',
            willChange: isFilling ? 'transform' : undefined,
          }}
        >
          {/* Inner counter-scaled text preserving exact font geometry and letter kerning */}
          <span
            className="inline-block text-[var(--text-1)] whitespace-nowrap"
            style={{
              transform: prefersReducedMotion || p <= 0 ? 'scaleX(1)' : `scaleX(${1 / p})`,
              transformOrigin: 'left center',
            }}
          >
            {word.text}
          </span>
        </span>
      </span>
    );
  },
  (prevProps, nextProps) => {
    // Strictly re-render only if progress, active state, fullscreen, or reduced motion changes
    return (
      prevProps.progress === nextProps.progress &&
      prevProps.isLineActive === nextProps.isLineActive &&
      prevProps.isFullscreen === nextProps.isFullscreen &&
      prevProps.prefersReducedMotion === nextProps.prefersReducedMotion &&
      prevProps.word.id === nextProps.word.id
    );
  }
);

LyricWord.displayName = 'LyricWord';

export const SyncedLyricsView: React.FC<SyncedLyricsViewProps> = ({ onClose }) => {
  const {
    currentTrack,
    currentTime,
    duration,
    seek,
    togglePlay,
    isPlaying,
    prevTrack,
    nextTrack
  } = usePlayer();

  const [rawLyricsData, setRawLyricsData] = useState<LyricsData | null>(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
  );
  const buttonFeedback = getButtonPressFeedback(prefersReducedMotion);

  const [lineOffsets, setLineOffsets] = useState<number[]>([]);
  const [containerHeight, setContainerHeight] = useState<number>(600);

  const containerRef = useRef<HTMLDivElement>(null);
  const lineElementsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Detect prefers-reduced-motion media query
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (typeof document !== 'undefined' && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!(typeof document !== 'undefined' && document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Fetch lyrics when track changes
  useEffect(() => {
    let cancelled = false;
    if (!currentTrack) {
      return;
    }

    setLoadingLyrics(true);
    api.getLyrics(currentTrack)
      .then((data) => {
        if (!cancelled) {
          setRawLyricsData(data);
          setLoadingLyrics(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRawLyricsData({
            synced: false,
            lines: [],
            plain: 'Unable to load lyrics.',
            source: 'none'
          });
          setLoadingLyrics(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentTrack]);

  // Process lyrics into word-level data structures with proportional character distribution
  const lyrics = useMemo(() => {
    return processLyrics(currentTrack ? rawLyricsData : null, duration);
  }, [currentTrack, rawLyricsData, duration]);

  // Compute active line index
  const currentLineIndex = useMemo(() => {
    if (!lyrics.synced || lyrics.lines.length === 0) return -1;
    return findActiveLineIndex(lyrics.lines, currentTime, 0.15);
  }, [lyrics, currentTime]);

  // Cache line geometric offsets using ResizeObserver (ZERO layout reads in animation loop)
  const updateLineOffsets = useCallback(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight);
    }
    const offsets: number[] = [];
    lineElementsRef.current.forEach((el) => {
      if (el) {
        offsets.push(el.offsetTop);
      }
    });
    setLineOffsets(offsets);
  }, []);

  useEffect(() => {
    updateLineOffsets();
  }, [lyrics, isFullscreen, updateLineOffsets]);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      updateLineOffsets();
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [updateLineOffsets]);

  // Handle manual user scrolling to pause auto-centering
  const handleUserWheelOrTouch = () => {
    if (isAutoScrollEnabled) {
      setIsAutoScrollEnabled(false);
    }
  };

  const reEnableAutoScroll = useCallback(() => {
    setIsAutoScrollEnabled(true);
  }, []);

  // Compute target scroll Y position for transform: translateY line scrolling (GPU Compositor)
  const targetScrollY = useMemo(() => {
    if (currentLineIndex < 0 || !lyrics.lines.length) return 0;
    const lineY = lineOffsets[currentLineIndex] ?? currentLineIndex * (isFullscreen ? 76 : 60);
    const centerTarget = containerHeight * 0.38;
    return Math.max(0, lineY - centerTarget);
  }, [currentLineIndex, lyrics.lines.length, isFullscreen, lineOffsets, containerHeight]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative text-white select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 px-4 pt-safe border-b border-white/10 shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15">
            <Sparkles size={15} className="text-[var(--accent)]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-normal text-white/90">
                Live Lyrics
              </span>
              {lyrics.synced && lyrics.isEstimated && (
                <span
                  data-testid="lyrics-estimated-badge"
                  className="px-1.5 py-0.5 rounded text-xs font-medium bg-white/10 text-white/60 flex items-center gap-1"
                  title="Word timestamps distributed by character count from line timestamps"
                >
                  <Info size={10} />
                  Estimated
                </span>
              )}
            </div>
            <p className="text-xs text-white/40 font-medium">
              {!lyrics.synced
                ? 'Unsynced / Instrumental'
                : lyrics.isEstimated
                ? 'Character-Distributed Word Sync'
                : 'Word-Accurate Sync'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileTap={buttonFeedback.whileTap}
            transition={buttonFeedback.transition}
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit Fullscreen Lyrics' : 'Fullscreen Lyrics'}
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-150 flex items-center justify-center border border-white/15 shadow-md text-white"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </motion.button>
          <motion.button
            type="button"
            whileTap={buttonFeedback.whileTap}
            transition={buttonFeedback.transition}
            onClick={onClose}
            aria-label="Close Lyrics"
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-150 flex items-center justify-center border border-white/15 shadow-md text-white"
          >
            <ChevronDown size={22} />
          </motion.button>
        </div>
      </div>

      {/* Lyrics Viewport Container */}
      <div
        ref={containerRef}
        onWheel={handleUserWheelOrTouch}
        onTouchMove={handleUserWheelOrTouch}
        className="flex-1 overflow-hidden px-4 sm:px-8 pt-8 pb-44 relative"
      >
        {loadingLyrics ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-white/40 my-auto">
            <div className={`w-8 h-8 border-2 border-white/20 border-t-white rounded-full ${prefersReducedMotion ? '' : 'animate-spin'}`} />
            <p className="text-xs font-semibold tracking-normal">Loading synced lyrics...</p>
          </div>
        ) : !lyrics.lines || lyrics.lines.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-8 text-white/40 gap-2 my-auto">
            <p className="text-xl font-bold text-white/70">
              {lyrics.plain || 'No synced lyrics available'}
            </p>
            <p className="text-xs">Enjoy the rhythm and beat</p>
          </div>
        ) : (
          /* Non-Reflow Line Scrolling: Container translated using transform: translateY (GPU compositor) */
          <motion.div
            data-testid="lyrics-scroll-track"
            animate={{
              y: isAutoScrollEnabled ? -targetScrollY : undefined,
            }}
            transition={
              prefersReducedMotion
                ? { duration: 0.1, ease: 'linear' }
                : { type: 'spring', stiffness: 380, damping: 40, mass: 1 }
            }
            style={{
              willChange: isAutoScrollEnabled ? 'transform' : undefined,
            }}
            className="flex flex-col gap-5 py-6 origin-top"
          >
            {lyrics.lines.map((line: ProcessedLyricLine, lineIdx: number) => {
              const isActive = lineIdx === currentLineIndex;
              const distance = Math.abs(lineIdx - currentLineIndex);

              // Calculate line-level opacity and scale
              let targetOpacity = 0.28;
              let scale = 0.96;

              if (isActive) {
                targetOpacity = 1.0;
                scale = isFullscreen ? 1.0 : 1.01;
              } else if (distance === 1) {
                targetOpacity = 0.60;
                scale = 0.98;
              } else if (distance === 2) {
                targetOpacity = 0.40;
                scale = 0.96;
              }

              return (
                <div
                  key={line.id}
                  ref={(el) => {
                    lineElementsRef.current[lineIdx] = el;
                  }}
                  data-testid="lyric-line"
                  data-line-index={lineIdx}
                  data-active={String(isActive)}
                  data-timestamp={line.time}
                  data-estimated={String(line.isEstimated)}
                  /* Click-to-Seek: Clicking any line seeks playback directly to line.time */
                  onClick={() => seek(line.time)}
                  className={`cursor-pointer origin-left py-2.5 px-3.5 rounded-2xl transition-colors duration-200 select-none ${
                    isActive ? 'bg-white/5' : 'hover:bg-white/[0.03]'
                  }`}
                  style={{
                    opacity: targetOpacity,
                    transform: prefersReducedMotion ? undefined : `scale(${scale})`,
                    transformOrigin: 'left center',
                    transition: prefersReducedMotion ? 'opacity 100ms linear' : 'opacity 200ms ease, transform 200ms ease'
                  }}
                >
                  <p
                    className={`${
                      isFullscreen
                        ? 'text-3xl sm:text-5xl md:text-6xl font-display'
                        : 'text-2xl sm:text-4xl font-display'
                    } tracking-tight leading-snug flex flex-wrap items-baseline`}
                    style={{ letterSpacing: '-0.5px' }}
                  >
                    {/* Render one memoized element per word (LyricWord) */}
                    {line.words.map((word) => {
                      let wordProgress = 0;
                      if (isActive) {
                        wordProgress = calculateWordProgress(
                          currentTime,
                          word.startTime,
                          word.endTime
                        );
                      } else if (lineIdx < currentLineIndex) {
                        wordProgress = 1;
                      } else {
                        wordProgress = 0;
                      }

                      return (
                        <LyricWord
                          key={word.id}
                          word={word}
                          progress={wordProgress}
                          isLineActive={isActive}
                          isFullscreen={isFullscreen}
                          prefersReducedMotion={prefersReducedMotion}
                          onWordClick={(seekTime) => seek(seekTime)}
                        />
                      );
                    })}
                  </p>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Floating Re-sync / Auto-Scroll Button */}
      <AnimatePresence>
        {!isAutoScrollEnabled && lyrics.synced && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0.1 } : { duration: 0.2 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 pointer-events-auto"
          >
            <motion.button
              type="button"
              whileTap={buttonFeedback.whileTap}
              transition={buttonFeedback.transition}
              onClick={reEnableAutoScroll}
              className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-xl border border-white/25 text-white text-xs font-bold tracking-normal flex items-center gap-2 shadow-2xl transition-colors duration-150"
            >
              <RefreshCw size={13} className={`${prefersReducedMotion ? '' : 'animate-spin'} text-[var(--accent)]`} />
              <span>Sync with playback</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Floating Playback Controls Dock in Lyrics View */}
      {currentTrack && (
        <div className="shrink-0 pt-2 pb-safe border-t border-white/10 bg-black/50 backdrop-blur-3xl rounded-3xl p-3 shadow-2xl flex flex-col gap-2 z-10">
          {/* Metadata row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 shrink-0 shadow-md border border-white/10">
                <img
                  src={currentTrack.thumbnail || '/icons/musify-icon.svg'}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (target.src.includes('maxresdefault.jpg')) {
                      target.src = target.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                    } else if (!target.src.endsWith('/icons/musify-icon.svg')) {
                      target.src = '/icons/musify-icon.svg';
                    }
                  }}
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{currentTrack.title}</p>
                <p className="text-xs text-white/50 truncate">
                  {currentTrack.artists?.map((a) => a.name).join(', ') || 'Artist'}
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold text-white/50 shrink-0">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Capsule seekbar */}
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const percent = Math.max(0, Math.min(1, clickX / rect.width));
              seek(percent * duration);
            }}
            className="w-full h-1.5 rounded-full bg-white/20 cursor-pointer overflow-hidden"
          >
            <div
              className="h-full bg-white rounded-full origin-left"
              style={{
                width: '100%',
                transform: `scaleX(${progressPercent / 100})`,
                transformOrigin: 'left center'
              }}
            />
          </div>

          {/* Controls: Prev, Center Flower Play, Next */}
          <div className="flex items-center justify-center gap-5 pt-1">
            <motion.button
              type="button"
              whileTap={buttonFeedback.whileTap}
              transition={buttonFeedback.transition}
              onClick={prevTrack}
              aria-label="Previous track"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-150 flex items-center justify-center text-white"
            >
              <SkipBack size={18} className="fill-current" />
            </motion.button>

            <FlowerPlayButton
              isPlaying={isPlaying}
              onClick={togglePlay}
              size={52}
              color="#FFFFFF"
              iconColor="#000000"
            />

            <motion.button
              type="button"
              whileTap={buttonFeedback.whileTap}
              transition={buttonFeedback.transition}
              onClick={nextTrack}
              aria-label="Next track"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-150 flex items-center justify-center text-white"
            >
              <SkipForward size={18} className="fill-current" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};
