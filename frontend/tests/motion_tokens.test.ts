import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as motion from '../src/utils/motion.ts';

describe('Tier 1: Motion Tokens & Physics Engine Specifications', () => {
  it('calibrates springCinematic for cinematic hero entrances (k=200, damping=26, mass=1.2)', () => {
    assert.ok(motion.springCinematic, 'springCinematic must be exported');
    assert.strictEqual(motion.springCinematic.type, 'spring');
    assert.strictEqual(motion.springCinematic.stiffness, 200);
    assert.strictEqual(motion.springCinematic.damping, 26);
    assert.strictEqual(motion.springCinematic.mass, 1.2);
  });

  it('calibrates springReveal for bento cards and shelf items (k=380, damping=28, mass=0.9)', () => {
    assert.ok(motion.springReveal, 'springReveal must be exported');
    assert.strictEqual(motion.springReveal.type, 'spring');
    assert.strictEqual(motion.springReveal.stiffness, 380);
    assert.strictEqual(motion.springReveal.damping, 28);
    assert.strictEqual(motion.springReveal.mass, 0.9);
  });

  it('calibrates springEffects for high-frequency effects without spatial wobble (k=1600, damping=80, zeta=1.0)', () => {
    assert.ok(motion.springEffects, 'springEffects must be exported');
    assert.strictEqual(motion.springEffects.type, 'spring');
    assert.strictEqual(motion.springEffects.stiffness, 1600);
    assert.strictEqual(motion.springEffects.damping, 80);
  });

  it('calibrates parallaxConfig for scroll-linked product showcase (k=120, damping=30, restDelta=0.001)', () => {
    assert.ok(motion.parallaxConfig, 'parallaxConfig must be exported');
    assert.strictEqual(motion.parallaxConfig.type, 'spring');
    assert.strictEqual(motion.parallaxConfig.stiffness, 120);
    assert.strictEqual(motion.parallaxConfig.damping, 30);
    assert.strictEqual(motion.parallaxConfig.restDelta, 0.001);
  });

  it('exports staggerFast token with 30ms stagger and 20ms delay for search suggestions', () => {
    assert.ok(motion.staggerFast, 'staggerFast must be exported');
    assert.strictEqual(motion.staggerFast.staggerChildren, 0.03);
    assert.strictEqual(motion.staggerFast.delayChildren, 0.02);
  });

  it('exports staggerSection token with 80ms stagger and 150ms delay for content shelves', () => {
    assert.ok(motion.staggerSection, 'staggerSection must be exported');
    assert.strictEqual(motion.staggerSection.staggerChildren, 0.08);
    assert.strictEqual(motion.staggerSection.delayChildren, 0.15);
  });

  it('exports hoverLift micro-interaction token with -3px translateY and 0.97 active press scale', () => {
    assert.ok(motion.hoverLift, 'hoverLift must be exported');
    assert.ok(motion.hoverLift.whileHover, 'hoverLift must define whileHover');
    assert.strictEqual((motion.hoverLift.whileHover as any).y, -3);
    assert.ok(motion.hoverLift.whileTap, 'hoverLift must define whileTap');
    assert.strictEqual((motion.hoverLift.whileTap as any).scale, 0.97);
  });

  it('exports forwardTransition with +16px slide-up entrance and -8px exit', () => {
    assert.ok(motion.forwardTransition, 'forwardTransition must be exported');
    const initial = motion.forwardTransition.initial as any;
    const animate = motion.forwardTransition.animate as any;
    const exit = motion.forwardTransition.exit as any;

    assert.strictEqual(initial.opacity, 0);
    assert.strictEqual(initial.y, 16);
    assert.strictEqual(initial.scale, 0.98);

    assert.strictEqual(animate.opacity, 1);
    assert.strictEqual(animate.y, 0);
    assert.strictEqual(animate.scale, 1);
    assert.strictEqual(animate.transition.type, 'spring');
    assert.strictEqual(animate.transition.stiffness, 420);
    assert.strictEqual(animate.transition.damping, 30);

    assert.strictEqual(exit.opacity, 0);
    assert.strictEqual(exit.y, -8);
    assert.strictEqual(exit.scale, 0.99);
  });

  it('exports backwardTransition with -16px slide-down entrance and +16px exit', () => {
    assert.ok(motion.backwardTransition, 'backwardTransition must be exported');
    const initial = motion.backwardTransition.initial as any;
    const animate = motion.backwardTransition.animate as any;
    const exit = motion.backwardTransition.exit as any;

    assert.strictEqual(initial.opacity, 0);
    assert.strictEqual(initial.y, -16);
    assert.strictEqual(initial.scale, 0.98);

    assert.strictEqual(animate.opacity, 1);
    assert.strictEqual(animate.y, 0);
    assert.strictEqual(animate.scale, 1);
    assert.strictEqual(animate.transition.type, 'spring');
    assert.strictEqual(animate.transition.stiffness, 420);
    assert.strictEqual(animate.transition.damping, 30);

    assert.strictEqual(exit.opacity, 0);
    assert.strictEqual(exit.y, 16);
    assert.strictEqual(exit.scale, 0.99);
  });
});

