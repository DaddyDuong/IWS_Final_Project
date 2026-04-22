import { prisma } from '../lib/prisma.js';
import { verifyAuthToken } from '../lib/jwt.js';

export async function requireAuth(req, _res, next) {
  const header = req.get('authorization') ?? '';

  if (!header.startsWith('Bearer ')) {
    return next({ status: 401, message: 'Unauthorized' });
  }

  const token = header.slice(7);
  let payload;

  try {
    payload = verifyAuthToken(token);
  } catch {
    return next({ status: 401, message: 'Unauthorized' });
  }

  const userId = typeof payload === 'object' ? payload.sub : null;

  if (!userId || typeof userId !== 'string') {
    return next({ status: 401, message: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return next({ status: 401, message: 'Unauthorized' });
  }

  req.authUser = user;
  return next();
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.authUser) {
      return next({ status: 401, message: 'Unauthorized' });
    }

    if (!roles.includes(req.authUser.role)) {
      return next({ status: 403, message: 'Forbidden' });
    }

    return next();
  };
}
