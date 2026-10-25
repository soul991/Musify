import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LyricLine } from '../../types';

interface PlayerSyncedLyricsViewProps {
  lines: LyricLine[];
  currentTime: number;
  onOpenLyrics?: () => void;
  className?: string;
}

/**
 * Compact 1-line synchronized lyrics component matching
 * echo-repo/app/src/main/kotlin/com/music/echo/ui/player/PlayerSyncedLyricsView.kt
 */
export const PlayerSyncedLyricsView: React.FC<PlayerSyncedLyricsViewProps> = ({
  lines,
  currentTime,
  onOpenLyrics,
  className = ''
}) => {
  // Find currently active line
  const activeLine = useMemo(() => {
    if (!lines || lines.length === 0) return null;
    let current: LyricLine | null = null;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= currentTime + 0.15) {
        current = lines[i];
      } else {
        break;
      }
    }
    return current;
  }, [lines, currentTime]);

  if (!lines || lines.length === 0) {
    return null;
  }

  // If before first line (intro), show first line dimmed
  const displayLine = activeLine || lines[0];
  const isIntro = !activeLine;

  return (
    <div
      onClick={onOpenLyrics}
      className={`w-full px-6 py-2 cursor-pointer flex items-center justify-center min-h-[36px] overflow-hidden ${className}`}
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={displayLine.time}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: isIntro ? 0.45 : 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className={`text-center font-bold text-base sm:text-lg tracking-wide truncate max-w-full ${
            isIntro ? 'text-white/50 italic' : 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]'
          }`}
        >
          {isIntro ? `♪ ${displayLine.text}` : displayLine.text}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};
