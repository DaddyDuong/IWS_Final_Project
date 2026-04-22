import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';

let app;

describe('security configuration', () => {
  beforeAll(async () => {
    process.env.CORS_ALLOWED_ORIGINS = 'http://example.com';
    process.env.TRUST_PROXY = '1';
    vi.resetModules();
    ({ app } = await import('../../src/app.js'));
  });

  it('uses env-driven CORS allowlist', async () => {
    const allowed = await request(app).get('/health').set('Origin', 'http://example.com');
    const blocked = await request(app).get('/health').set('Origin', 'http://localhost:5173');

    expect(allowed.status).toBe(200);
    expect(blocked.status).toBe(403);
    expect(blocked.body.success).toBe(false);
    expect(blocked.body.error.code).toBe('CORS_NOT_ALLOWED');
  });

  it('sets trust proxy from env', () => {
    expect(app.get('trust proxy')).toBe(1);
  });
});
