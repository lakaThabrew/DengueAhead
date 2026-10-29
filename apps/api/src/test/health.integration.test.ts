import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { createMongoClient } from '../repositories/mongo.js';

describe('Integration — MongoDB Readiness Endpoint', () => {
  const uri = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/dengueahead_test';
  const dbClient = createMongoClient(uri);
  const app = createApp({ dbClient });

  afterAll(async () => {
    await dbClient.close().catch(() => {});
  });

  it('GET /api/v1/health always returns 200 regardless of database state', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  it('GET /api/v1/readiness checks real MongoDB connection or handles unreachable state with 503', async () => {
    const res = await request(app).get('/api/v1/readiness');
    if (res.status === 200) {
      expect(res.body.status).toBe('ok');
      expect(res.body.components.database.status).toBe('up');
    } else {
      expect(res.status).toBe(503);
      expect(res.body.status).toBe('error');
      expect(res.body.components.database.status).toBe('down');
    }
  });
});
