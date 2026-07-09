import { Request, Response, NextFunction } from 'express';
import { loginSchema, changePasswordSchema } from '@toystore/shared';
import * as authService from './auth.service';
import { successResponse } from '../../utils/pagination';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await authService.loginService(email, password);

    if ('requires2FA' in result && result.requires2FA) {
      res.json(successResponse({ requires2FA: true, userId: result.userId }, '2FA required'));
      return;
    }

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json(successResponse(
      { accessToken: result.accessToken, user: result.user },
      'Login successful'
    ));
  } catch (err) {
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

export async function setup2FA(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.setup2FAService(req.user!.userId);
    res.json(successResponse(result, '2FA setup initiated'));
  } catch (err) {
    next(err);
  }
}

export async function verify2FA(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, token } = req.body;
    // If not authenticated, require userId in body (during login). If authenticated (setup), use req.user.
    const targetUserId = req.user?.userId || userId;
    if (!targetUserId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    const result = await authService.verify2FAService(targetUserId, token);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json(successResponse(
      { accessToken: result.accessToken, user: result.user },
      '2FA verified successfully'
    ));
  } catch (err) {
    next(err);
  }
}
