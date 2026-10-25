import { Router } from 'express';
import { handleStreamProxy } from '../services/stream.js';

const router = Router();

// GET /api/stream/:videoId
router.get('/:videoId', handleStreamProxy);

export default router;
