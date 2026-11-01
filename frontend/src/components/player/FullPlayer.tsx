import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Shuffle,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  ListMusic,
  Mic2,
  Moon,
  Headphones,
  CheckCircle2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useLibrary } from '../../context/LibraryContext';
import { CalmSeekbar } from './CalmSeekbar';
import { HeartBurstIcon } from './HeartBurstIcon';
import { PlayerSyncedLyricsView } from './PlayerSyncedLyricsView';
import { SyncedLyricsView } from '../lyrics/SyncedLyricsView';
import { QueueSheet } from './QueueSheet';
import { AudioOutputModal } from './AudioOutputModal';
import { api } from '../../services/api';
import { LyricsData } from '../../types';

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
    audioOutputDeviceId
  } = usePlayer();

  const { isLiked, toggleLike } = useLibrary();

  const [showOutputModal, setShowOutputModal] = useState(false);
  const [activeSheet, setActiveSheet] = useState<'none' | 'lyrics' | 'queue'>('none');
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);

  const desktopLyricsContainerRef = useRef<HTMLDivElement>(null);
  const desktopActiveLineRef = useRef<HTMLDivElement>(null);

  // Fetch lyrics when track changes
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
    }
  }, [isPlayerOpen]);

  // Compute current line index for lyrics
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

  // Auto-scroll desktop lyrics column to active line
  useEffect(() => {
    if (desktopActiveLineRef.current && desktopLyricsContainerRef.current) {
      desktopActiveLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentLineIndex]);

  if (!currentTrack) return null;

  const liked = isLiked(currentTrack.id);

  const formatSleepTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isPlayerOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 40, mass: 1 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.05, bottom: 0.7 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 100 || info.velocity.y > 500) {
              setIsPlayerOpen(false);
            }
          }}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[var(--bg-stage)] text-[var(--text-1)] select-none"
        >
          {/* Top Bar Navigation */}
          <div className="relative z-20 flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
            {/* Collapse button: touch target >= 44px */}
            <button
              onClick={() => setIsPlayerOpen(false)}
              className="w-11 h-11 rounded-full bg-[var(--bg-raised)] hover:bg-[#2c2c2f] active:scale-[0.97] transition-colors flex items-center justify-center border border-[var(--hairline)]"
              aria-label="Collapse player"
            >
              <ChevronDown size={22} className="text-[var(--text-1)]" />
            </button>

            {/* Mobile Sheet Drag Indicator */}
            <div className="w-10 h-1 rounded-full bg-[var(--hairline)] md:hidden" />

            {/* Right actions: Sleep timer & devices */}
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => setShowSleepMenu(!showSleepMenu)}
                title={remainingSleepSeconds ? `Sleep timer: ${formatSleepTime(remainingSleepSeconds)}` : 'Sleep timer'}
                aria-label={remainingSleepSeconds ? `Sleep timer: ${formatSleepTime(remainingSleepSeconds)}` : 'Sleep timer'}
                className={`w-11 h-11 rounded-full transition-colors flex items-center justify-center border border-[var(--hairline)] active:scale-[0.97] ${
                  remainingSleepSeconds
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-raised)] hover:bg-[#2c2c2f] text-[var(--text-2)] hover:text-[var(--text-1)]'
                }`}
              >
                <Moon size={18} />
              </button>

              {/* Sleep Menu Popup */}
              {showSleepMenu && (
                <div className="absolute right-0 top-12 w-48 rounded-2xl bg-[var(--bg-card)] border border-[var(--hairline)] p-2 shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex flex-col gap-1 z-30">
                  <div className="px-3 py-1.5 text-xs font-medium text-[var(--text-3)]">
                    Sleep timer
                  </div>
                  {[
                    { label: 'Off', val: null },
                    { label: '15 minutes', val: 15 },
                    { label: '30 minutes', val: 30 },
                    { label: '45 minutes', val: 45 },
                    { label: '60 minutes', val: 60 }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSleepTimer(item.val);
                        setShowSleepMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium hover:bg-[var(--bg-raised)] text-[var(--text-1)] flex items-center justify-between transition-colors"
                    >
                      <span>{item.label}</span>
                      {sleepTimerMinutes === item.val && (
                        <CheckCircle2 size={14} className="text-[var(--accent)]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* DESKTOP STAGE (1440x900) - Section 6 */}
          {/* Left: Artwork (>= 380px square, 16px radius, neutral shadow). Below it: title (Instrument Serif 32-36), artist, like heart */}
          {/* Right: Lyrics column in Instrument Serif; active line 36px --text-1, neighbours 28px --text-3, rest fade by opacity only */}
          {/* ========================================================= */}
          <div className="hidden md:flex flex-1 items-center justify-between max-w-6xl w-full mx-auto px-12 gap-16 min-h-0 py-4 overflow-hidden">
            {/* Left Column: Artwork + Metadata */}
            <div className="w-[380px] lg:w-[420px] shrink-0 flex flex-col justify-center">
              {/* Artwork: at least 380px square, 16px radius, neutral shadow, real art colors inside only */}
              <div className="w-[380px] h-[380px] lg:w-[420px] lg:h-[420px] rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.4)] border border-[var(--hairline)] bg-[var(--bg-card)] shrink-0">
                <img
                  src={currentTrack.thumbnail || '/icons/musify-icon.svg'}
                  alt={currentTrack.title}
                  width={420}
                  height={420}
                  loading="eager"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/icons/musify-icon.svg';
                  }}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title & Artist Row */}
              <div className="mt-5 min-w-0">
                <h1 className="font-display text-[34px] leading-tight text-[var(--text-1)] truncate">
                  {currentTrack.title}
                </h1>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-base text-[var(--text-2)] truncate pr-4">
                    {currentTrack.artists?.map((a) => a.name).join(', ') || 'Unknown Artist'}
                  </p>
                  <button
                    onClick={() => toggleLike(currentTrack)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-2)] hover:text-white transition-colors shrink-0 active:scale-[0.97]"
                    aria-label={liked ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <HeartBurstIcon isLiked={liked} size={22} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Lyrics in Instrument Serif */}
            <div className="flex-1 h-full max-h-[480px] flex flex-col justify-center overflow-hidden">
              <div
                ref={desktopLyricsContainerRef}
                className="flex-1 overflow-y-auto no-scrollbar mask-gradient py-8 space-y-6 select-none"
              >
                {lyricsData?.synced && lyricsData.lines.length > 0 ? (
                  lyricsData.lines.map((line, idx) => {
                    const isCurrent = idx === currentLineIndex;
                    const distance = Math.abs(idx - currentLineIndex);

                    let sizeClass = 'text-[24px] text-[var(--text-3)] opacity-30';
                    if (isCurrent) {
                      sizeClass = 'text-[36px] text-[var(--text-1)] opacity-100';
                    } else if (distance === 1) {
                      sizeClass = 'text-[28px] text-[var(--text-3)] opacity-70';
                    }

                    return (
                      <div
                        key={`${line.time}-${idx}`}
                        ref={isCurrent ? desktopActiveLineRef : null}
                        onClick={() => seek(line.time)}
                        className={`font-display transition-colors duration-200 cursor-pointer ${sizeClass}`}
                      >
                        {line.text}
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center text-[var(--text-3)] text-sm font-sans">
                    {lyricsData?.plain || 'No synced lyrics available'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* MOBILE STAGE (390x844) - Section 6 */}
          {/* Stacked order: Artwork, Title, Artist, Seek, Transport, Lyrics as second screen */}
          {/* ========================================================= */}
          <div className="md:hidden flex flex-col justify-between flex-1 px-6 pt-2 pb-6 min-h-0 overflow-y-auto no-scrollbar">
            {/* Artwork: full width minus 24px margins, 16px radius, neutral shadow */}
            <div className="w-full max-w-[342px] aspect-square rounded-2xl mx-auto shadow-[0_8px_24px_rgba(0,0,0,0.4)] border border-[var(--hairline)] overflow-hidden shrink-0 bg-[var(--bg-card)]">
              <img
                src={currentTrack.thumbnail || '/icons/musify-icon.svg'}
                alt={currentTrack.title}
                loading="eager"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/icons/musify-icon.svg';
                }}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title & Artist */}
            <div className="mt-3">
              <h1 className="font-display text-[28px] leading-tight text-[var(--text-1)] truncate">
                {currentTrack.title}
              </h1>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-sm text-[var(--text-2)] truncate pr-2">
                  {currentTrack.artists?.map((a) => a.name).join(', ') || 'Unknown Artist'}
                </p>
                <button
                  onClick={() => toggleLike(currentTrack)}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--text-2)] hover:text-white transition-colors shrink-0 active:scale-[0.97]"
                  aria-label={liked ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <HeartBurstIcon isLiked={liked} size={20} />
                </button>
              </div>
            </div>

            {/* Compact lyrics line banner (tap opens lyrics sheet) */}
            {lyricsData?.synced && lyricsData.lines.length > 0 && (
              <PlayerSyncedLyricsView
                lines={lyricsData.lines}
                currentTime={currentTime}
                onOpenLyrics={() => setActiveSheet('lyrics')}
              />
            )}

            {/* Seekbar */}
            <div className="pt-2">
              <CalmSeekbar
                value={currentTime}
                max={duration}
                accentColor="var(--accent)"
                onSeek={seek}
                showTimestamps={true}
              />
            </div>

            {/* Mobile Transport Row */}
            <div className="flex items-center justify-center gap-6 py-2">
              <button
                onClick={prevTrack}
                className="w-11 h-11 flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text-1)] active:scale-[0.97] transition-colors"
                aria-label="Previous track"
              >
                <SkipBack size={26} className="fill-current" />
              </button>

              {/* Play button: 56px, --accent, white icon, no glow per section 6 */}
              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white flex items-center justify-center transition-colors active:scale-[0.97] shadow-none"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause size={24} className="fill-current text-white" />
                ) : (
                  <Play size={24} className="fill-current text-white ml-0.5" />
                )}
              </button>

              <button
                onClick={nextTrack}
                className="w-11 h-11 flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text-1)] active:scale-[0.97] transition-colors"
                aria-label="Next track"
              >
                <SkipForward size={26} className="fill-current" />
              </button>
            </div>

            {/* Mobile Secondary Action Row: All >= 44px hit areas */}
            <div className="flex items-center justify-between px-2 pt-1 pb-safe">
              <button
                onClick={toggleShuffle}
                aria-label="Shuffle"
                className={`w-11 h-11 flex items-center justify-center rounded-full transition-colors active:scale-[0.97] ${
                  isShuffled ? 'text-[var(--accent-ink)]' : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
                }`}
              >
                <Shuffle size={18} />
              </button>

              <button
                onClick={() => setShowOutputModal(true)}
                aria-label="Audio devices"
                className="w-11 h-11 flex items-center justify-center rounded-full text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors active:scale-[0.97]"
              >
                <Headphones size={18} className={audioOutputDeviceId !== 'default' ? 'text-[var(--accent-ink)]' : ''} />
              </button>

              <button
                onClick={() => setActiveSheet('lyrics')}
                aria-label="Synced lyrics"
                className="w-11 h-11 flex items-center justify-center rounded-full text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors active:scale-[0.97]"
              >
                <Mic2 size={18} />
              </button>

              <button
                onClick={() => setActiveSheet('queue')}
                aria-label="Queue"
                className="w-11 h-11 flex items-center justify-center rounded-full text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors active:scale-[0.97]"
              >
                <ListMusic size={18} />
              </button>

              <button
                onClick={toggleRepeat}
                aria-label={`Repeat mode: ${repeatMode}`}
                className={`w-11 h-11 flex items-center justify-center rounded-full transition-colors active:scale-[0.97] ${
                  repeatMode !== 'off' ? 'text-[var(--accent-ink)]' : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
                }`}
              >
                {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* DESKTOP BOTTOM BAR (Seekbar & Transport) */}
          {/* Bottom: seek bar (4px track --bg-raised, fill --accent, 12px handle), transport: previous, play (56px, --accent, white icon), next; queue, devices, sleep timer as quiet icon buttons */}
          {/* ========================================================= */}
          <div className="hidden md:flex flex-col w-full max-w-6xl mx-auto px-12 pb-8 pt-2 shrink-0">
            {/* Seekbar */}
            <CalmSeekbar
              value={currentTime}
              max={duration}
              accentColor="var(--accent)"
              onSeek={seek}
              showTimestamps={true}
            />

            {/* Transport & Action Bar */}
            <div className="flex items-center justify-between pt-3">
              {/* Left Secondary Controls */}
              <div className="flex items-center gap-2 w-48">
                <button
                  onClick={toggleShuffle}
                  aria-label="Shuffle"
                  className={`w-11 h-11 flex items-center justify-center rounded-full transition-colors active:scale-[0.97] ${
                    isShuffled ? 'text-[var(--accent-ink)]' : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
                  }`}
                >
                  <Shuffle size={18} />
                </button>
                <button
                  onClick={toggleRepeat}
                  aria-label={`Repeat mode: ${repeatMode}`}
                  className={`w-11 h-11 flex items-center justify-center rounded-full transition-colors active:scale-[0.97] ${
                    repeatMode !== 'off' ? 'text-[var(--accent-ink)]' : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
                  }`}
                >
                  {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
                </button>
              </div>

              {/* Center Transport: Previous, Play (56px, --accent, white icon, no glow), Next */}
              <div className="flex items-center gap-6">
                <button
                  onClick={prevTrack}
                  className="w-11 h-11 flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text-1)] active:scale-[0.97] transition-colors"
                  aria-label="Previous track"
                >
                  <SkipBack size={26} className="fill-current" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white flex items-center justify-center transition-colors active:scale-[0.97] shadow-none"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause size={24} className="fill-current text-white" />
                  ) : (
                    <Play size={24} className="fill-current text-white ml-0.5" />
                  )}
                </button>

                <button
                  onClick={nextTrack}
                  className="w-11 h-11 flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text-1)] active:scale-[0.97] transition-colors"
                  aria-label="Next track"
                >
                  <SkipForward size={26} className="fill-current" />
                </button>
              </div>

              {/* Right Quiet Icon Buttons: Queue, Devices, Volume */}
              <div className="flex items-center justify-end gap-2 w-48">
                <button
                  onClick={() => setShowOutputModal(true)}
                  aria-label="Audio devices"
                  className="w-11 h-11 flex items-center justify-center rounded-full text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors active:scale-[0.97]"
                >
                  <Headphones size={18} className={audioOutputDeviceId !== 'default' ? 'text-[var(--accent-ink)]' : ''} />
                </button>

                <button
                  onClick={() => setActiveSheet('queue')}
                  aria-label="Queue"
                  className="w-11 h-11 flex items-center justify-center rounded-full text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors active:scale-[0.97]"
                >
                  <ListMusic size={18} />
                </button>

                {/* Volume slider */}
                <div className="flex items-center gap-2 pl-2">
                  <button
                    onClick={() => setVolume && setVolume(volume > 0 ? 0 : 1)}
                    className="text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"
                    aria-label={volume === 0 ? 'Unmute' : 'Mute'}
                  >
                    {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <div
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const newVol = Math.max(0, Math.min(1, x / rect.width));
                      if (setVolume) setVolume(newVol);
                    }}
                    className="w-20 h-1 rounded-full bg-[var(--bg-raised)] cursor-pointer overflow-hidden relative"
                  >
                    <div
                      className="h-full bg-[var(--text-2)] hover:bg-[var(--text-1)] transition-colors rounded-full"
                      style={{ width: `${(volume || 1) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-Sheets: Full Lyrics & Queue */}
          <AnimatePresence>
            {activeSheet === 'lyrics' && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 40, mass: 1 }}
                className="absolute inset-0 z-40 bg-[var(--bg-stage)] flex flex-col"
              >
                <SyncedLyricsView onClose={() => setActiveSheet('none')} />
              </motion.div>
            )}

            {activeSheet === 'queue' && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 40, mass: 1 }}
                className="absolute inset-x-0 bottom-0 top-16 z-40 bg-[var(--bg-card)] rounded-t-[20px] border-t border-[var(--hairline)] flex flex-col shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
              >
                <QueueSheet onClose={() => setActiveSheet('none')} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Audio Output Modal */}
          <AudioOutputModal isOpen={showOutputModal} onClose={() => setShowOutputModal(false)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
