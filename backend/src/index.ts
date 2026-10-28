import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import musicRouter from './routes/music.js';
import streamRouter from './routes/stream.js';
import lyricsRouter from './routes/lyrics.js';
import roomRouter from './routes/room.js';
import { getCachedStream, isValidVideoId } from './services/stream.js';
import { getInnertube, getHomeFeed } from './services/innertube.js';

dotenv.config();

const app = express();
const PORT = process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || 3001;

// Trust reverse proxy hops (Netlify edge + Catalyst AppSail gateway = 2 hops)
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS) || 2;
app.set('trust proxy', trustProxyHops);

// Security headers with Helmet (allow cross-origin resource access for media streaming)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS allowlist configuration
const defaultAllowedOrigins = [
  'https://musify-live.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : defaultAllowedOrigins;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    const corsErr: any = new Error('CORS origin not allowed');
    corsErr.status = 403;
    return callback(corsErr);
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Range', 'Authorization', 'Accept', 'Accept-Ranges', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 204
}));

app.use(express.json());

// General API rate limiter (1000 requests per 15 min; exempts health and warm endpoints)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const p = req.path;
    return p === '/health' || p === '/api/health' || p === '/warm' || p === '/api/warm';
  },
  message: { error: 'Too many requests, please try again later.' }
});

// Stream resolution rate limiter: limits ONLY expensive stream cache misses (30 per minute per client IP)
// Range requests (HTTP 206) and repeat requests for cached audio streams bypass this limiter
const streamResolutionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 new uncached stream resolutions per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const videoId = req.params.videoId || req.body?.videoId;
    if (videoId && isValidVideoId(videoId)) {
      const quality = typeof req.query?.quality === 'string' ? req.query.quality : undefined;
      const cacheKey = quality ? `${videoId}:${quality}` : videoId;
      if (getCachedStream(cacheKey)) {
        return true;
      }
    }
    return false;
  },
  message: { error: 'Too many stream resolution requests. Please wait a moment.' }
});

// Health check endpoint (exempt from rate limiting)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Musify Backend',
    timestamp: new Date().toISOString()
  });
});

// Cold-start warmup endpoint (exempt from rate limiting)
app.get('/api/warm', async (_req, res) => {
  try {
    const yt = await getInnertube();
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      status: 'warm',
      service: 'Musify Backend',
      sessionReady: Boolean(yt?.session),
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Warmup failed', details: err?.message || err });
  }
});

// Register rate limits
app.use('/api', apiLimiter);
app.use('/api/stream', streamResolutionLimiter);

// Register routes
app.use('/api', musicRouter);
app.use('/api/stream', streamRouter);
app.use('/api/lyrics', lyricsRouter);
app.use('/api/room', roomRouter);

// Global error handler - logs server-side and returns generic error to client
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.status !== 403) {
    console.error('Unhandled server error:', err);
  }
  if (!res.headersSent) {
    const status = typeof err.status === 'number' && err.status >= 400 && err.status < 600 ? err.status : 500;
    let safeMessage = 'Internal server error';
    if (status === 403) {
      safeMessage = 'Forbidden';
    } else if (status === 400) {
      safeMessage = 'Bad request';
    } else if (status === 404) {
      safeMessage = 'Not found';
    } else if (status === 429) {
      safeMessage = 'Too many requests';
    }
    res.status(status).json({ error: safeMessage });
  }
});

import { fileURLToPath } from 'url';
import path from 'path';

// Start server if executed directly
const isMain = process.argv[1] && (
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) ||
  path.resolve(process.argv[1]).endsWith('index.ts') ||
  path.resolve(process.argv[1]).endsWith('index.js')
) && process.env.NODE_ENV !== 'test';

// Boot-time background pre-warming
if (process.env.NODE_ENV !== 'test') {
  getInnertube()
    .then(async () => {
      console.log('⚡ Innertube session pre-warming ready');
      getHomeFeed().catch(() => {});
    })
    .catch((err) => console.warn('Innertube boot prewarm warning:', err?.message || err));
}

if (isMain) {
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🎵 Musify Backend Server listening on port ${PORT}`);
  });
}

export { app };
export default app;
