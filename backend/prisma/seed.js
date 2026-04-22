import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const databaseUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

const sampleProducts = [
  {
    sku: 'LAP-ASUS-Z14',
    name: 'ASUS ROG Zephyrus G14',
    brand: 'ASUS',
    cpu: 'AMD Ryzen 9',
    ramGb: 32,
    storageGb: 1024,
    screenSize: '14',
    price: 52990000,
    stockQty: 5,
    description: 'Gaming ultrabook',
    imageUrl: 'https://example.com/g14.jpg',
  },
  {
    sku: 'LAP-APPLE-MBA15',
    name: 'MacBook Air 15 M3',
    brand: 'Apple',
    cpu: 'Apple M3',
    ramGb: 16,
    storageGb: 512,
    screenSize: '15',
    price: 42990000,
    stockQty: 7,
    description: 'Thin and light laptop',
    imageUrl: 'https://example.com/mba15.jpg',
  },
];

async function main() {
  await prisma.$transaction(async (tx) => {
    const existingManager = await tx.user.findUnique({
      where: { email: 'manager@laptop.local' },
    });

    if (existingManager) {
      await tx.user.update({
        where: { email: 'manager@laptop.local' },
        data: {
          fullName: 'Store Manager',
          role: 'manager',
        },
      });
    } else {
      const managerPasswordHash = await bcrypt.hash('Manager@123', 10);
      await tx.user.create({
        data: {
          email: 'manager@laptop.local',
          passwordHash: managerPasswordHash,
          fullName: 'Store Manager',
          role: 'manager',
        },
      });
    }

    for (const product of sampleProducts) {
      await tx.product.upsert({
        where: { sku: product.sku },
        update: product,
        create: product,
      });
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
