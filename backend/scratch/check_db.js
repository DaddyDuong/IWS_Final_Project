import prismaClientPkg from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const { PrismaClient } = prismaClientPkg;

const databaseUrl = 'file:./prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const product = await prisma.product.findUnique({
    where: { sku: 'dell_1' }
  });
  console.log(JSON.stringify(product, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
