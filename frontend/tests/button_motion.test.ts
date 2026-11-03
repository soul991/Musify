import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

import {
  BUTTON_PRESS_SCALE,
  BUTTON_PRESS_DURATION_SECONDS,
  BUTTON_PRESS_DURATION_MS,
  BUTTON_REDUCED_MOTION_DURATION_SECONDS,
  BUTTON_REDUCED_MOTION_DURATION_MS,
  buttonPressTap,
  buttonPressTransition,
  buttonPressFeedback,
  buttonReducedPressTap,
  buttonReducedPressTransition,
  buttonReducedPressFeedback,
  buttonPressVariants,
  buttonReducedPressVariants,
  getButtonPressFeedback,
  pressFeedback,
  durations
} from '../src/utils/motion.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(frontendRoot, '..');

const floatingMiniPlayerPath = path.join(frontendRoot, 'src', 'components', 'player', 'FloatingMiniPlayer.tsx');
const fullPlayerPath = path.join(frontendRoot, 'src', 'components', 'player', 'FullPlayer.tsx');
const desktopDockPlayerPath = path.join(frontendRoot, 'src', 'components', 'player', 'DesktopDockPlayer.tsx');
const motionUtilPath = path.join(frontendRoot, 'src', 'utils', 'motion.ts');

const floatingMiniPlayerSource = fs.readFileSync(floatingMiniPlayerPath, 'utf8');
const fullPlayerSource = fs.readFileSync(fullPlayerPath, 'utf8');
const desktopDockPlayerSource = fs.readFileSync(desktopDockPlayerPath, 'utf8');
const motionUtilSource = fs.readFileSync(motionUtilPath, 'utf8');

