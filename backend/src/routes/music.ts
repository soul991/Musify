import { Router, Request, Response } from 'express';
import {
  searchMusic,
  getSearchSuggestions,
  getHomeFeed,
  getExploreFeed,
  getTrackDetails,
  getRelatedTracks,
  getAlbumDetails,
  getArtistDetails,
  getPlaylistDetails
} from '../services/innertube.js';

const router = Router();

// GET /api/search?q=...&filter=...
router.get('/search', async (req: Request, res: Response) => {
  const query = req.query.q as string;
  const filter = req.query.filter as string;
  if (!query) {
    res.status(400).json({ error: 'Search query parameter "q" is required' });
    return;
  }
  try {
    const results = await searchMusic(query, filter);
    res.json(results);
  } catch (err: any) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message || 'Search failed' });
  }
});

// GET /api/suggestions?q=...
router.get('/suggestions', async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
    res.json([]);
    return;
  }
  try {
    const suggestions = await getSearchSuggestions(query);
    res.json(suggestions);
  } catch (err: any) {
    res.json([]);
  }
});

// GET /api/home
router.get('/home', async (_req: Request, res: Response) => {
  try {
    const sections = await getHomeFeed();
    res.json(sections);
  } catch (err: any) {
    console.error('Home feed error:', err);
    res.status(500).json({ error: err.message || 'Failed to load home feed' });
  }
});

// GET /api/explore
router.get('/explore', async (_req: Request, res: Response) => {
  try {
    const explore = await getExploreFeed();
    res.json(explore || {});
  } catch (err: any) {
    console.error('Explore feed error:', err);
    res.status(500).json({ error: err.message || 'Failed to load explore feed' });
  }
});

// GET /api/song/:id
router.get('/song/:id', async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const track = await getTrackDetails(id);
    if (!track) {
      res.status(404).json({ error: 'Song not found' });
      return;
    }
    res.json(track);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/radio/:id (related / up next queue)
router.get('/radio/:id', async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const related = await getRelatedTracks(id);
    res.json(related);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/album/:id
router.get('/album/:id', async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const album = await getAlbumDetails(id);
    if (!album) {
      res.status(404).json({ error: 'Album not found' });
      return;
    }
    res.json(album);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/artist/:id
router.get('/artist/:id', async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const artist = await getArtistDetails(id);
    if (!artist) {
      res.status(404).json({ error: 'Artist not found' });
      return;
    }
    res.json(artist);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/playlist/:id
router.get('/playlist/:id', async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const playlist = await getPlaylistDetails(id);
    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }
    res.json(playlist);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
