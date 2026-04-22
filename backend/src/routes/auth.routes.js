import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { signAuthToken } from '../lib/jwt.js';
import { validateBody } from '../middlewares/validate.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  phone: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export const authRoutes = Router();

authRoutes.post('/register', validateBody(registerSchema), async (req, res, next) => {
  const { email, password, fullName, phone } = req.validatedBody;

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return next({ status: 409, message: 'Email already in use' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      phone,
    },
  });

  const token = signAuthToken({ sub: user.id, role: user.role });

  return res.status(201).json({
    success: true,
    data: {
      token,
      user: toPublicUser(user),
    },
  });
});

authRoutes.post('/login', validateBody(loginSchema), async (req, res, next) => {
  const { email, password } = req.validatedBody;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return next({ status: 401, message: 'Invalid email or password' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return next({ status: 401, message: 'Invalid email or password' });
  }

  const token = signAuthToken({ sub: user.id, role: user.role });

  return res.json({
    success: true,
    data: {
      token,
      user: toPublicUser(user),
    },
  });
});
