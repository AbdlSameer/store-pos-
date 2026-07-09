import { Request, Response, NextFunction } from 'express';
import { recordAuditLog } from '../modules/audit/audit.service';

/**
 * Wraps a route with audit logging. Logs *after* the response is sent
 * so it never adds latency to the actual request, and logs both
 * successes and failures (status code is captured either way).
 *
 * Usage:
 *   router.patch('/:id', authorize(['super_admin','admin']),
 *     audit('PRODUCT_UPDATE', 'Product'), productsController.updateProduct);
 */
export function audit(action: string, entity?: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.on('finish', () => {
      // Only log mutations / meaningful attempts, skip noisy GETs.
      void recordAuditLog({
        userId: req.user?.userId ?? null,
        userEmail: (req as any).user?.email ?? null,
        userRole: req.user?.role ?? null,
        action,
        entity: entity ?? null,
        entityId: req.params?.id ?? null,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        ipAddress: req.ip,
        metadata: {
          body: sanitizeBody(req.body),
        },
      });
    });
    next();
  };
}

// Strip obviously sensitive fields before persisting request bodies.
function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const clone: Record<string, unknown> = { ...(body as Record<string, unknown>) };
  for (const key of ['password', 'oldPassword', 'newPassword', 'otp', 'twoFactorSecret']) {
    if (key in clone) clone[key] = '[REDACTED]';
  }
  return clone;
}
