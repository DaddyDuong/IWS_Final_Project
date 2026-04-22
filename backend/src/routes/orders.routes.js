import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';

const checkoutSchema = z.object({
  addressId: z.string().trim().min(1),
});

const cancellableStatuses = ['pending', 'processing'];

const orderItemSelect = {
  id: true,
  productId: true,
  unitPrice: true,
  quantity: true,
  lineTotal: true,
  product: {
    select: {
      id: true,
      sku: true,
      name: true,
      imageUrl: true,
    },
  },
};

const orderSelect = {
  id: true,
  userId: true,
  addressId: true,
  status: true,
  subtotal: true,
  shippingFee: true,
  total: true,
  placedAt: true,
  createdAt: true,
  updatedAt: true,
  address: {
    select: {
      id: true,
      receiver: true,
      phone: true,
      line1: true,
      ward: true,
      district: true,
      city: true,
    },
  },
  items: {
    select: orderItemSelect,
  },
};

export const ordersRoutes = Router();

ordersRoutes.use(requireAuth);

ordersRoutes.post('/checkout', validateBody(checkoutSchema), async (req, res, next) => {
  const { addressId } = req.validatedBody;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: { userId: req.authUser.id },
        select: {
          productId: true,
          quantity: true,
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              imageUrl: true,
              isDeleted: true,
              stockQty: true,
              price: true,
            },
          },
        },
      });

      if (cartItems.length === 0) {
        throw { status: 409, code: 'ORDER_CART_EMPTY', message: 'Cart is empty' };
      }

      const address = await tx.address.findFirst({
        where: {
          id: addressId,
          userId: req.authUser.id,
        },
        select: { id: true },
      });

      if (!address) {
        throw { status: 404, code: 'ORDER_ADDRESS_NOT_FOUND', message: 'Address not found' };
      }

      for (const item of cartItems) {
        if (item.product.isDeleted || item.product.stockQty < item.quantity) {
          throw { status: 409, code: 'ORDER_STOCK_UNAVAILABLE', message: 'One or more items are out of stock' };
        }
      }

      const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const shippingFee = 0;
      const total = subtotal + shippingFee;

      const createdOrder = await tx.order.create({
        data: {
          userId: req.authUser.id,
          addressId,
          subtotal,
          shippingFee,
          total,
          items: {
            createMany: {
              data: cartItems.map((item) => ({
                productId: item.productId,
                unitPrice: item.product.price,
                quantity: item.quantity,
                lineTotal: item.product.price * item.quantity,
              })),
            },
          },
        },
        select: { id: true },
      });

      for (const item of cartItems) {
        const stockUpdate = await tx.product.updateMany({
          where: {
            id: item.productId,
            isDeleted: false,
            stockQty: { gte: item.quantity },
          },
          data: {
            stockQty: {
              decrement: item.quantity,
            },
          },
        });

        if (stockUpdate.count === 0) {
          throw { status: 409, code: 'ORDER_STOCK_UNAVAILABLE', message: 'One or more items are out of stock' };
        }
      }

      await tx.cartItem.deleteMany({
        where: {
          userId: req.authUser.id,
        },
      });

      return tx.order.findUnique({
        where: { id: createdOrder.id },
        select: orderSelect,
      });
    });

    return res.status(201).json({
      success: true,
      data: order,
    });
  } catch (err) {
    return next(err);
  }
});

ordersRoutes.get('/', async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.authUser.id },
    select: orderSelect,
    orderBy: { placedAt: 'desc' },
  });

  return res.json({
    success: true,
    data: orders,
  });
});

ordersRoutes.get('/:id', async (req, res, next) => {
  const order = await prisma.order.findFirst({
    where: {
      id: req.params.id,
      userId: req.authUser.id,
    },
    select: orderSelect,
  });

  if (!order) {
    return next({ status: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found' });
  }

  return res.json({
    success: true,
    data: order,
  });
});

ordersRoutes.patch('/:id/cancel', async (req, res, next) => {
  try {
    const cancelledOrder = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findFirst({
        where: {
          id: req.params.id,
          userId: req.authUser.id,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (!existingOrder) {
        throw { status: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found' };
      }

      const cancelResult = await tx.order.updateMany({
        where: {
          id: req.params.id,
          userId: req.authUser.id,
          status: {
            in: cancellableStatuses,
          },
        },
        data: {
          status: 'canceled',
        },
      });

      if (cancelResult.count === 0) {
        throw { status: 409, code: 'ORDER_NOT_CANCELLABLE', message: 'Order cannot be canceled' };
      }

      const orderItems = await tx.orderItem.findMany({
        where: { orderId: existingOrder.id },
        select: {
          productId: true,
          quantity: true,
        },
      });

      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQty: {
              increment: item.quantity,
            },
          },
        });
      }

      return tx.order.findUnique({
        where: { id: existingOrder.id },
        select: orderSelect,
      });
    });

    return res.json({
      success: true,
      data: cancelledOrder,
    });
  } catch (err) {
    return next(err);
  }
});
