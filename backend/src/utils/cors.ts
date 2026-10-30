import type { Request, Response } from 'express';

export const defaultAllowedOrigins = [
  'https://musify-live.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

/**
 * Returns merged allowed origins list ensuring default origins (especially production origin)
 * are always included even when process.env.ALLOWED_ORIGINS is provided.
 */
export function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];
  return Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));
}

export function isOriginAllowed(origin?: string): boolean {
  if (!origin) return true;
  if (getAllowedOrigins().includes(origin)) return true;
  // Support Netlify deploy previews (e.g. https://deploy-preview-123--musify-live.netlify.app or https://branch--musify-live.netlify.app)
  if (/^https:\/\/([a-zA-Z0-9_-]+--)?musify-live\.netlify\.app$/.test(origin)) return true;
  return false;
}

/**
 * Explicitly sets CORS headers on stream responses and errors.
 * Ensures Access-Control-Allow-Origin, Access-Control-Expose-Headers, and Vary: Origin
 * are present on both 200/206 stream responses, as well as 429/500/502 errors.
 */
export function setStreamCorsHeaders(req: Request, res: Response): void {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader(
    'Access-Control-Expose-Headers',
    'Content-Range, Content-Length, Accept-Ranges, Server-Timing'
  );
}
