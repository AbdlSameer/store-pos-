import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as productsController from './products.controller';
import { upload } from '../../middleware/upload';
import { audit } from '../../middleware/auditLog';

const router = Router();

router.use(authenticate);

router.get('/', productsController.listProducts);
router.get('/:id', productsController.getProduct);
router.post('/', authorize(['super_admin', 'admin']), upload.single('image'), audit('PRODUCT_CREATE', 'Product'), productsController.createProduct);
router.patch('/:id', authorize(['super_admin', 'admin']), upload.single('image'), audit('PRODUCT_UPDATE', 'Product'), productsController.updateProduct);
router.delete('/:id', authorize(['super_admin', 'admin']), audit('PRODUCT_DELETE', 'Product'), productsController.deleteProduct);
router.patch('/:id/stock', authorize(['super_admin', 'admin']), audit('PRODUCT_STOCK_ADJUST', 'Product'), productsController.adjustStock);

export default router;
