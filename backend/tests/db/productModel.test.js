import { afterAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });
const testSku = `LAP-TEST-${Date.now()}`;

describe('product model', () => {
  it('creates and reads a product', async () => {
    const created = await prisma.product.create({
      data: {
        sku: testSku,
        name: 'ThinkPad X1 Carbon',
        brand: 'Lenovo',
        cpu: 'Intel Core Ultra 7',
        ramGb: 16,
        storageGb: 512,
        screenSize: '14',
        price: 39990000,
        stockQty: 8,
        description: 'Business ultrabook',
        imageUrl: 'https://example.com/x1.jpg',
      },
    });

    const found = await prisma.product.findUnique({ where: { sku: testSku } });

    expect(created.sku).toBe(testSku);
    expect(found?.name).toBe('ThinkPad X1 Carbon');
  });

  afterAll(async () => {
    if (prisma.product) {
      await prisma.product.deleteMany({ where: { sku: testSku } });
    }
    await prisma.$disconnect();
  });
});
