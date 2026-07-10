import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as analyticsController from './analytics.controller';

const router = Router();
router.use(authenticate);

router.get('/dashboard', authorize(['super_admin', 'admin']), analyticsController.getDashboardSummary);
router.get('/top-products', authorize(['super_admin', 'admin']), analyticsController.getTopProducts);
router.get('/dead-stock', authorize(['super_admin', 'admin']), analyticsController.getDeadStock);

export default router;
