import { describe, it, expect } from 'vitest';
import request from 'supertest';
import type { Collection, Document } from 'mongodb';
import { createApp } from '../app.js';
import type { DbClient } from '../repositories/mongo.js';

const seedPredictions = [
  {
    areaId: 'LK-11',
    geographicLevel: 'district',
    issueDate: '2024-07-01',
    targetWeek: '2024-07-08',
    asOfDate: '2024-07-01',
    modelVersion: 'baseline-naive-last-week-v1',
    status: 'EMERGING',
    confidenceStatus: 'NOT_AVAILABLE',
    pointForecast: 125.0,
    interval: null,
    riskProbability: null,
    qualityFlags: [],
    sourceSnapshotIds: ['snap-test-123']
  }
];

const makeCollection = (docs: object[]) => () =>
  ({
    find: () => ({
      sort: () => ({
        limit: () => ({ toArray: async () => docs }),
        toArray: async () => docs
      }),
      toArray: async () => docs
    })
  }) as unknown as Collection<Document>;

const seededDb: DbClient = {
  ping: async () => ({ latencyMs: 1 }),
  close: async () => {},
  collection: makeCollection(seedPredictions)
};

describe('GET /api/v1/predictions — Phase 2', () => {
  it('returns 200 with list of predictions matching PredictionSchema', async () => {
    const app = createApp(seededDb);
    const res = await request(app).get('/api/v1/predictions?asOf=2024-07-01');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].areaId).toBe('LK-11');
    expect(res.body.data[0].status).toBe('EMERGING');
    expect(res.body.data[0].pointForecast).toBe(125.0);
    expect(res.body.data[0].confidenceStatus).toBe('NOT_AVAILABLE');
  });

  it('returns 400 when asOf format is invalid', async () => {
    const app = createApp(seededDb);
    const res = await request(app).get('/api/v1/predictions?asOf=not-a-date');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_QUERY');
  });

  it('returns 503 when DB is offline', async () => {
    const app = createApp(undefined);
    const res = await request(app).get('/api/v1/predictions?asOf=2024-07-01');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });
});
