import { readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const isolatedDbPath = join(tmpdir(), `laptop-retail-reviews-${Date.now()}.db`);

process.env.DATABASE_URL = `file:${isolatedDbPath}`;
process.env.JWT_SECRET = 'reviews-test-secret';

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
      sku: `REVIEW-${suffix}-${Date.now()}`,
      name: `Review Product ${suffix}`,
      brand: 'ReviewBrand',
      cpu: 'Intel Core i5',
      ramGb: 8,
      storageGb: 256,
      screenSize: '14',
      price: 11000000,
      stockQty: 10,
      description: `Review test product ${suffix}`,
      imageUrl: `https://example.com/review-${suffix}.jpg`,
      ...overrides,
    },
  });
}

describe('reviews CRUD routes', () => {
  beforeAll(async () => {
    await applySchemaToDatabase(isolatedDbPath);
    ({ signAuthToken } = await import('../../src/lib/jwt.js'));
    ({ app } = await import('../../src/app.js'));
    ({ prisma } = await import('../../src/lib/prisma.js'));
  });

  beforeEach(async () => {
    await prisma.review.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
  });

  it('returns 401 for unauthenticated write operations', async () => {
    const product = await createProduct('unauth');

    const postRes = await request(app)
      .post(`/api/v1/products/${product.id}/reviews`)
      .send({ rating: 5, comment: 'Great laptop' });
    const patchRes = await request(app)
      .patch('/api/v1/reviews/any-id')
      .send({ rating: 4, comment: 'Updated' });
    const deleteRes = await request(app).delete('/api/v1/reviews/any-id');

    expect(postRes.status).toBe(401);
    expect(patchRes.status).toBe(401);
    expect(deleteRes.status).toBe(401);
  });

  it('returns 404 when listing reviews for missing product', async () => {
    const res = await request(app).get('/api/v1/products/missing-product-id/reviews');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('creates, lists, updates, and deletes own review', async () => {
    const { authHeader } = await createUserWithToken('review-owner');
    const product = await createProduct('flow');

    const createRes = await request(app)
      .post(`/api/v1/products/${product.id}/reviews`)
      .set('Authorization', authHeader)
      .send({ rating: 5, comment: 'Excellent for coding work' });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data).toEqual(
      expect.objectContaining({
        productId: product.id,
        rating: 5,
        comment: 'Excellent for coding work',
      }),
    );

    const reviewId = createRes.body.data.id;

    const listRes = await request(app).get(`/api/v1/products/${product.id}/reviews`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: reviewId,
          productId: product.id,
          rating: 5,
        }),
      ]),
    );

    const updateRes = await request(app)
      .patch(`/api/v1/reviews/${reviewId}`)
      .set('Authorization', authHeader)
      .send({ rating: 4, comment: 'Still good after one week' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data).toEqual(
      expect.objectContaining({
        id: reviewId,
        rating: 4,
        comment: 'Still good after one week',
      }),
    );

    const deleteRes = await request(app)
      .delete(`/api/v1/reviews/${reviewId}`)
      .set('Authorization', authHeader);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
    expect(deleteRes.body.data).toEqual(expect.objectContaining({ id: reviewId }));

    const remainingReviews = await prisma.review.findMany();
    expect(remainingReviews).toHaveLength(0);
  });

  it('prevents cross-user review mutations', async () => {
    const { user: owner } = await createUserWithToken('review-owner-only');
    const { authHeader: otherUserToken } = await createUserWithToken('review-other');
    const product = await createProduct('owner-only');

    const ownerReview = await prisma.review.create({
      data: {
        userId: owner.id,
        productId: product.id,
        rating: 5,
        comment: 'Owner review',
      },
    });

    const updateRes = await request(app)
      .patch(`/api/v1/reviews/${ownerReview.id}`)
      .set('Authorization', otherUserToken)
      .send({ rating: 2, comment: 'Hijacked' });

    expect(updateRes.status).toBe(404);
    expect(updateRes.body.success).toBe(false);

    const deleteRes = await request(app)
      .delete(`/api/v1/reviews/${ownerReview.id}`)
      .set('Authorization', otherUserToken);

    expect(deleteRes.status).toBe(404);
    expect(deleteRes.body.success).toBe(false);

    const existingReview = await prisma.review.findUnique({ where: { id: ownerReview.id } });
    expect(existingReview).toBeTruthy();
    expect(existingReview.rating).toBe(5);
  });

  it('validates review payload and duplicate creation', async () => {
    const { authHeader, user } = await createUserWithToken('review-validation');
    const product = await createProduct('validation');

    const invalidCreateRes = await request(app)
      .post(`/api/v1/products/${product.id}/reviews`)
      .set('Authorization', authHeader)
      .send({ rating: 6, comment: '' });

    expect(invalidCreateRes.status).toBe(400);
    expect(invalidCreateRes.body.success).toBe(false);

    await prisma.review.create({
      data: {
        userId: user.id,
        productId: product.id,
        rating: 5,
        comment: 'Existing review',
      },
    });

    const duplicateRes = await request(app)
      .post(`/api/v1/products/${product.id}/reviews`)
      .set('Authorization', authHeader)
      .send({ rating: 4, comment: 'Duplicate attempt' });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.error.code).toBe('REVIEW_EXISTS');

    const invalidPatchRes = await request(app)
      .patch('/api/v1/reviews/any-id')
      .set('Authorization', authHeader)
      .send({});

    expect(invalidPatchRes.status).toBe(400);
    expect(invalidPatchRes.body.success).toBe(false);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
  await rm(isolatedDbPath, { force: true });
});
