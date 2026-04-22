import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';

const createProductSchema = z.object({
  sku: z.string().trim().min(1),
  name: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  cpu: z.string().trim().min(1),
  ramGb: z.number().int().positive(),
  storageGb: z.number().int().positive(),
  screenSize: z.string().trim().min(1),
  price: z.number().int().min(0),
  stockQty: z.number().int().min(0),
  description: z.string().trim().min(1),
  imageUrl: z.url(),
});

const updateProductSchema = z.object({
  sku: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  brand: z.string().trim().min(1).optional(),
  cpu: z.string().trim().min(1).optional(),
  ramGb: z.number().int().positive().optional(),
  storageGb: z.number().int().positive().optional(),
  screenSize: z.string().trim().min(1).optional(),
  price: z.number().int().min(0).optional(),
  stockQty: z.number().int().min(0).optional(),
  description: z.string().trim().min(1).optional(),
  imageUrl: z.url().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required',
});

function toProductResponse(product) {
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
    isDeleted: product.isDeleted,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function isSkuConflict(err) {
  if (!err || typeof err !== 'object' || err.code !== 'P2002') {
    return false;
  }

  if (Array.isArray(err.meta?.target)) {
    return err.meta.target.length === 0 || err.meta.target.includes('sku');
  }

  if (!err.meta?.target) {
    return true;
  }

  return `${err.meta.target}`.toLowerCase().includes('sku');
}

export const internalProductsRoutes = Router();

internalProductsRoutes.use(requireAuth, requireRole('manager'));

internalProductsRoutes.post('/', validateBody(createProductSchema), async (req, res, next) => {
  let product;

  try {
    product = await prisma.product.create({ data: req.validatedBody });
  } catch (err) {
    if (isSkuConflict(err)) {
      return next({ status: 409, code: 'SKU_EXISTS', message: 'SKU already exists' });
    }

    return next(err);
  }

  return res.status(201).json({
    success: true,
    data: toProductResponse(product),
  });
});

internalProductsRoutes.patch('/:id', validateBody(updateProductSchema), async (req, res, next) => {
  let updateResult;

  try {
    updateResult = await prisma.product.updateMany({
      where: {
        id: req.params.id,
        isDeleted: false,
      },
      data: req.validatedBody,
    });
  } catch (err) {
    if (isSkuConflict(err)) {
      return next({ status: 409, code: 'SKU_EXISTS', message: 'SKU already exists' });
    }

    return next(err);
  }

  if (updateResult.count === 0) {
    return next({ status: 404, message: 'Product not found' });
  }

  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
  });

  if (!product) {
    return next({ status: 404, message: 'Product not found' });
  }

  return res.json({
    success: true,
    data: toProductResponse(product),
  });
});

internalProductsRoutes.delete('/:id', async (req, res, next) => {
  const softDeleteResult = await prisma.product.updateMany({
    where: {
      id: req.params.id,
      isDeleted: false,
    },
    data: { isDeleted: true },
  });

  if (softDeleteResult.count === 0) {
    return next({ status: 404, message: 'Product not found' });
  }

  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
  });

  if (!product) {
    return next({ status: 404, message: 'Product not found' });
  }

  return res.json({
    success: true,
    data: toProductResponse(product),
  });
});
