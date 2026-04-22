import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validateQuery } from '../middlewares/validate.js';

const sortBySchema = z.enum(['price', 'name', 'createdAt']);
const sortOrderSchema = z.enum(['asc', 'desc']);

function parseInteger(value) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : Number.NaN;
  }

  if (typeof value !== 'string') {
    return Number.NaN;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? Number.NaN : parsed;
}

function parseBoolean(value) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'n'].includes(normalized)) {
    return false;
  }

  return undefined;
}

const listProductsQuerySchema = z.object({
  page: z.preprocess(parseInteger, z.number().int().min(1).default(1)),
  limit: z.preprocess(parseInteger, z.number().int().min(1).max(100).default(10)),
  sortBy: sortBySchema.default('createdAt'),
  sortOrder: sortOrderSchema.default('desc'),
  q: z.string().trim().min(1).optional(),
  brand: z.string().trim().min(1).optional(),
  cpu: z.string().trim().min(1).optional(),
  ram: z.preprocess(parseInteger, z.number().int().positive().optional()),
  storage: z.preprocess(parseInteger, z.number().int().positive().optional()),
  minPrice: z.preprocess(parseInteger, z.number().int().min(0).optional()),
  maxPrice: z.preprocess(parseInteger, z.number().int().min(0).optional()),
  inStock: z.preprocess(parseBoolean, z.boolean().optional()),
}).refine(
  (query) => query.minPrice === undefined || query.maxPrice === undefined || query.minPrice <= query.maxPrice,
  {
    message: 'minPrice must be less than or equal to maxPrice',
    path: ['minPrice'],
  },
);

function toPublicProduct(product) {
  return {
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
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function buildProductWhereClause(query) {
  const where = { isDeleted: false };

  if (query.q) {
    where.OR = [
      { name: { contains: query.q } },
      { brand: { contains: query.q } },
      { cpu: { contains: query.q } },
      { description: { contains: query.q } },
    ];
  }

  if (query.brand) {
    where.brand = { contains: query.brand };
  }

  if (query.cpu) {
    where.cpu = { contains: query.cpu };
  }

  if (query.ram !== undefined) {
    where.ramGb = query.ram;
  }

  if (query.storage !== undefined) {
    where.storageGb = query.storage;
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {};

    if (query.minPrice !== undefined) {
      where.price.gte = query.minPrice;
    }

    if (query.maxPrice !== undefined) {
      where.price.lte = query.maxPrice;
    }
  }

  if (query.inStock !== undefined) {
    where.stockQty = query.inStock ? { gt: 0 } : { lte: 0 };
  }

  return where;
}

export const productsRoutes = Router();

productsRoutes.get('/', validateQuery(listProductsQuerySchema), async (req, res) => {
  const query = req.validatedQuery;
  const skip = (query.page - 1) * query.limit;
  const where = buildProductWhereClause(query);

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy: {
        [query.sortBy]: query.sortOrder,
      },
      skip,
      take: query.limit,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);

  return res.json({
    success: true,
    data: products.map(toPublicProduct),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
    },
  });
});

productsRoutes.get('/:id', async (req, res, next) => {
  const product = await prisma.product.findFirst({
    where: {
      id: req.params.id,
      isDeleted: false,
    },
  });

  if (!product) {
    return next({ status: 404, message: 'Product not found' });
  }

  return res.json({
    success: true,
    data: toPublicProduct(product),
  });
});
