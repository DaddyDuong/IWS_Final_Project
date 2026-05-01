import { readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const isolatedDbPath = join(tmpdir(), `laptop-retail-orders-${Date.now()}.db`);

process.env.DATABASE_URL = `file:${isolatedDbPath}`;
process.env.JWT_SECRET = 'orders-test-secret';

let app;
let prisma;
let signAuthToken;

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
      sku: `ORDER-${suffix}-${Date.now()}`,
      name: `Order Product ${suffix}`,
      brand: 'OrderBrand',
      cpu: 'Intel Core i5',
      ramGb: 8,
      storageGb: 256,
      screenSize: '14',
      price: 12000000,
      stockQty: 20,
      description: `Order test product ${suffix}`,
      imageUrl: `https://example.com/order-${suffix}.jpg`,
      ...overrides,
    },
  });
}

async function createAddressForUser(userId, suffix) {
  return prisma.address.create({
    data: {
      userId,
      receiver: `Receiver ${suffix}`,
      phone: '0900000000',
      line1: `${suffix} line 1`,
      ward: 'Ward 1',
      district: 'District 1',
      city: 'Ho Chi Minh City',
    },
  });
}

describe('orders checkout and cancel routes', () => {
  beforeAll(async () => {
    await applySchemaToDatabase(isolatedDbPath);
    ({ signAuthToken } = await import('../../src/lib/jwt.js'));
    ({ app } = await import('../../src/app.js'));
    ({ prisma } = await import('../../src/lib/prisma.js'));
  });

  beforeEach(async () => {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.address.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
  });

  it('returns 401 for unauthenticated access', async () => {
    const listRes = await request(app).get('/api/v1/orders');
    const detailRes = await request(app).get('/api/v1/orders/any-id');
    const checkoutRes = await request(app).post('/api/v1/orders/checkout').send({ addressId: 'any-id' });
    const cancelRes = await request(app).patch('/api/v1/orders/any-id/cancel');

    expect(listRes.status).toBe(401);
    expect(detailRes.status).toBe(401);
    expect(checkoutRes.status).toBe(401);
    expect(cancelRes.status).toBe(401);
  });

  it('creates order on checkout, snapshots prices, decrements stock, and clears cart', async () => {
    const { user, authHeader } = await createUserWithToken('checkout-success');
    const address = await createAddressForUser(user.id, 'checkout-success');
    const productA = await createProduct('checkout-a', { price: 10000000, stockQty: 5 });
    const productB = await createProduct('checkout-b', { price: 7000000, stockQty: 6 });

    await prisma.cartItem.createMany({
      data: [
        { userId: user.id, productId: productA.id, quantity: 2 },
        { userId: user.id, productId: productB.id, quantity: 1 },
      ],
    });

    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .set('Authorization', authHeader)
      .send({ addressId: address.id });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        userId: user.id,
        addressId: address.id,
        status: 'pending',
        subtotal: 27000000,
        shippingFee: 0,
        total: 27000000,
      }),
    );
    expect(res.body.data.items).toHaveLength(2);

    const orderId = res.body.data.id;
    const persistedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    expect(persistedOrder).toBeTruthy();
    expect(persistedOrder.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: productA.id,
          quantity: 2,
          unitPrice: 10000000,
          lineTotal: 20000000,
        }),
        expect.objectContaining({
          productId: productB.id,
          quantity: 1,
          unitPrice: 7000000,
          lineTotal: 7000000,
        }),
      ]),
    );

    const updatedProductA = await prisma.product.findUnique({ where: { id: productA.id } });
    const updatedProductB = await prisma.product.findUnique({ where: { id: productB.id } });
    expect(updatedProductA.stockQty).toBe(3);
    expect(updatedProductB.stockQty).toBe(5);

    const remainingCartItems = await prisma.cartItem.findMany({ where: { userId: user.id } });
    expect(remainingCartItems).toHaveLength(0);
  });

  it('rejects checkout when cart is empty', async () => {
    const { user, authHeader } = await createUserWithToken('checkout-empty-cart');
    const address = await createAddressForUser(user.id, 'checkout-empty-cart');

    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .set('Authorization', authHeader)
      .send({ addressId: address.id });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ORDER_CART_EMPTY');
  });

  it('rejects checkout for an address not owned by the user', async () => {
    const { user, authHeader } = await createUserWithToken('checkout-owner');
    const { user: otherUser } = await createUserWithToken('checkout-other');
    const otherUserAddress = await createAddressForUser(otherUser.id, 'checkout-other');
    const product = await createProduct('checkout-address');

    await prisma.cartItem.create({
      data: {
        userId: user.id,
        productId: product.id,
        quantity: 1,
      },
    });

    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .set('Authorization', authHeader)
      .send({ addressId: otherUserAddress.id });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ORDER_ADDRESS_NOT_FOUND');
  });

  it('rejects checkout when stock is no longer sufficient', async () => {
    const { user, authHeader } = await createUserWithToken('checkout-stock');
    const address = await createAddressForUser(user.id, 'checkout-stock');
    const product = await createProduct('checkout-stock', { stockQty: 1 });

    await prisma.cartItem.create({
      data: {
        userId: user.id,
        productId: product.id,
        quantity: 2,
      },
    });

    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .set('Authorization', authHeader)
      .send({ addressId: address.id });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ORDER_STOCK_UNAVAILABLE');

    const orderCount = await prisma.order.count();
    expect(orderCount).toBe(0);
  });

  it('ignores soft-deleted cart items during checkout', async () => {
    const { user, authHeader } = await createUserWithToken('checkout-soft-deleted');
    const address = await createAddressForUser(user.id, 'checkout-soft-deleted');
    const activeProduct = await createProduct('checkout-active', { price: 8000000, stockQty: 5 });
    const deletedProduct = await createProduct('checkout-deleted', { price: 5000000, stockQty: 5 });

    await prisma.cartItem.createMany({
      data: [
        { userId: user.id, productId: activeProduct.id, quantity: 1 },
        { userId: user.id, productId: deletedProduct.id, quantity: 1 },
      ],
    });

    await prisma.product.update({
      where: { id: deletedProduct.id },
      data: { isDeleted: true },
    });

    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .set('Authorization', authHeader)
      .send({ addressId: address.id });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].productId).toBe(activeProduct.id);

    const remainingCartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
    });

    expect(remainingCartItems).toHaveLength(0);
  });

  it('lists and retrieves only current user orders', async () => {
    const { user: owner, authHeader: ownerToken } = await createUserWithToken('orders-owner');
    const { user: otherUser } = await createUserWithToken('orders-other');
    const ownerAddress = await createAddressForUser(owner.id, 'orders-owner');
    const otherAddress = await createAddressForUser(otherUser.id, 'orders-other');

    const ownerOrder = await prisma.order.create({
      data: {
        userId: owner.id,
        addressId: ownerAddress.id,
        status: 'pending',
        subtotal: 1000000,
        shippingFee: 0,
        total: 1000000,
      },
    });

    await prisma.order.create({
      data: {
        userId: otherUser.id,
        addressId: otherAddress.id,
        status: 'pending',
        subtotal: 2000000,
        shippingFee: 0,
        total: 2000000,
      },
    });

    const listRes = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', ownerToken);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].id).toBe(ownerOrder.id);

    const detailRes = await request(app)
      .get(`/api/v1/orders/${ownerOrder.id}`)
      .set('Authorization', ownerToken);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.success).toBe(true);
    expect(detailRes.body.data.id).toBe(ownerOrder.id);

    const missingRes = await request(app)
      .get('/api/v1/orders/not-owner-order-id')
      .set('Authorization', ownerToken);

    expect(missingRes.status).toBe(404);
    expect(missingRes.body.success).toBe(false);
    expect(missingRes.body.error.code).toBe('ORDER_NOT_FOUND');
  });

  it('supports pagination, sorting, and filters for GET /orders', async () => {
    const { user: owner, authHeader: ownerToken } = await createUserWithToken('orders-query-owner');
    const { user: otherUser } = await createUserWithToken('orders-query-other');
    const ownerAddress = await createAddressForUser(owner.id, 'orders-query-owner');
    const otherAddress = await createAddressForUser(otherUser.id, 'orders-query-other');

    await prisma.order.createMany({
      data: [
        {
          userId: owner.id,
          addressId: ownerAddress.id,
          status: 'pending',
          subtotal: 3000000,
          shippingFee: 0,
          total: 3000000,
          placedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        {
          userId: owner.id,
          addressId: ownerAddress.id,
          status: 'processing',
          subtotal: 1000000,
          shippingFee: 0,
          total: 1000000,
          placedAt: new Date('2026-01-02T00:00:00.000Z'),
        },
        {
          userId: owner.id,
          addressId: ownerAddress.id,
          status: 'shipped',
          subtotal: 2000000,
          shippingFee: 0,
          total: 2000000,
          placedAt: new Date('2026-01-03T00:00:00.000Z'),
        },
        {
          userId: owner.id,
          addressId: ownerAddress.id,
          status: 'pending',
          subtotal: 4000000,
          shippingFee: 0,
          total: 4000000,
          placedAt: new Date('2026-01-04T00:00:00.000Z'),
        },
        {
          userId: otherUser.id,
          addressId: otherAddress.id,
          status: 'pending',
          subtotal: 9000000,
          shippingFee: 0,
          total: 9000000,
          placedAt: new Date('2026-01-05T00:00:00.000Z'),
        },
      ],
    });

    const res = await request(app)
      .get('/api/v1/orders')
      .query({
        page: '2',
        limit: '1',
        sortBy: 'total',
        sortOrder: 'asc',
        status: 'pending',
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-01-05T00:00:00.000Z',
        minTotal: '1000000',
        maxTotal: '5000000',
      })
      .set('Authorization', ownerToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toEqual(
      expect.objectContaining({
        userId: owner.id,
        status: 'pending',
        total: 4000000,
      }),
    );
    expect(res.body.meta).toEqual({
      page: 2,
      limit: 1,
      total: 2,
      totalPages: 2,
    });
  });

  it('returns 400 when orders sortBy is invalid', async () => {
    const { user, authHeader } = await createUserWithToken('orders-sort-invalid');
    const address = await createAddressForUser(user.id, 'orders-sort-invalid');

    await prisma.order.create({
      data: {
        userId: user.id,
        addressId: address.id,
        status: 'pending',
        subtotal: 1000000,
        shippingFee: 0,
        total: 1000000,
      },
    });

    const res = await request(app)
      .get('/api/v1/orders')
      .query({ sortBy: 'createdAt' })
      .set('Authorization', authHeader);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when minTotal is greater than maxTotal', async () => {
    const { user, authHeader } = await createUserWithToken('orders-total-range-invalid');
    const address = await createAddressForUser(user.id, 'orders-total-range-invalid');

    await prisma.order.create({
      data: {
        userId: user.id,
        addressId: address.id,
        status: 'pending',
        subtotal: 1000000,
        shippingFee: 0,
        total: 1000000,
      },
    });

    const res = await request(app)
      .get('/api/v1/orders')
      .query({ minTotal: '5000', maxTotal: '1000' })
      .set('Authorization', authHeader);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('cancels own pending order and restores stock', async () => {
    const { user, authHeader } = await createUserWithToken('cancel-success');
    const address = await createAddressForUser(user.id, 'cancel-success');
    const product = await createProduct('cancel-success', { stockQty: 3 });

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        addressId: address.id,
        status: 'pending',
        subtotal: 20000000,
        shippingFee: 0,
        total: 20000000,
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        unitPrice: 10000000,
        quantity: 2,
        lineTotal: 20000000,
      },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: { stockQty: 1 },
    });

    const res = await request(app)
      .patch(`/api/v1/orders/${order.id}/cancel`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        id: order.id,
        status: 'canceled',
      }),
    );

    const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updatedOrder.status).toBe('canceled');
    expect(updatedProduct.stockQty).toBe(3);
  });

  it('handles parallel cancel requests without double-restocking', async () => {
    const { user, authHeader } = await createUserWithToken('cancel-parallel');
    const address = await createAddressForUser(user.id, 'cancel-parallel');
    const product = await createProduct('cancel-parallel', { stockQty: 3 });

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        addressId: address.id,
        status: 'pending',
        subtotal: 20000000,
        shippingFee: 0,
        total: 20000000,
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        unitPrice: 10000000,
        quantity: 2,
        lineTotal: 20000000,
      },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: { stockQty: 1 },
    });

    const [firstRes, secondRes] = await Promise.all([
      request(app)
        .patch(`/api/v1/orders/${order.id}/cancel`)
        .set('Authorization', authHeader),
      request(app)
        .patch(`/api/v1/orders/${order.id}/cancel`)
        .set('Authorization', authHeader),
    ]);

    expect([firstRes.status, secondRes.status].sort()).toEqual([200, 409]);

    const rejectedRes = firstRes.status === 409 ? firstRes : secondRes;
    expect(rejectedRes.body.success).toBe(false);
    expect(rejectedRes.body.error.code).toBe('ORDER_NOT_CANCELLABLE');

    const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updatedOrder.status).toBe('canceled');
    expect(updatedProduct.stockQty).toBe(3);
  });

  it('rejects cancel for non-cancellable order status', async () => {
    const { user, authHeader } = await createUserWithToken('cancel-status');
    const address = await createAddressForUser(user.id, 'cancel-status');
    const product = await createProduct('cancel-status');

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        addressId: address.id,
        status: 'shipped',
        subtotal: 10000000,
        shippingFee: 0,
        total: 10000000,
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        unitPrice: 10000000,
        quantity: 1,
        lineTotal: 10000000,
      },
    });

    const res = await request(app)
      .patch(`/api/v1/orders/${order.id}/cancel`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ORDER_NOT_CANCELLABLE');
  });
});

afterAll(async () => {
  await prisma.$disconnect();
  await rm(isolatedDbPath, { force: true });
});
