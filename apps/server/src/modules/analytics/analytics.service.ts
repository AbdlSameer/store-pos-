import { prisma } from '../../config/database';

export async function getDashboardSummary() {
  const [totalProducts, lowStockCount, todaySales, totalRevenue] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true, quantity: { lte: prisma.product.fields.lowStockThreshold } } }),
    getTodaySales(),
    getTotalRevenue()
  ]);

  return { totalProducts, lowStockCount, todaySales, totalRevenue };
}

async function getTodaySales() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const result = await prisma.bill.aggregate({
    where: { createdAt: { gte: startOfDay } },
    _sum: { totalAmount: true }
  });
  return result._sum.totalAmount || 0;
}

async function getTotalRevenue() {
  const result = await prisma.bill.aggregate({
    _sum: { totalAmount: true }
  });
  return result._sum.totalAmount || 0;
}

export async function getTopProducts() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const topSales = await prisma.salesAnalytics.groupBy({
    by: ['productId'],
    where: { date: { gte: thirtyDaysAgo } },
    _sum: { unitsSold: true, revenue: true },
    orderBy: { _sum: { unitsSold: 'desc' } },
    take: 10
  });

  const productIds = topSales.map(s => s.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true }
  });

  const productMap = new Map(products.map(p => [p.id, p]));

  return topSales.map(s => ({
    ...s,
    product: productMap.get(s.productId)
  }));
}

export async function getDeadStock() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Find products that have a high stock quantity but 0 sales in the last 30 days
  // First get all sales in last 30 days
  const recentSales = await prisma.salesAnalytics.groupBy({
    by: ['productId'],
    where: { date: { gte: thirtyDaysAgo } }
  });
  
  const soldProductIds = recentSales.map(s => s.productId);

  // Then find active products not in that list, ordered by quantity descending
  const deadStock = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { notIn: soldProductIds },
      quantity: { gt: 0 }
    },
    orderBy: { quantity: 'desc' },
    take: 10,
    select: { id: true, name: true, sku: true, quantity: true, price: true }
  });

  return deadStock;
}
