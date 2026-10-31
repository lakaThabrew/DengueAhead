import { describe, it, expect } from 'vitest';
import request from 'supertest';
import type { Collection, Document } from 'mongodb';
import { createApp } from '../app.js';
import type { DbClient } from '../repositories/mongo.js';

const AREA_DOC = {
  areaId: 'LK-11',
  name: 'Colombo',
  level: 'district',
  centroid: { latitude: 6.9271, longitude: 79.8612 }
};

const PREDICTION_DOC = {
  areaId: 'LK-11',
  geographicLevel: 'district',
  issueDate: '2024-12-23',
  targetWeek: '2024-12-30',
  asOfDate: '2024-12-23',
  modelVersion: 'dengueahead-hgb-v1',
  status: 'STABLE',
  confidenceStatus: 'NOT_AVAILABLE',
  pointForecast: 42.0,
  interval: null,
  riskProbability: null,
  qualityFlags: [],
  sourceSnapshotIds: ['snap-001']
};

const makeCollection = (data: unknown[] = []) =>
  ({
    find: () => ({
      sort: () => ({
        limit: () => ({ toArray: async () => data }),
        skip: () => ({
          limit: () => ({ toArray: async () => data })
        }),
        toArray: async () => data
      }),
      toArray: async () => data
    }),
    findOne: async () => null,
    countDocuments: async () => data.length,
    aggregate: () => ({ toArray: async () => [] })
  }) as unknown as Collection<Document>;

describe('GET /api/v1/compare', () => {
  it('returns 503 when no DB is provided', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/compare?areaIds=LK-11');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });

  it('returns 400 when areaIds param is missing', async () => {
    const db: DbClient = {
      ping: async () => ({ latencyMs: 1 }),
      close: async () => {},
      collection: () => makeCollection()
    };
    const app = createApp(db);
    const res = await request(app).get('/api/v1/compare');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_QUERY');
  });

  it('API-07: returns 400 TOO_MANY_AREAS when more than 3 districts provided', async () => {
    const db: DbClient = {
      ping: async () => ({ latencyMs: 1 }),
      close: async () => {},
      collection: () => makeCollection()
    };
    const app = createApp(db);
    const res = await request(app).get('/api/v1/compare?areaIds=LK-11,LK-12,LK-21,LK-31');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('TOO_MANY_AREAS');
  });

  it('API-07: returns 400 INVALID_AREA_ID for malformed area IDs', async () => {
    const db: DbClient = {
      ping: async () => ({ latencyMs: 1 }),
      close: async () => {},
      collection: () => makeCollection()
    };
    const app = createApp(db);
    const res = await request(app).get('/api/v1/compare?areaIds=LK-11,not-valid');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_AREA_ID');
  });

  it('returns compare response with comparisons array for valid inputs', async () => {
    const db: DbClient = {
      ping: async () => ({ latencyMs: 1 }),
      close: async () => {},
      collection: (name: string) => {
        if (name === 'areas') return makeCollection([AREA_DOC]);
        if (name === 'predictions') return makeCollection([PREDICTION_DOC]);
        if (name === 'dengue_weekly') return makeCollection([]);
        return makeCollection();
      }
    };
    const app = createApp(db);
    const res = await request(app).get('/api/v1/compare?areaIds=LK-11&issueDate=2024-12-23');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('issueDate');
    expect(res.body).toHaveProperty('comparisons');
    expect(Array.isArray(res.body.comparisons)).toBe(true);
  });

  it('returns 400 for invalid issueDate format', async () => {
    const db: DbClient = {
      ping: async () => ({ latencyMs: 1 }),
      close: async () => {},
      collection: () => makeCollection()
    };
    const app = createApp(db);
    const res = await request(app).get('/api/v1/compare?areaIds=LK-11&issueDate=bad-date');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_QUERY');
  });
});
