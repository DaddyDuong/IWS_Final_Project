import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';

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

export const addressesRoutes = Router();

addressesRoutes.use(requireAuth);

addressesRoutes.get('/', async (req, res) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.authUser.id },
    select: addressSelect,
    orderBy: { createdAt: 'desc' },
  });

  return res.json({
    success: true,
    data: addresses,
  });
});

addressesRoutes.post('/', validateBody(createAddressSchema), async (req, res) => {
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

addressesRoutes.patch('/:id', validateBody(updateAddressSchema), async (req, res, next) => {
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

  await prisma.address.delete({
    where: { id: address.id },
  });

  return res.json({
    success: true,
    data: address,
  });
});
