import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as alertsController from './alerts.controller';

const router = Router();
router.use(authenticate);

router.get('/', authorize(['super_admin', 'admin']), alertsController.getAlerts);
router.patch('/:id/acknowledge', authorize(['super_admin', 'admin']), alertsController.acknowledge);

export default router;
