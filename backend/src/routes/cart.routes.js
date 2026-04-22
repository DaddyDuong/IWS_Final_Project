import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';

const addCartItemSchema = z.object({
  productId: z.string().trim().min(1),
  quantity: z.number().int().positive(),
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});

const cartItemSelect = {
  id: true,
  userId: true,
  productId: true,
  quantity: true,
  createdAt: true,
  updatedAt: true,
  product: {
    select: {
      id: true,
      sku: true,
      name: true,
      brand: true,
      price: true,
      stockQty: true,
      imageUrl: true,
    },
  },
};

export const cartRoutes = Router();

cartRoutes.use(requireAuth);

cartRoutes.get('/', async (req, res) => {
  const items = await prisma.cartItem.findMany({
    where: {
      userId: req.authUser.id,
      product: {
        isDeleted: false,
      },
    },
    select: cartItemSelect,
    orderBy: { createdAt: 'desc' },
  });

  return res.json({
    success: true,
    data: { items },
  });
});

cartRoutes.post('/items', validateBody(addCartItemSchema), async (req, res, next) => {
  const { productId, quantity } = req.validatedBody;

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isDeleted: false,
    },
    select: { id: true },
  });

  if (!product) {
    return next({ status: 404, message: 'Product not found' });
  }

  const existing = await prisma.cartItem.findUnique({
    where: {
      userId_productId: {
        userId: req.authUser.id,
        productId,
      },
    },
    select: { id: true },
  });

  const cartItem = await prisma.cartItem.upsert({
    where: {
      userId_productId: {
        userId: req.authUser.id,
        productId,
      },
    },
    create: {
      userId: req.authUser.id,
      productId,
      quantity,
    },
    update: {
      quantity: {
        increment: quantity,
      },
    },
    select: cartItemSelect,
  });

  return res.status(existing ? 200 : 201).json({
    success: true,
    data: cartItem,
  });
});

cartRoutes.patch('/items/:id', validateBody(updateCartItemSchema), async (req, res, next) => {
  const updateResult = await prisma.cartItem.updateMany({
    where: {
      id: req.params.id,
      userId: req.authUser.id,
    },
    data: {
      quantity: req.validatedBody.quantity,
    },
  });

  if (updateResult.count === 0) {
    return next({ status: 404, message: 'Cart item not found' });
  }

  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: req.params.id,
      userId: req.authUser.id,
    },
    select: cartItemSelect,
  });

  return res.json({
    success: true,
    data: cartItem,
  });
});

cartRoutes.delete('/items/:id', async (req, res, next) => {
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      id: req.params.id,
      userId: req.authUser.id,
    },
    select: cartItemSelect,
  });

  if (!existingItem) {
    return next({ status: 404, message: 'Cart item not found' });
  }

  await prisma.cartItem.delete({
    where: {
      id: existingItem.id,
    },
  });

  return res.json({
    success: true,
    data: existingItem,
  });
});
