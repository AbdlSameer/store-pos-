import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const changePasswordSchema: z.ZodObject<{
    oldPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    oldPassword: string;
    newPassword: string;
}, {
    oldPassword: string;
    newPassword: string;
}>;
export declare const createCategorySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
    parentId?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    parentId?: string | undefined;
}>;
export declare const createProductSchema: z.ZodObject<{
    sku: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodString;
    price: z.ZodNumber;
    costPrice: z.ZodOptional<z.ZodNumber>;
    quantity: z.ZodNumber;
    lowStockThreshold: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    sku: string;
    categoryId: string;
    price: number;
    quantity: number;
    lowStockThreshold: number;
    description?: string | undefined;
    costPrice?: number | undefined;
}, {
    name: string;
    sku: string;
    categoryId: string;
    price: number;
    quantity: number;
    description?: string | undefined;
    costPrice?: number | undefined;
    lowStockThreshold?: number | undefined;
}>;
export declare const updateProductSchema: z.ZodObject<{
    sku: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    categoryId: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodNumber>;
    costPrice: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    quantity: z.ZodOptional<z.ZodNumber>;
    lowStockThreshold: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    sku?: string | undefined;
    description?: string | undefined;
    categoryId?: string | undefined;
    price?: number | undefined;
    costPrice?: number | undefined;
    quantity?: number | undefined;
    lowStockThreshold?: number | undefined;
}, {
    name?: string | undefined;
    sku?: string | undefined;
    description?: string | undefined;
    categoryId?: string | undefined;
    price?: number | undefined;
    costPrice?: number | undefined;
    quantity?: number | undefined;
    lowStockThreshold?: number | undefined;
}>;
export declare const stockAdjustmentSchema: z.ZodObject<{
    adjustment: z.ZodNumber;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    adjustment: number;
    reason: string;
}, {
    adjustment: number;
    reason: string;
}>;
export declare const createBillSchema: z.ZodObject<{
    customerName: z.ZodOptional<z.ZodString>;
    customerPhone: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
        productId: string;
    }, {
        quantity: number;
        productId: string;
    }>, "many">;
    discountType: z.ZodDefault<z.ZodEnum<["none", "flat", "percent"]>>;
    discountValue: z.ZodDefault<z.ZodNumber>;
    taxRate: z.ZodDefault<z.ZodNumber>;
    paymentMethod: z.ZodEnum<["cash", "card", "upi", "other"]>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    items: {
        quantity: number;
        productId: string;
    }[];
    discountType: "flat" | "none" | "percent";
    discountValue: number;
    taxRate: number;
    paymentMethod: "other" | "cash" | "card" | "upi";
    customerName?: string | undefined;
    customerPhone?: string | undefined;
    notes?: string | undefined;
}, {
    items: {
        quantity: number;
        productId: string;
    }[];
    paymentMethod: "other" | "cash" | "card" | "upi";
    customerName?: string | undefined;
    customerPhone?: string | undefined;
    discountType?: "flat" | "none" | "percent" | undefined;
    discountValue?: number | undefined;
    taxRate?: number | undefined;
    notes?: string | undefined;
}>;
export declare const scanSchema: z.ZodObject<{
    payload: z.ZodString;
    signature: z.ZodString;
}, "strip", z.ZodTypeAny, {
    payload: string;
    signature: string;
}, {
    payload: string;
    signature: string;
}>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateBillInput = z.infer<typeof createBillSchema>;
export type ScanInput = z.infer<typeof scanSchema>;
//# sourceMappingURL=index.d.ts.map