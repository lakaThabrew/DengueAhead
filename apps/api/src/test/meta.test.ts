import { describe, it, expect } from 'vitest';
import request from 'supertest';
import type { Collection, Document } from 'mongodb';
import { createApp } from '../app.js';
import type { DbClient } from '../repositories/mongo.js';

describe('GET /api/v1/meta', () => {
  it('API-06: returns latest issueDate, targetWeek, and active modelVersion (200 OK)', async () => {
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
                      issueDate: '2024-12-30',
                      targetWeek: '2025-01-06',
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
                  toArray: async () => [{ weekStart: '2024-12-23' }]
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
    expect(res.body.geographicLevel).toBe('district');
    expect(res.body.latestIssueDate).toBe('2024-12-30');
    expect(res.body.latestTargetWeek).toBe('2025-01-06');
    expect(res.body.activeModelVersion).toBe('dengueahead-hgb-v1');
    expect(res.body.sourceFreshnessStatus).toBe('CURRENT');
  });

  it('API-03: returns 503 DATABASE_UNAVAILABLE when database client is offline', async () => {
    const app = createApp(undefined);
    const res = await request(app).get('/api/v1/meta');

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });
});
