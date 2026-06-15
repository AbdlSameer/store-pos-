import crypto from 'crypto';
import { env } from '../config/env';

/**
 * Generate HMAC-SHA256 signature for a QR payload
 */
export function generateHmac(payload: string): string {
  return crypto
    .createHmac('sha256', env.QR_HMAC_SECRET)
    .update(payload)
    .digest('hex');
}

/**
 * Verify an HMAC signature against a payload
 */
export function verifyHmac(payload: string, signature: string): boolean {
  const expected = generateHmac(payload);
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

/**
 * Build a QR payload object and return it as a Base64 JSON string
 */
export function buildQrPayload(productId: string, sku: string): string {
  const data = {
    productId,
    sku,
    ts: Date.now(),
    v: 1, // version for future migrations
  };
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

/**
 * Decode a QR payload string back to its object
 */
export function decodeQrPayload(payload: string): {
  productId: string;
  sku: string;
  ts: number;
  v: number;
} {
  try {
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
  } catch {
    throw new Error('Invalid QR payload');
  }
}
