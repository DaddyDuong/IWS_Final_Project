import { readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import Database from 'better-sqlite3';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const isolatedDbPath = join(tmpdir(), `laptop-retail-forgot-reset-${Date.now()}.db`);

process.env.DATABASE_URL = `file:${isolatedDbPath}`;
process.env.JWT_SECRET = 'forgot-reset-test-secret';

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

describe('forgot and reset password endpoints', () => {
  beforeAll(async () => {
    await applySchemaToDatabase(isolatedDbPath);

    ({ app } = await import('../../src/app.js'));
    ({ prisma } = await import('../../src/lib/prisma.js'));
  });

  beforeEach(async () => {
    delete process.env.ENABLE_DEMO_RESET_TOKEN;
    await prisma.passwordResetToken.deleteMany();
    await prisma.user.deleteMany();
  });

  it('does not return demo reset token when demo flag is disabled', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'hidden-token@example.com',
      password: 'old-password-123',
      fullName: 'Hidden Token',
    });

    const forgotRes = await request(app).post('/api/v1/auth/forgot-password').send({
      email: 'hidden-token@example.com',
    });

    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.success).toBe(true);
    expect(forgotRes.body.data.demoResetToken).toBeUndefined();
  });

  it('resets password with issued demo token when demo flag is enabled', async () => {
    process.env.ENABLE_DEMO_RESET_TOKEN = 'true';

    await request(app).post('/api/v1/auth/register').send({
      email: 'resettable@example.com',
      password: 'old-password-123',
      fullName: 'Reset Table',
    });

    const forgotRes = await request(app).post('/api/v1/auth/forgot-password').send({
      email: 'resettable@example.com',
    });

    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.success).toBe(true);
    expect(forgotRes.body.data.demoResetToken).toEqual(expect.any(String));

    const tokenRecord = await prisma.passwordResetToken.findFirst();
    expect(tokenRecord).not.toBeNull();
    expect(tokenRecord.tokenHash).not.toBe(forgotRes.body.data.demoResetToken);

    const resetRes = await request(app).post('/api/v1/auth/reset-password').send({
      token: forgotRes.body.data.demoResetToken,
      newPassword: 'new-password-123',
    });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    const loginWithOldPassword = await request(app).post('/api/v1/auth/login').send({
      email: 'resettable@example.com',
      password: 'old-password-123',
    });

    expect(loginWithOldPassword.status).toBe(401);

    const loginWithNewPassword = await request(app).post('/api/v1/auth/login').send({
      email: 'resettable@example.com',
      password: 'new-password-123',
    });

    expect(loginWithNewPassword.status).toBe(200);

    const usedToken = await prisma.passwordResetToken.findFirst();
    expect(usedToken.usedAt).not.toBeNull();
  });

  it('invalidates all other active tokens after successful reset', async () => {
    process.env.ENABLE_DEMO_RESET_TOKEN = 'true';

    await request(app).post('/api/v1/auth/register').send({
      email: 'multi-token@example.com',
      password: 'old-password-123',
      fullName: 'Multi Token',
    });

    const firstForgotRes = await request(app).post('/api/v1/auth/forgot-password').send({
      email: 'multi-token@example.com',
    });
    const secondForgotRes = await request(app).post('/api/v1/auth/forgot-password').send({
      email: 'multi-token@example.com',
    });

    const firstToken = firstForgotRes.body.data.demoResetToken;
    const secondToken = secondForgotRes.body.data.demoResetToken;

    expect(firstToken).toEqual(expect.any(String));
    expect(secondToken).toEqual(expect.any(String));

    const firstResetRes = await request(app).post('/api/v1/auth/reset-password').send({
      token: firstToken,
      newPassword: 'new-password-123',
    });

    expect(firstResetRes.status).toBe(200);
    expect(firstResetRes.body.success).toBe(true);

    const secondResetRes = await request(app).post('/api/v1/auth/reset-password').send({
      token: secondToken,
      newPassword: 'another-password-123',
    });

    expect(secondResetRes.status).toBe(400);
    expect(secondResetRes.body.success).toBe(false);

    const activeTokens = await prisma.passwordResetToken.findMany({
      where: {
        user: { email: 'multi-token@example.com' },
        usedAt: null,
      },
    });
    expect(activeTokens).toHaveLength(0);
  });

  it('rejects reset for invalid token', async () => {
    const resetRes = await request(app).post('/api/v1/auth/reset-password').send({
      token: 'not-a-valid-token',
      newPassword: 'new-password-123',
    });

    expect(resetRes.status).toBe(400);
    expect(resetRes.body.success).toBe(false);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await rm(isolatedDbPath, { force: true });
  });
});
