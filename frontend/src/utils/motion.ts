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

export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 32,
  mass: 0.8
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
