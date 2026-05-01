import { Router } from 'express';
import { z } from 'zod';
import { buildListMeta, buildListQuerySchema, getListSkip } from '../lib/listQuery.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/auth.js';
import { sanitizeRequestTextFields } from '../middlewares/sanitize.js';
import { validateBody, validateQuery } from '../middlewares/validate.js';

const createAddressSchema = z.object({
  receiver: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  line1: z.string().trim().min(1),
  ward: z.string().trim().min(1),
  district: z.string().trim().min(1),
  city: z.string().trim().min(1),
  isDefault: z.boolean().optional(),
});

const updateAddressSchema = z.object({
  receiver: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  line1: z.string().trim().min(1).optional(),
  ward: z.string().trim().min(1).optional(),
  district: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  isDefault: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required',
});

const listAddressesQuerySchema = buildListQuerySchema({
  sortByValues: ['createdAt', 'updatedAt', 'receiver'],
  defaultSortBy: 'createdAt',
});

const addressSelect = {
  id: true,
  userId: true,
  receiver: true,
  phone: true,
  line1: true,
  ward: true,
  district: true,
  city: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
};

function buildAddressInUseError() {
  return {
    status: 409,
    code: 'ADDRESS_IN_USE',
    message: 'Address cannot be modified once it has been used in an order',
  };
}

export const addressesRoutes = Router();

addressesRoutes.use(requireAuth);

addressesRoutes.get('/', validateQuery(listAddressesQuerySchema), async (req, res) => {
  const query = req.validatedQuery;
  const where = { userId: req.authUser.id };
  const skip = getListSkip(query.page, query.limit);

  const [addresses, total] = await prisma.$transaction([
    prisma.address.findMany({
      where,
      select: addressSelect,
      orderBy: {
        [query.sortBy]: query.sortOrder,
      },
      skip,
      take: query.limit,
    }),
    prisma.address.count({ where }),
  ]);

  return res.json({
    success: true,
    data: addresses,
    meta: buildListMeta({
      page: query.page,
      limit: query.limit,
      total,
    }),
  });
});

addressesRoutes.post('/', sanitizeRequestTextFields, validateBody(createAddressSchema), async (req, res) => {
  const address = await prisma.$transaction(async (tx) => {
    if (req.validatedBody.isDefault === true) {
      await tx.address.updateMany({
        where: { userId: req.authUser.id },
        data: { isDefault: false },
      });
    }

    return tx.address.create({
      data: {
        userId: req.authUser.id,
        ...req.validatedBody,
      },
      select: addressSelect,
    });
  });

  return res.status(201).json({
    success: true,
    data: address,
  });
});

addressesRoutes.patch('/:id', sanitizeRequestTextFields, validateBody(updateAddressSchema), async (req, res, next) => {
  const existingAddress = await prisma.address.findFirst({
    where: {
      id: req.params.id,
      userId: req.authUser.id,
    },
    select: { id: true },
  });

  if (!existingAddress) {
    return next({ status: 404, message: 'Address not found' });
  }

  const usedInOrder = await prisma.order.findFirst({
    where: { addressId: req.params.id },
    select: { id: true },
  });

  if (usedInOrder) {
    return next(buildAddressInUseError());
  }

  const address = await prisma.$transaction(async (tx) => {
    if (req.validatedBody.isDefault === true) {
      await tx.address.updateMany({
        where: {
          userId: req.authUser.id,
          id: { not: req.params.id },
        },
        data: { isDefault: false },
      });
    }

    await tx.address.update({
      where: { id: req.params.id },
      data: req.validatedBody,
      select: { id: true },
    });

    return tx.address.findUnique({
      where: { id: req.params.id },
      select: addressSelect,
    });
  });

  return res.json({
    success: true,
    data: address,
  });
});

addressesRoutes.delete('/:id', async (req, res, next) => {
  const address = await prisma.address.findFirst({
    where: {
      id: req.params.id,
      userId: req.authUser.id,
    },
    select: addressSelect,
  });

  if (!address) {
    return next({ status: 404, message: 'Address not found' });
  }

  const usedInOrder = await prisma.order.findFirst({
    where: { addressId: req.params.id },
    select: { id: true },
  });

  if (usedInOrder) {
    return next(buildAddressInUseError());
  }

  await prisma.address.delete({
    where: { id: address.id },
  });

  return res.json({
    success: true,
    data: address,
  });
});
