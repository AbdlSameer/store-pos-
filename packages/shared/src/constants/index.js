"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QR_SCAN_CACHE_TTL = exports.MAX_PRODUCTS_PAGE_SIZE = exports.BILL_NUMBER_PREFIX = exports.DEFAULT_TAX_RATE = exports.DEFAULT_LOW_STOCK_THRESHOLD = exports.ALERT_TYPES = exports.DISCOUNT_TYPES = exports.PAYMENT_STATUS = exports.PAYMENT_METHODS = exports.ROLES = void 0;
exports.ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    CASHIER: 'cashier',
};
exports.PAYMENT_METHODS = {
    CASH: 'cash',
    CARD: 'card',
    UPI: 'upi',
    OTHER: 'other',
};
exports.PAYMENT_STATUS = {
    PAID: 'paid',
    PENDING: 'pending',
    REFUNDED: 'refunded',
};
exports.DISCOUNT_TYPES = {
    NONE: 'none',
    FLAT: 'flat',
    PERCENT: 'percent',
};
exports.ALERT_TYPES = {
    LOW_STOCK: 'low_stock',
    OUT_OF_STOCK: 'out_of_stock',
};
exports.DEFAULT_LOW_STOCK_THRESHOLD = 10;
exports.DEFAULT_TAX_RATE = 18; // GST %
exports.BILL_NUMBER_PREFIX = 'TYS';
exports.MAX_PRODUCTS_PAGE_SIZE = 100;
exports.QR_SCAN_CACHE_TTL = 600; // 10 min in seconds
//# sourceMappingURL=index.js.map