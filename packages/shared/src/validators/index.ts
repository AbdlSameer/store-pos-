import { z } from 'zod';

// ─── Auth ─────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  otp: z.string().length(6).optional(),
});

export const verifyTwoFactorSchema = z.object({
  otp: z.string().length(6, 'Enter the 6-digit code'),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// ─── Category ─────────────────────────────────────────────────
export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
});

// ─── Product ──────────────────────────────────────────────────
export const createProductSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  categoryId: z.string().uuid(),
  price: z.number().min(0),
  mrp: z.number().min(0).optional(),
  wholesalePrice: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  quantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).default(10),
});

export const updateProductSchema = createProductSchema.partial();

export const stockAdjustmentSchema = z.object({
  adjustment: z.number().int(),
  reason: z.string().min(1).max(255),
});

// ─── Bill ─────────────────────────────────────────────────────
export const createBillSchema = z.object({
  customerName: z.string().max(100).optional(),
  customerPhone: z.string().max(20).optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1),
  })).min(1, 'At least one item required'),
  discountType: z.enum(['none', 'flat', 'percent']).default('none'),
  discountValue: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(18),
  paymentMethod: z.enum(['cash', 'card', 'upi', 'other']),
  saleMode: z.enum(['retail', 'wholesale']).default('retail'),
  notes: z.string().optional(),
});

// ─── QR Scan ──────────────────────────────────────────────────
export const scanSchema = z.object({
  payload: z.string().min(1),
  signature: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateBillInput = z.infer<typeof createBillSchema>;
export type ScanInput = z.infer<typeof scanSchema>;
