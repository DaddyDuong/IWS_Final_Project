import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const allowedOrigins = new Set(env.security.corsAllowedOrigins);

function rateLimitHandler(_req, _res, next) {
  next({
    status: 429,
    code: 'RATE_LIMITED',
    message: 'Too many requests, please try again later.',
  });
}

export const helmetMiddleware = helmet();

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(Object.assign(new Error('Origin is not allowed'), {
      status: 403,
      code: 'CORS_NOT_ALLOWED',
    }));
  },
});

export const globalRateLimiter = rateLimit({
  windowMs: env.security.rateLimit.global.windowMs,
  max: env.security.rateLimit.global.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const authRateLimiter = rateLimit({
  windowMs: env.security.rateLimit.auth.windowMs,
  max: env.security.rateLimit.auth.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
