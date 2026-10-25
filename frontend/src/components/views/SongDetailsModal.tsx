import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Music2, Disc, User, Clock, Radio, Share2, Copy, Check, Headphones } from 'lucide-react';
import { Track } from '../../types';

interface SongDetailsModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  onStartRadio?: (track: Track) => void;
}

export const SongDetailsModal: React.FC<SongDetailsModalProps> = ({
  track,
  isOpen,
  onClose,
  onStartRadio
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !track) return null;

  const streamUrl = `/api/stream/${track.id}`;

  const handleCopyLink = () => {
    const url = window.location.origin + streamUrl;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: track.title,
        text: `Listen to "${track.title}" on Musify Echo`,
        url: window.location.origin
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  const formatDuration = (secs?: number) => {
    if (!secs) return track.durationFormatted || 'Unknown';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-xl flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="w-full max-w-md rounded-3xl bg-[#16171E] border border-white/20 p-6 text-white shadow-2xl flex flex-col gap-5 select-none relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headphones size={20} className="text-[var(--accent-color)]" />
              <h3 className="text-lg font-black tracking-tight">Song Details</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Media Card Preview */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.06] border border-white/10">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/10 shrink-0 shadow-md">
              <img
                src={track.thumbnail || '/icons/musify-icon.svg'}
                alt={track.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-sm text-white truncate leading-snug">
                {track.title}
              </p>
              <p className="text-xs text-white/60 truncate mt-0.5">
                {track.artists?.map((a) => a.name).join(', ') || 'Unknown Artist'}
              </p>
            </div>
          </div>

          {/* Metadata Specifications Grid */}
          <div className="flex flex-col gap-2 rounded-2xl bg-white/[0.03] border border-white/5 p-3.5 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-white/50 flex items-center gap-1.5 font-medium">
                <Music2 size={14} /> Video ID
              </span>
              <span className="font-mono text-white/90">{track.id}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-white/50 flex items-center gap-1.5 font-medium">
                <Clock size={14} /> Duration
              </span>
              <span className="font-semibold text-white/90">{formatDuration(track.duration)}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-white/50 flex items-center gap-1.5 font-medium">
                <Disc size={14} /> Audio Format
              </span>
              <span className="font-semibold text-emerald-400">Opus / 256 kbps (WebM)</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-white/50 flex items-center gap-1.5 font-medium">
                <User size={14} /> Source
              </span>
              <span className="font-semibold text-white/80">YouTube Music InnerTube</span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-white/50 font-medium">Protocol</span>
              <span className="font-semibold text-white/80">HTTP 206 Partial Content</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            {onStartRadio && (
              <button
                onClick={() => {
                  onStartRadio(track);
                  onClose();
                }}
                className="flex-1 py-3 rounded-2xl bg-[var(--accent-color)] hover:brightness-110 active:scale-98 font-bold text-xs text-white uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Radio size={16} />
                <span>Start Radio</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-98 font-bold text-xs text-white uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
            >
              <Share2 size={16} />
              <span>Share</span>
            </button>

            <button
              onClick={handleCopyLink}
              title="Copy Audio Stream URL"
              className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-98 flex items-center justify-center text-white/80 hover:text-white transition-all"
            >
              {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
