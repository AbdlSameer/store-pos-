import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authLimiter } from '../../middleware/rateLimiter';
import * as authController from './auth.controller';

const router = Router();

router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.patch('/change-password', authenticate, authController.changePassword);
router.post('/setup-2fa', authenticate, authController.setup2FA);
router.post('/verify-2fa', authController.verify2FA); // can be called with or without auth (during login vs setup)

export default router;
