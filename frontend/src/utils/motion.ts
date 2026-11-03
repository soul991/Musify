import { Transition, Variants, useReducedMotion } from 'framer-motion';

export { useReducedMotion };

/**
 * Musify Redesign Motion Tokens (Phase 3)
 * Calibrated spring physics, easing, and durations
 */

export const springSoft: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 28,
  mass: 1
};

/**
 * Spatial moves only (player sheet open/close, page push/pop) per Design Brief Section 7
 * stiffness 380, damping 40, mass 1 (damping ratio ~ 1.0, critically damped, no wobble)
 */
export const springSpatial: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 40,
  mass: 1
};

export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 32,
  mass: 0.8
};

/**
 * Landing page hero entrance — slower, cinematic
 */
export const springCinematic: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 26,
  mass: 1.2
};

/**
 * Bento card scroll reveal — controlled pop
 */
export const springReveal: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 28,
  mass: 0.9
};

/**
 * Effects-only transitions (borders, focus glow, opacity) — critically damped, NO overshoot
 */
export const springEffects: Transition = {
  type: 'spring',
  stiffness: 1600,
  damping: 80
};

/**
 * Shared-element Player Expand & Collapse spring transition (R3)
 * Stiffness: 380, Damping: 40, Mass: 1 (zeta ~= 1.026 critically damped)
 */
export const springPlayerExpand: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 40,
  mass: 1
};

export const easeOutQuad = [0.22, 1, 0.36, 1] as const;

export const durations = {
  tap: 0.12, // 120ms legacy
  playerTap: 0.08, // 80ms (<100ms)
  fast: 0.2, // 200ms
  medium: 0.32, // 320ms
  slow: 0.5 // 500ms
} as const;

/**
 * Standard tactile press feedback: scale down to 0.97 in 80ms (< 100ms per R5)
 */
export const pressFeedback = {
  whileTap: { scale: 0.97 },
  transition: { duration: 0.08, ease: easeOutQuad }
};

/**
 * R5 Button Press Motion Tokens & Constants
 */
export const BUTTON_PRESS_SCALE = 0.97 as const;
export const BUTTON_PRESS_DURATION_SECONDS = 0.08 as const; // 80ms (<100ms per R5)
export const BUTTON_PRESS_DURATION_MS = 80 as const;
export const BUTTON_REDUCED_MOTION_DURATION_SECONDS = 0.1 as const; // 100ms per R6
export const BUTTON_REDUCED_MOTION_DURATION_MS = 100 as const;

/**
 * Tap scale token: scale(0.97) on pointer down
 */
export const buttonPressTap = {
  scale: BUTTON_PRESS_SCALE
} as const;

/**
 * Transition timing token: 80ms duration with easeOut curve
 */
export const buttonPressTransition: Transition = {
  duration: BUTTON_PRESS_DURATION_SECONDS,
  ease: easeOutQuad
};

/**
 * Complete button press feedback object for Framer Motion whileTap
 */
export const buttonPressFeedback = {
  whileTap: {
    scale: BUTTON_PRESS_SCALE,
    transition: buttonPressTransition
  },
  transition: buttonPressTransition
};

/**
 * Reduced motion fallback: scale 1.0 (no tactile scale) with 100ms linear duration
 */
export const buttonReducedPressTap = {
  scale: 1.0
} as const;

export const buttonReducedPressTransition: Transition = {
  duration: BUTTON_REDUCED_MOTION_DURATION_SECONDS,
  ease: 'linear'
};

export const buttonReducedPressFeedback = {
  whileTap: {
    scale: 1.0,
    transition: buttonReducedPressTransition
  },
  transition: buttonReducedPressTransition
};

/**
 * Standard button press variants for Framer Motion components
 */
export const buttonPressVariants: Variants = {
  initial: { scale: 1 },
  tap: { scale: BUTTON_PRESS_SCALE, transition: buttonPressTransition }
};

export const buttonReducedPressVariants: Variants = {
  initial: { scale: 1 },
  tap: { scale: 1.0, transition: buttonReducedPressTransition }
};

