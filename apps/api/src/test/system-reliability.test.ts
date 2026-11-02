import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import type { Collection, Document } from 'mongodb';
import { createApp } from '../app.js';
import { ensureIndexes, REQUIRED_INDEXES } from '../repositories/indexes.js';
import type { DbClient } from '../repositories/mongo.js';

describe('System Reliability & Index Suite (SYS-02, SYS-03, SYS-06)', () => {
  // ── SYS-06: MongoDB Index Coverage ──────────────────────────────────────────
  it('SYS-06: ensureIndexes creates all required compound and unique schema indexes', async () => {
    const createdIndices: string[] = [];

    const mockCollection = {
      createIndex: vi.fn().mockImplementation((spec: unknown, options: { name?: string }) => {
        const name = options?.name || 'idx';
        createdIndices.push(name);
        return Promise.resolve(name);
      })
    };

    const mockDb: DbClient = {
      ping: vi.fn().mockResolvedValue({ latencyMs: 5 }),
      close: vi.fn().mockResolvedValue(undefined),
      collection: vi.fn().mockReturnValue(mockCollection as unknown as Collection<Document>)
    };

    const result = await ensureIndexes(mockDb);

    expect(result.errors).toHaveLength(0);
    expect(result.created.length).toBe(REQUIRED_INDEXES.length);
    expect(mockCollection.createIndex).toHaveBeenCalledTimes(REQUIRED_INDEXES.length);
  });

  // ── SYS-02: Database 503 Failover ──────────────────────────────────────────
  it('SYS-02: When MongoDB is unreachable, Express returns RFC 7807 formatted 503 DATABASE_UNAVAILABLE', async () => {
    // App with no DB connection
    const app = createApp(undefined);

    const res = await request(app).get('/api/v1/overview');

    expect(res.status).toBe(503);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
    expect(res.body.error.message).toContain('database');
  });

  // ── Injection Resistance ───────────────────────────────────────────────────
  it('Reject MongoDB operator injection in areaId path parameter with AREA_NOT_FOUND', async () => {
    const mockDb: DbClient = {
      ping: vi.fn().mockResolvedValue({ latencyMs: 2 }),
      close: vi.fn().mockResolvedValue(undefined),
      collection: vi.fn().mockReturnValue({
        findOne: vi.fn().mockResolvedValue(null)
      } as unknown as Collection<Document>)
    };

    const app = createApp(mockDb);

    // Operator injection attempt
    const res = await request(app).get('/api/v1/areas/%24gt');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('AREA_NOT_FOUND');
  });

  // ── SYS-03: Stale Data Warning ─────────────────────────────────────────────
  it('SYS-03: Meta route reports CURRENT when observations are recent', async () => {
    // Use an observation date within the last 7 days
    const recentDate = new Date().toISOString().slice(0, 10);

    const mockDb: DbClient = {
      ping: async () => ({ latencyMs: 1 }),
      close: async () => {},
      collection: (name: string) => {
        if (name === 'predictions') {
          return {
            find: () => ({
              sort: () => ({
                limit: () => ({
                  toArray: async () => [
                    {
                      issueDate: recentDate,
                      targetWeek: recentDate,
                      modelVersion: 'dengueahead-hgb-v1'
                    }
                  ]
                })
              })
            })
          } as unknown as Collection<Document>;
        }
        if (name === 'dengue_weekly') {
          return {
            find: () => ({
              sort: () => ({
                limit: () => ({
                  toArray: async () => [{ weekStart: recentDate }]
                })
              })
            })
          } as unknown as Collection<Document>;
        }
        return {
          find: () => ({
            sort: () => ({
              limit: () => ({
                toArray: async () => []
              })
            })
          })
        } as unknown as Collection<Document>;
      }
    };

    const app = createApp(mockDb);

    const res = await request(app).get('/api/v1/meta');
    expect(res.status).toBe(200);
    expect(res.body.sourceFreshnessStatus).toBe('CURRENT');
  });
});
