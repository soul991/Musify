import { Request, Response } from 'express';
import { getInnertube } from './innertube.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

const execPromise = promisify(exec);

// In-memory cache for resolved stream URLs to avoid re-deciphering repeatedly
interface CachedStream {
  url: string;
  mimeType: string;
  contentLength: number;
  expiresAt: number;
}

const streamUrlCache = new Map<string, CachedStream>();

function findYtDlpBinary(): string {
  if (process.platform === 'win32') {
    const winBin = path.resolve(process.cwd(), 'bin/yt-dlp.exe');
    if (fs.existsSync(winBin)) {
      return winBin;
    }
    return 'yt-dlp';
  }

  // Check local bin directory inside backend for Linux container deployment
  const linuxBin = path.resolve(process.cwd(), 'bin/yt-dlp_linux');
  if (fs.existsSync(linuxBin)) {
    try {
      fs.chmodSync(linuxBin, 0o755);
    } catch {}
    return linuxBin;
  }
  const genericBin = path.resolve(process.cwd(), 'bin/yt-dlp');
  if (fs.existsSync(genericBin)) {
    try {
      fs.chmodSync(genericBin, 0o755);
    } catch {}
    return genericBin;
  }
  // Default to system PATH
  return 'yt-dlp';
}

async function extractWithYtDlp(videoId: string): Promise<CachedStream | null> {
  try {
    const bin = findYtDlpBinary();
    const { stdout } = await execPromise(
      `"${bin}" -g -f "bestaudio[ext=m4a]/bestaudio/best" "https://www.youtube.com/watch?v=${videoId}"`
    );
    const urls = stdout.trim().split('\n').map((s) => s.trim()).filter((s) => s.startsWith('http'));
    const url = urls[urls.length - 1];
    if (!url) return null;

    const headRes = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }).catch(() => null);

    const mime = headRes?.headers?.get('content-type') || 'audio/mp4';
    const clen = parseInt(headRes?.headers?.get('content-length') || '0', 10);

    return {
      url,
      mimeType: mime.split(';')[0],
      contentLength: clen,
      expiresAt: Date.now() + 5 * 3600 * 1000
    };
  } catch (e: any) {
    console.warn(`yt-dlp stream extraction failed for ${videoId}:`, e?.message || e);
    return null;
  }
}

export async function resolveStreamUrl(videoId: string): Promise<CachedStream> {
  const cached = streamUrlCache.get(videoId);
  const now = Date.now();
  if (cached && cached.expiresAt > now + 60000) {
    return cached;
  }

  // 1. Primary: yt-dlp (uses VISIONOS/whole-file iOS compatible aac/m4a & opus with JS challenges solved)
  const ytdlpStream = await extractWithYtDlp(videoId);
  if (ytdlpStream) {
    streamUrlCache.set(videoId, ytdlpStream);
    return ytdlpStream;
  }

  // 2. Fallback: Innertube decipher
  try {
    const yt = await getInnertube();
    const info = await yt.music.getInfo(videoId);
    const adaptiveFormats = info.streaming_data?.adaptive_formats || [];
    const audioFormats = adaptiveFormats.filter((f: any) => f.has_audio);

    if (audioFormats.length > 0) {
      const aacFormat = audioFormats.find((f: any) => f.itag === 140);
      const opusFormat = audioFormats.find((f: any) => f.itag === 251);
      const selectedFormat = aacFormat || opusFormat || audioFormats[0];

      const decipheredUrl = await selectedFormat.decipher(yt.session.player);
      if (decipheredUrl) {
        const result: CachedStream = {
          url: decipheredUrl,
          mimeType: selectedFormat.mime_type?.split(';')[0] || 'audio/mp4',
          contentLength: selectedFormat.content_length || 0,
          expiresAt: now + 5 * 3600 * 1000
        };
        streamUrlCache.set(videoId, result);
        return result;
      }
    }
  } catch (err) {
    console.warn(`Innertube fallback failed for ${videoId}:`, err);
  }

  throw new Error('Unable to extract playable audio stream for ' + videoId);
}

export async function handleStreamProxy(req: Request, res: Response) {
  const rawId = req.params.videoId;
  const videoId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!videoId) {
    res.setHeader('Cache-Control', 'no-store, no-cache');
    res.status(400).json({ error: 'videoId is required' });
    return;
  }

  try {
    const streamInfo = await resolveStreamUrl(videoId);
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
      streamUrlCache.delete(videoId);
      const freshInfo = await resolveStreamUrl(videoId);
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
      res.status(500).json({ error: err.message || 'Stream proxy failed' });
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
    'Access-Control-Allow-Origin': '*',
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