/**
 * Dynamic button press feedback resolver respecting prefers-reduced-motion
 */
export function getButtonPressFeedback(shouldReduceMotion?: boolean | null) {
  if (shouldReduceMotion) {
    return buttonReducedPressFeedback;
  }
  return buttonPressFeedback;
}

/**
 * R6 Reduced Motion Tokens & Guardrails
 * Under prefers-reduced-motion: reduce, eliminate waveforms, springs, and scroll animations;
 * state changes use 100ms linear opacity transitions.
 */
export const REDUCED_MOTION_DURATION_SECONDS = 0.1 as const; // 100ms per R6
export const REDUCED_MOTION_DURATION_MS = 100 as const;

export const reducedMotionTransition: Transition = {
  duration: REDUCED_MOTION_DURATION_SECONDS,
  ease: 'linear'
};

export const reducedMotionOpacityVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: reducedMotionTransition
  },
  exit: {
    opacity: 0,
    transition: reducedMotionTransition
  }
};

/**
 * Resolver for player expand/collapse shared transition
 */
export function getPlayerExpandTransition(shouldReduceMotion?: boolean | null): Transition {
  return shouldReduceMotion ? reducedMotionTransition : springPlayerExpand;
}

/**
 * Resolver for artwork crossfade transition (320ms crossfade vs 100ms linear opacity)
 */
export function getArtworkCrossfadeTransition(shouldReduceMotion?: boolean | null): Transition {
  return shouldReduceMotion
    ? reducedMotionTransition
    : { duration: 0.32, ease: [0.4, 0.0, 0.2, 1] };
}

/**
 * Resolver for artwork opacity variants
 */
export function getArtworkOpacityVariants(shouldReduceMotion?: boolean | null): Variants {
  return shouldReduceMotion
    ? reducedMotionOpacityVariants
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.32, ease: [0.4, 0.0, 0.2, 1] } },
        exit: { opacity: 0, transition: { duration: 0.32, ease: [0.4, 0.0, 0.2, 1] } }
      };
}

/**
 * Page / Route transition: 200ms fade + 8px upward slide
 */
export const pageTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.fast,
      ease: easeOutQuad
    }
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: durations.fast,
      ease: easeOutQuad
    }
  }
};

/**
 * Stagger container for list items (max 8 items, 30ms per item)
 */
export const staggerListContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.02
    }
  }
};

export const staggerListItem: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.fast,
      ease: easeOutQuad
    }
  }
};

/**
 * Modal & Sheet Transitions
 */
export const mobileSheetVariants: Variants = {
  hidden: { y: '100%' },
  visible: {
    y: 0,
    transition: springSoft
  },
  exit: {
    y: '100%',
    transition: springSnappy
  }
};

/**
 * Toast notification transition
 */
export const toastVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springSnappy
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.95,
    transition: { duration: durations.tap }
  }
};

/**
 * Search suggestion row stagger
 */
export const staggerFast = {
  staggerChildren: 0.03,
  delayChildren: 0.02
};

/**
 * Landing section and content shelves scroll reveal stagger
 */
export const staggerSection = {
  staggerChildren: 0.08,
  delayChildren: 0.15
};

/**
 * Parallax scroll config for product showcase
 */
export const parallaxConfig = {
  type: 'spring' as const,
  stiffness: 120,
  damping: 30,
  restDelta: 0.001
};

/**
 * Universal hover lift and tap scale feedback token
 */
export const hoverLift = {
  whileHover: { y: -3, transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] } },
  whileTap: { scale: 0.97, transition: { duration: 0.12 } }
};

/**
 * Forward navigation (deeper into view history): slide up + fade
 */
export const forwardTransition: Variants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 420, damping: 30 }
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.99,
    transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] }
  }
};

/**
 * Backward navigation (popping back in history): slide down + fade
 */
export const backwardTransition: Variants = {
  initial: { opacity: 0, y: -16, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 420, damping: 30 }
  },
  exit: {
    opacity: 0,
    y: 16,
    scale: 0.99,
    transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] }
  }
};

