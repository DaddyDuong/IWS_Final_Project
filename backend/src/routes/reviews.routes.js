import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/auth.js';
import { sanitizeRequestTextFields } from '../middlewares/sanitize.js';
import { validateBody } from '../middlewares/validate.js';

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1),
});

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().min(1).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required',
});

const reviewSelect = {
  id: true,
  userId: true,
  productId: true,
  rating: true,
  comment: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      fullName: true,
    },
  },
};

function isReviewConflictError(err) {
  return !!err && typeof err === 'object' && err.code === 'P2002';
}

export const reviewsRoutes = Router();

reviewsRoutes.get('/products/:id/reviews', async (req, res, next) => {
  const product = await prisma.product.findFirst({
    where: {
      id: req.params.id,
      isDeleted: false,
    },
    select: { id: true },
  });

  if (!product) {
    return next({ status: 404, message: 'Product not found' });
  }

  const reviews = await prisma.review.findMany({
    where: { productId: req.params.id },
    select: reviewSelect,
    orderBy: { createdAt: 'desc' },
  });

  return res.json({
    success: true,
    data: reviews,
  });
});

reviewsRoutes.post(
  '/products/:id/reviews',
  requireAuth,
  sanitizeRequestTextFields,
  validateBody(createReviewSchema),
  async (req, res, next) => {
  const product = await prisma.product.findFirst({
    where: {
      id: req.params.id,
      isDeleted: false,
    },
    select: { id: true },
  });

  if (!product) {
    return next({ status: 404, message: 'Product not found' });
  }

  try {
    const review = await prisma.review.create({
      data: {
        userId: req.authUser.id,
        productId: req.params.id,
        ...req.validatedBody,
      },
      select: reviewSelect,
    });

    return res.status(201).json({
      success: true,
      data: review,
    });
  } catch (err) {
    if (isReviewConflictError(err)) {
      return next({ status: 409, code: 'REVIEW_EXISTS', message: 'Review already exists' });
    }

    return next(err);
  }
  },
);

reviewsRoutes.patch(
  '/reviews/:id',
  requireAuth,
  sanitizeRequestTextFields,
  validateBody(updateReviewSchema),
  async (req, res, next) => {
  const review = await prisma.review.findFirst({
    where: {
      id: req.params.id,
      userId: req.authUser.id,
    },
    select: { id: true },
  });

  if (!review) {
    return next({ status: 404, message: 'Review not found' });
  }

  await prisma.review.update({
    where: { id: req.params.id },
    data: req.validatedBody,
  });

  const updatedReview = await prisma.review.findUnique({
    where: { id: req.params.id },
    select: reviewSelect,
  });

  return res.json({
    success: true,
    data: updatedReview,
  });
  },
);

reviewsRoutes.delete('/reviews/:id', requireAuth, async (req, res, next) => {
  const review = await prisma.review.findFirst({
    where: {
      id: req.params.id,
      userId: req.authUser.id,
    },
    select: reviewSelect,
  });

  if (!review) {
    return next({ status: 404, message: 'Review not found' });
  }

  await prisma.review.delete({
    where: { id: review.id },
  });

  return res.json({
    success: true,
    data: review,
  });
});
