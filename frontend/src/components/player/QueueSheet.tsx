import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
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
  Sparkles
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
    reorderQueue,
    isPlaying,
    isShuffled,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    autoplaySimilar,
    setAutoplaySimilar
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
          onClick={() => setAutoplaySimilar(!autoplaySimilar)}
          title="Autoplay similar songs when queue ends"
          aria-label="Autoplay similar songs when queue ends"
          className={`flex-1 h-10 rounded-r-xl flex items-center justify-center gap-2 text-xs font-semibold border transition-all ${
            autoplaySimilar
              ? 'bg-white/20 border-white/30 text-white'
              : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
          }`}
        >
          <Sparkles size={14} className={autoplaySimilar ? 'text-[#E5303D]' : 'text-white/40'} />
          <span>Autoplay</span>
          <span className={`w-1.5 h-1.5 rounded-full ${autoplaySimilar ? 'bg-[#E5303D]' : 'bg-white/20'}`} />
        </button>
      </div>

      {removedTrackToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-[#1A1A1A] text-white text-xs px-3 py-1.5 rounded-full border border-white/15 shadow-xl animate-fade-in pointer-events-none">
          {removedTrackToast}
        </div>
      )}

      {/* Reorderable Queue Track List with mobile swipe-to-remove */}
      <Reorder.Group
        axis="y"
        values={queue}
        onReorder={(newQ) => {
          if (!isLocked) reorderQueue(newQ);
        }}
        className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1.5 no-scrollbar"
      >
        <AnimatePresence>
          {queue.map((track, idx) => {
            const isCurrent = idx === queueIndex;
            const shapeClass = getItemShapeClass(idx, queue.length);

            return (
              <Reorder.Item
                key={`${track.id}-${idx}`}
                value={track}
                dragListener={!isLocked}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="relative"
              >
                <motion.div
                  drag={!isLocked ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={{ left: 0.7, right: 0 }}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -90) {
                      const updated = queue.filter((_, i) => i !== idx);
                      reorderQueue(updated);
                      setRemovedTrackToast(`Removed "${track.title.slice(0, 20)}" from queue`);
                      setTimeout(() => setRemovedTrackToast(null), 2500);
                    }
                  }}
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
                        width={44}
                        height={44}
                        loading="lazy"
                        decoding="async"
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
              </Reorder.Item>
            );
          })}
        </AnimatePresence>
            </Reorder.Group>

      {/* Autoplay Similar Songs Indicator & Toggle */}
      <div className="mt-3 mb-6 p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between mx-4 shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <Sparkles size={16} className={autoplaySimilar ? 'text-[#E5303D]' : 'text-white/40'} />
          <div>
            <p className="text-xs font-bold text-white">Autoplay similar tracks</p>
            <p className="text-[10px] text-white/50">Continuously adds music to your queue</p>
          </div>
        </div>
        <button
          onClick={() => setAutoplaySimilar(!autoplaySimilar)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
            autoplaySimilar
              ? 'bg-[#E5303D] border-[#E5303D] text-white shadow-md shadow-[#E5303D]/25'
              : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
          }`}
        >
          {autoplaySimilar ? 'Autoplay: on' : 'Autoplay: off'}
        </button>
      </div>
    </div>
  );
};
