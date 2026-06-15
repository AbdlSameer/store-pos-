import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { scanLimiter } from '../../middleware/rateLimiter';
import * as posController from './pos.controller';

const router = Router();

router.use(authenticate);

// Optimize scan endpoint with strict rate limit
router.post('/scan', scanLimiter, authorize(['super_admin', 'admin', 'cashier']), posController.scanQr);

router.post('/bills', authorize(['super_admin', 'admin', 'cashier']), posController.createBill);
router.get('/bills', authorize(['super_admin', 'admin', 'cashier']), posController.getBills);
router.get('/bills/:id', authorize(['super_admin', 'admin', 'cashier']), posController.getBill);

export default router;
