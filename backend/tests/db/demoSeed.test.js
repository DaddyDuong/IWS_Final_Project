import { execFile } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';

const execFileAsync = promisify(execFile);

let tempDir;
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

async function runSeed(dbPath, reset = false) {
  const args = ['prisma/seed.js'];
  if (reset) {
    args.push('--reset');
  }

  await execFileAsync('node', args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: `file:${dbPath}`,
    },
  });
}

async function runResetScript(dbPath) {
  await execFileAsync('npm', ['run', 'prisma:seed:reset'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: `file:${dbPath}`,
    },
  });
}

async function snapshotDemoDataset() {
  const [users, products, addresses, cartItems, orders, reviews] = await Promise.all([
    prisma.user.findMany({ orderBy: { email: 'asc' } }),
    prisma.product.findMany({ orderBy: { sku: 'asc' } }),
    prisma.address.findMany({ orderBy: [{ userId: 'asc' }, { createdAt: 'asc' }] }),
    prisma.cartItem.findMany({ orderBy: [{ userId: 'asc' }, { productId: 'asc' }] }),
    prisma.order.findMany({
      orderBy: { placedAt: 'asc' },
      include: { items: { orderBy: { productId: 'asc' } } },
    }),
    prisma.review.findMany({ orderBy: [{ userId: 'asc' }, { productId: 'asc' }] }),
  ]);

  const userById = new Map(users.map((user) => [user.id, user]));
  const productById = new Map(products.map((product) => [product.id, product]));
  const addressById = new Map(addresses.map((address) => [address.id, address]));

  return {
    users: users.map(({ email, fullName, phone, role }) => ({ email, fullName, phone, role })),
    products: products.map(({ sku, name, price, stockQty, isDeleted }) => ({
      sku,
      name,
      price,
      stockQty,
      isDeleted,
    })),
    addresses: addresses.map((address) => ({
      userEmail: userById.get(address.userId)?.email,
      receiver: address.receiver,
      phone: address.phone,
      line1: address.line1,
      ward: address.ward,
      district: address.district,
      city: address.city,
      isDefault: address.isDefault,
    })),
    cartItems: cartItems.map((item) => ({
      userEmail: userById.get(item.userId)?.email,
      productSku: productById.get(item.productId)?.sku,
      quantity: item.quantity,
    })),
    orders: orders.map((order) => ({
      userEmail: userById.get(order.userId)?.email,
      addressLine1: addressById.get(order.addressId)?.line1,
      status: order.status,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
      items: order.items.map((item) => ({
        productSku: productById.get(item.productId)?.sku,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
    })),
    reviews: reviews.map((review) => ({
      userEmail: userById.get(review.userId)?.email,
      productSku: productById.get(review.productId)?.sku,
      rating: review.rating,
      comment: review.comment,
    })),
  };
}

describe('demo seed', () => {
  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'laptop-retail-demo-seed-test-'));
    const isolatedDbPath = join(tempDir, 'test.db');
    await applySchemaToDatabase(isolatedDbPath);

    const adapter = new PrismaBetterSqlite3({
      url: `file:${isolatedDbPath}`,
    });
    prisma = new PrismaClient({ adapter });
  });

  it('recreates the same demo dataset with reset mode', async () => {
    const dbPath = join(tempDir, 'test.db');

    await runSeed(dbPath, true);
    const firstSnapshot = await snapshotDemoDataset();

    await prisma.user.create({
      data: {
        email: 'rogue@local.test',
        passwordHash: 'rogue-hash',
        fullName: 'Rogue User',
        role: 'customer',
      },
    });

    await runSeed(dbPath, true);
    const secondSnapshot = await snapshotDemoDataset();

    expect(secondSnapshot).toEqual(firstSnapshot);
    expect(secondSnapshot.users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          email: 'manager@laptop.local',
          role: 'manager',
        }),
        expect.objectContaining({
          email: 'demo.customer@laptop.local',
          role: 'customer',
        }),
      ]),
    );
    expect(secondSnapshot.addresses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userEmail: 'demo.customer@laptop.local' }),
      ]),
    );
    expect(secondSnapshot.cartItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userEmail: 'demo.customer@laptop.local' }),
      ]),
    );
    expect(secondSnapshot.orders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userEmail: 'demo.customer@laptop.local' }),
      ]),
    );
    expect(secondSnapshot.reviews).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userEmail: 'demo.customer@laptop.local' }),
      ]),
    );
  });

  it('can reset and seed a fresh database through the npm script', async () => {
    const freshDir = await mkdtemp(join(tmpdir(), 'laptop-retail-demo-seed-fresh-'));
    const freshDbPath = join(freshDir, 'fresh.db');

    try {
      await runResetScript(freshDbPath);

      const freshAdapter = new PrismaBetterSqlite3({
        url: `file:${freshDbPath}`,
      });
      const freshPrisma = new PrismaClient({ adapter: freshAdapter });

      try {
        expect(await freshPrisma.user.findUnique({ where: { email: 'demo.customer@laptop.local' } })).toBeTruthy();
        expect(await freshPrisma.order.count()).toBeGreaterThan(0);
        expect(await freshPrisma.review.count()).toBeGreaterThan(0);
      } finally {
        await freshPrisma.$disconnect();
      }
    } finally {
      await rm(freshDir, { recursive: true, force: true });
    }
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
