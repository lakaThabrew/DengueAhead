import { describe, it, expect } from 'vitest';
import request from 'supertest';
import type { Collection, Document } from 'mongodb';
import { createApp } from '../app.js';
import type { DbClient } from '../repositories/mongo.js';

const seedModelRuns = [
  {
    modelVersion: 'baseline-naive-last-week-v1',
    modelName: 'Naive Last Week Baseline',
    trainedAt: '2024-07-01T00:00:00.000Z',
    trainRange: {
      startWeek: '2020-01-06',
      endWeek: '2023-12-25'
    },
    testRange: {
      startWeek: '2024-07-01',
      endWeek: '2024-12-30'
    },
    totalEvaluatedInstances: 650,
    mae: 14.25,
    topKRecall: 0.85,
    precision: 0.65,
    recall: 0.8,
    brierScore: null,
    baselines: [
      {
        baselineName: 'naive_last_week',
        mae: 14.25,
        topKRecall: 0.85,
        precision: 0.65,
        recall: 0.8
      }
    ],
    outperformsBaseline: false,
    notes: 'Phase 2 evaluation baseline'
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
  collection: makeCollection(seedModelRuns)
};

const errorDb: DbClient = {
  ping: async () => ({ latencyMs: 1 }),
  close: async () => {},
  collection: () => {
    throw new Error('Simulated DB error');
  }
};

describe('GET /api/v1/evaluation — Phase 2', () => {
  it('returns 200 with validated EvaluationMetrics array', async () => {
    const app = createApp(seededDb);
    const res = await request(app).get('/api/v1/evaluation');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].modelVersion).toBe('baseline-naive-last-week-v1');
    expect(res.body.data[0].mae).toBe(14.25);
    expect(res.body.data[0].brierScore).toBeNull();
  });

  it('returns 503 when DB is offline / not provided', async () => {
    const app = createApp(undefined);
    const res = await request(app).get('/api/v1/evaluation');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });

  it('returns 503 on database query error', async () => {
    const app = createApp(errorDb);
    const res = await request(app).get('/api/v1/evaluation');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_ERROR');
  });
});
