import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as motion from '../src/utils/motion.ts';
import {
  PLAYER_EXPAND_PHYSICS,
  CONTENT_FADE_DELAY_SECONDS,
  CONTENT_FADE_DELAY_MS,
  REDUCED_MOTION_DURATION_SECONDS,
  REDUCED_MOTION_DURATION_MS,
  SHARED_LAYOUT_IDS,
  ALLOWED_ANIMATED_PROPERTIES,
  PROHIBITED_ANIMATED_PROPERTIES,
  playerContainerSpring,
  playerReducedMotionTransition,
  interiorContentFadeVariants,
  interiorContentReducedVariants,
  FullPlayer,
} from '../src/components/player/FullPlayer.tsx';
import {
  MINI_PLAYER_SHARED_LAYOUT_IDS,
  FloatingMiniPlayer,
} from '../src/components/player/FloatingMiniPlayer.tsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');

describe('Milestone 3 (R3): Shared-Element Player Expand and Collapse', () => {
  const fullPlayerPath = path.join(frontendRoot, 'src', 'components', 'player', 'FullPlayer.tsx');
  const fullPlayerSource = fs.readFileSync(fullPlayerPath, 'utf8');

  const miniPlayerPath = path.join(frontendRoot, 'src', 'components', 'player', 'FloatingMiniPlayer.tsx');
  const miniPlayerSource = fs.readFileSync(miniPlayerPath, 'utf8');

  // =========================================================================
  // Suite 1: Spring Physics Parameters & Critical Damping Verification
  // =========================================================================
  describe('1. Spring Physics Parameters & Damping Ratio (zeta ≈ 1.026)', () => {
    it('calibrates springPlayerExpand with stiffness: 380, damping: 40, mass: 1', () => {
      assert.ok(motion.springPlayerExpand, 'motion.ts must export springPlayerExpand');
      assert.strictEqual(motion.springPlayerExpand.type, 'spring');
      assert.strictEqual(motion.springPlayerExpand.stiffness, 380, 'Stiffness must be exactly 380 N/m');
      assert.strictEqual(motion.springPlayerExpand.damping, 40, 'Damping must be exactly 40 N*s/m');
      assert.strictEqual(motion.springPlayerExpand.mass, 1, 'Mass must be exactly 1 kg');
    });

    it('matches PLAYER_EXPAND_PHYSICS constants exported from FullPlayer.tsx', () => {
      assert.strictEqual(PLAYER_EXPAND_PHYSICS.stiffness, 380);
      assert.strictEqual(PLAYER_EXPAND_PHYSICS.damping, 40);
      assert.strictEqual(PLAYER_EXPAND_PHYSICS.mass, 1);
      assert.strictEqual(playerContainerSpring.type, 'spring');
      assert.strictEqual(playerContainerSpring.stiffness, 380);
      assert.strictEqual(playerContainerSpring.damping, 40);
      assert.strictEqual(playerContainerSpring.mass, 1);
    });

    it('mathematically evaluates damping ratio zeta to ~1.026 (critically damped, zero overshoot)', () => {
      const k = PLAYER_EXPAND_PHYSICS.stiffness;
      const c = PLAYER_EXPAND_PHYSICS.damping;
      const m = PLAYER_EXPAND_PHYSICS.mass;

      // Critical damping coefficient: c_c = 2 * sqrt(k * m)
      const c_critical = 2 * Math.sqrt(k * m);
      // Damping ratio: zeta = c / c_c
      const zeta = c / c_critical;

      // 40 / (2 * sqrt(380)) = 40 / 38.9871759... = 1.025978...
      assert.ok(
        zeta >= 1.025 && zeta <= 1.027,
        `Damping ratio zeta (${zeta.toFixed(4)}) must be slightly overdamped / critically damped (1.026)`
      );
      assert.strictEqual(
        Math.round(zeta * 1000) / 1000,
        1.026,
        'Zeta rounded to 3 decimal places must be exactly 1.026'
      );
      assert.strictEqual(
        PLAYER_EXPAND_PHYSICS.zeta,
        zeta,
        'Exported PLAYER_EXPAND_PHYSICS.zeta must match exact analytical formula'
      );
    });

    it('uses springPlayerExpand as the default container transition in FullPlayer.tsx', () => {
      assert.match(
        fullPlayerSource,
        /transition=\{\s*shouldReduceMotion\s*\?\s*playerReducedMotionTransition\s*:\s*playerContainerSpring\s*\}/,
        'FullPlayer container must bind playerContainerSpring when shouldReduceMotion is false'
      );
    });
  });

  // =========================================================================
  // Suite 2: Transition Property Restrictions (Zero Layout Thrashing)
  // =========================================================================
  describe('2. Transition Property Restrictions (Transform & Opacity Only)', () => {
    it('defines allowed animated properties restricted strictly to transform and opacity', () => {
      const allowed = new Set(ALLOWED_ANIMATED_PROPERTIES);
      assert.ok(allowed.has('transform'));
      assert.ok(allowed.has('opacity'));
      assert.ok(allowed.has('y')); // Framer Motion compiles 'y' to transform: translateY()

      for (const prohibited of PROHIBITED_ANIMATED_PROPERTIES) {
        assert.ok(
          !allowed.has(prohibited as any),
          `Prohibited property '${prohibited}' must not be in ALLOWED_ANIMATED_PROPERTIES`
        );
      }
    });

    it('verifies FullPlayer container animates y and opacity only (no top/bottom/width/height)', () => {
      // Normal motion initial: { y: '100%', opacity: 0 }
      assert.match(
        fullPlayerSource,
        /initial=\{\s*shouldReduceMotion\s*\?\s*\{\s*opacity:\s*0\s*\}\s*:\s*\{\s*y:\s*['"]100%['"],\s*opacity:\s*0\s*\}\s*\}/,
        'FullPlayer container initial must animate y and opacity only'
      );
      // Animate: { y: 0, opacity: 1 }
      assert.match(
        fullPlayerSource,
        /animate=\{\s*shouldReduceMotion\s*\?\s*\{\s*opacity:\s*1\s*\}\s*:\s*\{\s*y:\s*0,\s*opacity:\s*1\s*\}\s*\}/,
        'FullPlayer container animate must animate y and opacity only'
      );
      // Exit: { y: '100%', opacity: 0 }
      assert.match(
        fullPlayerSource,
        /exit=\{\s*shouldReduceMotion\s*\?\s*\{\s*opacity:\s*0\s*\}\s*:\s*\{\s*y:\s*['"]100%['"],\s*opacity:\s*0\s*\}\s*\}/,
        'FullPlayer container exit must animate y and opacity only'
      );
    });

    it('verifies interior content fade variants animate opacity only', () => {
      const initialKeys = Object.keys(interiorContentFadeVariants.initial as any);
      assert.deepStrictEqual(initialKeys, ['opacity'], 'initial must animate opacity only');

      const animateKeys = Object.keys(interiorContentFadeVariants.animate as any).filter(
        (k) => k !== 'transition'
      );
      assert.deepStrictEqual(animateKeys, ['opacity'], 'animate must animate opacity only');

      const exitKeys = Object.keys(interiorContentFadeVariants.exit as any).filter(
        (k) => k !== 'transition'
      );
      assert.deepStrictEqual(exitKeys, ['opacity'], 'exit must animate opacity only');
    });

    it('verifies zero transition-all or transition: all in FullPlayer.tsx and FloatingMiniPlayer.tsx', () => {
      const fullPlayerHasTransitionAll = /transition-all|transition:\s*all/i.test(fullPlayerSource);
      assert.strictEqual(
        fullPlayerHasTransitionAll,
        false,
        'FullPlayer.tsx must not contain transition-all or transition: all'
      );

      const miniPlayerHasTransitionAll = /transition-all|transition:\s*all/i.test(miniPlayerSource);
      assert.strictEqual(
        miniPlayerHasTransitionAll,
        false,
        'FloatingMiniPlayer.tsx must not contain transition-all or transition: all'
      );
    });

    it('verifies mini player top progress line animates scaleX instead of width reflow', () => {
      assert.match(
        miniPlayerSource,
        /transform:\s*`scaleX\(\$\{progressRatio\}\)`/,
        'Mini player progress line must use GPU compositor scaleX transform'
      );
      assert.doesNotMatch(
        miniPlayerSource,
        /transition-\[width\]/,
        'Mini player progress line must not use transition-[width]'
      );
    });

    it('verifies zero layout reads (getBoundingClientRect/offsetHeight) in animation loops', () => {
      // In FullPlayer.tsx, getBoundingClientRect must only be called in user event handlers (mouse move / click)
      const rAFMatches = fullPlayerSource.match(/requestAnimationFrame\([^)]+\)/g);
      assert.strictEqual(
        rAFMatches,
        null,
        'FullPlayer.tsx must not declare custom requestAnimationFrame loops reading layout geometry'
      );
    });
  });

  // =========================================================================
  // Suite 3: Interior Content Fade-In Delay (Exactly 80ms on Opacity)
  // =========================================================================
  describe('3. Interior Content Fade-In Delay (Exactly 80ms Delay on Opacity)', () => {
    it('defines CONTENT_FADE_DELAY as exactly 80ms (0.08 seconds)', () => {
      assert.strictEqual(CONTENT_FADE_DELAY_MS, 80, 'Delay in milliseconds must be 80ms');
      assert.strictEqual(CONTENT_FADE_DELAY_SECONDS, 0.08, 'Delay in seconds must be 0.08s');
    });

    it('sets interiorContentFadeVariants delay to precisely 0.08 seconds', () => {
      const animateTransition = (interiorContentFadeVariants.animate as any).transition;
      assert.ok(animateTransition, 'animate must define transition');
      assert.strictEqual(
        animateTransition.delay,
        0.08,
        'Interior content delay must be exactly 0.08 seconds (80ms)'
      );
    });

    it('applies interior content fade delay to FullPlayer header (top bar)', () => {
      assert.match(
        fullPlayerSource,
        /<motion\.div[^>]*variants=\{activeInteriorVariants\}[^>]*data-testid=["']player-interior-header["']/,
        'Top bar header must be wrapped in motion.div with activeInteriorVariants'
      );
    });

    it('applies interior content fade delay to FullPlayer seekbar', () => {
      assert.match(
        fullPlayerSource,
        /<motion\.div[^>]*variants=\{activeInteriorVariants\}[^>]*data-testid=["']player-interior-seekbar["']/,
        'Adaptive seekbar container must be wrapped in motion.div with activeInteriorVariants'
      );
    });

    it('applies interior content fade delay to FullPlayer secondary controls & buttons', () => {
      assert.match(
        fullPlayerSource,
        /data-testid=["']player-interior-controls["']/,
        'Controls container must have data-testid="player-interior-controls"'
      );
      assert.match(
        fullPlayerSource,
        /<motion\.button[^>]*variants=\{activeInteriorVariants\}[^>]*onClick=\{prevTrack\}/,
        'Prev button must be animated with activeInteriorVariants'
      );
      assert.match(
        fullPlayerSource,
        /<motion\.button[^>]*variants=\{activeInteriorVariants\}[^>]*onClick=\{nextTrack\}/,
        'Next button must be animated with activeInteriorVariants'
      );
    });

    it('applies interior content fade delay to FullPlayer volume slider track', () => {
      assert.match(
        fullPlayerSource,
        /<motion\.div[^>]*variants=\{activeInteriorVariants\}[^>]*data-testid=["']player-interior-volume["']/,
        'Volume slider must be wrapped in motion.div with activeInteriorVariants'
      );
    });

    it('applies interior content fade delay to FullPlayer bottom action triggers (lyrics/queue)', () => {
      assert.match(
        fullPlayerSource,
        /<motion\.div[^>]*variants=\{activeInteriorVariants\}[^>]*data-testid=["']player-interior-triggers["']/,
        'Bottom action triggers container must be wrapped in motion.div with activeInteriorVariants'
      );
    });

    it('applies interior content fade delay to compact synced lyrics banner', () => {
      assert.match(
        fullPlayerSource,
        /<motion\.div[^>]*variants=\{activeInteriorVariants\}[^>]*data-testid=["']player-interior-lyrics-banner["']/,
        'Compact synced lyrics banner must be wrapped in motion.div with activeInteriorVariants'
      );
    });

    it('ensures shared elements (artwork, title, play-button) morph without 80ms delay', () => {
      // Shared elements must NOT be wrapped in interior variants with delay 0.08
      assert.match(
        fullPlayerSource,
        /<motion\.div[^>]*layoutId=["']player-artwork["'][^>]*transition=\{activeSharedTransition\}/,
        'player-artwork must bind activeSharedTransition directly (no interior delay)'
      );
      assert.match(
        fullPlayerSource,
        /<motion\.h1[^>]*layoutId=["']player-title["'][^>]*transition=\{activeSharedTransition\}/,
        'player-title must bind activeSharedTransition directly (no interior delay)'
      );
    });
  });

  // =========================================================================
  // Suite 4: Shared-Element Layout ID Matching Across FloatingMiniPlayer & FullPlayer
  // =========================================================================
  describe('4. Shared-Element Layout ID Matching Across FloatingMiniPlayer & FullPlayer', () => {
    it('defines matching SHARED_LAYOUT_IDS constants across both components', () => {
      assert.strictEqual(SHARED_LAYOUT_IDS.ARTWORK, 'player-artwork');
      assert.strictEqual(SHARED_LAYOUT_IDS.TITLE, 'player-title');
      assert.strictEqual(SHARED_LAYOUT_IDS.PLAY_BUTTON, 'player-play-button');

      assert.strictEqual(MINI_PLAYER_SHARED_LAYOUT_IDS.ARTWORK, SHARED_LAYOUT_IDS.ARTWORK);
      assert.strictEqual(MINI_PLAYER_SHARED_LAYOUT_IDS.TITLE, SHARED_LAYOUT_IDS.TITLE);
      assert.strictEqual(MINI_PLAYER_SHARED_LAYOUT_IDS.PLAY_BUTTON, SHARED_LAYOUT_IDS.PLAY_BUTTON);
    });

    it('verifies layoutId="player-artwork" exists in both FloatingMiniPlayer.tsx and FullPlayer.tsx', () => {
      assert.match(
        miniPlayerSource,
        /layoutId=["']player-artwork["']/,
        'FloatingMiniPlayer.tsx must declare layoutId="player-artwork"'
      );
      assert.match(
        fullPlayerSource,
        /layoutId=["']player-artwork["']/,
        'FullPlayer.tsx must declare layoutId="player-artwork"'
      );
    });

    it('verifies layoutId="player-title" exists in both FloatingMiniPlayer.tsx and FullPlayer.tsx', () => {
      assert.match(
        miniPlayerSource,
        /layoutId=["']player-title["']/,
        'FloatingMiniPlayer.tsx must declare layoutId="player-title"'
      );
      assert.match(
        fullPlayerSource,
        /layoutId=["']player-title["']/,
        'FullPlayer.tsx must declare layoutId="player-title"'
      );
    });

    it('verifies layoutId="player-play-button" exists in FloatingMiniPlayer.tsx and both FullPlayer styles', () => {
      assert.match(
        miniPlayerSource,
        /layoutId=["']player-play-button["']/,
        'FloatingMiniPlayer.tsx must declare layoutId="player-play-button"'
      );

      // Check Material mode (wavy style)
      assert.match(
        fullPlayerSource,
        /<FlowerPlayButton[^>]*styleType=["']wavy["'][^>]*layoutId=["']player-play-button["']|<FlowerPlayButton[^>]*layoutId=["']player-play-button["'][^>]*styleType=["']wavy["']/,
        'FullPlayer.tsx Material mode must define layoutId="player-play-button"'
      );

      // Check Apple mode (apple_squircle style)
      assert.match(
        fullPlayerSource,
        /<FlowerPlayButton[^>]*styleType=["']apple_squircle["'][^>]*layoutId=["']player-play-button["']|<FlowerPlayButton[^>]*layoutId=["']player-play-button["'][^>]*styleType=["']apple_squircle["']/,
        'FullPlayer.tsx Apple mode must define layoutId="player-play-button"'
      );
    });

    it('binds springPlayerExpand transition to shared layout elements in FloatingMiniPlayer.tsx', () => {
      assert.match(
        miniPlayerSource,
        /const\s+sharedTransition\s*=\s*shouldReduceMotion\s*\?\s*\{\s*duration:\s*0\.1,\s*ease:\s*['"]linear['"](?:\s+as\s+const)?\s*\}\s*:\s*springPlayerExpand/,
        'FloatingMiniPlayer must compute sharedTransition from springPlayerExpand'
      );
      assert.match(
        miniPlayerSource,
        /<motion\.div[^>]*layoutId=["']player-artwork["'][^>]*transition=\{sharedTransition\}/,
        'Artwork in mini player must bind transition={sharedTransition}'
      );
      assert.match(
        miniPlayerSource,
        /<motion\.p[^>]*layoutId=["']player-title["'][^>]*transition=\{sharedTransition\}/,
        'Title in mini player must bind transition={sharedTransition}'
      );
      assert.match(
        miniPlayerSource,
        /<motion\.button[^>]*layoutId=["']player-play-button["'][^>]*transition=\{sharedTransition\}/,
        'Play button in mini player must bind transition={sharedTransition}'
      );
    });
  });

  // =========================================================================
  // Suite 5: Reduced Motion Accessibility Compliance
  // =========================================================================
  describe('5. Reduced Motion Compliance (100ms Opacity Fallback)', () => {
    it('defines REDUCED_MOTION_DURATION as exactly 100ms (0.1 seconds)', () => {
      assert.strictEqual(REDUCED_MOTION_DURATION_MS, 100);
      assert.strictEqual(REDUCED_MOTION_DURATION_SECONDS, 0.1);
      assert.strictEqual(playerReducedMotionTransition.duration, 0.1);
      assert.strictEqual(playerReducedMotionTransition.ease, 'linear');
    });

    it('replaces spring physics with 100ms opacity transition in interiorContentReducedVariants', () => {
      const animateTransition = (interiorContentReducedVariants.animate as any).transition;
      assert.ok(animateTransition, 'Reduced variants must define animate transition');
      assert.strictEqual(animateTransition.duration, 0.1, 'Duration must be 100ms (0.1s)');
      assert.strictEqual(animateTransition.ease, 'linear');
      assert.strictEqual(
        animateTransition.delay,
        undefined,
        'Reduced motion must eliminate delay for immediate responsive access'
      );

      const exitTransition = (interiorContentReducedVariants.exit as any).transition;
      assert.strictEqual(exitTransition.duration, 0.1);
    });

    it('queries useReducedMotion hook in both FullPlayer and FloatingMiniPlayer', () => {
      assert.match(
        fullPlayerSource,
        /const\s+shouldReduceMotion\s*=\s*useReducedMotion\(\)/,
        'FullPlayer.tsx must call useReducedMotion()'
      );
      assert.match(
        miniPlayerSource,
        /const\s+shouldReduceMotion\s*=\s*useReducedMotion\(\)/,
        'FloatingMiniPlayer.tsx must call useReducedMotion()'
      );
    });

    it('guards ambient background orbs against infinite loops when paused or reduced motion active', () => {
      assert.match(
        fullPlayerSource,
        /repeat:\s*isPlaying\s*&&\s*!shouldReduceMotion\s*\?\s*Infinity\s*:\s*0/,
        'FullPlayer background orbs must stop repeating when paused or when shouldReduceMotion is true'
      );
    });
  });

  // =========================================================================
  // Suite 6: State Isolation & Export Integrity Guardrails (R7)
  // =========================================================================
  describe('6. State Isolation & Export Integrity Guardrails (R7)', () => {
    it('confirms FullPlayer and FloatingMiniPlayer are exported React components', () => {
      assert.strictEqual(typeof FullPlayer, 'function', 'FullPlayer must be a valid component function');
      assert.strictEqual(typeof FloatingMiniPlayer, 'function', 'FloatingMiniPlayer must be a valid component function');
    });

    it('verifies FullPlayer only reads playback state from usePlayer() hook without mutating audio logic', () => {
      assert.match(
        fullPlayerSource,
        /const\s*\{[^}]*\}\s*=\s*usePlayer\(\);/,
        'FullPlayer must read playback state via usePlayer()'
      );
      assert.doesNotMatch(
        fullPlayerSource,
        /audioRef\.current\.src\s*=/,
        'FullPlayer must not mutate audioRef.current.src directly'
      );
    });
  });
});
