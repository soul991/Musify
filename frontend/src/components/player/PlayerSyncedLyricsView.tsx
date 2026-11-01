import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LyricLine } from '../../types';

interface PlayerSyncedLyricsViewProps {
  lines: LyricLine[];
  currentTime: number;
  onOpenLyrics?: () => void;
  className?: string;
}

export const PlayerSyncedLyricsView: React.FC<PlayerSyncedLyricsViewProps> = ({
  lines,
  currentTime,
  onOpenLyrics,
  className = ''
}) => {
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

  const displayLine = activeLine || lines[0];
  const isIntro = !activeLine;

  return (
    <div
      onClick={onOpenLyrics}
      className={`w-full px-6 py-2 cursor-pointer flex items-center justify-center min-h-[44px] overflow-hidden ${className}`}
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={displayLine.time}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: isIntro ? 0.45 : 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={`text-center font-display text-lg sm:text-xl truncate max-w-full ${
            isIntro ? 'text-[var(--text-3)]' : 'text-[var(--text-1)]'
          }`}
        >
          {isIntro ? `... ${displayLine.text}` : displayLine.text}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};
