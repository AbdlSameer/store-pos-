import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export async function getActiveAlerts() {
  return prisma.stockAlert.findMany({
    where: { isAcknowledged: false },
    include: { product: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function acknowledgeAlert(alertId: string, userId: string) {
  const alert = await prisma.stockAlert.findUnique({ where: { id: alertId } });
  if (!alert) throw new AppError('Alert not found', 404);

  return prisma.stockAlert.update({
    where: { id: alertId },
    data: {
      isAcknowledged: true,
      acknowledgedBy: userId,
      acknowledgedAt: new Date(),
    }
  });
}
