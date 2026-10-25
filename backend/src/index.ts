import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import musicRouter from './routes/music.js';
import streamRouter from './routes/stream.js';
import lyricsRouter from './routes/lyrics.js';

dotenv.config();

const app = express();
const PORT = process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || 3001;

// Enable CORS for all frontend requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Range', 'Authorization']
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Musify Backend',
    timestamp: new Date().toISOString()
  });
});

// Register routes
app.use('/api', musicRouter);
app.use('/api/stream', streamRouter);
app.use('/api/lyrics', lyricsRouter);

// Start server
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🎵 Musify Backend Server listening on port ${PORT}`);
});
