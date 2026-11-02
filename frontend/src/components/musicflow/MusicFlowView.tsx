import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Heart,
  ChevronUp,
  ChevronDown,
  Mic2,
  Share2,
  ListPlus,
  MoreVertical,
  Download,
  Check,
  Radio,
  ArrowLeft
, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { usePlayer } from '../../context/PlayerContext';
import { useLibrary } from '../../context/LibraryContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { LyricLine } from '../../types';
import { HeartBurstIcon } from '../player/HeartBurstIcon';
import { SyncedLyricsView } from '../lyrics/SyncedLyricsView';

interface MusicFlowViewProps {
  onSelectArtist?: (artistId: string) => void;
  onBackToHome?: () => void;
}

export const MusicFlowView: React.FC<MusicFlowViewProps> = ({ onSelectArtist, onBackToHome }) => {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    playTrack,
    nextTrack,
    prevTrack,
    currentTime,
    duration,
    seek
  } = usePlayer();
  const { isLiked, toggleLike } = useLibrary();
  const { colors } = useTheme();

  const [lyricsLines, setLyricsLines] = useState<LyricLine[]>([]);
  const [showFullLyricsSheet, setShowFullLyricsSheet] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const lastTapRef = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  // Fetch lyrics for current track in flow
  useEffect(() => {
    let cancelled = false;
    if (!currentTrack) return;

    api
      .getLyrics(currentTrack)
      .then((data) => {
        if (!cancelled) {
          if (data && data.synced) {
            setLyricsLines(data.lines);
          } else {
            setLyricsLines([]);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setLyricsLines([]);
      });

    return () => {
      cancelled = true;
    };
  }, [currentTrack]);

  // Find active line & upcoming line matching Echo Music 2-line lyrics
  const activeIdx =
    lyricsLines.length > 0 ? lyricsLines.findLastIndex((l) => currentTime >= l.time) : -1;
  const currentLine = activeIdx !== -1 ? lyricsLines[activeIdx] : null;
  const nextLine =
    activeIdx !== -1 && activeIdx + 1 < lyricsLines.length ? lyricsLines[activeIdx + 1] : null;

  if (!currentTrack) {
    return (
      <div className="flex-1 h-screen flex flex-col items-center justify-center text-white/50 gap-6 p-8 bg-black select-none relative">
        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="absolute top-4 left-4 z-30 pt-safe w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-colors text-white border border-white/10 flex items-center justify-center shadow-lg"
            title="Back to Home"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        <div className="relative flex items-center justify-center">
          <div
            className="w-24 h-24 rounded-full border flex items-center justify-center"
            style={{
              backgroundColor: `${colors.primary}20`,
              borderColor: `${colors.primary}40`
            }}
          >
            <Radio size={44} style={{ color: colors.primary }} />
          </div>
        </div>

        <div className="text-center max-w-sm">
          <h2 className="text-2xl font-black tracking-tight text-white mb-2">Music Flow</h2>
          <p className="text-sm font-medium text-white/60">
            Endless vertical music discovery feed with live synchronized lyrics and gesture controls.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs mt-2">
          <button
            onClick={async () => {
              try {
                const res = await api.search('India biggest hits chartbusters 2026', 'songs');
                if (res.songs && res.songs.length > 0) {
                  playTrack(res.songs[0], res.songs);
                }
              } catch {
                // ignore
              }
            }}
            className="w-full py-3.5 px-6 rounded-full text-white font-extrabold text-sm shadow-xl active:scale-95 transition-colors flex items-center justify-center gap-2"
            style={{ backgroundColor: colors.primary }}
          >
            <Play size={18} className="fill-white" />
            <span>Start Flow Radio</span>
          </button>

          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="w-full py-3 px-6 rounded-full bg-white/10 hover:bg-white/15 text-white/80 hover:text-white font-bold text-xs tracking-normal transition-colors"
            >
              Back to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  const liked = isLiked(currentTrack.id);
  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const primaryArtist = currentTrack.artists?.[0];

  // Handle tap & double tap for Like / Play-pause
  const handleContainerClick = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      // Double tap -> Like with Confetti burst
      toggleLike(currentTrack);
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
          colors: [colors.primary, '#FFFFFF', 'var(--accent)']
        });
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (lastTapRef.current !== 0) {
          togglePlay();
          lastTapRef.current = 0;
        }
      }, 280);
    }
  };

  // Touch swipe handling for TikTok/Resso vertical paging (VerticalPager)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY < -60) {
      // Swiped up -> Next Track
      nextTrack();
    } else if (deltaY > 60) {
      // Swiped down -> Prev Track
      prevTrack();
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `Listen to "${currentTrack.title}" by ${
          currentTrack.artists?.map((a) => a.name).join(', ') || 'Artist'
        } on Musify: https://musify-live.netlify.app`
      );
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-full min-h-screen flex flex-col justify-between overflow-hidden bg-black select-none cursor-pointer text-white"
    >
      {/* =========================================================================
          1. BLURRED FULL-BLEED BACKDROP (80px blur, 4-stop dark vertical scrim)
          ========================================================================= */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src={currentTrack.thumbnail || '/icons/musify-icon.svg'}
          alt=""
          className="w-full h-full object-cover blur-[80px] scale-125 opacity-50"
        />
        {/* Scrim Gradient matching MusicFlowPage.kt lines 131-141 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 via-40% via-black/60 via-75% to-black/95" />
      </div>

      {/* Floating Back to Home Button */}
      {onBackToHome && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBackToHome();
          }}
          className="absolute top-4 left-4 z-30 pt-safe w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white/90 hover:text-white active:scale-95 transition-colors shadow-xl"
          title="Back to Home"
          aria-label="Back to Home"
        >
          <ArrowLeft size={20} />
        </button>
      )}

      {/* =========================================================================
          2. TOP BAR & 2-LINE LIVE SYNCED LYRICS (MusicFlowPage.kt)
          ========================================================================= */}
      <div className="relative z-10 pt-4 px-6 max-w-xl mx-auto w-full flex flex-col items-center">
        {/* Top Header Label */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-white/80 mb-3 shadow-sm">
          <Mic2 size={13} className="text-[var(--accent)]" />
          <span>MUSIC FLOW</span>
        </div>

        {/* 2-Line Synced Lyrics with 280ms Upward Slide */}
        <div className="min-h-[80px] w-full text-center flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {currentLine ? (
              <motion.div
                key={currentLine.time}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="flex flex-col items-center"
              >
                <p className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)] leading-tight [text-shadow:_0_0_30px_rgba(255,255,255,0.6)]">
                  {currentLine.text}
                </p>
                {nextLine && (
                  <p className="text-sm sm:text-base font-semibold text-white/45 mt-1.5 drop-shadow leading-snug">
                    {nextLine.text}
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-semibold text-white/50"
              >
                Enjoy the rhythm
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* =========================================================================
          3. CENTERED ARTWORK (24px radius, 56px play glyph when paused)
          ========================================================================= */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-8 py-2">
        <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square rounded-[24px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-white/20 bg-black/40">
          <img
            src={currentTrack.thumbnail || '/icons/musify-icon.svg'}
            alt={currentTrack.title}
            className="w-full h-full object-cover"
          />

          {/* 56px Play Glyph centered inside artwork when paused (Echo Music line 178) */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-2xl">
                <Play size={32} className="fill-white/85 ml-1 text-white/85" />
              </div>
            </div>
          )}
        </div>

        {/* Right Vertical Pager Buttons (For desktop mouse users) */}
        <div
          className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex flex-col gap-2 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={prevTrack}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-colors shadow-md"
            title="Previous song (Swipe down)"
            aria-label="Previous song"
          >
            <ChevronUp size={22} />
          </button>
          <button
            onClick={nextTrack}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-colors shadow-md"
            title="Next song (Swipe up)"
            aria-label="Next song"
          >
            <ChevronDown size={22} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          4. BOTTOM METADATA, 48PX ACTION RAIL, AND SCRUBBER
          ========================================================================= */}
      <div
        className="relative z-10 px-6 sm:px-10 pb-8 max-w-xl mx-auto w-full flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title, Artist, and "View Artist" Outlined Pill */}
        <div className="flex flex-col">
          <h2 className="text-xl sm:text-2xl font-black text-white truncate leading-tight">
            {currentTrack.title}
          </h2>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-semibold text-white/75 truncate">
              {currentTrack.artists?.map((a) => a.name).join(', ') || 'Unknown Artist'}
            </span>

            {primaryArtist && primaryArtist.id && (
              <button
                onClick={() => onSelectArtist?.(primaryArtist.id!)}
                className="shrink-0 text-xs font-bold text-white/80 hover:text-white border border-white/40 hover:border-white/70 rounded-full px-2.5 py-0.5 backdrop-blur-md transition-colors active:scale-95"
              >
                View artist
              </button>
            )}
          </div>
        </div>

        {/* 48px Action Rail (Like, Lyrics, Share, Download, Add to playlist) */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Like */}
            <button
              onClick={() => toggleLike(currentTrack)}
              className="w-11 h-11 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-90 transition-colors"
              title={liked ? 'Unlike' : 'Like'}
              aria-label={liked ? 'Unlike' : 'Like'}
            >
              <HeartBurstIcon isLiked={liked} size={22} />
            </button>

            {/* Lyrics Sheet Toggle */}
            <button
              onClick={() => setShowFullLyricsSheet(true)}
              className="w-11 h-11 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-90 transition-colors"
              title="Full Lyrics"
              aria-label="Full Lyrics"
            >
              <Mic2 size={20} />
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="w-11 h-11 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-90 transition-colors relative"
              title="Share"
              aria-label="Share"
            >
              {copiedShare ? (
                <Check size={20} className="text-green-400" />
              ) : (
                <Share2 size={20} />
              )}
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Download / Offline */}
            <button
              onClick={() => setDownloaded(!downloaded)}
              className="w-11 h-11 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-90 transition-colors"
              title={downloaded ? 'Downloaded' : 'Download for offline'}
              aria-label={downloaded ? 'Downloaded' : 'Download for offline'}
            >
              <Download
                size={20}
                className={downloaded ? 'text-[var(--accent)]' : 'text-white/80'}
              />
            </button>

            {/* Add to Playlist */}
            <button
              onClick={() => {
                /* Add to playlist modal */
              }}
              className="w-11 h-11 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-90 transition-colors"
              title="Add to Playlist"
              aria-label="Add to Playlist"
            >
              <ListPlus size={20} />
            </button>
          </div>
        </div>

        {/* Bottom 2px Scrubber Line with 8px Thumb */}
        <div
          className="relative w-full h-3 flex items-center cursor-pointer group"
          role="slider"
          aria-label="Playback progress"
          aria-valuenow={Math.round(progressRatio * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            seek(clickPos * duration);
          }}
        >
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-[width] duration-150 rounded-full"
              style={{ width: `${progressRatio * 100}%` }}
            />
          </div>
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-md pointer-events-none transition-transform"
            style={{ left: `calc(${progressRatio * 100}% - 5px)` }}
          />
        </div>
      </div>

      {/* =========================================================================
          5. FULL-SCREEN LYRICS BOTTOM SHEET MODAL (Apple Music Style)
          ========================================================================= */}
      <AnimatePresence>
        {showFullLyricsSheet && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-0 z-50 bg-[#0E0F14]/95 backdrop-blur-3xl flex flex-col p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Mic2 size={18} className="text-[var(--accent)]" />
                <h3 className="text-lg font-bold text-white">Live Synced Lyrics</h3>
              </div>
              <button
                onClick={() => setShowFullLyricsSheet(false)}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white font-bold"
                aria-label="Close lyrics"
              ><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-hidden pt-4">
              <SyncedLyricsView onClose={() => setShowFullLyricsSheet(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
