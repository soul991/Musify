import { Router } from 'express';
import { handleStreamProxy, handlePrefetchStream, handleDebugStream } from '../services/stream.js';

const router = Router();

// Debug stream route (active only when DEBUG_ENDPOINTS=true)
router.get('/debug/:videoId', handleDebugStream);

// Prefetch stream URL (resolve and cache without streaming body)
router.get('/prefetch/:videoId', handlePrefetchStream);
router.post('/prefetch', handlePrefetchStream);

// GET /api/stream/:videoId
router.get('/:videoId', handleStreamProxy);

export default router;
