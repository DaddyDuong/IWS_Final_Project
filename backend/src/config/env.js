import 'dotenv/config';

const parsedPort = Number.parseInt(process.env.PORT ?? '8080', 10);

export const env = {
  port: Number.isNaN(parsedPort) ? 8080 : parsedPort,
  databaseUrl: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-jwt-secret',
};
