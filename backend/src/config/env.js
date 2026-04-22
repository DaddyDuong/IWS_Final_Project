import 'dotenv/config';

const parsedPort = Number.parseInt(process.env.PORT ?? '8080', 10);
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
const allowInsecureDevSecret = process.env.ALLOW_INSECURE_DEV_JWT === 'true';

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
};
