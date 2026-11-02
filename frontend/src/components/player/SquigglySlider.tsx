import React, { useRef, useEffect, useState, useCallback } from 'react';

interface SquigglySliderProps {
  value: number; // in seconds
  max: number; // in seconds
  isPlaying: boolean;
  accentColor?: string;
  onSeek: (value: number) => void;
  className?: string;
}

/**
 * Exact implementation of Echo Music's SquigglySlider.kt
 * Wave formula:
 *   waveLength = 80px
 *   lineAmplitude = 6px
 *   phaseSpeed = 24px/s
 *   transitionPeriods = 1.5
 *   strokeWidth = 5px
 *   heightFraction = 1.0 (playing) -> 0.0 (paused / dragging)
 *   Cubic Bézier wave with smooth progressive dampening at seek point
 *   Vertical pill scrubber thumb
 */
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

  // Constants matching Jetpack Compose SquigglySlider.kt
  const waveLength = 80;
  const lineAmplitude = 6;
  const phaseSpeed = 24; // pixels per second
  const transitionPeriods = 1.5;
  const strokeWidth = 5;

  const phaseOffsetRef = useRef(0);
  const heightFractionRef = useRef(isPlaying ? 1 : 0);
  const targetHeightRef = useRef(isPlaying && !isDragging ? 1 : 0);

  // Sync internal drag value with incoming prop
  useEffect(() => {
    if (!isDragging) {
      setDragValue(value);
    }
  }, [value, isDragging]);

  // Update target height fraction
  useEffect(() => {
    targetHeightRef.current = isPlaying && !isDragging ? 1 : 0;
  }, [isPlaying, isDragging]);

  const currentValue = isDragging ? dragValue : value;
  const progressRatio = max > 0 ? Math.min(1, Math.max(0, currentValue / max)) : 0;

  // Pointer drag & seek handlers
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
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  // Continuous Canvas animation loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const render = (now: number) => {
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      // Animate phase offset (pixels per second)
      if (isPlaying) {
        phaseOffsetRef.current = (phaseOffsetRef.current + deltaTime * phaseSpeed) % waveLength;
      }

      // Smoothly animate heightFraction towards targetHeight (150ms / 200ms)
      const targetH = targetHeightRef.current;
      const currentH = heightFractionRef.current;
      const speed = targetH < currentH ? 1 / 0.15 : 1 / 0.2; // 150ms flatten, 200ms restore
      const diff = targetH - currentH;
      if (Math.abs(diff) < 0.01) {
        heightFractionRef.current = targetH;
      } else {
        heightFractionRef.current += Math.sign(diff) * Math.min(Math.abs(diff), deltaTime * speed);
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const rect = canvas.getBoundingClientRect();
          const width = rect.width;
          const height = rect.height;

          if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
          }

          ctx.save();
          ctx.scale(dpr, dpr);
          ctx.clearRect(0, 0, width, height);

          const centerY = height / 2;
          const totalProgressPx = width * progressRatio;
          const heightFraction = heightFractionRef.current;
          const phaseOffset = phaseOffsetRef.current;

          // Compute amplitude with smooth dampening near waveProgressPx
          const waveProgressPx = totalProgressPx;
          const computeAmplitude = (x: number, sign: number): number => {
            const length = transitionPeriods * waveLength;
            const coeff = Math.max(0, Math.min(1, (waveProgressPx + length / 2 - x) / length));
            return sign * heightFraction * lineAmplitude * coeff;
          };

          // Generate Wave Path across width
          const waveStart = -phaseOffset - waveLength / 2;
          const waveEnd = width + waveLength;
          const dist = waveLength / 2;

          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = strokeWidth;

          // Draw Active Track (0 to totalProgressPx)
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, totalProgressPx, height);
          ctx.clip();

          ctx.beginPath();
          ctx.moveTo(waveStart, centerY);
          let currentX = waveStart;
          let waveSign = 1;
          let currentAmp = computeAmplitude(currentX, waveSign);

          while (currentX < waveEnd) {
            waveSign = -waveSign;
            const nextX = currentX + dist;
            const midX = currentX + dist / 2;
            const nextAmp = computeAmplitude(nextX, waveSign);

            ctx.bezierCurveTo(
              midX,
              centerY + currentAmp,
              midX,
              centerY + nextAmp,
              nextX,
              centerY + nextAmp
            );

            currentAmp = nextAmp;
            currentX = nextX;
          }

          ctx.strokeStyle = accentColor;
          ctx.stroke();
          ctx.restore();

          // Draw Inactive Track (totalProgressPx to width)
          ctx.save();
          ctx.beginPath();
          ctx.rect(totalProgressPx, 0, width - totalProgressPx, height);
          ctx.clip();

          ctx.beginPath();
          ctx.moveTo(waveStart, centerY);
          currentX = waveStart;
          waveSign = 1;
          currentAmp = computeAmplitude(currentX, waveSign);

          while (currentX < waveEnd) {
            waveSign = -waveSign;
            const nextX = currentX + dist;
            const midX = currentX + dist / 2;
            const nextAmp = computeAmplitude(nextX, waveSign);

            ctx.bezierCurveTo(
              midX,
              centerY + currentAmp,
              midX,
              centerY + nextAmp,
              nextX,
              centerY + nextAmp
            );

            currentAmp = nextAmp;
            currentX = nextX;
          }

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.stroke();
          ctx.restore();

          // Left Endcap circle
          ctx.beginPath();
          ctx.arc(strokeWidth / 2, centerY, strokeWidth / 2, 0, Math.PI * 2);
          ctx.fillStyle = accentColor;
          ctx.fill();

          // Right Endcap circle
          ctx.beginPath();
          ctx.arc(width - strokeWidth / 2, centerY, strokeWidth / 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.fill();

          // Vertical Scrubber Thumb Bar: barHalfHeight = lineAmplitude + strokeWidth = 11px
          const barHalfHeight = lineAmplitude + strokeWidth;
          const barWidth = 5;
          ctx.beginPath();
          ctx.moveTo(totalProgressPx, centerY - barHalfHeight);
          ctx.lineTo(totalProgressPx, centerY + barHalfHeight);
          ctx.strokeStyle = accentColor;
          ctx.lineWidth = barWidth;
          ctx.lineCap = 'round';
          ctx.stroke();

          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, progressRatio, accentColor]);

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

      {/* Timestamps */}
      <div className="flex justify-between items-center text-xs font-semibold text-white/55 px-1 ">
        <span>{formatTime(isDragging ? dragValue : value)}</span>
        <span>{max > 0 ? `-${formatTime(max - (isDragging ? dragValue : value))}` : '0:00'}</span>
      </div>
    </div>
  );
};
