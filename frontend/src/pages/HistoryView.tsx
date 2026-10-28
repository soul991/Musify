import React from 'react';
import { ArrowLeft, Play, Trash2, Clock, Disc } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { Track } from '../types';
import { HeartBurstIcon } from '../components/player/HeartBurstIcon';
import { VirtualList } from '../components/common/VirtualList';

interface HistoryViewProps {
  onBack: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onBack }) => {
  const { history, clearHistory, isLiked, toggleLike } = useLibrary();
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  const renderTrackItem = (track: Track, idx: number) => {
    const isCurrent = currentTrack?.id === track.id;
    const liked = isLiked(track.id);

    return (
      <div
        key={`${track.id}-${idx}`}
        onClick={() => playTrack(track, history)}
        className={`flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer select-none transition-all border ${
          isCurrent
            ? 'bg-white/[0.14] border-white/30 shadow-md'
            : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/5'
        }`}
      >
        {/* Index / Playing indicator */}
        <span className="w-6 text-center text-xs font-bold text-white/40">
          {idx + 1}
        </span>

        {/* Artwork */}
        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white/10 border border-white/10 flex items-center justify-center">
          {track.thumbnail ? (
            <img
              src={track.thumbnail}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              width={48}
              height={48}
            />
          ) : (
            <Disc size={20} className="text-white/40" />
          )}
        </div>

        {/* Title & Artist */}
        <div className="flex-1 min-w-0 pr-2">
          <p
            className={`text-sm font-bold truncate ${
              isCurrent ? 'text-[#E5303D]' : 'text-white'
            }`}
          >
            {track.title}
          </p>
          <p className="text-xs text-white/60 truncate font-medium mt-0.5">
            {track.artists?.map((a) => a.name).join(', ') || 'Unknown Artist'}
          </p>
        </div>

        {/* Like Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(track);
          }}
          aria-label={liked ? 'Unlike' : 'Like'}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
          <HeartBurstIcon isLiked={liked} size={16} />
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 pt-safe pb-48 text-white no-scrollbar select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Go back"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white border border-white/10"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <span className="text-xs font-bold text-white/50 tracking-wider uppercase">
              RECENTLY PLAYED
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Listening History
            </h1>
          </div>
        </div>

        {/* Clear & Play All */}
        {history.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => playTrack(history[0], history)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-black font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-md"
            >
              <Play size={13} className="fill-current" /> Play all
            </button>
            <button
              onClick={clearHistory}
              aria-label="Clear History"
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-red-400 border border-white/10 transition-all"
              title="Clear History"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* History Song List */}
      {history.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white/[0.03] border border-white/10 text-white/50 flex flex-col items-center gap-3">
          <Clock size={40} className="text-white/30" />
          <p className="text-base font-bold text-white/80">No listening history yet</p>
          <p className="text-xs text-white/50 max-w-sm">
            Songs you stream and discover will show up here chronologically so you can easily replay them.
          </p>
        </div>
      ) : history.length > 20 ? (
        <VirtualList<Track>
          items={history}
          itemHeight={68}
          renderItem={(track, idx) => renderTrackItem(track, idx)}
          keyExtractor={(track, idx) => `${track.id}-${idx}`}
          className="h-[calc(100vh-220px)]"
        />
      ) : (
        <div className="flex flex-col gap-2">
          {history.map((track, idx) => renderTrackItem(track, idx))}
        </div>
      )}
    </div>
  );
};
