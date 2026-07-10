import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { verifyHmac, decodeQrPayload } from '../../utils/hmac';
import { generateBillNumber, parsePagination } from '../../utils/pagination';
import { cacheSet, CacheKeys, cacheGet } from '../../config/redis';
import { QR_SCAN_CACHE_TTL } from '@toystore/shared';
// We will import Queue from bullmq when we set it up
// import { alertQueue } from '../../jobs/queues';

export async function scanProduct(payload: string, signature: string) {
  // Verify HMAC to prevent QR forgery
  if (!verifyHmac(payload, signature)) {
    throw new AppError('Invalid QR signature', 400);
  }

  const decoded = decodeQrPayload(payload);
  const { productId, sku } = decoded;

  // Try fetching from cache first for <50ms response
  const cached = await cacheGet(CacheKeys.product(productId));
  if (cached) return cached;

  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
    include: { category: true }
  });

  if (!product) {
    throw new AppError('Product not found or inactive', 404);
  }

  await cacheSet(CacheKeys.product(productId), product, QR_SCAN_CACHE_TTL);
  return product;
}

export async function createBill(
  data: {
    customerName?: string;
    customerPhone?: string;
    items: { productId: string; quantity: number }[];
    discountType: 'none' | 'flat' | 'percent';
    discountValue: number;
    taxRate: number;
    paymentMethod: 'cash' | 'card' | 'upi' | 'other';
    saleMode: 'retail' | 'wholesale';
    notes?: string;
  },
  cashierId: string
) {
  // 0. Aggregate items by productId to prevent duplicates
  const itemMap = new Map<string, number>();
  for (const item of data.items) {
    itemMap.set(item.productId, (itemMap.get(item.productId) || 0) + item.quantity);
  }
  const aggregatedItems = Array.from(itemMap.entries()).map(([productId, quantity]) => ({ productId, quantity }));

  // Fetch all products to validate stock and prices
  const productIds = aggregatedItems.map(item => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } }
  });

  const productMap = new Map(products.map(p => [p.id, p]));

  let subtotal = 0;
  const billItemsData: Prisma.BillItemCreateManyBillInput[] = [];
  const stockUpdates: { id: string; decrementQty: number }[] = [];
  const alertsToTrigger: { productId: string; newQty: number; threshold: number }[] = [];

  for (const item of aggregatedItems) {
    const product = productMap.get(item.productId);
    if (!product || !product.isActive) {
      throw new AppError(`Product ${item.productId} not found or inactive`, 404);
    }
    if (product.quantity < item.quantity) {
      throw new AppError(`Insufficient stock for product ${product.name}`, 400);
    }

    const unitPrice = data.saleMode === 'wholesale' && product.wholesalePrice !== null
      ? Number(product.wholesalePrice)
      : Number(product.price);
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    billItemsData.push({
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      unitPrice: new Prisma.Decimal(unitPrice),
      mrp: product.mrp !== null ? new Prisma.Decimal(product.mrp as any) : null,
      quantity: item.quantity,
      lineTotal: new Prisma.Decimal(lineTotal),
      saleMode: data.saleMode,
    });

    const newQty = product.quantity - item.quantity;
    stockUpdates.push({ id: product.id, decrementQty: item.quantity });

    if (newQty <= product.lowStockThreshold) {
      alertsToTrigger.push({ productId: product.id, newQty, threshold: product.lowStockThreshold });
    }
  }

  // Analytics preparation
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate totals
  let discountAmount = 0;
  if (data.discountType === 'flat') discountAmount = data.discountValue;
  else if (data.discountType === 'percent') discountAmount = (subtotal * data.discountValue) / 100;

  const discountedSubtotal = subtotal - discountAmount;
  const taxAmount = (discountedSubtotal * data.taxRate) / 100;
  const totalAmount = discountedSubtotal + taxAmount;

  const billNumber = generateBillNumber();

  // Execute transaction
  const bill = await prisma.$transaction(async (tx) => {
    // 1. Create Bill
    const newBill = await tx.bill.create({
      data: {
        billNumber,
        cashierId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        subtotal: new Prisma.Decimal(subtotal),
        discountType: data.discountType,
        discountValue: new Prisma.Decimal(data.discountValue),
        taxRate: new Prisma.Decimal(data.taxRate),
        taxAmount: new Prisma.Decimal(taxAmount),
        totalAmount: new Prisma.Decimal(totalAmount),
        paymentMethod: data.paymentMethod,
        saleMode: data.saleMode,
        notes: data.notes,
        items: {
          createMany: {
            data: billItemsData
          }
        }
      },
      include: { items: true, cashier: { select: { fullName: true } } }
    });

    // 2. Decrement stock atomically
    for (const update of stockUpdates) {
      await tx.product.update({
        where: { id: update.id },
        data: { quantity: { decrement: update.decrementQty } }
      });
    }

    // 3. Update Sales Analytics
    for (const item of billItemsData) {
      const product = productMap.get(item.productId);
      if (!product) continue;
      
      const profit = Number(item.lineTotal) - (Number(product.costPrice || 0) * item.quantity);
      
      const existingAnalytic = await tx.salesAnalytics.findUnique({
        where: { date_productId: { date: today, productId: item.productId } }
      });

      if (existingAnalytic) {
        await tx.salesAnalytics.update({
          where: { id: existingAnalytic.id },
          data: {
            unitsSold: { increment: item.quantity },
            revenue: { increment: item.lineTotal },
            profit: { increment: profit },
            billCount: { increment: 1 }
          }
        });
      } else {
        await tx.salesAnalytics.create({
          data: {
            date: today,
            productId: item.productId,
            categoryId: product.categoryId,
            unitsSold: item.quantity,
            revenue: item.lineTotal,
            profit: profit,
            billCount: 1
          }
        });
      }
    }

    // 4. Trigger Alerts
    for (const alert of alertsToTrigger) {
      await tx.stockAlert.create({
        data: {
          productId: alert.productId,
          alertType: alert.newQty === 0 ? 'out_of_stock' : 'low_stock',
          currentQuantity: alert.newQty,
          threshold: alert.threshold
        }
      });
    }

    return newBill;
  });

  return bill;
}

