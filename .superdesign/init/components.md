# Musify Shared UI Primitives

## SquigglySlider
File: `src/components/player/SquigglySlider.tsx`
Description: Real-time Canvas animated sine-wave audio scrubber with progressive dampening at seek head and grab thumb.

```tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface SquigglySliderProps {
  value: number; // in seconds
  max: number; // in seconds
  isPlaying: boolean;
  accentColor?: string;
  onSeek: (value: number) => void;
  className?: string;
}

export const SquigglySlider: React.FC<SquigglySliderProps> = ({
  value,
  max,
  isPlaying,
  accentColor = '#FFFFFF',
  onSeek,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(value);

  const waveLength = 80;
  const lineAmplitude = 6;
  const phaseSpeed = 24;
  const transitionPeriods = 1.5;
  const strokeWidth = 5;

  const phaseOffsetRef = useRef(0);
  const heightFractionRef = useRef(isPlaying ? 1 : 0);
  const targetHeightRef = useRef(isPlaying && !isDragging ? 1 : 0);

  useEffect(() => {
    if (!isDragging) setDragValue(value);
  }, [value, isDragging]);

  const currentValue = isDragging ? dragValue : value;
  const progressRatio = max > 0 ? Math.min(1, Math.max(0, currentValue / max)) : 0;

  const calculateSeekFromPointer = useCallback(
    (e: React.PointerEvent) => {
      if (!containerRef.current || max <= 0) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      return (x / rect.width) * max;
    },
    [max]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragValue(calculateSeekFromPointer(e));
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) setDragValue(calculateSeekFromPointer(e));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      onSeek(calculateSeekFromPointer(e));
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`w-full flex flex-col gap-1 select-none touch-none py-1 ${className}`}>
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-full h-12 flex items-center cursor-pointer group"
      >
        <canvas ref={canvasRef} className="w-full h-full block pointer-events-none" />
      </div>

      <div className="flex justify-between items-center text-xs font-semibold text-white/55 px-1 tracking-wider">
        <span>{formatTime(isDragging ? dragValue : value)}</span>
        <span>{max > 0 ? `-${formatTime(max - (isDragging ? dragValue : value))}` : '0:00'}</span>
      </div>
    </div>
  );
};
```

---

## FlowerPlayButton
File: `src/components/player/FlowerPlayButton.tsx`
Description: Material 3 Expressive scalloped 12-petal flower play/pause button with tactile spring scaling.

```tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';

interface FlowerPlayButtonProps {
  isPlaying: boolean;
  onClick: (e: React.MouseEvent) => void;
  size?: number;
  className?: string;
}

export const FlowerPlayButton: React.FC<FlowerPlayButtonProps> = ({
  isPlaying,
  onClick,
  size = 96,
  className = ''
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', damping: 18, stiffness: 400 }}
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center text-black focus:outline-none drop-shadow-xl ${className}`}
      aria-label={isPlaying ? 'Pause' : 'Play'}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full fill-white">
        <path d="M50 0 C54 10 59 10 65 5 C71 0 76 3 79 9 C82 15 87 18 93 16 C99 14 102 20 101 26 C100 32 103 37 108 39 C113 41 113 47 110 52 C107 57 107 63 111 67 C115 71 113 77 108 79 C103 81 100 86 101 92 C102 98 97 101 91 101 C85 101 81 105 79 110 C77 115 71 116 66 113 C61 110 55 112 52 117 C49 122 43 121 39 117 C35 113 29 113 25 117 C21 121 15 119 13 113 C11 107 7 105 1 105 C-5 105 -6 99 -4 93 C-2 87 -4 82 -9 79 C-14 76 -13 70 -9 66 C-5 62 -6 56 -10 52 C-14 48 -13 42 -8 39 C-3 36 -2 31 -4 25 C-6 19 -2 15 4 15 C10 15 13 10 14 5 C15 0 21 -2 26 1 C31 4 37 3 40 -2 C43 -7 49 -6 50 0 Z" transform="scale(0.8) translate(12, 10)" />
      </svg>
      <div className="relative z-10 text-black">
        {isPlaying ? (
          <Pause size={size * 0.38} className="fill-black text-black" />
        ) : (
          <Play size={size * 0.38} className="fill-black text-black translate-x-0.5" />
        )}
      </div>
    </motion.button>
  );
};
```

---

## HeartBurstIcon
File: `src/components/player/HeartBurstIcon.tsx`
Description: Instagram/Twitter style tactile like heart with confetti burst particle explosion.

```tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

interface HeartBurstIconProps {
  isLiked: boolean;
  size?: number;
  className?: string;
}

export const HeartBurstIcon: React.FC<HeartBurstIconProps> = ({
  isLiked,
  size = 22,
  className = ''
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <motion.div
        animate={isLiked ? { scale: [1, 1.35, 0.95, 1] } : { scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <Heart
          size={size}
          className={`transition-colors duration-200 ${
            isLiked ? 'fill-[#ED5564] text-[#ED5564]' : 'text-white/60 hover:text-white'
          }`}
        />
      </motion.div>
    </div>
  );
};
```