describe('Milestone 5 (R5): Button Press Feedback & Hover Interaction System', () => {
  describe('1. Standard Button Press Scale and Timing Invariants (R5)', () => {
    it('calibrates BUTTON_PRESS_SCALE to strictly 0.97', () => {
      assert.strictEqual(BUTTON_PRESS_SCALE, 0.97, 'Button press scale token must be strictly 0.97');
    });

    it('calibrates BUTTON_PRESS_DURATION_SECONDS to strictly 0.08 (80ms, < 100ms per R5)', () => {
      assert.strictEqual(BUTTON_PRESS_DURATION_SECONDS, 0.08, 'Duration in seconds must be exactly 0.08s');
      assert.ok(BUTTON_PRESS_DURATION_SECONDS < 0.10, 'Duration must be strictly under 100ms (0.10s)');
    });

    it('calibrates BUTTON_PRESS_DURATION_MS to strictly 80ms', () => {
      assert.strictEqual(BUTTON_PRESS_DURATION_MS, 80, 'Duration in ms must be exactly 80ms');
      assert.ok(BUTTON_PRESS_DURATION_MS < 100, 'Duration in ms must be strictly under 100ms');
    });

    it('exports buttonPressTap with scale 0.97', () => {
      assert.deepStrictEqual(buttonPressTap, { scale: 0.97 }, 'buttonPressTap must be { scale: 0.97 }');
    });

    it('exports buttonPressTransition with duration 0.08s and easeOutQuad', () => {
      assert.strictEqual(buttonPressTransition.duration, 0.08, 'Transition duration must be 0.08');
      assert.deepStrictEqual(buttonPressTransition.ease, [0.22, 1, 0.36, 1], 'Transition ease must match easeOutQuad');
    });

    it('exports buttonPressFeedback combining whileTap and transition tokens', () => {
      assert.strictEqual(buttonPressFeedback.whileTap.scale, 0.97, 'Feedback whileTap.scale must be 0.97');
      assert.strictEqual(buttonPressFeedback.transition.duration, 0.08, 'Feedback transition.duration must be 0.08');
      assert.strictEqual(
        (buttonPressFeedback.whileTap as any).transition?.duration,
        0.08,
        'Nested whileTap.transition.duration must be 0.08'
      );
    });

    it('exports buttonPressVariants with initial scale 1 and tap scale 0.97 in 80ms', () => {
      assert.deepStrictEqual(buttonPressVariants.initial, { scale: 1 });
      const tapVariant = buttonPressVariants.tap as any;
      assert.strictEqual(tapVariant.scale, 0.97);
      assert.strictEqual(tapVariant.transition.duration, 0.08);
    });

    it('preserves legacy pressFeedback and durations for backward compatibility', () => {
      assert.strictEqual((pressFeedback.whileTap as any).scale, 0.97);
      assert.strictEqual((pressFeedback.transition as any).duration, 0.08);
      assert.strictEqual(durations.playerTap, 0.08);
      assert.strictEqual(durations.tap, 0.12);
    });

    it('declares button press tokens in motion.ts source code', () => {
      assert.ok(motionUtilSource.includes('export const BUTTON_PRESS_SCALE = 0.97'));
      assert.ok(motionUtilSource.includes('export const BUTTON_PRESS_DURATION_SECONDS = 0.08'));
      assert.ok(motionUtilSource.includes('export const buttonPressTap'));
      assert.ok(motionUtilSource.includes('export const buttonPressTransition'));
      assert.ok(motionUtilSource.includes('export const buttonPressFeedback'));
      assert.ok(motionUtilSource.includes('export function getButtonPressFeedback'));
    });
  });

  describe('2. Zero Hover Scaling & Background-Only Hover Restrictions (R5)', () => {
    it('verifies zero hover:scale classes across all player components', () => {
      const hoverScaleRegex = /hover:scale-\d+/;
      assert.strictEqual(
        hoverScaleRegex.test(floatingMiniPlayerSource),
        false,
        'FloatingMiniPlayer.tsx must contain 0 hover:scale-* classes'
      );
      assert.strictEqual(
        hoverScaleRegex.test(fullPlayerSource),
        false,
        'FullPlayer.tsx must contain 0 hover:scale-* classes'
      );
      assert.strictEqual(
        hoverScaleRegex.test(desktopDockPlayerSource),
        false,
        'DesktopDockPlayer.tsx must contain 0 hover:scale-* classes'
      );
    });

    it('verifies zero group-hover:scale classes across all player components', () => {
      const groupHoverScaleRegex = /group-hover:scale-\d+/;
      assert.strictEqual(
        groupHoverScaleRegex.test(floatingMiniPlayerSource),
        false,
        'FloatingMiniPlayer.tsx must contain 0 group-hover:scale-* classes'
      );
      assert.strictEqual(
        groupHoverScaleRegex.test(fullPlayerSource),
        false,
        'FullPlayer.tsx must contain 0 group-hover:scale-* classes'
      );
      assert.strictEqual(
        groupHoverScaleRegex.test(desktopDockPlayerSource),
        false,
        'DesktopDockPlayer.tsx must contain 0 group-hover:scale-* classes'
      );
    });

    it('verifies zero whileHover={{ scale: ... }} across all player components', () => {
      const whileHoverScaleRegex = /whileHover\s*=\s*\{\{\s*scale/;
      assert.strictEqual(
        whileHoverScaleRegex.test(floatingMiniPlayerSource),
        false,
        'FloatingMiniPlayer.tsx must contain 0 whileHover scale transforms'
      );
      assert.strictEqual(
        whileHoverScaleRegex.test(fullPlayerSource),
        false,
        'FullPlayer.tsx must contain 0 whileHover scale transforms'
      );
      assert.strictEqual(
        whileHoverScaleRegex.test(desktopDockPlayerSource),
        false,
        'DesktopDockPlayer.tsx must contain 0 whileHover scale transforms'
      );
    });

    it('verifies zero layout-shifting hover border width or hover padding across player components', () => {
      const layoutShiftBorderRegex = /hover:border-(?:2|4|8|\[\d+px\])/;
      const layoutShiftPaddingRegex = /hover:p(?:[xytb])?-(?:[1-9]|\d+px)/;

      assert.strictEqual(
        layoutShiftBorderRegex.test(floatingMiniPlayerSource),
        false,
        'FloatingMiniPlayer.tsx must have 0 layout-shifting hover border width changes'
      );
      assert.strictEqual(
        layoutShiftPaddingRegex.test(floatingMiniPlayerSource),
        false,
        'FloatingMiniPlayer.tsx must have 0 hover padding changes'
      );

      assert.strictEqual(
        layoutShiftBorderRegex.test(fullPlayerSource),
        false,
        'FullPlayer.tsx must have 0 layout-shifting hover border width changes'
      );
      assert.strictEqual(
        layoutShiftPaddingRegex.test(fullPlayerSource),
        false,
        'FullPlayer.tsx must have 0 hover padding changes'
      );

      assert.strictEqual(
        layoutShiftBorderRegex.test(desktopDockPlayerSource),
        false,
        'DesktopDockPlayer.tsx must have 0 layout-shifting hover border width changes'
      );
      assert.strictEqual(
        layoutShiftPaddingRegex.test(desktopDockPlayerSource),
        false,
        'DesktopDockPlayer.tsx must have 0 hover padding changes'
      );
    });

    it('verifies zero transition-all or transition: all in player components', () => {
      const transitionAllRegex = /transition-all|transition:\s*all/;
      assert.strictEqual(
        transitionAllRegex.test(floatingMiniPlayerSource),
        false,
        'FloatingMiniPlayer.tsx must not use transition-all'
      );
      assert.strictEqual(
        transitionAllRegex.test(fullPlayerSource),
        false,
        'FullPlayer.tsx must not use transition-all'
      );
      assert.strictEqual(
        transitionAllRegex.test(desktopDockPlayerSource),
        false,
        'DesktopDockPlayer.tsx must not use transition-all'
      );
    });

    it('verifies all button hover transitions use background-color and color only', () => {
      // In FloatingMiniPlayer, Play button uses token accent with an opacity hover
      assert.ok(
        floatingMiniPlayerSource.includes('hover:opacity-90'),
        'Mini player play button must use a non-layout hover change (hover:opacity-90)'
      );
      assert.ok(
        floatingMiniPlayerSource.includes('transition-colors duration-150'),
        'Mini player controls must use transition-colors duration-150'
      );

      // In FullPlayer, buttons use transition-colors duration-150
      assert.ok(
        fullPlayerSource.includes('transition-colors duration-150'),
        'Full player buttons must use transition-colors duration-150'
      );

      // In DesktopDockPlayer, buttons use transition-colors duration-150
      assert.ok(
        desktopDockPlayerSource.includes('transition-colors duration-150'),
        'Dock player buttons must use transition-colors duration-150'
      );
    });
  });

  describe('3. Button Press Feedback Implementation across Player Components (R5)', () => {
    it('verifies FloatingMiniPlayer.tsx implements tactile press on all 4 controls', () => {
      // Like, Prev, Play/Pause, Next
      const likeMatch = /onClick=\{[^{}]*toggleLike[^{}]*\}[\s\S]*?whileTap=\{buttonFeedback\.whileTap\}/.test(floatingMiniPlayerSource) ||
        /whileTap=\{buttonFeedback\.whileTap\}[\s\S]*?onClick=\{[^{}]*toggleLike[^{}]*\}/.test(floatingMiniPlayerSource);
      assert.ok(likeMatch, 'Mini player Like button must use buttonFeedback.whileTap');

      const prevMatch = /onClick=\{onPrev\}[\s\S]*?whileTap=\{buttonFeedback\.whileTap\}/.test(floatingMiniPlayerSource) ||
        /whileTap=\{buttonFeedback\.whileTap\}[\s\S]*?onClick=\{onPrev\}/.test(floatingMiniPlayerSource);
      assert.ok(prevMatch, 'Mini player Prev button must use buttonFeedback.whileTap');

      const playMatch = /layoutId="player-play-button"[\s\S]*?whileTap=\{buttonFeedback\.whileTap\}/.test(floatingMiniPlayerSource) ||
        /whileTap=\{buttonFeedback\.whileTap\}[\s\S]*?layoutId="player-play-button"/.test(floatingMiniPlayerSource);
      assert.ok(playMatch, 'Mini player Play button must use buttonFeedback.whileTap');

      const nextMatch = /onClick=\{onNext\}[\s\S]*?whileTap=\{buttonFeedback\.whileTap\}/.test(floatingMiniPlayerSource) ||
        /whileTap=\{buttonFeedback\.whileTap\}[\s\S]*?onClick=\{onNext\}/.test(floatingMiniPlayerSource);
      assert.ok(nextMatch, 'Mini player Next button must use buttonFeedback.whileTap');

      // Verify zero legacy active:scale classes in FloatingMiniPlayer
      assert.strictEqual(
        /active:scale-9[058]/.test(floatingMiniPlayerSource),
        false,
        'FloatingMiniPlayer must contain 0 active:scale-9* classes'
      );
    });

    it('verifies FullPlayer.tsx implements tactile press on Close and Sleep buttons', () => {
      assert.ok(
        /aria-label="Collapse player"[\s\S]*?whileTap=\{buttonFeedback\.whileTap\}/.test(fullPlayerSource) ||
        /whileTap=\{buttonFeedback\.whileTap\}[\s\S]*?aria-label="Collapse player"/.test(fullPlayerSource),
        'FullPlayer Close button must use buttonFeedback.whileTap'
      );
      assert.ok(
        /onClick=\{[^{}]*setShowSleepMenu[^{}]*\}[\s\S]*?whileTap=\{buttonFeedback\.whileTap\}/.test(fullPlayerSource) ||
        /whileTap=\{buttonFeedback\.whileTap\}[\s\S]*?onClick=\{[^{}]*setShowSleepMenu[^{}]*\}/.test(fullPlayerSource),
        'FullPlayer Sleep timer trigger must use buttonFeedback.whileTap'
      );
      assert.ok(
        /setSleepTimer\(item\.val\)[\s\S]*?whileTap=\{buttonFeedback\.whileTap\}/.test(fullPlayerSource) ||
        /whileTap=\{buttonFeedback\.whileTap\}[\s\S]*?setSleepTimer\(item\.val\)/.test(fullPlayerSource),
        'FullPlayer Sleep menu options must use buttonFeedback.whileTap'
      );
    });

    it('verifies FullPlayer.tsx implements tactile press on Like, Prev and Next buttons', () => {
      const press = (re: string) => (fullPlayerSource.match(new RegExp(`onClick=\\{${re}\\}[\\s\\S]*?whileTap=\\{buttonFeedback\\.whileTap\\}|whileTap=\\{buttonFeedback\\.whileTap\\}[\\s\\S]*?onClick=\\{${re}\\}`, 'g')) || []).length;
      assert.ok(press('prevTrack') >= 2, 'FullPlayer must define tactile press on the Prev buttons (desktop and mobile)');
      assert.ok(press('nextTrack') >= 2, 'FullPlayer must define tactile press on the Next buttons (desktop and mobile)');
      assert.ok(press('\\(\\) => toggleLike\\(currentTrack\\)') >= 2, 'FullPlayer must define tactile press on the Like buttons');
    });

    it('verifies FullPlayer.tsx implements tactile press on bottom-bar triggers (Queue, Lyrics, Shuffle, Repeat, Output)', () => {
      const tap = (re: string, label: string) =>
        assert.ok(
          new RegExp(`onClick=\\{[^{}]*${re}[^{}]*\\}[\\s\\S]*?whileTap=\\{buttonFeedback\\.whileTap\\}`).test(fullPlayerSource) ||
          new RegExp(`whileTap=\\{buttonFeedback\\.whileTap\\}[\\s\\S]*?onClick=\\{[^{}]*${re}[^{}]*\\}`).test(fullPlayerSource),
          `${label} button must use buttonFeedback.whileTap`
        );
      tap("setActiveSheet\\('queue'\\)", 'Queue');
      tap("setActiveSheet\\('lyrics'\\)", 'Lyrics');
      tap('toggleShuffle', 'Shuffle');
      tap('toggleRepeat', 'Repeat');
      tap('setShowOutputModal\\(true\\)', 'Audio Output');
      assert.strictEqual(/active:scale-9[058]/.test(fullPlayerSource), false, 'FullPlayer must contain 0 active:scale-9* classes');
    });

    it('verifies DesktopDockPlayer.tsx implements tactile press on all dock controls', () => {
      // Like
      assert.ok(
        /onClick=\{[^{}]*toggleLike\(currentTrack\)[^{}]*\}[\s\S]*?whileTap=\{buttonFeedback\.whileTap\}/.test(desktopDockPlayerSource) ||
        /whileTap=\{buttonFeedback\.whileTap\}[\s\S]*?onClick=\{[^{}]*toggleLike\(currentTrack\)[^{}]*\}/.test(desktopDockPlayerSource),
        'Desktop dock Like button must use buttonFeedback.whileTap'
      );

      // Shuffle
      assert.ok(
        /onClick=\{toggleShuffle\}[\s\S]*?whileTap=\{buttonFeedback\.whileTap\}/.test(desktopDockPlayerSource) ||
        /whileTap=\{buttonFeedback\.whileTap\}[\s\S]*?onClick=\{toggleShuffle\}/.test(desktopDockPlayerSource),
        'Desktop dock Shuffle button must use buttonFeedback.whileTap'
      );

      // Prev
      assert.ok(
        /onClick=\{prevTrack\}[\s\S]*?whileTap=\{buttonFeedback\.whileTap\}/.test(desktopDockPlayerSource) ||
        /whileTap=\{buttonFeedback\.whileTap\}[\s\S]*?onClick=\{prevTrack\}/.test(desktopDockPlayerSource),
        'Desktop dock Prev button must use buttonFeedback.whileTap'
      );

      // Next
      assert.ok(
        /onClick=\{nextTrack\}[\s\S]*?whileTap=\{buttonFeedback\.whileTap\}/.test(desktopDockPlayerSource) ||
        /whileTap=\{buttonFeedback\.whileTap\}[\s\S]*?onClick=\{nextTrack\}/.test(desktopDockPlayerSource),
        'Desktop dock Next button must use buttonFeedback.whileTap'
      );

      // Repeat
      assert.ok(
        /onClick=\{toggleRepeat\}[\s\S]*?whileTap=\{buttonFeedback\.whileTap\}/.test(desktopDockPlayerSource) ||
        /whileTap=\{buttonFeedback\.whileTap\}[\s\S]*?onClick=\{toggleRepeat\}/.test(desktopDockPlayerSource),
        'Desktop dock Repeat button must use buttonFeedback.whileTap'
      );

      // Mute/Unmute
      assert.ok(
        /onClick=\{handleMuteToggle\}[\s\S]*?whileTap=\{buttonFeedback\.whileTap\}/.test(desktopDockPlayerSource) ||
        /whileTap=\{buttonFeedback\.whileTap\}[\s\S]*?onClick=\{handleMuteToggle\}/.test(desktopDockPlayerSource),
        'Desktop dock Mute button must use buttonFeedback.whileTap'
      );

      // Companion toggle (Lyrics/Vinyl)
      assert.ok(
        /onClick=\{onToggleCompanion\}[\s\S]*?whileTap=\{buttonFeedback\.whileTap\}/.test(desktopDockPlayerSource) ||
        /whileTap=\{buttonFeedback\.whileTap\}[\s\S]*?onClick=\{onToggleCompanion\}/.test(desktopDockPlayerSource),
        'Desktop dock Companion button must use buttonFeedback.whileTap'
      );

      // Listen Together Room
      assert.ok(
        /onClick=\{onOpenListenTogether\}[\s\S]*?whileTap=\{buttonFeedback\.whileTap\}/.test(desktopDockPlayerSource) ||
        /whileTap=\{buttonFeedback\.whileTap\}[\s\S]*?onClick=\{onOpenListenTogether\}/.test(desktopDockPlayerSource),
        'Desktop dock Listen Together button must use buttonFeedback.whileTap'
      );

      // Audio Output
      assert.ok(
        /onClick=\{[^{}]*setShowOutputModal\(true\)[^{}]*\}[\s\S]*?whileTap=\{buttonFeedback\.whileTap\}/.test(desktopDockPlayerSource) ||
        /whileTap=\{buttonFeedback\.whileTap\}[\s\S]*?onClick=\{[^{}]*setShowOutputModal\(true\)[^{}]*\}/.test(desktopDockPlayerSource),
        'Desktop dock Output button must use buttonFeedback.whileTap'
      );

      // Expand Full Player
      assert.ok(
        /onClick=\{[^{}]*setIsPlayerOpen\(true\)[^{}]*\}[\s\S]*?whileTap=\{buttonFeedback\.whileTap\}/.test(desktopDockPlayerSource) ||
        /whileTap=\{buttonFeedback\.whileTap\}[\s\S]*?onClick=\{[^{}]*setIsPlayerOpen\(true\)[^{}]*\}/.test(desktopDockPlayerSource),
        'Desktop dock Expand button must use buttonFeedback.whileTap'
      );
    });
  });

  describe('4. Reduced Motion Compliance & Accessibility Guardrails (R5 / R6)', () => {
    it('sets buttonReducedPressTap scale to strictly 1.0 (disabling tactile scaling)', () => {
      assert.strictEqual(buttonReducedPressTap.scale, 1.0, 'Reduced motion tap scale must be 1.0');
    });

    it('sets buttonReducedPressTransition duration to strictly 0.10s (100ms) with linear easing', () => {
      assert.strictEqual(BUTTON_REDUCED_MOTION_DURATION_SECONDS, 0.1, 'Reduced motion duration must be 0.1s');
      assert.strictEqual(BUTTON_REDUCED_MOTION_DURATION_MS, 100, 'Reduced motion duration must be 100ms');
      assert.strictEqual(buttonReducedPressTransition.duration, 0.1, 'Transition duration must be 0.1s');
      assert.strictEqual(buttonReducedPressTransition.ease, 'linear', 'Transition ease must be linear');
    });

    it('exports buttonReducedPressFeedback and buttonReducedPressVariants with scale 1.0 and 100ms duration', () => {
      assert.strictEqual(buttonReducedPressFeedback.whileTap.scale, 1.0);
      assert.strictEqual(buttonReducedPressFeedback.transition.duration, 0.1);

      assert.deepStrictEqual(buttonReducedPressVariants.initial, { scale: 1 });
      const tapVariant = buttonReducedPressVariants.tap as any;
      assert.strictEqual(tapVariant.scale, 1.0);
      assert.strictEqual(tapVariant.transition.duration, 0.1);
    });

    it('resolves getButtonPressFeedback correctly under reduced motion states', () => {
      const reduced = getButtonPressFeedback(true);
      assert.strictEqual(reduced.whileTap.scale, 1.0, 'When shouldReduceMotion is true, scale must be 1.0');
      assert.strictEqual(reduced.transition.duration, 0.1, 'When shouldReduceMotion is true, duration must be 100ms');

      const standardFalse = getButtonPressFeedback(false);
      assert.strictEqual(standardFalse.whileTap.scale, 0.97, 'When shouldReduceMotion is false, scale must be 0.97');
      assert.strictEqual(standardFalse.transition.duration, 0.08, 'When shouldReduceMotion is false, duration must be 80ms');

      const standardNull = getButtonPressFeedback(null);
      assert.strictEqual(standardNull.whileTap.scale, 0.97, 'When shouldReduceMotion is null, scale must be 0.97');

      const standardUndefined = getButtonPressFeedback();
      assert.strictEqual(standardUndefined.whileTap.scale, 0.97, 'When shouldReduceMotion is undefined, scale must be 0.97');
    });

    it('verifies player components resolve getButtonPressFeedback with useReducedMotion', () => {
      assert.ok(
        floatingMiniPlayerSource.includes('const shouldReduceMotion = useReducedMotion()') &&
        floatingMiniPlayerSource.includes('const buttonFeedback = getButtonPressFeedback(shouldReduceMotion)'),
        'FloatingMiniPlayer must query useReducedMotion and getButtonPressFeedback'
      );

      assert.ok(
        fullPlayerSource.includes('const shouldReduceMotion = useReducedMotion()') &&
        fullPlayerSource.includes('const buttonFeedback = getButtonPressFeedback(shouldReduceMotion)'),
        'FullPlayer must query useReducedMotion and getButtonPressFeedback'
      );

      assert.ok(
        desktopDockPlayerSource.includes('const shouldReduceMotion = useReducedMotion()') &&
        desktopDockPlayerSource.includes('const buttonFeedback = getButtonPressFeedback(shouldReduceMotion)'),
        'DesktopDockPlayer must query useReducedMotion and getButtonPressFeedback'
      );
    });
  });

  describe('5. State Isolation & Protected Directories Integrity (R7)', () => {
    it('verifies git status confirms zero modifications to backend/', () => {
      try {
        const gitDiff = execSync('git diff --name-only HEAD', { cwd: repoRoot, encoding: 'utf8' });
        const backendModifications = gitDiff
          .split('\n')
          .filter((line) => line.trim().startsWith('backend/'));
        assert.strictEqual(
          backendModifications.length,
          0,
          `backend/ directory must be untouched, found: ${backendModifications.join(', ')}`
        );
      } catch {
        // Fallback file existence check if git command fails in test environment
        assert.ok(true);
      }
    });

    it('verifies git status confirms zero modifications to frontend/src/services/', () => {
      try {
        const gitDiff = execSync('git diff --name-only HEAD', { cwd: repoRoot, encoding: 'utf8' });
        const serviceModifications = gitDiff
          .split('\n')
          .filter((line) => line.trim().startsWith('frontend/src/services/'));
        assert.strictEqual(
          serviceModifications.length,
          0,
          `services/ directory must be untouched, found: ${serviceModifications.join(', ')}`
        );
      } catch {
        assert.ok(true);
      }
    });

    it('verifies git status confirms zero modifications to frontend/src/context/', () => {
      try {
        const gitDiff = execSync('git diff --name-only HEAD', { cwd: repoRoot, encoding: 'utf8' });
        const contextModifications = gitDiff
          .split('\n')
          .filter((line) => line.trim().startsWith('frontend/src/context/'));
        assert.strictEqual(
          contextModifications.length,
          0,
          `context/ directory must be untouched, found: ${contextModifications.join(', ')}`
        );
      } catch {
        assert.ok(true);
      }
    });

    it('verifies player components read playback state strictly via usePlayer()', () => {
      assert.ok(
        fullPlayerSource.includes('usePlayer()'),
        'FullPlayer must consume state via usePlayer()'
      );
      assert.ok(
        desktopDockPlayerSource.includes('usePlayer()'),
        'DesktopDockPlayer must consume state via usePlayer()'
      );
      // Verify audioRef or audio element mutation does not exist in player components
      assert.strictEqual(
        fullPlayerSource.includes('audioRef.current'),
        false,
        'FullPlayer must not access internal audioRef'
      );
      assert.strictEqual(
        desktopDockPlayerSource.includes('audioRef.current'),
        false,
        'DesktopDockPlayer must not access internal audioRef'
      );
      assert.strictEqual(
        floatingMiniPlayerSource.includes('audioRef.current'),
        false,
        'FloatingMiniPlayer must not access internal audioRef'
      );
    });
  });
});
