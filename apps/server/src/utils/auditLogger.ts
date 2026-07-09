import { prisma } from '../config/database';

export async function logAuditAction(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  details?: Record<string, any>
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details || {},
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
