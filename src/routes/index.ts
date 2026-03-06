// src/routes/index.ts
import { Router, Request, Response } from 'express'; // Import the Types here
import { handleIdentify } from '../controllers/identityController';
import { validateIdentify } from '../middleware/validation';

const router = Router();

// The only required endpoint for the task
router.post('/identify', validateIdentify, handleIdentify);


router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Identity reconciliation service is running',
    timestamp: new Date().toISOString()
  });
});

export default router;