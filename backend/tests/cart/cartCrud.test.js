import { readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { signAuthToken } from '../../src/lib/jwt.js';

const isolatedDbPath = join(tmpdir(), `laptop-retail-cart-${Date.now()}.db`);

process.env.DATABASE_URL = `file:${isolatedDbPath}`;
process.env.JWT_SECRET = 'cart-test-secret';

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

async function createUserWithToken(emailPrefix) {
  const user = await prisma.user.create({
    data: {
      email: `${emailPrefix}-${Date.now()}@example.com`,
      passwordHash: 'not-used-in-this-test',
      fullName: `${emailPrefix} user`,
      role: 'customer',
    },
  });

  return {
    user,
    authHeader: `Bearer ${signAuthToken({ sub: user.id, role: user.role })}`,
  };
}

async function createProduct(suffix) {
  return prisma.product.create({
    data: {
      sku: `CART-${suffix}-${Date.now()}`,
      name: `Cart Product ${suffix}`,
      brand: 'CartBrand',
      cpu: 'Intel Core i5',
      ramGb: 8,
      storageGb: 256,
      screenSize: '14',
      price: 12000000,
      stockQty: 20,
      description: `Cart test product ${suffix}`,
      imageUrl: `https://example.com/cart-${suffix}.jpg`,
    },
  });
}

describe('cart CRUD routes', () => {
  beforeAll(async () => {
    await applySchemaToDatabase(isolatedDbPath);
    ({ app } = await import('../../src/app.js'));
    ({ prisma } = await import('../../src/lib/prisma.js'));
  });

  beforeEach(async () => {
    await prisma.cartItem.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
  });

  it('returns 401 for unauthenticated access', async () => {
    const product = await createProduct('unauth');

    const getRes = await request(app).get('/api/v1/cart');
    const postRes = await request(app).post('/api/v1/cart/items').send({ productId: product.id, quantity: 1 });
    const patchRes = await request(app).patch('/api/v1/cart/items/any-id').send({ quantity: 2 });
    const deleteRes = await request(app).delete('/api/v1/cart/items/any-id');

    expect(getRes.status).toBe(401);
    expect(postRes.status).toBe(401);
    expect(patchRes.status).toBe(401);
    expect(deleteRes.status).toBe(401);
  });

  it('adds item, gets cart, updates quantity, and deletes item', async () => {
    const { authHeader } = await createUserWithToken('cart-owner');
    const product = await createProduct('flow');

    const addRes = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', authHeader)
      .send({ productId: product.id, quantity: 2 });

    expect(addRes.status).toBe(201);
    expect(addRes.body.success).toBe(true);
    expect(addRes.body.data).toEqual(
      expect.objectContaining({
        productId: product.id,
        quantity: 2,
        product: expect.objectContaining({
          id: product.id,
          name: product.name,
        }),
      }),
    );

    const addedItemId = addRes.body.data.id;

    const addAgainRes = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', authHeader)
      .send({ productId: product.id, quantity: 3 });

    expect(addAgainRes.status).toBe(200);
    expect(addAgainRes.body.success).toBe(true);
    expect(addAgainRes.body.data).toEqual(
      expect.objectContaining({
        id: addedItemId,
        quantity: 5,
      }),
    );

    const getRes = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', authHeader);

    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: addedItemId,
          productId: product.id,
          quantity: 5,
        }),
      ]),
    );

    const updateRes = await request(app)
      .patch(`/api/v1/cart/items/${addedItemId}`)
      .set('Authorization', authHeader)
      .send({ quantity: 1 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data).toEqual(
      expect.objectContaining({
        id: addedItemId,
        quantity: 1,
      }),
    );

    const deleteRes = await request(app)
      .delete(`/api/v1/cart/items/${addedItemId}`)
      .set('Authorization', authHeader);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
    expect(deleteRes.body.data).toEqual(
      expect.objectContaining({
        id: addedItemId,
      }),
    );

    const remainingItems = await prisma.cartItem.findMany();
    expect(remainingItems).toHaveLength(0);
  });

  it('prevents cross-user update and delete mutations', async () => {
    const { user: owner } = await createUserWithToken('owner');
    const { authHeader: otherUserToken } = await createUserWithToken('other');
    const product = await createProduct('cross-user');

    const ownerItem = await prisma.cartItem.create({
      data: {
        userId: owner.id,
        productId: product.id,
        quantity: 2,
      },
    });

    const updateRes = await request(app)
      .patch(`/api/v1/cart/items/${ownerItem.id}`)
      .set('Authorization', otherUserToken)
      .send({ quantity: 7 });

    expect(updateRes.status).toBe(404);
    expect(updateRes.body.success).toBe(false);

    const deleteRes = await request(app)
      .delete(`/api/v1/cart/items/${ownerItem.id}`)
      .set('Authorization', otherUserToken);

    expect(deleteRes.status).toBe(404);
    expect(deleteRes.body.success).toBe(false);

    const existingItem = await prisma.cartItem.findUnique({ where: { id: ownerItem.id } });
    expect(existingItem).toEqual(
      expect.objectContaining({
        id: ownerItem.id,
        quantity: 2,
      }),
    );
  });
});

afterAll(async () => {
  await prisma.$disconnect();
  await rm(isolatedDbPath, { force: true });
});
