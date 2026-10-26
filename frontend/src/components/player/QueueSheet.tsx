import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Trash2,
  Shuffle,
  Repeat,
  Repeat1,
  Radio,
  Lock,
  Unlock,
  GripVertical,
  Volume2,
  Sparkles,
  Plus
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useLibrary } from '../../context/LibraryContext';
import { Track } from '../../types';
import { HeartBurstIcon } from './HeartBurstIcon';

interface QueueSheetProps {
  onClose: () => void;
}

export const QueueSheet: React.FC<QueueSheetProps> = ({ onClose }) => {
  const {
    queue,
    queueIndex,
    currentTrack,
    playTrack,
    clearQueue,
    isPlaying,
    isShuffled,
    toggleShuffle,
    repeatMode,
    toggleRepeat
  } = usePlayer();

  const { isLiked, toggleLike } = useLibrary();

  const [isLocked, setIsLocked] = useState(false);
  const [removedTrackToast, setRemovedTrackToast] = useState<string | null>(null);

  // Grouped shape class generator matching ShapesCurve.kt
  const getItemShapeClass = (index: number, count: number): string => {
    if (count === 1) return 'rounded-2xl';
    if (index === 0) return 'rounded-t-2xl rounded-b-sm';
    if (index === count - 1) return 'rounded-t-sm rounded-b-2xl';
    return 'rounded-sm';
  };

  const totalDuration = queue.reduce((acc, t) => acc + (t.duration || 0), 0);
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden text-white select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 pb-2 border-b border-white/10 shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/15">
            <Radio size={16} className="text-[var(--accent-color)]" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide">Up Next Queue</h3>
            <p className="text-[11px] text-white/50">
              {queue.length} songs • {formatTime(totalDuration)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Lock Queue Toggle */}
          <button
            onClick={() => setIsLocked(!isLocked)}
            title={isLocked ? 'Unlock queue editing' : 'Lock queue'}
            aria-label={isLocked ? 'Unlock queue editing' : 'Lock queue'}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border ${
              isLocked
                ? 'bg-white/20 border-white/30 text-white'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
            }`}
          >
            {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>

          {/* Clear Queue Button */}
          {queue.length > 1 && !isLocked && (
            <button
              onClick={clearQueue}
              aria-label="Clear queue"
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-white/70 hover:text-white flex items-center gap-1 border border-white/10 transition-all active:scale-95"
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          )}

          <button
            onClick={onClose}
            aria-label="Close queue"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center border border-white/10"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Connected Action Button Group: Shuffle, Repeat, Radio Mode */}
      <div className="flex items-center gap-1 px-4 py-2.5 border-b border-white/5 shrink-0">
        <button
          onClick={toggleShuffle}
          className={`flex-1 h-10 rounded-l-xl flex items-center justify-center gap-2 text-xs font-semibold border transition-all ${
            isShuffled
              ? 'bg-white/20 border-white/30 text-white'
              : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
          }`}
        >
          <Shuffle size={14} />
          <span>Shuffle</span>
        </button>

        <button
          onClick={toggleRepeat}
          className={`flex-1 h-10 flex items-center justify-center gap-2 text-xs font-semibold border transition-all ${
            repeatMode !== 'off'
              ? 'bg-white/20 border-white/30 text-white'
              : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
          }`}
        >
          {repeatMode === 'one' ? <Repeat1 size={14} /> : <Repeat size={14} />}
          <span>{repeatMode === 'one' ? 'Repeat 1' : 'Repeat'}</span>
        </button>

        <button
          onClick={() => {}}
          className="flex-1 h-10 rounded-r-xl flex items-center justify-center gap-2 text-xs font-semibold border border-white/10 bg-white/5 text-white/60 hover:text-white transition-all"
        >
          <Sparkles size={14} className="text-[var(--accent-color)]" />
          <span>AutoMix</span>
        </button>
      </div>

      {/* Queue Track List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1.5 no-scrollbar">
        {queue.map((track, idx) => {
          const isCurrent = idx === queueIndex;
          const shapeClass = getItemShapeClass(idx, queue.length);

          return (
            <motion.div
              key={`${track.id}-${idx}`}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              onClick={() => playTrack(track, queue)}
              className={`flex items-center justify-between p-2.5 cursor-pointer transition-all border ${shapeClass} ${
                isCurrent
                  ? 'bg-white/15 border-white/30 shadow-md'
                  : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                {/* Drag Reorder Handle */}
                {!isLocked && (
                  <div
                    className="text-white/30 hover:text-white/80 cursor-grab active:cursor-grabbing p-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical size={16} />
                  </div>
                )}

                {/* Thumbnail */}
                <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-white/10">
                  <img
                    src={track.thumbnail || '/icons/musify-icon.svg'}
                    alt={track.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/icons/musify-icon.svg';
                    }}
                  />
                  {isCurrent && isPlaying && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                      <Volume2 size={16} className="text-white animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Song Meta */}
                <div className="min-w-0 flex flex-col flex-1">
                  <p
                    className={`text-sm font-semibold truncate ${
                      isCurrent ? 'text-white font-bold' : 'text-white/80'
                    }`}
                  >
                    {track.title}
                  </p>
                  <p className="text-xs text-white/50 truncate">
                    {track.artists?.map((a) => a.name).join(', ') || 'Unknown Artist'}
                  </p>
                </div>
              </div>

              {/* Right: Duration & Like */}
              <div
                className="flex items-center gap-2 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-xs text-white/40">
                  {track.durationFormatted || (track.duration ? formatTime(track.duration) : '')}
                </span>

                <HeartBurstIcon
                  isLiked={isLiked(track.id)}
                  onToggle={() => toggleLike(track)}
                  size={18}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
