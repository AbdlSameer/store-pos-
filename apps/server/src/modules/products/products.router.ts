import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as productsController from './products.controller';
import { upload } from '../../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/', productsController.listProducts);
router.get('/:id', productsController.getProduct);
router.post('/', authorize(['super_admin', 'admin']), upload.single('image'), productsController.createProduct);
router.patch('/:id', authorize(['super_admin', 'admin']), upload.single('image'), productsController.updateProduct);
router.delete('/:id', authorize(['super_admin', 'admin']), productsController.deleteProduct);
router.patch('/:id/stock', authorize(['super_admin', 'admin']), productsController.adjustStock);

export default router;
