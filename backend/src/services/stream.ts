import { Request, Response } from 'express';
import { getInnertube } from './innertube.js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import { isValidVideoId } from '../utils/validation.js';
import { isOriginAllowed, setStreamCorsHeaders } from '../utils/cors.js';

export { isValidVideoId };

const execFilePromise = promisify(execFile);

// In-memory cache for resolved stream URLs to avoid re-deciphering repeatedly
export interface CachedStream {
  url: string;
  mimeType: string;
  contentLength: number;
  expiresAt: number;
}

export const MAX_CACHE_SIZE = 500;
export const streamUrlCache = new Map<string, CachedStream>();
export const inFlightResolutions = new Map<string, Promise<CachedStream>>();

export function cleanupCache() {
  const now = Date.now();
  for (const [key, item] of streamUrlCache.entries()) {
    if (item.expiresAt <= now) {
      streamUrlCache.delete(key);
    }
  }
  while (streamUrlCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = streamUrlCache.keys().next().value;
    if (oldestKey !== undefined) {
      streamUrlCache.delete(oldestKey);
    } else {
      break;
    }
  }
}

export function setCachedStream(videoId: string, stream: CachedStream) {
  cleanupCache();
  streamUrlCache.set(videoId, stream);
}

export function getCachedStream(videoId: string): CachedStream | undefined {
  const item = streamUrlCache.get(videoId);
  if (!item) return undefined;
  if (item.expiresAt <= Date.now()) {
    streamUrlCache.delete(videoId);
    return undefined;
  }
  streamUrlCache.delete(videoId);
  streamUrlCache.set(videoId, item);
  return item;
}

/**
 * Stream Resolution Rate Limiter (30 real cache misses / minute per client key)
 * Real cache hits and range requests NEVER consume limiter tokens.
 */
export class StreamMissRateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private hits: Map<string, { count: number; resetAt: number }>;

  constructor(windowMs = 60 * 1000, maxRequests = 30) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.hits = new Map();
  }

  isAllowed(clientKey: string): { allowed: boolean; retryAfterSec?: number } {
    if (!clientKey || clientKey === '127.0.0.1' || clientKey === '::1' || clientKey === 'localhost' || clientKey.startsWith('192.168.') || clientKey.startsWith('10.') || clientKey.startsWith('172.')) {
      return { allowed: true };
    }
    const now = Date.now();
    const entry = this.hits.get(clientKey);

    if (!entry || entry.resetAt <= now) {
      this.hits.set(clientKey, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true };
    }

    if (entry.count < this.maxRequests) {
      entry.count += 1;
      return { allowed: true };
    }

    const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  reset() {
    this.hits.clear();
  }
}

export const streamMissLimiter = new StreamMissRateLimiter(60 * 1000, 30);

export class StreamRateLimitError extends Error {
  status: number;
  retryAfterSec: number;

  constructor(retryAfterSec: number) {
    super('Too many stream resolution requests. Please wait a moment.');
    this.name = 'StreamRateLimitError';
    this.status = 429;
    this.retryAfterSec = retryAfterSec;
  }
}

function isNetlifyHost(host?: string): boolean {
  if (!host) return false;
  const h = host.split(':')[0].toLowerCase();
  return (
    h === 'musify-live.netlify.app' ||
    h.endsWith('.netlify.app') ||
    /^([a-zA-Z0-9_-]+--)?musify-live\.netlify\.app$/.test(h)
  );
}

function isNetlifySite(urlOrOrigin?: string): boolean {
  if (!urlOrOrigin) return false;
  try {
    const parsed = new URL(urlOrOrigin);
    return isNetlifyHost(parsed.host);
  } catch {
    return (
      urlOrOrigin.includes('musify-live.netlify.app') ||
      /^https?:\/\/([a-zA-Z0-9_-]+--)?musify-live\.netlify\.app/.test(urlOrOrigin) ||
      urlOrOrigin.endsWith('.netlify.app')
    );
  }
}