export async function getBills() {
  return prisma.bill.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: true, cashier: { select: { fullName: true } } }
  });
}

export async function getBillById(id: string) {
  const bill = await prisma.bill.findUnique({
    where: { id },
    include: { items: true, cashier: { select: { fullName: true } } }
  });
  if (!bill) throw new AppError('Bill not found', 404);
  return bill;
}

export async function deleteBill(id: string) {
  const bill = await prisma.bill.findUnique({
    where: { id },
    include: { items: true }
  });
  
  if (!bill) throw new AppError('Bill not found', 404);

  // Restore stock in a transaction, then delete the bill
  await prisma.$transaction(async (tx) => {
    // 1. Restore stock
    for (const item of bill.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } }
      });
    }

    // 2. Remove sales analytics for this bill (simplified: we just decrement unitsSold and revenue)
    // Note: To be perfectly accurate, we'd find the exact date the bill was made.
    const billDate = new Date(bill.createdAt);
    billDate.setHours(0, 0, 0, 0);

    for (const item of bill.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) continue;
      
      const profit = Number(item.lineTotal) - (Number(product.costPrice || 0) * item.quantity);
      
      const existingAnalytic = await tx.salesAnalytics.findUnique({
        where: { date_productId: { date: billDate, productId: item.productId } }
      });

      if (existingAnalytic) {
        await tx.salesAnalytics.update({
          where: { id: existingAnalytic.id },
          data: {
            unitsSold: { decrement: item.quantity },
            revenue: { decrement: item.lineTotal },
            profit: { decrement: profit },
            billCount: { decrement: 1 }
          }
        });
      }
    }

    // 3. Delete bill (cascade deletes items)
    await tx.bill.delete({ where: { id } });
  });
}

export async function getHistory(query: Record<string, unknown>) {
  const { skip, take, page, limit } = parsePagination(query);
  const search = query.search as string | undefined;
  const startDate = query.startDate as string | undefined;
  const endDate = query.endDate as string | undefined;

  const where: Prisma.BillWhereInput = {
    ...(search && {
      OR: [
        { billNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } }
      ]
    }),
    ...((startDate || endDate) && {
      createdAt: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) })
      }
    })
  };

  const [bills, total] = await Promise.all([
    prisma.bill.findMany({
      where,
      skip,
      take,
      include: { items: true, cashier: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.bill.count({ where })
  ]);

  return { bills, total, page, limit };
}
