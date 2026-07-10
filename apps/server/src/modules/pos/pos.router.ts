import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { scanLimiter } from '../../middleware/rateLimiter';
import * as posController from './pos.controller';
import { audit } from '../../middleware/auditLog';

const router = Router();

router.use(authenticate);

// Optimize scan endpoint with strict rate limit
router.post('/scan', scanLimiter, authorize(['super_admin', 'admin', 'cashier']), posController.scanQr);

router.post('/bills', authorize(['super_admin', 'admin', 'cashier']), audit('BILL_CREATE', 'Bill'), posController.createBill);
router.get('/bills', authorize(['super_admin', 'admin', 'cashier']), posController.getBills);
router.get('/bills/:id', authorize(['super_admin', 'admin', 'cashier']), posController.getBill);
router.delete('/bills/:id', authorize(['super_admin', 'admin']), audit('BILL_DELETE', 'Bill'), posController.deleteBill);
router.post('/bills/:id/void', authorize(['super_admin', 'admin', 'cashier']), audit('BILL_VOID', 'Bill'), posController.voidBillController);
router.get('/history', authorize(['super_admin', 'admin', 'cashier']), posController.getHistory);
router.get('/history/:id', authorize(['super_admin', 'admin', 'cashier']), posController.getBill);

export default router;
