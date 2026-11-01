import React, { useRef, useEffect, useState, useCallback } from 'react';

export interface SquigglySliderProps {
  value: number; // in seconds
  max: number; // in seconds
  isPlaying: boolean;
  accentColor?: string;
  onSeek: (value: number) => void;
  className?: string;
}

/**
 * Wave and seekbar physics constants (R1)
 */
export const WAVE_CONSTANTS = {
  AMPLITUDE_PLAYING: 2,
  AMPLITUDE_PAUSED: 0,
  WAVELENGTH: 24,
  EASE_DURATION_MS: 320,
  PHASE_SPEED: 24, // pixels per second
  STROKE_WIDTH: 3,
} as const;

/**
 * Format timestamp for live drag badge in mm:ss format (R1)
 */
export function formatTimestampBadge(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds <= 0) {
    return '00:00';
  }
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainderSeconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainderSeconds).padStart(2, '0')}`;
}

/**
 * Mathematical easing function between wave amplitudes over exactly 320ms (R1)
 * Uses smooth cubic Hermite interpolation: 3*p^2 - 2*p^3
 */
export function calculateAmplitudeEase(
  startAmp: number,
  targetAmp: number,
  elapsedMs: number,
  durationMs: number = WAVE_CONSTANTS.EASE_DURATION_MS
): number {
  if (durationMs <= 0 || elapsedMs >= durationMs) return targetAmp;
  if (elapsedMs <= 0) return startAmp;
  const p = elapsedMs / durationMs;
  const eased = p * p * (3 - 2 * p);
  return startAmp + (targetAmp - startAmp) * eased;
}

/**
 * Detect prefers-reduced-motion
 */
function checkPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Kinetic Waveform Seek Bar (R1)
 *
 * Requirements:
 * - 2px amplitude wave (lambda = 24px) while playing
 * - Eases smoothly between playing 2px wave and flat line (amplitude = 0) when paused over 320ms
 * - Drives rAF canvas animation loop ONLY while playing AND visible (document.visibilityState === 'visible')
 * - Registers visibilitychange listener to stop rAF when tab is hidden, resuming when visible
 * - Stops the loop completely when paused and eased
 * - Eliminates synchronous layout reads (getBoundingClientRect) inside rAF loop by caching bounds
 * - Displays live formatted timestamp badge (mm:ss) while dragging seek handle
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

  // Layout cache to eliminate layout reads (getBoundingClientRect) inside rAF loop
  const boundsRef = useRef({ width: 0, height: 0, left: 0, top: 0 });
  const dprRef = useRef(1);

  // Waveform state tracking
  const phaseOffsetRef = useRef(0);
  const currentAmpRef = useRef<number>(isPlaying && !checkPrefersReducedMotion() ? WAVE_CONSTANTS.AMPLITUDE_PLAYING : WAVE_CONSTANTS.AMPLITUDE_PAUSED);
  const targetAmpRef = useRef<number>(isPlaying && !checkPrefersReducedMotion() ? WAVE_CONSTANTS.AMPLITUDE_PLAYING : WAVE_CONSTANTS.AMPLITUDE_PAUSED);
  const easeStartAmpRef = useRef<number>(currentAmpRef.current);
  const easeStartTimeRef = useRef(0);
  const isEasingRef = useRef(false);

  // Animation and state refs
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const isPlayingRef = useRef(isPlaying);
  const isDraggingRef = useRef(isDragging);
  const dragValueRef = useRef(dragValue);
  const valueRef = useRef(value);
  const maxRef = useRef(max);
  const accentColorRef = useRef(accentColor);

  isPlayingRef.current = isPlaying;
  isDraggingRef.current = isDragging;
  dragValueRef.current = dragValue;
  valueRef.current = value;
  maxRef.current = max;
  accentColorRef.current = accentColor;

  // Sync internal drag value with incoming prop
  useEffect(() => {
    if (!isDragging) {
      setDragValue(value);
    }
  }, [value, isDragging]);

  const currentValue = isDragging ? dragValue : value;
  const progressRatio = max > 0 ? Math.min(1, Math.max(0, currentValue / max)) : 0;
  const progressRatioRef = useRef(progressRatio);
  progressRatioRef.current = progressRatio;

  /**
   * Draw canvas frame using cached dimensions (ZERO layout reads)
   */
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = boundsRef.current;
    if (width <= 0 || height <= 0) return;

    const dpr = dprRef.current;
    const ratio = progressRatioRef.current;
    const totalProgressPx = width * ratio;
    const currentAmp = currentAmpRef.current;
    const phaseOffset = phaseOffsetRef.current;
    const color = accentColorRef.current;
    const strokeWidth = WAVE_CONSTANTS.STROKE_WIDTH;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const centerY = height / 2;

    // Amplitude dampening near totalProgressPx
    const waveProgressPx = totalProgressPx;
    const transitionLength = 1.5 * WAVE_CONSTANTS.WAVELENGTH;
    const computeAmplitude = (x: number, sign: number): number => {
      const coeff = Math.max(0, Math.min(1, (waveProgressPx + transitionLength / 2 - x) / transitionLength));
      return sign * currentAmp * coeff;
    };

    const dist = WAVE_CONSTANTS.WAVELENGTH / 2;
    const waveStart = -phaseOffset - WAVE_CONSTANTS.WAVELENGTH;
    const waveEnd = width + WAVE_CONSTANTS.WAVELENGTH;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = strokeWidth;

    // 1. Draw Active Track (0 to totalProgressPx)
    if (totalProgressPx > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, totalProgressPx, height);
      ctx.clip();

      ctx.beginPath();
      ctx.moveTo(waveStart, centerY);
      let currentX = waveStart;
      let waveSign = 1;
      let curAmp = computeAmplitude(currentX, waveSign);

      while (currentX < waveEnd) {
        waveSign = -waveSign;
        const nextX = currentX + dist;
        const midX = currentX + dist / 2;
        const nextAmp = computeAmplitude(nextX, waveSign);

        ctx.bezierCurveTo(
          midX,
          centerY + curAmp,
          midX,
          centerY + nextAmp,
          nextX,
          centerY + nextAmp
        );

        curAmp = nextAmp;
        currentX = nextX;
      }

      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.restore();
    }

    // 2. Draw Inactive Track (totalProgressPx to width)
    if (totalProgressPx < width) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(totalProgressPx, 0, width - totalProgressPx, height);
      ctx.clip();

      ctx.beginPath();
      ctx.moveTo(waveStart, centerY);
      let currentX = waveStart;
      let waveSign = 1;
      let curAmp = computeAmplitude(currentX, waveSign);

      while (currentX < waveEnd) {
        waveSign = -waveSign;
        const nextX = currentX + dist;
        const midX = currentX + dist / 2;
        const nextAmp = computeAmplitude(nextX, waveSign);

        ctx.bezierCurveTo(
          midX,
          centerY + curAmp,
          midX,
          centerY + nextAmp,
          nextX,
          centerY + nextAmp
        );

        curAmp = nextAmp;
        currentX = nextX;
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.stroke();
      ctx.restore();
    }

    // 3. Left Endcap circle
    ctx.beginPath();
    ctx.arc(strokeWidth / 2, centerY, strokeWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // 4. Right Endcap circle
    ctx.beginPath();
    ctx.arc(width - strokeWidth / 2, centerY, strokeWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fill();

    // 5. Vertical Scrubber Thumb Bar
    const dragging = isDraggingRef.current;
    const barHalfHeight = Math.max(6, (currentAmp > 0 ? currentAmp : 0) + strokeWidth + (dragging ? 3 : 1));
    const barWidth = dragging ? 4.5 : 3.5;

    ctx.beginPath();
    ctx.moveTo(totalProgressPx, centerY - barHalfHeight);
    ctx.lineTo(totalProgressPx, centerY + barHalfHeight);
    ctx.strokeStyle = color;
    ctx.lineWidth = barWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.restore();
  }, []);

  /**
   * Stop canvas animation loop
   */
  const stopLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  /**
   * Start canvas animation loop with visibility gating
   */
  const startLoop = useCallback(() => {
    if (rafIdRef.current !== null) return;
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;

    lastTimeRef.current = performance.now();

    const tick = (now: number) => {
      // Visibility gating: stop loop when tab is hidden
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        rafIdRef.current = null;
        return;
      }

      const deltaTime = Math.min(0.1, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      // Animate wave phase while playing
      if (isPlayingRef.current && !checkPrefersReducedMotion()) {
        phaseOffsetRef.current = (phaseOffsetRef.current + deltaTime * WAVE_CONSTANTS.PHASE_SPEED) % WAVE_CONSTANTS.WAVELENGTH;
      }

      // Easing calculation over exactly 320ms
      if (isEasingRef.current) {
        const elapsed = now - easeStartTimeRef.current;
        currentAmpRef.current = calculateAmplitudeEase(
          easeStartAmpRef.current,
          targetAmpRef.current,
          elapsed,
          WAVE_CONSTANTS.EASE_DURATION_MS
        );

        if (elapsed >= WAVE_CONSTANTS.EASE_DURATION_MS) {
          currentAmpRef.current = targetAmpRef.current;
          isEasingRef.current = false;
        }
      }

      // Draw frame without synchronous layout reads
      drawFrame();

      // Loop condition: run while actively playing OR during 320ms easing transition
      const shouldContinue = (isPlayingRef.current && !checkPrefersReducedMotion()) || isEasingRef.current;

      if (shouldContinue) {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        rafIdRef.current = null;
      }
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, [drawFrame]);

  // Handle play/pause state change and trigger 320ms smooth ease
  useEffect(() => {
    const reduced = checkPrefersReducedMotion();
    const newTarget = isPlaying && !reduced ? WAVE_CONSTANTS.AMPLITUDE_PLAYING : WAVE_CONSTANTS.AMPLITUDE_PAUSED;

    if (newTarget !== targetAmpRef.current) {
      targetAmpRef.current = newTarget;
      easeStartAmpRef.current = currentAmpRef.current;
      easeStartTimeRef.current = performance.now();
      isEasingRef.current = true;

      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        startLoop();
      }
    }
  }, [isPlaying, startLoop]);

  // Handle visibilitychange listener
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopLoop();
      } else if (document.visibilityState === 'visible') {
        const shouldRun = (isPlayingRef.current && !checkPrefersReducedMotion()) || isEasingRef.current;
        if (shouldRun) {
          startLoop();
        } else {
          drawFrame();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopLoop();
    };
  }, [startLoop, stopLoop, drawFrame]);

  // Cache layout bounds via ResizeObserver (Zero layout reads in rAF)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateBounds = () => {
      const rect = container.getBoundingClientRect();
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      dprRef.current = dpr;
      boundsRef.current = {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top
      };

      const canvas = canvasRef.current;
      if (canvas) {
        const targetW = Math.round(rect.width * dpr);
        const targetH = Math.round(rect.height * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
      }
      drawFrame();
    };

    updateBounds();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateBounds();
      });
      resizeObserver.observe(container);
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [drawFrame]);

  // Static redraw when paused or value changes
  useEffect(() => {
    if (!isPlaying && !isEasingRef.current) {
      drawFrame();
    }
  }, [value, max, accentColor, isPlaying, drawFrame]);

  // Pointer drag calculation using cached bounds
  const calculateSeekFromPointer = useCallback(
    (clientX: number) => {
      const { width, left } = boundsRef.current;
      if (width <= 0 || maxRef.current <= 0) return 0;
      const x = Math.max(0, Math.min(width, clientX - left));
      return (x / width) * maxRef.current;
    },
    []
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    // Refresh cached rect on pointer down
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      boundsRef.current = {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top
      };
    }
    setIsDragging(true);
    const newPos = calculateSeekFromPointer(e.clientX);
    setDragValue(newPos);
    drawFrame();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      const newPos = calculateSeekFromPointer(e.clientX);
      setDragValue(newPos);
      drawFrame();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      const finalPos = calculateSeekFromPointer(e.clientX);
      onSeek(finalPos);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      drawFrame();
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const dragPercent = Math.max(0, Math.min(100, progressRatio * 100));

  return (
    <div className={`w-full flex flex-col gap-1 select-none touch-none py-1 ${className}`}>
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        role="slider"
        aria-label="Seek bar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={currentValue}
        aria-valuetext={formatTime(currentValue)}
        className="relative w-full h-12 flex items-center cursor-pointer group"
      >
        <canvas ref={canvasRef} className="w-full h-full block pointer-events-none" />

        {/* Live Formatted Timestamp Badge while Dragging (R1) */}
        {isDragging && (
          <div
            data-testid="seek-timestamp-badge"
            role="tooltip"
            aria-hidden="false"
            className="absolute -top-7 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-white text-black text-[11px] font-bold font-mono shadow-[0_4px_14px_rgba(0,0,0,0.5)] pointer-events-none z-30 select-none flex items-center justify-center whitespace-nowrap"
            style={{
              left: `${dragPercent}%`
            }}
          >
            {formatTimestampBadge(dragValue)}
          </div>
        )}
      </div>

      {/* Timestamps */}
      <div className="flex justify-between items-center text-xs font-semibold text-white/55 px-1 tracking-wider tabular-nums">
        <span>{formatTime(isDragging ? dragValue : value)}</span>
        <span>{max > 0 ? `-${formatTime(max - (isDragging ? dragValue : value))}` : '0:00'}</span>
      </div>
    </div>
  );
};
