import { readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const isolatedDbPath = join(tmpdir(), `laptop-retail-addresses-${Date.now()}.db`);

process.env.DATABASE_URL = `file:${isolatedDbPath}`;
process.env.JWT_SECRET = 'addresses-test-secret';

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

function buildAddressPayload(suffix) {
  return {
    receiver: `Receiver ${suffix}`,
    phone: '0900000000',
    line1: `${suffix} line 1`,
    ward: 'Ward 1',
    district: 'District 1',
    city: 'Ho Chi Minh City',
    isDefault: false,
  };
}

describe('addresses CRUD routes', () => {
  beforeAll(async () => {
    await applySchemaToDatabase(isolatedDbPath);
    ({ signAuthToken } = await import('../../src/lib/jwt.js'));
    ({ app } = await import('../../src/app.js'));
    ({ prisma } = await import('../../src/lib/prisma.js'));
  });

  beforeEach(async () => {
    await prisma.order.deleteMany();
    await prisma.address.deleteMany();
    await prisma.user.deleteMany();
  });

  it('returns 401 for unauthenticated access', async () => {
    const getRes = await request(app).get('/api/v1/addresses');
    const postRes = await request(app).post('/api/v1/addresses').send(buildAddressPayload('unauth'));
    const patchRes = await request(app).patch('/api/v1/addresses/any-id').send({ city: 'Da Nang' });
    const deleteRes = await request(app).delete('/api/v1/addresses/any-id');

    expect(getRes.status).toBe(401);
    expect(postRes.status).toBe(401);
    expect(patchRes.status).toBe(401);
    expect(deleteRes.status).toBe(401);
  });

  it('creates, lists, updates, and deletes own address', async () => {
    const { authHeader } = await createUserWithToken('address-owner');

    const createRes = await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', authHeader)
      .send(buildAddressPayload('owner'));

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data).toEqual(
      expect.objectContaining({
        receiver: 'Receiver owner',
        city: 'Ho Chi Minh City',
      }),
    );

    const createdAddressId = createRes.body.data.id;

    const listRes = await request(app)
      .get('/api/v1/addresses')
      .set('Authorization', authHeader);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createdAddressId,
          receiver: 'Receiver owner',
        }),
      ]),
    );

    const updateRes = await request(app)
      .patch(`/api/v1/addresses/${createdAddressId}`)
      .set('Authorization', authHeader)
      .send({ city: 'Da Nang', isDefault: true });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data).toEqual(
      expect.objectContaining({
        id: createdAddressId,
        city: 'Da Nang',
        isDefault: true,
      }),
    );

    const deleteRes = await request(app)
      .delete(`/api/v1/addresses/${createdAddressId}`)
      .set('Authorization', authHeader);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
    expect(deleteRes.body.data).toEqual(expect.objectContaining({ id: createdAddressId }));

    const remainingAddresses = await prisma.address.findMany();
    expect(remainingAddresses).toHaveLength(0);
  });

  it('blocks updates and deletes for addresses used by orders', async () => {
    const { user, authHeader } = await createUserWithToken('address-in-use');

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        ...buildAddressPayload('in-use'),
      },
    });

    await prisma.order.create({
      data: {
        userId: user.id,
        addressId: address.id,
        subtotal: 1000000,
        shippingFee: 0,
        total: 1000000,
      },
    });

    const updateRes = await request(app)
      .patch(`/api/v1/addresses/${address.id}`)
      .set('Authorization', authHeader)
      .send({ city: 'Da Nang' });

    expect(updateRes.status).toBe(409);
    expect(updateRes.body.success).toBe(false);
    expect(updateRes.body.error.code).toBe('ADDRESS_IN_USE');

    const deleteRes = await request(app)
      .delete(`/api/v1/addresses/${address.id}`)
      .set('Authorization', authHeader);

    expect(deleteRes.status).toBe(409);
    expect(deleteRes.body.success).toBe(false);
    expect(deleteRes.body.error.code).toBe('ADDRESS_IN_USE');

    const existingAddress = await prisma.address.findUnique({ where: { id: address.id } });
    expect(existingAddress).toEqual(
      expect.objectContaining({
        id: address.id,
        city: 'Ho Chi Minh City',
      }),
    );
  });

  it('supports pagination and sorting for GET /addresses', async () => {
    const { user, authHeader } = await createUserWithToken('address-paged');

    await prisma.address.create({
      data: {
        userId: user.id,
        ...buildAddressPayload('alpha'),
        receiver: 'Alpha Receiver',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });

    await prisma.address.create({
      data: {
        userId: user.id,
        ...buildAddressPayload('beta'),
        receiver: 'Beta Receiver',
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    });

    await prisma.address.create({
      data: {
        userId: user.id,
        ...buildAddressPayload('gamma'),
        receiver: 'Gamma Receiver',
        createdAt: new Date('2026-01-03T00:00:00.000Z'),
      },
    });

    const res = await request(app)
      .get('/api/v1/addresses')
      .query({
        page: '2',
        limit: '1',
        sortBy: 'receiver',
        sortOrder: 'asc',
      })
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].receiver).toBe('Beta Receiver');
    expect(res.body.meta).toEqual({
      page: 2,
      limit: 1,
      total: 3,
      totalPages: 3,
    });
  });

  it('returns 400 when addresses sortBy is invalid', async () => {
    const { user, authHeader } = await createUserWithToken('address-sort-invalid');

    await prisma.address.create({
      data: {
        userId: user.id,
        ...buildAddressPayload('address-sort-invalid'),
      },
    });

    const res = await request(app)
      .get('/api/v1/addresses')
      .query({ sortBy: 'cityName' })
      .set('Authorization', authHeader);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('prevents cross-user update and delete', async () => {
    const { user: owner } = await createUserWithToken('address-owner-only');
    const { authHeader: otherUserToken } = await createUserWithToken('address-other-user');

    const ownerAddress = await prisma.address.create({
      data: {
        userId: owner.id,
        ...buildAddressPayload('owner-only'),
      },
    });

    const updateRes = await request(app)
      .patch(`/api/v1/addresses/${ownerAddress.id}`)
      .set('Authorization', otherUserToken)
      .send({ city: 'Can Tho' });

    expect(updateRes.status).toBe(404);
    expect(updateRes.body.success).toBe(false);

    const deleteRes = await request(app)
      .delete(`/api/v1/addresses/${ownerAddress.id}`)
      .set('Authorization', otherUserToken);

    expect(deleteRes.status).toBe(404);
    expect(deleteRes.body.success).toBe(false);

    const existingAddress = await prisma.address.findUnique({ where: { id: ownerAddress.id } });
    expect(existingAddress).toBeTruthy();
    expect(existingAddress.city).toBe('Ho Chi Minh City');
  });

  it('validates request payloads', async () => {
    const { authHeader, user } = await createUserWithToken('address-validation');

    const createRes = await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', authHeader)
      .send({
        receiver: 'Receiver',
        phone: '0900000000',
        line1: '1 Main St',
        ward: 'Ward 1',
        district: 'District 1',
      });

    expect(createRes.status).toBe(400);
    expect(createRes.body.success).toBe(false);

    const createdAddress = await prisma.address.create({
      data: {
        userId: user.id,
        ...buildAddressPayload('seeded'),
      },
    });

    const patchRes = await request(app)
      .patch(`/api/v1/addresses/${createdAddress.id}`)
      .set('Authorization', authHeader)
      .send({});

    expect(patchRes.status).toBe(400);
    expect(patchRes.body.success).toBe(false);
  });

  it('sanitizes text fields on address writes', async () => {
    const { authHeader } = await createUserWithToken('address-sanitize');

    const createRes = await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', authHeader)
      .send({
        receiver: '  <Admin> Alice  ',
        phone: '  0900000000  ',
        line1: '  <b>1 Main St</b>  ',
        ward: '  <Ward 1>  ',
        district: '  District 1  ',
        city: '  <Ho Chi Minh City>  ',
        isDefault: false,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data).toEqual(
      expect.objectContaining({
        receiver: 'Admin Alice',
        phone: '0900000000',
        line1: 'b1 Main St/b',
        ward: 'Ward 1',
        district: 'District 1',
        city: 'Ho Chi Minh City',
      }),
    );
  });
});

afterAll(async () => {
  await prisma.$disconnect();
  await rm(isolatedDbPath, { force: true });
});
