import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';

let tempDir;
let prisma;
const testSku = `LAP-TEST-${Date.now()}`;

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

describe('product model', () => {
  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'laptop-retail-db-test-'));
    const isolatedDbPath = join(tempDir, 'test.db');
    await applySchemaToDatabase(isolatedDbPath);

    const adapter = new PrismaBetterSqlite3({
      url: `file:${isolatedDbPath}`,
    });
    prisma = new PrismaClient({ adapter });
  });

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
    if (prisma?.product) {
      await prisma.product.deleteMany({ where: { sku: testSku } });
    }
    if (prisma) {
      await prisma.$disconnect();
    }
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
