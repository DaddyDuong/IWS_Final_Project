import { readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const isolatedDbPath = join(tmpdir(), `laptop-retail-cart-${Date.now()}.db`);

process.env.DATABASE_URL = `file:${isolatedDbPath}`;
process.env.JWT_SECRET = 'cart-test-secret';

function signAuthToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

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

async function createProduct(suffix, overrides = {}) {
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
      ...overrides,
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

  it('returns 404 when adding missing product to cart', async () => {
    const { authHeader } = await createUserWithToken('missing-product');

    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', authHeader)
      .send({ productId: 'missing-product-id', quantity: 1 });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('rejects add when product is unavailable (soft-deleted or out-of-stock)', async () => {
    const { authHeader } = await createUserWithToken('unavailable-product');
    const outOfStockProduct = await createProduct('out-of-stock', { stockQty: 0 });
    const softDeletedProduct = await createProduct('soft-deleted', { isDeleted: true });

    const outOfStockRes = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', authHeader)
      .send({ productId: outOfStockProduct.id, quantity: 1 });

    expect(outOfStockRes.status).toBe(409);
    expect(outOfStockRes.body.success).toBe(false);
    expect(outOfStockRes.body.error.code).toBe('CART_PRODUCT_UNAVAILABLE');

    const softDeletedRes = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', authHeader)
      .send({ productId: softDeletedProduct.id, quantity: 1 });

    expect(softDeletedRes.status).toBe(409);
    expect(softDeletedRes.body.success).toBe(false);
    expect(softDeletedRes.body.error.code).toBe('CART_PRODUCT_UNAVAILABLE');
  });

  it('rejects add when requested or accumulated quantity exceeds stock', async () => {
    const { authHeader } = await createUserWithToken('stock-add');
    const product = await createProduct('stock-add', { stockQty: 5 });

    const overRequestRes = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', authHeader)
      .send({ productId: product.id, quantity: 6 });

    expect(overRequestRes.status).toBe(409);
    expect(overRequestRes.body.success).toBe(false);
    expect(overRequestRes.body.error.code).toBe('CART_STOCK_EXCEEDED');

    const firstAddRes = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', authHeader)
      .send({ productId: product.id, quantity: 3 });

    expect(firstAddRes.status).toBe(201);

    const accumulatedOverRes = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', authHeader)
      .send({ productId: product.id, quantity: 3 });

    expect(accumulatedOverRes.status).toBe(409);
    expect(accumulatedOverRes.body.success).toBe(false);
    expect(accumulatedOverRes.body.error.code).toBe('CART_STOCK_EXCEEDED');
  });

  it('handles two near-simultaneous adds without lost update', async () => {
    const { authHeader } = await createUserWithToken('concurrent-add');
    const product = await createProduct('concurrent-add', { stockQty: 10 });

    const originalFindUnique = prisma.cartItem.findUnique;
    let waitingCalls = 0;
    let releaseWaitingCalls;
    const waitForBothReads = new Promise((resolve) => {
      releaseWaitingCalls = resolve;
    });

    prisma.cartItem.findUnique = async (...args) => {
      const result = await originalFindUnique(...args);
      waitingCalls += 1;

      if (waitingCalls === 2) {
        releaseWaitingCalls();
      }

      await waitForBothReads;
      return result;
    };

    try {
      const [firstRes, secondRes] = await Promise.all([
        request(app)
          .post('/api/v1/cart/items')
          .set('Authorization', authHeader)
          .send({ productId: product.id, quantity: 2 }),
        request(app)
          .post('/api/v1/cart/items')
          .set('Authorization', authHeader)
          .send({ productId: product.id, quantity: 3 }),
      ]);

      expect([firstRes.status, secondRes.status].sort()).toEqual([200, 201]);

      const cartRes = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', authHeader);

      expect(cartRes.status).toBe(200);
      expect(cartRes.body.success).toBe(true);
      expect(cartRes.body.data.items).toHaveLength(1);
      expect(cartRes.body.data.items[0]).toEqual(
        expect.objectContaining({
          productId: product.id,
          quantity: 5,
        }),
      );
    } finally {
      prisma.cartItem.findUnique = originalFindUnique;
    }
  });

  it('rejects patch when quantity exceeds stock', async () => {
    const { user, authHeader } = await createUserWithToken('stock-patch');
    const product = await createProduct('stock-patch', { stockQty: 3 });

    const item = await prisma.cartItem.create({
      data: {
        userId: user.id,
        productId: product.id,
        quantity: 1,
      },
    });

    const patchRes = await request(app)
      .patch(`/api/v1/cart/items/${item.id}`)
      .set('Authorization', authHeader)
      .send({ quantity: 4 });

    expect(patchRes.status).toBe(409);
    expect(patchRes.body.success).toBe(false);
    expect(patchRes.body.error.code).toBe('CART_STOCK_EXCEEDED');
  });

  it('returns only current user items in GET /cart', async () => {
    const { user: owner, authHeader: ownerToken } = await createUserWithToken('owner-cart');
    const { user: otherUser } = await createUserWithToken('other-cart');
    const ownerProduct = await createProduct('owner-item');
    const otherProduct = await createProduct('other-item');

    const ownerItem = await prisma.cartItem.create({
      data: {
        userId: owner.id,
        productId: ownerProduct.id,
        quantity: 2,
      },
    });

    await prisma.cartItem.create({
      data: {
        userId: otherUser.id,
        productId: otherProduct.id,
        quantity: 1,
      },
    });

    const res = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', ownerToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0]).toEqual(
      expect.objectContaining({
        id: ownerItem.id,
        userId: owner.id,
        productId: ownerProduct.id,
      }),
    );
  });

  it('supports pagination and sorting for GET /cart', async () => {
    const { user, authHeader } = await createUserWithToken('paged-cart');
    const productA = await createProduct('paged-a');
    const productB = await createProduct('paged-b');
    const productC = await createProduct('paged-c');

    const firstItem = await prisma.cartItem.create({
      data: {
        userId: user.id,
        productId: productA.id,
        quantity: 1,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });

    await prisma.cartItem.create({
      data: {
        userId: user.id,
        productId: productB.id,
        quantity: 2,
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    });

    await prisma.cartItem.create({
      data: {
        userId: user.id,
        productId: productC.id,
        quantity: 3,
        createdAt: new Date('2026-01-03T00:00:00.000Z'),
      },
    });

    const res = await request(app)
      .get('/api/v1/cart')
      .query({
        page: '2',
        limit: '1',
        sortBy: 'createdAt',
        sortOrder: 'asc',
      })
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0]).toEqual(
      expect.objectContaining({
        id: expect.not.stringMatching(firstItem.id),
        quantity: 2,
      }),
    );
    expect(res.body.meta).toEqual({
      page: 2,
      limit: 1,
      total: 3,
      totalPages: 3,
    });
  });

  it('returns 400 when cart sortBy is invalid', async () => {
    const { user, authHeader } = await createUserWithToken('cart-sort-invalid');
    const product = await createProduct('cart-sort-invalid');

    await prisma.cartItem.create({
      data: {
        userId: user.id,
        productId: product.id,
        quantity: 1,
      },
    });

    const res = await request(app)
      .get('/api/v1/cart')
      .query({ sortBy: 'quantity' })
      .set('Authorization', authHeader);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects quantity above validation ceiling', async () => {
    const { authHeader } = await createUserWithToken('quantity-ceiling');
    const product = await createProduct('quantity-ceiling');

    const addRes = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', authHeader)
      .send({ productId: product.id, quantity: 101 });

    expect(addRes.status).toBe(400);
    expect(addRes.body.success).toBe(false);

    const validAddRes = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', authHeader)
      .send({ productId: product.id, quantity: 1 });

    expect(validAddRes.status).toBe(201);

    const patchRes = await request(app)
      .patch(`/api/v1/cart/items/${validAddRes.body.data.id}`)
      .set('Authorization', authHeader)
      .send({ quantity: 101 });

    expect(patchRes.status).toBe(400);
    expect(patchRes.body.success).toBe(false);
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
