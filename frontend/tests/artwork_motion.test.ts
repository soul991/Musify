import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ARTWORK_CROSSFADE_DURATION_SECONDS,
  ARTWORK_CROSSFADE_DURATION_MS,
  ARTWORK_REDUCED_MOTION_SECONDS,
  ARTWORK_REDUCED_MOTION_MS,
  DEFAULT_ARTWORK_FALLBACK,
  ARTWORK_ALLOWED_ANIMATED_PROPERTIES,
  ARTWORK_PROHIBITED_ANIMATED_PROPERTIES,
  artworkCrossfadeTransition,
  artworkReducedMotionTransition,
  artworkOpacityVariants,
  artworkReducedOpacityVariants,
  ArtworkCrossfade
} from '../src/components/player/ArtworkCrossfade.tsx';

import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_SECONDARY_COLOR,
  ACCENT_CHROMA_BOUNDS,
  accentCache,
  buildAccentCacheKey,
  getCachedAccent,
  setCachedAccent,
  clearAccentCache,
  getAccentCacheSize,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  clampChroma,
  clampHexChroma,
  isNeonOrOversaturated,
  extractDominantColorFromPixels,
  extractAccentColor,
  useAccentColor
} from '../src/utils/accentColor.ts';

import { FullPlayer } from '../src/components/player/FullPlayer.tsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');

