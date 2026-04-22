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

export const internalProductsRoutes = Router();

internalProductsRoutes.use(requireAuth, requireRole('manager'));

internalProductsRoutes.post('/', validateBody(createProductSchema), async (req, res) => {
  const product = await prisma.product.create({ data: req.validatedBody });

  return res.status(201).json({
    success: true,
    data: toProductResponse(product),
  });
});

internalProductsRoutes.patch('/:id', validateBody(updateProductSchema), async (req, res, next) => {
  const existingProduct = await prisma.product.findFirst({
    where: {
      id: req.params.id,
      isDeleted: false,
    },
  });

  if (!existingProduct) {
    return next({ status: 404, message: 'Product not found' });
  }

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: req.validatedBody,
  });

  return res.json({
    success: true,
    data: toProductResponse(product),
  });
});

internalProductsRoutes.delete('/:id', async (req, res, next) => {
  const existingProduct = await prisma.product.findFirst({
    where: {
      id: req.params.id,
      isDeleted: false,
    },
  });

  if (!existingProduct) {
    return next({ status: 404, message: 'Product not found' });
  }

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { isDeleted: true },
  });

  return res.json({
    success: true,
    data: toProductResponse(product),
  });
});
