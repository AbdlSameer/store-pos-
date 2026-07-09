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

// 2FA - authenticated user manages their own factor
router.post('/2fa/setup', authenticate, authController.setupTwoFactor);
router.post('/2fa/confirm', authenticate, authLimiter, authController.confirmTwoFactor);
router.post('/2fa/disable', authenticate, authController.disableTwoFactor);

export default router;
