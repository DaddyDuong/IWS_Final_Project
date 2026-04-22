import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';

let app;

describe('auth rate limit middleware', () => {
  beforeAll(async () => {
    process.env.AUTH_RATE_LIMIT_MAX = '3';
    process.env.AUTH_RATE_LIMIT_WINDOW_MS = '60000';
    vi.resetModules();
    ({ app } = await import('../../src/app.js'));
  });

  it('returns 429 after repeated auth attempts', async () => {
    const payload = { email: 'not-an-email', password: 'x' };

    const first = await request(app).post('/api/v1/auth/login').send(payload);
    const second = await request(app).post('/api/v1/auth/login').send(payload);
    const third = await request(app).post('/api/v1/auth/login').send(payload);
    const fourth = await request(app).post('/api/v1/auth/login').send(payload);

    expect(first.status).toBe(400);
    expect(second.status).toBe(400);
    expect(third.status).toBe(400);
    expect(fourth.status).toBe(429);
    expect(fourth.body.success).toBe(false);
    expect(fourth.body.error.code).toBe('RATE_LIMITED');
  });
});
