import { Router } from 'express';
import { handleStreamProxy, handlePrefetchStream } from '../services/stream.js';

const router = Router();

// Prefetch stream URL (resolve and cache without streaming body)
router.get('/prefetch/:videoId', handlePrefetchStream);
router.post('/prefetch', handlePrefetchStream);

// GET /api/stream/:videoId
router.get('/:videoId', handleStreamProxy);

export default router;
