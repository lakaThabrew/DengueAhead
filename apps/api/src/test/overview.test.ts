import { describe, it, expect } from 'vitest';
import request from 'supertest';
import type { Collection, Document } from 'mongodb';
import { createApp } from '../app.js';
import type { DbClient } from '../repositories/mongo.js';

describe('GET /api/v1/overview', () => {
  const samplePredictions = [
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
      interval: { lower: 130.0, upper: 170.0, method: 'conformal', coverage: 0.8 },
      riskProbability: 0.85,
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
      pointForecast: 30.0,
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
      if (name === 'predictions') {
        return {
          find: () => ({
            sort: () => ({
              limit: () => ({
                toArray: async () => samplePredictions
              })
            }),
            toArray: async () => samplePredictions
          })
        } as unknown as Collection<Document>;
      }
      if (name === 'areas') {
        return {
          find: () => ({
            toArray: async () => [{ areaId: 'LK-11', name: 'Colombo', level: 'district' }]
          })
        } as unknown as Collection<Document>;
      }
      return {
        find: () => ({ toArray: async () => [] })
      } as unknown as Collection<Document>;
    }
  };

  it('returns 200 OK with overview summary breakdown', async () => {
    const app = createApp(mockDb);
    const res = await request(app).get('/api/v1/overview?issueDate=2024-12-30');

    expect(res.status).toBe(200);
    expect(res.body.issueDate).toBe('2024-12-30');
    expect(res.body.targetWeek).toBe('2025-01-06');
    expect(res.body.monitoredAreasCount).toBe(2);
    expect(res.body.emergingHotspotsCount).toBe(1);
    expect(res.body.stableAreasCount).toBe(1);
    expect(res.body.topEmergingAreas.length).toBe(1);
    expect(res.body.topEmergingAreas[0].area.areaId).toBe('LK-11');
  });

  it('API-02: returns 400 when malformed issueDate format is provided', async () => {
    const app = createApp(mockDb);
    const res = await request(app).get('/api/v1/overview?issueDate=not-a-date');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_QUERY');
  });

  it('API-03: returns 503 DATABASE_UNAVAILABLE when database is offline', async () => {
    const app = createApp(undefined);
    const res = await request(app).get('/api/v1/overview');

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });
});
