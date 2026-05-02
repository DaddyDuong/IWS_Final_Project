import bcrypt from 'bcryptjs';
import prismaClientPkg from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const { PrismaClient } = prismaClientPkg;

const databaseUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });
const shouldReset = process.argv.includes('--reset');

const accounts = {
  manager: {
    email: 'manager@laptop.local',
    password: 'Manager@123',
    fullName: 'Store Manager',
    role: 'manager',
  },
  customer: {
    email: 'demo.customer@laptop.local',
    password: 'DemoCustomer@123',
    fullName: 'Demo Customer',
    phone: '0900000000',
    role: 'customer',
  },
};

const sampleProducts = [
  {
    sku: 'DEMO-001',
    name: 'Dell XPS 14 (9440)',
    brand: 'Dell',
    cpu: 'Intel Core Ultra 7 155H',
    ramGb: 16,
    storageGb: 512,
    screenSize: '14.5',
    price: 19990000,
    stockQty: 8,
    description: 'Premium 14-inch productivity machine with modern industrial design.',
    imageUrl: 'https://example.com/dell-xps-14.png',
  },
  {
    sku: 'DEMO-002',
    name: 'ThinkPad X1 Carbon Gen 12',
    brand: 'Lenovo',
    cpu: 'Intel Core Ultra 7 155U',
    ramGb: 16,
    storageGb: 512,
    screenSize: '14.0',
    price: 17490000,
    stockQty: 7,
    description: 'Business-focused ultralight laptop with durable premium chassis.',
    imageUrl: 'https://example.com/thinkpad-x1-carbon.png',
  },
  {
    sku: 'DEMO-003',
    name: 'HP Spectre x360 14 (2024)',
    brand: 'HP',
    cpu: 'Intel Core Ultra 7 155H',
    ramGb: 16,
    storageGb: 1024,
    screenSize: '14.0',
    price: 15990000,
    stockQty: 9,
    description: 'Premium 2-in-1 laptop with convertible flexibility.',
    imageUrl: 'https://example.com/hp-spectre-x360.png',
  },
];

async function clearDatabase(tx) {
  await tx.review.deleteMany();
  await tx.orderItem.deleteMany();
  await tx.order.deleteMany();
  await tx.cartItem.deleteMany();
  await tx.address.deleteMany();
  await tx.passwordResetToken.deleteMany();
  await tx.user.deleteMany();
  await tx.product.deleteMany();
}

async function seedAccount(tx, account) {
  const passwordHash = await bcrypt.hash(account.password, 10);

  return tx.user.upsert({
    where: { email: account.email },
    update: {
      passwordHash,
      fullName: account.fullName,
      phone: account.phone ?? null,
      role: account.role,
    },
    create: {
      email: account.email,
      passwordHash,
      fullName: account.fullName,
      phone: account.phone ?? null,
      role: account.role,
    },
  });
}

async function seedDemoJourney(tx, customer, products) {
  const address = await tx.address.create({
    data: {
      userId: customer.id,
      receiver: customer.fullName,
      phone: customer.phone,
      line1: '123 Demo Street',
      ward: 'Ward 1',
      district: 'District 1',
      city: 'Ho Chi Minh City',
      isDefault: true,
    },
  });

  await tx.cartItem.createMany({
    data: [
      { userId: customer.id, productId: products[0].id, quantity: 1 },
      { userId: customer.id, productId: products[1].id, quantity: 2 },
    ],
  });

  await tx.order.create({
    data: {
      userId: customer.id,
      addressId: address.id,
      status: 'delivered',
      subtotal: products[0].price + products[1].price * 2,
      shippingFee: 0,
      total: products[0].price + products[1].price * 2,
      items: {
        create: [
          {
            productId: products[0].id,
            unitPrice: products[0].price,
            quantity: 1,
            lineTotal: products[0].price,
          },
          {
            productId: products[1].id,
            unitPrice: products[1].price,
            quantity: 2,
            lineTotal: products[1].price * 2,
          },
        ],
      },
    },
  });

  await tx.review.createMany({
    data: [
      {
        userId: customer.id,
        productId: products[0].id,
        rating: 5,
        comment: 'Fast delivery and great build quality.',
      },
      {
        userId: customer.id,
        productId: products[1].id,
        rating: 4,
        comment: 'Excellent keyboard and battery life.',
      },
    ],
  });
}

async function main() {
  await prisma.$transaction(async (tx) => {
    if (shouldReset) {
      await clearDatabase(tx);
    }

    const manager = await seedAccount(tx, accounts.manager);

    for (const product of sampleProducts) {
      await tx.product.upsert({
        where: { sku: product.sku },
        update: product,
        create: product,
      });
    }

    if (shouldReset) {
      const seededProducts = await tx.product.findMany({
        where: { sku: { in: sampleProducts.map((product) => product.sku) } },
        orderBy: { sku: 'asc' },
      });
      const demoCustomer = await seedAccount(tx, accounts.customer);

      await seedDemoJourney(tx, demoCustomer, seededProducts);

      await tx.user.update({
        where: { id: manager.id },
        data: { role: 'manager' },
      });
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
