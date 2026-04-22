import { createHash, randomBytes } from 'node:crypto';

const DEFAULT_RESET_TOKEN_TTL_MS = 1000 * 60 * 15;

export function hashPasswordResetToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function createPasswordResetToken() {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashPasswordResetToken(token);
  return { token, tokenHash };
}

export function getPasswordResetTokenExpiry(now = new Date()) {
  return new Date(now.getTime() + DEFAULT_RESET_TOKEN_TTL_MS);
}
