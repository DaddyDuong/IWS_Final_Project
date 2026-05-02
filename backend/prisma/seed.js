import bcrypt from 'bcryptjs';
import prismaClientPkg from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const { PrismaClient } = prismaClientPkg;

const databaseUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });
const removedSampleSkus = ['RL-2026-001', 'RL-2026-003', 'LAP-ASUS-Z14', 'LAP-APPLE-MBA15'];

const sampleProducts = [
  {
    sku: 'RL-2026-002',
    name: 'Dell XPS 14 (9440)',
    brand: 'Dell',
    cpu: 'Intel Core Ultra 7 155H',
    ramGb: 16,
    storageGb: 512,
    screenSize: '14.5',
    price: 1999,
    stockQty: 8,
    description: 'Premium 14-inch productivity machine with modern industrial design.',
    imageUrl: 'http://127.0.0.1:4173/assets/generated/prod-dell-xps-14-9440.png',
  },
  {
    sku: 'RL-2026-004',
    name: 'ThinkPad X1 Carbon Gen 12',
    brand: 'Lenovo',
    cpu: 'Intel Core Ultra 7 155U',
    ramGb: 16,
    storageGb: 512,
    screenSize: '14.0',
    price: 1749,
    stockQty: 7,
    description: 'Business-focused ultralight laptop with durable premium chassis.',
    imageUrl: 'http://127.0.0.1:4173/assets/generated/prod-lenovo-thinkpad-x1-carbon-gen12.png',
  },
  {
    sku: 'RL-2026-005',
    name: 'HP Spectre x360 14 (2024)',
    brand: 'HP',
    cpu: 'Intel Core Ultra 7 155H',
    ramGb: 16,
    storageGb: 1024,
    screenSize: '14.0',
    price: 1599,
    stockQty: 9,
    description: 'Premium 2-in-1 laptop with convertible flexibility.',
    imageUrl: 'http://127.0.0.1:4173/assets/generated/prod-hp-spectre-x360-14-2024.png',
  },
  {
    sku: 'RL-2026-006',
    name: 'Surface Laptop 7 (13.8")',
    brand: 'Microsoft',
    cpu: 'Snapdragon X Elite',
    ramGb: 16,
    storageGb: 512,
    screenSize: '13.8',
    price: 1399,
    stockQty: 10,
    description: 'Modern ultraportable laptop designed for all-day productivity.',
    imageUrl: 'http://127.0.0.1:4173/assets/generated/prod-surface-laptop-7-13-8.png',
  },
  {
    sku: 'RL-2026-007',
    name: 'ASUS Zenbook 14 OLED',
    brand: 'ASUS',
    cpu: 'Intel Core Ultra 5 125H',
    ramGb: 16,
    storageGb: 512,
    screenSize: '14.0',
    price: 1299,
    stockQty: 12,
    description: 'Slim OLED ultrabook with a vivid display and long battery life.',
    imageUrl: 'http://127.0.0.1:4173/assets/generated/prod-asus-rog-zephyrus-g14-2024.png',
  },
  {
    sku: 'RL-2026-008',
    name: 'MacBook Air 15 M3',
    brand: 'Apple',
    cpu: 'Apple M3',
    ramGb: 16,
    storageGb: 512,
    screenSize: '15.0',
    price: 1699,
    stockQty: 11,
    description: 'Thin and light laptop with a larger display and silent design.',
    imageUrl: 'http://127.0.0.1:4173/assets/generated/prod-macbook-air-15-m3.png',
  },
  {
    sku: 'RL-2026-009',
    name: 'Dell Inspiron 16 Plus',
    brand: 'Dell',
    cpu: 'Intel Core Ultra 7 155H',
    ramGb: 32,
    storageGb: 1024,
    screenSize: '16.0',
    price: 1499,
    stockQty: 6,
    description: 'Large-screen creator laptop for mixed work and entertainment.',
    imageUrl: 'http://127.0.0.1:4173/assets/generated/prod-dell-xps-14-9440.png',
  },
  {
    sku: 'RL-2026-010',
    name: 'Lenovo Yoga 9i 2-in-1',
    brand: 'Lenovo',
    cpu: 'Intel Core Ultra 7 155H',
    ramGb: 16,
    storageGb: 1024,
    screenSize: '14.0',
    price: 1899,
    stockQty: 8,
    description: 'Premium convertible laptop with flexible hinge and stylus support.',
    imageUrl: 'http://127.0.0.1:4173/assets/generated/prod-lenovo-thinkpad-x1-carbon-gen12.png',
  },
  {
    sku: 'RL-2026-011',
    name: 'HP EliteBook 840 G11',
    brand: 'HP',
    cpu: 'Intel Core Ultra 5 125U',
    ramGb: 16,
    storageGb: 512,
    screenSize: '14.0',
    price: 1399,
    stockQty: 10,
    description: 'Business notebook built for dependable everyday productivity.',
    imageUrl: 'http://127.0.0.1:4173/assets/generated/prod-hp-spectre-x360-14-2024.png',
  },
  {
    sku: 'RL-2026-012',
    name: 'Microsoft Surface Pro 10',
    brand: 'Microsoft',
    cpu: 'Intel Core Ultra 7 165U',
    ramGb: 16,
    storageGb: 512,
    screenSize: '13.0',
    price: 1499,
    stockQty: 9,
    description: 'Detachable tablet PC for note-taking and travel-friendly work.',
    imageUrl: 'http://127.0.0.1:4173/assets/generated/prod-surface-laptop-7-13-8.png',
  },
  {
    sku: 'RL-2026-013',
    name: 'Acer Swift Go 14',
    brand: 'Acer',
    cpu: 'Intel Core Ultra 7 155H',
    ramGb: 16,
    storageGb: 512,
    screenSize: '14.0',
    price: 1099,
    stockQty: 14,
    description: 'Value-focused thin laptop with modern ports and solid battery life.',
    imageUrl: 'http://127.0.0.1:4173/assets/generated/prod-asus-rog-zephyrus-g14-2024.png',
  },
  {
    sku: 'RL-2026-014',
    name: 'MacBook Pro 14 M3 Pro',
    brand: 'Apple',
    cpu: 'Apple M3 Pro',
    ramGb: 18,
    storageGb: 512,
    screenSize: '14.2',
    price: 2399,
    stockQty: 4,
    description: 'Professional laptop for demanding creative and development work.',
    imageUrl: 'http://127.0.0.1:4173/assets/generated/prod-macbook-air-15-m3.png',
  },
  {
    sku: 'RL-2026-015',
    name: 'ASUS Vivobook S 14',
    brand: 'ASUS',
    cpu: 'Intel Core Ultra 7 155H',
    ramGb: 16,
    storageGb: 512,
    screenSize: '14.0',
    price: 1199,
    stockQty: 13,
    description: 'Stylish daily laptop with a lightweight chassis and sharp display.',
    imageUrl: 'http://127.0.0.1:4173/assets/generated/prod-asus-rog-zephyrus-g14-2024.png',
  },
  {
    sku: 'RL-2026-016',
    name: 'Dell Latitude 7450',
    brand: 'Dell',
    cpu: 'Intel Core Ultra 5 125U',
    ramGb: 16,
    storageGb: 512,
    screenSize: '14.0',
    price: 1599,
    stockQty: 7,
    description: 'Enterprise laptop with a balanced mix of portability and reliability.',
    imageUrl: 'http://127.0.0.1:4173/assets/generated/prod-dell-xps-14-9440.png',
  },
  {
    sku: 'RL-2026-017',
    name: 'ASUS ROG Zephyrus G14',
    brand: 'ASUS',
    cpu: 'AMD Ryzen 9',
    ramGb: 32,
    storageGb: 1024,
    screenSize: '14.0',
    price: 2199,
    stockQty: 5,
    description: 'Gaming ultrabook with strong performance and a compact footprint.',
    imageUrl: 'http://127.0.0.1:4173/assets/generated/prod-asus-rog-zephyrus-g14-2024.png',
  },
  {
    sku: 'RL-2026-018',
    name: 'Apple MacBook Air 15 M3',
    brand: 'Apple',
    cpu: 'Apple M3',
    ramGb: 16,
    storageGb: 512,
    screenSize: '15.0',
    price: 1699,
    stockQty: 7,
    description: 'Thin and light laptop with a larger display and silent design.',
    imageUrl: 'http://127.0.0.1:4173/assets/generated/prod-macbook-air-15-m3.png',
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

    await tx.product.updateMany({
      where: {
        sku: { in: removedSampleSkus },
      },
      data: {
        isDeleted: true,
      },
    });
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
