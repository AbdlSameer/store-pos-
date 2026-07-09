"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanSchema = exports.createBillSchema = exports.stockAdjustmentSchema = exports.updateProductSchema = exports.createProductSchema = exports.createCategorySchema = exports.changePasswordSchema = exports.verifyTwoFactorSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
// ─── Auth ─────────────────────────────────────────────────────
exports.loginSchema = zod_1.z.object({
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    otp: zod_1.z.string().length(6).optional(),
});
exports.verifyTwoFactorSchema = zod_1.z.object({
    otp: zod_1.z.string().length(6, 'Enter the 6-digit code'),
});
exports.changePasswordSchema = zod_1.z.object({
    oldPassword: zod_1.z.string().min(6),
    newPassword: zod_1.z.string().min(8, 'New password must be at least 8 characters'),
});
// ─── Category ─────────────────────────────────────────────────
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().optional(),
    parentId: zod_1.z.string().uuid().optional(),
});
// ─── Product ──────────────────────────────────────────────────
exports.createProductSchema = zod_1.z.object({
    sku: zod_1.z.string().min(1).max(50),
    name: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().optional(),
    categoryId: zod_1.z.string().uuid(),
    price: zod_1.z.number().min(0),
    mrp: zod_1.z.number().min(0).optional(),
    wholesalePrice: zod_1.z.number().min(0).optional(),
    costPrice: zod_1.z.number().min(0).optional(),
    quantity: zod_1.z.number().int().min(0),
    lowStockThreshold: zod_1.z.number().int().min(0).default(10),
});
exports.updateProductSchema = exports.createProductSchema.partial();
exports.stockAdjustmentSchema = zod_1.z.object({
    adjustment: zod_1.z.number().int(),
    reason: zod_1.z.string().min(1).max(255),
});
// ─── Bill ─────────────────────────────────────────────────────
exports.createBillSchema = zod_1.z.object({
    customerName: zod_1.z.string().max(100).optional(),
    customerPhone: zod_1.z.string().max(20).optional(),
    items: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string().uuid(),
        quantity: zod_1.z.number().int().min(1),
    })).min(1, 'At least one item required'),
    discountType: zod_1.z.enum(['none', 'flat', 'percent']).default('none'),
    discountValue: zod_1.z.number().min(0).default(0),
    taxRate: zod_1.z.number().min(0).max(100).default(18),
    paymentMethod: zod_1.z.enum(['cash', 'card', 'upi', 'other']),
    saleMode: zod_1.z.enum(['retail', 'wholesale']).default('retail'),
    notes: zod_1.z.string().optional(),
});
// ─── QR Scan ──────────────────────────────────────────────────
exports.scanSchema = zod_1.z.object({
    payload: zod_1.z.string().min(1),
    signature: zod_1.z.string().min(1),
});
