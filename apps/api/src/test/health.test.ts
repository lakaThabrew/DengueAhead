import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import type { DbClient } from '../repositories/mongo.js';

// Fake DB that always succeeds
const okDb: DbClient = {
  ping: async () => ({ latencyMs: 1 }),
  close: async () => {}
};

// Fake DB that always fails
const downDb: DbClient = {
  ping: async () => {
    throw new Error('Connection refused');
  },
  close: async () => {}
};

describe('API Health Endpoints', () => {
  it('GET /api/v1/health returns 200 with service health schema', async () => {
    const app = createApp(okDb);
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('apiVersion', '1.0.0');
    expect(res.body).toHaveProperty('service', 'dengueahead-api');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/v1/health returns 200 even when DB is down', async () => {
    const app = createApp(downDb);
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/v1/readiness returns 200 with database status when DB is up', async () => {
    const app = createApp(okDb);
    const res = await request(app).get('/api/v1/readiness');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.components.database.status).toBe('up');
    expect(typeof res.body.components.database.latencyMs).toBe('number');
  });

  it('GET /api/v1/readiness returns 503 when DB is down', async () => {
    const app = createApp(downDb);
    const res = await request(app).get('/api/v1/readiness');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('error');
    expect(res.body.components.database.status).toBe('down');
    expect(res.body.components.database.latencyMs).toBeNull();
  });

  it('GET /api/v1/readiness returns 503 when no DB is injected', async () => {
    const app = createApp(); // no db
    const res = await request(app).get('/api/v1/readiness');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('error');
  });

  it('GET /api/v1/unknown-route returns structured 404', async () => {
    const app = createApp(okDb);
    const res = await request(app).get('/api/v1/unknown-route');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error).toHaveProperty('requestId');
  });

  it('POST /api/v1/health returns 405 (read-only guard)', async () => {
    const app = createApp(okDb);
    const res = await request(app).post('/api/v1/health').send({});
    expect(res.status).toBe(405);
    expect(res.body.error.code).toBe('METHOD_NOT_ALLOWED');
  });

  it('attaches X-Request-Id header to responses', async () => {
    const app = createApp(okDb);
    const res = await request(app).get('/api/v1/health');
    expect(res.headers).toHaveProperty('x-request-id');
  });
});
