import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import musicRouter from './routes/music.js';
import streamRouter from './routes/stream.js';
import lyricsRouter from './routes/lyrics.js';
import roomRouter from './routes/room.js';

dotenv.config();

const app = express();
const PORT = process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || 3001;

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

// Rate limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // general limit on /api
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

const streamLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // stricter limit on /api/stream
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many stream requests, please try again later.' }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Musify Backend',
    timestamp: new Date().toISOString()
  });
});

// Register rate limits
app.use('/api', apiLimiter);
app.use('/api/stream', streamLimiter);

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

if (isMain) {
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🎵 Musify Backend Server listening on port ${PORT}`);
  });
}

export { app };
export default app;
