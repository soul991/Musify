import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as motion from '../src/utils/motion.ts';
import {
  WAVE_CONSTANTS,
  calculateAmplitudeEase,
  formatTimestampBadge,
} from '../src/components/player/SquigglySlider.tsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');

describe('Milestone 1 (R1): Kinetic Waveform Seek Bar & Motion Physics', () => {
  const squigglySliderPath = path.join(frontendRoot, 'src', 'components', 'player', 'SquigglySlider.tsx');
  const squigglySliderSource = fs.readFileSync(squigglySliderPath, 'utf8');

  describe('1. Kinetic Waveform Geometry & Amplitude Calibration', () => {
    it('calibrates playing wave amplitude to 2px and paused amplitude to 0px (flat line)', () => {
      assert.strictEqual(WAVE_CONSTANTS.AMPLITUDE_PLAYING, 2, 'Playing amplitude must be exactly 2px per R1');
      assert.strictEqual(WAVE_CONSTANTS.AMPLITUDE_PAUSED, 0, 'Paused amplitude must be exactly 0px per R1');
    });

    it('calibrates wave spatial wavelength to 24px (lambda = 24px)', () => {
      assert.strictEqual(WAVE_CONSTANTS.WAVELENGTH, 24, 'Spatial wavelength must be 24px per R1 spec');
    });

    it('sets phase speed to 24px/second for 1 full wavelength traversal per second', () => {
      assert.strictEqual(WAVE_CONSTANTS.PHASE_SPEED, 24, 'Phase speed must be 24px/s');
    });

    it('sets stroke width to 3px for high-definition retina rendering', () => {
      assert.strictEqual(WAVE_CONSTANTS.STROKE_WIDTH, 3, 'Stroke width should be 3px');
    });
  });

  describe('2. 320ms Smooth Easing Mathematics', () => {
    it('sets ease duration to precisely 320ms', () => {
      assert.strictEqual(WAVE_CONSTANTS.EASE_DURATION_MS, 320, 'Ease duration must be exactly 320ms per R1');
    });

    it('eases from playing (2px) to paused (0px) over exactly 320ms', () => {
      // At t = 0
      const amp0 = calculateAmplitudeEase(2, 0, 0, 320);
      assert.strictEqual(amp0, 2, 'Amplitude at 0ms must be initial playing amplitude (2px)');

      // At t = 80ms (25% elapsed)
      const amp80 = calculateAmplitudeEase(2, 0, 80, 320);
      assert.ok(amp80 < 2 && amp80 > 1, `Amplitude at 80ms (${amp80}) should ease smoothly downwards`);

      // At t = 160ms (50% elapsed, inflection point)
      const amp160 = calculateAmplitudeEase(2, 0, 160, 320);
      assert.strictEqual(Math.round(amp160 * 100) / 100, 1.0, 'Amplitude at 160ms (halfway) must be 1.0px');

      // At t = 240ms (75% elapsed)
      const amp240 = calculateAmplitudeEase(2, 0, 240, 320);
      assert.ok(amp240 < 1 && amp240 > 0, `Amplitude at 240ms (${amp240}) should ease smoothly towards 0`);

      // At t = 320ms (100% elapsed)
      const amp320 = calculateAmplitudeEase(2, 0, 320, 320);
      assert.strictEqual(amp320, 0, 'Amplitude at 320ms must settle precisely to 0px (flat line)');

      // At t > 320ms (clamped settle)
      const amp400 = calculateAmplitudeEase(2, 0, 400, 320);
      assert.strictEqual(amp400, 0, 'Amplitude past 320ms must remain clamped at 0px');
    });

    it('eases from paused (0px) to playing (2px) over exactly 320ms', () => {
      const amp0 = calculateAmplitudeEase(0, 2, 0, 320);
      assert.strictEqual(amp0, 0, 'Amplitude at 0ms must be initial paused amplitude (0px)');

      const amp160 = calculateAmplitudeEase(0, 2, 160, 320);
      assert.strictEqual(Math.round(amp160 * 100) / 100, 1.0, 'Amplitude at 160ms must be halfway (1.0px)');

      const amp320 = calculateAmplitudeEase(0, 2, 320, 320);
      assert.strictEqual(amp320, 2, 'Amplitude at 320ms must settle precisely to 2px');

      const amp500 = calculateAmplitudeEase(0, 2, 500, 320);
      assert.strictEqual(amp500, 2, 'Amplitude past 320ms must remain clamped at 2px');
    });

    it('maintains continuous zero derivative (smooth acceleration & deceleration) at boundaries', () => {
      // Discrete derivative approximation: (f(t + dt) - f(t)) / dt
      const dt = 1;
      const dStart = (calculateAmplitudeEase(2, 0, dt, 320) - calculateAmplitudeEase(2, 0, 0, 320)) / dt;
      const dEnd = (calculateAmplitudeEase(2, 0, 320, 320) - calculateAmplitudeEase(2, 0, 320 - dt, 320)) / dt;

      assert.ok(Math.abs(dStart) < 0.001, `Start velocity (${dStart}) must be zero for gentle takeoff`);
      assert.ok(Math.abs(dEnd) < 0.001, `End velocity (${dEnd}) must be zero for gentle touchdown`);
    });

    it('handles interrupted mid-flight state transitions smoothly', () => {
      // User pauses, then unpauses at t = 100ms when amplitude is ~1.5
      const currentAmp = calculateAmplitudeEase(2, 0, 100, 320);
      // New ease towards 2 starts from currentAmp
      const resumeAmp0 = calculateAmplitudeEase(currentAmp, 2, 0, 320);
      assert.strictEqual(resumeAmp0, currentAmp, 'Resumed ease must start from current in-flight amplitude');

      const resumeAmp320 = calculateAmplitudeEase(currentAmp, 2, 320, 320);
      assert.strictEqual(resumeAmp320, 2, 'Resumed ease settles to 2px at 320ms');
    });
  });

  describe('3. Live Formatted Timestamp Badge (mm:ss)', () => {
    it('formats 0 seconds as 00:00', () => {
      assert.strictEqual(formatTimestampBadge(0), '00:00');
    });

    it('formats single-digit seconds with leading zero', () => {
      assert.strictEqual(formatTimestampBadge(7), '00:07');
    });

    it('formats multi-digit seconds under a minute', () => {
      assert.strictEqual(formatTimestampBadge(42), '00:42');
    });

    it('formats exact minute boundaries with mm:ss padding', () => {
      assert.strictEqual(formatTimestampBadge(60), '01:00');
      assert.strictEqual(formatTimestampBadge(600), '10:00');
    });

    it('formats compound minutes and seconds', () => {
      assert.strictEqual(formatTimestampBadge(75), '01:15');
      assert.strictEqual(formatTimestampBadge(214), '03:34');
      assert.strictEqual(formatTimestampBadge(3599), '59:59');
    });

    it('safely handles boundary, negative, and invalid values without throwing', () => {
      assert.strictEqual(formatTimestampBadge(-10), '00:00');
      assert.strictEqual(formatTimestampBadge(NaN), '00:00');
      assert.strictEqual(formatTimestampBadge(Infinity), '00:00');
      assert.strictEqual(formatTimestampBadge(-Infinity), '00:00');
    });
  });

  describe('4. Visibility Gating & Animation Lifecycle Control', () => {
    it('registers a document visibilitychange event listener in SquigglySlider.tsx', () => {
      assert.match(
        squigglySliderSource,
        /document\.addEventListener\(\s*['"]visibilitychange['"]\s*,/s,
        'SquigglySlider must register a visibilitychange event listener on document'
      );
    });

    it('removes the visibilitychange event listener on component unmount', () => {
      assert.match(
        squigglySliderSource,
        /document\.removeEventListener\(\s*['"]visibilitychange['"]\s*,/s,
        'SquigglySlider must clean up visibilitychange listener on unmount'
      );
    });

    it('stops animation loop when document.visibilityState === "hidden"', () => {
      assert.match(
        squigglySliderSource,
        /if\s*\(\s*document\.visibilityState\s*===\s*['"]hidden['"]\s*\)\s*\{[^}]*stopLoop\(\)/s,
        'SquigglySlider must call stopLoop() when tab visibility is hidden'
      );
    });

    it('checks document.visibilityState before calling requestAnimationFrame in tick', () => {
      assert.match(
        squigglySliderSource,
        /if\s*\(\s*typeof\s*document\s*!==\s*['"]undefined['"]\s*&&\s*document\.visibilityState\s*!==\s*['"]visible['"]\s*\)/s,
        'SquigglySlider must abort tick loop when document is not visible'
      );
    });

    it('stops the loop when paused and 320ms easing is complete', () => {
      assert.match(
        squigglySliderSource,
        /const\s+shouldContinue\s*=\s*\(isPlayingRef\.current[\s\S]*?\)\s*\|\|\s*isEasingRef\.current/,
        'Loop must only continue while playing or while 320ms easing is active'
      );
    });
  });

  describe('5. Performance Guardrails: Zero Layout Reads in rAF', () => {
    it('uses ResizeObserver to cache container bounds outside animation loop', () => {
      assert.match(
        squigglySliderSource,
        /new\s+ResizeObserver\(/,
        'SquigglySlider must use ResizeObserver for caching layout dimensions'
      );
      assert.match(
        squigglySliderSource,
        /boundsRef\.current\s*=\s*\{[^}]*width:\s*rect\.width/s,
        'boundsRef must cache width and height outside rAF'
      );
    });

    it('ensures getBoundingClientRect is NEVER called inside drawFrame or tick loop', () => {
      // Extract drawFrame function body
      const drawFrameMatch = squigglySliderSource.match(/const\s+drawFrame\s*=\s*useCallback\(\s*\(\)\s*=>\s*\{([\s\S]*?)\}\s*,\s*\[\s*\]\s*\);/);
      assert.ok(drawFrameMatch, 'drawFrame function must exist');
      const drawFrameBody = drawFrameMatch[1];
      assert.doesNotMatch(
        drawFrameBody,
        /getBoundingClientRect/,
        'drawFrame must NOT perform synchronous layout reads (getBoundingClientRect)'
      );
      assert.doesNotMatch(
        drawFrameBody,
        /offsetWidth|offsetHeight|clientWidth|clientHeight/,
        'drawFrame must NOT access layout geometry properties'
      );

      // Extract tick function inside startLoop
      const tickMatch = squigglySliderSource.match(/const\s+tick\s*=\s*\((?:now)?\s*:\s*number\)\s*=>\s*\{([\s\S]*?)\}\s*;/);
      assert.ok(tickMatch, 'tick loop function must exist');
      const tickBody = tickMatch[1];
      assert.doesNotMatch(
        tickBody,
        /getBoundingClientRect/,
        'rAF tick loop must NOT call getBoundingClientRect'
      );
    });
  });

  describe('6. Foundation Motion Tokens (motion.ts)', () => {
    it('exports springPlayerExpand with k=380, c=40, m=1', () => {
      assert.ok(motion.springPlayerExpand, 'springPlayerExpand must be exported');
      assert.strictEqual(motion.springPlayerExpand.type, 'spring');
      assert.strictEqual(motion.springPlayerExpand.stiffness, 380, 'stiffness must be 380');
      assert.strictEqual(motion.springPlayerExpand.damping, 40, 'damping must be 40');
      assert.strictEqual(motion.springPlayerExpand.mass, 1, 'mass must be 1');
    });

    it('mathematically evaluates springPlayerExpand damping ratio zeta to ~1.026 (critically damped)', () => {
      const k = motion.springPlayerExpand.stiffness as number;
      const c = motion.springPlayerExpand.damping as number;
      const m = (motion.springPlayerExpand.mass as number) || 1;

      const cCritical = 2 * Math.sqrt(k * m);
      const zeta = c / cCritical;

      assert.strictEqual(
        Math.round(zeta * 1000) / 1000,
        1.026,
        'Damping ratio zeta = c / (2 * sqrt(k * m)) must evaluate to 1.026'
      );
    });

    it('updates pressFeedback duration to 80ms (< 100ms per R5)', () => {
      assert.ok(motion.pressFeedback, 'pressFeedback must be exported');
      const whileTap = motion.pressFeedback.whileTap as { scale: number };
      assert.strictEqual(whileTap.scale, 0.97, 'pressFeedback scale must be 0.97');

      const transition = motion.pressFeedback.transition as { duration: number; ease: readonly number[] };
      assert.strictEqual(transition.duration, 0.08, 'pressFeedback transition duration must be 0.08 (80ms, < 100ms)');
      assert.ok(transition.duration < 0.1, 'pressFeedback duration must be strictly under 100ms');
    });

    it('preserves durations.tap = 0.12 for backward compatibility with legacy tests', () => {
      assert.strictEqual(motion.durations.tap, 0.12, 'durations.tap must remain 0.12 for backward compatibility');
    });
  });
});
