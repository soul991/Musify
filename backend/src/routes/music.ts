import { Router, Request, Response } from 'express';
import { isValidVideoId, isValidBrowseId } from '../utils/validation.js';
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
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const filter = typeof req.query.filter === 'string' ? req.query.filter.trim() : undefined;

  if (!query) {
    res.status(400).json({ error: 'Search query parameter "q" is required' });
    return;
  }
  if (query.length > 200) {
    res.status(400).json({ error: 'Search query too long (maximum 200 characters)' });
    return;
  }
  const allowedFilters = ['songs', 'albums', 'artists', 'playlists', 'song', 'album', 'artist', 'playlist'];
  if (filter && (!allowedFilters.includes(filter) || filter.length > 30)) {
    res.status(400).json({ error: 'Invalid filter parameter' });
    return;
  }

  try {
    const results = await searchMusic(query, filter);
    res.json(results);
  } catch (err: any) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/suggestions?q=...
router.get('/suggestions', async (req: Request, res: Response) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!query) {
    res.json([]);
    return;
  }
  if (query.length > 200) {
    res.status(400).json({ error: 'Search query too long (maximum 200 characters)' });
    return;
  }
  try {
    const suggestions = await getSearchSuggestions(query);
    res.json(suggestions);
  } catch (err: any) {
    console.error('Suggestions error:', err);
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
    res.status(500).json({ error: 'Failed to load home feed' });
  }
});

// GET /api/explore
router.get('/explore', async (_req: Request, res: Response) => {
  try {
    const explore = await getExploreFeed();
    res.json(explore || {});
  } catch (err: any) {
    console.error('Explore feed error:', err);
    res.status(500).json({ error: 'Failed to load explore feed' });
  }
});

// GET /api/song/:id
router.get('/song/:id', async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!isValidVideoId(id)) {
    res.status(400).json({ error: 'Invalid song ID format' });
    return;
  }
  try {
    const track = await getTrackDetails(id);
    if (!track) {
      res.status(404).json({ error: 'Song not found' });
      return;
    }
    res.json(track);
  } catch (err: any) {
    console.error('Song details error:', err);
    res.status(500).json({ error: 'Failed to load song details' });
  }
});

// GET /api/radio/:id (related / up next queue)
router.get('/radio/:id', async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!isValidVideoId(id)) {
    res.status(400).json({ error: 'Invalid song ID format' });
    return;
  }
  try {
    const related = await getRelatedTracks(id);
    res.json(related);
  } catch (err: any) {
    console.error('Radio tracks error:', err);
    res.status(500).json({ error: 'Failed to load radio tracks' });
  }
});

// GET /api/album/:id
router.get('/album/:id', async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!isValidBrowseId(id)) {
    res.status(400).json({ error: 'Invalid album ID format' });
    return;
  }
  try {
    const album = await getAlbumDetails(id);
    if (!album) {
      res.status(404).json({ error: 'Album not found' });
      return;
    }
    res.json(album);
  } catch (err: any) {
    console.error('Album details error:', err);
    res.status(500).json({ error: 'Failed to load album details' });
  }
});

// GET /api/artist/:id
router.get('/artist/:id', async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!isValidBrowseId(id)) {
    res.status(400).json({ error: 'Invalid artist ID format' });
    return;
  }
  try {
    const artist = await getArtistDetails(id);
    if (!artist) {
      res.status(404).json({ error: 'Artist not found' });
      return;
    }
    res.json(artist);
  } catch (err: any) {
    console.error('Artist details error:', err);
    res.status(500).json({ error: 'Failed to load artist details' });
  }
});

// GET /api/playlist/:id
router.get('/playlist/:id', async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!isValidBrowseId(id)) {
    res.status(400).json({ error: 'Invalid playlist ID format' });
    return;
  }
  try {
    const playlist = await getPlaylistDetails(id);
    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }
    res.json(playlist);
  } catch (err: any) {
    console.error('Playlist details error:', err);
    res.status(500).json({ error: 'Failed to load playlist details' });
  }
});

export default router;
