import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, SkipBack, SkipForward, RefreshCw, Volume2, Maximize2, Minimize2 } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useTheme } from '../../context/ThemeContext';
import { FlowerPlayButton } from '../player/FlowerPlayButton';
import { api } from '../../services/api';
import { LyricsData, LyricLine } from '../../types';

interface SyncedLyricsViewProps {
  onClose: () => void;
}

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

  const { colors } = useTheme();
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeLineRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      setLyricsData(null);
      return;
    }

    setLoadingLyrics(true);
    api.getLyrics(currentTrack)
      .then((data) => {
        if (!cancelled) {
          setLyricsData(data);
          setLoadingLyrics(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLyricsData({
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

  // Compute current line index
  const currentLineIndex = useMemo(() => {
    if (!lyricsData || !lyricsData.synced || !lyricsData.lines.length) return -1;
    let idx = -1;
    for (let i = 0; i < lyricsData.lines.length; i++) {
      if (lyricsData.lines[i].time <= currentTime + 0.15) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [lyricsData, currentTime]);

  // Auto-scroll to active lyric line if enabled
  useEffect(() => {
    if (isAutoScrollEnabled && scrollContainerRef.current) {
      const scrollTimer = setTimeout(() => {
        if (activeLineRef.current) {
          activeLineRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 50);
      return () => clearTimeout(scrollTimer);
    }
  }, [currentLineIndex, isAutoScrollEnabled, lyricsData]);

  // Detect manual user scroll to pause auto-scroll
  const handleScroll = () => {
    if (!isUserScrollingRef.current) {
      isUserScrollingRef.current = true;
    }
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    userScrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 150);
  };

  const handleUserWheelOrTouch = () => {
    if (isAutoScrollEnabled) {
      setIsAutoScrollEnabled(false);
    }
  };

  const reEnableAutoScroll = useCallback(() => {
    setIsAutoScrollEnabled(true);
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, []);

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
      <div className="flex items-center justify-between pb-3 px-3 pt-safe border-b border-white/10 shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15">
            <Sparkles size={15} className="text-[var(--accent-color)]" />
          </div>
          <div>
            <span className="text-xs font-black tracking-normal text-white/90">
              Live Lyrics
            </span>
            <p className="text-[10px] text-white/40 font-medium">
              {lyricsData?.synced ? 'Synced LRCLIB' : 'Unsynced / Instrumental'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit Fullscreen Lyrics' : 'Fullscreen Lyrics'}
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-colors flex items-center justify-center border border-white/15 shadow-md text-white"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button
            onClick={onClose}
            aria-label="Close Lyrics"
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-colors flex items-center justify-center border border-white/15 shadow-md"
          >
            <ChevronDown size={22} />
          </button>
        </div>
      </div>

      {/* Lyrics Scroll View */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onWheel={handleUserWheelOrTouch}
        onTouchMove={handleUserWheelOrTouch}
        className="flex-1 overflow-y-auto px-4 sm:px-8 pt-10 pb-44 flex flex-col gap-6 no-scrollbar scroll-smooth relative"
      >
        {loadingLyrics ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/40 my-auto">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-xs font-semibold tracking-normal">Loading synced lyrics...</p>
          </div>
        ) : !lyricsData?.lines || lyricsData.lines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 text-white/40 gap-2 my-auto">
            <p className="text-xl font-bold text-white/70">
              {lyricsData?.plain || 'No synced lyrics available'}
            </p>
            <p className="text-xs">Enjoy the rhythm and beat</p>
          </div>
        ) : (
          lyricsData.lines.map((line: LyricLine, idx: number) => {
            const isActive = idx === currentLineIndex;
            const distance = Math.abs(idx - currentLineIndex);

            // Compute crisp, clear opacity matching Apple Music & MetroLyrics
            let targetOpacity = 0.25;
            let scale = 0.95;

            if (isFullscreen) {
              if (isActive) {
                targetOpacity = 1.0;
                scale = 1.0;
              } else {
                targetOpacity = 0.40;
                scale = 0.96;
              }
            } else {
              if (isActive) {
                targetOpacity = 1.0;
                scale = 1.02;
              } else if (distance === 1) {
                targetOpacity = 0.65;
                scale = 0.98;
              } else if (distance === 2) {
                targetOpacity = 0.45;
                scale = 0.96;
              } else if (distance === 3) {
                targetOpacity = 0.35;
                scale = 0.95;
              }
            }

            return (
              <motion.div
                key={`${line.time}-${idx}`}
                ref={isActive ? activeLineRef : null}
                onClick={() => seek(line.time)}
                animate={{
                  scale,
                  opacity: targetOpacity
                }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className={`cursor-pointer transition-colors duration-300 origin-left py-2 px-3 rounded-2xl hover:opacity-80 ${
                  isActive ? 'bg-white/5' : ''
                }`}
              >
                {isActive ? (
                  /* Active Karaoke Line: Solid Pure White with Apple-style Ambient Bloom Glow */
                  <p
                    className={`${
                      isFullscreen
                        ? 'text-3xl sm:text-5xl md:text-6xl font-display text-[var(--text-1)] '
                        : 'text-2xl sm:text-4xl font-display text-[var(--text-1)] '
                    } tracking-tight leading-snug`}
                    style={{ letterSpacing: '-0.5px' }}
                  >
                    {line.text}
                  </p>
                ) : (
                  /* Inactive Line */
                  <p
                    className={`${
                      isFullscreen
                        ? 'text-3xl sm:text-5xl md:text-6xl font-display text-[var(--text-3)]'
                        : 'text-2xl sm:text-4xl font-display text-[var(--text-3)]'
                    } tracking-tight leading-snug`}
                    style={{ letterSpacing: '-0.5px' }}
                  >
                    {line.text}
                  </p>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Floating Re-sync / Auto-Scroll Button */}
      <AnimatePresence>
        {!isAutoScrollEnabled && lyricsData?.synced && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 pointer-events-auto"
          >
            <button
              onClick={reEnableAutoScroll}
              className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-xl border border-white/25 text-white text-xs font-bold tracking-normal flex items-center gap-2 shadow-2xl transition-colors active:scale-95"
            >
              <RefreshCw size={13} className="animate-spin text-[var(--accent-color)]" />
              <span>Sync with playback</span>
            </button>
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
                <p className="text-[11px] text-white/50 truncate">
                  {currentTrack.artists?.map((a) => a.name).join(', ') || 'Artist'}
                </p>
              </div>
            </div>

            <span className="text-[11px] font-semibold text-white/50 shrink-0">
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
            className="w-full h-1.5 rounded-full bg-white/20 hover:h-2 transition-colors cursor-pointer overflow-hidden"
          >
            <div
              className="h-full bg-white rounded-full transition-colors duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Controls: Prev, Center Flower Play, Next */}
          <div className="flex items-center justify-center gap-5 pt-1">
            <button
              onClick={prevTrack}
              aria-label="Previous track"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-colors flex items-center justify-center text-white"
            >
              <SkipBack size={18} className="fill-current" />
            </button>

            <FlowerPlayButton
              isPlaying={isPlaying}
              onClick={togglePlay}
              size={52}
              color="#FFFFFF"
              iconColor="#000000"
            />

            <button
              onClick={nextTrack}
              aria-label="Next track"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-colors flex items-center justify-center text-white"
            >
              <SkipForward size={18} className="fill-current" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
