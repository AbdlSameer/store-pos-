import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

import authRouter from './modules/auth/auth.router';
import productsRouter from './modules/products/products.router';
import posRouter from './modules/pos/pos.router';
import alertsRouter from './modules/alerts/alerts.router';
import analyticsRouter from './modules/analytics/analytics.router';
import categoriesRouter from './modules/categories/categories.router';

const app = express();

// Middleware
app.use(helmet());
const allowedOrigins = env.CLIENT_URL.split(',').map(url => url.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(apiLimiter);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/pos', posRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/analytics', analyticsRouter);

// Error Handling
app.use(errorHandler);

// ── TEMPORARY SEED ENDPOINT (remove after first use) ────────────
// POST https://store-pos.onrender.com/api/seed-prod?secret=SAMEER_SEED_2024
import bcryptjs from 'bcryptjs';
app.post('/api/seed-prod', async (req: express.Request, res: express.Response) => {
  const { prisma: db } = await import('./config/database');
  if (req.query.secret !== 'SAMEER_SEED_2024') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  try {
    const hashAdmin = await bcryptjs.hash('123123', 10);
    const hashCashier = await bcryptjs.hash('123456', 10);
    
    await db.user.upsert({
      where: { email: 'sameer@gmail.com' },
      update: { passwordHash: hashAdmin, role: 'super_admin', isActive: true },
      create: { email: 'sameer@gmail.com', passwordHash: hashAdmin, fullName: 'Super Admin', role: 'super_admin' },
    });
    
    await db.user.upsert({
      where: { email: 'cashier@toystore.com' },
      update: { passwordHash: hashCashier, role: 'cashier', isActive: true },
      create: { email: 'cashier@toystore.com', passwordHash: hashCashier, fullName: 'Store Cashier', role: 'cashier' },
    });
    
    // Clear rate limits in Redis
    const { redis: redisClient } = await import('./config/redis');
    await redisClient.flushall();
    
    res.json({ success: true, message: 'Users created. Admin: 123123. Cashier: 123456. Rate limits cleared!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
// ── END TEMPORARY SEED ENDPOINT ─────────────────────────────────

import { prisma } from './config/database';
import { redis } from './config/redis';

// Startup
async function startServer() {
  try {
    await connectDatabase();
    await connectRedis();

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('HTTP server closed.');
        try {
          await prisma.$disconnect();
          console.log('Database disconnected.');
          await redis.quit();
          console.log('Redis disconnected.');
          process.exit(0);
        } catch (err) {
          console.error('Error during shutdown:', err);
          process.exit(1);
        }
      });
      
      // Force shutdown after 10s
      setTimeout(() => {
        console.error('Forcing shutdown after timeout');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
