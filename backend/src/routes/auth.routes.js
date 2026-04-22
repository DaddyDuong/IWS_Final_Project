import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { signAuthToken } from '../lib/jwt.js';
import {
  createPasswordResetToken,
  getPasswordResetTokenExpiry,
  hashPasswordResetToken,
} from '../lib/passwordResetToken.js';
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

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

const forgotPasswordSuccessMessage =
  'If an account with that email exists, password reset instructions have been sent.';

function isLocalhostRequest(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

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
    return next({ status: 409, code: 'EMAIL_EXISTS', message: 'Email already in use' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  let user;

  try {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError
      && err.code === 'P2002'
      && Array.isArray(err.meta?.target)
      && err.meta.target.includes('email')
    ) {
      return next({ status: 409, code: 'EMAIL_EXISTS', message: 'Email already in use' });
    }
    return next(err);
  }

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

authRoutes.post('/forgot-password', validateBody(forgotPasswordSchema), async (req, res, next) => {
  const { email } = req.validatedBody;
  const user = await prisma.user.findUnique({ where: { email } });
  const data = { message: forgotPasswordSuccessMessage };

  if (!user) {
    return res.json({ success: true, data });
  }

  const { token, tokenHash } = createPasswordResetToken();

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: getPasswordResetTokenExpiry(),
    },
  });

  if (isLocalhostRequest(req.hostname)) {
    data.demoResetToken = token;
  }

  return res.json({ success: true, data });
});

authRoutes.post('/reset-password', validateBody(resetPasswordSchema), async (req, res, next) => {
  const { token, newPassword } = req.validatedBody;
  const now = new Date();
  const tokenHash = hashPasswordResetToken(token);

  const passwordResetToken = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: {
        gt: now,
      },
    },
  });

  if (!passwordResetToken) {
    return next({
      status: 400,
      code: 'INVALID_RESET_TOKEN',
      message: 'Invalid or expired reset token',
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction(async (tx) => {
    const updatedToken = await tx.passwordResetToken.updateMany({
      where: {
        id: passwordResetToken.id,
        usedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      data: {
        usedAt: now,
      },
    });

    if (updatedToken.count !== 1) {
      throw Object.assign(new Error('Invalid or expired reset token'), {
        status: 400,
        code: 'INVALID_RESET_TOKEN',
      });
    }

    await tx.user.update({
      where: { id: passwordResetToken.userId },
      data: { passwordHash },
    });
  });

  return res.json({
    success: true,
    data: {
      message: 'Password reset successfully',
    },
  });
});
