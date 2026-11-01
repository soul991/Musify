/**
 * Musify Accent Hue Extraction & In-Memory Cache (R4)
 *
 * Requirements:
 * - Dynamically extract or compute dominant artwork accent hue once per track.
 * - In-memory cache keyed by track ID / artwork URL (Map<string, string>).
 * - Low-chroma clamping (saturation ceiling) to avoid oversaturated neon dark-mode bleeding.
 * - Zero modifications to ThemeContext or backend services.
 */

import { useState, useEffect } from 'react';

export const DEFAULT_ACCENT_COLOR = '#E5303D'; // Musify brand calm red
export const DEFAULT_SECONDARY_COLOR = '#281418'; // Soothing deep dark red

/**
 * Low-chroma clamp bounds for OLED dark-mode harmony.
 * Prevents neon oversaturation while preserving the original hue.
 */
export const ACCENT_CHROMA_BOUNDS = {
  MAX_SATURATION: 0.48, // 48% saturation ceiling (calm, non-neon)
  MIN_LIGHTNESS: 0.28,  // 28% minimum lightness (prevents muddy black)
  MAX_LIGHTNESS: 0.62   // 62% maximum lightness (prevents bleached white)
} as const;

/**
 * In-memory accent cache keyed by track ID or artwork URL
 */
export const accentCache = new Map<string, string>();

/**
 * Build a deterministic cache key from trackId and artworkUrl
 */
export function buildAccentCacheKey(
  trackId?: string | number | null,
  artworkUrl?: string | null
): string {
  if (trackId !== undefined && trackId !== null && String(trackId).trim() !== '') {
    const s = String(trackId).trim();
    return s.startsWith('track:') ? s : `track:${s}`;
  }
  if (artworkUrl && artworkUrl.trim() !== '') {
    const u = artworkUrl.trim();
    return u.startsWith('url:') ? u : `url:${u}`;
  }
  return 'default';
}

/**
 * Get cached accent color
 */
export function getCachedAccent(
  trackId?: string | number | null,
  artworkUrl?: string | null
): string | undefined {
  const key = buildAccentCacheKey(trackId, artworkUrl);
  return accentCache.get(key);
}

/**
 * Set cached accent color
 */
export function setCachedAccent(
  keyOrTrackId: string | number,
  color: string,
  artworkUrl?: string | null
): void {
  const key = buildAccentCacheKey(keyOrTrackId, artworkUrl);
  accentCache.set(key, color);
}

/**
 * Clear accent color cache
 */
export function clearAccentCache(): void {
  accentCache.clear();
}

/**
 * Get current size of accent color cache
 */
export function getAccentCacheSize(): number {
  return accentCache.size;
}

/**
 * Parse hex color (#RGB, #RRGGBB) to RGB components
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.trim().replace(/^#/, '');
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }
  return null;
}

/**
 * Convert RGB components (0-255) to hex string (#RRGGBB)
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clampByte = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(clampByte(r))}${toHex(clampByte(g))}${toHex(clampByte(b))}`.toUpperCase();
}

/**
 * Convert RGB (0-255) to HSL (h in [0, 360), s in [0, 1], l in [0, 1])
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) * 60;
    } else if (max === gNorm) {
      h = ((bNorm - rNorm) / delta + 2) * 60;
    } else {
      h = ((rNorm - gNorm) / delta + 4) * 60;
    }
  }

  return { h, s, l };
}

/**
 * Convert HSL (h in [0, 360), s in [0, 1], l in [0, 1]) to RGB (0-255)
 */
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hPrime = (h % 360) / 60;
  const x = c * (1 - Math.abs((hPrime % 2) - 1));
  const m = l - c / 2;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hPrime >= 0 && hPrime < 1) {
    r1 = c; g1 = x; b1 = 0;
  } else if (hPrime >= 1 && hPrime < 2) {
    r1 = x; g1 = c; b1 = 0;
  } else if (hPrime >= 2 && hPrime < 3) {
    r1 = 0; g1 = c; b1 = x;
  } else if (hPrime >= 3 && hPrime < 4) {
    r1 = 0; g1 = x; b1 = c;
  } else if (hPrime >= 4 && hPrime < 5) {
    r1 = x; g1 = 0; b1 = c;
  } else if (hPrime >= 5 && hPrime < 6) {
    r1 = c; g1 = 0; b1 = x;
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255)
  };
}

/**
 * Clamp RGB chroma (saturation) and lightness to prevent neon dark-mode bleeding.
 * Preserves the exact hue angle.
 */
export function clampChroma(
  r: number,
  g: number,
  b: number,
  maxSaturation = ACCENT_CHROMA_BOUNDS.MAX_SATURATION,
  minLightness = ACCENT_CHROMA_BOUNDS.MIN_LIGHTNESS,
  maxLightness = ACCENT_CHROMA_BOUNDS.MAX_LIGHTNESS
): string {
  const { h, s, l } = rgbToHsl(r, g, b);

  // Clamp saturation with slight quantization buffer to prevent neon oversaturation
  const clampedS = Math.min(s, maxSaturation * 0.96);

  // Clamp lightness into restful dark-mode range
  const clampedL = Math.max(minLightness, Math.min(maxLightness, l));

  const clampedRgb = hslToRgb(h, clampedS, clampedL);
  return rgbToHex(clampedRgb.r, clampedRgb.g, clampedRgb.b);
}

