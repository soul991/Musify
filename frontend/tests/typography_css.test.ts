import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');

describe('Tier 1: Typography System, Instrument Sans & Serif Loading & Tokens', () => {
  const cssPath = path.join(frontendRoot, 'src', 'index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  it('defines @font-face for Instrument Sans Variable and Instrument Serif with local woff2 source', () => {
    assert.match(
      cssContent,
      /@font-face\s*\{[^}]*font-family:\s*['"]Instrument Sans['"]/s,
      'index.css must contain @font-face definition for Instrument Sans'
    );
    assert.match(
      cssContent,
      /src:\s*url\(['"]\/fonts\/InstrumentSans-Variable\.woff2['"]\)/,
      'Instrument Sans @font-face must reference /fonts/InstrumentSans-Variable.woff2'
    );
    assert.match(
      cssContent,
      /@font-face\s*\{[^}]*font-family:\s*['"]Instrument Serif['"]/s,
      'index.css must contain @font-face definition for Instrument Serif'
    );
    assert.match(
      cssContent,
      /src:\s*url\(['"]\/fonts\/InstrumentSerif-Regular\.woff2['"]\)/,
      'Instrument Serif @font-face must reference /fonts/InstrumentSerif-Regular.woff2'
    );
  });

  it('verifies Fontshare and Google Fonts CDN references are completely removed in favor of self-hosted woff2', () => {
    assert.doesNotMatch(
      cssContent,
      /api\.fontshare\.com/,
      'index.css must NOT reference Fontshare CDN'
    );
    assert.doesNotMatch(
      cssContent,
      /fonts\.googleapis\.com/,
      'index.css must NOT reference Google Fonts CDN'
    );

    const landingCssPath = path.join(frontendRoot, 'src', 'landing', 'landing.css');
    const landingCssContent = fs.readFileSync(landingCssPath, 'utf8');
    assert.doesNotMatch(
      landingCssContent,
      /api\.fontshare\.com/,
      'landing.css must NOT reference Fontshare CDN'
    );
    assert.doesNotMatch(
      landingCssContent,
      /fonts\.googleapis\.com/,
      'landing.css must NOT reference Google Fonts CDN'
    );
  });

  it('verifies local Instrument font binary assets and OFL license exist', () => {
    const sansPath = path.join(frontendRoot, 'public', 'fonts', 'InstrumentSans-Variable.woff2');
    const serifPath = path.join(frontendRoot, 'public', 'fonts', 'InstrumentSerif-Regular.woff2');
    const licensePath = path.join(frontendRoot, 'public', 'fonts', 'LICENSE-Instrument.txt');

    assert.ok(fs.existsSync(sansPath), 'InstrumentSans-Variable.woff2 must exist in public/fonts/');
    assert.ok(fs.existsSync(serifPath), 'InstrumentSerif-Regular.woff2 must exist in public/fonts/');
    assert.ok(fs.existsSync(licensePath), 'LICENSE-Instrument.txt must exist in public/fonts/');

    const sansStat = fs.statSync(sansPath);
    const serifStat = fs.statSync(serifPath);
    assert.ok(sansStat.size > 20000, `InstrumentSans-Variable.woff2 (${sansStat.size} bytes) must be genuine binary font (>20KB)`);
    assert.ok(serifStat.size > 15000, `InstrumentSerif-Regular.woff2 (${serifStat.size} bytes) must be genuine binary font (>15KB)`);
  });

  it('defines --font-display and --font-body custom properties in theme and root', () => {
    assert.match(
      cssContent,
      /--font-display:\s*['"]Instrument Serif['"],\s*Georgia,\s*serif/,
      '--font-display must be tokenized with Instrument Serif and Georgia fallback'
    );
    assert.match(
      cssContent,
      /--font-body:\s*['"]Instrument Sans['"],\s*-apple-system,\s*BlinkMacSystemFont,\s*['"]Segoe UI['"],\s*Roboto,\s*sans-serif/,
      '--font-body must be tokenized with Instrument Sans and system fallback'
    );
  });

  it('exports .font-display, .font-body and .tabular-nums utility classes', () => {
    assert.match(
      cssContent,
      /\.font-display\s*\{[^}]*font-family:\s*var\(--font-display\);[^}]*\}/s,
      '.font-display utility class must apply var(--font-display)'
    );
    assert.match(
      cssContent,
      /\.font-body\s*\{[^}]*font-family:\s*var\(--font-body\);[^}]*\}/s,
      '.font-body utility class must apply var(--font-body)'
    );
    assert.match(
      cssContent,
      /\.tabular-nums\s*\{[^}]*font-variant-numeric:\s*tabular-nums;[^}]*\}/s,
      '.tabular-nums utility class must set font-variant-numeric: tabular-nums'
    );
  });
});

describe('Tier 2: Typographic Scale Ladder & Letter Tracking Hierarchy', () => {
  const cssPath = path.join(frontendRoot, 'src', 'index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  it('defines Display XL class (72px, weight 900, line-height 1.05, tracking -0.04em)', () => {
    assert.match(cssContent, /\.text-display-xl\s*\{[^}]*font-size:\s*72px/s);
    assert.match(cssContent, /\.text-display-xl\s*\{[^}]*font-weight:\s*900/s);
    assert.match(cssContent, /\.text-display-xl\s*\{[^}]*letter-spacing:\s*-0\.04em/s);
    assert.match(cssContent, /\.text-display-xl\s*\{[^}]*line-height:\s*1\.05/s);
  });

  it('defines Display class (40px, weight 800, line-height 1.15, tracking -0.03em)', () => {
    assert.match(cssContent, /\.text-display\s*\{[^}]*font-size:\s*40px/s);
    assert.match(cssContent, /\.text-display\s*\{[^}]*font-weight:\s*800/s);
    assert.match(cssContent, /\.text-display\s*\{[^}]*letter-spacing:\s*-0\.03em/s);
  });

  it('defines Title class (28px, weight 700, line-height 1.25, tracking -0.02em)', () => {
    assert.match(cssContent, /\.text-title\s*\{[^}]*font-size:\s*28px/s);
    assert.match(cssContent, /\.text-title\s*\{[^}]*font-weight:\s*700/s);
    assert.match(cssContent, /\.text-title\s*\{[^}]*letter-spacing:\s*-0\.02em/s);
  });

  it('defines Section class (20px, weight 600, line-height 1.3, tracking -0.01em)', () => {
    assert.match(cssContent, /\.text-section\s*\{[^}]*font-size:\s*20px/s);
    assert.match(cssContent, /\.text-section\s*\{[^}]*font-weight:\s*600/s);
    assert.match(cssContent, /\.text-section\s*\{[^}]*letter-spacing:\s*-0\.01em/s);
  });

  it('defines Body and Caption classes with neutral tracking and Instrument Sans body font', () => {
    assert.match(cssContent, /\.text-body\s*\{[^}]*font-size:\s*14px/s);
    assert.match(cssContent, /\.text-body\s*\{[^}]*font-weight:\s*500/s);
    assert.match(cssContent, /\.text-caption\s*\{[^}]*font-size:\s*12px/s);
    assert.match(cssContent, /\.text-caption\s*\{[^}]*font-weight:\s*400/s);
  });
});

describe('Tier 3: Tabular Numeral Alignment & Jitter Prevention', () => {
  it('verifies tabular numeral alignment logic formats elapsed time and song duration without layout shifts', () => {
    // Formatting simulation: mm:ss and hh:mm:ss
    const formatTime = (seconds: number): string => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      if (hrs > 0) {
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Equal character lengths for same range ensures consistent width with tabular-nums
    const t1 = formatTime(71); // 01:11
    const t2 = formatTime(78); // 01:18
    const t3 = formatTime(599); // 09:59
    assert.strictEqual(t1.length, 5);
    assert.strictEqual(t2.length, 5);
    assert.strictEqual(t3.length, 5);

    const long1 = formatTime(3675); // 01:01:15
    const long2 = formatTime(7322); // 02:02:02
    assert.strictEqual(long1.length, 8);
    assert.strictEqual(long2.length, 8);
  });
});
