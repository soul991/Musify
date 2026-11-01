import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');

/**
 * Calculates relative luminance according to WCAG 2.1 specifications:
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getRelativeLuminance(r8: number, g8: number, b8: number): number {
  const [rs, gs, bs] = [r8, g8, b8].map((c) => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates WCAG contrast ratio between two RGB colors:
 * (L1 + 0.05) / (L2 + 0.05) where L1 is lighter
 */
function getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const l1 = getRelativeLuminance(...rgb1);
  const l2 = getRelativeLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

describe('Tier 1: Reduced Motion Adaptation & Preferences Compliance', () => {
  const cssPath = path.join(frontendRoot, 'src', 'index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  const appPath = path.join(frontendRoot, 'src', 'App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf8');

  it('verifies index.css zeroes animation durations under prefers-reduced-motion: reduce', () => {
    assert.match(
      cssContent,
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[^}]*animation-duration:\s*0\.01ms\s*!important/s,
      'prefers-reduced-motion must collapse animation-duration to 0.01ms !important'
    );
    assert.match(
      cssContent,
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[^}]*transition-duration:\s*0\.01ms\s*!important/s,
      'prefers-reduced-motion must collapse transition-duration to 0.01ms !important'
    );
    assert.match(
      cssContent,
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[^}]*scroll-behavior:\s*auto\s*!important/s,
      'prefers-reduced-motion must disable smooth scrolling to prevent motion sickness'
    );
  });

  it('verifies App.tsx wraps application with MotionConfig reducedMotion="user"', () => {
    assert.match(
      appContent,
      /<MotionConfig\s+reducedMotion=["']user["']>/,
      'App.tsx must configure <MotionConfig reducedMotion="user"> to respect system accessibility preferences'
    );
  });
});

describe('Tier 2: Focus Ring Visibility & Keyboard Accessibility', () => {
  const cssPath = path.join(frontendRoot, 'src', 'index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  it('verifies *:focus-visible applies distinct high-contrast accent ring', () => {
    assert.match(
      cssContent,
      /\*:focus-visible\s*\{[^}]*box-shadow:\s*0\s+0\s+0\s+2px\s+var\(--accent-color,\s*#D92B38\);/s,
      '*:focus-visible must apply a 2px box-shadow using var(--accent-color, #D92B38)'
    );
  });
});

describe('Tier 3: Mathematical WCAG AA/AAA Contrast Ratio Verification', () => {
  const oledBg = hexToRgb('0A0A0A'); // Base dark background
  const whiteText = hexToRgb('FFFFFF'); // Primary white text
  const mutedText = hexToRgb('A7A7A7'); // Muted text token
  const accentRed = hexToRgb('D92B38'); // Primary brand accent (#D92B38)

  it('verifies white text on #0A0A0A achieves WCAG AAA compliance (ratio >= 7.0:1)', () => {
    const ratio = getContrastRatio(oledBg, whiteText);
    // Calculated: ~19.3:1
    assert.ok(
      ratio >= 18.0,
      `White text contrast ratio (${ratio.toFixed(2)}:1) must achieve >= 18:1 on OLED background`
    );
    assert.ok(ratio >= 7.0, 'White text must exceed WCAG AAA threshold of 7.0:1');
  });

  it('verifies muted text #A7A7A7 on #0A0A0A achieves WCAG AAA compliance (ratio >= 7.0:1)', () => {
    const ratio = getContrastRatio(oledBg, mutedText);
    // Calculated: ~8.6:1
    assert.ok(
      ratio >= 8.0,
      `Muted text contrast ratio (${ratio.toFixed(2)}:1) must achieve >= 8.0:1 on OLED background`
    );
    assert.ok(ratio >= 7.0, 'Muted text must exceed WCAG AAA threshold of 7.0:1');
  });

  it('verifies Musify Accent Red #D92B38 with white text achieves WCAG AA compliance (ratio >= 4.5:1)', () => {
    const ratio = getContrastRatio(accentRed, whiteText);
    // Calculated: ~4.8:1
    assert.ok(
      ratio >= 4.5,
      `Accent contrast ratio with white text (${ratio.toFixed(2)}:1) must achieve WCAG AA threshold of 4.5:1 for button fills`
    );
  });
});