/**
 * Extracts client key for stream rate limiting.
 *
 * For direct requests hitting the Catalyst backend directly, Catalyst AppSail acts
 * as a single reverse-proxy hop (one-hop assumption). Catalyst appends the true client IP
 * to the far right of the X-Forwarded-For header, making the rightmost entry untampered
 * by clients attempting to spoof upstream IPs.
 *
 * If the request arrives through the Netlify rewrite (detected by Origin/Referer being
 * the Netlify site and Host header being the Netlify host), the request traversed multiple
 * reverse proxies (Netlify edge + Catalyst AppSail). In that case, we use `req.ip` computed
 * by Express with TRUST_PROXY_HOPS so distinct users don't share a single proxy IP bucket.
 */
export function getStreamClientKey(req: Request): string {
  const rawHost = (req.headers?.['x-forwarded-host'] || req.headers?.host || '') as string;
  const host = Array.isArray(rawHost) ? rawHost[0] : (rawHost || (req as any).hostname || '');
  const rawOrigin = (req.headers?.origin || '') as string;
  const origin = Array.isArray(rawOrigin) ? rawOrigin[0] : rawOrigin;
  const rawReferer = (req.headers?.referer || '') as string;
  const referer = Array.isArray(rawReferer) ? rawReferer[0] : rawReferer;

  const isNetlifyRewrite =
    isNetlifyHost(host) &&
    (isNetlifySite(origin) || isNetlifySite(referer));

  if (isNetlifyRewrite && req.ip) {
    return req.ip;
  }

  // Direct requests: use rightmost X-Forwarded-For under the one-hop assumption
  const xff = req.headers?.['x-forwarded-for'];
  const xffStr = Array.isArray(xff) ? xff.join(',') : xff;
  if (typeof xffStr === 'string' && xffStr.trim()) {
    const parts = xffStr.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      return parts[parts.length - 1]; // rightmost entry: untampered client IP from immediate reverse proxy
    }
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

function findYtDlpBinary(): string {
  const isWin = process.platform === 'win32';
  const binName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
  const linuxBinName = 'yt-dlp_linux';

  const candidateDirs = [
    path.resolve(process.cwd(), 'bin'),
    path.resolve(process.cwd(), 'backend/bin'),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../bin')
  ];

  if (isWin) {
    for (const dir of candidateDirs) {
      const winBin = path.join(dir, binName);
      if (fs.existsSync(winBin)) {
        return winBin;
      }
      const genericBin = path.join(dir, 'yt-dlp');
      if (fs.existsSync(genericBin)) {
        return genericBin;
      }
    }
    return 'yt-dlp';
  }

  // Linux: check local yt-dlp_linux first, then generic yt-dlp
  for (const dir of candidateDirs) {
    const linuxBin = path.join(dir, linuxBinName);
    if (fs.existsSync(linuxBin)) {
      try {
        fs.chmodSync(linuxBin, 0o755);
      } catch {}
      return linuxBin;
    }
    const genericBin = path.join(dir, binName);
    if (fs.existsSync(genericBin)) {
      try {
        fs.chmodSync(genericBin, 0o755);
      } catch {}
      return genericBin;
    }
  }

  // Default to system PATH
  return 'yt-dlp';
}

function getYtDlpFormat(quality?: string): string {
  if (quality === 'low') {
    return 'bestaudio[abr<=64]/worstaudio/worst';
  }
  if (quality === 'medium') {
    return 'bestaudio[abr<=128]/bestaudio';
  }
  return 'bestaudio[ext=m4a]/bestaudio/best';
}

export async function extractWithYtDlp(videoId: string, quality?: string): Promise<CachedStream | null> {
  if (!isValidVideoId(videoId)) {
    return null;
  }
  try {
    const bin = findYtDlpBinary();
    const format = getYtDlpFormat(quality);
    const { stdout } = await execFilePromise(
      bin,
      [
        '--no-playlist',
        '--no-warnings',
        '--no-check-certificates',
        '-g',
        '-f',
        format,
        `https://www.youtube.com/watch?v=${videoId}`
      ],
      {
        timeout: 20000,
        maxBuffer: 10 * 1024 * 1024
      }
    );
    const urls = stdout.trim().split('\n').map((s) => s.trim()).filter((s) => s.startsWith('http'));
    const url = urls[urls.length - 1];
    if (!url) return null;

    return {
      url,
      mimeType: 'audio/mp4',
      contentLength: 0,
      expiresAt: Date.now() + 5 * 3600 * 1000
    };
  } catch (e: any) {
    console.warn(`yt-dlp stream extraction failed for ${videoId}:`, e?.message || e);
    return null;
  }
}

/**
 * Resolves stream URL with real cache miss rate-limiting (30/min per client key).
 * Cached hits return immediately and do NOT count against rate limit.
 * Passing no clientKey (e.g. for prefetch) exempts the request.
 */
export async function resolveStreamUrl(
  videoId: string,
  quality?: string,
  clientKey?: string
): Promise<CachedStream> {
  if (!isValidVideoId(videoId)) {
    throw new Error('Invalid videoId: ' + videoId);
  }
  const cacheKey = quality ? `${videoId}:${quality}` : videoId;
  const cached = getCachedStream(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now + 60000) {
    return cached; // Real cache hit: 0 rate limit cost!
  }

  // Real cache miss: apply rate limiter if clientKey is provided
  if (clientKey) {
    const check = streamMissLimiter.isAllowed(clientKey);
    if (!check.allowed) {
      throw new StreamRateLimitError(check.retryAfterSec || 60);
    }
  }

  // In-flight concurrent request de-duplication
  const existingPromise = inFlightResolutions.get(cacheKey);
  if (existingPromise) {
    return existingPromise;
  }

  const resolutionPromise = (async () => {
    try {
      // 1. Primary: Fast in-process Innertube decipher (~250-400ms) with 8s timeout
      let innertubeError: any = null;
      try {
        const innertubePromise = (async () => {
          const yt = await getInnertube();
          const info = await yt.music.getInfo(videoId);
          const adaptiveFormats = info.streaming_data?.adaptive_formats || [];
          const audioFormats = adaptiveFormats.filter((f: any) => f.has_audio);

          if (audioFormats.length > 0) {
            let selectedFormat: any;
            if (quality === 'low') {
              selectedFormat = [...audioFormats].sort((a: any, b: any) => (a.bitrate || 0) - (b.bitrate || 0))[0];
            } else if (quality === 'medium') {
              selectedFormat = audioFormats.find((f: any) => f.itag === 140 || f.itag === 251) || audioFormats[0];
            } else {
              // Prefer itag 140 (128k AAC/m4a) for native low-latency playback in iOS Safari and browsers
              const aacFormat = audioFormats.find((f: any) => f.itag === 140);
              const opusFormat = audioFormats.find((f: any) => f.itag === 251);
              selectedFormat = aacFormat || opusFormat || audioFormats[0];
            }

            const decipheredUrl = await selectedFormat.decipher(yt.session.player);
            if (decipheredUrl) {
              // Probe URL with 0-0 byte range to verify YouTube doesn't reject with 403
              const probeRes = await fetch(decipheredUrl, {
                headers: {
                  Range: 'bytes=0-0',
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                signal: AbortSignal.timeout(2500)
              }).catch(() => null);

              if (!probeRes || (!probeRes.ok && probeRes.status !== 206)) {
                throw new Error(`Innertube stream URL probe returned status ${probeRes?.status || 'failed'}`);
              }

              const result: CachedStream = {
                url: decipheredUrl,
                mimeType: selectedFormat.mime_type?.split(';')[0] || 'audio/mp4',
                contentLength: selectedFormat.content_length || 0,
                expiresAt: now + 5 * 3600 * 1000
              };
              setCachedStream(cacheKey, result);
              return result;
            }
          }
          throw new Error('No playable audio formats found in Innertube');
        })();

        let timerId: NodeJS.Timeout;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timerId = setTimeout(() => {
            reject(new Error('Innertube getInfo/decipher timed out after 8s'));
          }, 8000);
          if (timerId.unref) timerId.unref();
        });

        const result = await Promise.race([innertubePromise, timeoutPromise]);
        clearTimeout(timerId!);
        return result;
      } catch (err: any) {
        innertubeError = err;
        console.warn(`[STREAM] Innertube resolution failed for ${videoId}, falling back to yt-dlp: ${err?.message || err}`);
      }

      // 2. Fallback: yt-dlp binary extraction
      let ytdlpError: any = null;
      try {
        const ytdlpStream = await extractWithYtDlp(videoId, quality);
        if (ytdlpStream) {
          setCachedStream(cacheKey, ytdlpStream);
          return ytdlpStream;
        }
      } catch (err: any) {
        ytdlpError = err;
        console.warn(`[STREAM] yt-dlp extraction failed for ${videoId}: ${err?.message || err}`);
      }

      // If both fail: throw 502 with structured error details
      const streamErr: any = new Error('stream_unavailable');
      streamErr.status = 502;
      streamErr.error = 'stream_unavailable';
      streamErr.step = 'innertube|ytdlp';
      streamErr.innertubeError = innertubeError?.message || String(innertubeError);
      streamErr.ytdlpError = ytdlpError?.message || String(ytdlpError);
      throw streamErr;
    } finally {
      inFlightResolutions.delete(cacheKey);
    }
  })();

  inFlightResolutions.set(cacheKey, resolutionPromise);
  return resolutionPromise;
}

