import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as motion from '../src/utils/motion.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');

describe('Design Verification: Visual Hierarchy & Motion Physics', () => {
  const cssPath = path.join(frontendRoot, 'src', 'index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  it('verifies concentric surface geometry tokens in index.css (R_panel > R_card > R_tile)', () => {
    // Extract real tokens defined in index.css
    const panelMatch = cssContent.match(/--radius-panel:\s*(\d+)px/);
    const cardMatch = cssContent.match(/--radius-card:\s*(\d+)px/);
    const tileMatch = cssContent.match(/--radius-tile:\s*(\d+)px/);

    assert.ok(panelMatch, 'index.css must define --radius-panel in px');
    assert.ok(cardMatch, 'index.css must define --radius-card in px');
    assert.ok(tileMatch, 'index.css must define --radius-tile in px');

    const panelRadius = parseInt(panelMatch[1], 10);
    const cardRadius = parseInt(cardMatch[1], 10);
    const tileRadius = parseInt(tileMatch[1], 10);

    assert.ok(panelRadius > cardRadius, `Panel radius (${panelRadius}px) must exceed Card radius (${cardRadius}px)`);
    assert.ok(cardRadius > tileRadius, `Card radius (${cardRadius}px) must exceed Tile radius (${tileRadius}px)`);

    // Concentric nesting formula: R_inner = max(0, R_outer - Padding)
    // With panel padding of 8px, inner card = 28 - 8 = 20px (exact concentric match)
    const expectedConcentricInner = panelRadius - 8;
    assert.strictEqual(
      cardRadius,
      expectedConcentricInner,
      `Card radius (${cardRadius}px) must equal panel radius (${panelRadius}px) - 8px concentric inner padding`
    );
  });

  it('verifies motion physics separation (Spatial Springs vs Effects Springs)', () => {
    const spatialStiffness = motion.springCinematic.stiffness as number;
    const effectsStiffness = motion.springEffects.stiffness as number;

    // Effects spring stiffness must be significantly higher to eliminate visible overshoot on borders
    assert.ok(
      effectsStiffness >= spatialStiffness * 4,
      `Effects stiffness (${effectsStiffness}) must be >= 4x spatial stiffness (${spatialStiffness})`
    );
  });

  it('verifies 120Hz compositor pipeline (Zero layout thrashing properties in motion tokens)', () => {
    // Inspect all motion token keys in motion.ts
    const prohibitedLayoutProps = ['width', 'height', 'top', 'left', 'right', 'bottom', 'margin', 'padding'];

    const checkVariantsForLayoutThrash = (variants: any, name: string) => {
      if (!variants || typeof variants !== 'object') return;
      for (const [state, values] of Object.entries(variants)) {
        if (values && typeof values === 'object') {
          for (const prop of Object.keys(values)) {
            assert.ok(
              !prohibitedLayoutProps.includes(prop),
              `Motion token ${name}.${state} must not animate layout property '${prop}' (use GPU transforms instead)`
            );
          }
        }
      }
    };

    checkVariantsForLayoutThrash(motion.forwardTransition, 'forwardTransition');
    checkVariantsForLayoutThrash(motion.backwardTransition, 'backwardTransition');
    checkVariantsForLayoutThrash(motion.pageTransitionVariants, 'pageTransitionVariants');
  });

  it('verifies OLED true black and stepped surface contrast tokens in index.css', () => {
    assert.match(
      cssContent,
      /--bg-primary:\s*#0A0A0A;/,
      'Base background must be OLED #0A0A0A'
    );
    assert.match(
      cssContent,
      /--bg-surface:\s*rgba\(18,\s*18,\s*18,\s*0\.72\);/,
      'Base surface must be stepped translucent surface'
    );
  });
});

describe('Design Verification: Design Tokens & CSS Performance Rules', () => {
  const cssPath = path.join(frontendRoot, 'src', 'index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  it('verifies CSS variables and tokens are defined in root theme', () => {
    assert.match(cssContent, /--font-display:/, 'Display font token must be defined in theme');
    assert.match(cssContent, /--font-body:/, 'Body font token must be defined in theme');
    assert.match(cssContent, /--accent-color:/, 'Accent color token must be defined');
    assert.match(cssContent, /--bg-primary:/, 'Primary background token must be defined');
  });

  it('verifies no global transition: all anti-pattern on universal selector', () => {
    // Test that global transition: all is not applied to universal wildcard selector
    const hasUniversalTransitionAll = /\*\s*\{[^}]*transition:\s*all/i.test(cssContent);
    assert.strictEqual(
      hasUniversalTransitionAll,
      false,
      'Never apply transition: all to universal selector *'
    );
  });

  it('verifies instant :focus-visible outline styling', () => {
    assert.match(
      cssContent,
      /\*:focus-visible\s*\{[^}]*box-shadow:/,
      'Every interactive element must have instant :focus-visible styling'
    );
  });

  it('verifies reduced motion fallback in index.css', () => {
    assert.match(
      cssContent,
      /@media\s*\(prefers-reduced-motion:\s*reduce\)/,
      'Must provide prefers-reduced-motion fallback'
    );
  });
});

describe('Design Verification: Micro-Interactions & Conversion Signals', () => {
  it('verifies tactile micro-interaction press feedback adheres to 0.96-0.97 scale', () => {
    const tapScale = (motion.hoverLift.whileTap as any).scale;
    assert.ok(
      tapScale >= 0.96 && tapScale <= 0.97,
      `Tap scale (${tapScale}) should be in tactile feedback range 0.96-0.97`
    );
  });

  it('verifies primary buttons in Landing.tsx specify minimum touch target classes', () => {
    const landingSource = fs.readFileSync(path.join(frontendRoot, 'src', 'landing', 'Landing.tsx'), 'utf8');
    assert.match(
      landingSource,
      /min-h-\[48px\]|h-12|py-3\.5|py-3/,
      'Landing buttons must enforce touch target bounds'
    );
  });

  it('validates authoritative conversion signals exist in Landing.tsx source', () => {
    const landingSource = fs.readFileSync(path.join(frontendRoot, 'src', 'landing', 'Landing.tsx'), 'utf8');
    assert.ok(landingSource.includes('100% Free'), 'Landing.tsx must include "100% Free"');
    assert.ok(landingSource.includes('No Sign-Up Required'), 'Landing.tsx must include "No Sign-Up Required"');
    assert.ok(landingSource.includes('Zero Audio Ads'), 'Landing.tsx must include "Zero Audio Ads"');
    assert.ok(landingSource.includes('Open Source'), 'Landing.tsx must include "Open Source"');
  });
});
