import { readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import Database from 'better-sqlite3';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const isolatedDbPath = join(tmpdir(), `laptop-retail-products-${Date.now()}.db`);

process.env.DATABASE_URL = `file:${isolatedDbPath}`;
process.env.JWT_SECRET = 'products-test-secret';

let app;
let prisma;

async function applySchemaToDatabase(dbPath) {
  const migrationsDir = join(process.cwd(), 'prisma', 'migrations');
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  const migrationDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const db = new Database(dbPath);
  try {
    for (const migrationDir of migrationDirs) {
      const migrationSqlPath = join(migrationsDir, migrationDir, 'migration.sql');
      const migrationSql = await readFile(migrationSqlPath, 'utf8');
      db.exec(migrationSql);
    }
  } finally {
    db.close();
  }
}

describe('GET /api/v1/products', () => {
  beforeAll(async () => {
    await applySchemaToDatabase(isolatedDbPath);
    ({ app } = await import('../../src/app.js'));
    ({ prisma } = await import('../../src/lib/prisma.js'));
  });

  beforeEach(async () => {
    await prisma.product.deleteMany();

    await prisma.product.createMany({
      data: [
        {
          sku: 'LAP-001',
          name: 'Acer Swift 14',
          brand: 'Acer',
          cpu: 'Intel Core i7',
          ramGb: 16,
          storageGb: 512,
          screenSize: '14',
          price: 24000000,
          stockQty: 9,
          description: 'Portable ultrabook for travel',
          imageUrl: 'https://example.com/lap-001.jpg',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        {
          sku: 'LAP-002',
          name: 'Dell XPS 15',
          brand: 'Dell',
          cpu: 'Intel Core i9',
          ramGb: 32,
          storageGb: 1024,
          screenSize: '15.6',
          price: 52000000,
          stockQty: 0,
          description: 'Creator laptop with OLED panel',
          imageUrl: 'https://example.com/lap-002.jpg',
          createdAt: new Date('2026-01-02T00:00:00.000Z'),
        },
        {
          sku: 'LAP-003',
          name: 'Lenovo ThinkPad T14',
          brand: 'Lenovo',
          cpu: 'AMD Ryzen 7',
          ramGb: 16,
          storageGb: 512,
          screenSize: '14',
          price: 31000000,
          stockQty: 5,
          description: 'Reliable business laptop',
          imageUrl: 'https://example.com/lap-003.jpg',
          createdAt: new Date('2026-01-03T00:00:00.000Z'),
        },
        {
          sku: 'LAP-004',
          name: 'Razer Blade 14',
          brand: 'Razer',
          cpu: 'AMD Ryzen 9',
          ramGb: 32,
          storageGb: 1024,
          screenSize: '14',
          price: 45000000,
          stockQty: 3,
          description: 'Gaming laptop with RTX graphics',
          imageUrl: 'https://example.com/lap-004.jpg',
          createdAt: new Date('2026-01-04T00:00:00.000Z'),
        },
        {
          sku: 'LAP-005',
          name: 'HP Pavilion 15',
          brand: 'HP',
          cpu: 'Intel Core i5',
          ramGb: 8,
          storageGb: 512,
          screenSize: '15.6',
          price: 18000000,
          stockQty: 7,
          description: 'Affordable everyday laptop',
          imageUrl: 'https://example.com/lap-005.jpg',
          createdAt: new Date('2026-01-05T00:00:00.000Z'),
        },
        {
          sku: 'LAP-006',
          name: 'MSI Prestige 13',
          brand: 'MSI',
          cpu: 'Intel Core Ultra 7',
          ramGb: 16,
          storageGb: 1024,
          screenSize: '13.3',
          price: 36000000,
          stockQty: 4,
          description: 'Lightweight productivity laptop',
          imageUrl: 'https://example.com/lap-006.jpg',
          createdAt: new Date('2026-01-06T00:00:00.000Z'),
          isDeleted: true,
        },
      ],
    });
  });

  it('returns paginated products sorted by price ascending', async () => {
    const res = await request(app).get('/api/v1/products').query({
      page: '2',
      limit: '2',
      sortBy: 'price',
      sortOrder: 'asc',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.map((product) => product.sku)).toEqual(['LAP-003', 'LAP-004']);
    expect(res.body.meta).toEqual({
      page: 2,
      limit: 2,
      total: 5,
      totalPages: 3,
    });
  });

  it('supports q, hardware and stock filters while excluding soft-deleted products', async () => {
    const res = await request(app).get('/api/v1/products').query({
      q: 'gaming',
      brand: 'Razer',
      cpu: 'Ryzen 9',
      ram: '32',
      storage: '1024',
      minPrice: '43000000',
      maxPrice: '46000000',
      inStock: 'true',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toEqual(
      expect.objectContaining({
        sku: 'LAP-004',
        name: 'Razer Blade 14',
      }),
    );
    expect(res.body.meta.total).toBe(1);
  });

  it('returns 400 when sortBy is invalid', async () => {
    const res = await request(app).get('/api/v1/products').query({ sortBy: 'stockQty' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when inStock is not a strict boolean value', async () => {
    const res = await request(app).get('/api/v1/products').query({ inStock: 'maybe' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when page contains non-numeric characters', async () => {
    const res = await request(app).get('/api/v1/products').query({ page: '2abc' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when limit contains non-numeric characters', async () => {
    const res = await request(app).get('/api/v1/products').query({ limit: '10foo' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

});

describe('GET /api/v1/products/:id', () => {
  beforeAll(async () => {
    if (!app || !prisma) {
      ({ app } = await import('../../src/app.js'));
      ({ prisma } = await import('../../src/lib/prisma.js'));
    }
  });

  beforeEach(async () => {
    await prisma.product.deleteMany();
    await prisma.product.createMany({
      data: [
        {
          sku: 'DETAIL-001',
          name: 'MacBook Air 13',
          brand: 'Apple',
          cpu: 'Apple M3',
          ramGb: 16,
          storageGb: 512,
          screenSize: '13.6',
          price: 32000000,
          stockQty: 11,
          description: 'Fanless lightweight laptop',
          imageUrl: 'https://example.com/detail-001.jpg',
        },
        {
          sku: 'DETAIL-002',
          name: 'MacBook Pro 14',
          brand: 'Apple',
          cpu: 'Apple M3 Pro',
          ramGb: 18,
          storageGb: 512,
          screenSize: '14.2',
          price: 52000000,
          stockQty: 2,
          description: 'Professional laptop',
          imageUrl: 'https://example.com/detail-002.jpg',
          isDeleted: true,
        },
      ],
    });
  });

  it('returns a single public product by id', async () => {
    const product = await prisma.product.findUnique({ where: { sku: 'DETAIL-001' } });

    const res = await request(app).get(`/api/v1/products/${product.id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        sku: 'DETAIL-001',
        name: 'MacBook Air 13',
      }),
    );
  });

  it('returns 404 for soft-deleted product id', async () => {
    const deletedProduct = await prisma.product.findUnique({ where: { sku: 'DETAIL-002' } });
    const res = await request(app).get(`/api/v1/products/${deletedProduct.id}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
  await rm(isolatedDbPath, { force: true });
});
