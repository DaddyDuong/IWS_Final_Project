import { readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { signAuthToken } from '../../src/lib/jwt.js';

const isolatedDbPath = join(tmpdir(), `laptop-retail-internal-products-${Date.now()}.db`);

process.env.DATABASE_URL = `file:${isolatedDbPath}`;
process.env.JWT_SECRET = 'internal-products-test-secret';

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

async function buildAuthHeader(role = 'customer') {
  const user = await prisma.user.create({
    data: {
      email: `${role}-${Date.now()}@example.com`,
      passwordHash: 'not-used-in-this-test',
      fullName: `${role} user`,
      role,
    },
  });

  return `Bearer ${signAuthToken({ sub: user.id, role: user.role })}`;
}

describe('internal product CRUD routes', () => {
  beforeAll(async () => {
    await applySchemaToDatabase(isolatedDbPath);
    ({ app } = await import('../../src/app.js'));
    ({ prisma } = await import('../../src/lib/prisma.js'));
  });

  beforeEach(async () => {
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
  });

  it('returns 401 when creating product without token', async () => {
    const res = await request(app).post('/api/v1/internal/products').send({});

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 403 when non-manager creates product', async () => {
    const customerToken = await buildAuthHeader('customer');

    const res = await request(app)
      .post('/api/v1/internal/products')
      .set('Authorization', customerToken)
      .send({});

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('allows manager to create, update, and soft-delete product', async () => {
    const managerToken = await buildAuthHeader('manager');
    const createPayload = {
      sku: 'INT-001',
      name: 'Internal Test Laptop',
      brand: 'TestBrand',
      cpu: 'Intel Core i7',
      ramGb: 16,
      storageGb: 512,
      screenSize: '14',
      price: 25000000,
      stockQty: 8,
      description: 'Internal create test product',
      imageUrl: 'https://example.com/int-001.jpg',
    };

    const createRes = await request(app)
      .post('/api/v1/internal/products')
      .set('Authorization', managerToken)
      .send(createPayload);

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data).toEqual(
      expect.objectContaining({
        sku: createPayload.sku,
        name: createPayload.name,
      }),
    );

    const createdProductId = createRes.body.data.id;

    const updateRes = await request(app)
      .patch(`/api/v1/internal/products/${createdProductId}`)
      .set('Authorization', managerToken)
      .send({
        name: 'Internal Updated Laptop',
        price: 26000000,
        stockQty: 10,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data).toEqual(
      expect.objectContaining({
        id: createdProductId,
        name: 'Internal Updated Laptop',
        price: 26000000,
        stockQty: 10,
      }),
    );

    const deleteRes = await request(app)
      .delete(`/api/v1/internal/products/${createdProductId}`)
      .set('Authorization', managerToken);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    const softDeleted = await prisma.product.findUnique({ where: { id: createdProductId } });
    expect(softDeleted).toEqual(
      expect.objectContaining({
        id: createdProductId,
        isDeleted: true,
      }),
    );
  });
});

afterAll(async () => {
  await prisma.$disconnect();
  await rm(isolatedDbPath, { force: true });
});
