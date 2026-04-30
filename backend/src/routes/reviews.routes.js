import { Router } from 'express';
import { z } from 'zod';
import { buildListMeta, buildListQuerySchema, getListSkip } from '../lib/listQuery.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/auth.js';
import { sanitizeRequestTextFields } from '../middlewares/sanitize.js';
import { validateBody, validateQuery } from '../middlewares/validate.js';

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

function parseInteger(value) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();

  if (!/^[+-]?\d+$/.test(normalized)) {
    return value;
  }

  return Number.parseInt(normalized, 10);
}

function parseBoolean(value) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  return value;
}

const listReviewsQuerySchema = buildListQuerySchema({
  sortByValues: ['createdAt', 'rating'],
  defaultSortBy: 'createdAt',
}).extend({
  rating: z.preprocess(parseInteger, z.number().int().min(1).max(5).optional()),
  hasComment: z.preprocess(parseBoolean, z.boolean().optional()),
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

reviewsRoutes.get('/products/:id/reviews', validateQuery(listReviewsQuerySchema), async (req, res, next) => {
  const query = req.validatedQuery;
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

  const where = { productId: req.params.id };

  if (query.rating !== undefined) {
    where.rating = query.rating;
  }

  if (query.hasComment === true) {
    where.comment = {
      not: '',
    };
  }

  if (query.hasComment === false) {
    where.comment = '';
  }

  const skip = getListSkip(query.page, query.limit);

  const [reviews, total] = await prisma.$transaction([
    prisma.review.findMany({
      where,
      select: reviewSelect,
      orderBy: {
        [query.sortBy]: query.sortOrder,
      },
      skip,
      take: query.limit,
    }),
    prisma.review.count({ where }),
  ]);

  return res.json({
    success: true,
    data: reviews,
    meta: buildListMeta({
      page: query.page,
      limit: query.limit,
      total,
    }),
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
