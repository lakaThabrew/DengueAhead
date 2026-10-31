import { describe, it, expect } from 'vitest';
import request from 'supertest';
import type { Collection, Document } from 'mongodb';
import { createApp } from '../app.js';
import type { DbClient } from '../repositories/mongo.js';

describe('Areas Router (/api/v1/areas)', () => {
  const colomboDoc = {
    areaId: 'LK-11',
    name: 'Colombo',
    level: 'district',
    parentAreaId: 'LK-1',
    centroid: [6.9271, 79.8612],
    population: 2326000,
    populationYear: 2021
  };

  const sampleSeries = [
    { areaId: 'LK-11', weekStart: '2024-06-17', weekEnd: '2024-06-23', cases: 100, qualityFlags: [] },
    { areaId: 'LK-11', weekStart: '2024-06-24', weekEnd: '2024-06-30', cases: 120, qualityFlags: [] }
  ];

  const samplePrediction = {
    areaId: 'LK-11',
    geographicLevel: 'district',
    issueDate: '2024-06-24',
    targetWeek: '2024-07-01',
    asOfDate: '2024-06-24',
    modelVersion: 'dengueahead-hgb-v1',
    status: 'EMERGING',
    confidenceStatus: 'CALIBRATED',
    pointForecast: 135.0,
    interval: { lower: 115.0, upper: 155.0, method: 'conformal', coverage: 0.8 },
    riskProbability: 0.78,
    qualityFlags: [],
    sourceSnapshotIds: ['snap-1']
  };

  const mockDb: DbClient = {
    ping: async () => ({ latencyMs: 1 }),
    close: async () => {},
    collection: (name: string) => {
      if (name === 'areas') {
        return {
          countDocuments: async () => 1,
          find: () => ({
            sort: () => ({
              skip: () => ({
                limit: () => ({
                  toArray: async () => [colomboDoc]
                })
              })
            })
          }),
          findOne: async (filter: { areaId?: string }) => {
            if (filter.areaId === 'LK-11') return colomboDoc;
            return null;
          }
        } as unknown as Collection<Document>;
      }
      if (name === 'dengue_weekly') {
        return {
          find: () => ({
            sort: () => ({
              limit: () => ({
                toArray: async () => sampleSeries
              })
            })
          })
        } as unknown as Collection<Document>;
      }
      if (name === 'predictions') {
        return {
          find: () => ({
            sort: () => ({
              limit: () => ({
                toArray: async () => [samplePrediction]
              })
            })
          }),
          findOne: async () => samplePrediction
        } as unknown as Collection<Document>;
      }
      if (name === 'feature_snapshots') {
        return {
          findOne: async () => ({
            features: { seasonal_historical_median: 95.0, cases_lag_1: 120, growth_1w: 0.2 }
          })
        } as unknown as Collection<Document>;
      }
      return {
        find: () => ({ toArray: async () => [] }),
        findOne: async () => null
      } as unknown as Collection<Document>;
    }
  };

  it('GET /areas returns paginated list of areas', async () => {
    const app = createApp(mockDb);
    const res = await request(app).get('/api/v1/areas');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].areaId).toBe('LK-11');
  });

  it('GET /areas/:areaId returns area profile for existing area', async () => {
    const app = createApp(mockDb);
    const res = await request(app).get('/api/v1/areas/LK-11');

    expect(res.status).toBe(200);
    expect(res.body.areaId).toBe('LK-11');
    expect(res.body.name).toBe('Colombo');
  });

  it('API-01: returns 404 AREA_NOT_FOUND when requesting nonexistent area', async () => {
    const app = createApp(mockDb);
    const res = await request(app).get('/api/v1/areas/LK-99');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('AREA_NOT_FOUND');
  });

  it('API-04: injection-shaped area ID is rejected with 404 format mismatch', async () => {
    const app = createApp(mockDb);
    const res = await request(app).get('/api/v1/areas/{"$gt":""}');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('AREA_NOT_FOUND');
  });

  it('GET /areas/:areaId/series returns historical weekly points', async () => {
    const app = createApp(mockDb);
    const res = await request(app).get('/api/v1/areas/LK-11/series');

    expect(res.status).toBe(200);
    expect(res.body.areaId).toBe('LK-11');
    expect(res.body.count).toBe(2);
    expect(res.body.data[0].cases).toBe(100);
  });

  it('GET /areas/:areaId/forecast returns prediction and non-causal disclaimer', async () => {
    const app = createApp(mockDb);
    const res = await request(app).get('/api/v1/areas/LK-11/forecast');

    expect(res.status).toBe(200);
    expect(res.body.areaId).toBe('LK-11');
    expect(res.body.prediction.pointForecast).toBe(135.0);
    expect(res.body.nonCausalDisclaimer).toContain('association');
  });
});
