import { describe, it, expect } from 'vitest';
import request from 'supertest';
import type { Collection, Document } from 'mongodb';
import { createApp } from '../app.js';
import type { DbClient } from '../repositories/mongo.js';

// Fake DB returning seeded source snapshot documents
const seedDocs = [
  {
    sourceId: 'ndcu-weekly',
    sourceUrl: 'https://example.com/report.html',
    observedPeriod: '2024-W01',
    retrievedAt: '2024-01-10T00:00:00.000Z',
    sha256: 'a'.repeat(64),
    licenceStatus: 'PENDING_VERIFICATION',
    parserVersion: '1.0.0',
    status: 'SUCCESS',
    error: null
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
    }),
    sort: () => ({ toArray: async () => docs })
  }) as unknown as Collection<Document>;

const seededDb: DbClient = {
  ping: async () => ({ latencyMs: 1 }),
  close: async () => {},
  collection: makeCollection(seedDocs)
};

const emptyDb: DbClient = {
  ping: async () => ({ latencyMs: 1 }),
  close: async () => {},
  collection: makeCollection([])
};

const errorDb: DbClient = {
  ping: async () => ({ latencyMs: 1 }),
  close: async () => {},
  collection: () => {
    throw new Error('Simulated DB error');
  }
};

describe('GET /api/v1/sources — DATA-14', () => {
  it('returns 200 with data array and count when DB has documents', async () => {
    const app = createApp(seededDb);
    const res = await request(app).get('/api/v1/sources');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].sourceId).toBe('ndcu-weekly');
  });

  it('returns 200 with empty data array when no documents exist', async () => {
    const app = createApp(emptyDb);
    const res = await request(app).get('/api/v1/sources');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.count).toBe(0);
  });

  it('returns 503 when no DB is injected', async () => {
    const app = createApp(); // no db
    const res = await request(app).get('/api/v1/sources');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });

  it('returns 503 when DB throws on collection query', async () => {
    const app = createApp(errorDb);
    const res = await request(app).get('/api/v1/sources');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_ERROR');
  });
});

describe('GET /api/v1/areas — DATA-15', () => {
  const areaDocs = [
    {
      areaId: 'LK-11',
      name: 'Colombo',
      level: 'district',
      centroid: { latitude: 6.9, longitude: 79.8 }
    }
  ];

  const areasDb: DbClient = {
    ping: async () => ({ latencyMs: 1 }),
    close: async () => {},
    collection: makeCollection(areaDocs)
  };

  it('returns 200 with data array and count', async () => {
    const app = createApp(areasDb);
    const res = await request(app).get('/api/v1/areas');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].areaId).toBe('LK-11');
  });

  it('returns 503 when no DB is injected', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/areas');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });

  it('returns 200 with empty array when no areas exist', async () => {
    const app = createApp(emptyDb);
    const res = await request(app).get('/api/v1/areas');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
