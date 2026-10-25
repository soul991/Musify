import { Router, Request, Response } from 'express';
import { fetchLyrics } from '../services/lyrics.js';

const router = Router();

// GET /api/lyrics?title=...&artist=...&album=...&duration=...&videoId=...
router.get('/', async (req: Request, res: Response) => {
  const title = (req.query.title as string) || '';
  const artist = (req.query.artist as string) || '';
  const album = req.query.album as string | undefined;
  const duration = req.query.duration ? parseFloat(req.query.duration as string) : undefined;
  const videoId = req.query.videoId as string | undefined;

  if (!title && !videoId) {
    res.status(400).json({ error: 'Title or videoId is required' });
    return;
  }

  try {
    const result = await fetchLyrics(title, artist, album, duration, videoId);
    res.json(result);
  } catch (err: any) {
    console.error('Lyrics error:', err);
    res.status(500).json({ error: err.message || 'Lyrics retrieval failed' });
  }
});

export default router;
