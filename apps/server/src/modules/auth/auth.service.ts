import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';

const REFRESH_TOKEN_PREFIX = 'refresh:';

export async function loginService(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    throw new AppError('Invalid credentials', 401);
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new AppError('Invalid credentials', 401);
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
