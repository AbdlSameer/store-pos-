import { Request, Response, NextFunction } from 'express';
import { loginSchema, changePasswordSchema, verifyTwoFactorSchema } from '@toystore/shared';
import * as authService from './auth.service';
import { successResponse } from '../../utils/pagination';
import { recordAuditLog } from '../audit/audit.service';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { password, otp } = loginSchema.parse(req.body);
    const result = await authService.loginService(password, otp);

    // Password was correct but a 2FA code is still required.
    if ('requiresTwoFactor' in result) {
      res.json(successResponse({ requiresTwoFactor: true }, 'Enter your 2FA code'));
      return;
    }

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    void recordAuditLog({
      userId: result.user.id,
      userEmail: result.user.email,
      userRole: result.user.role,
      action: 'LOGIN_SUCCESS',
      method: 'POST',
      path: '/auth/login',
      statusCode: 200,
      ipAddress: req.ip,
    });

    res.json(successResponse(
      { accessToken: result.accessToken, user: result.user },
      'Login successful'
    ));
  } catch (err) {
    void recordAuditLog({
      userEmail: req.body?.email ?? null,
      action: 'LOGIN_FAILED',
      method: 'POST',
      path: '/auth/login',
      statusCode: 401,
      ipAddress: req.ip,
    });
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ success: false, message: 'No refresh token' });
      return;
    }

    const result = await authService.refreshTokenService(refreshToken);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json(successResponse({ accessToken: result.accessToken }));
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user) {
      await authService.logoutService(req.user.userId);
    }
    res.clearCookie('refreshToken');
    res.json(successResponse(null, 'Logged out successfully'));
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMeService(req.user!.userId);
    res.json(successResponse(user));
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);
    await authService.changePasswordService(req.user!.userId, oldPassword, newPassword);
    res.json(successResponse(null, 'Password changed successfully'));
  } catch (err) {
    next(err);
  }
}

export async function setupTwoFactor(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.generateTwoFactorSetupService(req.user!.userId);
    res.json(successResponse(result, 'Scan this QR code with your authenticator app'));
  } catch (err) {
    next(err);
  }
}

export async function confirmTwoFactor(req: Request, res: Response, next: NextFunction) {
  try {
    const { otp } = verifyTwoFactorSchema.parse(req.body);
    const result = await authService.confirmTwoFactorService(req.user!.userId, otp);
    void recordAuditLog({
      userId: req.user!.userId,
      userRole: req.user!.role,
      action: '2FA_ENABLED',
      method: 'POST',
      path: '/auth/2fa/confirm',
      statusCode: 200,
      ipAddress: req.ip,
    });
    res.json(successResponse(result, '2FA enabled'));
  } catch (err) {
    next(err);
  }
}

export async function disableTwoFactor(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.disableTwoFactorService(req.user!.userId);
    void recordAuditLog({
      userId: req.user!.userId,
      userRole: req.user!.role,
      action: '2FA_DISABLED',
      method: 'POST',
      path: '/auth/2fa/disable',
      statusCode: 200,
      ipAddress: req.ip,
    });
    res.json(successResponse(result, '2FA disabled'));
  } catch (err) {
    next(err);
  }
}
