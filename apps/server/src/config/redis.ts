import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true,
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err.message));

export async function connectRedis(): Promise<void> {
  await redis.connect();
}

// ─── Cache Helpers ────────────────────────────────────────────
export async function cacheGet<T>(key: string): Promise<T | null> {
  const value = await redis.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function cacheDelete(key: string): Promise<void> {
  await redis.del(key);
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// ─── Cache Key Factory ────────────────────────────────────────
export const CacheKeys = {
  product: (id: string) => `product:${id}`,
  productBySku: (sku: string) => `product:sku:${sku}`,
  categoriesTree: () => 'categories:tree',
  dashboardSummary: () => 'analytics:dashboard:summary',
  analyticsRevenue: (from: string, to: string, groupBy: string) =>
    `analytics:revenue:${from}:${to}:${groupBy}`,
};