export async function handleStreamProxy(req: Request, res: Response) {
  setStreamCorsHeaders(req, res);

  const rawId = req.params.videoId;
  const videoId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!videoId || !isValidVideoId(videoId)) {
    res.setHeader('Cache-Control', 'no-store, no-cache');
    res.status(400).json({ error: 'Invalid or missing videoId' });
    return;
  }

  const rawQuality = req.query.quality;
  let quality: string | undefined;
  if (rawQuality !== undefined) {
    if (typeof rawQuality !== 'string' || !['lossless', 'high', 'medium', 'low'].includes(rawQuality)) {
      res.setHeader('Cache-Control', 'no-store, no-cache');
      res.status(400).json({ error: 'Invalid quality parameter' });
      return;
    }
    quality = rawQuality;
  }

  const cacheKey = quality ? `${videoId}:${quality}` : videoId;
  const clientKey = getStreamClientKey(req);

  try {
    const t0 = performance.now();
    const streamInfo = await resolveStreamUrl(videoId, quality, clientKey);
    const resolveMs = Math.round(performance.now() - t0);

    const rangeHeader = req.headers.range;
    const reqHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    if (rangeHeader) {
      reqHeaders['Range'] = rangeHeader;
    }

    const tUpstream = performance.now();
    const upstreamResponse = await fetch(streamInfo.url, {
      headers: reqHeaders
    });
    const firstByteMs = Math.round(performance.now() - tUpstream);

    console.log(`[STREAM] videoId=${videoId} | resolveStream: ${resolveMs}ms | upstream first byte: ${firstByteMs}ms | status: ${upstreamResponse.status} | range: ${rangeHeader || 'full'}`);

    if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
      console.warn(`[STREAM] videoId=${videoId} upstream returned ${upstreamResponse.status}. Purging cache and falling back to yt-dlp...`);
      streamUrlCache.delete(cacheKey);

      // 1. Immediate fallback to yt-dlp extraction
      try {
        const ytdlpStream = await extractWithYtDlp(videoId, quality);
        if (ytdlpStream) {
          const retryResponse = await fetch(ytdlpStream.url, { headers: reqHeaders });
          console.log(`[STREAM] yt-dlp fallback upstream status: ${retryResponse.status} for ${videoId}`);
          if (retryResponse.ok || retryResponse.status === 206) {
            setCachedStream(cacheKey, ytdlpStream);
            forwardStream(req, retryResponse, res, ytdlpStream.mimeType);
            return;
          }
        }
      } catch (ytdlpErr: any) {
        console.warn(`[STREAM] yt-dlp fallback attempt failed for ${videoId}:`, ytdlpErr?.message || ytdlpErr);
      }

      // 2. Secondary fallback: re-resolve
      const freshInfo = await resolveStreamUrl(videoId, quality, clientKey);
      const retryResponse = await fetch(freshInfo.url, { headers: reqHeaders });
      if (!retryResponse.ok && retryResponse.status !== 206) {
        setStreamCorsHeaders(req, res);
        res.setHeader('Cache-Control', 'no-store, no-cache');
        res.status(retryResponse.status).send('Upstream stream error');
        return;
      }
      forwardStream(req, retryResponse, res, freshInfo.mimeType);
      return;
    }

    forwardStream(req, upstreamResponse, res, streamInfo.mimeType);
  } catch (err: any) {
    setStreamCorsHeaders(req, res);
    if (err instanceof StreamRateLimitError || err?.status === 429) {
      res.setHeader('Retry-After', String(err.retryAfterSec || 60));
      res.setHeader('Cache-Control', 'no-store, no-cache');
      res.status(429).json({ error: err.message || 'Too many stream resolution requests. Please wait a moment.' });
      return;
    }
    if (err?.status === 502 || err?.error === 'stream_unavailable') {
      res.setHeader('Cache-Control', 'no-store, no-cache');
      res.status(502).json({ error: 'stream_unavailable', step: err.step || 'innertube|ytdlp' });
      return;
    }
    console.error('Error in handleStreamProxy:', err);
    if (!res.headersSent) {
      res.setHeader('Cache-Control', 'no-store, no-cache');
      res.status(500).json({ error: 'Stream proxy failed' });
    }
  }
}

