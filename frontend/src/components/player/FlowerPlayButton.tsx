import React, { useMemo, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';

export type FlowerPlayStyle = 'wavy' | 'scallop8' | 'apple_squircle' | 'circle';

interface FlowerPlayButtonProps {
  isPlaying: boolean;
  isLoading?: boolean;
  onClick: () => void;
  size?: number; // size in px, default 84 in full player, 48 in mini player
  color?: string; // background fill, default '#FFFFFF'
  iconColor?: string; // icon color, default '#000000'
  className?: string;
  styleType?: FlowerPlayStyle;
  iconSize?: number;
  layoutId?: string;
}

/**
 * Mathematical path generator for Echo Music's WavyShape:
 * r = maxRadius * (1 - indent + indent * cos(sides * (angle - rotationRad)))
 * Used in Player.kt line 248 and MiniPlayer.kt line 142.
 */
export function generateWavyPath(
  size: number,
  sides: number = 9,
  indent: number = 0.08,
  rotationDegrees: number = 0,
  steps: number = 120
): string {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadiusX = size / 2;
  const maxRadiusY = size / 2;
  const rotationRad = (rotationDegrees * Math.PI) / 180;

  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i * Math.PI * 2) / steps;
    const bumpAngle = angle - rotationRad;
    const r = 1.0 - indent + indent * Math.cos(sides * bumpAngle);
    const x = cx + maxRadiusX * r * Math.cos(angle);
    const y = cy + maxRadiusY * r * Math.sin(angle);
    points.push([x, y]);
  }

  return points.reduce((acc, [x, y], idx) => {
    return idx === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : `${acc} L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }, '') + ' Z';
}

/**
 * Mathematical path generator for RoundedStarShape:
 * r = min(size) * 0.4 * mapRange(1.0, 0.0, 0.5, 1.0, curve)
 * x = cx + r * (cos(t - rot) * (1 + curve * cos(sides * t)))
 * Used in RoundedStarShape.kt line 14.
 */
export function generateRoundedStarPath(
  size: number,
  sides: number = 8,
  curve: number = 0.10,
  rotationDegrees: number = 0,
  steps: number = 180
): string {
  const cx = size / 2;
  const cy = size / 2;
  // mapRange(1.0, 0.0, 0.5, 1.0, curve) -> (curve - 1) / (0 - 1) * (1.0 - 0.5) + 0.5
  const mapFactor = ((curve - 1.0) / -1.0) * 0.5 + 0.5;
  const r = size * 0.48 * mapFactor;
  const rotRad = (Math.PI / 180) * rotationDegrees;

  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i * Math.PI * 2) / steps;
    const x = cx + r * (Math.cos(t - rotRad) * (1 + curve * Math.cos(sides * t)));
    const y = cy + r * (Math.sin(t - rotRad) * (1 + curve * Math.cos(sides * t)));
    points.push([x, y]);
  }

  return points.reduce((acc, [x, y], idx) => {
    return idx === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : `${acc} L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }, '') + ' Z';
}

