export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  CASHIER: 'cashier',
} as const;

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  UPI: 'upi',
  OTHER: 'other',
} as const;

export const PAYMENT_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  REFUNDED: 'refunded',
} as const;

export const DISCOUNT_TYPES = {
  NONE: 'none',
  FLAT: 'flat',
  PERCENT: 'percent',
} as const;

export const ALERT_TYPES = {
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
} as const;

export const DEFAULT_LOW_STOCK_THRESHOLD = 10;
export const DEFAULT_TAX_RATE = 18; // GST %
export const BILL_NUMBER_PREFIX = 'TYS';
export const MAX_PRODUCTS_PAGE_SIZE = 100;
export const QR_SCAN_CACHE_TTL = 600; // 10 min in seconds
