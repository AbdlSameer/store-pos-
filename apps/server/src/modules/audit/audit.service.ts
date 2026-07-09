import { prisma } from '../../config/database';

interface AuditEntry {
  userId?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  method: string;
  path: string;
  statusCode: number;
  ipAddress?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Writes a single audit log row. Never throws - a logging failure
 * must never break the underlying business request.
 */
export async function recordAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? undefined,
        userEmail: entry.userEmail ?? undefined,
        userRole: entry.userRole ?? undefined,
        action: entry.action,
        entity: entry.entity ?? undefined,
        entityId: entry.entityId ?? undefined,
        method: entry.method,
        path: entry.path,
        statusCode: entry.statusCode,
        ipAddress: entry.ipAddress ?? undefined,
        metadata: entry.metadata ? (entry.metadata as any) : undefined,
      },
    });
  } catch (err) {
    // Intentionally swallow - audit logging is best-effort.
    console.error('Failed to write audit log:', err);
  }
}

export async function listAuditLogs(params: {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
}) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 50;

  const where = {
    ...(params.userId ? { userId: params.userId } : {}),
    ...(params.action ? { action: params.action } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { rows, total, page, limit };
}
