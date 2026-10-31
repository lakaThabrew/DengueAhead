import { describe, it, expect } from 'vitest';
import request from 'supertest';
import type { Collection, Document } from 'mongodb';
import { createApp } from '../app.js';
import type { DbClient } from '../repositories/mongo.js';

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

const okDb: DbClient = {
  ping: async () => ({ latencyMs: 1 }),
  close: async () => {},
  collection: () => makeCollection()
};

describe('GET /api/v1/backtests', () => {
  it('returns 503 when no DB is provided', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/backtests');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });

  it('returns empty data array when model_runs collection is empty', async () => {
    const app = createApp(okDb);
    const res = await request(app).get('/api/v1/backtests');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('count', 0);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returns 400 for invalid from date format', async () => {
    const app = createApp(okDb);
    const res = await request(app).get('/api/v1/backtests?from=bad-date');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_QUERY');
  });

  it('returns model run records when collection has data', async () => {
    const runDoc = {
      modelVersion: 'dengueahead-hgb-v1',
      modelName: 'HGB Hotspot Forecaster',
      trainedAt: '2024-10-01T00:00:00.000Z',
      trainRange: { startWeek: '2019-01-07', endWeek: '2023-12-25' },
      testRange: { startWeek: '2024-01-01', endWeek: '2024-06-30' },
      totalEvaluatedInstances: 650,
      mae: 12.5,
      topKRecall: 0.82,
      precision: 0.75,
      recall: 0.8,
      brierScore: 0.18,
      baselines: [],
      outperformsBaseline: true,
      notes: ''
    };
    const db: DbClient = {
      ping: async () => ({ latencyMs: 1 }),
      close: async () => {},
      collection: () => makeCollection([runDoc])
    };
    const app = createApp(db);
    const res = await request(app).get('/api/v1/backtests');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0]).toHaveProperty('modelVersion', 'dengueahead-hgb-v1');
  });

  it('accepts modelVersion filter without error', async () => {
    const app = createApp(okDb);
    const res = await request(app).get('/api/v1/backtests?modelVersion=dengueahead-hgb-v1');
    expect(res.status).toBe(200);
  });
});