function forwardStream(req: Request, upstreamResponse: any, res: Response, fallbackMimeType: string) {
  const status = upstreamResponse.status;
  const contentType = upstreamResponse.headers.get('content-type') || fallbackMimeType;
  const contentLength = upstreamResponse.headers.get('content-length');
  const contentRange = upstreamResponse.headers.get('content-range');
  const acceptRanges = upstreamResponse.headers.get('accept-ranges') || 'bytes';

  const origin = req.headers.origin;
  const allowOrigin = origin && isOriginAllowed(origin) ? origin : (origin ? '' : '*');

  const resHeaders: Record<string, string> = {
    'Content-Type': contentType,
    'Accept-Ranges': acceptRanges,
    'Access-Control-Allow-Headers': 'Range, Content-Range, Accept-Ranges, Content-Type',
    'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
    'Vary': 'Origin',
    'Cache-Control': status === 206 || status === 200 ? 'public, max-age=86400' : 'no-store, no-cache'
  };

  if (allowOrigin) {
    resHeaders['Access-Control-Allow-Origin'] = allowOrigin;
  }
  if (contentLength) {
    resHeaders['Content-Length'] = contentLength;
  }
  if (contentRange) {
    resHeaders['Content-Range'] = contentRange;
  }

  res.writeHead(status, resHeaders);

  if (!upstreamResponse.body) {
    res.end();
    return;
  }

  try {
    const nodeStream = Readable.fromWeb(upstreamResponse.body as any);
    nodeStream.pipe(res);

    res.on('close', () => {
      nodeStream.destroy();
    });

    nodeStream.on('error', () => {
      res.destroy();
    });
  } catch {
    const reader = upstreamResponse.body.getReader();
    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            res.end();
            break;
          }
          const ok = res.write(Buffer.from(value));
          if (!ok) {
            await new Promise((r) => res.once('drain', r));
          }
        }
      } catch {
        res.destroy();
      }
    };
    pump();
  }
}

