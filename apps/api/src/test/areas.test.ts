import { describe, it, expect } from 'vitest';
import request from 'supertest';
import type { Collection, Document } from 'mongodb';
import { createApp } from '../app.js';
import type { DbClient } from '../repositories/mongo.js';

// Minimal valid Area doc
const AREA_DOC = {
  areaId: 'LK-11',
  name: 'Colombo',
  level: 'district',
  centroid: { latitude: 6.9271, longitude: 79.8612 }
};

// Minimal valid prediction doc (non-WITHHELD)
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
    findOne: async (filter: Record<string, unknown>) => {
      const d = data.find((item) => {
        const doc = item as Record<string, unknown>;
        return Object.entries(filter).every(([k, v]) => doc[k] === v);
      });
      return d ?? null;
    },
    countDocuments: async () => data.length,
    aggregate: () => ({ toArray: async () => [] })
  }) as unknown as Collection<Document>;

describe('GET /api/v1/areas', () => {
  it('returns 503 when no DB is provided', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/areas');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });

  it('returns area list with count and total', async () => {
    const db: DbClient = {
      ping: async () => ({ latencyMs: 1 }),
      close: async () => {},
      collection: () => makeCollection([AREA_DOC])
    };
    const app = createApp(db);
    const res = await request(app).get('/api/v1/areas');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('total');
  });
});

describe('GET /api/v1/areas/:areaId', () => {
  it('API-01: returns 404 for nonexistent areaId', async () => {
    const db: DbClient = {
      ping: async () => ({ latencyMs: 1 }),
      close: async () => {},
      collection: () => makeCollection([])
    };
    const app = createApp(db);
    const res = await request(app).get('/api/v1/areas/LK-99');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('AREA_NOT_FOUND');
  });

  it('API-04: rejects MongoDB operator injection in areaId path', async () => {
    const db: DbClient = {
      ping: async () => ({ latencyMs: 1 }),
      close: async () => {},
      collection: () => makeCollection([])
    };
    const app = createApp(db);
    // $gt injection attempt via malformed path — rejected by regex validation
    const res = await request(app).get('/api/v1/areas/%7B%24gt%3A%22%22%7D');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_AREA_ID');
  });

  it('returns 200 with area document when area exists', async () => {
    const db: DbClient = {
      ping: async () => ({ latencyMs: 1 }),
      close: async () => {},
      collection: () => makeCollection([AREA_DOC])
    };
    const app = createApp(db);
    const res = await request(app).get('/api/v1/areas/LK-11');
    expect(res.status).toBe(200);
    expect(res.body.areaId).toBe('LK-11');
    expect(res.body.name).toBe('Colombo');
  });

  it('returns 400 for invalid areaId format', async () => {
    const app = createApp({
      ping: async () => ({ latencyMs: 1 }),
      close: async () => {},
      collection: () => makeCollection()
    });
    const res = await request(app).get('/api/v1/areas/invalid-id');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_AREA_ID');
  });
});

describe('GET /api/v1/areas/:areaId/series', () => {
  it('returns series data for valid areaId', async () => {
    const seriesData = [
      {
        weekStart: '2024-06-17',
        weekEnd: '2024-06-23',
        cases: 112,
        reportedAt: null,
        qualityFlags: []
      }
    ];
    const db: DbClient = {
      ping: async () => ({ latencyMs: 1 }),
      close: async () => {},
      collection: () => makeCollection(seriesData)
    };
    const app = createApp(db);
    const res = await request(app).get('/api/v1/areas/LK-11/series');
    expect(res.status).toBe(200);
    expect(res.body.areaId).toBe('LK-11');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.count).toBe(1);
  });

  it('returns 400 for invalid from date', async () => {
    const app = createApp({
      ping: async () => ({ latencyMs: 1 }),
      close: async () => {},
      collection: () => makeCollection()
    });
    const res = await request(app).get('/api/v1/areas/LK-11/series?from=bad-date');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_QUERY');
  });
});

describe('GET /api/v1/areas/:areaId/forecast', () => {
  it('returns 404 when area does not exist', async () => {
    const db: DbClient = {
      ping: async () => ({ latencyMs: 1 }),
      close: async () => {},
      collection: () => makeCollection([])
    };
    const app = createApp(db);
    const res = await request(app).get('/api/v1/areas/LK-99/forecast');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('AREA_NOT_FOUND');
  });

  it('returns 404 when no forecast exists for area', async () => {
    const db: DbClient = {
      ping: async () => ({ latencyMs: 1 }),
      close: async () => {},
      collection: (name: string) => {
        if (name === 'areas') return makeCollection([AREA_DOC]);
        return makeCollection([]);
      }
    };
    const app = createApp(db);
    const res = await request(app).get('/api/v1/areas/LK-11/forecast');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('FORECAST_NOT_FOUND');
  });

  it('returns forecast envelope with prediction and disclaimer', async () => {
    const db: DbClient = {
      ping: async () => ({ latencyMs: 1 }),
      close: async () => {},
      collection: (name: string) => {
        if (name === 'areas') return makeCollection([AREA_DOC]);
        if (name === 'predictions') return makeCollection([PREDICTION_DOC]);
        return makeCollection([]);
      }
    };
    const app = createApp(db);
    const res = await request(app).get('/api/v1/areas/LK-11/forecast');
    expect(res.status).toBe(200);
    expect(res.body.areaId).toBe('LK-11');
    expect(res.body.areaName).toBe('Colombo');
    expect(res.body.prediction).toBeDefined();
    expect(res.body.nonCausalDisclaimer).toContain('statistical association');
  });
});