describe('Tier 2: Motion Boundary, Physics Mechanics & Legacy Compatibility', () => {
  it('mathematically separates spatial springs from effects springs (effects stiffness is at least 3x spatial)', () => {
    const kSpatialMax = Math.max(
      motion.springCinematic.stiffness as number,
      motion.springReveal.stiffness as number
    );
    const kEffects = motion.springEffects.stiffness as number;
    assert.ok(
      kEffects >= kSpatialMax * 3,
      `Effects stiffness (${kEffects}) must be at least 3x higher than spatial stiffness (${kSpatialMax}) to avoid layout wobble`
    );
  });

  it('verifies damping ratio of springReveal provides controlled pop without excessive oscillation', () => {
    const k = motion.springReveal.stiffness as number;
    const c = motion.springReveal.damping as number;
    const m = (motion.springReveal.mass as number) || 1;
    // Damping ratio zeta = c / (2 * sqrt(k * m))
    const zeta = c / (2 * Math.sqrt(k * m));
    // Should be in slightly underdamped snappy range: 0.70 <= zeta <= 0.90
    assert.ok(
      zeta >= 0.70 && zeta <= 0.90,
      `springReveal damping ratio zeta (${zeta.toFixed(3)}) should be between 0.70 and 0.90`
    );
  });

  it('verifies springEffects is critically damped (zeta = 1.0) with zero overshoot', () => {
    const k = motion.springEffects.stiffness as number;
    const c = motion.springEffects.damping as number;
    const m = (motion.springEffects.mass as number) || 1;
    // Damping ratio zeta = c / (2 * sqrt(k * m))
    const zeta = c / (2 * Math.sqrt(k * m));
    assert.ok(
      zeta >= 0.99 && zeta <= 1.01,
      `springEffects damping ratio zeta (${zeta.toFixed(4)}) must be critically damped (zeta >= 0.99)`
    );
  });

  it('preserves all legacy motion tokens for backward compatibility', () => {
    assert.ok(motion.springSoft, 'springSoft must be preserved');
    assert.strictEqual(motion.springSoft.stiffness, 260);
    assert.strictEqual(motion.springSoft.damping, 28);

    assert.ok(motion.springSnappy, 'springSnappy must be preserved');
    assert.strictEqual(motion.springSnappy.stiffness, 420);
    assert.strictEqual(motion.springSnappy.damping, 32);

    assert.ok(motion.durations, 'durations must be preserved');
    assert.strictEqual(motion.durations.tap, 0.12);
    assert.strictEqual(motion.durations.fast, 0.2);

    assert.ok(motion.pressFeedback, 'pressFeedback must be preserved');
    assert.ok(motion.pageTransitionVariants, 'pageTransitionVariants must be preserved');
    assert.ok(motion.staggerListContainer, 'staggerListContainer must be preserved');
    assert.ok(motion.mobileSheetVariants, 'mobileSheetVariants must be preserved');
    assert.ok(motion.toastVariants, 'toastVariants must be preserved');
  });
});

describe('Tier 3: Directional Transition Inverted Symmetry & Spatial Consistency', () => {
  it('enforces directional inverted spatial symmetry between forward and backward navigation', () => {
    const fwdInit = (motion.forwardTransition.initial as any).y;
    const bwdInit = (motion.backwardTransition.initial as any).y;
    assert.strictEqual(
      fwdInit,
      -bwdInit,
      `Forward entrance y (${fwdInit}) must be exact inverse of backward entrance y (${bwdInit})`
    );

    const fwdExit = (motion.forwardTransition.exit as any).y;
    const bwdExit = (motion.backwardTransition.exit as any).y;
    assert.strictEqual(
      fwdExit,
      -8,
      `Forward exit y (${fwdExit}) matches spec (-8px)`
    );
    assert.strictEqual(
      bwdExit,
      16,
      `Backward exit y (${bwdExit}) matches spec (+16px)`
    );
  });
});
