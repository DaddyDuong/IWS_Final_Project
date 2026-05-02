import { readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const isolatedDbPath = join(tmpdir(), `laptop-retail-frontend-contracts-${Date.now()}.db`)

process.env.DATABASE_URL = `file:${isolatedDbPath}`
process.env.JWT_SECRET = 'frontend-contract-secret'

let app
let prisma

function signAuthToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

async function applySchemaToDatabase(dbPath) {
  const migrationsDir = join(process.cwd(), 'prisma', 'migrations')
  const entries = await readdir(migrationsDir, { withFileTypes: true })
  const migrationDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  const db = new Database(dbPath)
  try {
    for (const migrationDir of migrationDirs) {
      const migrationSqlPath = join(migrationsDir, migrationDir, 'migration.sql')
      const migrationSql = await readFile(migrationSqlPath, 'utf8')
      db.exec(migrationSql)
    }
  } finally {
    db.close()
  }
}

async function createCustomer(emailPrefix) {
  return prisma.user.create({
    data: {
      email: `${emailPrefix}-${Date.now()}@example.com`,
      passwordHash: 'not-used-in-this-test',
      fullName: `${emailPrefix} user`,
      role: 'customer',
    },
  })
}

async function createProduct(suffix) {
  return prisma.product.create({
    data: {
      sku: `CONTRACT-${suffix}-${Date.now()}`,
      name: `Contract Product ${suffix}`,
      brand: 'ContractBrand',
      cpu: 'Intel Core Ultra 7',
      ramGb: 16,
      storageGb: 512,
      screenSize: '14.0',
      price: 19990000,
      stockQty: 8,
      description: `Contract test product ${suffix}`,
      imageUrl: `https://example.com/contract-${suffix}.jpg`,
    },
  })
}

async function createAddress(userId, suffix) {
  return prisma.address.create({
    data: {
      userId,
      receiver: `Receiver ${suffix}`,
      phone: '0900000000',
      line1: `${suffix} line 1`,
      ward: 'Ward 1',
      district: 'District 1',
      city: 'Ho Chi Minh City',
      isDefault: true,
    },
  })
}

describe('frontend API contracts', () => {
  beforeAll(async () => {
    await applySchemaToDatabase(isolatedDbPath)
    ;({ app } = await import('../../src/app.js'))
    ;({ prisma } = await import('../../src/lib/prisma.js'))
  })

  beforeEach(async () => {
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.cartItem.deleteMany()
    await prisma.review.deleteMany()
    await prisma.address.deleteMany()
    await prisma.product.deleteMany()
    await prisma.user.deleteMany()
    await prisma.passwordResetToken.deleteMany()
  })

  it('returns the product fields the catalog and detail pages consume', async () => {
    const product = await createProduct('catalog')

    const listRes = await request(app).get('/api/v1/products').query({ limit: '1' })
    const detailRes = await request(app).get(`/api/v1/products/${product.id}`)

    expect(listRes.status).toBe(200)
    expect(listRes.body.data[0]).toEqual(
      expect.objectContaining({
        id: product.id,
        sku: product.sku,
        name: product.name,
        brand: product.brand,
        cpu: product.cpu,
        ramGb: product.ramGb,
        storageGb: product.storageGb,
        screenSize: product.screenSize,
        price: product.price,
        stockQty: product.stockQty,
        description: product.description,
        imageUrl: product.imageUrl,
      }),
    )
    expect(listRes.body.meta).toEqual(
      expect.objectContaining({
        page: 1,
        limit: 1,
        total: 1,
        totalPages: 1,
      }),
    )

    expect(detailRes.status).toBe(200)
    expect(detailRes.body.data).toEqual(
      expect.objectContaining({
        id: product.id,
        sku: product.sku,
        name: product.name,
        brand: product.brand,
        cpu: product.cpu,
        ramGb: product.ramGb,
        storageGb: product.storageGb,
        screenSize: product.screenSize,
        price: product.price,
        stockQty: product.stockQty,
        description: product.description,
        imageUrl: product.imageUrl,
      }),
    )
  })

  it('returns the cart item shape the cart page renders', async () => {
    const user = await createCustomer('cart-contract')
    const authHeader = `Bearer ${signAuthToken(user)}`
    const product = await createProduct('cart')

    await prisma.cartItem.create({
      data: {
        userId: user.id,
        productId: product.id,
        quantity: 2,
      },
    })

    const res = await request(app).get('/api/v1/cart').set('Authorization', authHeader)

    expect(res.status).toBe(200)
    expect(res.body.data.items[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        userId: user.id,
        productId: product.id,
        quantity: 2,
        product: expect.objectContaining({
          id: product.id,
          sku: product.sku,
          name: product.name,
          brand: product.brand,
          cpu: product.cpu,
          ramGb: product.ramGb,
          storageGb: product.storageGb,
          price: product.price,
          stockQty: product.stockQty,
          imageUrl: product.imageUrl,
        }),
      }),
    )
    expect(res.body.meta).toEqual(
      expect.objectContaining({
        page: 1,
        total: 1,
      }),
    )
  })

  it('returns the address shape the checkout page renders', async () => {
    const user = await createCustomer('address-contract')
    const authHeader = `Bearer ${signAuthToken(user)}`
    const address = await createAddress(user.id, 'contract')

    const res = await request(app).get('/api/v1/addresses').set('Authorization', authHeader)

    expect(res.status).toBe(200)
    expect(res.body.data[0]).toEqual(
      expect.objectContaining({
        id: address.id,
        userId: user.id,
        receiver: address.receiver,
        phone: address.phone,
        line1: address.line1,
        ward: address.ward,
        district: address.district,
        city: address.city,
        isDefault: true,
      }),
    )
  })

  it('returns the checkout order shape the checkout flow navigates to', async () => {
    const user = await createCustomer('checkout-contract')
    const authHeader = `Bearer ${signAuthToken(user)}`
    const product = await createProduct('checkout')
    const address = await createAddress(user.id, 'checkout')

    await prisma.cartItem.create({
      data: {
        userId: user.id,
        productId: product.id,
        quantity: 1,
      },
    })

    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .set('Authorization', authHeader)
      .send({ addressId: address.id })

    expect(res.status).toBe(201)
    expect(res.body.data).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        userId: user.id,
        addressId: address.id,
        status: 'pending',
        subtotal: product.price,
        shippingFee: 0,
        total: product.price,
        address: expect.objectContaining({
          id: address.id,
          receiver: address.receiver,
          phone: address.phone,
          line1: address.line1,
          ward: address.ward,
          district: address.district,
          city: address.city,
        }),
        items: [
          expect.objectContaining({
            productId: product.id,
            unitPrice: product.price,
            quantity: 1,
            lineTotal: product.price,
            product: expect.objectContaining({
              id: product.id,
              sku: product.sku,
              name: product.name,
              imageUrl: product.imageUrl,
            }),
          }),
        ],
      }),
    )
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
    await rm(isolatedDbPath, { force: true })
  })
})