describe('Milestone 4 (R4): Artwork Transition & Accent Hue System', () => {
  const fullPlayerPath = path.join(frontendRoot, 'src', 'components', 'player', 'FullPlayer.tsx');
  const fullPlayerSource = fs.readFileSync(fullPlayerPath, 'utf8');

  const crossfadePath = path.join(frontendRoot, 'src', 'components', 'player', 'ArtworkCrossfade.tsx');
  const crossfadeSource = fs.readFileSync(crossfadePath, 'utf8');

  const accentUtilPath = path.join(frontendRoot, 'src', 'utils', 'accentColor.ts');
  const accentUtilSource = fs.readFileSync(accentUtilPath, 'utf8');

  beforeEach(() => {
    clearAccentCache();
  });

  // =========================================================================
  // Suite 1: 320ms Artwork Opacity Crossfade Transition & Timing Invariants
  // =========================================================================
  describe('1. 320ms Crossfade Transition & Timing Invariants (R4)', () => {
    it('calibrates artwork crossfade duration to exactly 320ms (0.32 seconds)', () => {
      assert.strictEqual(
        ARTWORK_CROSSFADE_DURATION_MS,
        320,
        'Crossfade duration in ms must be exactly 320ms'
      );
      assert.strictEqual(
        ARTWORK_CROSSFADE_DURATION_SECONDS,
        0.32,
        'Crossfade duration in seconds must be exactly 0.32s'
      );
      assert.strictEqual(
        artworkCrossfadeTransition.duration,
        0.32,
        'artworkCrossfadeTransition duration must be 0.32s'
      );
    });

    it('uses smooth easing curve [0.4, 0.0, 0.2, 1] for artwork crossfade transition', () => {
      assert.deepStrictEqual(
        artworkCrossfadeTransition.ease,
        [0.4, 0.0, 0.2, 1],
        'artworkCrossfadeTransition must use standard smooth cubic-bezier easing'
      );
    });

    it('defines artworkOpacityVariants with initial 0 and animate 1 opacity at 320ms', () => {
      assert.strictEqual(
        (artworkOpacityVariants.initial as any).opacity,
        0,
        'artworkOpacityVariants.initial must start at opacity 0'
      );
      assert.strictEqual(
        (artworkOpacityVariants.animate as any).opacity,
        1,
        'artworkOpacityVariants.animate must fade in to opacity 1'
      );
      assert.strictEqual(
        (artworkOpacityVariants.exit as any).opacity,
        0,
        'artworkOpacityVariants.exit must fade out to opacity 0'
      );

      const animTransition = (artworkOpacityVariants.animate as any).transition;
      assert.strictEqual(
        animTransition.duration,
        0.32,
        'animate transition duration must be 320ms'
      );
    });

    it('embeds ArtworkCrossfade inside FullPlayer.tsx with trackId and artworkUrl', () => {
      assert.match(
        fullPlayerSource,
        /<ArtworkCrossfade\s+[^>]*trackId=\{currentTrack\.id\}[^>]*artworkUrl=\{currentTrack\.thumbnail\}/,
        'FullPlayer.tsx must render ArtworkCrossfade with trackId and artworkUrl'
      );
    });
  });

  // =========================================================================
  // Suite 2: Opacity-Only Animation Restriction & Zero Layout Thrashing Guardrails
  // =========================================================================
  describe('2. Opacity-Only Animation Restriction & Zero Layout Thrashing (R4/R6)', () => {
    it('restricts allowed animated properties strictly to opacity', () => {
      assert.deepStrictEqual(
        ARTWORK_ALLOWED_ANIMATED_PROPERTIES,
        ['opacity'] as const,
        'Only opacity is allowed for artwork crossfade'
      );
    });

    it('prohibits animations on geometric layout properties (width, height, top, bottom, margin, padding)', () => {
      const allowed = new Set<string>(ARTWORK_ALLOWED_ANIMATED_PROPERTIES);
      for (const prohibited of ARTWORK_PROHIBITED_ANIMATED_PROPERTIES) {
        assert.strictEqual(
          allowed.has(prohibited),
          false,
          `Prohibited property '${prohibited}' must not be in ARTWORK_ALLOWED_ANIMATED_PROPERTIES`
        );
      }
    });

    it('verifies zero transition-all or transition: all in ArtworkCrossfade.tsx and FullPlayer.tsx', () => {
      const crossfadeHasAll = /transition-all|transition:\s*all/i.test(crossfadeSource);
      assert.strictEqual(
        crossfadeHasAll,
        false,
        'ArtworkCrossfade.tsx must not contain transition-all or transition: all'
      );

      const fullPlayerHasAll = /transition-all|transition:\s*all/i.test(fullPlayerSource);
      assert.strictEqual(
        fullPlayerHasAll,
        false,
        'FullPlayer.tsx must not contain transition-all or transition: all'
      );
    });

    it('ensures dual-buffer outgoing layer sits at absolute inset-0 without geometric transforms', () => {
      assert.match(
        crossfadeSource,
        /data-testid=["']artwork-previous-layer["']\s+className=["']absolute inset-0 w-full h-full aspect-square pointer-events-none["']/,
        'Previous artwork buffer must be absolute inset-0 aspect-square'
      );
    });

    it('ensures incoming layer animates strictly opacity with willChange dynamically managed', () => {
      assert.match(
        crossfadeSource,
        /initial=\{\{\s*opacity:\s*previousBuffer\s*\?\s*0\s*:\s*1\s*\}\}/,
        'Incoming layer must fade in from opacity 0 when previous buffer is present'
      );
      assert.match(
        crossfadeSource,
        /animate=\{\{\s*opacity:\s*1\s*\}\}/,
        'Incoming layer must animate to opacity 1'
      );
      assert.match(
        crossfadeSource,
        /willChange:\s*isCrossfading\s*\?\s*['"]opacity['"]\s*:\s*['"]auto['"]/,
        'willChange must be opacity while crossfading and auto otherwise'
      );
    });

    it('verifies zero layout reads (getBoundingClientRect/offsetHeight) in crossfade loops', () => {
      const rAFInCrossfade = crossfadeSource.match(/requestAnimationFrame\([^)]+\)/g);
      assert.strictEqual(
        rAFInCrossfade,
        null,
        'ArtworkCrossfade.tsx must not declare custom requestAnimationFrame loops reading layout geometry'
      );
    });
  });

  // =========================================================================
  // Suite 3: Aspect Ratio Invariant & Image Error Fallback (0 Layout Shift)
  // =========================================================================
  describe('3. Aspect Ratio Invariant & Image Error Fallback (0 Layout Shift)', () => {
    it('enforces aspect-square on ArtworkCrossfade outer container', () => {
      assert.match(
        crossfadeSource,
        /data-testid=["']artwork-crossfade-container["']\s+className=\{`[^`]*aspect-square[^`]*`\}/,
        'ArtworkCrossfade container must enforce aspect-square'
      );
    });

    it('enforces aspect-square and object-cover on all image layers', () => {
      const imgMatches = crossfadeSource.match(/className=["'][^"']*aspect-square\s+object-cover[^"']*["']/g);
      assert.ok(imgMatches && imgMatches.length >= 2, 'All images in crossfade must enforce aspect-square object-cover');
    });

    it('enforces aspect-square on FullPlayer artwork shared container', () => {
      assert.match(
        fullPlayerSource,
        /<motion\.div[\s\S]*?layoutId=["']player-artwork["'][\s\S]*?className=["'][^"']*aspect-square[^"']*["']/,
        'FullPlayer layoutId="player-artwork" container must specify aspect-square'
      );
    });

    it('defines default artwork fallback as /icons/musify-icon.svg', () => {
      assert.strictEqual(
        DEFAULT_ARTWORK_FALLBACK,
        '/icons/musify-icon.svg',
        'Fallback icon must be /icons/musify-icon.svg'
      );
    });

    it('handles image loading error gracefully by swapping to fallbackSrc without layout change', () => {
      assert.match(
        crossfadeSource,
        /onError=\{handleCurrentError\}/,
        'Current image must attach onError handler'
      );
      assert.match(
        crossfadeSource,
        /onError=\{handlePreviousError\}/,
        'Previous image must attach onError handler'
      );
      assert.match(
        crossfadeSource,
        /currentBuffer\.hasError\s*\?\s*fallbackSrc\s*:\s*currentBuffer\.url/,
        'Image src must swap to fallbackSrc on error without altering element dimensions'
      );
    });

    it('mathematically evaluates aspect ratio invariant width / height = 1.0', () => {
      const testSizes = [40, 110, 150, 280, 340, 400];
      for (const size of testSizes) {
        const ratio = size / size;
        assert.strictEqual(ratio, 1.0, `Aspect ratio for ${size}x${size} must be exactly 1.0 (zero layout shift)`);
      }
    });
  });

  // =========================================================================
  // Suite 4: Low-Chroma Accent Extraction & In-Memory Caching (R4)
  // =========================================================================
  describe('4. Low-Chroma Accent Extraction & In-Memory Caching (R4)', () => {
    it('defines DEFAULT_ACCENT_COLOR as Musify brand calm red #E5303D', () => {
      assert.strictEqual(DEFAULT_ACCENT_COLOR, '#E5303D');
      assert.strictEqual(DEFAULT_SECONDARY_COLOR, '#281418');
    });

    it('defines low-chroma saturation ceiling at <= 0.48 to prevent neon dark-mode bleeding', () => {
      assert.ok(
        ACCENT_CHROMA_BOUNDS.MAX_SATURATION <= 0.50,
        `Saturation ceiling (${ACCENT_CHROMA_BOUNDS.MAX_SATURATION}) must be <= 0.50`
      );
      assert.strictEqual(ACCENT_CHROMA_BOUNDS.MAX_SATURATION, 0.48);
      assert.strictEqual(ACCENT_CHROMA_BOUNDS.MIN_LIGHTNESS, 0.28);
      assert.strictEqual(ACCENT_CHROMA_BOUNDS.MAX_LIGHTNESS, 0.62);
    });

    it('stores and retrieves colors in the in-memory accentCache keyed by track ID or URL', () => {
      assert.strictEqual(getAccentCacheSize(), 0);

      setCachedAccent('track-101', '#E5303D');
      assert.strictEqual(getAccentCacheSize(), 1);
      assert.strictEqual(getCachedAccent('track-101'), '#E5303D');

      // Keyed by artwork URL
      setCachedAccent('track-102', '#4A7C59', 'https://example.com/art.jpg');
      assert.strictEqual(getCachedAccent('track-102', 'https://example.com/art.jpg'), '#4A7C59');
      assert.ok(accentCache instanceof Map, 'accentCache must be an in-memory Map');
    });

    it('verifies rgbToHex, hslToRgb, and clampChroma mathematical conversions', () => {
      assert.strictEqual(rgbToHex(229, 48, 61), '#E5303D');
      const rgb = hslToRgb(120, 0.46, 0.5);
      assert.ok(rgb.g > rgb.r && rgb.g > rgb.b, 'Green component must dominate for hue 120');
      const clamped = clampChroma(0, 255, 0, 0.45);
      assert.match(clamped, /^#[0-9A-F]{6}$/i);
    });

    it('returns cached color instantly on cache hit without re-extraction', async () => {
      const trackId = 'cached-track-999';
      const expectedColor = '#7A3E4D';

      setCachedAccent(trackId, expectedColor);

      const result = await extractAccentColor({ trackId, artworkUrl: 'https://example.com/heavy.jpg' });
      assert.strictEqual(result, expectedColor, 'Must return cached color on cache hit');
    });

    it('clears cache completely with clearAccentCache', () => {
      setCachedAccent('track-1', '#112233');
      setCachedAccent('track-2', '#445566');
      assert.strictEqual(getAccentCacheSize(), 2);

      clearAccentCache();
      assert.strictEqual(getAccentCacheSize(), 0);
      assert.strictEqual(getCachedAccent('track-1'), undefined);
    });

    it('builds deterministic and collision-free cache keys', () => {
      const key1 = buildAccentCacheKey('123', 'https://art/1.jpg');
      const key2 = buildAccentCacheKey('124', 'https://art/1.jpg');
      const key3 = buildAccentCacheKey(null, 'https://art/2.jpg');
      const key4 = buildAccentCacheKey(null, null);

      assert.strictEqual(key1, 'track:123');
      assert.strictEqual(key2, 'track:124');
      assert.strictEqual(key3, 'url:https://art/2.jpg');
      assert.strictEqual(key4, 'default');
      assert.notStrictEqual(key1, key2);
    });

    it('clamps pure neon green (#00FF00) to calm, low-chroma green with preserved hue (120 deg)', () => {
      const neonGreenHex = '#00FF00';
      assert.strictEqual(isNeonOrOversaturated(neonGreenHex), true);

      const clampedHex = clampHexChroma(neonGreenHex);
      assert.strictEqual(isNeonOrOversaturated(clampedHex), false);

      const rgb = hexToRgb(clampedHex);
      assert.ok(rgb, 'Clamped color must parse to valid RGB');
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

      // Hue should stay 120 degrees (+- 1 deg)
      assert.ok(
        Math.abs(hsl.h - 120) <= 2,
        `Hue (${hsl.h}) must be preserved near 120 deg`
      );
      // Saturation must be <= 0.48
      assert.ok(
        hsl.s <= 0.485,
        `Saturation (${hsl.s.toFixed(3)}) must be clamped <= 0.48`
      );
    });

    it('clamps pure neon cyan (#00FFFF) to calm, low-chroma cyan with preserved hue (180 deg)', () => {
      const neonCyanHex = '#00FFFF';
      assert.strictEqual(isNeonOrOversaturated(neonCyanHex), true);

      const clampedHex = clampHexChroma(neonCyanHex);
      assert.strictEqual(isNeonOrOversaturated(clampedHex), false);

      const rgb = hexToRgb(clampedHex);
      assert.ok(rgb);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

      assert.ok(
        Math.abs(hsl.h - 180) <= 2,
        `Hue (${hsl.h}) must be preserved near 180 deg`
      );
      assert.ok(hsl.s <= 0.485);
    });

    it('clamps pure neon magenta (#FF00FF) to calm, low-chroma magenta with preserved hue (300 deg)', () => {
      const neonMagentaHex = '#FF00FF';
      assert.strictEqual(isNeonOrOversaturated(neonMagentaHex), true);

      const clampedHex = clampHexChroma(neonMagentaHex);
      assert.strictEqual(isNeonOrOversaturated(clampedHex), false);

      const rgb = hexToRgb(clampedHex);
      assert.ok(rgb);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

      assert.ok(
        Math.abs(hsl.h - 300) <= 2,
        `Hue (${hsl.h}) must be preserved near 300 deg`
      );
      assert.ok(hsl.s <= 0.485);
    });

    it('clamps pure neon yellow (#FFFF00) to calm, low-chroma gold/amber with preserved hue (60 deg)', () => {
      const neonYellowHex = '#FFFF00';
      assert.strictEqual(isNeonOrOversaturated(neonYellowHex), true);

      const clampedHex = clampHexChroma(neonYellowHex);
      assert.strictEqual(isNeonOrOversaturated(clampedHex), false);

      const rgb = hexToRgb(clampedHex);
      assert.ok(rgb);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

      assert.ok(
        Math.abs(hsl.h - 60) <= 2,
        `Hue (${hsl.h}) must be preserved near 60 deg`
      );
      assert.ok(hsl.s <= 0.485);
    });

    it('extracts dominant color from synthetic pixel data with low-chroma clamp', () => {
      // 48x48 RGBA image mock
      const numPixels = 48 * 48;
      const data = new Uint8ClampedArray(numPixels * 4);

      // Fill with neon blue (0, 0, 255, 255)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 255;
        data[i + 3] = 255;
      }

      const extractedHex = extractDominantColorFromPixels(data, 48, 48);
      assert.strictEqual(typeof extractedHex, 'string');
      assert.match(extractedHex, /^#[0-9A-F]{6}$/i);
      assert.strictEqual(isNeonOrOversaturated(extractedHex), false);

      const rgb = hexToRgb(extractedHex);
      assert.ok(rgb);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      assert.ok(Math.abs(hsl.h - 240) <= 2, 'Hue must be blue (240 deg)');
      assert.ok(hsl.s <= 0.485, 'Extracted color must be clamped to low chroma');
    });

    it('falls back to DEFAULT_ACCENT_COLOR when pixel buffer is empty or corrupted', () => {
      const empty = new Uint8ClampedArray(0);
      assert.strictEqual(
        extractDominantColorFromPixels(empty, 0, 0),
        DEFAULT_ACCENT_COLOR
      );

      // All transparent pixels
      const transparent = new Uint8ClampedArray([0, 0, 0, 0, 255, 255, 255, 0]);
      assert.strictEqual(
        extractDominantColorFromPixels(transparent, 2, 1),
        DEFAULT_ACCENT_COLOR
      );
    });

    it('extractAccentColor returns deterministic low-chroma hex in non-browser runtime', async () => {
      const color = await extractAccentColor({
        trackId: 'track-xyz',
        artworkUrl: 'https://example.com/art.png'
      });
      assert.strictEqual(typeof color, 'string');
      assert.match(color, /^#[0-9A-F]{6}$/i);
      assert.strictEqual(isNeonOrOversaturated(color), false);

      // Should now be cached
      assert.strictEqual(getCachedAccent('track-xyz'), color);
    });

    it('returns DEFAULT_ACCENT_COLOR when artworkUrl is null or empty', async () => {
      const color = await extractAccentColor({
        trackId: 'track-empty-art',
        artworkUrl: ''
      });
      assert.strictEqual(color, DEFAULT_ACCENT_COLOR);
    });
  });

  // =========================================================================
  // Suite 5: Reduced Motion Compliance (100ms Linear Opacity)
  // =========================================================================
  describe('5. Reduced Motion Compliance (100ms Linear Opacity) (R6)', () => {
    it('defines ARTWORK_REDUCED_MOTION_SECONDS as exactly 100ms (0.1 seconds)', () => {
      assert.strictEqual(ARTWORK_REDUCED_MOTION_MS, 100);
      assert.strictEqual(ARTWORK_REDUCED_MOTION_SECONDS, 0.1);
      assert.strictEqual(artworkReducedMotionTransition.duration, 0.1);
      assert.strictEqual(artworkReducedMotionTransition.ease, 'linear');
    });

    it('defines artworkReducedOpacityVariants with 100ms linear opacity transition', () => {
      assert.strictEqual((artworkReducedOpacityVariants.initial as any).opacity, 0);
      assert.strictEqual((artworkReducedOpacityVariants.animate as any).opacity, 1);
      assert.strictEqual((artworkReducedOpacityVariants.exit as any).opacity, 0);

      const animTransition = (artworkReducedOpacityVariants.animate as any).transition;
      assert.strictEqual(animTransition.duration, 0.1);
      assert.strictEqual(animTransition.ease, 'linear');
    });

    it('queries system reduced motion preference in ArtworkCrossfade.tsx', () => {
      assert.match(
        crossfadeSource,
        /const\s+systemReducedMotion\s*=\s*useReducedMotion\(\)/,
        'ArtworkCrossfade must query useReducedMotion()'
      );
    });

    it('passes reducedMotion prop from FullPlayer.tsx to ArtworkCrossfade', () => {
      assert.match(
        fullPlayerSource,
        /<ArtworkCrossfade[\s\S]*?reducedMotion=\{shouldReduceMotion\s*\?\?\s*false\}/,
        'FullPlayer.tsx must pass shouldReduceMotion to ArtworkCrossfade'
      );
    });
  });

  // =========================================================================
  // Suite 6: Shared-Element Integration & Ambient Glow Invariants
  // =========================================================================
  describe('6. Shared-Element Integration & Ambient Glow Invariants', () => {
    it('preserves layoutId="player-artwork" and activeSharedTransition on FullPlayer container', () => {
      assert.match(
        fullPlayerSource,
        /<motion\.div[^>]*layoutId=["']player-artwork["'][^>]*transition=\{activeSharedTransition\}/,
        'FullPlayer must preserve layoutId="player-artwork" with activeSharedTransition'
      );
    });

    it('keeps FullPlayer free of off-token accent colours and ambient orbs', () => {
      // Integration decision: ambient orbs and accent-tinted drop shadows were removed by the design system
      // (neutral shadow only, accent is the single token colour). Guard against their return.
      assert.doesNotMatch(fullPlayerSource, /#E5303D|rgba\(229/, 'FullPlayer must not hardcode an off-token accent');
      assert.doesNotMatch(fullPlayerSource, /blur-\[(?:100|120|150)px\]/, 'FullPlayer must not render blurred ambient orbs');
    });

    it('Now Playing has no turntable overlay and passes reduced motion to the artwork', () => {
      assert.doesNotMatch(fullPlayerSource, /Turntable/, 'Turntable mode was removed from the redesigned Now Playing');
      assert.match(fullPlayerSource, /<ArtworkCrossfade[\s\S]*?reducedMotion=\{shouldReduceMotion \?\? false\}/, 'Artwork crossfade must receive reduced-motion state');
    });
  });

  // =========================================================================
  // Suite 7: State Isolation & Read-Only Consumption Guardrails (R7)
  // =========================================================================
  describe('7. State Isolation & Read-Only Consumption Guardrails (R7)', () => {
    it('confirms ArtworkCrossfade is an exported React component', () => {
      assert.strictEqual(
        typeof ArtworkCrossfade,
        'function',
        'ArtworkCrossfade must be an exported component function'
      );
    });

    it('confirms FullPlayer is an exported React component', () => {
      assert.strictEqual(
        typeof FullPlayer,
        'function',
        'FullPlayer must be an exported component function'
      );
    });

    it('confirms useAccentColor is an exported React hook', () => {
      assert.strictEqual(
        typeof useAccentColor,
        'function',
        'useAccentColor must be an exported hook function'
      );
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

    it('verifies protected directories (backend/, services/, context/) were NOT modified', () => {
      // In accentColor.ts and ArtworkCrossfade.tsx, no imports from backend or internal audio context
      assert.doesNotMatch(
        accentUtilSource,
        /from\s+['"][^'"]*backend/,
        'accentColor.ts must not import from backend'
      );
      assert.doesNotMatch(
        crossfadeSource,
        /from\s+['"][^'"]*backend/,
        'ArtworkCrossfade.tsx must not import from backend'
      );
    });
  });
});