export const FlowerPlayButton: React.FC<FlowerPlayButtonProps> = ({
  isPlaying,
  isLoading = false,
  onClick,
  size = 84,
  color = '#FFFFFF',
  iconColor = '#000000',
  className = '',
  styleType = 'wavy',
  iconSize,
  layoutId
}) => {
  const [indent, setIndent] = useState<number>(isPlaying ? 0.08 : 0);
  const [rotation, setRotation] = useState<number>(0);
  const indentRef = useRef(indent);
  indentRef.current = indent;

  // Animate indent (0.0 to 0.08 over 300ms)
  useEffect(() => {
    let animId: number;
    const startVal = indentRef.current;
    const targetVal = isPlaying ? 0.08 : 0;
    const startTime = performance.now();
    const duration = 300;

    const animateIndent = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      setIndent(startVal + (targetVal - startVal) * progress);
      if (progress < 1) {
        animId = requestAnimationFrame(animateIndent);
      }
    };

    animId = requestAnimationFrame(animateIndent);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Continuous 8000ms rotation when playing
  useEffect(() => {
    if (!isPlaying) {
      setRotation(0);
      return;
    }

    let animId: number;
    let lastTime = performance.now();

    const rotateLoop = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;
      // 360 degrees in 8000ms = 0.045 deg/ms
      setRotation((prev) => (prev + delta * 0.045) % 360);
      animId = requestAnimationFrame(rotateLoop);
    };

    animId = requestAnimationFrame(rotateLoop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Calculate SVG path based on shape type
  const pathData = useMemo(() => {
    if (styleType === 'scallop8') {
      return generateRoundedStarPath(size, 8, 0.10, rotation);
    }
    // Default: WavyShape with 9 sides
    return generateWavyPath(size, 9, indent, rotation);
  }, [size, styleType, indent, rotation]);

  const finalIconSize = iconSize || Math.round(size * 0.42);

  if (styleType === 'apple_squircle') {
    // Apple Inspired design: 100px squircle box morphing 24px (playing) to 36px (paused)
    return (
      <motion.button
        type="button"
        aria-label={isPlaying ? 'Pause' : 'Play'}
        title={isPlaying ? 'Pause' : 'Play'}
        layoutId={layoutId}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', damping: 20, stiffness: 450 }}
        onClick={onClick}
        className={`relative flex items-center justify-center cursor-pointer select-none transition-colors ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: isPlaying ? '24px' : '36px',
          backgroundColor: color,
          transition: 'border-radius 90ms linear'
        }}
      >
        <div className="flex items-center justify-center" style={{ color: iconColor }}>
          {isPlaying ? (
            <div className="flex items-center gap-2">
              <span
                className="rounded-full"
                style={{
                  width: Math.max(3, Math.round(finalIconSize * 0.2)),
                  height: finalIconSize,
                  backgroundColor: iconColor
                }}
              />
              <span
                className="rounded-full"
                style={{
                  width: Math.max(3, Math.round(finalIconSize * 0.2)),
                  height: finalIconSize,
                  backgroundColor: iconColor
                }}
              />
            </div>
          ) : (
            <Play
              size={finalIconSize}
              className="ml-1"
              style={{ fill: iconColor, color: iconColor }}
            />
          )}
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      aria-label={isPlaying ? 'Pause' : 'Play'}
      title={isPlaying ? 'Pause' : 'Play'}
      layoutId={layoutId}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      onClick={onClick}
      className={`relative flex items-center justify-center cursor-pointer select-none ${className}`}
      style={{ width: size, height: size }}
    >
{isLoading && (
        <span className="absolute inset-[-5px] rounded-full border-2 border-transparent border-t-[var(--accent-color,#D92B38)] border-r-[var(--accent-color,#D92B38)]/40 animate-spin pointer-events-none" />
      )}
      {/* Dynamic Scalloped Wavy Vector Path */}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full "
        style={{ overflow: 'visible' }}
      >
        <path d={pathData} fill={color} />
      </svg>

      {/* Center Play/Pause Glyph with 90deg crossfade morph */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AnimatePresence mode="wait">
          {isPlaying ? (
            <motion.div
              key="pause"
              initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-1.5"
            >
              <span
                className="rounded-full"
                style={{
                  width: Math.max(3, Math.round(finalIconSize * 0.2)),
                  height: Math.round(finalIconSize * 0.9),
                  backgroundColor: iconColor
                }}
              />
              <span
                className="rounded-full"
                style={{
                  width: Math.max(3, Math.round(finalIconSize * 0.2)),
                  height: Math.round(finalIconSize * 0.9),
                  backgroundColor: iconColor
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="play"
              initial={{ rotate: 90, opacity: 0, scale: 0.8 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            >
              <Play
                size={finalIconSize}
                className="ml-1"
                style={{ fill: iconColor, color: iconColor }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
};