/**
 * Clamp a hex color's chroma directly
 */
export function clampHexChroma(
  hex: string,
  maxSaturation = ACCENT_CHROMA_BOUNDS.MAX_SATURATION
): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return DEFAULT_ACCENT_COLOR;
  return clampChroma(rgb.r, rgb.g, rgb.b, maxSaturation);
}

/**
 * Check if a color is oversaturated/neon (saturation > safe ceiling)
 */
export function isNeonOrOversaturated(
  hex: string,
  threshold = ACCENT_CHROMA_BOUNDS.MAX_SATURATION
): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const { s } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return s > threshold + 0.005;
}

/**
 * Extract dominant soothing accent color from RGBA pixel data
 */
export function extractDominantColorFromPixels(
  data: Uint8ClampedArray | number[],
  _width: number,
  _height: number
): string {
  if (!data || data.length < 4) {
    return DEFAULT_ACCENT_COLOR;
  }

  let bestColor = { r: 229, g: 48, b: 61, score: -1 };

  // Sample every 4th pixel (16 bytes)
  for (let i = 0; i < data.length; i += 16) {
    const a = data[i + 3];
    if (a < 128) continue; // Skip transparent

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    const brightness = (r + g + b) / 3;

    // Soothing candidate filter: avoid pure black (<25) and near white (>230)
    if (brightness >= 25 && brightness <= 230 && sat >= 0.15) {
      // Prefer balanced saturation and moderate brightness
      const score = sat * 1.5 + (1 - Math.abs(brightness - 128) / 128);
      if (score > bestColor.score) {
        bestColor = { r, g, b, score };
      }
    }
  }

  if (bestColor.score < 0) {
    return DEFAULT_ACCENT_COLOR;
  }

  // Apply low-chroma clamp
  return clampChroma(bestColor.r, bestColor.g, bestColor.b);
}

/**
 * Deterministic color generator for non-browser / mock environments
 */
export function getDeterministicColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  // Calm low-chroma preset: saturation 40%, lightness 48%
  const rgb = hslToRgb(hue, 0.40, 0.48);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

export interface ExtractAccentOptions {
  trackId?: string | number | null;
  artworkUrl?: string | null;
  timeoutMs?: number;
}

/**
 * Extract accent color asynchronously with in-memory caching and low-chroma clamping.
 */
export async function extractAccentColor(options: ExtractAccentOptions): Promise<string> {
  const { trackId, artworkUrl, timeoutMs = 1200 } = options;
  const key = buildAccentCacheKey(trackId, artworkUrl);

  // 1. Cache hit check
  const cached = accentCache.get(key);
  if (cached) {
    return cached;
  }

  // 2. Default if no artwork URL
  if (!artworkUrl || artworkUrl.trim() === '') {
    accentCache.set(key, DEFAULT_ACCENT_COLOR);
    return DEFAULT_ACCENT_COLOR;
  }

  // 3. Browser environment check
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    // Non-browser / Node.js test environment: deterministic fallback
    const color = getDeterministicColor(key);
    accentCache.set(key, color);
    return color;
  }

  // 4. In-browser canvas extraction
  return new Promise((resolve) => {
    let resolved = false;
    const finish = (color: string) => {
      if (resolved) return;
      resolved = true;
      accentCache.set(key, color);
      resolve(color);
    };

    const timer = setTimeout(() => {
      finish(DEFAULT_ACCENT_COLOR);
    }, timeoutMs);

    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = artworkUrl;

      img.onload = () => {
        clearTimeout(timer);
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return finish(DEFAULT_ACCENT_COLOR);
          }
          canvas.width = 48;
          canvas.height = 48;
          ctx.drawImage(img, 0, 0, 48, 48);

          const imgData = ctx.getImageData(0, 0, 48, 48);
          const dominant = extractDominantColorFromPixels(imgData.data, 48, 48);
          finish(dominant);
        } catch {
          // Cross-origin taint or canvas error -> fallback
          finish(DEFAULT_ACCENT_COLOR);
        }
      };

      img.onerror = () => {
        clearTimeout(timer);
        finish(DEFAULT_ACCENT_COLOR);
      };
    } catch {
      clearTimeout(timer);
      finish(DEFAULT_ACCENT_COLOR);
    }
  });
}

/**
 * React hook to read or extract the low-chroma accent color for a track.
 * Initial render immediately returns the cached color if available.
 */
export function useAccentColor(
  trackId?: string | number | null,
  artworkUrl?: string | null
): { accentColor: string } {
  const key = buildAccentCacheKey(trackId, artworkUrl);
  const cached = accentCache.get(key);

  const [colorState, setColorState] = useState<{ key: string; color: string }>({
    key,
    color: cached || DEFAULT_ACCENT_COLOR
  });

  // If key changed and we already have a cached color, derive immediately without effect lag
  const activeColor = colorState.key === key ? colorState.color : (cached || DEFAULT_ACCENT_COLOR);

  useEffect(() => {
    if (accentCache.has(key)) {
      return;
    }

    let cancelled = false;

    extractAccentColor({ trackId, artworkUrl })
      .then((color) => {
        if (!cancelled) {
          setColorState({ key, color });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setColorState({ key, color: DEFAULT_ACCENT_COLOR });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key, trackId, artworkUrl]);

  return { accentColor: activeColor };
}
