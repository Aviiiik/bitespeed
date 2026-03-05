// src/routes/index.ts
import { Router } from 'express';
import { handleIdentify } from '../controllers/identityController';
import { validateIdentify } from '../middleware/validation';

const router = Router();

// The only required endpoint for the task
router.post('/identify', validateIdentify, handleIdentify);

// Optional: health check (useful for Render / monitoring)
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Identity reconciliation service is running',
    timestamp: new Date().toISOString()
  });
});

export default router;