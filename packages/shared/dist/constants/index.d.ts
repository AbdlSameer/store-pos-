export declare const ROLES: {
    readonly SUPER_ADMIN: "super_admin";
    readonly ADMIN: "admin";
    readonly CASHIER: "cashier";
};
export declare const PAYMENT_METHODS: {
    readonly CASH: "cash";
    readonly CARD: "card";
    readonly UPI: "upi";
    readonly OTHER: "other";
};
export declare const PAYMENT_STATUS: {
    readonly PAID: "paid";
    readonly PENDING: "pending";
    readonly REFUNDED: "refunded";
};
export declare const DISCOUNT_TYPES: {
    readonly NONE: "none";
    readonly FLAT: "flat";
    readonly PERCENT: "percent";
};
export declare const ALERT_TYPES: {
    readonly LOW_STOCK: "low_stock";
    readonly OUT_OF_STOCK: "out_of_stock";
};
export declare const DEFAULT_LOW_STOCK_THRESHOLD = 10;
export declare const DEFAULT_TAX_RATE = 18;
export declare const BILL_NUMBER_PREFIX = "TYS";
export declare const MAX_PRODUCTS_PAGE_SIZE = 100;
export declare const QR_SCAN_CACHE_TTL = 600;
