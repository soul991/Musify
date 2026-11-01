import { Transition, Variants } from 'framer-motion';

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

export const easeOutQuad = [0.22, 1, 0.36, 1] as const;

export const durations = {
  tap: 0.12, // 120ms
  fast: 0.2, // 200ms
  medium: 0.32, // 320ms
  slow: 0.5 // 500ms
} as const;

/**
 * Standard press feedback: scale down to 0.97 in 120ms
 */
export const pressFeedback = {
  whileTap: { scale: 0.97 },
  transition: { duration: durations.tap, ease: easeOutQuad }
};

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

