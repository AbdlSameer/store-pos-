import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// NEVER hardcode real credentials in a seed script that lives in
// version control. Pull them from the environment instead, and if
// they're missing, generate a one-time random password and print it
// once so it can be saved somewhere safe (a password manager) - not
// committed to git.
const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const SEED_ADMIN_PASSWORD =
  process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');

async function main() {
  console.log('🌱 Starting seed...');

  if (!SEED_ADMIN_EMAIL) {
    throw new Error(
      'SEED_ADMIN_EMAIL is not set. Add SEED_ADMIN_EMAIL (and optionally SEED_ADMIN_PASSWORD) to your .env before seeding.'
    );
  }

  // 1. Create Super Admin
  const hashed = await bcrypt.hash(SEED_ADMIN_PASSWORD, 12);
  const admin = await prisma.user.upsert({
    where: { email: SEED_ADMIN_EMAIL },
    update: {},
    create: {
      email: SEED_ADMIN_EMAIL,
      passwordHash: hashed,
      fullName: 'Super Admin',
      role: 'super_admin'
    }
  });

  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log('──────────────────────────────────────────────');
    console.log('🔑 Generated owner password (save this now, it will not be shown again):');
    console.log(`   ${SEED_ADMIN_PASSWORD}`);
    console.log('──────────────────────────────────────────────');
  }

  // 2. Create Categories
  const categoriesData = [
    { name: 'Action Figures', slug: 'action-figures' },
    { name: 'Board Games', slug: 'board-games' },
    { name: 'Dolls', slug: 'dolls' },
    { name: 'Educational', slug: 'educational' },
    { name: 'Puzzles', slug: 'puzzles' }
  ];

  const categories = await Promise.all(
    categoriesData.map(cat => 
      prisma.category.upsert({
        where: { name: cat.name },
        update: {},
        create: cat
      })
    )
  );

  // 3. Create Sample Products
  const productsData = [
    {
      name: 'Super Hero Action Figure',
      sku: 'ACT-001',
      barcode: '123456789012',
      description: 'Articulated 12-inch superhero figure with accessories.',
      price: 29.99,
      costPrice: 15.00,
      stockQuantity: 50,
      minStockLevel: 10,
      categoryId: categories.find(c => c.name === 'Action Figures')!.id,
      createdBy: admin.id
    },
    {
      name: 'Classic Monopoly Strategy Game',
      sku: 'BRD-001',
      barcode: '234567890123',
      description: 'The classic property trading board game for the whole family.',
      price: 34.99,
      costPrice: 20.00,
      stockQuantity: 30,
      minStockLevel: 5,
      categoryId: categories.find(c => c.name === 'Board Games')!.id,
      createdBy: admin.id
    },
    {
      name: 'Fashion Doll with Wardrobe',
      sku: 'DOL-001',
      barcode: '345678901234',
      description: '11-inch fashion doll including 3 complete outfits.',
      price: 24.99,
      costPrice: 12.50,
      stockQuantity: 100,
      minStockLevel: 20,
      categoryId: categories.find(c => c.name === 'Dolls')!.id,
      createdBy: admin.id
    },
    {
      name: 'STEM Robot Building Kit',
      sku: 'EDU-001',
      barcode: '456789012345',
      description: 'Build and program your own robot. Ages 8+.',
      price: 49.99,
      costPrice: 25.00,
      stockQuantity: 25,
      minStockLevel: 5,
      categoryId: categories.find(c => c.name === 'Educational')!.id,
      createdBy: admin.id
    },
    {
      name: '1000 Piece Landscape Puzzle',
      sku: 'PUZ-001',
      barcode: '567890123456',
      description: 'Beautiful mountain landscape puzzle for adults.',
      price: 19.99,
      costPrice: 8.50,
      stockQuantity: 40,
      minStockLevel: 10,
      categoryId: categories.find(c => c.name === 'Puzzles')!.id,
      createdBy: admin.id
    }
  ];

  await Promise.all(
    productsData.map(product =>
      prisma.product.upsert({
        where: { sku: product.sku },
        update: {},
        create: product
      })
    )
  );

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
