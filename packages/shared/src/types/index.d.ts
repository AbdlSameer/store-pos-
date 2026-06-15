export type UserRole = 'super_admin' | 'admin' | 'cashier';
export interface User {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    isActive: boolean;
    lastLogin: string | null;
    createdAt: string;
}
export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
    createdAt: string;
}
export interface Product {
    id: string;
    sku: string;
    name: string;
    description: string | null;
    categoryId: string;
    category?: Category;
    price: number;
    costPrice: number | null;
    quantity: number;
    lowStockThreshold: number;
    imageUrl: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    qrCode?: QRCode;
}
export interface QRCode {
    id: string;
    productId: string;
    qrPayload: string;
    qrImageUrl: string;
    barcodePayload: string;
    barcodeImageUrl: string;
    generatedAt: string;
}
export type DiscountType = 'none' | 'flat' | 'percent';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'other';
export type PaymentStatus = 'paid' | 'pending' | 'refunded';
export interface Bill {
    id: string;
    billNumber: string;
    cashierId: string;
    cashier?: Pick<User, 'id' | 'fullName'>;
    customerName: string | null;
    customerPhone: string | null;
    subtotal: number;
    discountType: DiscountType;
    discountValue: number;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    notes: string | null;
    items?: BillItem[];
    createdAt: string;
}
export interface BillItem {
    id: string;
    billId: string;
    productId: string;
    productName: string;
    productSku: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
}
export type AlertType = 'low_stock' | 'out_of_stock';
export interface StockAlert {
    id: string;
    productId: string;
    product?: Pick<Product, 'id' | 'name' | 'sku'>;
    alertType: AlertType;
    currentQuantity: number;
    threshold: number;
    isAcknowledged: boolean;
    acknowledgedBy: string | null;
    acknowledgedAt: string | null;
    notificationSent: boolean;
    createdAt: string;
}
export interface SalesAnalytics {
    id: string;
    date: string;
    productId: string;
    categoryId: string;
    unitsSold: number;
    revenue: number;
    profit: number;
    billCount: number;
}
export interface DashboardSummary {
    todayRevenue: number;
    todayBills: number;
    todayUnitsSold: number;
    activeAlerts: number;
    lowStockCount: number;
    outOfStockCount: number;
}
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}
export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface ApiError {
    success: false;
    message: string;
    errors?: Record<string, string[]>;
}
export interface CartItem {
    productId: string;
    sku: string;
    name: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    imageUrl: string | null;
}
//# sourceMappingURL=index.d.ts.map