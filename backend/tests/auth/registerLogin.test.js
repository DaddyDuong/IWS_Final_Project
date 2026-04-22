import { readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import Database from 'better-sqlite3';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const isolatedDbPath = join(tmpdir(), `laptop-retail-auth-${Date.now()}.db`);

process.env.DATABASE_URL = `file:${isolatedDbPath}`;
process.env.JWT_SECRET = 'auth-test-secret';

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

describe('auth endpoints', () => {
  beforeAll(async () => {
    await applySchemaToDatabase(isolatedDbPath);

    ({ app } = await import('../../src/app.js'));
    ({ prisma } = await import('../../src/lib/prisma.js'));
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it('registers a user and returns jwt token', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'alice@example.com',
      password: 'strong-password',
      fullName: 'Alice Nguyen',
      phone: '0900000000',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toEqual(
      expect.objectContaining({
        email: 'alice@example.com',
        fullName: 'Alice Nguyen',
        role: 'customer',
      }),
    );
  });

  it('logs in with valid credentials and returns jwt token', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'bob@example.com',
      password: 'strong-password',
      fullName: 'Bob Tran',
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'bob@example.com',
      password: 'strong-password',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toEqual(
      expect.objectContaining({
        email: 'bob@example.com',
        fullName: 'Bob Tran',
      }),
    );
  });

  it('returns current user for bearer token', async () => {
    const registerRes = await request(app).post('/api/v1/auth/register').send({
      email: 'carol@example.com',
      password: 'strong-password',
      fullName: 'Carol Le',
    });

    const token = registerRes.body.data.token;

    const meRes = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data).toEqual(
      expect.objectContaining({
        email: 'carol@example.com',
        fullName: 'Carol Le',
      }),
    );
  });

  it('rejects /users/me without bearer token', async () => {
    const res = await request(app).get('/api/v1/users/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await rm(isolatedDbPath, { force: true });
  });
});
