import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as categoriesController from './categories.controller';

const router = Router();

router.use(authenticate);

router.get('/', categoriesController.listCategories);
router.post('/', authorize(['super_admin', 'admin']), categoriesController.createCategory);

export default router;
