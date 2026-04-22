import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const allowedOrigins = new Set(['http://localhost:5173']);

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function rateLimitHandler(_req, _res, next) {
  next({
    status: 429,
    code: 'RATE_LIMITED',
    message: 'Too many requests, please try again later.',
  });
}

const globalWindowMs = parsePositiveInt(process.env.GLOBAL_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);
const globalMax = parsePositiveInt(process.env.GLOBAL_RATE_LIMIT_MAX, 200);
const authWindowMs = parsePositiveInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);
const authMax = parsePositiveInt(process.env.AUTH_RATE_LIMIT_MAX, 100);

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
  windowMs: globalWindowMs,
  max: globalMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const authRateLimiter = rateLimit({
  windowMs: authWindowMs,
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
