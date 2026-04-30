import { Router } from 'express';
import { z } from 'zod';
import { buildListMeta, buildListQuerySchema, getListSkip } from '../lib/listQuery.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/auth.js';
import { validateBody, validateQuery } from '../middlewares/validate.js';

const addCartItemSchema = z.object({
  productId: z.string().trim().min(1),
  quantity: z.number().int().positive().max(100),
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().positive().max(100),
});

const listCartQuerySchema = buildListQuerySchema({
  sortByValues: ['createdAt', 'updatedAt'],
  defaultSortBy: 'createdAt',
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

cartRoutes.get('/', validateQuery(listCartQuerySchema), async (req, res) => {
  const query = req.validatedQuery;
  const where = {
    userId: req.authUser.id,
    product: {
      isDeleted: false,
    },
  };
  const skip = getListSkip(query.page, query.limit);

  const [items, total] = await prisma.$transaction([
    prisma.cartItem.findMany({
      where,
      select: cartItemSelect,
      orderBy: {
        [query.sortBy]: query.sortOrder,
      },
      skip,
      take: query.limit,
    }),
    prisma.cartItem.count({ where }),
  ]);

  return res.json({
    success: true,
    data: { items },
    meta: buildListMeta({
      page: query.page,
      limit: query.limit,
      total,
    }),
  });
});

cartRoutes.post('/items', validateBody(addCartItemSchema), async (req, res, next) => {
  const { productId, quantity } = req.validatedBody;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { isDeleted: true, stockQty: true },
      });

      if (!product) {
        throw { status: 404, message: 'Product not found' };
      }

      if (product.isDeleted || product.stockQty <= 0) {
        throw { status: 409, code: 'CART_PRODUCT_UNAVAILABLE', message: 'Product unavailable' };
      }

      if (quantity > product.stockQty) {
        throw { status: 409, code: 'CART_STOCK_EXCEEDED', message: 'Requested quantity exceeds stock' };
      }

      const updateResult = await tx.cartItem.updateMany({
        where: {
          userId: req.authUser.id,
          productId,
          quantity: {
            lte: product.stockQty - quantity,
          },
        },
        data: {
          quantity: {
            increment: quantity,
          },
        },
      });

      if (updateResult.count === 1) {
        const updatedItem = await tx.cartItem.findUnique({
          where: {
            userId_productId: {
              userId: req.authUser.id,
              productId,
            },
          },
          select: cartItemSelect,
        });

        return { status: 200, cartItem: updatedItem };
      }

      const existingItem = await tx.cartItem.findUnique({
        where: {
          userId_productId: {
            userId: req.authUser.id,
            productId,
          },
        },
        select: { id: true },
      });

      if (existingItem) {
        throw { status: 409, code: 'CART_STOCK_EXCEEDED', message: 'Requested quantity exceeds stock' };
      }

      try {
        const createdItem = await tx.cartItem.create({
          data: {
            userId: req.authUser.id,
            productId,
            quantity,
          },
          select: cartItemSelect,
        });

        return { status: 201, cartItem: createdItem };
      } catch (err) {
        if (err?.code !== 'P2002') {
          throw err;
        }

        const retryUpdate = await tx.cartItem.updateMany({
          where: {
            userId: req.authUser.id,
            productId,
            quantity: {
              lte: product.stockQty - quantity,
            },
          },
          data: {
            quantity: {
              increment: quantity,
            },
          },
        });

        if (retryUpdate.count === 0) {
          throw { status: 409, code: 'CART_STOCK_EXCEEDED', message: 'Requested quantity exceeds stock' };
        }

        const updatedItem = await tx.cartItem.findUnique({
          where: {
            userId_productId: {
              userId: req.authUser.id,
              productId,
            },
          },
          select: cartItemSelect,
        });

        return { status: 200, cartItem: updatedItem };
      }
    });

    return res.status(result.status).json({
      success: true,
      data: result.cartItem,
    });
  } catch (err) {
    return next(err);
  }
});

cartRoutes.patch('/items/:id', validateBody(updateCartItemSchema), async (req, res, next) => {
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      id: req.params.id,
      userId: req.authUser.id,
    },
    select: {
      id: true,
      product: {
        select: {
          isDeleted: true,
          stockQty: true,
        },
      },
    },
  });

  if (!existingItem) {
    return next({ status: 404, message: 'Cart item not found' });
  }

  if (existingItem.product.isDeleted || existingItem.product.stockQty <= 0) {
    return next({ status: 409, code: 'CART_PRODUCT_UNAVAILABLE', message: 'Product unavailable' });
  }

  if (req.validatedBody.quantity > existingItem.product.stockQty) {
    return next({ status: 409, code: 'CART_STOCK_EXCEEDED', message: 'Requested quantity exceeds stock' });
  }

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
