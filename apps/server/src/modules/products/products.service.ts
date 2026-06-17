import { prisma } from '../../config/database';
import { cacheGet, cacheSet, cacheDelete, cacheDeletePattern, CacheKeys } from '../../config/redis';
import { AppError } from '../../middleware/errorHandler';
import { generateQrImage, generateBarcodeImage, generateBarcodeValue } from '../../utils/qrGenerator';
import { buildQrPayload, generateHmac } from '../../utils/hmac';
import { parsePagination } from '../../utils/pagination';
import { QR_SCAN_CACHE_TTL } from '@toystore/shared';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const PRODUCT_CACHE_TTL = 600; // 10 min

export async function listProducts(query: Record<string, unknown>) {
  const { skip, take, page, limit } = parsePagination(query);
  const search = query.search as string | undefined;
  const categoryId = query.categoryId as string | undefined;
  const lowStock = query.lowStock === 'true';
  const outOfStock = query.outOfStock === 'true';

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(categoryId && { categoryId }),
    ...(lowStock && { quantity: { gt: 0, lte: prisma.product.fields.lowStockThreshold } }),
    ...(outOfStock && { quantity: 0 }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      include: { category: true, qrCode: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, page, limit };
}

export async function getProductById(id: string) {
  const cached = await cacheGet(CacheKeys.product(id));
  if (cached) return cached;

  const product = await prisma.product.findUnique({
    where: { id, isActive: true },
    include: { category: true, qrCode: true },
  });

  if (!product) throw new AppError('Product not found', 404);

  await cacheSet(CacheKeys.product(id), product, PRODUCT_CACHE_TTL);
  return product;
}

export async function createProduct(
  data: {
    sku: string; name: string; description?: string; categoryId: string;
    price: number; mrp?: number; wholesalePrice?: number; costPrice?: number; quantity: number; lowStockThreshold: number;
  },
  imageUrl: string | undefined,
  createdBy: string
) {
  // Check SKU uniqueness
  const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existing) throw new AppError(`SKU '${data.sku}' already exists`, 409);

  // Generate a UUID for the product to create the QR payload beforehand
  const productId = uuidv4();
  const qrPayload = buildQrPayload(productId, data.sku);
  const hmacSig = generateHmac(qrPayload);
  const barcodeValue = generateBarcodeValue(data.sku);

  // Auto-generate QR + barcode images (throws if it fails, blocking the DB write)
  const [qrDataUrl, barcodeBuffer] = await Promise.all([
    generateQrImage(qrPayload),
    generateBarcodeImage(barcodeValue),
  ]);

  // Insert product and its QR code atomically
  const product = await prisma.product.create({
    data: {
      id: productId,
      ...data,
      price: new Prisma.Decimal(data.price),
      ...(data.mrp !== undefined && { mrp: new Prisma.Decimal(data.mrp) }),
      ...(data.wholesalePrice !== undefined && { wholesalePrice: new Prisma.Decimal(data.wholesalePrice) }),
      ...(data.costPrice !== undefined && { costPrice: new Prisma.Decimal(data.costPrice) }),
      imageUrl,
      createdBy,
      qrCode: {
        create: {
          qrPayload,
          qrImageUrl: qrDataUrl,
          barcodePayload: barcodeValue,
          barcodeImageUrl: `data:image/png;base64,${barcodeBuffer.toString('base64')}`,
          hmacSignature: hmacSig,
        }
      }
    },
    include: { category: true, qrCode: true },
  });

  // Cache the new product
  await cacheSet(CacheKeys.product(product.id), product, PRODUCT_CACHE_TTL);
  await cacheSet(CacheKeys.productBySku(product.sku), product, PRODUCT_CACHE_TTL);

  return product;
}

export async function updateProduct(id: string, data: Partial<{
  name: string; description: string; categoryId: string;
  price: number; mrp: number; wholesalePrice: number; costPrice: number; quantity: number;
  lowStockThreshold: number; imageUrl: string;
}>) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError('Product not found', 404);

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      ...(data.price !== undefined && { price: new Prisma.Decimal(data.price) }),
      ...(data.mrp !== undefined && { mrp: new Prisma.Decimal(data.mrp) }),
      ...(data.wholesalePrice !== undefined && { wholesalePrice: new Prisma.Decimal(data.wholesalePrice) }),
      ...(data.costPrice !== undefined && { costPrice: new Prisma.Decimal(data.costPrice) }),
    },
    include: { category: true, qrCode: true },
  });

  await cacheDelete(CacheKeys.product(id));
  await cacheDelete(CacheKeys.productBySku(product.sku));

  return updated;
}

export async function deleteProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError('Product not found', 404);

  await prisma.product.update({ where: { id }, data: { isActive: false } });
  await cacheDelete(CacheKeys.product(id));
  await cacheDelete(CacheKeys.productBySku(product.sku));
}

export async function adjustStock(id: string, adjustment: number, _reason: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError('Product not found', 404);

  const newQty = product.quantity + adjustment;
  if (newQty < 0) throw new AppError('Insufficient stock for this adjustment', 400);

  const updated = await prisma.product.update({
    where: { id },
    data: { quantity: newQty },
  });

  await cacheDelete(CacheKeys.product(id));
  return updated;
}

export async function getProductBySku(sku: string) {
  const cached = await cacheGet(CacheKeys.productBySku(sku));
  if (cached) return cached;

  const product = await prisma.product.findUnique({
    where: { sku, isActive: true },
    include: { category: true, qrCode: true },
  });

  if (!product) return null;

  await cacheSet(CacheKeys.productBySku(sku), product, QR_SCAN_CACHE_TTL);
  return product;
}
