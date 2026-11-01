import React, { useRef, useState, useCallback, useEffect } from 'react';

interface CalmSeekbarProps {
  value: number; // in seconds
  max: number; // in seconds
  accentColor?: string;
  onSeek: (value: number) => void;
  className?: string;
  showTimestamps?: boolean;
}

export const CalmSeekbar: React.FC<CalmSeekbarProps> = ({
  value,
  max,
  accentColor = 'var(--accent)',
  onSeek,
  className = '',
  showTimestamps = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(value);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      setDragValue(value);
    }
  }, [value, isDragging]);

  const effectiveValue = isDragging ? dragValue : value;
  const progressRatio = max > 0 ? Math.min(1, Math.max(0, effectiveValue / max)) : 0;

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
    const newPos = calculateSeekFromPointer(e);
    setDragValue(newPos);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      const newPos = calculateSeekFromPointer(e);
      setDragValue(newPos);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      const finalPos = calculateSeekFromPointer(e);
      onSeek(finalPos);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className={`w-full flex flex-col justify-center select-none touch-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setIsDragging(false)}
        className="relative w-full h-8 flex items-center cursor-pointer group"
      >
        {/* Track Background: 4px track --bg-raised, fill --accent per section 6 */}
        <div className="relative w-full h-1 rounded-full bg-[var(--bg-raised)] overflow-hidden">
          <div
            className="absolute inset-0 rounded-full bg-[var(--accent)]"
            style={{
              transform: `scaleX(${progressRatio})`,
              transformOrigin: 'left',
              willChange: isDragging ? 'transform' : 'auto'
            }}
          />
        </div>

        {/* 12px Handle that carries the time while dragging per section 1 & 6 */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-100 flex items-center justify-center ${
            isDragging
              ? 'px-2 py-0.5 rounded-full bg-[var(--accent)] text-white text-xs font-sans tabular-nums shadow-[0_4px_12px_rgba(0,0,0,0.5)] z-20'
              : `w-3 h-3 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.6)] ${
                  isHovered ? 'scale-100 opacity-100' : 'scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100'
                }`
          }`}
          style={{ left: `${progressRatio * 100}%` }}
        >
          {isDragging && <span>{formatTime(effectiveValue)}</span>}
        </div>
      </div>

      {showTimestamps && (
        <div className="flex justify-between items-center text-xs font-sans text-[var(--text-3)] px-0.5 tabular-nums">
          <span>{formatTime(effectiveValue)}</span>
          <span>{formatTime(max)}</span>
        </div>
      )}
    </div>
  );
};
