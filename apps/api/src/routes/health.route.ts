import { Router, Request, Response } from 'express';
import type { DbClient } from '../repositories/mongo.js';
import type { HealthResponse, ReadinessResponse } from '@dengueahead/contracts';

export function createHealthRouter(db?: DbClient): Router {
  const router = Router();

  router.get('/health', (_req: Request, res: Response) => {
    const response: HealthResponse = {
      status: 'ok',
      apiVersion: '1.0.0',
      service: 'dengueahead-api',
      timestamp: new Date().toISOString()
    };
    res.json(response);
  });

  router.get('/readiness', async (_req: Request, res: Response) => {
    if (!db) {
      const response: ReadinessResponse = {
        status: 'error',
        timestamp: new Date().toISOString(),
        components: {
          database: { status: 'down', latencyMs: null }
        }
      };
      res.status(503).json(response);
      return;
    }

    try {
      const { latencyMs } = await db.ping();
      const response: ReadinessResponse = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        components: {
          database: { status: 'up', latencyMs }
        }
      };
      res.json(response);
    } catch {
      const response: ReadinessResponse = {
        status: 'error',
        timestamp: new Date().toISOString(),
        components: {
          database: { status: 'down', latencyMs: null }
        }
      };
      res.status(503).json(response);
    }
  });

  return router;
}
