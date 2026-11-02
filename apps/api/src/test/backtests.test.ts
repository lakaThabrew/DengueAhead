import { describe, it, expect } from 'vitest';
import request from 'supertest';
import type { Collection, Document } from 'mongodb';
import { createApp } from '../app.js';
import type { DbClient } from '../repositories/mongo.js';

describe('GET /api/v1/backtests', () => {
  const sampleRun = {
    modelVersion: 'dengueahead-hgb-v1',
    modelName: 'HistGradientBoosting Hotspot Forecaster',
    trainedAt: '2026-10-31T00:00:00Z',
    trainRange: { startWeek: '2020-01-06', endWeek: '2023-12-25' },
    testRange: { startWeek: '2024-07-01', endWeek: '2024-12-30' },
    totalEvaluatedInstances: 650,
    mae: 12.5,
    topKRecall: 0.88,
    precision: 0.72,
    recall: 0.85,
    brierScore: 0.14,
    baselines: [],
    outperformsBaseline: true,
    notes: 'Phase 3 evaluation'
  };

  const mockDb: DbClient = {
    ping: async () => ({ latencyMs: 1 }),
    close: async () => {},
    collection: (name: string) => {
      if (name === 'model_runs') {
        return {
          find: () => ({
            sort: () => ({
              limit: () => ({
                toArray: async () => [sampleRun]
              })
            })
          })
        } as unknown as Collection<Document>;
      }
      return {
        find: () => ({ toArray: async () => [] })
      } as unknown as Collection<Document>;
    }
  };

  it('returns 200 OK with backtest evaluation runs', async () => {
    const app = createApp(mockDb);
    const res = await request(app).get('/api/v1/backtests');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].modelVersion).toBe('dengueahead-hgb-v1');
    expect(res.body.data[0].outperformsBaseline).toBe(true);
  });

  it('returns 503 DATABASE_UNAVAILABLE when database is offline', async () => {
    const app = createApp(undefined);
    const res = await request(app).get('/api/v1/backtests');

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });
});
