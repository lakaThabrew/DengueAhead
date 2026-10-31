import { describe, it, expect } from 'vitest';
import request from 'supertest';
import type { Collection, Document } from 'mongodb';
import { createApp } from '../app.js';
import type { DbClient } from '../repositories/mongo.js';

describe('GET /api/v1/compare', () => {
  const areas = [
    { areaId: 'LK-11', name: 'Colombo', level: 'district' },
    { areaId: 'LK-12', name: 'Gampaha', level: 'district' },
    { areaId: 'LK-21', name: 'Kandy', level: 'district' }
  ];

  const predictions = [
    {
      areaId: 'LK-11',
      geographicLevel: 'district',
      issueDate: '2024-12-30',
      targetWeek: '2025-01-06',
      asOfDate: '2024-12-30',
      modelVersion: 'dengueahead-hgb-v1',
      status: 'EMERGING',
      confidenceStatus: 'CALIBRATED',
      pointForecast: 150.0,
      interval: null,
      riskProbability: 0.82,
      qualityFlags: [],
      sourceSnapshotIds: ['snap-1']
    },
    {
      areaId: 'LK-12',
      geographicLevel: 'district',
      issueDate: '2024-12-30',
      targetWeek: '2025-01-06',
      asOfDate: '2024-12-30',
      modelVersion: 'dengueahead-hgb-v1',
      status: 'STABLE',
      confidenceStatus: 'NOT_AVAILABLE',
      pointForecast: 45.0,
      interval: null,
      riskProbability: null,
      qualityFlags: [],
      sourceSnapshotIds: ['snap-1']
    }
  ];

  const mockDb: DbClient = {
    ping: async () => ({ latencyMs: 1 }),
    close: async () => {},
    collection: (name: string) => {
      if (name === 'areas') {
        return {
          find: (filter: { areaId?: { $in?: string[] } }) => ({
            toArray: async () => {
              const ids = filter.areaId?.$in || [];
              return areas.filter((a) => ids.includes(a.areaId));
            }
          })
        } as unknown as Collection<Document>;
      }
      if (name === 'predictions') {
        return {
          find: (filter: { areaId?: { $in?: string[] } }) => ({
            sort: () => ({
              limit: () => ({
                toArray: async () => predictions
              })
            }),
            toArray: async () => {
              const ids = filter.areaId?.$in || [];
              return predictions.filter((p) => ids.includes(p.areaId));
            }
          })
        } as unknown as Collection<Document>;
      }
      if (name === 'dengue_weekly') {
        return {
          find: () => ({
            sort: () => ({
              limit: () => ({
                toArray: async () => [
                  { areaId: 'LK-11', weekStart: '2024-12-23', cases: 120 },
                  { areaId: 'LK-12', weekStart: '2024-12-23', cases: 40 }
                ]
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

  it('returns 200 OK with side-by-side comparison for up to 3 areas', async () => {
    const app = createApp(mockDb);
    const res = await request(app).get('/api/v1/compare?areaIds=LK-11,LK-12');

    expect(res.status).toBe(200);
    expect(res.body.comparisons.length).toBe(2);
    expect(res.body.comparisons[0].area.areaId).toBe('LK-11');
    expect(res.body.comparisons[1].area.areaId).toBe('LK-12');
  });

  it('API-07: rejects request with more than 3 areas (400 TOO_MANY_AREAS)', async () => {
    const app = createApp(mockDb);
    const res = await request(app).get('/api/v1/compare?areaIds=LK-11,LK-12,LK-21,LK-31');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('TOO_MANY_AREAS');
  });

  it('returns 404 AREA_NOT_FOUND when one of the requested areas does not exist', async () => {
    const app = createApp(mockDb);
    const res = await request(app).get('/api/v1/compare?areaIds=LK-11,LK-99');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('AREA_NOT_FOUND');
  });

  it('returns 503 DATABASE_UNAVAILABLE when database is offline', async () => {
    const app = createApp(undefined);
    const res = await request(app).get('/api/v1/compare?areaIds=LK-11');

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });
});
