import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('API Health Endpoints', () => {
  const app = createApp();

  it('GET /api/v1/health returns 200 with service health schema', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('apiVersion', '1.0.0');
    expect(res.body).toHaveProperty('service', 'dengueahead-api');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/v1/readiness returns 200 with components status', async () => {
    const res = await request(app).get('/api/v1/readiness');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body.components).toHaveProperty('database');
    expect(res.body.components).toHaveProperty('dataFreshness');
  });

  it('GET /api/v1/unknown-route returns structured 404', async () => {
    const res = await request(app).get('/api/v1/unknown-route');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('attaches X-Request-Id header to responses', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.headers).toHaveProperty('x-request-id');
  });
});

