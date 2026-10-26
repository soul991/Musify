import { Request, Response } from 'express';
import { getInnertube } from './innertube.js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import { isValidVideoId } from '../utils/validation.js';

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

async function extractWithYtDlp(videoId: string, quality?: string): Promise<CachedStream | null> {
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

export async function resolveStreamUrl(videoId: string, quality?: string): Promise<CachedStream> {
  if (!isValidVideoId(videoId)) {
    throw new Error('Invalid videoId: ' + videoId);
  }
  const cacheKey = quality ? `${videoId}:${quality}` : videoId;
  const cached = getCachedStream(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now + 60000) {
    return cached;
  }

  // 1. Primary: Fast in-process Innertube decipher (~250-400ms)
  try {
    const yt = await getInnertube();
    const info = await yt.music.getInfo(videoId);
    const adaptiveFormats = info.streaming_data?.adaptive_formats || [];
    const audioFormats = adaptiveFormats.filter((f: any) => f.has_audio);

    if (audioFormats.length > 0) {
      let selectedFormat: any;
      if (quality === 'low') {
        selectedFormat = [...audioFormats].sort((a: any, b: any) => (a.bitrate || 0) - (b.bitrate || 0))[0];
      } else if (quality === 'medium') {
        selectedFormat = audioFormats.find((f: any) => f.itag === 251 || f.itag === 140) || audioFormats[0];
      } else {
        const aacFormat = audioFormats.find((f: any) => f.itag === 140);
        const opusFormat = audioFormats.find((f: any) => f.itag === 251);
        selectedFormat = aacFormat || opusFormat || audioFormats[0];
      }

      const decipheredUrl = await selectedFormat.decipher(yt.session.player);
      if (decipheredUrl) {
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
  } catch (err) {
    console.warn(`Innertube primary resolution failed for ${videoId}, falling back to yt-dlp:`, err);
  }

  // 2. Fallback: yt-dlp binary extraction
  const ytdlpStream = await extractWithYtDlp(videoId, quality);
  if (ytdlpStream) {
    setCachedStream(cacheKey, ytdlpStream);
    return ytdlpStream;
  }

  throw new Error('Unable to extract playable audio stream for ' + videoId);
}

export async function handleStreamProxy(req: Request, res: Response) {
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

  try {
    const streamInfo = await resolveStreamUrl(videoId, quality);
    const rangeHeader = req.headers.range;

    const reqHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    if (rangeHeader) {
      reqHeaders['Range'] = rangeHeader;
    }

    const upstreamResponse = await fetch(streamInfo.url, {
      headers: reqHeaders
    });

    if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
      // If cached URL expired or was invalidated, purge and retry once
      streamUrlCache.delete(cacheKey);
      const freshInfo = await resolveStreamUrl(videoId, quality);
      const retryResponse = await fetch(freshInfo.url, { headers: reqHeaders });
      if (!retryResponse.ok && retryResponse.status !== 206) {
        res.setHeader('Cache-Control', 'no-store, no-cache');
        res.status(retryResponse.status).send('Upstream stream error');
        return;
      }
      forwardStream(retryResponse, res, freshInfo.mimeType);
      return;
    }

    forwardStream(upstreamResponse, res, streamInfo.mimeType);
  } catch (err: any) {
    console.error('Error in handleStreamProxy:', err);
    if (!res.headersSent) {
      res.setHeader('Cache-Control', 'no-store, no-cache');
      res.status(500).json({ error: 'Stream proxy failed' });
    }
  }
}

function forwardStream(upstreamResponse: any, res: Response, fallbackMimeType: string) {
  const status = upstreamResponse.status;
  const contentType = upstreamResponse.headers.get('content-type') || fallbackMimeType;
  const contentLength = upstreamResponse.headers.get('content-length');
  const contentRange = upstreamResponse.headers.get('content-range');
  const acceptRanges = upstreamResponse.headers.get('accept-ranges') || 'bytes';

  const resHeaders: Record<string, string> = {
    'Content-Type': contentType,
    'Accept-Ranges': acceptRanges,
    'Access-Control-Allow-Headers': 'Range, Content-Range, Accept-Ranges, Content-Type',
    'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
    'Cache-Control': status === 206 || status === 200 ? 'public, max-age=86400' : 'no-store, no-cache'
  };

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
