import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Disc, ListMusic, Mic2, X, Play, Loader2 } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { LyricsData } from '../../types';

interface NowPlayingCompanionProps {
  onClose?: () => void;
  className?: string;
}

export const NowPlayingCompanion: React.FC<NowPlayingCompanionProps> = ({
  onClose,
  className = ''
}) => {
  const { currentTrack, isPlaying, currentTime, seek, queue, playTrack, reorderQueue } = usePlayer();
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState<'lyrics' | 'queue'>('lyrics');
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false);

  const activeLineRef = useRef<HTMLDivElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // Fetch lyrics when track changes
  useEffect(() => {
    let isCancelled = false;
    if (!currentTrack) {
      setLyricsData(null);
      return;
    }

    setLoadingLyrics(true);
    api.getLyrics(currentTrack)
      .then((data) => {
        if (!isCancelled) {
          setLyricsData(data);
          setLoadingLyrics(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setLyricsData({
            synced: false,
            lines: [],
            plain: 'Instrumental or lyrics unavailable.',
            source: 'none'
          });
          setLoadingLyrics(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentTrack]);

  // Current active lyric line
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

  // Smooth auto-scroll to current lyric line
  useEffect(() => {
    if (activeLineRef.current && lyricsContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentLineIndex]);

  if (!currentTrack) {
    return (
      <aside
        className={`w-80 lg:w-[340px] shrink-0 glass-panel border-l border-white/10 flex flex-col items-center justify-center p-6 text-center z-20 select-none ${className}`}
      >
        <div className="w-20 h-20 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mb-4 text-white/30">
          <Disc size={36} />
        </div>
        <h4 className="text-sm font-medium text-[var(--text-2)]">No audio playing</h4>
        <p className="text-xs text-[var(--text-3)] mt-1 max-w-[200px]">Search for a song</p>
      </aside>
    );
  }

  return (
    <aside
      className={`w-[360px] xl:w-[400px] shrink-0 rounded-[28px] glass-panel flex flex-col z-20 overflow-hidden select-none h-full min-h-0 ${className}`}
    >
      {/* Top Header Controls */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.06] border border-white/10">
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'lyrics'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Mic2 size={13} style={{ color: activeTab === 'lyrics' ? colors.primary : undefined }} />
            <span>Lyrics</span>
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'queue'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <ListMusic size={13} style={{ color: activeTab === 'queue' ? colors.primary : undefined }} />
            <span>Queue ({queue.length})</span>
          </button>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.05] hover:bg-white/[0.12] text-white/60 hover:text-white transition-colors"
            title="Collapse companion"
            aria-label="Collapse companion"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Main Companion Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col p-5">
        {/* 1. 3D Spinning Vinyl Turntable Centerpiece */}
        <div className="relative flex flex-col items-center my-2">
          {/* Ambient Glow removed per Section 6 */}

          {/* Vinyl Record */}
          <div className="relative w-48 h-48 lg:w-52 lg:h-52 rounded-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] border-2 border-white/10 p-1 bg-[#09090b]">
            <div
              className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center"
              style={{
                backgroundImage:
                  'radial-gradient(circle at center, #111 0%, #1c1c1f 35%, #0f0f12 50%, #202025 65%, #0d0d10 80%, #050507 100%)'
              }}
            >
              {/* Concentric Grooves */}
              <div className="absolute inset-0 rounded-full border border-white/[0.07] pointer-events-none scale-90" />
              <div className="absolute inset-0 rounded-full border border-white/[0.05] pointer-events-none scale-75" />
              <div className="absolute inset-0 rounded-full border border-white/[0.04] pointer-events-none scale-60" />

              {/* Center Album Art Label */}
              <div className="relative w-24 h-24 lg:w-26 lg:h-26 rounded-full overflow-hidden border-4 border-[#111115] shadow-2xl">
                <img
                  src={currentTrack.thumbnail || '/icons/musify-icon.svg'}
                  alt={currentTrack.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/icons/musify-icon.svg';
                  }}
                  className="w-full h-full object-cover"
                />
                {/* Center Spindle Hole */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0a0a0c] border border-white/30 shadow-inner" />
              </div>
            </div>
          </div>
        </div>

        {/* Track Title & Artist */}
        <div className="text-center mt-3 mb-4">
          <h3 className="text-base lg:text-lg font-black tracking-tight text-white truncate px-2">
            {currentTrack.title}
          </h3>
          <p
            className="text-xs font-semibold truncate mt-0.5"
            style={{ color: colors.primary }}
          >
            {currentTrack.artists?.map((a) => a.name).join(', ') || 'Unknown Artist'}
          </p>
        </div>

        {/* 2. Interactive Stage: Synchronized Lyrics OR Queue */}
        <div className="flex-1 min-h-[220px] flex flex-col">
          {activeTab === 'lyrics' ? (
            <div className="flex-1 flex flex-col relative overflow-hidden">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-bold tracking-normal text-white/40">
                  {lyricsData?.synced ? 'Live Synced Lyrics' : 'Lyrics'}
                </span>
                {lyricsData?.source && lyricsData.source !== 'none' && (
                  <span className="text-[10px] text-white/40 font-mono">
                    via {lyricsData.source}
                  </span>
                )}
              </div>

              {/* Karaoke Scroller */}
              <div
                ref={lyricsContainerRef}
                className="flex-1 overflow-y-auto no-scrollbar mask-gradient py-6 space-y-4 text-center"
              >
                {loadingLyrics ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-white/40">
                    <Loader2 size={20} className="animate-spin text-[var(--text-3)]" />
                    <span className="text-xs font-medium">Aligning lyrics...</span>
                  </div>
                ) : lyricsData?.synced && lyricsData.lines.length > 0 ? (
                  lyricsData.lines.map((line, idx) => {
                    const isCurrent = idx === currentLineIndex;

                    return (
                      <div
                        key={`${line.time}-${idx}`}
                        ref={isCurrent ? activeLineRef : null}
                        onClick={() => seek(line.time)}
                        className={`transition-colors duration-300 px-3 cursor-pointer select-none ${
                          isCurrent
                            ? 'text-white font-black text-lg lg:text-xl scale-105 '
                            : 'text-white/30 hover:text-white/70 font-semibold text-xs lg:text-sm'
                        }`}
                      >
                        {line.text || '...'}
                      </div>
                    );
                  })
                ) : lyricsData?.plain ? (
                  <div className="text-xs text-white/60 leading-relaxed whitespace-pre-line px-2 font-medium">
                    {lyricsData.plain}
                  </div>
                ) : (
                  <div className="py-10 text-white/40 text-xs font-medium">
                    No lyrics found for this track.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Queue List */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-medium text-[var(--text-3)]">Up next ({queue.length})</span>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 pr-1">
                {queue.length === 0 ? (
                  <div className="py-10 text-center text-white/40 text-xs">
                    Queue is empty. Use "Play next" or "Add to queue" from any track menu.
                  </div>
                ) : (
                  queue.map((track, idx) => (
                    <div
                      key={`${track.id}-${idx}`}
                      onClick={() => playTrack(track, queue)}
                      className="group flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 cursor-pointer transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/10 shrink-0 relative">
                        <img
                          src={track.thumbnail || '/icons/musify-icon.svg'}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Play size={14} className="fill-white text-white ml-0.5" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate leading-tight">
                          {track.title}
                        </p>
                        <p className="text-[10px] text-white/50 truncate mt-0.5">
                          {track.artists?.map((a) => a.name).join(', ') || 'Unknown'}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          reorderQueue(queue.filter((_, i) => i !== idx));
                        }}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-opacity"
                        title="Remove from queue"
                        aria-label="Remove from queue"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
