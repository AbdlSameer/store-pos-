import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';

const REFRESH_TOKEN_PREFIX = 'refresh:';

export async function loginService(email: string, password: string, otp?: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    throw new AppError('Invalid credentials', 401);
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new AppError('Invalid credentials', 401);
  }

  // Owner / super_admin accounts require 2FA once enabled.
  if (user.twoFactorEnabled) {
    if (!otp) {
      // Signal to the client that a second step is needed - do NOT
      // issue tokens yet.
      return { requiresTwoFactor: true } as const;
    }
    const validOtp =
      !!user.twoFactorSecret &&
      speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: otp,
      });
    if (!validOtp) {
      throw new AppError('Invalid 2FA code', 401);
    }
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, role: user.role },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  // Store hashed refresh token in Redis (7 days TTL)
  const hashedRefresh = await bcrypt.hash(refreshToken, 8);
  await redis.set(
    `${REFRESH_TOKEN_PREFIX}${user.id}`,
    hashedRefresh,
    'EX',
    7 * 24 * 60 * 60
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  };
}

export async function refreshTokenService(refreshToken: string) {
  let decoded: { userId: string; role: string };

  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as typeof decoded;
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const storedHash = await redis.get(`${REFRESH_TOKEN_PREFIX}${decoded.userId}`);
  if (!storedHash) throw new AppError('Session expired, please login again', 401);

  const isMatch = await bcrypt.compare(refreshToken, storedHash);
  if (!isMatch) throw new AppError('Invalid refresh token', 401);

  const newAccessToken = jwt.sign(
    { userId: decoded.userId, role: decoded.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  const newRefreshToken = jwt.sign(
    { userId: decoded.userId, role: decoded.role },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  // Rotate: invalidate old, store new
  const newHash = await bcrypt.hash(newRefreshToken, 8);
  await redis.set(
    `${REFRESH_TOKEN_PREFIX}${decoded.userId}`,
    newHash,
    'EX',
    7 * 24 * 60 * 60
  );

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logoutService(userId: string) {
  await redis.del(`${REFRESH_TOKEN_PREFIX}${userId}`);
}

export async function getMeService(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
    },
  });

  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function changePasswordService(
  userId: string,
  oldPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isValid) throw new AppError('Incorrect current password', 401);

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  // Invalidate refresh token so user must re-login
  await redis.del(`${REFRESH_TOKEN_PREFIX}${userId}`);
}

// ─── 2FA (TOTP) ─────────────────────────────────────────────────

/**
 * Step 1 of enabling 2FA: generate a secret + otpauth URL for the
 * user to scan into an authenticator app (Google Authenticator,
 * Authy, 1Password, etc). Not yet persisted as "enabled" until the
 * user confirms with a valid code via confirmTwoFactorService.
 */
export async function generateTwoFactorSetupService(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const secretInfo = speakeasy.generateSecret({ name: 'Toy Store POS (' + user.email + ')' });
  const secret = secretInfo.base32;
  const otpauthUrl = secretInfo.otpauth_url || '';

  // Stash the pending secret; not enabled until confirmed.
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret, twoFactorEnabled: false },
  });

  return { secret, otpauthUrl };
}

/** Step 2: user submits a code from their app to confirm setup. */
export async function confirmTwoFactorService(userId: string, otp: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorSecret) {
    throw new AppError('2FA setup not started', 400);
  }

  const valid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: otp,
  });
  if (!valid) throw new AppError('Invalid 2FA code', 401);

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  });

  return { enabled: true };
}

/** Disable 2FA - requires the current password, checked by the controller/route. */
export async function disableTwoFactorService(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });
  return { enabled: false };
}
