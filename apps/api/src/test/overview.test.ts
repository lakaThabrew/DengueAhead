import { describe, it, expect } from 'vitest';
import request from 'supertest';
import type { Collection, Document } from 'mongodb';
import { createApp } from '../app.js';
import type { DbClient } from '../repositories/mongo.js';

const noopCollection = (data: unknown[] = [], aggData: unknown[] = []) =>
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
    aggregate: () => ({ toArray: async () => aggData })
  }) as unknown as Collection<Document>;

const okDb: DbClient = {
  ping: async () => ({ latencyMs: 1 }),
  close: async () => {},
  collection: () => noopCollection()
};

describe('GET /api/v1/overview', () => {
  it('returns 503 when no DB is provided', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/overview');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });

  it('API-03: returns empty overview when predictions collection is empty', async () => {
    const app = createApp(okDb);
    const res = await request(app).get('/api/v1/overview');
    expect(res.status).toBe(200);
    expect(res.body.monitoredAreasCount).toBe(0);
    expect(res.body.topEmergingAreas).toEqual([]);
    expect(res.body.issueDate).toBeNull();
  });

  it('returns 400 for invalid issueDate format', async () => {
    const app = createApp(okDb);
    const res = await request(app).get('/api/v1/overview?issueDate=not-a-date');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_QUERY');
  });

  it('returns overview with counts when data is present', async () => {
    const aggData = [
      { _id: 'EMERGING', count: 4 },
      { _id: 'STABLE', count: 10 },
      { _id: 'WITHHELD', count: 1 }
    ];
    const predsData = [{ issueDate: '2024-12-30' }];
    const areaData = [{ areaId: 'LK-11' }, { areaId: 'LK-12' }];

    const db: DbClient = {
      ping: async () => ({ latencyMs: 1 }),
      close: async () => {},
      collection: (name: string) => {
        if (name === 'predictions') return noopCollection(predsData, aggData);
        if (name === 'areas') return noopCollection(areaData);
        return noopCollection();
      }
    };

    const app = createApp(db);
    const res = await request(app).get('/api/v1/overview?issueDate=2024-12-30');
    expect(res.status).toBe(200);
    expect(res.body.issueDate).toBe('2024-12-30');
    expect(res.body.targetWeek).toBe('2025-01-06');
    expect(res.body.emergingHotspotsCount).toBe(4);
    expect(res.body.stableAreasCount).toBe(10);
    expect(res.body.withheldCount).toBe(1);
  });
});
