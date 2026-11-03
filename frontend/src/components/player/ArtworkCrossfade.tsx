/**
 * Artwork Crossfade & Dual-Buffer Image Layer (R4)
 *
 * Requirements:
 * - 320ms crossfade on track change animating opacity ONLY.
 * - Under prefers-reduced-motion: reduce, transition degrades to 100ms linear opacity.
 * - Strict 1:1 aspect ratio maintained with 0 layout shift (aspect-square).
 * - Image error fallback handling with 0 layout shift.
 * - Guardrails: Zero animations on layout properties (width, height, top, bottom, margin, padding).
 *   Prohibit CSS transition all.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, Transition, Variants, useReducedMotion } from 'framer-motion';

export const ARTWORK_CROSSFADE_DURATION_SECONDS = 0.32; // 320ms per R4
export const ARTWORK_CROSSFADE_DURATION_MS = 320;
export const ARTWORK_REDUCED_MOTION_SECONDS = 0.10; // 100ms per R6
export const ARTWORK_REDUCED_MOTION_MS = 100;
export const DEFAULT_ARTWORK_FALLBACK = '/icons/musify-icon.svg';

export const ARTWORK_ALLOWED_ANIMATED_PROPERTIES = ['opacity'] as const;
export const ARTWORK_PROHIBITED_ANIMATED_PROPERTIES = [
  'width',
  'height',
  'top',
  'bottom',
  'left',
  'right',
  'margin',
  'padding'
] as const;

/**
 * Normal 320ms crossfade transition (opacity only)
 */
export const artworkCrossfadeTransition: Transition = {
  duration: ARTWORK_CROSSFADE_DURATION_SECONDS,
  ease: [0.4, 0.0, 0.2, 1]
};

/**
 * Reduced motion 100ms linear transition (opacity only)
 */
export const artworkReducedMotionTransition: Transition = {
  duration: ARTWORK_REDUCED_MOTION_SECONDS,
  ease: 'linear'
};

export const artworkOpacityVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: artworkCrossfadeTransition
  },
  exit: {
    opacity: 0,
    transition: artworkCrossfadeTransition
  }
};

export const artworkReducedOpacityVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: artworkReducedMotionTransition
  },
  exit: {
    opacity: 0,
    transition: artworkReducedMotionTransition
  }
};

export interface ArtworkCrossfadeProps {
  trackId?: string | number | null;
  artworkUrl?: string | null;
  title?: string;
  artist?: string;
  className?: string;
  alt?: string;
  fallbackSrc?: string;
  reducedMotion?: boolean;
  onTransitionComplete?: () => void;
  priority?: boolean;
}

interface ImageBuffer {
  id: string;
  url: string;
  title: string;
  hasError: boolean;
  key: string;
}

export const ArtworkCrossfade: React.FC<ArtworkCrossfadeProps> = ({
  trackId,
  artworkUrl,
  title = 'Now Playing Track',
  artist,
  className = '',
  alt,
  fallbackSrc = DEFAULT_ARTWORK_FALLBACK,
  reducedMotion: propReducedMotion,
  onTransitionComplete
}) => {
  const systemReducedMotion = useReducedMotion();
  const shouldReduceMotion = propReducedMotion ?? systemReducedMotion ?? false;

  const activeTransition = shouldReduceMotion
    ? artworkReducedMotionTransition
    : artworkCrossfadeTransition;

  const safeId = trackId !== undefined && trackId !== null ? String(trackId) : 'unknown';
  const safeUrl = artworkUrl && artworkUrl.trim() !== '' ? artworkUrl.trim() : fallbackSrc;
  const currentKey = `${safeId}:${safeUrl}`;

  // Current buffer representing the active track
  const [currentBuffer, setCurrentBuffer] = useState<ImageBuffer>({
    id: safeId,
    url: safeUrl,
    title,
    hasError: false,
    key: currentKey
  });

  // Previous buffer held underneath during the 320ms crossfade
  const [previousBuffer, setPreviousBuffer] = useState<ImageBuffer | null>(null);
  const [isCrossfading, setIsCrossfading] = useState<boolean>(false);

  // Keep track of latest key to handle track changes
  const prevKeyRef = useRef<string>(currentKey);

  useEffect(() => {
    if (prevKeyRef.current !== currentKey) {
      // Incoming track is different: initiate dual-buffer crossfade
      setPreviousBuffer(currentBuffer);
      setCurrentBuffer({
        id: safeId,
        url: safeUrl,
        title,
        hasError: false,
        key: currentKey
      });
      setIsCrossfading(true);
      prevKeyRef.current = currentKey;
    }
  }, [currentKey, safeId, safeUrl, title, currentBuffer]);

  const handleAnimationComplete = () => {
    // Clean up previous buffer once incoming buffer has fully faded in
    setPreviousBuffer(null);
    setIsCrossfading(false);
    onTransitionComplete?.();
  };

  const handleCurrentError = () => {
    setCurrentBuffer((prev) => ({ ...prev, hasError: true }));
  };

  const handlePreviousError = () => {
    setPreviousBuffer((prev) => (prev ? { ...prev, hasError: true } : null));
  };

  const imageAlt = alt || (artist ? `${title} - ${artist}` : title);

  return (
    <div
      data-testid="artwork-crossfade-container"
      className={`relative w-full h-full aspect-square overflow-hidden select-none ${className}`}
    >
      {/* ========================================================= */}
      {/* LAYER 1: OUTGOING / PREVIOUS ARTWORK BUFFER (Static Base)  */}
      {/* ========================================================= */}
      {previousBuffer && (
        <div
          data-testid="artwork-previous-layer"
          className="absolute inset-0 w-full h-full aspect-square pointer-events-none"
        >
          <img
            src={previousBuffer.hasError ? fallbackSrc : previousBuffer.url}
            alt={previousBuffer.title}
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={handlePreviousError}
            className="w-full h-full aspect-square object-cover"
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* LAYER 2: INCOMING / CURRENT ARTWORK BUFFER (Fades in)     */}
      {/* Animates strictly OPACITY over 320ms (100ms on reduced)   */}
      {/* ========================================================= */}
      <motion.div
        key={currentBuffer.key}
        data-testid="artwork-current-layer"
        initial={{ opacity: previousBuffer ? 0 : 1 }}
        animate={{ opacity: 1 }}
        transition={activeTransition}
        onAnimationComplete={handleAnimationComplete}
        style={{
          willChange: isCrossfading ? 'opacity' : 'auto'
        }}
        className="absolute inset-0 w-full h-full aspect-square"
      >
        <img
          data-testid="artwork-image"
          src={currentBuffer.hasError ? fallbackSrc : currentBuffer.url}
          alt={imageAlt}
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={handleCurrentError}
          className="w-full h-full aspect-square object-cover"
        />
      </motion.div>
    </div>
  );
};
