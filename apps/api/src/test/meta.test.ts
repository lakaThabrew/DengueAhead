import { describe, it, expect } from 'vitest';
import request from 'supertest';
import type { Collection, Document } from 'mongodb';
import { createApp } from '../app.js';
import type { DbClient } from '../repositories/mongo.js';

const noopCollection = (data: unknown[] = []) =>
  ({
    find: () => ({
      sort: () => ({
        limit: () => ({ toArray: async () => data }),
        skip: () => ({ limit: () => ({ toArray: async () => data }) }),
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
  collection: () => noopCollection()
};

// API-06: meta returns latestIssueDate from predictions collection
describe('GET /api/v1/meta', () => {
  it('returns 503 when no DB is provided', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/meta');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });

  it('returns meta envelope with nulls when predictions collection is empty', async () => {
    const app = createApp(okDb);
    const res = await request(app).get('/api/v1/meta');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('geographicLevel', 'district');
    expect(res.body.latestIssueDate).toBeNull();
    expect(res.body.activeModelVersion).toBeNull();
    expect(res.body.sourceFreshnessStatus).toBe('UNAVAILABLE');
  });

  it('API-06: returns latestIssueDate and activeModelVersion when data exists', async () => {
    const predsData = [{ issueDate: '2024-12-30' }];
    const runsData = [{ modelVersion: 'dengueahead-hgb-v1', outperformsBaseline: true }];

    const db: DbClient = {
      ping: async () => ({ latencyMs: 1 }),
      close: async () => {},
      collection: (name: string) => {
        if (name === 'predictions') return noopCollection(predsData);
        if (name === 'model_runs') return noopCollection(runsData);
        return noopCollection();
      }
    };

    const app = createApp(db);
    const res = await request(app).get('/api/v1/meta');
    expect(res.status).toBe(200);
    expect(res.body.latestIssueDate).toBe('2024-12-30');
    expect(res.body.latestTargetWeek).toBe('2025-01-06');
    expect(res.body.activeModelVersion).toBe('dengueahead-hgb-v1');
    expect(res.body.sourceFreshnessStatus).toBe('CURRENT');
  });

  it('returns 503 when DB query throws', async () => {
    const errDb: DbClient = {
      ping: async () => ({ latencyMs: 1 }),
      close: async () => {},
      collection: () => {
        throw new Error('Connection error');
      }
    };
    const app = createApp(errDb);
    const res = await request(app).get('/api/v1/meta');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_ERROR');
  });
});
