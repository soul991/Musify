import { Router, Request, Response } from 'express';
import { fetchLyrics } from '../services/lyrics.js';
import { isValidVideoId } from '../utils/validation.js';

const router = Router();

// GET /api/lyrics?title=...&artist=...&album=...&duration=...&videoId=...
router.get('/', async (req: Request, res: Response) => {
  const title = typeof req.query.title === 'string' ? req.query.title.trim() : '';
  const artist = typeof req.query.artist === 'string' ? req.query.artist.trim() : '';
  const album = typeof req.query.album === 'string' ? req.query.album.trim() : undefined;
  const rawDuration = req.query.duration;
  let duration: number | undefined;

  if (rawDuration !== undefined) {
    duration = parseFloat(rawDuration as string);
    if (isNaN(duration) || duration < 0 || duration > 86400) {
      res.status(400).json({ error: 'Invalid duration parameter (must be between 0 and 86400)' });
      return;
    }
  }

  const videoId = typeof req.query.videoId === 'string' ? req.query.videoId.trim() : undefined;

  if (videoId && !isValidVideoId(videoId)) {
    res.status(400).json({ error: 'Invalid videoId format' });
    return;
  }

  if (title.length > 200) {
    res.status(400).json({ error: 'Title parameter too long (max 200 characters)' });
    return;
  }
  if (artist.length > 200) {
    res.status(400).json({ error: 'Artist parameter too long (max 200 characters)' });
    return;
  }
  if (album && album.length > 200) {
    res.status(400).json({ error: 'Album parameter too long (max 200 characters)' });
    return;
  }

  if (!title && !videoId) {
    res.status(400).json({ error: 'Title or videoId is required' });
    return;
  }

  try {
    const result = await fetchLyrics(title, artist, album, duration, videoId);
    res.json(result);
  } catch (err: any) {
    console.error('Lyrics error:', err);
    res.status(500).json({ error: 'Lyrics retrieval failed' });
  }
});

export default router;
