import 'dotenv/config';

const parsedPort = Number.parseInt(process.env.PORT ?? '8080', 10);
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
const allowInsecureDevSecret = process.env.ALLOW_INSECURE_DEV_JWT === 'true';

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseCorsAllowedOrigins(value) {
  const origins = (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0
    ? origins
    : [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:4173',
      'http://127.0.0.1:4173',
    ];
}

function parseTrustProxy(value) {
  if (value == null || value === '') {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  const parsedNumber = Number.parseInt(value, 10);
  if (Number.isInteger(parsedNumber) && parsedNumber >= 0) {
    return parsedNumber;
  }

  return value;
}

const resolvedJwtSecret =
  process.env.JWT_SECRET ??
  (isTestEnv ? 'test-jwt-secret' : allowInsecureDevSecret ? 'dev-insecure-jwt-secret' : undefined);

if (!resolvedJwtSecret) {
  throw new Error('JWT_SECRET is required');
}

export const env = {
  port: Number.isNaN(parsedPort) ? 8080 : parsedPort,
  databaseUrl: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
  jwtSecret: resolvedJwtSecret,
  security: {
    corsAllowedOrigins: parseCorsAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS),
    trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
    rateLimit: {
      global: {
        windowMs: parsePositiveInt(process.env.GLOBAL_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
        max: parsePositiveInt(process.env.GLOBAL_RATE_LIMIT_MAX, 200),
      },
      auth: {
        windowMs: parsePositiveInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
        max: parsePositiveInt(process.env.AUTH_RATE_LIMIT_MAX, 100),
      },
    },
  },
};
