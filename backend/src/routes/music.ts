import { Router, Request, Response } from 'express';
import { isValidVideoId, isValidBrowseId } from '../utils/validation.js';
import { musicCache, TTL } from '../utils/cache.js';
import { handlePrefetchStream } from '../services/stream.js';
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

// Standard cache-control header helper
function setCacheHeaders(res: Response, maxAge = 60, staleRevalidate = 600) {
  res.setHeader('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${staleRevalidate}`);
}

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
    const normalizedKey = `search:${query.toLowerCase()}:${filter || 'all'}`;
    const results = await musicCache.fetchDedupe(normalizedKey, TTL.SEARCH, () => searchMusic(query, filter));
    setCacheHeaders(res, 60, 300);
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
    const normalizedKey = `sugg:${query.toLowerCase()}`;
    const suggestions = await musicCache.fetchDedupe(normalizedKey, TTL.SUGGESTIONS, () => getSearchSuggestions(query));
    setCacheHeaders(res, 300, 600);
    res.json(suggestions);
  } catch (err: any) {
    console.error('Suggestions error:', err);
    res.json([]);
  }
});

// GET /api/home
router.get('/home', async (_req: Request, res: Response) => {
  try {
    const sections = await musicCache.fetchDedupe('home_feed', TTL.HOME, () => getHomeFeed());
    setCacheHeaders(res, 60, 600);
    res.json(sections);
  } catch (err: any) {
    console.error('Home feed error:', err);
    res.status(500).json({ error: 'Failed to load home feed' });
  }
});

// GET /api/explore
router.get('/explore', async (_req: Request, res: Response) => {
  try {
    const explore = await musicCache.fetchDedupe('explore_feed', TTL.EXPLORE, () => getExploreFeed());
    setCacheHeaders(res, 120, 900);
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
    const track = await musicCache.fetchDedupe(`song:${id}`, TTL.DETAILS, () => getTrackDetails(id));
    if (!track) {
      res.status(404).json({ error: 'Song not found' });
      return;
    }
    setCacheHeaders(res, 120, 1800);
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
    const related = await musicCache.fetchDedupe(`radio:${id}`, TTL.RADIO, () => getRelatedTracks(id));
    setCacheHeaders(res, 120, 1800);
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
    const album = await musicCache.fetchDedupe(`album:${id}`, TTL.DETAILS, () => getAlbumDetails(id));
    if (!album) {
      res.status(404).json({ error: 'Album not found' });
      return;
    }
    setCacheHeaders(res, 300, 1800);
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
    const artist = await musicCache.fetchDedupe(`artist:${id}`, TTL.DETAILS, () => getArtistDetails(id));
    if (!artist) {
      res.status(404).json({ error: 'Artist not found' });
      return;
    }
    setCacheHeaders(res, 300, 1800);
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
    const playlist = await musicCache.fetchDedupe(`playlist:${id}`, TTL.DETAILS, () => getPlaylistDetails(id));
    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }
    setCacheHeaders(res, 120, 1800);
    res.json(playlist);
  } catch (err: any) {
    console.error('Playlist details error:', err);
    res.status(500).json({ error: 'Failed to load playlist details' });
  }
});

// Support prefetch via /api/prefetch/:videoId and POST /api/prefetch
router.get('/prefetch/:videoId', handlePrefetchStream);
router.get('/resolve/:videoId', handlePrefetchStream);
router.post('/prefetch', handlePrefetchStream);
router.post('/resolve', handlePrefetchStream);

export default router;