export async function handlePrefetchStream(req: Request, res: Response) {
  setStreamCorsHeaders(req, res);
  const rawId = req.params.videoId || req.body?.videoId;
  const videoId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!videoId || !isValidVideoId(videoId)) {
    res.status(400).json({ error: 'Invalid or missing videoId' });
    return;
  }
  const rawQuality = req.query?.quality || req.body?.quality;
  const quality = typeof rawQuality === 'string' ? rawQuality : undefined;

  try {
    // Exempt from rate limiting: do not pass clientKey
    const streamInfo = await resolveStreamUrl(videoId, quality);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json({
      success: true,
      videoId,
      cached: true,
      expiresAt: streamInfo.expiresAt,
      mimeType: streamInfo.mimeType
    });
  } catch (err: any) {
    console.warn(`Prefetch failed for ${videoId}:`, err?.message || err);
    res.status(500).json({ error: 'Prefetch failed' });
  }
}

/**
 * GET /api/debug/stream/:videoId
 * Diagnostic endpoint active only when DEBUG_ENDPOINTS=true.
 * Returns which step failed (innertube, ytdlp, or innertube|ytdlp).
 */
export async function handleDebugStream(req: Request, res: Response) {
  setStreamCorsHeaders(req, res);

  if (process.env.DEBUG_ENDPOINTS !== 'true') {
    res.status(404).json({ error: 'Debug endpoints disabled' });
    return;
  }

  const rawId = req.params.videoId;
  const videoId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!videoId || !isValidVideoId(videoId)) {
    res.status(400).json({ error: 'Invalid or missing videoId' });
    return;
  }

  const rawQuality = req.query.quality;
  const quality = typeof rawQuality === 'string' ? rawQuality : undefined;

  const result: {
    videoId: string;
    innertube: { success: boolean; durationMs?: number; error?: string; mimeType?: string };
    ytdlp: { success: boolean; durationMs?: number; error?: string; mimeType?: string };
    failedStep: 'innertube|ytdlp' | 'innertube' | 'ytdlp' | null;
  } = {
    videoId,
    innertube: { success: false },
    ytdlp: { success: false },
    failedStep: null
  };

  // Step 1: Test Innertube
  const t0 = performance.now();
  try {
    const innertubePromise = (async () => {
      const yt = await getInnertube();
      const info = await yt.music.getInfo(videoId);
      const adaptiveFormats = info.streaming_data?.adaptive_formats || [];
      const audioFormats = adaptiveFormats.filter((f: any) => f.has_audio);
      if (audioFormats.length === 0) throw new Error('No audio formats found in Innertube');
      const format = audioFormats.find((f: any) => f.itag === 140) || audioFormats[0];
      const deciphered = await format.decipher(yt.session.player);
      if (!deciphered) throw new Error('Decipher returned empty URL');
      return format;
    })();

    let timerId: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timerId = setTimeout(() => reject(new Error('Innertube timed out after 8s')), 8000);
      if (timerId.unref) timerId.unref();
    });

    const format = await Promise.race([innertubePromise, timeoutPromise]);
    clearTimeout(timerId!);
    result.innertube = {
      success: true,
      durationMs: Math.round(performance.now() - t0),
      mimeType: format.mime_type
    };
  } catch (err: any) {
    result.innertube = {
      success: false,
      durationMs: Math.round(performance.now() - t0),
      error: err?.message || String(err)
    };
  }

  // Step 2: Test yt-dlp
  const t1 = performance.now();
  try {
    const ytdlpStream = await extractWithYtDlp(videoId, quality);
    if (!ytdlpStream) throw new Error('yt-dlp returned null or no stream URL');
    result.ytdlp = {
      success: true,
      durationMs: Math.round(performance.now() - t1),
      mimeType: ytdlpStream.mimeType
    };
  } catch (err: any) {
    result.ytdlp = {
      success: false,
      durationMs: Math.round(performance.now() - t1),
      error: err?.message || String(err)
    };
  }

  if (!result.innertube.success && !result.ytdlp.success) {
    result.failedStep = 'innertube|ytdlp';
  } else if (!result.innertube.success) {
    result.failedStep = 'innertube';
  } else if (!result.ytdlp.success) {
    result.failedStep = 'ytdlp';
  }

  res.json(result);
}
