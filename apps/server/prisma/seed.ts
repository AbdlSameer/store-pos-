import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create Super Admin
  const hashed = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@toystore.com' },
    update: {},
    create: {
      email: 'admin@toystore.com',
      passwordHash: hashed,
      fullName: 'Super Admin',
      role: 'super_admin'
    }
  });

  // 2. Create Categories
  const categoriesData = [
    { name: 'Action Figures', slug: 'action-figures' },
    { name: 'Board Games', slug: 'board-games' },
    { name: 'Educational', slug: 'educational' },
    { name: 'Puzzles', slug: 'puzzles' },
    { name: 'Vehicles', slug: 'vehicles' },
    { name: 'SOFT TOYS', slug: 'soft-toys' },
    { name: 'ELECTRONIC TOYS', slug: 'electronic-toys' },
    { name: 'ART STUDIO', slug: 'art-studio' },
    { name: 'SPORTS', slug: 'sports' },
    { name: 'BABY RIDERS', slug: 'baby-riders' },
    { name: 'RAINCOATS', slug: 'raincoats' },
    { name: 'STATIONERY', slug: 'stationery' }
  ];

  const categories = await Promise.all(
    categoriesData.map(c => 
      prisma.category.upsert({
        where: { slug: c.slug },
        update: {},
        create: c
      })
    )
  );

  // 3. Create Sample Products
  const productsData = [
    { sku: 'ACT-001', name: 'Superhero Action Figure', price: 999.99, quantity: 50, categoryId: categories[0].id },
    { sku: 'BRD-001', name: 'Monopoly Classic', price: 1499.00, quantity: 30, categoryId: categories[1].id },
    { sku: 'EDU-001', name: 'Science Kit', price: 2499.50, quantity: 5, categoryId: categories[2].id },
    { sku: 'PUZ-001', name: '1000 Piece Landscape', price: 799.00, quantity: 15, categoryId: categories[3].id },
    { sku: 'VEH-001', name: 'Remote Control Car', price: 1999.00, quantity: 8, categoryId: categories[4].id },
  ];

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        ...p,
        createdBy: admin.id
      }
    });
  }

  console.log('✅ Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
